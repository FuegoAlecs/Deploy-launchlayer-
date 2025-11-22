import React from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useFileSystem } from '../../store/useFileSystem';

export function CodeEditor() {
  const { activeFile, files, updateFileContent } = useFileSystem();
  const monaco = useMonaco();

  const file = activeFile ? files[activeFile] : null;

  React.useEffect(() => {
    if (monaco) {
      // Define the custom theme
      monaco.editor.defineTheme('remix-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff79c6' },
          { token: 'string', foreground: 'f1fa8c' },
          { token: 'number', foreground: 'bd93f9' },
          { token: 'type', foreground: '8be9fd' },
        ],
        colors: {
          'editor.background': '#0f172a', // slate-950
          'editor.foreground': '#f8fafc', // slate-50
          'editor.lineHighlightBackground': '#1e293b', // slate-800
          'editorCursor.foreground': '#3b82f6', // blue-500
          'editorWhitespace.foreground': '#334155',
          'editor.selectionBackground': '#1e40af40',
          'editor.inactiveSelectionBackground': '#1e40af20',
        }
      });
      monaco.editor.setTheme('remix-dark');
    }
  }, [monaco]);

  if (!file) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950/50">
            <div className="w-16 h-16 mb-4 rounded-xl bg-slate-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <p className="font-medium">No file selected</p>
            <p className="text-sm opacity-60 mt-1">Select a file from the explorer to start coding</p>
        </div>
    );
  }

  return (
    <div className="h-full w-full">
        {/* Tab Header */}
        <div className="flex bg-slate-950 border-b border-slate-800 overflow-x-auto scrollbar-hide">
            <div className="px-4 py-2 bg-slate-900 border-t-2 border-blue-500 text-slate-200 text-sm font-medium min-w-[120px] flex items-center justify-between group">
                <span className="truncate">{file.path.split('/').pop()}</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>

        <Editor
            height="calc(100% - 37px)" // Subtract header height
            language="sol"
            // Monaco doesn't have built-in 'solidity' language by default without config,
            // but 'sol' often works if extensions are loaded, or we fallback to 'javascript' for MVP syntax
            // For better experience we should register the language. I'll use 'javascript' as placeholder if sol fails visually,
            // but let's try to register it properly in next iteration or rely on simple highlighting.
            // Actually, let's use a basic setup.
            path={file.path}
            value={file.content}
            onChange={(value) => updateFileContent(file.path, value || '')}
            theme="remix-dark"
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
            }}
            onMount={(editor, monaco) => {
                // Register Solidity Language (Basic)
                if (!monaco.languages.getLanguages().some(l => l.id === 'solidity')) {
                    monaco.languages.register({ id: 'solidity' });
                    monaco.languages.setMonarchTokensProvider('solidity', {
                        keywords: [
                            'pragma', 'solidity', 'contract', 'library', 'interface', 'function', 'modifier', 'event',
                            'struct', 'enum', 'mapping', 'address', 'uint', 'public', 'external', 'private', 'internal',
                            'view', 'pure', 'returns', 'memory', 'storage', 'calldata', 'if', 'else', 'for', 'while',
                            'do', 'return', 'emit', 'try', 'catch', 'revert', 'require', 'assert'
                        ],
                        operators: [
                            '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%', '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=', '%=', '<<=', '>>=', '>>>='
                        ],
                        tokenizer: {
                            root: [
                                [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
                                { include: '@whitespace' },
                                [/[{}()\[\]]/, '@brackets'],
                                [/[0-9]+/, 'number'],
                                [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
                                [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],
                            ],
                            string: [
                                [/[^\\"]+/,  'string'],
                                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' } ]
                            ],
                            whitespace: [
                                [/[ \t\r\n]+/, 'white'],
                                [/\/\/.*$/,    'comment'],
                                [/\/\*/,       'comment', '@comment' ],
                            ],
                            comment: [
                                [/[^\/*]+/, 'comment' ],
                                [/\*\//,    'comment', '@pop'  ],
                                [/[\/*]/,   'comment' ]
                            ],
                        }
                    });
                }
                const model = editor.getModel();
                if (model) monaco.editor.setModelLanguage(model, 'solidity');
            }}
        />
    </div>
  );
}
