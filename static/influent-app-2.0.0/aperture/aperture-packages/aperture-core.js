/**
 * Copyright (c) 2013-2014 Oculus Info Inc. 
 * http://www.oculusinfo.com/
 * 
 * Released under the MIT License.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Aperture
 */
var aperture = (function(aperture){

/**
 * Source: base.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Defines the Aperture namespace and base functions.
 */

/*
 * TODO Provide runtime version, vml vs svg methods
 * TODO Check core dependency order here and report errors?
 */

/**
 * @namespace The root Aperture namespace, encapsulating all
 * Aperture functions and classes.
 */
aperture = (function(aperture) {

	/**
	 * The aperture release version number.
	 * @type String
	 */
	aperture.VERSION = '1.0.9.1';

	return aperture;

}(aperture || {}));


/*
 * Common functions that are private to all aperture code
 */

/**
 * @private
 * Regular expression that matches fieldName followed by a . or the end of the string.
 * Case insensitive, where fieldName is a string containing letters, numbers _, -, and
 * or $.  Technically any string can be a field name but we need to be a little restrictive
 * here because . and [] are special characters in the definition of nested fields.
 *
 * Used to parse mappings to data object fields
 */
var jsIdentifierRegEx = /([$0-9a-z_\-]+)(\[\])*(\.|$)/ig;

/**
 * @private
 * Function that takes an array of field names (the chain) and an optional index.
 * It will traverse down the field chain on the object in the "this" context and
 * return the result.
 *
 * @param {Array} chain
 *      An array of field identifiers where element of the array represents a
 *      field.  Each field may end with zero or more [] which indicate that an
 *      index into an array field is required.
 * @param {Array} indexes
 *      An array of index numbers to be used to index into any fields ending with []
 *      in the chain array.  The indexes in this array will be used in order with the
 *      []s found in the chain array.  The number of values in this array must match
 *      the number of []s in the chain array.
 *
 * @returns the value of the field specified by the chain and indices arrays
 */
var findFieldChainValue = function( chain, indexes ) {
	// Mutate the chain, shift of front
	var field = chain.shift(),
		arrayIdx, numArrays,
		value;

	// Pop []s off the end using the index
	if( (arrayIdx = field.indexOf('[]')) > 0 ) {
		numArrays = (field.length - arrayIdx)/2;
		// Remove the [] if in the field name (assume is at the end, only way valid)
		field = field.slice(0,arrayIdx);
		// Start by getting the array
		value = this[field];
		if (value == null) {
			return value;
		}
		// Now start digging down through the indexes
		while( numArrays > 0 ) {
			value = value[indexes.shift()];
			numArrays -= 1;
		}
	} else {
		// Straight-up non-indexed field
		value = this[field];
	}

	if( !chain.length ) {
		// Last item in chain, return property
		return value;
	} else {
		// Otherwise, dereference field, continue down the chain
		return findFieldChainValue.call( value, chain, indexes );
	}
};

/**
 * Source: util.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Defines utility functions for Aperture.
 */

/*
 * Portions of this package are inspired by or extended from:
 *
 * Underscore.js 1.2.0
 * (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
 * Underscore is freely distributable under the MIT license.
 * Portions of Underscore are inspired or borrowed from Prototype,
 * Oliver Steele's Functional, and John Resig's Micro-Templating.
 * For all details and documentation:
 * http://documentcloud.github.com/underscore
 */

/**
 * @namespace Aperture makes use of a number of JavaScript utility
 * functions that are exposed through this namespace for general use.
 */
aperture.util = (function(ns) {

	/**
	 * Instantiates a new object whose JavaScript prototype is the
	 * object passed in.
	 *
	 * @param {Object} obj
	 *      the prototype for the new object.
	 *
	 * @returns {Object}
	 *		a new view of the object passed in.
	 *
	 * @name aperture.util.viewOf
	 * @function
	 */
	ns.viewOf = function(obj) {

		// generic constructor function
		function ObjectView() {}

		// inherit from object
		ObjectView.prototype = obj;

		// new
		return new ObjectView();

	};


	// native shortcuts
	var arr = Array.prototype,
		slice = arr.slice,
		nativeForEach = arr.forEach,
		nativeMap = arr.map,
		nativeFilter = arr.filter,
		nativeIndexOf = arr.indexOf,
		nativeIsArray = Array.isArray,
		nativeBind = Function.prototype.bind,
		hasOwnProperty = Object.prototype.hasOwnProperty,
		toString = Object.prototype.toString,
		ctor = function(){};

	/**
	 * Calls a function for each item in a collection. If ECMAScript 5
	 * is supported by the runtime execution environment (e.g. browser)
	 * this method delegates to a native implementation.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to iterate through.
	 *
	 * @param {Function} operation
	 *      the function to call for each item in the collection, with
	 *      the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>.
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the operation as <span class="fixedFont">this</span>.
	 *
	 * @name aperture.util.forEach
	 * @function
	 */
	ns.forEach = function ( obj, operation, context ) {
		if ( obj == null ) return;

		// array, natively?
		if ( nativeForEach && obj.forEach === nativeForEach ) {
			obj.forEach( operation, context );

		// array-like?
		} else if ( obj.length === +obj.length ) {
			for (var i = 0, l = obj.length; i < l; i++) {
				i in obj && operation.call(context, obj[i], i, obj);
			}

		// object
		} else {
			for (var key in obj) {
				if (hasOwnProperty.call(obj, key)) {
					operation.call(context, obj[key], key, obj);
				}
			}
		}
	};

	/**
	 * Calls a function for each item in a collection, until the return
	 * value === the until condition.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to iterate through.
	 *
	 * @param {Function} operation
	 *      the function to call for each item in the collection, with
	 *      the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>.
	 *
	 * @param [until=true]
	 *      the return value to test for when deciding whether to break iteration.
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the operation as <span class="fixedFont">this</span>.
	 *
	 * @returns
	 *      the return value of the last function iteration.
	 *
	 * @name aperture.util.forEachUntil
	 * @function
	 */
	ns.forEachUntil = function ( obj, operation, until, context ) {
		if ( obj == null || operation == null ) return;

		// default to true
		if (arguments.length === 2) {
			until = true;
		}
		
		var result;

		// array-like?
		if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (i in obj && (result = operation.call(context, obj[i], i, obj)) === until) return result;
			}
		// object
		} else {
			for (var key in obj) {
				if (hasOwnProperty.call(obj, key)) {
					if ((result = operation.call(context, obj[key], key, obj)) === until) return result;
				}
			}
		}
		return result;
	};

	/**
	 * Looks through each value in the collection, returning an array of
	 * all the values that pass a truth test. For arrays this method
	 * delegates to the native ECMAScript 5 array filter method, if present.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param {Function} test
	 *      the function called for each item to test for inclusion,
	 *      with the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the test as <span class="fixedFont">this</span>.
	 *
	 * @returns {Array}
	 *      an array containing the subset that passed the filter test.
	 *
	 * @name aperture.util.filter
	 * @function
	 */
	ns.filter = function ( obj, test, context ) {
		var results = [];

		if ( obj == null ) return results;

		// array, natively?
		if ( nativeFilter && obj.filter === nativeFilter ) {
			return obj.filter( test, context );
		}

		// any other iterable
		ns.forEach( obj, function( value, index ) {
			if ( test.call( context, value, index, obj )) {
				results[results.length] = value;
			}
		});

		return results;
	};

	/**
	 * Produces a new array of values by mapping each item in the collection
	 * through a transformation function. For arrays this method
	 * delegates to the native ECMAScript 5 array map method, if present.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to map.
	 *
	 * @param {Function} transformation
	 *      the function called for each item that returns a transformed value,
	 *      called with the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the transformation as <span class="fixedFont">this</span>.
	 *
	 * @returns {Array}
	 *      a new array containing the transformed values.
	 *
	 * @name aperture.util.map
	 * @function
	 */
	ns.map = function ( obj, map, context ) {
		var results = [];

		if ( obj != null ) {
			// array, natively?
			if ( nativeMap && obj.map === nativeMap ) {
				return obj.map( map, context );
			}

			// any other iterable
			ns.forEach( obj, function( value, index ) {
				results[results.length] = map.call( context, value, index, obj );
			});
		}

		return results;
	};

	/**
	 * Looks through each value in the collection, returning the first one that
	 * passes a truth test.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param {Function} test
	 *      the function called for each item that tests for fulfillment,
	 *      called with the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the test as <span class="fixedFont">this</span>.
	 *
	 * @returns
	 *      The item found, or <span class="fixedFont">undefined</span>.
	 *
	 * @name aperture.util.find
	 * @function
	 */
	ns.find = function ( obj, test, context ) {
		var result;

		if ( obj != null ) {
			ns.forEachUntil( obj, function( value, index ) {
				if ( test.call( context, value, index, obj ) ) {
					result = value;
					return true;
				}
			}, true );
		}

		return result;
	};

	/**
	 * Looks through a collection, returning true if
	 * it includes the specified value.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param value
	 *      the value to look for using the === test.
	 *
	 * @returns
	 *      True if found, else false.
	 *
	 * @name aperture.util.has
	 * @function
	 */
	ns.has = function ( collection, value ) {
		if ( !collection ) return false;

		// TODO: use indexOf here if able.
		return !!ns.forEachUntil( collection, function ( item ) {
			return item === value;
		}, true );
	};

	/**
	 * Looks through a collection, returning true if
	 * it contains any of the specified values.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param {Array} values
	 *      the values to look for using the === test.
	 *
	 * @returns
	 *      True if any are found, else false.
	 *
	 * @name aperture.util.hasAny
	 * @function
	 */
	ns.hasAny = function ( collection, values ) {
		if ( !collection || !values ) return false;

		return !!ns.forEachUntil( collection, function ( value ) {
			return ns.indexOf( values, value ) !== -1;
		}, true );
	};

	/**
	 * Looks through a collection, returning true if
	 * it contains all of the specified values. If there
	 * are no values to look for this function returns false.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param {Array} values
	 *      the values to look for using the === test.
	 *
	 * @returns
	 *      True if any are found, else false.
	 *
	 * @name aperture.util.hasAll
	 * @function
	 */
	ns.hasAll = function ( collection, values ) {
		if ( !collection || !values ) return false;

		return !!ns.forEachUntil( values, function ( value ) {
			return ns.indexOf( values, value ) !== -1;
		}, false );
	};

	/**
	 * Returns the index at which value can be found in the array,
	 * or -1 if not present. Uses the native array indexOf function
	 * if present.
	 *
	 * @param {Array} array
	 *      the array to search.
	 *
	 * @param item
	 *      the item to look for, using the === check.
	 *
	 * @returns {Number}
	 *      the index of the item if found, otherwise -1.
	 *
	 * @name aperture.util.indexOf
	 * @function
	 */
	ns.indexOf = function( array, item ) {
		if ( array != null ) {
			if ( nativeIndexOf && array.indexOf === nativeIndexOf ) {
				return array.indexOf( item );
			}

			// array-like?
			for ( var i = 0, l = array.length; i < l; i++ ) {
				if (array[i] === item) return i;
			}
		}
		return -1;
	};

	/**
	 * Returns a copy of the array with the specified values removed.
	 *
	 * @param {Array} array
	 *      the array to remove from.
	 *
	 * @param value
	 *      the item to remove, identified using the === check.
	 *
	 * @param etc
	 *      additional items to remove, as additional arguments.
	 *
	 * @returns {Array}
	 *      a new array with values removed
	 *
	 * @name aperture.util.without
	 * @function
	 */
	ns.without = function( array ) {
		var exclusions = slice.call( arguments, 1 );

		return ns.filter( array,
			function ( item ) {
				return !ns.has( exclusions, item );
		});
	};

	/**
	 * Copy all of the properties in the source object(s) over to the
	 * destination object, in order.
	 *
	 * @param {Object} destination
	 *      the object to extend.
	 *
	 * @param {Object} source
	 *      one or more source objects (supplied as additional arguments)
	 *      with properties to add to the destination object.
	 *
	 * @name aperture.util.extend
	 *
	 * @returns {Object}
	 *      the destination object
	 *
	 * @function
	 */
	ns.extend = function( obj ) {
		ns.forEach( slice.call( arguments, 1 ), function ( source ) {
			for ( var prop in source ) {
				if ( source[prop] !== undefined ) obj[prop] = source[prop];
			}
		});

		return obj;
	};

	/**
	 * Bind a function to an object, meaning that whenever the function is called,
	 * the value of <span class="fixedFont">this</span> will be the object.
	 * Optionally, bind initial argument values to the function, also known
	 * as partial application or 'curry'. This method delegates to a native
	 * implementation if ECMAScript 5 is present.
	 *
	 * @param {Function} function
	 *      the function to wrap, with bound context and, optionally, arguments.
	 *
	 * @param {Object} object
	 *      the object to bind to be the value of <span class="fixedFont">this</span>
	 *      when the wrapped function is called.
	 *
	 * @param [arguments...]
	 *      the optional argument values to prepend when the wrapped function
	 *      is called, which will be followed by any arguments supplied by the caller
	 *      of the bound function returned here.
	 *
	 * @returns {Function}
	 *      the bound function.
	 *
	 * @name aperture.util.bind
	 * @function
	 */
	ns.bind = function bind(func, context) {

		// native delegation
		if (nativeBind && func.bind === nativeBind) {
			return nativeBind.apply(func, slice.call(arguments, 1));
		}

		// must be a function
		if ( !ns.isFunction(func) ) throw new TypeError;

		var args = slice.call(arguments, 2), bound;

		// return the bound function
		return bound = function() {

			// normal call pattern: obj.func(), with curried arguments
			if ( !(this instanceof bound) )
				return func.apply( context, args.concat(slice.call(arguments)) );

			// constructor pattern, with curried arguments.
			ctor.prototype = func.prototype;

			var self = new ctor,
				result = func.apply( self, args.concat(slice.call(arguments)) );

			return (Object(result) === result)? result : self;
		};
	};

	/**
	 * Returns true if argument appears to be a number.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isNumber
	 * @function
	 */
	ns.isNumber = function( obj ) {
		return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
	};

	/**
	 * Returns true if argument appears to be a string.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isString
	 * @function
	 */
	ns.isString = function(obj) {
		return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
	};

	/**
	 * Returns true if argument is an array. This method delegates to a native
	 * implementation if ECMAScript 5 is present.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isArray
	 * @function
	 */
	ns.isArray = nativeIsArray || function(obj) {
		return toString.call(obj) === '[object Array]';
	};

	/**
	 * Returns true if argument appears to be a function.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isFunction
	 * @function
	 */
	ns.isFunction = function(obj) {
		return !!(obj && obj.constructor && obj.call && obj.apply);
	};

	/**
	 * Returns true if argument appears to be an object.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isObject
	 * @function
	 */
	ns.isObject = function(obj) {
		return obj === Object(obj);
	};

	return ns;

}(aperture.util || {}));

/**
 * Source: Class.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Simple JavaScript Inheritance
 */

/*
 * Portions of this implementation of a classical inheritance pattern are written
 * by John Resig http://ejohn.org/
 * MIT Licensed.
 *
 * The Resig approach has been extended here to support 'views' of
 * class object instances using the JavaScript prototype model, as
 * well as basic type reflection. A bug fix was added to handled the
 * overrides of toString.
 *
 * Resig ack: Inspired by base2 and Prototype.
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {
	var initializing = false,
		nativeToString = Object.prototype.toString,

		// used in check below at root level
		rootTypeOf,

		// get property names.
		getOwnPropertyNames = function ( properties ) {
			var name, names = [];

			for (name in properties) {
				if (properties.hasOwnProperty(name)) {
					names[names.length] = name;
				}
			}

			// need to make a special case for toString b/c of IE bug
			if (properties.toString !== nativeToString) {
				names[names.length] = 'toString';
			}

			return names;
		},

		// create a new typeof method that checks against the properties of a type
		createTypeOfMethod = function ( name, constructor, superTypeOf ) {
			return function( type ) {
				return !type? name: (type === name || type === constructor
					|| (type.test && type.test(name)))?
							true : (superTypeOf || rootTypeOf)( type );
			};
		};

	// create the root level type checker.
	rootTypeOf = createTypeOfMethod( 'aperture.Class', namespace.Class, function() {return false;} );

	/**
	 * @class
	 * Class is the root of all extended Aperture classes, providing simple, robust patterns
	 * for classical extensibility. An example is provided below showing how to
	 * {@link aperture.Class.extend extend} a new class.
	 *
	 * @description
	 * This constructor is abstract and not intended to be invoked. The examples below demonstrate
	 * how to extend a new class from a base class, and how to add a view constructor to
	 * a base class.
	 *
	 * @name aperture.Class
	 */
	namespace.Class = function() {
	};

	/**
	 * Provides a method of checking class and view type inheritance, or
	 * simply returning the type name. A fully scoped name may be provided,
	 * or a regular expression for matching. Alternatively the class or
	 * view constructor may be passed in.
	 *
	 * @example
	 * var range = new aperture.Scalar('Percent Change GDP').symmetric();
	 *
	 * // check using regular expressions
	 * console.log( range.typeOf(/scalar/i) );         // 'true'
	 * console.log( range.typeOf(/symmetric/) );       // 'true'
	 *
	 * // check using names
	 * console.log( range.typeOf('aperture.Scalar') );  // 'true'
	 * console.log( range.typeOf('aperture.Range') );   // 'true'
	 * console.log( range.typeOf('aperture.Ordinal') ); // 'false'
	 *
	 * // check using prototypes. also 'true':
	 * console.log( range.typeOf( aperture.Scalar ) );
	 * console.log( range.typeOf( aperture.Scalar.prototype.symmetric ) );
	 *
	 * @param {String|RegExp|Constructor} [name]
	 *      the name, regular expression, or constructor of the view or class type to
	 *      check against, if checking inheritance.
	 *
	 * @returns {Boolean|String} if a name argument is provided for checking inheritance,
	 *      true or false indicating whether the object is an instance of the type specified,
	 *      else the name of this type.
	 *
	 *
	 * @name aperture.Class.prototype.typeOf
	 * @function
	 */

	/**
	 * Declares a class method which, when called on a runtime instance
	 * of this class, instantiates a 'view' of the object using
	 * JavaScript's prototype based inheritance, extending its methods
	 * and properties with those provided in the properties parameter.
	 * View methods may access a reference to the base object using the
	 * _base member variable. Views use powerful and efficient features
	 * of JavaScript, however however unlike in the case of Class
	 * extension, some allowances must be made in the design of base
	 * classes to support the derivation of views for correct behavior.
	 * The following provides an example:
	 *
	 * @example
	 *
	 * var ValueClass = aperture.Class.extend( 'ValueClass', {
	 *
	 *     // constructor
	 *     init : function( value ) {
	 *
	 *         // create a common object for all shared variables.
	 *         this.common = { value : value };
	 *     },
	 *
	 *     // sets the value in the object, even if called from a view.
	 *     setValue : function( value ) {
	 *
	 *         // use the common object to set the value for all,
	 *         // as opposed to overriding it locally.
	 *         this.common.value = value;
	 *     },
	 *
	 *     // returns the value.
	 *     getValue : function( value ) {
	 *         return this.common.value;
	 *     }
	 *
	 * });
	 *
	 * // declare a new view constructor
	 * ValueClass.addView( 'absolute', {
	 *
	 *    // optional view constructor, invoked by a call to absolute().
	 *    init : function( ) {
	 *
	 *        // Because of JavaScript prototype inheritance, note that
	 *        // any this.* property value we set will be an override
	 *        // in this view until deleted.
	 *    },
	 *
	 *    // overrides a parent class method.
	 *    getValue : function( ) {
	 *
	 *        // call same getValue method defined in base object.
	 *        // we can choose (but here do not) what this.* should resolve
	 *        // to in the base method call by using function apply() or call().
	 *        return Math.abs( this._base.getValue() );
	 *    }
	 *
	 * });
	 *
	 *
	 * // derive a view of an existing object
	 * var myObj = new MyClass( -2 ),
	 *     myAbsView = myObj.absolute();
	 *
	 * // value now depends on whether you call the base or view
	 * console.log( myObj.getValue() );     // '-2'
	 * console.log( myAbsView.getValue() ); //  '2'
	 *
	 *
	 * @param {String} viewName
	 *      the name of the view method to create, reflective of the type being declared
	 * @param {Object} properties
	 *      a hash of functions to add to (or replace on) the base object when the
	 *      view is created.
	 *
	 * @returns this (allows chaining)
	 *
	 * @name aperture.Class.addView
	 * @function
	 */
	var addView = function(viewName, properties) {
		var viewProto,
			fullName = this.prototype.typeOf() + '.prototype.' + viewName;

		// Create a function on the class's prototype that creates this view
		this.prototype[viewName] = viewProto = function( params ) {
			// First create a derived object
			// generic constructor function
			var ApertureView = function () {};
			// inherit from given instance
			ApertureView.prototype = this;
			// new
			var view = new ApertureView();

			// Provide access to the base object via "_base" member
			// We could check for access to this object and set in a wrapped method
			// like in the class extension below.
			view._base = this;

			aperture.util.forEach( getOwnPropertyNames(properties), function(name) {
				if (name !== 'init') {
					view[name] = properties[name];
				}
			});

			// override the typeOf function to evaluate against this type first, then fall to super.
			view.typeOf = createTypeOfMethod( fullName, viewProto, this.typeOf );

			// Call init (if given)
			if( properties.init ) {
				properties.init.apply( view, arguments );
			}

			return view;
		};

		return this;
	};


	/**
	 * Extends a new class from this class, with any new or overridden properties
	 * and an optional init constructor defined in the properties parameter.
	 * Any methods which are
	 * overridden may call this._super() from within the context of the overridden function
	 * to invoke the parent classes implementation.
	 * A className is supplied as the first parameter for typeOf() evaluation, which
	 * may be omitted for anonymous classes.
	 * Extend may be called on
	 * any previously extended Class object.
	 *
	 * For example:
	 *
	 * @example
	 * var MyClass = MyBaseClass.extend( 'MyClass', {
	 *
	 *    // optionally define constructor
	 *    init : function( exampleArg ) {
	 *
	 *        // optionally call super class constructor
	 *        this._super( exampleArg );
	 *    },
	 *
	 *    // example method override
	 *    exampleMethod : function() {
	 *
	 *        // optionally call same method in parent.
	 *        this._super();
	 *    },
	 *
	 *    ...
	 * });
	 *
	 * // example instantiation
	 * var myObj = new MyClass( exampleArg );
	 *
	 * @param {String} [className]
	 *      an optional type specifier which may be omitted for anonymous classes.
	 *
	 * @param {Object} properties
	 *      a hash of methods and members to extend the class with.
	 *
	 * @returns
	 *      a new class constructor.
	 *
	 * @name aperture.Class.extend
	 * @function
	 */
	namespace.Class.extend = function(className, properties) {

		// className is an optional arg,  but first.
		if (!properties) {
			properties = className;
			className = null;
		}

		var _super = this.prototype;

		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		aperture.util.forEach( getOwnPropertyNames(properties), function ( name ) {
			prototype[name] = properties[name];
		});

		// The dummy class constructor
		function ApertureClass() {
			// All construction is actually done in the init method
			if (!initializing && this.init) {
				this.init.apply(this, arguments);
			}
		}

		// add the type of now that we have the constructor.
		prototype.typeOf = createTypeOfMethod( className, ApertureClass, _super.typeOf );

		// Populate our constructed prototype object
		ApertureClass.prototype = prototype;

		// Enforce the constructor to be what we expect
		ApertureClass.constructor = ApertureClass;

		// And make this class extendable
		ApertureClass.extend = namespace.Class.extend;

		// And make this class able to create views of itself
		ApertureClass.addView = addView;

		return ApertureClass;
	};

	return namespace;

}(aperture || {}));
/**
 * Source: config.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview APIs for interacting with Configurations
 */

/**
 * @namespace APIs for interacting with configurations
 */
aperture.config = (function() {

	var registered = {};
	var currentConfig = {};

	return {

		/**
		 * Register a callback function to be notified with configuration details
		 * when a particular named configuration section is part of the object.
		 * This allows features to be given environment-specific configuration values
		 * by a server, container, or client.
		 */
		register : function( configName, callback ) {
			var existing = registered[configName];
			if (!existing) {
				existing = [];
				registered[configName] = existing;
			}

			existing.push({'callback':callback});

			// If we already have a configuration...
			if( currentConfig && currentConfig[configName] ) {
				// Immediately call the callback
				callback(currentConfig);
			}
		},

		/**
		 * Provides a given configuration object and notifies all registered listeners.
		 */
		provide : function( provided ) {
			currentConfig = provided;

			var key, i;
			for( key in currentConfig ) {
				if (currentConfig.hasOwnProperty(key)) {
					var existing = registered[key];
					if( existing ) {
						for( i=0; i<existing.length; i++ ) {
							existing[i].callback(currentConfig);
						}
					}
				}
			}
		},

		/**
		 * Returns the current configuration object provided via "provide"
		 */
		get : function() {
			return currentConfig;
		}
	};
}());
/**
 * Source: log.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Logging API implementation
 */

/*
 * TODO Allow default appenders to be constructed based on config from server
 */

/**
 * @namespace Aperture logging API. Multiple appenders can be added to log to different
 * destinations at a specified minimum log level. The logWindowErrors function can be 
 * configured to log unhandled JavaScript errors as well. Logging can be configured
 * in the aperture config file (<a href="#constructor">see example</a>) or programmatically.
 * 
 * @example 
 * // example aperture config file section 
 * aperture.log : {
 *   level : 'info',
 *   logWindowErrors : {log: true, preventDefault: true},
 *     appenders : {
 *       consoleAppender : {level: 'info'},
 *       notifyAppender : {level: 'error'}
 *   }
 * }
 */
aperture.log = (function() {

		/**
		 * @class Logging level definitions
		 * @name aperture.log.LEVEL
		 */
	var LEVEL =
		/** @lends aperture.log.LEVEL */
		{
			/** @constant
			 *  @description Error logging level */
			ERROR: 'error',
			/** @constant
			 *  @description Warn logging level */
			WARN: 'warn',
			/** @constant
			 *  @description Info logging level */
			INFO: 'info',
			/** @constant
			 *  @description Debug logging level */
			DEBUG: 'debug',
			/** @constant
			 *  @description 'Log' logging level */
			LOG: 'log',
			/** @constant
			 *  @description Turn off logging */
			NONE: 'none'
		},

		levelOrder = {
			'error': 5,
			'warn': 4,
			'info': 3,
			'debug': 2,
			'log': 1,
			'none': 0
		},


		// The list of active appenders
		appenders = [],

		// The global logging level
		globalLevel = LEVEL.INFO,

		// Log window errors too.
		logWinErrs = false,
		eatWinErrs = false,
		otherWinErrHandler,
		
		// The current indentation level.
		prefix = '',
		eightSpaces = '        ',
		
		
		/**
		 * @private
		 * Internal function that takes a format string and additional arguments
		 * and returns a single formatted string.  Essentially a cheap version of
		 * sprintf.  Parameters are referenced within the format string using {#}
		 * where # is the parameter index number, starting with 0.  Parameter references
		 * may be repeated and may be in any order within the format string.
		 *
		 * Example:
		 * <pre>
		 * formatString('{0} is fun - use {0} more. {1} is boring', 'JavaScript', 'C');
		 * </pre>
		 *
		 */
		formatString = function(message /*, params */) {
			// Extract all but first arg (message)
			var args = Array.prototype.slice.call(arguments, 1);
			// Return string with all {digit} replaced with value from argument
			return prefix + message.replace(/\{(\d+)\}/g, function(match, number) {
				return typeof args[number] != 'undefined' ?
					args[number] :
					'{' + number + '}';
			});
		},



		Appender = aperture.Class.extend( 'aperture.log.Appender',
		/** @lends aperture.log.Appender# */
		{
			/**
			 * @class Logging Appender base class.<br><br>
			 *
			 * @constructs
			 * @param {aperture.log.LEVEL} level The logging level threshold for this appender
			 */
			init : function(level) {
				this.level = level || LEVEL.WARN;
			},

			/**
			 * Sets or gets the current global logging level
			 * @param {aperture.log.LEVEL} [l] the new appender level threshold.  If value given, the
			 * threshold level is not changed and the current value is returned
			 * @param the current appender level threshold
			 */
			level : function(l) {
				if( l !== undefined ) {
					// Set new level if given one
					this.level = l;
				}
				// Return current level
				return this.level;
			},

			/**
			 * Log function called by the logging framework requesting that the
			 * appender handle the given data.  In general this function should
			 * not be overridden by sub-classed Appenders, instead they should
			 * implement logString and logObjects
			 * @param {aperture.log.LEVEL} level level at which to log the message
			 * @param {Object|String} toLog data to log, see api.log for details.
			 */
			log : function( level, toLog ) {
				// Check logging level
				if( levelOrder[level] >= levelOrder[this.level] ) {
					// Extract all arguments that are meant to be logged
					var toLogArgs = Array.prototype.slice.call(arguments, 1);
					// Is the first thing to log a string?
					if( aperture.util.isString(toLog) ) {
						// Log a string, assume is a format string if more args follow
						// Create log message and call appender's log string function
						this.logString( level, formatString.apply(null, toLogArgs) );

					} else {
						// Not a string, assume one or more objects, log as such
						if( this.logObjects ) {
							// Appender supports object logging
							// Call logObjects with the level and an array of objects to log
							this.logObjects( level, toLogArgs );
						} else {
							// Appender doesn't support object logging
							// Convert objects to a JSON string and log as such
							var message = window.JSON? JSON.stringify( toLogArgs ) :
								'No window.JSON interface exists to stringify logged object. A polyfill like json2.js is required.';

							this.logString( level, message );
						}
					}
				}
			},

			/**
			 * 'Abstract' function to log a given string message at the given level
			 * Appender sub-classes should implement this method to do something useful
			 * with the message
			 * @param {aperture.log.LEVEL} level the level of the message to log
			 * @param {String} message the message that should be logged as a string
			 */
			logString : function(level, message) {}

			/**
			 * 'Abstract' function to log javascript objects.  Appender sub-classes
			 * may elect to implement this method if they can log objects in a useful
			 * way.  If this method is not implemented, logString will be called
			 * with a string representation of the objects.
			 * <pre>
			 * logObjects : function(level, objects) {}
			 * </pre>
			 * @param {aperture.log.LEVEL} level the level of the entry to log
			 * @param {Object} ... the objects to log
			 */
		} ),

		/**
		 * Define the externally visible logging API
		 * @exports api as aperture.log
		 * @lends api
		 */
		api = {
			/**
			 * Returns a list of the current logging appenders
			 * @returns an array of active appenders
			 */
			appenders : function() {
				return appenders;
			},

			/**
			 * Adds an Appender instance to the set of active logging appenders
			 * @param {Appender} toAdd an appender instance to add
			 * @returns the added appender
			 */
			addAppender : function( toAdd ) {
				appenders.push( toAdd );
				return toAdd;
			},

			/**
			 * Removes an Appender instance from the set of active logging appenders
			 * @param {Appender} toRemove an appender instance currently in the list
			 * of active appenders that should be removed
			 * @returns the removed appender
			 */
			removeAppender : function( toRemove ) {
				appenders = aperture.util.without( appenders, toRemove );
				return toRemove;
			},

			/**
			 * Logs a message at the given level
			 * @param {aperture.log.LEVEL} level the level at which to log the given message
			 * @param {String|Object} message a message or object to log.
			 * The message may be a plain string, may be a format string followed by
			 * values to inject into the string, or may be one or more objects that should
			 * be logged as is.
			 * @param {String|Object} [...] additional objects to log or parameters
			 * for the format string contained in the message parameter.
			 */
			logAtLevel : function(level, message) {
				// Only log if message level is equal to or higher than the global level
				if( levelOrder[level] >= levelOrder[globalLevel] ) {
					var args = arguments;
					aperture.util.forEach(appenders, function(appender) {
						// Call the appender's log function with the arguments as given
						appender.log.apply(appender, args);
					});
				}
			},

			/**
			 * Sets or gets the current global logging level
			 * @param {LEVEL} [l] if provided, sets the global logging level
			 * @returns {LEVEL} the global logging level, if a get, the old logging level if a set
			 */
			level : function(l) {
				var oldLevel = globalLevel;
				if( l !== undefined ) {
					// Set new global level if given one
					globalLevel = l;
				}
				// Return original global level
				return oldLevel;
			},
			
			/**
			 * Returns true if configured to include the specified log level.
			 * @param {LEVEL} level
			 * @returns {Boolean} true if logging the specified level.
			 */
			isLogging : function(level) {
				return levelOrder[level] >= levelOrder[globalLevel];
			},
			
			/**
			 * If setting increments or decrements the indent by the specified number of spaces,
			 * otherwise returning the current indentation as a string of spaces. Zero may 
			 * be supplied as an argument to reset the indentation to zero.
			 *  
			 * @param {Number} [spaces] the number of spaces to increment or decrement, or zero to reset.
			 * @returns {String} the current indentation as a string.
			 */
			indent : function(spaces) {
				if (arguments.length !== 0) {
					if (spaces) {
						if (spaces < 0) {
							prefix = spaces < prefix.length? prefix.substring(0, prefix.length-spaces): '';
						} else {
							while (spaces > 0) {
								prefix += eightSpaces.substr(0, Math.min(spaces, 8));
								spaces-= 8;
							}
						}
					} else {
						prefix = '';
					}
				}
				
				return prefix;
			},
			
			/**
			 * Specifies whether or not to intercept and log Javascript errors, or if no arguments
			 * are supplied returns true or false indicating the current state.
			 * 
			 * @param {Boolean} [log] whether or not to log window errors.
			 * @param {Boolean} [preventDefault=false] whether or not to prevent the browser's default.
			 * 
			 */
			logWindowErrors : function(log, preventDefault) {
				if (log == null) {
					return logWinErrs;
				}
				
				// force it to a boolean.
				log = !!log;

				if (logWinErrs !== log) {
					logWinErrs = log;
					eatWinErrs = !!preventDefault;
					
					if (logWinErrs) {
						otherWinErrHandler = window.onerror;
						window.onerror = onErr;
					} else {
						window.onerror = otherWinErrHandler;
						otherWinErrHandler = undefined;
					}
				}
			}
		};

	/**
	 * Logs a message at the "LEVEL.ERROR" level
	 * @name error
	 * @methodof aperture.log
	 * @param {String|Object} message a message or object to log.
	 * The message may be a plain string, may be a format string followed by
	 * values to inject into the string, or may be one or more objects that should
	 * be logged as is.
	 * @param {String|Object} [...] additional objects to log or parameters
	 * for the format string contained in the message parameter.
	 */

	/**
	 * Logs a message at the "LEVEL.WARN" level
	 * @name warn
	 * @methodof aperture.log
	 * @param {String|Object} message a message or object to log.
	 * The message may be a plain string, may be a format string followed by
	 * values to inject into the string, or may be one or more objects that should
	 * be logged as is.
	 * @param {String|Object} [...] additional objects to log or parameters
	 * for the format string contained in the message parameter.
	 */

	/**
	 * Logs a message at the "LEVEL.INFO" level
	 * @name info
	 * @methodof aperture.log
	 * @param {String|Object} message a message or object to log.
	 * The message may be a plain string, may be a format string followed by
	 * values to inject into the string, or may be one or more objects that should
	 * be logged as is.
	 * @param {String|Object} [...] additional objects to log or parameters
	 * for the format string contained in the message parameter.
	 */

	/**
	 * Logs a message at the "LEVEL.LOG" level
	 * @name log
	 * @methodof aperture.log
	 * @param {String|Object} message a message or object to log.
	 * The message may be a plain string, may be a format string followed by
	 * values to inject into the string, or may be one or more objects that should
	 * be logged as is.
	 * @param {String|Object} [...] additional objects to log or parameters
	 * for the format string contained in the message parameter.
	 */

	// Add a log method for each level to the api
	aperture.util.forEach(LEVEL, function(value, key) {
		// Create a method such as the following:
		// api.info = log(level.INFO, args...)
		api[value] = aperture.util.bind(api.logAtLevel, api, value);
	});

	// Expose 'abstract' base class
	api.Appender = Appender;

	// Expose the log level definition
	api.LEVEL = LEVEL;

	// Register for configuration events
	// Configuration options allow
	aperture.config.register('aperture.log', function(config) {
		var logConfig = config['aperture.log'];

		// Set the global level
		if( logConfig.level ) {
			api.level( logConfig.level );
		}
		
		// log JS errors?
		var winErrs = logConfig.logWindowErrors;
		
		if (winErrs) {
			api.logWindowErrors( !!winErrs.log, winErrs.preventDefault );
		}

		// For all defined appenders...
		aperture.util.forEach( logConfig.appenders, function(value, key) {
			if (!key) {
				return;
			}
			// the function will be an add fn that follows a particular format
			key = 'add' + key.charAt(0).toUpperCase() + key.substr(1);

			// If an appender exists with the given key...
			if( aperture.util.isFunction(aperture.log[key]) ) {
				// Add it with the associated specification and start using it
				aperture.log[key]( value );
			}
		});
	});
	
	function onErr(msg, url, line) {
		api.error(msg + ' ' + url + ':' + line);
		
		// chain on
		if (otherWinErrHandler) {
			otherWinErrHandler.apply(this, arguments);
		}
		
		return eatWinErrs;
	}

	return api;
}());
/**
 * Source: Canvas.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview The base canvas classes.
 */

/**
 * @namespace The canvas package, where rendering is abstracted and implemented for
 * various platforms.
 * 
 * @private
 */
aperture.canvas = (
/** @private */
function(namespace) {

	var plugins = {};

	// leave private for now
	namespace.handle = function( typeName, ctor ) {
		plugins[typeName] = ctor;
	};
	namespace.type = function( typeName ) {
		return plugins[typeName];
	};

	/**
	 * A simple div canvas type.
	 * 
	 * @private
	 *
	 * @name aperture.canvas.DIV_CANVAS
	 * @constant
	 */
	namespace.DIV_CANVAS = 'DIV_CANVAS';

	/**
	 * A vector canvas type.
	 * 
	 * @private
	 *
	 * @name aperture.canvas.VECTOR_CANVAS
	 * @constant
	 */
	namespace.VECTOR_CANVAS = 'VECTOR_CANVAS';


	/**
	 * @class
	 * The abstraction of an Aperture canvas. An
	 * Aperture canvas abstracts the surface being rendered to, for platform extensibility.
	 * This class is not used directly by end clients. It is used by
	 * layer implementations and is provided here for reference only.
	 * 
	 * @private
	 *
	 * @extends aperture.Class
	 *
	 * @description
	 * This class is abstract and is not to be instantiated directly.
	 *
	 * @name aperture.canvas.Canvas
	 */
	namespace.Canvas = aperture.Class.extend( 'aperture.canvas.Canvas',
		{
			init : function ( root ) {
				this.root_ = root;
				this.canvases_ = [];
//				this.clients = 0;
			},

			/**
			 * Removes the canvas from its parent.
			 * 
			 * @private
			 *
			 * @returns {aperture.canvas.Canvas}
			 *  This canvas
			 *
			 * @name aperture.canvas.Canvas.prototype.remove
			 * @function
			 */
			remove : function() {
//				this.clients--;

				// TODO: need to resolve shared layer destruction.
				// Reference counting in this manner is too fragile, since
				// clients could accidentally call remove more than once.
				return this;
			},

			/**
			 * Returns a member canvas of the requested type, constructing one if it does
			 * not already exist.
			 * 
			 * @private
			 *
			 * @param type
			 *  An Aperture type constructor, such as aperture.canvas.VECTOR_CANVAS.
			 * @returns {aperture.canvas.Canvas}
			 *  A canvas
			 *
			 * @name aperture.canvas.Canvas.prototype.canvas
			 * @function
			 */
			canvas : function( type ) {
				if (!type || !(type = plugins[type]) || this.typeOf(type)) {
					return this;
				}

				// find any existing canvas of the right type
				var canvas = aperture.util.find( this.canvases_, function (canvas) {
					return canvas.typeOf(type);
				});

				// if not found, create a new one.
				if (!canvas) {
					canvas = new type( this.root() );
					this.canvases_.push(canvas);
				}

//				canvas.clients++;

				return canvas;
			},

			/**
			 * Returns the canvas root DOM element.
			 * 
			 * @private
			 *
			 * @returns {DOMElement}
			 *  The root DOM element of this canvas
			 *
			 * @name aperture.canvas.Canvas.prototype.root
			 * @function
			 */
			root : function() {
				return this.root_;
			},

			/**
			 * Returns a new graphics interface implementation for this canvas.
			 * 
			 * @private
			 *
			 * @param {aperture.canvas.Graphics} parentGraphics
			 *  The parent graphics context.
			 *
			 * @returns {aperture.canvas.Graphics}
			 *  A new graphics canvas
			 *
			 * @name aperture.canvas.Canvas.prototype.graphics
			 * @function
			 */
			graphics : function ( parentGraphics ) {
				return namespace.NO_GRAPHICS;
			},

			/**
			 * Called at the end of a canvas update, flushing any
			 * drawing operations, as necessary.
			 * 
			 * @private
			 *
			 * @name aperture.canvas.Canvas.prototype.flush
			 * @function
			 */
			flush : function () {
				var i = 0, n;
				for (n = this.canvases_.length; i< n; i++) {
					this.canvases_[i].flush();
				}
			}
		}
	);

	namespace.handle( namespace.DIV_CANVAS, namespace.Canvas.extend( 'aperture.canvas.DivCanvas', {} ));


	// NOTE: We don't implement standard html graphics but we could

	/**
	 * @class
	 * The abstraction of an Aperture graphics implementation. An
	 * Aperture graphics interface abstracts basic rendering for platform extensibility.
	 * This class is not used directly by end clients. It is used by
	 * layer implementations and is provided here for reference only.
	 *
	 * @private
	 * 
	 * @extends aperture.Class
	 *
	 * @description
	 * This class is abstract and is not to be instantiated directly.
	 *
	 * @name aperture.canvas.Graphics
	 */
	namespace.Graphics = aperture.Class.extend( 'aperture.canvas.Graphics',
		{
			init : function ( canvas ) {
				this.canvas = canvas;
			},

			/**
			 * Shows or hides this graphics instance.
			 * 
			 * @private
			 *
			 * @param {Boolean} show
			 *  Whether or not to show this context.
			 *      
			 * @returns {Boolean} 
			 *  true if value was changed
			 * 
			 * @name aperture.canvas.Graphics.prototype.display
			 * @function
			 */
			display : function( show ) {
				return true;
			},

			/**
			 * Moves this graphics to the front of its container graphics,
			 * or a child element to the top.
			 * 
			 * @private
			 * 
			 * @param element
			 *  An optional element to move, otherwise the entire graphics will be moved.
			 * 
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.toFront
			 * @function
			 */
			toFront : function() {
				return this;
			},

			/**
			 * Moves this graphics to the back of its container graphics,
			 * or a child element to the bottom.
			 * 
			 * @private
			 *
			 * @param element
			 *  An optional element to move, otherwise the entire graphics will be moved.
			 * 
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.toBack
			 * @function
			 */
			toBack : function() {
				return this;
			},

			/**
			 * Removes the graphics instance from its parent.
			 * 
			 * @private
			 *
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.remove
			 * @function
			 */
			remove : function () {
				return this;
			},
			
			/**
			 * Adds a callback for a specific type of event.
			 * 
			 * @private
			 * 
			 * @param eventType
			 *  The type of event to add a callback for
			 * @param layer
			 *  The client layer for events.
			 * 
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.on
			 * @function
			 */
			on : function(eventType, layer) {
				return this;
			},
			
			/**
			 * Removes a callback for a specific type of event.
			 * 
			 * @private
			 * 
			 * @param eventType
			 *  The type of event to remove a callback for
			 * 
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.off
			 * @function
			 */
			off : function(eventType) {
				return this;
			},

			/**
			 * Sets or gets a data object [and index] associated with the specified element,
			 * or universally with this canvas.
			 * 
			 * @private
			 * 
			 * @param {Object} [element]
			 *  The element to get/set data for, or the universal data object for the canvas.
			 *  If omitted the universal data object is returned.
			 * @param {Object} [data]
			 *  The data to associate.
			 * @param {Array} [index]
			 *  The index array to associate.
			 * 
			 * @returns {Object|aperture.canvas.Graphics}
			 *  The data object requested (if a get), otherwise this graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.data
			 * @function
			 */
			data : function(element, data, index) {
				return this;
			}
		}
	);

	// use this singleton as a noop.
	namespace.NO_GRAPHICS = new namespace.Graphics();
	
	// an abstraction which we don't both to document.
	namespace.VectorCanvas = namespace.Canvas.extend( 'aperture.canvas.VectorCanvas',
		{
			graphics : function ( parentGraphics ) {}
		}
	);

	/**
	 * @class
	 * The abstraction of an Aperture vector graphics implementation. An
	 * Aperture graphics interface abstracts basic rendering for platform extensibility.
	 * This class is not used directly by end clients. It is used by
	 * layer implementations and is provided here for reference only.
	 *
	 * @private
	 * 
	 * @extends aperture.canvas.Graphics
	 *
	 * @description
	 * This class is abstract and is not to be instantiated directly.
	 *
	 * @name aperture.canvas.VectorGraphics
	 */
	namespace.VectorGraphics = namespace.Graphics.extend( 'aperture.canvas.VectorGraphics', {} );

	/**
	 * Sets the clipping region of this graphics canvas.
	 *
	 * @private
	 * 
	 * @param {Array} rect
	 *  An array of [x, y, width, height], or
	 *  an empty or null clip if clearing.
	 *
	 * @returns {aperture.canvas.Graphics}
	 *  This graphics object
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.clip
	 * @function
	 */

	/**
	 * Sets the position of this graphics canvas.
	 *
	 * @private
	 * 
	 * @param {Number} x
	 *  The x position.
	 *
	 * @param {Number} y
	 *  The y position.
	 *
	 * @returns {aperture.canvas.Graphics}
	 *  This graphics object
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.origin
	 * @function
	 */

	/**
	 * Adds a path given an svg path string.
	 *
	 * @private
	 * 
	 * @param {String} [svg]
	 *  An optional path string in svg path format. If not specified here
	 *  the path is expected to be set later.
	 *
	 * @returns {Object}
	 *  A new path element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.path
	 * @function
	 */

	/**
	 * Adds a circle element.
	 *
	 * @private
	 * 
	 * @param {Number} x
	 *  The x coordinate of the circle.
	 *
	 * @param {Number} y
	 *  The y coordinate of the circle.
	 *
	 * @param {Number} radius
	 *  The radius of the circle.
	 *
	 * @returns {Object}
	 *  A new circle element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.circle
	 * @function
	 */

	/**
	 * Adds a rectangle element.
	 *
	 * @private
	 * 
	 * @param {Number} x
	 *  The x coordinate of the rectangle.
	 *
	 * @param {Number} y
	 *  The y coordinate of the rectangle.
	 *
	 * @param {Number} width
	 *  The width of the rectangle.
	 *
	 * @param {Number} height
	 *  The height of the rectangle.
	 *
	 * @returns {Object}
	 *  A new rectangle element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.rect
	 * @function
	 */

	/**
	 * Adds a text element.
	 *
	 * @private
	 * 
	 * @param {Number} x
	 *  The x coordinate of the text.
	 *
	 * @param {Number} y
	 *  The y coordinate of the text.
	 *
	 * @param {String} text
	 *  The text of the element.
	 *
	 * @returns {Object}
	 *  A new text element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.text
	 * @function
	 */

	/**
	 * Adds an image element.
	 *
	 * @private
	 * 
	 * @param {String} src
	 *  The source uri of the image.
	 *
	 * @param {Number} x
	 *  The x coordinate of the circle.
	 *
	 * @param {Number} y
	 *  The y coordinate of the circle.
	 *
	 * @param {Number} width
	 *  The width of the image in pixels.
	 *
	 * @param {Number} height
	 *  The height of the image in pixels.
	 *
	 * @returns {Object}
	 *  A new image element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.image
	 * @function
	 */


	/**
	 * Retrieves or updates attributes of an element previously returned by 
	 * one of the element constructors, optionally animating in the changes.
	 *
	 * @private
	 * 
	 * @param {Object} element
	 *  The element to read or update, previously returned by an element
	 *  constructor.
	 *
	 * @param {Object|String} attributes|key
	 *  If an object is given, sets property values to update in the element. If
	 *  a string is given, returns the attribute value for the given key.
	 *
	 * @param {aperture.animate.Transition} [transition]
	 *  The optional animated transition to use. Only applicable when setting attribues.
	 *
	 * @returns the attribute value if reading attribute value, otherwise this.
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.attr
	 * @function
	 */

	/**
	 * If an element argument is supplied, removes the element 
	 * and destroys it, otherwise the graphics context itself is
	 * removed and destroyed.
	 *
	 * @private
	 * 
	 * @param {Object} [element]
	 *  The element to remove, previously returned by an element
	 *  constructor.
	 *
	 * @returns {Object|aperture.canvas.Graphics}
	 *  The element removed.
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.remove
	 * @function
	 */
	
	/**
	 * If an elements argument is supplied, removes the elements
	 * specified and destroys them, otherwise all elements are removed.
	 *
	 * @private
	 * 
	 * @param {Array} [elements]
	 *  Optionally, the elements to remove, previously returned by element
	 *  constructors.
	 *      
	 * @name aperture.canvas.VectorGraphics.prototype.removeAll
	 * @function
	 */
	
	/**
	 * Applies an appearance transition to a new element, if
	 * supplied. If not supplied this method has no effect.
	 *
	 * @private
	 * 
	 * @param {Object} element
	 *  The element to apparate, previously returned by an element
	 *  constructor.
	 *
	 * @param {aperture.animate.Transition} [transition]
	 *  The optional animated transition to use.
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.apparate
	 * @function
	 */

	return namespace;

}(aperture.canvas || {}));

/**
 * Source: Animation.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Animation APIs
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	namespace.Transition = aperture.Class.extend( 'aperture.Transition',
	/** @lends aperture.Transition.prototype */
	{
		/**
		 * @class Represents an animated transition, consisting of
		 * an interpolation / easing / tween function, and a length
		 * of time over which the transition will occur. Transitions may
		 * be optionally passed into the Layer update function to animate
		 * any updates which will occur.
		 *
		 * @constructs
		 * @extends aperture.Class
		 *
		 * @param {Number} [milliseconds=300]
		 *      the length of time that the transition will take to complete.
		 *
		 * @param {String} [easing='ease']
		 *      the function that will be used to transition from one state to another.
		 *      The standard CSS options are supported:<br><br>
		 *      'linear' (constant speed)<br>
		 *      'ease' (default, with a slow start and end)<br>
		 *      'ease-in' (slow start)<br>
		 *      'ease-out' (slow end)<br>
		 *      'ease-in-out' (similar to ease)<br>
		 *      'cubic-bezier(n,n,n,n)' (a custom function, defined as a bezier curve)
		 *
		 * @param {Function} [callback]
		 *      a function to invoke when the transition is complete.
		 *
		 * @returns {this}
		 *      a new Transition
		 */
		init : function( ms, easing, callback ) {
			this.time = ms || 300;
			this.fn = easing || 'ease';
			this.end = callback;
		},

		/**
		 * Returns the timing property.
		 *
		 * @returns {Number}
		 *      the number of milliseconds over which to complete the transition
		 */
		milliseconds : function ( ) {
			return this.time;
		},

		/**
		 * Returns the easing property value.
		 *
		 * @returns {String}
		 *      the function to use to transition from one state to another.
		 */
		easing : function ( ) {
			return this.fn;
		},

		/**
		 * Returns a reference to the callback function, if present.
		 *
		 * @returns {Function}
		 *      the function invoked at transition completion.
		 */
		callback : function ( ) {
			return this.end;
		}
	});

	return namespace;

}(aperture || {}));
/**
 * Source: Layer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Abstract Layer Class Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	
	// PRIVATE REFERENCES AND FUNCTIONS
	/**
	 * Keep a running globally unique id set such that each render node can have a
	 * unique id.  This allows nodes to be easily hashed.
	 */
	var log = aperture.log,
		nextUid = 1,
		NO_GRAPHICS = aperture.canvas.NO_GRAPHICS,
		
		// util is always defined by this point
		util = aperture.util,
		forEach = util.forEach,
		indexOf = util.indexOf;

	/**
	 * Given a Node object create a derived node that shares the source's
	 * core features (such as position, anchor, etc) but has a fresh (empty) userData
	 * object
	 */
	function addNode( layer, parent, prev, data ) {
		// Derive an object
		var node = util.viewOf( parent ),
			sibs = parent.kids,
			luid = layer.uid;
		
		// append ourselves to existing siblings.
		(sibs[luid] || (sibs[luid] = [])).push(node);
		
		// Initialize unique properties.
		node.uid      = (nextUid++).toString();
		node.parent   = parent;
		node.next     = null;
		node.prev     = null;
		node.layer    = layer;
		node.kids     = {};
		node.userData = {};
		node.graphics = NO_GRAPHICS;

		// Set data if given, otherwise it will inherit it.
		if( data ) {
			node.data = data;
			node.idFn = layer.idFunction;
		}
		
		// do graphics construction.
		updateVisibility(node);
		
		linkNode(node, prev);
		
		return node;
	}

	
	/**
	 * Default data item function
	 */
	var inherited = (function() {
		var copydata = [null], nodata = []; // use these once
		
		return function(data) {
			return data? copydata : nodata;
		};
	}());
	
	
	/**
	 * Updates the visibility, creating the graphics for the first time if necessary,
	 * and returns true if showing. 
	 */
	function updateVisibility( node ) {
		var layer = node.layer;
		
		if (layer) {
		
			var show = layer.valueFor('visible', node.data, true );

			// reset.
			node.appearing = false;
		
			if (show) {
				if (node.graphics === NO_GRAPHICS && node.parent.graphics) {
					var g = node.graphics = layer.canvas_.graphics( node.parent.graphics ).data( node );
				
					// event hooks for any current events
					forEach(layer.handlers_, function(h, key) {
						g.on(key, this);
					}, layer);
				
					node.appearing = true;
				
				} else {
					node.appearing = node.graphics.display(true);
				}
			
			} else if (node.graphics) {
				node.graphics.display(false);
			}
		
			return show;
		}
	}

	/**
	 * Link a new node into the list. For optimal traversal and removal nodes
	 * store references their adjacent nodes rather than externalizing that in a list structure.
	 */
	function linkNode( node, prev ) {
		if (prev == null) {
			// Insert node at head of layer's node list
			node.next = node.layer.nodes_;
			node.layer.nodes_ = node;
			node.prev = null;
		} else {
			// Insert node elsewhere
			node.next = prev.next;
			prev.next = node;
			node.prev = prev;
		}
		if (node.next) {
			node.next.prev = node;
		}
	}

	/**
	 * Remove a node from the linked list.
	 */
	function unlinkNode( c ) {
		
		// stitch
		if (c.prev) {
			c.prev.next = c.next;
		} else {
			c.layer.nodes_ = c.next;
		}
		
		if (c.next) {
			c.next.prev = c.prev;
		} 
	}
	
	/**
	 * node removal function.
	 */
	function removeNode(c) {
		var sibs = c.parent.kids[c.layer.uid],
			ixMe = indexOf(sibs, c);
		
		if (ixMe !== -1) {
			sibs.splice(ixMe, 1);
		}
		
		// cleanup graphics.
		c.graphics.remove();
		c.graphics = null;
		c.layer = null;
	}
	
	/**
	 * Private function called by processChangeSet invoked if the layer has local data and
	 * is not being built up from scratch.
	 */
	function processDataChanges( myChangeSet, parentChangeSet ) {
		var chgs = myChangeSet.changed, c;

		
		// DATA CHANGED? SORT *ALL* CHANGES OUT AND RETURN
		// if our data changes, we have to execute a full pass through everything
		// to sort into add/changed/removed. Adds and removes are always processed, and changes
		// are only marked if the hints dictate a data changed happened. this could be made more
		// efficient if data models exposed chg fns to the user - i.e. w/ adds, joins etc.
		if (this.dataChangeHints) {
			var allParents  = (this.parentLayer_ && this.parentLayer_.nodes_) || this.rootNode_,
				adds = myChangeSet.added,
				rmvs = myChangeSet.removed,
				myUid = this.uid,
				idFunction = this.idFunction,
				prev, dad, i;
			
			// form new ordered list of nodes.
			this.nodes_ = null;
			
			// re-compare EVERYTHING and sort into add/changed/removed
			for (dad = allParents; dad != null; dad = dad.next) {
				var existing = indexNodes(dad.kids[myUid]),
					newkids = dad.kids[myUid] = [];

				// for all my new items, look for matches in existing.
				forEach( this.dataItems( dad.data ), function( dataItem ) {
					c = null;
					
					var dataId = idFunction? idFunction.call(dataItem) : dataItem;
						
					for (i = existing.next; i != null; i = i.next) {
						c = i.node;

						// match?
						if ((c.idFn? c.idFn.call(c.data) : c.data) === dataId) {
							// remove it by stitching adjacent nodes together.
							// Makes subsequent searches faster and will leave
							// existing with only the things that have been removed.
							i.prev.next = i.next;
							if (i.next) {
								i.next.prev = i.prev;
							}
							
							break;
							
						} else {
							c = null;
						}
					}
					
					// found? process change
					if (c) {

						// readd to fresh kid list
						newkids.push(c);
						
						// link it back in.
						linkNode( c, prev );
					
						// update data reference.
						c.data = dataItem;
						c.idFn = idFunction;

						// only process further if showing and hints say data actually changed
						if (updateVisibility(c) && this.dataChangeHints.changed) {
							chgs.push(c);
						}
						
					// else make new
					} else {
						adds.push( c = addNode( this, dad, prev, dataItem ) );
					}
					
					prev = c;
					
				}, this);

				// whatever is left is trash. these are already removed from our locally linked list.
				for (i = existing.next; i != null; i = i.next) {
					rmvs.push(i.node);
				}
			}
			
		// SHORTCUT: EVERYTHING IS A SIMPLE UPDATE AND I AM THE ROOT
		// last of the special cases. If we receive this we are the first in traversal
		// that contains data and our job is to simply to add everything visible as changed.
		// thereafter children will pick it up properly and interpret in the node of any data changes.
		// we know there are no removes or adds, since we are top in the chain and we already looked locally
		} else if (myChangeSet.updateAll) {
			for (c = this.nodes_; c != null; c = c.next) {
				if (updateVisibility(c)) {
					chgs.push(c);
				}
			}
			
		// else process parent changes as usual.
		} else {					
			return false;
		}
		
		// clear
		myChangeSet.updateAll = false;
		
		return true;
	}

	/**
	 * Creates and returns an iterable, modifiable snapshot of the specified node list,
	 * where the first element is a non-node reference to the first node.
	 */
	function indexNodes(nodes) {
		var h = {}; // head element is not a node.

		if (nodes) {
			var n = nodes.length, 
				i, it = h;
			
			for (i=0; i< n; ++i) {
				it = it.next = {
					prev : it,
					node : nodes[i]
				};
			}
		}
		
		return h;
	}
	
	/**
	 * Default idFunctions, if id's exist or not.
	 */
	function getId() {
		return this.id;
	}

	
	
	// LAYER CLASS
	var Layer = aperture.Class.extend( 'aperture.Layer',

		/** @lends aperture.Layer# */
		{
			/**
			 * @class A layer represents a set of like graphical elements which are mapped
			 * in a spatial node. Layer is the abstract base class of all graphical layers.
			 *
			 * Layer is abstract and not to be constructed directly.
			 * See {@link aperture.PlotLayer#addLayer addLayer} for an example of how to add layers
			 * to a vizlet.
			 *
			 * All layers observe the following mapping:

			 * @mapping {Boolean=true} visible
			 *   Whether or not a layer item should be displayed.
			 *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Class
			 *
			 * @param {Object} spec
			 *   A specification object that contains initial values for the layer.
			 *   
			 * @param {aperture.PlotLayer} spec.parent
			 *   The parent layer for this layer. May be null.
			 *   
			 * @param {aperture.canvas.Canvas} spec.parentCanvas
			 *   The parent's canvas, never null.
			 *   
			 * @param {Object} [spec.mappings]
			 *   Optional initial simple property : value mappings. More advanced
			 *   mappings can be defined post-construction using the {@link #map}
			 *   function.
			 */
			init : function( spec, mappings ) {

				spec = spec || {};

				/**
				 * @private
				 * 
				 * A Unique layer id string.
				 */
				this.uid = (nextUid++).toString();

				/**
				 * @private
				 * This layer's parent layer
				 */
				this.parentLayer_ = spec.parent;

				/**
				 * @private
				 * This layer's root vizlet node.
				 */
				this.rootNode_ = spec.rootNode;
				
				/**
				 * @private
				 * This layer's root vizlet.
				 */
				this.vizlet_ = spec.vizlet || this;
				
				/**
				 * @private
				 * This layer's canvas
				 */
				this.canvas_ = spec.parentCanvas && spec.parentCanvas.canvas(this.canvasType);

				/**
				 * @private
				 * An object containing the currently mapped event handlers registered by
				 * a call to on().  This object is structured as a map of event types to
				 * an array of callback functions.
				 */
				this.handlers_ = {};

				/**
				 * @private
				 * Tracks switches between local and inherited only data.
				 */
				this.renderedLocalData_ = false;
				
				
				/**
				 * @private
				 * An array of nodes rendered by this layer.  Generally this
				 * list should only be used by the internal logic responsible for the layer
				 * rendering management.
				 */
				this.nodes_ = undefined;

				/**
				 * @private
				 * A data accessor function which returns an array of data items. 
				 * The function will take a parent data item as an argument, which will be
				 * ignored if data values were set explicitly. Unless data is explicitly set
				 * for this layer this function will return an array containing a single local data
				 * element of undefined, reflecting an inheritance of the parent data item.
				 */
				this.dataItems = inherited;

				/**
				 * @private
				 * True if the layer has locally defined data, false if inherited.
				 */
				this.hasLocalData = false;
				
				/**
				 * @private
				 * A hash of visualProperty names to mapping information objects.  Inherits parent's
				 * mappings if this layer has a parent.
				 */
				if( this.parentLayer_ && this.parentLayer_.mappings ) {
					// Inherit mappings from parent
					this.maps_ = util.viewOf( this.parentLayer_.mappings() );
				} else {
					// No parent mappings, no inherit
					this.maps_ = {};
				}

				// Add all initial mappings (order is important here)
				this.mapAll(spec.mappings);
				this.mapAll(mappings);
			},

			/**
			 * Removes a layer from its parent.
			 *
			 * @returns {aperture.Layer}
			 *      This layer.
			 */
			remove : function( ) {
				if (this.parentLayer_) {

					// Remove from layer list
					this.parentLayer_.layers_ = util.without( this.parentLayer_.layers_, this );
					this.parentLayer_ = null;

					// remove all graphics
					var c;
					for (c = this.nodes_; c != null; c = c.next) {
						removeNode(c);
					}
					
					this.nodes_ = null;
				}

				return this;
			},

			/**
			 * Returns a {@link aperture.Mapping Mapping} for a given graphic property
			 * to map it from source values. Map is a key function in layers, responsible
			 * for the transformation of data into visuals. Mappings inherit from parent
			 * mappings in the layer hierarchy unless cleared or overridden.
			 *
			 * @param {String} graphicProperty
			 *      The graphic property to return a map for.
			 *
			 * @returns {aperture.Mapping}
			 *      A mapping for this property.
			 */
			map : function ( graphicProperty ) {
				var maps = this.maps_;
				
				// If already have our own local mapping for this, return it
				if( maps.hasOwnProperty(graphicProperty) ) {
					return maps[graphicProperty];
				} 

				// Else must derive a mapping from the parent's mapping 
				// This allows us to first map 'x' in a child layer and then
				// map 'x' in the parent and the mappings will still be shared
				var mapping = this.parentLayer_? 
					util.viewOf(this.parentLayer_.map( graphicProperty )) :
						new namespace.Mapping(graphicProperty);

				return (maps[graphicProperty] = mapping);
			},

			/**
			 * Takes an object and maps all properties as simple values.
			 *
			 * @param {Object} propertyValues
			 *      The object with property values to map.
			 *
			 * @returns {aperture.Layer}
			 *      This layer.
			 */
			mapAll : function ( propertyValues ) {
				forEach(propertyValues, function(value,key) {
					this.map(key).asValue(value);
				}, this);
			},

			/**
			 * Returns an object with properties and their mappings.
			 * @returns {Object} An object with properties and their mappings.
			 */
			mappings : function( ) {
				return this.maps_;
			},

			/**
			 * @private
			 * Returns the value for a supplied visual property given the  object that
			 * will be the source of the data for the mapping.  If the name of the property
			 * does not have a corresponding mapping undefined will be returned.
			 *
			 * @param {String} property
			 *      The name of the visual property for which a value is requested
			 * @param {Object} dataItem
			 *      The data item that will be used as the data source for the mapping
			 * @param {Object} [defaultValue]
			 *      An optional default value that will be returned if a mapping for this
			 *      visual property does not exist.
			 * @param {Number} [index]
			 *      One or more optional indexes to use if this is an array-based visual property
			 *
			 * @returns the value of the visual property based on the mapping or undefined
			 * if no mapping is defined.
			 */
			valueFor : function( property, dataItem, defaultValue, index ) {
				// NOTE TO SELF: would be more optimal if index... was an array rather than args

				var mapping = this.maps_[property];
				if( mapping ) {
					// Create arguments to pass to "valueFor" [layer, dataItem, index, ...]
					var args = Array.prototype.slice.call(arguments, 3);
					var value = mapping.valueFor( dataItem, args );

					if (value != null) {
						return value;
					}
				}
				// No parent, no value, use default (or return undefined)
				return defaultValue;
			},

			/**
			 * @private
			 * Returns one or more values transformed using registered mappings. This method
			 * is similar to valueFor but excludes the data lookup.
			 *
			 * @param {Object|String,Object} properties
			 *      Named property values to transform using the layer's mapping, supplied
			 *      as an object or a name argument and value argument.
			 *
			 * @returns the values of the visual properties as an object if called with an object,
			 * 		or as a single transformed value if called with name, value arguments. If
			 * 		no mapping exists this method will return undefined.
			 */
			transform : function( properties, value, filterData, filterIndex ) {
				var mapping;
				
				if (properties) {
					if (arguments.length > 1) {
						if (mapping = this.maps_[properties]) {
							return mapping.value( value, filterData, filterIndex );
						}
					} else {
						var mapped = {};
						var maps = this.maps_;
						
						forEach(properties, function(value, value) {
							if (mapping = maps[name]) {
								mapped[name] = mapping.value( value, filterData, filterIndex );
							}
						});
						
						return mapped;
					}
				}
			},

			/**
			 * @private
			 * Returns the values for a supplied set of visual properties given the object that
			 * will be the source of the data for the mapping.  If the name of the property
			 * does not have a corresponding mapping undefined will be returned.
			 *
			 * @param {Object} properties
			 *      The visual properties for which values are requested, with default
			 *      values.
			 * @param {Object} dataItem
			 *      The data item that will be used as the data source for the mapping
			 * @param {Object} [index]
			 *      An optional index to use if this is an indexed set of visual properties
			 *
			 * @returns {Object} the values of the visual properties based on the mappings.
			 *
			 */
			valuesFor : function( properties, dataItem, index ) {
				var property, mapping, value, values= {};

				for (property in properties) {
					if (properties.hasOwnProperty(property)) {
						values[property] = (mapping = this.maps_[property]) &&
							(value = mapping.valueFor( dataItem, index || [] )) != null?
									value : properties[property];
					}
				}

				return values;
			},

			/**
			 * @private
			 * The type of canvas that this layer requires to render.  At minimum,
			 * the following types are supported:
			 * <ul>
			 * <li>aperture.canvas.DIV_CANVAS</li>
			 * <li>aperture.canvas.VECTOR_CANVAS</li>
			 * </ul>
			 * The canvasType property is used by parent layers to attempt to provide the
			 * desired {@link aperture.Layer.Node} to this layer during
			 * render.
			 */
			canvasType : aperture.canvas.DIV_CANVAS,


			/**
			 * Returns the logical set of all layer nodes, or (re)declares it by providing source data
			 * for each node to be mapped from. 
			 *
			 * @param {Array|Object|Function} data
			 *      the array of data objects, from which each node will be mapped.  May be an array 
			 *      of data objects, a single data object, or a function that subselects data objects
			 *      from each parent data object.  If an array of data is given a graphic
			 *      will be created for each item in the array.  If the parent layer has more than
			 *      one data item, data items will be rendered per parent data
			 *      item.  
			 *      
			 * @param {Function|String} [idFunction]
			 *      optionally a function or field name that supplies the id for a data item to
			 *      match items from one update to another. If a function is supplied it will be called 
			 *      with the item as a parameter. If not supplied, id functions will be remembered from 
			 *      previous calls to this method, but can be cleared by specifying null. If never
			 *      supplied, a best guess is made using item.id for matching if found in the data set 
			 *      supplied, or exact object instances if not.
			 *      
			 * @returns {aperture.Layer.NodeSet}
			 *      the logic set of all layer nodes.
			 */
			all : function ( data, idFunction ) {
				return this.join.apply( this, arguments ); // not implemented yet.
			},

			/**
			 * Merges in new data, returning the logical set of all layer nodes. This method differs
			 * from {@link #all} only in that it compares the new data set to the old data set and if 
			 * the same node is identified in both it will update the existing one rather than creating a
			 * new one. A common use case for joins is to animate transitions between data sets.
			 */
			join : function( data, idFunction ) {
				if (arguments.length !== 0) {
					this.dataItems = inherited;
					this.hasLocalData = false;
					
					// Set new data mapping/array if given
					if ( data ) {
						this.hasLocalData = true;
						
						// Mapping function for parent data
						if( util.isFunction(data) ) {
							this.dataItems = data;
							data = null;
							
						} else {
							// If not an array, assume a single data object, create an array of 1
							if ( !util.isArray(data) ) {
								data = [data];
							}
							this.dataItems = function() {
								return data;
							};
							this.dataItems.values = data;
						}
					}
					
					// handle simple field names as well as functions.
					if ( idFunction !== undefined ) {
						if ( util.isString(idFunction) ) {
							this.idFunction = idFunction === 'id'? getId : function() {
								return this[idFunction];
							};
						} else {
							this.idFunction = idFunction;
						}
						
					} else if (!this.idFunction) {
						// best guess: use id if it seems to be there, otherwise test the instance.
						this.idFunction = data && data.length && data[0].id? getId : null;
					}
					
					// mark everything changed for next render loop.
					this.dataChangeHints = {
						delta: true,
						changed: true
					};
				}
				
				return new aperture.Layer.LogicalNodeSet(this);
			},
			
			/**
			 * Adds to the logical set of all layer nodes, returning the set of added items. The idFunction, 
			 * if given via join or all, remains unchanged.
			 * 
			 * @param {Array|Object} data
			 *      the array of data objects, from which each node will be mapped.  May be an array 
			 *      of data objects or a single data object, and may not be a data subselection function.  
			 *      If this layer already gets its data from a subselection function set through {@link #all} 
			 *      or {@link #join}, this function will fail.
			 *      
			 * @returns {aperture.Layer.NodeSet}
			 *      the set of added layer nodes.
			 */
			add : function( data ) {
				if (this.hasLocalData && this.dataItems.values) {
					// Existing dataset to add to
					var newData = this.dataItems.values.concat(data);
					this.dataItems = function() {
						return newData;
					};
					this.dataItems.values = newData;

					this.dataChangeHints = this.dataChangeHints || {};
					this.dataChangeHints.delta = true;

					// return a nodeset filtered to the new data
					return new aperture.Layer.LogicalNodeSet(this).where(data);
				} else if (this.hasLocalData) {
					// Local data is a function operator on the parent, illegal call to add
					throw new Error('Can only add data to a layer with a dataset already specified');
				} else {
					// No local data, this add is the same as calling all
					return this.all(data);
				}
			},

			/**
			 * @private
			 * Removes the contents of a nodeset from this layer's data. This is used internally
			 * by the framework, {@link aperture.Layer.NodeSet#remove} should be used instead of
			 * this method.
			 * 
			 * @param {aperture.Layer.NodeSet} nodeset
			 *      The set of data nodes to remove from this layer.
			 *
			 * @returns {aperture.Layer.NodeSet} the removed nodeset
			 */
			removeNodeSet : function ( nodeset ) {
				if (this.hasLocalData && this.dataItems.values) {
					var removeIter = nodeset.data(),
						removedArray = [],
						node;

					// Create searchable array of values to remove from iter
					while (node = removeIter.next()) {
						removedArray.push(node);
					}

					// filter out values to remove
					var newData = util.filter(this.dataItems.values, function(value) {
						return !util.has(removedArray, value);
					});

					this.dataItems = function() {
						return newData;
					};
					this.dataItems.values = newData;

					// Mark delta changes, no changes to existing data
					this.dataChangeHints = this.dataChangeHints || {};
					this.dataChangeHints.delta = true;

					// return a nodeset filtered to the new data
					return nodeset;
				} else {
					// Local data is a function operator on the parent, illegal call to add
					throw new Error('Can only remove data from a layer with a dataset already specified');
				}
			},
			
			/**
			 * @private
			 * Forms the change list for this layer and returns it.  An object containing information about the data or
			 * visual changes as they pertain to the parent layer is provided.
			 * 
			 * @param {Object} parentChangeSet
			 * @param {Array} parentChangeSet.updates a list of visible Nodes that are added or changed.
			 * this is the list that a graphic child should redraw.
			 * @param {Array} parentChangeSet.added a list of new Node objects pertaining to added data
			 * @param {Array} parentChangeSet.changed a list of visible Node objects pertaining to changed data.
			 * @param {Array} parentChangeSet.removed a list of Nodes that should be removed due to the
			 * removal of the corresponding data
			 *
			 * @returns {Object}
			 *      the changeSet object that this layer may be given to render itself
			 */
			processChangeSet : function ( parentChangeSet ) {
				
				var myChangeSet = util.viewOf( parentChangeSet ),
					myUid = this.uid,
					hasLocalData = this.hasLocalData,
					c, i, n;

				// inherit most things but not these
				var chgs = myChangeSet.changed = [],
					adds = myChangeSet.added = [],
					rmvs = myChangeSet.removed = [];

				// If "changes" in parent changeset represent actual *data* changes, mark our change hints to
				// reflect this. Will result in full reprocess of data
				if (parentChangeSet.dataChanged && hasLocalData && !this.dataItems.values) {
					this.dataChangeHints = this.dataChangeHints || {};
					this.dataChangeHints.changed = true;
				}

				// Mark set of "changes" in this changeset as actual *data* changes not just requests to redraw
				// if data in this layer was actually changed or flag is cascading down from parent and this layer's
				// data is computed via data subselect
				myChangeSet.dataChanged = this.dataChangeHints && this.dataChangeHints.changed;
				

				// SHORTCUT REMOVAL
				// if we rendered local data last time and not this, or vice versa,
				// we need to destroy everything and rebuild to respect new orders of data.
				if (this.renderedLocalData_ != hasLocalData) {
					this.renderedLocalData_ = hasLocalData;
	
					for (c = this.nodes_; c != null; c = c.next) {
						rmvs.push(c); // don't need to unlink - we are resetting the list.
					}
					
					this.nodes_ = null; // trigger rebuild below
				}
				
				
				var prev, dad;
				
				// SHORTCUT REBUILD
				// if complete build, spawn all new nodes.
				if ( !this.nodes_ ) {
					for (dad = (this.parentLayer_ && this.parentLayer_.nodes_) || this.rootNode_; dad != null; dad = dad.next) {
						forEach( this.dataItems( dad.data ), function( dataItem ) {
							adds.push( prev = addNode( this, dad, prev, dataItem ) );
							
						}, this);
					}
					
					// if we are in the change set but have no nodes of our own, implicitly
					// select all children. set this flag for descendants to find.
					if ( !this.nodes_ && myChangeSet.rootSet.hasLayer(this) ) {
						myChangeSet.updateAll = true;
					}
					
					
				// NO DATA OF OUR OWN?
				// when we own data we maintain a node set PER parent node, else there is one per parent node.
				// if we didn't build have been this way before and we know we can trust the list of parent changes.
				} else if( !hasLocalData || !processDataChanges.call( this, myChangeSet, parentChangeSet )) {
					
					// REMOVE ALL MY CHILDREN OF REMOVED
					forEach( parentChangeSet.removed, function(dad) {
						var mine = dad.kids[myUid];
						
						n = mine && mine.length;
							
						// append to removals and remove from local linked list.
						if (n) {
							for (i=0; i<n; ++i) {
								rmvs.push( c = mine[i] );
								unlinkNode(c);
							}
						}
						
					}, this);
					
					// CHANGE ALL MY VISIBLE CHILDREN OF CHANGED
					// notice currently that a change to a parent means a change to all children.
					forEach( parentChangeSet.changed, function(dad) {
						var mine = dad.kids[myUid];
						n = mine && mine.length;
						
						if (n) {
							for (i=0; i<n; ++i) {
								if (updateVisibility( c = mine[i] )) {
									chgs.push(c);
								}
							}
						}
						
					}, this);

					// THEN ADD ALL CHILDREN OF ADDS.
					// then finally process all adds. we do this last so as not to search these in change matching
					forEach( parentChangeSet.added, function(dad) {
						var pk = dad.prev && dad.prev.kids[myUid];
						
						// insert in the same place locally as in parent, though it doesn't really matter.
						prev = pk && pk.length && pk[pk.length-1];
						
						forEach( this.dataItems( dad.data ), function( dataItem ) {
							adds.push(prev = addNode( this, dad, prev, dataItem ));
							
						}, this);
						
					}, this);
					
				}
	
				

				// CLEAN UP REMOVALS
				// finish processing all removals by destroying their graphics.
				forEach( rmvs, function(c) {
					removeNode(c);
				}, this);

			
				
				// ALSO ANY OF MY NODES MARKED INDEPENDENTLY AS CHANGED
				if (myChangeSet.rootSet.hasLayer(this)) {
					for (i = myChangeSet.rootSet.nodes(this); (c = i.next()) != null;) {
						// only add to list if showing (removals will not be showing either) and not already there
						// Add node to list of changes (if not already there)
						if( indexOf(chgs, c) === -1 && indexOf(adds, c) === -1 && updateVisibility(c) ) {
							chgs.push(c); // TODO: hash?
						}
					}
				}

				
				// FORM JOINED LIST OF UPDATED NODES
				// adds always propagate down, but not changes if they are not visible.
				// form the list here of everything that need drawing/redrawing.
				if (adds.length !== 0) {
					var draw = myChangeSet.updates = myChangeSet.changed.slice();
					
					// on construction we did not create graphics unless it was visible
					forEach(adds, function(c) {
						if (c.graphics !== NO_GRAPHICS) {
							draw.push(c);
						}
					}, this);
					
				} else {
					myChangeSet.updates = myChangeSet.changed;
					
				}
				
				
				// DEBUG - log all updates.
				if ( log.isLogging(log.LEVEL.DEBUG ) ) {
					var alist = ' + ', clist = ' * ', rlist= ' - ';
					
					forEach(myChangeSet.added, function(c){
						alist+= c.uid + ', ';
					});
					forEach(myChangeSet.changed, function(c){
						clist+= c.uid + ', ';
					});
					forEach(myChangeSet.removed, function(c){
						rlist+= c.uid + ', ';
					});
					
					log.debug('>> ' + this.typeOf());
					log.debug(alist);
					log.debug(clist);
					log.debug(rlist);
				}

				// Done processing changes, reset hints
				this.dataChangeHints = null;
				
				return myChangeSet;
			},
			

			/**
			 * Brings this layer to the front of its parent layer.
			 * 
			 * @returns {this}
			 *      this layer
			 */
			toFront : function () {
				if (this.parentLayer_) {
					var p = this.parentLayer_.layers_,
						i = indexOf(p, this),
						c;
					if (i !== p.length-1) {
						p.push(p.splice(i, 1)[0]);
						
						for (c = this.nodes_; c != null; c = c.next) {
							c.graphics.toFront();
						}
					}
				}
				return this;
			},
			
			/**
			 * Pushes this layer to the back of its parent layer.
			 * 
			 * @returns {this}
			 *      this layer
			 */
			toBack : function () {
				if (this.parentLayer_) {
					var p = this.parentLayer_.layers_,
						i = indexOf(p, this), 
						c;
					if (i !== 0) {
						p.splice(0,0,p.splice(i, 1)[0]);
						
						for (c = this.nodes_; c != null; c = c.next) {
							c.graphics.toBack();
						}
					}
				}
				return this;
			},
			
			/**
			 * @private
			 * The render function is called by the default implementation of a parent layer render()
			 * should be implemented to actually perform this layer's render logic.
			 * The changeSet object will contain Node objects that pertain to this
			 * layer's data.
			 *
			 * If this layer is responsible for drawing visual items, this function should
			 * update all visuals as described by the adds, changes, and removes in the
			 * changeSet object.  The Node objects provided in the changeSet object are owned
			 * by this layer and not shared with any other layer.  This layer is free to
			 * modify the Node.userData object and store any data-visual specific
			 * objects.  The same Node object will be maintained through all calls
			 * to render thoughout the life of the associated data object.
			 *
			 * @param {Object} changeSet
			 * @param {Array} changeSet.updates a list of visible Nodes that are added or changed.
			 * this is the list that a graphic child should redraw.
			 * @param {Array} changeSet.added a list of new Node objects pertaining to added data
			 * @param {Array} changeSet.changed a list of visible Node objects pertaining to changed data
			 * @param {Array} changeSet.removed a list of Nodes that should be removed due to the
			 * removal of the corresponding data
			 */
			render : function( changeSet ) {
			},

			/**
			 * Registers a callback function for a given event type on the visuals
			 * drawn by this layer.  Valid event types include DOM mouse events plus some
			 * custom events:
			 * <ul>
			 * <li>click</li>
			 * <li>dblclick</li>
			 * <li>mousedown</li>
			 * <li>mousemove</li>
			 * <li>mouseout</li>
			 * <li>mouseover</li>
			 * <li>mouseup</li>
			 * <li>touchstart</li>
			 * <li>touchmove</li>
			 * <li>touchend</li>
			 * <li>touchcancel</li>
			 * <li>drag</li>
			 * <li>dragstart*</li>
			 * <li>dragend*</li>
			 * </ul>
			 *
			 * Returning a truthy value from a callback indicates that the event is consumed
			 * and should not be propogated further.<br><br>
			 * 
			 * *Note that registration for <code>drag</code> events will result in the drag
			 * handler being called for drag, dragstart, and dragend events, distinguishable
			 * by the eventType property of the Event object. Attempts to register for dragstart and
			 * dragend events individually will have no effect.
			 * 
			 * @param {String} eventType
			 *      the DOM event name corresponding to the event type for which this callback
			 *      will be registered
			 * @param {Function} callback
			 *      the callback function that will be called when this event is triggered.
			 *      The callback function will be called in the this-node of this layer.
			 *      The function will be passed an object of type {@link aperture.Layer.Event}
			 */
			on : function( eventType, callback ) {
				var h = this.handlers_, c;
				
				if (!h[eventType]) {
					h[eventType] = [callback];
					
					// need one hook only for all clients
					for (c = this.nodes_; c != null; c = c.next) {
						c.graphics.on(eventType, this);
					}
					
				} else {
					h[eventType].push(callback);
				}
			},

			/**
			 * Removes a registered callback(s) for the given event type.
			 *
			 * @param {String} eventType
			 *      the DOM event name corresponding to the event type to unregister
			 * @param {Function} [callback]
			 *      an optional callback function.  If given this specific callback
			 *      is removed from the event listeners on this layer.  If omitted,
			 *      all callbacks for this eventType are removed.
			 */
			off : function( eventType, callback ) {
				var h = this.handlers_, c;
				
				if( callback ) {
					h[eventType] = util.without( h[eventType], callback );
				} else {
					h[eventType] = [];
				}
				
				// all handlers gone for this? then remove hook.
				if (h[eventType].length === 0) {
					for (c = this.nodes_; c != null; c = c.next) {
						c.graphics.off(eventType, this);
					}
					
					h[eventType] = null;
				}
			},

			/**
			 * Fires the specified event to all handlers for the given event type.
			 *
			 * @param {String} eventType
			 *      the DOM event name corresponding to the event type to fire
			 * @param {aperture.Layer.Event} event
			 *      the event object that will be broadcast to all listeners
			 */
			trigger : function( eventType, e ) {
				var r = util.forEachUntil( this.handlers_[eventType], function( listener ) {
					return listener.call(this, e);
				}, true, this);
				
				if (r && e && e.source) {
					e = e.source;
					
					if (e.stopPropagation) {
						e.stopPropagation();
					} else {
						e.cancelBubble = true;
					}
				}

				return r;
			},

			/**
			 * Returns the parent (if it exists) of this layer.
			 */
			parent : function() {
				return this.parentLayer_;
			},


			/**
			 * Returns the containing vizlet for this layer.
			 */
			vizlet : function() {
				return this.vizlet_;
			}
			
		}
	);

	// expose item
	namespace.Layer = Layer;



	var PlotLayer = Layer.extend( 'aperture.PlotLayer',
	/** @lends aperture.PlotLayer# */
	{
		/**
		 * @class An extension of layer, Plot layers can contain child layers.
		 * @augments aperture.Layer
		 *
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);

			/**
			 * @private
			 * An array of child layer objects
			 */
			this.layers_ = [];

		},

		/**
		 * Creates and adds a child layer of the specified type.
		 * Child layers will inherit all mappings and data from their parent layer.
		 *
		 * @example
		 * plot.addLayer( aperture.LabelLayer, {
		 *      font-family: 'Segoe UI',
		 *      fill: 'white'
		 * });
		 *
		 * @param {aperture.Layer} layer
		 *      The type of layer to construct and add.
		 *
		 * @param {Object} [mappings]
		 *      Optional initial simple property : value mappings. More advanced
		 *      mappings can be defined post-construction using the {@link #map}
		 *      function.
		 *
		 * @param {Object} [spec]
		 *      An optional object containing specifications to pass to the layer constructor.
		 *      This specification will be extended with parent and canvas information.
		 *
		 * @returns {aperture.Layer}
		 *      the created child layer
		 */
		addLayer : function( layerCtor, mappings, spec ) {

			spec = spec || {};

			util.extend( spec, {
					parent : this,
					vizlet : this.vizlet_,
					rootNode : this.rootNode_,
					parentCanvas : this.canvas_
				}, this.layerSpec_ );

			var layer = new layerCtor(spec, mappings);

			// Add to layer list
			this.layers_.push( layer );

			return layer;
		},

		/**
		 * @private
		 * 
		 * Overrides the base Layer implementation of render to draw children.
		 */
		render : function( changeSet ) {
			
			if ( log.isLogging(log.LEVEL.DEBUG ) ) {
				log.indent(4);
			}
			
			// invoke draw of all child layers after building a change set for each.
			forEach( this.layers_, function (layer) {
				this.renderChild( layer, layer.processChangeSet(changeSet) );
				
			}, this);

			if ( log.isLogging(log.LEVEL.DEBUG ) ) {
				log.indent(-4);
			}
			
		},

		/**
		 * @private
		 * 
		 * Overridden to remove and clean up child layers.
		 */
		remove : function( ) {
			if (this.parentLayer_) {
				aperture.Layer.prototype.remove.call(this);
				
				// destroye all sublayers
				forEach( this.layers_, function (layer) {
					layer.remove();
				});
				
				this.layers_ = [];
			}

			return this;
		},

		/**
		 * @private
		 * Subclasses of PlotLayer may override this function and update the provided
		 * Node objects that are bound for the given child layer before
		 * rendering it.
		 * For example, a plot layer that alters the size of the canvases
		 * that its children should render to can update the node position and
		 * width/height fields in the provided nodes before they are passed
		 * down to the child layer.
		 *
		 * Note that this is called for each child layer.  If all child layers should
		 * get the same modifications to their render nodes, changes can be made
		 * once to this layer's nodes in render.  These changes will be applied
		 * before the call to this function.
		 * 
		 * @param {aperture.Layer} layer
		 *      The child layer that for which this set of nodes is bound
		 * @param {Object} changeSet
		 *      The changeSet object destined for the given layer
		 * @param {Array} changeSet.updates 
		 *      a list of visible Nodes that are added or changed.
		 *      this is the list that a graphic child should redraw.
		 * @param {Array} changeSet.added
		 *      a list of new Node objects pertaining to added data
		 * @param {Array} changeSet.changed
		 *      a list of visible Node objects pertaining to changed data
		 * @param {Array} changeSet.removed
		 *      a list of Nodes that should be removed due to the
		 *      removal of the corresponding data
		 *
		 */
		renderChild : function( layer, changeSet ) {
			layer.render( changeSet );
		}
		
	});

	namespace.PlotLayer = PlotLayer;
	
	/* ******************************************************************************* */

	/**
	 * @name aperture.Layer.Node
	 * @class A Node object contains information and methods that layer implementations
	 * can use to obtain the constructs they need to render their content.  For example, the node
	 * provides a vector graphics interface which child layers may use to create and manage their
	 * visual representations.
	 * 
	 * @private
	 */

	/**
	 * @name aperture.Layer.Node#data
	 * @type Object
	 * @description the data item that to which this node pertains.
	 * 
	 * @private
	 */

	/**
	 * @name aperture.Layer.Node#parent
	 * @type aperture.Layer.Node
	 * @description an explicit reference to the parent render node for this node, if it
	 * exists.  Generally a node will inherit all properties of its parent but it is occasionally
	 * useful to be able to access the unadulterated values such as position.
	 * 
	 * @private
	 */

	/**
	 * @name aperture.Layer.Node#userData
	 * @type Object
	 * @description an object that can be freely used by the rendering layer to store
	 * information.  Since the same node object will be given to the layer on subsequent
	 * renders of the same data item the layer can store information that allows rendering to
	 * be more efficient, for example visual objects that are created and can be reused.
	 * 
	 * @private
	 */

	/**
	 * @name aperture.Layer.Node#width
	 * @type Number
	 * @description The width of the canvas in pixels.  If the child layer does not have a mapping
	 * that specifies the render width of its visuals, the canvas size should be used.
	 * 
	 * @private
	 */

	/**
	 * @name aperture.Layer.Node#height
	 * @type Number
	 * @description The height of the canvas in pixels.  If the child layer does not have a mapping
	 * that specifies the render width of its visuals, the canvas size should be used.
	 * 
	 * @private
	 */

	/**
	 * @name aperture.Layer.Node#position
	 * @type Array
	 * @description The [x,y] position in pixels within the canvas that the child visual should
	 * draw itself.  Typically top-level visuals will be positioned at [0,0] and will be expected
	 * to fill the entire canvas (as dictated by width/height).  Otherwise, child visuals should
	 * translate the local-coordinate point specified by {@link #anchorPoint} to this position
	 * within the canvas.
	 * 
	 * @private
	 */

	/**
	 * @name aperture.Layer.Node#anchorPoint
	 * @type Array
	 * @description The anchor point is an [x,y] position in [0,1] space that specifies how the child
	 * layer should draw its visuals with respect to the provided canvas {@link #position}.  The x-anchor
	 * point is in the range [0,1] where 0 represents an anchor on the left edge of the visual and 1
	 * represents an anchor on the right edge.  The y-anchor point is also in the range [0,1] where
	 * 0 represents an anchor on the top edge and 1 represents an anchor on the bottom edge.  [0.5, 0.5]
	 * would mean the child visual is centered on the provided canvas {@link #position}.
	 * 
	 * @private
	 */

	/**
	 * @name aperture.Layer.Node#graphics
	 * @type aperture.canvas.Graphics
	 * @description A graphics interface with which to create and update graphics, typically
	 * a {@link aperture.canvas.VectorGraphics VectorGraphics} object.
	 * 
	 * @private
	 */

	/* ******************************************************************************* */

	/**
	 * @name aperture.Layer.Event
	 * @class An event object that is passed to handlers upon the trigger of a requested
	 * event.
	 */

	/**
	 * @name aperture.Layer.Event#eventType
	 * @type String
	 * @description the type of the event being triggered
	 */

	/**
	 * @name aperture.Layer.Event#source
	 * @type Object
	 * @description the source event
	 */

	/**
	 * @name aperture.Layer.Event#data
	 * @type Object
	 * @description the data object for the node that triggered the event
	 */

	/**
	 * @name aperture.Layer.Event#node
	 * @type aperture.Layer.NodeSet
	 * @description the node that triggered the event
	 */

	/**
	 * @name aperture.Layer.Event#index
	 * @type Array
	 * @description an optional property that contains the index into the data item
	 * in the case that the data item contains a sequence of values, such as a line
	 * series.  In the case of indexed values, this field will be an array
	 * of indicies in the order they are referred to in the mappings.  For example,
	 * ${a[].b[].c} will have two items in the index array.  Otherwise, undefined.
	 */

	/**
	 * @name aperture.Layer.Event#dx
	 * @type Number
	 * @description when dragging, the cumulative x offset, otherwise undefined.
	 */

	/**
	 * @name aperture.Layer.Event#dy
	 * @type Number
	 * @description when dragging, the cumulative y offset, otherwise undefined.
	 */


	return namespace;

}(aperture || {}));
/**
 * Source: Class.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Implements the ability to wrap any root layer as a vizlet.
 *
 */

/**
 * @namespace
 * The API for wrapping any root layer as a vizlet for insertion into the DOM.
 */
aperture.vizlet = (
/** @private */
function(namespace) {

	var log = aperture.log;
	
	/**
	 * Takes a layer constructor and generates a constructor for a Vizlet version of
	 * the layer.  Unlike layers which can only be used as children of other layers,
	 * Vizlets can be used as root objects and connected to a DOM element.
	 *
	 * @param {Function} layerConstructor
	 *      The constructor function for the layer for which to generate a Vizlet view.
	 *
	 * @param {Function} [init]
	 *      An optional initialization function which will be called where this
	 *      will be the newly created layer.
	 *
	 * @returns {Function}
	 *      A constructor function for a new Vizlet version of the supplied layer
	 *
	 * @name aperture.vizlet.make
	 * @function
	 */

	var make = function( layerConstructor, init ) {

		// Return a constructor function for the vizlet-layer that takes an id + a spec
		// The constructed object will have all methods of the layer but will take an
		// additional DOM element id on construction and have custom update/animate
		// methods appropriate for a top-level vizlet
		return function( spec, mappings ) {
			var elem,
				elemId,
				// Create the node that will be given to the child layer
				// on every render.
				node = {
						uid: 0,
						width: 0,		// Set at render time
						height: 0,		// Set at render time
						position: [0,0],
						anchorPoint: [0,0],
						userData: {},
						graphics : aperture.canvas.NO_GRAPHICS,
						kids: {}
					};

			// an actual element?
			if (spec && spec.nodeType == 1) {
				elem = spec;
				spec = {};

			// else must be an id, either a string or embedded in an object
			} else {
				if( aperture.util.isString(spec) ) {
					// Given an element (id) directly instead of spec obj
					elemId = spec;
					spec = {};
				} else {
					if ( !spec || !spec.id ) {
						return log.error('Cannot make a vizlet from object without an id.');
					}
					// Contained in a spec object
					elemId = spec.id;
				}

				if (elemId === 'body') {
					elem = document.body;
				} else {
					// TODO: we are taking id's but no longer allowing jquery selectors,
					// so only id's, without hashes, should be allowed.
					if (elemId.charAt(0) === '#') {
						elemId = elemId.substr(1);
					}
					elem = document.getElementById(elemId);
				}
			}

			var type = aperture.canvas.type( aperture.canvas.DIV_CANVAS );

			// Extend layer creation specification to include reference to this
			// and canvas
			aperture.util.extend( spec, {
				parent: null,
				rootNode: node,
				parentCanvas : new type( elem )
			});


			// Instantiate the vizlet
			// (Technically instantiating the layer that will look like a vizlet)
			var vizlet = new layerConstructor(spec, mappings);

			// Make top-level update function (will replace update in layer.prototype)
			// This is the key difference between a layer (calls parent's update) and
			// a vizlet (has a DOM element from which nodes are derived).
			var originalLayerUpdate = vizlet.update;

			/**
			 * @private
			 * 
			 * Updates layer graphics.
			 *
			 * @param {aperture.Layer.NodeSet} nodes
			 *      the scope of layer nodes to be updated.
			 *
			 * @param {aperture.Transition} [transition]
			 *      an optional animated transition to use to ease in the changes.
			 *
			 * @returns {this}
			 *      this vizlet
			 */
			vizlet.redraw = function( nodes, transition ) {
				if (log.isLogging(log.LEVEL.DEBUG)) {
					log.indent(0);
					log.debug('------------------------------');
					log.debug(' UPDATE');
					log.debug('------------------------------');
				}
				
				// The root has no data and the node is very basic.  The assumption is
				// that either the child layer or one of its children will eventually have
				// a data definition.
				// Set the node width/height (vizlet could have been resized since last render)
				node.width = elem.offsetWidth;
				node.height = elem.offsetHeight;

				// Top level just provides a node with the container's canvas/size
				// but never indicates that it's changed etc.  Root layer will
				// manage its own data-based add/change/remove
				var changeSet = {
					updates: [],
					changed: [],
					removed: [],
					properties: null, // TODO: refactor out.
					rootSet: nodes,
					transition: transition
				};
				
				// Render this (ie the vizlet-ized layer)
				this.render( this.processChangeSet(changeSet) );

				// flush all drawing ops.
				spec.parentCanvas.flush();

				return this;
			};

			if (init) {
				init.apply( vizlet, arguments );
			}

			// Return the vizlet we created (not "this")
			return vizlet;
		};
	};


	namespace.make = make;

	
	/**
	 * @class Plot is a {@link aperture.PlotLayer PlotLayer} vizlet, suitable for adding to the DOM.
	 *
	 * @augments aperture.PlotLayer
	 * @name aperture.Plot
	 *
	 * @constructor
	 * @param {String|Element} parent
	 *      A string specifying the id of the DOM element container for the vizlet or
	 *      a DOM element itself.
	 * @param {Object} [mappings]
	 *      An optional initial set of property mappings.
	 */
	aperture.Plot= make( aperture.PlotLayer );

	
	return namespace;
}(aperture.vizlet || {}));
/**
 * Source: BarLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Bar Layer
 */
aperture = (
/** @private */
function(namespace) {
	/**
	 * Given a spec object for describing a bar, this method
	 * creates the corresponding visual representation.
	 */
	var DEFAULT_FILL = '#8aadec',
		renderBar = function(barSpec, index){
			var node = barSpec.node;

			var strokeWidth = this.valueFor('stroke-width', node.data, 1, index),
				lineStroke = this.valueFor('stroke', node.data, 'none', index),
				localFill = this.valueFor('fill', node.data, DEFAULT_FILL, index),
				localOpacity = this.valueFor('opacity', node.data, 1, index);

			var bar = node.graphics.rect(
						barSpec.x,
						barSpec.y,
						barSpec.size.width,
						barSpec.size.height);

			node.graphics.attr(bar, {
				'fill':localFill,
				'stroke':lineStroke,
				'stroke-width':lineStroke==null?0:strokeWidth,
				'stroke-linejoin': 'round',
				'fill-opacity':localOpacity});

		return bar;
	};

	namespace.BarLayer = aperture.Layer.extend( 'aperture.BarLayer',
	/** @lends aperture.BarLayer# */
	{
		/**
		 * @augments aperture.Layer
		 * @class Given a data source, this layer plots simple, bar visual representations of that data
		 * (e.g. on a timeline visualization). For more complex charting capabilities, refer to
		 * {@link aperture.chart.BarSeriesLayer BarSeriesLayer}

		 * @mapping {Number=1} bar-count
		 *   The number of points in a given bar chart data series.
		 *
		 * @mapping {Number=0} x
		 *   The base horizontal position of the bar.
         * @mapping {Number=0} offset-x
         *   An offset from base horizontal position of the bar, in pixels

		 * @mapping {Number=0} y
		 *   The base vertical position of the bar.
         * @mapping {Number=0} offset-y
         *   An offset from the base vertical position of the bar, in pixels

		 * @mapping {String='vertical'} orientation
		 *   Sets the orientation of the chart. Vertically oriented charts will have bars that expand along the y-axis,
		 *   while horizontally oriented charts will have bars expanding along the x-axis. By default, this property
		 *   is set to 'vertical'.

		 * @mapping {Number} width
		 *   Sets the width of each bar in the chart (i.e. the bar's thickness). For charts with a horizontal
		 *   orientation, the width is measured along the y-axis. Similarly, for vertically oriented charts,
		 *   the width is measured along the x-axis. For most conventional usages, the width will be the
		 *   lesser of the two values when compared against length.

		 * @mapping {Number} length
		 *   Mapping for determining the length of each bar in the chart. For charts with a horizontal
		 *   orientation, the length is measured along the x-axis. Similarly, for vertically oriented
		 *   charts, the length is measured along the y-axis.

		 * @mapping {Boolean=true} bar-visible
		 *   Property for toggling the visibility of individual bars in the chart. Setting the global property of
		 *   'visible' to FALSE overrides the value of this property and will hide all the bar visuals.

		 * @mapping {String='#8aadec'} fill
		 *   Sets the fill colour of the bar.
		 *
		 * @mapping {Number=1} opacity
		 *  The opacity of a bar. Values for opacity are bound with the range [0,1], with 1 being opaque.
		 *
		 * @mapping {String='none'} stroke
		 *   By default no stroke is used when drawing the bar charts, only the fill value is used.
		 *   Setting this value will draw a coloured outline around each bar in the chart.

		 * @mapping {Number=1} stroke-width
		 *   The width (in pixels) of the stroke drawn around each bar. This value is only used if the 'stroke'
		 *   property is set to a visible value.

		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			// Create a list of all additions and changes.
			// Determine how the bars should be laid out.
			var seriesSpec = this.applyLayout(changeSet.updates);
			// Render the bars.
			this.updateLayer.call(this, seriesSpec, changeSet.transition);
		},


		/**
		 * @private
		 * Calculate the layout of the bars, taking into account
		 * chart orientation, and visibility.
		 */
		applyLayout : function(dataObject) {
			var seriesSpec = [],
				seriesId,
				index;
			for (seriesId = 0; seriesId < dataObject.length; seriesId++){
				var barSpecs = [];
				var node = dataObject[seriesId];

				var numBars = this.valueFor('bar-count', node.data, 1, seriesId);
				var orientation = this.valueFor('orientation', node.data, 'vertical', index);

				var maxLength = orientation == 'vertical'?node.height:node.width;

				for (index=0; index < numBars; index++){
					var width = this.valueFor('width', node.data, 2, index),
						length = this.valueFor('length', node.data, 0, index),
						xp = this.valueFor('x', node.data, 0, index) * node.width,
						yp = this.valueFor('y', node.data, 0, index) * node.height,
						xd = orientation === 'vertical'? width:length,
						yd = orientation === 'vertical'? length:width;

					var isVisible = this.valueFor('bar-visible', node.data, true, index, seriesId);

					xp += this.valueFor('offset-x', node.data, 0, index);
                    yp += this.valueFor('offset-y', node.data, 0, index);

					if (xd < 0) {
						xp += xd;
						xd = -xd;
					}

					if (yd < 0) {
						yp += yd;
						yd = -yd;
					}

					var barSpec = {
							id : index,
							x : xp+ (node.position[0]||0),
							y : yp+ (node.position[1]||0),
							size : {width: xd, height: yd},
							strokeWidth : 1,
							orientation : orientation,
							visible : isVisible,
							node : node
					};
					barSpecs.push(barSpec);
				}
				seriesSpec[seriesId] = barSpecs;
			}
			return seriesSpec;
		},


		/**
		 * @private
		 * This method takes a collection of specs that describe the size and position
		 * of each bar (or bar segment in the case of stacked bars), applies
		 * additional styling properties if specified, and then passes the objects
		 * off for rendering.
		 *
		 * If the bar element has already been rendered previously, retrieve the existing
		 * visual and update its visual attributes.
		 */
		updateLayer : function(seriesSpec, transition) {
			var seriesId,
				index;
			for (seriesId = 0; seriesId < seriesSpec.length; seriesId++){
				var barSpecs = seriesSpec[seriesId];
				var barCount = barSpecs.length;

				if (barCount > 0){
					for (index=0; index< barCount; index++){
						var barSpec = barSpecs[index];
						var node = barSpec.node;

						if (!node.userData.bars){
							node.userData.bars = {};
						}

						// Check if this bar already exists for this node. If it does
						// we want to do an update. Otherwise we'll create a new graphic
						// object for it.
						var bar = node.userData.bars[index];

						if (!barSpec.visible){
							if (bar) {
								node.graphics.remove(bar);
								delete node.userData.bars[index];
							}
							continue;
						}

						var barSeriesData = barSpec.node.data;
						var lineStroke = this.valueFor('stroke', barSeriesData, 'none', index);
						var barLayout =	this.valueFor('bar-layout', barSeriesData, null, index);

						// Check if the visual exceeds the current context size,
						// culling if necessary.
						// To prevent visuals from seeming to "pop" into the scene
						// when panning, we want to allow a buffer area of N bars,
						// at either end of the corresponding axis, when culling.
						var xPoint = barSpec.x,
							yPoint = barSpec.y,
							renderBarDim = barSpec.size,
							nBarOffset = 2; // Allows for a buffer of 1 bar.

						// Since we only support horizontal panning, we only need to cull along the x-axis.
						if (cullPoint = xPoint > node.width + node.position[0]|| xPoint + nBarOffset*renderBarDim.width < node.position[0]){
							if (bar) {
								node.graphics.remove(bar);
								delete node.userData.bars[index];
							}
							continue;
						}
						// If this bar already exists, update its visual
						// properties.
						if (bar){
							var localFill = this.valueFor('fill', node.data, DEFAULT_FILL, index);
							var localOpacity = this.valueFor('opacity', node.data, 1, index);
							node.graphics.attr(bar, {
								fill:localFill,
								stroke:lineStroke,
								x : xPoint,
								y : yPoint,
								'fill-opacity' : localOpacity,
								'stroke-width':lineStroke==null?0:barSpec.strokeWidth,
								'stroke-linejoin': 'round',
								'width' : renderBarDim.width,
								'height' : renderBarDim.height
							}, transition);
						}
						else {
							// This is a new bar so we'll create a new visual for it.
							bar = renderBar.call(this, barSpec, index);
							// Associate data with the bar visual.
							node.graphics.data(bar, barSeriesData, [index]);
							// Cache the visual for this bar.
							node.userData.bars[index] = bar;
						}
					}
				}
			}
		}
	});

	return namespace;

}(aperture || {}));
/**
 * Source: Color.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Color APIs
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// PRIVATE

	var int = Math.round, // shortcut

		// base utility fn for parsing a color channel that handles percentages
		chAny = function ( str, pctF ) {

			// match number and optional pct
			var m = str.match( /([0-9\.]+)(%*)/ );

			// convert number
			var n = parseFloat( m[1] );

			// return result - if pct multiply by factor.
			return m[2]? n * pctF : n;
		},

		// derivativchAnyannel for ranges 0-255
		ch255 = function ( str ) {
			return int( chAny( str, 2.55 ));
		},

		// hsl to rgb conversion. h in degrees, s and l in 0 to 1.
		// because color is immutable we place this fn in private space.
		hsl = function( h, s, l, color ) {

			// clamp to legitimate ranges
			s = Math.min(1, Math.max(0, s));
			l = Math.min(1, Math.max(0, l));

			// shortcut for gray
			if (s == 0) {
				color.r = color.g = color.b = int( 255 * l );
				return;
			}

			// constants derived from s,l for calc below
			var q = (l <= 0.5) ? (l * (1 + s)) : (l + s - l * s);
			var p = 2 * l - q;

			// channel from offset in hue, subject to s+l
			function rgb1(h) {

				// clamp
				h-= Math.floor(h/360) * 360;

				// switch on four bands
				if (h < 60)  {
					return p + (q - p) * h / 60;
				} if (h < 180) {
					return q;
				} if (h < 240) {
					return p + (q - p) * (240 - h) / 60;
				}
				return p;
			}
			function rgb255( h ) {

				return int( 255 * rgb1( h ));
			}

			// push result to color
			color.r = rgb255( h + 120 );
			color.g = rgb255( h );
			color.b = rgb255( h - 120 );
			
			color.h = h;
			color.s = s;
			color.l = l;
			color.v = Math.max( color.r, color.g, color.b )/255;
		},

		// hsv to rgb conversion. h in degrees, s and v in 0 to 1.
		// because color is immutable we place this fn in private space.
		hsv = function( h, s, v, color ) {
			color.h = h;
			color.s = s;
			color.v = v;
		    
			h /= 60;
			
			var i = Math.floor(h),
				f = h - i,
				p = v * (1 - s),
				q = v * (1 - f * s),
				t = v * (1 - (1 - f) * s);

			switch(i % 6) {
				case 0: color.r = v; color.g = t; color.b = p; break;
				case 1: color.r = q; color.g = v; color.b = p; break;
				case 2: color.r = p; color.g = v; color.b = t; break;
				case 3: color.r = p; color.g = q; color.b = v; break;
				case 4: color.r = t; color.g = p; color.b = v; break;
				case 5: color.r = v; color.g = p; color.b = q; break;
			}
		    
			color.l = (Math.max(color.r, color.g, color.b) 
					+ Math.min(color.r, color.g, color.b)) / 2;
		    
			color.r = Math.round(color.r* 255);
			color.g = Math.round(color.g* 255);
			color.b = Math.round(color.b* 255);

		},

		// sets the hsl storage from the color's rgb.
		setHslv = function(color) {
			if (color.h != null) {
				return;
			}
			
			var r = color.r/ 255, 
				g = color.g/ 255,
				b = color.b/ 255;
		    
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;

			if (max == min) {
				h = s = 0; // grayscale
			} else {
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max){
					case r: h = (g - b) / d; break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h = ((h + 360) % 6) * 60;
			}

			color.h = h;
			color.s = s;
			color.l = l;
			color.v = max;
		},
		
		// two digit hexidecimalizer
		hex2 = function( num ) {
			num = num.toString(16);

			return num.length < 2? '0' + num : num;
		},

		// rgb[a] to string
		strFromVals = function ( r, g, b, a ) {
			// preserve alpha in the result color only if relevant.
			return ( a > 0.9999 )?
					('#'
						+ hex2( r )
						+ hex2( g )
						+ hex2( b ))
					: ('rgba('
						+ r.toString() + ','
						+ g.toString() + ','
						+ b.toString() + ','
						+ a.toString() + ')'
				);
		},

		// initialize the color string from the rgba values
		setStr = function ( color ) {
			color.color = strFromVals( color.r, color.g, color.b, color.a );
		},
		
		fromHSL, fromHSB;

		namespace.Color = aperture.Class.extend( 'aperture.Color',
		/** @lends aperture.Color.prototype */
		{
			/**
			 * @class Represents a color with support for runtime access of
			 * channel values. Since Aperture supports the use of CSS color string
			 * values, Color objects are used primarily for efficient manipulation
			 * of color, such as in mapping or filter operations.
			 *
			 * Colors are designed to be immutable.
			 * <br><br>
			 *
			 * Color values may be specified in hexadecimal, RGB, RGBA, HSL, HSLA,
			 * or named color form. Named colors include any colors configured in
			 * aperture.palette along with the standard 17 defined by CSS 2.1.<p>
			 *
			 * @constructs
			 * @extends aperture.Class
			 *
			 * @param {String} color
			 *   a name or css color value string.
			 *
			 * @returns {this}
			 *   a new Color
			 */
			init : function( color ) {

				// default in the no argument case is transparent black.
				if ( !color ) {
					this.r = this.g = this.b = this.a = 0;
					this.color = '#000000';
					return;
				}

				// case insensitive
				// TODO: consider always converting to rgb by calling setStr
				this.color = color = color.toLowerCase();

				// hexadecimal colors
				if (color.charAt(0) == '#') {

					// offset of second digit (covering #rgb and #rrggbb forms)
					var digit2 = (color.length === 7? 1:0),
						i = 0;

					// parse using base 16.
					this.r = parseInt( color.charAt( ++i ) + color.charAt( i+=digit2 ), 16 );
					this.g = parseInt( color.charAt( ++i ) + color.charAt( i+=digit2 ), 16 );
					this.b = parseInt( color.charAt( ++i ) + color.charAt( i+=digit2 ), 16 );
					this.a = 1;

					return;
				}

				var matchFn = color.match(/([a-z]+)\((.*)\)/i);

				// rgb, rgba, hsl, hsla
				if (matchFn) {

					// pull the three left chars and split up the arguments
					var func = matchFn[1].substring(0,3),
						args = matchFn[2].split(','),
						h,s,l;

					// alpha, or default opacity which is 1
					this.a = args.length > 3? chAny( args[3], 0.01 ) : 1;

					switch (func) {
					case 'rgb':
						this.r = ch255(args[0]);
						this.g = ch255(args[1]);
						this.b = ch255(args[2]);

						return;

					case 'hsl':
						// convert (leave hsl precision - we round post-op)
						h = chAny(args[0], 3.60);
						s = chAny(args[1], 0.01);
						l = chAny(args[2], 0.01);
						hsl( h, s, l, this );

						return;
					}
				}

				// assume named.
				color = aperture.palette.color( color );

				// log name lookups that are missing
				if ( !color ) {
					aperture.log.warn( 'unrecognized color ' + color );
				}

				// recurse once only to set from value
				this.init( color );
			},

			/**
			 * Blends this color with the supplied color and returns
			 * a resulting color. Blending provides comprehensive
			 * coverage of color derivation use cases in one function by
			 * intuitively specifying what the destination is and how much
			 * weight should be given the destination versus the source.
			 * For instance, rather than darken or lighten a foreground color blend it
			 * to the background color so it better adapts to a different
			 * color scheme.<p>
			 *
			 * If the color is supplied as a string value a Color object
			 * will be created for it, so in cases where this method is
			 * called frequently with the same color value but different weights
			 * it is better to pre-construct the color as an object and
			 * pass that in instead.
			 *
			 * @param {Color|String} color
			 *  the color to blend with.
			 *
			 * @param {Number} weight
			 *  the weighting of the supplied color in the blend
			 *  process, as a value from 0.0 to 1.0.
			 *
			 * @returns {aperture.Color}
			 *  a blended color
			 */
			blend : function ( color, weight ) {

				// convert to an object if isn't already
				if ( typeof color === 'string' ) {
					color = new namespace.Color( color );
				}

				var w1 = 1 - weight,
					c = new namespace.Color();
				
				c.r = int( w1 * this.r + weight * color.r );
				c.g = int( w1 * this.g + weight * color.g );
				c.b = int( w1 * this.b + weight * color.b );
				c.a = int((w1 * this.a + weight * color.a) * 1000 ) * 0.001;
				
				// initialize the color string
				setStr(c);
				
				return c;
			},

			/**
			 * Returns an array of interpolated colors between this color and the 
			 * toColor suitable for use in a map key. The first color will be 
			 * this color and the last will be the toColor.
			 * 
			 * @param {aperture.Color} toColor
			 *  the end color to interpolate to
			 * 
			 * @param {Number} bands
			 *  the number of colors to create
			 * 
			 * @returns {Array}
			 *  an array of colors, of length bands
			 */
			band : function ( toColor, bands ) {
				var a = [this];
				
				if (bands > 1) {
					a.length = bands;
	
					var base = bands-1, i;
					for (i=1; i< bands; i++) {
						a[i] = this.blend( toColor, i/base );
					}
				}
				return a;
			},
			
			/**
			 * Gets the hue as a value between 0 and 360, or if an
			 * argument is supplied returns a new color with the hue
			 * given but the same saturation and lightness.
			 * 
			 * @returns {Number|aperture.Color}
			 *  a value for hue, or a new color with the hue specified.
			 */
			hue : function( value ) {
				setHslv(this);
				
				if (value != null) {
					return fromHSL(value, this.s, this.l, this.a);
				}
				
				return this.h;
			},
			
			/**
			 * Gets the saturation as a value between 0 and 1, or if an
			 * argument is supplied returns a new color with the saturation
			 * given but the same hue and lightness as this color.
			 * 
			 * @returns {Number|aperture.Color}
			 *  a value for saturation, or a new color with the saturation specified.
			 */
			saturation : function( value ) {
				setHslv(this);
				
				if (value != null) {
					return fromHSL(this.h, value, this.l, this.a);
				}
				
				return this.s;
			},
			
			/**
			 * Gets the lightness as a value between 0 and 1, or if an
			 * argument is supplied returns a new color with the lightness
			 * given but the same hue and saturation as this color.
			 * 
			 * @returns {Number|aperture.Color}
			 *  a value for lightness, or a new color with the lightness specified.
			 */
			lightness : function( value ) {
				setHslv(this);
				
				if (value != null) {
					return fromHSL(this.h, this.s, value, this.a);
				}
				
				return this.l;
			},
			
			/**
			 * Gets the brightness as a value between 0 and 1, or if an
			 * argument is supplied returns a new color with the brightness
			 * given but the same hue and saturation as this color.
			 * 
			 * @returns {Number|aperture.Color}
			 *  a value for brightness, or a new color with the brightness specified.
			 */
			brightness : function( value ) {
				setHslv(this);
				
				if (value != null) {
					return fromHSB(this.h, this.s, value, this.a);
				}
				
				return this.v;
			},
			
			/**
			 * Returns the color value as a valid CSS color string.
			 *
			 * @returns {String}
			 *  a CSS color string.
			 */
			css : function () {
				return this.color;
			},

			/**
			 * Overrides Object.toString() to return the value of {@link css}().
			 *
			 * @returns {String}
			 *  a CSS color string.
			 */
			toString : function ( ) {
				// temp debug
				//return this.r + ',' + this.g + ',' + this.b + ',' + this.a;
				return this.color;
			}
		}
	);

	/**
	 * Constructs a new color from numeric hue/ saturation/ lightness values.
	 * Alternatively, the class constructor can be used to construct a color
	 * from an hsl[a] string.
	 *
	 * @param {Number} h
	 *  the hue as a number in degrees (0-360), or an object
	 *  with h,s,l[,a] properties.
	 * @param {Number} s
	 *  the saturation as a number from 0-1
	 * @param {Number} l
	 *  the lightness as a number from 0-1
	 * @param {Number} [a]
	 *  the alpha value as a number from 0-1
	 *
	 * @returns {aperture.Color}
	 *  the new color
	 * 
	 * @name aperture.Color.fromHSL
	 * @function
	 */
	namespace.Color.fromHSL = fromHSL = function (h, s, l, a) {
		var color = new namespace.Color();

		// object handler
		if (typeof h != 'number') {
			if (h.h == null) {
				return color;
			}

			s = h.s;
			l = h.l;
			a = h.a;
			h = h.h;
		}

		// assign alpha if present
		color.a = a != null? a : 1;

		// normalize percentages if specified as such
//		s > 1 && (s *= 0.01);
//		l > 1 && (l *= 0.01);

		// convert to rgb and store in color
		hsl(h, s, l, color);

		// initialize the color string
		setStr(color);

		return color;
	};

	/**
	 * Constructs a new color from numeric hue/ saturation/ brightness values.
	 *
	 * @param {Number} h
	 *  the hue as a number in degrees (0-360), or an object
	 *  with h,s,b[,a] properties.
	 * @param {Number} s
	 *  the saturation as a number from 0-1
	 * @param {Number} b
	 *  the brightness as a number from 0-1
	 * @param {Number} [a]
	 *  the alpha value as a number from 0-1
	 *
	 * @returns {aperture.Color}
	 *  the new color
	 * 
	 * @name aperture.Color.fromHSL
	 * @function
	 */
	namespace.Color.fromHSB = fromHSB = function (h, s, b, a) {
		var color = new namespace.Color();

		// object handler
		if (typeof h != 'number') {
			if (h.h == null) {
				return color;
			}

			s = h.s;
			b = h.b;
			a = h.a;
			h = h.h;
		}

		// assign alpha if present
		color.a = a != null? a : 1;

		// normalize percentages if specified as such
//		s > 1 && (s *= 0.01);
//		l > 1 && (l *= 0.01);

		// convert to rgb and store in color
		hsv(h, s, b, color);

		// initialize the color string
		setStr(color);

		return color;
	};

	/**
	 * Constructs a new color from numeric red/ green /blue values.
	 * Alternatively, the class constructor can be used to construct a color
	 * from an rgb[a] string.
	 *
	 * @param {Number} r
	 *  the red component as a number from 0-255, or an object
	 *  with r,g,b[,a] properties.
	 * @param {Number} g
	 *  the green component as a number from 0-255
	 * @param {Number} b
	 *  the blue component as a number from 0-255
	 * @param {Number} [a]
	 *  the alpha value as a number from 0-1
	 *
	 * @returns {aperture.Color}
	 *  the new color
	 * 
	 * @name aperture.Color.fromRGB
	 * @function
	 *
	 */
	namespace.Color.fromRGB = function (r, g, b, a) {
		var color = new namespace.Color();

		// object handler
		if (typeof r != 'number') {
			if (r.r == null) {
				return color;
			}

			g = r.g;
			b = r.b;
			a = r.a;
			r = r.r;
		}

		// assign
		color.r = r;
		color.g = g;
		color.b = b;
		color.a = a != null? a : 1;

		// initialize the color string
		setStr(color);

		return color;
	};

	/**
	 * Returns an array of interpolated colors between the first and 
	 * last color in the set of colors supplied, suitable for use in a 
	 * map key. This is a convenience function for rebanding colors
	 * (or banding colors from a scalar color map key) which simply
	 * calls the band function on the first color with the last color.
	 * 
	 * @param {Array} colors
	 *  the colors to band or reband between.
	 * 
	 * @param {Number} bands
	 *  the number of colors to create
	 * 
	 * @returns {Array}
	 *  an array of colors, of length bands
	 * 
	 * @name aperture.Color.band
	 * @function
	 */
	namespace.Color.band = function( colors, bands ) {
		if (colors && colors.length) {
			return colors[0].band(colors[colors.length-1], bands);
		}
	};
	
	return namespace;

}(aperture || {}));
/**
 * Source: Date.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Date APIs
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	var util = aperture.util;

	var dateFields = ['FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'];

	namespace.Date = aperture.Class.extend( 'aperture.Date', {
		/** @private */
		_utc: true,
		/** @private */
		_date: null,

		/**
		 * @class 
		 *
		 * @constructs
		 * @description
		 * Constructs a new Date object. By default the date will be represented (e.g. via 
		 * methods like get('Hours')) in UTC.
		 *
		 * @param {String|Number|Date} date
		 *      the date value (as a string to be parsed, number of milliseconds past epoch,
		 *      or existing aperture/javascript Date object)
		 * @param {Object} [options]
		 *      an optional options object. Currently only supports local: true which directs
		 *      the date object to represent time units in local time.
		 *
		 * @returns {this}
		 *      a new Date
		 */
		init: function(date, options) {
			if (Object.prototype.toString.call(date) === '[object Date]') {
				this._date = date;
			} else {
				this._date = new Date(date.valueOf());
			}
			this._utc = !(options && options.local);
		},

		/**
		 * Returns the unit value (e.g. year, minute, etc) of the date. If no unit given, returns
		 * a hash of all date unit fields to values
		 *
		 * @param {String} [unit]
		 *  If given, one of 'FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'.
		 *  If not specified, will return an object containing values for all fields.
		 *
		 * @returns {Number|Object}
		 *  If a unit is given, returns the numerical value. If no unit, returns an object containing
		 *  values for each field where the keys are the supported unit names.
		 */
		get: function(unit) {
			if (unit) {
				var getter = 'get' + (this._utc ? 'UTC' : '') + unit;
				if (!this._date[getter]) {
					throw new Error('Unrecognized date unit: ' + unit);
				}
				return this._date[getter]();
			} else {
				var self = this, 
					result = {};
				util.forEach(dateFields, function(unit) {
					result[unit] = self.get(unit);
				});
				return result;
			}
		},

		/**
		 * Sets one or more units of this date to a given value. Supports setting one unit at a time
		 * or multiple units at once. This function mutates the Date object.
		 *
		 * @example
		 * // Set only the year to 1997
		 * date.set(1997, 'FullYear');
		 *
		 * // Date and Hour
		 * date.set({
		 *   Date: 18,
		 *   Hours: 7
		 * });
		 *
		 * @param {Number|Object} value
		 *  If a number is given it must be combined with a unit. The number + unit will be used to set
		 *  the desired value. If an object is given it must contain keys from the set of allowed units.
		 *
		 * @param {String} [unit]
		 *  Optional, one of 'FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'
		 *
		 * @returns {this}
		 *  The modified date object.
		 */
		set: function(value, unit) {
			var prefix = (this._utc ? 'setUTC' : 'set');

			if (util.isObject(value)) {
				var newValues = util.extend(this.get(), value);
				this._date[prefix+'FullYear']( newValues.FullYear, newValues.Month, newValues.Date );
				this._date[prefix+'Hours']( newValues.Hours, newValues.Minutes, newValues.Seconds, newValues.Milliseconds );
			} else {
				if (!this._date[prefix+unit]) {
					throw new Error('Unrecognized date unit: ' + unit);
				}
				this._date[prefix+unit](value);
			}

			return this;
		},

		/**
		 * Alters the date's timezone, sets to UTC. The actual date-time represented by this object
		 * remains unchanged. Calling this only affects the numbers returned via get('Hours'), etc.
		 *
		 * @returns {this}
		 *  The modified date object.
		 */
		utc: function() {
			this._utc = true;
			return this;
		},



		/**
		 * Alters the date's timezone, sets to the local timezone. The actual date-time represented by this object
		 * remains unchanged. Calling this only affects the numbers returned via get('Hours'), etc.
		 *
		 * @returns {this}
		 *  The modified date object.
		 */
		local: function() {
			this._utc = false;
			return this;
		},

		/**
		 * Returns the number of milliseconds since the Unix Epoch. Equivalent to JavaScript built-in Date
		 * .valueOf() and .getTime().
		 *
		 * @returns {Number}
		 *  The number of milliseconds since the unix epoch.
		 */
		valueOf: function() {
			return this._date.valueOf();
		},

		/**
		 * Adds the specified value and unit of time to this Date object.
		 *
		 * @example
		 * // Adds 12 hours to the date
		 * date.add(12, 'Hours');
		 *
		 * @param {Number} value
		 *  The numerical value of the value/unit combination to add to the current date.allowed units.
		 *
		 * @param {String} unit
		 *  One of 'FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'
		 *
		 * @returns {this}
		 *  The modified date object.
		 */
		add: function(value, unit) {
			var normalizedUnit = (this._utc ? 'UTC' : '') + unit;
			this._date['set'+normalizedUnit]( this._date['get'+normalizedUnit]() + value);
			return this;
		},

		/**
		 * JavaScript standard toString function. Delegates to JavaScript built-in Date object's
		 * toString or toUTCString depending on date's timezone setting.
		 *
		 * @returns {String}
		 *  String representation of the current date.
		 */
		toString: function() {
			if (this._utc) {
				return this._date.toUTCString();
			} else {
				return this._date.toString();
			}
		}
	});

	return namespace;
}(aperture || {}));/**
 * Source: Format.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Formats values.
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	var util = namespace.util;

	// TODO: extend these to take precise format specifications as a string.

	/**
	 * @class Format objects are used by {@link aperture.Scalar Scalars} for formatting
	 * values for display, but may be used independently as well.
	 *
	 * @extends aperture.Class
	 *
	 * @description
	 * The default implementation of Format does nothing other than use
	 * the String() function to coerce the value to a String. Default formats
	 * for numbers and times are provided by the appropriate static method.
	 *
	 * @name aperture.Format
	 */
	namespace.Format = namespace.Class.extend( 'aperture.Format',
		/** @lends aperture.Format.prototype */
		{
			/**
			 * Formats the specified value.
			 *
			 * @param value
			 *      The value to format.
			 *
			 * @returns {String}
			 *      The formatted value.
			 */
			format : function ( value ) {
				return String(value);
			},

			/**
			 * Given a level of precision in type specific form, returns
			 * the next (lesser) level of precision in type specific form,
			 * if and only if such orders of formatting are required for
			 * full expression of the value.
			 *
			 * This method is often used for a date axis and is best expressed
			 * by an example.
			 * <br><br>
			 * When an axis is labeled to the precision of
			 * hours for instance, best practice would dictate that each
			 * hour not be labeled repeatedly by date, month and year,
			 * even those exist in the data. However if the axis spanned
			 * days, it would be desirable to label the beginning of each
			 * day, secondarily to each hour. This method provides the means
			 * of doing so:
			 *
			 * @example
			 * var hourFormat = aperture.Format.getTimeFormat( {precision: 'Hours'} );
			 *
			 * // displays 'Date'
			 * alert( hourFormat.nextOrder() );
			 *
			 * @returns
			 *      The next precision level, or undefined if there isn't one.
			 */
			nextOrder : function () {
			}
		}
	);


	/**
	 * @private
	 * @class A Format object that translates numbers to
	 * Strings. Format objects are used by {@link aperture.Scalar Scalars} for formatting
	 * values, but may be used independently as well.
	 *
	 * @extends aperture.Format
	 *
	 * @description
	 * Constructs a number format.
	 *
	 * @name aperture.NumberFormat
	 */
	namespace.NumberFormat = namespace.Format.extend( 'aperture.NumberFormat',
		{
			/**
			 * @private
			 */
			decimals : 0,
			
			/**
			 * @private
			 *
			 * @param {Number} [precision]
			 *      The optional precision of the value to format. For numbers this
			 *      will be a base number to round to, such as 1 or 0.001.
			 *
			 * @returns {aperture.NumberFormat}
			 *      A new time format object.
			 */
			init : function ( precision ) {
				if (precision) {
					if (isNaN(precision)) {
						aperture.log.warn('Invalid precision "' + precision + '" in NumberFormat');
					} else {
						var p = this.precision = Number(precision);
						if (p < 1) {
							var s = p.toString();
							var i = s.indexOf('.');
							if (i !== -1) {
								this.decimals = s.length-1-i;
							}
						}
					}
				}
			},

			/**
			 * @private
			 * Formats the specified value.
			 *
			 * @param {Number} value
			 *      The value to format.
			 *
			 * @returns {String}
			 *      The formatted value.
			 */
			format : function ( value ) {

				// precision based formatting?
				if ( value != null && this.precision ) {
					value = Math.round( value / this.precision ) * this.precision;
				} else {
					value = Number(value);
				}

				var s = value.toFixed(this.decimals);
				var i = s.indexOf('.');
				
				for (i = (i!==-1?i:s.length)-3; i > 0; i -= 3) {
					s = s.substring(0, i).concat(',').concat(s.substring(i));
				}
				
				return s;
			}
		}
	);

	/**
	 * Returns a number format object, suitable for formatting numeric values.
	 *
	 * @param {Number} [precision]
	 *      The optional precision of the value to format. For numbers this
	 *      will be a base number to round to, such as 1 or 0.001.
	 *
	 * @returns {aperture.Format}
	 *      a number format object.
	 *
	 * @name aperture.Format.getNumberFormat
	 * @function
	 */
	namespace.Format.getNumberFormat = function( precision ) {
		return new namespace.NumberFormat( precision );
	};
	
	/**
	 * @private
	 * @class A Format object that translates numbers to currency
	 * Strings. Format objects are used by {@link aperture.Scalar Scalars} for formatting
	 * values, but may be used independently as well.
	 *
	 * @extends aperture.Format
	 *
	 * @description
	 * Constructs a number format.
	 *
	 * @name aperture.NumberFormat
	 */
	namespace.CurrencyFormat = namespace.NumberFormat.extend( 'aperture.CurrencyFormat',
		{
			/**
			 * @private
			 *
			 * @param {Number} [precision] [prefix] [suffix]
			 *      The optional precision of the value to format. For numbers this
			 *      will be a base number to round to, such as 1 or 0.01.
			 *      
			 *      The optional prefix is a string value for the currency (i.e. '$')
			 *      
			 *      The optional prefix is a string value for the currency (i.e. 'USD')
			 *
			 * @returns {aperture.NumberFormat}
			 *      A new time format object.
			 */
			init : function (precision, prefix, suffix) {
				if (precision) {
					if (isNaN(precision)) {
						aperture.log.warn('Invalid precision "' + precision + '" in CurrencyFormat');
					} else {
						var p = this.precision = Number(precision);
						if (p < 1) {
							var s = p.toString();
							var i = s.indexOf('.');
							if (i !== -1) {
								this.decimals = s.length-1-i;
							}
						}
					}
				}
				this.prefix = prefix || '';
				this.suffix = suffix || '';
			},

			/**
			 * @private
			 * Formats the specified value.
			 *
			 * @param {Number} value
			 *      The value to format.
			 *
			 * @returns {String}
			 *      The formatted value.
			 */
			format : function (value) {

				value = Number(value);
				
				var numberSuffix = '';
				
				var number = Math.abs(value);
				
				if (number >= 1000000000000) {
					numberSuffix = 'T';
					number *= 0.000000000001;
				} else if (number >= 1000000000) {
					numberSuffix = 'B';
					number *= 0.000000001;
				} else if (number >= 1000000) {
					numberSuffix = 'M';
					number *= 0.000001;
				} else if (number >= 1000) {
					numberSuffix = 'K';
					number *= 0.001;
				}
				
				if (this.precision) {
					number = Math.round(number / this.precision) * this.precision;
				}
				
				var sign = (value < 0) ? '-' : '';
				
				var s = number.toFixed(this.decimals);
				var i = s.indexOf('.');
				
				for (i = (i!==-1?i:s.length)-3; i > 0; i -= 3) {
					s = s.substring(0, i).concat(',').concat(s.substring(i));
				}
				
				return sign + this.prefix + s + numberSuffix + this.suffix;
			}
		}
	);

	/**
	 * Returns a number format object, suitable for formatting numeric values.
	 *
	 * @param {Number} [precision] [prefix] [suffix]
	 *      The optional precision of the value to format. For numbers this
	 *      will be a base number to round to, such as 1 or 0.01.
	 *      
	 *      The optional prefix is a string value for the currency (i.e. '$')
	 *      
	 *      The optional prefix is a string value for the currency (i.e. 'USD')
	 *
	 * @returns {aperture.Format}
	 *      a number format object.
	 *
	 * @name aperture.Format.getNumberFormat
	 * @function
	 */
	namespace.Format.getCurrencyFormat = function(precision, prefix, suffix) {
		return new namespace.CurrencyFormat(precision, prefix, suffix);
	};

	// create the hash of time orders.
	// use discrete format functions for speed but don't pollute our closure with them.
	var timeOrders = (function () {

		// DATE FORMATTING THINGS
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
			days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			y = 'FullYear', d = 'Date', m = 'Minutes';

		// time format functions.
		function pad2( num ) {
			return num < 10? '0' + num : String(num);
		}
		function hh12( date ) {
			var h = date.get('Hours');
			return h? (h < 13? String(h) : String(h - 12)) : '12';
		}
		function ampm( date ) {
			return date.get('Hours') < 12? 'am' : 'pm';
		}
		function millis( date ) {
			return ':' + ((date.get('Seconds')*1000 + date.get('Milliseconds'))/1000) + 's';
		}
		function ss( date ) {
			return ':' + pad2(date.get('Seconds')) + 's';
		}
		function hhmm( date ) {
			return hh12(date) + ':' + pad2(date.get('Minutes')) + ampm(date);
		}
		function hh( date ) {
			return hh12(date) + ampm(date);
		}
		function mondd( date ) {
			return months[date.get('Month')] + ' '+ date.get('Date');
		}
		function day( date ) {
			return days[date.get('Day')] + ' ' + mondd(date);
		}
		function mon( date ) {
			return months[date.get('Month')];
		}
		function year( date ) {
			return String(date.get('FullYear'));
		}
		function yy( date ) {
			return "'" + String(date.get('FullYear')).substring(start, end);
		}

		return {
			'FullYear'     : { format : year },
			'Year'         : { format : yy },
			'Month'        : { format : mon,    next : y },
			'Date'         : { format : mondd,  next : y },
			'Day'          : { format : mondd,  next : y },
			'Hours'        : { format : hh,     next : d },
			'Minutes'      : { format : hhmm,   next : d },
			'Seconds'      : { format : ss,     next : m },
			'Milliseconds' : { format : millis, next : m }
		};

	}());

	/**
	 * @private
	 * @class A Format object that translates times to
	 * Strings. Format objects are used by {@link aperture.Scalar Scalars} for formatting
	 * values, but may be used independently as well.
	 *
	 * @extends aperture.Format
	 *
	 * @description
	 * Constructs a time format.
	 *
	 * @name aperture.TimeFormat
	 */
	namespace.TimeFormat = namespace.Format.extend( 'aperture.TimeFormat',

		{
			/** @private */
			_utc: true,

			/**
			 * @private
			 *
			 * @param {Object|String} [options]
			 *      Optional options hash to affect time formatting behaviour. For backwards 
			 *      compatibility also supports passing precision (see below) as a string
			 *
			 * @param {String} [options.precision]
			 *      The optional precision of the value to format. For times this
			 *      will be a Date field reference, such as 'FullYear' or 'Seconds'.
			 *
			 * @param {Boolean} [options.local]
			 *      When true, causes the formatter to display times using the local 
			 *      timezone (vs the default UTC)
			 *
			 * @returns {aperture.TimeFormat}
			 *      A new time format object.
			 */
			init : function ( options ) {
				if (util.isString(options)) {
					options = {
						precision: options
					}
				}
				if (options && options.precision) {
					this.order = timeOrders[options.precision];

					if (!this.order) {
						aperture.log.warn('Invalid precision "' + options.precision + '" in TimeFormat');
					}
				}

				this._utc = !(options && options.local);
			},

			/**
			 * @private
			 * Formats the specified value.
			 *
			 * @param {Date|Number} value
			 *      The value to format, as a Date or time in milliseconds.
			 *
			 * @returns {String}
			 *      The formatted value.
			 */
			format : function ( value ) {

				// precision based formatting?
				if ( value != null ) {
					if (!value.typeOf || !value.typeOf(aperture.Date)) {
						value = new aperture.Date(value, {local: !this._utc});
					}
					if ( this.order ) {
						return this.order.format( value );
					}
				}

				return String(value);
			},

			/**
			 * @private
			 * @returns the next (lesser) logical level of precision, if and only if such
			 * orders of formatting are required for full expression of the value.
			 */
			nextOrder : function () {
				if ( this.order ) {
					return this.order.next;
				}
			}
		}
	);

	/**
	 * Returns a time format object, suitable for formatting dates and times.
	 *
	 * @param {Object|String} [options]
	 *      Optional options hash to affect time formatting behaviour. For backwards 
	 *      compatibility also supports passing precision (see below) as a string
	 *
	 * @param {String} [options.precision]
	 *      The optional precision of the value to format. For times this
	 *      will be a Date field reference, such as 'FullYear' or 'Seconds'.
	 *
	 * @param {Boolean} [options.local]
	 *      When true, causes the formatter to display times using the local 
	 *      timezone (vs the default UTC)
	 *
	 * @returns {aperture.Format}
	 *      a time format object.
	 *
	 * @name aperture.Format.getTimeFormat
	 * @function
	 */
	namespace.Format.getTimeFormat = function( options ) {
		return new namespace.TimeFormat( options );
	};

	return namespace;

}(aperture || {}));

/**
 * Source: IconLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Icon Layer Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	var defaults = {
			'x' : 0,
			'y' : 0,
			'width' : 24,
			'height' : 24,
			'opacity': ''
		},
		ontoDefaults = {
			'ontology' : 'aperture-hscb',
			'type' : 'undefined',
			'attributes' : {},
			'format' : undefined
		};

	// assumes pre-existence of layer.
	namespace.IconLayer = aperture.Layer.extend( 'aperture.IconLayer',

		/** @lends aperture.IconLayer# */
		{
			/**
			 * @class Represents a layer of point located icons representing ontological
			 * types with attributes. Icons may vary in size.<br><br>
			 *
			 * In addition to core {@link aperture.Layer Layer} properties, icon layer properties include all icon
			 * <a href='aperture.palette.html#.icon'>palette</a> properties, and the following:
			 *
			 * @mapping {String} url
			 *   The url of the icon to use. This optional property is provided for situations when a
			 *   specific image is desired, outside of the ontological resolution of types to symbols.
			 *
			 * @mapping {Number=0.5} anchor-x
			 *   The x-anchor point in the range [0,1] for the icon, where 0.5 is the centre.
			 *
			 * @mapping {Number=0.5} anchor-y
			 *   The y-anchor point in the range [0,1] for the icon, where 0.5 is the centre.
			 *
			 * @mapping {Number=1.0} opacity
			 *   How opaque the icon will be in the range [0,1].
			 *
			 * @mapping {Number=1} icon-count
			 *   The number of icons to be drawn.
			 *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Layer
			 * @requires a vector canvas
			 */
			init : function( spec, mappings ) {
				aperture.Layer.prototype.init.call(this, spec, mappings );
			},

			// type flag
			canvasType : aperture.canvas.VECTOR_CANVAS,

			/*
			 * Render implementation
			 */
			render : function( changeSet ) {

				// FOR NOW - process all changes INEFFICIENTLY as total rebuilds.
				var toProcess = changeSet.updates,
					nIcons = toProcess.length, i;

				// Handle adds
				for( i=nIcons-1; i>=0; i-- ) {
					var node = toProcess[i],
						data = node.data,
						gfx = node.graphics,
						w = node.width,
						h = node.height,
						icons = node.userData.icons || (node.userData.icons = []),
						index;

					var numIcons = this.valueFor('icon-count', data, 1);
					var visiblePoints = 0;
					for (index = 0; index < numIcons; index++){
						rattrs = this.valuesFor(defaults, data, [index]);

						// either a hard-coded url or use the palette to resolve it
						rattrs.x = rattrs.x * w + node.position[0] - this.valueFor('anchor-x', data, 0.5, index) * rattrs.width;
						rattrs.y = rattrs.y * h + node.position[1] - this.valueFor('anchor-y', data, 0.5, index) * rattrs.height;
						rattrs.src = this.valueFor('url', data, '', index);
						if (!rattrs.src) {
							var oattrs = this.valuesFor(ontoDefaults, data);

							if (oattrs.format !== 'svg') {
								oattrs.width = rattrs.width;
								oattrs.height = rattrs.height;
							}
							rattrs.src = aperture.palette.icon(oattrs);
						}

						var visual = icons[visiblePoints];

						// PROCESS GRAPHICS.
						if (visual) {
							gfx.attr(visual, rattrs, changeSet.transition);
						} else {
							visual = gfx.image(
									rattrs.src,
									rattrs.x,
									rattrs.y,
									rattrs.width,
									rattrs.height);

							gfx.attr(visual, rattrs);
							gfx.apparate(visual, changeSet.transition);
							icons.push(visual);
						}

						gfx.data( visual, data );
						visiblePoints++;
					}
					// Remove any obsolete visuals.
					if (icons.length > visiblePoints){
						gfx.removeAll(icons.splice(visiblePoints));
					}
				}
			}
		}
	);

	return namespace;

}(aperture || {}));

/**
 * Source: LabelLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Text Layer
 */

aperture = (
/** @private */
function(namespace) {

	// predefined orientations.
	var orientations = {
		horizontal : 0,
		vertical: -90
	}, isString = aperture.util.isString;
	
	namespace.LabelLayer = namespace.Layer.extend( 'aperture.LabelLayer',
	/** @lends aperture.LabelLayer# */
	{
		/**
		 * @augments aperture.Layer
		 * @requires a vector canvas
		 * @class Creates a layer displaying text at specific locations.

		 * @mapping {Number=1} label-count
		 *   The number of labels to be drawn.

		 * @mapping {Number=1} label-visible
		 *   The visibility of a label.

		 * @mapping {String} text
		 *   The text to be displayed.

		 * @mapping {String='black'} fill
		 *   The color of a label.

		 * @mapping {Number=0} x
		 *   The horizontal position at which the label will be anchored.

		 * @mapping {Number=0} y
		 *   The vertical position at which the label will be anchored.

		 * @mapping {Number=0} offset-x
		 *   The offset along the x-axis by which to shift the text after it has been positioned at (x,y).

		 * @mapping {Number=0} offset-y
		 *   The offset along the y-axis by which to shift the text after it has been positioned at (x,y).

		 * @mapping {Number=1.0} opacity
		 *   How opaque the label will be in the range [0,1].

		 * @mapping {'middle'|'start'|'end'} text-anchor
		 *   How the label is aligned with respect to its x position.

		 * @mapping {'middle'|'top'|'bottom'} text-anchor-y
		 *   How the label is aligned with respect to its y position.

		 * @mapping {'horizontal'|'vertical'| Number} orientation
		 *   The orientation of the text as a counter-clockwise angle of rotation, or constants 'vertical'
		 *   or 'horizontal'.

		 * @mapping {String='Arial'} font-family
		 *   One or more comma separated named font families,
		 *   starting with the ideal font to be used if present.

		 * @mapping {Number=10} font-size
		 *   The font size (in pixels).

		 * @mapping {String='normal'} font-weight
		 *   The font weight as a valid CSS value.

		 * @mapping {String='none'} font-outline
		 *   The colour of the outline drawn around each character of text. 
		 *   
		 * @mapping {Number=3} font-outline-width
		 *   The width of the outline drawn around each character of text, if font-outline is not none.
		 *   
		 * @mapping {Number=1.0} font-outline-opacity
		 *   How opaque the font outline will be.
		 *   
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings){
			aperture.Layer.prototype.init.call(this, spec, mappings);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			var node, i, n, g, labels;

			// Create a list of all additions and changes.
			var toProcess = changeSet.updates;

			for (i=0; i < toProcess.length; i++){
				node = toProcess[i];

				labels = node.userData.labels = node.userData.labels || [];

				// Get the number of labels to be rendered.
				var index, itemCount= this.valueFor('label-count', node.data, 1);
				g = node.graphics;
				
				// remove any extraneous labels
				for (index=itemCount; index < labels.count; index++){
					g.remove(labels[index].back);
					g.remove(labels[index].front);
				}
				
				labels.length = itemCount;
				
				for (index=0; index < itemCount; index++) {
					var visible = !!this.valueFor('label-visible', node.data, true, index);
					var label = labels[index];
					
					if (!visible){
						if (label) {
							g.remove(label.back);
							g.remove(label.front);
							labels[index] = null;
						}
						// Since all the labels are re-rendered on each update, there is
						// nothing more to do if the label is not visible.
						continue;
					}

					// Make the outline and fill colour the same.
					var fillColor = this.valueFor('fill', node.data, '#000000', index);
					var opacity = this.valueFor('opacity', node.data, '', index);
					var outlineColor = this.valueFor('font-outline', node.data, 'none', index);
					var xPoint = (this.valueFor('x', node.data, 0, index) * node.width) + (node.position[0]||0);
					var yPoint = (this.valueFor('y', node.data, 0, index) * node.height) + (node.position[1]||0);
					var outlineWidth = outlineColor !== 'none' && this.valueFor('font-outline-width', node.data, 3, index);
					
					var connect = this.valueFor('connect', node.data, false, index);

					var str = this.valueFor('text', node.data, '', index);

					var fontFamily = this.valueFor('font-family', node.data, "Arial", index);
					var fontSize = this.valueFor('font-size', node.data, 10, index);
					var fontWeight = this.valueFor('font-weight', node.data, "normal", index);

					var moreLines = str.match(/\n/g),
						textHeight = fontSize *1.4 + fontSize* (moreLines? moreLines.length: 0);

					// Check to see if there are any transformations that need to be applied.
					// The expected format is a string following Raphael's convention for
					// defining transforms on an element.
					var transform = '';
					var rotate = this.valueFor('orientation', node.data, null, index);
					if (isString(rotate)) {
						rotate = orientations[rotate] || rotate;
					}
					if (rotate) {
						transform += 'r'+rotate;
					}

					var offsetX = this.valueFor('offset-x', node.data, 0, index);
					var offsetY = this.valueFor('offset-y', node.data, 0, index);
					var textAnchor = this.valueFor('text-anchor', node.data, 'middle', index);
					var vAlign  = this.valueFor('text-anchor-y', node.data, 'middle', index);

					// convert to a number
					vAlign = vAlign !== 'middle'? 0.5*textHeight * (vAlign === 'top'? 1: -1): 0;
					
					// If there are already elements in this transformation, add
					// a delimiter.
					if (transform){
						transform += ',t0,'+ vAlign;
					} else {
						offsetY += vAlign;
					}
					xPoint+= offsetX;
					yPoint+= offsetY;

					var attr = {
							'x': xPoint,
							'y': yPoint,
							'text': str,
							'stroke': 'none',
							'font-family': fontFamily,
							'font-size': fontSize,
							'font-weight': fontWeight,
							'text-anchor': textAnchor,
							'transform': transform,
							'opacity': opacity
							};
					var fattr;

					if (!label) {
						label = labels[index] = {};
					}
					
					// if outlined we create geometry behind the main text.
					if (outlineWidth) {
						fattr = aperture.util.extend({
							'fill': fillColor
						}, attr);
						
						var oopacity = 
							this.valueFor('font-outline-opacity', node.data, 1.0, index);
						
						if (oopacity !== '' && oopacity != null && oopacity !== 1) {
							if (opacity !== '' && opacity != null) {
								oopacity = Math.min(1.0, opacity * oopacity);
							}
						} else {
							oopacity = opacity;
						}
						
						attr['opacity']= oopacity !== 1? oopacity : '';
						attr['stroke-width']= outlineWidth;
						attr['stroke']= outlineColor;
						attr['stroke-linecap']= 'round';
						attr['stroke-linejoin']= 'round';
					} else {
						if (label.front) {
							g.remove(label.front);
							label.front = null;
						}
						attr['stroke']= 'none';
						attr['fill']= fillColor;
					}
					
					index = [index];
					
					// always deal with the back one first.
					if (!label.back) {
						label.back = g.text(xPoint, yPoint, str);
						g.data(label.back, node.data, index);
						g.attr(label.back, attr);
						g.apparate(label.back, changeSet.transition);
					} else {
						g.attr(label.back, attr, changeSet.transition);
					}
					
					if (connect) {
						var connectX = this.valueFor('connect-x', node.data, 0, index);
						var connectY = this.valueFor('connect-y', node.data, 0, index);
						var pathStr = 'M'+(xPoint-offsetX+connectX)+' '+(yPoint-offsetY+connectY)+'L'+xPoint+' '+yPoint;
						if (!label.path) {
							label.path = g.path(pathStr);
						} else {
							var pathattr = {path:pathStr};
							g.attr(label.path, pathattr, changeSet.transition);
						}
					} else {
						if (label.path) {
							g.remove(label.path);
						}
					}
					
					// then the front.
					if (outlineWidth) {
						if (!label.front) {
							label.front = g.text(xPoint, yPoint, str);
							
							g.data(label.front, node.data, index);
							g.attr(label.front, fattr);
							g.apparate(label.front, changeSet.transition);
						} else {
							g.attr(label.front, fattr, changeSet.transition);
						}
					}
				}
			}
		}
	});

	return namespace;

}(aperture || {}));
/**
 * Source: LinkLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Link Layer Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// bow angle is based on the 2/4 control point ratio used below. cached for speed.
	var bowang = Math.atan(0.5),
		bowsin = Math.sin(bowang),
		bowcos = Math.cos(bowang);
	
	/**
	 * Given a link spec, calculate the links two endpoints, accounting
	 * for any offsets.
	 */
	function linkPath(linkSpec, linkStyle) {
		// Create a path connecting the source and target points.
		var sx = linkSpec.sx, sy = linkSpec.sy,
			tx = linkSpec.tx, ty = linkSpec.ty,
			dx = tx - sx, dy = ty - sy,
			len = Math.sqrt(dx*dx + dy*dy);

		if (len) {
			
			var sr = linkSpec.sr / len,
				tr = linkSpec.tr / len;

			// distance is long enough to draw a link?
			if (sr + tr < 1) {
				// offset vectors
				var srX = dx * sr,
					srY = dy * sr,
					trX =-dx * tr,
					trY =-dy * tr;

				// rotate offsets?
				if (linkStyle === 'arc') {
					sx += srX*bowcos + srY*bowsin;
					sy +=-srX*bowsin + srY*bowcos;
					
					tx += trX*bowcos - trY*bowsin;
					ty += trX*bowsin + trY*bowcos;
					
					var c1 = (sx + tx)/2 + (ty - sy)/4,
						c2 = (sy + ty)/2 + (sx - tx)/4;
					
					return 'M'+ sx + ',' + sy + 'Q' + c1 + ',' + c2 + ',' + tx + ',' + ty;
		
				} else {
					sx += srX;
					sy += srY;
					tx += trX;
					ty += trY;
					
					return 'M'+ sx + ',' + sy + 'L' + tx + ',' + ty;
				}
			}
		} 
		
		return '';
	}

	/**
	 * Processes some user constants, translating into dash array.
	 */
	function strokeStyle(attrs, style) {
		switch (style) {
		case 'none':
			attrs.opacity = 0;
		case '':
		case 'solid':
			return '';
		case 'dashed':
			return '- ';
		case 'dotted':
			return '. ';
		}
		
		return style;
	}
	
	// assumes pre-existence of layer.
	namespace.LinkLayer = aperture.Layer.extend( 'aperture.LinkLayer',

		/** @lends aperture.LinkLayer# */
		{
			/**
			 * @class A layer for rendering links between two layer nodes.
			 *
			 * @mapping {String='#aaa'} stroke
			 *  The color of the link.
			 * 
			 * @mapping {Number=1} stroke-width
			 *  The width of the link line.
			 * 
			 * @mapping {'solid'|'dotted'|'dashed'|'none'| String} stroke-style
			 *  The link line style as a predefined option or custom dot/dash/space pattern such as '--.-- '.
			 *  A 'none' value will result in the link not being drawn.
			 * 
			 * @mapping {'line'|'arc'} link-style
			 *  The type of line that should be used to draw the link, currently limited to
			 *  a straight line or clockwise arc of consistent degree.
			 * 
			 * @mapping {Boolean=true} visible
			 *  The visibility of a link.
			 * 
			 * @mapping {Number=1} opacity
			 *  The opacity of a link. Values for opacity are bound with the range [0,1], with 1 being opaque.
			 * 
			 * @mapping {Object} source
			 *  The source node data object representing the starting point of the link. The source node
			 *  data object is supplied for node mappings 'node-x', 'node-y', and 'source-offset' for
			 *  convenience of shared mappings.
			 * 
			 * @mapping {Number=0} source-offset
			 *  The distance from the source node position at which to begin the link. The source-offset
			 *  mapping is supplied the source node as a data object when evaluated.
			 * 
			 * @mapping {Object} target
			 *  The target node data object representing the ending point of the link. The target node
			 *  data object is supplied for node mappings 'node-x', 'node-y', and 'target-offset' for
			 *  convenience of shared mappings.
			 * 
			 * @mapping {Number=0} target-offset
			 *  The distance from the target node position at which to begin the link. The target-offset
			 *  mapping is supplied the target node as a data object when evaluated.
			 * 
			 * @mapping {Number} node-x
			 *  A node's horizontal position, evaluated for both source and target nodes.
			 * 
			 * @mapping {Number} node-y
			 *  A node's vertical position, evaluated for both source and target nodes.
			 * 
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Layer
			 * @requires a vector canvas
			 *
			 */
			init : function( spec, mappings ) {
				aperture.Layer.prototype.init.call(this, spec, mappings );
			},

			// type flag
			canvasType : aperture.canvas.VECTOR_CANVAS,

			/*
			 * Render implementation
			 */
			render : function( changeSet ) {
				var i, 
					links = changeSet.updates, 
					n = links.length,
					transition = changeSet.transition;
				
				for (i=0; i<n; i++) {
					var link = links[i];
					var linkData   = link.data;
					var sourceData = this.valueFor('source', linkData, null);
					var targetData = this.valueFor('target', linkData, null);
					
					var endpoints = {
						'sx': this.valueFor('node-x', sourceData, 0, linkData),
						'sy': this.valueFor('node-y', sourceData, 0, linkData),
						'sr': this.valueFor('source-offset', sourceData, 0, linkData),
						'tx': this.valueFor('node-x', targetData, 0, linkData),
						'ty': this.valueFor('node-y', targetData, 0, linkData),
						'tr': this.valueFor('target-offset', targetData, 0, linkData)
					};
								
					// create a path.
					var path= linkPath(endpoints, this.valueFor('link-style', linkData, 'line'));

					var attrs = {
						'opacity': this.valueFor('opacity', linkData, 1),
						'stroke' : this.valueFor('stroke', linkData, 'link'),
						'stroke-width' : this.valueFor('stroke-width', linkData, 1)
					};
					
					// extra processing on stroke style
					attrs['stroke-dasharray'] = strokeStyle(attrs, this.valueFor('stroke-style', linkData, ''));

					// now render it.
					if (link.cache) {
						attrs.path = path;
						link.graphics.attr(link.cache, attrs, transition);
						
					} else {
						link.cache = link.graphics.path(path);
						link.graphics.attr(link.cache, attrs);
					}
				}
					
			}
		}
	);

	return namespace;

}(aperture || {}));

/**
 * Source: MapKey.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Map Keys for mapping from one space (e.g. data) into another (e.g. visual)
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	namespace.MapKey = namespace.Class.extend( 'aperture.MapKey',

		/** @lends aperture.MapKey# */
		{
			/**
			 * @class A MapKey object maps from a Range object, representing a variable in
			 * data, to a color or numeric visual property such as a size or coordinate.
			 * MapKey is abstract. Instances are constructed by calling
			 * {@link aperture.Range range.mappedTo()}, and are used by {@link aperture.Mapping mappings}.
			 *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Class
			 */
			init : function(from, to) {
				this.fromRange = from;
				this.toArray = to;
			},

			/**
			 * A label for this map key reflecting the data property
			 * being mapped in readable form. This value is initialized
			 * from the label in the range but may be subsequently changed here.
			 *
			 * @param {String} value If a parameter given, acts as a setter and sets the label.
			 * @returns {String} If no parameter given, returns the MapKey's label. Otherwise sets and returns the label.
			 */
			label : function ( value ) {
				if (arguments.length) {
					// Set the value
					this.label = value;
				}
				return this.label;
			},

			/**
			 * Returns the Range object that this maps from.
			 *
			 * @returns {aperture.Range}
			 */
			from : function () {
				return this.fromRange;
			},

			/**
			 * Returns the set of values that this maps to.
			 *
			 * @returns {Array}
			 */
			to : function () {
				return this.toArray;
			}

			/**
			 * Returns a visual property value mapped from a data value.
			 * This method is abstract and implemented by different types of map keys.
			 *
			 * @name map
			 * @methodOf aperture.MapKey.prototype
			 *
			 * @param dataValue
			 *      the value to be mapped using the key.
			 *
			 * @returns
			 *      the result of the mapping.
			 */

			/**
			 * This method is mostly relevant to scalar mappings,
			 * where it can be used to set a non-linear mapping
			 * function. A string can be passed indicating a standard
			 * non linear-function, or a custom function may be supplied.
			 * Standard types include
			 * <span class="fixedFont">'linear'</span> and
			 * <span class="fixedFont">'area'</span>, for area based
			 * visual properties (such as a circle's radius).
			 * <br><br>
			 * An ordinal map key returns a type of
			 * <span class="fixedFont">'ordinal'</span>.
			 *
			 * @name type
			 * @methodOf aperture.MapKey.prototype
			 *
			 * @param {String|Function} [type]
			 *      if setting the value, the type of mapping function which
			 *      will map the progression of 0 to 1 input values to 0 to 1
			 *      output values, or a custom function.
			 *
			 * @returns {this|Function}
			 *		if getting the mapping function, the type or custom function, else
			 *		if setting the function a reference to <span class="fixedFont">this</span> is
			 *		returned for convenience of chaining method calls.
			 */
		}
	);

	/**
	 * @private
	 * Predefined interpolators for each type
	 */
	var blenders = {
		'number' : function( v0, v1, weight1 ) {
			return v0 + weight1 * ( v1-v0 );
		},

		// objects must implement a blend function
		'object' : function( v0, v1, weight1 ) {
			return v0.blend( v1, weight1 );
		}
	},

	/**
	 * @private
	 * Default interpolation tweens
	 */
	toTypes = {

		// useful for any visual property that is area forming, like a circle's radius,
		// and where the data range is absolute.
		'area' : function ( value ) {
			return Math.sqrt( value );
		}
	};

	/**
	 * Implements mappings for scalar ranges.
	 * We privatize this from jsdoc to encourage direct
	 * construction from a scalar range (nothing else
	 * makes sense) and b/c there is nothing else to
	 * document here.
	 *
	 * @private
	 */
	namespace.ScalarMapKey = namespace.MapKey.extend( 'aperture.ScalarMapKey',
	{
		/**
		 * Constructor
		 * @private
		 */
		init : function( fromRange, toArray ) {
			namespace.MapKey.prototype.init.call( this, fromRange, toArray );

			this.blend = blenders[typeof toArray[0]];
			this.toType  = 'linear';
		},

		/**
		 * Implements the mapping function
		 * @private
		 */
		map : function( source ) {
			var mv = this.fromRange.map( source ),
				to = this.toArray;

			switch ( mv ) {
			case 0:
				// start
				return to[0];

			case 1:
				// end
				return to[to.length-1];

			default:
				// non-linear?
				if ( this.tween ) {
					mv = this.tween( mv, source );
				}

				// interpolate
				var i = Math.floor( mv *= to.length-1 );

				return this.blend( to[i], to[i+1], mv - i );
			}
		},

		/**
		 * A string can be passed indicating a standard
		 * non linear-function, or a custom function may be supplied.
		 * @private
		 * [Documented in MapKey]
		 */
		type : function ( type ) {
			if ( type === undefined ) {
				return this.toType;
			}

			if ( aperture.util.isFunction(type) ) {
				if (type(0) != 0 || type(1) != 1) {
					throw Error('map key type functions must map a progression from 0 to 1');
				}

				this.tween = type;
			} else if ( aperture.util.isString(type) ) {
				this.tween = toTypes[type];
			}

			this.toType = type;

			return this;
		}
	});

	/**
	 * Implements mappings for ordinal ranges.
	 * We privatize this from jsdoc to encourage direct
	 * construction from an ordinal range (nothing else
	 * makes sense) and b/c there is nothing else to
	 * document here.
	 *
	 * @private
	 */
	namespace.OrdinalMapKey = namespace.MapKey.extend( 'aperture.OrdinalMapKey',
	{
		/**
		 * Implements the mapping function
		 * @private
		 */
		map : function( source ) {
			// Map index to index, mod to be safe (to could be smaller than range)
			// Missing in range array leads to -1, array[-1] is undefined as desired
			return this.toArray[ this.fromRange.map(source) % this.toArray.length ];
		},

		/**
		 * For completeness.
		 * @private
		 */
		type : function ( type ) {
			if ( type === undefined ) {
				return 'ordinal';
			}

			return this;
		}
	});

	return namespace;

}(aperture || {}));

/**
 * Source: Mapping.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Mappings are used to define supply pipelines for visual
 * properties of layers.
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	var util = aperture.util,
		forEach = util.forEach;


	namespace.Mapping = aperture.Class.extend( 'aperture.Mapping',
	/** @lends aperture.Mapping# */
	{
		/**
		 * @class A Mapping is responsible for mapping value(s) for a visual property
		 * as a constant ({@link #asValue}) or {@link #from} a data source,
		 * {@link #using} an optional map key. Layer Mappings are
		 * accessed and defined by calling {@link aperture.Layer#map layer.map}.
		 *
		 * @constructs
		 * @factoryMade
		 * @extends aperture.Class
		 */
		init : function( property ) {
			/**
			 * The visual property to which this mapping pertains
			 * @private
			 */
			this.property = property;

			/**
			 * @private
			 */
			this.filters = [];

			/**
			 * @private
			 */
			this.dataAccessor = undefined;

			/**
			 * @private
			 */
			this.transformation = undefined;
		},

		/**
		 * Specifies that this mapping should not inherit
		 * from parent mappings.
		 *
		 * @returns {aperture.Mapping}
		 *      this mapping object
		 */
		only : function () {
			if (!this.hasOwnProperty('filters')) {
				this.filters = [];
			}
			if (!this.hasOwnProperty('dataAccessor')) {
				this.dataAccessor = undefined;
			}
			if (!this.hasOwnProperty('transformation')) {
				this.transformation = undefined;
			}

			return this;
		},

		/**
		 * Maps the graphic property from a source of values from the data object.
		 * A visual property may be mapped using one or more of the following constructs:
		 * <ul>
		 * <li>Field: A visual property may be mapped to a given field in the data.</li>
		 * <li>Function: A visual property may be mapped to a function that will be called and provided
		 * the data item and expected to return a value for the property.</li>
		 * </ul>
		 *
		 * @example
		 * // Map x to a field in the data object called 'xCoord'
		 * layer.map('x').from('xCoord');
		 * 
		 * // Map label to the value returned by the given function
		 * layer.map('label').from( function() { return 'Name: ' + this.name; } );
		 * 
		 * // Map label to the value returned by the given data object's prototype function
		 * layer.map('label').from( MyDataType.prototype.getName );
		 * 
		 * // Map x to a sequence of values and count to a static value of 20
		 * layer.map('x').from('xCoord[]');
		 * 
		 * // Map y to a function and count to the length of the array field 'points'
		 * layer.map('y').from( function(data, index) { return points[index].y; } );
		 * layer.map('count').from('points.length');
		 *
		 * @param {String|Function} source
		 *      the source of the data to map the graphic property.  May be a function that
		 *      maps a given data object to the desired source data in the form
		 *      <code>function(dataObject)</code>, or may be a data object field name
		 *      in the form <code>'a.b.c'</code> where the data will be sourced from
		 *      <code>dataObject.a.b.c</code>.  The length of an array field may be mapped
		 *      using <code>'fieldName.length'</code>.
		 *
		 * @returns {aperture.Mapping}
		 *      this mapping object
		 */
		from : function( source ) {
			// Preprocess the source to determine if it's a function, field reference, or constant
			if( util.isFunction(source) ) {
				/**
				 * @private
				 * Given a function, use it as the mapping function straight up
				 */
				this.dataAccessor = source;

			} else if( util.isString(source) ) {
				// Validate that this is a valid looking field definition
				var fieldChain = source.match(jsIdentifierRegEx);
				// Is a field definition?
				if( fieldChain ) {
					// Yes, create an array of field names in chain
					// Remove . from field names.  Leave []s
					fieldChain = util.map( fieldChain, function(field) {
						// Remove dots
						if( field.charAt(field.length-1) === '.' ) {
							return field.slice(0,field.length-1);
						} else {
							return field;
						}
					});

					/**
					 * @private
					 * Create a function that dereferences the given data item down the
					 * calculated field chain
					 */
					this.dataAccessor = function() {
						// Make a clone since the array will be changed
						// TODO Hide this need to copy?
						var chain = fieldChain.slice();
						// Pass in array of arguments = array of indexes
						return findFieldChainValue.call( this, chain, Array.prototype.slice.call(arguments) );
					};

					// TODO A faster version of the above for a single field
				} else {
					// String, but not a valid js field identifier
					// TODO logging
					throw new Error('Invalid object field "'+source+'" used for mapping');
				}
			} else {
				// Not a function, not a field
				// TODO log
				throw new Error('Mapping may only be done from a field name or a function');
			}

			return this;
		},

		/**
		 * Maps this property to a constant value.  The value may be a string, number, boolean
		 * array, or object.  A mapping to a constant value is an alternative to mapping do
		 * data using {@link #from}.
		 *
		 * @param {Object} value
		 *      The value to bind to this property.
		 *
		 * @returns {aperture.Mapping}
		 *      this mapping object
		 */
		asValue : function( value ) {
			/**
			 * @private
			 * Is just a static value string
			 */
			this.dataAccessor = function() {
				return value;
			};

			return this;
		},

		/**
		 * Provides a codified representational key for mapping between source data and the graphic
		 * property via a MapKey object. A MapKey object encapsulates the function of mapping from
		 * data value to graphic representation and the information necessary to express that mapping
		 * visually in a legend. Map keys can be created from Range objects, which describe
		 * the data range for a variable.
		 *
		 * A map key may be combined with a constant, field, or function provided data value source,
		 * providing the mapping from a variable source to visual property value for each data item, subject
		 * to any final filtering.
		 *
		 * The map key object will be used to translate the data value to an appropriate value
		 * for the visual property.  For example, it may map a numeric data value to a color.
		 *
		 * Calling this function without an argument returns the current map key, if any.
		 * 
		 * @param {aperture.MapKey} mapKey
		 *      The map key object to use in mapping data values to graphic property values.
		 *      Passing in null removes any existing key, leaving the source value untransformed,
		 *      subject to any final filtering.
		 *
		 * @returns {aperture.Mapping|aperture.MapKey}
		 *      this mapping object if setting the value, else the map key if getting.
		 */
		using : function( mapKey ) {
			if ( mapKey === undefined ) {
				return this.transformation;
			}
			this.transformation = mapKey;

			return this;
		},

		/**
		 * Applies a filter to this visual property, or clears all filters if no filter is supplied.
		 * A filter is applied after a visual value
		 * is calculated using the values passed into {@link #from}, {@link #asValue}, and
		 * {@link #using}.  Filters can be used to alter the visual value, for example, making
		 * a color brighter or overriding the stroke with on certain conditions.  A filter is a
		 * function in the form:
		 *
		 * @example
		 * function( value, etc... ) {
		 *     // value:  the visual value to be modified by the filter
		 *     // etc:    other values (such as indexes) passed in by the renderer
		 *     // this:   the data item to which this value pertains
		 *
		 *     return modifiedValue;
		 * }
		 *
		 * @param {Function} filter
		 *      A filter function in the form specified above, or nothing / null if clearing.
		 */
		filter : function( filter ) {
			if( filter ) {
				// only add to our own set of filters.
				if (!this.hasOwnProperty('filters')) {
					this.filters = [filter];
				} else {
					this.filters.push( filter );
				}
			} else {
				// Clear
				this.filters = [];
			}

			return this;
		},

		/**
		 * Removes a pre-existing filter, leaving any other filters intact.
		 *
		 * @param {Function} filter
		 *   A filter function to find and remove.
		 */
		filterWithout : function ( filter ) {
			this.filters = util.without(this.filters, filter);
		},

		/**
		 * Retrieves the visual property value for the given dataItem and optional indices.
		 *
		 * @param {Object} dataItem
		 *   The data object to retrieve a value for, which will be the value of <code>this</code> 
		 *   if evaluation involves calling a {@link #from from} and / or {@link #filter filter}function. 
		 *
		 * @param {Array} [index] 
		 *   An optional array of indices
		 *
		 *
		 */
		valueFor : function( dataItem, index ) {
			var value;

			// Get value (if no accessor, undefined)
			if( this.dataAccessor ) {
				// Get value from function, provide all arguments after dataItem
				value = this.dataAccessor.apply( dataItem, index || [] );
			}

			return this.value( value, dataItem, index );
		},

		/**
		 * Maps a raw value by transforming it and applying filters, returning
		 * a visual property value.
		 * 
		 * @param {Object} value
		 *   The source value to map. 
		 *   
		 * @param {Object} [context]
		 *   The optional context to supply to any filters. If omitted the value
		 *   of this in the filter call will be the Mapping instance.
		 *
		 * @param {Array} [index] 
		 *   Optional indices to pass to the filters.
		 *  
		 * @returns {Object}
		 *   A transformed and filtered value.
		 */
		value : function( value, context, index ) {
			
			// Transform
			if( this.transformation ) {
				value = this.transformation.map( value );
			}

			return this.filteredValue( value, context, index );
		},
		
		/**
		 * @protected
		 * Execute the filter.
		 */
		filteredValue : function( value, context, index ) {
			
			// Filter
			if( this.filters.length ) {
				context = context || this;
				var args = [value].concat(index);
				
				forEach( this.filters, function(filter) {
					// Apply the filter
					value = filter.apply(context, args);
					// Update value in args for next filter
					args[0] = value;
				});
			}

			return value;
		}
		
	});

	return namespace;

}(aperture || {}));
/**
 * Source: NodeLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Node Layer
 */

aperture = (
/** @private */
function(namespace) {

	/**
	 * @exports NodeLayer as aperture.NodeLayer
	 */
	var NodeLayer = aperture.PlotLayer.extend( 'aperture.NodeLayer',
	/** @lends NodeLayer# */
	{
		/**
		 * @augments aperture.PlotLayer
		 * @class Layer that takes in x/y visual mappings and draws all child layer
		 * items at the specified x/y.  Also allows mapping of x and y anchor positions.
		 * Supports DOM and Vector child layers.  The following data mappings are understood:

		 * @mapping {Number} node-x
		 *   The x-coordinate at which to locate the child layer visuals.
		 * 
		 * @mapping {Number} node-y
		 *   The y-coordinate at which to locate the child layer visuals.
		 * 
		 * @mapping {Number} width
		 *   The declared width of the node, which may factor into layout.
		 * 
		 * @mapping {Number} height
		 *   The declared height of the node, which may factor into layout.
		 * 
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			var that = this,
				x, y, xAnchor, yAnchor, width, height, item;
			
			// Treat adds and modifies the same - just need to update positions
			aperture.util.forEach(changeSet.updates, function( node ) {
				item = node.data;
				// Discover the mapped visual properties
				x = this.valueFor('node-x', item, 0);
				y = this.valueFor('node-y', item, 0);
				width = this.valueFor('width', item , 1);
				height = this.valueFor('height', item , 1);

				// Update the given node in place with these values
				node.position = [x,y];

				node.userData.id = item.id;
				
				// Update width/height (if it matters?)
				node.width = width;
				node.height = height;
			}, this);
			
			
			// will call renderChild for each child.
			aperture.PlotLayer.prototype.render.call( this, changeSet );
		}

	});

	namespace.NodeLayer = NodeLayer;

	/**
	 * @class NodeLink is a {@link aperture.NodeLayer NodeLayer}  vizlet, suitable for adding to the DOM.
	 * @augments aperture.NodeLayer
	 * @name aperture.NodeLink
	 *
	 * @constructor
	 * @param {String|Element} parent
	 *      A string specifying the id of the DOM element container for the vizlet or
	 *      a DOM element itself.
	 * @param {Object} [mappings]
	 *      An optional initial set of property mappings.
	 *
	 * @see aperture.NodeLayer
	 */
	namespace.NodeLink = aperture.vizlet.make( NodeLayer );

	return namespace;

}(aperture || {}));
/**
 * Source: NodeSet.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Node Sets refer to sets or subsets of layer nodes.
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// default id function
	function getId() {
		return this.id;
	}
	
	
	var util = aperture.util,
		isArray = util.isArray,
		isString = util.isString,
		isFunction = util.isFunction,
		forEach = util.forEach,
		NO_GRAPHICS = aperture.canvas.NO_GRAPHICS,
		NEVER = function() {
			return false;
		},
		NO_ITER = {next: function() {
		}};
		
		

		// iterator options returned by node set below.
		var LogicalAllIter = aperture.Class.extend('[private].LogicalAllIter', {
			
			init : function(first) {
				this._cur = {next: first};
			},
			next : function() {
				var c = this._cur;
				return c && (this._cur = c.next);
			}
			
		}), LogicalMatchIter = aperture.Class.extend('[private].LogicalMatchIter', {
			
			init : function(nodeSet, cache) {
				this._nodeSet = nodeSet;
				this._where = nodeSet._where;
				this._cur = {next: nodeSet._layer.nodes_};
				this._cache = cache? [] : null;
			},			
			next : function() {
				var h = this._cur;
				
				if (h) {
					var where = this._where,
						cache = this._cache;
					
					// find the next valid node.
					while ((h = h.next) && !where.call(h.data));

					if (cache) {
						if (h) {
							cache.push(h);
						}
						
						// if reached the last, cache the filtered set IN NODE SET for next iter.
						if (!h || !h.next) {
							this._nodeSet._cache = this._nodeSet._cache || cache;
							cache = null;
						}
					}
					
					return this._cur = h;
				}
			}
			
		}), ArrayIter = aperture.Class.extend('[private].ArrayIter', {
			
			init : function(array) {
				this._array = array;
				this._ix = 0;
			},
			next : function() {
				var a = this._array;

				if (a) {
					var i = this._ix, c = a[i++];

					// if reached the end, clear ref
					if ((this._ix = i) === a.length) {
						this._array = null;
					}
					
					return c;
				}
			}
			
		}), SingleIter = aperture.Class.extend('[private].SingleIter', {
			
			init : function(node) {
				this._cur = node;
			},
			next : function() {
				var n = this._cur;
				if (n) {
					this._cur = null;
					return n;
				}
			}
			
		}), MultiSetIter = aperture.Class.extend('[private].MultiSetIter', {
			
			init : function(sets, layer) {
				this._sets = sets;
				this._ix = 0;
				this._layer = layer;
				this._cur = sets[0].nodes(layer);
			},
			next : function() {
				var c = this._cur;
				
				if (c) {
					var n = c.next(), s;
					while (!n) {
						if ((s = this._sets[this._ix+=1]) == null) {
							break;
						}
						
						this._cur = c= s.nodes(this._layer);
						n = c.next();
					}
					return n;
				}
			}
			
		}), DataIter = aperture.Class.extend('[private].DataIter', {
			
			init : function(nodeIter) {
				this._nodes = nodeIter;
				this._cur = nodeIter.next();
			},
			next : function() {
				var c = this._cur;
				
				if (c) {
					this._cur = this._nodes.next();
					return c.data;
				}
			}
		
		}), MultiSet;
		
		
	function toFrontOrBack( planes, planeProperty, gfxFn ) {
			
		var layer = this._layer;
		
		if( !layer.hasLocalData ) { // will have no effect if no local data.
			return;
		}
		
		var c, i, j, n, p = planeProperty || 'plane';

		// if a sort function, do a heavyweight sort.
		if (util.isFunction(planes)) {
			
			var a = [];
			
			for (i = this.nodes(); (c = i.next()) != null;) {
				a.push({
					key: layer.valueFor(p, c.data, null),
					gfx: c.graphics
				});
			}

			a.sort(function(a, b) {
				return planes(a.key, b.key);
			});

			n = a.length;
			
			for (j = 0; j< n; ++j) {
				a[j].gfx[gfxFn]();
			}

		// else if anything, assume a set of planes and pull those to front in order.
		} else if (planes) {
			if (!util.isArray(planes)) {
				planes = [planes];
			}

			n = planes.length;
			
			for (j = 0; j< n; ++j) {
				for (i = this.nodes(); (c = i.next()) != null;) {
					if (c.graphics !== NO_GRAPHICS && planes[j] === layer.valueFor(p, c.data, null)) {
						c.graphics[gfxFn]();
					}
				}
			};

		// else simply order by node order.
		} else {
			for (i = this.nodes(); (c = i.next()) != null;) {
				c.graphics[gfxFn]();
			}
		}

		return this;
	}

	aperture.Layer.NodeSet = aperture.Class.extend( 'aperture.Layer.NodeSet',
	/** @lends aperture.Layer.NodeSet# */
	{
		/**
		 * @class Represents a set or subset of layer nodes, defined through subsequent
		 * calls to selector methods. NodeSet is abstract. A new node set is retrieved with a call
		 * to layer.nodes(), or is retrieved from an event.
		 * 
		 * @param {aperture.Layer} layer
		 *   the associated layer.
		 *   
		 * @constructs
		 * @factoryMade
		 * @extends aperture.Class
		 */
		init : function( layer ) {
			this._layer = layer;
			this._vizlets = [layer.vizlet()];
		},

		/**
		 * Applies a selection criteria on this node set where node data must pass a conditional test.
		 * 
		 * @param {Function|String} [test]
		 *   A test to be executed for each node's data. If a function is supplied it will be called 
		 *   for each node with this = data and the return value will be evaluated according to the
		 *   match criteria. If a string value is supplied the value of that data field name will be
		 *   evaluated instead. The test parameter may be excluded if the match parameter provides
		 *   a set of data objects to match against.
		 *   
		 * @param {Array|Object} [match]
		 *   Optionally one or more matches to evaluate the results of the test against, or if the test
		 *   is omitted, one or more data objects to match against. If match is omitted the test will
		 *   pass if it returns any 'truthy' value.
		 *   
		 * @example
		 *   // redraw data nodes with id C4501
		 *   layer.all().where('id', 'C4501').redraw();
		 *   
		 *   // redraw data nodes with id C4501, C4502
		 *   layer.all().where('id', ['C4501', 'C4502']).redraw();
		 *   
		 *   // redraw data nodes data0, data1
		 *   layer.all().where([data0, data1]).redraw();
		 *   
		 *   // redraw nodes which pass a filter function
		 *   function big(data) {
		 *      return data.size > 100000000;
		 *   }
		 *   layer.all().where(big).redraw();
		 *   
		 * @returns {this}
		 *   this set
		 */
		where : function ( test, match ) {
			this.revalidate();
			
			// PROCESS TEST
			// string test arg? a field name.
			if (isString(test)) {
				var propName = test;
				test = propName === 'id'? getId : function() {
					return this[propName];
				};
						
			// no test arg? shift args.
			} else if (!isFunction(test)) {
				if (test) {
					match = test;
					test = null;
				} else {
	 				this._where = NEVER;
					return this;
				}
			}

			
			// PROCESS MATCH.
			// no match? basic truthy test
			if (!match) {
				this._where = test;
				return this;

			// set of matches? match test results
			} else if (isArray(match)) {
				switch (match.length) {
				
				// unless no matches: shortcut to never
				case 0:
					this._where = NEVER;
					return this;
					
				// unless 1 match: shortcut to single match test defined later.
				case 1:
					match = match[0];
					break;
					
				default:
					if (test) {
						this._where = function() {
							var i, n = match.length,
								id = test.call(this);
							
							for (i=0; i< n; ++i) {
								if (match[i] === id) {
									return true;
								}
							}
						};
					} else {
						this._where = function() {
							var i, n = match.length;
							
							for (i=0; i< n; ++i) {
								if (match[i] === this) {
									return true;
								}
							}
						};
					}
					return this;
				}
			}

			// single match test.
			if (test) {
				this._where = function() {
					return match === test.call(this);
				};
			} else {
				this._where = function() {
					return match === this;
				};
			}
			
			return this;
		},
		
		/**
		 * Unions this node set with another and returns the result.
		 * 
		 * @returns {aperture.Layer.NodeSet} 
		 *   the union set of nodes
		 */
		and : function ( nodeSet ) {
			// TODO: hash it if haven't already, to exclude duplicates?
			return new MultiSet( [this, nodeSet] );
		},
		
//		/**
//		 * Returns the explicit set of parent nodes as a new set.
//		 * 
//		 * @returns {aperture.Layer.NodeSet} 
//		 *   the set of parent nodes
//		 */
//		parents : function ( ) {
//		},
		
		/**
		 * Returns true if the specified layer is included in this node set.
		 * 
		 * @returns {Boolean}
		 *   true if has this layer
		 */
		hasLayer : function ( layer ) {
			return layer === this._layer;
		},

		/**
		 * Returns a new data iterator for this node set. The iterator will be a simple object with
		 * a next() method that will return data for the next node in the set until there are no more to return.
		 * 
		 * @example
		 * var data,
		 *     iter = layer.all().data();
		 * 
		 * for (data = iter.next(); data != null; data = iter.next()) {
		 * 
		 * @returns {Object}
		 *   iterator object with method next()
		 */
		data : function( ) {
			return new DataIter( this.nodes() );
		},
		
		/**
		 * TODO
		 */
		inside : function( left, top, right, bottom ) {
			//this.revalidate();
		},
		
		/**
		 * Brings layer nodes successively to the front of their parent node(s), 
		 * using lighter or heavier weight techniques as desired. 
		 * Ordering at the layer level rather than in data is typically used for state 
		 * based changes like popping selected nodes to the top. Note that ordering nodes of a layer that 
		 * inherits its data from a parent layer has no effect, since there will be only one
		 * layer node per parent node.<br><br>
		 * 
		 * Usage examples:
		 *
		 * @example
		 * // bring any layer node with a 'plane' value of 'selected' to the front,
		 * // leaving others as they are.
		 * nodes.toFront( 'selected' );
		 *
		 * // bring any layer node with a 'selected' value of true to the front,
		 * // leaving unselected as they are.
		 * nodes.toFront( true, 'selected' );
		 *
		 * // all in a set to front by data order
		 * nodes.toFront( );
		 *
		 * // bring all 'unfiltered's to front, then all 'selected's above those
		 * nodes.toFront( ['unfiltered', 'selected'] );
		 *
		 * // call a sort function on the 'z-index' property value of layer nodes
		 * nodes.toFront( function(a,b) {return a-b;}, 'z-index' );
		 *
		 * @param {Array|Object|Function} [planes]
		 *      an array specifying a set of planes to
		 *      bring forward (in back to front order); or one such plane; or a function
		 *      to sort based on plane value. If planes is omitted all nodes are assumed
		 *      to be in the same plane and are sorted in the order in which they appear
		 *      in the data. See the examples for more information.
		 *
		 * @param {String} [planeProperty]
		 *      optionally, the name of the property that supplies the plane value for
		 *      layer nodes. If omitted it is assumed to be 'plane'.
		 *
		 * @returns {this}
		 *   this set
		 */
		toFront : function ( planes, planeProperty ) {
			return toFrontOrBack.call(this, planes, planeProperty, 'toFront');
		},

		/**
		 * Sends layer nodes successively to the back of their parent node(s), 
		 * using the same instruction api as {@link #toFront}.
		 */
		toBack : function ( planes, planeProperty ) {
			return toFrontOrBack.call(this, planes, planeProperty, 'toBack');
		},
		
		/**
		 * TODO
		 */
		layout : function( ) {
			
		},
		
		/**
		 * Removes the data within this set from the host layer. This provides a 
		 * mechanism to remove data from a layer without needing to reset all of the
		 * layer's data via a call to {@link aperture.Layer#all}.
		 *
		 * @returns {this}
		 *    this set after removing it from the host layer
		 */
		remove : function( ) {
			this._layer.removeNodeSet(this);
			return this;
		},
		
		/**
		 * Invokes a visual layer update of the node set.
		 * 
		 * @param {aperture.Transition} [transition]
		 *   an optional animated transition to use to phase in the changes.
		 *
		 * @returns {this}
		 *   this set
		 */
		redraw : function ( transition ) {
			this._vizlets[0].redraw(this, transition);
			
			return this;
		},
		
		/**
		 * @private
		 * returns a private vizlet nodes for use in redraw
		 */
		vizlets : function() {
			return this._vizlets;
		},
		
		/**
		 * @private
		 * Returns a new iterator for this node set, for all layers or the optionally specified layer.
		 * Returns null if the specified layer is not included. The iterator will be a simple object with
		 * a next() method that will return the next node in the set until there are no more to return.
		 * This method returns direct access to the nodes and is for framework use only.
		 * 
		 * @param {aperture.Layer} [layer]
		 *   optionally the layer to create an iterator for, relevant if a joined aggregate node set.
		 */
		nodes : function( layer ) {
		},

		/**
		 * @private
		 * If this is a logical node set, invalidate any cacheing.
		 * 
		 * @returns {this}
		 *   this set
		 */
		revalidate : function() {
			if (this._cache) {
				this._cache = null;
			}
		}
		
	});

	
	
	var SnS = aperture.Layer.SingleNodeSet = aperture.Layer.NodeSet.extend( 'aperture.Layer.SingleNodeSet',
	/** @lends aperture.Layer.SingleNodeSet# */
	{
		/**
		 * @private
		 * @class Represents a single constant node as a set.
		 * 
		 * @param {aperture.Layer.Node} node
		 *   
		 * @constructs
		 * @extends aperture.Layer.NodeSet
		 */
		init : function( node ) {
			aperture.Layer.NodeSet.prototype.init.call( this, node? node.layer : null );
			
			/**
			 * @private
			 */
			this._node = node;
		},
	
		/**
		 * @private
		 * override
		 */
//		parents : function ( ) {
//			var n = this._node;
//			
//			if (n && n.parent) {
//				return new SnS( n.parent );
//			}
//		},
		
		/**
		 * @private
		 * override
		 */
		nodes : function( layer ) {
			var where = this._where,
				node = this._node;
			
			return !node || !node.layer || (layer && layer !== this._layer) || (where && !where.call(node.data))? NO_ITER : 
				new SingleIter(node);
		}
		
	});

	
	aperture.Layer.LogicalNodeSet = aperture.Layer.NodeSet.extend( 'aperture.Layer.LogicalNodeSet',
	/** @lends aperture.Layer.LogicalNodeSet# */
	{
		/**
		 * @private
		 * @class Represents a set defined logically but not evaluated until the point of iteration.
		 * 
		 * @param {aperture.Layer} layer
		 *   the associated layer.
		 *   
		 * @constructs
		 * @extends aperture.Layer.NodeSet
		 */
		init : function( layer ) {
			aperture.Layer.NodeSet.prototype.init.call( this, layer );
		},
		
		/**
		 * @private
		 * override
		 */
//		parents : function ( ) {
//			// TODO:
//		},
		
		/**
		 * @private
		 * override
		 */
		nodes : function( layer ) {
			if ((layer && layer !== this._layer) || this._where === NEVER) {
				return NO_ITER;
			}

			// if no filter, return everything.
			if (!this._where) {
				return new LogicalAllIter(this._layer.nodes_);
			}
			
			// cacheing filtered set.
			if (!this._cache) {
				return new LogicalMatchIter(this, true);
			}
			
			// iterate over cached.
			return new ArrayIter(this._cache);

		}

	});
	
	
	MultiSet = aperture.Layer.MultiSet = aperture.Layer.NodeSet.extend( 'aperture.Layer.MultiSet',
	/** @lends aperture.Layer.MultiSet# */
	{
		/**
		 * @private
		 * @class Represents several sets as one.
		 * 
		 * @param {Array} sets
		 *   
		 * @constructs
		 * @extends aperture.Layer.NodeSet
		 */
		init : function(sets) {
			this._sets = sets;
			
			// populate vizlet list.
			var i, n = sets.length,
				j, v, setv, lenv, hash = {}, unique= this._vizlets = [];
			
			for (i=0; i<n; i++) {
				setv = sets[i].vizlets();
				lenv = setv.length;
				
				for (j=0; j<lenv; j++) {
					v = setv[j];
					if (!hash[v.uid]) {
						unique.push(hash[v.uid]= v);
					}
				}
			}
		},
	
		/**
		 * @private
		 * override
		 */
		nodes : function( layer ) {
			var i, sets = this._sets, n = sets.length, s, lsets;
			
			for (i=0; i<n; i++) {
				s = sets[i];

				if (!layer || s.hasLayer(layer)) {
					(lsets || (lsets= [])).push(s);
				}
			}
			
			return lsets? new MultiSetIter(lsets) : NO_ITER;
		},
		
		/**
		 * @private
		 * override
		 */
		hasLayer : function ( layer ) {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				if (sets[i].hasLayer(layer)) {
					return true;
				}
			}
			
			return false;
		},
		
		/**
		 * @private
		 * override
		 */
		where : NEVER,

		/**
		 * @private
		 * override
		 */
		remove : function () {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				sets[i].remove();
			}
			
			return this;
		},
		
		/**
		 * @private
		 * override
		 */
		toFront : function () {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				sets[i].toFront.apply( sets[i], arguments );
			}
			
			return this;
		},
		
		/**
		 * @private
		 * override
		 */
		toBack : function () {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				sets[i].toBack.apply( sets[i], arguments );
			}
			
			return this;
		},
		
		/**
		 * @private
		 * override
		 */
		redraw : function ( transition ) {
			var i, vizlets = this._vizlets, n = vizlets.length;
			
			for (i=0; i<n; i++) {
				vizlets[i].redraw(this, transition);
			}
			
			return this;
		},
		
		/**
		 * @private
		 * override
		 */
		revalidate : function() {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				sets[i].revalidate();
			}
		}
		
	});
	
			
	return namespace;

}(aperture || {}));
/**
 * Source: RadialLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview The Radial Layer Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// precalculate a few factors for speed.
	var degreesToRadians = Math.PI / 180,
		petalArcRadial = Math.SQRT2 - 1,
		petalTanFactor = 1 / Math.tan( degreesToRadians * 45 ),
		petalStemFactor = Math.SQRT1_2,

		/**
		 * @private
		 */
		rotateProto = function ( xy ) {
			var x= xy.x,
				y= xy.y;

			xy.x = x*this.cos - y*this.sin;
			xy.y = x*this.sin + y*this.cos;
		},

		/**
		 * @private
		 */
		noop = function () {
		},

		/**
		 * @private
		 * Creates a rotation element for efficient
		 * repeated calls to rotate.
		 */
		rotation = function ( angle ) {
			if (!angle) {
				return { angle: 0, rotate : noop };
			}
			var rad= degreesToRadians * angle;

			return {
				angle: angle,
				cos: Math.cos( rad ),
				sin: Math.sin( rad ),
				rotate : rotateProto
			};
		},

		/**
		 * @private
		 */
		arcFns = {

			/**
			 * @private
			 * Returns vertices and properties for a petal arc.
			 * Method signature is intentionally the same as for pies.
			 *
			 * @param spread
			 *  spread of the petal as an angle in degrees (will cap at 90)
			 *  
			 * @param length
			 *  the radial length
			 *  
			 * @param rotation
			 *  an optional rotation
			 */
			bloom : function ( length, spread, rotation ) {

					// y arc radial
				var ry = length * petalArcRadial,

					// x arc radial
					rx = ry * (spread < 90? Math.tan( degreesToRadians * 0.5 * spread )
											* petalTanFactor : 1),

					// proto point offsets
					px = rx * petalStemFactor,
					py = ry * petalStemFactor,

					// create the return object.
					arc = {
						rx : rx,
						ry : ry,
						rotation : rotation.angle,
						largeArcFlag : 1,

						// pre-rotation
						points : [{ x : -px, y : -py },
											{ x :  px, y : -py }]
					};

				// apply rotation
				rotation.rotate( arc.points[0] );
				rotation.rotate( arc.points[1] );

				return arc;
			},

			/**
			 * @private
			 * Returns vertices and properties for a wedge.
			 * Method signature is intentionally the same as for petals.
			 *
			 * @param spread
			 *  spread of the wedge as an angle
			 *  
			 * @param length
			 *  the radial length
			 *  
			 * @param rotation0
			 *  the rotation of the first arm of the sector
			 *  
			 * @param rotation1
			 *  the rotation of the second arm of the sector
			 */
			pie : function ( length, spread, rotation0, rotation1 ) {

				// create the return object.
				var arc = {
					rx : length,
					ry : length,
					rotation : 0,
					largeArcFlag : (spread > 180? 1 : 0),

					// start with identity points, then rotate them below.
					points : [{ x : 0, y : -length },
										{ x : 0, y : -length }]
				};

				// apply rotations
				rotation0.rotate( arc.points[0] );
				rotation1.rotate( arc.points[1] );

				return arc;
			}
		},

		/**
		 * @private
		 * Creates a forward or backward path from an arc definition.
		 *
		 * @param arc
		 *  the arc object as created by one of the arc functions (bloom, pie)
		 *
		 * @param prefix
		 *  the move to (M,m) or line to (L,l) prefix, depending on whether this is the beginning
		 *  or middle of a path.
		 *
		 * @param sweep-flag
		 *  the sweep flag value, 0 or 1.
		 */
		arcPath = function ( arc, prefix, sweepFlag ) {
			var i1 = sweepFlag,
				i0 = sweepFlag? 0:1;

			return prefix + ' '
				+ arc.points[i0].x + ','
				+ arc.points[i0].y + ' A'
				+ arc.rx + ','
				+ arc.ry + ' '
				+ arc.rotation + ' '
				+ arc.largeArcFlag + ','
				+ sweepFlag + ' '
				+ arc.points[i1].x + ','
				+ arc.points[i1].y;
		},

		/**
		 * @private
		 * Creates the path for a circle given the radius and the stroke direction
		 * @param radius
		 * @param sweep direction (alternate for inner vs. outer arcs)
		 */
		circlePath = function( radius, direction ) {
			var pt1 = -radius + ',0',
				pt2 = radius + ',0',
				radiusSpec = radius+','+radius;

			return 'M'+pt1+' A'+radiusSpec+' 0,0,'+direction+' '+
					pt2+' A'+radiusSpec+' 0,0,'+direction+' '+pt1+' z';
		},

		/**
		 * @private
		 * Series sorter.
		 */
		sortByRadialLength = function( a, b ) {
			return a.radius - b.radius;
		},

		none = 'none',

		// property defaults
		defaults = {
			'sector-count' : undefined,
			'start-angle' : 0,
			'form' : 'pie',
			'base-radius': 0,
			'outline': null,
			'outline-width': 3
		},
		seriesDefaults = {
			'radius' : 20,
			'fill' : none,
			'opacity' : 1,
			'stroke' : none,
			'stroke-width' : 1
		},


		// assumes pre-existence of layer.
		RadialLayer = aperture.Layer.extend( 'aperture.RadialLayer',

		/** @lends aperture.RadialLayer# */
		{
			/**
			 * @class
			 * Represents a layer of point located radial indicators.
			 * Radial layers are capable of representing simple circles, but may also
			 * be subdivided in the form of pies, donuts, or bloom indicators with discrete
			 * petals. They may also represent concentric series, which is particularly
			 * good at showing change or difference. A pie form with series creates
			 * a polar area diagram (also known as a coxcomb or rose), the most
			 * historically famous of which may be Florence Nightingale's visualization of
			 * mortality causes in the Crimean War.<br><br>
			 *
			 * If the sector-count property is mapped, each item in the first order data array
			 * represents a subdivision into discrete wedges or petals (sectors), whereas the second
			 * order represents concentric series for each. If left unmapped, the series is assumed
			 * to be the first order in the data.
			 * Series data will always be drawn concentrically from inside to outside with intersections
			 * removed, no matter what the order of size in the data.
			 * 
			 * @mapping {Number=0} x
			 *  The horizontal offset from the origin the layer will be drawn, as a value from 0 to 1. This value
			 *  is normalized against the width of the layer.
			 *  <i>Evaluated for each radial node.</i>
			 *
			 * @mapping {Number=0} y
			 *  The vertical offset from the origin the layer will be drawn, as a value from 0 to 1. This value
			 *  is normalized against the height of the layer.
			 *  <i>Evaluated for each radial node.</i>
			 *
			 * @mapping {'pie'|'bloom'} form
			 *  The form of layer elements. A
			 *  <span class="fixedFont">'pie'</span>
			 *  form can be used for pie, donut, or coxcomb indicators,
			 *  suitable for partitioned data, whereas a
			 *  <span class="fixedFont">'bloom'</span>
			 *  form can be used for discrete multi-variate data, similar to a radar chart.
			 *  If a single data element is provided, a circle is produced and this property
			 *  will have no effect.
			 *  <i>Evaluated for each radial node.</i>
			 *
			 * @mapping {Number=0} start-angle
			 *  The start angle of the first sector, in degrees. <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number=0} base-radius
			 *  The inner radius from which to start drawing. All other
			 *  radius values are relative to this value. This value is ignored for bloom forms.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number=1} sector-count
			 *  The number of sectors into which the layer element is subdivided. Note that for
			 *  convenience, if this value is left unmapped, the data will be assumed to NOT be
			 *  indexed by sectors, meaning that series may be indexed in data without having to
			 *  parent them with a single 'fake' sector.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {String='none'} outline
			 *  The color of an optional outline drawn behind the full perimeter of each layer element, separate from the stroke
			 *  properties of each segment.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number=3} outline-width
			 *  The width of the outline, if an outline is not 'none'.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number=1} outline-opacity
			 *  The opacity of the outline, if an outline is not 'none'.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number} sector-angle
			 *  The spread of the element, as an angle in degrees. If unset this value is
			 *  calculated automatically to be an equal fraction of 360 degrees for each sector.
			 *  <i>Evaluated for each sector of each radial node.</i>
			 * 
			 * @mapping {Number=1} series-count
			 *  The number of series for each sector.
			 *  <i>Evaluated for each sector of each radial node.</i>
			 * 
			 * @mapping {Number=20} radius
			 *  The radial length of the wedge or petal.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 * 
			 * @mapping {String='none'} fill
			 *  The fill color.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 *
			 * @mapping {String='none'} stroke
			 *  The outline stroke color.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 *
			 * @mapping {Number=1} stroke-width
			 *  The outline stroke width.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 * 
			 * @mapping {Number=1} opacity
			 *  The opacity as a value from 0 to 1.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Layer
			 * @requires a vector canvas
			 */
			init : function( spec, mappings ) {
				aperture.Layer.prototype.init.call(this, spec, mappings );
			},

			// type flag
			canvasType : aperture.canvas.VECTOR_CANVAS,

			/**
			 * @private
			 * Render implementation
			 */
			render : function( changeSet ) {

				// FOR NOW - process all changes INEFFICIENTLY as total rebuilds.
				var toProcess = changeSet.updates,
					i, iSegment, iSeries, node, visuals, graphics,
					transition = changeSet.transition;

				// Handle adds
				for( i=toProcess.length-1; i>=0; i-- ) {
					node = toProcess[i];
					var data = node.data,
						p = this.valuesFor(defaults, data),
						numSegments = p['sector-count'],
						segmented = 0,
						rotation0 = rotation(p['start-angle']),
						innerRadius = p['base-radius'],
						outlineWidth = p['outline-width'],
						outline = outlineWidth && p.outline !== 'none' && p.outline,
						outlinePath = '',
						maxRadius = 0,
						arc = arcFns.pie,
						strokes = [],
						shapes = [],
						dimSkip = false,
						path,
						j;

					if (numSegments == undefined) {
						numSegments = 1;
						dimSkip = true;
					}
					// use a different arc function for blooms,
					// and we don't currently support the inner radius so reset it to zero.
					if (p.form === 'bloom') {
						innerRadius = 0;
						arc = arcFns.bloom;
					}

					var defSpread = 360 / numSegments;
					
					// For each radial, build
					for( iSegment = 0; iSegment < numSegments; iSegment++ ) {
						if (this.valueFor( 'sector-angle', data, defSpread, iSegment ) && ++segmented === 2) {
							break;
						}
					}
					
					segmented = segmented > 1;

					// For each radial, build
					for( iSegment = 0; iSegment < numSegments; iSegment++ ) {

						var numSeries = this.valueFor( 'series-count', data, 1, iSegment ),
							spread = this.valueFor( 'sector-angle', data, defSpread, iSegment ),
							rotation1 = rotation( rotation0.angle + spread ),
							innerArc = innerRadius,
							singleSeries = numSeries === 1,
							radialData = [],
							outerArc,
							outerPath,
							seriesIndex;

						if (!spread) {
							continue;
						}

						// Collect all series data for sorting
						for( iSeries = 0; iSeries < numSeries; iSeries++ ) {
							seriesIndex = dimSkip? [iSeries] : [iSegment, iSeries];
							radialData.push(this.valuesFor(seriesDefaults, data, seriesIndex));
						}

						// Sort by increasing radial length
						radialData.sort( sortByRadialLength );

						// start somewhere?
						if ( innerRadius && segmented ) {
							innerArc = arc( innerRadius, spread, rotation0, rotation1 );
						}

						// Iterate from inner to outer-most series
						for( iSeries = 0; iSeries < numSeries; iSeries++ ) {

							var radius = radialData[iSeries].radius,
								stroke = radialData[iSeries].stroke,
								strokeWidth = radialData[iSeries]['stroke-width'],
								fill   = radialData[iSeries].fill,
								outlineSeries = outline && iSeries == numSeries-1;

							// skip items with no radius.
							if ( radius <= 0 ) {
								continue;
							}

							maxRadius = Math.max( maxRadius, radius );

							// has radial segments?
							if( segmented ) {

								// Create radial petal
								outerArc = arc( innerRadius + radius, spread, rotation0, rotation1 );

								// form the arc to begin the path.
								path = outerPath = arcPath( outerArc, 'M', 1 );

								// append to the outline.
								if (outlineSeries) {
									if (outlinePath) {
										outlinePath += arcPath( outerArc, ' L', 1 );
									} else {
										outlinePath = outerPath;
									}
								}
								
								// the complete shape, tapered to point 0,0 (strokes use this as well)
								outerPath += ' L0,0 Z';

								if( innerArc ) {
									// outer arc plus inner arc reversed, then closed
									path += arcPath( innerArc, 'L', 0 ) + ' Z';

								} else {
									path = outerPath;
								}

							// else create a circle.
							} else {

								// outerArc is the outer radius
								outerArc = innerRadius + radius;

								// start with the outer circle.
								path = outerPath = circlePath( outerArc, 1 );

								// then if there is a cutout, add that.
								if( innerArc ) {

									// Create the inner path of the ring using the innerArc (radius)
									path += circlePath( innerArc, 0 );
								}
								
								// form the outline.
								if (outlineSeries) {
									outlinePath = outerPath;
								}
							}


							// add the filled part, if there is something visible here.
							if ( fill || (singleSeries && stroke) ) {
								shapes.push( {
									graphic: {
										'path': path,
										'fill': fill,
										'opacity': radialData[iSeries].opacity,
										'stroke-width': singleSeries? strokeWidth : 0,
										'stroke': singleSeries? stroke : none
									},
									series: iSeries,
									segment: iSegment
								});
							}

							// have to draw the stroke separately in all
							// multi-series cases because:
							// a) it needs to define the outer edge only and
							// b) it needs to sit on top.
							if ( !singleSeries && stroke !== none ) {
								strokes.push( {
									graphic: {
										// arc plus a tapered point to 0,0
										'path': outerPath,
										'fill': none,
										'opacity': 1,
										'stroke-width': strokeWidth,
										'stroke': stroke
									},
									series: iSeries,
									segment: iSegment
								});
							}

							// This one's outer becomes the next one's inner
							innerArc = outerArc;
						}

						// increment angle.
						rotation0 = rotation1;
					}

					// add the strokes in reverse order.
					for ( j = strokes.length; j-- > 0; ) {
						shapes.push(strokes[j]);
					}


					// NOW PROCESS ALL SHAPES INTO GRAPHICS.
					// There is one node per radial visual.
					var xCoord = node.position[0]+ (this.valueFor('x', node.data, 0))*node.width,
						yCoord = node.position[1]+ ((this.valueFor('y', node.data, 0)))*node.height,
						ud = node.userData;

					visuals = ud.visuals;
					graphics  = node.graphics;

					var nShapes = shapes.length,
						transform = 't' + xCoord + ',' + yCoord;

					// insert perimeter outline?
					if (outline) {
						
						// Create the inner path of the ring
						if (innerRadius) {
							outlinePath += ' ' + circlePath( innerRadius, 0 );
						}
						outlinePath += ' Z';
						
						var attrs = {
							'fill': none,
							'stroke' : outline,
							'stroke-width' : outlineWidth,
							'opacity' : this.valueFor('outline-opacity', node.data, 1),
							'transform' : transform
						};
						
						path = ud.outline;
						
						if (path) {
							attrs.path = outlinePath;
							graphics.attr(path, attrs, transition);
						} else {
//								console.log(outlinePath);
							
							path = ud.outline = graphics.path(outlinePath);
							graphics.toBack(path);
							graphics.attr(path, attrs);
						}
					} else if (ud.outline) {
						graphics.remove(ud.outline);
						ud.outline = null;
					}
						
					// get visuals, create storage if not already there
					if (!visuals) {
						visuals = ud.visuals = [];
					}

					// sync our set of path visuals.
					if (visuals.length > nShapes) {
						graphics.removeAll(visuals.splice(nShapes, visuals.length - nShapes));
					} else {
						while (visuals.length < nShapes) {
							path = graphics.path();
							visuals.push(path);
						}
					}

					// Turn it into graphics.
					for (j = 0; j < shapes.length; j++) {

						// add transform attribute as well.
						shapes[j].graphic.transform = transform;

						// apply all attributes.
						graphics.attr(visuals[j], shapes[j].graphic, transition);

						// Set the data associated with this visual element
						graphics.data( visuals[j], data, [shapes[j].segment, shapes[j].series] );
					}
				}

			}
		}
	);

	// expose item
	namespace.RadialLayer = RadialLayer;

	return namespace;

}(aperture || {}));

/**
 * Source: Range.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview The Range implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// util is always defined by this point
	var util = aperture.util;

	// we use this to check for VALID numbers (NaN not allowed)
	function isValidNumber( value ) {
		return !isNaN( value );
	}

	namespace.Range = aperture.Class.extend( 'aperture.Range',

		/** @lends aperture.Range.prototype */
		{
			/**
			 * @class Represents an abstract model property range. Range is
			 * implemented for both scalar and ordinal properties by
			 * {@link aperture.Scalar Scalar} and
			 * {@link aperture.Ordinal Ordinal}.
			 * <p>
			 *
			 * @constructs
			 * @description
			 * This constructor is abstract and may not be called.
			 * @extends aperture.Class
			 *
			 * @param {String} name
			 *      the label of the property described.
			 *
			 * @returns {this}
			 *      a new Range
			 */
			init : function( name ) {

				// views may allow the user to override label.
				this.label = name;

				// default formatting.
				this.formatter_ = new namespace.Format();

			},

			/**
			 * Gets or sets the value of the name for this property.
			 * If this is a view, the base range will be left untouched.
			 * To delete a view's name and once again fallback to the base
			 * label set the view's name value to null.
			 *
			 * @param {String} [text]
			 *      the value, if setting it rather than getting it
			 *
			 * @returns {String|this}
			 *      the label of this property if a get, or this if a set.
			 */
			name : function( text ) {

				// get
				if ( text === undefined ) {
					return this.label;
				}
				// set
				if ( text === null ) {
					delete this.label;
				} else {
					this.label = text;
				}

				return this;
			},

			/**
			 * Expands the property range to encompass the value, if necessary.
			 * This method is abstract and implemented by specific types of ranges.
			 *
			 * @param {Array|Number|String} value
			 *      a case or set of cases to include in the property range.
			 *
			 * @returns {this}
			 *      a reference to this property.
			 *
			 * @name aperture.Range.prototype.expand
			 * @function
			 */

			/**
			 * Clears the property range, then optionally expands
			 * it with new values.
			 * This method is abstract and implemented by specific types of ranges.
			 *
			 * @param {Array|Number} [values]
			 *
			 * @returns {this}
			 *      a reference to this property.
			 *
			 * @name aperture.Range.prototype.reset
			 * @function
			 */

			/**
			 * Returns a new banded scalar view of this range. Banded views are used for
			 * axis articulation, and for scalars can also be used for quantizing values
			 * to labeled ordinal bands of values.
			 * Banded views are live, meaning subsequent range changes are allowed through either
			 * the view or its source.
			 * This method is abstract and implemented by specific types of ranges.
			 *
			 * @returns {aperture.Range}
			 *      a new scalar view of this Range.
			 *
			 * @name aperture.Range.prototype.banded
			 * @function
			 */

			/**
			 * See the mappedTo function.
			 *
			 * @deprecated
			 */
			mapKey : function ( to ) {
				return this.mappedTo( to );
			},

			/**
			 * Creates a key for mapping from this model range to a visual property
			 * range. This method is abstract and implemented by specific types
			 * of ranges.
			 *
			 * @param {Array} to
			 *      the ordered set of colors or numbers to map to, from this property's
			 *      range.
			 *
			 * @returns {aperture.MapKey}
			 *      a new map key.
			 *
			 * @name aperture.Range.prototype.mappedTo
			 * @function
			 */

			/**
			 * Returns the value's position within the Range object.
			 * Ranges implement this function to map data values into the range.
			 * This method is abstract and implemented by specific types of ranges.
			 * @param value
			 *      the value to map within the Range
			 *
			 * @returns the mapped value.
			 *
			 * @name aperture.Range.prototype.map
			 * @function
			 */

			/**
			 * Retrieves the contents of this range as an array.  The content of the array
			 * depends on the type of range (e.g. Scalar, Ordinal, etc). Ordinals return
			 * the sum set of cases in the order added, whereas Scalars return a two element
			 * array of min, max or undefined if the range is yet unset.
			 * This method is abstract and implemented by specific types of ranges.
			 *
			 * @returns {Array} array with the contents of the range
			 */
			get : function() {

				if (!this.range.values || !this.range.values.length) {
					return this.range.values;
				}
				// if range has been revised but not view, refresh view now.
				if (this.revision !== this.range.revision) {
					this.revision = this.range.revision;
					this.view = this.doView();
				}

				return this.view;
			},

			/**
			 * Returns the start of the range. For scalars this will be the minimum of the extents, and
			 * for ordinals it will be the first case. To reset the start and end extents use the reset function.
			 */
			start : function() {
				return this.get()[0];
			},

			/**
			 * Returns the end of the range. For scalars this will be the maximum of the extents, and
			 * for ordinals it will be the last case. To reset the start and end extents use the reset function.
			 */
			end : function() {
				var e = this.get();

				return e && e[e.length-1];
			},

			/**
			 * Formats a value as a String using the current formatter.
			 *
			 * @param value
			 *      the value to format into a string
			 *
			 * @returns {String}
			 *      the formatted value.
			 */
			format : function ( value ) {
				return this.formatter_.format( value );
			},

			/**
			 * Gets or sets the current formatter as a function.
			 * The default formatter simply uses the JavaScript String function.
			 *
			 * @param {aperture.Format} [formatter]
			 *      if setting the formatter, a Format object which
			 *      will format values.
			 *
			 * @returns {aperture.Format|this}
			 *      if getting the formatter, it will be returned,
			 *      otherwise a reference to this,
			 *      convenient for chained method calls.
			 */
			formatter : function ( f ) {
				// get
				if ( f == null ) {
					return this.formatter_;
				}
				if ( !f.typeOf || !f.typeOf(namespace.Format) ) {
					throw new Error('Range formatter must be a Format object');
				}

				this.formatter_ = f;

				return this;
			},

			/**
			 * Returns a displayable string which
			 * includes the property label and extent of the property.
			 *
			 * @returns {String}
			 *      a string.
			 */
			toString : function ( ) {
				var range = this.get();

				return this.label + range? (' [' + range.toString() + ']') : '';
			}
		}
	);

	/**
	 * @private
	 * Increment revision so views have a quick dirty check option.
	 * Used by both scalars and ordinals, on themselves.
	 */
	var revise = function () {
		this.revision++;

		if (this.revision === Number.MAX_VALUE) {
			this.revision = 0;
		}
	},

	/**
	 * @private
	 * Throw an error for this case.
	 */
	noBandedViews = function () {
		throw new Error('Cannot create a scalar view of a banded scalar!');
	},

	/**
	 * @private
	 * The range factory function for scalars.
	 */
	range = (

		/**
		 * @private
		 */
		function() {

			/**
			 * @private
			 * Modify range
			 */
			var set = function ( min, max ) {

				var rv = this.values;

				if( rv ) {
					// Have an existing range, expand
					if( min < rv[0] ) {
						rv[0] = min;
						this.revise();
					}
					if( max > rv[1] ) {
						rv[1] = max;
						this.revise();
					}
				} else {
					// No range set yet, set with min/max
					this.values = [min, max];
					this.revise();
				}
			},

			/**
			 * @private
			 * Clear any existing values.
			 */
			reset = function() {
				this.values = null;
				this.revise();
			};

			/**
			 * @private
			 * Factory method.
			 */
			return function () {
				return {
					values : null,
					revision : 0,
					revise : revise,
					set : set,
					reset : reset
				};
			};
	}());


	namespace.Scalar = namespace.Range.extend( 'aperture.Scalar',

		/** @lends aperture.Scalar.prototype */
		{
			/**
			 * @class Represents a scalar model property range. Unlike
			 * in the case of Ordinals, Scalar property map keys
			 * use interpolation when mapping values to visual
			 * properties. If the desired visual mapping of a raw scalar value
			 * is ordinal rather than scalar (for instance a change value
			 * where positive is an 'up' color and negative is a 'down' color), call
			 * <span class="fixedFont">quantized</span> to derive an ordinal view of
			 * the Scalar.
			 * <p>
			 *
			 * @augments aperture.Range
			 * @constructs
			 * @description
			 * Constructs a new scalar range.
			 *
			 * @param {String} name
			 *      the name of the property described.
			 * @param {Array|Number|String|Date} [values]
			 *      an optional array of values (or a single value) with which to
			 *      populate the range. Equivalent to calling {@link #expand} after construction.
			 *
			 * @returns {this}
			 *      a new Scalar
			 */
			init : function( name, values ) {
				namespace.Range.prototype.init.call(this, name);

				// create a range object,
				// shareable and settable by both base and view
				this.range = range();

				// starting view revision is 0
				// this gets checked later against range revision
				this.revision = 0;

				// handle initial value expansion
				if( values != null ) {
					this.expand(values);
				}
			},

			/**
			 * Expands the property range to encompass the value, if necessary.
			 *
			 * @param {Array|Number|String|Date} value
			 *      a case or set of cases to include in the property range. Each must
			 *      be a Number, a String representation of a number, or a
			 *      Date.
			 *
			 * @returns {this}
			 *      a reference to this property.
			 */
			expand : function ( value ) {
				var min, max, rv = this.range.values;

				if( util.isArray(value) ) {
					// Ensure they're all valid numbers
					var numbers = util.filter(util.map(value,Number), isValidNumber);
					if (!numbers.length) {
						return this;
					}
					// Find the min/max
					min = Math.min.apply(Math,numbers);
					max = Math.max.apply(Math,numbers);
				} else {
					// A single value
					min = max = Number(value);
					if (isNaN(min)) {
						return this;
					}
				}

				this.range.set( min, max );

				return this;
			},

			/**
			 * Clears the property range, then optionally expands
			 * it with new values.
			 *
			 * @param {Array|Number|String|Date} [values]
			 *
			 * @returns {this}
			 *      a reference to this property.
			 */
			reset : function ( values ) {
				this.range.reset();

				if ( values != null ) {
					this.expand ( values );
				}

				return this;
			},

			/**
			 * Returns the value's normalized position within the Range
			 * object.  The return value will be in the range of [0,1].
			 *
			 * @param {Number} value
			 *      the value to normalize by the Range
			 *
			 * @return {Number} the normalized value of the input in the range [0,1]
			 */
			map : function( value ) {
				// call function in case extended.
				var d = this.get();

				// if anything is invalid (null or NaN(!==NaN)), return 0 to keep our clamped contract.
				if( !d || value == null || (value = Number(value)) !== value) {
					return 0;
				}

				// return limit or interpolate
				return value <= d[0]? 0
						: value >= d[1]? 1
								: (value-d[0]) / (d[1]-d[0]);
			},

			/**
			 * Creates and returns a key for mapping from this model range to a visual property
			 * range. Mappings are evaluated dynamically, meaning subsequent
			 * range changes are allowed. Multiple map keys may be generated from the
			 * same range object.
			 *
			 * @param {Array} to
			 *      the ordered set of colors or numbers to map to, from this property's
			 *      range.
			 *
			 * @returns {aperture.MapKey}
			 *      a new map key.
			 */
			mappedTo : function ( to ) {

				// allow for array wrapping or not.
				if (arguments.length > 1) {
					to = Array.prototype.slice.call(arguments);
				}
				// diagnose problems early so they don't cascade later
				if ( to.length === 0 || (util.isNumber(to[0]) && isNaN(to[0]))) {
					aperture.log.error('Cannot map a scalar range to array length zero or NaN values.');
					return;
				}

				if ( !util.isNumber(to[0]) && !to[0].blend ) {
					// assume colors are strings
					if (util.isString(to[0])) {
						to = util.map(to, function(s) {
							return new aperture.Color(s);
						});
					} else {
						aperture.log.error('Mappings of Scalar ranges must map to numbers or objects with a blend function.');
						return;
					}
				}

				return new namespace.ScalarMapKey( this, to );
			},

			/**
			 * @private
			 *
			 * Views override this to chain updates together. This will never
			 * be called if the range is empty / null. The default implementation
			 * returns a single copy of the source range which is subsequently transformed
			 * by downstream views, in place.
			 */
			doView : function() {
				return this.range.values.slice();
			}
		}
	);

	/**
	 * Returns a new scalar view of this range which is symmetric about zero.
	 * Views are dynamic, adapting to any subsequent changes
	 * in the base range.
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.Scalar.prototype.symmetric
	 * @function
	 */
	namespace.Scalar.addView( 'symmetric',
		{
			init : function ( ) {
				this.revision = 0;
			},

			doView : function ( ) {

				// start by copying our upstream view.
				var v = this._base.doView();

				// then balance around zero
				if( Math.abs(v[0]) > Math.abs(v[1]) ) {
					v[1] = -v[0];
				} else {
					v[0] = -v[1];
				}

				// return value for downstream views.
				return v;
			}
		}
	);

	/**
	 * Returns a new scalar view which ranges from zero to the greatest absolute
	 * distance from zero and which maps the absolute magnitude of values.
	 * Views are dynamic, adapting to any subsequent changes
	 * in the base range.
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.Scalar.prototype.absolute
	 * @function
	 */
	namespace.Scalar.addView( 'absolute',
		{
			init : function ( ) {
				this.revision = 0;
			},

			doView : function ( ) {

				// start by copying our upstream view.
				var v = this._base.doView();

				v[1] = Math.max ( Math.abs(v[0]), Math.abs(v[1]) );
				v[0] = 0;

				// return value for downstream views.
				return v;
			},

			// Override of map function for absolute cases.
			map : function ( value ) {

				// error check (note that math.abs below will take care of other invalid cases)
				if( value == null ) {
					return 0;
				}
				return this._base.map.call( this, Math.abs(value) );
			}
		}
	);

	// used in banding
	function roundStep( step ) {
		var round = Math.pow( 10, Math.floor( Math.log( step ) * Math.LOG10E ) );

		// round steps are considered 1, 2, or 5.
		step /= round;

		if (step <= 2) {
			step = 2;
		} else if (step <= 5) {
			step = 5;
		} else {
			step = 10;
		}

		return step * round;
	}

	/**
	 * Returns a new banded scalar view of this range based on the specification
	 * supplied. Bands are used for axis articulation, or
	 * for subsequently quantizing scalars into labeled ordinals
	 * (e.g. up / down, or good / bad) for visual mapping (e.g. up color, down color).
	 * A banded view returns multiple band object values for
	 * <span class="fixedFont">get()</span>, where each object has a
	 * <span class="fixedFont">min</span>,
	 * <span class="fixedFont">label</span>, and
	 * <span class="fixedFont">limit</span> property.
	 * <br><br>
	 * Banded views are live, meaning subsequent range changes are allowed. Multiple
	 * bands may be generated from the same range object for different visual
	 * applications. Scalar bands may be specified simply by supplying a desired
	 * approximate count, appropriate to the visual range available, or by specifying
	 * predefined labeled value bands based on the domain of the values, such
	 * as 'Very Good' or 'Very Poor'. Bounds are always evaluated by a
	 * minimum threshold condition and must be contiguous.
	 * <br><br>
	 * Banded or quantized views must be the last in the chain of views -
	 * other optional views such as logarithmic, absolute, or symmetric can be
	 * the source of a banded view but cannot be derived from one.For example:
	 *
	 * @example
	 *
	 * // default banded view
	 * myTimeRange.banded();
	 *
	 * // view with around five bands, or a little less
	 * myTimeRange.banded(5);
	 *
	 * // view with around five bands, and don't round the edges
	 * myTimeRange.banded(5, false);
	 *
	 * // or, view banded every thousand
	 * myTimeRange.banded({ span: 1000 });
	 *
	 * // or, view with these exact bands
	 * myTimeRange.banded([{min: 0}, {min: 500}]);
	 *
	 * // or, using shortcut for above.
	 * myTimeRange.banded([0, 500]);
	 *
	 * @param {Number|Object|Array} [bands=1(minimum)]
	 *      the approximate count of bands to create, OR a band specification object
	 *      containing a span field indicating the regular interval for bands, OR an
	 *      array of predefined bands supplied as objects with min and label properties,
	 *      in ascending order. If this value is not supplied one band will be created,
	 *      or two if the range extents span zero.
	 *
	 * @param {boolean} [roundTo=true]
	 *      whether or not to round the range extents to band edges
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range, with limitations on further view creation.
	 *
	 * @name aperture.Scalar.prototype.banded
	 * @function
	 */
	namespace.Scalar.addView( 'banded',
		{
			init : function ( bands, roundTo ) {
				this.revision = 0;

				// prevent derivation of more views. would be nice to support secondary
				// banding, but not supported yet.
				this.abs = this.log = this.symmetric = noBandedViews;
				this.bandSpec = {roundTo : this.bandSpec? false : roundTo === undefined? true : roundTo};

				// predefined bands? validate labels.
				if ( util.isNumber(bands) ) {
					if ( isNaN(bands) || bands < 1 ) {
						bands = 1;
					}
				} else if ( bands && bands.span && !isNaN(bands.span)) {
					this.bandSpec.autoBands = bands;
				} else if ( util.isArray(bands) ) {
					// don't continue as array if not valid...
					if ( bands.length < 1 ) {
						bands = 1;
					} else {
						var band, limit, i;

						// copy (hmm, but note this does not deep copy)
						this.bandSpec.bands = bands = bands.slice();

						// process in descending order.
						for ( i = bands.length; i-->0; ) {
							band = bands[i];

							// replace numbers with objects.
							if ( util.isNumber(band) ) {
								band = { min : band };
								bands.splice( i, 1, band );
							}

							// set limit for convenience if not set.
							if (band.limit === undefined && limit !== undefined) {
								band.limit = limit;
							}

							limit = band.min;
						}
					}

				} else {
					bands = 1;
				}

				// a number. generate them from the source data.
				if (!this.bandSpec.bands) {
					this.bandSpec.autoBands = bands;
				}
			},

			doView : function ( ) {

				var v = this._base.doView(),
					bands = this.bandSpec.bands;

				// second order bands
				if (!util.isNumber(v[0])) {
					v = this._base.extents;
				}
				if (this.bandSpec.autoBands) {

					// TODO: cover log case.

					// first get extents, forcing an update.
					// note end and start here may vary from the actual v[0] and v[1] values
					var spec = this.bandSpec.autoBands,
						start = v[0],
						end = v[1];

					// if zero range, handle problem case by bumping up the end of range by a tenth (or 1 if zero).
					if (end === start) {
						end = (end? end + 0.1* Math.abs(end) : 1);
					}

					// delegate to any specialized class/view, or handle standard cases here.
					if (this.doBands) {
						bands = this.doBands(start, end, spec);
					} else {
						bands = [];

						var step = spec.span;

						if (!step || step < 0) {
							// if range spans zero, want an increment to fall on zero,
							// so use the larger half to calculate the round step.
							if (end * start < 0) {
								// cannot properly create only one band if it spans zero.
								if (spec === 1) {
									spec = 2;
								}
								// use the greater absolute.
								if (end > -start) {
									spec *= end / (end-start);
									start = 0;

								} else {
									spec *= -start / (end-start);
									end = 0;
								}
							}

							step = roundStep((end - start) / spec);
						}

						var next = Math.floor( v[0] / step ) * step,
							min;

						// build the range.
						do {
							min = next;
							next += step;
							bands.push({
								min : min,
								limit : next
							});

						} while (next < v[1]);
					}
				} else {
					var first = 0, last = bands.length;

					while ( --last > 0 ) {
						if ( v[1] > bands[last].min ) {
							first = last+ 1;
							while ( --first > 0 ) {
								if ( v[0] >= bands[first].min ) {
									break;
								}
							}
							break;
						}
					}

					// take a copy of the active subset
					bands = bands.slice(first, last+1);
				}

				// if not rounded, replace any partial bands with unbounded bands,
				// signaling that the bottom should not be ticked.
				if ( !this.bandSpec.roundTo ) {
					// Only do this if there is more than 1 band, otherwise
					// both the band min and limit values will be unbounded
					// and there will not be a top or bottom tick.
					if ( v[0] !== bands[0].min && bands.length > 1) {
						bands[0] = {
							min : -Number.MAX_VALUE,
							limit : bands[0].limit,
							label : bands[0].label
						};
					}

					var e = bands.length - 1;

					if ( v[1] !== bands[e].limit ) {
						bands[e] = {
							min : bands[e].min,
							limit : Number.MAX_VALUE,
							label : bands[e].label
						};
					}

				} else {
					// else revise the extents for update below.
					if (bands[0].min != null) {
						v[0] = bands[0].min;
					}
					if (bands[bands.length-1].limit != null) {
						v[1] = bands[bands.length-1].limit;
					}
				}

				// store extents for mapping
				this.extents = v;

				return bands;
			},

			// override to use extents instead of the result of get.
			start : function() {
				this.get();
				return this.extents && this.extents[0];
			},
			end : function() {
				this.get();
				return this.extents && this.extents[1];
			},
			map : function( value ) {

				// call function to update if necessary.
				this.get();

				var d = this.extents;

				// if anything is invalid, return 0 to keep our clamped contract.
				if( !d || value == null || isNaN(value = Number(value)) ) {
					return 0;
				}
				// return limit or interpolate
				return value <= d[0]? 0
						: value >= d[1]? 1
								: (value-d[0]) / (d[1]-d[0]);
			}
		}
	);

	/**
	 * Returns a quantized ordinal view of a banded scalar view range.
	 * Quantized views map ordinally (and produce ordinal mappings)
	 * and format scalar values by returning the ordinal band they fall into.
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range, with ordinal mapping.
	 *
	 * @name aperture.Scalar.prototype.quantized
	 * @function
	 */
	namespace.Scalar.addView( 'quantized',
		{
			init : function ( ) {
				if ( !this.typeOf( namespace.Scalar.prototype.banded ) ) {
					throw new Error('Only banded scalars can be quantized.');
				}
				this.banded = noBandedViews;
				this.revision = 0;
			},

			// In our view implementation we add labels to a copy of the
			// banded set.
			doView : function ( ) {
				var src = this._base.doView();

				if (this.bandSpec.autoBands) {
					var label,
						band,
						bands = [],
						i = src.length;

					// process in descending order. make sure we have labels etc.
					while ( i-- > 0 ) {
						band = src[i];

						if (band.min !== -Math.MAX_VALUE) {
							label = view.format( band.min );

							if (band.limit !== Math.MAX_VALUE) {
								label += ' - ' + view.format( band.limit );
							} else {
								label += ' +';
							}

						} else {
							if (band.limit !== Math.MAX_VALUE) {
								label = '< ' + view.format( band.limit );
							} else {
								label = 'all';
							}
						}

						// push new def
						bands.push({
							min : band.min,
							limit : band.limit,
							label : label
						});
					}

					return bands;
				}

				return src;
			},

			// Implemented to create an ordinal mapping.
			mappedTo : function ( to ) {

				// co-opt this method from ordinal
				return namespace.Ordinal.prototype.mappedTo.call( this, to );
			},

			// Implemented to map a scalar value to an ordinal value by finding its band.
			map : function ( value ) {
				var v = this.get();

				// if anything is invalid, return 0 to keep our clamped contract. otherwise...
				if( v && value != null && !isNaN(value = Number(value)) ) {
					var i = v.length;

					while (i-- > 0) {
						if ( value >= v[i].min ) {
							return i;
						}
					}
				}

				return 0;
			},

			/**
			 * Implemented to return the band label for a value
			 */
			format : function ( value ) {
				return this.get()[this.map( value )].label;
			}
		}
	);

	/**
	 * Returns a new scalar view which maps the order of magnitude of source values.
	 * Log views are constructed with a <span class="fixedFont">zero</span>
	 * threshold specifying the absolute value under which values should be no longer
	 * be mapped logarithmically, even if in range. Specifying this value enables
	 * a range to safely approach or span zero and still map effectively.
	 * Log views can map negative or positive values and are
	 * dynamic, adapting to any subsequent changes in the base range.
	 *
	 * @param zero
	 *      the minimum absolute value above which to map logarithmically.
	 *      if not supplied this value will default to 0.1.
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.Scalar.prototype.logarithmic
	 * @function
	 */
	namespace.Scalar.addView( 'logarithmic',
		{
			init : function ( zero ) {
				this.revision = 0;
				this.absMin = zero || 0.1;
			},

			doView : function ( ) {

				// start by copying our upstream view.
				var v = this._base.doView();

				// constraint the range boundaries based on the
				// log minimum configured.
				if ( v[0] < 0 ) {
					v[0] = Math.min( v[0], -this.absMin );
					v[1] = ( v[1] < 0 )?
						Math.min( v[1], -this.absMin ): // both neg
						Math.max( v[1],  this.absMin ); // spans zero
				} else {
					// both positive
					v[0] = Math.max( v[0], this.absMin );
					v[1] = Math.max( v[1], this.absMin );
				}

				// cache derived constants for fast map calculations.
				var log0 = Math.log(Math.abs( v[0] ))* Math.LOG10E;
				var log1 = Math.log(Math.abs( v[1] ))* Math.LOG10E;

				// find our abs log min and max - if spans, the zeroish value, else the smaller
				this.logMin = v[0]*v[1] < 0? Math.log(this.absMin)* Math.LOG10E : Math.min( log0, log1 );
				this.mappedLogMin = 0;
				this.oneOverLogRange = 0;

				// establish the range
				var logRange = log0 - this.logMin + log1 - this.logMin;

				if (logRange) {
					this.oneOverLogRange = 1 / logRange;

					// now find mapped closest-to-zero value (between 0 and 1)
					this.mappedLogMin = v[0] >= 0? 0: v[1] <= 0? 1:
						(log0 - this.logMin) * this.oneOverLogRange;
				}

				// return value for downstream views.
				return v;
			},

			// Override of map function for logarithmic cases.
			map : function ( value ) {

				// call base map impl, which also updates view if necessary.
				// handles simple edge cases, out of bounds, bad value check, etc.
				switch (this._base.map.call( this, value )) {
				case 0:
					return 0;
				case 1:
					return 1;
				}

				var absValue = Math.abs( value = Number(value) );

				// otherwise do a log mapping
				return this.mappedLogMin +

					// zero(ish)?
					( absValue <= this.absMin? 0 :
						// or - direction * mapped log value
						( value > 0? 1 : -1 ) *
							( Math.log( absValue )* Math.LOG10E - this.logMin ) * this.oneOverLogRange );
			}
		}
	);

	// time banding has specialized rules for rounding.
	// band options here are broken into hierarchical orders.
	var timeOrders = (function () {

		function roundY( date, base ) {
			date.set({
				FullYear: Math.floor(date.get('FullYear') / base) * base, 
				Month: 0,
				Date: 1, 
				Hours: 0,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundM( date, base ) {
			date.set({
				Month: Math.floor(date.get('Month') / base) * base,
				Date: 1, 
				Hours: 0,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundW( date, base ) {
			date.set({
				Date: date.get('Date') - date.get('Day'), 
				Hours: 0,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundD( date, base ) {
			date.set({
				Date: 1 + Math.floor((date.get('Date') - 1) / base) * base, 
				Hours: 0,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundH( date, base ) {
			date.set({
				Hours: Math.floor(date.get('Hours') / base) * base,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundMin( date, base ) {
			date.set({
				Minutes: Math.floor(date.get('Minutes') / base) * base,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundS( date, base ) {
			date.set({
				Seconds: Math.floor(date.get('Seconds') / base) * base,
				MilliSeconds: 0});
		}
		function roundMs( date, base ) {
			date.set({MilliSeconds: Math.floor(date.get('Milliseconds') / base) * base});
		}

		// define using logical schema...
		var orders = [
				// above one year, normal scalar band rules apply
				{ field: 'FullYear', span: /*366 days*/316224e5, round: roundY, steps: [ 1 ] },
				{ field: 'Month', span: /*31 days*/26784e5, round: roundM, steps: [ 3, 1 ] },
				{ field: 'Date', span: 864e5, round: roundW, steps: [ 7 ] },
				{ field: 'Date', span: 864e5, round: roundD, steps: [ 1 ] },
				{ field: 'Hours', span:36e5, round: roundH, steps: [ 12, 6, 3, 1 ] },
				{ field: 'Minutes', span: 6e4, round: roundMin, steps: [ 30, 15, 5, 1 ] },
				{ field: 'Seconds', span: 1e3, round: roundS, steps: [ 30, 15, 5, 1 ] },
				{ field: 'Milliseconds', span: 1, round: roundMs, steps: [ 500, 250, 100, 50, 25, 10, 5, 1 ] }
				// below seconds, normal scalar band rules apply
		], timeOrders = [], last, dateProto = Date.prototype;

		// ...then flatten for convenience.
		util.forEach( orders, function( order ) {
			util.forEach( order.steps, function( step ) {
				timeOrders.push(last = {
					name   : order.field,
					span   : order.span * step,
					next   : last,
					base   : step,
					round  : order.round
				});
			});
		});

		return timeOrders;
	}());

	// log warning if using unsupported view functions
	function noTimeView() {
		aperture.log.warn('Absolute, logarithmic or symmetric views are inappropriate for time scalars and are intentionally excluded.');
	}

	var fieldAliases = { 'Year' : 'FullYear', 'Day' : 'Date' };

	namespace.TimeScalar = namespace.Scalar.extend( 'aperture.TimeScalar',

		/** @lends aperture.TimeScalar.prototype */
		{
			/** @private */
			_utc: true,

			/**
			 * @class Extends a scalar model property range with
			 * modest specialization of formatting and banding for
			 * JavaScript Dates. Dates are mappable by time by simple
			 * scalars as well, however this class is more appropriate
			 * for determining and labeling bands within a scalar range.
			 * When banded, default date formatting is used
			 * (for the purposes of axis labeling) unless explicitly
			 * overridden in the banded view.
			 * <p>
			 *
			 * @augments aperture.Scalar
			 * @constructs
			 * @description
			 * Constructs a new scalar time range.
			 *
			 * @param {String} name
			 *      the name of the property described.
			 * @param {Array|Number|String|Date} [values]
			 *      an optional array of values (or a single value) with which to
			 *      populate the range. Equivalent to calling {@link #expand} after construction.
			 *
			 * @returns {this}
			 *      a new Scalar
			 */
			init : function( name, values ) {
				namespace.Scalar.prototype.init.call(this, name, values);
				this.formatter_ = new namespace.TimeFormat();
			},

			/**
			 * Overrides the implementation in {@link aperture.Scalar Scalar}
			 * to expect a units field if the band specification object option
			 * is exercised. The units field in that case will be a
			 * string for the span, corresponding to the exact name of a
			 * common field in the Date class. For example:
			 *
			 * @example
			 * // band every three years
			 * myTimeRange.banded( {
			 *     span: 3,
			 *     units: 'FullYear',
			 * };
			 *
			 * @param {Number|Object|Array} [bands=1(minimum)]
			 *      the approximate count of bands to create, OR a band specification object
			 *      containing a span field indicating the regular interval for bands, OR an
			 *      array of predefined bands supplied as objects with min and label properties,
			 *      in ascending order. If this value is not supplied one band will be created,
			 *      or two if the range extents span zero.
			 *
			 * @param {boolean} [roundTo=true]
			 *      whether or not to round the range extents to band edges
			 *
			 * @returns {aperture.TimeScalar}
			 *      a new view of this Range, with limitations on further view creation.
			 *
			 */
			banded : function( bands, roundTo ) {
				var view = namespace.Scalar.prototype.banded.call(this, bands, roundTo);

				// update unless overridden.
				view.autoFormat = true;
				view.get(); // Force the view to populate all its properties.
				return view;
			},

			// unregister these view factories
			absolute : noTimeView,
			logarithmic : noTimeView,
			symmetric : noTimeView,

			// band specialization - only called by banded views.
			doBands : function(start, end, spec) {
				var order, base, i = 0;

				// is span predetermined?
				if (spec.span) {
					base = !isNaN(spec.span) && spec.span > 1? spec.span : 1;

					if (spec.units) {
						var units = fieldAliases[spec.units] || spec.units;

						// find appropriate order (excluding week, unless matched exactly)
						for (len = timeOrders.length; i < len; i++) {
							if (timeOrders[i].name === units) {
								if ((order = timeOrders[i]).base <= base
										&& (order.base !== 7 || base === 7) ) {
									break;
								}
							}
						}
					}
					if (!order) {
						aperture.log.error('Invalid units in band specification: ' + units);
						spec = 1;
						i = 0;
					}
				}
				if (!order) {
					var interval = Math.max(1, (end - start) / spec), len;

					// find first under interval.
					for (len = timeOrders.length; i < len; i++) {
						if ((order = timeOrders[i]).span < interval) {
							order = order.next || order; // then pick the next higher
							break;
						}
					}

					// step in base units. in years? use multiple of base then.
					base = order.next? order.base : Math.max(1, roundStep( interval / 31536e6 )); // in years (/365 day yr)
				}

				// only auto update format if we haven't had it overridden.
				if (this.autoFormat) {
					this.formatter_ = new namespace.TimeFormat( {precision: order.name, local: !this._utc} )
				}

				// round the start date
				var date = new aperture.Date(start, {local: !this._utc}), band, bands = [];
				order.round(date, base);

				// stepping function for bands, in milliseconds
				// (this arbitrary threshold limit kills any chance of an infinite loop, jic.)
				while (i++ < 1000) {
					var next = date.valueOf();

					// last limit is this
					if (band) {
						band.limit = next;
					}

					// break once we're at or past the end
					if (next >= end) {
						break;
					}

					// create band (set limit next round)
					bands.push(band = {min: next});

					date.add(base, order.name);
				}

				return bands;
			}
		}
	);

	/**
	 * Returns a new time scalar view which operates in the local timezone. This
	 * applies to banding and time display.
	 *
	 * @returns {aperture.TimeScalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.TimeScalar.prototype.local
	 * @function
	 */
	namespace.TimeScalar.addView( 'local', {
		init : function () {
			this._utc = false;
			this.formatter_._utc = false;
		}
	});

	/**
	 * Returns a new time scalar view which operates in the UTC timezone. This
	 * applies to banding and time display.
	 *
	 * @returns {aperture.TimeScalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.TimeScalar.prototype.utc
	 * @function
	 */
	namespace.TimeScalar.addView( 'utc', {
		init : function () {
			this._utc = true;
			this.formatter_._utc = true;
		}
	});

	namespace.Ordinal = namespace.Range.extend( 'aperture.Ordinal',

		/** @lends aperture.Ordinal.prototype */
		{
			/**
			 * @class Represents an ordinal model property range. Unlike Scalar
			 * property mappings, which interpolate, Ordinals map ordered
			 * model cases to order visual property options: for instance
			 * series colors, or up / down indicators.
			 * <p>
			 *
			 * @augments aperture.Range
			 * @constructs
			 * @description
			 * Constructs a new ordinal range.
			 *
			 * @param {String} name
			 *      the name of the property described.
			 * @param {Array|Object} [values]
			 *      an optional array of ordinal values/cases with witch to populate
			 *      the object, or a single such value.
			 *
			 * @returns {this}
			 *      a new Ordinal
			 */
			init : function( name, values ) {
				namespace.Range.prototype.init.call(this, name);

				/**
				 * @private
				 * a record of the values (and their order) that we've seen so far
				 */
				this.range = {values : [], revision : 0, revise : revise};

				// starting view revision is 0
				// this gets checked later against range revision
				this.revision = 0;

				if( values != null ) {
					this.expand(values);
				}
			},

			/**
			 * Removes a property value from the set of ordinal cases.
			 *
			 * @param value
			 *      a case to remove from the property.
			 *
			 * @returns
			 *      the value removed, or null if not found.
			 */
			revoke : function ( value ) {
				if( util.isArray(value) ) {
					// Revoking an array of things
					var args = [this.range.values];
					this.range.values = util.without.apply(util, args.concat(value));
				} else {
					// Revoking a single thing
					this.range.values = util.without(this.range.values, value);
				}

				this.range.revise();

				return this;
			},

			/**
			 * Clears the property range, then optionally expands
			 * it with new values.
			 *
			 * @param {Array|Object} [values]
			 *      an optional array of ordinal values/cases with witch to repopulate
			 *      the object, or a single such value.
			 *
			 * @returns {this}
			 *      a reference to this property.
			 */
			reset : function ( values ) {
				this.range.values = [];
				this.range.revise();

				if ( values != null ) {
					this.expand ( values );
				}

				return this;
			},


			/**
			 * Expands the property range to encompass the value, if necessary.
			 *
			 * @param {Array|Object} value
			 *      a case or set of cases to include in the property range.
			 *
			 * @returns {this}
			 *      a reference to this property.
			 */
			expand : function ( value ) {
				var values = this.range.values,
					size = values.length,
					changed, i= 0, n;

				if ( util.isArray(value) ) {
					for (n= value.length; i< n; i++) {
						changed = ( util.indexOf(values, value[i]) === -1 && values.push(value[i])) || changed;
					}
				} else {
					changed = ( util.indexOf(values, value) === -1 && values.push(value));
				}

				if (changed) {
					this.range.revise();
				}
				return this;
			},

			/**
			 * Creates a key for mapping from this model range to a visual property
			 * range.
			 *
			 * @param {Array} to
			 *      the ordered set of colors or numbers to map to, from this property's
			 *      range.
			 *
			 * @returns {aperture.MapKey}
			 *      a new map key.
			 */
			mappedTo : function ( to ) {

				// allow for array wrapping or not.
				if (arguments.length > 1) {
					to = Array.prototype.slice.call(arguments);
				}
				// diagnose problems early so they don't cascade later
				if ( to.length === 0 ) {
					return;
				}

				return new namespace.OrdinalMapKey( this, to );
			},

			/**
			 * Returns the mapped index of the specified value, adding
			 * it if it has not already been seen.
			 */
			map : function ( value ) {
				var values = this.range.values,
					i = util.indexOf( values, value );

				// add if have not yet seen.
				if (i < 0) {
					i = values.length;

					values.push( value );
				}

				return i;
			},

			/**
			 * Returns the index of the specified value, or -1 if not found.
			 */
			indexOf : function ( value ) {
				return util.indexOf( this.range.values, value );
			},

			/**
			 * @private
			 *
			 * Views override this to chain updates together. This will never
			 * be called if the range is empty / null. The default implementation
			 * returns the source range (not a copy) which is subsequently transformed
			 * by downstream views, in place.
			 */
			doView : function() {
				return this.range.values;
			}
		}
	);

	/**
	 * Returns a new banded scalar view of this range which maps to the normalized
	 * center of band. Banded views are used for axis articulation.
	 * Banded views are live, meaning subsequent range changes are allowed.
	 *
	 * @returns {aperture.Ordinal}
	 *      a new scalar view of this Range, with limitations on further view creation.
	 *
	 * @name aperture.Ordinal.prototype.banded
	 * @function
	 */
	namespace.Ordinal.addView( 'banded',
		{
			init : function ( view ) {
				this.revision = 0;
			},

			// implemented to return a banded version.
			doView : function ( ) {

				// start by copying our upstream view.
				var v = this._base.doView(),
					bands = [],
					i= v.length,
					limit = '';

				bands.length = i;

				while (i-- > 0) {
					bands[i]= {
						min: v[i],
						label: v[i].toString(),
						limit: limit
					};
					limit = v[i];
				}

				return bands;
			},

			// Implemented to create an ordinal mapping.
			mappedTo : function ( to ) {

				// co-opt this method from scalar
				return namespace.Scalar.prototype.mappedTo.call( this, to );
			},

			// Implemented to map an ordinal value to a scalar value.
			map : function ( value ) {

				var n = this.get().length;

				// normalize.
				return n === 0? 0: this._base.map( value ) / n;
			},

			// would be nice to support this for aggregated bins, but not right now.
			banded : function () {
				throw new Error('Cannot create a view of a banded ordinal!');
			}
		}
	);

	return namespace;

}(aperture || {}));
/**
 * Source: SankeyPathLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Link Layer Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	var _sankeyCache = {};
	/**
	 * Processes some user constants, translating into dash array.
	 */
	function strokeStyle(attrs, style) {
		switch (style) {
		case 'none':
			attrs.opacity = 0;
			break;
		case '':
		case 'solid':
			return '';
		case 'dashed':
			return '- ';
		case 'dotted':
			return '. ';
		}

		return style;
	}


	function removeSankeys(links){
		var i;

		for (i=0; i<links.length; i++) {
			var link = links[i];
			var linkData   = link.data;
			if(_sankeyCache[linkData.id]){
				delete _sankeyCache[linkData.id];
			}
		}
	}


	function stackLinks(links){
		var i, sourceMap = {},
			targetMap = {};
		var n = links.length;
		var map = this.mappings()['stroke-width'];
		var minWidth = 1;

		// need to enforce a zero bottom range for individual links or the total will be wrong.
		// real bottom range is still used as a minimum width in rendering but not stacked offsets
		if (map && map.using()) {
			minWidth = map.using().to()[0];

			if (minWidth > 0) {
				map = aperture.util.viewOf(map);
				map.using(aperture.util.viewOf(map.using()));
				map.using().toArray = map.using().toArray.slice();
				map.using().toArray[0] = 0;
			}
		}

		for (i=0; i<n; i++) {
			var link = links[i];
			var linkData   = link.data;
			var sourceData = this.valueFor('source', linkData, null);
			var targetData = this.valueFor('target', linkData, null);
			var width = map.valueFor(linkData) || 0;

			var flowSpec = {
				'source': {
					uid : this.valueFor('node-uid', sourceData, '', linkData),
					duplicateId : this.valueFor('node-id', sourceData, null, linkData),
					x : this.valueFor('node-x', sourceData, 0, linkData),
					y : this.valueFor('node-y', sourceData, 0, linkData) ,
					r : this.valueFor('source-offset', sourceData, 0, linkData)
				},
				'target' : {
					uid : this.valueFor('node-uid', targetData, '', linkData),
					duplicateId : this.valueFor('node-id', targetData, null, linkData),
					'x': this.valueFor('node-x', targetData, 0, linkData),
					'y': this.valueFor('node-y', targetData, 0, linkData),
					'r': this.valueFor('target-offset', targetData, 0, linkData)
				},
				'link' : link,
				'width' : width
			};

			var src = sourceMap[flowSpec.source.uid];
			if (src == null) {
				src = sourceMap[flowSpec.source.uid] = {'outflows':[]};
			}
			src.outflows.push(flowSpec);
			src.anchor = this.valueFor('sankey-anchor', sourceData, 'top');

			var trg = targetMap[flowSpec.target.uid];
			if (trg == null) {
				trg = targetMap[flowSpec.target.uid] = {'inflows':[]};
			}
			trg.inflows.push(flowSpec);
			trg.anchor = this.valueFor('sankey-anchor', targetData, 'top');
		}

		// Order the source endpoints based on the target endpoints's y-position.
		aperture.util.forEach(sourceMap, function(source) {
			var flows = source.outflows;
			flows.sort(function(a, b) {
				return a.target.y <= b.target.y ? -1 : 1;
			});
		});

		// Order the incoming flows of each target node by the flow's target y-position.
		aperture.util.forEach(targetMap, function(target) {
			var flows = target.inflows;
			flows.sort(function(a, b) {
				return a.source.y <= b.source.y ? -1 : 1;
			});
		});

		return {sourceMap : sourceMap, targetMap : targetMap, minWidth: minWidth};
	}


	function calcFlowPath(source, target){
		//TODO: Account for different flow styles and layout orientations.

		// Now calculate the control points for the curve.
		var midPt = {
				'x' : 0.5*(target.x + source.x),
				'y' : 0.5*(target.y + source.y)
		};

		var path = 'M' + source.x + ',' + source.y;
		// Calculate the control points.
		path += 'C' + midPt.x + ',' + source.y + ',' + midPt.x + ',' + target.y + ',' + target.x + ',' + target.y;

		return path;
	}


	// assumes pre-existence of layer.
	namespace.SankeyPathLayer = aperture.Layer.extend( 'aperture.SankeyPathLayer',

		/** @lends aperture.SankeyPathLayer# */
		{
			/**
			 * @class A layer for rendering links between two layer nodes.
			 *
			 * @mapping {String='#aaa'} stroke
			 *  The color of the link.
			 *
			 * @mapping {Number=1} stroke-width
			 *  The width of the link line.
			 *
			 * @mapping {'solid'|'dotted'|'dashed'|'none'| String} stroke-style
			 *  The link line style as a predefined option or custom dot/dash/space pattern such as '--.-- '.
			 *  A 'none' value will result in the link not being drawn.
			 *
			 * @mapping {'line'|'arc'} link-style
			 *  The type of line that should be used to draw the link, currently limited to
			 *  a straight line or clockwise arc of consistent degree.
			 *
			 * @mapping {'top'|'middle'|'bottom' String='top'} sankey-anchor
			 *  The relative position that the Sankey flows will start drawing from on a node. 'top' will draw the flows top-down starting from the given node location,
			 *  'middle' will center the flows about the given node position, whereas 'bottom' will be bottom up.
			 *
			 * @mapping {Boolean=true} visible
			 *  The visibility of a link.
			 *
			 * @mapping {Number=1} opacity
			 *  The opacity of a link. Values for opacity are bound with the range [0,1], with 1 being opaque.
			 *
			 * @mapping {Object} source
			 *  The source node data object representing the starting point of the link. The source node
			 *  data object is supplied for node mappings 'node-uid', 'node-id', 'node-x', 'node-y', and 'source-offset' for
			 *  convenience of shared mappings.
			 *
			 * @mapping {Number=0} source-offset
			 *  The distance from the source node position at which to begin the link. The source-offset
			 *  mapping is supplied the source node as a data object when evaluated.
			 *
			 * @mapping {Object} target
			 *  The target node data object representing the ending point of the link. The target node
			 *  data object is supplied for node mappings 'node-uid', 'node-id', 'node-x', 'node-y', and 'target-offset' for
			 *  convenience of shared mappings.
			 *
			 * @mapping {Number=0} target-offset
			 *  The distance from the target node position at which to begin the link. The target-offset
			 *  mapping is supplied the target node as a data object when evaluated.
			 *
			 * @mapping {String} node-uid
			 *  A node's unique identifier.
			 *
			 * @mapping {String} node-id
			 *  A node's secondary id. This does not need to be unique and can be used for type or property identification.
			 *
			 * @mapping {Number} node-x
			 *  A node's horizontal position, evaluated for both source and target nodes.
			 *
			 * @mapping {Number} node-y
			 *  A node's vertical position, evaluated for both source and target nodes.
			 *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Layer
			 * @requires a vector canvas
			 *
			 */
			init : function( spec, mappings ) {
				aperture.Layer.prototype.init.call(this, spec, mappings );
			},

			// type flag
			canvasType : aperture.canvas.VECTOR_CANVAS,

			/*
			 * Render implementation
			 */
			render : function( changeSet ) {
				var i,
					links = changeSet.updates,
					transition = changeSet.transition;

				// Remove any obsolete visuals.
				if (changeSet.removed.length > 0){
					removeSankeys(changeSet.removed);
				}

				// PRE-PROCESSING
				// Iterate through each link and create a map describing the
				// source and target endpoints for each flow.
				var specMap = stackLinks.call(this, links);
				var sourceMap = specMap.sourceMap;
				var targetMap = specMap.targetMap;
				var minWidth = specMap.minWidth;

				// Iterate through each source node and create the flows.
				var nIndex=0;
				var paths = [];

				var totalOffset, flowSpec, flowWidth;
				var targetPt, sourcePt;



				// For each target node, iterate over all the incoming flows
				// and determine the stacked, flow endpoint positions.
				aperture.util.forEach(targetMap, function(target) {
					var targetSpecList = target.inflows;

					totalOffset=0;

					if (target.anchor === 'middle' || target.anchor === 'bottom') {
						for (nIndex = 0; nIndex < targetSpecList.length; nIndex++){
							totalOffset -= targetSpecList[nIndex].width;
						}
						if (target.anchor === 'middle') {
							totalOffset *= 0.5;
						}
					}

					var sourceEndpointMap = {};
					for (nIndex = 0; nIndex < targetSpecList.length; nIndex++){
						flowSpec = targetSpecList[nIndex];
						flowWidth = Math.max(minWidth, flowSpec.width);
						var updateTargetOffset = true;

						var targetY;
						if (sourceEndpointMap.hasOwnProperty(flowSpec.source.duplicateId)) {
							targetY = sourceEndpointMap[flowSpec.source.duplicateId];
							updateTargetOffset = false;
						} else {
							targetY = flowSpec.target.y + totalOffset + flowWidth * 0.5;
							if (flowSpec.source.duplicateId != null) {
								sourceEndpointMap[flowSpec.source.duplicateId] = targetY;
							}
						}

						flowSpec.targetPt = {
							x : flowSpec.target.x - flowSpec.target.r,
							y : targetY
						};

						if (updateTargetOffset) {
							totalOffset += flowSpec.width;
						}
					}
				});

				// For each source node, iterate overall all the outgoing flows
				// and determine the stacked, flow endpoint positions.
				// Then couple these source endpoints with the target endpoints
				// from above and calculate the bezier path for that flow.
				aperture.util.forEach(sourceMap, function(source) {
					var sourceSpecList = source.outflows;

					totalOffset=0;

					if (source.anchor === 'middle' || source.anchor === 'bottom') {
						for (nIndex = 0; nIndex < sourceSpecList.length; nIndex++){
							totalOffset -= sourceSpecList[nIndex].width;
						}
						if (source.anchor === 'middle') {
							totalOffset *= 0.5;
						}
					}

					var targetEndpointMap = {};
					for (nIndex = 0; nIndex < sourceSpecList.length; nIndex++){
						flowSpec = sourceSpecList[nIndex];
						targetPt = flowSpec.targetPt;
						var updateSourceOffset = true;

						flowWidth = Math.max(minWidth, flowSpec.width);

						var sourceY;
						if (targetEndpointMap.hasOwnProperty(flowSpec.target.duplicateId)) {
							sourceY = targetEndpointMap[flowSpec.target.duplicateId];
							updateSourceOffset = false;
						} else {
							sourceY = flowSpec.source.y + totalOffset + flowWidth * 0.5;
							if (flowSpec.target.duplicateId != null) {
								targetEndpointMap[flowSpec.target.duplicateId] = sourceY;
							}
						}

						if (targetPt) {
							sourcePt = {
								x : flowSpec.source.x + flowSpec.source.r,
								y : sourceY
							};

							if (updateSourceOffset) {
								totalOffset += flowSpec.width;
							}

							paths.push({
								'link': flowSpec.link,
								'path' : calcFlowPath(sourcePt, targetPt),
								width : flowWidth
							});
						}
					}
				});

				// Iterate over the list of flow paths and render.
				for (i=0; i < paths.length; i++){
					var path = paths[i];
					var link = path.link;
					var linkData = link.data;

					var attrs = {
						'opacity': this.valueFor('opacity', linkData, 1),
						'stroke' : this.valueFor('stroke', linkData, 'link'),
						'stroke-width' : path.width
					};

					// extra processing on stroke style
					attrs['stroke-dasharray'] = strokeStyle(attrs, this.valueFor('stroke-style', linkData, '')) || undefined;

					// now render it.
					if (_sankeyCache[linkData.id]){
						attrs.path = path.path;
						var updateLink = _sankeyCache[linkData.id];
						link.graphics.attr(updateLink, attrs, transition);
					} else {
						_sankeyCache[linkData.id] = link.graphics.path(path.path);
						link.graphics.attr(_sankeyCache[linkData.id], attrs);
					}
				}
			}
		}
	);

	return namespace;

}(aperture || {}));
/**
 * Source: Set.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview The Set implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// util is always defined by this point
	var util = aperture.util;

	var Set = aperture.Class.extend( 'aperture.Set',
	/** @lends aperture.Set# */
	{
		/**
		 * @class A Set contains a collection of values/objects.  Elements of the set
		 * can be added, removed, toggles, and checked for containment.  Sets maintain
		 * a notion of converting between data objects (used by layers) and the contents
		 * of the set.  For example, a set may contain city names and a way to extract
		 * the city name from a give data element.
		 *
		 * TODO The notion of converting from data->set contents could be extracted into
		 * a separate object.  This object could be reused elsewhere and would make the
		 * Set simpler.
		 *
		 * @constructs
		 * @extends aperture.Class
		 *
		 * @param {String|Function} [id]
		 *      An optional conversion directive that allows a set to convert data items
		 *      to set contents.  The conversion will be used for creating filter functions
		 *      on calls to functions such as {@link #scale}.
		 */
		init : function( id ) {
			var that = this,
				fieldChain;

			// Create the idFunction if specified by user
			if( util.isString(id) && !!(fieldChain = id.match(jsIdentifierRegEx)) ) {
				// Yes, create an array of field names in chain
				// Remove . from field names.  Leave []s
				fieldChain = util.map( fieldChain, function(field) {
					// Remove dots
					if( field.charAt(field.length-1) === '.' ) {
						return field.slice(0,field.length-1);
					} else {
						return field;
					}
				});

				this.idFunction = function() {
					// Make a clone since the array will be changed
					// TODO Hide this need to copy?
					// Pass in array of arguments = array of indexes
					return findFieldChainValue.call( this, fieldChain.slice(0),
							Array.prototype.slice.call(arguments) );
				};
			} else if( util.isFunction(id) ) {
				this.idFunction = id;
			}

			// The filter function takes parameters in the form provided by layer
			// mapping filters, and calls "contains" bound to this object
			this.filterFn = function( value, etc ) {
				value = that.translateData.call(that, this, Array.prototype.slice.call(arguments, 1));
				return that.contains(value);
			};

			this.contents = [];
		},

		/**
		 * Adds an element to the Set.  If the set already contains the element it will
		 * not be added.
		 * @param object
		 *      the element to be added
		 * @returns {boolean}
		 *      true if the element is added, else undefined
		 */
		add : function( object ) {
			if( !this.contains(object) ) {
				this.contents.push( object );
				return object;
			}
		},

		/**
		 * Clears the set leaving it empty.
		 * 
		 * @returns {Array}
		 *      the array of removed elements.
		 */
		clear : function() {
			var r= this.contents;
			this.contents = [];
			
			return r;
		},

		/**
		 * Removes an item from the Set.
		 *
		 * @param object
		 *      the element to be removed
		 */
		remove : function( object ) {
			this.contents = util.without(this.contents, object);
		},

		/**
		 * Executes a function for each element in the set, where
		 * the arguments will be the value and its index, in that
		 * order.
		 */
		forEach : function ( fn ) {
			util.forEach(this.contents, fn);
		},

		/**
		 * Returns the set element at index.
		 *
		 * @param index
		 *      the integer index of the element to return
		 *
		 * @returns {object}
		 *      the element at index.
		 */
		get : function( index ) {
			return this.contents[index];
		},

		/**
		 * Returns the number of elements in the set.
		 *
		 * @returns {number}
		 *      the count of elements in the set.
		 */
		size : function () {
			return this.contents.length;
		},

		/**
		 * Returns the set contents in a new array.
		 *
		 * @returns {Array}
		 *      the set as a new array.
		 */
		toArray : function () {
			return this.contents.slice();
		},

		/**
		 * Toggles the membership of a given element in the set.  If the set contains
		 * the element it will be removed.  If it does not contain the element, it will
		 * be added.
		 * @param object
		 *      the element to be toggled
		 */
		toggle : function( object ) {
			if( this.contains(object) ) {
				this.remove(object);
			} else {
				this.add(object);
			}
		},

		/**
		 * Determines whether a given element is contained in this set.
		 *
		 * @param object
		 *      the element to be checked
		 *
		 * @returns {boolean}
		 *      true if the element is in the set, false otherwise
		 */
		contains : function( object ) {
			return util.indexOf( this.contents, object ) >= 0;
		},


		/**
		 * Given a data object and optional indices returns the element value that could
		 * be or is included in this set.  For example, if this set contains city name
		 * strings and was given an id directive for how to extract a city name from a
		 * given data item, this function will do exactly that.
		 *
		 * @param {Object} data
		 *      The data item to translate
		 *
		 * @param {Array} [etc]
		 *      An optional set of indexes
		 *
		 * @returns {Object}
		 *      The element that would be contained in this Set given the id translation
		 *      directive given on Set construction.  If no id directive, returns the
		 *      data object as given.
		 */
		translateData : function( data, etc ) {
			if( this.idFunction ) {
				// Map data to a field value using idFunction
				// Call id function in context of data object with parameters "etc"
				return this.idFunction.apply(data, etc);
			} else {
				// Just use the data straight up
				return data;
			}
		},


		// XXX It would be nice if methods for all filters were automatically
		// added here since each one involves trivial code
		/**
		 * Creates a filter function that can be used on a layer mapping
		 * (see {@link aperture.Layer#map}).  The filter function supplied
		 * will be called with the visual property value to be transformed
		 * and returned, but only for data elements that are within this set.
		 *
		 * @param {Function} filter
		 *      The transformation to apply, in the form function( value ) {return xvalue;}
		 *
		 * @returns {Function}
		 *      A filter function that can be applied to a visual property mapping of
		 *      a layer.
		 */
		filter : function ( filter ) {
			return namespace.filter.conditional( this.filterFn, filter );
		},

		/**
		 * Creates a scaling filter function that can be used on a layer mapping
		 * (see {@link aperture.Layer#map}).  The given amount will be used to
		 * scale the filtered numeric visual property value but only for data elements
		 * that are within this set.
		 *
		 * @param {Number} amount
		 *      A scaling factor to apply to the mapped visual property for data elements
		 *      that are within this set.
		 *
		 * @returns {Function}
		 *      A filter function that can be applied to a visual property mapping of
		 *      a layer.
		 */
		scale : function(amount) {
			return namespace.filter.conditional(
					this.filterFn,
					aperture.filter.scale(amount)
				);
		},


		/**
		 * Creates a constant value filter function that can be used on a layer mapping
		 * (see {@link aperture.Layer#map}).  The filter will use the given constant
		 * value in place of the mapped value for all elements within this set.
		 *
		 * @returns {Function}
		 *      A filter function that can be applied to a visual property mapping of
		 *      a layer.
		 */
		constant : function(val) {
			return namespace.filter.conditional(
					this.filterFn,
					aperture.filter.constant(val)
				);
		}
	});

	/**
	 * @methodof aperture.Set#
	 * @name not
	 *
	 * @description Creates an inverted view of the Set (its complement) specifically 
	 * aimed at creating filter functions that apply when an element is <b>not</b> in 
	 * the set. The returned set will have an inverted {@link #contains} behavior and will 
	 * create inverted filter functions.  Changes to the set using methods such as {@link #add},
	 * {@link #remove}, and {@link #clear} will work on the core set, and do not exhibit
	 * inverted behavior.
	 * 
	 * @returns {Function}
	 *      A filter function in the form function( value, layer, data, ... )
	 */
	Set.addView( 'not', {
		init : function() {
			var that = this;

			// Must create a
			this.filterFn = function( value, etc ) {
				value = that.translateData.call(that, this, Array.prototype.slice.call(arguments, 1));
				return that.contains(value);
			};
		},

		contains : function(object) {
			// Invert containment check result
			return !this._base.contains(object);
		}
	});

	namespace.Set = Set;






	return namespace;

}(aperture || {}));
/**
 * Source: Animation.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Animation APIs
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	namespace.Transition = aperture.Class.extend( 'aperture.Transition',
	/** @lends aperture.Transition.prototype */
	{
		/**
		 * @class Represents an animated transition, consisting of
		 * an interpolation / easing / tween function, and a length
		 * of time over which the transition will occur. Transitions may
		 * be optionally passed into the Layer update function to animate
		 * any updates which will occur.
		 *
		 * @constructs
		 * @extends aperture.Class
		 *
		 * @param {Number} [milliseconds=300]
		 *      the length of time that the transition will take to complete.
		 *
		 * @param {String} [easing='ease']
		 *      the function that will be used to transition from one state to another.
		 *      The standard CSS options are supported:<br><br>
		 *      'linear' (constant speed)<br>
		 *      'ease' (default, with a slow start and end)<br>
		 *      'ease-in' (slow start)<br>
		 *      'ease-out' (slow end)<br>
		 *      'ease-in-out' (similar to ease)<br>
		 *      'cubic-bezier(n,n,n,n)' (a custom function, defined as a bezier curve)
		 *
		 * @param {Function} [callback]
		 *      a function to invoke when the transition is complete.
		 *
		 * @returns {this}
		 *      a new Transition
		 */
		init : function( ms, easing, callback ) {
			this.time = ms || 300;
			this.fn = easing || 'ease';
			this.end = callback;
		},

		/**
		 * Returns the timing property.
		 *
		 * @returns {Number}
		 *      the number of milliseconds over which to complete the transition
		 */
		milliseconds : function ( ) {
			return this.time;
		},

		/**
		 * Returns the easing property value.
		 *
		 * @returns {String}
		 *      the function to use to transition from one state to another.
		 */
		easing : function ( ) {
			return this.fn;
		},

		/**
		 * Returns a reference to the callback function, if present.
		 *
		 * @returns {Function}
		 *      the function invoked at transition completion.
		 */
		callback : function ( ) {
			return this.end;
		}
	});

	return namespace;

}(aperture || {}));
/**
 * Source: filter.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Filter API Implementations
 */

/**
 * @namespace Aperture filter APIs
 */
aperture.filter = (function(namespace) {

	var effects =
	/** @lends aperture.filter */
	{

		/**
		 * Returns a function that always returns the supplied constant value
		 */
		constant : function(value) {
			return function() {
				return value;
			};
		},

		/**
		 * Returns a effect function that scales a provided number by the given
		 * scalar value.
		 */
		scale : function(amount) {
			return function( value ) {
				return value * amount;
			};
		},
		
		/**
		 * Returns a effect function that shifts a provided number by the given
		 * scalar value.
		 */
		shift : function(amount) {
			return function( value ) {
				return value + amount;
			};
		},
		brighter : function(color) {
			// TODO
		},

		/**
		 * Takes a conditional function and a effect function and returns a function
		 * that will apply the given effect to the supplied arguments only when the truth
		 * function returns a truthy value when called with the supplied arguments.  For
		 * example:
		 * <code>
		 * var makeBigBigger = conditional(
		 *      function(value) { return value > 1000; },
		 *      aperture.filter.scale( 2 )
		 * );
		 *
		 * var makeRedBlue = conditional(
		 *      function(value) { return value === 'red'; },
		 *      function() { return 'blue'; }
		 * );
		 * </code>
		 *
		 * @param {Function} checkFunction
		 * @param {Function} filterFunction
		 */
		conditional : function( checkFunction, filterFunction ) {
			return function(value) {
				// If supplied conditional...
				if( checkFunction.apply(this, arguments) ) {
					// Apply effect
					return filterFunction.apply(this, arguments);
				} else {
					return value;
				}
			};
		}
	};

	// Mix in effect definitions into provided namespace
	aperture.util.extend(namespace, effects);

	return namespace;

}(aperture.filter || {}));
/**
 * Source: io.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview APIs for client / server interaction.
 */

/*
 * TODO Remove jQuery dependency?
 */

/**
 * @namespace APIs for client / server interaction.
 * @requires jQuery
 * @requires json2 as a JSON shim if running old browsers
 */
aperture.io = (function() {

	var id = 0,
		securityFn,
		restEndpoint = "%host%/rest",
		pendingRequests = 0,
		handlers = [];


	// Register to receive RPC endpoint url from config
	aperture.config.register("aperture.io", function(config) {
		// Get out endpoint location
		restEndpoint = config["aperture.io"].restEndpoint;
	});


	return {

		/**
		 * Resolves a relative uri to a rest url
		 *
		 * TODO handle non-relative URIs
		 */
		restUrl : function ( uri ) {

			// XXX This is fragile and should be fixed!
			var origin = // Have origin, use it
				document.location.origin ||
				// Don't have origin, construct protocol//host
				(document.location.protocol + '//' + document.location.host);

			return restEndpoint.replace("%host%", origin) + uri;
		},

		/**
		 * Makes a REST call to the server for the given URI, method, and posted data
		 * block.  Callback for onSuccess and onError may be provided.
		 *
		 * @param {String} uri The URI to which to make the ajax
		 *
		 * @param {String} method The HTTP method to use, must be a valid HTTP verb such as GET or POST
		 *
		 * @param {Function(data,Object)} callback A callback function to be used when the ajax call returns.
		 * Will be called on both success and error conditions.  The first parameter will contain a data
		 * payload: if JSON, will automatically be converted into an object.  The second parameter is an
		 * object that contains various ajax response values including: success - a boolean, true when the
		 * ajax call was successful; xhr - the XHR object; status - a string containing the HTTP call status;
		 * errorThrown - on error, the error that was thrown.
		 *
		 * @param {Object} opts an options object
		 * @param {String} opts.postData data to post if the POST verb is used, will be automatically
		 * converted to a string if given an object
		 * @param {String|Object} opts.params parameters to include in the URL of a GET request.  Will
		 * automatically be converted to a string if given a hash
		 * @param {Object} opts.headers additional headers to set as key:value pairs
		 * @param {String} opts.contentType explicit content type used when POSTing data to the server.
		 */
		rest : function( uri, method, callback, opts ) {
			var restUrl = aperture.io.restUrl( uri ),

				// Success callback processes response and calls user's callback
				innerSuccess = function(results, textStatus, jqXHR) {
					pendingRequests -= 1;
					aperture.util.forEach(handlers, function(handler) {
						handler.onRequestComplete(pendingRequests);
					});

					if( callback ) {
						// Return results data object plus a hash of
						// other available data.  Also include a success
						// parameter to indicate that the request succeeded
						callback( results, {
								success: true,
								status: textStatus,
								xhr: jqXHR
							});
					}
				},

				// Error callback processes response and calls user's callback
				innerError = function(jqXHR, textStatus, errorThrown) {
					var responseData = jqXHR.responseText;
					
					pendingRequests -= 1;
					aperture.util.forEach(handlers, function(handler) {
						handler.onRequestComplete(pendingRequests);
					});

					aperture.log.error((errorThrown||textStatus||'unspecified error') + (responseData? (' : ' + responseData): ''));
					
					if( callback ) {
						// Check content-type for json, parse if json
						var ct = jqXHR.getResponseHeader( "content-type" );
						if( responseData && ct && ct.indexOf('json') > -1 ) {
							try {
								responseData = jQuery.parseJSON( responseData );
							} catch( e ) {
								// Error parsing JSON returned by HTTP error... go figure
								// TODO log
								responseData = null;
							}
						}

						// Return error data object plus a hash of
						// other available data.  Also include a success
						// parameter to indicate that the request failed
						callback( responseData, {
								success: false,
								status: textStatus,
								xhr: jqXHR,
								errorThrown: errorThrown
							});
					}
				},

				params = {
					url: restUrl,
					type: method,
					success: innerSuccess,
					error: innerError
				};

			// Augment REST url as needed to add security tokens
			if( securityFn ) {
				restUrl = securityFn( restUrl );
			}

			// POST or GET params
			if( opts ) {
				if( opts.contentType ) {
					params.contentType = opts.contentType;
				}

                if( opts.async != null ) {
                    params.async = opts.async;
                }
				
				if( opts.postData && method === "POST" ) {
					params.data = opts.postData;
					
					if (params.contentType && params.contentType.toLowerCase().indexOf('json') > -1) {
						params.contentType = 'application/json; charset=UTF-8';
						
						if (!aperture.util.isString(params.data)) {
							params.data = JSON.stringify(params.data);
						}
					}
				}

				if( opts.params && method === "GET" ) {
					params.data = opts.params;
				}

				if( opts.headers ) {
					params.headers = opts.headers;
				}
			}

			pendingRequests += 1;

			//  Make the AJAX call using jQuery
			$.ajax( params );
		},

		addRestListener : function( listener ) {
			if( listener && typeof listener !== "function") {
				return;
			}

			handlers.push(listener);
		},

		removeRestListener : function( listener ) {
			if( listener && typeof listener !== "function") {
				return;
			}

			handlers.splice(aperture.util.indexOf(handlers, listener), 1);
		},

		getPendingRequests : function() {
			return pendingRequests;
		},

		/**
		 * Sets a function that can be used to add security information
		 * to a URL before it is used to make an RPC call to the server.
		 * This permits implementation-specific (token-based) authentication.
		 */
		setUrlAuthenticator : function( fn ) {
			if( fn && typeof fn !== "function") {
				// TODO exception
				return;
			}

			securityFn = fn;
		}
	};
}());
/**
 * Source: palette.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Defines the palette functions for Aperture.
 */

/**
 * @namespace Aperture exposes a global base palette in order to promote
 *	and ease use of coordinated, complementary, cognitively effective visual
 *  attributes in a display context. Palettes support derivation,
 *  providing a concise and systematic method of defining properties
 *  through the articulation of relationships.
 *  <br><br>
 *
 *  The base palette is populated at load time from the aperture.palette
 *  configuration provider. Its prototype includes the 17 named colors
 *  defined by CSS 2.1 for runtime access only. Support for exporting
 *  <a href="http://www.lesscss.org">LESS CSS</a> compatible variable
 *  lists for import is also provided for deriving CSS style sheet values
 *  from base palette entries. LESS provides a concise and systematic
 *  method of defining CSS properties for style sheets, however
 *  if use of LESS is not an option, export of
 *  named CSS classes for specifically targeted style sheet properties
 *  (e.g. color, border-color, etc) is also supported.
 */
aperture.palette = (function(ns) {

	var // CSS 2.1 colors
		baseColors = {
			'white'  : '#ffffff',
			'silver' : '#c0c0c0',
			'gray'	 : '#808080',
			'black'  : '#000000',
			'red'    : '#FF0000',
			'maroon' : '#800000',
			'orange' : '#ffa500',
			'yellow' : '#ffff00',
			'olive'  : '#808000',
			'lime'   : '#00ff00',
			'green'  : '#008000',
			'aqua'   : '#00ffff',
			'teal'   : '#008080',
			'blue'   : '#0000ff',
			'navy'   : '#000080',
			'fuchsia': '#ff00ff',
			'purple' : '#800080'
		},

		// TODO: this is the protovis ten - pick a good ten that don't include something too
		// close to our indicative colors like straight red and green, or the highlight color.
		baseColorSets = {
			'default' : [
				'#1f77b4',
				'#ff7f0e',
				'#2ca02c',
				'#d62728',
				'#9467bd',
				'#8c564b',
				'#e377c2',
				'#7f7f7f',
				'#bcbd22',
				'#17becf'
				]
		},

		// inheritance makes it easier to distinguish overrides from
		// standard entries but still use the same lookup.
		colors = aperture.util.viewOf(baseColors),
		colorSets = baseColorSets,
		restUrl = aperture.io.restUrl;
	
	/**
	 * @private
	 * 
	 * enforce implemented value constraints already on client side so that we
	 * are not hitting the server or storing more images client side than we need to.
	 */
	function constrain100(value) {
		if (value == null) {
			return 100;
		} 
		
		return 20* Math.round(5* Math.max(0, Math.min(1, value)));
	}


	// parchment color constants.
	var rgb = aperture.Color.fromRGB,
		c00 = rgb(248,210,158),
	    c10 = rgb(253,231,192),
	    c01 = rgb(202,202,202),
	    c11 = rgb(255,255,255),
	    black = rgb(0,0,0);
	
	/**
	 * @private
	 * 
	 * returns a color for the parchment by bilinear interpolation. roughly the same as the image.
	 */
	function parchmentColor(v_, _v) {
		return c00.blend(c10, v_).blend(c01.blend(c11, v_), _v);
	}
	
	/**
	 * @private
	 * 
	 * returns the url for the parchment background.
	 */
	function parchmentUrl(confidence, currency) {
		return restUrl('/parchment/' + confidence + '/' + currency);
	}
	
	/**
	 * @name aperture.palette.color
	 * @function
	 *
	 * @param {String} id
	 *      the identifying name of the palette entry.
	 *
	 * @returns {aperture.Color}
	 *		a color object
	 */
	ns.color = function(id) {
		return colors[id];
	};

	/**
	 * @name aperture.palette.colors
	 * @function
	 *
	 * @param {String} id
	 *      the identifying name of the palette entry.
	 *
	 * @returns {Array}
	 *		an Array of color objects
	 */
	ns.colors = function (id) {
		return colorSets[id || 'default'];
	};

	/**
	 * @name aperture.palette.size
	 * @function
	 *
	 * @param {String} id
	 *      the identifying name of the palette entry.
	 *
	 * @returns {Number}
	 *		a Number
	 */
	ns.size = function (id) {
		return sizes[id];
	};

	/**
	 * @name aperture.palette.sizes
	 * @function
	 *
	 * @param {String} id
	 *      the identifying name of the palette entry.
	 *
	 * @returns {Array}
	 *		an array of Numbers
	 */
	ns.sizes = function (id) {
		return sizeSets[id];
	};

	/**
	 * @name aperture.palette.parchmentCSS
	 * @function
	 * 
	 * @description
	 * Returns CSS properties to reflect confidence using background texture. Confidence of information is 
	 * indicated by how pristine the parchment is, and currency of information is indicated by
	 * how white the parchment is. Dated information yellows with time.
	 * 
	 * @param {Number} confidence 
	 *      an indication of confidence, as a value between 0 and 1 (confident).
	 *
	 * @param {Number} [currency] 
	 *      an indication of how current the information is, as a value between 0 and 1 (current).
	 * 
	 * @returns {Object}
	 *      an object with CSS properties, that includes background image and border color.
	 */
	ns.parchmentCSS = function(confidence, currency) {
		
		// constrain these
		confidence = constrain100(confidence);
		currency = constrain100(currency);

		var color = parchmentColor(0.01*confidence, 0.01*currency);
		
		return {
			'background-color': color.toString(),
			'background-image': confidence < 99? 'url('+ parchmentUrl(confidence, currency)+ ')' : '',
			'border-color': color.blend(black, 0.25).toString()
		};
	};
	
	/**
	 * @name aperture.palette.parchmentClass
	 * @function
	 * 
	 * @description
	 * Returns a CSS class used to reflect confidence using background texture. Confidence of information is 
	 * indicated by how pristine the parchment is, and currency of information is indicated by
	 * how white the parchment is. Dated information yellows with time.
	 * 
	 * @param {Number} confidence 
	 *      an indication of confidence, as a value between 0 and 1 (confident).
	 *
	 * @param {Number} [currency] 
	 *      an indication of how current the information is, as a value between 0 and 1 (current).
	 * 
	 * @returns {String}
	 *      the name of a CSS class defined in rest/parchment.css.
	 */
	ns.parchmentClass = function(confidence, currency) {
		return 'aperture-parchment-' + constrain100(confidence) + '-' + constrain100(currency);
	};

	/**
	 * @name aperture.palette.asLESS
	 * @function
	 *
	 * @returns {String}
	 *		a string representation in LESS CSS variable format.
	 *
	 * @see <a href="http://lesscss.org">lesscss.org</a>
	 */
	ns.asLESS = function () {

		// header and color block
		var str = '// Generated Aperture Palette Export for LESS CSS\n\n// COLORS (excluding CSS 2.1)\n';

		// write each
		aperture.util.forEach( colors, function ( color, key ) {
			str += '@' + key + ': ' + color + ';\n';
		});

		// color set block
		str += '\n// COLOR SETS\n';

		// write each
		aperture.util.forEach( colorSets, function ( colorSet, key ) {
			var prefix = '@' + key + '-';

			aperture.util.forEach( colorSet, function ( color, index ) {
				str += prefix + index + ': '+ color + ';\n';
			});
		});

		return str;
	};

	//
	// Register to receive style information
	//
	aperture.config.register('aperture.palette', function(cfg) {
		var paletteExts = cfg['aperture.palette'];

		if( paletteExts ) {
			var c = paletteExts.color, p;
			
			// extend colors with configured colors
			if ( c ) {
				for ( p in c ) {
					if (c.hasOwnProperty(p)) {
						if (p.toLowerCase) {
							p = p.toLowerCase();
							colors[p] = c[p];
						}
					}
				}
			}

			// extend default color sets with clones of configured color sets.
			if ( paletteExts.colors ) {
				aperture.util.forEach( paletteExts.colors, function ( value, key ) {
					colorSets[key] = value.slice();
				});
			}

			// TODO: sizes etc.
		}
	});

	// used in the function below.
	var u = encodeURIComponent,
		supportsSvg = !!(window.SVGAngle || document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')),
		logSvgWarn = true;

	/**
	 * @name aperture.palette.icon
	 * @function
	 *
	 * @requires an Aperture icon service
	 * @requires jQuery
	 *
	 * @param {Object} properties
	 *      the specification of the icon
	 *
	 * @param {String} properties.type
	 *      The ontological type for the icon service to resolve within the namespace of the ontology.
	 *
	 * @param {String} [properties.ontology='aperture-hscb']
	 *      Refers to the namespace used by any active icon services to resolve types with attributes to icons.
	 *      Note that the mapping of ontology to symbology is a function of the icon services configured and
	 *      running. The default symbology is a core set of icons with a specific focus on
	 *      socio-cultural themes and media artifacts of socio-cultural analysis.

	 * @param {Object} [properties.attributes]
	 *      The optional attributes of the ontological type, for interpretation by the icon service.
	 *
	 * @param {Number} [properties.width=24]
	 *      The width of the icon. Defaults to 24.
	 *
	 * @param {Number} [properties.height=24]
	 *      The height of the icon. Defaults to 24.
	 *
	 * @param {String} [properties.format]
	 *      The image format of the icon. When absent the format is left to the discretion of the
	 *      icon service. Support for specific formats is service dependent, however the default
	 *      aperture-hscb ontology supports
	 *      <span class="fixedFont">png</span> (a lossless compressed raster format with transparency),
	 *      <span class="fixedFont">svg</span> (a vector format that can draw nicely at any scale), and
	 *      <span class="fixedFont">jpeg</span> (an opaque, lossy but highly compressible format).
	 *
	 * @returns {String}
	 *		a url
	 */
	ns.icon = function (properties) {
		var frmt = properties.format,
			attr = properties.attributes,
			path = '/icon/' +
				u(properties.ontology || 'aperture-hscb') + '/' +
				u(properties.type) +
				'?iconWidth=' + (properties.width || 24) +
				'&iconHeight=' + (properties.height || 24);

		if (frmt) {
			// check - can't use svg if running in vml.
			if (!supportsSvg && frmt.toLowerCase() === 'svg') {

				if (logSvgWarn) {
					aperture.log.warn("SVG icon format requested but this browser doesn't support it. Using PNG.");

					// only warn once
					logSvgWarn = false;
				}

				frmt = 'png';
			}

			path += '&iconFormat=' + frmt;
		}

		aperture.util.forEach( attr, function ( value, name ) {
			path += '&' + u(name) + '=' + u(value);
		});

		return restUrl(path);
	};

	return ns;

}(aperture.palette || {}));

/**
 * Copyright (C) 2013 Oculus Info Inc.
 * http://www.oculusinfo.com/
 * 
 * Released under the MIT License.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

aperture.tooltip = (function(ns) {

	var tooltipExists = false;
	var tooltipDiv = null;
	var tooltipInnerDiv = null;
	var tooltipID = "apertureTooltip";
	var tooltipTimer = null;
	var tooltipPending = false;
	var tooltipVisible = false;
	
	var overridingMouseMove = false;
	var oldMouseMove = null;
	
	var assertTooltip = function() {
		if (!tooltipExists) {
			tooltipDiv = document.createElement("div");
			tooltipDiv.style.zIndex = '999999999';
			tooltipDiv.style.position = 'absolute';
			tooltipDiv.id = tooltipID;
			tooltipDiv.style.display = "none";
			
			tooltipInnerDiv = document.createElement("div");
			tooltipInnerDiv.setAttribute("class", "apertureTooltip");

			tooltipDiv.appendChild(tooltipInnerDiv);
			
			window.document.body.appendChild(tooltipDiv);
			tooltipExists = true;
		}
	};
	
	var positionTooltip = function(posx,posy) {
		var w = $(window).width();
		var h = $(window).height();
		var ew = 'E';
		var ns = 'S';
		if (posx<w/2) {
			tooltipDiv.style.left = (posx+2) + "px";
			tooltipDiv.style.right = '';
			ew = 'E';
		} else {
			posx = w-posx;
			tooltipDiv.style.left = '';
			tooltipDiv.style.right = (posx+2) + "px";
			ew = 'W';
		}
		if (posy>h/2) {
			posy = h-posy;
			tooltipDiv.style.top = "";
			tooltipDiv.style.bottom = (posy+2) + "px";
			ns = 'N';
		} else {
			tooltipDiv.style.top = (posy+2) + "px";
			tooltipDiv.style.bottom = "";
			ns = 'S';
		}
		tooltipInnerDiv.setAttribute("class", "apertureTooltip"+ns+ew);
	};
	
	var setTooltipVisible = function(spec, posx, posy) {
		positionTooltip(posx, posy);
		tooltipDiv.style.display = "";
		tooltipPending = false;
		tooltipVisible = true;
	};
	
	var getEventXY = function(e) {
		var posx=0, posy=0;
		if (e.pageX || e.pageY) {
			posx = e.pageX;
			posy = e.pageY;
		} else if (e.clientX || e.clientY) {
			posx = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}
		return [posx,posy];
	};
	
	var overrideMouseMove = function(target) {
		if (!overridingMouseMove) {
			oldMouseMove = document.onmousemove;
			document.onmousemove = function(event) {
				var pos = getEventXY(event);
				positionTooltip(pos[0], pos[1]);
				return true;
			};
			overridingMouseMove = true;
		}
	};

	var cancelMouseMoveOverride = function() {
		if (overridingMouseMove) {
			document.onmousemove = oldMouseMove;
			overridingMouseMove = false;
		}
	};
	
	var cancelTooltip = function() {
		if (tooltipPending) {
			clearTimeout(tooltipTimer);
			tooltipPending = false;
		}
		tooltipDiv.style.display = "none";
		tooltipVisible = false;
		cancelMouseMoveOverride();
	};

	ns.showTooltip = function(spec) {
		var pos = getEventXY(spec.event.source);
		
		assertTooltip();
		if (tooltipVisible) {
			if (tooltipInnerDiv.innerHTML==spec.html) {
				return;
			}
		}
		cancelTooltip();
		tooltipInnerDiv.innerHTML = spec.html;
		if (spec.delay) {
			tooltipPending = true;
			tooltipTimer = setTimeout(function(){setTooltipVisible(spec, pos[0], pos[1]);}, spec.delay);
		} else {
			setTooltipVisible(spec, pos[0], pos[1]);
		}
		overrideMouseMove(spec.event.source.target);
	};
	
	ns.hideTooltip = function() {
		assertTooltip();
		cancelTooltip();
	};
	
	return ns;
	
}(aperture.tooltip || {}));

return aperture;
}(aperture || {}));