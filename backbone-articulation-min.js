// Backbone-Articulation.js 0.1.0
// (c) 2011 Kevin Malakoff.
// Backbone-Articulation may be freely distributed under the MIT license.

// Requires Backbone.js with Backbone.Model implementation of
Backbone||alert("Missing Backbone.js");Backbone.HAS_ATTRIBUTE_OWNERSHIP||alert("Please upgrade Backbone to a version with attribute ownership");_||alert("Missing Underscore.js");_.AWESOMENESS||alert("Missing Underscore-Awesomer.js");this.Backbone.Articulation||(Backbone.Articulation={});Backbone.Articulation="0.1.0";Backbone.Collection.prototype.toJSON=function(){for(var b=[],a=0,c=this.models.length;a<c;a++)b.push(this.models[a].toJSON());return b};
Backbone.Collection.prototype.parse=function(b){if(!b||!_.isArray(b))return b;for(var a=[],c=0,d=b.length;c<d;c++)a.push(_.parseJSON(b[c],{properties:!0}));return a};Backbone.Model.prototype.toJSON=function(){return _.toJSON(this.attributes,{properties:!0})};Backbone.Model.prototype.parse=function(b){return!b?b:_.parseJSON(b,{properties:!0})};Backbone.Model.prototype._ownAttribute=function(b,a){if(a)return a instanceof Backbone.Model||a instanceof Backbone.Collection?a:_.own(a)};
Backbone.Model.prototype._disownAttribute=function(b,a){if(a)return a instanceof Backbone.Model||a instanceof Backbone.Collection?a:_.disown(a)};
