/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';

interface SettingsViewProps {
  hasTamperAlarmTriggered: boolean;
  setHasTamperAlarmTriggered: (triggered: boolean) => void;
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
  isFetching?: boolean;
  setIsFetching?: (val: boolean) => void;
  isConnectionInterrupted?: boolean;
  setIsConnectionInterrupted?: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  hasTamperAlarmTriggered,
  setHasTamperAlarmTriggered,
  openCustomOverlay,
  isFetching = false,
  setIsFetching,
  isConnectionInterrupted = false,
  setIsConnectionInterrupted,
}) => {
  const [cryptoStandard, setCryptoStandard] = useState('SHA-256');
  const [autoLockout, setAutoLockout] = useState('On (3 Alerts)');
  const [syncRate, setSyncRate] = useState('Real-Time (WebSockets)');
  const [experimentalMode, setExperimentalMode] = useState(false);
  const [securityBadgeLevel, setSecurityBadgeLevel] = useState('LEVEL 5 CLEARANCE');

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    openCustomOverlay(
      'settings_saved',
      'Telemetry System Recalibrated',
      'The sovereign system parameters have been successfully adapted and written into the non-volatile state memory partition of Sentinel Cryptographic Nodes.',
      [
        { label: 'Selected Standard', value: cryptoStandard },
        { label: 'Auto Lockout Standard', value: autoLockout },
        { label: 'Sync Rate Interface', value: syncRate },
        { label: 'Security Badge', value: securityBadgeLevel }
      ],
      'settings_suggest',
      'PARAMETERS RECONSTRUCTED'
    );
  };

  return (
    <motion.div 
      key="settings"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="w-full max-w-none px-8 py-8 space-y-xl flex flex-col"
    >
      
      {/* Header Ingestion Deck */}
      <header className="flex flex-col gap-xs mb-lg border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-md">
          <div className="w-1.5 h-8 bg-tertiary rounded-full shadow-[0_0_15px_rgba(56,222,187,0.4)]"></div>
          <h1 className="font-display-lg text-[32px] text-on-surface uppercase tracking-tight font-extrabold select-none text-white">
            Sentinel Admin &amp; Signature Settings
          </h1>
        </div>
        <p className="font-data-mono text-[#c5c6cd]/40 uppercase tracking-[0.3em] text-[10px] ml-lg select-none">
          System Control: <span className="text-tertiary">Cryptographic Algorithm Tuning &amp; Hardware Lockout Policies</span>
        </p>
      </header>

      <div className="w-full max-w-none grid grid-cols-1 lg:grid-cols-10 gap-6 items-start pb-20">
        
        {/* Left column Settings panel - col span 6 */}
        <div className="lg:col-span-6 flex flex-col !justify-start gap-6 glass-panel rounded-xl overflow-hidden border border-outline-variant shadow-2xl">
          <div className="p-6 border-b border-outline-variant/30 bg-[#0e1118] select-none">
            <h3 className="font-title-sm text-base text-white flex items-center gap-2 font-bold uppercase tracking-wide">
              <span className="material-symbols-outlined text-tertiary text-xl animate-spin">tune</span>
              Sentinel Archival Parameters
            </h3>
            <p className="text-[10px] text-[#c5c6cd] mt-1 uppercase tracking-widest font-bold font-label-caps">
              Direct physical coprocessor calibration matrix
            </p>
          </div>

          <form onSubmit={saveSettings} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Crypto Standard selection */}
              <div className="space-y-1">
                <label className="font-label-caps text-[#c5c6cd] font-bold text-[10px] tracking-wider block uppercase select-none">
                  Hardware Cryptographic Standard
                </label>
                <div className="relative">
                  <select 
                    value={cryptoStandard}
                    onChange={(e) => setCryptoStandard(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded px-3 py-3 focus:border-tertiary font-sans text-xs focus:outline-none transition-all appearance-none cursor-pointer text-white"
                  >
                    <option value="SHA-256">SHA-256 (Default Secure Standard)</option>
                    <option value="SHA-512">SHA-512 (Ultra High Entropy)</option>
                    <option value="SHA-384">SHA-384 (NIST Compliant Suite B)</option>
                    <option value="SHA-1_LEGACY">SHA-1 (Legacy Reification Mode)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[#c5c6cd] text-sm pointer-events-none">expand_content</span>
                </div>
              </div>

              {/* Ingress policy auto-lockout threshold */}
              <div className="space-y-1">
                <label className="font-label-caps text-[#c5c6cd] font-bold text-[10px] tracking-wider block uppercase select-none">
                  Intrusion Isolation Policy
                </label>
                <div className="relative">
                  <select 
                    value={autoLockout}
                    onChange={(e) => setAutoLockout(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded px-3 py-3 focus:border-tertiary font-sans text-xs focus:outline-none transition-all appearance-none cursor-pointer text-white"
                  >
                    <option value="On (3 Alerts)">On (Lockout after 3 anomaly alerts)</option>
                    <option value="On (5 Alerts)">On (Lockout after 5 anomaly alerts)</option>
                    <option value="Strict physical">Emergency physical key required</option>
                    <option value="Disabled">Disabled (Log warnings only)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[#c5c6cd] text-sm pointer-events-none">expand_content</span>
                </div>
              </div>

              {/* Sync rate */}
              <div className="space-y-1">
                <label className="font-label-caps text-[#c5c6cd] font-bold text-[10px] tracking-wider block uppercase select-none">
                  Ledger Sync Interface Speed
                </label>
                <div className="relative">
                  <select 
                    value={syncRate}
                    onChange={(e) => setSyncRate(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded px-3 py-3 focus:border-tertiary font-sans text-xs focus:outline-none transition-all appearance-none cursor-pointer text-white"
                  >
                    <option value="Real-Time (WebSockets)">Real-Time Peer-to-Peer Sync</option>
                    <option value="15-min Batch">15-Minute Block Ingest Batches</option>
                    <option value="Manual Only">Manual Push-to-Sync Only</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[#c5c6cd] text-sm pointer-events-none">expand_content</span>
                </div>
              </div>

              {/* Verification clearance levels */}
              <div className="space-y-1">
                <label className="font-label-caps text-[#c5c6cd] font-bold text-[10px] tracking-wider block uppercase select-none">
                  Console Credentials Badge
                </label>
                <div className="relative">
                  <select 
                    value={securityBadgeLevel}
                    onChange={(e) => setSecurityBadgeLevel(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded px-3 py-3 focus:border-tertiary font-sans text-xs focus:outline-none transition-all appearance-none cursor-pointer text-white"
                  >
                    <option value="LEVEL 5 CLEARANCE">LEVEL 5 SOVEREIGN CLEARANCE</option>
                    <option value="LEVEL 4 CLEARANCE">LEVEL 4 SECURE OPERATOR</option>
                    <option value="LEVEL 3 CLEARANCE">LEVEL 3 FIELD RESEARCHER</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[#c5c6cd] text-sm pointer-events-none">expand_content</span>
                </div>
              </div>

            </div>

            {/* Toggle switch */}
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-white uppercase">Fast Cryptographic Intercept Node</span>
                  <span className="block text-[10px] text-[#c5c6cd]/50 uppercase tracking-widest mt-0.5">Use low-level vector extensions (AVX-512 emulation)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExperimentalMode(!experimentalMode)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                    experimentalMode ? 'bg-tertiary' : 'bg-[#343536]'
                  }`}
                >
                  <div className={`w-4 h-4 bg-black rounded-full shadow duration-200 transform ${
                    experimentalMode ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30 flex justify-end gap-2">
              <button 
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-tertiary to-[#00937a] text-[#131518] font-bold font-label-caps text-xs tracking-wider rounded-lg hover:brightness-110 duration-200 transition-all glow-cyan cursor-pointer"
              >
                COMMIT PARAMETER CHANGES
              </button>
            </div>

          </form>
        </div>

        {/* Right column Information blocks - col span 4 */}
        <div className="lg:col-span-4 flex flex-col !justify-start gap-6 glass-panel rounded-xl overflow-hidden border border-outline-variant shadow-2xl p-6">
          <div className="space-y-4">
            <h4 className="font-label-caps text-xs text-tertiary uppercase tracking-[0.3em] font-bold select-none">
              Node Cryptographic Fingerprint
            </h4>

            <div className="bg-black/40 border border-white/5 rounded-lg p-4 font-data-mono text-[11px] space-y-2 select-all">
              <p className="text-[#c5c6cd]/75 font-semibold">Active Hardware Keys:</p>
              <p className="text-primary truncate">KEY_ID_0C9F92D-RSA-4096-PUBLIC-KEY</p>
              <div className="h-px bg-white/5" />
              <p className="text-[#c5c6cd]/75 font-semibold">Coprocessor State Register:</p>
              <p className="text-tertiary uppercase">0x8C526A1BF40E923CDE001A837</p>
            </div>

            <div className="space-y-2 select-none">
              <h5 className="font-sans text-xs font-bold text-white uppercase">Operational Directives</h5>
              <p className="font-sans text-xs text-[#c5c6cd]/75 leading-relaxed">
                The cryptographic co-processor core processes hashes on-the-fly under custom standards. Modifying settings rebinds physical instruction pools for all future ingestion events and checks.
              </p>
            </div>
          </div>

          <div className="bg-[#93000a]/10 border border-error/20 p-4 rounded-xl space-y-2">
            <h5 className="font-sans text-xs font-bold text-error uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">security</span> Emergency State Purge
            </h5>
            <p className="font-sans text-[11px] text-[#c5c6cd]/70 leading-relaxed">
              Instantly purge state keys, volatile RAM blocks, and isolate local storage triggers. All local custody ledger references will go into cold lockbox storage.
            </p>
            <button
              onClick={() => {
                openCustomOverlay(
                  'forced_isolation_confirm',
                  'CONFIRM SECURITY ISOLATION',
                  'Triggering the global Sentinel physical lockdown protocol will isolate CPU cores, re-encrypt active tables, and log all events in the ledger logs. Do you wish to initialize the system lockout protocol?',
                  [
                    { label: 'Action', value: 'IMMEDIATE CORE LOCKDOWN' },
                    { label: 'Risk level', value: 'MAX PROTOCOL-9' }
                  ],
                  'gpp_maybe',
                  'CRITICAL ALARM',
                  true,
                  {
                    label: 'INITIALIZE CORES ISOLATION',
                    onClick: () => {
                      setHasTamperAlarmTriggered(true);
                    }
                  }
                );
              }}
              className="mt-2 w-full py-2 bg-error/20 text-error border border-error/30 hover:bg-error/30 rounded text-[10px] font-label-caps uppercase font-bold transition-all cursor-pointer"
            >
              TRIGGER FORCED CORES ISOLATION
            </button>
          </div>

          {/* Network Diagnostics and Simulator HUD */}
          <div className="bg-[#d97706]/10 border border-[#f59e0b]/20 p-4 rounded-xl space-y-3">
            <h5 className="font-sans text-xs font-bold text-[#f59e0b] uppercase flex items-center gap-1.5 select-none">
              <span className="material-symbols-outlined text-sm animate-pulse">settings_input_antenna</span> 
              Core Network Diagnostics
            </h5>
            <p className="font-sans text-[11px] text-[#c5c6cd]/70 leading-relaxed select-none">
              Simulate high-tech edge case anomalies to verify the resilience of state-driven progress feedback and error interception modules.
            </p>
            
            <div className="grid grid-cols-1">
              <button
                type="button"
                onClick={() => {
                  if (setIsFetching) {
                    setIsFetching(true);
                    // Automatically clear after 4 seconds
                    setTimeout(() => {
                      setIsFetching(false);
                    }, 4000);
                  }
                }}
                className={`py-2 px-1 rounded text-[9px] font-label-caps uppercase font-bold transition-all border outline-none cursor-pointer ${
                  isFetching
                    ? 'bg-tertiary/20 text-tertiary border-tertiary'
                    : 'bg-black/30 text-[#fafafa]/80 border-white/5 hover:border-tertiary/40 hover:bg-black/50'
                }`}
              >
                {isFetching ? 'SPINNER ACTIVE' : 'TEST COPROCESSOR'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
