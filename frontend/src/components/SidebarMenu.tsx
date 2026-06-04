/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenView } from '../types';

interface SidebarMenuProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  setIsMenuOpen: (open: boolean) => void;
  activeView: ScreenView;
  handleTabClick: (view: ScreenView) => void;
  executeLockoutTerminal: () => void;
  setHasTamperAlarmTriggered: (triggered: boolean) => void;
  openTerminalNotice: (title: string, desc: string, logs?: string[], clearance?: string) => void;
  onLogout: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isMenuOpen,
  toggleMenu,
  setIsMenuOpen,
  activeView,
  handleTabClick,
  executeLockoutTerminal,
  setHasTamperAlarmTriggered,
  openTerminalNotice,
  onLogout,
}) => {
  return (
    <>
      {/* Mobile sliding navigation drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Sliding Drawer Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] block transition-opacity duration-300 pointer-events-auto"
            />
            {/* Sliding Drawer Menu Content */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="fixed top-0 left-0 h-full w-80 bg-[#1f1f21] border-r border-outline-variant z-[70] flex flex-col py-6"
            >
              <div className="px-4 mb-8 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#b9c7e4] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#233148] text-[20px]">security</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-sm text-[#b9c7e4] leading-none font-bold uppercase">Command Center</h2>
                    <p className="font-label-caps text-[9px] text-[#c5c6cd]/60">Precision Integrity</p>
                  </div>
                </div>
                <button 
                  onClick={toggleMenu}
                  className="p-1 text-[#c5c6cd] hover:text-white cursor-pointer"
                  aria-label="Close navigation panel"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-grow space-y-1 px-3">
                <button 
                  onClick={() => handleTabClick('dashboard')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                    activeView === 'dashboard' 
                      ? 'text-tertiary bg-tertiary/10 border border-tertiary/20' 
                      : 'text-[#c5c6cd] hover:text-white hover:bg-[#343536]'
                  }`}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Dashboard</span>
                </button>

                <button 
                  onClick={() => handleTabClick('archive')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                    activeView === 'archive' 
                      ? 'text-tertiary bg-tertiary/10 border border-tertiary/20' 
                      : 'text-[#c5c6cd] hover:text-white hover:bg-[#343536]'
                  }`}
                >
                  <span className="material-symbols-outlined">folder_zip</span>
                  <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Archive</span>
                </button>

                <button 
                  onClick={() => handleTabClick('forensics')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                    activeView === 'forensics' 
                      ? 'text-tertiary bg-tertiary/10 border border-tertiary/20' 
                      : 'text-[#c5c6cd] hover:text-white hover:bg-[#343536]'
                  }`}
                >
                  <span className="material-symbols-outlined">manage_search</span>
                  <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Forensics</span>
                </button>

                <button 
                  onClick={() => handleTabClick('audit')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                    activeView === 'audit' 
                      ? 'text-tertiary bg-tertiary/10 border border-tertiary/20' 
                      : 'text-[#c5c6cd] hover:text-white hover:bg-[#343536]'
                  }`}
                >
                  <span className="material-symbols-outlined">history</span>
                  <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Audit Logs</span>
                </button>

                <button 
                  onClick={() => handleTabClick('settings')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                    activeView === 'settings' 
                      ? 'text-tertiary bg-tertiary/10 border border-tertiary/20' 
                      : 'text-[#c5c6cd] hover:text-white hover:bg-[#343536]'
                  }`}
                >
                  <span className="material-symbols-outlined">settings</span>
                  <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Settings</span>
                </button>
              </nav>

              <div className="mt-auto px-3 space-y-1">
                <button 
                  onClick={() => {
                    executeLockoutTerminal();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-6 rounded bg-[#93000a]/20 text-error font-label-caps text-xs tracking-wider border border-error/20 hover:bg-[#93000a]/40 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_person</span>
                  Emergency Lockout
                </button>
                <div 
                  onClick={() => {
                    openTerminalNotice(
                      'CLEARANCE SHA1 -> SHA256 CONVERSION MODULE',
                      'Sovereign support module to anchor older SHA-1 hash structures into SHA-256 standard cryptographic trees for Sentinel Mainnet archival compatibility. Requires Level 5 Security clearance token payload to authorize database transaction rewrite.',
                      [
                        `[DIAGNOSTICS] SHA-1 legacy database mapped: 4,212 archives detected.`,
                        `[CALCULATION] Estimated upgrade cost: 12.4ms cryptographic hash-node recalculation loop.`,
                        `[PRECONDITION] Contacting Sentinel Node Administration support... OK`
                      ],
                      'LEVEL 5 SOVEREIGN CORE'
                    );
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-4 px-4 py-3 rounded text-[#c5c6cd] hover:text-white hover:bg-[#343536] transition-all duration-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined">help</span>
                  <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Support Info</span>
                </div>
                <div 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-4 px-4 py-3 rounded text-[#c5c6cd] hover:text-white hover:bg-[#343536] transition-all duration-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span className="font-label-caps text-xs uppercase tracking-wider font-bold">System Logout</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </>
  );
};
