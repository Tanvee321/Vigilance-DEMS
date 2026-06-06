/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export interface Handover {
  from: string;
  to: string;
  timestamp: string;
  reason: string;
}

export interface ForensicEntry {
  id: string;
  caseTitle: string;
  caseId: string;
  fileName: string;
  timestamp: string;
  sizeBytes: number;
  hash: string;
  initialHash: string;
  custodian: string;
  status: string;
  category: string;
  description: string;
  isVerified: boolean;
  handovers?: Handover[];
  ownerId?: string;
}

export interface UserAccount {
  email: string;
  passkey: string;
}

const dbDir = path.join(process.cwd(), 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// FakeDatabase removed

let sqliteModuleCache: any = null;

export async function getSqlite() {
  if (sqliteModuleCache) return sqliteModuleCache;
  try {
    const sqlite3Module = await import('sqlite3');
    sqliteModuleCache = sqlite3Module.default.verbose();
  } catch (err) {
    console.error('[SQLite Driver Notice] Native SQLite initialization is required:', err);
    throw err;
  }
  return sqliteModuleCache;
}

const dbPath = process.env.DATABASE_URL || path.join(os.tmpdir(), 'forensics.db');
const forensicsDbPath = dbPath;
const jsonDbPath = path.join(dbDir, 'sentinel_local_db.json');

// Drivers and flags
let db: any = null;
let useJsonDb = false;

// Interface for JSON database structure
interface JsonDatabase {
  users: UserAccount[];
  evidence: ForensicEntry[];
  handovers?: any[];
}

// In-memory fallback in case of write failures
let inMemoryDb: JsonDatabase = {
  users: [
    { email: 'tanvee.zalera@gmail.com', passkey: 'Vigilance2026' }
  ],
  evidence: []
};

// Default seed data to ensure the demo is stunning on first load
const DEFAULT_SEED_EVIDENCE: ForensicEntry[] = [
  {
    id: "EVD-2026-X1",
    caseTitle: "Operation Cipher Rest",
    caseId: "CASE-882",
    fileName: "encrypted_vault.bin",
    timestamp: "2026-06-02 12:00:00 UTC",
    sizeBytes: 4194304,
    hash: "0a5b8f2d3e11aa77fba5056bc229988ffecd882299a9a9bfde8a8a2992911bbf",
    initialHash: "0a5b8f2d3e11aa77fba5056bc229988ffecd882299a9a9bfde8a8a2992911bbf",
    custodian: "Inbound Officer",
    status: "Secure",
    category: "Disk Image",
    description: "Cold-storage secure memory volume retrieved from safe premises checkpoint 3.",
    isVerified: true,
    ownerId: "tanvee.zalera@gmail.com",
    handovers: [
      { from: "Inbound Officer", to: "Evidence Specialist", timestamp: "2026-06-02 12:00:00 UTC", reason: "Forensic System Ingest Seal" }
    ]
  },
  {
    id: "EVD-2026-X2",
    caseTitle: "Alpha Stream Scan",
    caseId: "CASE-901",
    fileName: "bitstream_header.raw",
    timestamp: "2026-06-02 14:30:00 UTC",
    sizeBytes: 1048576,
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    initialHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    custodian: "Special Investigator",
    status: "Secure",
    category: "Network Capture",
    description: "Header dump of ingress network stream during decryption synchronization.",
    isVerified: true,
    ownerId: "tanvee.zalera@gmail.com",
    handovers: [
      { from: "Special Investigator", to: "Sentinel Lead Analyst", timestamp: "2026-06-02 14:30:00 UTC", reason: "Block Buffer Cryptoprocessing Scan" }
    ]
  }
];

// Read JSON database file
function readJsonDbFile(): JsonDatabase {
  try {
    if (fs.existsSync(jsonDbPath)) {
      const data = fs.readFileSync(jsonDbPath, 'utf8');
      inMemoryDb = JSON.parse(data);
    } else {
      // Check if old evidence.json is available to seed JSON DB
      const evidenceJsonPath = path.join(dbDir, 'evidence.json');
      let initialEvidence = DEFAULT_SEED_EVIDENCE;
      if (fs.existsSync(evidenceJsonPath)) {
        try {
          const rawSec = fs.readFileSync(evidenceJsonPath, 'utf8');
          initialEvidence = JSON.parse(rawSec);
        } catch (e) {
          console.error('[JSON DB Seeding Fail from evidence.json]', e);
        }
      }
      inMemoryDb.evidence = initialEvidence;
      writeJsonDbFile();
    }
  } catch (err) {
    console.error('[JSON DB Read Error]', err);
  }
  return inMemoryDb;
}

// Write JSON database file
function writeJsonDbFile() {
  try {
    fs.writeFileSync(jsonDbPath, JSON.stringify(inMemoryDb, null, 2), 'utf8');
  } catch (err) {
    console.error('[JSON DB Write Error]', err);
  }
}

// Low-level SQLite run wrapper
function runSql(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('SQLite database not initialized'));
    db.run(sql, params, function (this: any, err: Error | null) {
      if (err) reject(err);
      else resolve({ lastID: this?.lastID ?? 0, changes: this?.changes ?? 0 });
    });
  });
}

// Low-level SQLite all wrapper
function allSql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('SQLite database not initialized'));
    db.all(sql, params, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Low-level SQLite get wrapper
function getSql<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('SQLite database not initialized'));
    db.get(sql, params, (err: Error | null, row: any) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

/**
 * Initializes SQLite database tables or gracefully boots JSON fallback driver.
 */
export async function initDb(): Promise<void> {
  try {
    console.log('[Sovereign DB] Ingesting database driver initialization...');
    
    // Attempt dynamic SQLite loading
    try {
      const sqlite = await getSqlite();
      
      await new Promise<void>((resolve, reject) => {
        db = new sqlite.Database(dbPath, (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            console.log('[SQLite DB] Embedded DB file opened successfully.');
            resolve();
          }
        });
      });
      
      // Setup tables
      await runSql(`
        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          password TEXT
        )
      `);

      await runSql(`
        CREATE TABLE IF NOT EXISTS archives (
          id TEXT PRIMARY KEY,
          caseTitle TEXT,
          caseId TEXT,
          fileName TEXT NOT NULL,
          timestamp TEXT,
          sizeBytes INTEGER,
          hash TEXT NOT NULL,
          initialHash TEXT,
          custodian TEXT NOT NULL,
          status TEXT,
          category TEXT,
          description TEXT,
          isVerified INTEGER,
          ownerId TEXT
        )
      `);

      await runSql(`
        CREATE TABLE IF NOT EXISTS evidence (
          id TEXT PRIMARY KEY,
          caseTitle TEXT NOT NULL,
          caseId TEXT NOT NULL,
          fileName TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          sizeBytes INTEGER NOT NULL,
          hash TEXT NOT NULL,
          initialHash TEXT NOT NULL,
          custodian TEXT NOT NULL,
          status TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          isVerified INTEGER NOT NULL,
          ownerId TEXT NOT NULL
        )
      `);

      await runSql(`
        CREATE TABLE IF NOT EXISTS handovers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          evidenceId TEXT NOT NULL,
          fromCustodian TEXT NOT NULL,
          toCustodian TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          reason TEXT NOT NULL,
          FOREIGN KEY(evidenceId) REFERENCES evidence(id) ON DELETE CASCADE
        )
      `);

      // Default user register in SQLite
      await runSql(`INSERT OR IGNORE INTO users (email, password) VALUES ('tanvee.zalera@gmail.com', 'Vigilance2026')`);

      // Seed tables
      const countCheck = await getSql<{ count: number }>(`SELECT COUNT(*) as count FROM evidence`);
      if (countCheck && countCheck.count === 0) {
        const sentinelMarkerPath = path.join(dbDir, '.sentinel_seeded');
        if (!fs.existsSync(sentinelMarkerPath)) {
          console.log('[SQLite DB] Seed initiating. Loading primary forensic payload...');
          try {
            fs.writeFileSync(sentinelMarkerPath, '1', 'utf8');
          } catch (_) {}
          const evidenceJsonPath = path.join(dbDir, 'evidence.json');
          let seedList = DEFAULT_SEED_EVIDENCE;
          if (fs.existsSync(evidenceJsonPath)) {
            try {
              const raw = fs.readFileSync(evidenceJsonPath, 'utf8');
              seedList = JSON.parse(raw);
            } catch (e) {
              console.warn('[SQLite DB] evidence.json parsing fail, seeding with memory codes.', e);
            }
          }
          
          for (const item of seedList) {
            await runSql(`
              INSERT OR IGNORE INTO evidence (
                id, caseTitle, caseId, fileName, timestamp, sizeBytes, 
                hash, initialHash, custodian, status, category, description, isVerified, ownerId
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              item.id, item.caseTitle, item.caseId, item.fileName, item.timestamp, item.sizeBytes,
              item.hash, item.initialHash, item.custodian, item.status, item.category, item.description || '',
              item.isVerified ? 1 : 0, item.ownerId || 'tanvee.zalera@gmail.com'
            ]);

            if (item.handovers && Array.isArray(item.handovers)) {
              for (const h of item.handovers) {
                await runSql(`
                  INSERT INTO handovers (evidenceId, fromCustodian, toCustodian, timestamp, reason)
                  VALUES (?, ?, ?, ?, ?)
                `, [item.id, h.from, h.to, h.timestamp, h.reason]);
              }
            }
          }
          console.log('[SQLite DB] Seeding verified and completed.');
        }
      } else {
        const sentinelMarkerPath = path.join(dbDir, '.sentinel_seeded');
        if (!fs.existsSync(sentinelMarkerPath)) {
          try {
            fs.writeFileSync(sentinelMarkerPath, '1', 'utf8');
          } catch (_) {}
        }
      }

    } catch (sqliteLoadError) {
      console.error('[SQLite Driver Error]', sqliteLoadError);
      throw sqliteLoadError;
    }
  } catch (err) {
    console.error('[DB Crash Setup Error]', err);
    throw err;
  }
}

/**
 * Returns all registered users
 */
export async function readAllUsers(): Promise<UserAccount[]> {
  try {
    const rows = await allSql<{ email: string; password: string }>(`SELECT email, password FROM users`);
    return rows.map(r => ({ email: r.email, passkey: r.password }));
  } catch (err) {
    console.error('[DB readAllUsers Fail]', err);
    return [];
  }
}

/**
 * Registers an investigator
 */
export async function registerUser(email: string, passkey: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const pwd = passkey.trim();

  try {
    const existing = await getSql(`SELECT email FROM users WHERE email = ?`, [normalized]);
    if (existing) {
      return false;
    }
    await runSql(`INSERT INTO users (email, password) VALUES (?, ?)`, [normalized, pwd]);
    return true;
  } catch (err) {
    console.error('[DB registerUser Fail]', err);
    return false;
  }
}

/**
 * Resets password
 */
export async function resetUserPassword(email: string, newPasskey: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const pwd = newPasskey.trim();

  try {
    const existing = await getSql(`SELECT email FROM users WHERE email = ?`, [normalized]);
    if (!existing) {
      if (normalized === 'tanvee.zalera@gmail.com') {
        await runSql(`INSERT INTO users (email, password) VALUES (?, ?)`, [normalized, pwd]);
        return true;
      }
      return false;
    }
    await runSql(`UPDATE users SET password = ? WHERE email = ?`, [pwd, normalized]);
    return true;
  } catch (err) {
    console.error('[DB resetUserPassword Fail]', err);
    return false;
  }
}

/**
 * Returns all evidence item mapped to their handovers
 */
export async function readAllEvidence(): Promise<ForensicEntry[]> {
  const sqlite = await getSqlite();

  return new Promise<ForensicEntry[]>((resolve) => {
    const dbConnectionPath = process.env.DATABASE_URL ? ':memory:' : forensicsDbPath;
    const fdb = new sqlite3.Database(dbConnectionPath, (err: Error | null) => { 
      if (err) {
        console.error('[DB readAllEvidence Open Fail]', err);
        resolve([]);
        return;
      }

      fdb.serialize(() => {
        // Create table of archives if not exists
        fdb.run(`
          CREATE TABLE IF NOT EXISTS archives (
            id TEXT PRIMARY KEY,
            caseTitle TEXT,
            caseId TEXT,
            fileName TEXT NOT NULL,
            timestamp TEXT,
            sizeBytes INTEGER,
            hash TEXT NOT NULL,
            initialHash TEXT,
            custodian TEXT NOT NULL,
            status TEXT,
            category TEXT,
            description TEXT,
            isVerified INTEGER,
            ownerId TEXT
          )
        `, [], (err) => {
          if (err) {
            console.error('[DB create archives tab fail]', err);
            fdb.close();
            resolve([]);
            return;
          }

          // Fetch all archives
          fdb.all(`SELECT * FROM archives`, [], (err, rows: any[]) => {
            if (err) {
              console.error('[DB SELECT archives fail]', err);
              fdb.close();
              resolve([]);
              return;
            }

            if (!rows || rows.length === 0) {
              const markerPath = path.join(dbDir, '.archives_seeded');
              if (fs.existsSync(markerPath)) {
                fdb.close();
                resolve([]);
                return;
              }

              try {
                fs.writeFileSync(markerPath, '1', 'utf8');
              } catch (writeErr) {
                console.error('[DB Write Archives Seed Marker Fail]', writeErr);
              }

              let seedList = [...DEFAULT_SEED_EVIDENCE];
              const evidenceJsonPath = path.join(dbDir, 'evidence.json');
              if (fs.existsSync(evidenceJsonPath)) {
                try {
                  const raw = fs.readFileSync(evidenceJsonPath, 'utf8');
                  const jsonItems = JSON.parse(raw);
                  if (Array.isArray(jsonItems)) {
                    for (const item of jsonItems) {
                      if (!seedList.find(x => x.id === item.id)) {
                        seedList.push(item);
                      }
                    }
                  }
                } catch (e) {
                  console.warn('[SQLite DB] evidence.json parsing fail, seeding archives with memory codes.', e);
                }
              }

              // Seed from default seed evidence if currently empty
              const stmt = fdb.prepare(`
                INSERT INTO archives (
                  id, caseTitle, caseId, fileName, timestamp, sizeBytes,
                  hash, initialHash, custodian, status, category, description, isVerified, ownerId
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              for (const item of seedList) {
                stmt.run([
                  item.id, item.caseTitle, item.caseId, item.fileName, item.timestamp, item.sizeBytes,
                  item.hash, item.initialHash, item.custodian, item.status, item.category, item.description || '',
                  item.isVerified ? 1 : 0, item.ownerId || 'tanvee.zalera@gmail.com'
                ]);
              }

              stmt.finalize((err) => {
                // Fetch again after seeding
                fdb.all(`SELECT * FROM archives`, [], (err, seededRows: any[]) => {
                  fdb.close();
                  if (err || !seededRows) {
                    resolve([]);
                  } else {
                    attachHandoversToEntries(mapRowsToForensicEntries(seededRows)).then(resolve);
                  }
                });
              });
            } else {
              const markerPath = path.join(dbDir, '.archives_seeded');
              if (!fs.existsSync(markerPath)) {
                try {
                  fs.writeFileSync(markerPath, '1', 'utf8');
                } catch (_) {}
              }
              fdb.close();
              attachHandoversToEntries(mapRowsToForensicEntries(rows)).then(resolve);
            }
          });
        });
      });
    });
  });
}

function mapRowsToForensicEntries(rows: any[]): ForensicEntry[] {
  return rows.map(row => ({
    id: row.id,
    caseTitle: row.caseTitle || '',
    caseId: row.caseId || '',
    fileName: row.fileName,
    timestamp: row.timestamp || '',
    sizeBytes: row.sizeBytes || 0,
    hash: row.hash,
    initialHash: row.initialHash || row.hash,
    custodian: row.custodian || 'Tanvee Zakera',
    status: row.status || 'Secure',
    category: row.category || '',
    description: row.description || '',
    isVerified: row.isVerified === 1 || row.isVerified === true,
    ownerId: row.ownerId || 'tanvee.zalera@gmail.com',
    handovers: []
  }));
}

async function attachHandoversToEntries(entries: ForensicEntry[]): Promise<ForensicEntry[]> {
  if (useJsonDb) {
    const data = readJsonDbFile();
    const handovers = data.handovers || [];
    return entries.map(entry => {
      const entryHandovers = handovers
        .filter((h: any) => h.evidenceId === entry.id)
        .map((h: any) => ({
          from: h.fromCustodian || h.from || '',
          to: h.toCustodian || h.to || '',
          timestamp: h.timestamp || '',
          reason: h.reason || ''
        }));
      return {
        ...entry,
        handovers: entryHandovers
      };
    });
  }

  try {
    const allHandovers = await allSql<{ evidenceId: string; fromCustodian: string; toCustodian: string; timestamp: string; reason: string }>(
      `SELECT * FROM handovers`
    );
    return entries.map(entry => {
      const entryHandovers = allHandovers
        .filter(h => h.evidenceId === entry.id)
        .map(h => ({
          from: h.fromCustodian || '',
          to: h.toCustodian || '',
          timestamp: h.timestamp || '',
          reason: h.reason || ''
        }));
      return {
        ...entry,
        handovers: entryHandovers
      };
    });
  } catch (err) {
    console.error('[SQLite attachHandoversToEntries fail]', err);
    return entries;
  }
}

/**
 * Inserts directly into absolute forensics.db / archives table
 */
export async function insertIntoAbsoluteArchives(item: ForensicEntry): Promise<void> {
  try {
    const sqlite = await getSqlite();

    const fdb = await new Promise<any>((resolve, reject) => {
      const conn = new sqlite.Database(forensicsDbPath, (err: Error | null) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise<void>((resolve, reject) => {
      fdb.run(`
        CREATE TABLE IF NOT EXISTS archives (
          id TEXT PRIMARY KEY,
          caseTitle TEXT,
          caseId TEXT,
          fileName TEXT NOT NULL,
          timestamp TEXT,
          sizeBytes INTEGER,
          hash TEXT NOT NULL,
          initialHash TEXT,
          custodian TEXT NOT NULL,
          status TEXT,
          category TEXT,
          description TEXT,
          isVerified INTEGER,
          ownerId TEXT
        )
      `, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      fdb.run(`
        INSERT OR REPLACE INTO archives (
          id, caseTitle, caseId, fileName, timestamp, sizeBytes,
          hash, initialHash, custodian, status, category, description, isVerified, ownerId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id, item.caseTitle, item.caseId, item.fileName, item.timestamp, item.sizeBytes,
        item.hash, item.initialHash, item.custodian, item.status, item.category, item.description || '',
        item.isVerified ? 1 : 0, item.ownerId || 'tanvee.zalera@gmail.com'
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      fdb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('[SQLite forensics.db] Inserted/Replaced item into absolute archives table successfully:', item.id);
  } catch (err) {
    console.error('[SQLite forensics.db Fail to insert archives]', err);
  }
}

/**
 * Updates directly in absolute forensics.db / archives table
 */
export async function updateAbsoluteArchives(id: string, updatedFields: Partial<ForensicEntry>): Promise<void> {
  try {
    const sqlite = await getSqlite();

    const fdb = await new Promise<any>((resolve, reject) => {
      const conn = new sqlite.Database(forensicsDbPath, (err: Error | null) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    const allowedFields: (keyof ForensicEntry)[] = [
      'caseTitle', 'caseId', 'fileName', 'timestamp', 'sizeBytes',
      'hash', 'initialHash', 'custodian', 'status', 'category', 'description', 'isVerified', 'ownerId'
    ];

    for (const field of allowedFields) {
      if (updatedFields[field] !== undefined) {
        fieldsToUpdate.push(`${field} = ?`);
        if (field === 'isVerified') {
          values.push(updatedFields[field] ? 1 : 0);
        } else {
          values.push(updatedFields[field]);
        }
      }
    }

    if (fieldsToUpdate.length > 0) {
      values.push(id);
      await new Promise<void>((resolve, reject) => {
        fdb.run(`UPDATE archives SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, values, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    await new Promise<void>((resolve, reject) => {
      fdb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('[SQLite forensics.db] Updated absolute archives successfully:', id);
  } catch (err) {
    console.error('[SQLite forensics.db Fail to update archives]', err);
  }
}

/**
 * Inserts list item directly to schema
 */
export async function insertEvidence(item: ForensicEntry): Promise<boolean> {
  // Always write to forensics.db archives table as requested
  await insertIntoAbsoluteArchives(item);

  if (useJsonDb) {
    const data = readJsonDbFile();
    const existing = data.evidence.find(e => e.id === item.id);
    if (existing) return false;
    data.evidence.push(item);
    writeJsonDbFile();
    return true;
  }

  try {
    const existing = await getSql(`SELECT id FROM evidence WHERE id = ?`, [item.id]);
    if (existing) {
      return false;
    }

    await runSql(`
      INSERT INTO evidence (
        id, caseTitle, caseId, fileName, timestamp, sizeBytes,
        hash, initialHash, custodian, status, category, description, isVerified, ownerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      item.id, item.caseTitle, item.caseId, item.fileName, item.timestamp, item.sizeBytes,
      item.hash, item.initialHash, item.custodian, item.status, item.category, item.description || '',
      item.isVerified ? 1 : 0, item.ownerId || 'tanvee.zalera@gmail.com'
    ]);

    if (item.handovers && Array.isArray(item.handovers)) {
      for (const h of item.handovers) {
        await runSql(`
          INSERT INTO handovers (evidenceId, fromCustodian, toCustodian, timestamp, reason)
          VALUES (?, ?, ?, ?, ?)
        `, [item.id, h.from, h.to, h.timestamp, h.reason]);
      }
    }
    return true;
  } catch (err) {
    console.error('[DB insertEvidence Fail]', err);
    return false;
  }
}

/**
 * Updates field updates or records new handovers directly
 */
export async function updateEvidence(id: string, updatedFields: Partial<ForensicEntry>): Promise<boolean> {
  // Always update absolute archives table in forensics.db as well
  await updateAbsoluteArchives(id, updatedFields);

  if (useJsonDb) {
    const data = readJsonDbFile();
    const itemIndex = data.evidence.findIndex(e => e.id === id);
    if (itemIndex === -1) return false;
    
    const currentItem = data.evidence[itemIndex];
    const newHandovers = updatedFields.handovers !== undefined ? updatedFields.handovers : currentItem.handovers;
    
    data.evidence[itemIndex] = {
      ...currentItem,
      ...updatedFields,
      handovers: newHandovers
    };
    writeJsonDbFile();
    return true;
  }

  try {
    const existing = await getSql(`SELECT id FROM evidence WHERE id = ?`, [id]);
    if (!existing) {
      return false;
    }

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    const allowedFields: (keyof ForensicEntry)[] = [
      'caseTitle', 'caseId', 'fileName', 'timestamp', 'sizeBytes',
      'hash', 'initialHash', 'custodian', 'status', 'category', 'description', 'isVerified'
    ];

    for (const field of allowedFields) {
      if (updatedFields[field] !== undefined) {
        fieldsToUpdate.push(`${field} = ?`);
        if (field === 'isVerified') {
          values.push(updatedFields[field] ? 1 : 0);
        } else {
          values.push(updatedFields[field]);
        }
      }
    }

    if (fieldsToUpdate.length > 0) {
      values.push(id);
      await runSql(`UPDATE evidence SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, values);
    }

    if (updatedFields.handovers && Array.isArray(updatedFields.handovers)) {
      await runSql(`DELETE FROM handovers WHERE evidenceId = ?`, [id]);
      for (const h of updatedFields.handovers) {
        await runSql(`
          INSERT INTO handovers (evidenceId, fromCustodian, toCustodian, timestamp, reason)
          VALUES (?, ?, ?, ?, ?)
        `, [id, h.from, h.to, h.timestamp, h.reason]);
      }
    }

    return true;
  } catch (err) {
    console.error('[DB updateEvidence Fail]', err);
    return false;
  }
}

/**
 * Deletes specific archival evidence row
 */
export async function deleteEvidence(id: string): Promise<boolean> {
  const sqlite = await getSqlite();

  try {
    const fdb = await new Promise<any>((resolve, reject) => {
      const conn = new sqlite.Database(forensicsDbPath, (err) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise<void>((resolve, reject) => {
      fdb.run(`DELETE FROM archives WHERE id = ?`, [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      fdb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err) {
    console.error('[SQLite forensics.db Fail to delete archive]', err);
  }

  if (useJsonDb) {
    const data = readJsonDbFile();
    const itemIndex = data.evidence.findIndex(e => e.id === id);
    if (itemIndex !== -1) {
      data.evidence.splice(itemIndex, 1);
    }
    if (data.handovers) {
      data.handovers = data.handovers.filter((h: any) => h.evidenceId !== id || h.id !== id);
    }
    writeJsonDbFile();
    return true;
  }

  try {
    await runSql(`DELETE FROM handovers WHERE evidenceId = ?`, [id]);
    await runSql(`DELETE FROM evidence WHERE id = ?`, [id]);
    return true;
  } catch (err) {
    console.error('[DB deleteEvidence Fail]', err);
    return false;
  }
}

/**
 * Deletes all archival evidence rows (global database purge)
 */
export async function deleteAllEvidence(): Promise<boolean> {
  const sqlite = await getSqlite();

  try {
    const fdb = await new Promise<any>((resolve, reject) => {
      const conn = new sqlite.Database(forensicsDbPath, (err) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    await new Promise<void>((resolve, reject) => {
      fdb.run(`DELETE FROM archives`, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      fdb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err) {
    console.error('[SQLite forensics.db Fail to delete all archives]', err);
  }

  if (useJsonDb) {
    const data = readJsonDbFile();
    data.evidence = [];
    data.handovers = [];
    writeJsonDbFile();
    return true;
  }

  try {
    await runSql(`DELETE FROM handovers`);
    await runSql(`DELETE FROM evidence`);
    return true;
  } catch (err) {
    console.error('[DB deleteAllEvidence Fail]', err);
    return false;
  }
}
