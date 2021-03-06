module.exports =
  library_core:
    join: 'backbone-articulation.js'
    wrapper: 'src/module-loader.js'
    compress: true
    files: 'src/backbone-articulation.coffee'
    _build:
      commands: [
        'cp backbone-articulation.js packages/npm/backbone-articulation.js'
        'cp backbone-articulation.min.js packages/npm/backbone-articulation.min.js'
        'cp README.md packages/npm/README.md'
        'cp backbone-articulation.js packages/nuget/Content/Scripts/backbone-articulation.js'
        'cp backbone-articulation.min.js packages/nuget/Content/Scripts/backbone-articulation.min.js'
      ]

  library_backbone_relational:
    output: 'lib'
    join: 'backbone-articulation-backbone-relational.js'
    wrapper: 'src/backbone-relational/module-loader.js'
    compress: true
    files: 'src/backbone-relational/backbone-articulation-backbone-relational.coffee'
    _build:
      commands: [
        'cp lib/backbone-articulation-backbone-relational.js packages/npm/lib/backbone-articulation-backbone-relational.js'
        'cp lib/backbone-articulation-backbone-relational.min.js packages/npm/lib/backbone-articulation-backbone-relational.min.js'
        'cp lib/backbone-articulation-backbone-relational.js packages/nuget/Content/Scripts/lib/backbone-articulation-backbone-relational.js'
        'cp lib/backbone-articulation-backbone-relational.min.js packages/nuget/Content/Scripts/lib/backbone-articulation-backbone-relational.min.js'
      ]

  tests:
    _build:
      output: 'build'
      directories: [
        'test/core'
        'test/backbone-relational'
        'test/mixin'
      ]
      commands: [
        'mbundle test/packaging/bundle-config.coffee'
        'mbundle test/lodash/bundle-config.coffee'
      ]
    _test:
      command: 'phantomjs'
      runner: 'phantomjs-qunit-runner.js'
      files: ['**/*.html']
      directories: [
        'test/core'
        'test/backbone-relational'
        'test/mixin'
        'test/packaging'
        'test/lodash'
      ]

  _postinstall:
    commands: [
      'cp -v underscore vendor/underscore.js'
      'cp -v backbone vendor/backbone.js'
      'cp -v backbone-relational vendor/optional/backbone-relational.js'
      'cp -v json-serialize vendor/json-serialize.js'
      'cp -v lifecycle vendor/lifecycle.js'
      'cp -v lodash vendor/optional/lodash.js'
      'uglifyjs -o vendor/optional/lodash-1.1.1.min.js vendor/optional/lodash-1.1.1.js'
#        'cp -v lodash/lodash.min.js vendor/optional/lodash.min.js' # packaged lodash.min.js doesn't concatenate properly
    ]