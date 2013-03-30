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

module("backbone-articulation-backbone-relational")

# import Underscore (or Lo-Dash with precedence), Backbone, Knockout, and Knockback
_ = if not window._ and (typeof(require) isnt 'undefined') then require('underscore') else window._
_ = _._ if _ and _.hasOwnProperty('_') # LEGACY
Backbone = if not window.Backbone and (typeof(require) isnt 'undefined') then require('backbone') else window.Backbone
require('backbone-relational') if (typeof(require) isnt 'undefined')
Articulation = if not Backbone.Articulation and (typeof(require) isnt 'undefined') then require('backbone-articulation') else Backbone.Articulation
require('backbone-articulation-backbone-relational') if (typeof(require) isnt 'undefined')
JSONS = if not window.JSONS and (typeof(require) isnt 'undefined') then require('json-serialize') else window.JSONS

test("TEST DEPENDENCY MISSING", ->
  ok(!!_, '_'); ok(!!Backbone, 'Backbone'); ok(!!Backbone.Articulation, 'Backbone.Articulation'); ok(!!Backbone.Articulation.BackboneRelationalModel, 'Backbone.Articulation.BackboneRelationalModel'); ok(!!JSONS, 'JSONS')
)

test("Self-Referencing Model", ->
  class SelfReferencingModel extends Articulation.BackboneRelationalModel
   relations: [{
      type: Backbone.HasMany,
      key: 'children',
      relatedModel: SelfReferencingModel,
      includeInJSON: 'id',
      reverseRelation: {
        type: Backbone.HasOne,
        key: 'parent',
        includeInJSON: 'id'
      }
    }]

  parent_model = new SelfReferencingModel({name: 'parent', id: 'parent1', resource_uri: 'srm'})
  child_model = new SelfReferencingModel({name: 'child', resource_uri: 'srm'})
  parent_model.get('children').add(child_model)
  child_model_json = child_model.toJSON()
  equal(child_model_json.parent, parent_model.get('id'), 'child serialized with parent')
  child_model.set({id: 'child1'}) # simulate coming back from the server
  parent_model_json = parent_model.toJSON()
  equal(parent_model_json.children[0], child_model.get('id'), 'parent serialized with child')
)

test("Collection: serialize", ->
  CloneDestroy.instance_count=0
  collection = new Articulation.BackboneRelationalCollection()
  model_attributes = {attr1: {_type:'CloneDestroy'}, attr2: {_type:'CloneDestroy'}, attr3: {_type:'CloneDestroy'}}
  models_as_JSON = []; i=0
  while(i<3)
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
  collection = new Articulation.BackboneRelationalCollection()
  model1 = new Articulation.BackboneRelationalModel({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()})
  model2 = new Articulation.BackboneRelationalModel({id: 1, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()})
  model3 = new Articulation.BackboneRelationalModel({id: 2, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()})

  collection.add(model1); collection.add(model2); collection.add(model3)
  equal(collection.models.length, 3, '3 models')
  equal(CloneDestroy.instance_count, 3*(collection.models.length) + 9, '3 models with three instances in their attributes and previous attributes (+ 9 Backbone.Relational does not provide a hook for proper ownership)')

  models_as_JSON = collection.toJSON(); models_as_JSON.shift()
  collection2 = new Articulation.BackboneRelationalCollection()
  collection2.add(collection2.parse(models_as_JSON))
  equal(collection2.models.length, 2, '2 models')
  equal(CloneDestroy.instance_count, 3*(collection.models.length+collection2.models.length) + 9, '5 models with three instances in their attributes and previous attributes (+ 9 Backbone.Relational does not provide a hook for proper ownership)')

  collection.reset(); collection2.reset()

  equal(CloneDestroy.instance_count, 0, '0 models with zero instances')
)