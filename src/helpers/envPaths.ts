import env from 'env';
import envPaths from 'env-paths';

export default envPaths(env.prod ? 'height' : 'height-dev', {suffix: 'cli'});