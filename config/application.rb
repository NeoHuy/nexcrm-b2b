require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"

Bundler.require(*Rails.groups)

module SaasB2bCrm
  class Application < Rails::Application
    config.load_defaults 8.0

    config.time_zone = "Asia/Ho_Chi_Minh"
    config.i18n.default_locale = :vi
    config.i18n.available_locales = [:vi, :en, :ja]

    # Don't generate system test files
    config.generators.system_tests = nil
  end
end
