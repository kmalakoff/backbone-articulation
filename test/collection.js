$(document).ready(function() {

  module("Backbone.Collection");

  CloneDestroy = (function() {
    CloneDestroy.instance_count = 0;
    function CloneDestroy() { CloneDestroy.instance_count++; }
    CloneDestroy.parseJSON = function(obj) { 
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

  test("Model: serialize", function() {
    CloneDestroy.instance_count=0;
    var collection = new Backbone.Collection();
    var model_attributes = {attr1: {_type:'CloneDestroy'}, attr2: {_type:'CloneDestroy'}, attr3: {_type:'CloneDestroy'}};
    var models_as_JSON = [];
    for (var i=0; i<3; i++) {
      models_as_JSON.push(_.extend({id: i}, model_attributes));
    }

    collection.add(collection.parse(models_as_JSON));
    ok(collection.models.length===3, '3 models');
    ok(CloneDestroy.instance_count===3*(collection.models.length*2), '3 models with three instances in their attributes and previous attributes');
    collection.reset();
    ok(CloneDestroy.instance_count===0, '0 models with zero instances');
  });

  test("Model: deserialize", function() {
    CloneDestroy.instance_count=0;
    var collection = new Backbone.Collection();
    collection.add(new Backbone.Model({id: 0, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    collection.add(new Backbone.Model({id: 1, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    collection.add(new Backbone.Model({id: 2, attr1: new CloneDestroy(), attr2: new CloneDestroy(), attr3: new CloneDestroy()}))
    
    ok(collection.models.length===3, '3 models');
    ok(CloneDestroy.instance_count===3*(collection.models.length*2), '3 models with three instances in their attributes and previous attributes');

    var models_as_JSON = collection.toJSON(); models_as_JSON.shift();
    var collection2 = new Backbone.Collection();
    collection2.add(collection2.parse(models_as_JSON));
    ok(collection2.models.length===2, '2 models');
    ok(CloneDestroy.instance_count===3*2*(collection.models.length+collection2.models.length), '5 models with three instances in their attributes and previous attributes');
    collection.reset(); collection2.reset();
    ok(CloneDestroy.instance_count===0, '0 models with zero instances');
  });

});
