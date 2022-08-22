import fs from 'fs';
import path from 'path';
import envPaths from './envPaths';
import logger from './logger';

const CONFIG_PATH = path.resolve(envPaths.config, 'config.json');

export type Config = Partial<{
  repositories: Array<{path: string}>;
  defaultListIds: Array<string>;
  user: {
    id: string,
    email: string,
  }
}>;

// Helpers

const getConfig = async (): Promise<Config | null> => {
  try {
    const file = await fs.promises.readFile(CONFIG_PATH, {
      encoding: 'utf-8',
    });

    const config = JSON.parse(file);
    return config;
  } catch {
    return null;
  }
};

const saveConfig = async (config: Config) => {
  const directory = path.parse(CONFIG_PATH).dir;
  await fs.promises.mkdir(directory, {recursive: true});
  await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
  });
};

// Exported

const stringify = (object: any) => {
  try {
    return JSON.stringify(object);
  } catch {
    return '{}';
  }
}

const getAll = async (): Promise<Config> => {
  const config = (await getConfig()) ?? {}
  logger.info(`Config - getAll: ${stringify(config)}`)
  return config;
}

const get = async <K extends keyof Config>(key: K): Promise<Config[K] | undefined> => {
  const value = (await getConfig())?.[key]
  logger.info(`Config - get: ${key}: ${stringify(value)}`)
  return (await getConfig())?.[key];
};

const set = async <K extends keyof Config>(key: K, value: Config[K]) => {
  logger.info(`Config - set: ${key}: ${stringify(value)}`)
  const config = await getConfig();
  const updatedConfig = {...config, [key]: value};
  await saveConfig(updatedConfig);
};

const update = async (partialConfig: Partial<Config>) => {
  logger.info(`Config - update: ${stringify(partialConfig)}`)
  const config = await getConfig();
  const updatedConfig = {...config, ...partialConfig};
  await saveConfig(updatedConfig);
};

const clear = async (key: keyof Config) => {
  logger.info(`Config - clear ${key}`)
  const config = await getConfig();
  if (!config) {
    return;
  }

  delete config[key];
  await saveConfig(config);
};

export default {
  getAll,
  get,
  set,
  update,
  clear,
};
