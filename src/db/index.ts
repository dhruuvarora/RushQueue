import type { DB } from './db.d';
import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely';

const dialect = new MysqlDialect({
  pool: createPool({
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'pwd',
    port: Number(process.env.DB_PORT) || 3306,
    connectionLimit: 10,
  }),
});

export const db = new Kysely<DB>({
  dialect,
});
