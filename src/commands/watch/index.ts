import Client, {ClientError, ClientErrorCode} from '@heightapp/client';
import updateTodos from '@heightapp/update-todos';
import createClient from 'clientHelpers/createClient';
import getDefaultListIds from 'clientHelpers/getDefaultListIds';
import login from 'commands/auth/login';
import addRepo from 'commands/repos/add';
import config from 'helpers/config';
import {SCRIPT_NAME} from 'helpers/constants';
import GitRepo from 'helpers/gitRepo';
import keychain from 'helpers/keychain';
import logger from 'helpers/logger';
import output from 'helpers/output';
import Service, {ServiceType} from 'helpers/service';
import inquirer from 'inquirer';
import {CommandModule} from 'yargs';

type Command = CommandModule<
  object,
  {
    service?: boolean;
  }
>;

const createHandleRepositoryFileChange = ({
  userId,
  listIds,
  repoPath,
  client,
  onStop,
}: {
  userId: string;
  listIds: Array<string>;
  repoPath: string;
  client: Client;
  onStop: () => void;
}) => {
  return async (filePath: string) => {
    await updateTodos({
      filePath,
      repoPath,
      onCreateTask: async (name) => {
        try {
          logger.info(`Create task with name '${name}'`);
          const newTask = await client.task.create({name, listIds, assigneesIds: [userId]});
          logger.info(`Successfully created task with name '${name}' and index '${newTask.index}'.`);
          return newTask;
        } catch (e) {
          logger.error(`Could not create task with name '${name}'`);

          if (e instanceof ClientError) {
            if (e.code === ClientErrorCode.RefreshTokenInvalid) {
              output('You credentials are invalid and were probably revoked. Please restart watch to login again.');
              onStop();
            }
          }

          // Ignore other errors. We don't want this to crash watch
          return null;
        }
      },
    });
  };
};

export const watch = ({
  repositories,
  userId,
  listIds,
  client,
}: {
  repositories: Array<{path: string}>;
  userId: string;
  listIds: Array<string>;
  client: Client;
}) => {
  // Log how many repositories we're watching
  logger.info(`Started watching ${repositories.length} repositories`);

  // Watch each repository
  repositories.forEach(({path}) => {
    let watcherPromise: ReturnType<GitRepo['watch']>;
    const handler = createHandleRepositoryFileChange({
      userId,
      listIds,
      repoPath: path,
      client,
      onStop: async () => {
        const watcher = await watcherPromise;
        watcher.close();
      },
    });

    watcherPromise = new GitRepo({path}).watch(handler);
  });
};

export const restartWatchIfRunning = async () => {
  if (!Service.isSupported()) {
    return;
  }

  const service = new Service(ServiceType.Watch);
  if (!(await service.isStarted())) {
    return;
  }

  await service.restart();
};

const handler: Command['handler'] = async (args) => {
  const service = new Service(ServiceType.Watch);
  if (await service.isStarted()) {
    output('Watch is already running in the background. Use `watch stop` or `watch restart` to stop or restart it.');
    return;
  }

  // Ask for repo if needed
  let repositories = await config.get('repositories');
  if (!repositories?.length) {
    await addRepo.handler({_: ['repos', 'add'], $0: SCRIPT_NAME});
    repositories = await config.get('repositories');
  }

  if (!repositories?.length) {
    throw new Error('Missing repository. They should have been configured by now.');
  }

  // Authenticate if needed
  let credentials = await keychain.getCredentials();
  if (!credentials) {
    const shouldLogin = (
      await inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Sign up or log in on Height.app to track your todos',
        default: true,
      })
    ).confirm as boolean;

    if (!shouldLogin) {
      return;
    }

    await login.handler({_: ['auth', 'login'], $0: SCRIPT_NAME});
    credentials = await keychain.getCredentials();
  }

  if (!credentials) {
    throw new Error('Missing credentials. User should have been logged in by now');
  }

  // Refresh default listIds
  const client = createClient(credentials.refreshToken);
  const defaultListIds = await getDefaultListIds(client);
  await config.set('defaultListIds', defaultListIds);

  // Check if we should run as a service
  const runAsService = await (async () => {
    if (!Service.isSupported()) {
      return false;
    }

    if (args.service !== undefined) {
      return args.service;
    }

    return (
      await inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to run watch in the background?',
        default: true,
      })
    ).confirm as boolean;
  })();

  if (runAsService) {
    await service.start();
    output(`Watch is now running in the background and watching ${repositories.length} ${repositories.length > 1 ? 'repositories…' : 'repository…'}`);
  } else {
    output(`Watching ${repositories.length} ${repositories.length > 1 ? 'repositories' : 'repository'}…`);
    watch({repositories, userId: credentials.user.id, listIds: defaultListIds, client});
  }
};

const command: Command = {
  command: 'watch',
  describe: 'Turn // todo into tasks automatically',
  builder: (argv) => {
    if (Service.isSupported()) {
      return argv
        .command('stop', 'Stop watch from running as a service', {}, async () => {
          const service = new Service(ServiceType.Watch);
          if (!(await service.isStarted())) {
            output('Watch is not running.');
            return;
          }

          await service.stop();
          output('Watch has been stopped.');
        })
        .command('restart', 'Restart watch service', {}, async () => {
          const service = new Service(ServiceType.Watch);
          if (!(await service.isStarted())) {
            output('Watch is not running.');
            return;
          }

          await service.restart();
          output('Watch has been restarted.');
        })
        .options('service', {
          boolean: true,
          description: 'Run watch in the background',
        });
    }

    return argv;
  },
  handler,
};

export default command;
