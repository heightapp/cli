import os from 'os';

export enum Platform {
  Linux = 'linux',
  Mac = 'mac',
  Windows = 'windows',
  Other = 'other',
}

const platform = (() => {
  const osPlatform = os.platform();
  if (osPlatform.includes('darwin')) {
    return Platform.Mac;
  } else if (osPlatform.includes('linux')) {
    return Platform.Linux;
  } else if (osPlatform.includes('win32')) {
    return Platform.Windows;
  }
  return Platform.Other;
})();

export default platform;

