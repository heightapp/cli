import commandLine from 'commandLine';
import add from 'commands/repos/add';
import list from 'commands/repos/list';
import rm from 'commands/repos/rm';
import yargs from 'yargs';

export default {
  command: 'repos',
  describe: 'Track Git repositories',
  builder: async (repos: typeof yargs) => {
    return repos
      .command('list', 'List tracked repositories', {}, list)
      .command('add', 'Start tracking repository', {}, add)
      .command('rm', 'Stop tracking repository ', {}, rm);
  },
  handler: () => {
    commandLine.showHelp();
  },
};
