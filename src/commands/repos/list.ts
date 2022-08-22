import config from 'helpers/config';
import output from 'helpers/output';
import { CommandModule } from 'yargs';

type Command = CommandModule<object, object>

const handler: Command['handler'] = async () => {
  // Get repositories from config
  const repositories = await config.get('repositories');
  if (!repositories?.length) {
    output('No tracked repository.');
    return;
  }

  // Log tracked repositories
  output('Tracked repositories:');
  output(repositories.map((repo) => `- ${repo.path}`).join('\n'));
};

const command: Command = {
  command: 'list',
  describe: 'List tracked repositories',
  handler,
};

export default command;
