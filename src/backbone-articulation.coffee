###
  backbone-articulation.js 0.3.3
  (c) 2011, 2012 Kevin Malakoff.
  Backbone-Articulation may be freely distributed under the MIT license.
  https://github.com/kmalakoff/backbone-articulation
###

# import Underscore (or Lo-Dash with precedence) and Backbone
if (typeof(require) != 'undefined') then (try _ = require('lodash') catch e then _ = require('underscore')) else _ = @_
_ = _._ if _ and (_.hasOwnProperty('_')) # LEGACY
Backbone = if (typeof(require) != 'undefined') then require('backbone') else @Backbone
# import JSON-Serialize.js (JSONS.serialize, JSONS) and Lifecycle.js (LC.own, LC.disown)
JSONS = if (typeof(require) != 'undefined') then require('json-serialize') else @JSONS
LC = if (typeof(require) != 'undefined') then require('lifecycle') else @LC

##############################################
# export or create Articulation namespace
Backbone.Articulation = Articulation = if (typeof(exports) != 'undefined') then exports else {}
Articulation.VERSION = '0.3.3'

# setting - if you set to true, you must provide String.prototype.underscore and String.prototype.singularize (for example, from inflection.js)
# Note: this is not guaranteed to work unless Class.constructor.name exists
Articulation.TYPE_UNDERSCORE_SINGULARIZE = false

Articulation._mixin = (target_constructor, source_constructor, source_fns) ->
  fns = _.pick(source_constructor.prototype, source_fns)

  # create a dummy super class for chaining the overridden methods
  class Link extends target_constructor.__super__.constructor

  # mixin the required functions
  Link.prototype[name] = fn for name, fn of fns
  Link.prototype.__bba_super = target_constructor.__super__.constructor
  Link.prototype.__bba_toJSON = Link.prototype['toJSON']

  # set up the hierarchy
  target_constructor.prototype.__proto__ = Link.prototype
  target_constructor.__super__ = Link.prototype

##################################
# Articulation.Model
##################################
class Articulation.Model extends Backbone.Model
  @extend = Backbone.Model.extend
  __bba_super: Backbone.Model  # provide the super class to mixin functions

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
    if Articulation.TYPE_UNDERSCORE_SINGULARIZE
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

  # allows mixin of Articulation.Model into existing hierarchies. Pass the constructor in to be mixed in.
  @mixin: (target_constructor) ->
    Articulation._mixin(target_constructor, Articulation.Model, ['toJSON', 'parse', 'set', 'unset', 'clear', 'change', '_ownAttribute', '_disownAttribute'])

##################################
# Articulation.Collection
##################################
class Articulation.Collection extends Backbone.Collection
  @extend = Backbone.Collection.extend
  __bba_super: Backbone.Collection  # provide the super class to mixin functions
  model: Articulation.Model # default model type

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

  # allows mixin of Articulation.Model into existing hierarchies. Pass the constructor in to be mixed in.
  @mixin: (target_constructor) ->
    Articulation._mixin(target_constructor, Articulation.Collection, ['toJSON', 'parse', '_reset', '_onModelEvent'])