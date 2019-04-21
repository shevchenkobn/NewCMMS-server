import * as path from 'path';

export const logger = path.basename(__dirname) !== 'tools'
  ? getNormalLogger()
  : console;

function getNormalLogger() {
  // TODO: change
  return console;
}
