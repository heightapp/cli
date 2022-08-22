import logger from 'helpers/logger';

const switchImpossibleCase = (value: never) => {
  logger.error(`Impossible case reached: ${value}`);
};

export default switchImpossibleCase;
