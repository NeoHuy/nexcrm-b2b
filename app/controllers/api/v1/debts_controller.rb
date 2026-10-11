module Api
  module V1
    class DebtsController < BaseController
      def index
        filter = params[:filter] || "all"

        customers = Customer.with_debt.includes(:assigned_user)

        case filter
        when "overdue"
          customers = customers.overdue_debts
        when "due_soon"
          customers = customers.due_soon_debts
        end

        customers = customers.order(current_debt: :desc)

        total_debt = Customer.sum(:current_debt).to_f
        overdue_debt = Customer.overdue_debts.sum(:current_debt).to_f
        due_soon_debt = Customer.due_soon_debts.sum(:current_debt).to_f
        overdue_count = Customer.overdue_debts.count

        serialized_customers = customers.map do |c|
          {
            id: c.id,
            company_name: c.company_name,
            tax_code: c.tax_code,
            contact_name: c.contact_name,
            contact_phone: c.contact_phone,
            current_debt: c.current_debt.to_f,
            credit_limit: c.credit_limit.to_f,
            payment_due_date: c.payment_due_date,
            overdue: c.overdue?,
            days_overdue: c.days_overdue,
            due_soon: c.due_soon?,
            credit_utilization: c.credit_utilization,
            debt_status: c.debt_status,
            debt_badge: c.debt_badge,
            assigned_user: c.assigned_user ? {
              id: c.assigned_user.id,
              name: c.assigned_user.name,
              department: c.assigned_user.department,
              role_label: c.assigned_user.role_label
            } : nil
          }
        end

        render json: {
          customers: serialized_customers,
          stats: {
            total_debt: total_debt,
            overdue_debt: overdue_debt,
            due_soon_debt: due_soon_debt,
            overdue_count: overdue_count
          }
        }
      end
    end
  end
end
