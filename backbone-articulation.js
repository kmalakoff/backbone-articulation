// Generated by CoffeeScript 1.3.3

/*
  backbone-articulation.js 0.3.4
  (c) 2011, 2012 Kevin Malakoff - http://kmalakoff.github.com/backbone-articulation/
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Dependencies: Backbone.js, and Underscore.js.
*/


(function() {
  var Articulation, Backbone, JSONS, LC, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (!this._ && (typeof require !== 'undefined')) {
    try {
      _ = require('lodash');
    } catch (e) {
      _ = require('underscore');
    }
  } else {
    _ = this._;
  }

  _ = _.hasOwnProperty('_') ? _._ : _;

  Backbone = !this.Backbone && (typeof require !== 'undefined') ? require('backbone') : this.Backbone;

  JSONS = !this.JSONS && (typeof require !== 'undefined') ? require('json-serialize') : this.JSONS;

  LC = !this.LC && (typeof require !== 'undefined') ? require('lifecycle') : this.LC;

  Backbone.Articulation = Articulation = typeof exports !== 'undefined' ? exports : {};

  Articulation.VERSION = '0.3.4';

  Articulation.TYPE_UNDERSCORE_SINGULARIZE = false;

  Articulation._mixin = function(target_constructor, source_constructor, source_fns) {
    var Link, fn, fns, name;
    fns = _.pick(source_constructor.prototype, source_fns);
    Link = (function(_super) {

      __extends(Link, _super);

      function Link() {
        return Link.__super__.constructor.apply(this, arguments);
      }

      return Link;

    })(target_constructor.__super__.constructor);
    for (name in fns) {
      fn = fns[name];
      Link.prototype[name] = fn;
    }
    Link.prototype.__bba_super = target_constructor.__super__.constructor;
    Link.prototype.__bba_toJSON = Link.prototype['toJSON'];
    target_constructor.prototype.__proto__ = Link.prototype;
    return target_constructor.__super__ = Link.prototype;
  };

  Articulation.Model = (function(_super) {

    __extends(Model, _super);

    function Model() {
      return Model.__super__.constructor.apply(this, arguments);
    }

    Model.extend = Backbone.Model.extend;

    Model.prototype.__bba_super = Backbone.Model;

    Model.prototype.toJSON = function() {
      var class_name, json;
      json = JSONS.serialize(this.attributes, {
        properties: true
      });
      if (json.hasOwnProperty(JSONS.TYPE_FIELD)) {
        return json;
      }
      if (this.hasOwnProperty(JSONS.TYPE_FIELD)) {
        json[JSONS.TYPE_FIELD] = this[JSONS.TYPE_FIELD];
        return json;
      }
      class_name = Object.getPrototypeOf(Object(this)).constructor.name;
      if (!class_name) {
        return json;
      }
      if (Articulation.TYPE_UNDERSCORE_SINGULARIZE) {
        if (!String.prototype.underscore) {
          throw 'Missing String.prototype.underscore';
        }
        if (!String.prototype.singularize) {
          throw 'Missing String.prototype.singularize';
        }
        json[JSONS.TYPE_FIELD] = class_name.underscore().singularize();
      } else {
        json[JSONS.TYPE_FIELD] = class_name;
      }
      return json;
    };

    Model.prototype.parse = function(resp, xhr) {
      if (!resp) {
        return resp;
      }
      return JSONS.deserialize(resp, {
        properties: true,
        skip_type_field: true
      });
    };

    Model.prototype.set = function(attrs, options) {
      var key, value;
      if (!attrs) {
        return this;
      }
      if (attrs.attributes) {
        attrs = attrs.attributes;
      }
      for (key in attrs) {
        value = attrs[key];
        if (_.isEqual(this.attributes[key], value)) {
          continue;
        }
        if (this._previousAttributes && (this._previousAttributes.hasOwnProperty(key))) {
          this._disownAttribute(key, this._previousAttributes[key]);
        }
        this._ownAttribute(key, value);
      }
      return this.__bba_super.prototype.set.apply(this, arguments);
    };

    Model.prototype.unset = function(attr, options) {
      if (!(attr in this.attributes)) {
        return this;
      }
      this._disownAttribute(attr, this.attributes[attr]);
      return this.__bba_super.prototype.unset.apply(this, arguments);
    };

    Model.prototype.clear = function(options) {
      var key;
      for (key in this.attributes) {
        this._disownAttribute(key, this.attributes[key]);
      }
      if (options && options.silent) {
        for (key in this._previousAttributes) {
          this._disownAttribute(key, this._previousAttributes[key]);
        }
      }
      return this.__bba_super.prototype.clear.apply(this, arguments);
    };

    Model.prototype.change = function(options) {
      var key, result;
      for (key in this._previousAttributes) {
        this._disownAttribute(key, this._previousAttributes[key]);
      }
      result = this.__bba_super.prototype.change.apply(this, arguments);
      for (key in this._previousAttributes) {
        this._previousAttributes[key] = this._ownAttribute(key, this._previousAttributes[key]);
      }
      return result;
    };

    Model.prototype._ownAttribute = function(key, value) {
      if (!value) {
        return;
      }
      if ((value instanceof Backbone.Model) || (value instanceof Backbone.Collection)) {
        return value;
      }
      if (_.isArray(value) && value.length && (value[0] instanceof Backbone.Model) || (value[0] instanceof Backbone.Collection)) {
        return value;
      }
      return LC.own(value);
    };

    Model.prototype._disownAllAttributes = function() {};

    Model.prototype._disownAttribute = function(key, value) {
      if (!value) {
        return;
      }
      if ((value instanceof Backbone.Model) || (value instanceof Backbone.Collection)) {
        return value;
      }
      if (_.isArray(value) && value.length && (value[0] instanceof Backbone.Model) || (value[0] instanceof Backbone.Collection)) {
        return value;
      }
      return LC.disown(value);
    };

    Model.mixin = function(target_constructor) {
      return Articulation._mixin(target_constructor, Articulation.Model, ['toJSON', 'parse', 'set', 'unset', 'clear', 'change', '_ownAttribute', '_disownAttribute']);
    };

    return Model;

  })(Backbone.Model);

  Articulation.Collection = (function(_super) {

    __extends(Collection, _super);

    function Collection() {
      return Collection.__super__.constructor.apply(this, arguments);
    }

    Collection.extend = Backbone.Collection.extend;

    Collection.prototype.__bba_super = Backbone.Collection;

    Collection.prototype.model = Articulation.Model;

    Collection.prototype.toJSON = function() {
      var model, models_as_JSON, _i, _len, _ref;
      models_as_JSON = [];
      _ref = this.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        models_as_JSON.push(model.toJSON());
      }
      return models_as_JSON;
    };

    Collection.prototype.parse = function(resp, xhr) {
      var articulated_model_attributes, model_resp, _i, _len;
      if (!(resp && _.isArray(resp))) {
        return resp;
      }
      articulated_model_attributes = [];
      for (_i = 0, _len = resp.length; _i < _len; _i++) {
        model_resp = resp[_i];
        articulated_model_attributes.push(JSONS.deserialize(model_resp, {
          skip_type_field: true
        }));
      }
      return articulated_model_attributes;
    };

    Collection.prototype._onModelEvent = function(event, model, collection, options) {
      var key;
      if (event === "destroy") {
        for (key in model._previousAttributes) {
          model._disownAttribute(key, model._previousAttributes[key]);
        }
        for (key in model.attributes) {
          model._disownAttribute(key, model.attributes[key]);
        }
      }
      return this.__bba_super.prototype._onModelEvent.apply(this, arguments);
    };

    Collection.prototype._removeReference = function(model) {
      if (model) {
        model.clear({
          silent: true
        });
      }
      return this.__bba_super.prototype._removeReference.apply(this, arguments);
    };

    Collection.mixin = function(target_constructor) {
      return Articulation._mixin(target_constructor, Articulation.Collection, ['toJSON', 'parse', '_reset', '_onModelEvent']);
    };

    return Collection;

  })(Backbone.Collection);

}).call(this);
