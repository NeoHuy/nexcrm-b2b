class DebtsController < ApplicationController
  def index
    @filter = params[:filter] || "all"
    
    customers = Customer.with_debt.includes(:assigned_user)

    case @filter
    when "overdue"
      customers = customers.overdue_debts
    when "due_soon"
      customers = customers.due_soon_debts
    end

    @customers = customers.order(current_debt: :desc)
    
    @total_debt = Customer.sum(:current_debt)
    @overdue_debt = Customer.overdue_debts.sum(:current_debt)
    @due_soon_debt = Customer.due_soon_debts.sum(:current_debt)
    @overdue_count = Customer.overdue_debts.count
  end
end
