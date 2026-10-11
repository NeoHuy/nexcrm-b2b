module Api
  module V1
    class DashboardController < BaseController
      def index
        stats = {
          total_customers: Customer.count,
          total_revenue: Customer.sum(:total_revenue).to_f,
          total_debt: Customer.sum(:current_debt).to_f,
          overdue_customers_count: Customer.overdue_debts.count,
          due_soon_customers_count: Customer.due_soon_debts.count,
          at_risk_customers_count: Customer.where(status: "at_risk").count
        }

        recent_activities = Activity.includes(:customer, :user).order(created_at: :desc).limit(8).map do |act|
          {
            id: act.id,
            title: act.title,
            activity_type: act.activity_type,
            type_info: act.type_info,
            content: act.content,
            occurred_at: act.occurred_at,
            next_follow_up: act.next_follow_up,
            created_at: act.created_at,
            customer: {
              id: act.customer.id,
              company_name: act.customer.company_name
            },
            user: {
              id: act.user&.id,
              name: act.user&.name
            }
          }
        end

        recent_customers = Customer.includes(:assigned_user).order(created_at: :desc).limit(6).map do |c|
          serialize_customer_summary(c)
        end

        role_data = {}
        if current_user.admin?
          role_data = {
            urgent_debts: Customer.overdue_debts.order(payment_due_date: :asc).limit(5).map { |c| serialize_customer_summary(c) },
            at_risk: Customer.where(status: "at_risk").limit(5).map { |c| serialize_customer_summary(c) },
            industry_breakdown: Customer.group(:industry).count,
            source_breakdown: Customer.group(:lead_source).count,
            status_breakdown: Customer.group(:status).count
          }
        elsif current_user.sales?
          my_customers = current_user.assigned_customers
          role_data = {
            my_pipeline_count: my_customers.where(status: %w[lead prospect]).count,
            my_active_count: my_customers.where(status: "active").count,
            my_debt: my_customers.sum(:current_debt).to_f,
            my_customers: my_customers.order(created_at: :desc).limit(5).map { |c| serialize_customer_summary(c) }
          }
        elsif current_user.cs?
          role_data = {
            urgent_debts: Customer.overdue_debts.order(payment_due_date: :asc).limit(5).map { |c| serialize_customer_summary(c) },
            at_risk: Customer.where(status: "at_risk").limit(5).map { |c| serialize_customer_summary(c) },
            recent_support_tickets: Activity.where(activity_type: %w[support debt_reminder]).includes(:customer, :user).limit(5).map do |act|
              {
                id: act.id,
                title: act.title,
                activity_type: act.activity_type,
                customer_name: act.customer.company_name,
                user_name: act.user&.name,
                created_at: act.created_at
              }
            end
          }
        elsif current_user.marketing?
          role_data = {
            industry_breakdown: Customer.group(:industry).count,
            source_breakdown: Customer.group(:lead_source).count,
            status_breakdown: Customer.group(:status).count
          }
        end

        render json: {
          stats: stats,
          recent_activities: recent_activities,
          recent_customers: recent_customers,
          role_data: role_data
        }
      end

      private

      def serialize_customer_summary(c)
        {
          id: c.id,
          company_name: c.company_name,
          tax_code: c.tax_code,
          contact_name: c.contact_name,
          contact_phone: c.contact_phone,
          status: c.status,
          status_label: Customer::STATUSES[c.status] || c.status,
          tier: c.tier,
          tier_label: Customer::TIERS[c.tier] || c.tier,
          industry: c.industry,
          current_debt: c.current_debt.to_f,
          credit_limit: c.credit_limit.to_f,
          payment_due_date: c.payment_due_date,
          overdue: c.overdue?,
          days_overdue: c.days_overdue,
          due_soon: c.due_soon?,
          credit_utilization: c.credit_utilization,
          debt_badge: c.debt_badge,
          status_badge: c.status_badge,
          tier_badge: c.tier_badge,
          assigned_user: c.assigned_user ? { id: c.assigned_user.id, name: c.assigned_user.name } : nil
        }
      end
    end
  end
end
