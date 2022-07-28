import fs from 'fs';
import path from 'path';

import envPaths from 'env-paths';

const CONFIG_PATH = path.resolve(envPaths('height', {suffix: 'cli'}).config, 'config.json');

export type Config = {
  repositories?: Array<{path: string}>;
  defaultListIds?: Array<string>;
  credentials?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
};

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

const get = async <K extends keyof Config>(key: K): Promise<Config[K] | undefined> => {
  return (await getConfig())?.[key];
};

const set = async <K extends keyof Config>(key: K, value: Config[K]) => {
  const config = await getConfig();
  const updatedConfig = {...config, [key]: value};
  await saveConfig(updatedConfig);
};

const clear = async (key: keyof Config) => {
  const config = await getConfig();
  if (!config) {
    return;
  }

  delete config[key];
  await saveConfig(config);
};

export default {
  get,
  set,
  clear,
};
