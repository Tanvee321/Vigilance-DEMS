/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AuditLogEvent, EvidenceItem } from '../types';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface AuditViewProps {
  auditLogs: AuditLogEvent[];
  hasTamperAlarmTriggered: boolean;
  liveHashMetrics: { throughput: string; latency: string };
  evidenceItems: EvidenceItem[];
}

const CustomTimelineTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0b0e14]/95 border border-tertiary/40 p-5 rounded-lg shadow-2xl backdrop-blur-md text-left font-sans select-none pointer-events-none custom-recharts-tooltip-box">
        <p className="font-data-mono text-[9px] text-tertiary font-bold tracking-widest uppercase mb-1">{data.itemId}</p>
        <p className="font-sans text-[#ffffff] font-bold text-sm leading-tight mb-2">{data.caseTitle}</p>
        <div className="space-y-1.5 text-xs text-[#c5c6cd]">
          <p><strong className="text-white/60">Asset File:</strong> {data.fileName}</p>
          <p><strong className="text-white/60">CUSTODY TRANSFER:</strong></p>
          <p className="font-mono text-tertiary font-bold bg-tertiary/10 px-2 py-0.5 rounded text-[10px] inline-block">{data.from} ➔ {data.to}</p>
          <p className="mt-1"><strong className="text-white/60">Reason:</strong> {data.reason}</p>
          <p className="font-mono text-[9px] text-[#c5c6cd]/50 mt-1">{data.displayDate}</p>
        </div>
      </div>
    );
  }
  return null;
};

export const AuditView: React.FC<AuditViewProps> = ({
  auditLogs,
  hasTamperAlarmTriggered,
  liveHashMetrics,
  evidenceItems,
}) => {
  const timelineData = React.useMemo(() => {
    const list: any[] = [];
    if (evidenceItems && Array.isArray(evidenceItems)) {
      evidenceItems.forEach(item => {
        if (item.handovers && Array.isArray(item.handovers)) {
          item.handovers.forEach((h, idx) => {
            list.push({
              id: `${item.id}-H${idx}`,
              itemId: item.id,
              caseTitle: item.caseTitle || 'Forensic Carrier Intake',
              fileName: item.fileName,
              from: h.from,
              to: h.to,
              reason: h.reason,
              timestamp: h.timestamp,
              epoch: new Date(h.timestamp.includes('UTC') ? h.timestamp : h.timestamp + ' UTC').getTime() || Date.now(),
              timeLabel: h.timestamp.split(' ')[1] || '',
              displayDate: h.timestamp,
              yVal: 1,
            });
          });
        }
      });
    }

    // Fallback beautiful mockup so the chart is fully rendered and populated on new nodes
    if (list.length === 0) {
      return [
        { id: 'DEMO-1', itemId: 'EVD-2026-X1', caseTitle: 'Operation Cipher Rest', fileName: 'encrypted_vault.bin', from: 'Inbound Officer', to: 'Evidence Specialist', reason: 'Forensic System Ingest Seal', timestamp: '2026-06-02 12:00:00 UTC', epoch: 1780401600000, timeLabel: '12:00', displayDate: '2026-06-02 12:00:00 UTC', yVal: 1 },
        { id: 'DEMO-2', itemId: 'EVD-2026-X2', caseTitle: 'Alpha Stream Scan', fileName: 'bitstream_header.raw', from: 'Special Investigator', to: 'Sentinel Lead Analyst', reason: 'Block Buffer Cryptoprocessing Scan', timestamp: '2026-06-02 14:30:00 UTC', epoch: 1780410600000, timeLabel: '14:30', displayDate: '2026-06-02 14:30:00 UTC', yVal: 1 },
        { id: 'DEMO-3', itemId: 'EVD-2026-X3', caseTitle: 'Quantum Handover Shield', fileName: 'unverified_payload.img', from: 'Sentinel Lead Analyst', to: 'Court Archival Locker', reason: 'Secure Vault Immutability Block Locked', timestamp: '2026-06-03 09:15:00 UTC', epoch: 1780478100000, timeLabel: '09:15', displayDate: '2026-06-03 09:15:00 UTC', yVal: 1 }
      ];
    }

    return list.sort((a, b) => a.epoch - b.epoch);
  }, [evidenceItems]);
  return (
    <motion.div 
      key="audit"
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
            Sovereign System Audit & Integrity Ledger
          </h1>
        </div>
        <p className="font-data-mono text-[#c5c6cd]/40 uppercase tracking-[0.3em] text-[10px] ml-lg select-none">
          Archival Database Ledger: <span className="text-tertiary">Immutable Cryptographic Signature History Trail</span>
        </p>
      </header>

      {/* Spacing constraint: Spacing Rule 1 -> ensure 60px of spacing below the titles to keep elements clear */}
      <div className="h-[60px]" />

      <div className="w-full max-w-none flex flex-col gap-10 pb-20">
        
        {/* Upper Metrics Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* System Integrity Status Card */}
          <div className={`glass-panel p-10 rounded-xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group hover:bg-tertiary/5 transition-all duration-500 shadow-2xl border ${
            hasTamperAlarmTriggered ? 'border-error/40 bg-[#93000a]/5' : 'border-tertiary/30'
          }`}>
            <div className="absolute -right-10 -bottom-10 opacity-[0.04] transition-opacity select-none pointer-events-none">
              <span className="material-symbols-outlined text-[180px]">shield</span>
            </div>

            <div className="w-24 h-24 rounded bg-tertiary/15 border border-tertiary/30 flex items-center justify-center shrink-0 shadow-lg">
              <span className={`material-symbols-outlined text-[64px] ${hasTamperAlarmTriggered ? 'text-error animate-ping' : 'text-tertiary glow-green'}`}>
                {hasTamperAlarmTriggered ? 'gpp_bad' : 'verified_user'}
              </span>
            </div>

            <div className="relative z-10 text-center md:text-left select-none">
              <h2 className="font-label-caps text-xs text-[#c5c6cd] tracking-[0.2em] mb-2 font-bold uppercase">
                System Integrity Status
              </h2>
              <p className={`font-data-mono text-[36px] lg:text-[44px] font-extrabold leading-tight ${
                hasTamperAlarmTriggered ? 'text-error glow-red' : 'text-tertiary glow-green'
              }`}>
                {hasTamperAlarmTriggered ? 'CRITICAL FAILURE' : '99.98% STANDING SECURE'}
              </p>
              <p className="font-data-mono text-xs text-[#c5c6cd]/60 uppercase tracking-widest mt-1">
                {hasTamperAlarmTriggered ? 'BITSTREAM COMPROMISE FLAG DETECTED - SYSTEM LOCKED' : 'ALL ARCHIVE NODES VERIFIED NOMINAL'}
              </p>
            </div>
          </div>

          {/* Threat telemetry status Card */}
          <div className={`p-10 rounded-xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group hover:bg-error/5 transition-all duration-500 shadow-2xl border ${
            hasTamperAlarmTriggered 
              ? 'border-error bg-[#93000a]/20 shadow-[0_0_20px_rgba(255,183,183,0.15)]' 
              : 'border-outline-variant bg-[#13151b]/30'
          }`}>
            <div className="absolute -right-10 -bottom-10 opacity-[0.04] transition-opacity select-none pointer-events-none">
              <span className="material-symbols-outlined text-[180px]">warning</span>
            </div>

            <div className="w-24 h-24 rounded bg-error/15 border border-error/30 flex items-center justify-center shrink-0 shadow-lg">
              <div className="relative">
                <span className="material-symbols-outlined text-error text-[64px] glow-red">report_problem</span>
                {hasTamperAlarmTriggered && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full blinking border-2 border-[#13151b]" />
                )}
              </div>
            </div>

            <div className="relative z-10 text-center md:text-left select-none">
              <h2 className="font-label-caps text-xs text-[#c5c6cd] tracking-[0.2em] mb-2 font-bold uppercase">
                CRITICAL THREAT TELEMETRY STATUS
              </h2>
              <p className="font-data-mono text-[36px] lg:text-[44px] text-error font-extrabold glow-red leading-tight uppercase animate-fade-in">
                {hasTamperAlarmTriggered ? '03 HAZARD ALERTS' : '02 ANOMALY FAILURES'}
              </p>
              <p className="font-data-mono text-xs text-[#c5c6cd]/60 uppercase tracking-widest mt-1">
                {hasTamperAlarmTriggered ? 'LOCKOUT BUFFER TRIGGERS ONLINE' : 'EXPECTED ARCHIVAL HASH INGEST MISMATCH ON EVD-083'}
              </p>
            </div>
          </div>
        </div>

        {/* Cryptographic timeline visualization */}
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-title-sm text-2xl text-white font-extrabold flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-tertiary">timeline</span>
              Cryptographic Custody Timeline Graph
            </h3>
            <p className="text-[#c5c6cd]/80 font-sans text-xs select-none">
              Horizontal chronographic visualization of active custody handovers and validation checkpoints mapped securely over the timeline axis.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-2xl border border-outline-variant/50 flex flex-col gap-4 relative overflow-hidden bg-[#0d1017]/85">
            <div className="absolute top-4 right-4 flex items-center gap-2 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_#38debb]" />
              <span className="font-data-mono text-[9px] text-[#c5c6cd]/60 uppercase tracking-widest font-bold">Secure Node Checkpoint</span>
            </div>

            <div className="w-full h-[160px] relative rounded overflow-hidden flex flex-col justify-end">
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none">
                <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(to right, #38debb 1px, transparent 1px)', backgroundSize: '10% 100%' }} />
              </div>

              <div className="flex-grow w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 35, right: 40, bottom: 5, left: 40 }}>
                    <XAxis 
                      type="number" 
                      dataKey="epoch" 
                      domain={['dataMin - 3600000', 'dataMax + 3600000']} 
                      tickFormatter={(tick) => {
                        const date = new Date(tick);
                        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                      }}
                      stroke="#c5c6cd"
                      strokeOpacity={0.15}
                      tick={{ fill: '#c5c6cd', opacity: 0.5, fontSize: 8.5, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#c5c6cd', strokeWidth: 1, opacity: 0.15 }}
                      tickLine={{ stroke: '#c5c6cd', strokeWidth: 1, opacity: 0.15 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="yVal" 
                      domain={[0, 2]} 
                      hide 
                    />
                    <Tooltip 
                      content={<CustomTimelineTooltip />} 
                      cursor={{ stroke: '#38debb', strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.4 }} 
                      isAnimationActive={false}
                      wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 120 }}
                    />
                    <Scatter name="Custody Chain" data={timelineData}>
                      {timelineData.map((entry: any, index: number) => {
                        const isThreat = entry.reason?.toLowerCase().includes('tamper') || entry.reason?.toLowerCase().includes('warning') || entry.reason?.toLowerCase().includes('critical');
                        return (
                          <Cell 
                            key={`handover-cell-${index}`} 
                            fill={isThreat ? '#ff5555' : '#38debb'} 
                            stroke={isThreat ? '#ff9800' : '#22384a'} 
                            strokeWidth={2}
                            r={8}
                            className="cursor-pointer hover:scale-135 transition-transform" 
                          />
                        );
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Ledger List table */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-sm select-none">
            <div>
              <h3 className="font-title-sm text-2xl text-white font-extrabold flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">history</span>
                Cryptographic Action Ledger
              </h3>
              <p className="text-[#c5c6cd]/80 font-sans text-xs">
                High-fidelity transaction record capturing hardware cryptographic validation routines and session activities.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => alert("Cryptographic ledger synchronized with Sentinel Cloud Nodes mainnet.")}
                className="px-6 py-2.5 bg-tertiary/10 border border-tertiary/40 text-tertiary hover:bg-tertiary/20 text-xs font-label-caps uppercase tracking-wider font-bold rounded cursor-pointer w-full md:w-auto text-center"
              >
                SYNC REPOSITORY
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden shadow-2xl border border-outline-variant/50">
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1b1b1d] border-b border-outline-variant text-[11px] font-label-caps text-tertiary tracking-wider uppercase">
                    <th className="px-8 py-5">TIMESTAMP (UTC)</th>
                    <th className="px-8 py-5">INVESTIGATOR ID</th>
                    <th className="px-8 py-5">ROUTINE ACTION PERFORMED</th>
                    <th className="px-8 py-5">TARGET TELEMETRY ID</th>
                    <th className="px-8 py-5">SECURITY INTEGRITY BADGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-data-mono text-xs">
                  {auditLogs.map((log, index) => {
                    const isThreatRow = log.status === 'TAMPER_DETECTED' || log.status === 'WARNING';
                    return (
                      <tr 
                        key={index}
                        onClick={() => alert(`Verification receipt token: DEMS-${log.targetId}-${log.status}`)}
                        className={`transition-colors cursor-pointer ${
                          isThreatRow 
                            ? 'bg-error/5 hover:bg-error/10 text-error' 
                            : 'hover:bg-[#1f1f21] text-white'
                        }`}
                      >
                        <td className="px-8 py-4 text-[#c5c6cd] font-medium select-all">
                          {log.timestamp}
                        </td>
                        <td className="px-8 py-4 font-bold text-primary">
                          {log.investigatorId}
                        </td>
                        <td className="px-8 py-4 font-sans font-medium text-white/90">
                          {log.action}
                        </td>
                        <td className="px-8 py-4 text-outline select-all">
                          {log.targetId}
                        </td>
                        <td className="px-8 py-4">
                          {isThreatRow ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-error/20 border border-error/50 text-error font-label-caps text-[10px] font-bold tracking-[0.1em] uppercase blinking">
                              {log.status === 'TAMPER_DETECTED' ? 'TAMPER DETECTED' : 'WARNING'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-tertiary font-bold tracking-widest text-[10px]">
                              <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_#38debb]" />
                              VERIFIED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Visualization Mesh and charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Visual Topology Mesh */}
          <div className="lg:col-span-2 glass-panel rounded-xl p-8 flex flex-col gap-6 shadow-xl border border-outline-variant">
            <h4 className="font-label-caps text-xs text-tertiary uppercase tracking-[0.3em] font-bold flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-lg">hub</span> 
              Hardware Cryptographic Node topology mesh
            </h4>
            
            <div className="flex-grow aspect-[21/9] relative rounded bg-[#090b11] border border-outline-variant/30 overflow-hidden flex items-center justify-center min-h-[220px]">
              <div className="absolute inset-0 opacity-[0.06] select-none pointer-events-none">
                <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #38debb 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              </div>

              {/* Cool animation network display nodes */}
              <div className="relative z-10 text-center select-none space-y-4">
                <div className="flex items-center justify-center gap-6">
                  <div className="w-12 h-12 rounded border border-tertiary/40 bg-[#121215] flex flex-col items-center justify-center blinking">
                    <span className="text-[10px] font-label-caps font-bold text-tertiary select-none">NODE-01</span>
                    <span className="text-[8px] font-data-mono text-outline leading-none select-none">PRIMARY</span>
                  </div>
                  <div className="h-0.5 w-8 bg-tertiary/20" />
                  <div className="w-12 h-12 rounded border border-primary/25 bg-[#121215] flex flex-col items-center justify-center">
                    <span className="text-[10px] font-label-caps font-bold text-primary select-none">S-09</span>
                    <span className="text-[8px] font-data-mono text-outline leading-none select-none">BACKUP</span>
                  </div>
                  <div className="h-0.5 w-8 bg-tertiary/20" />
                  <div className={`w-12 h-12 rounded border bg-[#121215] flex flex-col items-center justify-center ${hasTamperAlarmTriggered ? 'border-error animate-ping' : 'border-outline-variant/30'}`}>
                    <span className="text-[10px] font-label-caps font-bold select-none">NODE-03</span>
                    <span className="text-[8px] font-data-mono text-outline leading-none select-none">VAULT</span>
                  </div>
                </div>

                <p className="font-data-mono text-xs text-tertiary/70 animate-pulse tracking-[0.2em] font-bold uppercase select-none">
                  {hasTamperAlarmTriggered ? 'ANOMALY DETECTED IN NODE-03 STREAM' : 'RENDERING CRYPTOGRAPHIC IMMUTABILITY MESH...'}
                </p>
              </div>
            </div>
          </div>

          {/* Hash co-processor live telemetry feedback */}
          <div className="glass-panel rounded-xl p-8 flex flex-col gap-6 shadow-xl border border-outline-variant">
            <h4 className="font-label-caps text-xs text-tertiary uppercase tracking-[0.3em] font-bold select-none">
              Security Engine Hardware Telemetry
            </h4>
            
            <div className="flex-1 flex flex-col justify-between gap-6 font-data-mono select-none">
              <div className="space-y-4">
                
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] text-outline font-bold tracking-wider uppercase">SHA-256 throughput co-processor</span>
                    <span className="text-tertiary font-bold text-lg glow-green">{liveHashMetrics.throughput}</span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-tertiary shadow-[0_0_10px_rgba(56,222,187,0.6)]" style={{ width: '84%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] text-outline font-bold tracking-wider uppercase">Direct hardware thread latency</span>
                    <span className="text-tertiary font-bold text-lg glow-green">{liveHashMetrics.latency}</span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-tertiary shadow-[0_0_10px_rgba(56,222,187,0.6)]" style={{ width: '14%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] text-outline font-bold tracking-wider uppercase">Ingestion Queue Load</span>
                    <span className="text-white font-bold text-base">0 Pending</span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-[#343536]" style={{ width: '0%' }} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
