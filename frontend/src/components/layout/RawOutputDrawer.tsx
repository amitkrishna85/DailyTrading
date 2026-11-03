import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface RawOutputDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RawOutputDrawer: React.FC<RawOutputDrawerProps> = ({ isOpen, onClose }) => {
  const { rawLogs } = useUser();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentLog = rawLogs[selectedIdx] || rawLogs[0];

  const handleCopy = () => {
    if (currentLog?.stdout) {
      navigator.clipboard.writeText(currentLog.stdout);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed bottom-0 left-64 right-0 h-80 bg-slate-950 border-t border-border z-40 flex flex-col shadow-2xl">
      {/* Header Bar */}
      <div className="h-10 border-b border-border bg-slate-900 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-slate-200">
            Engine Output & Python Invocations
          </span>
          {currentLog?.command && (
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-md">
              $ {currentLog.command}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {currentLog?.stdout && (
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded text-xs flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Invocation History */}
        <div className="w-64 border-r border-border bg-slate-900/50 overflow-y-auto">
          {rawLogs.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 italic">No command invocations recorded yet.</div>
          ) : (
            rawLogs.map((log, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left px-3 py-2 border-b border-border/50 text-xs transition ${
                  selectedIdx === idx ? 'bg-primary/10 text-primary border-l-2 border-l-primary' : 'text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="font-semibold truncate">{log.title}</div>
                <div className="text-[10px] text-slate-500 font-mono">{log.timestamp}</div>
              </button>
            ))
          )}
        </div>

        {/* Right Column: Console Terminal Display */}
        <div className="flex-1 p-4 overflow-auto font-mono text-xs bg-slate-950 text-slate-300">
          {currentLog ? (
            <div>
              {currentLog.stderr && (
                <div className="mb-2 p-2 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300">
                  <div className="font-bold text-[10px] text-rose-400 uppercase tracking-wider mb-1">Standard Error:</div>
                  <pre className="whitespace-pre-wrap">{currentLog.stderr}</pre>
                </div>
              )}
              <pre className="whitespace-pre-wrap text-emerald-400/90 leading-relaxed">
                {currentLog.stdout || '(No standard output)'}
              </pre>
            </div>
          ) : (
            <div className="text-slate-600">Execute an action from any page to view live CLI stdout.</div>
          )}
        </div>
      </div>
    </div>
  );
};

