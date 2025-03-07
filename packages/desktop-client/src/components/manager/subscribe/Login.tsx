// @ts-strict-ignore
import React, { useState, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { Button, ButtonWithLoading } from '@actual-app/components/button';
import { Label } from '@actual-app/components/label';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { loggedIn } from 'loot-core/client/actions/user';
import { send } from 'loot-core/platform/client/fetch';
import { isElectron } from 'loot-core/shared/environment';
import { type OpenIdConfig } from 'loot-core/types/models/openid';

import { useNavigate } from '../../../hooks/useNavigate';
import { AnimatedLoading } from '../../../icons/AnimatedLoading';
import { useDispatch } from '../../../redux';
import { theme } from '../../../style';
import { BigInput } from '../../common/Input';
import { Link } from '../../common/Link';
import { Select } from '../../common/Select';
import { useResponsive } from '../../responsive/ResponsiveProvider';
import {
  useAutoLogin,
  useAvailableLoginMethods,
  useLoginMethod,
} from '../../ServerContext';

import { useBootstrapped, Title } from './common';
import { OpenIdForm } from './OpenIdForm';

function PasswordLogin({ setError, dispatch }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { isNarrowWidth } = useResponsive();

  async function onSubmitPassword() {
    if (password === '' || loading) {
      return;
    }

    setError(null);
    setLoading(true);
    const { error } = await send('subscribe-sign-in', {
      password,
      loginMethod: 'password',
    });
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      dispatch(loggedIn());
    }
  }

  return (
    <View
      style={{
        flexDirection: isNarrowWidth ? 'column' : 'row',
        marginTop: 5,
        gap: '1rem',
      }}
    >
      <BigInput
        autoFocus={true}
        placeholder={t('Password')}
        type="password"
        onChangeValue={newValue => setPassword(newValue)}
        style={{ flex: 1 }}
        onEnter={onSubmitPassword}
      />
      <ButtonWithLoading
        variant="primary"
        isLoading={loading}
        style={{ fontSize: 15, width: isNarrowWidth ? '100%' : 170 }}
        onPress={onSubmitPassword}
      >
        <Trans>Sign in</Trans>
      </ButtonWithLoading>
    </View>
  );
}

function OpenIdLogin({ setError }) {
  const [warnMasterCreation, setWarnMasterCreation] = useState(false);
  const [reviewOpenIdConfiguration, setReviewOpenIdConfiguration] =
    useState(false);
  const navigate = useNavigate();

  async function onSetOpenId(config: OpenIdConfig) {
    setError(null);
    const { error } = await send('subscribe-bootstrap', { openId: config });

    if (error) {
      setError(error);
    } else {
      navigate('/');
    }
  }

  useEffect(() => {
    send('owner-created').then(created => setWarnMasterCreation(!created));
  }, []);

  async function onSubmitOpenId() {
    callOpenIdRedirectURL().then(error => {
      if (error) {
        setError(error);
      }
    });
  }

  return (
    <View>
      {!reviewOpenIdConfiguration && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              style={{
                padding: 10,
                fontSize: 14,
                width: 170,
                marginTop: 5,
              }}
              onPress={onSubmitOpenId}
            >
              <Trans>Sign in with OpenID</Trans>
            </Button>
          </View>
          {warnMasterCreation && (
            <>
              <label style={{ color: theme.warningText, marginTop: 10 }}>
                <Trans>
                  The first user to login with OpenID will be the{' '}
                  <Text style={{ fontWeight: 'bold' }}>server owner</Text>. This
                  can&apos;t be changed using UI.
                </Trans>
              </label>
              <Button
                variant="bare"
                onPress={() => setReviewOpenIdConfiguration(true)}
                style={{ marginTop: 5 }}
              >
                <Trans>Review OpenID configuration</Trans>
              </Button>
            </>
          )}
        </>
      )}
      {reviewOpenIdConfiguration && (
        <OpenIdForm
          loadData={true}
          otherButtons={[
            <Button
              key="cancel"
              variant="bare"
              style={{ marginRight: 10 }}
              onPress={() => setReviewOpenIdConfiguration(false)}
            >
              <Trans>Cancel</Trans>
            </Button>,
          ]}
          onSetOpenId={async config => {
            onSetOpenId(config);
          }}
        />
      )}
    </View>
  );
}

function HeaderLogin({ error }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
      }}
    >
      {error ? (
        <Link
          variant="button"
          type="button"
          style={{ fontSize: 15 }}
          to={'/login/password?error=' + error}
        >
          <Trans>Log in with password</Trans>
        </Link>
      ) : (
        <span>
          <Trans>Checking Header Token Login ...</Trans>{' '}
          <AnimatedLoading style={{ width: 20, height: 20 }} />
        </span>
      )}
    </View>
  );
}

async function callOpenIdRedirectURL() {
  const { error, redirect_url } = await send('subscribe-sign-in', {
    return_url: isElectron()
      ? await window.Actual.startOAuthServer()
      : window.location.origin,
    loginMethod: 'openid',
  });

  if (!error) {
    if (isElectron()) {
      window.Actual?.openURLInBrowser(redirect_url);
    } else {
      window.location.href = redirect_url;
    }

    return '';
  } else {
    return error;
  }
}

export function Login() {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const defaultLoginMethod = useLoginMethod();
  const [method, setMethod] = useState(defaultLoginMethod);
  const [searchParams, _setSearchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const { checked } = useBootstrapped();
  const loginMethods = useAvailableLoginMethods();
  const autoLogin = useAutoLogin();
  const [masterCreated, setMasterCreated] = useState(false);

  useEffect(() => {
    if (loginMethods.some(method => method.method === 'openid')) {
      send('owner-created').then(created => setMasterCreated(created));
    }
  }, [loginMethods]);

  useEffect(() => {
    if (checked && !searchParams.has('error')) {
      (async () => {
        if (method === 'header') {
          setError(null);
          const { error } = await send('subscribe-sign-in', {
            password: '',
            loginMethod: method,
          });

          if (error) {
            setError(error);
          } else {
            dispatch(loggedIn());
          }
        }
      })();
    }
  }, [loginMethods, checked, searchParams, method, dispatch]);

  useEffect(() => {
    if (
      checked &&
      autoLogin &&
      loginMethods.some(method => method.method === 'openid') &&
      masterCreated
    ) {
      callOpenIdRedirectURL();
    }
  }, [checked, autoLogin, loginMethods, masterCreated]);

  function getErrorMessage(error) {
    switch (error) {
      case 'invalid-header':
        return t('Auto login failed - No header sent');
      case 'proxy-not-trusted':
        return t('Auto login failed - Proxy not trusted');
      case 'invalid-password':
        return t('Invalid password');
      case 'network-failure':
        return t('Unable to contact the server');
      case 'internal-error':
        return t('Internal error');
      default:
        return t(`An unknown error occurred: {{error}}`, { error });
    }
  }

  if (!checked) {
    return null;
  }

  return autoLogin &&
    masterCreated &&
    loginMethods.some(method => method.method === 'openid') ? (
    <div />
  ) : (
    <View style={{ maxWidth: 450, marginTop: -30, color: theme.pageText }}>
      <Title text={t('Sign in to this Actual instance')} />

      {loginMethods?.length > 1 && (
        <Text
          style={{
            fontSize: 16,
            color: theme.pageTextDark,
            lineHeight: 1.4,
            marginBottom: 10,
          }}
        >
          <Trans>
            If you lost your password, you likely still have access to your
            server to manually reset it.
          </Trans>
        </Text>
      )}

      {loginMethods?.length > 1 && (
        <View style={{ marginTop: 10 }}>
          <Label
            style={{
              ...styles.verySmallText,
              color: theme.pageTextLight,
              paddingTop: 5,
            }}
            title={t('Select the login method')}
          />
          <Select
            value={method}
            onChange={newValue => {
              setError(null);
              setMethod(newValue);
            }}
            options={loginMethods?.map(m => [m.method, m.displayName])}
          />
        </View>
      )}

      {error && (
        <Text
          style={{
            marginTop: 20,
            color: theme.errorText,
            borderRadius: 4,
            fontSize: 15,
          }}
        >
          {getErrorMessage(error)}
        </Text>
      )}

      {method === 'password' && (
        <PasswordLogin setError={setError} dispatch={dispatch} />
      )}

      {method === 'openid' && <OpenIdLogin setError={setError} />}

      {method === 'header' && <HeaderLogin error={error} />}
    </View>
  );
}
