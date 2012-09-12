````
+-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-+
|B||a||c||k||b||o||n||e||-||A||r||t||i||c||u||l||a||t||i||o||n||.||j||s|
+-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-++-+
````

Backbone-Articulation.js enhances Backbone.js model attributes with object serialization and deserialization.

You can get the library here:

* [Development version][1]
* [Production version][2]

### Dependencies

* [Backbone.js][3]
* [Underscore.js][4]
* [JSON-Serialize.js][5]
* [Lifecycle.js][6]

Due to monkey patching, you must include the dependencies in this order:

1. Backbone
2. Backbone.Relational (if you use it)
3. Backbone.Articulation

Examples
--------

1) Creating custom serialization for one of your classes.

```coffeescript
class SomeClass
  constructor: (int_value, string_value, date_value) ->
    this.int_value = int_value;
    this.string_value = string_value;
    this.date_value = date_value;

  toJSON: ->
    return {
      _type:'SomeClass',
      int_value:this.int_value,
      string_value:this.string_value,
      date_value:JSONS.serialize(this.date_value)
    }

  @fromJSON: (json) ->    # note: this is a class method
    if (json._type!='SomeClass') return null;
    return new SomeClass(json.int_value, json.string_value, JSONS.deserialize(json.date_value));
```

Then if you put an instance in your model's attributes, it automatically gets serialized and deserialized for you:

```coffeescript
instance = new Backbone.Model({id: 'spiffy'});
instance.save({embedded_some_class: new SomeClass(1, 'two', new Date())})

instance2 = new Backbone.Model({id: 'spiffy'});
instance2.fetch({
  success: -> eq(_.isEqual(instance.get('embedded_some_class').toJSON(), instance2.get('embedded_some_class').toJSON()), "automatically serialized and deserialized a class!")
})
```

# The way it works

1) Choose and implement the lifecycle you want for specific attributes. Choices:
  a) clone() and destroy()
  b) retain() and release()
  c) new() only and using Javascript's garbage collection
  d) plain old JSON (with no custom serialization)

**Note: You can use heterogenous lifecycles paradigms in the same model's attributes and even embed Backbone models in your attributes (by adding type attribute)!**

* see [Lifecycle.js][7] for more details.

2) Choose a serialization/deserialization strategy
  a) using toJSON() instance method and fromJSON class or factory method
  b) plain old JSON (with no custom serialization)

* see [JSON-Serialize.js][8] for more details **and library options**.

[7]: https://github.com/kmalakoff/lifecycle
[8]: https://github.com/kmalakoff/json-serialize

If you choose 2a) - take a look at the examples below and:

* implement a toJSON() serialization method which returns plain old JSON. Include a _type attribute in the JSON which is used to find the corresponding fromJSON() class or factory method.
* implement a fromJSON() class or factory method that is used to articulation your attributes as objects. Note: your fromJSON method should be in the Javscript global namespace, but Backbone-Articulation.js will traverse nested namespaces as needed to find it (see example 2).


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

# Release Notes

###0.3.1

- converted back to CoffeeScript

- build using easy-bake

- added packaging test

- renamed 'backbone-articulation_core.js' to 'backbone-articulation.js'

- removed the bundled version of backbone-articulation (now you must include JSON-Serialize.js and Lifecycle.js manually (see above)

###0.3.3

- removed Backbone.Model monkey patching and used change() instead


Building, Running and Testing the library
-----------------------

###Installing:

1. install node.js: http://nodejs.org
2. install node packages: 'npm install'

###Commands:

Look at: https://github.com/kmalakoff/easy-bake

[1]: https://raw.github.com/kmalakoff/backbone-articulation/0.3.1/backbone-articulation.js
[2]: https://raw.github.com/kmalakoff/backbone-articulation/0.3.1/backbone-articulation.min.js
[3]: http://backbonejs.org/
[4]: http://underscorejs.org/
[5]: https://github.com/kmalakoff/json-serialize
[6]: https://github.com/kmalakoff/lifecycle