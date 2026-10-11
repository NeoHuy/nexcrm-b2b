module Api
  module V1
    class DashboardController < BaseController
      def index
        unless current_user.has_any_policy_permission?
          return render json: {
            stats: {
              total_customers: 0,
              total_revenue: 0.0,
              total_debt: 0.0,
              overdue_customers_count: 0,
              due_soon_customers_count: 0,
              at_risk_customers_count: 0
            },
            recent_activities: [],
            recent_customers: [],
            role_data: {}
          }
        end

        scoped_customers = policy_scope(Customer)
        can_view_customer = CustomerPolicy.new(current_user, Customer).index?
        can_view_debt = DebtPolicy.new(current_user, :debt).index?

        stats = {
          total_customers: can_view_customer ? scoped_customers.count : 0,
          total_revenue: can_view_customer ? scoped_customers.sum(:total_revenue).to_f : 0.0,
          total_debt: can_view_debt ? scoped_customers.sum(:current_debt).to_f : 0.0,
          overdue_customers_count: can_view_debt ? scoped_customers.overdue_debts.count : 0,
          due_soon_customers_count: can_view_debt ? scoped_customers.due_soon_debts.count : 0,
          at_risk_customers_count: can_view_customer ? scoped_customers.where(status: "at_risk").count : 0
        }

        activities_scope = if !can_view_customer && !current_user.has_policy_permission?(:activity_create)
                             Activity.none
                           elsif current_user.admin? || !current_user.own_customers_only?
                             Activity.includes(:customer, :user)
                           else
                             Activity.joins(:customer).where(customers: { assigned_user_id: current_user.id }).includes(:customer, :user)
                           end

        recent_activities = activities_scope.order(created_at: :desc).limit(8).map do |act|
          {
            id: act.id,
            title: act.title,
            activity_type: act.activity_type,
            type_info: act.type_info,
            content: act.content,
            occurred_at: act.occurred_at,
            next_follow_up_at: act.next_follow_up_at,
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

        recent_customers = if can_view_customer
                             scoped_customers.includes(:assigned_user).order(created_at: :desc).limit(6).map do |c|
                               serialize_customer_summary(c)
                             end
                           else
                             []
                           end

        my_customers = can_view_customer ? current_user.assigned_customers : Customer.none
        role_data = {
          my_pipeline_count: my_customers.where(status: %w[lead prospect]).count,
          my_active_count: my_customers.where(status: "active").count,
          my_debt: can_view_debt ? my_customers.sum(:current_debt).to_f : 0.0,
          my_customers: my_customers.order(created_at: :desc).limit(5).map { |c| serialize_customer_summary(c) },
          industry_breakdown: scoped_customers.group(:industry).count,
          source_breakdown: scoped_customers.group(:lead_source).count,
          status_breakdown: scoped_customers.group(:status).count
        }

        if can_view_debt
          role_data[:urgent_debts] = scoped_customers.overdue_debts.order(payment_due_date: :asc).limit(5).map { |c| serialize_customer_summary(c) }
          role_data[:at_risk] = scoped_customers.where(status: "at_risk").limit(5).map { |c| serialize_customer_summary(c) }
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
          status_label: c.status_badge[:label],
          tier: c.tier,
          tier_label: c.tier_badge[:label],
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
