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
2) If you are already including Lifecycle.js or JSON-Serialize.js, use backbone-articulation_core.js as it does not bundle those libraries with it.

# Settings

1) Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE - if you are using a convention of a lower cased and underscored type field (like CouchDB), set Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE to true and include implementations for String.prototype.underscore and String.prototype.singularize (for example, from inflection.js)
  - Note: this is not guaranteed to work unless Class.constructor.name exists

````
Backbone.Articulation.TYPE_UNDERSCORE_SINGULARIZE = true;
````

That's it! Go crazy!

A big thank you to Jeremy Ashkenas and DocumentCloud for making all of this Backbone awesomeness possible.


## Examples
1) Creating custom serialization for one of your classes.

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
      date_value:JSON.serialize(this.date_value)
    };
  };
  SomeClass.fromJSON = function(obj) {
    if (obj._type!='SomeNamespace.SomeClass') return null;
    return new SomeClass(obj.int_value, obj.string_value, JSON.deserialize(obj.date_value));
  };
  return SomeClass;
})();
````