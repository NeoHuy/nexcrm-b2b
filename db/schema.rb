ActiveRecord::Schema[8.0].define(version: 2026_10_09_000004) do
  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", null: false
    t.string "title"
    t.string "phone"
    t.string "department"
    t.string "avatar_color", default: "indigo"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "customers", force: :cascade do |t|
    t.string "company_name", null: false
    t.string "tax_code"
    t.string "industry"
    t.string "company_size"
    t.string "tier", default: "standard"
    t.string "status", default: "active"
    t.string "website"
    t.string "address"
    t.string "city"
    t.string "contact_name"
    t.string "contact_title"
    t.string "contact_phone"
    t.string "contact_email"
    t.string "lead_source"
    t.decimal "total_revenue", precision: 15, scale: 2, default: "0.0"
    t.decimal "current_debt", precision: 15, scale: 2, default: "0.0"
    t.decimal "credit_limit", precision: 15, scale: 2, default: "0.0"
    t.date "payment_due_date"
    t.integer "assigned_user_id"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["assigned_user_id"], name: "index_customers_on_assigned_user_id"
    t.index ["company_name"], name: "index_customers_on_company_name"
    t.index ["industry"], name: "index_customers_on_industry"
    t.index ["status"], name: "index_customers_on_status"
    t.index ["tax_code"], name: "index_customers_on_tax_code"
    t.index ["tier"], name: "index_customers_on_tier"
  end

  create_table "activities", force: :cascade do |t|
    t.integer "customer_id", null: false
    t.integer "user_id", null: false
    t.string "activity_type", null: false
    t.string "title", null: false
    t.text "content"
    t.datetime "occurred_at"
    t.datetime "next_follow_up_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["customer_id"], name: "index_activities_on_customer_id"
    t.index ["user_id"], name: "index_activities_on_user_id"
  end

  create_table "debt_transactions", force: :cascade do |t|
    t.integer "customer_id", null: false
    t.integer "user_id", null: false
    t.string "transaction_type", null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.date "transaction_date", null: false
    t.string "reference_code"
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["customer_id"], name: "index_debt_transactions_on_customer_id"
    t.index ["user_id"], name: "index_debt_transactions_on_user_id"
  end

  add_foreign_key "customers", "users", column: "assigned_user_id"
  add_foreign_key "activities", "customers"
  add_foreign_key "activities", "users"
  add_foreign_key "debt_transactions", "customers"
  add_foreign_key "debt_transactions", "users"
end
