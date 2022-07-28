import auth from 'commands/auth';
import env from 'env';
import https from 'https';
import repos from 'commands/repos';
import commandLine from 'commandLine';

// Allow self-signed certs in dev
if (!env.prod) {
  https.globalAgent.options.rejectUnauthorized = false;
}

commandLine
  .scriptName('height')
  .command(auth)
  .command(repos)
  .recommendCommands()
  .demandCommand(1)
  .help().argv;
