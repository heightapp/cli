
import yargs from 'yargs';
import { COMBINED_LOG_FILE_PATH, ERROR_LOG_FILE_PATH } from 'helpers/logger';
import { spawn } from 'child_process';

const handler = ({error}: {error?: boolean}) => {
  const filePath = error ? ERROR_LOG_FILE_PATH : COMBINED_LOG_FILE_PATH;
  spawn('less', ['+G', filePath], {
    stdio: 'inherit',
  });
}

export default {
  command: 'logs',
  describe: 'Show logs',
  builder: (log: typeof yargs) => {
    return log.options('error', {
      boolean: true,
      description: 'Only error logs'
    });
  },
  handler,
};