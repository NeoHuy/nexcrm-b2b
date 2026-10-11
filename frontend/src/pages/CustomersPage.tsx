import React, { useState, useEffect } from 'react';
import { customersApi } from '../services/api';
import type { Customer, CustomerMeta } from '../types';
import { formatVND } from '../utils/format';
import { useAuth } from '../context/AuthContext';
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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}"?`)) return;
    try {
      await customersApi.delete(id);
      fetchCustomers();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Xóa thất bại. Kiểm tra quyền của bạn!');
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
      setFormError(err?.response?.data?.errors?.join(', ') || 'Thêm khách hàng thất bại.');
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
            Quản lý Khách hàng Doanh nghiệp (B2B)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng {stats.total_count} đối tác • Tổng công nợ: <span className="font-semibold text-blue-700">{formatVND(stats.total_debt_amount)}</span>
          </p>
        </div>

        {currentUser?.permissions?.can_create_customer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Thêm Khách hàng B2B
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
              placeholder="Tìm theo tên công ty, MST, người liên hệ..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Tất cả trạng thái quan hệ</option>
              {meta && Object.entries(meta.statuses).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Tất cả ngành nghề</option>
              {meta && meta.industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Debt filter tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">Bộ lọc công nợ:</span>
          {[
            { key: '', label: 'Tất cả' },
            { key: 'overdue', label: `🚨 Quá hạn (${stats.overdue_count})` },
            { key: 'due_soon', label: '⚠️ Sắp đến hạn' },
            { key: 'has_debt', label: `Có nợ (${stats.has_debt_count})` },
            { key: 'settled', label: '✅ Đã tất toán' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDebtFilter(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
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
            <p className="text-xs text-slate-500 mt-2">Đang tải danh sách khách hàng...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-sm">Không tìm thấy khách hàng B2B nào phù hợp.</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc điều kiện bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Doanh nghiệp / MST</th>
                  <th className="py-3 px-4">Đại diện (Decision Maker)</th>
                  <th className="py-3 px-4">Phân loại & Hạng</th>
                  <th className="py-3 px-4">Công nợ & Hạn mức</th>
                  <th className="py-3 px-4">Tình trạng nợ</th>
                  <th className="py-3 px-4">Phụ trách</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-sm block text-left"
                      >
                        {c.company_name}
                      </button>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>MST: {c.tax_code || 'Chưa có'}</span>
                        {c.industry && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{c.industry}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 text-xs">
                        {c.contact_name || 'Chưa có đại diện'}
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
                          {c.status_label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${c.tier_badge?.class || 'bg-slate-100 text-slate-600'}`}>
                          {c.tier_label}
                        </span>
                      </div>
                    </td>

                    {/* Debt & Credit Utilization */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatVND(c.current_debt)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Hạn mức: {formatVND(c.credit_limit)}
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
                          Trễ {c.days_overdue} ngày
                        </span>
                      ) : c.due_soon ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          Sắp đến hạn
                        </span>
                      ) : c.current_debt > 0 ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          Trong hạn
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Đã tất toán
                        </span>
                      )}
                    </td>

                    {/* Assigned User */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {c.assigned_user ? (
                        <div>
                          <div className="font-semibold text-slate-800">{c.assigned_user.name}</div>
                          <div className="text-[11px] text-slate-400">{c.assigned_user.role_label}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa giao</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectCustomer(c.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                        {currentUser?.permissions?.can_delete_customer && (
                          <button
                            onClick={() => handleDelete(c.id, c.company_name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                            title="Xóa khách hàng (Admin)"
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
                Thêm mới Khách hàng Doanh nghiệp B2B
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
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
                    Tên doanh nghiệp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="VD: Tập đoàn Công nghệ VinaTech"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã số thuế (MST)
                  </label>
                  <input
                    type="text"
                    value={formData.tax_code}
                    onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                    placeholder="VD: 0102345678"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngành nghề kinh doanh
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {meta?.industries.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái quan hệ B2B
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {meta && Object.entries(meta.statuses).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân hạng đối tác
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {meta && Object.entries(meta.tiers).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Người phụ trách chính
                  </label>
                  <select
                    value={formData.assigned_user_id}
                    onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Chưa phân công</option>
                    {meta?.users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role_label})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact details */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  Đại diện pháp nhân (Decision Maker)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Họ và tên người đại diện"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.contact_title}
                      onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                      placeholder="Chức vụ (VD: Giám đốc, Kế toán trưởng)"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="Số điện thoại liên hệ"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="Email làm việc"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Financial & Debt */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Hạn mức tín dụng & Công nợ khởi tạo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Hạn mức công nợ cho phép (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Công nợ ban đầu (VNĐ)</label>
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
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
