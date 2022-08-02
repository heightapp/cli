#! /usr/bin/env node

import auth from 'commands/auth';
import env from 'env';
import https from 'https';
import repos from 'commands/repos';
import commandLine from 'helpers/commandLine';
import ClientError from 'client/helpers/clientError';
import output from 'helpers/output';
import watch from 'commands/watch';
import logger from 'helpers/logger';

// Allow self-signed certs in dev
if (!env.prod) {
  logger.info('Running in dev mode, allowing self-signed certs');
  https.globalAgent.options.rejectUnauthorized = false;
}

commandLine
  .scriptName('height')
  .middleware((args) => {
    if (args._.length === 0) {
      return;
    }

    const command = Object.keys(args).reduce((acc, key) => {
      if (key === '_' || key === '$0') {
        return acc;
      }

      const option = `${key}=${args[key] as string}`;
      return `${acc} ${option}`
    }, args._.join(' '));
    
    logger.info(`Executing command '${command}'`);
  })
  .command(auth)
  .command(repos)
  .command(watch)
  .recommendCommands()
  .demandCommand(1)
  .fail((message, error, yargs) => {
    if (message?.startsWith('Not enough non-option arguments')) {
      return yargs.showHelp();
    }

    logger.error(error.message ?? message);

    if (!env.prod) {
      throw error;
    }

    if (message) {
      output(message);
    } else if (error instanceof ClientError) {
      output(error.toString());
    } else {
      output(`An unexpected error occurred: ${error.message}`);
    }
    process.exit(1);
  })
  .help().argv;
