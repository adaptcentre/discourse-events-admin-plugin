# name: adapt-events-admin-plugin
# about: Plugin that enables admins to organise discourse based events
# version: 0.0.1
# authors: Ivan Bacher ivan.bacher@adaptcentre.ie

add_admin_route 'events_admin_plugin.title', 'events-admin'

Discourse::Application.routes.append do
  get '/admin/plugins/events-admin' => 'admin/plugins#index', constraints: StaffConstraint.new
end


enabled_site_setting :events_admin_plugin_enabled


register_asset "javascripts/third-party/async-2.6.2.min.js"
#register_asset "javascripts/third-party/moment-2.24.0.min.js"
#register_asset "javascripts/third-party/countdown-2.6.0.min.js"
#register_asset "javascripts/third-party/moment-countdown.min.js"
register_asset "stylesheets/gridlex.min.css"
register_asset "stylesheets/main.scss"

register_svg_icon "lock" if respond_to?(:register_svg_icon)
register_svg_icon "lock-open" if respond_to?(:register_svg_icon)
register_svg_icon "arrow-left" if respond_to?(:register_svg_icon)
register_svg_icon "arrow-right" if respond_to?(:register_svg_icon)
