
import { useMemo } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useFileSystem } from '../../store/useFileSystem';

interface Issue {
  line: number;
  message: string;
  severity: 'warning' | 'error';
}

export function LinterPanel() {
  const { activeFile, files } = useFileSystem();
  const code = activeFile ? files[activeFile]?.content || '' : '';

  const issues = useMemo(() => {
    if (!activeFile || !activeFile.endsWith('.sol')) return [];

    const lines = code.split('\n');
    const detectedIssues: Issue[] = [];

    lines.forEach((line, index) => {
       const lineNum = index + 1;
       const trimmed = line.trim();

       // Check 1: Use of tx.origin
       if (trimmed.includes('tx.origin')) {
           detectedIssues.push({
               line: lineNum,
               message: 'Avoid using tx.origin. Use msg.sender instead for authorization.',
               severity: 'warning'
           });
       }

       // Check 2: Locked Ether (no withdraw function) - Very basic heuristic
       // This is hard to check line-by-line, so we skip for now or do global regex later.

       // Check 3: Visibility specifiers
       // e.g. "function foo() {" without visibility
       if (trimmed.startsWith('function') && !trimmed.includes('public') && !trimmed.includes('private') && !trimmed.includes('internal') && !trimmed.includes('external') && !trimmed.includes('view') && !trimmed.includes('pure') && trimmed.includes('{')) {
            detectedIssues.push({
                line: lineNum,
                message: 'Function missing visibility specifier (default is public in older versions, error in newer).',
                severity: 'error'
            });
       }

       // Check 4: Pragma checks (very basic)
       if (trimmed.startsWith('pragma solidity') && trimmed.includes('^0.4')) {
           detectedIssues.push({
               line: lineNum,
               message: 'Ancient compiler version detected. Consider upgrading to ^0.8.0.',
               severity: 'warning'
           });
       }
    });

    return detectedIssues;

  }, [code, activeFile]);

  if (!activeFile) {
      return <div className="p-4 text-slate-500 text-sm">Open a Solidity file to lint.</div>;
  }

  return (
    <div className="h-full flex flex-col text-slate-300 bg-slate-900/50">
      <div className="p-3 border-b border-slate-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
         <AlertTriangle size={14} className="text-yellow-500"/>
         Static Analysis
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
          {issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                  <CheckCircle className="text-green-500" size={32} />
                  <span className="text-sm">No obvious issues found.</span>
              </div>
          ) : (
              issues.map((issue, idx) => (
                  <div key={idx} className={`p-3 rounded border text-sm ${issue.severity === 'error' ? 'bg-red-900/10 border-red-900/50' : 'bg-yellow-900/10 border-yellow-900/50'}`}>
                      <div className="flex items-start gap-2">
                          <span className="font-mono text-xs opacity-50 mt-0.5">L{issue.line}:</span>
                          <span className={issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}>
                              {issue.message}
                          </span>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
}
