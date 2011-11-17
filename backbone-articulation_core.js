//     Backbone-Articulation.js 0.3.0
//     (c) 2011 Kevin Malakoff.
//     Backbone-Articulation may be freely distributed under the MIT license.

(function() {

// Requires Backbone.js and Underscore.js
if (!_) alert("Missing Underscore.js");
if (!Backbone) alert("Missing Backbone.js");

// JSON-Serialize.js (JSON.serialize, JSON.deserialize).
if (!JSON.SERIALIZE_VERSION) alert("Missing json-serialize.js");
if (JSON.SERIALIZE_VERSION!=='1.0.0') alert("json-serialize.js needs to be at version 1.0.0 or higher");

// Lifecycle.js (LC.own, LC.disown).
if (!LC) alert("Missing lifecycle.js");
if (LC.VERSION!=='1.0.0') alert("lifecycle.js needs to be at version 1.0.0 or higher");

this.Backbone.Articulation || (Backbone.Articulation = {});
Backbone.Articulation.VERSION = '0.3.0';

// setting - if you set to true, you must provide String.prototype.underscore and String.prototype.singularize (for example, from inflection.js)
// Note: this is not guaranteed to work unless Class.constructor.name exists
Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE = false;

// Converts all of its models to plain old JSON (if needed) using JSON.serialize.
Backbone.Collection.prototype.toJSON = function() {
  var models_as_JSON = [];
  for (var i = 0, l = this.models.length; i < l; i++) {
    models_as_JSON.push(this.models[i].toJSON());
  }
  return models_as_JSON;
};

// Articulations all of its model attributes from plain old JSON to objects (if needed) using JSON.deserialize.
// JSON.deserialize looks for a \_type attribute to find a fromJSON method.
Backbone.Collection.prototype.parse = function(resp, xhr) {
  if (!resp || (!_.isArray(resp))) return resp;
  var articulated_model_attributes = [];
  var model_resp;
  for (var i = 0, l = resp.length; i < l; i++) {
    articulated_model_attributes.push(JSON.deserialize(resp[i], { skip_type_field: true }));
  }

  return articulated_model_attributes;
};

// Converts a model attributes from objects to plain old JSON (if needed).
Backbone.Model.prototype.toJSON = function() {
  var json = JSON.serialize(this.attributes, { properties:true });

  // ensure there is a type field
  if (!json.hasOwnProperty(JSON.deserialize.TYPE_FIELD)) {
    // use the type field
    if (this.hasOwnProperty(JSON.deserialize.TYPE_FIELD)) { json[JSON.deserialize.TYPE_FIELD] = this[JSON.deserialize.TYPE_FIELD]; return json; }

    // use the class name
    var class_name = Object.getPrototypeOf(Object(this)).constructor.name;
    if (class_name) {
      // convert the class using an underscore and singularize convention, eg. CouchDB "type" field convention
      if (Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE) {
        if (!String.prototype.underscore) throw new Error("Missing String.prototype.underscore");
        else if (!String.prototype.singularize) throw new Error("Missing String.prototype.singularize");
        json[JSON.deserialize.TYPE_FIELD] = class_name.underscore().singularize();
      }
      else { json[JSON.deserialize.TYPE_FIELD] = class_name; }
    }
  }

  return json;
};

// Converts a model attributes from plain old JSON to objects (if needed).
Backbone.Model.prototype.parse = function(resp, xhr) {
  if (!resp) return resp;
  return JSON.deserialize(resp, { properties:true, skip_type_field:true });
};

// Uses LC.own to clone(), retain(), or just stores a reference to an articulated attribute object (if needed).
Backbone.Model.prototype._ownAttribute = function(key, value) {
  if (!value) return;
  if ((value instanceof Backbone.Model) || (value instanceof Backbone.Collection)) return value; // Backbone.Model has incompatible destroy (DELETE on server)
  if (_.isArray(value) && value.length && ((value[0] instanceof Backbone.Model) || (value[0] instanceof Backbone.Collection))) return value; // Backbone.Model has incompatible destroy (DELETE on server)
  return LC.own(value);
};

// Uses LC.disown to destroy() or release() to an attribute object (if needed).
Backbone.Model.prototype._disownAttribute = function(key, value) {
  if (!value) return;
  if ((value instanceof Backbone.Model) || (value instanceof Backbone.Collection)) return value; // Backbone.Model has incompatible destroy (DELETE on server)
  if (_.isArray(value) && value.length && ((value[0] instanceof Backbone.Model) || (value[0] instanceof Backbone.Collection))) return value; // Backbone.Model has incompatible destroy (DELETE on server)
  return LC.disown(value);
};

//////////////////////////
// Backbone.Model Monkey Patches
//////////////////////////
var _native_bbmod_initialize = Backbone.Model.prototype.initialize;
Backbone.Model.prototype.initialize = function() {
  var result = _native_bbmod_initialize.apply(this, arguments);
  for (var key in this._previousAttributes) {
    this._previousAttributes[key] = this._ownAttribute(key, this._previousAttributes[key]);
  }
  return result;
};

var _native_bbmod_set = Backbone.Model.prototype.set;
Backbone.Model.prototype.set = function(attrs, options) {
  if (!attrs) return this;
  if (attrs.attributes) attrs = attrs.attributes;

  // if an atrribute changes, release the previous since it will get replaced
  for (var key in attrs) {
    if (_.isEqual(this.attributes[key], attrs[key])) continue;
    if (this._previousAttributes && (this._previousAttributes.hasOwnProperty(key))) {
      this._disownAttribute(key, this._previousAttributes[key]);
    }
  }
  return _native_bbmod_set.apply(this, arguments);
};

var _native_bbmod_unset = Backbone.Model.prototype.unset;
Backbone.Model.prototype.unset = function(attr, options) {
  if (!(attr in this.attributes)) return this;

  // if an attribute is unset, disown it
  this._disownAttribute(attr, this.attributes[attr]);

  return _native_bbmod_unset.apply(this, arguments);
};

var _native_bbmod_clear = Backbone.Model.prototype.clear;
Backbone.Model.prototype.clear = function(options) {
  // release attributes and previous attributes
  for (var key in this.attributes) {
    this._disownAttribute(key, this.attributes[key]);
  }
  // if is it not silent, it will call change which will clear previous attributes
  if (options && options.silent) {
    for (key in this._previousAttributes) {
      this._disownAttribute(key, this._previousAttributes[key]);
    }
  }

  return _native_bbmod_clear.apply(this, arguments);
};

var _native_bbmod_change = Backbone.Model.prototype.change;
Backbone.Model.prototype.change = function(options) {
  // disown the previous attributes
  for (var key in this._previousAttributes) {
    this._disownAttribute(key, this._previousAttributes[key]);
  }

  var result = _native_bbmod_change.apply(this, arguments);

  // own the new previous attributes
  for (key in this._previousAttributes) {
    this._previousAttributes[key] = this._ownAttribute(key, this._previousAttributes[key]);
  }
  return result;
};

//////////////////////////
// Backbone.Collection Monkey Patches
//////////////////////////
var _native_bbcol_reset = Backbone.Collection.prototype._reset;
Backbone.Collection.prototype._reset = function() {
  // memory clean up
  if (this.models && this.models.length) {
    if (Backbone.Relational) {
      _.each(this.models, function(model) { Backbone.Relational.store.unregister(model); model.clear({silent: true}); });
    }
    else {
      _.each(this.models, function(model) { model.clear({silent: true}); });
    }
  }
  return _native_bbcol_reset.apply(this, arguments);
};

var _native_bbmod_model_event = Backbone.Collection.prototype._onModelEvent;
Backbone.Collection.prototype._onModelEvent = function(ev, model, collection, options) {
  if (ev == 'destroy') {
    for (var key in this._previousAttributes) {
      this._disownAttribute(key, this._previousAttributes[key]);
    }
    for (key in this.attributes) {
      this._disownAttribute(key, this.attributes[key]);
    }
  }
  return _native_bbmod_model_event.apply(this, arguments);
};

//////////////////////////
// Backbone.Relational Monkey Patches
//////////////////////////
if (!!Backbone.RelationalModel) {
  Backbone.RelationalModel.prototype.toJSON = function() {
    // If this Model has already been fully serialized in this branch once, return to avoid loops
    if ( this.isLocked() ) {
      return this.id;
    }

    this.acquire();
    var json = Backbone.Model.prototype.toJSON.call( this );
    _.each( this._relations, function( rel ) {
        var value = json[ rel.key ];

        if ( rel.options.includeInJSON === true && value && (typeof( value ) === 'object')) {
          json[ rel.key ] = _.isFunction( value.toJSON ) ? value.toJSON() : value;
        }
        else if ( _.isString( rel.options.includeInJSON ) ) {
          if ( !value ) {
            json[ rel.key ] = null;
          }
          else if ( value instanceof Backbone.Collection ) {
            json[ rel.key ] = value.pluck( rel.options.includeInJSON );
          }
          else if ( value instanceof Backbone.Model ) {
            json[ rel.key ] = value.get( rel.options.includeInJSON );
          }
          // POD array (serialized collection)
          else if ( _.isArray(value) ) {
            json[ rel.key ] = [];
            _.each( value, function(model_json, index) { if (!_.isUndefined(model_json)) json[ rel.key ].push(model_json[rel.options.includeInJSON]); });
          }
          // POD object (serialized model)
          else if (value instanceof Object) {
            json[ rel.key ] = value[rel.options.includeInJSON];
          }
        }
        else {
          delete json[ rel.key ];
        }
      }, this);

    this.release();
    return json;
  };
}
})();