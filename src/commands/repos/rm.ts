import config from 'helpers/config';
import inquirer from 'inquirer';
import output from 'helpers/output';

const rm = async () => {
  // Get repositories from config
  let repositories = await config.get('repositories');
  if (!repositories?.length) {
    output('No tracked repository.');
    return;
  }

  // Request user which repository to remove
  const repoToRemove = await inquirer.prompt([
    {
      type: 'list',
      name: 'path',
      message: 'Which repository to do you want to stop tracking?',
      choices: repositories.map((repo) => {
        return {value: repo.path, name: repo.path};
      }),
    },
  ]);

  // Save new repositories
  repositories = repositories.filter((repo) => repo.path !== repoToRemove.path);
  await config.set('repositories', repositories);

  // Log message
  output(`'${repoToRemove.path as string}' is not tracked anymore.`);
};

export default rm;
