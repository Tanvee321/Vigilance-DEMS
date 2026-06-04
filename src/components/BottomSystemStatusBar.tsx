/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EvidenceItem } from '../types';

interface BottomSystemStatusBarProps {
  evidenceItems: EvidenceItem[];
  selectedVerificationTargetId: string;
  openCustomOverlay: (
    type: string,
    title: string,
    message: string,
    details?: { label: string; value: string }[],
    icon?: string,
    badge?: string,
    isError?: boolean,
    primaryAction?: { label: string; onClick: () => void }
  ) => void;
  hasTamperAlarmTriggered: boolean;
  setHasTamperAlarmTriggered: (triggered: boolean) => void;
  setTestResult: (result: any) => void;
}

export const BottomSystemStatusBar: React.FC<BottomSystemStatusBarProps> = ({
  evidenceItems,
  selectedVerificationTargetId,
  openCustomOverlay,
  hasTamperAlarmTriggered,
  setHasTamperAlarmTriggered,
  setTestResult,
}) => {
  return (
    <footer className="h-20 bg-[#020c1b]/95 border-t border-outline-variant/30 px-8 flex items-center justify-between z-40 shadow-inner select-none shrink-0">
      <div className="flex items-center gap-6 text-xs font-sans">
        <div className="flex flex-col">
          <span className="font-label-caps text-[9px] text-[#c5c6cd]/60 uppercase tracking-widest font-bold">Sovereign Mainnet Socket</span>
          <div className="flex items-center gap-1 text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            <span className="font-data-mono font-bold tracking-wider uppercase">Local Cryptographic Coprocessor Synchronized</span>
          </div>
        </div>
        
        <div className="hidden sm:block h-10 w-[1px] bg-outline-variant/30" />
        
        <div className="hidden sm:flex flex-col">
          <span className="font-label-caps text-[9px] text-[#c5c6cd]/60 uppercase tracking-widest font-bold">Selected Archive Unit</span>
          <span className="font-data-mono text-primary font-bold">
            {evidenceItems.find(i => i.id === selectedVerificationTargetId)?.id || "None selected"}
          </span>
        </div>

        <div className="hidden md:block h-10 w-[1px] bg-outline-variant/30" />

        <div className="hidden md:flex flex-col text-[10px] text-outline font-data-mono gap-y-0.5 cursor-pointer"
             onClick={() => openCustomOverlay(
               'database_index',
               'Vault Index Database Sync',
               'All telemetry archives, case parameters, and cryptographic state structures are cached instantaneously in the secure client memory partition.',
               [
                 { label: 'Synchronized Records', value: `${evidenceItems.length} active items` },
                 { label: 'Fast Cache Driver', value: 'Sentinel SQLite in-memory standard' },
                 { label: 'Telemetry Level', value: '99.98% synchronized' },
                 { label: 'Blockchain Anchor', value: 'SEC-DEMS-MAINNET' }
               ],
               'dns',
               'DATABASE SYNC MASTER'
             )}
             title="Click to view database specifications"
        >
          <span className="hover:text-tertiary transition-colors">Uptime: 99.98% telemetry</span>
          <span className="hover:text-tertiary transition-colors">Version: 3.1.2-SHA-Vigilance</span>
        </div>
      </div>

      <div className="flex items-center gap-md">
        {hasTamperAlarmTriggered && (
          <button 
            onClick={() => {
              setHasTamperAlarmTriggered(false);
              setTestResult(null);
              openCustomOverlay(
                'reset_telemetry',
                'Telemetry Calibrated',
                'State telemetry system variables reinitialized, active tamper flags dismissed, and sandbox registers flushed to clean standby nominal status.',
                [
                  { label: 'Tamper Alarm State', value: 'NOMINAL/NORMAL' },
                  { label: 'WebCrypto Core Latency', value: '12ms (standby)' }
                ],
                'shield',
                'CALIBRATION COMPLETE'
              );
            }}
            className="px-4 py-3 bg-[#a23428] hover:bg-[#b24438] text-white transition-colors font-label-caps text-xs tracking-wider rounded-sm font-bold uppercase cursor-pointer mr-2"
          >
            CLEAR TAMPER ALARM
          </button>
        )}
        <button 
          onClick={() => openCustomOverlay(
            'session_token',
            'Session Access Token',
            'Investigator Agent J. Miller has authorized this local console terminal session under security clearance level 5.',
            [
              { label: 'Authorized Node', value: 'Sentinel-Node-01 (DEMS Archive Host)' },
              { label: 'Clearance Level', value: 'L5 Sovereign Administrator' },
              { label: 'Cryptographic Signature', value: 'RSA-4096-ECC.0C9F92D... ' },
              { label: 'Expiration', value: '12 hr security auto-refresh' }
            ],
            'key',
            'L5 CLEARED CONSOLE'
          )}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2c]/40 hover:bg-[#343536] border border-outline-variant/40 hover:border-tertiary/60 text-[11px] text-[#c5c6cd] hover:text-tertiary transition-all duration-300 font-sans font-medium rounded-lg uppercase tracking-wider cursor-pointer ml-3 shadow-sm select-none"
        >
          <span className="material-symbols-outlined text-[13px] text-tertiary">key</span>
          <span>Session Authentication Token</span>
        </button>
      </div>
    </footer>
  );
};
