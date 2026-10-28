// OneDesk — Cinematic Enterprise Authentication Screen
import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Building2,
  GitBranch,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function AuthScreen() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setTimeout(() => {
      // If username equals 'admin' (case-insensitive), log in as admin; otherwise log in as user
      const isAdministrator = username.trim().toLowerCase() === 'admin';
      login(isAdministrator ? 'admin' : 'user', username.trim());
      setLoading(false);
    }, 450);
  };

  const handlePresetLogin = (role: 'admin' | 'user') => {
    setLoading(true);
    setTimeout(() => {
      login(role);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="auth-container">
      {/* Background glow effects */}
      <div className="auth-glow-top-left" />
      <div className="auth-glow-bottom-right" />
      <div className="auth-grid-pattern" />

      <div className="auth-card">
        {/* Top Emblem & Brand */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={28} className="text-violet" />
          </div>
          <div className="auth-national-badge">
            <span className="dot-pulse" />
            AICTE Cross-Bureau Regulatory System
          </div>
          <h1 className="auth-title">OneDesk</h1>
          <p className="auth-tagline">
            One institution. One shared view. Coordinated action.
          </p>
        </div>

        {/* Institutional System Metadata Banner */}
        <div className="auth-meta-banner">
          <div className="meta-banner-item">
            <span className="meta-banner-label">Council</span>
            <span className="meta-banner-val">AICTE</span>
          </div>
          <div className="meta-banner-divider" />
          <div className="meta-banner-item">
            <span className="meta-banner-label">Platform</span>
            <span className="meta-banner-val">OneDesk</span>
          </div>
          <div className="meta-banner-divider" />
          <div className="meta-banner-item">
            <span className="meta-banner-label">Environment</span>
            <span className="meta-banner-val">Enterprise</span>
          </div>
        </div>

        {/* 1-Click Fast Demonstration Presets */}
        <div className="auth-quick-actions">
          <div className="quick-action-title">
            <Sparkles size={14} className="text-cyan" />
            1-Click Demo Access
          </div>

          <button
            type="button"
            className="preset-btn preset-admin"
            onClick={() => handlePresetLogin('admin')}
            disabled={loading}
          >
            <div className="preset-info">
              <div className="preset-name">Sign In as Admin</div>
              <div className="preset-desc">
                Dr. Rajesh Verma · Director General (All Bureaus, Full Triage, AI Overlap Overrule)
              </div>
            </div>
            <ArrowRight size={16} className="preset-arrow" />
          </button>

          <button
            type="button"
            className="preset-btn preset-user"
            onClick={() => handlePresetLogin('user')}
            disabled={loading}
          >
            <div className="preset-info">
              <div className="preset-name">Sign In as Bureau Officer</div>
              <div className="preset-desc">
                Shri Rajiv Nair · Senior Zonal Officer (Approvals, Notes, Lodge Grievances)
              </div>
            </div>
            <ArrowRight size={16} className="preset-arrow" />
          </button>
        </div>

        <div className="auth-divider">
          <span>or sign in with custom credentials</span>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username <span className="text-muted">(Enter 'admin' for Admin role, any other for Officer)</span>
            </label>
            <div className="input-icon-wrapper">
              <User size={16} className="input-icon" />
              <input
                id="username"
                className="form-control with-icon"
                type="text"
                placeholder="e.g. admin or your name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="text-muted">(Demo accepts any password)</span>
            </label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                className="form-control with-icon"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading || !username.trim()}>
            {loading ? (
              <>
                <div className="spinner spinner-sm" />
                Authenticating…
              </>
            ) : (
              <>
                Enter OneDesk Portal <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights Grid */}
        <div className="auth-features-grid">
          <div className="feature-item">
            <Building2 size={16} className="text-violet" />
            <span>360° Institutional View</span>
          </div>
          <div className="feature-item">
            <GitBranch size={16} className="text-cyan" />
            <span>Semantic Overlap AI</span>
          </div>
          <div className="feature-item">
            <Layers size={16} className="text-emerald" />
            <span>Cross-Bureau SLA Tracking</span>
          </div>
        </div>

        {/* Security disclaimer footer */}
        <div className="auth-footer-note">
          <ShieldAlert size={13} style={{ display: 'inline', marginRight: 4 }} />
          National Sandbox Prototype · All institution profiles and complaint records are fictional.
        </div>
      </div>
    </div>
  );
}
