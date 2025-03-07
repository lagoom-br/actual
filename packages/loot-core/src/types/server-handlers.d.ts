import { ImportTransactionsOpts } from '@actual-app/api';

import { Backup } from '../server/backups';
import { RemoteFile } from '../server/cloud-storage';
import { Node as SpreadsheetNode } from '../server/spreadsheet/spreadsheet';
import { Message } from '../server/sync';

import { Budget } from './budget';
import {
  AccountEntity,
  CategoryEntity,
  CategoryGroupEntity,
  GoCardlessToken,
  GoCardlessInstitution,
  SimpleFinAccount,
  RuleEntity,
  PayeeEntity,
} from './models';
import { OpenIdConfig } from './models/openid';
import { GlobalPrefs, MetadataPrefs } from './prefs';
// eslint-disable-next-line import/no-unresolved
import { Query } from './query';
import { EmptyObject } from './util';

export interface ServerHandlers {
  undo: () => Promise<void>;
  redo: () => Promise<void>;

  'get-categories': () => Promise<{
    grouped: Array<CategoryGroupEntity>;
    list: Array<CategoryEntity>;
  }>;

  'get-earliest-transaction': () => Promise<{ date: string }>;

  'get-budget-bounds': () => Promise<{ start: string; end: string }>;

  'envelope-budget-month': (arg: { month }) => Promise<
    {
      value: string | number | boolean;
      name: string;
    }[]
  >;

  'tracking-budget-month': (arg: { month }) => Promise<
    {
      value: string | number | boolean;
      name: string;
    }[]
  >;

  'category-create': (arg: {
    name;
    groupId;
    isIncome?;
    hidden?: boolean;
  }) => Promise<string>;

  'category-update': (category) => Promise<unknown>;

  'category-move': (arg: { id; groupId; targetId }) => Promise<unknown>;

  'category-delete': (arg: { id; transferId? }) => Promise<{ error?: string }>;

  'category-group-create': (arg: {
    name;
    isIncome?: boolean;
    hidden?: boolean;
  }) => Promise<string>;

  'category-group-update': (group) => Promise<unknown>;

  'category-group-move': (arg: { id; targetId }) => Promise<unknown>;

  'category-group-delete': (arg: { id; transferId }) => Promise<unknown>;

  'must-category-transfer': (arg: { id }) => Promise<unknown>;

  'payee-create': (arg: { name }) => Promise<string>;

  'common-payees-get': () => Promise<PayeeEntity[]>;

  'payees-get': () => Promise<PayeeEntity[]>;

  'payees-get-rule-counts': () => Promise<Record<PayeeEntity['id'], number>>;

  'payees-merge': (arg: { targetId; mergeIds }) => Promise<void>;

  'payees-batch-change': (arg: {
    added?;
    deleted?;
    updated?;
  }) => Promise<unknown>;

  'payees-check-orphaned': (arg: { ids }) => Promise<unknown>;
  'payees-get-orphaned': () => Promise<PayeeEntity[]>;

  'payees-get-rules': (arg: { id: string }) => Promise<RuleEntity[]>;

  'make-filters-from-conditions': (arg: {
    conditions: unknown;
    applySpecialCases?: boolean;
  }) => Promise<{ filters: unknown[] }>;

  getCell: (arg: {
    sheetName;
    name;
  }) => Promise<SpreadsheetNode | { value?: SpreadsheetNode['value'] }>;

  getCells: (arg: { names }) => Promise<unknown>;

  getCellNamesInSheet: (arg: { sheetName }) => Promise<unknown>;

  debugCell: (arg: { sheetName; name }) => Promise<unknown>;

  'create-query': (arg: { sheetName; name; query }) => Promise<unknown>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: (query: Query) => Promise<{ data: any; dependencies: string[] }>;

  'account-update': (arg: { id; name }) => Promise<unknown>;

  'accounts-get': () => Promise<AccountEntity[]>;

  'account-properties': (arg: {
    id;
  }) => Promise<{ balance: number; numTransactions: number }>;

  'gocardless-accounts-link': (arg: {
    requisitionId;
    account;
    upgradingId;
    offBudget;
  }) => Promise<'ok'>;

  'simplefin-accounts-link': (arg: {
    externalAccount;
    upgradingId;
    offBudget;
  }) => Promise<'ok'>;

  'account-create': (arg: {
    name: string;
    balance?: number;
    offBudget?: boolean;
    closed?: 0 | 1;
  }) => Promise<string>;

  'account-close': (arg: {
    id;
    transferAccountId?;
    categoryId?;
    forced?;
  }) => Promise<unknown>;

  'account-reopen': (arg: { id }) => Promise<unknown>;

  'account-move': (arg: { id; targetId }) => Promise<unknown>;

  'secret-set': (arg: {
    name: string;
    value: string | null;
  }) => Promise<{ error?: string; reason?: string }>;
  'secret-check': (arg: string) => Promise<string | { error?: string }>;

  'gocardless-poll-web-token': (arg: {
    upgradingAccountId?: string | undefined;
    requisitionId: string;
  }) => Promise<
    { error: 'unknown' } | { error: 'timeout' } | { data: GoCardlessToken }
  >;

  'gocardless-status': () => Promise<{ configured: boolean }>;

  'simplefin-status': () => Promise<{ configured: boolean }>;

  'simplefin-accounts': () => Promise<{
    accounts?: SimpleFinAccount[];
    error_code?: string;
    reason?: string;
  }>;

  'simplefin-batch-sync': ({ ids }: { ids: string[] }) => Promise<
    {
      accountId: string;
      res: {
        errors;
        newTransactions;
        matchedTransactions;
        updatedAccounts;
      };
    }[]
  >;

  'gocardless-get-banks': (country: string) => Promise<{
    data: GoCardlessInstitution[];
    error?: { reason: string };
  }>;

  'gocardless-poll-web-token-stop': () => Promise<'ok'>;

  'gocardless-create-web-token': (arg: {
    upgradingAccountId?: string | undefined;
    institutionId: string;
    accessValidForDays: number;
  }) => Promise<
    | {
        requisitionId: string;
        link: string;
      }
    | { error: 'unauthorized' }
    | { error: 'failed' }
  >;

  'accounts-bank-sync': (arg: { ids?: AccountEntity['id'][] }) => Promise<{
    errors;
    newTransactions;
    matchedTransactions;
    updatedAccounts;
  }>;

  'transactions-import': (arg: {
    accountId;
    transactions;
    isPreview;
    opts?: ImportTransactionsOpts;
  }) => Promise<{
    errors?: { message: string }[];
    added;
    updated;
    updatedPreview;
  }>;

  'account-unlink': (arg: { id }) => Promise<'ok'>;

  'save-global-prefs': (prefs) => Promise<'ok'>;

  'load-global-prefs': () => Promise<GlobalPrefs>;

  'save-prefs': (prefsToSet) => Promise<'ok'>;

  'load-prefs': () => Promise<MetadataPrefs | null>;

  'sync-reset': () => Promise<{ error?: { reason: string; meta?: unknown } }>;

  'sync-repair': () => Promise<unknown>;

  'key-make': (arg: {
    password;
  }) => Promise<{ error?: { reason: string; meta?: unknown } }>;

  'key-test': (arg: {
    fileId;
    password;
  }) => Promise<{ error?: { reason: string } }>;

  'get-did-bootstrap': () => Promise<boolean>;

  'subscribe-needs-bootstrap': (args: { url }) => Promise<
    | { error: string }
    | {
        bootstrapped: boolean;
        hasServer: false;
      }
    | {
        bootstrapped: boolean;
        hasServer: true;
        availableLoginMethods: {
          method: string;
          displayName: string;
          active: boolean;
        }[];
        multiuser: boolean;
        autoLogin: boolean;
      }
  >;

  'subscribe-get-login-methods': () => Promise<{
    methods?: { method: string; displayName: string; active: boolean }[];
    error?: string;
  }>;

  'subscribe-bootstrap': (arg: {
    password?: string;
    openId?: OpenIdConfig;
  }) => Promise<{ error?: string }>;

  'subscribe-get-user': () => Promise<{
    offline: boolean;
    userName?: string;
    userId?: string;
    displayName?: string;
    permission?: string;
    loginMethod?: string;
    tokenExpired?: boolean;
  } | null>;

  'subscribe-change-password': (arg: {
    password;
  }) => Promise<{ error?: string }>;

  'subscribe-sign-in': (
    arg:
      | {
          password;
          loginMethod?: string;
        }
      | {
          return_url;
          loginMethod?: 'openid';
        },
  ) => Promise<{ error?: string; redirect_url?: string }>;

  'subscribe-sign-out': () => Promise<'ok'>;

  'subscribe-logout-openid': (arg: {
    returnUrl: string;
  }) => Promise<{ error?: string; redirect_url?: string }>;

  'subscribe-set-token': (arg: { token: string }) => Promise<void>;

  'get-server-version': () => Promise<{ error?: string } | { version: string }>;

  'get-server-url': () => Promise<string | null>;

  'set-server-url': (arg: {
    url: string;
    validate?: boolean;
  }) => Promise<{ error?: string }>;

  sync: () => Promise<
    | { error: { message: string; reason: string; meta: unknown } }
    | { messages: Message[] }
  >;

  'validate-budget-name': (arg: {
    name: string;
  }) => Promise<{ valid: boolean; message?: string }>;

  'unique-budget-name': (arg: { name: string }) => Promise<string>;

  'get-budgets': () => Promise<Budget[]>;

  'get-remote-files': () => Promise<RemoteFile[]>;

  'get-user-file-info': (fileId: string) => Promise<RemoteFile | null>;

  'reset-budget-cache': () => Promise<unknown>;

  'upload-budget': (arg: { id }) => Promise<{ error?: string }>;

  'download-budget': (arg: { fileId; replace? }) => Promise<{ error; id }>;

  'sync-budget': () => Promise<{
    error?: { message: string; reason: string; meta: unknown };
  }>;

  'load-budget': (arg: { id: string }) => Promise<{ error }>;

  'create-demo-budget': () => Promise<unknown>;

  'close-budget': () => Promise<'ok'>;

  'delete-budget': (arg: {
    id?: string | undefined;
    cloudFileId?: string | undefined;
  }) => Promise<'ok' | 'fail'>;

  /**
   * Duplicates a budget file.
   * @param {Object} arg - The arguments for duplicating a budget.
   * @param {string} [arg.id] - The ID of the local budget to duplicate.
   * @param {string} [arg.cloudId] - The ID of the cloud-synced budget to duplicate.
   * @param {string} arg.newName - The name for the duplicated budget.
   * @param {boolean} [arg.cloudSync] - Whether to sync the duplicated budget to the cloud.
   * @returns {Promise<string>} The ID of the newly created budget.
   */
  'duplicate-budget': (arg: {
    id?: string | undefined;
    cloudId?: string | undefined;
    newName: string;
    cloudSync?: boolean;
    open: 'none' | 'original' | 'copy';
  }) => Promise<string>;

  'create-budget': (arg: {
    budgetName?;
    avoidUpload?;
    testMode?: boolean;
    testBudgetId?;
  }) => Promise<unknown>;

  'import-budget': (arg: {
    filepath: string;
    type: 'ynab4' | 'ynab5' | 'actual';
  }) => Promise<{ error?: string }>;

  'export-budget': () => Promise<{ data: Buffer } | { error: string }>;

  'upload-file-web': (arg: {
    filename: string;
    contents: ArrayBuffer;
  }) => Promise<EmptyObject | null>;

  'backups-get': (arg: { id: string }) => Promise<Backup[]>;

  'backup-load': (arg: { id: string; backupId: string }) => Promise<void>;

  'backup-make': (arg: { id: string }) => Promise<void>;

  'get-last-opened-backup': () => Promise<string | null>;

  'app-focused': () => Promise<void>;

  'enable-openid': (arg: {
    openId?: OpenIdConfig;
  }) => Promise<{ error?: string }>;

  'enable-password': (arg: { password: string }) => Promise<{ error?: string }>;

  'get-openid-config': () => Promise<
    | {
        openId: OpenIdConfig;
      }
    | { error: string }
    | null
  >;
}
