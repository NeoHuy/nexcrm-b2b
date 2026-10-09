class CreateDebtTransactions < ActiveRecord::Migration[7.1]
  def change
    create_table :debt_transactions do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :transaction_type, null: false # invoice (tăng nợ), payment (trả bớt nợ), adjustment
      t.decimal :amount, precision: 15, scale: 2, null: false
      t.date :transaction_date, null: false
      t.string :reference_code # Mã hóa đơn / phiếu thu
      t.text :note

      t.timestamps
    end
  end
end
