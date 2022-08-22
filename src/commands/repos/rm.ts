import config from 'helpers/config';
import inquirer from 'inquirer';
import output from 'helpers/output';
import yargs, { CommandModule } from 'yargs';
import { restartWatchIfRunning } from 'commands/watch';

type Command = CommandModule<object, {
  path?: string
}>

const handler: Command['handler'] = async (args) => {
  // Get repositories from config
  const repositories = await config.get('repositories');
  if (!repositories?.length) {
    output('No tracked repository.');
    return;
  }

  // Request user which repository to remove if there's no path in the args
  const inputPath = await(async () => {
    if (args.path) {
      return args.path;
    }
    
    const result = await inquirer.prompt([
      {
        type: 'list',
        name: 'path',
        message: 'Which repository to do you want to stop tracking?',
        choices: repositories.map((repo) => {
          return {value: repo.path, name: repo.path};
        }),
      },
    ]);

    return result.path;
  })();

  // Save new repositories
  const newRepositories = repositories.filter((repo) => repo.path !== inputPath);
  if (newRepositories.length === repositories.length) {
    output(`'${inputPath}' was not tracked.`);  
    return;
  }
  
  await config.set('repositories', newRepositories);

  // Restart watch service if it's running to stop take into account old repos
  await restartWatchIfRunning();

  // Log message
  output(`'${inputPath}' is not tracked anymore.`);
};

const command: Command = {
  command: 'rm [path]',
  describe: 'Stop tracking repository',
  builder: (rm: typeof yargs) => {
    return rm
      .positional('path', {
        type: 'string',
        description: 'Path to git repository',
      })
  },
  handler,
};

export default command;
