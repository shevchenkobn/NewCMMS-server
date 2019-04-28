import '../di/types';
import { injectable } from 'inversify';
import * as config from 'config';
import * as Knex from 'knex';
import { bindOnExitHandler } from './exit-handler.service';
import { logger } from './logger.service';
import * as Enumerable from 'linq';

export const availableDbTypes: ReadonlyArray<IDBConfig['type']> = [
  'pg', 'mssql', 'mssql', 'oracle',
];

export interface IDBConfig {
  type: 'pg' | 'mysql' | 'mssql' | 'oracle';
  host: string;
  database: string;
  user: string;
  password: string;
}

@injectable()
export class DbConnection {
  readonly config: Readonly<Knex.Config>;
  readonly knex: Knex;

  constructor(dbConfig = config.get<IDBConfig>('db')) {
    if (!availableDbTypes.includes(dbConfig.type)) {
      throw new TypeError(`The database type "${dbConfig.type}" is not supported! Available DB types: ${JSON.stringify(availableDbTypes)}. Check your configs to correct the issue.`);
    }
    const { type: client, ...connectionConfig } = dbConfig;

    // A stub condition to be changed in future
    if (client !== 'pg') {
      throw new TypeError('Postgres only supported by now');
    }

    this.config = {
      client,
      connection: connectionConfig,
    };
    this.knex = Knex(this.config);
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
