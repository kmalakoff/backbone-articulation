// Backbone-Articulation.js 0.1.0
// (c) 2011 Kevin Malakoff.
// Backbone-Articulation may be freely distributed under the MIT license.

// Requires Backbone.js with Backbone.Model implementation of
Backbone||alert("Missing Backbone.js");Backbone.HAS_ATTRIBUTE_OWNERSHIP||alert("Please upgrade Backbone to a version with attribute ownership");_||alert("Missing Underscore.js");_.AWESOMENESS||alert("Missing Underscore-Awesomer.js");this.Backbone.Articulation||(Backbone.Articulation={});Backbone.Articulation="0.1.0";Backbone.Collection.prototype.toJSON=function(){for(var a=[],b=0,c=this.models.length;b<c;b++)a.push(this.models[b].toJSON());return a};
Backbone.Collection.prototype.parse=function(a){if(!a||!_.isArray(a))return a;for(var b=[],c=0,d=a.length;c<d;c++)b.push(_.parseJSON(a[c],{properties:!0}));return b};Backbone.Model.prototype.toJSON=function(){return _.toJSON(this.attributes,{properties:!0})};Backbone.Model.prototype.parse=function(a){return!a?a:_.parseJSON(a,{properties:!0})};Backbone.Model.prototype._ownAttribute=function(a,b){return!b?void 0:_.own(b)};Backbone.Model.prototype._disownAttribute=function(a,b){return!b?void 0:_.disown(b)};
