class AddPolicyToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :policy_code, :string, default: "no_access", null: false
    add_column :users, :policy_permissions, :json, default: {}, null: false
  end
end
