import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { Shield, User, Lock, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, users } = useUser();
  const [activeTab, setActiveTab] = useState<'trader' | 'admin'>('trader');
  const [username, setUsername] = useState<string>('amit_krishna');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const success = await login(
      activeTab === 'admin' ? 'admin' : username.trim(),
      password,
      activeTab
    );

    setLoading(false);
    if (success) {
      onClose();
    } else {
      setErrorMsg(activeTab === 'admin' ? 'Invalid admin password (default is: admin)' : 'Login failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Account Authentication</h2>
            <p className="text-xs text-slate-400">Select your trader profile or access admin controls.</p>
          </div>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('trader');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'trader'
                ? 'bg-primary text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Trader Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'admin'
                ? 'bg-rose-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'trader' ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Trader Username / Profile
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. amit, rahul, scalp_user)"
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary font-mono"
                required
                autoFocus
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Entering a new username creates an isolated profile and launches onboarding.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Admin Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password (default: admin)"
                  className="w-full bg-slate-950 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Admin privileges allow viewing all trader accounts, global audit logs, and system metrics.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-lg font-bold text-xs transition ${
                activeTab === 'admin'
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-primary text-slate-950 hover:bg-sky-400'
              }`}
            >
              {loading ? 'Authenticating...' : activeTab === 'admin' ? 'Enter Admin Portal' : 'Login as Trader'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

