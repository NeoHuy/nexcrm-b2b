import React, { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ManagedUser, UserStats, PolicyCode, PolicyPermissions } from '../types';
import { formatVND, formatDate } from '../utils/format';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Search,
  Briefcase,
  Headphones,
  Megaphone,
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
  UserCheck,
  Sliders,
  Globe,
  LogIn,
} from 'lucide-react';

const ADMIN_PERMISSIONS: PolicyPermissions = {
  customer_view: true,
  customer_create: true,
  customer_update: true,
  customer_delete: true,
  debt_view: true,
  debt_create: true,
  activity_create: true,
  activity_delete: true,
  own_customers_only: false,
};

const NO_ACCESS_PERMISSIONS: PolicyPermissions = {
  customer_view: false,
  customer_create: false,
  customer_update: false,
  customer_delete: false,
  debt_view: false,
  debt_create: false,
  activity_create: false,
  activity_delete: false,
  own_customers_only: true,
};

const USER_POLICY_PRESETS: Record<
  Exclude<PolicyCode, 'admin_all'>,
  {
    label: string;
    shortLabel: string;
    department: 'sales' | 'cs' | 'marketing' | 'management';
    description: string;
    badgeClass: string;
    permissions: PolicyPermissions;
  }
> = {
  no_access: {
    label: 'Chưa cấp quyền (No Access)',
    shortLabel: '🔒 Chưa cấp quyền',
    department: 'sales',
    description: 'Mặc định khi mới tạo User: Không có quyền truy xuất bất kỳ tính năng nào trên hệ thống.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
    permissions: { ...NO_ACCESS_PERMISSIONS },
  },
  sales_policy: {
    label: 'Policy Kinh doanh (Sales)',
    shortLabel: 'Policy Kinh doanh',
    department: 'sales',
    description: 'Xem, tạo, sửa khách hàng do mình phụ trách; xem công nợ; tạo nhật ký tương tác.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 font-semibold',
    permissions: {
      customer_view: true,
      customer_create: true,
      customer_update: true,
      customer_delete: false,
      debt_view: true,
      debt_create: false,
      activity_create: true,
      activity_delete: false,
      own_customers_only: true,
    },
  },
  cs_debt_policy: {
    label: 'Policy Công nợ & CSKH',
    shortLabel: 'Policy Công nợ & CS',
    department: 'cs',
    description: 'Xem & cập nhật toàn bộ khách hàng, tạo hóa đơn & thu tiền công nợ, ghi nhật ký CSKH.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold',
    permissions: {
      customer_view: true,
      customer_create: false,
      customer_update: true,
      customer_delete: false,
      debt_view: true,
      debt_create: true,
      activity_create: true,
      activity_delete: false,
      own_customers_only: false,
    },
  },
  marketing_policy: {
    label: 'Policy Tiếp thị (Lead)',
    shortLabel: 'Policy Tiếp thị',
    department: 'marketing',
    description: 'Xem danh sách khách hàng, tạo Lead mới và ghi chú; không truy cập Sổ công nợ.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 font-semibold',
    permissions: {
      customer_view: true,
      customer_create: true,
      customer_update: false,
      customer_delete: false,
      debt_view: false,
      debt_create: false,
      activity_create: true,
      activity_delete: false,
      own_customers_only: false,
    },
  },
  full_user_policy: {
    label: 'Policy Nhân viên Toàn diện',
    shortLabel: 'Policy Toàn diện',
    department: 'sales',
    description: 'Truy cập đầy đủ nghiệp vụ Khách hàng, Công nợ và Nhật ký (trừ xóa KH & Quản lý nhân sự).',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold',
    permissions: {
      customer_view: true,
      customer_create: true,
      customer_update: true,
      customer_delete: false,
      debt_view: true,
      debt_create: true,
      activity_create: true,
      activity_delete: true,
      own_customers_only: false,
    },
  },
  readonly_policy: {
    label: 'Policy Chỉ xem (Read-Only)',
    shortLabel: 'Policy Chỉ xem',
    department: 'marketing',
    description: 'Chỉ xem danh sách khách hàng và sổ công nợ, không được tạo/sửa/xóa dữ liệu.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
    permissions: {
      customer_view: true,
      customer_create: false,
      customer_update: false,
      customer_delete: false,
      debt_view: true,
      debt_create: false,
      activity_create: false,
      activity_delete: false,
      own_customers_only: false,
    },
  },
  custom: {
    label: 'Policy Tùy chỉnh (Custom)',
    shortLabel: 'Policy Tùy chỉnh',
    department: 'sales',
    description: 'Tự do bật/tắt từng quyền truy xuất tính năng và phạm vi dữ liệu cho User.',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200 font-semibold',
    permissions: {
      customer_view: true,
      customer_create: true,
      customer_update: true,
      customer_delete: false,
      debt_view: true,
      debt_create: false,
      activity_create: true,
      activity_delete: false,
      own_customers_only: false,
    },
  },
};

export const UsersPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    admin_count: 0,
    user_count: 0,
    sales_count: 0,
    cs_count: 0,
    marketing_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [policyFilter, setPolicyFilter] = useState('');
  const [showMatrix, setShowMatrix] = useState(true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create / Edit Modal state
  // wizardStep: 'create_info' (Step 1: Create account) | 'set_policy' (Step 2: Immediately set policy for newly created user) | 'edit_full' (Editing existing user)
  const [showFormModal, setShowFormModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<'create_info' | 'set_policy' | 'edit_full'>('create_info');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    title: string;
    phone: string;
    role: 'admin' | 'user';
    department: 'sales' | 'cs' | 'marketing' | 'management';
    policy_code: PolicyCode;
    policy_permissions: PolicyPermissions;
  }>({
    name: '',
    email: '',
    password: '',
    title: '',
    phone: '',
    role: 'user',
    department: 'sales',
    policy_code: 'no_access',
    policy_permissions: { ...NO_ACCESS_PERMISSIONS },
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
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll({
        q: searchQuery || undefined,
        role: roleFilter || undefined,
        policy_code: policyFilter || undefined,
      });
      setUsers(data.users);
      setStats(data.stats);
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Không thể tải danh sách nhân sự.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, policyFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSelectRole = (newRole: 'admin' | 'user') => {
    if (newRole === 'admin') {
      setFormData((prev) => ({
        ...prev,
        role: 'admin',
        department: 'management',
        policy_code: 'admin_all',
        policy_permissions: { ...ADMIN_PERMISSIONS },
      }));
    } else {
      const defaultPolicy: Exclude<PolicyCode, 'admin_all'> =
        formData.policy_code === 'admin_all' ? 'no_access' : formData.policy_code;
      const preset = USER_POLICY_PRESETS[defaultPolicy] || USER_POLICY_PRESETS.no_access;
      setFormData((prev) => ({
        ...prev,
        role: 'user',
        department: prev.department === 'management' ? preset.department : prev.department,
        policy_code: defaultPolicy,
        policy_permissions:
          defaultPolicy === 'custom' ? prev.policy_permissions : { ...preset.permissions },
      }));
    }
  };

  const handleSelectUserPolicyPreset = (presetKey: Exclude<PolicyCode, 'admin_all'>) => {
    const preset = USER_POLICY_PRESETS[presetKey];
    setFormData((prev) => ({
      ...prev,
      role: 'user',
      department: presetKey === 'custom' ? prev.department : preset.department,
      policy_code: presetKey,
      policy_permissions:
        presetKey === 'custom' ? prev.policy_permissions : { ...preset.permissions },
    }));
  };

  const handleTogglePermission = (key: keyof PolicyPermissions) => {
    if (formData.role === 'admin') return;
    setFormData((prev) => {
      const updated = {
        ...prev.policy_permissions,
        [key]: !prev.policy_permissions[key],
      };
      // If customer_view is turned off, disable dependent customer actions
      if (key === 'customer_view' && !updated.customer_view) {
        updated.customer_create = false;
        updated.customer_update = false;
        updated.customer_delete = false;
      }
      // If customer_create/update/delete is turned on, ensure customer_view is on
      if (
        (key === 'customer_create' || key === 'customer_update' || key === 'customer_delete') &&
        updated[key]
      ) {
        updated.customer_view = true;
      }
      // If debt_view is turned off, disable debt_create
      if (key === 'debt_view' && !updated.debt_view) {
        updated.debt_create = false;
      }
      // If debt_create is turned on, ensure debt_view is on
      if (key === 'debt_create' && updated.debt_create) {
        updated.debt_view = true;
      }

      // Check if all capability keys are false -> no_access
      const capabilityKeys: Array<keyof PolicyPermissions> = [
        'customer_view',
        'customer_create',
        'customer_update',
        'customer_delete',
        'debt_view',
        'debt_create',
        'activity_create',
        'activity_delete',
      ];
      const hasAnyCap = capabilityKeys.some((k) => updated[k]);
      if (!hasAnyCap) {
        return {
          ...prev,
          policy_code: 'no_access',
          policy_permissions: updated,
        };
      }

      // Check if updated matches any preset
      let matchedCode: Exclude<PolicyCode, 'admin_all'> = 'custom';
      (Object.keys(USER_POLICY_PRESETS) as Array<Exclude<PolicyCode, 'admin_all'>>).forEach((pKey) => {
        if (pKey === 'custom' || pKey === 'no_access') return;
        const pPerms = USER_POLICY_PRESETS[pKey].permissions;
        const isMatch = (Object.keys(pPerms) as Array<keyof PolicyPermissions>).every(
          (k) => pPerms[k] === updated[k]
        );
        if (isMatch) matchedCode = pKey;
      });

      return {
        ...prev,
        policy_code: matchedCode,
        policy_permissions: updated,
      };
    });
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setWizardStep('create_info');
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      title: 'Nhân viên B2B',
      phone: '',
      role: 'user',
      department: 'sales',
      policy_code: 'no_access',
      policy_permissions: { ...NO_ACCESS_PERMISSIONS },
    });
    setShowFormModal(true);
  };

  const openEditModal = (user: ManagedUser, policyOnlyStep = false) => {
    setEditingUser(user);
    setWizardStep(policyOnlyStep ? 'set_policy' : 'edit_full');
    const pCode: PolicyCode =
      user.role === 'admin' ? 'admin_all' : user.policy_code || 'no_access';
    const perms: PolicyPermissions =
      user.role === 'admin'
        ? { ...ADMIN_PERMISSIONS }
        : user.policy_permissions || { ...NO_ACCESS_PERMISSIONS };

    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      title: user.title || '',
      phone: user.phone || '',
      role: user.role,
      department: (user.department as any) || (user.role === 'admin' ? 'management' : 'sales'),
      policy_code: pCode,
      policy_permissions: { ...perms },
    });
    setShowFormModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (wizardStep === 'create_info' && !editingUser) {
        // Step 1: Create the user account first.
        // If role === 'user', create with 'no_access' (0 permissions) initially, then immediately transition to Step 2 ('set_policy') so Admin sets permissions right away!
        const isAdminRole = formData.role === 'admin';
        const res = await usersApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password || 'password123',
          title: formData.title,
          phone: formData.phone,
          role: formData.role,
          department: isAdminRole ? 'management' : formData.department,
          policy_code: isAdminRole ? 'admin_all' : 'no_access',
          policy_permissions: isAdminRole ? ADMIN_PERMISSIONS : NO_ACCESS_PERMISSIONS,
        });
        await fetchUsers();
        if (isAdminRole) {
          showToast('success', res.message);
          setShowFormModal(false);
        } else {
          // Immediately transition to Step 2: Set Policy Permissions for the newly created user!
          setEditingUser(res.user);
          setWizardStep('set_policy');
          setFormData((prev) => ({
            ...prev,
            policy_code: 'sales_policy',
            policy_permissions: { ...USER_POLICY_PRESETS.sales_policy.permissions },
          }));
          showToast(
            'success',
            `Đã tạo tài khoản ${res.user.name}. Bây giờ hãy thiết lập quyền (Policy) cho User này!`
          );
        }
      } else if (editingUser) {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          title: formData.title,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
          policy_code: formData.role === 'admin' ? 'admin_all' : formData.policy_code,
          policy_permissions:
            formData.role === 'admin' ? ADMIN_PERMISSIONS : formData.policy_permissions,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        const res = await usersApi.update(editingUser.id, payload);
        showToast('success', res.message);
        setShowFormModal(false);
        fetchUsers();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Có lỗi xảy ra khi lưu nhân sự.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPolicyChange = async (user: ManagedUser, targetValue: string) => {
    try {
      if (targetValue === 'admin') {
        const res = await usersApi.updateRole(user.id, {
          role: 'admin',
          policy_code: 'admin_all',
        });
        showToast('success', res.message);
      } else {
        const pCode = targetValue as Exclude<PolicyCode, 'admin_all'>;
        const preset = USER_POLICY_PRESETS[pCode];
        const res = await usersApi.updateRole(user.id, {
          role: 'user',
          policy_code: pCode,
          department: preset?.department || user.department,
          policy_permissions: preset?.permissions,
        });
        showToast('success', res.message);
      }
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.response?.data?.error || 'Không thể thay đổi Role / Policy.');
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
              KIẾN TRÚC 2 ROLES (ADMIN & USER) + POLICY-BASED ACCESS
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              Quản lý Tài khoản & Phân quyền Policy
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Hệ thống chỉ gồm 2 Roles: <strong>Admin</strong> (toàn quyền hệ thống) và <strong>User</strong> (quyền truy xuất tính năng & phạm vi dữ liệu tùy theo Policy được cấp).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Info className="w-4 h-4 text-indigo-600" />
              {showMatrix ? 'Ẩn Mô hình Role & Policy' : 'Xem Mô hình Role & Policy'}
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Thêm Tài khoản Mới
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div
            onClick={() => {
              setRoleFilter('');
              setPolicyFilter('');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              !roleFilter && !policyFilter
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold opacity-80">
              <span>Tổng tài khoản</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.total_users}</div>
          </div>

          <div
            onClick={() => {
              setRoleFilter('admin');
              setPolicyFilter('');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              roleFilter === 'admin'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50/60 border-rose-200 text-rose-900 hover:bg-rose-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Role: Admin (Toàn quyền)</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.admin_count}</div>
          </div>

          <div
            onClick={() => {
              setRoleFilter('user');
              setPolicyFilter('');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              roleFilter === 'user' && !policyFilter
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-indigo-50/60 border-indigo-200 text-indigo-900 hover:bg-indigo-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Role: User (Theo Policy)</span>
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">
              {stats.user_count ?? stats.total_users - stats.admin_count}
            </div>
          </div>

          <div
            onClick={() => {
              setRoleFilter('user');
              setPolicyFilter('sales_policy');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              policyFilter === 'sales_policy'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50/60 border-blue-200 text-blue-900 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>User • Policy Sales</span>
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.sales_count}</div>
          </div>

          <div
            onClick={() => {
              setRoleFilter('user');
              setPolicyFilter('cs_debt_policy');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              policyFilter === 'cs_debt_policy'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>User • Policy Công nợ</span>
              <Headphones className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold mt-1">{stats.cs_count}</div>
          </div>
        </div>
      </div>

      {/* Policy Permission Matrix */}
      {showMatrix && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Mô hình 2 Roles (Admin & User) + Phân quyền theo Policy
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Admin có tất cả quyền • User được kiểm soát qua Policy (CustomerPolicy, DebtPolicy, ActivityPolicy)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Tính năng / Quyền truy xuất (Policy Check)</th>
                  <th className="py-3 px-4 text-center text-rose-700 bg-rose-50/60">
                    🛡️ Role: ADMIN
                    <div className="text-[10px] font-normal text-rose-600">User đặc biệt (All Access)</div>
                  </th>
                  <th className="py-3 px-4 text-center text-blue-700 bg-blue-50/40">
                    👤 Role: USER
                    <div className="text-[10px] font-normal text-blue-600">VD: Policy Kinh doanh</div>
                  </th>
                  <th className="py-3 px-4 text-center text-emerald-700 bg-emerald-50/40">
                    👤 Role: USER
                    <div className="text-[10px] font-normal text-emerald-600">VD: Policy Công nợ & CS</div>
                  </th>
                  <th className="py-3 px-4 text-center text-purple-700 bg-purple-50/40">
                    👤 Role: USER
                    <div className="text-[10px] font-normal text-purple-600">VD: Policy Tiếp thị</div>
                  </th>
                  <th className="py-3 px-4 text-center text-cyan-700 bg-cyan-50/40">
                    👤 Role: USER
                    <div className="text-[10px] font-normal text-cyan-600">Policy Tùy chỉnh (Custom)</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-4 font-medium">
                    Phạm vi dữ liệu khách hàng (<code>CustomerPolicy::Scope</code>)
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-rose-700">Toàn hệ thống</td>
                  <td className="py-2.5 px-4 text-center font-semibold text-amber-700">Chỉ KH phụ trách</td>
                  <td className="py-2.5 px-4 text-center font-semibold text-emerald-700">Toàn hệ thống</td>
                  <td className="py-2.5 px-4 text-center font-semibold text-emerald-700">Toàn hệ thống</td>
                  <td className="py-2.5 px-4 text-center font-semibold text-cyan-700">Tùy cấu hình Policy</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">
                    Xem danh sách & chi tiết Khách hàng B2B (<code>CustomerPolicy#index?, #show?</code>)
                  </td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center font-semibold text-cyan-700">Bật / Tắt</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">
                    Tạo mới Khách hàng / Lead B2B (<code>CustomerPolicy#create?</code>)
                  </td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center font-semibold text-cyan-700">Bật / Tắt</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">
                    Chỉnh sửa hồ sơ Khách hàng B2B (<code>CustomerPolicy#update?</code>)
                  </td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center font-semibold text-cyan-700">Bật / Tắt</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">
                    Xóa hồ sơ Khách hàng B2B (<code>CustomerPolicy#destroy?</code>)
                  </td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-rose-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center font-semibold text-cyan-700">Bật / Tắt</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">
                    Xem Sổ Công nợ & Tạo giao dịch thu nợ (<code>DebtPolicy</code>, <code>DebtTransactionPolicy</code>)
                  </td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center text-slate-600">Chỉ xem nợ</td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center font-semibold text-cyan-700">Bật / Tắt</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">
                    Quản lý Nhân sự & Cấu hình Policy (<code>UserPolicy</code>)
                  </td>
                  <td className="py-2.5 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-rose-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
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
          <option value="">Tất cả Roles (Admin & User)</option>
          <option value="admin">🛡️ Role: Admin (Toàn quyền)</option>
          <option value="user">👤 Role: User (Theo Policy)</option>
        </select>

        <select
          value={policyFilter}
          onChange={(e) => setPolicyFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả Policy</option>
          <option value="admin_all">🛡️ Toàn quyền hệ thống (Admin)</option>
          <option value="no_access">🔒 Chưa cấp quyền (No Access)</option>
          <option value="sales_policy">💼 Policy Kinh doanh (Sales)</option>
          <option value="cs_debt_policy">🎧 Policy Công nợ & CSKH</option>
          <option value="marketing_policy">📣 Policy Tiếp thị (Lead)</option>
          <option value="full_user_policy">⭐ Policy Nhân viên Toàn diện</option>
          <option value="readonly_policy">👁️ Policy Chỉ xem (Read-Only)</option>
          <option value="custom">⚙️ Policy Tùy chỉnh (Custom)</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Đang tải danh sách tài khoản...</div>
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
                  <th className="py-3.5 px-4">Role hệ thống & Policy</th>
                  <th className="py-3.5 px-4">Quyền truy xuất hiệu lực (Policy Rules)</th>
                  <th className="py-3.5 px-4">Khách hàng & Công nợ phụ trách</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {users.map((u) => {
                  const quickSelectValue =
                    u.role === 'admin' ? 'admin' : u.policy_code || 'no_access';
                  const pPerms = u.policy_permissions || NO_ACCESS_PERMISSIONS;
                  const isNoAccess =
                    u.role === 'user' &&
                    (u.policy_code === 'no_access' || u.permissions?.has_any_permission === false);
                  return (
                    <tr
                      key={u.id}
                      className={`transition ${
                        isNoAccess ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* User Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs ${
                              u.role === 'admin'
                                ? 'bg-rose-600'
                                : isNoAccess
                                ? 'bg-slate-400'
                                : 'bg-indigo-600'
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

                      {/* Role & Policy Switcher */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${
                                u.role === 'admin'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200 font-bold'
                                  : 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold'
                              }`}
                            >
                              {u.role === 'admin' ? (
                                <>
                                  <ShieldCheck className="w-3 h-3" /> Role: Admin
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" /> Role: User
                                </>
                              )}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${
                                u.policy_badge_class || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {u.policy_label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[11px] text-slate-400">Đổi nhanh:</span>
                            <select
                              value={quickSelectValue}
                              disabled={u.is_current_user}
                              onChange={(e) => handleQuickPolicyChange(u, e.target.value)}
                              className={`text-xs font-semibold rounded-lg border px-2 py-1 transition ${
                                u.is_current_user
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : isNoAccess
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:border-rose-400 cursor-pointer'
                                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 cursor-pointer'
                              }`}
                            >
                              <option value="admin">🛡️ Role: Admin (Toàn quyền)</option>
                              <option value="no_access">🔒 Role: User — Chưa cấp quyền (0 quyền)</option>
                              <option value="sales_policy">👤 Role: User — Policy Kinh doanh</option>
                              <option value="cs_debt_policy">👤 Role: User — Policy Công nợ & CS</option>
                              <option value="marketing_policy">👤 Role: User — Policy Tiếp thị</option>
                              <option value="full_user_policy">👤 Role: User — Policy Toàn diện</option>
                              <option value="readonly_policy">👤 Role: User — Policy Chỉ xem</option>
                              {u.policy_code === 'custom' && (
                                <option value="custom">👤 Role: User — Policy Tùy chỉnh</option>
                              )}
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Active Policy Permissions Pills */}
                      <td className="py-4 px-4">
                        {u.role === 'admin' ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Tất cả quyền hệ thống (Full Access)
                            </span>
                          </div>
                        ) : isNoAccess ? (
                          <div className="flex flex-col items-start gap-1.5 max-w-xs">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" /> Chưa có quyền nào — Không thể dùng hệ thống
                            </span>
                            <button
                              onClick={() => {
                                openEditModal(u, true);
                                setFormData((prev) => ({
                                  ...prev,
                                  policy_code: 'sales_policy',
                                  policy_permissions: { ...USER_POLICY_PRESETS.sales_policy.permissions },
                                }));
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                            >
                              + Cấp quyền Policy cho User này ngay →
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                pPerms.own_customers_only
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {pPerms.own_customers_only ? '🔒 Chỉ KH phụ trách' : '🌐 Toàn bộ KH'}
                            </span>
                            {pPerms.customer_view && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                👁 Xem KH
                              </span>
                            )}
                            {pPerms.customer_create && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                + Tạo KH
                              </span>
                            )}
                            {pPerms.customer_update && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                ✎ Sửa KH
                              </span>
                            )}
                            {pPerms.customer_delete && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                ✕ Xóa KH
                              </span>
                            )}
                            {pPerms.debt_view && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                                👁 Sổ nợ
                              </span>
                            )}
                            {pPerms.debt_create && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ₫ Thu nợ & HĐ
                              </span>
                            )}
                            {pPerms.activity_create && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                + Nhật ký
                              </span>
                            )}
                            {pPerms.activity_delete && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                ✕ Xóa Nhật ký
                              </span>
                            )}
                          </div>
                        )}
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
                          {!u.is_current_user && (
                            <button
                              onClick={() => demoLogin({ user_id: u.id })}
                              title={`Đăng nhập thử bằng tài khoản ${u.name}`}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              Đăng nhập thử
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(u)}
                            title="Cấu hình Role & Policy chi tiết"
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                              isNoAccess
                                ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                                : 'border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600'
                            }`}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            {isNoAccess ? 'Cấp quyền ngay' : 'Role & Policy'}
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

      {/* Modal: 2-Step Create User -> Set Policy OR Edit User & Policy */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">
                  {wizardStep === 'create_info'
                    ? 'Bước 1/2: Tạo Tài khoản Mới (Role: Admin hoặc User)'
                    : wizardStep === 'set_policy' && editingUser
                    ? `Bước 2/2: Thiết lập Quyền (Policy) cho User: ${editingUser.name}`
                    : `Cấu hình Role & Policy: ${editingUser?.name}`}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Stepper Banner when Creating a User or Setting Policy right after Creation */}
            {(wizardStep === 'create_info' || wizardStep === 'set_policy') && (
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-1.5 font-bold ${
                      wizardStep === 'create_info' ? 'text-indigo-700' : 'text-emerald-700'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] text-white ${
                        wizardStep === 'create_info' ? 'bg-indigo-600' : 'bg-emerald-600'
                      }`}
                    >
                      {wizardStep === 'create_info' ? '1' : '✓'}
                    </span>
                    <span>Bước 1: Tạo tài khoản</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div
                    className={`flex items-center gap-1.5 font-bold ${
                      wizardStep === 'set_policy' ? 'text-indigo-700' : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                        wizardStep === 'set_policy'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      2
                    </span>
                    <span>Bước 2: Thiết lập Quyền (Policy) cho User</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Nếu không cấp quyền, User sẽ không sử dụng được tính năng nào
                </span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Alert when in Step 2 (set_policy right after creating user) */}
              {wizardStep === 'set_policy' && editingUser && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <div className="font-bold text-sm">
                      Tài khoản User "{editingUser.name}" ({editingUser.email}) vừa được tạo!
                    </div>
                    <p>
                      Mặc định tài khoản User mới có <strong>0 quyền truy xuất (No Access)</strong>. Vui lòng chọn mẫu Policy hoặc tích chọn các quyền bên dưới rồi bấm{' '}
                      <strong>"Lưu & Cấp quyền Policy cho User"</strong>. Nếu bạn bỏ qua bước này, User khi đăng nhập sẽ bị khóa mọi tính năng!
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 1 OR EDIT_FULL: SELECT SYSTEM ROLE (ONLY 2 ROLES: ADMIN vs USER) */}
              {wizardStep !== 'set_policy' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Chọn Role Hệ thống (Hệ thống chỉ có 2 Roles: Admin & User)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => handleSelectRole('admin')}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        formData.role === 'admin'
                          ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Role: ADMIN
                        </span>
                        {formData.role === 'admin' && (
                          <CheckCircle2 className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-2">
                        User đặc biệt có tất cả quyền của hệ thống
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Toàn quyền quản lý Khách hàng B2B, Sổ Công nợ, Nhật ký tương tác và Quản lý Nhân sự / Policy.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        if (editingUser?.is_current_user) return;
                        handleSelectRole('user');
                      }}
                      className={`p-4 rounded-xl border text-left transition ${
                        editingUser?.is_current_user
                          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                          : formData.role === 'user'
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 cursor-pointer'
                          : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold">
                          <UserCheck className="w-3.5 h-3.5" /> Role: USER
                        </span>
                        {formData.role === 'user' && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-2">
                        Tạo User xong sẽ thiết lập quyền (Policy) ngay
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mặc định chưa có quyền (No Access). Sau khi tạo User xong sẽ chuyển sang bước cấp quyền Policy.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* USER PROFILE DETAILS (SHOWN IN STEP 1 'create_info' OR 'edit_full') */}
              {wizardStep !== 'set_policy' && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    2. Thông tin Tài khoản Nhân sự
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
                        placeholder="VD: Chuyên viên Kinh doanh B2B"
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

                  {wizardStep === 'create_info' && formData.role === 'user' && (
                    <div className="mt-4 p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-2.5 text-xs text-indigo-900">
                      <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Quy trình bảo mật 2 bước:</strong> Khi bấm nút tạo bên dưới, tài khoản User sẽ được khởi tạo ở trạng thái{' '}
                        <span className="font-bold text-rose-700">Chưa cấp quyền (0 quyền)</span> và chuyển ngay sang{' '}
                        <strong>Bước 2: Thiết lập Quyền (Policy)</strong> để Admin cấp quyền sử dụng hệ thống.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* POLICY CONFIGURATION (SHOWN IN STEP 2 'set_policy' OR 'edit_full') */}
              {wizardStep !== 'create_info' && (
                <>
                  {formData.role === 'admin' ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-rose-900 space-y-1">
                        <div className="font-bold text-sm">
                          Tài khoản Admin có toàn quyền trên hệ thống (Bypass mọi giới hạn Policy)
                        </div>
                        <p className="text-rose-700">
                          Bao gồm: Xem/Tạo/Sửa/Xóa toàn bộ khách hàng B2B, Xem & Ghi nhận mọi giao dịch công nợ, Tạo/Xóa nhật ký tương tác, và Quản lý Nhân sự & Phân quyền Policy.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                          Chọn Mẫu Policy Nhanh (Hoặc Tùy chỉnh từng quyền bên dưới)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(Object.keys(USER_POLICY_PRESETS) as Array<Exclude<PolicyCode, 'admin_all'>>).map(
                            (key) => {
                              const preset = USER_POLICY_PRESETS[key];
                              const active = formData.policy_code === key;
                              return (
                                <div
                                  key={key}
                                  onClick={() => handleSelectUserPolicyPreset(key)}
                                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                    active
                                      ? key === 'no_access'
                                        ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/20'
                                        : 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`text-[11px] px-2 py-0.5 rounded-full border ${preset.badgeClass}`}
                                    >
                                      {preset.shortLabel}
                                    </span>
                                    {active && (
                                      <CheckCircle2
                                        className={`w-4 h-4 ${
                                          key === 'no_access' ? 'text-rose-600' : 'text-indigo-600'
                                        }`}
                                      />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                                    {preset.description}
                                  </p>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Granular Policy Checkboxes */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-indigo-600" />
                            Chi tiết Quyền Truy xuất theo Policy của User này
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              formData.policy_code === 'no_access' ? 'text-rose-600' : 'text-indigo-600'
                            }`}
                          >
                            Đang áp dụng:{' '}
                            {USER_POLICY_PRESETS[formData.policy_code as Exclude<PolicyCode, 'admin_all'>]?.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Group 1: Customers */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                              Quản lý Khách hàng B2B (CustomerPolicy)
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.customer_view}
                                onChange={() => handleTogglePermission('customer_view')}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>Xem danh sách & chi tiết khách hàng</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.customer_create}
                                onChange={() => handleTogglePermission('customer_create')}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>Tạo mới khách hàng / Lead B2B</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.customer_update}
                                onChange={() => handleTogglePermission('customer_update')}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>Chỉnh sửa thông tin khách hàng</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.customer_delete}
                                onChange={() => handleTogglePermission('customer_delete')}
                                className="rounded text-rose-600 focus:ring-rose-500"
                              />
                              <span>Xóa hồ sơ khách hàng B2B</span>
                            </label>
                          </div>

                          {/* Group 2: Debts */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                              Sổ Công nợ & Giao dịch (DebtPolicy)
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.debt_view}
                                onChange={() => handleTogglePermission('debt_view')}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>Xem Sổ Công nợ & lịch sử giao dịch</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.debt_create}
                                onChange={() => handleTogglePermission('debt_create')}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>Tạo hóa đơn nợ / Ghi nhận thu tiền</span>
                            </label>

                            <div className="pt-2 border-t border-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Megaphone className="w-3.5 h-3.5 text-purple-600" />
                              Nhật ký tương tác (ActivityPolicy)
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.activity_create}
                                onChange={() => handleTogglePermission('activity_create')}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>Tạo mới nhật ký chăm sóc / tương tác</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.activity_delete}
                                onChange={() => handleTogglePermission('activity_delete')}
                                className="rounded text-rose-600 focus:ring-rose-500"
                              />
                              <span>Xóa nhật ký tương tác</span>
                            </label>
                          </div>

                          {/* Group 4: Data Scope */}
                          <div className="sm:col-span-2 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 flex items-start justify-between gap-4">
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-amber-700" />
                                Giới hạn phạm vi dữ liệu (Policy Scope)
                              </div>
                              <p className="text-[11px] text-amber-800">
                                Khi bật tùy chọn này, User chỉ được xem và thao tác trên các khách hàng B2B do chính User đó phụ trách (<code>assigned_user_id == user.id</code>).
                              </p>
                            </div>
                            <label className="inline-flex items-center gap-2 text-xs font-bold text-amber-900 shrink-0 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-amber-300">
                              <input
                                type="checkbox"
                                checked={formData.policy_permissions.own_customers_only}
                                onChange={() => handleTogglePermission('own_customers_only')}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span>Chỉ KH phụ trách</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
                {wizardStep === 'set_policy' && editingUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowFormModal(false);
                      showToast(
                        'error',
                        `Đã bỏ qua cấp quyền: Tài khoản ${editingUser.name} hiện có 0 quyền (No Access) và chưa thể sử dụng hệ thống.`
                      );
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                  >
                    Bỏ qua (Để User 0 quyền — Không dùng được gì)
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  {wizardStep !== 'set_policy' && (
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition cursor-pointer"
                  >
                    {submitting
                      ? 'Đang xử lý...'
                      : wizardStep === 'create_info'
                      ? formData.role === 'admin'
                        ? 'Tạo tài khoản Admin (Toàn quyền)'
                        : 'Tạo User & Tiếp tục Thiết lập Quyền (Bước 2) →'
                      : wizardStep === 'set_policy'
                      ? 'Lưu & Cấp quyền Policy cho User'
                      : 'Lưu Role & Policy'}
                  </button>
                </div>
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
                  Nhân sự bàn giao: <strong>{reassignSourceUser.name}</strong> (Role: {reassignSourceUser.role_label} • {reassignSourceUser.policy_label})
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
                        {u.name} — Role: {u.role_label} ({u.policy_label})
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
                          Bàn giao sang: {u.name} (Role: {u.role_label})
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
