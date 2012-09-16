###
  backbone-articulation-backbone-relational.js 0.3.4
  (c) 2011, 2012 Kevin Malakoff - http://kmalakoff.github.com/backbone-articulation/
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Dependencies: Backbone.js, and Underscore.js.
###

# import Underscore (or Lo-Dash with precedence), Backbone, Backbone Articultion and Backbone.Relational
_ = if not window._ and (typeof(require) isnt 'undefined') then require('underscore') else window._
_ = _._ if _ and (_.hasOwnProperty('_')) # LEGACY
Backbone = if not @Backbone and (typeof(require) != 'undefined') then require('backbone') else @Backbone
Articulation = if not @Backbone.Articulation and (typeof(require) != 'undefined') then require('backbone-articulation') else @Backbone.Articulation
require('backbone-relational') if (typeof(require) != 'undefined')

# export Articulation namespace
module.exports = Articulation if (typeof(exports) != 'undefined')

##########################
# Articulation.RelationalModel
##########################
Articulation.BackboneRelationalModel = Backbone.RelationalModel.extend({
  toJSON: ->
    # If this Model has already been fully serialized in this branch once, return to avoid loops
    return @id if @isLocked()
    @acquire()
    json = if @__bba_toJSON then @__bba_toJSON.call(this) else (throw 'Articulation.RelationalModel is not configured correctly')
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
    (Relational.Relational.store.unregister(model) for model in @models) if @models
    @constructor.__super__.constructor.__super__._reset.apply(this, arguments)
})

# add Articulation.Model into Articulation.RelationalModel
Articulation.Model.mixin(Articulation.BackboneRelationalModel)

##########################
# Articulation.RelationalCollection
##########################
class Articulation.BackboneRelationalCollection extends Articulation.Collection
  model: Articulation.BackboneRelationalModel