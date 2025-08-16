import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: any;

if (process.env.DATABASE_URL) {
  // Usar PostgreSQL/Neon si DATABASE_URL está configurada
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  db = drizzle({ client: pool, schema });
} else {
  // Usar SQLite para desarrollo local
  console.log("Usando SQLite para desarrollo local");
  const sqlite = new BetterSqlite3('./dev.db');
  db = drizzleSQLite(sqlite, { schema });
}

export { pool, db };