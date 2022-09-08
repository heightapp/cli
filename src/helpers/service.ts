import logger from 'helpers/logger';
import platform, {Platform} from 'helpers/platform';

import EventEmitter from 'events';
import path from 'path';
import {fileURLToPath} from 'url';

import switchImpossibleCase from './switchImpossibleCase';

type PlatformService = EventEmitter & {
  exists: boolean | (() => boolean);
  start: () => void;
  restart: () => void;
  install: () => void;
  uninstall: () => void;
};

export enum ServiceType {
  Watch = 'watch',
}

class Service {
  static isSupported() {
    switch (platform) {
      case Platform.Mac:
        return true;
      case Platform.Windows:
      case Platform.Linux:
      case Platform.Other:
        return false;
      default: {
        switchImpossibleCase(platform);
        return false;
      }
    }
  }

  private type: ServiceType;
  private name: string;
  private description: string;
  private script: string;

  constructor(type: ServiceType) {
    this.type = type;

    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(dirname, '..');

    switch (type) {
      case ServiceType.Watch: {
        this.name = 'app.height.cli.watch';
        this.description = 'Watch files and creates Height tasks for todos.';
        this.script = path.resolve(root, './esm/watch.js');
        return;
      }
      default: {
        switchImpossibleCase(type);
        throw new Error('Invalid service type');
      }
    }
  }

  private async createService(): Promise<PlatformService | null> {
    if (!Service.isSupported()) {
      return null;
    }

    switch (platform) {
      case Platform.Mac: {
        const {Service: NodeService} = await import('node-mac');
        return new NodeService({
          name: this.name,
          description: this.description,
          script: this.script,
          runAsAgent: true,
          logOnAsUser: true,
        });
      }
      case Platform.Windows:
      case Platform.Linux:
      case Platform.Other: {
        return null;
      }
      default: {
        switchImpossibleCase(platform);
        return null;
      }
    }
  }

  async isStarted() {
    const service = await this.createService();
    if (!service) {
      return false;
    }

    if (typeof service.exists === 'function') {
      return service.exists();
    }

    return service.exists;
  }

  async start() {
    const service = await this.createService();
    if (!service) {
      throw new Error('Services are not supported on this platform');
    }

    return new Promise<void>((resolve, reject) => {
      service.once('start', () => {
        logger.info(`Service '${this.type}' started`);
        resolve();
      });

      service.once('alreadyinstalled', () => {
        logger.info(`Service '${this.type}' already installed`);
        resolve();
      });

      service.once('install', () => {
        logger.info(`Service '${this.type}' installed`);
        service.start();
      });

      service.once('invalidinstallation', () => {
        logger.error(`Service '${this.type}' has an invalid installation`);
        reject();
      });

      service.once('error', (error?: Error) => {
        logger.error(`Service '${this.type}' has encountered an error at installation: ${error?.message ?? 'Unknown error'}`);
        reject();
      });

      service.once('doesnotexist', () => {
        logger.error(`Service '${this.type}' does not exist and cannot be installed`);
        reject();
      });

      service.install();
    });
  }

  async restart() {
    const service = await this.createService();
    if (!service) {
      throw new Error('Services are not supported on this platform');
    }

    return new Promise<void>((resolve, reject) => {
      service.once('start', () => {
        logger.info(`Service '${this.type}' restarted`);
        resolve();
      });

      service.once('error', (error?: Error) => {
        logger.error(`Service '${this.type}' has encountered an error at restart: ${error?.message ?? 'Unknown error'}`);
        reject();
      });

      service.once('doesnotexist', () => {
        logger.error(`Service '${this.type}' does not exist and cannot be restarted`);
        reject();
      });

      service.restart();
    });
  }

  async stop() {
    const service = await this.createService();
    if (!service) {
      throw new Error('Services are not supported on this platform');
    }

    return new Promise<void>((resolve, reject) => {
      service.once('uninstall', () => {
        logger.info(`Service '${this.type}' uninstalled`);
        resolve();
      });

      service.once('alreadyuninstalled', () => {
        logger.info(`Service '${this.type}' already uninstalled`);
        resolve();
      });

      service.once('invalidinstallation', () => {
        logger.error(`Service '${this.type}' has an invalid installation`);
        reject();
      });

      service.once('error', (error?: Error) => {
        logger.error(`Service '${this.type}' has encountered an error at uninstallation: ${error?.message ?? 'Unknown error'}`);
        reject();
      });

      service.uninstall();
    });
  }
}

export default Service;
