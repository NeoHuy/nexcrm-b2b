class CustomersController < ApplicationController
  before_action :set_customer, only: [:show, :edit, :update, :destroy]

  def index
    @query = params[:q]
    @status = params[:status]
    @industry = params[:industry]
    @debt_filter = params[:debt_filter]
    @assigned_to = params[:assigned_to]

    customers = Customer.includes(:assigned_user)
    customers = customers.search(@query) if @query.present?
    customers = customers.by_status(@status) if @status.present?
    customers = customers.by_industry(@industry) if @industry.present?
    customers = customers.by_assigned_user(@assigned_to) if @assigned_to.present?

    case @debt_filter
    when "overdue"
      customers = customers.overdue_debts
    when "due_soon"
      customers = customers.due_soon_debts
    when "has_debt"
      customers = customers.with_debt
    when "settled"
      customers = customers.where(current_debt: 0)
    end

    @customers = customers.order(created_at: :desc)

    # Statistics for filters bar
    @total_count = Customer.count
    @overdue_count = Customer.overdue_debts.count
    @has_debt_count = Customer.with_debt.count
    @total_debt_amount = Customer.sum(:current_debt)
  end

  def show
    @activities = @customer.activities.includes(:user).order(occurred_at: :desc)
    @debt_transactions = @customer.debt_transactions.includes(:user).order(transaction_date: :desc)
    @new_activity = Activity.new(customer: @customer)
    @new_debt_transaction = DebtTransaction.new(customer: @customer, transaction_date: Date.current)
  end

  def new
    @customer = Customer.new(
      status: "lead",
      tier: "standard",
      assigned_user: current_user,
      credit_limit: 50_000_000
    )
  end

  def create
    @customer = Customer.new(customer_params)
    @customer.assigned_user ||= current_user

    if @customer.save
      # Record initial activity log
      @customer.activities.create(
        user: current_user,
        activity_type: "note",
        title: "Tạo mới hồ sơ khách hàng B2B",
        content: "Khởi tạo hồ sơ doanh nghiệp #{@customer.company_name} bởi #{current_user.name} (#{current_user.role_label})"
      )
      flash[:notice] = "Đã thêm khách hàng B2B #{@customer.company_name} thành công!"
      redirect_to customer_path(@customer)
    else
      flash.now[:alert] = "Vui lòng kiểm tra lại thông tin khách hàng."
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @customer.update(customer_params)
      flash[:notice] = "Đã cập nhật thông tin #{@customer.company_name} thành công!"
      redirect_to customer_path(@customer)
    else
      flash.now[:alert] = "Không thể cập nhật thông tin."
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    company_name = @customer.company_name
    @customer.destroy
    flash[:notice] = "Đã xóa khách hàng #{company_name}."
    redirect_to customers_path
  end

  private

  def set_customer
    @customer = Customer.find(params[:id])
  end

  def customer_params
    params.require(:customer).permit(
      :company_name,
      :tax_code,
      :industry,
      :company_size,
      :tier,
      :status,
      :website,
      :address,
      :city,
      :contact_name,
      :contact_title,
      :contact_phone,
      :contact_email,
      :lead_source,
      :total_revenue,
      :current_debt,
      :credit_limit,
      :payment_due_date,
      :assigned_user_id,
      :notes
    )
  end
end
