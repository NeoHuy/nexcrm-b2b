class DashboardController < ApplicationController
  def index
    @total_customers = Customer.count
    @total_revenue = Customer.sum(:total_revenue)
    @total_debt = Customer.sum(:current_debt)
    @overdue_customers = Customer.overdue_debts
    @due_soon_customers = Customer.due_soon_debts
    @at_risk_customers = Customer.where(status: "at_risk")

    @recent_activities = Activity.includes(:customer, :user).order(created_at: :desc).limit(8)
    @recent_customers = Customer.includes(:assigned_user).order(created_at: :desc).limit(6)

    # Role-specific data
    if current_user.sales?
      @my_customers = current_user.assigned_customers
      @my_pipeline_count = @my_customers.where(status: %w[lead prospect]).count
      @my_active_count = @my_customers.where(status: "active").count
      @my_debt = @my_customers.sum(:current_debt)
    elsif current_user.cs?
      @cs_urgent_debts = Customer.overdue_debts.order(payment_due_date: :asc).limit(5)
      @cs_at_risk = Customer.where(status: "at_risk").limit(5)
      @recent_support_tickets = Activity.where(activity_type: %w[support debt_reminder]).includes(:customer, :user).limit(5)
    elsif current_user.marketing?
      @industry_breakdown = Customer.group(:industry).count
      @source_breakdown = Customer.group(:lead_source).count
      @status_breakdown = Customer.group(:status).count
    end
  end
end
