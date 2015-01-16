'use strict';

var el = document.createElement('o'),
	style = el.style,
	vendorPrefixes = 'Webkit Moz O ms',
	stylePrefixes = vendorPrefixes.split(' '),
	domPrefixes = vendorPrefixes.toLowerCase().split(' '),

	/*
	 * Simple object type checker
	 */
	is = function( obj, type ) {
		return typeof obj === type;
	},

	/*
	 * Binding of a function to a given context
	 */
	bind = function (func, obj) {
		if (Function.prototype.bind) {
			return func.bind(obj);
		} else {
			return function () {
				return func.apply(obj, arguments);
			};
		}
	},

	/*
	 * Converts a hyphenated string to camel case
	 */
	camelify = function (str) {
		return (str.indexOf('-') > -1) ? str.replace(/(?:\-)([a-z])/gi, function ($0, $1) {
			return $1.toUpperCase();
		}) : str;
	},

	/*
	 * Converts a camelcase property to its hyphenated equivalent
	 */
	hyphenateProp = function (prop) {
		if (prop) {
			return prop.replace(/([A-Z])/g, function ($0, $1) {
				return '-' + $1.toLowerCase();
			}).replace(/^ms-/,'-ms-');
		} else {
			return false;
		}
	},

	/*
	 *  Gets a list of prefixed properties derived from a single w3c property name. It always has the unprefixed property as the first item in the list
	 */
	getPrefixedPropList = function (prop, prefixes) {
		var capitalisedProp = prop.charAt(0).toUpperCase() + prop.slice(1);

		return (prop + ' ' + prefixes.join(capitalisedProp + ' ') + capitalisedProp).split(' ');
	},

	/*
	 * Given a list of property names, returns the first name that is defined on an object. If none are defined returns false
	 */
	getFirstDefinedProp = function (obj, propNameList) {
		for (var i in propNameList) {
			if (i) {
				var prop = propNameList[i];
				if (obj[prop] !== undefined) {
					return prop;
				}
			}
		}
		return false;
	},

	/*
	 *  Returns the vendor prefixed version of a style property
	 */
	stylePrefixer = function (stylePropName) {
		return getFirstDefinedProp(style, getPrefixedPropList(camelify(stylePropName), stylePrefixes));
	},

	/*
	 *  Returns the vendor prefixed version of a dom property
	 */
	domPrefixer = function (obj, domPropName) {
		return getFirstDefinedProp(obj, getPrefixedPropList(camelify(domPropName), domPrefixes));
	},

	/*
	 *  Returns the hyphenated vendor prefixed version of a css property
	 */
	cssPrefixer = function (cssPropName) {
		return hyphenateProp(stylePrefixer(cssPropName));
	},

	/*
	 *  Returns the value of a vendor prefixed version of a dom property
	 */
	getDomProperty = function (obj, domPropName) {
		var prop = obj[domPrefixer(obj, domPropName)];
		return is(prop, 'undefined') ? false : prop;
	},

	/*
	 *  Returns a vendor prefixed DOM method bound to a given object
	 */
	getDomMethod = function (obj, domPropName, bindTo) {
		var prop = getDomProperty(obj, domPropName);

		return is(prop, 'function') ? bind(prop, obj || bindTo) : false;
	},

	/*
	 *  Returns the value of a vendor prefixed version of a style property
	 *  If a list of properties is requested returns a hash table of the form { requestedPropertyName {prefixedName: 'webkitStyle', value: '10px'}}
	 */
	getStyleValue = function (element, stylePropNames) {
		var computedStyle = getComputedStyle(element, null),
			result = {},
			styleEntry,
			prefixedName;
		if (stylePropNames.indexOf(' ') === -1) {
			return computedStyle.getPropertyValue(cssPrefixer(stylePropNames));
		}

		stylePropNames = stylePropNames.split(' ');

		for (var i = stylePropNames.length - 1; i >= 0; i--) {
			prefixedName = cssPrefixer(stylePropNames[i]);

			styleEntry = {
				prefixedName: cssPrefixer(stylePropNames[i])
			};

			result[stylePropNames[i]] = {
				prefixedName: prefixedName,
				value: computedStyle.getPropertyValue(prefixedName)
			};
		}

		return result;
	};

module.exports = {
	css: cssPrefixer,
	style: stylePrefixer,
	dom: domPrefixer,
	getStyleValue: getStyleValue,
	getDomProperty: getDomProperty,
	getDomMethod: getDomMethod
};
