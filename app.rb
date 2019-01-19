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

get '/docs' do
  settings.db[:docs].find.to_a.to_json
end

get '/ids' do
  docs = settings.db[:docs].find.to_a
  docs.map { |doc| doc['_id'] }.to_json
end

get '/docs/:_id' do
  settings.db[:docs].find('_id' => params['_id']).first.to_json
end

# upsert
post '/docs/:_id' do
  doc_id = params['_id']
  new_data = JSON.parse(request.body.read)
  settings.db[:docs].find('_id' => doc_id).update_one(new_data, upsert: true)
  status 201
end

delete '/docs/:id' do
  # TODO
end
