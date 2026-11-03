import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserConfig, MarketStatus } from '../types';

interface RawLog {
  title: string;
  command?: string;
  stdout?: string;
  stderr?: string;
  timestamp: string;
}

interface UserContextType {
  users: any[];
  activeUser: string;
  userRole: 'admin' | 'trader';
  isAuthenticated: boolean;
  isOnboarded: boolean;
  config: UserConfig | null;
  loading: boolean;
  marketStatus: MarketStatus | null;
  pipelineSymbol: string;
  rawLogs: RawLog[];
  setPipelineSymbol: (sym: string) => void;
  switchUser: (name: string) => Promise<void>;
  createUser: (name: string, role?: string, password?: string) => Promise<void>;
  login: (username: string, password?: string, role?: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: (data: { budget: number; maxLoss: number; maxDailyLoss: number; paper: boolean }) => Promise<boolean>;
  updateConfig: (cfg: UserConfig) => Promise<boolean>;
  resetConfig: () => Promise<boolean>;
  addRawLog: (log: Omit<RawLog, 'timestamp'>) => void;
  refreshData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<string>(() => localStorage.getItem('dt_user') || 'default');
  const [userRole, setUserRole] = useState<'admin' | 'trader'>(() => (localStorage.getItem('dt_role') as any) || 'trader');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('dt_user'));
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [pipelineSymbol, setPipelineSymbol] = useState<string>('RELIANCE.NS');
  const [rawLogs, setRawLogs] = useState<RawLog[]>([]);

  const addRawLog = (log: Omit<RawLog, 'timestamp'>) => {
    setRawLogs(prev => [
      { ...log, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 20)
    ]);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        // data can be list of names or objects
        const formatted = Array.isArray(data)
          ? data.map(item => (typeof item === 'string' ? { username: item, role: item === 'admin' ? 'admin' : 'trader' } : item))
          : [];
        setUsers(formatted);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchConfig = async (user: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/config?user=${encodeURIComponent(user)}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
      const meRes = await fetch(`/api/auth/me?user=${encodeURIComponent(user)}`);
      if (meRes.ok) {
        const me = await meRes.json();
        setIsOnboarded(me.is_onboarded !== false);
        setUserRole(me.role || 'trader');
      }
    } catch (e) {
      console.error('Error fetching config:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketStatus = async () => {
    try {
      const res = await fetch('/api/market/status');
      if (res.ok) {
        const data = await res.json();
        setMarketStatus(data);
      }
    } catch (e) {
      console.error('Error fetching market status:', e);
    }
  };

  const switchUser = async (user: string) => {
    setActiveUser(user);
    localStorage.setItem('dt_user', user);
    await fetchConfig(user);
  };

  const login = async (username: string, password = '', role = 'trader'): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setActiveUser(u.username);
        setUserRole(u.role);
        setIsAuthenticated(true);
        setIsOnboarded(u.is_onboarded !== false);
        localStorage.setItem('dt_user', u.username);
        localStorage.setItem('dt_role', u.role);
        await fetchConfig(u.username);
        await fetchUsers();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('dt_user');
    localStorage.removeItem('dt_role');
    setIsAuthenticated(false);
    setActiveUser('');
  };

  const completeOnboarding = async (data: { budget: number; maxLoss: number; maxDailyLoss: number; paper: boolean }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: activeUser,
          budget: data.budget,
          max_loss_per_trade: data.maxLoss,
          max_daily_loss: data.maxDailyLoss,
          paper: data.paper
        })
      });
      if (res.ok) {
        setIsOnboarded(true);
        await fetchConfig(activeUser);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const createUser = async (name: string, role = 'trader', password = '') => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchUsers();
        await switchUser(data.username);
      }
    } catch (e) {
      console.error('Error creating user:', e);
    }
  };

  const updateConfig = async (newCfg: UserConfig): Promise<boolean> => {
    try {
      const res = await fetch(`/api/config?user=${encodeURIComponent(activeUser)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newCfg })
      });
      if (res.ok) {
        setConfig(newCfg);
        return true;
      }
    } catch (e) {
      console.error('Error updating config:', e);
    }
    return false;
  };

  const resetConfig = async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/config/reset?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        return true;
      }
    } catch (e) {
      console.error('Error resetting config:', e);
    }
    return false;
  };

  const refreshData = async () => {
    await Promise.all([fetchUsers(), fetchConfig(activeUser || 'default'), fetchMarketStatus()]);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(fetchMarketStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <UserContext.Provider
      value={{
        users,
        activeUser,
        userRole,
        isAuthenticated,
        isOnboarded,
        config,
        loading,
        marketStatus,
        pipelineSymbol,
        rawLogs,
        setPipelineSymbol,
        switchUser,
        createUser,
        login,
        logout,
        completeOnboarding,
        updateConfig,
        resetConfig,
        addRawLog,
        refreshData
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
