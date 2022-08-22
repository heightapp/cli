import commandLine from 'helpers/commandLine';
import add from 'commands/repos/add';
import list from 'commands/repos/list';
import rm from 'commands/repos/rm';
import { CommandModule } from 'yargs';

type Command = CommandModule<object, object>

const handler: Command['handler'] = () => {
  commandLine.showHelp();
}

const command: Command = {
  command: 'repo',
  aliases: ['repos'],
  describe: 'Manage git repositories',
  builder: (argv) => {
    return argv
      .command(list)
      .command(add)
      .command(rm);
  },
  handler,
};

export default command;
