import React from 'react';
import { useUser } from '../../context/UserContext';
import {
  LayoutDashboard,
  Radar,
  Newspaper,
  GitBranch,
  BellRing,
  LineChart,
  Settings,
  Terminal,
  BookOpen,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleTerminal: () => void;
  hasLogs: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onToggleTerminal,
  hasLogs
}) => {
  const { userRole } = useUser();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scanner & Setups', icon: Radar },
    { id: 'news', label: 'News & Catalysts', icon: Newspaper },
    { id: 'pipeline', label: 'Decision Pipeline', icon: GitBranch, badge: 'Workflow' },
    { id: 'alerts', label: 'Live Alerts', icon: BellRing },
    { id: 'analyst', label: 'Earnings Analyst', icon: LineChart },
    { id: 'how-to', label: 'How To Guide', icon: BookOpen, badge: 'Docs' },
    { id: 'tips', label: 'Trading Tips', icon: Lightbulb },
    { id: 'settings', label: 'Trader Config', icon: Settings },
  ];

  if (userRole === 'admin') {
    menuItems.push({
      id: 'admin',
      label: 'Admin Portal',
      icon: ShieldCheck,
      badge: 'Admin'
    });
  }

  return (
    <aside className="w-64 border-r border-border bg-card/40 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)]">
      {/* Navigation List */}
      <nav className="p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? item.id === 'admin'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm'
                    : 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? (item.id === 'admin' ? 'text-rose-400' : 'text-primary') : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  item.badge === 'Admin'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Terminal / Raw Output Drawer Trigger */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onToggleTerminal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-border text-xs text-slate-300 hover:text-white hover:border-slate-600 transition"
        >
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Raw Output & Logs</span>
          </div>
          {hasLogs && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>
    </aside>
  );
};
