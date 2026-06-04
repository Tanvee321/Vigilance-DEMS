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
  formatBytes,
  getCategoryPlaceholder
} from './utils';
import { EvidenceItem, AuditLogEvent, ScreenView, MasterStreamLog } from './types';

// Modular Component Imports
import { NavigationHeader } from './components/NavigationHeader';
import { SidebarMenu } from './components/SidebarMenu';
import { BottomSystemStatusBar } from './components/BottomSystemStatusBar';
import { DashboardView } from './components/DashboardView';
import { IntakeView } from './components/IntakeView';
import { CustodyView } from './components/CustodyView';
import { AuditView } from './components/AuditView';
import { SettingsView } from './components/SettingsView';

const ALLOWED_EXTENSIONS = [
  '.raw', '.aff4', '.dd', '.e01', '.txt', '.log', 
  '.pcap', '.pcapng', '.dmp', '.vmem', '.iso', '.vmdk', '.ova'
];

const checkFileValidation = (fileName: string, category: string): boolean => {
  const normCategory = (category || '').toLowerCase();
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const ext = fileName.substring(dotIndex).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return false;
  }
  
  if (normCategory.includes('disk image')) {
    return ['.raw', '.aff4', '.dd', '.e01'].includes(ext);
  }
  if (normCategory.includes('network traffic')) {
    return ['.pcap', '.pcapng', '.log'].includes(ext);
  }
  if (normCategory.includes('volatile memory')) {
    return ['.raw', '.dmp', '.vmem'].includes(ext);
  }
  if (normCategory.includes('encrypted storage')) {
    return ['.iso', '.vmdk', '.ova'].includes(ext);
  }
  if (normCategory.includes('logical')) {
    return ['.txt', '.log'].includes(ext);
  }
  return true;
};

export default function App() {
  // Global React state
  const [uploadSecurityExclusionError, setUploadSecurityExclusionError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentialInput, setCredentialInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [revealedPasscode, setRevealedPasscode] = useState('');
  const [resetPasskey, setResetPasskey] = useState('');

  // Device-isolated Forgot Password states
  const [hasSecurityExclusion, setHasSecurityExclusion] = useState(false);
  const [locallyRegisteredEmails, setLocallyRegisteredEmails] = useState<string[]>(() => {
    try {
      const stored1 = localStorage.getItem('locally_registered_emails');
      const stored2 = localStorage.getItem('registeredEmails');
      const emailsList = new Set<string>();
      if (stored1) {
        const parsed = JSON.parse(stored1);
        if (Array.isArray(parsed)) parsed.forEach(e => emailsList.add(e));
      }
      if (stored2) {
        const parsed = JSON.parse(stored2);
        if (Array.isArray(parsed)) parsed.forEach(e => emailsList.add(e));
      }
      
      if (!emailsList.has('tanvee.zalera@gmail.com')) {
        emailsList.add('tanvee.zalera@gmail.com');
      }
      return Array.from(emailsList);
    } catch (e) {
      console.warn(e);
    }
    return ['tanvee.zalera@gmail.com'];
  });
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isTokenDispatched, setIsTokenDispatched] = useState<boolean>(false);
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>('');
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  // Registration States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPasskey, setRegisterPasskey] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');

  const [activeView, setActiveView] = useState<ScreenView>('dashboard');
  const [sessionUser, setSessionUser] = useState({
    email: 'tanvee.zalera@gmail.com',
    name: 'Tanvee Zakera',
    role: 'Lead Investigator',
    clearance: 'LEVEL 5 SOVEREIGN'
  });
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>(INITIAL_AUDIT_LOG_EVENTS);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [isConnectionInterrupted, setIsConnectionInterrupted] = useState(false);
  const activeFetchesCount = useRef(0);

  // Monitor network status using native browser offline and online event listeners
  useEffect(() => {
    const handleOffline = () => setIsConnectionInterrupted(true);
    const handleOnline = () => setIsConnectionInterrupted(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    setIsConnectionInterrupted(!window.navigator.onLine);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  const mainScrollContainerRef = useRef<HTMLElement | null>(null);

  // Reset scroll position to top whenever active view changes
  useEffect(() => {
    if (mainScrollContainerRef.current) {
      mainScrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeView]);

  // Dynamically sync ingestion investigator to the authenticated sessionUser name
  useEffect(() => {
    if (sessionUser && sessionUser.name) {
      setIngestionInvestigator(sessionUser.name);
    }
  }, [sessionUser]);

  // High-Tech Interceptor for all Network API Requests with built-in state tracking and 8s automatic timeouts
  const secureFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    activeFetchesCount.current++;
    setIsFetching(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 8000);

    const headers = new Headers(init?.headers);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${sessionUser.email}`);
    }
    if (!headers.has('x-user-id')) {
      headers.set('x-user-id', sessionUser.email);
    }

    const mergedInit = {
      ...init,
      headers,
      signal: init?.signal || controller.signal,
    };

    try {
      const response = await window.fetch(input, mergedInit);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    } finally {
      activeFetchesCount.current--;
      if (activeFetchesCount.current <= 0) {
        activeFetchesCount.current = 0;
        setIsFetching(false);
      }
    }
  };

  // Fetch evidence records directly from our backend SQLite relational table
  const fetchEvidence = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await secureFetch('/api/evidence');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEvidenceItems(data);
        }
      }
    } catch (err) {
      console.error('Failed to synchronize database records from API', err);
    }
  };

  // Synchronize database records from our full-stack backend
  useEffect(() => {
    fetchEvidence();
  }, [isAuthenticated, sessionUser.email]);

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
      setUploadSecurityExclusionError(null);
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
    if (clearance && clearance.includes('LOGOUT')) {
      setIsAuthenticated(false);
      setCredentialInput('');
    }
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
  const [ingestionInvestigator, setIngestionInvestigator] = useState('Tanvee Zakera');
  const [ingestionCategory, setIngestionCategory] = useState('Disk Image (Forensic Level)');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [isCalculatingHash, setIsCalculatingHash] = useState(false);
  const [streamLogs, setStreamLogs] = useState<string[]>([
    '[00:00:01] System Ready: Awaiting Ingestion Binary Stream...',
    '[00:00:02] Local Cryptographic Engine Active: WebCrypto SHA-256 Protocol Loaded',
    '[00:00:03] Buffer Check: 0 bytes queued. Integrity system status nominal.'
  ]);

  const [masterStreamLogs, setMasterStreamLogs] = useState<MasterStreamLog[]>([
    { timestamp: '17:33:50', type: 'SESSION', text: 'Agent J. Miller authorized with L5 keys under Node-01.' },
    { timestamp: '14:22:01', type: 'AUTH', text: 'User Carter signature validated via Terminal-Node B4.' },
    { timestamp: '14:23:45', type: 'HASH', text: 'Automatic SHA-256 integrity validation returned Secure for CCTV_Lobby_Main.mp4.', isSuccess: true },
    { timestamp: '14:25:12', type: 'NODE', text: 'Secure socket uplink established with backup cluster satellite [S-09].' },
    { timestamp: '14:26:00', type: 'WARN', text: 'Intersecting telemetry. Verification queue checks on SmartPhone_Dump_Full.zip flag discrepancy!', isError: true }
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
    const isValid = checkFileValidation(file.name, ingestionCategory);
    if (!isValid) {
      setUploadedFile(null);
      setCalculatedHash('');
      setIsCalculatingHash(false);
      setUploadSecurityExclusionError('SECURITY EXCLUSION: Invalid file vector for the selected forensic category. Asset rejected from ingestion stream.');
      
      setStreamLogs(prev => [
        ...prev,
        `[SECURITY EXCLUSION] Invalid file vector: "${file.name}" does NOT match requirement categories for "${ingestionCategory}"!`,
        `[REJECTED] Forensic asset rejected from ingestion stream.`
      ]);

      setMasterStreamLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          text: `SECURITY EXCLUSION: File vector "${file.name}" rejected. Incorrect format for category: "${ingestionCategory}".`,
          isError: true
        },
        ...prev
      ]);

      openCustomOverlay(
        'security_exclusion_alert',
        'Ingestion Blocked - Protocol Rejection',
        'SECURITY EXCLUSION: Invalid file vector for the selected forensic category. Asset rejected from ingestion stream.',
        [
          { label: 'File Name', value: file.name },
          { label: 'Target Category', value: ingestionCategory },
          { label: 'Ingest Status', value: 'IMMEDIATE DISCARD / FORBIDDEN ACCESS' }
        ],
        'warning',
        'SECURITY ALERT',
        true
      );
      return;
    }

    setUploadSecurityExclusionError(null);
    setUploadedFile(file);
    setIsCalculatingHash(true);
    const updatedLogs = [
      ...streamLogs,
      `[Ingestion stream] Processing bits from raw source: "${file.name}"`,
      `[Ingestion stream] Parsing block buffer of size: ${formatBytes(file.size)}`,
      `[Crypto-Queue] Initiating hardware WebCrypto digest SHA-256 calculation...`
    ];
    setStreamLogs(updatedLogs);

    setMasterStreamLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type: 'INGRESS',
        text: `Forensic payload "${file.name}" received at Ingress Port. Handshaking SHA-256 validation...`
      },
      ...prev
    ]);

    try {
      const hash = await calculateSHA256(file);
      setCalculatedHash(hash);
      
      // Auto-match by file name!
      let targetIdToUse = selectedVerificationTargetId;
      let targetItem = evidenceItems.find(i => i.id === selectedVerificationTargetId);
      const matchingFileNameItem = evidenceItems.find(
        i => i.fileName.toLowerCase().trim() === file.name.toLowerCase().trim()
      );
      
      if (matchingFileNameItem) {
        targetIdToUse = matchingFileNameItem.id;
        targetItem = matchingFileNameItem;
        setSelectedVerificationTargetId(matchingFileNameItem.id);
        setPredefinedExpectedHash(matchingFileNameItem.initialHash);
      }
      
      const expected = matchingFileNameItem
        ? matchingFileNameItem.initialHash.toLowerCase().trim()
        : (predefinedExpectedHash ? predefinedExpectedHash.toLowerCase().trim() : (targetItem ? targetItem.initialHash : hash).toLowerCase().trim());
      const matched = hash.toLowerCase().trim() === expected;

      setIsCalculatingHash(false);
      setStreamLogs(prev => [
        ...prev,
        `[WebCrypto API] Digest successfully derived: ${hash}`,
        `[Comparison Engine] Selected target for verification: ${targetIdToUse}`,
        `[Comparison Engine] Predefined Expected Hash: ${expected}`,
        matched 
          ? `[Integrity Check] Perfect match! Status: SECURE` 
          : `[WARNING] Integrity Check FAILED! Hash deviates from predefined expected hash!`
      ]);

      if (matched) {
        setHasTamperAlarmTriggered(false);
      } else {
        setHasTamperAlarmTriggered(true);
      }

      setMasterStreamLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: matched ? 'SECURE' : 'ALERT',
          text: matched 
            ? `Dynamic verification SUCCESS: "${file.name}" fits initial index standard (SECURE match with Reference #${targetIdToUse}).`
            : `CRITICAL INTEGRITY DEVIATION: "${file.name}" byte mismatch detected against reference #${targetIdToUse}!`,
          isSuccess: matched,
          isError: !matched
        },
        ...prev
      ]);

      setTestResult({
        fileName: file.name,
        computedHash: hash,
        expectedHash: expected,
        comparedId: targetIdToUse,
        matched: matched
      });

      // Write verification check to audit logs
      const newAudit: AuditLogEvent = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        investigatorId: 'SYS-AUTO-CHK',
        action: matched ? 'Integrity Verification Checked - Secure' : 'Integrity Verification Mismatch - Tamper Detected',
        targetId: '#' + targetIdToUse,
        status: matched ? 'VERIFIED' : 'TAMPER_DETECTED'
      };
      setAuditLogs(prev => [newAudit, ...prev]);

    } catch (err) {
      setIsCalculatingHash(false);
      setStreamLogs(prev => [...prev, `[ERROR] Cryptographic process failed: ${(err as Error).message}`]);
      setMasterStreamLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          text: `Crypto processing error on "${file.name}": ${(err as Error).message}`,
          isError: true
        },
        ...prev
      ]);
    }
  };

  // Dashboard drag and drop cryptoprocessor logic
  const handleDashboardFileProcess = async (file: File) => {
    const isValid = checkFileValidation(file.name, ingestionCategory);
    if (!isValid) {
      setDashboardUploadedFile(null);
      setDashboardCalculatedHash('');
      setIsDashboardCalculatingHash(false);
      setDashboardFileStatusText('SECURITY EXCLUSION: Invalid file vector for the selected forensic category. Asset rejected.');
      setUploadSecurityExclusionError('SECURITY EXCLUSION: Invalid file vector for the selected forensic category. Asset rejected from ingestion stream.');

      setMasterStreamLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          text: `SECURITY EXCLUSION: File vector "${file.name}" rejected. Incorrect format for category: "${ingestionCategory}".`,
          isError: true
        },
        ...prev
      ]);

      openCustomOverlay(
        'security_exclusion_alert',
        'Ingestion Blocked - Protocol Rejection',
        'SECURITY EXCLUSION: Invalid file vector for the selected forensic category. Asset rejected from ingestion stream.',
        [
          { label: 'File Name', value: file.name },
          { label: 'Target Category', value: ingestionCategory },
          { label: 'Ingest Status', value: 'IMMEDIATE DISCARD / FORBIDDEN ACCESS' }
        ],
        'warning',
        'SECURITY ALERT',
        true
      );
      return;
    }

    setUploadSecurityExclusionError(null);
    setDashboardUploadedFile(file);
    setIsDashboardCalculatingHash(true);
    setDashboardFileStatusText(`[Crypto-Processor] Initializing byte stream for: "${file.name}"`);

    setMasterStreamLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type: 'INGRESS',
        text: `Active Bitstream dynamic ingest initiated for carrier file: "${file.name}"`
      },
      ...prev
    ]);

    try {
      const hash = await calculateSHA256(file);
      setDashboardCalculatedHash(hash);
      setIsDashboardCalculatingHash(false);
      setDashboardFileStatusText(`[SUCCESS] Found SHA-256 Checksum: ${hash.substring(0, 24)}...`);

      // Determine next dynamic key ledger EVD identifier
      const ids = evidenceItems.map(item => {
        const parts = item.id.split('-');
        const lastPart = parts[parts.length - 1];
        const numMatch = lastPart ? lastPart.match(/\d+/) : null;
        return numMatch ? parseInt(numMatch[0], 10) : 0;
      });
      const nextNum = (ids.length > 0 ? Math.max(...ids) : 2) + 1;
      const newId = `EVD-2026-0${nextNum}`;

      setMasterStreamLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'CRYPTO',
          text: `Digest derived successfully for "${file.name}". Standard SHA-256 Checksum: ${hash.substring(0, 32)}...`,
          isSuccess: true
        },
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'LEDGER',
          text: `Persisted active bitstream log with Dynamic Record ID #${newId}. Vault indices propagated.`,
          isSuccess: true
        },
        ...prev
      ]);

      // Centralize metadata selection and remove bulky payload construction
      const payload = {
        filename: file.name,
        filesize: file.size,
        hash: hash,
        leadCustodian: ingestionInvestigator,
        category: ingestionCategory
      };

      // Perform direct backend API synchronization upload call
      try {
        const res = await secureFetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const responseData = await res.json();
          const createdId = responseData.id || newId;
          // Immediately sync and trigger state re-fetch callback
          await fetchEvidence();
          // Pre-select this item as verification target to make testing seamless
          setSelectedVerificationTargetId(createdId);
          setPredefinedExpectedHash(hash);
        }
      } catch (err) {
        console.error('Failed to write back newly ingested evidence from Active Bitstream Analyzer:', err);
      }

      // Write to audit log
      const newAudit: AuditLogEvent = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        investigatorId: 'SYS-COPROCESSOR',
        action: `Dashboard Bitstream Ingested & Saved: ${file.name}`,
        targetId: '#' + newId,
        status: 'VERIFIED'
      };
      setAuditLogs(prev => [newAudit, ...prev]);

      // Pop overlay success
      openCustomOverlay(
        'dashboard_hash',
        'Coprocessor Ingest & Logs Complete',
        `The cryptographic bitstream footprint for "${file.name}" has been processed and saved under dynamic system indices as ID ${newId}. Calculated SHA-256 Checksum represents the absolute immutable digest.`,
        [
          { label: 'Assigned Evidence Reference ID', value: newId },
          { label: 'Carrier Filename', value: file.name },
          { label: 'Calculated SHA-256 Checksum', value: hash },
          { label: 'Raw Vector Size', value: formatBytes(file.size) }
        ],
        'shield',
        'ACTIVE COPROCESSOR INGEST & REGISTRATION'
      );
    } catch (err) {
      setIsDashboardCalculatingHash(false);
      setDashboardFileStatusText(`[ERROR] Cryptographic process failed: ${(err as Error).message}`);
      setMasterStreamLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          text: `Crypto processing error in Analyzer on "${file.name}": ${(err as Error).message}`,
          isError: true
        },
        ...prev
      ]);
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

      if (matched) {
        setHasTamperAlarmTriggered(false);
      } else {
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
  const handleFormalIngest = async () => {
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

    const ids = evidenceItems.map(item => {
      const parts = item.id.split('-');
      const lastPart = parts[parts.length - 1];
      const numMatch = lastPart ? lastPart.match(/\d+/) : null;
      return numMatch ? parseInt(numMatch[0], 10) : 0;
    });
    const nextNum = (ids.length > 0 ? Math.max(...ids) : 2) + 1;
    const newId = `EVD-2026-0${nextNum}`;
    const newFileName = uploadedFile ? uploadedFile.name : 'unknown_evidence.raw';
    
    // Synchronize to the backend database using the upload endpoint
    try {
      const payload = {
        filename: newFileName,
        filesize: uploadedFile ? uploadedFile.size : 0,
        hash: calculatedHash,
        leadCustodian: ingestionInvestigator,
        category: ingestionCategory
      };

      const res = await secureFetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const responseData = await res.json();
        const createdId = responseData.id || newId;

        // IMMEDIATE RE-FETCH ON INGESTION: trigger state re-fetch callback
        await fetchEvidence();
        // Automatically set the drop-down selected index to the fresh item
        setSelectedVerificationTargetId(createdId);

        setMasterStreamLogs(prev => [
          {
            timestamp: new Date().toLocaleTimeString(),
            type: 'CRYPTO',
            text: `Hardware encryption digest linked for file "${payload.filename}". Verification token signed.`,
            isSuccess: true
          },
          {
            timestamp: new Date().toLocaleTimeString(),
            type: 'LEDGER',
            text: `Register index sync complete for: #${createdId} with SHA-256 standard.`,
            isSuccess: true
          },
          ...prev
        ]);
      } else {
        setMasterStreamLogs(prev => [
          {
            timestamp: new Date().toLocaleTimeString(),
            type: 'ERROR',
            text: `WebCrypto pipeline write failed for file "${payload.filename}": Server endpoint rejected handshakes.`,
            isError: true
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Failed to write back newly ingested evidence to backend datastore:', err);
      setMasterStreamLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          text: `Inbound stream connection failed during handshake: ${(err as Error).message}`,
          isError: true
        },
        ...prev
      ]);
    }

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
    setUploadSecurityExclusionError(null);
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

  // Real cryptographic login verification handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setLoginError('A VALID INVESTIGATOR ID / EMAIL IS REQUIRED.');
      return;
    }
    if (!credentialInput.trim()) {
      setLoginError('INVESTIGATOR ACCESS TOKEN CANNOT BE EMPTY.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: credentialInput }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const verifiedEmail = data.email || loginEmail;
        const emailPrefix = verifiedEmail.split('@')[0];
        const formattedName = emailPrefix
          .split(/[\._\-]/)
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        setSessionUser(prev => ({
          ...prev,
          email: verifiedEmail,
          name: formattedName || 'Investigator'
        }));
        setIsAuthenticated(true);
        setLoginError('');
        setActiveView('dashboard');
        window.location.hash = '#/dashboard';
      } else {
        setLoginError(data.error || 'INVALID PASSKEY. SYSTEM ACCESS ATTEMPT REGISTERED.');
      }
    } catch (err) {
      console.error('[LOGIN NETWORK ERROR]', err);
      setLoginError('CONNECTIVITY EXCEPTION: SECURITY SERVER NOT RESPONDING.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Step 1: Initial recovery request (generates 6-digit code on backend via nodemailer / SMTP)
  const handleInitialForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      setForgotError('A VALID INVESTIGATOR ID / EMAIL IS REQUIRED.');
      return;
    }

    const verifiedEmail = recoveryEmail.toLowerCase().trim();

    // 1. THE CHECK ON SUBMIT: Validate email exists in browser local storage 'registeredEmails' or fallback
    let registeredEmailsList: string[] = [];
    try {
      const stored = localStorage.getItem('registeredEmails') || localStorage.getItem('locally_registered_emails');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          registeredEmailsList = parsed;
        }
      }
    } catch (e) {
      console.warn(e);
    }

    const merged = new Set<string>([...locallyRegisteredEmails, ...registeredEmailsList]);
    const exists = Array.from(merged).some(
      (email) => email.toLowerCase().trim() === verifiedEmail
    );

    // 2. ENFORCE THE BLOCK: Render Amber Mandated Security exclusion and block inputs
    if (!exists) {
      setForgotError('SECURITY EXCLUSION: Unauthorized identity vector. Reset tokens can only be generated from the original registering terminal endpoint.');
      setHasSecurityExclusion(true);
      return;
    }

    setIsSendingRecovery(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedEmail }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Securely retrieve generated token from server payload
        setGeneratedToken(data.token);
        setIsTokenDispatched(true);
        setIsEmailSent(!!data.emailSent);
        setForgotSuccess(data.message || 'RESET REQUEST RECORDED.');
      } else {
        setForgotError(data.error || 'COULD NOT INITIATE SECURE PASSWORD RESET REQUEST.');
      }
    } catch (err) {
      console.error('[FORGOT PASSWORD INITIAL ERROR]', err);
      setForgotError('CONNECTIVITY EXCEPTION: SECURITY SERVER NOT RESPONDING.');
    } finally {
      setIsSendingRecovery(false);
    }
  };

  // Step 2: Verification of the 6-digit out-of-band token loop
  const handleVerifyOverrideToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || tokenInput.trim() !== generatedToken) {
      setVerificationError('AUTHENTICATION VECTOR INVALID');
      return;
    }

    // Token matches! Transition to final password reset layout
    setVerificationError('');
    setIsTokenVerified(true);
  };

  // Step 3: Password Update Finalization Submission
  const handleFinalizePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = resetPasskey.trim();
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass);

    if (pass.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setForgotError('WEAK KEY VECTOR: Passphrase must be min 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }

    setIsSendingRecovery(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.toLowerCase().trim(), password: pass }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setForgotSuccess('SOVEREIGN LEDGER PASSWORD SUCCESSFULLY RESET. NEW LOGIN ACTIVE.');
        setRevealedPasscode(pass);
        // Clear out transitional state variables
        setGeneratedToken('');
        setTokenInput('');
        setIsTokenDispatched(false);
        setIsTokenVerified(false);
      } else {
        setForgotError(data.error || 'COULD NOT REGISTER THE NEW PASSKEY RECORD.');
      }
    } catch (err) {
      console.error('[FINAL RESET ERROR]', err);
      setForgotError('NETWORK SYNC EXCEPTION: SERVER FAILED TO LOG NEW DEFRAG PATH.');
    } finally {
      setIsSendingRecovery(false);
    }
  };

  // Real cryptographic registration handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail.trim() || !registerEmail.includes('@')) {
      setRegisterError('A VALID INVESTIGATOR ID / EMAIL IS REQUIRED.');
      return;
    }

    const pass = registerPasskey.trim();
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass);

    if (pass.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setRegisterError('WEAK KEY VECTOR: Passphrase must be min 8 characters with uppercase, lowercase, number, and special character.');
      return;
    }

    setIsRegistering(true);
    setRegisterError('');
    setRegisterSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerEmail, password: registerPasskey }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setRegisterSuccess(data.message || 'NODE ACCOUNT SUCCESSFULLY REGISTERED! ESTABLISHING FRESH COLD-SESSION...');
        
        // Immediately log them into a completely fresh, empty dashboard session mapped exclusively to their new identity
        const verifiedEmail = data.email || registerEmail.trim();

        // Save successfully registered email to the device registry
        setLocallyRegisteredEmails(prev => {
          const next = prev.includes(verifiedEmail) ? prev : [...prev, verifiedEmail];
          localStorage.setItem('locally_registered_emails', JSON.stringify(next));
          localStorage.setItem('registeredEmails', JSON.stringify(next));
          return next;
        });

        const emailPrefix = verifiedEmail.split('@')[0];
        const formattedName = emailPrefix
          .split(/[\._\-]/)
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        setSessionUser({
          email: verifiedEmail,
          name: formattedName || 'Investigator',
          role: 'Investigator',
          clearance: 'LEVEL 5 SOVEREIGN'
        });

        setLoginEmail(verifiedEmail);
        setRecoveryEmail(verifiedEmail);
        setCredentialInput(registerPasskey);
        setEvidenceItems([]); // guarantee a completely empty session

        setTimeout(() => {
          setIsAuthenticated(true);
          setIsRegisterMode(false);
          setRegisterEmail('');
          setRegisterPasskey('');
          setRegisterSuccess('');
          setRegisterError('');
          setActiveView('dashboard');
          window.location.hash = '#/dashboard';
        }, 900);
      } else {
        setRegisterError(data.error || 'COULD NOT REGISTER NODE ACCOUNT AT THIS TIME.');
      }
    } catch (err) {
      console.error('[REGISTRATION NETWORK ERROR]', err);
      setRegisterError('NETWORK EXCEPTION: SECURITY SERVER CO-PROCESSOR FAILURE.');
    } finally {
      setIsRegistering(false);
    }
  };

  const selectedItem = evidenceItems.find(i => i.id === selectedEvidenceId) || evidenceItems[0];

  if (!isAuthenticated) {
    return (
      <div 
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0, position: 'relative' }}
        className="bg-[#06080c] text-[#c5c6cd] font-sans selection:bg-tertiary/30"
        id="login-layout-container"
      >
        {/* Animated grid / dot background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 animate-pulse" />
        <div className="pointer-events-none absolute inset-0 bg-[#38debb]/5 opacity-10 select-none" />
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] scanline pointer-events-none select-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{ width: '100%', maxWidth: '440px', flexShrink: 0 }}
          className="relative bg-[#0b0e14] border border-[#232b3c] rounded-xl shadow-[0_20px_80px_rgba(0,0,0,0.85)] overflow-hidden z-10 m-4"
          id="login-card"
        >
          <div className="h-[3px] bg-gradient-to-r from-[#38debb]/20 via-[#38debb] to-[#38debb]/20" />

          {isForgotPassword ? (
            /* FORGOT PASSWORD RESET MECHANISM SCREEN */
            <div className="p-8 space-y-6">
              <div className="space-y-3 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#38debb]/10 border border-[#38debb]/30 flex items-center justify-center shadow-[0_0_20px_rgba(56,222,187,0.15)] mb-3">
                  <span className="material-symbols-outlined text-3xl text-[#38debb] font-bold">lock_reset</span>
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-[0.25em] text-[#38debb] uppercase font-mono">
                    PASSKEY COOPERATOR OVERRIDE
                  </h2>
                  <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-widest font-mono mt-1">
                    CREDENTIAL RESET OVERRIDE ESCROW
                  </p>
                </div>
              </div>

              {hasSecurityExclusion ? (
                <div className="space-y-6">
                  {/* Mandated prominent amber warning banner block */}
                  <div 
                    className="bg-amber-500/15 border border-amber-500/30 rounded p-4 flex gap-2.5 items-start text-left" 
                    id="forgot-exclusion-msg"
                  >
                    <span className="material-symbols-outlined text-amber-500 font-bold animate-pulse shrink-0">
                      warning
                    </span>
                    <p className="text-[11px] font-bold font-mono tracking-tight leading-relaxed text-amber-500 uppercase whitespace-normal" id="forgot-exclusion-msg-text">
                      SECURITY EXCLUSION: Unauthorized identity vector. Reset tokens can only be generated from the original registering terminal endpoint.
                    </p>
                  </div>
                </div>
              ) : !isTokenDispatched ? (
                /* STEP 1: Email Request Entry */
                <form onSubmit={handleInitialForgotRequest} className="space-y-4">
                  <p className="text-[10px] font-mono leading-relaxed text-[#c5c6cd]/60 uppercase tracking-wide">
                    PROVIDE YOUR REGISTERED INVESTIGATOR EMAIL TO REQUEST AN EMERGENCY DEFRAG OVERRIDE VERIFICATION TOKEN.
                  </p>

                  <div>
                    <label className="block text-[9px] font-black text-[#c5c6cd]/60 uppercase tracking-widest font-mono mb-2">
                      REGISTERED INVESTIGATOR EMAIL
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-white/30 text-base">mail</span>
                      <input
                        type="email"
                        required
                        autoFocus
                        value={recoveryEmail}
                        onChange={(e) => {
                          setRecoveryEmail(e.target.value);
                          if (forgotError) setForgotError('');
                        }}
                        className="w-full bg-[#05070a] text-xs text-white placeholder-white/20 border border-slate-800 focus:border-[#38debb]/50 rounded px-3.5 py-3 pl-10 outline-none focus:ring-1 focus:ring-[#38debb]/25 font-mono tracking-wide"
                        placeholder="Enter investigator email"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-3 flex gap-2.5 items-start text-left" id="forgot-error-msg">
                      <span className="material-symbols-outlined text-red-400 text-sm shrink-0">error</span>
                      <p className="text-[10px] font-bold font-mono tracking-tight text-red-100 uppercase">{forgotError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingRecovery}
                    className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 bg-[#38debb] text-[#06080c] hover:bg-[#38debb]/95 font-black text-xs uppercase tracking-wider rounded transition-all shadow-[0_0_20px_rgba(56,222,187,0.15)] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSendingRecovery ? (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                        REQUESTING TOKEN...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold">send</span>
                        RESET SOVEREIGN PASSWORD
                      </>
                    )}
                  </button>
                </form>
              ) : !isTokenVerified ? (
                /* STEP 2: The Block State - confirmation card and Enter secure override key box */
                <div className="space-y-5">
                  {/* Secure confirmation alert card */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 text-left space-y-2" id="block-confirmation-card">
                    <div className="flex gap-2 items-center">
                      <span className="material-symbols-outlined text-amber-500 text-lg animate-pulse">shield_lock</span>
                      <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest">RESET REQUEST RECORDED</span>
                    </div>
                    <p className="text-[11px] font-mono leading-relaxed text-amber-500 font-bold uppercase tracking-wide leading-relaxed">
                      RESET REQUEST RECORDED. The administrative security ledger has transmitted an emergency reset authorization token directly to the System Admin. Please contact your Lead Investigator to obtain your 6-digit node override key.
                    </p>
                  </div>

                  {/* Alphanumeric verification input gate */}
                  <form onSubmit={handleVerifyOverrideToken} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-[#38debb] uppercase tracking-widest font-mono mb-2">
                        ENTER SECURE OVERRIDE KEY
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[#38debb]/70 text-base font-bold">key</span>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          autoFocus
                          value={tokenInput}
                          onChange={(e) => {
                            setTokenInput(e.target.value.replace(/\D/g, ''));
                            setVerificationError('');
                          }}
                          className="w-full bg-[#05070a] text-xs text-[#38debb] placeholder-[#38debb]/20 border border-[#38debb]/35 focus:border-[#38debb] rounded px-3.5 py-3 pl-10 outline-none focus:ring-1 focus:ring-[#38debb]/40 font-mono tracking-widest font-black text-center text-sm"
                          placeholder="******"
                        />
                      </div>
                    </div>

                    {verificationError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded p-3 flex gap-2.5 items-start text-left" id="verification-error-msg">
                        <span className="material-symbols-outlined text-red-500 text-sm shrink-0">warning</span>
                        <p className="text-[10px] font-mono uppercase tracking-tight leading-normal">
                          {verificationError}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 bg-[#38debb] text-[#06080c] hover:bg-[#38debb]/95 font-black text-xs uppercase tracking-wider rounded transition-all shadow-[0_0_20px_rgba(56,222,187,0.15)] active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">lock_open</span>
                      CONFIRM OVERRIDE KEY
                    </button>
                  </form>

                  {/* safe preview token assist */}
                  {!isEmailSent && generatedToken && (
                    <div className="bg-[#05070a]/60 border border-slate-800/80 rounded p-2.5 text-center mt-2 opacity-60">
                      <span className="block text-[8px] text-[#c5c6cd]/40 uppercase tracking-widest font-mono font-bold mb-1">Developer Sandbox Mailtrap Intercept</span>
                      <code className="text-[10px] font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded tracking-widest select-all">{generatedToken}</code>
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 3: Reveal password definition layout */
                <form onSubmit={handleFinalizePasswordReset} className="space-y-4">
                  <p className="text-[10px] font-mono leading-relaxed text-[#c5c6cd]/60 uppercase tracking-wide">
                    VERIFICATION SUCCESSFUL. DEFINE A NEW ROBUST CRYPTOGRAPHICALLY SECURE PASSKEY DEFRAG VECTOR.
                  </p>

                  <div>
                    <label className="block text-[9px] font-black text-[#c5c6cd]/60 uppercase tracking-widest font-mono mb-2">
                      CHOOSE NEW SOVEREIGN PASSKEY
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-white/30 text-base">key</span>
                      <input
                        type="password"
                        required
                        autoFocus
                        value={resetPasskey}
                        onChange={(e) => {
                          setResetPasskey(e.target.value);
                          if (forgotError) setForgotError('');
                        }}
                        className={`w-full bg-[#05070a] text-xs text-white placeholder-white/15 border rounded px-3.5 py-3 pl-10 outline-none focus:ring-1 focus:ring-[#38debb]/25 font-mono tracking-wide ${
                          forgotError && forgotError.includes('WEAK KEY')
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-800 focus:border-[#38debb]/50'
                        }`}
                        placeholder="Enter new passkey (min 8 characters)"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-3 flex gap-2.5 items-start text-left" id="reset-password-error-msg">
                      <span className="material-symbols-outlined text-red-400 text-sm shrink-0">error</span>
                      <p className="text-[10px] font-bold font-mono tracking-tight text-red-100 uppercase">
                        {forgotError}
                      </p>
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="bg-[#38debb]/10 border border-[#38debb]/20 rounded p-3 text-left space-y-2.5" id="forgot-success-msg">
                      <div className="flex gap-2.5 items-start">
                        <span className="material-symbols-outlined text-[#38debb] text-sm shrink-0">check_circle</span>
                        <p className="text-[10px] text-[#38debb] font-black font-mono tracking-tight leading-3.5 uppercase">
                          {forgotSuccess}
                        </p>
                      </div>
                      
                      {revealedPasscode && (
                        <div className="bg-[#05070a] border border-[#38debb]/30 rounded p-2.5 text-center mt-2">
                          <span className="block text-[8px] text-[#c5c6cd]/50 uppercase tracking-widest font-mono font-bold mb-1">Passkey Restored Successfully</span>
                          <code className="text-xs font-mono font-black text-white bg-slate-950 px-2 py-0.5 rounded tracking-widest select-all">{revealedPasscode}</code>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingRecovery}
                    className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 bg-[#38debb] text-[#06080c] hover:bg-[#38debb]/95 font-black text-xs uppercase tracking-wider rounded transition-all shadow-[0_0_20px_rgba(56,222,187,0.15)] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSendingRecovery ? (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                        FINALIZING KEY MOUNT...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold">shield</span>
                        CONFIRM SECURE OVERRIDE
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isSendingRecovery}
                  onClick={() => {
                    setIsForgotPassword(false);
                    setLoginError('');
                    setForgotError('');
                    setResetPasskey('');
                    setGeneratedToken('');
                    setTokenInput('');
                    setIsTokenDispatched(false);
                    setIsTokenVerified(false);
                    setHasSecurityExclusion(false);
                    setVerificationError('');
                    setForgotSuccess('');
                  }}
                  className="w-full cursor-pointer flex items-center justify-center gap-1.5 py-2.5 bg-transparent text-[#c5c6cd]/60 hover:text-white border border-transparent hover:border-slate-800 font-bold text-[10px] uppercase tracking-widest rounded transition-all font-mono"
                >
                  <span className="material-symbols-outlined text-xs">arrow_back</span>
                  BACK TO CORE NODE LOGIN
                </button>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-[#c5c6cd]/30 uppercase tracking-widest">
                <span>ESCROW LAYER 1.9</span>
                <span>STATE: OUT-OF-BAND ACTIVE</span>
              </div>
            </div>
          ) : isRegisterMode ? (
            <form onSubmit={handleRegisterSubmit} className="p-8 space-y-6">
              <div className="space-y-3 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#38debb]/10 border border-[#38debb]/30 flex items-center justify-center shadow-[0_0_20px_rgba(56,222,187,0.15)] mb-3">
                  <span className="material-symbols-outlined text-2xl text-[#38debb] font-bold animate-pulse">person_add</span>
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-[0.25em] text-[#38debb] uppercase font-mono">
                    PROVISION NEW SECURITY NODE
                  </h2>
                  <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-widest font-mono mt-1">
                    ISOLATED INVESTIGATOR REGISTRATION
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-[#c5c6cd]/60 uppercase tracking-widest font-mono mb-2">
                    CHOOSE INVESTIGATOR ID / EMAIL
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-white/30 text-base">mail</span>
                    <input
                      type="email"
                      required
                      autoFocus
                      disabled={isRegistering}
                      value={registerEmail}
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                        if (registerError) setRegisterError('');
                      }}
                      className="w-full bg-[#05070a] text-xs text-white placeholder-white/20 border border-slate-800 focus:border-[#38debb]/50 rounded px-3.5 py-3 pl-10 outline-none focus:ring-1 focus:ring-[#38debb]/25 font-mono tracking-wide"
                      placeholder="e.g. detective@agency.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[#c5c6cd]/60 uppercase tracking-widest font-mono mb-2">
                    CHOOSE SOVEREIGN CRYPTOGRAPHIC PASSKEY
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-white/30 text-base">key</span>
                    <input
                      type="password"
                      required
                      disabled={isRegistering}
                      value={registerPasskey}
                      onChange={(e) => {
                        setRegisterPasskey(e.target.value);
                        if (registerError) setRegisterError('');
                      }}
                      className={`w-full bg-[#05070a] text-xs text-white placeholder-white/15 border rounded px-3.5 py-3 pl-10 outline-none focus:ring-1 focus:ring-[#38debb]/25 font-mono tracking-wide ${
                        registerError && registerError.includes('WEAK KEY VECTOR')
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25 ring-1 ring-red-500/20'
                          : 'border-slate-800 focus:border-[#38debb]/50'
                      }`}
                      placeholder="Enter custom passkey (min 8 characters)"
                    />
                  </div>
                </div>
              </div>

              {registerError && (
                <div 
                  className={`rounded p-3 flex gap-2.5 items-start text-left ${
                    registerError.includes('WEAK KEY VECTOR') 
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 font-medium' 
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`} 
                  id="register-error-msg"
                >
                  <span className={`material-symbols-outlined text-sm shrink-0 ${
                    registerError.includes('WEAK KEY VECTOR') ? 'text-amber-500 font-bold' : 'text-red-500'
                  }`}>
                    {registerError.includes('WEAK KEY VECTOR') ? 'warning' : 'error'}
                  </span>
                  <p className="text-[10px] font-bold font-mono tracking-tight leading-3.5 uppercase">
                    {registerError}
                  </p>
                </div>
              )}

              {registerSuccess && (
                <div className="bg-[#38debb]/10 border border-[#38debb]/20 rounded p-3 flex gap-2.5 items-start text-left" id="register-success-msg">
                  <span className="material-symbols-outlined text-[#38debb] text-sm shrink-0">check_circle</span>
                  <p className="text-[10px] text-[#38debb] font-black font-mono tracking-tight leading-3.5 uppercase">
                    {registerSuccess}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 bg-[#38debb] text-[#06080c] hover:bg-[#38debb]/95 font-black text-xs uppercase tracking-wider rounded transition-all shadow-[0_0_20px_rgba(56,222,187,0.15)] active:scale-[0.98] disabled:opacity-50"
                  id="register-submit-btn"
                >
                  {isRegistering ? (
                    <>
                      <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                      PROVISIONING SECURE NODE...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm font-bold">how_to_reg</span>
                      REGISTER ACCOUNT
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={() => {
                    setIsRegisterMode(false);
                    setRegisterError('');
                    setRegisterSuccess('');
                    setRegisterPasskey('');
                  }}
                  className="w-full cursor-pointer flex items-center justify-center gap-1.5 py-2.5 bg-transparent text-[#c5c6cd]/60 hover:text-white border border-transparent hover:border-slate-800 font-bold text-[10px] uppercase tracking-widest rounded transition-all font-mono"
                >
                  <span className="material-symbols-outlined text-xs">arrow_back</span>
                  BACK TO CORE LOGIN
                </button>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-[#c5c6cd]/30 uppercase tracking-widest">
                <span>SEGREGATED CORE L2.2</span>
                <span>STATE: KEY DISPATCH ACTIVE</span>
              </div>
            </form>
          ) : (
            /* ACTIVE LOGIN SCREEN */
            <form onSubmit={handleLoginSubmit} className="p-8 space-y-6">
              <div className="space-y-3 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-[#38debb]/10 border border-[#38debb]/30 flex items-center justify-center shadow-[0_0_20px_rgba(56,222,187,0.15)] mb-3 animate-pulse">
                  <span className="material-symbols-outlined text-3xl text-[#38debb] font-bold">shield</span>
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-[0.25em] text-[#38debb] uppercase font-mono">
                    SENTINEL DIGITAL FORENSICS LEDGER
                  </h2>
                  <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-widest font-mono mt-1">
                    SECURE CORE INGRESS NODE
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-[#c5c6cd]/60 uppercase tracking-widest font-mono mb-2">
                    AUTHORIZED INVESTIGATOR ID
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-white/30 text-base">person</span>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setRecoveryEmail(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      className="w-full bg-[#05070a] text-xs text-white placeholder-white/20 border border-slate-800 focus:border-[#38debb]/50 rounded px-3.5 py-3 pl-10 outline-none focus:ring-1 focus:ring-[#38debb]/25 font-mono tracking-wide"
                      placeholder="Enter investigator email..."
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[9px] font-black text-[#c5c6cd]/60 uppercase tracking-widest font-mono">
                      CRYPTOGRAPHIC PASSKEY / TOKEN
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotError('');
                        setForgotSuccess('');
                        setRevealedPasscode('');
                      }}
                      className="text-[9px] font-mono font-black text-[#38debb] hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      FORGOT PASSKEY?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-white/30 text-base">vpn_key</span>
                    <input
                      type="password"
                      required
                      autoFocus
                      disabled={isLoggingIn}
                      value={credentialInput}
                      onChange={(e) => {
                        setCredentialInput(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      className="w-full bg-[#05070a] text-xs text-white placeholder-white/15 border border-slate-800 focus:border-[#38debb]/50 rounded px-3.5 py-3 pl-10 outline-none focus:ring-1 focus:ring-[#38debb]/25 font-mono tracking-wide"
                      placeholder="Enter passkey (e.g. Pass@phrase1238)"
                      id="login-passcode-input"
                    />
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3 flex gap-2.5 items-start text-left shrink-0" id="login-error-msg">
                  <span className="material-symbols-outlined text-red-500 text-sm shrink-0">error</span>
                  <p className="text-[10px] text-red-400 font-bold font-mono tracking-tight leading-3.5 uppercase">
                    {loginError}
                  </p>
                </div>
              )}

              <div className="space-y-3.5">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full cursor-pointer flex items-center justify-center gap-2 py-3 bg-[#38debb] text-[#06080c] hover:bg-[#38debb]/95 font-black text-xs uppercase tracking-wider rounded transition-all shadow-[0_0_20px_rgba(56,222,187,0.15)] active:scale-[0.98] disabled:opacity-50"
                  id="login-submit-btn"
                >
                  {isLoggingIn ? (
                    <>
                      <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                      VERIFYING LEDGER TOKENS...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm font-bold">lock_open</span>
                      AUTHORIZE APPLICATION INGRESS
                    </>
                  )}
                </button>

                <div className="text-center pt-1 group">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setRegisterEmail('');
                      setRegisterPasskey('');
                      setRegisterError('');
                      setRegisterSuccess('');
                    }}
                    className="text-[10px] font-mono font-black text-[#38debb]/80 hover:text-[#38debb] hover:underline uppercase tracking-widest cursor-pointer transition-all duration-200"
                  >
                    First-time Investigator? Create Node Account
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-[#c5c6cd]/30 uppercase tracking-widest">
                <span>ESTB AUTH LAYER 2.5</span>
                <span>STATE: SECURITY READY</span>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', width: '100vw', minHeight: '100vh', overflow: 'hidden', margin: 0, padding: 0, position: 'relative' }}
      className="bg-[#06080c] text-[#c5c6cd] font-sans selection:bg-tertiary/30"
    >
      
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
        sessionUser={sessionUser}
      />

      {/* 3. Sliding and Persistent Sidebar Menu Framework */}
      <div 
        style={{ display: 'flex', flexDirection: 'row', width: '100%', flexGrow: 1 }}
        className={`transition-all duration-300 overflow-hidden shrink-0 ${
          hasTamperAlarmTriggered ? 'h-[calc(100vh-224px)] mt-36' : 'h-[calc(100vh-160px)] mt-20'
        }`}
      >
        <SidebarMenu
          isMenuOpen={isMenuOpen}
          toggleMenu={toggleMenu}
          setIsMenuOpen={setIsMenuOpen}
          activeView={activeView}
          handleTabClick={handleTabClick}
          executeLockoutTerminal={executeLockoutTerminal}
          setHasTamperAlarmTriggered={setHasTamperAlarmTriggered}
          openTerminalNotice={openTerminalNotice}
          onLogout={() => {
            setIsAuthenticated(false);
            setCredentialInput('');
            setIsMenuOpen(false);
          }}
        />

        {/* 4. Unified Display Viewport Screen Container */}
        <main 
          ref={mainScrollContainerRef}
          style={{ flexGrow: 1, flexShrink: 0, width: 'auto', maxWidth: '100%' }}
          className="h-full overflow-y-auto custom-scrollbar bg-[#06080c] pb-12"
        >
          {/* Sharp amber alert message banner */}
          {uploadSecurityExclusionError && (
            <div className="mx-8 mt-6 bg-[#fff6e6] text-[#b26a00] border-2 border-[#ffb039] rounded-lg p-5 flex items-center justify-between gap-4 shadow-[0_0_25px_rgba(255,176,57,0.18)] animate-fade-in unique-amber-banner block text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ff9800] text-3xl font-bold animate-pulse">warning</span>
                <span className="font-sans text-sm font-extrabold tracking-wide select-all">
                  {uploadSecurityExclusionError}
                </span>
              </div>
              <button 
                onClick={() => setUploadSecurityExclusionError(null)}
                className="px-4 py-2 bg-[#ff9800]/10 hover:bg-[#ff9800]/20 text-[#b26a00] border border-[#ffb039]/50 rounded font-sans text-xs font-black cursor-pointer transition-all uppercase"
              >
                Dismiss Protocol Reject
              </button>
            </div>
          )}

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
                auditLogs={auditLogs}
                masterStreamLogs={masterStreamLogs}
                fetchEvidence={fetchEvidence}
                ingestionCategory={ingestionCategory}
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
                evidenceItems={evidenceItems}
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
              className={`relative w-[calc(100%-2rem)] sm:w-[480px] md:w-[540px] shrink-0 bg-[#1b1b1d] rounded-xl border border-outline-variant/60 shadow-[0_0_50px_rgba(3,7,18,0.8)] overflow-hidden ${
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
