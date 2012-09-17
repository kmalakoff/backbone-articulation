class window.CloneDestroy
  @instance_count = 0

  constructor: ->
    CloneDestroy.instance_count++

  toJSON: ->
    _type: "CloneDestroy"

  @fromJSON: (obj) ->
    return null unless obj._type is "CloneDestroy"
    return new CloneDestroy()

  clone: ->
    return new CloneDestroy()

  destroy: ->
    CloneDestroy.instance_count--

$(document).ready( ->
  module("Backbone.Articulation.Collection")

  # import Underscore (or Lo-Dash with precedence), Backbone, Knockout, and Knockback
  _ = if not window._ and (typeof(require) isnt 'undefined') then require('underscore') else window._
  _ = _._ if _ and _.hasOwnProperty('_') # LEGACY
  Backbone = if not window.Backbone and (typeof(require) isnt 'undefined') then require('backbone') else window.Backbone
  Backbone.Articulation = if not Backbone.Articulation and (typeof(require) isnt 'undefined') then require('backbone-articulation') else Backbone.Articulation
  JSONS = if not window.JSONS and (typeof(require) isnt 'undefined') then require('json-serialize') else window.JSONS

  test("TEST DEPENDENCY MISSING", ->
    ok(!!_, '_'); ok(!!Backbone, 'Backbone'); ok(!!Backbone.Articulation, 'Backbone.Articulation'); ok(!!JSONS, 'JSONS')
  )

  class window.SomeModel extends Backbone.Articulation.Model
    @_type = "SomeModel"

  test("Collection: serialize", ->
    CloneDestroy.instance_count=0
    collection = new Backbone.Articulation.Collection()
    model_attributes = {attr1: {_type:'CloneDestroy'}, attr2: {_type:'CloneDestroy'}, attr3: {_type:'CloneDestroy'}}
    models_as_JSON = []; i=0

    while i < 3
      models_as_JSON.push(_.extend({id: i}, model_attributes))
      i++

    collection.add(collection.parse(models_as_JSON))
    equal(collection.models.length, 3, '3 models')
    equal(CloneDestroy.instance_count, 3*(collection.models.length*2), '3 models with three instances in their attributes and previous attributes')

    collection.reset()
    equal(CloneDestroy.instance_count, 0, '0 models with zero instances')
  )

  test("Collection: deserialize", ->
    CloneDestroy.instance_count=0
    collection = new Backbone.Articulation.Collection()
    collection.add(new Backbone.Articulation.Model({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    collection.add(new Backbone.Articulation.Model({id: 1, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    collection.add(new Backbone.Articulation.Model({id: 2, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))

    equal(collection.models.length, 3, '3 models')
    equal(CloneDestroy.instance_count, 3*(collection.models.length*2), '3 models with three instances in their attributes and previous attributes')

    models_as_JSON = collection.toJSON(); models_as_JSON.shift()
    collection2 = new Backbone.Articulation.Collection()
    collection2.add(collection2.parse(models_as_JSON))
    equal(collection2.models.length, 2, '2 models')
    equal(CloneDestroy.instance_count, 3*2*(collection.models.length+collection2.models.length), '5 models with three instances in their attributes and previous attributes')

    collection.reset(); collection2.reset()
    equal(CloneDestroy.instance_count, 0, '0 models with zero instances')
  )

  test("Collection: type from model prototype", ->
    collection = new Backbone.Articulation.Collection()
    collection.add(new SomeModel({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))

    models_as_JSON = collection.toJSON()
    equal(models_as_JSON[0]._type, 'SomeModel', "type is SomeModel as expected")
  )

  test("Collection: Articulation.TYPE_UNDERSCORE_SINGULARIZE", ->
    Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE = true
    JSONS.TYPE_FIELD = "type"

    collection = new Backbone.Articulation.Collection()
    collection.add(new SomeModel({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))

    equal(collection.models.length, 1, '1 model')
    raises((-> collection.toJSON()), null, "Missing String.prototype.underscore")
    String::underscore = -> return new String("some_model")
    raises((-> collection.toJSON()), null, "Missing String.prototype.singularize")
    String::singularize = -> return new String("some_model")

    models_as_JSON = collection.toJSON()
    equal(models_as_JSON[0].type, 'some_model', "type is some_model as expected")

    # return to defaults
    Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE = false
    JSONS.TYPE_FIELD = "_type"
  )
)