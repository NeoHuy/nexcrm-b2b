module Api
  module V1
    class DebtTransactionsController < BaseController
      def create
        customer = Customer.find(params[:customer_id])
        transaction = customer.debt_transactions.build(transaction_params)
        transaction.user = current_user
        transaction.transaction_date ||= Date.current

        authorize transaction

        if transaction.save
          customer.reload
          render json: {
            message: "Giao dịch công nợ đã được ghi nhận thành công!",
            transaction: {
              id: transaction.id,
              transaction_type: transaction.transaction_type,
              transaction_type_label: DebtTransaction::TRANSACTION_TYPES[transaction.transaction_type],
              amount: transaction.amount.to_f,
              transaction_date: transaction.transaction_date,
              reference_code: transaction.reference_code,
              note: transaction.note,
              created_at: transaction.created_at,
              user: { id: current_user.id, name: current_user.name }
            },
            customer: {
              id: customer.id,
              current_debt: customer.current_debt.to_f,
              credit_utilization: customer.credit_utilization,
              debt_status: customer.debt_status,
              debt_badge: customer.debt_badge
            }
          }, status: :created
        else
          render json: { errors: transaction.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def transaction_params
        params.require(:debt_transaction).permit(:transaction_type, :amount, :transaction_date, :reference_code, :note)
      end
    end
  end
end
