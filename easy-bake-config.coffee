module.exports =
  library_core:
    join: 'backbone-articulation.js'
    compress: true
    files: 'src/backbone-articulation.coffee'
    modes:
      build:
        commands: [
          'cp backbone-articulation.js packages/npm/backbone-articulation.js'
          'cp backbone-articulation.min.js packages/npm/backbone-articulation.min.js'
          'cp backbone-articulation.js packages/nuget/Content/Scripts/backbone-articulation.js'
          'cp backbone-articulation.min.js packages/nuget/Content/Scripts/backbone-articulation.min.js'
        ]

  library_backbone_relational:
    output: 'lib'
    join: 'backbone-articulation-backbone-relational.js'
    compress: true
    files: 'src/backbone-articulation-backbone-relational.coffee'
    modes:
      build:
        commands: [
          'cp lib/backbone-articulation-backbone-relational.js packages/npm/lib/backbone-articulation-backbone-relational.js'
          'cp lib/backbone-articulation-backbone-relational.min.js packages/npm/lib/backbone-articulation-backbone-relational.min.js'
          'cp lib/backbone-articulation-backbone-relational.js packages/nuget/Content/Scripts/lib/backbone-articulation-backbone-relational.js'
          'cp lib/backbone-articulation-backbone-relational.min.js packages/nuget/Content/Scripts/lib/backbone-articulation-backbone-relational.min.js'
        ]

  tests:
    output: 'build'
    directories: [
      'test/core'
      'test/backbone-relational'
      'test/mixin'
      'test/packaging'
      'test/lodash'
    ]
    modes:
      build:
        bundles:
          'test/packaging/build/bundle-latest.js':
            underscore: 'underscore'
            backbone: 'backbone'
            'backbone-relational': 'backbone-relational'
            'json-serialize': 'json-serialize'
            lifecycle: 'lifecycle'
            'backbone-articulation': 'backbone-articulation.js'
            'backbone-articulation-backbone-relational': 'lib/backbone-articulation-backbone-relational.js'
            _publish:
              underscore: '_'
              backbone: 'Backbone'

          'test/packaging/build/bundle-legacy.js':
            underscore: 'vendor/underscore-1.1.7.js'
            backbone: 'vendor/backbone-0.5.1.js'
            'backbone-relational': 'vendor/backbone-relational-0.4.0.js'
            'json-serialize': 'json-serialize'
            lifecycle: 'lifecycle'
            'backbone-articulation': 'backbone-articulation.js'
            'backbone-articulation-backbone-relational': 'lib/backbone-articulation-backbone-relational.js'
            _publish:
              underscore: '_'
              backbone: 'Backbone'

          'test/lodash/build/bundle-lodash.js':
            lodash: 'vendor/lodash-0.3.2.js'
            backbone: 'backbone'
            'backbone-relational': 'backbone-relational'
            'json-serialize': 'json-serialize'
            lifecycle: 'lifecycle'
            'backbone-articulation': 'backbone-articulation.js'
            'backbone-articulation-backbone-relational': 'lib/backbone-articulation-backbone-relational.js'
            _publish:
              lodash: '_'
              backbone: 'Backbone'

        no_files_ok: 'test/packaging'
      test:
        command: 'phantomjs'
        runner: 'phantomjs-qunit-runner.js'
        files: ['**/*.html']

  postinstall:
    commands: [
      'cp underscore vendor/underscore-latest.js'
      'cp backbone vendor/backbone-latest.js'
      'cp backbone-relational vendor/backbone-relational-latest.js'
      'cp json-serialize vendor/json-serialize-latest.js'
      'cp lifecycle vendor/lifecycle-latest.js'
    ]