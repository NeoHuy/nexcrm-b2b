export interface UserPermissions {
  can_create_customer: boolean;
  can_edit_customer: boolean;
  can_delete_customer: boolean;
  can_create_debt: boolean;
  can_manage_users?: boolean;
  is_admin: boolean;
  is_sales: boolean;
  is_cs: boolean;
  is_marketing: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department?: 'sales' | 'cs' | 'marketing' | 'management';
  department_label?: string;
  title?: string;
  phone?: string;
  avatar_color?: string;
  role_label: string;
  badge_class: string;
  permissions?: UserPermissions;
}

export interface ManagedUser extends User {
  role_preset: 'admin' | 'sales' | 'cs' | 'marketing';
  customers_count: number;
  total_managed_debt: number;
  total_managed_revenue: number;
  activities_count: number;
  is_current_user: boolean;
  created_at: string;
  updated_at: string;
  permissions: UserPermissions;
}

export interface UserStats {
  total_users: number;
  admin_count: number;
  sales_count: number;
  cs_count: number;
  marketing_count: number;
}

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  role_label: string;
  badge_class: string;
}

export interface Customer {
  id: number;
  company_name: string;
  tax_code?: string;
  industry?: string;
  company_size?: string;
  employee_count_range?: string;
  status: 'lead' | 'prospect' | 'active' | 'at_risk' | 'inactive';
  status_label: string;
  status_badge: { label: string; class: string };
  tier: 'standard' | 'silver' | 'gold' | 'vip';
  tier_label: string;
  tier_badge: { label: string; class: string };
  contact_name?: string;
  contact_title?: string;
  contact_phone?: string;
  contact_email?: string;
  current_debt: number;
  credit_limit: number;
  payment_due_date?: string;
  overdue: boolean;
  days_overdue: number;
  due_soon: boolean;
  debt_status: 'settled' | 'overdue' | 'due_soon' | 'in_term';
  debt_badge?: { label: string; class: string };
  credit_utilization: number;
  website?: string;
  address?: string;
  city?: string;
  lead_source?: string;
  total_revenue?: number;
  notes?: string;
  assigned_user?: {
    id: number;
    name: string;
    department?: string;
    role_label?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  title: string;
  activity_type: string;
  type_info: { label: string; color: string; icon: string };
  content?: string;
  occurred_at: string;
  next_follow_up_at?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
  customer?: {
    id: number;
    company_name: string;
  };
}

export interface DebtTransaction {
  id: number;
  transaction_type: 'invoice' | 'payment' | 'adjustment';
  transaction_type_label: string;
  amount: number;
  transaction_date: string;
  reference_code?: string;
  note?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface DashboardStats {
  total_customers: number;
  total_revenue: number;
  total_debt: number;
  overdue_customers_count: number;
  due_soon_customers_count: number;
  at_risk_customers_count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_activities: Activity[];
  recent_customers: Customer[];
  role_data: {
    urgent_debts?: Customer[];
    at_risk?: Customer[];
    recent_support_tickets?: Array<{
      id: number;
      title: string;
      activity_type: string;
      customer_name: string;
      user_name?: string;
      created_at: string;
    }>;
    industry_breakdown?: Record<string, number>;
    source_breakdown?: Record<string, number>;
    status_breakdown?: Record<string, number>;
    my_pipeline_count?: number;
    my_active_count?: number;
    my_debt?: number;
    my_customers?: Customer[];
  };
}

export interface CustomerMeta {
  statuses: Record<string, string>;
  tiers: Record<string, string>;
  industries: string[];
  lead_sources: string[];
  users: Array<{ id: number; name: string; department?: string; role_label: string }>;
}
