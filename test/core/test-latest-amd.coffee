try
  require.config({
    paths:
      'underscore': "../../vendor/underscore-1.4.4",
      'backbone': "../../vendor/backbone-1.0.0",
      'json-serialize': "../../vendor/json-serialize-1.1.2",
      'lifecycle': "../../vendor/lifecycle-1.0.2",
      'backbone-articulation': "../../backbone-articulation"
    shim:
      underscore:
        exports: '_'
      backbone:
        exports: 'Backbone'
        deps: ['underscore']
  })

  # library and dependencies
  require ['underscore', 'backbone', 'backbone-articulation', 'qunit_test_runner'], (_, Backbone, Articulation, runner) ->
    window._ = window.Backbone = null # force each test to require dependencies synchronously
    require ['./build/test-collection', './build/test-model'], -> runner.start()

catch error
  alert("AMD tests failed: '#{error}'")