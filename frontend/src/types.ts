/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScreenView = 'dashboard' | 'archive' | 'forensics' | 'audit' | 'settings';

export interface EvidenceItem {
  id: string;
  fileName: string;
  hash: string;
  initialHash: string; // The "ingestion fingerprint" representing the golden standard
  custodian: string;
  status: 'Secure' | 'Tampered' | 'Analyzing';
  category: string;
  caseId: string;
  investigator: string;
  sizeBytes: number;
  timestamp: string; // ISO date string or UTC format
  description?: string;
  handovers?: HandoverEvent[];
  ownerId?: string;
}

export interface HandoverEvent {
  from: string;
  to: string;
  timestamp: string;
  reason: string;
}

export interface AuditLogEvent {
  timestamp: string;
  investigatorId: string;
  action: string;
  targetId: string;
  status: 'VERIFIED' | 'TAMPER_DETECTED' | 'WARNING';
}

export interface MasterStreamLog {
  timestamp: string;
  type: string;
  text: string;
  isError?: boolean;
  isSuccess?: boolean;
}

