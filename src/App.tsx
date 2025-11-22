import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { CodeEditor } from './components/editor/CodeEditor';
import { useFileSystem } from './store/useFileSystem';

function App() {
  const { initialize, isLoading } = useFileSystem();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-blue-500">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-sm tracking-wider">INITIALIZING ENVIRONMENT...</span>
            </div>
        </div>
    );
  }

  return (
    <MainLayout>
      <CodeEditor />
    </MainLayout>
  );
}

export default App;
