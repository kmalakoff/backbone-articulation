````
+-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-+
|B||a||c||k||b||o||n||e||-||A||r||t||i||c||u||l||a||t||i||o||n||.||j||s|
+-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-+
````

Backbone-Articulation.js enhances Backbone.js model attributes with object serialization and deserialization.

# The way it works

1) Choose and implement the lifecycle you want for specific attributes. Choices:
  a) clone() and destroy()
  b) retain() and release()
  c) new() only and using Javascript's garbage collection
  d) plain old JSON (with no custom serialization)

2) Choose a serialization/deserialization strategy
  a) using toJSON() instance method and fromJSON class or factory method
  b) plain old JSON (with no custom serialization)

If you choose 2a) - take a look at the examples below and:
-> implement a toJSON() serialization method which returns plain old JSON. Include a _type attribute in the JSON which is used to find the corresponding fromJSON() class or factory method.
-> implement a fromJSON() class or factory method that is used to articulation your attributes as objects. Note: your fromJSON method should be in the Javscript global namespace, but Backbone-Articulation.js will traverse nested namespaces as needed to find it (see example 2).


# To use it

1) Just put it after Backbone.js in your Javascript script dependencies (it replaces some build in methods).
2) Until the modifications are rolled into the main library (please let me know if I need to add any new patches/features in the meantime), you will need to use the modified versions of Backbone:
  a) Backbone.js (https://github.com/kmalakoff/backbone)
3) Other dependencies:
  a) Underscore.js (http://documentcloud.github.com/underscore/)
  b) Underscore-Awesomer (https://github.com/kmalakoff/underscore-awesomer)

# Settings

1) Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE - if you are using a convention of a lower cased and underscored type field (like CouchDB), set Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE to true and include implementations for String.prototype.underscore and String.prototype.singularize (for example, from inflection.js)
  - Note: this is not guaranteed to work unless Class.constructor.name exists

````
Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE = true;
````

That's it! Go crazy!

A big thank you to Jeremy Ashkenas and DocumentCloud for making all of this Backbone awesomeness possible.


## Examples
1) Adding serialization to the built-in Javascript Date class (although under normal circumstances you wouldn't want to waste so much space per Date).

````
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

Date.fromJSON = function(obj) {
  if (obj._type!='Date') return null;
  return new Date(Date.UTC(obj.year, obj.month, obj.day, obj.hours, obj.minutes, obj.seconds))
};
````

2) Creating custom serialization for one of your classes.

````
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
  SomeClass.fromJSON = function(obj) {
    if (obj._type!='SomeNamespace.SomeClass') return null;
    return new SomeClass(obj.int_value, obj.string_value, Date.fromJSON(obj.date_value));
  };
  return SomeClass;
})();
````

## Known Backbone.Relational Memory Leak

I love Backbone and Backbone.relational, but memory management like this was not planned for. Backbone.Models are not reference counted so there is no way to indicate when you are done with them and Backbone.relational caches related models to reuse them. This means that their lifecycle is let's say:

````
var backbone_model_lifecycle = void 0; // undefined
````

I added a check in my backbone patch, added a new test (see test/relational.js), pinged the author of Backbone.Relational to discuss what should be done. The patch basically doesn't clean up model attributes (potentially creating memory leaks) if Backbone.Relational is defined (in Backbone.Collection._reset()):

````
// Backbone.Relational resues models so even though this lifecycle is over, it may live on. Or at least it will consume memory
if (!Backbone.Relational && this.models && this.models.length) { _.each(this.models, function(model) { model.clear({silent: true}); }); }
}
````
I'll keep you posted.
