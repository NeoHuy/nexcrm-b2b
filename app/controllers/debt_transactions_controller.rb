class DebtTransactionsController < ApplicationController
  def create
    @customer = Customer.find(params[:customer_id])
    @transaction = @customer.debt_transactions.build(debt_transaction_params)
    @transaction.user = current_user
    @transaction.transaction_date ||= Date.current

    authorize @transaction

    if @transaction.save
      flash[:notice] = "Đã cập nhật công nợ thành công! (#{DebtTransaction::TRANSACTION_TYPES[@transaction.transaction_type]}: #{format_vnd(@transaction.amount)})"
    else
      flash[:alert] = "Lỗi ghi nhận công nợ: #{@transaction.errors.full_messages.join(', ')}"
    end

    redirect_to customer_path(@customer)
  end

  private

  def debt_transaction_params
    params.require(:debt_transaction).permit(:transaction_type, :amount, :transaction_date, :reference_code, :note)
  end
end
