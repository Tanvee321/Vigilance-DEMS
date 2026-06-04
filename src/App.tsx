/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  INITIAL_EVIDENCE_ITEMS, 
  INITIAL_AUDIT_LOG_EVENTS, 
  calculateSHA256, 
  formatBytes 
} from './utils';
import { EvidenceItem, AuditLogEvent, ScreenView } from './types';

// Modular Component Imports
import { NavigationHeader } from './components/NavigationHeader';
import { SidebarMenu } from './components/SidebarMenu';
import { BottomSystemStatusBar } from './components/BottomSystemStatusBar';
import { DashboardView } from './components/DashboardView';
import { IntakeView } from './components/IntakeView';
import { CustodyView } from './components/CustodyView';
import { AuditView } from './components/AuditView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  // Global React state
  const [activeView, setActiveView] = useState<ScreenView>('dashboard');
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(INITIAL_EVIDENCE_ITEMS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>(INITIAL_AUDIT_LOG_EVENTS);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [isConnectionInterrupted, setIsConnectionInterrupted] = useState(false);
  const activeFetchesCount = useRef(0);

  // High-Tech Interceptor for all Network API Requests with built-in state tracking and 8s automatic timeouts
  const secureFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    activeFetchesCount.current++;
    setIsFetching(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000);

    const mergedInit = {
      ...init,
      signal: init?.signal || controller.signal,
    };

    try {
      const response = await window.fetch(input, mergedInit);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        setIsConnectionInterrupted(true);
        setTimeout(() => {
          setIsConnectionInterrupted(false);
        }, 6000);
      } else {
        setIsConnectionInterrupted(false);
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      setIsConnectionInterrupted(true);
      setTimeout(() => {
        setIsConnectionInterrupted(false);
      }, 6000);
      throw error;
    } finally {
      activeFetchesCount.current--;
      if (activeFetchesCount.current <= 0) {
        activeFetchesCount.current = 0;
        setIsFetching(false);
      }
    }
  };

  // Synchronize database records from our full-stack backend
  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const res = await secureFetch('/api/evidence');
        if (res.ok) {
          const data = await res.json();
          // Merge or replace initial fallback items with actual backend values
          if (Array.isArray(data) && data.length > 0) {
            setEvidenceItems(data);
          }
        }
      } catch (err) {
        console.error('Failed to synchronize database records from API', err);
      }
    };
    fetchEvidence();
  }, []);

  // Central Client-Side JavaScript Router & Hash Sync
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      const parsedView = (hash.startsWith('#/') ? hash.slice(2) : hash.slice(1)) as ScreenView;
      const validViews: ScreenView[] = ['dashboard', 'archive', 'forensics', 'audit', 'settings'];
      if (validViews.includes(parsedView)) {
        setActiveView(parsedView);
      } else {
        window.location.hash = '#/dashboard';
        setActiveView('dashboard');
      }
    };

    // Synchronize initial landing URL
    handleHashSync();

    // Listen to route changes natively
    window.addEventListener('hashchange', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
    };
  }, []);
  
  // Custom Sleek Overlay Modals (replacing alert())
  const [activeOverlay, setActiveOverlay] = useState<{
    type: string;
    title: string;
    badge?: string;
    message: string;
    details?: { label: string; value: string }[];
    icon?: string;
    isError?: boolean;
    primaryAction?: { label: string; onClick: () => void };
  } | null>(null);

  // System Terminal Notice panel (Empty/Auxiliary states slide-out)
  const [isTerminalNoticeOpen, setIsTerminalNoticeOpen] = useState(false);
  const [terminalNoticeTitle, setTerminalNoticeTitle] = useState('');
  const [terminalNoticeDesc, setTerminalNoticeDesc] = useState('');
  const [terminalNoticeLogs, setTerminalNoticeLogs] = useState<string[]>([]);
  const [terminalNoticeClearance, setTerminalNoticeClearance] = useState('LEVEL 5 COGNITIVE SECURE');
  const [terminalCustomInput, setTerminalCustomInput] = useState('');

  // Dashboard Drag & Drop states
  const [dashboardUploadedFile, setDashboardUploadedFile] = useState<File | null>(null);
  const [dashboardCalculatedHash, setDashboardCalculatedHash] = useState<string>('');
  const [isDashboardCalculatingHash, setIsDashboardCalculatingHash] = useState(false);
  const [dashboardFileStatusText, setDashboardFileStatusText] = useState('COPROCESSOR INGEST CACHE: Standby (Awaiting forensic carrier files)');

  const openTerminalNotice = (title: string, desc: string, logs: string[] = [], clearance: string = 'LEVEL 5 CORE') => {
    setTerminalNoticeTitle(title);
    setTerminalNoticeDesc(desc);
    setTerminalNoticeLogs([
      `[SENTINEL CORE] Initializing terminal view frame...`,
      `[SECURITY VERIFIED] Clearance protocol matched: ${clearance}`,
      `[DIAGNOSTICS] Module status mapped: NOMINAL/OFFLINE`,
      ...logs,
      `[AWAITING COMMAND] Ready for investigator parameters...`
    ]);
    setTerminalNoticeClearance(clearance);
    setIsTerminalNoticeOpen(true);
  };

  const openCustomOverlay = (
    type: string,
    title: string,
    message: string,
    details?: { label: string; value: string }[],
    icon: string = 'info',
    badge?: string,
    isError?: boolean,
    primaryAction?: { label: string; onClick: () => void }
  ) => {
    setActiveOverlay({
      type,
      title,
      message,
      details,
      icon,
      badge,
      isError,
      primaryAction
    });
  };

  const executeLockoutTerminal = () => {
    const newAudit: AuditLogEvent = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      investigatorId: 'CON-LOCKOUT-ERR',
      action: 'Emergency Hardware Lockout Engagement',
      targetId: '#ALL-CORES',
      status: 'TAMPER_DETECTED'
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    setHasTamperAlarmTriggered(true);

    openTerminalNotice(
      'EMERGENCY HARDWARE LOCKOUT PROTOCOL 9',
      'The sentinel investigator has manual physical lockout on Level 5 Keys. All telemetry data pipelines, in-memory volatile caches, and index synchronizers are quarantined until physical terminal reset.',
      [
        '[SECURITY-BREACH] Manual core lockout engaged!',
        '[HARDWARE] Quarantining in-memory volatile DB partitions...',
        '[LEDGER] Revoking Agent Miller active L5 cryptographic node registration...',
        '[LOCKOUT] Sentinel hardware key locked. Reflushing coprocessor parameters... OK'
      ],
      'LEVEL 1 PHYSICAL LOCKOUT'
    );
  };

  // Tamper detection states
  const [hasTamperAlarmTriggered, setHasTamperAlarmTriggered] = useState(false);
  const [testResult, setTestResult] = useState<{
    fileName: string;
    computedHash: string;
    expectedHash: string;
    comparedId: string;
    matched: boolean;
  } | null>(null);

  // Evidence ingestion states
  const [ingestionCaseId, setIngestionCaseId] = useState('SEC-9920-ARC');
  const [ingestionInvestigator, setIngestionInvestigator] = useState('Det. Miller');
  const [ingestionCategory, setIngestionCategory] = useState('Disk Image (Forensic Level)');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [isCalculatingHash, setIsCalculatingHash] = useState(false);
  const [streamLogs, setStreamLogs] = useState<string[]>([
    '[00:00:01] System Ready: Awaiting Ingestion Binary Stream...',
    '[00:00:02] Local Cryptographic Engine Active: WebCrypto SHA-256 Protocol Loaded',
    '[00:00:03] Buffer Check: 0 bytes queued. Integrity system status nominal.'
  ]);

  // Intake selection for testing
  const [selectedVerificationTargetId, setSelectedVerificationTargetId] = useState<string>('EVD-2023-081');
  const [predefinedExpectedHash, setPredefinedExpectedHash] = useState<string>('ff79a83d4e9c12b8d9ae01bc891f912b321ab982cc231145fab0c2429482912b');

  // Sync predefinedExpectedHash when selected verification target changes
  useEffect(() => {
    const targetItem = evidenceItems.find(i => i.id === selectedVerificationTargetId);
    if (targetItem) {
      setPredefinedExpectedHash(targetItem.initialHash);
    }
  }, [selectedVerificationTargetId, evidenceItems]);

  // Chain of Custody states
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('EVD-2023-081');
  const [handoverCustodian, setHandoverCustodian] = useState('');
  const [handoverReason, setHandoverReason] = useState('Secure Vault Archive');
  const [handoverVerifyCode, setHandoverVerifyCode] = useState('');
  const [showHandoverSuccess, setShowHandoverSuccess] = useState(false);

  // Search input state
  const [globalSearchToken, setGlobalSearchToken] = useState('');
  const [backendSearchResults, setBackendSearchResults] = useState<EvidenceItem[] | null>(null);

  const handleSearchSubmit = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setBackendSearchResults(null);
      return;
    }
    try {
      const res = await secureFetch(`/api/archives/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setBackendSearchResults(data);
      }
    } catch (err) {
      console.error('Failed to query archives via backend search:', err);
    }
  };

  // Simulated live hash activity metrics
  const [liveHashMetrics, setLiveHashMetrics] = useState({
    throughput: '4.24 TH/s',
    latency: '12ms'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveHashMetrics({
        throughput: (4.2 + Math.random() * 0.15).toFixed(2) + ' TH/s',
        latency: (10 + Math.floor(Math.random() * 6)).toString() + 'ms'
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hashing logic when a file is selected manually or via drag/drop in Intake View
  const handleFileProcess = async (file: File) => {
    setUploadedFile(file);
    setIsCalculatingHash(true);
    const updatedLogs = [
      ...streamLogs,
      `[Ingestion stream] Processing bits from raw source: "${file.name}"`,
      `[Ingestion stream] Parsing block buffer of size: ${formatBytes(file.size)}`,
      `[Crypto-Queue] Initiating hardware WebCrypto digest SHA-256 calculation...`
    ];
    setStreamLogs(updatedLogs);

    try {
      const hash = await calculateSHA256(file);
      setCalculatedHash(hash);
      
      const targetItem = evidenceItems.find(i => i.id === selectedVerificationTargetId);
      const expected = predefinedExpectedHash ? predefinedExpectedHash.toLowerCase().trim() : (targetItem ? targetItem.initialHash : hash).toLowerCase().trim();
      const matched = hash.toLowerCase().trim() === expected;

      setIsCalculatingHash(false);
      setStreamLogs(prev => [
        ...prev,
        `[WebCrypto API] Digest successfully derived: ${hash}`,
        `[Comparison Engine] Selected target for verification: ${selectedVerificationTargetId}`,
        `[Comparison Engine] Predefined Expected Hash: ${expected}`,
        matched 
          ? `[Integrity Check] Perfect match! Status: SECURE` 
          : `[WARNING] Integrity Check FAILED! Hash deviates from predefined expected hash!`
      ]);

      if (!matched) {
        setHasTamperAlarmTriggered(true);
      }

      setTestResult({
        fileName: file.name,
        computedHash: hash,
        expectedHash: expected,
        comparedId: selectedVerificationTargetId,
        matched: matched
      });

      // Write verification check to audit logs
      const newAudit: AuditLogEvent = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        investigatorId: 'SYS-AUTO-CHK',
        action: matched ? 'Integrity Verification Checked - Secure' : 'Integrity Verification Mismatch - Tamper Detected',
        targetId: '#' + selectedVerificationTargetId,
        status: matched ? 'VERIFIED' : 'TAMPER_DETECTED'
      };
      setAuditLogs(prev => [newAudit, ...prev]);

    } catch (err) {
      setIsCalculatingHash(false);
      setStreamLogs(prev => [...prev, `[ERROR] Cryptographic process failed: ${(err as Error).message}`]);
    }
  };

  // Dashboard drag and drop cryptoprocessor logic
  const handleDashboardFileProcess = async (file: File) => {
    setDashboardUploadedFile(file);
    setIsDashboardCalculatingHash(true);
    setDashboardFileStatusText(`[Crypto-Processor] Initializing byte stream for: "${file.name}"`);

    try {
      const hash = await calculateSHA256(file);
      setDashboardCalculatedHash(hash);
      setIsDashboardCalculatingHash(false);
      setDashboardFileStatusText(`[SUCCESS] Found SHA-256 Checksum: ${hash.substring(0, 24)}...`);

      // Write to audit log
      const newAudit: AuditLogEvent = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        investigatorId: 'SYS-COPROCESSOR',
        action: `Dashboard Bitstream Ingested: ${file.name}`,
        targetId: '#HASH-CALC',
        status: 'VERIFIED'
      };
      setAuditLogs(prev => [newAudit, ...prev]);

      // Pop overlay success
      openCustomOverlay(
        'dashboard_hash',
        'Coprocessor Ingest Complete',
        `The cryptographic bitstream footprint for "${file.name}" has been processed and locked on-the-fly under SHA-256 standard protocols. The calculated checksum represents the exact content bitwise.`,
        [
          { label: 'Carrier Filename', value: file.name },
          { label: 'Calculated SHA-256 Checksum', value: hash },
          { label: 'Raw Vector Size', value: formatBytes(file.size) },
          { label: 'Processing Velocity', value: '1,424.12 MB/s' }
        ],
        'shield',
        'ACTIVE COPROCESSOR INGEST'
      );
    } catch (err) {
      setIsDashboardCalculatingHash(false);
      setDashboardFileStatusText(`[ERROR] Cryptographic process failed: ${(err as Error).message}`);
    }
  };

  // Simulating custom test scenarios for convenience
  const runSimulation = (isTamperedSim: boolean) => {
    setIsCalculatingHash(true);
    setStreamLogs(prev => [
      ...prev,
      `[Simulation Mode] Generating simulated forensic ingest byte-stream...`,
      `[Simulation Mode] Computing SHA-256 via hardware instructions...`
    ]);

    setTimeout(() => {
      const targetItem = evidenceItems.find(i => i.id === selectedVerificationTargetId);
      const expected = predefinedExpectedHash ? predefinedExpectedHash.toLowerCase().trim() : (targetItem ? targetItem.initialHash : 'ff79a83d4e9c12b8d9ae01bc891f912b321ab982cc231145fab0c2429482912b').toLowerCase().trim();
      
      let computed = expected;
      if (isTamperedSim) {
        computed = expected.substring(0, 10) + 'bad3b11f00d' + expected.substring(22);
      }

      const matched = computed.toLowerCase().trim() === expected;

      setCalculatedHash(computed);
      setIsCalculatingHash(false);

      setStreamLogs(prev => [
        ...prev,
        `[Simulation WebCrypto API] Calculated Hash: ${computed}`,
        `[Comparison Engine] Selected target: ${selectedVerificationTargetId} (${targetItem?.fileName})`,
        `[Comparison Engine] Predefined Expected Hash: ${expected}`,
        matched 
          ? `[Integrity Check] Match! Hash corresponds exactly with predefined expected hash` 
          : `[CRITICAL WARNING] MISMATCH DETECTED! Bitstream has been modified or corrupted!`
      ]);

      if (!matched) {
        setHasTamperAlarmTriggered(true);
      }

      setTestResult({
        fileName: targetItem ? `SIMULATED_${targetItem.fileName}` : 'SIM_IMAGE.raw',
        computedHash: computed,
        expectedHash: expected,
        comparedId: selectedVerificationTargetId,
        matched: matched
      });

      const newAudit: AuditLogEvent = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        investigatorId: 'SYS-AUTO-CHK',
        action: matched ? 'Integrity Ingest Verification Checked' : 'Critical Integrity Check Breach',
        targetId: '#' + selectedVerificationTargetId,
        status: matched ? 'VERIFIED' : 'TAMPER_DETECTED'
      };
      setAuditLogs(prev => [newAudit, ...prev]);

    }, 1200);
  };

  // Logging and formalizing new evidence ingestion
  const handleFormalIngest = () => {
    if (!calculatedHash) {
      openCustomOverlay(
        'no_hash',
        'Ingest Stream Empty',
        'Please calculate a cryptographic hash first by drag-dropping or choosing a file in the Forensic Media Controller.',
        [],
        'warning',
        'VALIDATION WARNING',
        true
      );
      return;
    }

    const newId = `EVD-2026-0${evidenceItems.length + 1}`;
    const newFileName = uploadedFile ? uploadedFile.name : `Seized_Forensic_${newId}.raw`;
    
    const newEvidence: EvidenceItem = {
      id: newId,
      fileName: newFileName,
      hash: calculatedHash,
      initialHash: calculatedHash,
      custodian: ingestionInvestigator,
      status: 'Secure',
      category: ingestionCategory,
      caseId: ingestionCaseId,
      investigator: ingestionInvestigator,
      sizeBytes: uploadedFile ? uploadedFile.size : 24890000,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      description: `Formal ingest logged securely through Sentinel Local Cryptographic module. Verified secure anchor.`,
      handovers: []
    };

    // Synchronize to the backend database JSON store
    secureFetch('/api/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvidence)
    }).catch(err => {
      console.error('Failed to write back newly ingested evidence to backend datastore:', err);
    });

    setEvidenceItems(prev => [newEvidence, ...prev]);

    const newAudit: AuditLogEvent = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      investigatorId: 'L5-MILLER',
      action: 'Secure Forensic Ingest Complete',
      targetId: '#' + newId,
      status: 'VERIFIED'
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Reset temporary uploaded variables
    setUploadedFile(null);
    setCalculatedHash('');
    setTestResult(null);

    openCustomOverlay(
      'ingest_deck_success',
      'Ingestion Anchored Securely',
      `Forensic asset "${newFileName}" was mapped to system registers successfully under cryptographic target ${newId}.`,
      [
        { label: 'File Name', value: newFileName },
        { label: 'Archival ID', value: newId },
        { label: 'Ingest Path', value: ingestionCategory },
        { label: 'Assigned Case ID', value: ingestionCaseId }
      ],
      'verified',
      'SECURE ARCHIVE COMMITTED'
    );
  };

  // Authorizing handover & updating timeline ledger
  const handleHandoverAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverCustodian) {
      openCustomOverlay(
        'no_custodian',
        'Transfer Authorization Failed',
        'Please specify the receiving custodian ID & node point destination before signing this transaction.',
        [],
        'warning',
        'SECURITY EXCEPTION',
        true
      );
      return;
    }
    if (!handoverVerifyCode) {
      openCustomOverlay(
        'no_credentials',
        'Verification Credentials Required',
        'Security authorization verification credentials required (AES-256 Auth clearance code signature).',
        [],
        'key',
        'SECURITY EXCEPTION',
        true
      );
      return;
    }

    const currentItem = evidenceItems.find(i => i.id === selectedEvidenceId);
    if (!currentItem) return;

    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    // Append standard handover event
    const newHandover = {
      from: currentItem.custodian,
      to: handoverCustodian,
      timestamp: timestampStr,
      reason: handoverReason
    };

    const nextHandovers = currentItem.handovers ? [...currentItem.handovers, newHandover] : [newHandover];

    // Synchronize custody modifications live to server-side JSON registers
    secureFetch(`/api/evidence/${selectedEvidenceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        custodian: handoverCustodian,
        handovers: nextHandovers
      })
    }).catch(err => {
      console.error('Failed to sync custody handover back to server-side JSON store:', err);
    });

    // Update custody state
    const updatedItems = evidenceItems.map(item => {
      if (item.id === selectedEvidenceId) {
        return {
          ...item,
          custodian: handoverCustodian,
          handovers: nextHandovers
        };
      }
      return item;
    });

    setEvidenceItems(updatedItems);

    // Write to audit log ledger
    const newAudit: AuditLogEvent = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      investigatorId: 'INV-8821-X',
      action: `Custody Handover - Node Transfer ${currentItem.custodian} -> ${handoverCustodian}`,
      targetId: '#' + selectedEvidenceId,
      status: currentItem.status === 'Tampered' ? 'WARNING' : 'VERIFIED'
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    setShowHandoverSuccess(true);
    setHandoverCustodian('');
    setHandoverVerifyCode('');

    setTimeout(() => {
      setShowHandoverSuccess(false);
    }, 4000);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleTabClick = (view: ScreenView) => {
    window.location.hash = '#/' + view;
    setIsMenuOpen(false);
  };

  // Filter evidence based on global search token or backend search results
  const filteredEvidence = backendSearchResults !== null
    ? backendSearchResults
    : evidenceItems.filter(item => {
        const s = globalSearchToken.toLowerCase().trim();
        return (
          item.id.toLowerCase().includes(s) ||
          item.fileName.toLowerCase().includes(s) ||
          item.custodian.toLowerCase().includes(s) ||
          item.hash.toLowerCase().includes(s)
        );
      });

  const selectedItem = evidenceItems.find(i => i.id === selectedEvidenceId) || evidenceItems[0];

  return (
    <div className="relative w-[100vw] h-[100vh] flex flex-col overflow-hidden bg-[#06080c] text-[#c5c6cd] font-sans selection:bg-tertiary/30">
      
      {/* 0. Global Connection Interrupted Banner */}
      <AnimatePresence>
        {isConnectionInterrupted && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="fixed top-0 left-0 right-0 z-[150] h-14 bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] text-black shadow-[0_4px_30px_rgba(217,119,6,0.35)] flex items-center justify-between px-6 border-b border-[#f59e0b]"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg animate-pulse font-bold">wifi_off</span>
              <span className="tracking-[0.06em] font-extrabold text-[11px] font-mono uppercase select-none">
                Connection Interrupted: Restoring Secure Server Synchronicity
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider bg-black/10 px-2 py-1 rounded border border-black/5 font-extrabold select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                <span>LINK_STABILITY: RED/RETRIES_ACTIVE</span>
              </div>
              <button 
                onClick={() => setIsConnectionInterrupted(false)}
                className="w-7 h-7 rounded-full hover:bg-black/15 flex items-center justify-center transition-all cursor-pointer border-none outline-none"
              >
                <span className="material-symbols-outlined text-base font-bold">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Global Tamper Detected Flashing Alert Banner */}
      <AnimatePresence>
        {hasTamperAlarmTriggered && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="flashing-tamper-banner fixed top-0 left-0 right-0 h-16 z-[100] flex items-center justify-between px-8 text-white font-label-caps"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl blinking text-white">warning</span>
              <span className="tracking-[0.08em] font-bold text-sm">
                CRITICAL SECURITY VIOLATION: TAMPER DETECTED. SYSTEM FINGERPRINT INTEGRITY COMPROMISED!
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  openCustomOverlay(
                    'shutdown_alert',
                    'EMERGENCY HARDWARE SHUTDOWN LOCKED',
                    'A mechanical hardware lockout command has been instantly submitted. Volatile caches and state ports are now isolated from network routing targets.',
                    [
                      { label: 'Sentinel Core Shield', value: 'HARD BOUND DETACHED' },
                      { label: 'Status Key', value: 'SYS_LOCK_9971' }
                    ],
                    'emergency_home',
                    'CRITICAL SHIELD'
                  );
                  const shutdownAudit: AuditLogEvent = {
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    investigatorId: 'SENTINEL-SHIELD',
                    action: 'Emergency Hardware Lockout Executed',
                    targetId: '#ALL-STATIONS',
                    status: 'WARNING'
                  };
                  setAuditLogs(prev => [shutdownAudit, ...prev]);
                  handleTabClick('audit');
                }}
                className="px-4 py-1.5 bg-black text-error border border-error/50 rounded hover:bg-black/50 text-[11px] font-bold transition-all cursor-pointer"
              >
                LOCKOUT SYSTEM
              </button>
              <button 
                onClick={() => {
                  setHasTamperAlarmTriggered(false);
                  setTestResult(null);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors cursor-pointer"
                title="Dismiss Alarm & Reset Environment"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Global Fixed Header (TopAppBar) - Modularly Integrated */}
      <NavigationHeader 
        toggleMenu={toggleMenu}
        globalSearchToken={globalSearchToken}
        setGlobalSearchToken={setGlobalSearchToken}
        openCustomOverlay={openCustomOverlay}
        liveHashMetrics={liveHashMetrics}
        hasTamperAlarmTriggered={hasTamperAlarmTriggered}
        handleTabClick={handleTabClick}
        onSearchEnter={handleSearchSubmit}
      />

      {/* 3. Sliding and Persistent Sidebar Menu Framework */}
      <div className={`flex flex-row w-full transition-all duration-300 overflow-hidden shrink-0 ${
        hasTamperAlarmTriggered ? 'h-[calc(100vh-224px)] mt-36' : 'h-[calc(100vh-160px)] mt-20'
      }`}>
        <SidebarMenu
          isMenuOpen={isMenuOpen}
          toggleMenu={toggleMenu}
          setIsMenuOpen={setIsMenuOpen}
          activeView={activeView}
          handleTabClick={handleTabClick}
          executeLockoutTerminal={executeLockoutTerminal}
          setHasTamperAlarmTriggered={setHasTamperAlarmTriggered}
          openTerminalNotice={openTerminalNotice}
        />

        {/* 4. Unified Display Viewport Screen Container */}
        <main className="flex-grow flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar bg-[#06080c] shrink-0 pb-12">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <DashboardView
                evidenceItems={evidenceItems}
                filteredEvidence={filteredEvidence}
                setGlobalSearchToken={setGlobalSearchToken}
                selectedEvidenceId={selectedEvidenceId}
                setSelectedEvidenceId={setSelectedEvidenceId}
                setSelectedVerificationTargetId={setSelectedVerificationTargetId}
                handleTabClick={handleTabClick}
                setAuditLogs={setAuditLogs}
                hasTamperAlarmTriggered={hasTamperAlarmTriggered}
                testResult={testResult}
                dashboardUploadedFile={dashboardUploadedFile}
                dashboardFileStatusText={dashboardFileStatusText}
                isDashboardCalculatingHash={isDashboardCalculatingHash}
                handleDashboardFileProcess={handleDashboardFileProcess}
                openCustomOverlay={openCustomOverlay}
                secureFetch={secureFetch}
              />
            )}

            {activeView === 'forensics' && (
              <IntakeView
                evidenceItems={evidenceItems}
                selectedVerificationTargetId={selectedVerificationTargetId}
                setSelectedVerificationTargetId={setSelectedVerificationTargetId}
                predefinedExpectedHash={predefinedExpectedHash}
                setPredefinedExpectedHash={setPredefinedExpectedHash}
                ingestionCaseId={ingestionCaseId}
                setIngestionCaseId={setIngestionCaseId}
                ingestionInvestigator={ingestionInvestigator}
                setIngestionInvestigator={setIngestionInvestigator}
                ingestionCategory={ingestionCategory}
                setIngestionCategory={setIngestionCategory}
                uploadedFile={uploadedFile}
                calculatedHash={calculatedHash}
                isCalculatingHash={isCalculatingHash}
                streamLogs={streamLogs}
                testResult={testResult}
                handleFileProcess={handleFileProcess}
                runSimulation={runSimulation}
                handleFormalIngest={handleFormalIngest}
              />
            )}

            {activeView === 'archive' && (
              <CustodyView
                evidenceItems={evidenceItems}
                selectedEvidenceId={selectedEvidenceId}
                setSelectedEvidenceId={setSelectedEvidenceId}
                selectedItem={selectedItem}
                handoverCustodian={handoverCustodian}
                setHandoverCustodian={setHandoverCustodian}
                handoverReason={handoverReason}
                setHandoverReason={setHandoverReason}
                handoverVerifyCode={handoverVerifyCode}
                setHandoverVerifyCode={setHandoverVerifyCode}
                showHandoverSuccess={showHandoverSuccess}
                handleHandoverAuthorize={handleHandoverAuthorize}
              />
            )}

            {activeView === 'audit' && (
              <AuditView
                auditLogs={auditLogs}
                hasTamperAlarmTriggered={hasTamperAlarmTriggered}
                liveHashMetrics={liveHashMetrics}
              />
            )}

            {activeView === 'settings' && (
              <SettingsView
                hasTamperAlarmTriggered={hasTamperAlarmTriggered}
                setHasTamperAlarmTriggered={setHasTamperAlarmTriggered}
                openCustomOverlay={openCustomOverlay}
                isFetching={isFetching}
                setIsFetching={setIsFetching}
                isConnectionInterrupted={isConnectionInterrupted}
                setIsConnectionInterrupted={setIsConnectionInterrupted}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* 4.5. High-Tech Animated Floating Progress Spinner */}
      <AnimatePresence>
        {(isFetching || isCalculatingHash || isDashboardCalculatingHash) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="fixed bottom-24 right-8 z-[120] flex items-center gap-3 bg-[#0d131f]/95 border border-tertiary/40 px-4 py-2.5 rounded-full shadow-[0_0_30px_rgba(56,222,187,0.25)] backdrop-blur-md select-none"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              {/* Spinning outer cyber-ring */}
              <div className="absolute inset-0 rounded-full border-2 border-tertiary/20 border-t-tertiary animate-spin" />
              {/* Inner glowing pulse */}
              <div className="w-2.5 h-2.5 bg-tertiary rounded-full animate-ping opacity-75" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono tracking-widest text-tertiary uppercase font-extrabold animate-pulse">
                {isCalculatingHash || isDashboardCalculatingHash ? 'COPROCESSOR WORKING' : 'SYNCHRONIZING DIGITAL LEDGER...'}
              </span>
              <span className="text-[7px] font-mono text-[#a5a6ad]/60 uppercase tracking-widest">
                SECURE TUNNEL TRANSLATION
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Fixed Common Footer status panel - Modularly Integrated */}
      <BottomSystemStatusBar
        evidenceItems={evidenceItems}
        selectedVerificationTargetId={selectedVerificationTargetId}
        openCustomOverlay={openCustomOverlay}
        hasTamperAlarmTriggered={hasTamperAlarmTriggered}
        setHasTamperAlarmTriggered={setHasTamperAlarmTriggered}
        setTestResult={setTestResult}
      />

      {/* Sleek Custom Interactive Overlays */}
      <AnimatePresence>
        {activeOverlay && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 select-none">
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveOverlay(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Modal Dialog Content container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative max-w-xl w-full bg-[#1b1b1d] rounded-xl border border-outline-variant/60 shadow-[0_0_50px_rgba(3,7,18,0.8)] overflow-hidden ${
                activeOverlay.isError ? 'shadow-[0_0_40px_rgba(255,180,171,0.15)] ring-1 ring-error/35 animate-fade-in' : 'shadow-[0_0_40px_rgba(56,222,187,0.1)] ring-1 ring-tertiary/20'
              }`}
            >
              {/* Header bar of popup card */}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                activeOverlay.isError 
                  ? 'bg-error-container/20 border-error/20 text-error' 
                  : 'bg-[#0f121a] border-outline-variant/30 text-primary'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${activeOverlay.isError ? 'text-error animate-pulse' : 'text-tertiary'}`}>
                    {activeOverlay.icon || 'verified_user'}
                  </span>
                  <span className="font-label-caps text-xs tracking-wider uppercase font-bold">
                    {activeOverlay.badge || 'Sentinel Systems Node'}
                  </span>
                </div>
                <button 
                  onClick={() => setActiveOverlay(null)}
                  className="p-1 text-[#c5c6cd] hover:text-white cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-4">
                <h3 className="font-sans text-xl font-extrabold text-white leading-tight uppercase select-none">
                  {activeOverlay.title}
                </h3>
                <p className="font-sans text-sm text-[#c5c6cd]/90 leading-relaxed">
                  {activeOverlay.message}
                </p>

                {activeOverlay.details && activeOverlay.details.length > 0 && (
                  <div className="bg-[#090b0f] rounded-lg border border-white/5 p-4 space-y-2 mt-4 select-none">
                    <div className="text-[10px] font-label-caps text-[#c5c6cd]/40 tracking-widest font-bold uppercase pb-1 border-b border-white/5">
                      Operational Ledger Parameters
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-2">
                      {activeOverlay.details.map((detail, idx) => (
                        <div key={idx} className="flex flex-col">
                          <span className="text-[9px] font-mono uppercase text-[#c5c6cd]/50 tracking-wider">
                            {detail.label}
                          </span>
                          <span className="text-xs font-mono font-bold text-white tracking-wide break-all mt-0.5">
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Acknowledgement Footer */}
              <div className="px-6 py-4 border-t border-outline-variant/30 bg-[#0c0e14] flex justify-end gap-2 select-none">
                {activeOverlay.primaryAction && (
                  <button 
                    onClick={() => {
                      activeOverlay.primaryAction?.onClick();
                      setActiveOverlay(null);
                    }}
                    className="px-4 py-2 bg-primary hover:brightness-110 text-on-primary rounded font-label-caps text-[11px] tracking-wider transition-all font-bold cursor-pointer"
                  >
                    {activeOverlay.primaryAction.label}
                  </button>
                )}
                <button 
                  onClick={() => setActiveOverlay(null)}
                  className="px-4 py-2 bg-[#171b26] hover:bg-[#202636] text-[#c5c6cd] hover:text-white border border-outline-variant/30 rounded font-label-caps text-[11px] tracking-wider transition-all font-bold cursor-pointer"
                >
                  ESTABLISH ACKNOWLEDGEMENT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sleek sliding System Terminal Notice panel */}
      <AnimatePresence>
        {isTerminalNoticeOpen && (
          <>
            {/* Backdrop slide-out overlay shadow */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTerminalNoticeOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[80] block pointer-events-auto"
            />
            {/* Right slider terminal deck panel */}
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="fixed top-0 right-0 h-full md:w-[480px] w-full bg-[#090b0f] border-l border-outline-variant/60 z-[90] flex flex-col justify-between shadow-[0_0_60px_rgba(0,0,0,0.85)] ring-1 ring-tertiary/10 pointer-events-auto"
            >
              {/* Header area of terminal */}
              <div className="px-6 py-6 border-b border-outline-variant/35 bg-[#0e111a] flex justify-between items-center select-none">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse shadow-[0_0_10px_#38debb]"></div>
                  <div>
                    <h3 className="font-display-lg text-sm text-primary font-extrabold uppercase tracking-widest leading-none">
                      System Terminal Notice
                    </h3>
                    <p className="text-[9px] font-mono text-[#8f9097] mt-1 select-none">
                      Clearance: <span className="text-tertiary font-bold">{terminalNoticeClearance}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsTerminalNoticeOpen(false)}
                  className="p-1 text-[#c5c6cd] hover:text-white cursor-pointer"
                  aria-label="Close terminal notice"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Body area containing CLI console logs */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* Module summary explaining what the code represents */}
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-[#121622] rounded text-[10px] text-tertiary font-label-caps uppercase font-bold tracking-widest border border-tertiary/20 select-none">
                    Functional Module Description
                  </span>
                  <h4 className="text-white text-base font-bold uppercase tracking-wide">
                    {terminalNoticeTitle}
                  </h4>
                  <p className="text-xs text-[#c5c6cd]/95 leading-relaxed font-sans mt-2">
                    {terminalNoticeDesc}
                  </p>
                </div>

                {/* Cyberpunk retro style terminal log screen */}
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#c5c6cd]/40 uppercase tracking-widest select-none">
                    <span>Active Ingest Console Stream</span>
                    <span className="blinking text-tertiary font-bold">● LIVE TERMINAL</span>
                  </div>
                  
                  <div className="bg-black/90 rounded-lg border border-[#232b3c] p-6 font-data-mono text-[11px] space-y-2 h-[220px] overflow-y-auto custom-scrollbar select-none shadow-inner animate-pulse">
                    {terminalNoticeLogs.map((log, idx) => {
                      let styleClass = 'text-tertiary/90';
                      if (log.includes('[ERROR]') || log.includes('BREACH')) styleClass = 'text-error font-semibold';
                      else if (log.includes('[SECURITY]')) styleClass = 'text-primary font-semibold';
                      return (
                        <p key={idx} className={styleClass}>{log}</p>
                      );
                    })}
                    <div className="flex items-center gap-1.5 text-white/40 pt-1 border-t border-white/5">
                      <span>$</span>
                      <span className="animate-pulse font-bold text-white">_</span>
                    </div>
                  </div>
                </div>

                {/* High tech simulation playground inside terminal notice */}
                <div className="bg-[#0f1118]/60 p-4 rounded-xl border border-white/5 space-y-4">
                  <div className="text-[10px] font-label-caps text-[#c5c6cd]/50 uppercase tracking-widest font-bold">
                    Sandbox Parameter Injection
                  </div>
                  <div className="flex items-center bg-black/40 rounded border border-white/10 px-4 py-2">
                    <span className="font-mono text-tertiary mr-2 text-xs">$</span>
                    <input 
                      value={terminalCustomInput}
                      onChange={(e) => setTerminalCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && terminalCustomInput.trim()) {
                          const userCmd = terminalCustomInput;
                          setTerminalNoticeLogs(prev => [
                            ...prev,
                            `[USER-COMMAND] Input parameter entered: "${userCmd}"`,
                            `[COPROCESSOR-RESOLVER] Synthesizing security vectors and calibrating node settings...`,
                            `[SECURE-STREAM] Successfully parsed state parameter: 0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase()}`
                          ]);
                          setTerminalCustomInput('');
                        }
                      }}
                      className="bg-transparent border-none focus:outline-none w-full text-[11px] font-mono text-white placeholder:text-[#c5c6cd]/20 py-0.5" 
                      placeholder="Type variable and hit Enter to feed terminal..." 
                    />
                  </div>
                  <p className="text-[10px] text-[#c5c6cd]/40 leading-relaxed">
                    <b>Node diagnostics playground:</b> This allows the investigator to inject variables and monitor the mock diagnostic output on-the-fly.
                  </p>
                </div>
              </div>

              {/* Close Acknowledgement Footer */}
              <div className="px-6 py-4 border-t border-outline-variant/30 bg-[#0c0e14] flex justify-end select-none">
                <button 
                  onClick={() => setIsTerminalNoticeOpen(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-tertiary to-[#00937a] text-[#05060a] rounded font-label-caps text-xs tracking-wider font-extrabold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-[#38debb]/10"
                >
                  ACKNOWLEDGE TELEMETRY & CLEAR
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Embedded interactive background scanlines */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] scanline pointer-events-none select-none" />
    </div>
  );
}
