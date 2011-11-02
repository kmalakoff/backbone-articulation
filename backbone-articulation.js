//     Backbone-Articulation.js 0.1.1
//     (c) 2011 Kevin Malakoff.
//     Backbone-Articulation may be freely distributed under the MIT license.

// Requires Backbone.js with Backbone.Model implementation of
if (!Backbone) alert("Missing Backbone.js");
if (!Backbone.HAS_ATTRIBUTE_OWNERSHIP) alert("Please upgrade Backbone to a version with attribute ownership");

// Requires Underscore.js and Underscore-Awesomer.js (_.parseJSON, _.keypathValueOwner, _.toJSON, _.own, and _.disown).
if (!_) alert("Missing Underscore.js");
if (!_.AWESOMENESS) alert("Missing Underscore-Awesomer.js");
if (_.AWESOMENESS!=='1.0.1') alert("Underscore-Awesomer.js needs to be at version 1.0.1 or higher");

this.Backbone.Articulation || (Backbone.Articulation = {});
Backbone.Articulation = '0.1.1';

// Converts all of its models to plain old JSON (if needed) using _.toJSON.
Backbone.Collection.prototype.toJSON = function() {
  var models_as_JSON = [];
  for (var i = 0, l = this.models.length; i < l; i++) {
    models_as_JSON.push(this.models[i].toJSON());
  }
  return models_as_JSON;
};

// Articulations all of its model attributes from plain old JSON to objects (if needed) using _.parseJSON.
// _.parseJSON looks for a \_type attribute to find a parseJSON method.
Backbone.Collection.prototype.parse = function(resp, xhr) {
  if (!resp || (!_.isArray(resp))) return resp;
  var articulated_model_attributes = [];
  var model_resp;
  for (var i = 0, l = resp.length; i < l; i++) {
    model_resp = resp[i];
    if (model_resp.hasOwnProperty(_.PARSE_JSON_TYPE_FIELD)) {
      model_resp = _.clone(model_resp);
      delete model_resp[_.PARSE_JSON_TYPE_FIELD];
    }
    articulated_model_attributes.push(_.parseJSON(model_resp, { properties:true }));
  }

  return articulated_model_attributes;
};

// Converts a model attributes from objects to plain old JSON (if needed).
Backbone.Model.prototype.toJSON = function() {
  var json = _.toJSON(this.attributes, { properties:true });

  // ensure there is a type field
  if (!json.hasOwnProperty(_.PARSE_JSON_TYPE_FIELD)) {
    // use the type field
    if (this.hasOwnProperty(_.PARSE_JSON_TYPE_FIELD)) {
      json[_.PARSE_JSON_TYPE_FIELD] = this[_.PARSE_JSON_TYPE_FIELD];
    }
    // convert the class using an underscore and singularize convention
    else if (String.prototype.underscore) {
      json[_.PARSE_JSON_TYPE_FIELD] = _.classOf(this).underscore().singularize();
    }
  }

  return json;
};

// Converts a model attributes from plain old JSON to objects (if needed).
Backbone.Model.prototype.parse = function(resp, xhr) {
  if (!resp) return resp;
  return _.parseJSON(resp, { properties:true, skip_type:true });
};

// Uses _.own to clone(), retain(), or just stores a reference to an articulated attribute object (if needed).
Backbone.Model.prototype._ownAttribute = function(key, value) {
  if (!value) return;
  if ((value instanceof Backbone.Model) || (value instanceof Backbone.Collection)) return value; // Backbone.Model has incompatible destroy (DELETE on server)
  if (_.isArray(value) && value.length && ((value[0] instanceof Backbone.Model) || (value[0] instanceof Backbone.Collection))) return value; // Backbone.Model has incompatible destroy (DELETE on server)
  return _.own(value);
};

// Uses _.disown to destroy() or release() to an attribute object (if needed).
Backbone.Model.prototype._disownAttribute = function(key, value) {
  if (!value) return;
  if ((value instanceof Backbone.Model) || (value instanceof Backbone.Collection)) return value; // Backbone.Model has incompatible destroy (DELETE on server)
  if (_.isArray(value) && value.length && ((value[0] instanceof Backbone.Model) || (value[0] instanceof Backbone.Collection))) return value; // Backbone.Model has incompatible destroy (DELETE on server)
  return _.disown(value);
};