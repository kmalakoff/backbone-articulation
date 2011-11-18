// Backbone-Articulation.js 0.3.0
// (c) 2011 Kevin Malakoff.
// Backbone-Articulation may be freely distributed under the MIT license.
//
// JSON-Serialize.js 1.0.0
// (c) 2011 Kevin Malakoff.
// JSON-Serialize is freely distributable under the MIT license.
// https://github.com/kmalakoff/json-serialize
//

(function() {

this.JSON || (this.JSON = {}); // hopefully JSON is defined!
JSON.SERIALIZE_VERSION = '1.0.0';

////////////////HELPERS - BEGIN//////////////////
var isEmpty = function(obj) {
  for(var key in obj) {
    // a property, not a function
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
};

var isArray = function(obj) {
  return obj.constructor == Array;
};

var stringHasISO8601DateSignature = function(string) {
  return (string.length>=19) && (string[4] == '-') && (string[7] == '-') && (string[10] == 'T') && (string[string.length-1] == 'Z');
};

var keyPath = function(object, keypath) {
  var keypath_components = keypath.split('.');
  if (keypath_components.length===1) return ((object instanceof Object) && (object.hasOwnProperty(keypath))) ? object[keypath] : void 0; // optimization
  var key, current_object = object;
  for (var i = 0, l = keypath_components.length; i < l;) {
    key = keypath_components[i];
    if (!(key in current_object)) break;
    if (++i === l) return current_object[key];
    current_object = current_object[key];
    if (!current_object || !(current_object instanceof Object)) break;
  }
  return void 0;
};
////////////////HELPERS - END//////////////////

// Convert an array of objects or an object to JSON using the convention that if an
// object has a toJSON function, it will use it rather than the raw object.
JSON.serialize = function(obj, options) {
  // Simple type - exit quickly
  if (!obj || (typeof(obj)!=='object')) return obj;

  // use toJSON function - Note: Dates have a built in toJSON that converts them to ISO8601 UTC ("Z") strings
  if(obj.toJSON) return obj.toJSON();
  else if (isEmpty(obj)) return null;

  // serialize an array
  var result;
  if (isArray(obj)) {
    result = [];
    for (var i=0, l=obj.length; i<l;i++) { result.push(JSON.serialize(obj[i])); }
    return result;
  }

  // serialize the properties
  else {
    result = {};
    for (var key in obj) { result[key] = JSON.serialize(obj[key]); }
    return result;
  }
};

// Deserialized an array of JSON objects or each object individually using the following conventions:
// 1) if JSON has a recognized type identifier ('\_type' as default), it will try to create an instance.
// 2) if the class refered to by the type identifier has a fromJSON function, it will try to create an instance.
// <br/>**Options:**<br/>
//* `skip_type_field` - skip a type check. Useful for if your model is already deserialized and you want to deserialize your properties. See Backbone.Articulation for an example.
//* `skip_dates` - skip the automatic Date conversion check from ISO8601 string format. Useful if you want to keep your dates in string format.
// <br/>**Global settings:**<br/>
//* `JSON.deserialize.TYPE_FIELD` - the field key in the serialized JSON that is used for constructor lookup.<br/>
//* `JSON.deserialize.CONSTRUCTOR_ROOTS` - the array of roots that are used to find the constructor. Useful for reducing global namespace pollution<br/>
JSON.deserialize = function(json, options) {
  var json_type = typeof(json);

  // special checks for strings
  if (json_type==='string') {
    // The object is still a JSON string, convert to JSON
    if (json.length && ((json[0] === '{') || (json[0] === '['))) {
      try { var json_as_JSON = JSON.parse(json); if (json_as_JSON) json = json_as_JSON; }
      catch (e) {throw new TypeError("Unable to parse JSON: " + json);}
    }
    // the object looks like a Date serialized to ISO8601 UTC ("Z") format, try automatically converting
    else if (!(options && options.skip_dates) && stringHasISO8601DateSignature(json)) {
      try { var date = new Date(json); if (date) return date; }
      catch (e) {}
    }
  }

  // Simple type - exit quickly
  if ((json_type!=='object') || isEmpty(json))  return json;

  // Parse an array
  var result;
  if (isArray(json)) {
    result = [];
    for (var i=0, l=json.length; i<l;i++) { result.push(JSON.deserialize(json[i])); }
    return result;
  }

  // Parse the properties individually
  else if ((options && options.skip_type_field) || !json.hasOwnProperty(JSON.deserialize.TYPE_FIELD)) {
    result = {};
    for (var key in json) { result[key] = JSON.deserialize(json[key]); }
    return result;
  }

  // Find and use the fromJSON function
  else
  {
    var type = json[JSON.deserialize.TYPE_FIELD];
    var root, constructor_or_root, instance;

    // Try searching in the available namespaces
    for (var j=0, k=JSON.deserialize.CONSTRUCTOR_ROOTS.length; j<k;j++) {
      root = JSON.deserialize.CONSTRUCTOR_ROOTS[j];
      constructor_or_root = keyPath(root, type);
      if (!constructor_or_root) continue;

      // class/root parse function
      if (constructor_or_root.fromJSON) return constructor_or_root.fromJSON(json);
      // instance parse function (Backbone.Model and Backbone.Collection style)
      else if (constructor_or_root.prototype && constructor_or_root.prototype.parse) {
        instance = new constructor_or_root();
        if (instance.set) return instance.set(instance.parse(json));
        else return instance.parse(json);
      }
    }

    return null;
  }
};

JSON.deserialize.TYPE_FIELD = '_type';
JSON.deserialize.CONSTRUCTOR_ROOTS = [this];
})();
// Lifecycle.js 1.0.0
// (c) 2011 Kevin Malakoff.
// Lifecycle is freely distributable under the MIT license.
// https://github.com/kmalakoff/Lifecycle
//

(function() {

this.Lifecyle || (this.Lifecyle = {});
this.LC = this.Lifecyle;
LC.VERSION = '1.0.0';

////////////////HELPERS - BEGIN//////////////////
var isArray = function(obj) {
  return obj.constructor == Array;
};
////////////////HELPERS - END//////////////////

// Deduces the type of ownership of an item and if available, it retains it (reference counted) or clones it.
// <br/>**Options:**<br/>
// * `properties` - used to disambigate between owning an object and owning each property.<br/>
// * `share_collection` - used to disambigate between owning a collection's items (share) and cloning a collection (don't share).
// * `prefer_clone` - used to disambigate when both retain and clone exist. By default retain is prefered (eg. sharing for lower memory footprint).
LC.own = function(obj, options) {
  if (!obj || (typeof(obj)!='object')) return obj;
  options || (options = {});
  if (isArray(obj)) {
    var i, l = obj.length;
    if (options.share_collection) { for (i=0;i<l;i++) { LC.own(obj[i], {prefer_clone: options.prefer_clone}); } return obj; }
    else {
      var a_clone =  [];
      for (i=0;i<l;i++) { a_clone.push(LC.own(obj[i], {prefer_clone: options.prefer_clone})); }
      return a_clone;
    }
  }
  else if (options.properties) {
    if (options.share_collection) { for (key in obj) { LC.own(obj[key], {prefer_clone: options.prefer_clone}); } return obj; }
    else {
      var b_clone = {};
      for (key in obj) { b_clone[key] = LC.own(obj[key], {prefer_clone: options.prefer_clone}); }
      return b_clone;
    }
  }
  else if (obj.retain) {
    if (options.prefer_clone && obj.clone) return obj.clone();
    else obj.retain();
  }
  else if (obj.clone) return obj.clone();
  return obj;
};

// Deduces the type of ownership of an item and if available, it releases it (reference counted) or destroys it.
// <br/>**Options:**<br/>
// * `properties` - used to disambigate between owning an object and owning each property.<br/>
// * `clear_values` - used to disambigate between clearing disowned items and removing them (by default, they are removed).
// * `remove_values` - used to indicate that the values should be disowned and removed from the collections.
LC.disown = function(obj, options) {
  if (!obj || (typeof(obj)!='object')) return obj;
  options || (options = {});
  if (isArray(obj)) {
    var i, l = obj.length;
    if (options.clear_values) { for (i=0;i<l;i++) { LC.disown(obj[i], {clear_values: options.clear_values}); obj[i]=null; } }
    else {
      for (i=0;i<l;i++) { LC.disown(obj[i], {remove_values: options.remove_values}); }
      if (options.remove_values) {obj.length=0;}
    }
    return obj;
  }
  else if (options.properties) {
    var key;
    if (options.clear_values) { for (key in obj) { LC.disown(obj[key], {clear_values: options.clear_values}); obj[key]=null; } }
    else {
      for (key in obj) { LC.disown(obj[key], {remove_values: options.remove_values});}
      if (options.remove_values) {for(key in obj) { delete obj[key]; }}
    }
    return obj;
  }
  else if (obj.release) obj.release();
  else if (obj.destroy) obj.destroy();
  return obj;
};

// A simple reference counting class using Coffeescript class construction.
// Convention: implement a _destroy method with custom cleanup when reference count hits zero.
LC.RefCountable = (function() {
  function RefCountable() {
    this.ref_count = 1;
  }
  RefCountable.prototype.retain = function() {
    if (this.ref_count <= 0) {
      throw new Error("LC.RefCounting: ref_count is corrupt: " + this.ref_count);
    }
    this.ref_count++;
    return this;
  };
  RefCountable.prototype.release = function() {
    if (this.ref_count <= 0) {
      throw new Error("LC.RefCounting: ref_count is corrupt: " + this.ref_count);
    }
    this.ref_count--;
    if ((this.ref_count === 0) && this._destroy) {
      this._destroy.call(this);
    }
    return this;
  };
  RefCountable.prototype.refCount = function() {
    return this.ref_count;
  };
  return RefCountable;
})();

})();
//     Backbone-Articulation.js 0.3.0
//     (c) 2011 Kevin Malakoff.
//     Backbone-Articulation may be freely distributed under the MIT license.
//

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