$(document).ready( ->
  module("mixin")

  # import Underscore, Backbone, and Articulation
  _ = if (typeof(require) != 'undefined') then require('underscore') else window._
  _ = _._ if _ and not _.VERSION # LEGACY
  Backbone = if (typeof(require) != 'undefined') then require('backbone') else window.Backbone
  Backbone.Articulation = if (typeof(require) != 'undefined') then require('backbone-articulation') else Backbone.Articulation

  test("TEST DEPENDENCY MISSING", ->
    ok(!!_); ok(!!Backbone); ok(!!Backbone.Articulation)
  )

  test("Standard use case", ->
    class PreExisting extends Backbone.Model
      defaults: -> {name: _.uniqueId('name')}

    Backbone.Articulation.Model.mixin(PreExisting)

    model = new PreExisting()
    result = model.toJSON()
    equal(_.size(result), 2, 'all attributes were serialized')
  )

  test("Standard use case: expected errors", ->
    # TODO
  )
)