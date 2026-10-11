import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { DebtsPage } from './pages/DebtsPage';
import { UsersPage } from './pages/UsersPage';

const MainLayout: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'customers' | 'debts' | 'users'>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && currentTab === 'users') {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          <span className="text-xs text-slate-400">Đang khởi tạo NexCRM B2B...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onSelectCustomer={setSelectedCustomerId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedCustomerId !== null ? (
          <CustomerDetailPage
            customerId={selectedCustomerId}
            onBack={() => setSelectedCustomerId(null)}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardPage
                onSelectCustomer={(id) => setSelectedCustomerId(id)}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}
            {currentTab === 'customers' && (
              <CustomersPage
                onSelectCustomer={(id) => setSelectedCustomerId(id)}
              />
            )}
            {currentTab === 'debts' && (
              <DebtsPage
                onSelectCustomer={(id) => setSelectedCustomerId(id)}
              />
            )}
            {currentTab === 'users' && currentUser.role === 'admin' && (
              <UsersPage />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        NexCRM B2B SaaS • Ruby on Rails 8 API + React 19 Vite • Kiến trúc Micro-Frontend hiện đại
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
