var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
};

//////////////////////////////
// Start Tests
//////////////////////////////
$(document).ready(function() {

  module("Backbone.Collection");

  // import Backbone, and Articulation
  var Backbone = !window.Backbone && (typeof require !== 'undefined') ? require('backbone') : window.Backbone;
  var Articulation = (typeof require !== 'undefined') ? require('backbone-articulation') : Backbone.Articulation
  var JSONS = !window.JSONS && (typeof require !== 'undefined') ? require('json-serialize') : window.JSONS;
  var _ = !window._ && (typeof require !== 'undefined') ? require('underscore')._ : window._;
  test("TEST DEPENDENCY MISSING", function() {
    ok(!!Backbone); ok(!!Articulation); ok(!!JSONS); ok(!!_);
  });

  CloneDestroy = (function() {
    CloneDestroy.instance_count = 0;
    function CloneDestroy() { CloneDestroy.instance_count++; }
    CloneDestroy.fromJSON = function(obj) {
      if (obj._type!='CloneDestroy') return null;
      return new CloneDestroy();
    };
    CloneDestroy.prototype.toJSON = function() {
      return {_type: 'CloneDestroy'};
    };
    CloneDestroy.prototype.clone = function() { return new CloneDestroy(); };
    CloneDestroy.prototype.destroy = function() { CloneDestroy.instance_count--; };
    return CloneDestroy;
  })();

  SomeModel = (function() {
    __extends(SomeModel, Backbone.Model);
    function SomeModel() {
      SomeModel.__super__.constructor.apply(this, arguments);
    }
    SomeModel.prototype._type = 'SomeModel';
    return SomeModel;
  })();

  test("Collection: serialize", function() {
    CloneDestroy.instance_count=0;
    var collection = new Backbone.Collection();
    var model_attributes = {attr1: {_type:'CloneDestroy'}, attr2: {_type:'CloneDestroy'}, attr3: {_type:'CloneDestroy'}};
    var models_as_JSON = [];
    for (var i=0; i<3; i++) {
      models_as_JSON.push(_.extend({id: i}, model_attributes));
    }

    collection.add(collection.parse(models_as_JSON));
    equal(collection.models.length, 3, '3 models');
    equal(CloneDestroy.instance_count, 3*(collection.models.length*2), '3 models with three instances in their attributes and previous attributes');

    collection.reset();
    equal(CloneDestroy.instance_count, 0, '0 models with zero instances');
  });

  test("Collection: deserialize", function() {
    CloneDestroy.instance_count=0;
    var collection = new Backbone.Collection();
    collection.add(new Backbone.Model({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    collection.add(new Backbone.Model({id: 1, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    collection.add(new Backbone.Model({id: 2, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))

    equal(collection.models.length, 3, '3 models');
    equal(CloneDestroy.instance_count, 3*(collection.models.length*2), '3 models with three instances in their attributes and previous attributes');

    var models_as_JSON = collection.toJSON(); models_as_JSON.shift();
    var collection2 = new Backbone.Collection();
    collection2.add(collection2.parse(models_as_JSON));
    equal(collection2.models.length, 2, '2 models');
    equal(CloneDestroy.instance_count, 3*2*(collection.models.length+collection2.models.length), '5 models with three instances in their attributes and previous attributes');

    collection.reset(); collection2.reset();
    equal(CloneDestroy.instance_count, 0, '0 models with zero instances');
  });

  test("Collection: type from model prototype", function() {
    var collection = new Backbone.Collection();
    collection.add(new SomeModel({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))

    var models_as_JSON = collection.toJSON();
    equal(models_as_JSON[0]._type, 'SomeModel', "type is SomeModel as expected");
  });

  test("Collection: Articulation.TYPE_UNDERSCORE_SINGULARIZE", function() {
    Articulation.TYPE_UNDERSCORE_SINGULARIZE = true;
    JSONS.TYPE_FIELD = "type";

    var collection = new Backbone.Collection();
    collection.add(new SomeModel({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))

    equal(collection.models.length, 1, '1 model');
    raises(function() { collection.toJSON(); }, null, "Missing String.prototype.underscore");
    String.prototype.underscore = function() { return new String("some_model"); };
    raises(function() { collection.toJSON(); }, null, "Missing String.prototype.singularize");
    String.prototype.singularize = function() { return new String("some_model"); };

    var models_as_JSON = collection.toJSON();
    equal(models_as_JSON[0].type, 'some_model', "type is some_model as expected");

    // return to defaults
    Articulation.TYPE_UNDERSCORE_SINGULARIZE = false;
    JSONS.TYPE_FIELD = "_type";
  });
});