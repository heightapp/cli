#! /usr/bin/env node

import 'commonImports';
import getDefaultListIds from 'clientHelpers/getDefaultListIds';
import colors from 'colors/safe.js';
import {watch} from 'commands/watch';
import config from 'helpers/config';
import keychain from 'helpers/keychain';
import logger from 'helpers/logger';
import platform, {Platform} from 'helpers/platform';
import sharedClient from 'helpers/sharedClient';
import switchImpossibleCase from 'helpers/switchImpossibleCase';

switch (platform) {
  case Platform.Linux:
  case Platform.Mac: {
    // Force using colors for the service (since colors marks services not available for colors though we output to a log file)
    colors.enable();
    break;
  }
  case Platform.Windows:
  case Platform.Other: {
    break;
  }
  default: {
    switchImpossibleCase(platform);
  }
}

// Verify we have credentials
const credentials = await keychain.getCredentials();
if (!credentials) {
  logger.error('You need to be logged in to use watch');
  process.exit(1);
}

// Refresh default listIds
const defaultListIds = await getDefaultListIds(sharedClient);
await config.set('defaultListIds', defaultListIds);

// Verify we have repositories
const {repositories} = await config.getAll();
if (!repositories?.length) {
  logger.error('Could not find repositories in config');
  process.exit(1);
}

watch({repositories, userId: credentials.user.id, listIds: defaultListIds});
