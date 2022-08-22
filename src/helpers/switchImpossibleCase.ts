import logger from 'helpers/logger';

const switchImpossibleCase = (value: never) => {
  logger.error(`Impossible case reached: ${value as string}`);
};

export default switchImpossibleCase;
