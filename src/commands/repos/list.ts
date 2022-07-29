import config from 'helpers/config';
import output from 'helpers/output';

const list = async () => {
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

export default list;
