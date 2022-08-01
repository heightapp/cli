import auth from 'commands/auth';
import env from 'env';
import https from 'https';
import repos from 'commands/repos';
import commandLine from 'helpers/commandLine';
import ClientError from 'client/helpers/clientError';
import output from 'helpers/output';
import watch from 'commands/watch';

// Allow self-signed certs in dev
if (!env.prod) {
  https.globalAgent.options.rejectUnauthorized = false;
}

commandLine
  .scriptName('height')
  .command(auth)
  .command(repos)
  .command(watch)
  .recommendCommands()
  .demandCommand(1)
  .fail((message, error, yargs) => {
    if (message?.startsWith('Not enough non-option arguments')) {
      return yargs.showHelp();
    }

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
