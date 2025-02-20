// @ts-strict-ignore
import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  ErrorBoundary,
  useErrorBoundary,
  type FallbackProps,
} from 'react-error-boundary';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';

import { styles } from '@actual-app/components/styles';
import { View } from '@actual-app/components/view';

import {
  addNotification,
  closeBudget,
  loadBudget,
  loadGlobalPrefs,
  signOut,
} from 'loot-core/client/actions';
import { setAppState, sync } from 'loot-core/client/app/appSlice';
import * as Platform from 'loot-core/client/platform';
import { SpreadsheetProvider } from 'loot-core/client/SpreadsheetProvider';
import { init as initConnection, send } from 'loot-core/platform/client/fetch';

import { handleGlobalEvents } from '../global-events';
import { useMetadataPref } from '../hooks/useMetadataPref';
import { setI18NextLanguage } from '../i18n';
import { installPolyfills } from '../polyfills';
import { useDispatch, useSelector, useStore } from '../redux';
import { hasHiddenScrollbars, ThemeStyle, useTheme } from '../style';
import { ExposeNavigate } from '../util/router-tools';

import { AppBackground } from './AppBackground';
import { BudgetMonthCountProvider } from './budget/BudgetMonthCountContext';
import { DevelopmentTopBar } from './DevelopmentTopBar';
import { FatalError } from './FatalError';
import { FinancesApp } from './FinancesApp';
import { ManagementApp } from './manager/ManagementApp';
import { Modals } from './Modals';
import { ResponsiveProvider } from './responsive/ResponsiveProvider';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { UpdateNotification } from './UpdateNotification';

function AppInner() {
  const [budgetId] = useMetadataPref('id');
  const [cloudFileId] = useMetadataPref('cloudFileId');
  const { t } = useTranslation();
  const { showBoundary: showErrorBoundary } = useErrorBoundary();
  const dispatch = useDispatch();
  const userData = useSelector(state => state.user.data);

  useEffect(() => {
    const maybeUpdate = async <T,>(cb?: () => T): Promise<T> => {
      if (global.Actual.isUpdateReadyForDownload()) {
        dispatch(
          setAppState({
            loadingText: t('Downloading and applying update...'),
          }),
        );
        await global.Actual.applyAppUpdate();
      }
      return cb?.();
    };

    async function init() {
      const socketName = await maybeUpdate(() =>
        global.Actual.getServerSocket(),
      );

      dispatch(
        setAppState({
          loadingText: t(
            'Initializing the connection to the local database...',
          ),
        }),
      );
      await initConnection(socketName);

      // Load any global prefs
      dispatch(
        setAppState({
          loadingText: t('Loading global preferences...'),
        }),
      );
      await dispatch(loadGlobalPrefs());

      // Open the last opened budget, if any
      dispatch(
        setAppState({
          loadingText: t('Opening last budget...'),
        }),
      );
      const budgetId = await send('get-last-opened-backup');
      if (budgetId) {
        await dispatch(loadBudget(budgetId));

        // Check to see if this file has been remotely deleted (but
        // don't block on this in case they are offline or something)
        dispatch(
          setAppState({
            loadingText: t('Retrieving remote files...'),
          }),
        );

        const files = await send('get-remote-files');
        if (files) {
          const remoteFile = files.find(f => f.fileId === cloudFileId);
          if (remoteFile && remoteFile.deleted) {
            dispatch(closeBudget());
          }
        }

        await maybeUpdate();
      }
    }

    async function initAll() {
      setI18NextLanguage('pt-BR');
      await Promise.all([installPolyfills(), init()]);
      dispatch(setAppState({ loadingText: null }));
    }

    initAll().catch(showErrorBoundary);
    // Removed cloudFileId from dependencies to prevent hard crash when closing budget in Electron
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, showErrorBoundary, t]);

  useEffect(() => {
    global.Actual.updateAppMenu(budgetId);
  }, [budgetId]);

  useEffect(() => {
    if (userData?.tokenExpired) {
      dispatch(
        addNotification({
          type: 'error',
          id: 'login-expired',
          title: t('Login expired'),
          sticky: true,
          message: t('Login expired, please log in again.'),
          button: {
            title: t('Go to log in'),
            action: () => dispatch(signOut(true)),
          },
        }),
      );
    }
  }, [dispatch, t, userData?.tokenExpired]);

  return budgetId ? <FinancesApp /> : <ManagementApp />;
}

function ErrorFallback({ error }: FallbackProps) {
  return (
    <>
      <AppBackground />
      <FatalError error={error} />
    </>
  );
}

export function App() {
  const store = useStore();

  useEffect(() => handleGlobalEvents(store), [store]);

  const [hiddenScrollbars, setHiddenScrollbars] = useState(
    hasHiddenScrollbars(),
  );
  const dispatch = useDispatch();

  useEffect(() => {
    function checkScrollbars() {
      if (hiddenScrollbars !== hasHiddenScrollbars()) {
        setHiddenScrollbars(hasHiddenScrollbars());
      }
    }

    let isSyncing = false;

    async function onVisibilityChange() {
      if (!isSyncing) {
        console.debug('triggering sync because of visibility change');
        isSyncing = true;
        await dispatch(sync());
        isSyncing = false;
      }
    }

    window.addEventListener('focus', checkScrollbars);
    window.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', checkScrollbars);
      window.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [dispatch, hiddenScrollbars]);

  const [theme] = useTheme();

  return (
    <BrowserRouter>
      <ExposeNavigate />
      <HotkeysProvider initiallyActiveScopes={['*']}>
        <ResponsiveProvider>
          <SpreadsheetProvider>
            <SidebarProvider>
              <BudgetMonthCountProvider>
                <DndProvider backend={HTML5Backend}>
                  <View
                    data-theme={theme}
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <View
                      key={
                        hiddenScrollbars ? 'hidden-scrollbars' : 'scrollbars'
                      }
                      style={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        ...styles.lightScrollbar,
                      }}
                    >
                      <ErrorBoundary FallbackComponent={ErrorFallback}>
                        {process.env.REACT_APP_REVIEW_ID &&
                          !Platform.isPlaywright && <DevelopmentTopBar />}
                        <AppInner />
                      </ErrorBoundary>
                      <ThemeStyle />
                      <Modals />
                      <UpdateNotification />
                    </View>
                  </View>
                </DndProvider>
              </BudgetMonthCountProvider>
            </SidebarProvider>
          </SpreadsheetProvider>
        </ResponsiveProvider>
      </HotkeysProvider>
    </BrowserRouter>
  );
}
