module.exports =
  'test/lodash/build/bundle-lodash.js':
    lodash: 'vendor/optional/lodash-1.1.1.js'
    backbone: 'backbone'
    'backbone-relational': 'backbone-relational'
    'json-serialize': 'json-serialize'
    lifecycle: 'lifecycle'
    'backbone-articulation': 'backbone-articulation.js'
    'backbone-articulation-backbone-relational': 'lib/backbone-articulation-backbone-relational.js'
    _publish:
      _: 'lodash'
      Backbone: 'backbone'
    _alias:
      underscore: 'lodash'
