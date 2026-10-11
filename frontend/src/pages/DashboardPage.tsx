import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t, translateRole, translateStatus } = useLanguage();
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
            <span>{t('dashboard.welcome_back')}</span> • <span>{translateRole(currentUser?.role, currentUser?.department, currentUser?.role_label)}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('dashboard.hello', { name: currentUser?.name || '' })}
          </h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
            {t('dashboard.banner_desc')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onNavigate('users')}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{t('dashboard.manage_users_btn')}</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('customers')}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>{t('dashboard.view_customers_btn')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.kpi_customers')}</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total_customers}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-medium">{t('dashboard.kpi_customers_sub1')}</span> {t('dashboard.kpi_customers_sub2')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.kpi_revenue')}</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{formatVND(stats.total_revenue)}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('dashboard.kpi_revenue_sub')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.kpi_total_debt')}</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700">{formatVND(stats.total_debt)}</div>
          <div className="text-xs text-slate-500 mt-1">
            {t('dashboard.kpi_total_debt_sub')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.kpi_overdue')}</span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700">{stats.overdue_customers_count}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            {t('dashboard.kpi_overdue_sub')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.kpi_due_soon')}</span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.due_soon_customers_count}</div>
          <div className="text-xs text-amber-600 font-medium mt-1">
            {t('dashboard.kpi_due_soon_sub')}
          </div>
        </div>
      </div>

      {/* Role-Specific Highlights */}
      {currentUser?.department === 'sales' && role_data.my_customers && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-700" />
              {t('dashboard.sales_target_title', { name: currentUser.name })}
            </h3>
            <span className="text-xs text-blue-700 font-medium">
              {t('dashboard.sales_pipeline', {
                pipeline: role_data.my_pipeline_count || 0,
                active: role_data.my_active_count || 0,
              })}
            </span>
          </div>
          <p className="text-xs text-blue-800">
            {t('dashboard.sales_debt_summary')} <span className="font-bold">{formatVND(role_data.my_debt)}</span>
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
                {t('dashboard.urgent_debts_title')}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('debts')}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              {t('dashboard.view_all_debts')}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {role_data.urgent_debts.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <button
                    onClick={() => onSelectCustomer(c.id)}
                    className="font-bold text-slate-900 hover:text-indigo-600 text-sm text-left block cursor-pointer"
                  >
                    {c.company_name}
                  </button>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {t('dashboard.rep')}: {c.contact_name} ({c.contact_phone || t('dashboard.no_phone')})
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-600 text-sm">{formatVND(c.current_debt)}</div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 mt-0.5">
                    {t('dashboard.days_overdue', { days: c.days_overdue })}
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
              {t('dashboard.recent_customers_title')}
            </h3>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              {t('dashboard.view_all_customers')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">{t('dashboard.col_company')}</th>
                  <th className="py-2.5 px-3">{t('dashboard.col_status')}</th>
                  <th className="py-2.5 px-3">{t('dashboard.col_current_debt')}</th>
                  <th className="py-2.5 px-3">{t('dashboard.col_assignee')}</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">{t('dashboard.col_detail')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent_customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="font-semibold text-slate-900 hover:text-indigo-600 block text-left cursor-pointer"
                      >
                        {c.company_name}
                      </button>
                      <span className="text-xs text-slate-400">
                        {t('dashboard.tax_code')}: {c.tax_code || t('dashboard.not_updated')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs border font-medium ${c.status_badge?.class || 'bg-slate-100 text-slate-700'}`}>
                        {translateStatus(c.status, c.status_label)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{formatVND(c.current_debt)}</div>
                      {c.overdue && (
                        <span className="text-[11px] text-rose-600 font-medium">{t('dashboard.overdue_tag')}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">
                      {c.assigned_user?.name || t('dashboard.unassigned')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        {t('dashboard.open_profile')}
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
            {t('dashboard.activities_title')}
          </h3>

          <div className="space-y-4">
            {recent_activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{t('dashboard.no_activities')}</p>
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
                      <span>{act.user?.name || t('dashboard.staff')}</span>
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
