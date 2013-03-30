try
  require.config({
    paths:
      'underscore': "../../vendor/underscore-1.4.4",
      'backbone': "../../vendor/backbone-1.0.0",
      'json-serialize': "../../vendor/json-serialize-1.1.2",
      'lifecycle': "../../vendor/lifecycle-1.0.2",
      'backbone-relational': "../../vendor/optional/backbone-relational-0.8.0plus",
      'backbone-articulation': "../../backbone-articulation",
      'backbone-articulation-backbone-relational': "../../lib/backbone-articulation-backbone-relational"
    shim:
      underscore:
        exports: '_'
      backbone:
        exports: 'Backbone'
        deps: ['underscore']
      'backbone-relational':
        deps: ['backbone']
      'backbone-articulation-backbone-relational':
        deps: ['backbone-relational']
  })

  # library and dependencies
  require ['underscore', 'backbone', 'backbone-articulation', 'backbone-relational', 'backbone-articulation-backbone-relational', 'qunit_test_runner'], (_, Backbone, Articulation, bbr, abbr, runner) ->
    window._ = window.Backbone = null # force each test to require dependencies synchronously
    require ['./build/test'], -> runner.start()

catch error
  alert("AMD tests failed: '#{error}'")