$(document).ready(function() {

  module("Backbone.Model");

  Date.prototype.toJSON = function() { 
    return {
      _type:'Date', 
      year:this.getUTCFullYear(), 
      month:this.getUTCMonth(), 
      day:this.getUTCDate(),
      hours:this.getUTCHours(),
      minutes:this.getUTCMinutes(),
      seconds:this.getUTCSeconds()
    }; 
  };
  Date.parseJSON = function(obj) { 
    if (obj._type!='Date') return null;
    return new Date(Date.UTC(obj.year, obj.month, obj.day, obj.hours, obj.minutes, obj.seconds))
  };
  Date.prototype.isEqual = function(that) { 
    var this_date_components = this.toJSON();
    var that_date_components = (that instanceof Date) ? that.toJSON() : that;
    delete this_date_components['_type']; delete that_date_components['_type']
    return _.isEqual(this_date_components, that_date_components);
  };
  
  window.SomeNamespace || (window.SomeNamespace = {});
  SomeNamespace.SomeClass = (function() {
    function SomeClass(int_value, string_value, date_value) { 
      this.int_value = int_value; 
      this.string_value = string_value; 
      this.date_value = date_value; 
    }
    SomeClass.prototype.toJSON = function() { 
      return {
        _type:'SomeNamespace.SomeClass', 
        int_value:this.int_value, 
        string_value:this.string_value, 
        date_value:this.date_value
      }; 
    };
    SomeClass.parseJSON = function(obj) { 
      if (obj._type!='SomeNamespace.SomeClass') return null;
      return new SomeClass(obj.int_value, obj.string_value, Date.parseJSON(obj.date_value));
    };
    SomeClass.prototype.isEqual = function(that) { 
      if (!that) return false;
      else if (that instanceof SomeClass) {
        return ((this.int_value===that.int_value) && (this.string_value===that.string_value) && (_.isEqual(this.date_value, that.date_value)));
      }
      else {
        var this_JSON = this.toJSON();
        return (_.isEqual(this_JSON, that));
      }
      return false;
    };
    return SomeClass;
  })();

  var int_value = 123456, string_value = 'Hello', date_value = new Date();
  var attrs = {
    id      : 'test_model',
    name    : 'testy',
    a_class: {
      _type         : 'SomeNamespace.SomeClass', 
      int_value     : int_value, 
      string_value  : string_value, 
      date_value    : {
        _type       : 'Date',
        year        : date_value.getUTCFullYear(), 
        month       : date_value.getUTCMonth(), 
        day         : date_value.getUTCDate(),
        hours       : date_value.getUTCHours(),
        minutes     : date_value.getUTCMinutes(),
        seconds     : date_value.getUTCSeconds()
      }
    }
  };

  test("Model: deserialize from JSON", function() {
    var model = new Backbone.Model(), result;
    
    result = model.parse(attrs); model.set(result);
    ok(_.size(model.attributes)===3, 'all attributes were deserialized');
    result = model.get('a_class');
    ok(result instanceof SomeNamespace.SomeClass, 'SomeNamespace.SomeClass deserialized as a class');
    ok(_.isEqual(result, attrs.a_class), 'SomeNamespace.SomeClass deserialized correctly');
    ok(result.date_value instanceof Date, 'SomeNamespace.SomeClass date_value deserialized as a Date');
    ok(_.isEqual(result.date_value, attrs.a_class.date_value), 'SomeNamespace.SomeClass date_value deserialized correctly');
  });

  test("Model: serialize to JSON", function() {
    var model = new Backbone.Model(), instance, result;
    model.set({id: 'test_model', name: 'testy'});
    instance = new SomeNamespace.SomeClass(int_value, string_value, date_value);
    model.set({a_class: instance});
    
    result = model.toJSON();
    ok(_.size(result)===3, 'all attributes were serialized');
    result = result.a_class;
    ok(_.isEqual(result, attrs.a_class), 'SomeNamespace.SomeClass serialized correctly');
    ok(_.isEqual(result.date_value, attrs.a_class.date_value), 'SomeNamespace.SomeClass date_value serialized correctly');
  });

  test("Model: memory management clone() and destroy()", function() {
    CloneDestroy = (function() {
      CloneDestroy.clone_count = 0;
      function CloneDestroy() { CloneDestroy.clone_count++; }
      CloneDestroy.parseJSON = function(obj) { 
        if (obj._type!='CloneDestroy') return null;
        return new CloneDestroy();
      };
      CloneDestroy.prototype.toJSON = function() { return { _type:'CloneDestroy' }; };
      CloneDestroy.prototype.clone = function() { CloneDestroy.clone_count++; };
      CloneDestroy.prototype.destroy = function() { CloneDestroy.clone_count--; };
      return CloneDestroy;
    })();

    var attributes = {id: 'superstar', attr1: {_type:'CloneDestroy'}, attr2: {_type:'CloneDestroy'}, attr3: {_type:'CloneDestroy'}};
    var model = new Backbone.Model(), instance = new CloneDestroy(), result;

    ok(CloneDestroy.clone_count===1, '1 referenced instance');
    model.set(model.parse(attributes));
    ok(CloneDestroy.clone_count===7, '1 referenced instance + 3 in attributes + 3 in previous attributes');
    model.set({attr1: 1});
    ok(CloneDestroy.clone_count===5, '1 referenced instance + 2 in attributes + 2 in previous attributes');
    model.clear();
    ok(CloneDestroy.clone_count===1, '1 referenced instance');
  });

  test("Model: memory management retain() and release()", function() {
    RetainRelease = (function() {
      RetainRelease.retain_count = 0;
      function RetainRelease() { RetainRelease.retain_count++; }
      RetainRelease.parseJSON = function(obj) { 
        if (obj._type!='RetainRelease') return null;
        return new RetainRelease();
      };
      RetainRelease.prototype.retain = function() { RetainRelease.retain_count++; };
      RetainRelease.prototype.release = function() { RetainRelease.retain_count--; };
      return RetainRelease;
    })();

    var attributes = {id: 'superstar', attr1: {_type:'RetainRelease'}, attr2: {_type:'RetainRelease'}, attr3: {_type:'RetainRelease'}};
    var model = new Backbone.Model(), instance = new RetainRelease(), result;

    ok(RetainRelease.retain_count===1, '1 referenced instance');
    model.set(model.parse(attributes));
    ok(RetainRelease.retain_count===7, '1 referenced instance + 3 in attributes + 3 in previous attributes');
    model.set({attr1: 1});
    ok(RetainRelease.retain_count===5, '1 referenced instance + 2 in attributes + 2 in previous attributes');
    model.clear();
    ok(RetainRelease.retain_count===1, '1 referenced instance');
  });
});
