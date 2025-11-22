import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { useFileSystem } from '../../store/useFileSystem';
import { useCompiler } from '../../store/useCompiler';

interface Issue {
    id: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    line?: number;
}

export function StaticAnalysisPlugin() {
    const { activeFile, files } = useFileSystem();
    const { isCompiling } = useCompiler();
    const [issues, setIssues] = React.useState<Issue[]>([]);
    const [lastRun, setLastRun] = React.useState<number | null>(null);

    const runAnalysis = React.useCallback(() => {
        if (!activeFile || !files[activeFile]) return;

        const content = files[activeFile].content;
        const foundIssues: Issue[] = [];

        // Check 1: tx.origin
        if (content.includes('tx.origin')) {
            foundIssues.push({
                id: 'tx-origin',
                title: 'Avoid tx.origin',
                description: 'Use msg.sender instead of tx.origin for authorization to prevent phishing attacks.',
                severity: 'high'
            });
        }

        // Check 2: selfdestruct
        if (content.includes('selfdestruct') || content.includes('suicide')) {
            foundIssues.push({
                id: 'selfdestruct',
                title: 'Selfdestruct Usage',
                description: 'The selfdestruct opcode is deprecated and may be removed in future EVM versions.',
                severity: 'medium'
            });
        }

        // Check 3: Check-Effects-Interactions pattern (Naive check for .call after state change)
        // This is hard to do with regex accurately, but we can warn about low-level calls.
        if (content.match(/\.call\{value:/)) {
            foundIssues.push({
                id: 'low-level-call',
                title: 'Low-level Call',
                description: 'Ensure you are following the Check-Effects-Interactions pattern when making external calls.',
                severity: 'medium'
            });
        }

        // Check 4: Visibility
        // Warn if state variables are public (informational) - actually public state vars are fine usually,
        // maybe warn if explicit visibility is missing on functions (solidity < 0.5 issue, less relevant now but good practice)

        // Check 5: Pragma
        if (!content.includes('pragma solidity')) {
             foundIssues.push({
                id: 'no-pragma',
                title: 'Missing Pragma',
                description: 'Always define the compiler version with pragma solidity.',
                severity: 'high'
            });
        }

        setIssues(foundIssues);
        setLastRun(Date.now());
    }, [activeFile, files]);

    return (
        <div className="h-full flex flex-col text-slate-300 p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} />
                    Static Analysis
                </h2>
                <button
                    onClick={runAnalysis}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors"
                >
                    Run
                </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
                Scanning {activeFile ? activeFile.split('/').pop() : 'current file'} for common vulnerabilities.
            </p>

            <div className="flex-1 overflow-auto space-y-3">
                {isCompiling ? (
                    <div className="text-center text-slate-500 text-xs py-4">
                        Waiting for compilation...
                    </div>
                ) : issues.length > 0 ? (
                    issues.map((issue, idx) => (
                        <div key={idx} className={`p-3 rounded border text-xs ${
                            issue.severity === 'high' ? 'bg-red-900/10 border-red-900/30' :
                            issue.severity === 'medium' ? 'bg-orange-900/10 border-orange-900/30' :
                            'bg-blue-900/10 border-blue-900/30'
                        }`}>
                            <div className="flex items-center gap-2 mb-1 font-bold">
                                {issue.severity === 'high' ? <AlertTriangle size={14} className="text-red-400" /> :
                                 issue.severity === 'medium' ? <AlertTriangle size={14} className="text-orange-400" /> :
                                 <ShieldAlert size={14} className="text-blue-400" />}
                                <span className={
                                    issue.severity === 'high' ? 'text-red-400' :
                                    issue.severity === 'medium' ? 'text-orange-400' : 'text-blue-400'
                                }>{issue.title}</span>
                            </div>
                            <p className="text-slate-400">{issue.description}</p>
                        </div>
                    ))
                ) : lastRun ? (
                    <div className="flex flex-col items-center justify-center text-green-500 py-8">
                        <CheckCircle size={32} className="mb-2 opacity-50" />
                        <span className="text-xs">No issues found</span>
                    </div>
                ) : (
                    <div className="text-center text-slate-600 text-xs italic py-8">
                        Click Run to analyze
                    </div>
                )}
            </div>
        </div>
    );
}
