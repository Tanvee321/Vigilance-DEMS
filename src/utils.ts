/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EvidenceItem, AuditLogEvent } from './types';

/**
 * Computes SHA-256 hash string natively using browser Web Crypto API
 */
export async function calculateSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Formats file size in human readable layout
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * High-fidelity seeded database of evidence items representing Vigilance DEMS archive
 */
export const INITIAL_EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'EVD-2023-081',
    fileName: 'CCTV_Lobby_Main.mp4',
    hash: 'ff79a83d4e9c12b8d9ae01bc891f912b321ab982cc231145fab0c2429482912b',
    initialHash: 'ff79a83d4e9c12b8d9ae01bc891f912b321ab982cc231145fab0c2429482912b',
    custodian: 'Det. Miller',
    status: 'Secure',
    category: 'Disk Image (Forensic Level)',
    caseId: 'SEC-4421-ARC',
    investigator: 'Det. Miller',
    sizeBytes: 124500000,
    timestamp: '2023-11-24 14:02:11',
    description: 'Main lobby high-resolution camera stream during suspect entry incident.',
    handovers: [
      { from: 'Uplink Recv', to: 'Det. Miller', timestamp: '2023-11-23 09:15:44', reason: 'Initial ingestion' }
    ]
  },
  {
    id: 'EVD-2023-082',
    fileName: 'Audio_Interview_04.wav',
    hash: '8d2c0df2a31490212cddee44ea0923f11bcad8767931aa00ff228bcddc4544ea',
    initialHash: '8d2c0df2a31490212cddee44ea0923f11bcad8767931aa00ff228bcddc4544ea',
    custodian: 'Sgt. Barnes',
    status: 'Secure',
    category: 'Logical File Collection',
    caseId: 'SEC-1102-ARC',
    investigator: 'Sgt. Barnes',
    sizeBytes: 8145000,
    timestamp: '2023-11-24 13:45:02',
    description: 'Interrogation room interview recording with key witness.',
    handovers: [
      { from: 'Rec Center', to: 'Sgt. Barnes', timestamp: '2023-11-23 10:10:00', reason: 'Transfer file' }
    ]
  },
  {
    id: 'EVD-2023-083',
    fileName: 'Smartphone_Dump_Full.zip',
    hash: 'deadbeef91f0ade3bc44efaa11234901ce21de82ac3a8fb21d9ae01ffde2177c',
    initialHash: '91f0ade3bc44efaa11234901ce21de82ac3a8fb21d9ae1d03da0a0a0ade2177c', // Intentionally mismatched to show compromised state
    custodian: 'Tech. Chen',
    status: 'Tampered',
    category: 'Volatile Memory Dumps',
    caseId: 'SEC-8023-ARC',
    investigator: 'Tech. Chen',
    sizeBytes: 50123901,
    timestamp: '2023-11-24 13:58:44',
    description: 'Physical extractions from Android device serial #99182A.',
    handovers: [
      { from: 'Field Custodian', to: 'Tech. Chen', timestamp: '2023-11-23 12:44:00', reason: 'Dumping block partitions' }
    ]
  },
  {
    id: 'EVD-2023-084',
    fileName: 'Dashcam_Unit_202.mp4',
    hash: '33b1aa989fb1a90c2cddee8ac2903ab321d89ea01caec8f71aa90deae83aa98b',
    initialHash: '33b1aa989fb1a90c2cddee8ac2903ab321d89ea01caec8f71aa90deae83aa98b',
    custodian: 'Det. Miller',
    status: 'Secure',
    category: 'Disk Image (Forensic Level)',
    caseId: 'SEC-4421-ARC',
    investigator: 'Det. Miller',
    sizeBytes: 23901240,
    timestamp: '2023-11-24 13:30:11',
    description: 'Dash camera footage detailing speed contest observation.',
    handovers: []
  },
  {
    id: 'EVD-2023-085',
    fileName: 'Forensic_Image_SATA0.raw',
    hash: 'cc02ef1240b912c2a0d9ae38c117e0129bcad0921a8fb1cfa20eeefff711c9ea',
    initialHash: 'cc02ef1240b912c2a0d9ae38c117e0129bcad0921a8fb1cfa20eeefff711c9ea',
    custodian: 'Lab_Main_01',
    status: 'Secure',
    category: 'Logical File Collection',
    caseId: 'SEC-8025-ARC',
    investigator: 'Lab_Main_01',
    sizeBytes: 293810240,
    timestamp: '2023-11-24 12:12:09',
    description: 'Raw sector replica from seized target harddrive serial #SN99281.',
    handovers: []
  }
];

/**
 * Initial chronological ledger events for the Audit logs table
 */
export const INITIAL_AUDIT_LOG_EVENTS: AuditLogEvent[] = [
  {
    timestamp: '2023-11-24 14:02:11.492',
    investigatorId: 'INV-8821-X',
    action: 'Inbound File Ingestion',
    targetId: '#TRX-9920-BA-01',
    status: 'VERIFIED'
  },
  {
    timestamp: '2023-11-24 13:58:44.201',
    investigatorId: 'SYS-AUTO-CHK',
    action: 'Integrity Check Failed',
    targetId: '#TRX-8142-CC-99',
    status: 'TAMPER_DETECTED'
  },
  {
    timestamp: '2023-11-24 13:45:02.118',
    investigatorId: 'INV-7742-Q',
    action: 'Custody Handover Approved',
    targetId: '#TRX-0012-ZZ-44',
    status: 'VERIFIED'
  },
  {
    timestamp: '2023-11-24 13:30:11.884',
    investigatorId: 'INV-8821-X',
    action: 'Evidence Ingestion Registered',
    targetId: '#TRX-5512-AB-22',
    status: 'VERIFIED'
  },
  {
    timestamp: '2023-11-24 12:12:09.003',
    investigatorId: 'SYS-AUTO-CHK',
    action: 'Integrity Check Failed',
    targetId: '#TRX-7761-MM-02',
    status: 'TAMPER_DETECTED'
  },
  {
    timestamp: '2023-11-24 11:55:00.672',
    investigatorId: 'INV-1002-K',
    action: 'Access Credential Refresh',
    targetId: '#USR-1002-ADMIN',
    status: 'VERIFIED'
  },
  {
    timestamp: '2026-06-01 17:33:50.000',
    investigatorId: 'L5-MILLER',
    action: 'Command Center Session Init',
    targetId: '#NODE-SENTINEL-01',
    status: 'VERIFIED'
  }
];
