// Lifecycle.js 1.0.0
// (c) 2011 Kevin Malakoff.
// Lifecycle is freely distributable under the MIT license.
// https://github.com/kmalakoff/Lifecycle
//

(function() {

this.Lifecyle || (this.Lifecyle = {});
this.LC = this.Lifecyle;
LC.VERSION = '1.0.0';

////////////////HELPERS - BEGIN//////////////////
var isArray = function(obj) {
  return obj.constructor == Array;
};
////////////////HELPERS - END//////////////////

// Deduces the type of ownership of an item and if available, it retains it (reference counted) or clones it.
// <br/>**Options:**<br/>
// * `properties` - used to disambigate between owning an object and owning each property.<br/>
// * `share_collection` - used to disambigate between owning a collection's items (share) and cloning a collection (don't share).
// * `prefer_clone` - used to disambigate when both retain and clone exist. By default retain is prefered (eg. sharing for lower memory footprint).
LC.own = function(obj, options) {
  if (!obj || (typeof(obj)!='object')) return obj;
  options || (options = {});
  if (isArray(obj)) {
    var i, l = obj.length;
    if (options.share_collection) { for (i=0;i<l;i++) { LC.own(obj[i], {prefer_clone: options.prefer_clone}); } return obj; }
    else {
      var a_clone =  [];
      for (i=0;i<l;i++) { a_clone.push(LC.own(obj[i], {prefer_clone: options.prefer_clone})); }
      return a_clone;
    }
  }
  else if (options.properties) {
    if (options.share_collection) { for (key in obj) { LC.own(obj[key], {prefer_clone: options.prefer_clone}); } return obj; }
    else {
      var b_clone = {};
      for (key in obj) { b_clone[key] = LC.own(obj[key], {prefer_clone: options.prefer_clone}); }
      return b_clone;
    }
  }
  else if (obj.retain) {
    if (options.prefer_clone && obj.clone) return obj.clone();
    else obj.retain();
  }
  else if (obj.clone) return obj.clone();
  return obj;
};

// Deduces the type of ownership of an item and if available, it releases it (reference counted) or destroys it.
// <br/>**Options:**<br/>
// * `properties` - used to disambigate between owning an object and owning each property.<br/>
// * `clear_values` - used to disambigate between clearing disowned items and removing them (by default, they are removed).
// * `remove_values` - used to indicate that the values should be disowned and removed from the collections.
LC.disown = function(obj, options) {
  if (!obj || (typeof(obj)!='object')) return obj;
  options || (options = {});
  if (isArray(obj)) {
    var i, l = obj.length;
    if (options.clear_values) { for (i=0;i<l;i++) { LC.disown(obj[i], {clear_values: options.clear_values}); obj[i]=null; } }
    else {
      for (i=0;i<l;i++) { LC.disown(obj[i], {remove_values: options.remove_values}); }
      if (options.remove_values) {obj.length=0;}
    }
    return obj;
  }
  else if (options.properties) {
    var key;
    if (options.clear_values) { for (key in obj) { LC.disown(obj[key], {clear_values: options.clear_values}); obj[key]=null; } }
    else {
      for (key in obj) { LC.disown(obj[key], {remove_values: options.remove_values});}
      if (options.remove_values) {for(key in obj) { delete obj[key]; }}
    }
    return obj;
  }
  else if (obj.release) obj.release();
  else if (obj.destroy) obj.destroy();
  return obj;
};

// A simple reference counting class using Coffeescript class construction.
// Convention: implement a _destroy method with custom cleanup when reference count hits zero.
LC.RefCountable = (function() {
  function RefCountable() {
    this.ref_count = 1;
  }
  RefCountable.prototype.retain = function() {
    if (this.ref_count <= 0) {
      throw new Error("LC.RefCounting: ref_count is corrupt: " + this.ref_count);
    }
    this.ref_count++;
    return this;
  };
  RefCountable.prototype.release = function() {
    if (this.ref_count <= 0) {
      throw new Error("LC.RefCounting: ref_count is corrupt: " + this.ref_count);
    }
    this.ref_count--;
    if ((this.ref_count === 0) && this._destroy) {
      this._destroy.call(this);
    }
    return this;
  };
  RefCountable.prototype.refCount = function() {
    return this.ref_count;
  };
  return RefCountable;
})();

})();