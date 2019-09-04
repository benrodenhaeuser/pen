require './app.rb'
require 'rack/ssl'

if ENV['RACK_ENV'] == 'production'
   use Rack::SSL
end

use Rack::Deflater
run Sinatra::Application
