import {restartWatchIfRunning} from 'commands/watch';
import config from 'helpers/config';
import output from 'helpers/output';
import inquirer from 'inquirer';
import {CommandModule} from 'yargs';

import os from 'os';
import path from 'path';

type Command = CommandModule<object, {
  path?: string,
}>

const handler: Command['handler'] = async (args) => {
  // Ask for path to repository
  const inputPath = await ((async () => {
    if (args.path) {
      return args.path;
    }

    const result = await inquirer.prompt({
      type: 'input',
      name: 'path',
      message: 'Enter the path of the git repository you want to watch:',
      default: './',
    });

    return result.path as string;
  }))();

  // Cleanup path
  const pathToAdd = path.resolve(inputPath.replace(/^~/, os.homedir())).trim();

  // Add repository to config
  let repositories = (await config.get('repositories')) ?? [];
  repositories = repositories.filter((repo) => repo.path !== pathToAdd);
  repositories.push({
    path: pathToAdd,
  });
  await config.set('repositories', repositories);

  // Restart watch service if it's running to take into account new repos
  await restartWatchIfRunning();

  // Log message
  output(`'${pathToAdd}' is now tracked.`);
};

const command: Command = {
  command: 'add [path]',
  describe: 'Start tracking repository',
  builder: (argv) => {
    return argv
      .positional('path', {
        type: 'string',
        description: 'Path to git repository',
      });
  },
  handler,
};

export default command;
