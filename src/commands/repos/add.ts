import os from 'os';
import path from 'path';
import inquirer from 'inquirer';
import config from 'helpers/config';
import output from 'helpers/output';

const add = async () => {
  // Ask for path to repository
  const repoToAdd = await inquirer.prompt({
    type: 'input',
    name: 'path',
    message: 'Enter the path of the Git repository you want to watch:',
  });

  // Cleanup path
  const pathToAdd = path.resolve((repoToAdd.path as string).replace(/^~/, os.homedir())).trim();

  // Add repository to config
  let repositories = (await config.get('repositories')) ?? [];
  repositories = repositories.filter((repo) => repo.path !== pathToAdd);
  repositories.push({
    path: pathToAdd,
  });
  await config.set('repositories', repositories);

  // Log message
  output(`'${pathToAdd}' is now tracked.`);
};

export default add;
