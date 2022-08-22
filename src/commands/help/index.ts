
import { CommandModule } from 'yargs';
import {spawn} from 'child_process'
import env from 'env';
import { SCRIPT_NAME } from 'helpers/constants';

type Command = CommandModule<object, {
  command: Array<string>,
}>;

const handler: Command['handler'] = (args) => {
  // Run the command with --help to show the help text
  const command = env.nodeEnv === 'production' ? SCRIPT_NAME : 'yarn';
  const commandArgs = env.nodeEnv === 'production' ? [...args.command, '--help'] : ['dev', ...args.command, '--help'];
  spawn(command, commandArgs, {
    stdio: 'inherit',
  });
}

const command: Command = {
  command: 'help <command..>',
  describe: 'Get help for specified command',
  builder: (argv) => {
    return argv.positional('command', {
      type: 'string',
      description: 'Command to get help for',
      demandOption: true,
    }) as any
  },
  handler,
};

export default command;