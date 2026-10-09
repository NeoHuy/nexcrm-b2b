class CreateActivities < ActiveRecord::Migration[7.1]
  def change
    create_table :activities do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :activity_type, null: false # call, meeting, email, demo, support, debt_reminder, note
      t.string :title, null: false
      t.text :content
      t.datetime :occurred_at, default: -> { 'CURRENT_TIMESTAMP' }
      t.datetime :next_follow_up_at

      t.timestamps
    end
  end
end
