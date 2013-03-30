module("mixin")

# import Underscore (or Lo-Dash with precedence), Backbone, and Articulation
_ = if not window._ and (typeof(require) != 'undefined') then require('underscore') else window._
_ = _._ if _ and (_.hasOwnProperty('_')) # LEGACY
Backbone = if not window.Backbone and (typeof(require) != 'undefined') then require('backbone') else window.Backbone
Backbone.Articulation = if not Backbone.Articulation and (typeof(require) != 'undefined') then require('backbone-articulation') else Backbone.Articulation

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