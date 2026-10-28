// OneDesk — Enterprise Top Navigation Bar
import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  PlusCircle,
  RotateCcw,
  Check,
  ChevronDown,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ViewName } from './Sidebar';

interface TopbarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName, payload?: unknown) => void;
  onOpenLodgeModal: () => void;
}

export function Topbar({ currentView, onNavigate, onOpenLodgeModal }: TopbarProps) {
  const {
    cases,
    currentUser,
    switchRole,
    logout,
    resetDemoData,
    notifications,
    markAllNotificationsRead,
    dismissNotification,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifsDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const viewTitles: Record<ViewName, string> = {
    overview: 'Command Center Overview',
    register: 'Central Complaint Register',
    institutions: 'Institution 360° Profiles',
    'case-detail': 'Case Dossier & Audit Log',
    'institution-profile': 'Consolidated Institutional Profile',
    'overlap-watch': 'Cross-Bureau Overlap Intelligence',
    reports: 'Reports & Export Analytics',
    'activity-log': 'System Audit & Activity Trail',
    settings: 'Settings & AI Engine Setup',
  };

  // Live search matches
  const matchedCases = searchQuery.trim()
    ? cases
        .filter(
          c =>
            c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.bureau.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleResetData = () => {
    resetDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <header className="topbar">
      {/* Left: Mobile spacer + Breadcrumbs */}
      <div className="topbar-left">
        <div style={{ width: 36 }} className="hamburger-spacer" />
        <div className="topbar-breadcrumb">
          <span className="breadcrumb-brand" onClick={() => onNavigate('overview')}>
            OneDesk
          </span>
          <span className="breadcrumb-sep">/</span>
          <span className="topbar-title">{viewTitles[currentView] || 'Dashboard'}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="topbar-center" ref={searchRef}>
        <div className="global-search-wrapper">
          <Search size={15} className="global-search-icon" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search cases, colleges, bureaus, or IDs (e.g. CASE-001, Ramanujan)..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchQuery.trim() && (
          <div className="search-dropdown-menu">
            <div className="search-dropdown-header">
              <span>Matching Records ({matchedCases.length})</span>
            </div>
            {matchedCases.length === 0 ? (
              <div className="search-no-results">No records match "{searchQuery}"</div>
            ) : (
              <div className="search-results-list">
                {matchedCases.map(item => (
                  <div
                    key={item.id}
                    className="search-result-row"
                    onClick={() => {
                      onNavigate('case-detail', item.id);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="search-row-icon">
                      <FileText size={14} className="text-violet" />
                    </div>
                    <div className="search-row-details">
                      <div className="search-row-title">
                        <span className="case-id-highlight">{item.id}</span>
                        <span className="case-inst-name">{item.institutionName}</span>
                      </div>
                      <div className="search-row-sub">
                        {item.bureau} · {item.category} · Priority: {item.priority}
                      </div>
                    </div>
                    <ExternalLink size={13} className="search-row-arrow" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Notifications, Role & User Menu */}
      <div className="topbar-right">
        {/* + Lodge Complaint Button */}
        <button
          className="btn btn-primary btn-sm topbar-action-btn"
          onClick={onOpenLodgeModal}
          id="topbar-lodge-complaint-btn"
          title="Lodge New Regulatory Complaint (Mail Compose)"
        >
          <PlusCircle size={15} />
          <span>Lodge Complaint</span>
        </button>

        {/* Demo Indicator with Reset */}
        <button
          className={`demo-data-pill ${resetSuccess ? 'restored' : ''}`}
          onClick={handleResetData}
          title="Click to reset all records to standard baseline state"
        >
          {resetSuccess ? (
            <>
              <Check size={12} /> Restored
            </>
          ) : (
            <>
              <RotateCcw size={12} /> Reset Data
            </>
          )}
        </button>

        {/* Reporting Period */}
        <div className="reporting-period-tag" title="AICTE Regulatory Window">
          AY 2026-27
        </div>

        {/* Notifications Popover */}
        <div className="topbar-notifs-wrapper" ref={notifRef}>
          <button
            className={`icon-button notif-bell-btn ${unreadNotifs > 0 ? 'has-unread' : ''}`}
            onClick={() => setShowNotifsDropdown(prev => !prev)}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadNotifs > 0 && <span className="notif-badge-count">{unreadNotifs}</span>}
          </button>

          {showNotifsDropdown && (
            <div className="notifications-popover">
              <div className="notif-header">
                <div>
                  <span className="notif-title">System Notifications</span>
                  <span className="notif-counter">{notifications.length} alerts</span>
                </div>
                {unreadNotifs > 0 && (
                  <button className="mark-read-btn" onClick={markAllNotificationsRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No active notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notif-card ${n.read ? 'read' : 'unread'} ${n.type || 'info'}`}>
                      <div className="notif-card-header">
                        <span className="notif-card-title">{n.title}</span>
                        <span className="notif-card-time">{n.time}</span>
                      </div>
                      <p className="notif-card-desc">{n.desc}</p>
                      <div className="notif-card-actions">
                        {n.linkCaseId && (
                          <button
                            className="btn-text-link"
                            onClick={() => {
                              onNavigate('case-detail', n.linkCaseId);
                              setShowNotifsDropdown(false);
                            }}
                          >
                            Inspect Case →
                          </button>
                        )}
                        <button
                          className="btn-dismiss"
                          onClick={() => dismissNotification(n.id)}
                          aria-label="Dismiss alert"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher Menu */}
        <div className="topbar-user-menu" ref={userRef}>
          <button
            className="user-profile-button"
            onClick={() => setShowUserDropdown(prev => !prev)}
            aria-label="User menu"
          >
            <div className="user-avatar-circle">{currentUser?.avatar || 'AI'}</div>
            <div className="user-text-info">
              <span className="user-display-name">{currentUser?.name || 'Administrator'}</span>
              <span className={`user-role-badge ${currentUser?.role || 'admin'}`}>
                {currentUser?.role === 'admin' ? 'HQ Admin' : 'Zonal Officer'}
              </span>
            </div>
            <ChevronDown size={14} className="user-chevron" />
          </button>

          {showUserDropdown && (
            <div className="user-dropdown-popover">
              <div className="user-dropdown-profile-header">
                <div className="dropdown-avatar">{currentUser?.avatar || 'AI'}</div>
                <div className="dropdown-user-meta">
                  <div className="dropdown-user-name">{currentUser?.name}</div>
                  <div className="dropdown-user-title">{currentUser?.title}</div>
                  <div className="dropdown-user-bureau">{currentUser?.bureau}</div>
                </div>
              </div>

              <div className="user-dropdown-divider" />

              {/* 1-Click Role Switch */}
              <button className="user-dropdown-item role-switch-item" onClick={switchRole}>
                <div className="role-switch-icon">⇄</div>
                <div style={{ textAlign: 'left' }}>
                  <div className="role-switch-label">Switch Persona</div>
                  <div className="role-switch-sub">
                    Toggle to {currentUser?.role === 'admin' ? 'Bureau Officer (User)' : 'Director General (Admin)'}
                  </div>
                </div>
              </button>

              <div className="user-dropdown-divider" />

              <button
                className="user-dropdown-item"
                onClick={() => {
                  onNavigate('settings');
                  setShowUserDropdown(false);
                }}
              >
                Settings & AI Engine Setup
              </button>

              <button
                className="user-dropdown-item text-danger"
                onClick={() => {
                  logout();
                  setShowUserDropdown(false);
                }}
              >
                Sign Out / Switch User
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
