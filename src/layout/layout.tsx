import { useState, useEffect } from 'react';
import { Header } from '@/layout/Header';
import { StudentProvider } from '@/contexts/StudentContext';
import { Sidebar } from '@/layout/Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import '../styles/App.css';

export function Layout() {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // Extract path without leading slash, defaulting to dashboard
    const path = location.pathname.split('/')[1] || 'dashboard';
    setCurrentPage(path);
  }, [location]);

  return (
    <StudentProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 w-full">
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
          <Header onMenuClick={() => setIsMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </StudentProvider>
  );
}