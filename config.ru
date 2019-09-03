require './app.rb'
use Rack::Deflater
run Sinatra::Application
