import '../di/types';
import { injectable } from 'inversify';
import * as config from 'config';
import * as Knex from 'knex';
import { bindOnExitHandler } from './exit-handler.service';
import { logger } from './logger.service';

export interface IDBConfig {
  host: string;
  database: string;
  user: string;
  password: string;
}

@injectable()
export class DbConnection {
  readonly config: Readonly<Knex.Config>;
  readonly knex: Knex;

  constructor(credentialsConfig = config.get<IDBConfig>('db.pg')) {
    this.config = {
      client: 'pg',
      connection: credentialsConfig,
    };
    this.knex = Knex(this.config);
    bindOnExitHandler(() => {
      logger.info(`Closing database connection for ${this.config.client} at ${(this.config.connection as any).host} to ${(this.config.connection as any).database}`)
      this.knex.destroy(() => logger.info(`Closed database connection for ${this.config.client} at ${(this.config.connection as any).host} to ${(this.config.connection as any).database}`));
    });
  }
}
