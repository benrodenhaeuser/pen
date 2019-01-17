require 'sinatra'
require 'sinatra/json'
require "sinatra/reloader" if development?
require 'mongo'
require 'bson'

Mongo::Logger.logger.level = ::Logger::ERROR

configure do
  set :public_folder, './dist'
  client = Mongo::Client.new(['127.0.0.1:27017'], :database => 'test')
  set :db, client.database
end

before do
  content_type :json
end

get '/' do
  content_type :html
  File.read(File.join('dist', 'index.html'))
end

get '/collections' do
  settings.db.collection_names.to_json
end

get '/projects' do
  settings.db[:projects].find.to_a.to_json
end

get '/ids' do
  projects = settings.db[:projects].find.to_a
  projects.map { |project| project['_id'] }.to_json
end

get '/projects/:_id' do
  settings.db[:projects].find('_id' => params['_id']).first.to_json
end

# upsert
post '/projects/:_id' do
  project_id = params['_id']
  new_data = JSON.parse(request.body.read)
  settings.db[:projects].find('_id' => project_id).update_one(new_data, upsert: true)
  status 201
end

delete '/projects/:id' do
  # TODO
end
