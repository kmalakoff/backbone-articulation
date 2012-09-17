Date::isEqual = (that) -> return (@valueOf() == that.valueOf())

window.SomeNamespace or= {}
class SomeNamespace.SomeClass
  constructor: (int_value, string_value, date_value) ->
    @int_value = int_value
    @string_value = string_value
    @date_value = date_value

  toJSON: ->
    return {
      _type: 'SomeNamespace.SomeClass'
      int_value: @int_value
      string_value: @string_value
      date_value: JSONS.serialize(@date_value)
    }

  @fromJSON: (obj) ->
    return null if (obj._type!='SomeNamespace.SomeClass')
    return new SomeClass(obj.int_value, obj.string_value, JSONS.deserialize(obj.date_value))

  isEqual: (that) ->
    if (!that)
      return false
    else if (that instanceof SomeClass)
      return ((@int_value is that.int_value) and (@string_value is that.string_value) and _.isEqual(@date_value, that.date_value))
    else
      this_JSON = @toJSON()
      return _.isEqual(this_JSON, that)
    return false

$(->
  module("backbone-articulation")

  # library and dependencies
  require(['underscore', 'backbone', 'backbone-articulation', 'json-serialize'], (_, Backbone, Articulation, JSONS) ->
    _ or= @_; Backbone or= @Backbone # get underscore and backbone from the global namespace

    test("TEST DEPENDENCY MISSING", ->
      ok(!!_, '_'); ok(!!Backbone, 'Backbone'); ok(!!Backbone.Articulation, 'Backbone.Articulation'); ok(!!JSONS, 'JSONS')
    )

    int_value = 123456; string_value = 'Hello'; date_value = new Date()
    attrs = {
      id      : 'test_model',
      name    : 'testy',
      a_class: {
        _type         : 'SomeNamespace.SomeClass',
        int_value     : int_value,
        string_value  : string_value,
        date_value    : JSONS.serialize(date_value)
      }
    }

    test("Model: deserialize from JSON", ->
      model = new Backbone.Articulation.Model()

      result = model.parse(attrs); model.set(result)
      equal(_.size(model.attributes), 3, 'all attributes were deserialized')
      result = model.get('a_class')
      ok(result instanceof SomeNamespace.SomeClass, 'SomeNamespace.SomeClass deserialized as a class')
      ok(_.isEqual(result.toJSON(), attrs.a_class), 'SomeNamespace.SomeClass deserialized correctly')
      ok(result.date_value instanceof Date, 'SomeNamespace.SomeClass date_value deserialized as a Date')
      ok(_.isEqual(JSONS.serialize(result.date_value), attrs.a_class.date_value), 'SomeNamespace.SomeClass date_value deserialized correctly')
    )

    test("Model: serialize to JSON", ->
      model = new Backbone.Articulation.Model()
      model.set({_type:'SomeNamespace.SomeClass', id: 'test_model', name: 'testy'})
      instance = new SomeNamespace.SomeClass(int_value, string_value, date_value)
      model.set({a_class: instance})

      result = model.toJSON()
      equal(_.size(result), 4, 'all attributes were serialized')
      result = result.a_class
      ok(_.isEqual(result, attrs.a_class), 'SomeNamespace.SomeClass serialized correctly')
      ok(_.isEqual(result.date_value, attrs.a_class.date_value), 'SomeNamespace.SomeClass date_value serialized correctly')
    )

    test("Model: memory management clone() and destroy()", ->
      class window.CloneDestroy
        @instance_count = 0
        constructor: -> CloneDestroy.instance_count++

        toJSON: -> return { _type:'CloneDestroy' }
        @fromJSON: (obj) ->
          return null if (obj._type!='CloneDestroy')
          return new CloneDestroy()

        clone: -> return new CloneDestroy()
        destroy: -> CloneDestroy.instance_count--

      attributes = {id: 'superstar', attr1: {_type:'CloneDestroy'}, attr2: {_type:'CloneDestroy'}, attr3: {_type:'CloneDestroy'}}
      model = new Backbone.Articulation.Model()
      instance = new CloneDestroy()

      equal(CloneDestroy.instance_count, 1, '1 referenced instance')
      deserialized_attributes = model.parse(attributes)
      model.set(deserialized_attributes)
      LC.disown(deserialized_attributes, {properties:true}); deserialized_attributes = null
      equal(CloneDestroy.instance_count, 7, '1 referenced instance + 3 in attributes + 3 in previous attributes')
      model.set({attr1: 1})
      equal(CloneDestroy.instance_count, 5, '1 referenced instance + 2 in attributes + 2 in previous attributes')
      model.clear()
      equal(CloneDestroy.instance_count, 1, '1 referenced instance')
    )

    test("Model: memory management retain() and release()", ->
      class window.RetainRelease
        @retain_count = 0
        constructor: -> RetainRelease.retain_count++
        @fromJSON: (obj) ->
          return null if (obj._type!='RetainRelease')
          return new RetainRelease()

        retain: ->
          RetainRelease.retain_count++
          @

        release: ->
          RetainRelease.retain_count--
          @

      attributes = {id: 'superstar', attr1: {_type:'RetainRelease'}, attr2: {_type:'RetainRelease'}, attr3: {_type:'RetainRelease'}}
      model = new Backbone.Articulation.Model()
      instance = new RetainRelease()

      equal(RetainRelease.retain_count, 1, '1 referenced instance')
      deserialized_attributes = model.parse(attributes)
      model.set(deserialized_attributes)
      LC.disown(deserialized_attributes, {properties:true}); deserialized_attributes = null
      equal(RetainRelease.retain_count, 7, '1 referenced instance + 3 in attributes + 3 in previous attributes')
      model.set({attr1: 1})
      equal(RetainRelease.retain_count, 5, '1 referenced instance + 2 in attributes + 2 in previous attributes')
      model.clear()
      equal(RetainRelease.retain_count, 1, '1 referenced instance')
    )
  )
)