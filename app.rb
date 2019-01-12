require 'sinatra'
require 'sinatra/json'
require "sinatra/reloader" if development?
require 'mongo'
require 'bson'

Mongo::Logger.logger.level = ::Logger::ERROR

configure do
  client = Mongo::Client.new(['127.0.0.1:27017'], :database => 'test')
  set :db, client.database
end

before do
  content_type :json
end

get '/' do
  content_type :html
  File.read(File.join('public', 'index.html'))
end

get '/collections' do
  settings.db.collection_names.to_json
end

get '/projects' do
  settings.db[:projects].find.to_a.to_json
end

# CREATE
post '/projects/' do
  project = JSON.parse(request.body.read)
  puts "_id of project posted: " + project['_id'].to_s
  settings.db[:projects].insert_one(project)
  settings.db[:projects].find('_id' => project['_id']).first.to_json
end

# READ
get '/projects/:_id' do
  settings.db[:projects].find('_id' => params['_id']).first.to_json
end

# UPDATE
put '/projects/:_id' do
  project_id = params['_id']
  new_data = JSON.parse(request.body.read)
  settings.db[:projects].find('_id' => project['_id']).update_one(new_data)
end

# DELETE
delete '/projects/:id' do

end
