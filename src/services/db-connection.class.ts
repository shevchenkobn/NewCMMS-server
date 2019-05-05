import '../di/types';
import { injectable } from 'inversify';
import * as config from 'config';
import * as Knex from 'knex';
import { DeepReadonly } from '../@types';
import { bindOnExitHandler } from './exit-handler.service';
import { logger } from './logger.service';
import * as Enumerable from 'linq';

export const availableDbTypes: ReadonlyArray<IDBConfig['type']> = [
  'pg', 'mssql', 'oracle',
];

export interface IDBConfig {
  type: 'pg' | 'mssql' | 'oracle';
  host: string;
  database: string;
  user: string;
  password: string;
  debug: boolean;
}

@injectable()
export class DbConnection {
  readonly config: DeepReadonly<Knex.Config>;
  readonly knex: Knex;

  constructor(dbConfig = config.get<IDBConfig>('db')) {
    if (!availableDbTypes.includes(dbConfig.type)) {
      throw new TypeError(`The database type "${dbConfig.type}" is not supported! Available DB types: ${JSON.stringify(availableDbTypes)}. Check your configs to correct the issue.`);
    }
    const { type: client, debug, ...connectionConfig } = dbConfig;

    this.config = {
      client,
      connection: connectionConfig,
      log: logger,
      asyncStackTraces: true,
      debug: process.env.NODE_ENV !== 'production' && debug,
      acquireConnectionTimeout: 60000,
    } as any;
    this.knex = Knex(this.config as Knex.Config);
    bindOnExitHandler(() => {
      logger.info(`Closing database connection for "${this.config.client}" at ${(this.config.connection as any).host} to ${(this.config.connection as any).database}`);
      this.knex.destroy(() => logger.info(`Closed database connection for "${this.config.client}" at ${(this.config.connection as any).host} to ${(this.config.connection as any).database}`));
    });
  }

  getIdentifier(...args: ReadonlyArray<string>) {
    return this.knex.raw(
      `??${'.??'.repeat(args.length - 1)}`,
      args.slice(),
    );
  }
}
