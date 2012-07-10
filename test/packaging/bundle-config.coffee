module.exports =
  'test/packaging/build/bundle-latest.js':
    underscore: 'underscore'
    backbone: 'backbone'
    'backbone-relational': 'backbone-relational'
    'json-serialize': 'json-serialize'
    lifecycle: 'lifecycle'
    'backbone-articulation': 'backbone-articulation.js'
    'backbone-articulation-backbone-relational': 'lib/backbone-articulation-backbone-relational.js'
    _publish:
      _: 'underscore'
      Backbone: 'backbone'

  'test/packaging/build/bundle-legacy.js':
    underscore: 'vendor/underscore-1.1.7.js'
    backbone: 'vendor/backbone-0.5.1.js'
    'backbone-relational': 'vendor/backbone-relational-0.4.0.js'
    'json-serialize': 'json-serialize'
    lifecycle: 'lifecycle'
    'backbone-articulation': 'backbone-articulation.js'
    'backbone-articulation-backbone-relational': 'lib/backbone-articulation-backbone-relational.js'
    _publish:
      _: 'underscore'
      Backbone: 'backbone'