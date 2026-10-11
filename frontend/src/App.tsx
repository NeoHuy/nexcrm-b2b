import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { DebtsPage } from './pages/DebtsPage';
import { UsersPage } from './pages/UsersPage';

import { Lock, ShieldCheck, LogOut, AlertTriangle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, loading, demoLogin, logout } = useAuth();
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'customers' | 'debts' | 'users'>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin' && currentTab === 'users') {
      setCurrentTab('dashboard');
    } else if (
      currentUser.role !== 'admin' &&
      currentTab === 'debts' &&
      currentUser.permissions?.can_view_debt === false
    ) {
      setCurrentTab('dashboard');
    } else if (
      currentUser.role !== 'admin' &&
      currentTab === 'customers' &&
      currentUser.permissions?.can_view_customer === false
    ) {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          <span className="text-xs text-slate-400">{t('app.loading')}</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const hasAnyPermission =
    currentUser.role === 'admin' ||
    (currentUser.permissions?.has_any_permission !== false &&
      currentUser.policy_code !== 'no_access');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onSelectCustomer={setSelectedCustomerId}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!hasAnyPermission ? (
          <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border-2 border-rose-200 shadow-lg overflow-hidden">
            <div className="bg-rose-600 px-6 py-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">
                  Tài khoản chưa được cấp quyền truy xuất (No Policy Assigned)
                </h2>
                <p className="text-xs text-rose-100">
                  Role: {currentUser.role_label} • Trạng thái Policy: {currentUser.policy_label || 'Chưa cấp quyền (No Access)'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <div className="font-bold text-sm">
                    Bạn hiện không thể sử dụng bất kỳ tính năng nào trên hệ thống
                  </div>
                  <p>
                    Tài khoản <strong>{currentUser.name}</strong> (<code>{currentUser.email}</code>) thuộc nhóm{' '}
                    <strong>Role: User</strong> nhưng chưa được <strong>Admin</strong> thiết lập quyền trong{' '}
                    <strong>Policy</strong> (tất cả quyền Khách hàng B2B, Sổ Công nợ, Nhật ký tương tác đều đang khóa).
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="font-bold text-slate-800">Trạng thái Policy hiện tại của tài khoản:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center gap-1.5">
                    <span>✕</span> Xem/Tạo KH B2B
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center gap-1.5">
                    <span>✕</span> Chỉnh sửa/Xóa KH
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center gap-1.5">
                    <span>✕</span> Sổ Công nợ & HĐ
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center gap-1.5">
                    <span>✕</span> Nhật ký CSKH
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={logout}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất tài khoản
                </button>

                <button
                  onClick={async () => {
                    await demoLogin('admin');
                    setCurrentTab('users');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Chuyển sang Admin để cấp quyền Policy cho {currentUser.name}
                </button>
              </div>
            </div>
          </div>
        ) : selectedCustomerId !== null ? (
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
        {t('app.footer')}
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
