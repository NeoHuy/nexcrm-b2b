import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ShieldCheck, Briefcase, Headphones, Megaphone, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('admin@crm.saas');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: string) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Đăng nhập demo thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">NexCRM B2B</h1>
        <p className="mt-2 text-sm text-slate-400">
          Nền tảng Quản lý Khách hàng Doanh nghiệp & Theo dõi Công nợ B2B
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Demo Login Panel */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ⚡ Đăng nhập nhanh 1-Click (Kiểm tra Phân quyền)
              </h3>
              <span className="text-[11px] text-indigo-600 font-medium">Chọn một vai trò:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoClick('admin')}
                className="p-3 text-left rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition-all group"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Admin Quản trị</span>
                </div>
                <p className="text-xs text-rose-600/80 mt-1">Toàn quyền: Tạo, sửa, xóa KH, duyệt công nợ</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('sales')}
                className="p-3 text-left rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-blue-700">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Sales (Kinh doanh)</span>
                </div>
                <p className="text-xs text-blue-600/80 mt-1">Quản lý pipeline đàm phán, KH phụ trách</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('cs')}
                className="p-3 text-left rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-700">
                  <Headphones className="w-4 h-4 text-emerald-600" />
                  <span>CS (Chăm sóc & Thu nợ)</span>
                </div>
                <p className="text-xs text-emerald-600/80 mt-1">Theo dõi KH rủi ro, ghi nhận hóa đơn & thu tiền</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('marketing')}
                className="p-3 text-left rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 transition-all group"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-purple-700">
                  <Megaphone className="w-4 h-4 text-purple-600" />
                  <span>Marketing (Tiếp thị)</span>
                </div>
                <p className="text-xs text-purple-600/80 mt-1">Tạo Lead mới, xem tổng quan & báo cáo</p>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">Hoặc đăng nhập với tài khoản</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@crm.saas"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
