import React, { useState, useEffect } from 'react';
import { customersApi } from '../services/api';
import type { Customer, Activity, DebtTransaction } from '../types';
import { formatVND, formatDate, formatDateTime } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  CreditCard, 
  AlertTriangle, 
  Plus, 
  Receipt, 
  Trash2, 
  X,
  FileText,
  Users,
  LifeBuoy,
  BellRing
} from 'lucide-react';

interface CustomerDetailPageProps {
  customerId: number;
  onBack: () => void;
}

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customerId, onBack }) => {
  const {
    t,
    translateStatus,
    translateTier,
    translateIndustry,
    translateLeadSource,
    translateRole,
    translateActivityType,
    translateTransactionType,
  } = useLanguage();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [debtTransactions, setDebtTransactions] = useState<DebtTransaction[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: 'call',
    title: '',
    content: '',
    occurred_at: new Date().toISOString().slice(0, 16),
    next_follow_up_at: '',
  });

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtForm, setDebtForm] = useState({
    transaction_type: 'payment',
    amount: '',
    transaction_date: new Date().toISOString().slice(0, 10),
    reference_code: '',
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [customerId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await customersApi.getById(customerId);
      setCustomer(res.customer);
      setActivities(res.activities);
      setDebtTransactions(res.debt_transactions);
      setPermissions(res.permissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await customersApi.addActivity(customerId, activityForm);
      setShowActivityModal(false);
      setActivityForm({
        activity_type: 'call',
        title: '',
        content: '',
        occurred_at: new Date().toISOString().slice(0, 16),
        next_follow_up_at: '',
      });
      fetchDetail();
    } catch (err: any) {
      alert(err?.response?.data?.error || t('detail.err_save_activity'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteActivity = async (actId: number) => {
    if (!window.confirm(t('detail.confirm_delete_activity'))) return;
    try {
      await customersApi.deleteActivity(customerId, actId);
      fetchDetail();
    } catch (err: any) {
      alert(err?.response?.data?.error || t('customers.err_delete'));
    }
  };

  const handleAddDebtTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtForm.amount || Number(debtForm.amount) <= 0) {
      alert(t('detail.err_invalid_amount'));
      return;
    }
    setSubmitting(true);
    try {
      await customersApi.addDebtTransaction(customerId, {
        ...debtForm,
        amount: Number(debtForm.amount),
      });
      setShowDebtModal(false);
      setDebtForm({
        transaction_type: 'payment',
        amount: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        reference_code: '',
        note: '',
      });
      fetchDetail();
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.response?.data?.errors?.join(', ') || t('detail.err_save_tx'));
    } finally {
      setSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4 text-blue-600" />;
      case 'meeting': return <Users className="w-4 h-4 text-indigo-600" />;
      case 'email': return <Mail className="w-4 h-4 text-sky-600" />;
      case 'support': return <LifeBuoy className="w-4 h-4 text-emerald-600" />;
      case 'debt_reminder': return <BellRing className="w-4 h-4 text-rose-600" />;
      default: return <FileText className="w-4 h-4 text-amber-600" />;
    }
  };

  if (loading || !customer) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('detail.back')}</span>
        </button>

        <div className="flex items-center gap-2">
          {permissions.can_create_debt_transaction && (
            <button
              onClick={() => setShowDebtModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{t('detail.add_debt_btn')}</span>
            </button>
          )}

          {permissions.can_create_activity && (
            <button
              onClick={() => setShowActivityModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('detail.add_activity_btn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${customer.status_badge?.class || 'bg-slate-100 text-slate-800'}`}>
                {translateStatus(customer.status, customer.status_label)}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${customer.tier_badge?.class || 'bg-slate-100 text-slate-700'}`}>
                {translateTier(customer.tier, customer.tier_label)}
              </span>
              {customer.industry && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                  {translateIndustry(customer.industry)}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {customer.company_name}
            </h1>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>{t('detail.tax_code')} <strong className="text-slate-700">{customer.tax_code || t('customers.no_tax_code')}</strong></span>
              {customer.website && (
                <a 
                  href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  {customer.website}
                </a>
              )}
              {customer.address && (
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3 h-3" />
                  {customer.address}, {customer.city}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 min-w-[240px]">
            <div className="text-xs text-slate-500 font-medium">{t('detail.am_label')}</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {customer.assigned_user?.name || t('detail.no_am')}
            </div>
            <div className="text-xs text-indigo-600 mt-0.5">
              {customer.assigned_user
                ? translateRole(undefined, customer.assigned_user.department, customer.assigned_user.role_label)
                : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Financial Card & Decision Maker Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Financial & Debt Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              {t('detail.finance_title')}
            </h3>
            {customer.overdue ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('detail.overdue_days', { days: customer.days_overdue })}
              </span>
            ) : customer.due_soon ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {t('detail.due_soon_badge')}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                {t('detail.in_term_badge')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium block">{t('detail.current_debt')}</span>
              <span className="text-xl font-black text-rose-700 mt-1 block">
                {formatVND(customer.current_debt)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium block">{t('detail.credit_limit')}</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {formatVND(customer.credit_limit)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium block">{t('detail.payment_due_date')}</span>
              <span className="text-sm font-bold text-slate-800 mt-2 block">
                {formatDate(customer.payment_due_date)}
              </span>
            </div>
          </div>

          {/* Credit Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>{t('detail.credit_utilization')}</span>
              <span>{customer.credit_utilization}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  customer.credit_utilization > 90
                    ? 'bg-rose-500'
                    : customer.credit_utilization > 60
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(customer.credit_utilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Col 2: Decision Maker info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {t('detail.dm_title')}
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400">{t('detail.dm_name')}</span>
              <div className="text-sm font-bold text-slate-900">{customer.contact_name || t('dashboard.not_updated')}</div>
              <div className="text-xs text-indigo-600 font-medium">{customer.contact_title || t('detail.dm_no_title')}</div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">{t('detail.dm_phone')}</span>
              <div className="text-sm font-semibold text-slate-800 flex items-center gap-2 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {customer.contact_phone || t('dashboard.no_phone')}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">{t('detail.dm_email')}</span>
              <div className="text-sm font-semibold text-slate-800 flex items-center gap-2 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {customer.contact_email || t('detail.dm_no_email')}
              </div>
            </div>

            {customer.lead_source && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">{t('detail.dm_lead_source')}</span>
                <div className="text-xs font-medium text-slate-700 mt-0.5">{translateLeadSource(customer.lead_source)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs / Sub-tables: Activities Timeline & Debt Transactions History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Activities Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              {t('detail.activities_title', { count: activities.length })}
            </h3>
            {permissions.can_create_activity && (
              <button
                onClick={() => setShowActivityModal(true)}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('detail.add_interaction')}
              </button>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {t('detail.no_activities')}
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                        {getActivityIcon(act.activity_type)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">{act.title}</span>
                        <div className="text-[11px] text-slate-400">
                          {act.user?.name} • {formatDateTime(act.occurred_at)}
                        </div>
                      </div>
                    </div>
                    {(permissions.can_delete_activity ?? permissions.can_create_activity) && (
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                        title={t('detail.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {act.content && (
                    <p className="text-xs text-slate-600 mt-2 pl-9 whitespace-pre-line">
                      {act.content}
                    </p>
                  )}
                  {act.next_follow_up_at && (
                    <div className="mt-2 pl-9 text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                      <span>{t('detail.next_follow_up')}</span>
                      <strong>{formatDateTime(act.next_follow_up_at)}</strong>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Debt Transactions History */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              {t('detail.ledger_title', { count: debtTransactions.length })}
            </h3>
            {permissions.can_create_debt_transaction && (
              <button
                onClick={() => setShowDebtModal(true)}
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('detail.record_tx')}
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {debtTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {t('detail.no_transactions')}
              </div>
            ) : (
              debtTransactions.map((tx) => (
                <div key={tx.id} className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        tx.transaction_type === 'payment'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.transaction_type === 'invoice'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {translateTransactionType(tx.transaction_type, tx.transaction_type_label)}
                      </span>
                      {tx.reference_code && (
                        <span className="text-xs text-slate-500 font-mono">#{tx.reference_code}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {formatDate(tx.transaction_date)} • {t('detail.performed_by', { name: tx.user?.name || t('detail.system') })}
                    </div>
                    {tx.note && (
                      <p className="text-xs text-slate-500 mt-1 italic">{tx.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-black ${
                      tx.transaction_type === 'payment' ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {tx.transaction_type === 'payment' ? '-' : '+'}{formatVND(tx.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{t('detail.activity_modal_title')}</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.activity_type')}</label>
                <select
                  value={activityForm.activity_type}
                  onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {['call', 'meeting', 'email', 'support', 'debt_reminder', 'note'].map((type) => (
                    <option key={type} value={type}>
                      {translateActivityType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.activity_title_label')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('detail.activity_title_placeholder')}
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.activity_content_label')}</label>
                <textarea
                  rows={3}
                  placeholder={t('detail.activity_content_placeholder')}
                  value={activityForm.content}
                  onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.activity_followup_label')}</label>
                <input
                  type="datetime-local"
                  value={activityForm.next_follow_up_at}
                  onChange={(e) => setActivityForm({ ...activityForm, next_follow_up_at: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  {t('customers.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm cursor-pointer"
                >
                  {submitting ? t('customers.saving') : t('detail.save_activity')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Debt Transaction Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {t('detail.debt_modal_title')}
              </h3>
              <button onClick={() => setShowDebtModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebtTransaction} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.tx_type_label')}</label>
                <select
                  value={debtForm.transaction_type}
                  onChange={(e) => setDebtForm({ ...debtForm, transaction_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {['payment', 'invoice', 'adjustment'].map((type) => (
                    <option key={type} value={type}>
                      {translateTransactionType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.tx_amount_label')}</label>
                <input
                  type="number"
                  required
                  placeholder={t('detail.tx_amount_placeholder')}
                  value={debtForm.amount}
                  onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.tx_date_label')}</label>
                  <input
                    type="date"
                    value={debtForm.transaction_date}
                    onChange={(e) => setDebtForm({ ...debtForm, transaction_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.tx_ref_label')}</label>
                  <input
                    type="text"
                    placeholder={t('detail.tx_ref_placeholder')}
                    value={debtForm.reference_code}
                    onChange={(e) => setDebtForm({ ...debtForm, reference_code: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detail.tx_note_label')}</label>
                <input
                  type="text"
                  placeholder={t('detail.tx_note_placeholder')}
                  value={debtForm.note}
                  onChange={(e) => setDebtForm({ ...debtForm, note: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDebtModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  {t('customers.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm cursor-pointer"
                >
                  {submitting ? t('customers.saving') : t('detail.confirm_tx')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
