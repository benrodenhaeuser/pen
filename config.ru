require './app.rb'
require 'rack/ssl'

use Rack::SSL if ENV['RACK_ENV'] == 'production'
use Rack::Deflater
run Sinatra::Application
