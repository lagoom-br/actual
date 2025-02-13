import React, { useEffect, type ReactNode } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { Menu } from '@actual-app/components/menu';
import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { theme as themeStyle } from '@actual-app/components/theme';
import { tokens } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

// import { type DarkTheme, type Theme } from 'loot-core/types/prefs';
import { type Theme } from 'loot-core/types/prefs';

import { ThemeInstaller } from './ThemeInstaller';
import { Column, Setting } from './UI';

import { useSidebar } from '@desktop-client/components/sidebar/SidebarProvider';
import { useFeatureFlag } from '@desktop-client/hooks/useFeatureFlag';
import { useGlobalPref } from '@desktop-client/hooks/useGlobalPref';
import {
  darkThemeOptions,
  themeOptions,
  useTheme,
  // usePreferredDarkTheme,
  // darkThemeOptions,
} from '@desktop-client/style';
import {
  parseInstalledTheme,
  serializeInstalledTheme,
  type InstalledTheme,
} from '@desktop-client/style/customThemes';

const INSTALL_NEW_VALUE = '__install_new__';

export function ThemeSettings() {
  const { t } = useTranslation();
  const sidebar = useSidebar();
  const [theme, switchTheme] = useTheme();

  //forcing theme to light if auto
  useEffect(() => {
    if (theme === 'auto') {
      switchTheme('light');
    }
  }, [theme, switchTheme]);
  // const [darkTheme, switchDarkTheme] = usePreferredDarkTheme();

  return (
    <Setting
      primaryAction={
        <View
          style={{
            flexDirection: 'column',
            gap: '1em',
            width: '100%',
            [`@media (min-width: ${
              sidebar.floating
                ? tokens.breakpoint_small
                : tokens.breakpoint_medium
            })`]: {
              flexDirection: 'row',
            },
          }}
        >
          <Column title={t('Theme')}>
            <Select<Theme>
              onChange={value => {
                switchTheme(value);
              }}
              value={theme}
              options={themeOptions}
              className={css({
                '&[data-hovered]': {
                  backgroundColor: themeStyle.buttonNormalBackgroundHover,
                },
              })}
            />
          </Column>
          {/* {theme === 'auto' && (
            <Column title={t('Dark theme')}>
              <Select<DarkTheme>
                onChange={value => {
                  switchDarkTheme(value);
                }}
                value={darkTheme}
                options={darkThemeOptions}
                className={css({
                  '&[data-hovered]': {
                    backgroundColor: themeStyle.buttonNormalBackgroundHover,
                  },
                })}
              />
            </Column>
          )} */}
        </View>
      }
    >
      <Text>
        <Trans>
          <strong>Themes</strong> change the user interface colors.
        </Trans>
      </Text>
    </Setting>
  );
}
