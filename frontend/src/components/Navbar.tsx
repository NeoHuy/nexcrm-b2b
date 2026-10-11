import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  LogOut, 
  ShieldCheck, 
  Briefcase, 
  Headphones, 
  Megaphone,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'customers' | 'debts' | 'users';
  setCurrentTab: (tab: 'dashboard' | 'customers' | 'debts' | 'users') => void;
  onSelectCustomer?: (id: number | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onSelectCustomer }) => {
  const { currentUser, demoLogin, logout } = useAuth();

  const handleNav = (tab: 'dashboard' | 'customers' | 'debts' | 'users') => {
    if (onSelectCustomer) onSelectCustomer(null);
    setCurrentTab(tab);
  };

  const getRoleIcon = (dept?: string, role?: string) => {
    if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5" />;
    if (dept === 'sales') return <Briefcase className="w-3.5 h-3.5" />;
    if (dept === 'cs') return <Headphones className="w-3.5 h-3.5" />;
    if (dept === 'marketing') return <Megaphone className="w-3.5 h-3.5" />;
    return <UserCheck className="w-3.5 h-3.5" />;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Demo Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400 flex items-center gap-1">
            ⚡ Đổi vai trò 1-Click:
          </span>
          <span className="text-slate-400 hidden sm:inline">Thử nghiệm Policy phân quyền ngay lập tức:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => demoLogin('admin')}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              currentUser?.role === 'admin'
                ? 'bg-rose-500 text-white font-bold ring-2 ring-rose-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3 h-3" /> Admin (Toàn quyền)
          </button>
          <button
            onClick={() => demoLogin('sales')}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              currentUser?.role !== 'admin' && currentUser?.department === 'sales'
                ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-3 h-3" /> Sales (Kinh doanh)
          </button>
          <button
            onClick={() => demoLogin('cs')}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              currentUser?.role !== 'admin' && currentUser?.department === 'cs'
                ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Headphones className="w-3 h-3" /> CS (Thu nợ & Chăm sóc)
          </button>
          <button
            onClick={() => demoLogin('marketing')}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              currentUser?.role !== 'admin' && currentUser?.department === 'marketing'
                ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Megaphone className="w-3 h-3" /> Mkt (Chỉ xem Lead)
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div 
              onClick={() => handleNav('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                  NexCRM <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold uppercase">B2B SaaS</span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium -mt-1 leading-none">Quản lý Khách hàng & Công nợ</p>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              <button
                onClick={() => handleNav('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Tổng quan
              </button>

              <button
                onClick={() => handleNav('customers')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'customers'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Khách hàng B2B
              </button>

              <button
                onClick={() => handleNav('debts')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'debts'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Sổ Công nợ
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleNav('users')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    currentTab === 'users'
                      ? 'bg-rose-50 text-rose-700 font-bold ring-1 ring-rose-200'
                      : 'text-rose-700 hover:bg-rose-50/70'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Nhân sự & Phân quyền</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                    Admin
                  </span>
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-slate-900">{currentUser.name}</div>
                  <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                    {getRoleIcon(currentUser.department, currentUser.role)}
                    <span>{currentUser.role_label}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
