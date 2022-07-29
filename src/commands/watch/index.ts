import addRepo from 'commands/repos/add';
import config from 'helpers/config';
import output from 'helpers/output';
import GitRepo from 'helpers/gitRepo';
import GitFile from 'helpers/gitFile';
import TodoParser from 'commands/watch/helpers/todoParser';
import sharedClient from 'helpers/sharedClient';

let todosInFlight: Array<Todo> = [];

type FileLine = {
  text: string;
  index: number;
};

type Todo = {
  name: string;
  file: {
    path: string;
    line: FileLine;
    prefix: string;
  };
};

const isTodoEqual = (task1: Todo, task2: Todo): boolean => {
  return task1.name === task2.name || (task1.file.path === task2.file.path && task1.file.line.index === task2.file.line.index);
};

const createHandleRepositoryFileChange = ({userId, listIds, repoPath}: {userId: string, listIds: Array<string>, repoPath: string}) => {
  return async (filePath: string) => {
    console.log('DEBUG file change', filePath, TodoParser.isFileSupported(filePath));
    if (!TodoParser.isFileSupported(filePath)) {
      // File not supported
      return;
    }

    // Find all lines that changed
    const parser = new TodoParser({filePath});
    const file = new GitFile({filePath, repoPath});
    const todos: Array<Todo> = [];
    await file.changedLines((line) => {
      const todo = parser.parse(line.text);
      if (todo) {
        todos.push({
          name: todo.name,
          file: {
            path: filePath,
            line,
            prefix: todo.prefix,
          },
        });
      }
    });

    // Filter out todos for which we are already creating a task
    const newTodos = todos.filter((todo) => {
      return !todosInFlight.find((todoInFlight) => {
        return isTodoEqual(todoInFlight, todo);
      });
    });

    if (!newTodos.length) {
      return;
    }

    // Create task for each todo
    todosInFlight.push(...newTodos);
    newTodos.forEach(async (todo) => {
      // Create task
      const newTask = await sharedClient.task.create({name: todo.name, listIds, assigneesIds: [userId]});

      if (newTask) {
        // Update line of file with task index and todo description
        await file.updateLine({
          lineIndex: todo.file.line.index,
          previousContent: todo.file.line.text,
          newContent: `${todo.file.prefix}T-${newTask.index} ${newTask.name}`,
        });
      }

      // Clear todo from in-flight list
      todosInFlight = todosInFlight.filter((todoInFlight) => {
        return !isTodoEqual(todoInFlight, todo);
      });
    });
  }
};

const handler = async () => {
  const configValues = await config.getAll();
  const credentials = configValues.credentials;
  const user = configValues.user;
  if (!credentials || !user) {
    output('You need to be logged in to use `watch`. Please authenticate with the `auth login` command.');
    return;
  }

  // Find all repositories to watch
  let repositories = configValues.repositories;
  if (!repositories?.length) {
    // If there's none, request a repo
    await addRepo();
  }

  repositories = await config.get('repositories');
  if (!repositories?.length) {
    throw new Error('Missing repository');
  }

  // Get default listIds
  let defaultListIds = configValues.defaultListIds;
  if (!defaultListIds?.length) {
    const {preferences} = await sharedClient.userPreference.get();
    defaultListIds = preferences.defaultListIds;
    await config.set('defaultListIds', defaultListIds);
  }

  if (!defaultListIds?.length) {
    throw new Error('Default list is missing. Please go to Height > Settings > Preferences and set a default list for new tasks');
  }

  // Log how many repositories we're watching
  output(`Watching ${repositories.length} repositories…`);

  // Watch each repository
  repositories.forEach(({path}) => {
    const handler = createHandleRepositoryFileChange({
      userId: user.id,
      listIds: defaultListIds ?? [],
      repoPath: path,
    })
    new GitRepo({path}).watch(handler);
  });
};

export default {
  command: 'watch',
  describe: 'Watch Git repositories and automatically create tasks for todos',
  handler,
};
