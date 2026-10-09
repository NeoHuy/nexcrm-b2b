class Activity < ApplicationRecord
  belongs_to :customer
  belongs_to :user

  ACTIVITY_TYPES = {
    "call" => { label: "Cuộc gọi", color: "blue", icon: "phone" },
    "meeting" => { label: "Cuộc họp / Demo", color: "indigo", icon: "users" },
    "email" => { label: "Email trao đổi", color: "sky", icon: "mail" },
    "support" => { label: "Hỗ trợ kỹ thuật / CS", color: "emerald", icon: "life-buoy" },
    "debt_reminder" => { label: "Nhắc công nợ", color: "rose", icon: "bell-ring" },
    "note" => { label: "Ghi chú nội bộ", color: "amber", icon: "file-text" }
  }.freeze

  validates :activity_type, presence: true, inclusion: { in: ACTIVITY_TYPES.keys }
  validates :title, presence: true

  def type_info
    ACTIVITY_TYPES[activity_type] || { label: activity_type.humanize, color: "slate", icon: "check" }
  end
end
