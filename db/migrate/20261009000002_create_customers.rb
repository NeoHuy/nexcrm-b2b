class CreateCustomers < ActiveRecord::Migration[7.1]
  def change
    create_table :customers do |t|
      t.string :company_name, null: false
      t.string :tax_code
      t.string :industry
      t.string :company_size
      t.string :tier, default: "standard"
      t.string :status, default: "active"
      t.string :website
      t.string :address
      t.string :city
      t.string :contact_name
      t.string :contact_title
      t.string :contact_phone
      t.string :contact_email
      t.string :lead_source
      t.decimal :total_revenue, precision: 15, scale: 2, default: 0
      t.decimal :current_debt, precision: 15, scale: 2, default: 0
      t.decimal :credit_limit, precision: 15, scale: 2, default: 0
      t.date :payment_due_date
      t.references :assigned_user, foreign_key: { to_table: :users }, null: true
      t.text :notes

      t.timestamps
    end

    add_index :customers, :company_name
    add_index :customers, :tax_code
    add_index :customers, :status
    add_index :customers, :tier
    add_index :customers, :industry
  end
end
