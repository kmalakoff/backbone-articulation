###
  Backbone-Articulation.js 0.3.1
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
Backbone.Articulation.VERSION = '0.3.1'

# setting - if you set to true, you must provide String.prototype.underscore and String.prototype.singularize (for example, from inflection.js)
# Note: this is not guaranteed to work unless Class.constructor.name exists
Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE = false

# Converts all of its models to plain old JSON (if needed) using JSONS.serialize.
Backbone.Collection::toJSON = ->
  models_as_JSON = []
  models_as_JSON.push(model.toJSON()) for model in @models
  return models_as_JSON

# Articulations all of its model attributes from plain old JSON to objects (if needed) using JSONS.
# JSONS looks for a \_type attribute to find a fromJSON method.
Backbone.Collection::parse = (resp, xhr) ->
  return resp unless (resp and _.isArray(resp))
  articulated_model_attributes = []
  articulated_model_attributes.push JSONS.deserialize(model_resp, skip_type_field: true) for model_resp in resp
  return articulated_model_attributes

# Converts a model attributes from objects to plain old JSON (if needed).
Backbone.Model::toJSON = ->
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
Backbone.Model::parse = (resp, xhr) ->
  return resp unless resp
  return JSONS.deserialize( resp, {properties: true, skip_type_field: true})

# Uses LC.own to clone(), retain(), or just stores a reference to an articulated attribute object (if needed).
Backbone.Model::_ownAttribute = (key, value) ->
  return unless value
  return value if (value instanceof Backbone.Model) or (value instanceof Backbone.Collection)
  return value if _.isArray(value) and value.length and (value[0] instanceof Backbone.Model) or (value[0] instanceof Backbone.Collection)
  LC.own(value)

# Uses LC.disown to destroy() or release() to an attribute object (if needed).
Backbone.Model::_disownAttribute = (key, value) ->
  return unless value
  return value if (value instanceof Backbone.Model) or (value instanceof Backbone.Collection)
  return value if _.isArray(value) and value.length and (value[0] instanceof Backbone.Model) or (value[0] instanceof Backbone.Collection)
  LC.disown(value)

##########################
# Backbone.Model Monkey Patches
##########################
_native_bbmod_initialize = Backbone.Model::initialize
Backbone.Model::initialize = ->
  result = _native_bbmod_initialize.apply(this, arguments)
  for key of @_previousAttributes
    @_previousAttributes[key] = @_ownAttribute(key, @_previousAttributes[key])
  result

_native_bbmod_set = Backbone.Model::set
Backbone.Model::set = (attrs, options) ->
  return this unless attrs
  attrs = attrs.attributes if attrs.attributes

  # if an attribute changes, release the previous since it will get replaced
  for key of attrs
    continue if _.isEqual(@attributes[key], attrs[key])
    @_disownAttribute(key, @_previousAttributes[key]) if @_previousAttributes and (@_previousAttributes.hasOwnProperty(key))
  _native_bbmod_set.apply(this, arguments)

_native_bbmod_unset = Backbone.Model::unset
Backbone.Model::unset = (attr, options) ->
  return this unless attr of @attributes
  @_disownAttribute(attr, @attributes[attr]) # if an attribute is unset, disown it
  _native_bbmod_unset.apply(this, arguments)

_native_bbmod_clear = Backbone.Model::clear
Backbone.Model::clear = (options) ->
  # release attributes and previous attributes
  for key of @attributes
    @_disownAttribute key, @attributes[key]
  # if is it not silent, it will call change which will clear previous attributes
  if options and options.silent
    for key of @_previousAttributes
      @_disownAttribute(key, @_previousAttributes[key])
  _native_bbmod_clear.apply(this, arguments)

_native_bbmod_change = Backbone.Model::change
Backbone.Model::change = (options) ->
  # disown the previous attributes
  for key of @_previousAttributes
    @_disownAttribute key, @_previousAttributes[key]
  result = _native_bbmod_change.apply(this, arguments)

  # own the new previous attributes
  for key of @_previousAttributes
    @_previousAttributes[key] = @_ownAttribute(key, @_previousAttributes[key])
  return result

_native_bbcol_reset = Backbone.Collection::_reset
Backbone.Collection::_reset = ->
  # memory clean up
  if @models and @models.length
    if Backbone.Relational and (@models[0] instanceof Backbone.RelationalModel)
      for model in @models
        Backbone.Relational.store.unregister(model)
        model.clear({silent: true})
    else
      for model in @models
        model.clear({silent: true})
  _native_bbcol_reset.apply(this, arguments)

_native_bbmod_model_event = Backbone.Collection::_onModelEvent
Backbone.Collection::_onModelEvent = (ev, model, collection, options) ->
  if ev is "destroy"
    for key of @_previousAttributes
      @_disownAttribute key, @_previousAttributes[key]
    for key of @attributes
      @_disownAttribute key, @attributes[key]
  _native_bbmod_model_event.apply this, arguments

##########################
# Backbone.Relational Monkey Patches
##########################
if !!Backbone.RelationalModel
  Backbone.RelationalModel::toJSON = ->
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