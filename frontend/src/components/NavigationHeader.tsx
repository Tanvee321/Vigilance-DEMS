/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScreenView } from '../types';

interface NavigationHeaderProps {
  toggleMenu: () => void;
  globalSearchToken: string;
  setGlobalSearchToken: (token: string) => void;
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
  liveHashMetrics: { throughput: string; latency: string };
  hasTamperAlarmTriggered: boolean;
  handleTabClick: (view: ScreenView) => void;
  onSearchEnter?: (query: string) => void;
  sessionUser?: { email: string; name: string; role: string; clearance: string };
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  toggleMenu,
  globalSearchToken,
  setGlobalSearchToken,
  openCustomOverlay,
  liveHashMetrics,
  hasTamperAlarmTriggered,
  handleTabClick,
  onSearchEnter,
  sessionUser,
}) => {
  return (
    <header className={`fixed left-0 right-0 z-50 bg-[#131315]/85 backdrop-blur-md border-b border-outline-variant flex justify-between items-center w-full px-8 h-20 transition-all duration-300 ${
      hasTamperAlarmTriggered ? 'top-16' : 'top-0'
    }`}>
      <div className="flex items-center gap-md">
        <button 
          onClick={toggleMenu}
          className="p-3 hover:bg-[#1f1f21] rounded-full transition-colors cursor-pointer active:scale-95" 
          id="menu-toggle"
          aria-label="Toggle navigation drawer menu"
        >
          <span className="material-symbols-outlined text-primary text-2xl">menu</span>
        </button>
        <div className="flex flex-col">
          <span className="font-headline-md text-[20px] font-bold tracking-tight text-white uppercase select-none">
            DEMS <span className="text-tertiary">ARCHIVE</span>
          </span>
          <span className="font-label-caps text-[9px] tracking-[0.2em] text-[#c5c6cd]/50 -mt-1 select-none">
            SENTINEL INTELLIGENCE SYSTEM
          </span>
        </div>
      </div>

      {/* Global active status and action options */}
      <div className="flex items-center gap-lg">
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-md">
            <span 
              onClick={() => openCustomOverlay(
                'diagnostics',
                'Cryptographic Co-Processor Health',
                'The local physical coprocessor node is online and active with system-level WebCrypto instructions streams.',
                [
                  { label: 'Coprocessor Sync Code', value: 'NOMINAL (OPTIMAL)' },
                  { label: 'Throughput', value: liveHashMetrics.throughput },
                  { label: 'Latency', value: liveHashMetrics.latency },
                  { label: 'Hardware Engine', value: 'Sentinel-Intel co-processor core-v4' },
                  { label: 'Active Pipeline', value: 'WebCrypto SHA-256 standard API' }
                ],
                'monitor_heart',
                'HARDWARE STATUS NOMINAL'
              )}
              className="material-symbols-outlined text-[#c5c6cd] cursor-pointer hover:text-tertiary transition-colors text-xl"
              title="System Diagnostics Health"
            >
              monitor_heart
            </span>
            <span 
              onClick={() => openCustomOverlay(
                'notifications',
                'Sentinel System Incident Desk',
                hasTamperAlarmTriggered 
                  ? 'ALERT: Core integrity check failure detected. Discrepancy logged for compromised device partition dump.'
                  : 'System Status normal. Automatic background telemetry polls returned zero security alerts for active vaults.',
                [
                  { label: 'Pending Security Flags', value: hasTamperAlarmTriggered ? '1 CRITICAL COMPROMISE' : '0 alerts' },
                  { label: 'System Guard Level', value: hasTamperAlarmTriggered ? 'BREACH WARNING' : 'HEALTH NOMINAL' },
                  { label: 'Sync Client Status', value: 'CONNECTED-TO-MAINNET' }
                ],
                'notifications',
                'SYSTEM TELEMETRY WATCH',
                hasTamperAlarmTriggered
              )}
              className="material-symbols-outlined text-[#c5c6cd] cursor-pointer hover:text-tertiary transition-colors text-xl relative"
              title="Notifications"
            >
              notifications
              {hasTamperAlarmTriggered && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-error animate-ping" />}
            </span>
            <span 
              onClick={() => handleTabClick('settings')}
              className="material-symbols-outlined text-[#c5c6cd] cursor-pointer hover:text-tertiary transition-colors text-xl"
              title="Sovereign Settings Node"
            >
              settings
            </span>
          </div>
          
          <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
          
          <div className="flex items-center gap-md select-none">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-semibold text-white">{sessionUser?.name || 'Agent J. Miller'}</p>
              <p className="text-[9px] text-tertiary font-label-caps">{sessionUser?.clearance || 'L5 CLEARANCE'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1b1b1d] overflow-hidden border border-outline-variant">
              <img 
                alt="Officer Profile" 
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwHlex-bPHFD5t9OE_T9SFSu_KMoeOtgOSJc4VqeaQZQX1qTO05qHawqS4_WaqlCJ7lgI_wd46o64DcKxVi3NZ9w9Csco2w2117WoGCAzYRn29uglGz2wcezIP_g-hT5McS5tof59Hwa-Y_SyAZzqK-t4Bu-fGUaveGiB5i3snpuuDPkx-Hz0Q23U8RqrIpwRiEr8FOyhQi9bN57hzmH2WIAel33Hqn94upMFw_SM9tpLhI6GyjLRn9UaChbsjEYzi08aMzWLA1hcH"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
