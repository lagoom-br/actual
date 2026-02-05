import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { theme as themeStyle } from '@actual-app/components/theme';
import { tokens } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { type Theme } from 'loot-core/types/prefs';

import { Column, Setting } from './UI';

import { useSidebar } from '@desktop-client/components/sidebar/SidebarProvider';
import { themeOptions, useTheme } from '@desktop-client/style';

const SUPPORTED_THEMES = ['light', 'dark'] as const;
type SupportedTheme = (typeof SUPPORTED_THEMES)[number];

function isSupportedTheme(theme: string): theme is SupportedTheme {
  return SUPPORTED_THEMES.includes(theme as SupportedTheme);
}

export function ThemeSettings() {
  const { t } = useTranslation();
  const sidebar = useSidebar();
  const [theme, switchTheme] = useTheme();

  // Migrate legacy theme values (auto, midnight, development, custom) to light
  useEffect(() => {
    if (!isSupportedTheme(theme)) {
      switchTheme('light');
    }
  }, [theme, switchTheme]);

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
              value={isSupportedTheme(theme) ? theme : 'light'}
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
