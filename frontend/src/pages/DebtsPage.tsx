import React, { useState, useEffect } from 'react';
import { debtsApi } from '../services/api';
import type { Customer } from '../types';
import { formatVND, formatDate } from '../utils/format';
import { 
  Receipt, 
  AlertTriangle, 
  Clock, 
  Phone, 
  ArrowUpRight 
} from 'lucide-react';

interface DebtsPageProps {
  onSelectCustomer: (id: number) => void;
}

export const DebtsPage: React.FC<DebtsPageProps> = ({ onSelectCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({
    total_debt: 0,
    overdue_debt: 0,
    due_soon_debt: 0,
    overdue_count: 0,
  });
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebts();
  }, [filter]);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const res = await debtsApi.getAll(filter === 'all' ? undefined : filter);
      setCustomers(res.customers);
      setStats(res.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-emerald-600" />
          Sổ Theo dõi & Quản lý Công nợ Doanh nghiệp (Receivables)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi hạn nợ, thời hạn thanh toán và đôn đốc thu hồi công nợ B2B cho Sales & CS
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Tổng nợ phải thu
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {formatVND(stats.total_debt)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Toàn bộ danh mục khách hàng</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-rose-700">Nợ quá hạn</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {formatVND(stats.overdue_debt)}
          </div>
          <span className="text-xs text-rose-600 font-semibold mt-1 block">
            {stats.overdue_count} doanh nghiệp trễ hạn
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-amber-700">Sắp đến hạn (7 ngày)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {formatVND(stats.due_soon_debt)}
          </div>
          <span className="text-xs text-amber-600 font-medium mt-1 block">
            Cần đối soát và gửi thông báo
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Số tài khoản đang nợ
          </span>
          <div className="text-2xl font-bold text-indigo-700">
            {customers.length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Đang có dư nợ phát sinh</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'all', label: 'Tất cả khoản nợ' },
          { key: 'overdue', label: `🚨 Quá hạn cần thu gấp (${stats.overdue_count})` },
          { key: 'due_soon', label: '⚠️ Sắp đến hạn trong 7 ngày' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              filter === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-xs text-slate-500 mt-2">Đang tải sổ công nợ...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm">Không có khoản nợ nào trong danh mục này.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Doanh nghiệp</th>
                  <th className="py-3 px-4">Đại diện & SĐT</th>
                  <th className="py-3 px-4">Dư nợ hiện tại</th>
                  <th className="py-3 px-4">Hạn mức tín dụng</th>
                  <th className="py-3 px-4">Hạn thanh toán</th>
                  <th className="py-3 px-4">Tình trạng nợ</th>
                  <th className="py-3 px-4">Phụ trách</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-sm text-left block"
                      >
                        {c.company_name}
                      </button>
                      <span className="text-xs text-slate-400">MST: {c.tax_code || 'Chưa có'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-800">{c.contact_name || 'Chưa cập nhật'}</div>
                      {c.contact_phone && (
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.contact_phone}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-black text-rose-700 text-sm">
                        {formatVND(c.current_debt)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-700 font-medium">{formatVND(c.credit_limit)}</div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
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
                      <span className="text-[10px] text-slate-400 font-medium">Dùng {c.credit_utilization}%</span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                      {formatDate(c.payment_due_date)}
                    </td>

                    <td className="py-3.5 px-4">
                      {c.overdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          Quá hạn {c.days_overdue} ngày
                        </span>
                      ) : c.due_soon ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          Sắp đến hạn
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          Trong hạn
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {c.assigned_user?.name || 'Chưa gán'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Hồ sơ & Thu nợ</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
