import React, { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../services/api';
import type { ManagedUser, UserStats } from '../types';
import { formatVND, formatDate } from '../utils/format';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Search,
  Briefcase,
  Headphones,
  Megaphone,
  Edit3,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  Phone,
  Building2,
  AlertCircle,
  KeyRound,
  Info,
  Sparkles,
} from 'lucide-react';

type RolePreset = 'admin' | 'sales' | 'cs' | 'marketing';

const ROLE_PRESETS: Record<
  RolePreset,
  {
    role: 'admin' | 'user';
    department: 'management' | 'sales' | 'cs' | 'marketing';
    label: string;
    shortLabel: string;
    description: string;
    badgeClass: string;
    permissionsText: string[];
  }
> = {
  admin: {
    role: 'admin',
    department: 'management',
    label: 'Quản trị viên (Admin)',
    shortLabel: 'Admin (Toàn quyền)',
    description: 'Toàn quyền hệ thống: Quản lý nhân sự, phân quyền, xóa khách hàng B2B, duyệt & ghi nhận công nợ.',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
    permissionsText: ['Toàn quyền KH B2B', 'Xóa KH', 'Quản lý Công nợ', 'Quản lý Nhân sự & Phân quyền'],
  },
  sales: {
    role: 'user',
    department: 'sales',
    label: 'Kinh doanh (Sales)',
    shortLabel: 'Sales (Kinh doanh)',
    description: 'Tạo & cập nhật khách hàng B2B, ghi nhật ký đàm phán/demo, theo dõi công nợ. Không được xóa KH hay thu tiền.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 font-semibold',
    permissionsText: ['Tạo & Sửa KH B2B', 'Ghi nhật ký Sales', 'Xem công nợ'],
  },
  cs: {
    role: 'user',
    department: 'cs',
    label: 'Chăm sóc KH (CS)',
    shortLabel: 'CS (Thu nợ & CSKH)',
    description: 'Chăm sóc khách hàng, xuất hóa đơn nợ mới & ghi nhận thu tiền công nợ B2B. Không được xóa KH.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold',
    permissionsText: ['Sửa thông tin CS', 'Ghi nhận Hóa đơn & Thu nợ', 'Nhật ký CSKH'],
  },
  marketing: {
    role: 'user',
    department: 'marketing',
    label: 'Tiếp thị (Marketing)',
    shortLabel: 'Marketing (Tạo Lead)',
    description: 'Chỉ xem (Read-only) hồ sơ khách hàng & công nợ, được phép thêm Lead mới từ chiến dịch. Không sửa/xóa/thu nợ.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 font-semibold',
    permissionsText: ['Tạo Lead mới', 'Chỉ xem (Read-only) KH & Công nợ'],
  },
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    admin_count: 0,
    sales_count: 0,
    cs_count: 0,
    marketing_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showMatrix, setShowMatrix] = useState(true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create / Edit Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<RolePreset>('sales');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    phone: '',
    role: 'user' as 'admin' | 'user',
    department: 'sales' as 'sales' | 'cs' | 'marketing' | 'management',
  });
  const [submitting, setSubmitting] = useState(false);

  // Reassign Customers Modal state
  const [reassignSourceUser, setReassignSourceUser] = useState<ManagedUser | null>(null);
  const [targetUserId, setTargetUserId] = useState<number | ''>('');

  // Delete User Modal state
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [deleteTransferUserId, setDeleteTransferUserId] = useState<number | ''>('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll({
        q: searchQuery || undefined,
        role: roleFilter || undefined,
        department: deptFilter || undefined,
      });
      setUsers(data.users);
      setStats(data.stats);
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Không thể tải danh sách nhân sự.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, deptFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSelectPreset = (preset: RolePreset) => {
    setSelectedPreset(preset);
    const config = ROLE_PRESETS[preset];
    setFormData((prev) => ({
      ...prev,
      role: config.role,
      department: config.department,
    }));
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setSelectedPreset('sales');
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      title: 'Chuyên viên Kinh doanh B2B',
      phone: '',
      role: 'user',
      department: 'sales',
    });
    setShowFormModal(true);
  };

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    const preset: RolePreset =
      user.role === 'admin'
        ? 'admin'
        : (user.department as RolePreset) || 'sales';
    setSelectedPreset(preset);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      title: user.title || '',
      phone: user.phone || '',
      role: user.role,
      department: (user.department as any) || (user.role === 'admin' ? 'management' : 'sales'),
    });
    setShowFormModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          title: formData.title,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        const res = await usersApi.update(editingUser.id, payload);
        showToast('success', res.message);
      } else {
        const res = await usersApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password || 'password123',
          title: formData.title,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
        });
        showToast('success', res.message);
      }
      setShowFormModal(false);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Có lỗi xảy ra khi lưu nhân sự.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRoleChange = async (user: ManagedUser, preset: RolePreset) => {
    if (user.role_preset === preset) return;
    try {
      const res = await usersApi.updateRole(user.id, { preset });
      showToast('success', res.message);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Không thể thay đổi phân quyền.');
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignSourceUser || !targetUserId) return;
    setSubmitting(true);
    try {
      const res = await usersApi.reassignCustomers(reassignSourceUser.id, Number(targetUserId));
      showToast('success', res.message);
      setReassignSourceUser(null);
      setTargetUserId('');
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Không thể bàn giao khách hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      const res = await usersApi.delete(
        deletingUser.id,
        deleteTransferUserId ? Number(deleteTransferUserId) : undefined
      );
      showToast('success', res.message);
      setDeletingUser(null);
      setDeleteTransferUserId('');
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Không thể xóa nhân sự.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              ĐẶC QUYỀN QUẢN TRỊ VIÊN (ADMIN ONLY)
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              Quản lý Nhân sự & Phân quyền Policy
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Thêm mới tài khoản, cấp quyền truy cập theo phòng ban (Admin, Sales, CS, Marketing) và điều phối bàn giao khách hàng B2B.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold flex items-center gap-2 transition"
            >
              <Info className="w-4 h-4 text-indigo-600" />
              {showMatrix ? 'Ẩn Ma trận Phân quyền' : 'Xem Ma trận Phân quyền'}
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Thêm Nhân sự Mới
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div
            onClick={() => {
              setRoleFilter('');
              setDeptFilter('');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              !roleFilter && !deptFilter
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold opacity-80">
              <span>Tổng nhân sự</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.total_users}</div>
          </div>

          <div
            onClick={() => {
              setRoleFilter('admin');
              setDeptFilter('');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              roleFilter === 'admin'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50/60 border-rose-200 text-rose-900 hover:bg-rose-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Admin (Toàn quyền)</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.admin_count}</div>
          </div>

          <div
            onClick={() => {
              setRoleFilter('user');
              setDeptFilter('sales');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              deptFilter === 'sales'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50/60 border-blue-200 text-blue-900 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Kinh doanh (Sales)</span>
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.sales_count}</div>
          </div>

          <div
            onClick={() => {
              setRoleFilter('user');
              setDeptFilter('cs');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              deptFilter === 'cs'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Chăm sóc & Thu nợ (CS)</span>
              <Headphones className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.cs_count}</div>
          </div>

          <div
            onClick={() => {
              setRoleFilter('user');
              setDeptFilter('marketing');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              deptFilter === 'marketing'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-purple-50/60 border-purple-200 text-purple-900 hover:bg-purple-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Tiếp thị (Marketing)</span>
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.marketing_count}</div>
          </div>
        </div>
      </div>

      {/* Policy Permission Matrix */}
      {showMatrix && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Ma trận Phân quyền Hệ thống (RBAC Policy Matrix)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Áp dụng tự động tại tầng Backend Policy & Giao diện React
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Quyền hạn / Chức năng nghiệp vụ</th>
                  <th className="py-3 px-4 text-center text-rose-700 bg-rose-50/50">🛡️ Admin</th>
                  <th className="py-3 px-4 text-center text-blue-700 bg-blue-50/50">💼 Sales</th>
                  <th className="py-3 px-4 text-center text-emerald-700 bg-emerald-50/50">🎧 CS</th>
                  <th className="py-3 px-4 text-center text-purple-700 bg-purple-50/50">📣 Marketing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-4 font-medium">Xem danh sách & hồ sơ khách hàng B2B, Sổ công nợ</td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Tạo mới Khách hàng / Lead B2B (`CustomerPolicy#create?`)</td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Chỉnh sửa thông tin pháp nhân & trạng thái KH (`CustomerPolicy#update?`)</td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Xuất hóa đơn nợ & Ghi nhận thu tiền công nợ (`DebtTransactionPolicy#create?`)</td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Xóa hồ sơ khách hàng B2B (`CustomerPolicy#destroy?`)</td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-rose-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Quản lý Nhân sự, Phân quyền & Bàn giao KH (`UserPolicy`)</td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-rose-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email, chức danh hoặc số điện thoại..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả cấp bậc (Admin & User)</option>
          <option value="admin">🛡️ Quản trị viên (Admin)</option>
          <option value="user">👤 Nhân viên (User)</option>
        </select>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả phòng ban</option>
          <option value="management">Ban Quản trị / Giám đốc</option>
          <option value="sales">Phòng Kinh doanh (Sales)</option>
          <option value="cs">Phòng CS & Công nợ</option>
          <option value="marketing">Phòng Tiếp thị (Marketing)</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Đang tải danh sách nhân sự...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Không tìm thấy nhân sự nào khớp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Nhân sự & Liên hệ</th>
                  <th className="py-3.5 px-4">Vai trò & Phân quyền nhanh</th>
                  <th className="py-3.5 px-4">Quyền hạn hiệu lực (Policy)</th>
                  <th className="py-3.5 px-4">Khách hàng & Công nợ phụ trách</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {users.map((u) => {
                  const presetKey: RolePreset =
                    u.role === 'admin' ? 'admin' : ((u.department as RolePreset) || 'sales');
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      {/* User Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs ${
                              u.role === 'admin'
                                ? 'bg-rose-600'
                                : u.department === 'sales'
                                ? 'bg-blue-600'
                                : u.department === 'cs'
                                ? 'bg-emerald-600'
                                : 'bg-purple-600'
                            }`}
                          >
                            {u.name
                              .split(' ')
                              .slice(-1)[0]?.[0]
                              ?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {u.name}
                              {u.is_current_user && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-white font-semibold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {u.title || u.department_label}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {u.email}
                              </span>
                              {u.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {u.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Quick Role Switcher */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border w-fit ${u.badge_class}`}
                          >
                            {u.role_label}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[11px] text-slate-400">Đổi quyền:</span>
                            <select
                              value={presetKey}
                              disabled={u.is_current_user}
                              onChange={(e) => handleQuickRoleChange(u, e.target.value as RolePreset)}
                              title={
                                u.is_current_user
                                  ? 'Không thể tự hạ quyền của chính mình'
                                  : 'Đổi vai trò & phân quyền ngay lập tức'
                              }
                              className={`text-xs font-semibold rounded-lg border px-2 py-1 transition ${
                                u.is_current_user
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 cursor-pointer'
                              }`}
                            >
                              <option value="admin">🛡️ Admin (Toàn quyền)</option>
                              <option value="sales">💼 Sales (Kinh doanh)</option>
                              <option value="cs">🎧 CS (Thu nợ & CSKH)</option>
                              <option value="marketing">📣 Marketing (Lead)</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Active Permissions Pills */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.permissions.can_create_customer && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              + Tạo KH/Lead
                            </span>
                          )}
                          {u.permissions.can_edit_customer && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                              ✎ Sửa KH
                            </span>
                          )}
                          {u.permissions.can_create_debt && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ₫ Thu nợ & Hóa đơn
                            </span>
                          )}
                          {u.permissions.can_delete_customer && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              ✕ Xóa KH
                            </span>
                          )}
                          {u.permissions.can_manage_users && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              🛡️ QL Nhân sự
                            </span>
                          )}
                          {!u.permissions.can_edit_customer && !u.permissions.can_create_debt && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                              Chỉ xem (Read-only)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Portfolio Workload */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{u.customers_count} doanh nghiệp B2B</span>
                          </div>
                          <div className="text-slate-500">
                            Công nợ quản lý:{' '}
                            <span className="font-bold text-rose-600">
                              {formatVND(u.total_managed_debt)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {u.activities_count} nhật ký tương tác • Tạo {formatDate(u.created_at)}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            title="Chỉnh sửa thông tin & Phân quyền"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Sửa / Quyền
                          </button>

                          {u.customers_count > 0 && users.length > 1 && (
                            <button
                              onClick={() => {
                                setReassignSourceUser(u);
                                const firstOther = users.find((other) => other.id !== u.id);
                                setTargetUserId(firstOther ? firstOther.id : '');
                              }}
                              title="Bàn giao khách hàng sang nhân sự khác"
                              className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              Bàn giao ({u.customers_count})
                            </button>
                          )}

                          {!u.is_current_user && (
                            <button
                              onClick={() => {
                                setDeletingUser(u);
                                const firstOther = users.find((other) => other.id !== u.id);
                                setDeleteTransferUserId(firstOther ? firstOther.id : '');
                              }}
                              title="Xóa tài khoản nhân sự"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit User & Role Assignment */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">
                  {editingUser
                    ? `Chỉnh sửa & Phân quyền: ${editingUser.name}`
                    : 'Thêm Nhân sự Mới & Phân quyền'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-5">
              {/* Role & Permission Preset Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Chọn Vai trò & Nhóm Quyền (Policy Role)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(ROLE_PRESETS) as RolePreset[]).map((key) => {
                    const preset = ROLE_PRESETS[key];
                    const active = selectedPreset === key;
                    const disabled = editingUser?.is_current_user && key !== 'admin';
                    return (
                      <div
                        key={key}
                        onClick={() => !disabled && handleSelectPreset(key)}
                        className={`p-3 rounded-xl border text-left transition ${
                          disabled
                            ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                            : active
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 cursor-pointer'
                            : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${preset.badgeClass}`}>
                            {preset.shortLabel}
                          </span>
                          {active && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Active permission preview box */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" /> Quyền được cấp:
                  </span>
                  {ROLE_PRESETS[selectedPreset].permissionsText.map((perm, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
                    >
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* User Details */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  2. Thông tin Hồ sơ Nhân sự
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ và tên nhân sự *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Phạm Minh Tuấn"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email đăng nhập *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tuan.pham@crm.saas"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chức danh (Title)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="VD: Trưởng nhóm Kinh doanh B2B"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="VD: 0909 123 456"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      {editingUser ? 'Đổi mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                    </label>
                    <input
                      type="text"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={
                        editingUser ? 'Nhập mật khẩu mới nếu muốn đặt lại...' : 'Mặc định: password123'
                      }
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  {submitting
                    ? 'Đang lưu...'
                    : editingUser
                    ? 'Lưu thay đổi & Phân quyền'
                    : 'Tạo nhân sự & Cấp quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reassign Customers */}
      {reassignSourceUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                <h3 className="font-bold text-base">Điều chuyển & Bàn giao Khách hàng</h3>
              </div>
              <button
                onClick={() => setReassignSourceUser(null)}
                className="text-amber-100 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleReassignSubmit} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div>
                  Nhân sự bàn giao: <strong>{reassignSourceUser.name}</strong> ({reassignSourceUser.role_label})
                </div>
                <div>
                  Số lượng doanh nghiệp đang phụ trách:{' '}
                  <strong>{reassignSourceUser.customers_count} khách hàng B2B</strong>
                </div>
                <div>
                  Tổng dư nợ liên quan:{' '}
                  <strong>{formatVND(reassignSourceUser.total_managed_debt)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn nhân sự tiếp nhận toàn bộ khách hàng *
                </label>
                <select
                  required
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {users
                    .filter((u) => u.id !== reassignSourceUser.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role_label} (Đang quản lý {u.customers_count} KH)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignSourceUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !targetUserId}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold cursor-pointer"
                >
                  {submitting ? 'Đang bàn giao...' : 'Xác nhận Bàn giao'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete User Confirmation */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-base">Xóa Tài khoản Nhân sự</h3>
              </div>
              <button
                onClick={() => setDeletingUser(null)}
                className="text-rose-100 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                Bạn có chắc chắn muốn xóa tài khoản nhân sự{' '}
                <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email})?
              </p>

              {deletingUser.customers_count > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <p className="text-xs text-amber-900 font-semibold">
                    ⚠️ Nhân sự này đang phụ trách {deletingUser.customers_count} khách hàng B2B. Chọn người tiếp nhận trước khi xóa:
                  </p>
                  <select
                    value={deleteTransferUserId}
                    onChange={(e) =>
                      setDeleteTransferUserId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                  >
                    <option value="">-- Để trống người phụ trách (Unassigned) --</option>
                    {users
                      .filter((u) => u.id !== deletingUser.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          Bàn giao sang: {u.name} ({u.role_label})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold cursor-pointer"
                >
                  {submitting ? 'Đang xóa...' : 'Xóa Nhân sự'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
