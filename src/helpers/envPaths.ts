import env from 'env';
import envPaths from 'env-paths';

import {SCRIPT_NAME} from './constants';

export default envPaths(env.nodeEnv === 'production' ? SCRIPT_NAME : `${SCRIPT_NAME}-dev`, {suffix: 'cli'});
