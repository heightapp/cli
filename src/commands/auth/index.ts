import commandLine from 'helpers/commandLine';
import login from 'commands/auth/login';
import logout from 'commands/auth/logout';
import yargs from 'yargs';

export default {
  command: 'auth',
  describe: 'Manage oauth credentials',
  builder: (auth: typeof yargs) => {
    return auth
      .command('login', 'Authenticate a user with Height', {}, async () => {
        await login();
      })
      .command('logout', 'Log out the authenticated user', {}, async () => {
        await logout();
      });
  },
  handler: () => {
    commandLine.showHelp();
  },
};
