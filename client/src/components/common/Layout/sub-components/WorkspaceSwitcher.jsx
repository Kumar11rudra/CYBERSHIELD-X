import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrganization } from '../../../../context/OrganizationContext';
import { Icon, ICONS } from '../icons';

/**
 * WorkspaceSwitcher Component
 * Handles the organizational/workspace switching dropdown list.
 */
export default function WorkspaceSwitcher({ orgDropdownOpen, setOrgDropdownOpen, orgDropdownRef }) {
  const {
    organizations,
    activeOrgId,
    activeOrg,
    switchToPersonal,
    switchToOrg,
    isOrgMode,
  } = useOrganization();

  if (!organizations) return null;

  return (
    <div className="px-4 pt-4 pb-2" ref={orgDropdownRef}>
      <p className="px-3 mb-2 font-mono text-[8px] text-cyber-muted uppercase tracking-[0.4em]">
        Workspace
      </p>
      <button
        id="org-switcher-btn"
        onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 text-left group ${
          isOrgMode
            ? 'bg-cyan-500/10 border-cyan-500/25 hover:border-cyan-500/50'
            : 'bg-white/[0.03] border-white/5 hover:border-white/20'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
            isOrgMode
              ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-500/30'
              : 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {isOrgMode ? (activeOrg?.name?.[0] || 'O').toUpperCase() : '⌂'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] font-bold text-white truncate uppercase tracking-wider">
            {isOrgMode ? activeOrg?.name : 'Personal Space'}
          </p>
          <p className="font-mono text-[8px] text-cyber-muted truncate">
            {isOrgMode ? `${activeOrg?.role || 'member'} access` : 'Private workspace'}
          </p>
        </div>
        <Icon d={ICONS.chevDown} size={12} />
      </button>

      <AnimatePresence>
        {orgDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mt-2 py-2 bg-[#0a1628] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 relative"
            style={{ transformOrigin: 'top' }}
          >
            {/* Personal Space */}
            <button
              id="org-switch-personal"
              onClick={() => {
                switchToPersonal();
                setOrgDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5 ${
                !isOrgMode ? 'bg-emerald-500/10 text-emerald-400' : 'text-cyber-muted'
              }`}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] bg-emerald-500/15 border border-emerald-500/20">
                ⌂
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                Personal Space
              </span>
              {!isOrgMode && <span className="ml-auto text-[8px] text-emerald-400">●</span>}
            </button>

            {organizations.length > 0 && (
              <div className="border-t border-white/5 mt-1 pt-1">
                <p className="px-4 py-1 font-mono text-[7px] text-cyber-muted uppercase tracking-[0.4em]">
                  Organizations
                </p>
                {organizations.map((org) => {
                  const orgId = org._id || org.id;
                  const isActive = activeOrgId === orgId;
                  return (
                    <button
                      key={orgId}
                      id={`org-switch-${orgId}`}
                      onClick={() => {
                        switchToOrg(orgId);
                        setOrgDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5 ${
                        isActive ? 'bg-cyan-500/10 text-cyan-300' : 'text-cyber-muted'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black border ${
                          isActive
                            ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-white/50'
                        }`}
                      >
                        {(org.name?.[0] || 'O').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider block truncate">
                          {org.name}
                        </span>
                        <span className="font-mono text-[7px] text-cyber-muted uppercase">
                          {org.role}
                        </span>
                      </div>
                      {isActive && <span className="text-[8px] text-cyan-400">●</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
