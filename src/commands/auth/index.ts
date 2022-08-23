import login from 'commands/auth/login';
import logout from 'commands/auth/logout';
import commandLine from 'helpers/commandLine';
import {CommandModule} from 'yargs';

type Command = CommandModule<object, object>

const handler: Command['handler'] = () => {
  commandLine.showHelp();
};

const command: Command = {
  command: 'auth',
  describe: 'Manage authentication',
  builder: (argv) => {
    return argv
      .command(login)
      .command(logout);
  },
  handler,
};

export default command;
