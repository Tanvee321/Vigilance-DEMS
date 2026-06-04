/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import sqlite3Pkg from 'sqlite3';
const sqlite3 = (sqlite3Pkg as any).default ? (sqlite3Pkg as any).default.verbose() : (sqlite3Pkg as any).verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HARDEN DOTENV ROUTING: configure dotenv with dynamic search checking multiple locations
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

import { 
  readAllEvidence, 
  insertEvidence, 
  updateEvidence, 
  readAllUsers, 
  registerUser, 
  resetUserPassword, 
  initDb,
  deleteEvidence,
  deleteAllEvidence,
  getSqlite
} from './db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite databases & tables before serving routes
  await initDb();

  // 1. Standard CORS Middleware Setup
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-user-id, x-user-email');
    
    // Intercept OPTIONS method
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // 2. Body Parser Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper to intercept incoming user session identifier
  const getSessionUser = (req: express.Request): string => {
    const headerUser = req.headers['x-user-id'] || req.headers['x-user-email'];
    if (headerUser && typeof headerUser === 'string') {
      return headerUser.trim().toLowerCase();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim().toLowerCase();
    }
    return 'tanvee.zalera@gmail.com'; // Default user session fallback
  };

  // --- CRYPTOGRAPHIC AUTH SECURITY ROUTES ---
  // Registration router
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'A VALID INVESTIGATOR ID / EMAIL IS REQUIRED.' });
      }
      const pass = (password || '').trim();
      const hasUpper = /[A-Z]/.test(pass);
      const hasLower = /[a-z]/.test(pass);
      const hasDigit = /[0-9]/.test(pass);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass);

      if (pass.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        return res.status(400).json({
          error: 'WEAK KEY VECTOR: Passphrase must be min 8 characters with uppercase, lowercase, number, and special character.'
        });
      }

      const verifiedEmail = email.trim().toLowerCase();
      const currentDbPath = process.env.DATABASE_URL || path.join(os.tmpdir(), 'forensics.db');
      const conn = new sqlite3.Database(currentDbPath);

      conn.get("SELECT email FROM users WHERE email = ?", [verifiedEmail], (err, row) => {
        if (err) {
          conn.close();
          return res.status(500).json({ error: err.message });
        }
        if (row) {
          conn.close();
          return res.status(409).json({ error: 'INVESTIGATOR EMAIL ALREADY ASSOCIATED WITH AN ACTIVE NODE.' });
        }

        conn.run("INSERT INTO users (email, password) VALUES (?, ?)", [verifiedEmail, pass], (insertErr) => {
          conn.close();
          if (insertErr) {
            return res.status(500).json({ error: insertErr.message });
          }
          return res.json({
            success: true,
            email: verifiedEmail,
            message: 'Node Account Registered. Isolated forensic workspace created.'
          });
        });
      });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // Login verification router
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const expectedGlobalPassword = (process.env.INVESTIGATOR_PASSWORD || 'Vigilance2026').trim();

      if (!password) {
        return res.status(400).json({ error: 'PASSKEY IS REQUIRED.' });
      }

      const inputEmail = (email || 'tanvee.zalera@gmail.com').trim().toLowerCase();
      const inputPass = password.trim();

      const currentDbPath = process.env.DATABASE_URL || path.join(os.tmpdir(), 'forensics.db');
      const conn = new sqlite3.Database(currentDbPath);

      conn.get("SELECT email, password FROM users WHERE email = ?", [inputEmail], (err, row: any) => {
        conn.close();
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        let dbPassword = expectedGlobalPassword;
        if (row) {
          dbPassword = row.password;
        }

        const isMatch = (inputPass === dbPassword);

        if (isMatch) {
          return res.json({ 
            success: true, 
            email: inputEmail,
            message: 'Access Granted. Sovereign decryption token generated.' 
          });
        } else {
          return res.status(401).json({ error: 'CRITICAL SECURITY BREACH: PASSPHRASE DEFRAG MISMATCH.' });
        }
      });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // Forgot password endpoint with secure SMTP email dispatcher - 6-digit out-of-band token loop
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'A VALID INVESTIGATOR ID / EMAIL IS REQUIRED.' });
      }

      const verifiedEmail = email.trim().toLowerCase();
      
      // If a password is provided, reset validation and update user database
      if (password !== undefined) {
        const pass = (password || '').trim();
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasDigit = /[0-9]/.test(pass);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass);

        if (pass.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
          return res.status(400).json({
            error: 'WEAK KEY VECTOR: Passphrase must be min 8 characters with uppercase, lowercase, number, and special character.'
          });
        }

        const resetSuccess = await resetUserPassword(verifiedEmail, pass);
        if (resetSuccess) {
          return res.json({
            success: true,
            email: verifiedEmail,
            passcode: pass,
            message: 'SOVEREIGN LEDGER PASSWORD SUCCESSFULLY RESET. NEW LOGIN ACTIVE.'
          });
        } else {
          return res.status(444).json({
            error: 'INVESTIGATOR EMAIL NOT REGISTERED IN ACTIVE NODES.'
          });
        }
      }
      
      // SERVER GENERATION: cryptographically random 6-digit validation code
      const generatedCode = crypto.randomInt(100000, 999999).toString();

      // Check if SMTP credentials are fully provided
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      let emailSent = false;
      let statusDetails = '';

      if (smtpHost && smtpUser && smtpPass) {
        try {
          const nodemailer = await import('nodemailer');
          const createTransportFn = (nodemailer as any).createTransport || (nodemailer as any).default?.createTransport;
          if (!createTransportFn) {
            throw new Error('Nodemailer createTransport method is not accessible.');
          }
          const transporter = createTransportFn({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465, // true for 465, false for other ports
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          const mailOptions = {
            from: `"Vigilance DEMS Secure Ledger" <${smtpUser}>`,
            to: verifiedEmail,
            subject: '🚨 CORE INCIDENT AUDIT: Password Reset Token Generated',
            html: `
              <div style="font-family: monospace; padding: 24px; background-color: #06080c; color: #c5c6cd; border: 1px solid #fe4a49; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                <div style="border-bottom: 2px solid #fe4a49; padding-bottom: 12px; margin-bottom: 20px;">
                  <h2 style="color: #fe4a49; margin: 0; font-size: 16px; letter-spacing: 2px;">🚨 CORE INCIDENT SECURITY AUDIT</h2>
                  <p style="font-size: 10px; color: #888; margin: 4px 0 0 0; text-transform: uppercase;">OUT-OF-BAND SECURITY TRANSMISSION</p>
                </div>
                
                <p style="font-size: 12px; line-height: 1.6;">A password reset sequence was initiated on terminal node for user: <strong>${verifiedEmail}</strong>.</p>
                
                <div style="background-color: #0b0e14; border: 1px dashed #fe4a49; padding: 16px; border-radius: 4px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 9px; color: #fe4a49; letter-spacing: 1px; display: block; margin-bottom: 8px; text-transform: uppercase;">Emergency 6-Digit Node Override Token</span>
                  <strong style="font-size: 26px; color: #ffffff; letter-spacing: 4px; font-family: monospace; text-shadow: 0 0 10px rgba(254,74,73,0.3);">${generatedCode}</strong>
                </div>
                
                <p style="font-size: 11px; color: #c5c6cd; line-height: 1.5;">Please convey this secure token to the authorized terminal operator resetting their account passkey. Absolute session confidentiality must be maintained.</p>
                
                <p style="font-size: 10px; color: #fe4a49; margin-top: 24px;">⛔ CONFIDENTIALITY CLAUSE: Under sovereign directive, do NOT expose this system override vector to unauthorized networks.</p>
                
                <div style="border-top: 1px solid #232b3c; padding-top: 12px; margin-top: 24px; font-size: 9px; color: #666; display: flex; justify-content: space-between;">
                  <span>SYSTEM: OUT-OF-BAND ESCROW DECK</span>
                  <span>CLOCK: ${new Date().toUTCString()}</span>
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
          statusDetails = 'Successfully transmitted via configured secure Mailtrap SMTP mail server.';
        } catch (mailErr) {
          console.error('[SMTP EMAIL DISPATCH FAILURE]', mailErr);
          statusDetails = 'SMTP dispatch failed: ' + (mailErr as Error).message;
        }
      } else {
        statusDetails = 'SMTP parameters undefined in system environment variables (.env files). Recovery triggered in safe logs fallback.';
      }

      // Always log password safely to server console logs for robust developers
      console.log(`\n======================================================`);
      console.log(` [🚨 CORE INCIDENT PASSWORD RESET DISPATCH]`);
      console.log(` Target Requester Email:      ${verifiedEmail}`);
      console.log(` Generated 6-Digit Code:      ${generatedCode}`);
      console.log(` SMTP Dispatch Status:        ${emailSent ? 'DISPATCHED' : 'FALLBACK LOGGING ACTIVE'}`);
      console.log(` Status Log Details:          ${statusDetails}`);
      console.log(`======================================================\n`);

      return res.json({
        success: true,
        emailSent,
        recipient: verifiedEmail,
        statusDetails,
        token: generatedCode, // return token directly for seamless client-side out-of-band validation verification
        message: emailSent 
          ? `Sovereign emergency token dispatched directly to your out-of-band communication logs.`
          : `Recovery token processed! Since Mailtrap is not fully configured, the override token is logged below:`
      });

    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // 3. API Endpoints
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'nominal',
      timestamp: new Date().toISOString(),
      service: 'Sovereign Sentinel Integrity Engine',
      coprocessor: 'Online (AVX-512 Emulated Threads)',
      uptime: Math.floor(process.uptime()) + 's'
    });
  });

  // Evidence Ledger API Data Controllers
  // Fetch all forensic entries
  app.get('/api/evidence', async (req, res) => {
    try {
      const user = getSessionUser(req);
      const items = await readAllEvidence();
      const filtered = items.filter(entry => entry.ownerId && entry.ownerId.toLowerCase() === user);
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // RESTful API endpoints for system archives
  // Search archival items by ID, filename, or case title
  app.get('/api/archives/search', async (req, res) => {
    try {
      const q = req.query.q;
      const user = getSessionUser(req);
      const allEv = await readAllEvidence();
      const items = allEv.filter(entry => entry.ownerId && entry.ownerId.toLowerCase() === user);
      if (!q || typeof q !== 'string') {
        res.json(items);
        return;
      }
      const token = q.toLowerCase().trim();
      const filtered = items.filter(entry => 
        (entry.id && entry.id.toLowerCase().includes(token)) ||
        (entry.caseTitle && entry.caseTitle.toLowerCase().includes(token)) ||
        (entry.fileName && entry.fileName.toLowerCase().includes(token))
      );
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Fetch all archival logs
  app.get('/api/archives', async (req, res) => {
    try {
      const user = getSessionUser(req);
      const items = await readAllEvidence();
      const filtered = items.filter(entry => entry.ownerId && entry.ownerId.toLowerCase() === user);
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Query specific archival item by ID
  app.get('/api/archives/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = getSessionUser(req);
      const items = await readAllEvidence();
      const item = items.find(entry => entry.id === id && entry.ownerId && entry.ownerId.toLowerCase() === user);
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ error: `Archival record ${id} not found in user system registers.` });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Helper to construct a unified ForensicEntry from either JSON or Multipart body
  const createForensicItemFromReq = (req: express.Request): any => {
    const body = req.body || {};
    const id = body.id;
    const fileName = body.fileName || (req.file ? req.file.originalname : 'unknown_evidence.raw');
    const hash = body.hash;
    const initialHash = body.initialHash || hash;
    const status = body.status || 'Secure';
    const category = body.category || 'Disk Image';
    const caseId = body.caseId || 'CASE-882';
    const caseTitle = body.caseTitle || 'Operation Cipher Rest';
    const description = body.description || 'Formal ingest logged securely through Sentinel Local Cryptographic module. Verified secure anchor.';
    const sizeBytes = body.sizeBytes ? parseInt(body.sizeBytes, 10) : (req.file ? req.file.size : 24890000);
    const timestamp = body.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const ownerId = getSessionUser(req) || body.ownerId || 'tanvee.zalera@gmail.com';
    const emailPrefix = ownerId.split('@')[0];
    const dynamicName = emailPrefix
      .split(/[\._\-]/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Tanvee Zakera';

    return {
      id,
      caseTitle,
      caseId,
      fileName,
      timestamp,
      sizeBytes,
      hash,
      initialHash,
      custodian: dynamicName,
      investigator: dynamicName,
      status,
      category,
      description,
      isVerified: status === 'Secure',
      handovers: [],
      ownerId
    };
  };

  // Formally ingest a new forensic entry
  app.post('/api/evidence', async (req, res) => {
    try {
      const defaultItem = createForensicItemFromReq(req);
      if (!defaultItem.id || !defaultItem.fileName || !defaultItem.hash) {
        res.status(400).json({ error: 'Payload requires id, fileName, and hash strings.' });
        return;
      }

      const success = await insertEvidence(defaultItem);
      if (success) {
        res.status(201).json({ success: true, item: defaultItem });
      } else {
        res.status(409).json({ error: 'Forensic evidence with this ID already exists.' });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Alias upload endpoint as requested by user
  app.post('/api/upload', async (req, res) => {
    try {
      const { filename, filesize, hash, leadCustodian, category } = req.body;

      if (!filename || !hash || !leadCustodian) {
        return res.status(400).json({ error: 'Payload requires filename, hash, and leadCustodian.' });
      }

      const sqlite = await getSqlite();
      const forensicsDbPath = process.env.DATABASE_URL || path.join(os.tmpdir(), 'forensics.db');
      const db = new sqlite.Database(forensicsDbPath);

      // Find next available EVD-2026 ID
      const allRows = await new Promise<any[]>((resolve, reject) => {
        db.all("SELECT id FROM archives", [], (err, rows) => {
          if (err) resolve([]);
          else resolve(rows || []);
        });
      });

      const ids = allRows.map((row: any) => {
        const parts = (row.id || '').split('-');
        const lastPart = parts[parts.length - 1];
        const numMatch = lastPart ? lastPart.match(/\d+/) : null;
        return numMatch ? parseInt(numMatch[0], 10) : 0;
      });
      const nextNum = (ids.length > 0 ? Math.max(...ids) : 2) + 1;
      const newId = `EVD-2026-0${nextNum}`;

      const currentOwner = getSessionUser(req) || 'tanvee.zalera@gmail.com';
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const caseTitle = 'Operation Cipher Rest';
      const caseId = 'CASE-882';
      const status = 'Secure';
      const itemCategory = category || 'Disk Image';
      const description = 'Formal ingest logged securely through Sentinel Local Cryptographic module. Verified secure anchor.';
      const isVerified = 1;

      await new Promise<void>((resolve, reject) => {
        db.run(`
          INSERT INTO archives (
            id, caseTitle, caseId, fileName, timestamp, sizeBytes,
            hash, initialHash, custodian, status, category, description, isVerified, ownerId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newId, caseTitle, caseId, filename, timestamp, filesize ? parseInt(String(filesize), 10) : 0,
          hash, hash, leadCustodian, status, itemCategory, description, isVerified, currentOwner
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        db.run(`
          INSERT INTO evidence (
            id, caseTitle, caseId, fileName, timestamp, sizeBytes,
            hash, initialHash, custodian, status, category, description, isVerified, ownerId
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newId, caseTitle, caseId, filename, timestamp, filesize ? parseInt(String(filesize), 10) : 0,
          hash, hash, leadCustodian, status, itemCategory, description, isVerified, currentOwner
        ], (err) => {
          resolve(); // Ignore if already exists, but populate evidence table to stay perfectly in sync
        });
      });

      db.close();

      return res.status(200).json({ success: true, id: newId });
    } catch (err) {
      console.error('[API upload Fail]', err);
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // Update validation fields or append custody timeline routes
  app.put('/api/evidence/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedFields = req.body;
      const user = getSessionUser(req);

      const items = await readAllEvidence();
      const item = items.find(entry => entry.id === id);
      if (!item) {
        res.status(404).json({ error: 'Evidence record not found in system registers.' });
        return;
      }

      if (item.ownerId && item.ownerId.toLowerCase() !== user) {
        res.status(403).json({ error: 'Access Denied: You do not own this forensic archival.' });
        return;
      }
      
      const success = await updateEvidence(id, updatedFields);
      if (success) {
        res.json({ success: true, message: `Evidence ${id} updated successfully.` });
      } else {
        res.status(404).json({ error: 'Evidence record not found in system registers.' });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Global Database Purge (wipe-all)
  app.delete('/api/evidence/wipe-all', async (req, res) => {
    try {
      // Clear with general db.ts cleanup
      await deleteAllEvidence();

      const forensicsDbPath = process.env.DATABASE_URL || path.join(os.tmpdir(), 'forensics.db');
      const sqlite = await getSqlite();
      const db = new sqlite.Database(forensicsDbPath);

      db.run("DELETE FROM archives", [], function(err: any) {
        if (err) {
          console.error('[SQLite DB] Wipe error:', err);
          db.close();
          return res.status(500).json({ error: err.message });
        }
        console.log('[SQLite DB] GLOBAL WIPE SUCCESS: Removed all row assets from disk memory.');
        db.close();
        return res.json({ success: true, message: 'All records purged recursively.' });
      });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // Global Database Purge (legacy wrapper fallback)
  app.delete('/api/evidence', async (req, res) => {
    try {
      await deleteAllEvidence();

      const forensicsDbPath = process.env.DATABASE_URL || path.join(os.tmpdir(), 'forensics.db');
      const sqlite = await getSqlite();
      const db = new sqlite.Database(forensicsDbPath);

      db.run("DELETE FROM archives", [], function(err: any) {
        if (err) {
          console.error('[SQLite DB] Purge error:', err);
          db.close();
          return res.status(500).json({ error: err.message });
        }
        db.close();
        return res.json({ success: true, message: 'All records purged recursively.' });
      });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // Individual Row Deletion
  app.delete('/api/evidence/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = getSessionUser(req);

      const items = await readAllEvidence();
      const item = items.find(entry => entry.id === id);
      if (!item) {
        return res.status(404).json({ error: 'Evidence record not found in system registers.' });
      }

      if (item.ownerId && item.ownerId.toLowerCase() !== user) {
        return res.status(403).json({ error: 'Access Denied: You do not own this forensic archival.' });
      }

      // Also call database cleanup from db.ts first to keep sentinel.sqlite in sync
      await deleteEvidence(id);

      const forensicsDbPath = process.env.DATABASE_URL || path.join(os.tmpdir(), 'forensics.db');
      const sqlite = await getSqlite();
      const db = new sqlite.Database(forensicsDbPath);

      db.run("DELETE FROM archives WHERE id = ?", [req.params.id], function(err: any) {
        if (err) {
          console.error('[SQLite DB] Deletion error:', err);
          db.close();
          return res.status(500).json({ error: err.message });
        }
        console.log('[SQLite DB] HARD DELETE SUCCESS: Removed row asset from disk memory.');
        db.close();
        return res.json({ success: true, message: `Evidence ${id} deleted cleanly.` });
      });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // Server-side SHA-256 calculator to showcase full-stack integration
  app.post('/api/hash-calculate', (req, res) => {
    try {
      const { data } = req.body;
      if (typeof data !== 'string') {
        res.status(400).json({ error: 'Payload data must be a string parameter.' });
        return;
      }

      const hash = crypto.createHash('sha256').update(data).digest('hex');
      res.json({
        algorithm: 'SHA-256',
        inputLength: data.length,
        hash: hash,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 4. Vite Ingress / Static SPA Files router serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 5. Port Listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FULL-STACK CORE] Server successfully initialized`);
    console.log(`[NETWORK PORT] Local server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[CRITICAL SEVERE STARTUP FAILURE]', error);
  process.exit(1);
});
