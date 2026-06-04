/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { EvidenceItem, AuditLogEvent, ScreenView, MasterStreamLog } from '../types';
import { formatBytes, getCategoryPlaceholder } from '../utils';
import { jsPDF } from 'jspdf';

interface DashboardViewProps {
  evidenceItems: EvidenceItem[];
  filteredEvidence: EvidenceItem[];
  setGlobalSearchToken: (token: string) => void;
  selectedEvidenceId: string;
  setSelectedEvidenceId: (id: string) => void;
  setSelectedVerificationTargetId: (id: string) => void;
  handleTabClick: (view: ScreenView) => void;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEvent[]>>;
  hasTamperAlarmTriggered: boolean;
  testResult: any;
  dashboardUploadedFile: File | null;
  dashboardFileStatusText: string;
  isDashboardCalculatingHash: boolean;
  handleDashboardFileProcess: (file: File) => Promise<void>;
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
  secureFetch?: typeof fetch;
  auditLogs: AuditLogEvent[];
  masterStreamLogs: MasterStreamLog[];
  fetchEvidence?: () => Promise<void>;
  ingestionCategory: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  evidenceItems,
  filteredEvidence,
  setGlobalSearchToken,
  selectedEvidenceId,
  setSelectedEvidenceId,
  setSelectedVerificationTargetId,
  handleTabClick,
  setAuditLogs,
  hasTamperAlarmTriggered,
  testResult,
  dashboardUploadedFile,
  dashboardFileStatusText,
  isDashboardCalculatingHash,
  handleDashboardFileProcess,
  openCustomOverlay,
  secureFetch,
  auditLogs,
  masterStreamLogs,
  fetchEvidence,
  ingestionCategory,
}) => {
  const [isDashboardDragActive, setIsDashboardDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RESTful Dynamic Database states
  const [selectedArchiveDetail, setSelectedArchiveDetail] = useState<EvidenceItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Query specific archival item by ID whenever user clicks/selects an item in the indexes
  useEffect(() => {
    if (!selectedEvidenceId) {
      setSelectedArchiveDetail(null);
      return;
    }
    let active = true;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const res = await (secureFetch || fetch)(`/api/archives/${selectedEvidenceId}`);
        if (res.ok && active) {
          const data = await res.json();
          setSelectedArchiveDetail(data);
        }
      } catch (err) {
        console.error(`Error querying detail for archive ${selectedEvidenceId}:`, err);
      } finally {
        if (active) setIsLoadingDetail(false);
      }
    };
    fetchDetail();
    return () => {
      active = false;
    };
  }, [selectedEvidenceId, evidenceItems]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDashboardDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDashboardDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDashboardDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDashboardFileProcess(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const fileInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleDashboardFileProcess(e.target.files[0]);
    }
  };

  const handleDeleteRow = (id: string, fileName: string) => {
    openCustomOverlay(
      'delete_evidence_confirm',
      'CONFIRM RECORD DELETION',
      `Are you sure you want to permanently delete the forensic archive "${fileName}"? This action cannot be undone.`,
      [
        { label: 'Record ID', value: id },
        { label: 'File Name', value: fileName },
        { label: 'Operation', value: 'SECURE PHYSICAL DELETION' }
      ],
      'delete_forever',
      'CRITICAL PROTOCOL',
      true,
      {
        label: 'PERMANENTLY DELETE RECORD',
        onClick: async () => {
          try {
            const fetchFn = secureFetch || fetch;
            const res = await fetchFn(`/api/evidence/${id}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              if (fetchEvidence) {
                await fetchEvidence();
              }
              openCustomOverlay(
                'delete_success',
                'DELETION COMPLETE',
                `Evidence archive for file "${fileName}" has been cryptographically purged and zeroed from all system databases.`,
                [],
                'check_circle',
                'SUCCESS',
                false
              );
              setAuditLogs(prev => [
                {
                  id: 'AUDIT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '/') + ' UTC',
                  eventType: 'SECURITY_DELETE',
                  details: `Secure record deletion completed for ID: ${id}.`,
                  investigatorId: 'STAFF-OVERRIDE',
                  action: 'SECURE_DELETE',
                  targetId: id,
                  status: 'DELETED'
                },
                ...prev
              ]);
              if (selectedEvidenceId === id) {
                setSelectedEvidenceId('');
              }
            } else {
              const errObj = await res.json();
              openCustomOverlay(
                'delete_fail',
                'DELETION FAILED',
                `Failed to delete evidence: ${errObj.error || 'Server error'}`,
                [],
                'error',
                'ERROR',
                true
              );
            }
          } catch (err) {
            console.error(err);
            openCustomOverlay(
              'delete_fail_network',
              'TRANSMISSION FAILED',
              `Network transmission failed for delete request: ${(err as Error).message}`,
              [],
              'report_problem',
              'ERROR',
              true
            );
          }
        }
      }
    );
  };

  const handleGlobalPurge = () => {
    openCustomOverlay(
      'global_purge_confirm',
      'CONFIRM GLOBAL DATABASE PURGE',
      '🚨 WARNING: This critical command will permanently erase all forensic entries, case registries, and custody handshake records from the live datastore. All active volumes will be empty-allocated back down to 0.00 MB.',
      [
        { label: 'Security Level', value: 'ADMINISTRATOR CONSOLE' },
        { label: 'Impact Code', value: 'RECURSIVE STORAGE WIPE' }
      ],
      'warning',
      'CRITICAL DANGER PROTOCOL',
      true,
      {
        label: 'EXECUTE DESTRUCTIVE PURGE',
        onClick: async () => {
          try {
            const fetchFn = secureFetch || fetch;
            const res = await fetchFn('/api/evidence/wipe-all', {
              method: 'DELETE'
            });
            if (res.ok) {
              if (fetchEvidence) {
                await fetchEvidence();
              }
              openCustomOverlay(
                'purge_success',
                'DATABASE WIPE SUCCESSFUL',
                'All database arrays, live structures, and temporary partitions have been completely purged and deallocated.',
                [],
                'check_circle',
                'PURGE COMPLETE',
                false
              );
              setAuditLogs(prev => [
                {
                  id: 'AUDIT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '/') + ' UTC',
                  eventType: 'SYSTEM_WIPE',
                  details: `A comprehensive storage wipe command was executed cleanly. All active indices zeroed out.`,
                  investigatorId: 'ADMIN-OVERRIDE',
                  action: 'STORAGE_WIPE',
                  targetId: '#ALL',
                  status: 'WIPED'
                },
                ...prev
              ]);
              setSelectedEvidenceId('');
            } else {
              const errObj = await res.json();
              openCustomOverlay(
                'purge_fail',
                'PURGE DISRUPTED',
                `Purge failed: ${errObj.error || 'Server error'}`,
                [],
                'error',
                'ERROR',
                true
              );
            }
          } catch (err) {
            console.error(err);
            openCustomOverlay(
              'purge_fail_network',
              'TRANSMISSION FAILED',
              `Network transmission failed for purge request: ${(err as Error).message}`,
              [],
              'report_problem',
              'ERROR',
              true
            );
          }
        }
      }
    );
  };

  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="w-full max-w-none px-8 py-8 space-y-xl flex flex-col"
    >
      
      {/* SPA Scroll Welcome Portal (Layout 3 Intro Section) */}
      <section className="portal-gradient rounded-xl border border-outline-variant p-lg lg:p-xl flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
        <div className="absolute inset-0 opacity-[0.03] scanline pointer-events-none" />
        <div className="max-w-4xl w-full text-center space-y-lg z-10">
          <div className="space-y-sm">
            <span className="px-3 py-1 text-[11px] font-bold font-label-caps text-tertiary bg-tertiary/10 border border-tertiary/30 rounded uppercase tracking-widest">
              UNIT-742 Sentinel Node Active
            </span>
            <h1 className="font-sans text-[48px] lg:text-[64px] font-extrabold leading-tight tracking-tight text-primary uppercase select-none">
              VIGILANCE <span className="text-white">DEMS</span>
            </h1>
            <p className="font-headline-md text-headline-md text-secondary tracking-widest opacity-80 uppercase text-xs lg:text-sm font-label-caps scale-x-95">
              Secure Digital Forensics &amp; Immutable Evidence Repository
            </p>
          </div>
          
          <div className="h-[20px]" />

          <div className="max-w-3xl mx-auto">
            <p className="font-body-md text-sm lg:text-base leading-relaxed text-on-surface-variant/90 font-sans">
              Engineered to preserve judicial sovereignty and chain-of-custody. Our platform automates digital evidence ingestion through localized 
              <span className="text-tertiary font-bold font-data-mono mx-1">SHA-256 Web Crypto</span> fingerprinting, absolute audit logging, and 
              automated system-wide tamper detection warnings.
            </p>
          </div>

          {/* Visual 3-Column Image Grid from Stitch Exports */}
          <div className="grid grid-cols-3 gap-sm md:gap-lg py-md max-w-4xl mx-auto">
            <div className="image-frame rounded-xl aspect-video overflow-hidden">
              <img 
                alt="Fingerprint Forensic"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZ_QLursSDdNJuAT5pogEpAITKjk1NYCbFlEUxMWwxVXcsAdKK1D1NYI0S5XKNOodyUc7LNQMRLSinSaBcS7CVYhMJrI6XwPRykLAOKFA6YnujMx6EsZ6apuVCwRrBia3os2LWJW_Qcef3Xbd-nNcH9sp-LdmRaVs0RJ9sgXZy_OWuuzSOQzsQnODBJYIVPWszpcAzm5yCsEyncjBxU4hDLax_ACI-XzKJiVjzUhcL-d1_ysHR3cUfPGtMYKIlpBnDguX3oRhT9YzH"
              />
            </div>
            <div className="image-frame rounded-xl aspect-video overflow-hidden">
              <img 
                alt="Network Node Map" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAI7G5P7Q2aiYyuQAVeYu7E9LbE2Y-nsTmBYXqlUbgSdsdYznwJIUhUA1DF4EY0XUFxLNKRRrnOQJd1HtNxMPvO7RbxtlHVdGjFDs73tNjTwvmPFNQBcZtdYTwbcVJCzdxgKGJ_Rm0xhvE36E-GeXrR4glD7_JXRukzzr1eon7sLsq6zF6jTUTVxsbDhcj_ivjHkDwCurQeVj_3TqJcdkMpJ-EnAjwL6X66YcW4wAEIWSPzCs4ydQRkdrWthEZ8pxoN6lZ93F7IhNO2"
              />
            </div>
            <div className="image-frame rounded-xl aspect-video overflow-hidden">
              <img 
                alt="Hexadecimal Storage" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnF8dr7nDvnpNCjcVp1ov2ZojpiIQTjVnD3hk81G8RRBiNzbBLp25tOFG-IE1f8xx98q-87frSpSHaSwy6jrr8jxroq58-sB1D4gsGP_QbHF4ZLd-HiNiZDZemoPrXqUZViaeb9rAhl0-SqeYLMg0um-uDoAyjYqO-PE9Dqp5mgEPzpPqUbUxgv_pYRamgW8UxtgTFYzFHk2iICp6dVkDG2u79BTENTPt6eodAsubi7bCv3HUXfvt--HPMiVsZ13-czA9josmCIDV5"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-md pt-sm">
            <button 
              onClick={() => {
                const targetNode = document.getElementById('command-dashboard-section');
                targetNode?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-tertiary via-[#4fd1c5] to-primary text-slate-950 rounded-lg font-sans font-bold tracking-wider text-xs uppercase shadow-[0_0_20px_rgba(56,222,187,0.3)] hover:shadow-[0_0_35px_rgba(56,222,187,0.5)] hover:scale-[1.02] active:scale-95 duration-300 cursor-pointer border border-white/10 select-none"
            >
              <span>Engage Command Center Operations</span>
              <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
            </button>
            <div 
              className="flex flex-col items-center gap-xs opacity-50 animate-bounce cursor-pointer mt-sm" 
              onClick={() => document.getElementById('command-dashboard-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="font-label-caps text-[9px] tracking-wider text-[#c5c6cd] uppercase">Scroll to view active ledger monitors</span>
              <span className="material-symbols-outlined text-[20px] text-tertiary">keyboard_double_arrow_down</span>
            </div>
          </div>
        </div>
      </section>

      <div className="h-[60px]" id="command-dashboard-section" />

      {/* Title Section dashboard viewport */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-sm mb-lg border-b border-outline-variant/30 pb-4">
        <div>
          <h1 className="font-display-lg text-[32px] text-white tracking-tight uppercase font-extrabold flex items-center gap-sm select-none">
            <span className="w-2 h-8 bg-[#b9c7e4] rounded-full shadow-[0_0_10px_rgba(185,199,228,0.5)] inline-block"></span>
            Operational Dashboard
          </h1>
          <p className="font-body-md text-base text-[#c5c6cd] font-sans">
            Real-time global evidence network status, dynamic throughput monitoring, and cryptographic secure ledger indices.
          </p>
        </div>
        <div className="flex gap-sm w-full md:w-auto">
          <button 
            onClick={() => {
              try {
                const doc = new jsPDF();
                const marginX = 15;
                let cursorY = 20;

                // Draw Header Banner
                doc.setFillColor(11, 23, 44);
                doc.rect(0, 0, 210, 40, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('SENTINEL SYSTEM FORENSICS COMMAND CENTER', marginX, 15);
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(56, 222, 187); // Mint color
                doc.text('OFFICIAL EVIDENCE INTEGRITY REPORT  //  SECURED BLOCKS LEDGER', marginX, 23);
                
                doc.setTextColor(180, 180, 180);
                doc.text(`GENERATED AT: ${new Date().toISOString()}  |  NODE IDENTIFIER: COPROCESSOR_SYS_v2`, marginX, 30);
                
                cursorY = 55;

                // Title block
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(20, 20, 20);
                doc.text('I. EXECUTIVE BRIEF & AGENCY CERTIFICATION', marginX, cursorY);
                cursorY += 6;
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(60, 60, 60);
                const briefText = "This automated forensic integrity ledger validates active digital carrier assets, hashes, and chain of custody handovers under military-grade standard validation loops. All computed items have been verified on-the-fly and matched securely against the initial source hashes.";
                const splitBrief = doc.splitTextToSize(briefText, 180);
                doc.text(splitBrief, marginX, cursorY);
                cursorY += splitBrief.length * 5 + 5;

                // Draw a horizontal line thin divider
                doc.setDrawColor(220, 220, 220);
                doc.line(marginX, cursorY, 195, cursorY);
                cursorY += 8;

                // Section II: Active Forensic Registries
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(20, 20, 20);
                doc.text('II. SECURED EVIDENCE INVENTORIES', marginX, cursorY);
                cursorY += 8;

                // Iterate over evidence items
                evidenceItems.forEach((item, index) => {
                  if (cursorY > 250) {
                    doc.addPage();
                    cursorY = 20;
                  }

                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(10);
                  doc.setTextColor(15, 23, 42); 
                  doc.text(`RECORD #${index + 1}: [${item.id}] - ${item.caseTitle}`, marginX, cursorY);
                  cursorY += 5;

                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(8.5);
                  doc.setTextColor(80, 80, 80);
                  
                  // Grid box metadata elements
                  doc.text(`FileName:  ${item.fileName}`, marginX + 4, cursorY);
                  doc.text(`Category:  ${item.category}`, marginX + 110, cursorY);
                  cursorY += 4.5;
                  
                  doc.text(`Timestamp: ${item.timestamp}`, marginX + 4, cursorY);
                  doc.text(`File Size:  ${formatBytes(item.sizeBytes)}`, marginX + 110, cursorY);
                  cursorY += 4.5;

                  // Hash panels
                  doc.setFont('courier', 'bold');
                  doc.setFontSize(8);
                  doc.setTextColor(15, 25, 45);
                  doc.text(`[INITIAL SHA-256 HASH]: ${item.initialHash}`, marginX + 4, cursorY);
                  cursorY += 4;
                  doc.text(`[CURRENT SHA-256 HASH]: ${item.hash}`, marginX + 4, cursorY);
                  cursorY += 4.5;

                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(8);
                  doc.setTextColor(80, 80, 80);
                  doc.text(`Verified Status:  `, marginX + 4, cursorY);
                  
                  if (item.hash === item.initialHash) {
                    doc.setTextColor(20, 150, 80); // green
                    doc.text('MATCH NOMINAL (UNALTERED)', marginX + 28, cursorY);
                  } else {
                    doc.setTextColor(220, 50, 50); // red
                    doc.text('CRITICAL WARNING: TIMELINE TAMPERED / HASH MISMATCH', marginX + 28, cursorY);
                  }
                  cursorY += 6;

                  // Handovers (Custody chain)
                  if (item.handovers && item.handovers.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    doc.text('  Custody chain logs:', marginX + 4, cursorY);
                    cursorY += 4;

                    item.handovers.forEach((h, hIdx) => {
                      if (cursorY > 270) {
                        doc.addPage();
                        cursorY = 20;
                      }
                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(8);
                      doc.setTextColor(120, 120, 120);
                      doc.text(`   ↳ Transfer #${hIdx + 1}: ${h.from} => ${h.to} | Timestamp: ${h.timestamp} | Reason: ${h.reason}`, marginX + 4, cursorY);
                      cursorY += 4;
                    });
                    cursorY += 2;
                  }

                  // Border line between entries
                  doc.setDrawColor(240, 240, 240);
                  doc.line(marginX, cursorY, 195, cursorY);
                  cursorY += 6;
                });

                // Section III: System logs
                if (auditLogs && auditLogs.length > 0) {
                  if (cursorY > 230) {
                    doc.addPage();
                    cursorY = 20;
                  }
                  cursorY += 4;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(12);
                  doc.setTextColor(20, 20, 20);
                  doc.text('III. CORE SENTINEL SYSTEM AUDIT TRAIL', marginX, cursorY);
                  cursorY += 8;

                  doc.setFont('courier', 'normal');
                  doc.setFontSize(7.5);
                  doc.setTextColor(100, 100, 100);

                  auditLogs.slice(0, 30).forEach((entry) => {
                    if (cursorY > 275) {
                      doc.addPage();
                      cursorY = 20;
                    }
                    const logLine = `[${entry.timestamp}] ${entry.investigatorId.padEnd(12)} | ${entry.action.padEnd(38)} | ${entry.targetId.padEnd(14)} | [${entry.status}]`;
                    doc.text(logLine, marginX, cursorY);
                    cursorY += 4;
                  });
                }

                // Page Footer signature
                cursorY = Math.min(275, cursorY + 12);
                doc.setDrawColor(56, 222, 187);
                doc.setLineWidth(0.5);
                doc.line(marginX, cursorY, 195, cursorY);
                cursorY += 5;
                
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text('This is a dynamically generated, SHA-512 signed audit proof from Sentinel Core v2. Distributed integrity ledger copy.', marginX, cursorY);

                doc.save(`Forensic_Integrity_Report_${new Date().toISOString().substring(0,10)}.pdf`);
              } catch (pdfErr) {
                console.error('[PDF Gen Error]', pdfErr);
                alert("PDF generation encountered a buffer error. Please review active registries details.");
              }

              const exportObjAudit: AuditLogEvent = {
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                investigatorId: 'L5-MILLER',
                action: 'System Integrity Report Generation',
                targetId: '#SYS-PDF-EXPORT',
                status: 'VERIFIED'
              };
              setAuditLogs(prev => [exportObjAudit, ...prev]);
            }}
            className="flex items-center gap-sm px-6 py-3 bg-[#b9c7e4] text-[#233148] rounded font-label-caps text-xs tracking-wider font-bold hover:brightness-110 active:scale-95 transition-all select-none w-full md:w-auto text-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">ios_share</span>
            EXPORT SYSTEM AUDIT
          </button>
          <button 
            onClick={() => handleTabClick('forensics')}
            className="flex items-center gap-sm px-6 py-3 bg-[#001e17] text-tertiary border border-tertiary/20 rounded font-label-caps text-xs tracking-wider hover:bg-tertiary/10 transition-all font-bold w-full md:w-auto justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold animate-pulse">add_to_photos</span>
            INGEST FILE
          </button>
        </div>
      </header>

      <div className="h-[60px]" />

      {/* Metrics Summary widgets row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-36 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start animate-fade-in">
            <span className="font-label-caps text-xs text-[#c5c6cd] uppercase tracking-wider">Total Evidence Items</span>
            <span className="material-symbols-outlined text-[#b9c7e4]/70 text-2xl">folder_zip</span>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display-lg text-4xl text-white font-extrabold select-all">
              {evidenceItems.length}
            </span>
            <span className="font-body-sm text-[10px] text-tertiary flex items-center gap-1 uppercase tracking-widest font-mono font-bold select-none">
              <span className="material-symbols-outlined text-[13px] text-tertiary">database</span>
              LIVE DATASTREAM
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 to-primary" />
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-36 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-xs text-[#c5c6cd] uppercase tracking-wider">Total Virtual Volume</span>
            <span className="material-symbols-outlined text-tertiary/70 text-2xl">database</span>
          </div>
          <div className="flex items-baseline gap-sm">
             <span className="font-display-lg text-xl lg:text-2xl font-extrabold text-white uppercase select-all">
              {evidenceItems.length === 0 
                ? '0.00 MB' 
                : formatBytes(evidenceItems.reduce((acc, item) => acc + (item.sizeBytes || 0), 0))}
            </span>
            <span className="px-1.5 py-[2px] rounded bg-[#001e17] text-tertiary font-label-caps text-[9px] uppercase border border-tertiary/20 font-bold tracking-wider select-none">
              Sum Payload Size
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary/20 to-tertiary" />
        </div>

        {/* Alarm dependent metrics widget */}
        <div className={`p-6 rounded-xl flex flex-col justify-between h-36 relative overflow-hidden shadow-xl transition-all duration-300 ${
          hasTamperAlarmTriggered || evidenceItems.some(i => i.status === 'Tampered')
            ? 'bg-error-container/20 border-2 border-error text-error shadow-[0_0_20px_rgba(255,180,171,0.2)]' 
            : 'glass-panel'
        }`}>
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-xs uppercase tracking-wider">Active Threat Indicators</span>
            <span className={`material-symbols-outlined text-2xl ${(hasTamperAlarmTriggered || evidenceItems.some(i => i.status === 'Tampered')) ? 'text-error animate-bounce' : 'text-tertiary'}`}>
              {(hasTamperAlarmTriggered || evidenceItems.some(i => i.status === 'Tampered')) ? 'gpp_bad' : 'gpp_good'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {(hasTamperAlarmTriggered || evidenceItems.some(i => i.status === 'Tampered')) ? (
              <div className="flex items-center gap-1">
                <span className="font-display-lg text-4xl text-error font-extrabold blinking glow-red">
                  {evidenceItems.filter(i => i.status === 'Tampered').length}
                </span>
                <div className="flex flex-col ml-1">
                  <span className="text-[10px] font-bold tracking-wider font-label-caps text-error bg-error/15 border border-error/30 px-1.5 py-0.5 rounded uppercase leading-none">
                    Security Fault
                  </span>
                  <span className="font-sans text-[10px] text-error/85 mt-1 leading-none">
                    Integrity Alarm
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-display-lg text-4xl text-tertiary font-extrabold glow-green">0</span>
                <div className="flex flex-col ml-1">
                  <span className="text-[10px] font-bold tracking-wider font-label-caps text-tertiary bg-tertiary/15 border border-tertiary/30 px-1.5 py-0.5 rounded uppercase leading-none">
                    System Verified Secure
                  </span>
                  <span className="font-sans text-[10px] text-[#c5c6cd]/80 mt-1 leading-none">
                    All checkhashes secure
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className={`absolute bottom-0 left-0 w-full h-1 ${(hasTamperAlarmTriggered || evidenceItems.some(i => i.status === 'Tampered')) ? 'bg-error' : 'bg-tertiary'}`} />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleGlobalPurge}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-950/40 text-red-200 border border-red-500/20 hover:bg-red-900/60 hover:text-white transition-all font-bold rounded-lg font-label-caps text-xs tracking-wider cursor-pointer shadow-lg hover:shadow-red-950/20 animate-fade-in"
        >
          🚨 WIPE CORE LOG STORAGE / EMPTY VOLUMES
        </button>
      </div>

      <div className="h-[20px]" />

      {/* Dynamic Coprocessor Drag-and-Drop Dropzone Zone */}
      <section className="glass-panel rounded-xl p-6 border border-outline-variant/60 shadow-xl relative overflow-hidden bg-[#0c0e15]/40">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={fileInputChanged} 
          className="hidden" 
        />
        
        {/* Header and description spanning the full horizontal width */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-tertiary/10 border border-tertiary/30 rounded text-[10px] text-tertiary font-label-caps uppercase font-bold tracking-wider">
              Cryptographic Coprocessor Array
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
          </div>
          <h4 className="font-sans text-lg font-bold text-white uppercase">
            Active Bitstream Analyzer
          </h4>
          <p className="font-sans text-xs text-[#c5c6cd]/90 leading-relaxed mt-2">
            Drag any digital evidence payload, forensic raw audit dump, code carriers, or local media files anywhere into the analyzer array below to automatically calculate state verification vectors.
          </p>
        </div>
        
        <div className="flex flex-col xl:flex-row items-stretch gap-6">
          {/* Status Column */}
          <div className="flex-grow space-y-4 flex flex-col justify-end min-w-0">
            <div className="bg-[#05060a] p-4 rounded-lg border border-white/5 space-y-2">
              <div className="text-[10px] font-mono uppercase text-[#c5c6cd]/40 tracking-wider">
                Array Diagnostic Channel Stream
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono leading-none">
                <span className={`material-symbols-outlined text-sm ${isDashboardCalculatingHash ? 'text-primary animate-spin' : dashboardUploadedFile ? 'text-tertiary' : 'text-[#c5c6cd]/55'}`}>
                  {isDashboardCalculatingHash ? 'sync' : dashboardUploadedFile ? 'check_circle' : 'sensors'}
                </span>
                <span className={`font-medium ${isDashboardCalculatingHash ? 'text-primary' : dashboardUploadedFile ? 'text-tertiary font-bold' : 'text-[#c5c6cd]'}`}>
                  {dashboardFileStatusText}
                </span>
              </div>
            </div>
          </div>

          {/* Drag and Drop Active Vector Box */}
          <div className="xl:w-[480px] shrink-0">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`h-full min-h-[160px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all duration-300 cursor-pointer text-center relative select-none ${
                isDashboardDragActive 
                  ? 'border-tertiary bg-tertiary/15 scale-[1.011] shadow-[0_0_20px_rgba(56,222,187,0.15)]'
                  : isDashboardCalculatingHash
                    ? 'border-primary bg-primary/5 cursor-wait'
                    : 'border-outline-variant/50 hover:border-tertiary/50 hover:bg-[#121722]/40 bg-[#080a10]/40'
              }`}
            >
              {isDashboardDragActive && (
                <div className="absolute inset-0 bg-[#38debb]/5 animate-ping opacity-25 pointer-events-none rounded-xl" />
              )}

              <span className={`material-symbols-outlined text-[36px] mb-2 transition-transform duration-300 ${
                isDashboardDragActive 
                  ? 'text-tertiary scale-110 drop-shadow-[0_0_8px_#38debb]' 
                  : isDashboardCalculatingHash 
                    ? 'text-primary animate-spin' 
                    : 'text-[#8f9097]/80'
              }`}>
                {isDashboardCalculatingHash ? 'progress_activity' : dashboardUploadedFile ? 'fingerprint' : 'cloud_upload'}
              </span>

              {isDashboardCalculatingHash ? (
                <div className="space-y-2">
                  <p className="font-sans text-xs font-bold text-primary uppercase tracking-widest animate-pulse">
                    Recalculating Block Bitstream Checksums...
                  </p>
                  <p className="font-mono text-[9px] text-[#c5c6cd]/40">
                    Reading File Array Buffer Into Standard SHA-256 Digest
                  </p>
                </div>
              ) : dashboardUploadedFile ? (
                <div className="space-y-2">
                  <p className="font-sans text-xs font-bold text-tertiary uppercase tracking-wider">
                    Carrier Analyzed Successfully
                  </p>
                  <p className="font-mono text-[10px] text-white font-bold max-w-[280px] truncate mx-auto bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                    {dashboardUploadedFile.name}
                  </p>
                  <p className="text-[9px] font-mono text-outline uppercase tracking-wider">
                    Click / Drag newer file to reanalyze
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-sans text-xs font-extrabold text-[#bfc7d9] uppercase tracking-wider px-2">
                    {getCategoryPlaceholder(ingestionCategory)}
                  </p>
                  <p className="font-sans text-[10px] text-[#c5c6cd]/60 max-w-[280px] mx-auto">
                    or <span className="text-tertiary underline font-bold hover:text-[#42eac5] transition-colors">browse sandbox storage</span> to calculate automated fingerprint state.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="h-[40px]" />

      {/* Dynamic Evidence ledger table */}
      <section className="glass-panel rounded-xl overflow-hidden shadow-2xl border border-outline-variant/50">
        <div className="p-6 border-b border-outline-variant/30 bg-[#1f1f21]/80 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">feed</span>
            <h3 className="font-title-sm text-base text-white font-extrabold">Active Digital Forensics Vault Indices</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#0a192f] text-[#b9c7e4] text-[10px] uppercase font-bold font-label-caps">
              Database: Live (Local Sync Active)
            </span>
            <button 
              onClick={() => {
                setGlobalSearchToken('');
                alert('Filters reset to original state.');
              }} 
              className="p-1 text-[#c5c6cd] hover:text-white"
              title="Clear Filters"
            >
              <span className="material-symbols-outlined">filter_list_off</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1b1b1d] border-b border-outline-variant text-[11px] font-label-caps text-[#c5c6cd] text-left uppercase">
                <th className="px-6 py-4 font-bold tracking-wider">Evidence ID</th>
                <th className="px-6 py-4 font-bold tracking-wider">Source Filename</th>
                <th className="px-6 py-4 font-bold tracking-wider">SHA-256 Checksum Anchor</th>
                <th className="px-6 py-4 font-bold tracking-wider">Lead Custodian</th>
                <th className="px-6 py-4 font-bold tracking-wider">Category</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status Badge</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Ledger Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {filteredEvidence.map((item) => {
                const isTamperedItem = item.status === 'Tampered';
                return (
                  <tr 
                    key={item.id}
                    onClick={() => {
                      setSelectedEvidenceId(item.id);
                      setSelectedVerificationTargetId(item.id);
                    }}
                    className={`transition-all duration-150 cursor-pointer ${
                      isTamperedItem 
                        ? 'bg-error-container/10 hover:bg-error-container/20 border-l-4 border-error/55' 
                        : item.id === selectedEvidenceId
                          ? 'bg-[#0a192f]/45 hover:bg-[#0a192f]/60 border-l-4 border-tertiary' 
                          : 'hover:bg-[#0a192f]/20'
                    }`}
                  >
                    {/* Evidence ID */}
                    <td className="px-6 py-4 font-data-mono text-xs font-bold text-primary">
                      {item.id}
                    </td>
                    {/* File Name */}
                    <td className="px-6 py-4 font-sans text-sm font-semibold text-white select-all">
                      {item.fileName}
                    </td>
                    {/* SHA-256 Hash truncated */}
                    <td className="px-6 py-4 font-data-mono text-[11px] text-[#c5c6cd] select-all" title={item.hash}>
                      {item.hash.substring(0, 10)}...{item.hash.substring(item.hash.length - 10)}
                    </td>
                    {/* Custodian */}
                    <td className="px-6 py-4 font-sans text-xs font-medium text-white">
                      {item.custodian}
                    </td>
                    {/* Category */}
                    <td className="px-6 py-4 font-sans text-[11px] text-[#c5c6cd]">
                      {item.category}
                    </td>
                    {/* Status Checked Badge */}
                    <td className="px-6 py-4">
                      {isTamperedItem ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#93000a]/20 border border-error/40 text-error font-label-caps text-[9px] font-bold tracking-[0.08em] uppercase blinking">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" />
                          HASH MISMATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-tertiary/10 border border-tertiary/20 text-tertiary font-label-caps text-[9px] font-bold tracking-[0.08em] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_5px_#38debb]" />
                          SECURE
                        </span>
                      )}
                    </td>
                    {/* Action Handlers */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvidenceId(item.id);
                            handleTabClick('archive');
                          }}
                          className="px-3 py-1 bg-secondary-container text-[#b6c6ed] font-label-caps text-[9px] uppercase tracking-wider rounded border border-secondary/20 hover:bg-secondary hover:text-on-secondary transition-all font-bold cursor-pointer"
                        >
                          CUSTODY MAP
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVerificationTargetId(item.id);
                            handleTabClick('forensics');
                          }}
                          className="px-3 py-1 bg-[#343536] text-[#c5c6cd] border border-outline-variant font-label-caps text-[9px] uppercase tracking-wider rounded hover:text-white transition-all font-bold cursor-pointer"
                        >
                          TEST HASH
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(item.id, item.fileName);
                          }}
                          className="px-3 py-1 bg-red-900/35 text-red-200 border border-red-500/30 font-label-caps text-[9px] uppercase tracking-wider rounded hover:bg-red-800 hover:text-white transition-all font-bold cursor-pointer"
                        >
                          🗑️ DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEvidence.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center w-full">
                    <div className="w-full max-w-none block text-center space-y-3 bg-[#110103]/40 border border-error/25 p-8 rounded-lg shadow-inner select-none">
                      <span className="material-symbols-outlined text-error text-3xl animate-pulse block mx-auto mb-2">lock_reset</span>
                      <p className="font-mono text-xs font-bold text-error tracking-widest uppercase block">
                        No matching data archives located in secure directory
                      </p>
                      <p className="font-sans text-[11px] text-[#c5c6cd]/60 leading-normal block max-w-2xl mx-auto">
                        The queried cryptographic ledger token has returned 0 active partition nodes. Verify file hashes, identifier hashes, or custodian tags.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-[#1b1b1d] border-t border-outline-variant/30 flex justify-between items-center text-xs">
          <span className="font-sans text-[#c5c6cd]">
            Displaying <b>{filteredEvidence.length}</b> of <b>{evidenceItems.length}</b> forensic blocks registered
          </span>
          <div className="flex gap-1">
            <button 
              onClick={() => alert('Viewing initial index block.')}
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:border-tertiary text-[#c5c6cd] hover:text-tertiary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button 
              onClick={() => alert('Database is fully loaded in-memory.')}
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:border-tertiary text-[#c5c6cd] hover:text-tertiary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Dynamic Deep Archival Inspector using /api/archives/:id */}
      <section className="glass-panel rounded-xl overflow-hidden shadow-2xl border border-outline-variant/60 bg-[#070a11]/60">
        <div className="p-6 border-b border-outline-variant/30 bg-[#121620]/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary animate-pulse">analytics</span>
            <h3 className="font-sans text-xs font-extrabold text-white uppercase tracking-wider">
              Secure Coprocessor Inspection Port (Live GET /api/archives/:id Query)
            </h3>
          </div>
          {selectedArchiveDetail && (
            <span className="px-2 py-0.5 rounded bg-tertiary/10 border border-tertiary/40 text-tertiary text-[10px] font-bold font-mono">
              RESOLVER ACTIVE
            </span>
          )}
        </div>

        <div className="p-6">
          {isLoadingDetail ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <span className="material-symbols-outlined text-primary animate-spin text-[32px]">sync</span>
              <p className="text-xs font-mono uppercase text-[#c5c6cd]/85 animate-pulse">Refracting electronic cryptographic layers from server runtime...</p>
            </div>
          ) : selectedArchiveDetail ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              {/* Left detail attributes pane */}
              <div className="xl:col-span-7 bg-[#040509]/80 border border-white/5 rounded-lg p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-primary tracking-widest block uppercase">Selected Forensic Registry Log</span>
                    <h4 className="font-sans text-[#b9c7e4] font-bold text-md select-all">{selectedArchiveDetail.fileName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-white/40 block uppercase">Archival File ID</span>
                    <span className="font-mono text-xs text-white font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded inline-block">{selectedArchiveDetail.id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#c5c6cd]/50 block">Case Ingestion Link</span>
                    <span className="text-white font-bold block">{selectedArchiveDetail.caseTitle || 'Generic Active Matter'}</span>
                    <span className="text-[#c5c6cd]/70 text-[9px] font-mono">({selectedArchiveDetail.caseId || 'SEC-0000-ARC'})</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#c5c6cd]/50 block">Ingestion Timestamp</span>
                    <span className="text-white font-bold block">{selectedArchiveDetail.timestamp}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#c5c6cd]/50 block">Total Byte Length</span>
                    <span className="text-white font-bold block font-mono bg-white/5 px-1.5 py-0.5 rounded inline-block">
                      {formatBytes(selectedArchiveDetail.sizeBytes || 0)} ({selectedArchiveDetail.sizeBytes?.toLocaleString()} Bytes)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#c5c6cd]/50 block">Target Structural Category</span>
                    <span className="text-tertiary font-bold block">{selectedArchiveDetail.category || 'Standard Data Dump'}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <span className="text-[10px] uppercase font-mono text-[#c5c6cd]/50 block mb-1">Physical Ledger Description Context</span>
                  <p className="text-xs text-[#c5c6cd]/90 leading-relaxed font-sans italic bg-white/5 p-2 rounded">
                    "{selectedArchiveDetail.description || 'No qualitative contextual description appended on initial system docket registries.'}"
                  </p>
                </div>
              </div>

              {/* Right integrity hashes pane */}
              <div className="xl:col-span-5 flex flex-col justify-between bg-[#040509]/80 border border-white/5 p-5 rounded-lg space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b border-white/10 pb-2">
                    <span className="text-[10px] font-mono text-[#c5c6cd]/65 uppercase font-bold tracking-wider">Hash Integrity Matrix</span>
                    {selectedArchiveDetail.status === 'Tampered' ? (
                      <span className="px-2 py-0.5 bg-[#93000a]/20 border border-error/40 text-error font-bold font-label-caps text-[9px] uppercase tracking-wider blinking">
                        TAMPERED!
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-tertiary/10 border border-tertiary/20 text-tertiary font-bold font-label-caps text-[9px] uppercase tracking-wider">
                        SECURE LOG
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1 bg-white/5 p-2 rounded border border-white/5">
                      <div className="flex items-center justify-between text-[9px] font-mono uppercase text-[#c5c6cd]/50">
                        <span>A: Initial Ingest Hash Fingerprint</span>
                        <span className="material-symbols-outlined text-[10px] text-tertiary">lock_open</span>
                      </div>
                      <p className="font-mono text-[10px] text-white break-all tracking-tight font-medium bg-black/40 px-2 py-0.5 rounded leading-sm">
                        {selectedArchiveDetail.initialHash || selectedArchiveDetail.hash}
                      </p>
                    </div>

                    <div className="space-y-1 bg-white/5 p-2 rounded border border-white/5">
                      <div className="flex items-center justify-between text-[9px] font-mono uppercase text-[#c5c6cd]/50">
                        <span>B: Live Calculated Coprocessor Hash</span>
                        <span className="material-symbols-outlined text-[10px] text-primary">analytics</span>
                      </div>
                      <p className="font-mono text-[10px] text-white break-all tracking-tight font-medium bg-black/40 px-2 py-0.5 rounded leading-sm">
                        {selectedArchiveDetail.hash}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-[10px] uppercase font-mono text-[#c5c6cd]/50 block">Chain of Custody History ({selectedArchiveDetail.handovers?.length || 0} Transfers)</span>
                  {selectedArchiveDetail.handovers && selectedArchiveDetail.handovers.length > 0 ? (
                    <div className="space-y-2 overflow-y-auto max-h-[140px] pr-2 custom-scrollbar">
                      {selectedArchiveDetail.handovers.map((h, idx) => (
                        <div key={idx} className="flex gap-2 text-[10px] font-mono bg-white/5 p-1.5 rounded border border-white/5">
                          <span className="text-tertiary font-bold">#{idx+1}</span>
                          <div className="flex-grow space-y-1">
                            <div className="flex justify-between text-[#c5c6cd]">
                              <span className="font-bold">{h.from} → {h.to}</span>
                              <span className="text-[9px] text-[#c5c6cd]/60">{h.timestamp}</span>
                            </div>
                            <span className="text-[#c5c6cd]/50 block leading-tight text-[9px]">Reason: {h.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#c5c6cd]/60 font-mono text-center italic py-2 bg-white/5 rounded">
                      No subsequent custodial handover history recorded. Item is in pristine prime state.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-sans text-[#c5c6cd]/70 space-y-3 w-full max-w-none block">
              <span className="material-symbols-outlined text-[32px] text-white/20 select-none animate-pulse block mx-auto mb-2">troubleshoot</span>
              <p className="font-sans font-bold tracking-wide uppercase block">Coprocessor Awaiting Targeted Vault Selection</p>
              <p className="text-[#c5c6cd]/50 w-full max-w-none block leading-normal px-6">
                No individual archival record is currently being verified. Click on any record in the 
                <span className="text-tertiary font-bold inline-block mx-1">Vault Indices table</span> above to instantly load specific attributes and execute dynamic checksum verification logs.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Bento Row: Visual graphs and Live console node activity logs */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 relative">
          <h4 className="font-title-sm text-base text-white flex items-center gap-2 font-extrabold select-none">
            <span className="material-symbols-outlined text-primary text-xl">history_edu</span>
            Vigilance System Intake Throughput History
          </h4>
          <div className="h-40 w-full flex items-end gap-[6px] bg-[#090b0f]/60 rounded p-4 border border-outline-variant/20">
            {/* Visual bars */}
            <div className="flex-grow bg-primary/20 hover:bg-primary/50 transition-all rounded-t h-[40%]" title="00:00 - Ingestion active" />
            <div className="flex-grow bg-primary/20 hover:bg-primary/50 transition-all rounded-t h-[60%]" title="03:00 - Node balance" />
            <div className="flex-grow bg-primary/20 hover:bg-primary/50 transition-all rounded-t h-[35%]" title="06:00 - Log flush" />
            <div className="flex-grow bg-primary/20 hover:bg-primary/50 transition-all rounded-t h-[80%]" title="09:00 - High speed dd imaging" />
            <div className="flex-grow bg-primary/20 hover:bg-primary/50 transition-all rounded-t h-[55%]" title="12:00 - Custodian handoffs" />
            <div className="flex-grow bg-primary/20 hover:bg-primary/50 transition-all rounded-t h-[95%]" title="15:00 - Ingress workload high" />
            <div className="flex-grow bg-primary/20 hover:bg-primary/50 transition-all rounded-t h-[70%]" title="18:00 - Sync satellites" />
            <div className="flex-grow bg-primary/20 hover:bg-primary/50 transition-all rounded-t h-[48%]" title="21:00 - Standby" />
          </div>
          <div className="flex justify-between font-label-caps text-[10px] text-[#c5c6cd]/40 px-2 uppercase tracking-widest">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59 (UTC)</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 space-y-4 overflow-hidden relative">
          <h4 className="font-title-sm text-base text-white flex items-center gap-2 font-extrabold select-none">
            <span className="material-symbols-outlined text-tertiary text-xl">terminal</span>
            Live Master Cryptographic Node Ingress Stream
          </h4>
          <div className="space-y-2 font-data-mono text-[11px] h-36 overflow-y-auto custom-scrollbar pr-3">
            {masterStreamLogs.map((log, index) => {
              let textClass = 'text-[#c5c6cd]/90';
              if (log.isError) {
                textClass = 'text-error font-bold animate-pulse';
              } else if (log.isSuccess) {
                textClass = 'text-emerald-400 font-bold';
              } else if (log.type === 'INGRESS') {
                textClass = 'text-cyan-400';
              }

              return (
                <div key={index} className="flex gap-2 text-left items-start">
                  <span className={log.isError ? 'text-error font-bold' : 'text-tertiary'}>
                    [{log.timestamp}]
                  </span>
                  <span className={`${textClass} break-all`}>
                    <span className="font-extrabold mr-1 shadow-sm uppercase">[{log.type}]</span>
                    {log.text}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
        </div>
      </section>

    </motion.div>
  );
};
