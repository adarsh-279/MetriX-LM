import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Scale,
  FileCheck,
  PlusCircle,
  FileText,
  ShieldAlert,
  Sliders,
  History,
  BookOpen,
  FlaskConical,
  Award,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

export default function Sidebar() {
  const { role } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/cases', label: 'Evaluation Cases', icon: FileCheck },
    { to: '/cases/new', label: 'New Evaluation', icon: PlusCircle },
    { to: '/instruments', label: 'Instruments & Passport', icon: Scale },
    { to: '/review', label: 'Reviewer Workspace', icon: ShieldAlert, badge: role === 'reviewer' ? 'Priority' : undefined },
    { to: '/reports', label: 'Standardized Reports', icon: FileText },
  ];

  const secondaryItems = [
    { to: '/equipment', label: 'Calibration Traceability', icon: Sliders },
    { to: '/rules', label: 'OIML Rules Catalogue', icon: BookOpen },
    { to: '/audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">
          <div className="logo-icon">
            <Award size={22} className="text-white" />
          </div>
          <div>
            <h1>MetriX-LM</h1>
            <p>OIML R 76 Type-Evaluation</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Core Workflow</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon />
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="nav-section">Compliance & Audit</div>
        {secondaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="nav-section">Regulatory Basis</div>
        <div className="mx-1 rounded-sm bg-black/15 px-3 py-2.5 text-[11px] leading-relaxed text-white/45">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-white">
            <FlaskConical size={14} className="text-accent" />
            <span>OIML R 76-1:2006</span>
          </div>
          Deterministic MPE & Accuracy Class verification per Dept. of Consumer Affairs SIH PS 26035.
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="font-semibold text-white/75">SIH 2026 — PS 26035</div>
        <div className="mt-0.5 text-[10px] text-white/40">Digital NAWI Compliance Prototype</div>
      </div>
    </aside>
  );
}
