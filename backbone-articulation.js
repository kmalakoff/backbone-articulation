//     Backbone-Articulation.js 0.1.0
//     (c) 2011 Kevin Malakoff.
//     Backbone-Articulation may be freely distributed under the MIT license.

// Requires Backbone.js with Backbone.Model implementation of
if (!Backbone) alert("Missing Backbone.js");
if (!Backbone.HAS_ATTRIBUTE_OWNERSHIP) alert("Please upgrade Backbone to a version with attribute ownership");

// Requires Underscore.js with _.parseJSON, _.keypathValueOwner, _.toJSON, _.own, and _.disown.
if (!_) alert("Missing Underscore.js");
if (!_.parseJSON || !_.keypathValueOwner || !_.toJSON) alert("Please upgrade Underscore to a version with _.parseJSON, _.keypathValueOwner and _.toJSON");
if (!_.own || !_.disown) alert("Please upgrade Underscore to a version with _.own and _.disown");

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
  for (var i = 0, l = resp.length; i < l; i++) {
    articulated_model_attributes.push(_.parseJSON(resp[i], { properties: true }));
  }
  return articulated_model_attributes;
};

// Converts a model attributes from objects to plain old JSON (if needed).
Backbone.Model.prototype.toJSON = function() {
  return _.toJSON(this.attributes, { properties:true });
};

// Converts a model attributes from plain old JSON to objects (if needed).
Backbone.Model.prototype.parse = function(resp, xhr) {
  if (!resp) return resp;
  return _.parseJSON(resp, { properties:true });
};

// Uses _.own to clone(), retain(), or just stores a reference to an articulated attribute object (if needed).
Backbone.Model.prototype._ownAttribute = function(key, value) {
  if (!value) return;
  return _.own(value);
};

// Uses _.disown to destroy() or release() to an attribute object (if needed).
Backbone.Model.prototype._disownAttribute = function(key, value) {
  if (!value) return;
  return _.disown(value);
};