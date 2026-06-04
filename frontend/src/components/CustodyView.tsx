/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { EvidenceItem } from '../types';

interface CustodyViewProps {
  evidenceItems: EvidenceItem[];
  selectedEvidenceId: string;
  setSelectedEvidenceId: (id: string) => void;
  selectedItem?: EvidenceItem;
  handoverCustodian: string;
  setHandoverCustodian: (c: string) => void;
  handoverReason: string;
  setHandoverReason: (r: string) => void;
  handoverVerifyCode: string;
  setHandoverVerifyCode: (code: string) => void;
  showHandoverSuccess: boolean;
  handleHandoverAuthorize: (e: React.FormEvent) => void;
}

export const CustodyView: React.FC<CustodyViewProps> = ({
  evidenceItems,
  selectedEvidenceId,
  setSelectedEvidenceId,
  selectedItem,
  handoverCustodian,
  setHandoverCustodian,
  handoverReason,
  setHandoverReason,
  handoverVerifyCode,
  setHandoverVerifyCode,
  showHandoverSuccess,
  handleHandoverAuthorize,
}) => {
  if (evidenceItems.length === 0 || !selectedItem) {
    return (
      <motion.div 
        key="custody-empty"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full max-w-none px-8 py-8 space-y-xl flex flex-col"
      >
        {/* Header Ingestion Deck */}
        <header className="flex flex-col gap-xs mb-lg border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-md">
            <div className="w-1.5 h-8 bg-tertiary rounded-full shadow-[0_0_15px_rgba(56,222,187,0.4)]"></div>
            <h1 className="font-display-lg text-[32px] text-on-surface uppercase tracking-tight font-extrabold select-none text-white font-mono">
              Chain of Custody Ledger & Timelines
            </h1>
          </div>
          <p className="font-data-mono text-[#c5c6cd]/40 uppercase tracking-[0.3em] text-[10px] ml-lg select-none">
            Chronological Mapping: <span className="text-tertiary">Cryptographically Immutable Handshake Tracking</span>
          </p>
        </header>

        {/* Spacing constraint: Spacing Rule 1 -> ensure 60px of spacing below the titles to keep elements clear */}
        <div className="h-[60px]" />

        {/* Structured empty-state table */}
        <div className="glass-panel w-full border border-outline-variant rounded-lg overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-outline-variant/30 bg-[#0e1118] flex items-center justify-between select-none">
            <h3 className="font-title-sm text-base text-white flex items-center gap-2 font-bold uppercase tracking-wide">
              <span className="material-symbols-outlined text-tertiary">line_weight</span>
              Vault Ledger Table Indices
            </h3>
            <span className="material-symbols-outlined text-[#c5c6cd] text-xl">folder_off</span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-[#0e1118]/60 text-left select-none">
                  <th className="px-6 py-4 font-mono text-[9px] font-black text-[#c5c6cd]/50 uppercase tracking-widest col-span-1">Index Block ID</th>
                  <th className="px-6 py-4 font-mono text-[9px] font-black text-[#c5c6cd]/50 uppercase tracking-widest">File Name</th>
                  <th className="px-6 py-4 font-mono text-[9px] font-black text-[#c5c6cd]/50 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 font-mono text-[9px] font-black text-[#c5c6cd]/50 uppercase tracking-widest">Case ID</th>
                  <th className="px-6 py-4 font-mono text-[9px] font-black text-[#c5c6cd]/50 uppercase tracking-widest">Custodian</th>
                  <th className="px-6 py-4 font-mono text-[9px] font-black text-[#c5c6cd]/50 uppercase tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/10 hover:bg-white/[0.01] transition-colors">
                  <td colSpan={6} className="px-6 py-20 text-center w-full">
                    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-4 bg-amber-500/5 border border-amber-500/20 p-8 rounded-lg shadow-inner select-none">
                      <span className="material-symbols-outlined text-amber-500 text-4xl animate-pulse">warning</span>
                      <p className="font-mono text-xs font-bold text-amber-500 tracking-widest uppercase leading-relaxed">
                        NO FORENSIC ARCHIVES LOCATED FOR THIS INVESTIGATOR IDENTITY. INGEST DATA VIA THE BITSTREAM ANALYZER TO POPULATE DIRECTORY.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      key="custody"
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
            Chain of Custody Ledger & Timelines
          </h1>
        </div>
        <p className="font-data-mono text-[#c5c6cd]/40 uppercase tracking-[0.3em] text-[10px] ml-lg select-none">
          Chronological Mapping: <span className="text-tertiary">Cryptographically Immutable Handshake Tracking</span>
        </p>
      </header>

      {/* Spacing constraint: Spacing Rule 1 -> ensure 60px of spacing below the titles to keep elements clear */}
      <div className="h-[60px]" />

      {/* Chain layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
        
        {/* Left Column (20% width equivalent -> col-span-2) */}
        <section className="lg:col-span-2 flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-1 py-2">
            <h3 className="font-label-caps text-xs text-[#c5c6cd] uppercase tracking-widest font-bold select-none">
              Ledger Catalog Index
            </h3>
            <span className="material-symbols-outlined text-sm text-[#c5c6cd]">list_alt</span>
          </div>

          {evidenceItems.map(item => {
            const isSelected = item.id === selectedEvidenceId;
            const isItemTampered = item.status === 'Tampered';
            return (
              <div 
                key={item.id}
                onClick={() => setSelectedEvidenceId(item.id)}
                className={`glass-panel p-4 rounded flex items-center gap-4 border-l-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-tertiary ring-1 ring-tertiary/20 scale-[1.02] bg-primary-container/20' 
                    : isItemTampered
                      ? 'border-error opacity-75 hover:opacity-100 bg-error/5'
                      : 'border-outline-variant/50 opacity-80 hover:opacity-100 bg-[#090b0f]/50'
                }`}
              >
                <div className="w-10 h-10 bg-[#121214] rounded-sm flex items-center justify-center border border-outline-variant/30 select-none">
                  <span className={`material-symbols-outlined ${isSelected ? 'text-tertiary' : 'text-primary/70'}`}>
                    {item.category.includes('Audio') ? 'mic' : item.category.includes('Video') || item.category.includes('CCTV') ? 'videocam' : 'database'}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden pointer-events-none">
                  <p className={`font-data-mono text-[11px] truncate font-bold ${isSelected ? 'text-white' : 'text-primary'}`}>
                    {item.id}
                  </p>
                  <p className="text-[10px] text-[#c5c6cd] uppercase truncate">{item.fileName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isItemTampered ? 'bg-error animate-ping' : 'bg-tertiary shadow-[0_0_5px_rgba(56,222,187,0.5)]'}`} />
                    <span className={`text-[9.5px] font-bold uppercase tracking-tighter ${isItemTampered ? 'text-error' : 'text-tertiary'}`}>
                      {isItemTampered ? 'CRITICAL' : 'VERIFIED'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Center Column (50% width equivalent -> col-span-5) */}
        <section className="lg:col-span-5 flex flex-col glass-panel rounded-lg overflow-hidden border-t-2 border-tertiary/40 shadow-2xl">
          
          <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-[#0e1118] select-none">
            <h3 className="font-title-sm text-base text-white flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-tertiary">polyline</span>
              Dynamic Handover Custody Map (Timeline)
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border tracking-widest font-label-caps ${
                selectedItem.status === 'Tampered' 
                  ? 'bg-error/10 text-error border-error/20 animate-pulse' 
                  : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                }`}
              >
                Status: {selectedItem.status}
              </span>
              <span className="material-symbols-outlined text-tertiary text-xl animate-pulse">hub</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative min-h-[480px] bg-black/30 rounded-b-xl border border-outline-variant/10">
            
            <div className="relative pl-8 md:pl-12 py-2">
              {/* Vertical line left-aligned with flow highlight */}
              <div className="absolute left-3.5 md:left-5 top-0 bottom-0 w-[2px] bg-gradient-to-b from-tertiary via-primary/50 to-[#27282b] rounded-full" />
              
              <div className="space-y-6">
                
                {/* 1. CURRENT ACTIVE CUSTODIAN NODE */}
                <div className="relative group">
                  {/* Indicator Node on the line */}
                  <div className="absolute -left-[23px] md:-left-[29px] top-1.5 flex items-center justify-center select-none">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary/40 opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-tertiary border-2 border-[#0e1118] shadow-[0_0_12px_rgba(56,222,187,0.8)]" />
                    </span>
                  </div>

                  {/* Flat Modern Card */}
                  <div className="bg-[#121824]/90 border border-tertiary/40 rounded-xl p-4 shadow-[0_4px_25px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-tertiary hover:shadow-[0_4px_30px_rgba(56,222,187,0.15)] animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-white/5 select-none">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-tertiary/20 text-tertiary text-[10px] font-bold tracking-wider rounded uppercase font-sans">
                          Sovereign Secure Custody
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                        <span className="text-[10px] text-tertiary/90 font-mono uppercase font-bold">CURRENT ACTIVE HOLDER</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#c5c6cd] text-[10px] font-mono">
                        <span className="material-symbols-outlined text-[13px] text-tertiary">schedule</span>
                        <span>{selectedItem.timestamp}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4 space-y-1">
                        <span className="block text-[9px] text-[#c5c6cd]/50 uppercase tracking-widest font-bold select-none">Assignee / Custodian</span>
                        <span className="text-xs font-sans font-extrabold text-white flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-tertiary">badge</span>
                          {selectedItem.custodian}
                        </span>
                      </div>

                      <div className="md:col-span-4 space-y-1">
                        <span className="block text-[9px] text-[#c5c6cd]/50 uppercase tracking-widest font-bold select-none">Forensic Case ID</span>
                        <span className="text-xs font-mono font-bold text-primary block break-all">
                          {selectedItem.caseId}
                        </span>
                      </div>
                      
                      <div className="md:col-span-4 space-y-1">
                        <span className="block text-[9px] text-[#c5c6cd]/50 uppercase tracking-widest font-bold select-none">Ingested Block Reference</span>
                        <span className="text-[10px] font-mono text-white/95 bg-black/40 border border-white/5 py-0.5 px-1.5 rounded block select-all truncate" title={selectedItem.initialHash}>
                          {selectedItem.id} ({selectedItem.initialHash.substring(0, 8)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. INTERMEDIATE HANDOVERS */}
                {selectedItem.handovers && selectedItem.handovers.map((handoff, index) => (
                  <div key={index} className="relative group">
                    {/* Intermediate indicator node */}
                    <div className="absolute -left-[20px] md:-left-[26px] top-1.5 flex items-center justify-center select-none">
                      <span className="h-3.5 w-3.5 rounded-full bg-[#343536] border-2 border-[#0e1118] group-hover:bg-primary duration-300 shadow-sm" />
                    </div>

                    {/* Flat card */}
                    <div className="bg-[#0b0e14]/75 border border-outline-variant/30 rounded-xl p-4 shadow-lg transition-all duration-300 hover:border-primary/50 hover:bg-[#0b0e14]/90">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#343536] text-[#c5c6cd] text-[9px] font-bold tracking-wider rounded uppercase font-sans">
                            Transfer Handshake Log
                          </span>
                          <span className="text-[10px] text-[#c5c6cd]/40">Step {selectedItem.handovers!.length - index}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#c5c6cd]/50 text-[10px] font-mono">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          <span>{handoff.timestamp}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 items-stretch">
                        <div className="flex items-center gap-3 bg-[#080a0f] border border-white/5 p-2.5 rounded-lg">
                          <div className="flex-1">
                            <span className="block text-[8px] text-[#c5c6cd]/40 uppercase tracking-wider font-bold select-none">Outbound Custodian</span>
                            <span className="text-xs text-white/80 font-bold truncate block">{handoff.from}</span>
                          </div>
                          <span className="material-symbols-outlined text-sm text-primary/50 select-none">arrow_forward</span>
                          <div className="flex-1 text-right">
                            <span className="block text-[8px] text-[#c5c6cd]/40 uppercase tracking-wider font-bold select-none">Inbound Recipient</span>
                            <span className="text-xs text-white font-bold truncate block text-primary">{handoff.to}</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-background/40 rounded-lg border border-white/5 flex flex-col justify-center">
                          <span className="block text-[8px] text-[#c5c6cd]/40 uppercase tracking-widest font-bold mb-0.5 select-none">Authorized Transfer Reason</span>
                          <span className="text-[10px] text-[#c5c6cd]/90 italic font-sans block">{handoff.reason}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 3. POINT OF ORIGIN BASE ROOT */}
                <div className="relative group">
                  {/* Anchor Root Dot */}
                  <div className="absolute -left-[20px] md:-left-[26px] top-1.5 flex items-center justify-center select-none">
                    <span className="h-3.5 w-3.5 rounded-full bg-outline-variant/60 border-2 border-[#0e1118] group-hover:bg-primary shadow-sm" />
                  </div>

                  <div className="bg-[#0b0e14]/40 border border-outline-variant/20 rounded-xl p-4 opacity-75 hover:opacity-100 transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-4 select-none">
                        <span className="px-2 py-0.5 bg-[#343536]/60 text-[#c5c6cd]/80 text-[8px] font-bold tracking-widest rounded uppercase">
                          Genesis Anchor
                        </span>
                        <h4 className="text-[11px] font-mono text-white/80 font-bold mt-1">CRYPTOGRAPHIC INGEST SEAL</h4>
                      </div>
                      <div className="md:col-span-8">
                        <p className="text-[10px] text-[#c5c6cd]/70 font-sans leading-relaxed select-none">
                          Immutable intake initialized, verifying initial bits and seals. Chain of custody hash anchored securely to system telemetry indices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Right Column (30% width equivalent -> col-span-3) */}
        <section className="lg:col-span-3 flex flex-col glass-panel rounded-lg overflow-hidden border border-outline-variant shadow-2xl">
          
          <div className="p-6 border-b border-outline-variant/30 bg-[#0e1118] select-none">
            <h3 className="font-title-sm text-base text-white flex items-center gap-2 font-bold uppercase tracking-wide">
              Custodian Assignment Deck
              <span className="material-symbols-outlined text-tertiary text-xl animate-spin">sync_saved_locally</span>
            </h3>
            <p className="text-[10px] text-[#c5c6cd] mt-1 uppercase tracking-widest font-bold font-label-caps">
              PROTOCOL RSA-4096 / SHA256 HYBRID CONTROL
            </p>
          </div>

          <form onSubmit={handleHandoverAuthorize} className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-4">
            
            {/* Success prompt flag */}
            {showHandoverSuccess && (
              <div className="bg-[#001e17] border border-tertiary/40 rounded p-3 text-tertiary font-label-caps text-xs flex items-center gap-2 blinking shadow-md">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>CUSTODY TRANSFER TRANSACTION REGISTERED AND VERIFIED IMMUTABLY IN LEDGER INDEX!</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-label-caps text-[#c5c6cd] font-bold text-[10px] tracking-wider block uppercase select-none">
                Active Ingest Block ID
              </label>
              <div className="relative">
                <input 
                  readOnly 
                  className="w-full bg-primary-container/40 border border-outline-variant/30 rounded px-3 py-3 text-mono font-mono text-tertiary cursor-not-allowed text-xs font-bold select-all" 
                  value={selectedItem.id} 
                  type="text" 
                />
                <span className="material-symbols-outlined absolute right-3 top-3 text-tertiary/60">verified</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-caps text-[#c5c6cd] font-bold text-[10px] tracking-wider block uppercase select-none">
                Receiving Custodian Name / Node Point
              </label>
              <input 
                value={handoverCustodian}
                onChange={(e) => setHandoverCustodian(e.target.value)}
                className="w-full bg-background border border-outline-variant rounded px-3 py-3 font-mono text-xs focus:border-tertiary focus:outline-none transition-all text-white font-bold placeholder:text-[#c5c6cd]/20" 
                placeholder="ID_OFFICER / NODE_POINT"
                type="text" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-label-caps text-[#c5c6cd] font-bold text-[10px] tracking-wider block uppercase select-none">
                Objective Purpose of Transfer
              </label>
              <div className="relative">
                <select 
                  value={handoverReason}
                  onChange={(e) => setHandoverReason(e.target.value)}
                  className="w-full bg-background border border-outline-variant rounded px-3 py-3 focus:border-tertiary font-sans text-xs focus:outline-none transition-all appearance-none cursor-pointer text-white"
                >
                  <option value="Secure Vault Archive">Secure Vault Archive</option>
                  <option value="Forensic Lab Hard Analysis">Forensic Lab Hardcopy Analysis</option>
                  <option value="Court Evidence Presentation Room">Court Evidence Presentation Room</option>
                  <option value="Logical Sector Block Dump Verification">Logical Sector Block Dump Verification</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-[#c5c6cd] text-sm pointer-events-none">expand_content</span>
              </div>
            </div>

            <div className="border-t border-outline-variant/30 pt-4 mt-6 space-y-1">
              <div className="flex justify-between items-center mb-1 select-none">
                <label className="font-label-caps text-[#c5c6cd] font-bold text-[10px] tracking-wider uppercase">
                  Authorized Multi-Sig Key Verification
                </label>
                <span className="text-[9px] text-tertiary uppercase tracking-widest font-bold">AES-256 SECURED</span>
              </div>
              <input 
                value={handoverVerifyCode}
                onChange={(e) => setHandoverVerifyCode(e.target.value)}
                className="w-full bg-[#131518] border border-outline-variant/50 rounded px-3 py-3 text-center text-sm font-mono tracking-[0.4em] focus:border-tertiary focus:outline-none transition-all text-white" 
                placeholder="•••• ••••" 
                type="password" 
                required
              />
            </div>

          </form>

          <div className="p-6 bg-[#0e1118]/80 border-t border-outline-variant/30">
            <button 
              onClick={handleHandoverAuthorize}
              className="w-full py-4 bg-gradient-to-r from-tertiary to-[#00937a] text-[#131518] font-bold font-label-caps text-xs tracking-wider rounded-lg hover:brightness-110 duration-200 transition-all glow-cyan flex items-center justify-center gap-2 group cursor-pointer border border-[#38debb]/10"
            >
              <span>SIGN CUSTODY TRANSACTION</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform font-bold">lock_open</span>
            </button>
            <p className="text-[9px] text-[#c5c6cd]/50 text-center mt-2 uppercase font-mono tracking-tighter">
              Warning: Immutable ledger log is immediately written into database.
            </p>
          </div>
        </section>

      </div>
    </motion.div>
  );
};
