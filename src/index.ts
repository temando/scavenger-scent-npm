import { exec } from 'child_process';
import * as winston from 'winston';
import { NPM } from './NPM';
import { IProject } from './types';

const runner = (args: string[], logger = winston): Promise<IProject[]> => {
  const npmScent = new NPM(exec, logger);
  const keywords = (args[1]) ? args[1].split(',') : [];

  return npmScent.getCatalog(args[0], keywords);
};

module.exports = runner;
