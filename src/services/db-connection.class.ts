import '../di/types';
import { injectable } from 'inversify';
import * as config from 'config';
import * as Knex from 'knex';
import { bindOnExitHandler } from './exit-handler.service';
import { logger } from './logger.service';
import { Iterable } from 'ix';

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

  constructor(dbConfig = config.get<Record<string, IDBConfig>>('db')) {
    const dbTypeChoices = Object.keys(dbConfig);
    if (dbTypeChoices.length === 0) {
      throw new TypeError('No DB configs found! Check your configs to correct the issue.');
    }
    const dbTypePriority = ['pg', 'mysql', 'mssql'];
    let client = null;
    if (dbTypeChoices.length === 1) {
      if (!dbTypePriority.includes(dbTypeChoices[0])) {
        throw new TypeError(`The database type "${dbTypeChoices[0]}" is not supported! Check your configs to correct the issue.`);
      }
      client = dbTypeChoices[0];
    } else {
      client = Iterable.from(dbTypePriority).first(
        type => type in dbConfig,
      ) || null;
      if (!client) {
        throw new TypeError('No supported DB types! Check your configs to correct the issue.');
      }
      logger.warn(`Several DB configs found. The DB "${client}" is selected according to priority ${JSON.stringify(dbTypePriority)}.`);
    }

    this.config = {
      client,
      connection: dbConfig,
    };
    this.knex = Knex(this.config);
    bindOnExitHandler(() => {
      logger.info(`Closing database connection for "${this.config.client}" at ${(this.config.connection as any).host} to ${(this.config.connection as any).database}`);
      this.knex.destroy(() => logger.info(`Closed database connection for "${this.config.client}" at ${(this.config.connection as any).host} to ${(this.config.connection as any).database}`));
    });
  }
}
