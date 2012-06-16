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

  module("Backbone.Relational");

  var Backbone = (typeof require !== 'undefined') ? require('backbone') : window.Backbone;
  Backbone.Articulation = (typeof require !== 'undefined') ? require('backbone-articulation') : Backbone.Articulation
  Backbone.Relational = (typeof require !== 'undefined') ? require('backbone-relational') : Backbone.Relational
  var JSONS = (typeof require !== 'undefined') ? require('json-serialize') : window.JSONS;
  var _ = (typeof require !== 'undefined') ? require('underscore') : window._;
  if (_ && !_.VERSION) {_ = _._;} // LEGACY

  test("TEST DEPENDENCY MISSING", function() {
    ok(!!Backbone); ok(!!Backbone.Articulation); ok(!!JSONS); ok(!!_);
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

  test("Self-Referencing Model", function() {
    var SelfReferencingModel, model, result;
    SelfReferencingModel = (function(_super) {
      __extends(SelfReferencingModel, _super);

      function SelfReferencingModel() {
        return SelfReferencingModel.__super__.constructor.apply(this, arguments);
      }

      SelfReferencingModel.prototype.relations = [{
        type: Backbone.HasMany,
        key: 'children',
        relatedModel: SelfReferencingModel,
        includeInJSON: 'id',
        reverseRelation: {
          type: Backbone.HasOne,
          key: 'parent',
          includeInJSON: 'id'
        }
      }];

      return SelfReferencingModel;

    })(Backbone.Articulation.RelationalModel);

    parent_model = new SelfReferencingModel({name: 'parent', id: 'parent1', resource_uri: 'srm'});
    child_model = new SelfReferencingModel({name: 'child', resource_uri: 'srm'});
    parent_model.get('children').add(child_model);
    var child_model_json = child_model.toJSON();
    equal(child_model_json.parent, parent_model.get('id'), 'child serialized with parent');
    child_model.set({id: 'child1'}); // simulate coming back from the server
    var parent_model_json = parent_model.toJSON();
    equal(parent_model_json.children[0], child_model.get('id'), 'parent serialized with child');
  });

  test("Collection: serialize", function() {
    CloneDestroy.instance_count=0;
    var collection = new Backbone.Articulation.Collection();
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
    var collection = new Backbone.Articulation.Collection();
    collection.add(new Backbone.Articulation.RelationalModel({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    collection.add(new Backbone.Articulation.RelationalModel({id: 1, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    collection.add(new Backbone.Articulation.RelationalModel({id: 2, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))

    equal(collection.models.length, 3, '3 models');
    equal(CloneDestroy.instance_count, 3*(collection.models.length*2), '3 models with three instances in their attributes and previous attributes');

    var models_as_JSON = collection.toJSON(); models_as_JSON.shift();
    var collection2 = new Backbone.Articulation.Collection();
    collection2.add(collection2.parse(models_as_JSON));
    equal(collection2.models.length, 2, '2 models');
    equal(CloneDestroy.instance_count, 3*2*(collection.models.length+collection2.models.length), '5 models with three instances in their attributes and previous attributes');

    collection.reset(); collection2.reset();

    equal(CloneDestroy.instance_count, 0, '0 models with zero instances');
  });
});
