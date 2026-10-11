class DebtsController < ApplicationController
  def index
    authorize :debt, :index?

    @filter = params[:filter] || "all"

    base_scope = DebtPolicy::Scope.new(current_user, Customer).resolve
    customers = base_scope.with_debt.includes(:assigned_user)

    case @filter
    when "overdue"
      customers = customers.overdue_debts
    when "due_soon"
      customers = customers.due_soon_debts
    end

    @customers = customers.order(current_debt: :desc)

    @total_debt = base_scope.sum(:current_debt)
    @overdue_debt = base_scope.overdue_debts.sum(:current_debt)
    @due_soon_debt = base_scope.due_soon_debts.sum(:current_debt)
    @overdue_count = base_scope.overdue_debts.count
  end
end
