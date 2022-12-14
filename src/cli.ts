#! /usr/bin/env node

import 'commonImports';
import {ClientError} from '@heightapp/client';
import auth from 'commands/auth';
import help from 'commands/help';
import logs from 'commands/logs';
import repos from 'commands/repos';
import watch from 'commands/watch';
import env from 'env';
import commandLine from 'helpers/commandLine';
import {SCRIPT_NAME} from 'helpers/constants';
import logger from 'helpers/logger';
import output from 'helpers/output';

// Logs commands
const loggerMiddleware: Parameters<typeof commandLine['middleware']>[0] = (args) => {
  if (args._.length === 0) {
    return;
  }

  const command = Object.keys(args).reduce((acc, key) => {
    if (key === '_' || key === '$0') {
      return acc;
    }

    const option = `${key}=${args[key] as string}`;
    return `${acc} ${option}`;
  }, args._.join(' '));

  logger.info(`Executing command '${command}'`);
};

// Handles failures
// eslint-disable-next-line consistent-return
const failMiddleware: Parameters<typeof commandLine['fail']>[0] = (message, error, yargs) => {
  if (message?.startsWith('Not enough non-option arguments')) {
    return yargs.showHelp();
  }

  logger.error(error?.message ?? message);

  if (env.nodeEnv !== 'production' && env.debug) {
    throw error ?? new Error(message ?? 'Unknown error');
  }

  if (message) {
    output(message);
  } else if (error instanceof ClientError) {
    output(error.toString());
  } else {
    output(`An unexpected error occurred: ${error.message}.`);
  }

  process.exit(1);
};

await commandLine
  .scriptName(SCRIPT_NAME)
  .middleware(loggerMiddleware)
  .command(watch)
  .command(auth)
  .command(repos)
  .command(logs)
  .command(help)
  .recommendCommands()
  .demandCommand(1)
  .fail(failMiddleware)
  .help().argv;
