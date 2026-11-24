import crypto from 'crypto';
import type { OrderRecord, PartRequest, User } from './src/types.ts';

// ---------------------------------------------------------------------------
// Data layer. Two interchangeable back-ends behind one interface:
//   - PostgreSQL (Neon, etc.) when the DATABASE_URL environment variable is set
//   - In-memory (lost on restart) when it is not - handy for local development
// ---------------------------------------------------------------------------

export interface Owned {
  ownerClientId?: string;
  ownerUserId?: string;
}
export interface Caller {
  clientId?: string;
  userId?: string;
}
export type StoredUser = User & { passwordHash: string };
export type StoredOrder = OrderRecord & Owned;
export type StoredRfq = PartRequest & Owned;

export interface Storage {
  kind: 'memory' | 'postgres';
  init(): Promise<void>;
  counts(): Promise<{ orders: number; rfqs: number }>;

  findUserByEmail(email: string): Promise<StoredUser | undefined>;
  findUserById(id: string): Promise<StoredUser | undefined>;
  createUser(user: StoredUser): Promise<void>;

  createSession(userId: string): Promise<string>;
  getSessionUserId(token: string | undefined): Promise<string | undefined>;
  deleteSession(token: string | undefined): Promise<void>;

  insertOrder(order: StoredOrder): Promise<void>;
  listOrders(caller: Caller): Promise<StoredOrder[]>;
  getOrder(orderId: string, caller: Caller): Promise<StoredOrder | undefined>;
  saveOrder(order: StoredOrder): Promise<void>;
  deleteOrder(orderId: string, caller: Caller): Promise<void>;
  deleteAllOrders(caller: Caller): Promise<void>;

  insertRfq(rfq: StoredRfq): Promise<void>;
  listRfqs(caller: Caller): Promise<StoredRfq[]>;
}

const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('hex');

/** A record belongs to the caller if made from the same browser OR by the same logged-in account. */
export function ownsRecord(record: Owned, caller: Caller): boolean {
  if (caller.clientId && record.ownerClientId && caller.clientId === record.ownerClientId) return true;
  if (caller.userId && record.ownerUserId && caller.userId === record.ownerUserId) return true;
  return false;
}

// ===========================================================================
// In-memory implementation
// ===========================================================================
export function createMemoryStorage(): Storage {
  const users: StoredUser[] = [];
  const orders: StoredOrder[] = [];
  const rfqs: StoredRfq[] = [];
  const sessions = new Map<string, { userId: string; expires: number }>();

  return {
    kind: 'memory',
    async init() {},
    async counts() {
      return { orders: orders.length, rfqs: rfqs.length };
    },
    async findUserByEmail(email) {
      return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    },
    async findUserById(id) {
      return users.find((u) => u.id === id);
    },
    async createUser(user) {
      users.push(user);
    },
    async createSession(userId) {
      const token = newToken();
      sessions.set(sha256(token), { userId, expires: Date.now() + SESSION_MS });
      return token;
    },
    async getSessionUserId(token) {
      if (!token) return undefined;
      const s = sessions.get(sha256(token));
      if (!s) return undefined;
      if (s.expires < Date.now()) {
        sessions.delete(sha256(token));
        return undefined;
      }
      return s.userId;
    },
    async deleteSession(token) {
      if (token) sessions.delete(sha256(token));
    },
    async insertOrder(order) {
      orders.unshift(order);
    },
    async listOrders(caller) {
      return orders.filter((o) => ownsRecord(o, caller));
    },
    async getOrder(orderId, caller) {
      return orders.find((o) => o.orderId === orderId && ownsRecord(o, caller));
    },
    async saveOrder() {
      /* objects are shared by reference, nothing to do */
    },
    async deleteOrder(orderId, caller) {
      const i = orders.findIndex((o) => o.orderId === orderId && ownsRecord(o, caller));
      if (i !== -1) orders.splice(i, 1);
    },
    async deleteAllOrders(caller) {
      for (let i = orders.length - 1; i >= 0; i--) if (ownsRecord(orders[i], caller)) orders.splice(i, 1);
    },
    async insertRfq(rfq) {
      rfqs.unshift(rfq);
    },
    async listRfqs(caller) {
      return rfqs.filter((r) => ownsRecord(r, caller));
    },
  };
}

// ===========================================================================
// SQL (PostgreSQL) implementation
// Only plain, portable SQL is used so the same code can be tested with SQLite.
// Tables are prefixed "app_" so they never clash with other tables in the database.
// ===========================================================================
export interface Queryable {
  query(text: string, params?: any[]): Promise<{ rows: any[] }>;
}

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS app_users (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     data TEXT NOT NULL,
     created_at BIGINT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS app_sessions (
     token_hash TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     expires_at BIGINT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS app_orders (
     order_id TEXT PRIMARY KEY,
     owner_client_id TEXT,
     owner_user_id TEXT,
     data TEXT NOT NULL,
     created_at BIGINT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS app_orders_client_idx ON app_orders (owner_client_id)`,
  `CREATE INDEX IF NOT EXISTS app_orders_user_idx ON app_orders (owner_user_id)`,
  `CREATE TABLE IF NOT EXISTS app_rfqs (
     id TEXT PRIMARY KEY,
     owner_client_id TEXT,
     owner_user_id TEXT,
     data TEXT NOT NULL,
     created_at BIGINT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS app_rfqs_client_idx ON app_rfqs (owner_client_id)`,
  `CREATE INDEX IF NOT EXISTS app_rfqs_user_idx ON app_rfqs (owner_user_id)`,
];

/** Builds "(owner_client_id = $n OR owner_user_id = $m)" for the caller, or null if the caller is anonymous. */
function ownerClause(caller: Caller, offset: number): { sql: string; params: any[] } | null {
  const parts: string[] = [];
  const params: any[] = [];
  if (caller.clientId) {
    params.push(caller.clientId);
    parts.push(`owner_client_id = $${offset + params.length}`);
  }
  if (caller.userId) {
    params.push(caller.userId);
    parts.push(`owner_user_id = $${offset + params.length}`);
  }
  if (parts.length === 0) return null;
  return { sql: `(${parts.join(' OR ')})`, params };
}

export function createSqlStorage(db: Queryable): Storage {
  const parse = <T>(row: any): T => JSON.parse(row.data) as T;

  return {
    kind: 'postgres',

    async init() {
      for (const statement of MIGRATIONS) await db.query(statement);
      // forget login sessions that already expired
      await db.query(`DELETE FROM app_sessions WHERE expires_at < $1`, [Date.now()]);
    },

    async counts() {
      const o = await db.query(`SELECT COUNT(*) AS n FROM app_orders`);
      const r = await db.query(`SELECT COUNT(*) AS n FROM app_rfqs`);
      return { orders: Number(o.rows[0].n), rfqs: Number(r.rows[0].n) };
    },

    async findUserByEmail(email) {
      const { rows } = await db.query(`SELECT data, password_hash FROM app_users WHERE email = $1`, [
        email.toLowerCase().trim(),
      ]);
      if (!rows[0]) return undefined;
      return { ...parse<User>(rows[0]), passwordHash: rows[0].password_hash };
    },

    async findUserById(id) {
      const { rows } = await db.query(`SELECT data, password_hash FROM app_users WHERE id = $1`, [id]);
      if (!rows[0]) return undefined;
      return { ...parse<User>(rows[0]), passwordHash: rows[0].password_hash };
    },

    async createUser(user) {
      const { passwordHash, ...profile } = user;
      await db.query(
        `INSERT INTO app_users (id, email, password_hash, data, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [user.id, user.email.toLowerCase().trim(), passwordHash, JSON.stringify(profile), Date.now()]
      );
    },

    async createSession(userId) {
      const token = newToken();
      await db.query(`INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`, [
        sha256(token),
        userId,
        Date.now() + SESSION_MS,
      ]);
      return token;
    },

    async getSessionUserId(token) {
      if (!token) return undefined;
      const { rows } = await db.query(`SELECT user_id, expires_at FROM app_sessions WHERE token_hash = $1`, [
        sha256(token),
      ]);
      if (!rows[0]) return undefined;
      if (Number(rows[0].expires_at) < Date.now()) {
        await db.query(`DELETE FROM app_sessions WHERE token_hash = $1`, [sha256(token)]);
        return undefined;
      }
      return rows[0].user_id as string;
    },

    async deleteSession(token) {
      if (token) await db.query(`DELETE FROM app_sessions WHERE token_hash = $1`, [sha256(token)]);
    },

    async insertOrder(order) {
      await db.query(
        `INSERT INTO app_orders (order_id, owner_client_id, owner_user_id, data, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [order.orderId, order.ownerClientId ?? null, order.ownerUserId ?? null, JSON.stringify(order), Date.now()]
      );
    },

    async listOrders(caller) {
      const own = ownerClause(caller, 0);
      if (!own) return [];
      const { rows } = await db.query(`SELECT data FROM app_orders WHERE ${own.sql} ORDER BY created_at DESC`, own.params);
      return rows.map((r) => parse<StoredOrder>(r));
    },

    async getOrder(orderId, caller) {
      const own = ownerClause(caller, 1);
      if (!own) return undefined;
      const { rows } = await db.query(`SELECT data FROM app_orders WHERE order_id = $1 AND ${own.sql}`, [
        orderId,
        ...own.params,
      ]);
      return rows[0] ? parse<StoredOrder>(rows[0]) : undefined;
    },

    async saveOrder(order) {
      await db.query(`UPDATE app_orders SET data = $2 WHERE order_id = $1`, [order.orderId, JSON.stringify(order)]);
    },

    async deleteOrder(orderId, caller) {
      const own = ownerClause(caller, 1);
      if (!own) return;
      await db.query(`DELETE FROM app_orders WHERE order_id = $1 AND ${own.sql}`, [orderId, ...own.params]);
    },

    async deleteAllOrders(caller) {
      const own = ownerClause(caller, 0);
      if (!own) return;
      await db.query(`DELETE FROM app_orders WHERE ${own.sql}`, own.params);
    },

    async insertRfq(rfq) {
      await db.query(
        `INSERT INTO app_rfqs (id, owner_client_id, owner_user_id, data, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [rfq.id, rfq.ownerClientId ?? null, rfq.ownerUserId ?? null, JSON.stringify(rfq), Date.now()]
      );
    },

    async listRfqs(caller) {
      const own = ownerClause(caller, 0);
      if (!own) return [];
      const { rows } = await db.query(`SELECT data FROM app_rfqs WHERE ${own.sql} ORDER BY created_at DESC`, own.params);
      return rows.map((r) => parse<StoredRfq>(r));
    },
  };
}

/** Connects to PostgreSQL (Neon etc.) using a connection string and prepares the tables. */
async function createPostgresStorage(connectionString: string): Promise<Storage> {
  const pg: any = await import('pg');
  const Pool = pg.Pool ?? pg.default?.Pool;
  const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString);
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    // Neon requires SSL; honour sslmode= in the URL if present, otherwise turn SSL on for remote hosts
    ...(!isLocal && !/sslmode=/.test(connectionString) ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  // An idle connection being closed by the server must never crash the site
  pool.on('error', (err: Error) => console.warn('[Database] idle connection error:', err.message));

  const db: Queryable = {
    async query(text, params) {
      try {
        return await pool.query(text, params);
      } catch (err: any) {
        // Neon pauses idle databases; the first request after a pause can fail once. Retry once.
        if (/terminated|ECONNRESET|ETIMEDOUT|timeout|ECONNREFUSED/i.test(String(err?.message || err?.code))) {
          await new Promise((r) => setTimeout(r, 500));
          return await pool.query(text, params);
        }
        throw err;
      }
    },
  };
  const storage = createSqlStorage(db);
  await storage.init();
  return storage;
}

/** Picks the right storage: PostgreSQL when DATABASE_URL is set, otherwise in-memory. */
export async function createStorage(): Promise<Storage> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const storage = await createPostgresStorage(url);
    console.log('[Database] Connected to PostgreSQL. Accounts and orders are saved permanently.');
    return storage;
  }
  console.warn(
    '[Database] DATABASE_URL is not set - using TEMPORARY in-memory storage. Accounts and orders are lost on every restart!'
  );
  return createMemoryStorage();
}
