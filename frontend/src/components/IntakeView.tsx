/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { EvidenceItem } from '../types';
import { formatBytes, getCategoryPlaceholder, CATEGORY_MAP } from '../utils';

interface IntakeViewProps {
  evidenceItems: EvidenceItem[];
  selectedVerificationTargetId: string;
  setSelectedVerificationTargetId: (id: string) => void;
  predefinedExpectedHash: string;
  setPredefinedExpectedHash: (hash: string) => void;
  ingestionCaseId: string;
  setIngestionCaseId: (caseId: string) => void;
  ingestionInvestigator: string;
  setIngestionInvestigator: (investigator: string) => void;
  ingestionCategory: string;
  setIngestionCategory: (category: string) => void;
  uploadedFile: File | null;
  calculatedHash: string;
  isCalculatingHash: boolean;
  streamLogs: string[];
  testResult: any;
  handleFileProcess: (file: File) => Promise<void>;
  runSimulation: (isTamperedSim: boolean) => void;
  handleFormalIngest: () => void;
}

export const IntakeView: React.FC<IntakeViewProps> = ({
  evidenceItems,
  selectedVerificationTargetId,
  setSelectedVerificationTargetId,
  predefinedExpectedHash,
  setPredefinedExpectedHash,
  ingestionCaseId,
  setIngestionCaseId,
  ingestionInvestigator,
  setIngestionInvestigator,
  ingestionCategory,
  setIngestionCategory,
  uploadedFile,
  calculatedHash,
  isCalculatingHash,
  streamLogs,
  testResult,
  handleFileProcess,
  runSimulation,
  handleFormalIngest,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const fileInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <motion.div 
      key="intake"
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
            Evidence Ingestion Deck & Hash Sandbox
          </h1>
        </div>
        <p className="font-data-mono text-[#c5c6cd]/40 uppercase tracking-[0.3em] text-[10px] ml-lg select-none">
          Phase: <span className="text-tertiary">Cryptographic Integrity Anchoring Stream</span>
        </p>
      </header>

      {/* Spacing constraint: Spacing Rule 1 -> ensure 60px of spacing below the titles */}
      <div className="h-[60px]" />

      {/* Split layout: left forensic ingestion tool, right metadata cards */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
        
        {/* Left Panel: File processing & Testing Hub */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="glass-panel rounded-xl h-full p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-label-caps text-[10px] text-[#c5c6cd] tracking-widest uppercase font-bold">
                  Forensic Input Media Controller
                </span>
                <span className="material-symbols-outlined text-[#c5c6cd]/40 text-lg animate-pulse">memory</span>
              </div>

              {/* Drop Target zone (Web Crypto Hashing Target - Rule 3) */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`flex-grow flex flex-col items-center justify-center rounded-lg border-2 border-dashed h-72 transition-all cursor-pointer relative overflow-hidden group py-8 ${
                  isDragActive 
                    ? 'border-tertiary bg-tertiary/10 scale-[0.99]' 
                    : 'border-outline-variant hover:border-tertiary/50 bg-[#090b0f]/50'
                }`}
              >
                <div className="absolute inset-0 pulsing-cyan-glow pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"></div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={fileInputChanged}
                  className="hidden" 
                />

                <div className="relative z-15 flex flex-col items-center gap-4 text-center px-4 select-none">
                  <div className="w-16 h-16 rounded-full bg-[#131315] border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 duration-300">
                    <span className="material-symbols-outlined text-white text-3xl">cloud_upload</span>
                  </div>
                  <div>
                    <h3 className="font-display-lg text-base text-white tracking-wide uppercase font-bold">
                      {uploadedFile ? 'Forensic File Selected' : 'Drop Forensic Assets / Logs'}
                    </h3>
                    <p className="font-body-sm text-[#c5c6cd]/60 mt-2 text-xs">
                      {uploadedFile 
                        ? `${uploadedFile.name} (${formatBytes(uploadedFile.size)})` 
                        : getCategoryPlaceholder(ingestionCategory)
                      }
                    </p>
                  </div>
                  {!uploadedFile && (
                    <span className="px-3 py-1 bg-[#1f1f21] rounded-full text-[10px] text-[#c5c6cd] border border-outline-variant uppercase font-label-caps transition-colors group-hover:bg-primary-container group-hover:text-primary">
                      Choose File on Computer
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Simulation sandbox helpers to test tamper alarm easily */}
            <div className="mt-6 pt-6 border-t border-[#44474d]/30 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-data-mono uppercase tracking-wider text-[#c5c6cd]/40">
                <span>Simulator sandbox environment</span>
                <span className="text-tertiary">Developer Helper Hub</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => runSimulation(false)}
                  className="px-2 py-2 bg-[#001e17] hover:bg-[#00382d] border border-[#38debb]/20 text-tertiary rounded text-[11px] font-label-caps uppercase transition-colors text-center cursor-pointer font-bold"
                  title="Simulates hash matching the target item perfectly"
                >
                  Simulate Clean Match
                </button>
                <button 
                  onClick={() => runSimulation(true)}
                  className="px-2 py-2 bg-[#93000a]/20 hover:bg-[#93000a]/40 border border-[#93000a]/20 text-error rounded text-[11px] font-label-caps uppercase transition-colors text-center cursor-pointer font-bold animate-pulse"
                  title="Simulates modified hash to test Tamper Warning Alert"
                >
                  Simulate Bit-Flip Mismatch
                </button>
              </div>

              <div className="bg-[#090b0f] p-3 rounded border border-outline-variant/30 text-xs text-[#c5c6cd]">
                <p className="font-sans">
                  <b>Testing Advice:</b> First select a Verification Target in the form on the right (defaults to <code>CCTV_Lobby_Main.mp4</code>). Click the simulated buttons or upload a file. When mismatch is triggered, the entire app flashes red immediately. Click cross/discard on the banner to reset!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Metadata & Selection target details */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Case Identifier */}
            <div className="glass-panel neon-border-blue rounded-lg p-6 flex flex-col gap-2 justify-between shadow-lg">
              <label className="font-label-caps text-[10px] text-[#c5c6cd] tracking-widest flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-sm font-bold">tag</span> CASE IDENTIFIER
              </label>
              <div className="bg-black/40 rounded-lg border border-white/5 px-4 py-2">
                <input 
                  value={ingestionCaseId}
                  onChange={(e) => setIngestionCaseId(e.target.value)}
                  className="w-full font-data-mono text-white placeholder:text-[#c5c6cd]/25 focus:outline-none py-1 font-bold bg-transparent" 
                  placeholder="SEC-XXXX-ARC" 
                  type="text"
                />
              </div>
            </div>

            {/* Investigator Card */}
            <div className="glass-panel neon-border-blue rounded-lg p-6 flex flex-col gap-2 justify-between shadow-lg">
              <label className="font-label-caps text-[10px] text-[#c5c6cd] tracking-widest flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-sm font-bold">badge</span> LEAD INVESTIGATOR
              </label>
              <div className="bg-black/40 rounded-lg border border-white/5 px-4 py-2">
                <input 
                  value={ingestionInvestigator}
                  onChange={(e) => setIngestionInvestigator(e.target.value)}
                  className="w-full font-sans text-sm text-white placeholder:text-[#c5c6cd]/25 focus:outline-none py-1 font-bold bg-transparent" 
                  placeholder="RANK, SURNAME" 
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Verification Target Dropdown selection */}
          <div className="glass-panel neon-border-blue rounded-lg p-6 flex flex-col gap-2 justify-between shadow-lg">
            <label className="font-label-caps text-[10px] text-[#c5c6cd] tracking-widest flex items-center gap-1 font-bold uppercase text-left">
              <span className="material-symbols-outlined text-sm text-tertiary">network_check</span> 
              Verification Comparative Target
            </label>
            <div className="bg-black/40 rounded-lg border border-white/5 px-4 py-3 flex items-center gap-4">
              <span className="material-symbols-outlined text-[#b9c7e4]">layers</span>
              <select 
                value={selectedVerificationTargetId}
                onChange={(e) => {
                  setSelectedVerificationTargetId(e.target.value);
                }}
                className="flex-grow font-sans text-white text-sm bg-transparent appearance-none cursor-pointer focus:outline-none py-1 select-none"
              >
                {evidenceItems.map(item => (
                  <option key={item.id} value={item.id} className="bg-[#131315]">
                    {item.id} - {item.fileName} ({item.status})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#c5c6cd]/40">expand_more</span>
            </div>

            <div className="mt-2 space-y-2">
              <label className="font-label-caps text-[10px] text-[#c5c6cd] tracking-widest flex items-center gap-1 font-bold uppercase text-left">
                <span className="material-symbols-outlined text-sm text-[#b9c7e4]">lock</span> 
                Predefined Expected SHA-256 Hash
              </label>
              <div className="bg-black/40 rounded-lg border border-white/5 px-4 py-2 flex items-center gap-4">
                <input
                  type="text"
                  value={predefinedExpectedHash}
                  onChange={(e) => setPredefinedExpectedHash(e.target.value)}
                  className="w-full font-data-mono text-xs text-white bg-transparent focus:outline-none placeholder:text-[#c5c6cd]/20 select-all break-all"
                  placeholder="Enter/override expected SHA-256 hash string..."
                />
                <button
                  onClick={() => {
                    const targetItem = evidenceItems.find(i => i.id === selectedVerificationTargetId);
                    if (targetItem) {
                      setPredefinedExpectedHash(targetItem.initialHash);
                    }
                  }}
                  className="px-2 py-1 bg-[#1f1f21] hover:bg-[#2a2a2c] border border-outline-variant text-[10px] text-tertiary hover:text-white rounded uppercase font-bold text-nowrap select-none cursor-pointer"
                  title="Reset to default database reference hash"
                >
                  Reset Hash
                </button>
              </div>
            </div>
          </div>

          {/* Evidence Categorization selection */}
          <div className="glass-panel neon-border-blue rounded-lg p-6 flex flex-col gap-2 justify-between shadow-lg">
            <label className="font-label-caps text-[10px] text-[#c5c6cd] tracking-widest flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-sm">category</span> DATA CATEGORIZATION
            </label>
            <div className="bg-black/40 rounded-lg border border-white/5 px-4 py-3 flex items-center gap-4">
              <span className="material-symbols-outlined text-tertiary">hard_drive</span>
              <select 
                value={ingestionCategory}
                onChange={(e) => setIngestionCategory(e.target.value)}
                className="flex-grow font-sans text-sm text-white bg-transparent appearance-none cursor-pointer focus:outline-none py-1 select-none"
              >
                <option value="Disk Image (Forensic Level)" className="bg-[#131315]">Disk Image (Forensic Level)</option>
                <option value="Network Traffic Captures" className="bg-[#131315]">Network Traffic Captures</option>
                <option value="Volatile Memory Dumps" className="bg-[#131315]">Volatile Memory Dumps</option>
                <option value="Encrypted Storage Volume" className="bg-[#131315]">Encrypted Storage Volume</option>
                <option value="Logical File Collection" className="bg-[#131315]">Logical File Collection</option>
              </select>
              <span className="material-symbols-outlined text-[#c5c6cd]/40">expand_more</span>
            </div>
          </div>

          {/* WebCrypto Console stream list log */}
          <div className="glass-panel neon-border-blue rounded-lg p-6 flex flex-col gap-2 shadow-lg min-h-[200px]">
            <label className="font-label-caps text-[10px] text-[#c5c6cd] tracking-widest flex items-center gap-1 font-bold select-none text-left">
              <span className="material-symbols-outlined text-sm">terminal</span> LIVE WEB-CRYPTO HASHING STREAM
            </label>
            <div className="bg-black/60 rounded border border-white/5 p-4 font-data-mono text-[11px] flex-grow space-y-1 h-36 overflow-y-auto custom-scrollbar text-left">
              {streamLogs.map((log, i) => {
                let colorClass = 'text-tertiary';
                if (log.includes('WARNING') || log.includes('FAILED')) colorClass = 'text-[#ff5555] font-bold';
                else if (log.includes('Ingestion')) colorClass = 'text-primary';
                return (
                  <p key={i} className={colorClass}>{log}</p>
                );
              })}
              {isCalculatingHash && (
                <p className="text-white animate-pulse">Calculating SHA-256 Digest in background sandbox...</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 border-t border-white/5 font-data-mono text-[10px] select-none">
              <div className="flex justify-between items-center pr-3">
                <span className="text-[#c5c6cd]/40 text-[9px]">CRYPTO COPROCESSOR</span>
                <span className="text-tertiary font-bold">ACTIVE (SHA-256)</span>
              </div>
              <div className="flex justify-between items-center sm:pl-3 sm:border-l border-white/5">
                <span className="text-[#c5c6cd]/40 text-[9px]">LOCAL STREAM CACHE</span>
                <span className="text-[#c5c6cd]/85 font-bold uppercase">50.0 GB nominal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sleek, horizontal, terminal-styled helper matrix panel */}
        <div className="lg:col-span-10 mt-4 bg-[#04060a]/90 border border-outline-variant/60 rounded-xl p-5 shadow-2xl relative overflow-hidden text-left">
          <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
          <div className="flex items-center gap-2 mb-4 pl-2 select-none">
            <span className="material-symbols-outlined text-tertiary text-lg">radar</span>
            <span className="font-sans text-xs font-black tracking-widest text-[#9ea0a7] uppercase">
              🛰️ CORE SYSTEM INGESTION SPECIFICATIONS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pl-2">
            {Object.entries(CATEGORY_MAP).map(([category, extensions]) => {
              const isActive = ingestionCategory === category;
              return (
                <div 
                  key={category} 
                  className={`p-3.5 rounded-lg border transition-all duration-300 ${
                    isActive 
                      ? 'bg-tertiary/10 border-tertiary/50 shadow-[0_0_15px_rgba(56,222,187,0.1)] scale-[1.01]' 
                      : 'bg-black/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <p className="font-sans text-[11px] font-bold text-white uppercase tracking-wider mb-2 truncate" title={category}>
                    {category.replace(' (Forensic Level)', '').replace(' Dumps', '').replace(' Volume', '').replace(' Collection', '').replace(' Captures', '')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {extensions.map(ext => (
                      <span 
                        key={ext} 
                        className={`font-data-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isActive 
                            ? 'bg-tertiary/20 text-[#38debb] border border-tertiary/30' 
                            : 'bg-white/5 text-[#c5c6cd]/80 border border-white/5'
                        }`}
                      >
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom interactive results row */}
        <div className="lg:col-span-10 mt-6">
          <div className="terminal-container rounded-xl border border-outline-variant p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shrink-0">
            <div className="flex items-center gap-6">
              <div className="bg-tertiary/10 border border-tertiary/30 px-4 py-2 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse shadow-[0_0_8px_#38debb]"></div>
                <span className="font-label-caps text-[11px] text-tertiary tracking-widest font-bold">
                  {isCalculatingHash ? 'HASH ENGINE BUSY' : 'CRYPTOGRAPHIC ENGINE: STANDBY'}
                </span>
              </div>
              <div className="hidden md:flex flex-col font-data-mono text-[11px] text-[#c5c6cd]/50 text-left">
                <span>HOST CORE: SENTINEL-NODE-01</span>
                <span>LATENCY TELEMETRY: 12ms (SHA-Co-Processor)</span>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="flex-grow md:flex-grow-0 hidden xl:block">
                <p className="font-data-mono text-[11px] text-[#c5c6cd]/40 italic uppercase select-none">
                  {calculatedHash ? 'HASH DERIVED' : 'AWAITING SOURCE FORENSIC BITSTREAM...'}
                </p>
              </div>

              {/* WebCrypto results feedback capsule */}
              {testResult && (
                <div className="px-4 py-2 rounded-lg border text-xs font-label-caps flex items-center gap-4 select-none border-outline-variant text-[#c5c6cd]">
                  <span>Result:</span>
                  {testResult.matched ? (
                    <span className="text-tertiary bg-tertiary/10 border border-tertiary/20 px-2 py-0.5 rounded font-bold">
                      ✔️ INTEGRITY GUARANTEED: SECURE MATCH
                    </span>
                  ) : (
                    <span className="text-error bg-error/10 border border-error/20 px-2 py-0.5 rounded font-bold animate-pulse uppercase">
                      ⚠️ ALARM: FILE TAMPERED WITH!
                    </span>
                  )}
                </div>
              )}

              <button 
                onClick={handleFormalIngest}
                disabled={!calculatedHash}
                className={`premium-btn w-full md:w-auto px-6 h-14 rounded-lg flex items-center justify-center gap-2 text-white font-label-caps text-[12px] tracking-widest group cursor-pointer font-bold ${
                  !calculatedHash ? 'opacity-50 cursor-not-allowed filter grayscale bg-[#343536]' : ''
                }`}
              >
                <span>FORMALIZE INGESTION &amp; LOG</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform font-bold">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
