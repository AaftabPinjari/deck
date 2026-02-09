import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useDocumentStore } from './store/useDocumentStore';
import { useSettingsStore } from './store/useSettingsStore';
import { auth } from './services/auth';
import { Breadcrumbs } from './components/Breadcrumbs';
import { SearchCommand } from './components/SearchCommand';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
//hiyad99739@icubik.com -- admin email id
// Lazy load heavy components
const Editor = lazy(() => import('./components/Editor/Editor').then(m => ({ default: m.Editor })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./components/Auth/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./components/Auth/Signup').then(m => ({ default: m.Signup })));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
        <LandingPage />
      </Suspense>
    );
  }

  return <>{children}</>;
};

function App() {
  const { rootDocumentIds, fetchDocuments, reset } = useDocumentStore();
  const { theme } = useSettingsStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Handle auth state changes and data fetching
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchDocuments();
      } else {
        reset(); // Clear store on logout
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDocuments, reset]);

  return (
    <BrowserRouter>
      <SearchCommand />
      <Routes>
        <Route path="/login" element={<Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}><Login /></Suspense>} />
        <Route path="/signup" element={<Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}><Signup /></Suspense>} />


        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={
            rootDocumentIds.length > 0
              ? <Navigate to={`/${rootDocumentIds[0]}`} replace />
              : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <div className="text-4xl">👋</div>
                  </div>
                  <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Welcome to Notion Clone</h1>
                  <p className="text-neutral-500 max-w-md mb-8">
                    The all-in-one workspace for your notes, tasks, and more.
                    Get started by creating a new page in the sidebar.
                  </p>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400">
                    <p className="font-semibold mb-2">Try these features:</p>
                    <ul className="list-disc text-left pl-8 space-y-1">
                      <li>Type <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded">/</code> for commands</li>
                      <li>Use <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded">#</code> for headings</li>
                      <li>Drag blocks to reorder</li>
                    </ul>
                  </div>
                </div>
              )
          } />
          <Route path=":documentId" element={
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
              <Breadcrumbs />
              <Editor />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
