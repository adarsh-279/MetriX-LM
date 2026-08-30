import React, { useState } from 'react';
import { useAuth, type UserRole } from '../lib/authContext';
import { Shield, RotateCcw, CheckCircle2, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../lib/useToast';

interface NavbarProps {
  title: string;
  sub?: string;
  onRefresh?: () => void;
}

const ROLE_STYLES: Record<UserRole, { title: string; pill: string; dot: string }> = {
  technician: { title: 'Technician', pill: 'border-primary/25 bg-primary-light text-primary', dot: 'bg-primary' },
  reviewer: { title: 'Reviewer / Metrologist', pill: 'border-warning/25 bg-warning-light text-warning', dot: 'bg-warning' },
  admin: { title: 'System Administrator', pill: 'border-info/25 bg-info-light text-info', dot: 'bg-info' },
  lab_manager: { title: 'Lab Director', pill: 'border-lab-purple/25 bg-lab-purple-light text-lab-purple', dot: 'bg-lab-purple' },
};

export default function Navbar({ title, sub, onRefresh }: NavbarProps) {
  const { user, role, switchRole } = useAuth();
  const { show, node } = useToast();
  const [resetting, setResetting] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleResetDemo = async () => {
    if (!confirm('Reset database to clean initial demonstration state with realistic sample data?')) return;
    setResetting(true);
    try {
      await api.seed.reset();
      show('✅ Database reseeded with clean demo data');
      if (onRefresh) onRefresh();
      setTimeout(() => window.location.reload(), 600);
    } catch (err: any) {
      show('Error resetting demo: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const currentRoleConfig = ROLE_STYLES[role] || ROLE_STYLES.technician;

  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        {sub && <div className="topbar-sub">{sub}</div>}
      </div>

      <div className="flex items-center gap-3.5">
        <button
          className="btn btn-outline btn-sm inline-flex items-center gap-1.5 text-xs"
          onClick={handleResetDemo}
          disabled={resetting}
          title="Reset database to initial demo state"
        >
          <RotateCcw size={13} className={resetting ? 'spin' : ''} />
          {resetting ? 'Resetting...' : 'Reset Demo Data'}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all ${currentRoleConfig.pill}`}
          >
            <Shield size={15} />
            <span>Role: {currentRoleConfig.title}</span>
            <ChevronDown size={14} />
          </button>

          {showRoleMenu && (
            <div className="absolute top-full right-0 z-[1000] mt-1.5 w-[240px] rounded-md border border-border bg-white py-1.5 shadow-lg">
              <div className="px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-subtle uppercase">
                Switch User Persona
              </div>
              {(['technician', 'reviewer', 'admin', 'lab_manager'] as UserRole[]).map((r) => (
                <div
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowRoleMenu(false);
                    show(`Switched active role to ${ROLE_STYLES[r].title}`);
                  }}
                  className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-[13px] ${
                    role === r ? 'bg-page font-semibold' : 'font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${ROLE_STYLES[r].dot}`} />
                    <span>{ROLE_STYLES[r].title}</span>
                  </div>
                  {role === r && <CheckCircle2 size={15} className="text-success" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-l border-border pl-2">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-white">
            {user ? user.name.charAt(0) : 'U'}
          </div>
          <div className="text-xs">
            <div className="max-w-40 truncate font-semibold text-ink">{user?.name || 'Technician'}</div>
            <div className="text-[11px] text-muted">{user?.email || 'tech@nawi.gov.in'}</div>
          </div>
        </div>
      </div>
      {node}
    </header>
  );
}
