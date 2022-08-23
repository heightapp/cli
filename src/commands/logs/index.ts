
import {COMBINED_LOG_FILE_PATH, ERROR_LOG_FILE_PATH} from 'helpers/logger';
import output from 'helpers/output';
import platform, {Platform} from 'helpers/platform';
import switchImpossibleCase from 'helpers/switchImpossibleCase';
import {CommandModule} from 'yargs';

import {spawn} from 'child_process';

type Command = CommandModule<object, {
  error?: boolean,
}>;

const handler: Command['handler'] = (args) => {
  const filePath = args.error ? ERROR_LOG_FILE_PATH : COMBINED_LOG_FILE_PATH;

  switch (platform) {
    case Platform.Linux:
    case Platform.Mac: {
      spawn('less', ['+G', filePath], {
        stdio: 'inherit',
      });
      break;
    }
    case Platform.Windows:
    case Platform.Other: {
      // Less is not supported by default on Windows and there's no
      // tool that is good enough to display the end of the log file efficiently
      output(`The log file is located at: ${filePath}.`);
      break;
    }
    default: {
      switchImpossibleCase(platform);
      output(`The log file is located at: ${filePath}.`);
    }
  }
};

const command: Command = {
  command: 'log',
  aliases: ['logs'],
  describe: 'Show logs',
  builder: (argv) => {
    return argv.options('error', {
      boolean: true,
      description: 'Only error logs',
    });
  },
  handler,
};

export default command;
