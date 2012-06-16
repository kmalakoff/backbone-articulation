###
  Backbone-Articulation.js 0.3.2
  (c) 2011, 2012 Kevin Malakoff.
  Backbone-Articulation may be freely distributed under the MIT license.
  https://github.com/kmalakoff/backbone-articulation
###

# import Underscore and Backbone
_ = if not @_ and (typeof(require) != 'undefined') then require('underscore') else @_
_ = _._ if _ and not _.VERSION # LEGACY
Backbone = if not @Backbone and (typeof(require) != 'undefined') then require('backbone') else @Backbone

# import JSON-Serialize.js (JSONS.serialize, JSONS) and Lifecycle.js (LC.own, LC.disown)
JSONS = if not @JSONS and (typeof(require) != 'undefined') then require('json-serialize') else @JSONS
LC = if not @LC and (typeof(require) != 'undefined') then require('lifecycle') else @LC

##############################################
# export or create Backbone.Articulation namespace
Backbone.Articulation = if (typeof(exports) != 'undefined') then exports else {}
Backbone.Articulation.VERSION = '0.3.2'

# setting - if you set to true, you must provide String.prototype.underscore and String.prototype.singularize (for example, from inflection.js)
# Note: this is not guaranteed to work unless Class.constructor.name exists
Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE = false

Backbone.Articulation._mixin = (target_constructor, source_constructor, source_fns) ->
  fns = _.pick(source_constructor.prototype, source_fns)

  # create a dummy super class for chaining the overridden methods
  _link_super = target_constructor.__super__.constructor
  class Link extends _link_super
    constructor: ->
      @__bba_super = _link_super
      _.extend(@, fns)
      super

  # mixin the required functions
  Link.prototype[name] = fn for name, fn of fns

  # set up the hierarchy
  target_constructor.__super__ = Link.prototype

##################################
# Backbone.Articulation.Model
##################################
class Backbone.Articulation.Model extends Backbone.Model
  @extend = Backbone.Model.extend
  __bba_super: Backbone.Model

  # Converts a model attributes from objects to plain old JSON (if needed).
  toJSON: ->
    json = JSONS.serialize(@attributes, properties: true)

    # ensure there is a type field
    return json if json.hasOwnProperty(JSONS.TYPE_FIELD)

    # use the type field
    (json[JSONS.TYPE_FIELD] = this[JSONS.TYPE_FIELD]; return json) if @hasOwnProperty(JSONS.TYPE_FIELD)

    # use the class name
    class_name = Object.getPrototypeOf(Object(this)).constructor.name
    return json unless class_name

    # convert the class using an underscore and singularize convention, eg. CouchDB "type" field convention
    if Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE
      throw 'Missing String.prototype.underscore' unless String::underscore
      throw 'Missing String.prototype.singularize' unless String::singularize
      json[JSONS.TYPE_FIELD] = class_name.underscore().singularize()
    else
      json[JSONS.TYPE_FIELD] = class_name
    return json

  # Converts a model attributes from plain old JSON to objects (if needed).
  parse: (resp, xhr) ->
    return resp unless resp
    return JSONS.deserialize( resp, {properties: true, skip_type_field: true})

  set: (attrs, options) ->
    return this unless attrs
    attrs = attrs.attributes if attrs.attributes

    # if an attribute changes, release the previous since it will get replaced
    for key, value of attrs
      continue if _.isEqual(@attributes[key], value)
      @_disownAttribute(key, @_previousAttributes[key]) if @_previousAttributes and (@_previousAttributes.hasOwnProperty(key))
      @_ownAttribute(key, value)
    @__bba_super.prototype.set.apply(this, arguments)

  unset: (attr, options) ->
    return this unless attr of @attributes
    @_disownAttribute(attr, @attributes[attr]) # if an attribute is unset, disown it
    @__bba_super.prototype.unset.apply(this, arguments)

  clear: (options) ->
    # release attributes and previous attributes
    @_disownAttribute(key, @attributes[key]) for key of @attributes

    # if is it not silent, it will call change which will clear previous attributes
    (@_disownAttribute(key, @_previousAttributes[key]) for key of @_previousAttributes) if options and options.silent
    @__bba_super.prototype.clear.apply(this, arguments)

  change: (options) ->
    # disown the previous attributes
    (@_disownAttribute key, @_previousAttributes[key]) for key of @_previousAttributes
    result = @__bba_super.prototype.change.apply(this, arguments)

    # own the new previous attributes
    (@_previousAttributes[key] = @_ownAttribute(key, @_previousAttributes[key])) for key of @_previousAttributes

    return result

  ##################################
  # Internal
  ##################################

  # Uses LC.own to clone(), retain(), or just stores a reference to an articulated attribute object (if needed).
  _ownAttribute: (key, value) ->
    return unless value
    return value if (value instanceof Backbone.Model) or (value instanceof Backbone.Collection)
    return value if _.isArray(value) and value.length and (value[0] instanceof Backbone.Model) or (value[0] instanceof Backbone.Collection)
    LC.own(value)

  _disownAllAttributes: ->


  # Uses LC.disown to destroy() or release() to an attribute object (if needed).
  _disownAttribute: (key, value) ->
    return unless value
    return value if (value instanceof Backbone.Model) or (value instanceof Backbone.Collection)
    return value if _.isArray(value) and value.length and (value[0] instanceof Backbone.Model) or (value[0] instanceof Backbone.Collection)
    LC.disown(value)

  # allows mixin of Backbone.Articulation.Model into existing hierarchies. Pass the constructor in to be mixed in.
  @mixin: (target_constructor) ->
    Backbone.Articulation._mixin(target_constructor, Backbone.Articulation.Model, ['toJSON', 'parse', 'set', 'unset', 'clear', 'change', '_ownAttribute', '_disownAttribute'])

##################################
# Backbone.Articulation.Collection
##################################
class Backbone.Articulation.Collection extends Backbone.Collection
  @extend = Backbone.Collection.extend
  __bba_super: Backbone.Collection

  model: Backbone.Articulation.Model

  # Converts all of its models to plain old JSON (if needed) using JSONS.serialize.
  toJSON: ->
    models_as_JSON = []
    models_as_JSON.push(model.toJSON()) for model in @models
    return models_as_JSON

  # Articulates all of its model attributes from plain old JSON to objects (if needed) using JSONS.
  # JSONS looks for a \_type attribute to find a fromJSON method.
  parse: (resp, xhr) ->
    return resp unless (resp and _.isArray(resp))
    articulated_model_attributes = []
    articulated_model_attributes.push JSONS.deserialize(model_resp, skip_type_field: true) for model_resp in resp
    return articulated_model_attributes

  _onModelEvent: (event, model, collection, options) ->
    if event is "destroy"
      model._disownAttribute(key, model._previousAttributes[key]) for key of model._previousAttributes
      model._disownAttribute(key, model.attributes[key]) for key of model.attributes
    @__bba_super.prototype._onModelEvent.apply(this, arguments)

  _removeReference: (model) ->
    model.clear({silent: true}) if model
    @__bba_super.prototype._removeReference.apply(this, arguments)

  # allows mixin of Backbone.Articulation.Model into existing hierarchies. Pass the constructor in to be mixed in.
  @mixin: (target_constructor) ->
    Backbone.Articulation._mixin(target_constructor, Backbone.Articulation.Collection, ['toJSON', 'parse', '_reset', '_onModelEvent'])

if (typeof(Backbone.RelationalModel) != 'undefined')
  ##########################
  # Backbone.Articulation.RelationalModel
  ##########################
  Backbone.Articulation.RelationalModel = Backbone.RelationalModel.extend({
    toJSON: ->
      # If this Model has already been fully serialized in this branch once, return to avoid loops
      return @id if @isLocked()
      @acquire()
      json = Backbone.Model::toJSON.call(this)
      for rel in @_relations
        value = json[rel.key]
        if rel.options.includeInJSON is true and value and (typeof (value) is "object")
          json[rel.key] = (if _.isFunction(value.toJSON) then value.toJSON() else value)
        else if _.isString(rel.options.includeInJSON)
          unless value
            json[rel.key] = null
          else if value instanceof Backbone.Collection
            json[rel.key] = value.pluck(rel.options.includeInJSON)
          else if value instanceof Backbone.Model
            json[rel.key] = value.get(rel.options.includeInJSON)
          # POD array (serialized collection)
          else if _.isArray(value)
            json[rel.key] = []
            for model_json, index in value
              json[rel.key].push model_json[rel.options.includeInJSON] unless _.isUndefined(model_json)
          # POD object (serialized model)
          else if value instanceof Object
            json[rel.key] = value[rel.options.includeInJSON]
        else
          delete json[rel.key]

      @release()
      return json

    _reset: ->
      # memory clean up
      (Backbone.Relational.store.unregister(model) for model in @models) if @models
      @__bba_super.prototype._reset.apply(this, arguments)
  })

  # add Backbone.Articulation.Model into Backbone.Articulation.RelationalModel
  Backbone.Articulation.Model.mixin(Backbone.Articulation.RelationalModel)

  ##########################
  # Backbone.Articulation.RelationalCollection
  ##########################
  Backbone.Articulation.RelationalCollection = Backbone.Articulation.Collection.extend({
    model: Backbone.Articulation.RelationalModel
  })

  # add Backbone.Articulation.Model into Backbone.Articulation.RelationalModel
  Backbone.Articulation.Collection.mixin(Backbone.Articulation.RelationalCollection)