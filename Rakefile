require 'rubygems'
require 'closure-compiler'
PROJECT_ROOT = File.expand_path('..', __FILE__)

HEADER = /((^\s*\/\/.*\n)+)/
def minimize(source_filename, destination_filename)
  source  = File.read(source_filename)
  min     = Closure::Compiler.new.compress(source)
  File.open(destination_filename, 'w') do |file|
    file.write min
  end
end

def transfer_header(source_filename, destination_filename)
  source      = File.read(source_filename)
  comment_block = source.match(HEADER)
  return if not comment_block
  destination = File.read(destination_filename)
  File.open(destination_filename, 'w+') do |file|
    file.write comment_block[1].squeeze(' ') + destination
  end
end

def minimize_with_header(source_filename, destination_filename)
  minimize(source_filename, destination_filename)
  transfer_header(source_filename, destination_filename)
end

# Check for the existence of an executable.
def check(exec, name, url)
  return unless `which #{exec}`.empty?
  puts "#{name} not found.\nInstall it from #{url}"
  exit
end

desc "Use the Closure Compiler to compress Backbone-Articulation.js"
task :build do
  minimize_with_header('backbone-articulation_core.js', 'backbone-articulation_core.min.js')
end

desc "build the docco documentation"
task :doc do
  check 'docco', 'docco', 'https://github.com/jashkenas/docco'
  system 'docco backbone-articulation_core.js'
end

desc "check and build"
task :package do
  begin
    system "jsl -nofilelisting -nologo -conf docs/jsl.conf -process backbone-articulation_core.js"
    minimize_with_header('backbone-articulation_core.js', 'backbone-articulation_core.min.js')
    check 'docco', 'docco', 'https://github.com/jashkenas/docco'
    system 'docco backbone-articulation_core.js'
    fork { exec "jammit -c config/assets.yaml -o #{PROJECT_ROOT}" }
    Process.waitall
    minimize('backbone-articulation.js', 'backbone-articulation.min.js')
    ['dependencies/bundled/lifecycle.js', 'dependencies/bundled/json-serialize.js', 'backbone-articulation_core.js'].each{|value| transfer_header(value, 'backbone-articulation.min.js')}
    transfer_header('backbone-articulation_core.js', 'backbone-articulation.js')
  end
end

desc "run JavaScriptLint on the source"
task :lint do
  system "jsl -nofilelisting -nologo -conf docs/jsl.conf -process backbone-articulation_core.js"
end