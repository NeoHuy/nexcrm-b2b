import axios from 'axios';
import type { Customer, DashboardData, CustomerMeta, DemoUser, User, ManagedUser, UserStats, Activity, DebtTransaction } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const authApi = {
  getMe: async (): Promise<{ authenticated: boolean; user: User | null }> => {
    const res = await api.get('/me');
    return res.data;
  },
  login: async (email: string, password: string): Promise<{ message: string; user: User }> => {
    const res = await api.post('/login', { email, password });
    return res.data;
  },
  demoLogin: async (role: string): Promise<{ message: string; user: User }> => {
    const res = await api.post('/demo_login', { role });
    return res.data;
  },
  getDemoUsers: async (): Promise<DemoUser[]> => {
    const res = await api.get('/demo_users');
    return res.data;
  },
  logout: async (): Promise<{ message: string }> => {
    const res = await api.delete('/logout');
    return res.data;
  },
};

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await api.get('/dashboard');
    return res.data;
  },
};

export const customersApi = {
  getAll: async (params?: {
    q?: string;
    status?: string;
    industry?: string;
    debt_filter?: string;
    assigned_to?: string;
  }): Promise<{
    customers: Customer[];
    stats: {
      total_count: number;
      overdue_count: number;
      has_debt_count: number;
      total_debt_amount: number;
    };
  }> => {
    const res = await api.get('/customers', { params });
    return res.data;
  },

  getMeta: async (): Promise<CustomerMeta> => {
    const res = await api.get('/customers/meta');
    return res.data;
  },

  getById: async (id: number): Promise<{
    customer: Customer;
    activities: Activity[];
    debt_transactions: DebtTransaction[];
    permissions: {
      can_update: boolean;
      can_destroy: boolean;
      can_create_activity: boolean;
      can_create_debt_transaction: boolean;
    };
  }> => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },

  create: async (data: Partial<Customer>): Promise<{ message: string; customer: Customer }> => {
    const res = await api.post('/customers', { customer: data });
    return res.data;
  },

  update: async (id: number, data: Partial<Customer>): Promise<{ message: string; customer: Customer }> => {
    const res = await api.put(`/customers/${id}`, { customer: data });
    return res.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },

  addActivity: async (customerId: number, data: {
    activity_type: string;
    title: string;
    content?: string;
    occurred_at?: string;
    next_follow_up_at?: string;
  }): Promise<{ message: string; activity: Activity }> => {
    const res = await api.post(`/customers/${customerId}/activities`, { activity: data });
    return res.data;
  },

  deleteActivity: async (customerId: number, activityId: number): Promise<{ message: string }> => {
    const res = await api.delete(`/customers/${customerId}/activities/${activityId}`);
    return res.data;
  },

  addDebtTransaction: async (customerId: number, data: {
    transaction_type: string;
    amount: number;
    transaction_date?: string;
    reference_code?: string;
    note?: string;
  }): Promise<{ message: string; transaction: DebtTransaction; customer: Partial<Customer> }> => {
    const res = await api.post(`/customers/${customerId}/debt_transactions`, { debt_transaction: data });
    return res.data;
  },
};

export const debtsApi = {
  getAll: async (filter?: string): Promise<{
    customers: Customer[];
    stats: {
      total_debt: number;
      overdue_debt: number;
      due_soon_debt: number;
      overdue_count: number;
    };
  }> => {
    const res = await api.get('/debts', { params: { filter } });
    return res.data;
  },
};

export const usersApi = {
  getAll: async (params?: {
    q?: string;
    role?: string;
    department?: string;
  }): Promise<{
    users: ManagedUser[];
    stats: UserStats;
  }> => {
    const res = await api.get('/users', { params });
    return res.data;
  },

  create: async (data: {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'user';
    department: 'sales' | 'cs' | 'marketing' | 'management';
    title?: string;
    phone?: string;
  }): Promise<{ message: string; user: ManagedUser }> => {
    const res = await api.post('/users', { user: data });
    return res.data;
  },

  update: async (
    id: number,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: 'admin' | 'user';
      department?: 'sales' | 'cs' | 'marketing' | 'management';
      title?: string;
      phone?: string;
    }
  ): Promise<{ message: string; user: ManagedUser }> => {
    const res = await api.put(`/users/${id}`, { user: data });
    return res.data;
  },

  updateRole: async (
    id: number,
    payload: { preset?: 'admin' | 'sales' | 'cs' | 'marketing'; role?: string; department?: string }
  ): Promise<{ message: string; user: ManagedUser }> => {
    const res = await api.patch(`/users/${id}/update_role`, payload);
    return res.data;
  },

  reassignCustomers: async (
    id: number,
    target_user_id: number
  ): Promise<{ message: string; transferred_count: number }> => {
    const res = await api.post(`/users/${id}/reassign_customers`, { target_user_id });
    return res.data;
  },

  delete: async (id: number, target_user_id?: number): Promise<{ message: string }> => {
    const res = await api.delete(`/users/${id}`, { params: { target_user_id } });
    return res.data;
  },
};

export default api;
