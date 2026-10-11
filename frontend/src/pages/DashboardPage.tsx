import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import type { DashboardData } from '../types';
import { formatVND, formatDate } from '../utils/format';
import { 
  Building2, 
  DollarSign, 
  Receipt, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  TrendingUp, 
  ArrowUpRight,
  Phone,
  Users,
  Mail,
  LifeBuoy,
  BellRing,
  FileText,
  Briefcase
} from 'lucide-react';

interface DashboardPageProps {
  onSelectCustomer: (id: number) => void;
  onNavigate: (tab: 'dashboard' | 'customers' | 'debts' | 'users') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectCustomer, onNavigate }) => {
  const { currentUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [currentUser]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'meeting': return <Users className="w-3.5 h-3.5 text-indigo-600" />;
      case 'email': return <Mail className="w-3.5 h-3.5 text-sky-600" />;
      case 'support': return <LifeBuoy className="w-3.5 h-3.5 text-emerald-600" />;
      case 'debt_reminder': return <BellRing className="w-3.5 h-3.5 text-rose-600" />;
      default: return <FileText className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const { stats, recent_activities, recent_customers, role_data } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2">
            <span>Chào mừng trở lại</span> • <span>{currentUser?.role_label}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Xin chào, {currentUser?.name}!</h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
            Theo dõi tình hình kinh doanh B2B, quản lý công nợ khách hàng và nhắc việc hôm nay.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onNavigate('users')}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Quản lý Nhân sự & Phân quyền</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('customers')}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>Xem khách hàng</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Khách hàng B2B</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total_customers}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-medium">Doanh nghiệp</span> trong danh bạ
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Doanh thu lũy kế</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{formatVND(stats.total_revenue)}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tổng giá trị hợp đồng</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng công nợ</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700">{formatVND(stats.total_debt)}</div>
          <div className="text-xs text-slate-500 mt-1">
            Khoản phải thu từ khách hàng
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nợ quá hạn</span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700">{stats.overdue_customers_count}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            Cần CS & Sales thu hồi gấp
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sắp đến hạn (7 ngày)</span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.due_soon_customers_count}</div>
          <div className="text-xs text-amber-600 font-medium mt-1">
            Cần gửi email nhắc nợ
          </div>
        </div>
      </div>

      {/* Role-Specific Highlights */}
      {currentUser?.department === 'sales' && role_data.my_customers && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-700" />
              Bảng mục tiêu Sales cá nhân của {currentUser.name}
            </h3>
            <span className="text-xs text-blue-700 font-medium">
              Pipeline: {role_data.my_pipeline_count} Lead • Đang hợp tác: {role_data.my_active_count} KH
            </span>
          </div>
          <p className="text-xs text-blue-800">
            Tổng công nợ trong danh sách khách hàng phụ trách: <span className="font-bold">{formatVND(role_data.my_debt)}</span>
          </p>
        </div>
      )}

      {/* CS View: Urgent Debt alerts */}
      {role_data.urgent_debts && role_data.urgent_debts.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Danh sách nợ quá hạn khẩn cấp (Ưu tiên đôn đốc)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('debts')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Xem tất cả sổ nợ →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {role_data.urgent_debts.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <button
                    onClick={() => onSelectCustomer(c.id)}
                    className="font-bold text-slate-900 hover:text-indigo-600 text-sm text-left block"
                  >
                    {c.company_name}
                  </button>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Đại diện: {c.contact_name} ({c.contact_phone || 'Chưa có SĐT'})
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-600 text-sm">{formatVND(c.current_debt)}</div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 mt-0.5">
                    Trễ {c.days_overdue} ngày
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recent Customers & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Customers */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Khách hàng doanh nghiệp mới cập nhật
            </h3>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Xem toàn bộ danh bạ →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Doanh nghiệp</th>
                  <th className="py-2.5 px-3">Phân loại</th>
                  <th className="py-2.5 px-3">Công nợ hiện tại</th>
                  <th className="py-2.5 px-3">Phụ trách</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent_customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="font-semibold text-slate-900 hover:text-indigo-600 block text-left"
                      >
                        {c.company_name}
                      </button>
                      <span className="text-xs text-slate-400">MST: {c.tax_code || 'Chưa cập nhật'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs border font-medium ${c.status_badge?.class || 'bg-slate-100 text-slate-700'}`}>
                        {c.status_label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{formatVND(c.current_debt)}</div>
                      {c.overdue && (
                        <span className="text-[11px] text-rose-600 font-medium">Quá hạn</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">
                      {c.assigned_user?.name || 'Chưa phân công'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Mở hồ sơ →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Activities Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Nhật ký chăm sóc & Trao đổi
          </h3>

          <div className="space-y-4">
            {recent_activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có nhật ký hoạt động nào.</p>
            ) : (
              recent_activities.map((act) => (
                <div key={act.id} className="flex gap-3 text-sm">
                  <div className="p-2 bg-slate-100 rounded-xl shrink-0 h-8 w-8 flex items-center justify-center">
                    {getActivityIcon(act.activity_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-xs truncate">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-indigo-600 font-medium">
                      {act.customer?.company_name}
                    </div>
                    {act.content && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {act.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{act.user?.name || 'Nhân sự'}</span>
                      <span>•</span>
                      <span>{formatDate(act.occurred_at || act.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
