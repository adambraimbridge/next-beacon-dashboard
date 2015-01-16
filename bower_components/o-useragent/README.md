# User agent helper

JavaScript utility for working with vendor-prefixed properties.

## Serving UA-specific styles with Sass

The Sass part of this module is now deprecated.

Please use an alternative way to provide styles for a specific user agent: conditional comments, selector and property hacks… Feel free to use http://browserhacks.com

## Browser support

This module has been verified in Internet Explorer 7+, modern desktop browsers
(Chrome, Safari, Firefox, …) and mobile browsers (Android browser, iOS safari,
Chrome mobile).

## Installation

To include `o-useragent` in your module follow the instructions in
[the module's page in the Origmai registry](http://registry.origami.ft.com/components/o-useragent).

## Usage

The JS prefixer is now deprecated. Please use an alternative method for testing for and applying 
vendor prefixes for JS properties and CSS styles within your JS.

`o-useragent.prefixer` retrieves vendor-prefixed properties if the browser
doesn't yet support it unprefixed.

**Notes:**

* The prefixed checked for are `webkit`, `moz`, `ms` and `o`.
* All the methods support being passed either hyphenated or camel-cased
	property names and will return a hyphenated or camel-cased string as appropriate
* There are a few properties where the prefixed name differs in more than the
	prefix e.g. matches/webkitMatchesSelector. These can be dealt with by doing
	something like
	`prefixer.dom(document.body, 'matches') || prefixer.dom(document.body, 'matchesSelector')`

### Retrieving prefixed property names

The methods below return the unprefixed name if it exists, failing that they
retrieve the prefixed name, or false if the property is not defined at all.

* `o-useragent#prefixer.css(propertyName)`
	retrieves the hyphenated css property name
* `o-useragent#prefixer.style(propertyName)`
	retrieves the camel-cased style property name
* `o-useragent#prefixer.dom(obj, propertyName)`
	retrieves the camel-cased DOM property name e.g

### Retrieving the values stored in prefixed properties

The methods below retrieve the values of prefixed properties defined on given objects.

* `o-useragent#prefixer.getStyleValue(element, propertyName)`
	retrieves the value of a HTML element's style property, or false if not defined.
	If `propertyName` is a space-separated list of values then an object of the
	following form is returned:

	```javascript
	{
		propertyName1: {
			prefixedName: webkitPrefixedName1,
			value: 'value1'
		},
		propertyName2: {
			prefixedName: webkitPrefixedName2,
			value: 'value2'
		}
	}
	```

* `o-useragent#prefixer.getDomProperty(obj, propertyName)`
	retrieves the value of a DOM object's property, or false if not defined
* `o-useragent#prefixer.getDomMethod(obj, propertyName, [bindTo])`
	retrieves a method of a DOM object bound to that object (or to a
	different obj if one is passed as a third parameter).
	Returns false if the property is undefined or not a function
