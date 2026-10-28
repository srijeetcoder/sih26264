// OneDesk — Sidebar Navigation Component
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Building2,
  GitBranch,
  BarChart3,
  History,
  Settings,
  X,
  Menu,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type ViewName =
  | 'overview'
  | 'register'
  | 'institutions'
  | 'case-detail'
  | 'institution-profile'
  | 'overlap-watch'
  | 'reports'
  | 'activity-log'
  | 'settings';

interface NavItem {
  view: ViewName;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  section?: string;
  badgeCount?: (casesCount: number, overlapsCount: number) => number | null;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'Core' },
  {
    view: 'register',
    label: 'Complaint Register',
    icon: FileText,
    badgeCount: (c) => c,
  },
  { view: 'institutions', label: 'Institutions', icon: Building2 },
  {
    view: 'overlap-watch',
    label: 'Potential Overlaps',
    icon: GitBranch,
    section: 'Intelligence',
    badgeCount: (_, o) => o,
  },
  { view: 'reports', label: 'Reports & Analytics', icon: BarChart3, section: 'Management' },
  { view: 'activity-log', label: 'Activity Log', icon: History },
  { view: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cases, overlaps } = useApp();

  const handleNav = (view: ViewName) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const pendingOverlapsCount = overlaps.filter(o => o.reviewDecision === 'pending').length;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Menu Toggle Button */}
      <button
        className="hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle navigation drawer"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-logo" onClick={() => handleNav('overview')}>
          <div className="sidebar-logo-icon">
            <ShieldCheck size={22} className="logo-shield" />
          </div>
          <div className="sidebar-logo-text">
            <div className="logo-title-row">
              <span className="logo-name">OneDesk</span>
              <span className="logo-version-tag">AICTE</span>
            </div>
            <span className="logo-sub">Cross-Bureau Monitor</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {(() => {
            let lastSection = '';
            return NAV_ITEMS.map(item => {
              const showSection = item.section && item.section !== lastSection;
              if (showSection) lastSection = item.section!;
              const Icon = item.icon;

              const isActive =
                currentView === item.view ||
                (currentView === 'case-detail' && item.view === 'register') ||
                (currentView === 'institution-profile' && item.view === 'institutions');

              const badgeNum = item.badgeCount
                ? item.view === 'overlap-watch'
                  ? pendingOverlapsCount
                  : item.view === 'register'
                  ? cases.length
                  : null
                : null;

              return (
                <div key={item.view} className="nav-item-wrapper">
                  {showSection && <div className="nav-section-label">{item.section}</div>}
                  <button
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNav(item.view)}
                  >
                    <div className="nav-item-left">
                      <Icon size={18} className="nav-icon" />
                      <span className="nav-label">{item.label}</span>
                    </div>

                    <div className="nav-item-right">
                      {badgeNum !== null && badgeNum > 0 && (
                        <span
                          className={`nav-count-badge ${
                            item.view === 'overlap-watch' ? 'badge-alert' : ''
                          }`}
                        >
                          {badgeNum}
                        </span>
                      )}
                      {isActive && <ChevronRight size={14} className="nav-active-arrow" />}
                    </div>
                  </button>
                </div>
              );
            });
          })()}
        </nav>

        {/* Institutional System Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div className="footer-team-row">
              <span className="footer-team-name">AICTE Council</span>
              <span className="footer-badge-tag">LIVE</span>
            </div>
            <div className="footer-theme">Regulatory Intelligence</div>
            <div className="footer-disclaimer">Cross-Bureau Unified Dashboard</div>
          </div>
        </div>
      </aside>
    </>
  );
}
