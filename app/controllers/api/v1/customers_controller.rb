module Api
  module V1
    class CustomersController < BaseController
      before_action :set_customer, only: [:show, :update, :destroy]

      def index
        authorize Customer

        query = params[:q]
        status = params[:status]
        industry = params[:industry]
        debt_filter = params[:debt_filter]
        assigned_to = params[:assigned_to]

        customers = Customer.includes(:assigned_user)
        customers = customers.search(query) if query.present?
        customers = customers.by_status(status) if status.present?
        customers = customers.by_industry(industry) if industry.present?
        customers = customers.by_assigned_user(assigned_to) if assigned_to.present?

        case debt_filter
        when "overdue"
          customers = customers.overdue_debts
        when "due_soon"
          customers = customers.due_soon_debts
        when "has_debt"
          customers = customers.with_debt
        when "settled"
          customers = customers.where(current_debt: 0)
        end

        total_count = Customer.count
        overdue_count = Customer.overdue_debts.count
        has_debt_count = Customer.with_debt.count
        total_debt_amount = Customer.sum(:current_debt).to_f

        customers = customers.order(created_at: :desc)

        render json: {
          customers: customers.map { |c| serialize_customer(c) },
          stats: {
            total_count: total_count,
            overdue_count: overdue_count,
            has_debt_count: has_debt_count,
            total_debt_amount: total_debt_amount
          }
        }
      end

      def meta
        render json: {
          statuses: Customer::STATUSES,
          tiers: Customer::TIERS,
          industries: Customer::INDUSTRIES,
          lead_sources: Customer::LEAD_SOURCES,
          users: User.order(:name).map { |u| { id: u.id, name: u.name, department: u.department, role_label: u.role_label } }
        }
      end

      def show
        authorize @customer

        activities = @customer.activities.includes(:user).order(occurred_at: :desc).map do |act|
          {
            id: act.id,
            title: act.title,
            activity_type: act.activity_type,
            type_info: act.type_info,
            content: act.content,
            occurred_at: act.occurred_at,
            next_follow_up: act.next_follow_up,
            created_at: act.created_at,
            user: act.user ? { id: act.user.id, name: act.user.name } : nil
          }
        end

        debt_transactions = @customer.debt_transactions.includes(:user).order(transaction_date: :desc).map do |tx|
          {
            id: tx.id,
            transaction_type: tx.transaction_type,
            transaction_type_label: DebtTransaction::TRANSACTION_TYPES[tx.transaction_type],
            amount: tx.amount.to_f,
            transaction_date: tx.transaction_date,
            reference_code: tx.reference_code,
            notes: tx.notes,
            created_at: tx.created_at,
            user: tx.user ? { id: tx.user.id, name: tx.user.name } : nil
          }
        end

        pol = CustomerPolicy.new(current_user, @customer)

        render json: {
          customer: serialize_customer(@customer, detailed: true),
          activities: activities,
          debt_transactions: debt_transactions,
          permissions: {
            can_update: pol.update?,
            can_destroy: pol.destroy?,
            can_create_activity: ActivityPolicy.new(current_user, Activity).create?,
            can_create_debt_transaction: DebtTransactionPolicy.new(current_user, DebtTransaction).create?
          }
        }
      end

      def create
        authorize Customer

        customer = Customer.new(customer_params)
        customer.assigned_user ||= current_user

        if customer.save
          render json: {
            message: "Đã thêm khách hàng #{customer.company_name} thành công!",
            customer: serialize_customer(customer)
          }, status: :created
        else
          render json: { errors: customer.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @customer

        if @customer.update(customer_params)
          render json: {
            message: "Cập nhật thông tin khách hàng #{@customer.company_name} thành công!",
            customer: serialize_customer(@customer)
          }
        else
          render json: { errors: @customer.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @customer

        company_name = @customer.company_name
        @customer.destroy

        render json: { message: "Đã xóa khách hàng #{company_name} khỏi hệ thống." }
      end

      private

      def set_customer
        @customer = Customer.find(params[:id])
      end

      def customer_params
        params.require(:customer).permit(
          :company_name, :tax_code, :industry, :employee_count_range,
          :status, :tier, :website, :address, :city,
          :contact_name, :contact_title, :contact_phone, :contact_email,
          :assigned_user_id, :credit_limit, :current_debt, :payment_due_date,
          :lead_source, :total_revenue, :notes
        )
      end

      def serialize_customer(c, detailed: false)
        data = {
          id: c.id,
          company_name: c.company_name,
          tax_code: c.tax_code,
          industry: c.industry,
          employee_count_range: c.employee_count_range,
          status: c.status,
          status_label: Customer::STATUSES[c.status] || c.status,
          status_badge: c.status_badge,
          tier: c.tier,
          tier_label: Customer::TIERS[c.tier] || c.tier,
          tier_badge: c.tier_badge,
          contact_name: c.contact_name,
          contact_title: c.contact_title,
          contact_phone: c.contact_phone,
          contact_email: c.contact_email,
          current_debt: c.current_debt.to_f,
          credit_limit: c.credit_limit.to_f,
          payment_due_date: c.payment_due_date,
          overdue: c.overdue?,
          days_overdue: c.days_overdue,
          due_soon: c.due_soon?,
          debt_status: c.debt_status,
          debt_badge: c.debt_badge,
          credit_utilization: c.credit_utilization,
          assigned_user: c.assigned_user ? {
            id: c.assigned_user.id,
            name: c.assigned_user.name,
            department: c.assigned_user.department,
            role_label: c.assigned_user.role_label
          } : nil,
          created_at: c.created_at,
          updated_at: c.updated_at
        }

        if detailed
          data.merge!({
            website: c.website,
            address: c.address,
            city: c.city,
            lead_source: c.lead_source,
            total_revenue: c.total_revenue.to_f,
            notes: c.notes
          })
        end

        data
      end
    end
  end
end
