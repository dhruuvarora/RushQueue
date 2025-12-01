import { DB } from './db' 
import { createPool } from 'mysql2'
import { Kysely, MysqlDialect } from 'kysely'

const dialect = new MysqlDialect({
  pool: createPool({
    database: 'RushQueue',
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 3306,
    connectionLimit: 10,
  })
})

// Database interface is passed to Kysely's constructor, and from now on, Kysely 
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how 
// to communicate with your database.
export const db = new Kysely<DB>({
  dialect,
})