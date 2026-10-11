import React, { useState, useEffect } from 'react';
import { customersApi } from '../services/api';
import type { Customer, CustomerMeta } from '../types';
import { formatVND } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Building2, 
  Search, 
  Plus, 
  AlertTriangle, 
  Trash2, 
  ExternalLink, 
  Phone, 
  Mail, 
  X,
  CreditCard
} from 'lucide-react';

interface CustomersPageProps {
  onSelectCustomer: (id: number) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onSelectCustomer }) => {
  const { currentUser } = useAuth();
  const { t, translateIndustry, translateStatus, translateTier, translateRole } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({
    total_count: 0,
    overdue_count: 0,
    has_debt_count: 0,
    total_debt_amount: 0,
  });
  const [meta, setMeta] = useState<CustomerMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [industry, setIndustry] = useState('');
  const [debtFilter, setDebtFilter] = useState('');

  // New Customer Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    tax_code: '',
    industry: 'Công nghệ & Phần mềm',
    status: 'lead',
    tier: 'standard',
    contact_name: '',
    contact_title: '',
    contact_phone: '',
    contact_email: '',
    credit_limit: 50000000,
    current_debt: 0,
    address: '',
    city: 'Hà Nội',
    lead_source: 'Website / Đăng ký trực tiếp',
    assigned_user_id: currentUser?.id || '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [search, status, industry, debtFilter]);

  const fetchMeta = async () => {
    try {
      const res = await customersApi.getMeta();
      setMeta(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersApi.getAll({
        q: search,
        status: status || undefined,
        industry: industry || undefined,
        debt_filter: debtFilter || undefined,
      });
      setCustomers(res.customers);
      setStats(res.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(t('customers.confirm_delete', { name }))) return;
    try {
      await customersApi.delete(id);
      fetchCustomers();
    } catch (err: any) {
      alert(err?.response?.data?.error || t('customers.err_delete'));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await customersApi.create({
        ...formData,
        credit_limit: Number(formData.credit_limit),
        current_debt: Number(formData.current_debt),
        assigned_user_id: formData.assigned_user_id ? Number(formData.assigned_user_id) : undefined,
      } as any);
      setShowCreateModal(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err?.response?.data?.errors?.join(', ') || t('customers.err_create'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            {t('customers.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('customers.subtitle_prefix', { count: stats.total_count })}{' '}
            <span className="font-semibold text-blue-700">{formatVND(stats.total_debt_amount)}</span>
          </p>
        </div>

        {currentUser?.permissions?.can_create_customer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('customers.add_btn')}
          </button>
        )}
      </div>

      {/* Filter and Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('customers.search_placeholder')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">{t('customers.all_statuses')}</option>
              {meta && Object.entries(meta.statuses).map(([key, label]) => (
                <option key={key} value={key}>{translateStatus(key, label)}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">{t('customers.all_industries')}</option>
              {meta && meta.industries.map((ind) => (
                <option key={ind} value={ind}>{translateIndustry(ind)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Debt filter tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">{t('customers.debt_filter_label')}</span>
          {[
            { key: '', label: t('customers.filter_all') },
            { key: 'overdue', label: t('customers.filter_overdue', { count: stats.overdue_count }) },
            { key: 'due_soon', label: t('customers.filter_due_soon') },
            { key: 'has_debt', label: t('customers.filter_has_debt', { count: stats.has_debt_count }) },
            { key: 'settled', label: t('customers.filter_settled') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDebtFilter(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                debtFilter === tab.key
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-xs text-slate-500 mt-2">{t('customers.loading')}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-sm">{t('customers.empty_title')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('customers.empty_desc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{t('customers.col_company_tax')}</th>
                  <th className="py-3 px-4">{t('customers.col_contact')}</th>
                  <th className="py-3 px-4">{t('customers.col_status_tier')}</th>
                  <th className="py-3 px-4">{t('customers.col_debt_limit')}</th>
                  <th className="py-3 px-4">{t('customers.col_debt_status')}</th>
                  <th className="py-3 px-4">{t('customers.col_assignee')}</th>
                  <th className="py-3 px-4 text-right">{t('customers.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-sm block text-left cursor-pointer"
                      >
                        {c.company_name}
                      </button>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{t('dashboard.tax_code')}: {c.tax_code || t('customers.no_tax_code')}</span>
                        {c.industry && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{translateIndustry(c.industry)}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 text-xs">
                        {c.contact_name || t('customers.no_contact')}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.contact_title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        {c.contact_phone && (
                          <span className="flex items-center gap-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            {c.contact_phone}
                          </span>
                        )}
                        {c.contact_email && (
                          <span className="flex items-center gap-0.5">
                            <Mail className="w-2.5 h-2.5 text-slate-400" />
                            {c.contact_email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status & Tier */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[11px] border font-medium ${c.status_badge?.class || 'bg-slate-100 text-slate-700'}`}>
                          {translateStatus(c.status, c.status_label)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${c.tier_badge?.class || 'bg-slate-100 text-slate-600'}`}>
                          {translateTier(c.tier, c.tier_label)}
                        </span>
                      </div>
                    </td>

                    {/* Debt & Credit Utilization */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatVND(c.current_debt)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {t('customers.credit_limit')}: {formatVND(c.credit_limit)}
                      </div>
                      {/* Credit Bar */}
                      <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.credit_utilization > 90
                              ? 'bg-rose-500'
                              : c.credit_utilization > 60
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(c.credit_utilization, 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* Debt Status Badge */}
                    <td className="py-3.5 px-4">
                      {c.overdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          {t('dashboard.days_overdue', { days: c.days_overdue })}
                        </span>
                      ) : c.due_soon ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          {t('customers.due_soon')}
                        </span>
                      ) : c.current_debt > 0 ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {t('customers.in_term')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {t('customers.settled')}
                        </span>
                      )}
                    </td>

                    {/* Assigned User */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {c.assigned_user ? (
                        <div>
                          <div className="font-semibold text-slate-800">{c.assigned_user.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {translateRole(undefined, c.assigned_user.department, c.assigned_user.role_label)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">{t('customers.unassigned')}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectCustomer(c.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{t('customers.detail_btn')}</span>
                        </button>
                        {currentUser?.permissions?.can_delete_customer && (
                          <button
                            onClick={() => handleDelete(c.id, c.company_name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title={t('customers.delete_title')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {t('customers.modal_title')}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('customers.form_company_name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder={t('customers.form_company_placeholder')}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('customers.form_tax_code')}
                  </label>
                  <input
                    type="text"
                    value={formData.tax_code}
                    onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                    placeholder={t('customers.form_tax_placeholder')}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('customers.form_industry')}
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {meta?.industries.map((ind) => (
                      <option key={ind} value={ind}>{translateIndustry(ind)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('customers.form_status')}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {meta && Object.entries(meta.statuses).map(([key, label]) => (
                      <option key={key} value={key}>{translateStatus(key, label)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('customers.form_tier')}
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {meta && Object.entries(meta.tiers).map(([key, label]) => (
                      <option key={key} value={key}>{translateTier(key, label)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('customers.form_assignee')}
                  </label>
                  <select
                    value={formData.assigned_user_id}
                    onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">{t('dashboard.unassigned')}</option>
                    {meta?.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({translateRole(undefined, u.department, u.role_label)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact details */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  {t('customers.form_contact_section')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder={t('customers.form_contact_name')}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.contact_title}
                      onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                      placeholder={t('customers.form_contact_title')}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder={t('customers.form_contact_phone')}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder={t('customers.form_contact_email')}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Financial & Debt */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  {t('customers.form_finance_section')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{t('customers.form_credit_limit')}</label>
                    <input
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{t('customers.form_initial_debt')}</label>
                    <input
                      type="number"
                      value={formData.current_debt}
                      onChange={(e) => setFormData({ ...formData, current_debt: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t('customers.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? t('customers.saving') : t('customers.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
