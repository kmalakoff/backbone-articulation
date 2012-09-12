module.exports =
  library_core:
    join: 'backbone-articulation.js'
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
    compress: true
    files: 'src/backbone-articulation-backbone-relational.coffee'
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
      'cp underscore vendor/underscore-latest.js'
      'cp backbone vendor/backbone-latest.js'
      'cp backbone-relational vendor/backbone-relational-latest.js'
      'cp json-serialize vendor/json-serialize-latest.js'
      'cp lifecycle vendor/lifecycle-latest.js'
    ]