class Activity < ApplicationRecord
  belongs_to :customer
  belongs_to :user

  ACTIVITY_TYPES = {
    "call" => { label: "Cuộc gọi", label_en: "Phone Call", label_ja: "電話ヒアリング", color: "blue", icon: "phone" },
    "meeting" => { label: "Cuộc họp / Demo", label_en: "Meeting / Demo", label_ja: "商談・デモ", color: "indigo", icon: "users" },
    "email" => { label: "Email trao đổi", label_en: "Email", label_ja: "メール連絡", color: "sky", icon: "mail" },
    "support" => { label: "Hỗ trợ kỹ thuật / CS", label_en: "CS / Tech Support", label_ja: "技術サポート・CS", color: "emerald", icon: "life-buoy" },
    "debt_reminder" => { label: "Nhắc công nợ", label_en: "Payment Reminder", label_ja: "支払督促", color: "rose", icon: "bell-ring" },
    "note" => { label: "Ghi chú nội bộ", label_en: "Internal Note", label_ja: "社内メモ", color: "amber", icon: "file-text" }
  }.freeze

  validates :activity_type, presence: true, inclusion: { in: ACTIVITY_TYPES.keys }
  validates :title, presence: true

  def type_info
    info = ACTIVITY_TYPES[activity_type]
    return { label: activity_type.to_s.humanize, color: "slate", icon: "check" } unless info

    lbl = case I18n.locale
          when :en then info[:label_en]
          when :ja then info[:label_ja]
          else info[:label]
          end
    { label: lbl, color: info[:color], icon: info[:icon] }
  end
end
