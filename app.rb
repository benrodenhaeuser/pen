require 'sinatra'
require 'sinatra/json'
require "sinatra/reloader" if development?
require 'mongo'
require 'bson'

Mongo::Logger.logger.level = ::Logger::ERROR # ??

configure do
  client = Mongo::Client.new(['127.0.0.1:27017'], :database => 'test')
  set :db, client.database
end

get '/' do
  File.read(File.join('public', 'index.html'))
end

get '/collections' do
  content_type :json
  settings.db.collection_names.to_json
end

get '/people' do
  content_type :json
  settings.db[:people].find.to_a.to_json
end

get '/projects/:id' do
  # read project from db
  content_type :json
  settings.db[:projects].find do |document|
    document._id == params[:id]
  end
end

post '/projects' do
  # save new project to db
end

put '/projects/:id' do
  # update project
end
