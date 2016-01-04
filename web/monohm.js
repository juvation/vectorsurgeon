/*
Copyright (c) 2015 Monohm Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

//
// generated on Fri Nov 6 17:59:13 PST 2015
//

// namespace.js

var	monohm = monohm || new Object ();

if (typeof global == "object")
{
	// have to ensure we shadow in node's *real* global space
	// because that's the only "global" space that provide() can reach
	global.monohm = monohm;
}

monohm.provide = function (inProvided)
{
	monohm.provideInternal (inProvided, false);
}

monohm.provideStatic = function (inProvided)
{
	monohm.provideInternal (inProvided, true);
}

monohm.provideInternal = function (inProvided, inStatic)
{
	// ensure that the "packages" are there
	var	packageElements = inProvided.split (".");
	
	var	pkg = null;
	
	// have to be mindful of the Node environment here
	if (typeof (window) == "undefined")
	{
		if (typeof (global) == "undefined")
		{
			console.error ("no window or global objects, can't continue");
			process.exit (1);
		}
		else
		{
			pkg = global;
		}
	}
	else
	{
		pkg = window;
	}
	
	var	elementCount = packageElements.length;

	if (! inStatic)
	{
		// don't make the last element, it's the class name
		elementCount--;
	}

	for (var i = 0; i < elementCount; i++)
	{
		if (typeof (pkg [packageElements [i]]) == "undefined")
		{
			pkg [packageElements [i]] = new Object ();
		}
		
		pkg = pkg [packageElements [i]];
	}
};

/**
 * @param {string} inRequired
 */
monohm.require = function (inRequired)
{
	// currently monohm does not support dependency management
};

monohm.inherits = function (inSubClass, inSuperClass)
{
	function
	tempCtor()
	{
	};

	try
	{
		tempCtor.prototype = inSuperClass.prototype;
		inSubClass.superClass_ = inSuperClass.prototype;
		inSubClass.prototype = new tempCtor();
		inSubClass.prototype.constructor = inSubClass;
		
		// handy notation for "blind" superclass reference
		// as the superClass_ above won't work (needs to be off prototype)
		inSubClass.prototype.superClass = inSuperClass.prototype;
	}
	catch (inError)
	{
		console.error ("monohm.inherits() error");
		console.error (inError);
		console.error (inSubClass);
		console.error (inSuperClass);
	}
};


// async-list-helper.js

monohm.provide ("monohm.AsyncListHelper");

// help for async processing a list of stuff

monohm.AsyncListHelper = function (inConfig)
{
	this.config = inConfig;
	
	if (!this.config.this)
	{
		this.config.this = this;
	}
	
	if (this.config.list && Array.isArray (this.config.list))
	{
		this.index = 0;
		this.iterate ();
	}
	else
	{
		console.error ("no list passed to AsyncListHelper");
		this.complete ();
	}
}

monohm.AsyncListHelper.prototype.complete = function ()
{		
	if (this.config.complete)
	{
		this.config.complete.call (this.config.this);
	}
	else
	{
		console.error ("no complete function passed to AsyncListHelper");
	}
}

monohm.AsyncListHelper.prototype.iterate = function ()
{
	if (this.index < this.config.list.length)
	{
		if (this.config.iterate)
		{
			// pass our "this" first so the client always has a reliable handle on us
			this.config.iterate.call (this.config.this, this, this.config.list [this.index]);
		}
		else
		{
			console.error ("no iterate function passed to AsyncListHelper");
			this.complete ();
		}
	}
	else
	{
		this.complete ();
	}
}

monohm.AsyncListHelper.prototype.onIteration = function (inContinue)
{
	if (arguments.length == 0)
	{
		inContinue = true;
	}
	
	if (inContinue)
	{
		this.index++;
		this.iterate ();
	}
	else
	{
		this.complete ();
	}
}

// base64.js

monohm.provideStatic ("monohm.Base64");

// STATIC

// method stolen from Stack Overflow
// honestly ArrayBuffers are so primitive
monohm.Base64.encodeArrayBuffer = function (inBuffer)
{
	var binaryString = "";
	var bytes = new Uint8Array (inBuffer);
	var len = bytes.byteLength;

	for (var i = 0; i < len; i++)
	{
		binaryString += String.fromCharCode (bytes [i]);
	}
	
	return btoa (binaryString);
}

monohm.Base64.decodeToArrayBuffer = function (inBase64String)
{
	var	binaryString = atob (inBase64String);
	var len = binaryString.length;
	var	bytes = new Uint8Array (len);
	
	for (var i = 0; i < len; i++)
	{
		bytes [i] = binaryString.charCodeAt (i);
	}
	
	return bytes.buffer;
}


// browser.js

monohm.provideStatic ("monohm.Browser");

monohm.Browser.getInfo = function ()
{
	if (monohm.Browser.sInfo)
	{
		return monohm.Browser.sInfo;
	}
	
	monohm.Browser.sInfo = new Object ();
  var	browser = monohm.Browser.sInfo;
  
  var userAgent = navigator.userAgent;

	// one might think that navigator.appName and navigator.appVersion would be useful
	// and one would be wrong :-)
	
	// browser's actual name & version
	browser.name = "unknown";
	browser.versionNumber = 0;
	browser.version = "0";
	browser.type = "unknown";
	
	// the user agent reporting for the WebKit browsers is farcical
	var	appleWebKitVersion = "";
	var	chromeVersion = "";
	var	safariVersion = "";
	
	var	elements1 = userAgent.split (' ');
	
	for (var i = 0; i < elements1.length; i++)
	{
		var	element = elements1 [i];
		var	elements2 = element.split ('/');

		if (elements2 [0] == "Safari")
		{
			safariVersion = elements2 [1];
		}
		else
		if (elements2 [0] == "AppleWebKit")
		{
			// we save this because the browser you get in the save-to-home-screen on iOS
			// does not advertise itself as Safari, sigh
			appleWebKitVersion = elements2 [1];
		}
		else
		if (elements2 [0] == "Chrome")
		{
			chromeVersion = elements2 [1];
		}
		else
		if (elements2 [0] == "Firefox")
		{
			browser.name = "firefox";
			browser.type = "gecko";
			browser.version = elements2 [1];
			browser.isGecko = true;
		}
		else
		if (elements2 [0] == "Version")
		{
			// sigh, opera is nonstandard
			if (elements1 [0].substring (0, 5) == "Opera")
			{
				browser.name = "opera";
				browser.type = "opera";
				browser.version = elements2 [1];
			}
		}
		else
		if (elements2 [0] == "MSIE")
		{
			browser.name = "ie";
			browser.type = "ie";
			browser.isIE = true;
			browser.isIE9 = true;
			
			// the version is the next *space* delimited version with the semicolon clipped, sigh
			var	version = elements1 [i + 1];
			browser.version = version.substring (0, version.length - 1);
		}
	}

	// sort out the WebKit versioning mess
	if (browser.type == "unknown")
	{
		if (chromeVersion.length > 0)
		{
			browser.name = "chrome";
			browser.type = "webkit";
			browser.version = chromeVersion;
			browser.isWebKit = true;
		}
		else
		if (safariVersion.length > 0)
		{
			browser.name = "safari";
			browser.type = "webkit";
			browser.version = safariVersion;
			browser.isWebKit = true;
		}
		else
		if (appleWebKitVersion.length > 0)
		{
			browser.name = "safari";
			browser.type = "webkit";
			browser.version = appleWebKitVersion;
			browser.isWebKit = true;
		}
		else
		{
			console.error ("could not determine browser type");
		}
	}
	
	// fwiw
	browser.versionNumber = parseFloat (browser.version);

	// mobile or desktop
	if (userAgent.indexOf ("iPhone") >= 0)
	{
		browser.isMobile = true;
		browser.isIPhone = true;
	}
	else
	if (userAgent.indexOf ("iPad") >= 0)
	{
		browser.isMobile = true;
		browser.isIPad = true;
	}
	else
	if (userAgent.indexOf ("Android") >= 0)
	{
		browser.isMobile = true;
		browser.isAndroid = true;
	}
	else
	if (browser.type == "gecko" && userAgent.indexOf ("Mobile") >= 0)
	{
		browser.isMobile = true;
		browser.isFirefoxMobile = true;
	}
	else
	{
		browser.isMobile = false;
	}

	// language
	
	if (navigator.userLanguage && navigator.userLanguage.length)
	{
		// IE
		browser.language = navigator.userLanguage;
	}
	else
	if (navigator.language && navigator.language.length)
	{
		// WebKit/Gecko/etc
		browser.language = navigator.language;
	}
	else
	{
		// find some other useful stuff
		// HACK depending on the format of the useragent string here
		var	systemInfo = userAgent.substring
			(userAgent.indexOf ('('), userAgent.indexOf (')'));
		
		var	systemInfoElements = systemInfo.split (";");
		
		// the language is the last one, usually
		var	possibleLanguage = systemInfoElements [systemInfoElements.length - 1];
		
		if (possibleLanguage.length == 5 && possibleLanguage.indexOf ('-') == 2)
		{
			browser.language = possibleLanguage;
		}
		else
		{
			browser.language = "en-us";
		}
	}
	
	browser.language = browser.language.toLowerCase ();

	return browser;
};
// config.js

monohm.provideStatic ("monohm.Config");

// Monohm provides a config domain system for clients
// map <domain, config>
monohm.Config.config = new Object ();

monohm.Config.getDomain = function (inDomain)
{
	return monohm.Config.config [inDomain];
}

// 
monohm.Config.getEntry = function (inDomain, inConfigKey)
{
	var	value = null;
	
	var	domain = monohm.Config.config [inDomain];
	
	if (domain)
	{
		var	config = domain;
	
		if (inConfigKey.indexOf ('.') > 0)
		{
			var	keyElements = inConfigKey.split ('.');

			for (var i = 0; i < keyElements.length && config != null; i++)
			{
				var	domain = keyElements [i];
			
				config = config [domain];
			}
		
			value = config;
		}
		else
		{
			value = config [inConfigKey];
		}
	}

	return value;
}

monohm.Config.load = function (inDomain, inURL, inCallback)
{
	// console.log ("monohm.Config.load(" + inDomain + "," + inURL + ")");
	
	monohm.Network.getJSONAsync
	(
		inURL,
		function (inError, inConfig)
		{
			if (inError)
			{
				inCallback (inError);
			}
			else
			{
				var	domain = monohm.Config.config [inDomain];
				
				if (domain)
				{
					monohm.Object.merge (inConfig, domain);
				}
				else
				{
					monohm.Config.config [inDomain] = inConfig;
					domain = inConfig;
				}
				
				inCallback (inError, domain);
			}
		}
	);
}

// some clients like to start with defaults etc
monohm.Config.setDomain = function (inDomain, inConfig)
{
	monohm.Config.config [inDomain] = inConfig;
}

// date.js

// note we don't use provideStatic() as we override monohm.Date()
monohm.provide ("monohm.Date");

// static class
monohm.Date = function (inDate)
{
	if (typeof (inDate) == "object")
	{
		if (typeof (inDate.getFullYear) == "function")
		{
			this.wrappedDate = inDate;
		}
		else
		{
			throw new Error ("monohm.Date() with non-Date argument");
		}
	}
	else
	{
		this.wrappedDate = new Date ();
	}
}

// STATIC

monohm.Date.getDayOfYear = function (inDate)
{
	var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
	var mn = inDate.getMonth ();
	var dn = inDate.getDate ();
	var dayOfYear = dayCount [mn] + dn;
	
	if (mn > 1 && monohm.Date.isLeapYear (inDate.getFullYear ()))
	{
		dayOfYear++;
	}
	
	return dayOfYear;
};

monohm.Date.isLeapYear = function (inYear)
{
	var result = false;
	
	if ((inYear % 400) == 0)
	{
		result = true;
	}
	else
	if ((inYear % 100) == 0)
	{
		result = false;
	}
	else
	if ((inYear % 4) == 0)
	{
		result = true;
	}

	return result;
}

// PUBLIC

monohm.Date.prototype.getCloneable = function ()
{
	var	date = 
	{
		year: this.wrappedDate.getFullYear (),
		month: this.wrappedDate.getMonth (),
		date: this.wrappedDate.getDate (),
		hour: this.wrappedDate.getHours (),
		minute: this.wrappedDate.getMinutes (),
		second: this.wrappedDate.getSeconds (),
		millisecond: this.wrappedDate.getMilliseconds ()
	};
	
	return date;
}

// some APIs just need a Date
monohm.Date.prototype.getWrappedDate = function ()
{
	return this.wrappedDate;
}

// PROPERTIES

Object.defineProperty
(
	monohm.Date.prototype,
	"time",
	{
		get: function ()
		{
			return this.wrappedDate.getTime ();
		},
		set: function (inTime)
		{
			var	time = parseInt (inTime);
			
			if (isNaN (time))
			{
				throw new Error ("monohm.Date.set(time) with NaN");
			}

			this.wrappedDate.setTime (time);
		}
	}
);

Object.defineProperty
(
	monohm.Date.prototype,
	"year",
	{
		get: function ()
		{
			return this.wrappedDate.getFullYear ();
		},
		set: function (inYear)
		{
			var	year = parseInt (inYear);
			
			if (isNaN (year))
			{
				throw new Error ("monohm.Date.set(year) with NaN");
			}

			this.wrappedDate.setFullYear (year);
		}
	}
);

// month 0-11
// the guy who did this should be shot
Object.defineProperty
(
	monohm.Date.prototype,
	"month",
	{
		get: function ()
		{
			return this.wrappedDate.getMonth ();
		},
		set: function (inMonth)
		{
			var	month = parseInt (inMonth);
			
			if (isNaN (month))
			{
				throw new Error ("monohm.Date.set(month) with NaN");
			}

			this.wrappedDate.setMonth (month);
		}
	}
);

// month 1-12
Object.defineProperty
(
	monohm.Date.prototype,
	"month1",
	{
		get: function ()
		{
			return this.wrappedDate.getMonth () + 1;
		},
		set: function (inMonth)
		{
			var	month = parseInt (inMonth);
			
			if (isNaN (month))
			{
				throw new Error ("monohm.Date.set(month1) with NaN");
			}

			this.wrappedDate.setMonth (month - 1);
		}
	}
);

// day of month 1-31
Object.defineProperty
(
	monohm.Date.prototype,
	"date",
	{
		get: function ()
		{
			return this.wrappedDate.getDate ();
		},
		set: function (inDate)
		{
			var	date = parseInt (inDate);
			
			if (isNaN (date))
			{
				throw new Error ("monohm.Date.set(date) with NaN");
			}

			this.wrappedDate.setDate (date);
		}
	}
);

// hour 0-23
Object.defineProperty
(
	monohm.Date.prototype,
	"hour",
	{
		get: function ()
		{
			return this.wrappedDate.getHours ();
		},
		set: function (inHour)
		{
			var	hour = parseInt (inHour);
			
			if (isNaN (hour))
			{
				throw new Error ("monohm.Date.set(hour) with NaN");
			}

			this.wrappedDate.setHours (hour);
		}
	}
);

// minute 0-59
Object.defineProperty
(
	monohm.Date.prototype,
	"minute",
	{
		get: function ()
		{
			return this.wrappedDate.getMinutes ();
		},
		set: function (inMinute)
		{
			var	minute = parseInt (inMinute);
			
			if (isNaN (minute))
			{
				throw new Error ("monohm.Date.set(minute) with NaN");
			}

			this.wrappedDate.setMinutes (minute);
		}
	}
);

// second 0-59
Object.defineProperty
(
	monohm.Date.prototype,
	"second",
	{
		get: function ()
		{
			return this.wrappedDate.getSeconds ();
		},
		set: function (inSecond)
		{
			var	second = parseInt (inSecond);
			
			if (isNaN (second))
			{
				throw new Error ("monohm.Date.set(second) with NaN");
			}

			this.wrappedDate.setSeconds (second);
		}
	}
);

// millisecond 0-999
Object.defineProperty
(
	monohm.Date.prototype,
	"millisecond",
	{
		get: function ()
		{
			return this.wrappedDate.getMilliseconds ();
		},
		set: function (inMillisecond)
		{
			var	millisecond = parseInt (inMillisecond);
			
			if (isNaN (millisecond))
			{
				throw new Error ("monohm.Date.set(millisecond) with NaN");
			}

			this.wrappedDate.setMilliseconds (minute);
		}
	}
);

// dom.js

monohm.provideStatic ("monohm.DOM");

monohm.DOM.addClass = function (inElement, inClassName)
{
	var	found = false;
	
	var	classAttribute = inElement.getAttribute ("class");

	// a little optimisation here
	// if classAttribute has nothing in it, just set it to the incoming class name
	if (classAttribute && classAttribute.length)
	{
		var	classAttributeElements = classAttribute.split (' ');
	
		for (var i = 0; i < classAttributeElements.length; i++)
		{
			if (classAttributeElements [i] == inClassName)
			{
				found = true;
				break;
			}
		}

		if (! found)
		{
			classAttribute += " " + inClassName;
		
			inElement.setAttribute ("class", classAttribute);
		}
	}
	else
	{
		inElement.setAttribute ("class", inClassName);
	}
};

// load a script using <script> and onload/error handlers
// safe and async
monohm.DOM.addScript = function (inURL, inCallback)
{
	var	script = document.createElement ("script");
	script.setAttribute ("src", inURL);
	script.setAttribute ("type", "text/javascript");

	script.onload = function ()
	{
		inCallback (true);
	};

	script.onerror = function ()
	{
		inCallback (false);
	};
	
	var	lastScript = document.head.querySelector ("script:last-of-type");
	
	if (lastScript.nextSibling)
	{
		document.head.insertBefore (script, lastScript.nextSibling);
	}
	else
	{
		document.head.appendChild (script);
	}
};

// inParent: old parent node
// inNewParent: new parent node
monohm.DOM.copyChildren = function (inParent, inNewParent)
{
	if (inParent && inParent.childNodes)
	{
		for (var i = 0; i < inParent.childNodes.length; i++)
		{
			inNewParent.appendChild (inParent.childNodes [i].cloneNode (true));
		}
	}
	else
	{
		console.error ("monohm.DOM.copyChildren() passed bad parent");
		console.error (inParent);
	}
};

monohm.DOM.createEvent = function (inType, inDetail)
{
	var	event = null;
	
	if (typeof (CustomEvent) == "function")
	{
		event = new CustomEvent
		(
			inType,
			{
				bubbles: true,
				detail: inDetail
			}
		);
	}
	else
	{
		event = document.createEvent ("Event");
		
		if (event.initEvent)
		{
			event.initEvent (inType, true, true);
			event.detail = inDetail;
		}
		else
		if (event.initCustomEvent)
		{
      event.initCustomEvent (inType, true, true, inDetail);
		}
		else
		{
			console.error ("no CustomEvent, initEvent, or initCustomEvent, can't make events");
		}
	}
	
	return event;
}
      
monohm.DOM.dispatchEvent = function (inElement, inType, inDetail)
{
	try
	{
		var	cancelled = inElement.dispatchEvent (monohm.DOM.createEvent (inType, inDetail));
	}
	catch (inError)
	{
		console.error ("error dispatching event " + inType);
		console.error (inError);
	}
}

// after much back and forth, decided to trust getAttribute()
// i think the problem is that if (value) fails if value is a zero length string
// i blamed getAttribute() for so long, but Js is to blame really

// inElement: DOM element
// inParam: attribute name
// return: string
monohm.DOM.getAttributeValue = function (inElement, inAttributeName)
{
	return inElement.getAttribute (inAttributeName);
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: string
monohm.DOM.getAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	result = monohm.DOM.getAttributeValue (inElement, inParam);
	
	// careful here as if (result) will fail for a zero length string
	if (result == null)
	{
		result = inDefault;
	}
	
	return result;
};

// inElement: DOM element
// inParam: attribute name
// return: boolean
// default is false
monohm.DOM.getBooleanAttributeValue = function (inElement, inParam)
{
	return monohm.DOM.getBooleanAttributeValueWithDefault (inElement, inParam, false);
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: boolean
monohm.DOM.getBooleanAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	value = monohm.DOM.getAttributeValue (inElement, inParam);
	
	if (value && value.length)
	{
		value = value.toLowerCase () == "true";
	}
	else
	{
		value = inDefault;
	}
	
	return value;
};

monohm.DOM.getDate = function (inElement, inContext)
{
	console.error ("monohm.DOM.getDate() is deprecated due to Positron dependencies");
	
	return null;
}

// inElement: DOM element
// inParam: attribute name
// return: int
monohm.DOM.getIntAttributeValue = function (inElement, inParam)
{
	return monohm.DOM.getIntAttributeValueWithDefault (inElement, inParam, 0);
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: int
monohm.DOM.getIntAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	value = monohm.DOM.getAttributeValue (inElement, inParam);
	
	if (value && value.length)
	{
		value = parseInt (value, 10);
		
		if (isNaN (value))
		{
			value = inDefault;
		}
	}
	else
	{
		value = inDefault;
	}
	
	return value;
};

// inElement: DOM element
// inParam: attribute name
// return: int
monohm.DOM.getFloatAttributeValue = function (inElement, inParam)
{
	return monohm.DOM.getFloatAttributeValueWithDefault (inElement, inParam, 0);
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: int
monohm.DOM.getFloatAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	value = monohm.DOM.getAttributeValue (inElement, inParam);
	
	if (value && value.length)
	{
		value = parseFloat (value);
		
		if (isNaN (value))
		{
			value = inDefault;
		}
	}
	else
	{
		value = inDefault;
	}
	
	return value;
};

// inElement: DOM element
// inParam: attribute name
// return: int
monohm.DOM.getTimeAttributeValue = function (inElement, inParam)
{
	var	value = monohm.DOM.getAttributeValue (inElement, inParam);
	
	if (value && value.length)
	{
		value = monohm.String.parseTime (value);
	}
	else
	{
		value = 0;
	}
	
	return value;
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: int
monohm.DOM.getTimeAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	value = monohm.DOM.getAttributeValue (inElement, inParam);
	
	if (value && value.length)
	{
		value = monohm.String.parseTime (value);
		
		if (value == 0)
		{
			value = inDefault;
		}
	}
	else
	{
		value = inDefault;
	}
	
	return value;
};

monohm.DOM.hasChildren = function (inElement)
{
	var	hasChildren = false;
	
	if (inElement.hasChildNodes ())
	{
		for (var i = 0; i < inElement.childNodes.length; i++)
		{
			var	child = inElement.childNodes [i];
			
			if (child.nodeType == child.ELEMENT_NODE)
			{
				hasChildren = true;
				break;
			}
			
			if (child.nodeType == child.TEXT_NODE)
			{
				var	text = monohm.String.stripSpaces (child.nodeValue);
				
				if (text.length > 0)
				{
					hasChildren = true;
					break;
				}
			}
			else
			{
				// any other kind of node is considered a child
				hasChildren = true;
				break;
			}
		}
	}
	
	return hasChildren;
}

monohm.DOM.hasClass = function (inElement, inClassName)
{
	var	hasClass = false;
	
	var	classAttribute = inElement.getAttribute ("class");
	
	if (classAttribute && classAttribute.length)
	{
		var	classAttributeElements = classAttribute.split (" ");
		
		for (var i = 0; i < classAttributeElements.length; i++)
		{
			if (classAttributeElements [i] == inClassName)
			{
				hasClass = true;
				break;
			}
		}
	}
	
	return hasClass;
};

monohm.DOM.insertChildrenBefore = function (inParentElement, inBeforeElement)
{
	// console.log ("DOM.insertChildrenBefore()");
	// console.log (inParentElement);
	// console.log (inBeforeElement);

  if (inParentElement && inBeforeElement && inBeforeElement.parentNode)
  {
    if (inParentElement.childNodes && inParentElement.childNodes.length)
    {
      while (inParentElement.childNodes.length > 0)
      {
        inBeforeElement.parentNode.insertBefore (inParentElement.firstChild, inBeforeElement);
      }
    }
  }
  else
  {
  	if (!inParentElement)
  	{
	    console.error ("DOM.insertChildrenBefore() passed bad parent element");
	  }
  	if (!inBeforeElement)
  	{
	    console.error ("DOM.insertChildrenBefore() passed bad before element");
	  }
	  else
  	if (!inBeforeElement.parentNode)
  	{
	    console.error ("DOM.insertChildrenBefore() passed orphan before element");
	    console.error (inBeforeElement);
	  }
  }
};

// is this node in the DOM, still?
monohm.DOM.isValidNode = function (inNode)
{
	var	valid = false;
	
	for (var parentNode = inNode.parentNode; parentNode; parentNode = parentNode.parentNode)
	{
		if (parentNode.nodeType == parentNode.ELEMENT_NODE
			&& parentNode.tagName.toLowerCase () == "body")
		{
			valid = true;
			break;
		}
	}
	
	return valid;
}

monohm.DOM.moveChildren = function (inParent, inNewParent)
{
	var	child = null;
	
	do
	{
		child = inParent.firstChild;
		
		if (child)
		{
			inParent.removeChild (child);
			inNewParent.appendChild (child);
		}
	}
	while (child);
};

monohm.DOM.removeChildren = function (inElement)
{
	while (inElement.hasChildNodes ())
	{
		inElement.removeChild (inElement.firstChild);
	}
}

monohm.DOM.removeClass = function (inElement, inClassName)
{
	var	classAttribute = inElement.getAttribute ("class");
	
	if (classAttribute && classAttribute.length)
	{
		var	classAttributeElements = classAttribute.split (" ");
		
		for (var i = 0; i < classAttributeElements.length; i++)
		{
			if (classAttributeElements [i] == inClassName)
			{
				classAttributeElements.splice (i, 1);
				inElement.setAttribute ("class", classAttributeElements.join (" "));

				break;
			}
		}
	}
};

monohm.DOM.removeNode = function (inNode)
{
	if (inNode.parentNode)
	{
		inNode.parentNode.removeChild (inNode);
	}
	else
	{
		console.error ("removeNode() cannot remove orphan");
		console.error (inNode);
	}
}

monohm.DOM.replaceWithChildren = function (inElement)
{
	// console.log ("DOM.replaceWithChildren()");
	// console.log (inElement);
	// console.log (inElement.parentNode);
	
	monohm.DOM.insertChildrenBefore (inElement, inElement);
  
  if (inElement.parentNode)
  {
    inElement.parentNode.removeChild (inElement);
  }
};

monohm.DOM.requestAnimationFrame = function (inCallback)
{
	if (!window.requestAnimationFrame)
	{
		window.requestAnimationFrame = window.mozRequestAnimationFrame ||
																	 window.webkitRequestAnimationFrame ||
																	 window.msRequestAnimationFrame; // if we... still care
	}
	
	window.requestAnimationFrame (inCallback);
};

monohm.DOM.toggleClass = function (inElement, inClassName)
{
	if (monohm.DOM.hasClass (inElement, inClassName))
	{
		monohm.DOM.removeClass (inElement, inClassName);
	}
	else
	{
		monohm.DOM.addClass (inElement, inClassName);
	}
}

// math.js

monohm.provideStatic ("monohm.Math");

monohm.Math.acosDegrees = function (inCosine)
{
	return Math.acos (inCosine) * (180 / Math.PI);
}

monohm.Math.asinDegrees = function (inSine)
{
	return Math.asin (inSine) * (180 / Math.PI);
}

monohm.Math.atan2Degrees = function (inOne, inTwo)
{
	return Math.atan2 (inOne, inTwo) * (180 / Math.PI);
}

monohm.Math.cosDegrees = function (inDegrees)
{
	return Math.cos (inDegrees * (Math.PI / 180));
}

monohm.Math.distance2d = function (inX1, inY1, inX2, inY2)
{
	return Math.sqrt (Math.pow ((inX1 - inX2), 2) + Math.pow ((inY1 - inY2), 2))
}

monohm.Math.sinDegrees = function (inDegrees)
{
	return Math.sin (inDegrees * (Math.PI / 180));
}

monohm.Math.limitRange = function (inNumber, inMin, inMax)
{
	return Math.min (Math.max (inNumber, inMin), inMax);
}

monohm.Math.toDegrees = function (inRadians)
{
	return inRadians / (Math.PI / 180);
}

monohm.Math.toRadians = function (inDegrees)
{
	return inDegrees * (Math.PI / 180);
}


// location.js

monohm.provideStatic ("monohm.Location");

monohm.Location.bearing = function (inFromLatitude, inFromLongitude, inToLatitude, inToLongitude)
{
	/*
	var	deltaY = inToLatitude - inFromLatitude;
	var	deltaX = inToLongitude - inFromLongitude;

	var	bearing = monohm.Math.atan2Degrees (deltaY, deltaX);

	console.log ("atan is " + bearing);
	*/
	
	var	fromLatitudeRadians = inFromLatitude * (Math.PI / 180);
	var	fromLongitudeRadians = inFromLongitude * (Math.PI / 180);
	var	toLatitudeRadians = inToLatitude * (Math.PI / 180);
	var	toLongitudeRadians = inToLongitude * (Math.PI / 180);
	
	var	y = Math.sin (toLongitudeRadians - fromLongitudeRadians) * Math.cos (toLatitudeRadians);
	var	x = Math.cos (fromLatitudeRadians) * Math.sin (toLatitudeRadians)
		- Math.sin (fromLatitudeRadians) * Math.cos (toLatitudeRadians) * Math.cos (toLongitudeRadians - fromLongitudeRadians);
	
	var	bearing = monohm.Math.atan2Degrees (y, x);
	
	return (bearing + 360) % 360;
}

// the radius string is 1000ft, 100m, 1mi, 300yd, etc
// see monohm.String.parseDistance()
// assumptions: 1 degree of latitude = 111km, 1 degree of longitude = 85km
// largely for use with constraining OSM searches
monohm.Location.boundingBox = function (inLatitude, inLongitude, inRadiusString)
{
	var	radiusMetres = monohm.String.parseDistance (inRadiusString);
	var	radiusDegreesLatitude = (radiusMetres / 1000) / 111;
	var	radiusDegreesLongitude = (radiusMetres / 1000) / 85;
	
	var	box =
	{
		topleft :
		{
			latitude: inLatitude + radiusDegreesLatitude,
			longitude: inLongitude - radiusDegreesLongitude
		},
		bottomright :
		{
			latitude: inLatitude - radiusDegreesLatitude,
			longitude: inLongitude + radiusDegreesLongitude
		}
	};
	
	return box;
}

monohm.Location.distanceM = function (inLatitude1, inLongitude1, inLatitude2, inLongitude2)
{
	// convert to radians
	var	lat1 = inLatitude1 * (Math.PI / 180);
	var	lat2 = inLatitude2 * (Math.PI / 180);
	var	long1 = inLongitude1 * (Math.PI / 180);
	var	long2 = inLongitude2 * (Math.PI / 180);
	
	var	sinLat1 = Math.sin (lat1);
	var	sinLat2 = Math.sin (lat2);
	var	sinLong1 = Math.sin (long1);
	var	sinLong2 = Math.sin (long2);

	var	cosA1 = Math.cos (lat1);
	var	cosA2 = Math.cos (lat2);
	var	cosB1 = Math.cos (long1);
	var	cosB2 = Math.cos (long2);
	
	var	term1 = cosA1 * cosB1 * cosA2 * cosB2;
	var	term2 = cosA1 * sinLong1 * cosA2 * sinLong2;
	var	term3 = sinLat1 * sinLat2;
	var	term4 = term1 + term2 + term3;
	
	var	acos = Math.acos (term4);
	
	return acos * 6371000;
}

monohm.Location.distanceKM = function (inLatitude1, inLongitude1, inLatitude2, inLongitude2)
{
	return monohm.Location.distanceM (inLatitude1, inLongitude1, inLatitude2, inLongitude2) / 1000;
}

monohm.Location.distanceMi = function (inLatitude1, inLongitude1, inLatitude2, inLongitude2)
{
	return monohm.Location.distanceM (inLatitude1, inLongitude1, inLatitude2, inLongitude2) * 0.000621371;
}

monohm.Location.distanceYd = function (inLatitude1, inLongitude1, inLatitude2, inLongitude2)
{
	return monohm.Location.distanceM (inLatitude1, inLongitude1, inLatitude2, inLongitude2) * 1.09361;
}

monohm.Location.distanceFt = function (inLatitude1, inLongitude1, inLatitude2, inLongitude2)
{
	return monohm.Location.distanceM (inLatitude1, inLongitude1, inLatitude2, inLongitude2) * 3.28084;
}

monohm.Location.testDistanceAndBearing = function ()
{
	var	sfLatitude = 37.78;
	var	sfLongitude = -122.41;
	var	seattleLatitude = 47.60;
	var	seattleLongitude = -122.31;
	
	var	distance = monohm.Location.distanceMi (seattleLatitude, seattleLongitude, sfLatitude, sfLongitude);
	console.log ("distance from Seattle to SF is " + distance + "mi");
	
	var	bearing = monohm.Location.bearing (seattleLatitude, seattleLongitude, sfLatitude, sfLongitude);
	console.log ("bearing from Seattle to SF " + bearing + " degrees");
}

// mime.js

monohm.provideStatic ("monohm.Mime");

monohm.Mime.kExtensionToContentType = 
{
	"css" : "text/css",
	"gif" : "image/gif",
	"htm" : "text/html",
	"html" : "text/html",
	"jpg" : "image/jpeg",
	"jpeg" : "image/jpeg",
	"json" : "application/json",
	"js" : "application/javascript",
	"mp3" : "audio/mpeg3",
	"mpg" : "video/mpeg",
	"png" : "image/png",
	"rtf" : "application/rtf",
	"xml" : "application/xml"
};

// pass any string in here
monohm.Mime.mapExtensionToContentType = function (inString)
{
	var	extension = inString;
	var	periodIndex = inString.lastIndexOf (".");
	
	if (periodIndex >= 0)
	{
		extension = inString.substring (periodIndex + 1);
	}
	
	extension = extension.toLowerCase ();

	var	contentType = monohm.Mime.kExtensionToContentType [extension];
	
	if (!contentType)
	{
		console.error ("no content type for extension (" + extension + ")");
		contentType = "application/octet-stream";
	}
	
	return contentType;
}
// network.js

monohm.provideStatic ("monohm.Network");

// pretends to be jquery $.ajax
monohm.Network.ajax = function (inRequest)
{
  var fullURL = inRequest.url;
  
  var	data = "";
  
  // if data is an object, then serialise it, to be nice
  if (typeof (inRequest.data) == "object")
  {
  	data = monohm.Network.objectToURIData (inRequest.data);
  }
  else
  {
  	data = inRequest.data;
  }
  
  if (data && data.length)
  {
    fullURL += "?" + data;
  }

	// ensure we upper case for later
	// seems like something above the submit event lowercases the method :-S
	if (inRequest.type && inRequest.type.length)
	{
		inRequest.type = inRequest.type.toUpperCase ();
	}
	else
	{
		inRequest.type = "GET";
	}

	var	async = inRequest.async ? true : false;
	
	inRequest.dataType = inRequest.dataType.toLowerCase ();

	var	jsonp = false;
	
	// ONLY even potentially enable JSONP for JSON requests
	if (inRequest.dataType == "json")
	{
		jsonp = monohm.Network.isJSONPRequest (inRequest);
	}
	
	if (jsonp)
	{
		// console.log ("using jsonp for url: " + inRequest.url);
		monohm.Network.jsonp (inRequest);
	}
	else
	{
		// i am tired of browser fuckery
		// as some browsers throw on send()
		// and some call your error handler
		// and some fucking do BOTH
		// we have to keep track of whether we have called back
		// to ensure we don't call back twice
		// SIGH
		var	errorReported = false;
		
		// HACK on Firefox this allows cross-domain without JSONP
		// in conjunction with systemXHR permission
		// but why wasn't the permission enough?
		// why cause pollution this low?
		var	xhr = new XMLHttpRequest ({mozAnon: true, mozSystem: true});
		
		xhr.onreadystatechange = function ()
		{
			if (this.readyState == 4)
			{
				var	textStatus = "OK";
				
				// otherwise we check EVERYWHERE
				if (!inRequest.success)
				{
					inRequest.success = function ()
					{
					}
				}

				if (!inRequest.error)
				{
					inRequest.error = function ()
					{
					}
				}
				
				if (inRequest.dataType == "json" || inRequest.dataType == "text")
				{
					if (this.responseText && this.responseText.length)
					{
						// some fuck-witted sites send error codes *and* content, ffs
						if (Math.floor (this.status / 100) == 2 || this.status == 0)
						{
							try
							{
								if (inRequest.dataType == "json")
								{
									inRequest.success (JSON.parse (this.responseText), textStatus, this);
								}
								else
								{
									inRequest.success (this.responseText, textStatus, this);
								}
							}
							catch (inError)
							{
								if (!errorReported)
								{
									errorReported = true;
									inRequest.error (this, "error", inError.message);
								}
							}
						}
						else
						{
							// 
							inRequest.error (this, "error", "Not Found");
						}
					}
					else
					{
						if (!errorReported)
						{
							errorReported = true;
							inRequest.error (this, "error", "Not Found");
						}
					}
				}
				else
				{
					// ok so this isn't a data type we handle ourselves
					// likely to be binary, from <p-sound>
					// note browsers tend to explode if you go near responseText here </crime>
					// so we just test response instead
					if (this.response)
					{
						inRequest.success (this.response, textStatus, this);
					}
					else
					{
						if (!errorReported)
						{
							errorReported = true;
							inRequest.error (this, "error", "Not Found");
						}
				}
				}
				
				if (typeof (inRequest.complete) == "function")
				{
					inRequest.complete (this, errorReported ? "ERROR" : "OK");
				}
			}
		}

		// the order of open(), setRequestHeader(), and send() is important
		
		var	url = inRequest.url;
		
		if (inRequest.type == "GET" || inRequest.type == "HEAD")
		{
			if (data && data.length)
			{
				url += "?" + data;
			}
		}
	
		xhr.open (inRequest.type, url, async);

		// ok hold on
		// we HAVE to support binaries due to <p-sound> among other things
		// so only hardcode text if we're json or text
		if (inRequest.dataType == "json" || inRequest.dataType == "text")
		{
			// this means the reply is guaranteed to be in responseText
			// and from there we can JSON parse or whatever
			// skips a load of browser fuckery
			xhr.responseType = "text";
		}
		else
		{
			// you're on your own
			xhr.responseType = inRequest.dataType;
		}

		if (typeof (inRequest.headers) == "object")
		{
			for (var key in inRequest.headers)
			{
				var	value = inRequest.headers [key];
				
				if (typeof (value) != "function")
				{
					xhr.setRequestHeader (key, value);
				}
			}
		}
		
		// some browsers throw on send() instead of doing a state change, sigh
		try
		{
			if (inRequest.type == "POST")
			{
				xhr.send (data);
			}
			else
			{
				xhr.send (null);
			}
		}
		catch (inError)
		{
			if (typeof (inRequest.error) == "function")
			{
				if (!errorReported)
				{
					errorReported = true;
					inRequest.error (inRequest, "error", inError.name);
				}
			}
		}
	}
};

monohm.Network.get = function (inURL, inDataType, inCallback)
{
	var	payload = null;
	
	var	urlElements = inURL.split ("?");
	
	monohm.Network.ajax
	({
		url: urlElements [0],
		data: urlElements [1],
		type: "GET",
		dataType: inDataType,
		async: inCallback ? true : false,
		success: function (inData, inTextStatus, inXHR)
		{
			if (inCallback)
			{
				inCallback (null, inData);
			}
			else
			{
				payload = inData;
			}
		},
		error: function (inXHR, inTextStatus, inError)
		{
			if (inCallback)
			{
				inCallback (inError);
			}
			else
			{
				console.error (inError);
			}
		}
	});
	
	return payload;
}

monohm.Network.getJSONAsync = function (inURL, inCallback)
{
	monohm.Network.get (inURL, "json", inCallback);
}

monohm.Network.getJSONSync = function (inURL)
{
	return monohm.Network.get (inURL, "json");
}

monohm.Network.getTextAsync = function (inURL, inCallback)
{
	monohm.Network.get (inURL, "text", inCallback);
}

monohm.Network.getTextSync = function (inURL)
{
	return monohm.Network.get (inURL, "text");
}

// ok so a little clarification --
// if the URL includes a port number, but the port is the default one
// then it is excluded from "port" and "host"
// i think i'd rather have it default when it *isn't* there
// but either way comparing is easier without it
// colour me baphled (again)
monohm.Network.isCrossDomainRequest = function (inRequest)
{
	var	crossDomain = false;
	
	if (inRequest.type.toUpperCase () == "GET")
	{
		if (inRequest.headers)
		{
			// the user specified headers
			// eg for OAuth
			// so we can't JSONP
		}
		else
		{
			var	here = document.createElement ("a");
			here.href = document.location.href.toLowerCase ();
	
			var	there = document.createElement ("a");
			there.href = inRequest.url.toLowerCase ();
	
			// careful here
			// IE9 doesn't fill in the relevant details for relative URLs
			// despite getting the actual HREF field correct (sigh)
			// so assume that relative URLs are not cross-domain
			if (there.host && there.host.length)
			{
				// host includes the port, if any
				crossDomain = here.protocol != there.protocol || here.host != there.host;
			}
		}
	}

	return crossDomain;	
}


monohm.Network.isJSONPRequest = function (inRequest)
{
	var	jsonp = true;
	
	if (monohm.Network.isCrossDomainRequest (inRequest))
	{
		// HACK allow Positron config to override based on strategy
		// there should be a better way
		var	crossDomainStrategy = monohm.Config.getEntry ("positron", "crossDomainStrategy");
		
		if (crossDomainStrategy)
		{
			var	browser = monohm.Browser.getInfo ();
			
			if (browser.name && browser.name.length)
			{
				var	strategy = crossDomainStrategy [browser.name];
				// console.log ("browser cross-domain strategy is " + strategy);
				
				if (strategy && strategy.length)
				{
					jsonp = strategy == "jsonp";
				}
			}
		}
	}
	else
	{
		// safe request, leave alone
		jsonp = false;
	}

	return jsonp;	
}

monohm.Network.jsonpSequence = 0;

monohm.Network.jsonp = function (inRequest)
{
	var	jsonpCallbackName = "monohm_json_callback_" + monohm.Network.jsonpSequence;
	monohm.Network.jsonpSequence++;
	
	var	url = inRequest.url;
	url += "?";
	
  var	data = "";
  
  // if data is an object, then serialise it, to be nice
  if (typeof (inRequest.data) == "object")
  {
  	data = monohm.Network.objectToURIData (inRequest.data);
  }
  else
  {
  	data = inRequest.data;
  }

	if (data && data.length)
	{
		url += data;
		url += "&";
	}
	
	// HACK this is not sustainable
	// some packages require the actual callback name
	// and not just the name of the parameter
	// which causes pollution all the way down here and is revolting
	url += "callback=" + jsonpCallbackName;
	url += "&json_callback=" + jsonpCallbackName;
	
	// console.log ("jsonp url is " + url);
	
	var	jsonTag = document.createElement ("script");
	jsonTag.setAttribute ("type", "text/javascript");
	jsonTag.setAttribute ("src", url);
	
	jsonTag.onload = function ()
	{
		// i hear that setTimeout()ing this is safer...
		setTimeout
		(
			function ()
			{
				window [jsonpCallbackName] = null;
				document.querySelector ("head").removeChild (jsonTag);
			},
			1
		);
	}
	
	// i am so grateful this exists
	jsonTag.onerror = function ()
	{
		if (inRequest.error)
		{
			inRequest.error (null, "ERROR", null);
		}
	}
	
	window [jsonpCallbackName] = function (inJSONObject)
	{
		if (inJSONObject)
		{
			if (typeof (inRequest.success) == "function")
			{
				inRequest.success (inJSONObject, "OK", null);
			}
		}
		else
		{
			if (typeof (inRequest.error) == "function")
			{
				inRequest.error (null, "ERROR", null);
			}
		}
	}

	document.querySelector ("head").appendChild (jsonTag);
}

monohm.Network.objectToURIData = function (inObject)
{
	var	data = "";
	
	for (var key in inObject)
	{
		if (typeof (key) == "string")
		{
			var	value = inObject [key];
			
			if (typeof (value) == "string" || typeof (value) == "number" || typeof (value) == "boolean")
			{
				if (data.length > 0)
				{
					data += "&";
				}
				
				data += key;
				data += "=";
				data += encodeURIComponent ("" + value);
			}
		}
	}
	
	return data;
}
// object.js

monohm.provideStatic ("monohm.Object");

monohm.Object.clone = function (inObject)
{
	var	copy = inObject;
	
	if (inObject)
	{
		if (typeof inObject == "object")
		{
			if (Array.isArray (inObject))
			{
				copy = new Array ();
				
				for (var i = 0; i < inObject.length; i++)
				{
					copy [i] = monohm.Object.clone (inObject [i]);
				}
			}
			else
			{
				copy = new Object ();
				
				for (var key in inObject)
				{
					copy [key] = monohm.Object.clone (inObject [key]);
				}
			}
		}
	}
	
	return copy;
}

// returns whatever the last nonzero compare was
// or -1 for type mismatches, etc
monohm.Object.compare = function (inOne, inTwo)
{
	var	result = 0;
	
	if (typeof inOne == typeof inTwo)
	{
		if (typeof inOne == "object")
		{
			// could be null, watch out
			if (inOne == null && inTwo == null)
			{
				result = 0;
			}
			else
			{
				if (Array.isArray (inOne))
				{
					if (inOne.length == inTwo.length)
					{
						for (var i = 0; i < inOne.length && result == 0; i++)
						{
							result = monohm.Object.compare (inOne [i], inTwo [i]);
						}
					}
					else
					{
						result = -1;
					}
				}
				else
				{
					copy = new Object ();
					
					var	keys = new Object ();
					
					for (var key in inOne)
					{
						result = monohm.Object.compare (inOne [key], inTwo [key]);
						
						if (result == 0)
						{
							keys [key] = true;
						}
						else
						{
							break;
						}
					}
					
					if (result == 0)
					{
						// ensure we don't have extra keys in inTwo
						for (var key in inTwo)
						{
							if (! keys [key])
							{
								result = -1;
								break;
							}
						}
					}
				}
			}
		}
		else
		{
			result = inOne === inTwo ? 0 : -1;
		}
	}
	else
	{
		result = -1;
	}
	
	return result;
}

// check whether the class exists
monohm.Object.exists = function (inFullClassName)
{
	// console.log ("monohm.Object.exists(" + inFullClassName + ")");
	
	var	object = window;
	var	instance = null;
	
	var	packageElements = inFullClassName.split ('.');
	
	for (var i = 0; i < packageElements.length; i++)
	{
		object = object [packageElements [i]];
		
		if (!object)
		{
			break;
		}
	}
	
	return object != null && object != window;
}

monohm.Object.instantiate = function (inFullClassName)
{
	// console.log ("monohm.Object.instantiate(" + inFullClassName + ")");
	
	var	object = window;
	var	instance = null;
	
	var	packageElements = inFullClassName.split ('.');
	
	for (var i = 0; i < packageElements.length; i++)
	{
		object = object [packageElements [i]];
		
		if (!object)
		{
			break;
		}
	}
	
	if (object != null && object != window)
	{
		try
		{
			instance = new object;
		}
		catch (inError)
		{
			console.error ("error trying to construct " + inFullClassName);
			console.error (inError);
		}
	}
	
	return instance;
}

monohm.Object.isEmpty = function (inObject)
{
	var	empty = true;
	
	for (var key in inObject)
	{
		if (inObject.hasOwnProperty (key))
		{
			empty = false;
			break;
		}
	}
	
	return empty;
}

monohm.Object.merge = function (inObject, outObject)
{
	for (var key in inObject)
	{
		var	value = inObject [key];
		var	valueType = typeof (value);
		
		if (valueType == "string" || valueType == "number" || valueType == "boolean")
		{
			var	outValue = outObject [key];
			
			if (typeof (outValue) == "undefined" || typeof (outValue) == valueType)
			{
				outObject [key] = value;
			}
			else
			{
				console.error ("type mismatch on key: " + key);
				console.error ("type of existing is " + typeof (outValue));
				console.error ("type of incoming is " + typeof (valueType));
			}
		}
		else
		if (Array.isArray (value))
		{
			var	outValue = outObject [key];
			
			if (typeof (outValue) == "undefined")
			{
				outObject [key] = value;
			}
			else
			if (Array.isArray (outValue))
			{
				for (var i = 0; i < value.length; i++)
				{
					// don't push duplicates? is this reliable for object members?
					if (outValue.indexOf (value [i]) < 0)
					{
						outValue.push (value [i]);
					}
				}
			}
			else
			{
				console.error ("type mismatch on key: " + key);
				console.error ("type of existing is " + typeof (outValue));
				console.error ("type of incoming is " + typeof (valueType));
			}
		}
		else
		if (valueType == "object")
		{
			var	outValue = outObject [key];
			
			if (outValue)
			{
				if (typeof (outValue) == "object")
				{
					if (Array.isArray (outValue))
					{
						console.error ("type mismatch on key: " + key);
					}
					else
					{
						monohm.Object.merge (value, outValue);
					}
				}
				else
				{
					console.error ("type mismatch on key: " + key);
				}
			}
			else
			{
				outObject [key] = value;
			}
		}
		else
		{
			console.error ("fell off the typeof chain for key: " + key);
		}
		
	}
}

monohm.Object.sort = function (inRecords, inPropertyName, inAscending)
{
	inRecords.sort
	(
		function (inOne, inTwo)
		{
			var	result = 0;

			var	one = inOne [inPropertyName];
			var	two = inTwo [inPropertyName];
			
			if (one)
			{
				if (two)
				{
					if (one < two)
					{
						result = -1;
					}
					else
					if (one > two)
					{
						result = 1;
					}
				}
				else
				{
					result = 1;
				}
			}
			else
			{
				if (two)
				{
					result = -1;
				}
			}
			
			if (! inAscending)
			{
				result *= -1;
			}
			
			return result;
		}
	);
	

}
// sql-database.js

monohm.provideStatic ("monohm.SQLDatabase");

monohm.SQLDatabase.delete =
function monohm_SQLDatabase_delete (inDatabaseName, inTableName, inColumnName, inColumnValue, inCallback)
{
	monohm.SQLDatabase.open
	(
		inDatabaseName,
		function (inError, inDatabase)
		{
			if (inError)
			{
				inCallback (inError);
			}
			else
			{
				console.log ("deleting " + inDatabaseName + "/" + inTableName + "/" + inColumnName + "/" + inColumnValue);
	
				inDatabase.transaction
				(
					function (inTransaction)
					{
						var	sql = "delete from " + inTableName + " where " + inColumnName + " = ?";
						
						console.log (sql);
						console.log (inColumnValue + " (" + typeof inColumnValue + ")");
						
						// looks like the web SQL db does type mapping for us!
						inTransaction.executeSql
						(
							sql,
							[inColumnValue],
							function (inTransaction)
							{
								inCallback ();
							},
							function (inTransaction, inError)
							{
								inCallback (inError);
							}
						);
					}
				);
			}
		}
	);
}

monohm.SQLDatabase.deleteTable =
function monohm_SQLDatabase_deleteTable (inDatabaseName, inTableName, inCallback)
{
	monohm.SQLDatabase.open
	(
		inDatabaseName,
		function (inError, inDatabase)
		{
			if (inError)
			{
				inCallback (inError);
			}
			else
			{
				console.log ("deleting " + inDatabaseName + "/" + inTableName);
	
				inDatabase.transaction
				(
					function (inTransaction)
					{
						var	sql = "drop table " + inTableName;
						
						inTransaction.executeSql
						(
							sql,
							[],
							function (inTransaction)
							{
								inCallback ();
							},
							function (inTransaction, inError)
							{
								inCallback (inError);
							}
						);
					}
				);
			}
		}
	);
}

monohm.SQLDatabase.get =
function monohm_SQLDatabase_get (inDatabaseName, inTableName, inColumnName, inColumnValue, inCallback)
{
	console.log ("monohm.SQLDatabase.get(" + inDatabaseName + "/" + inTableName + "/" + inIndexName + "/" + inIndexValue + ")");
	
	monohm.SQLDatabase.open
	(
		inDatabaseName,
		function (inError, inDatabase)
		{
			if (inError)
			{
				inCallback (inError);
			}
			else
			{
				console.log ("getting " + inDatabaseName + "/" + inTableName + "/" + inColumnName + "/" + inColumnValue);
	
				inDatabase.transaction
				(
					function (inTransaction)
					{
						var	sql = "select * from " + inTableName + " where " + inColumnName + " = ?";
						console.log (sql);
						console.log (inColumnValue);
						
						// looks like the web SQL db does type mapping for us!
						inTransaction.executeSql
						(
							sql,
							[inColumnValue],
							function (inTransaction, inResultSet)
							{
								var	results = [];
						
								if (inResultSet.rows && inResultSet.rows.length)
								{
									// sadly the result set structure isn't standard js
									// so can't traverse it with context syntax
									// have to convert to regular list :-(
									for (var i = 0; i < inResultSet.rows.length; i++)
									{
										var	item = inResultSet.rows.item (i);
										var	result = new Object ();
								
										for (var key in item)
										{
											result [key] = item [key];
										}
								
										results.push (result);
									}
								}
								
								inCallback (null, results);
							},
							function (inTransaction, inError)
							{
								inCallback (inError);
							}
						);
					}
				);
			}
		}
	);
}					

monohm.SQLDatabase.insert =
function monohm_SQLDatabase_insert (inDatabaseName, inTableName, inRecord, inCallback)
{
	console.log ("monohm.SQLDatabase.insert()");

	monohm.SQLDatabase.open
	(
		inDatabaseName,
		function (inError, inDatabase)
		{
			if (inError)
			{
				inCallback (inError);
			}
			else
			{
				console.log ("inserting into " + inDatabaseName + "/" + inTableName);
	
				inDatabase.transaction
				(
					function (inTransaction)
					{
						var	sql = "insert into " + inTableName + " (";
						var	values = [];
						var	valueSQL = "(";
						
						var	first = true;
						
						for (var key in inRecord)
						{
							if (! first)
							{
								sql += ",";
								valueSQL += ",";
							}
							else
							{
								first = false;
							}
							
							sql += key;
							valueSQL += "?";
							
							values.push (inRecord [key]);
						}

						sql += ") values ";
						sql += valueSQL;
						sql += ")";
						
						console.log (sql);
						console.log (values);
						
						inTransaction.executeSql
						(
							sql,
							values,
							function (inTransaction)
							{
								inCallback ();
							},
							function (inTransaction, inError)
							{
								inCallback (inError);
							}
						);
					}
				);
			}
		}
	);
};

monohm.SQLDatabase.open =
function monohm_SQLDatabase_open (inDatabaseName, inCallback)
{
	console.log ("SQLQueryTag.openDatabase(" + inDatabaseName + ")");
	
	var	config = null;
	var	size = 5242880;
	var	name = "No Name";
	
	if (gApplication.config && gApplication.config.sql_databases)
	{
		config = gApplication.config.sql_databases [inDatabaseName];
		
		if (config)
		{
			if (typeof config.name == "string" && config.name.length > 0)
			{
				name = config.name;
			}
			
			if (typeof config.size == "number" && config.size > 0)
			{
				size = config.size;
			}
		}
		else
		{
			console.error ("no SQL database configuration");
		}
	}
			
	var	database = openDatabase (inDatabaseName, "", name, size);
	
	if (database)
	{
		console.log ("version is " + database.version);

		var	currentVersion = parseFloat (database.version);
		
		if (isNaN (currentVersion))
		{
			currentVersion = -1;
		}
		
		if (config && config.versions && Array.isArray (config.versions))
		{
			new positron.AsyncListHelper
			({
				this: this,
				list: config.versions,
				iterate: function (inHelper, inListElement)
				{
					if (currentVersion < inListElement.version)
					{
						console.log ("updating to version " + inListElement.version);
						
						database.changeVersion
						(
							database.version,
							inListElement.version,
							function (inTransaction)
							{
								if (Array.isArray (inListElement.sql))
								{
									for (var i = 0; i < inListElement.sql.length; i++)
									{
										console.log (inListElement.sql [i]);
										inTransaction.executeSql (inListElement.sql [i]);
									}
								}
								else
								if (typeof (inListElement.sql) == "string")
								{
									inTransaction.executeSql (inListElement.sql);
								}
							},
							function (inError)
							{
								console.error ("error updating to version " + inListElement.version);
								console.error (inError);
								inHelper.onIteration (false);
							}
						);
					}
					else
					{
						console.log ("database up to date");
						inHelper.onIteration (false);
					}
				},
				complete: function ()
				{
					inCallback (null, database);
				}
			});
		}
		else
		{
			console.error ("no configuration for SQL database: " + inDatabaseName);
			inCallback (null, database);
		}
	}
	else
	{
		inCallback (new Error ("openDatabase() failed"));
	}
}

// PRIVATE

// web SQL db seems to type-map for us
// which is nice of it
// but i'm leaving this around just in case...

/*
monohm.SQLDatabase.mapPropertyValue =
function monohm_SQLDatabase_mapPropertyValue (inDatabaseName, inTableName, inPropertyName, inPropertyValue)
{
	var	propertyValue = inPropertyValue;
	
	var	databaseConfig = monohm.Config.getEntry ("positron", "sql_databases." + inDatabaseName);
	
	if (databaseConfig)
	{
		var	tableConfig = databaseConfig.tables [inTableName];
		
		if (tableConfig.properties)
		{
			var	propertyConfig = tableConfig.properties [inPropertyName];
			
			if (propertyConfig)
			{
				if (propertyConfig.type)
				{
					if (propertyConfig.type == "integer")
					{
						propertyValue = parseInt (inPropertyValue);
					}
					else
					if (propertyConfig.type == "float")
					{
						propertyValue = parseFloat (inPropertyValue);
					}
					else
					if (propertyConfig.type == "string")
					{
						propertyValue = inPropertyValue.toString ();
					}
					else
					{
						console.error ("unknown property type " + propertyConfig.type);
					}
				}
				else
				{
					console.error ("no config for property " + inPropertyName);
				}
			}
		}
	}
	else
	{
		console.error ("database " + inDatabaseName + " not found in database config");
	}
	
	return propertyValue;
}
*/

// string.js

monohm.provideStatic ("monohm.String");

// note this does *not* lowercase the remainder of the string
monohm.String.capitalise = function (inString)
{
	return inString.charAt (0).toUpperCase () + inString.substring (1);
}

monohm.String.camelToHyphen = function (inCamel)
{
	var	hyphen = "";
	
	for (var i = 0; i < inCamel.length; i++)
	{
		var	ch = inCamel.charAt (i);
		
		if (ch >= 'A' && ch <= 'Z')
		{
			if (hyphen.length > 0)
			{
				hyphen += '-';
			}
			
			hyphen += ch.toLowerCase ();
		}
		else
		{
			hyphen += ch;
		}
	}
	
	return hyphen;
}

// careful here
// hm.mono.WalrusManager.WalrusShaver -> hm.mono.WalrusManager.walrus-shaver
monohm.String.classNameToHyphen = function (inCamel)
{
	var	elements = inCamel.split ('.');
	var	className = elements [elements.length - 1];
	elements [elements.length - 1] = monohm.String.camelToHyphen (className);
	
	return elements.join ('.');
}

monohm.String.hyphenToCamel = function (inHyphen, inCapitaliseFirst)
{
	var	camel = "";
	
	var	elements = inHyphen.split ('-');
	
	for (var i = 0; i < elements.length; i++)
	{
		var	element = elements [i];
		
		if (inCapitaliseFirst || i > 0)
		{
			camel += monohm.String.capitalise (element);
		}
		else
		{
			camel += element;
		}
	}
	
	return camel;
}

monohm.String.kDistanceUnits =
[
	"m",
	"ft",
	"yd",
	"km",
	"mi"
];

monohm.String.kDistanceMultipliers =
[
	1,
	0.3048,
	0.9144,
	1000,
	1609.34
];

// parses 1000ft, 50mi, 35km etc into metres
monohm.String.parseDistance = function (inDistanceString, inDefault)
{
	var	distanceAndUnits = monohm.String.parseValueAndUnits (inDistanceString, inDefault, "m");
	
	var	unitIndex = monohm.String.kDistanceUnits.indexOf (distanceAndUnits.units);
	
	if (unitIndex >= 0)
	{
		distanceAndUnits.value *= monohm.String.kDistanceMultipliers [unitIndex];
	}
	else
	{
		console.error ("parseDistance() found unknown unit: " + distanceAndUnits.units);
	}
	
	// we guarantee an integer value
	return Math.round (distanceAndUnits.value);
}

monohm.String.parseFloat = function (inString, inDefault)
{
	var	value = inDefault;
	
	if (inString && inString.length)
	{
		value = parseFloat (inString);
	
		if (isNaN (value))
		{
			value = inDefault;
		}
	}
	
	return value;
}

monohm.String.parseInt = function (inString, inDefault)
{
	var	value = inDefault;
	
	if (inString && inString.length)
	{
		value = parseInt (inString);
	
		if (isNaN (value))
		{
			value = inDefault;
		}
	}
	
	return value;
}

monohm.String.kTimeUnits =
[
	"ms",
	"s",
	"m",
	"h",
	"d"
];

monohm.String.kTimeMultipliers =
[
	1,
	1000,
	60 * 1000,
	60 * 60 * 1000,
	60 * 60 * 1000 * 24
];

// parses 1000ms, 50s, 35m etc into milliseconds
monohm.String.parseTime = function (inTimeString, inDefault)
{
	var	timeAndUnits = monohm.String.parseValueAndUnits (inTimeString, inDefault, "ms");
	
	var	unitIndex = monohm.String.kTimeUnits.indexOf (timeAndUnits.units);
	
	if (unitIndex >= 0)
	{
		timeAndUnits.value *= monohm.String.kTimeMultipliers [unitIndex];
	}
	else
	{
		console.error ("parseTime() found unknown unit: " + timeAndUnits.units);
	}
	
	// we guarantee an integer value
	return Math.round (timeAndUnits.value);
}

monohm.String.parseValueAndUnits = function (inString, inDefaultValue, inDefaultUnits)
{
	var	valueAndUnits = new Object ();
	valueAndUnits.value = 0;
	valueAndUnits.units = inDefaultUnits ? inDefaultUnits : "";
	
	if (inString && inString.length)
	{
		var	multiplier = 1;
		var	decimalDigits = 0;

		inString = monohm.String.stripSpaces (inString);
		
		for (var i = 0; i < inString.length; i++)
		{
			var	ch = inString.charAt (i);
			
			if (ch == '.')
			{
				if (decimalDigits > 0)
				{
					console.error ("Util.parseValueAndUnits() found multiple decimals in : " + inString);
				}
				else
				{
					decimalDigits++;
				}
			}
			else
			if (ch == '-')
			{
				multiplier = -1;
			}
			else
			{
				var	timeDigit = parseInt (ch);
				
				if (isNaN (timeDigit))
				{
					if (i == 0)
					{
						// we never got a numeric digit, use the default
						valueAndUnits.value = inDefaultValue;
					}
					else
					{
						// negate if necessary
						valueAndUnits.value *= multiplier;
					}
					
					valueAndUnits.units = inString.substring (i);
					break;
				}
				else
				{
					if (decimalDigits == 0)
					{
						valueAndUnits.value *= 10;
						valueAndUnits.value += timeDigit;
					}
					else
					{
						valueAndUnits.value += (ch - '0') * (1 / (Math.pow (10, decimalDigits)));
						decimalDigits++;
					}
				}
			}
		}
	}
	else
	{
		valueAndUnits.value = inDefaultValue;
	}
		
	return valueAndUnits;
}

monohm.String.parseTokens = function (inString)
{
	var	elements = new Array ();
	var	element = "";
	var	quoteCharacter = null;
	var	quotedElement = false;
	
	for (var i = 0; i < inString.length; i++)
	{
		var	ch = inString.charAt (i);

		if (ch == quoteCharacter)
		{
			quoteCharacter = null;
			
			// have to ensure we don't refuse a zero length quoted element here
			// but we can't take it yet
			if (element.length == 0)
			{
				quotedElement = true;
			}
		}
		else
		if (ch == '\\')
		{
			if (i < (inString.length - 1))
			{
				i++;
				element += inString.charAt (i);
			}
			else
			{
				element += ch;
			}
		}
		else
		if (ch == '\'' || ch == '"')
		{
			quoteCharacter = ch;
		}
		else
		if (ch == ' ')
		{
			if (quoteCharacter)
			{
				element += ch;
			}
			else
			{
				if (quotedElement || element.length)
				{
					elements.push (element);
					element = "";
					quotedElement = false;
				}
			}
		}
		else
		{
			element += ch;
		}
	}
	
	if (quotedElement || element.length)
	{
		elements.push (element);
	}

	return elements;
}

monohm.String.replaceAll = function (inString, inReplace, inWith)
{
	return inString.split (inReplace).join (inWith);
}

monohm.String.smartJoin = function (inArray, inDelimiter)
{
	var	joined = "";
	
	for (var i = 0; i < inArray.length; i++)
	{
		var	element = inArray [i];
		
		if (element && element.length)
		{
			if (joined.length > 0)
			{
				joined += inDelimiter;
			}
			
			joined += element;
		}
	}
	
	return joined;
}

monohm.String.stripSpaces = function (inString)
{
	return inString.replace (/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
}

monohm.String.startsWith = function (inString, inPrefix)
{
	var	starts = false;
	
	if (inString.length >= inPrefix.length)
	{
		starts = inString.substr (0, inPrefix.length) == inPrefix;
	}
	
	return starts;
}

monohm.String.validateEmailAddress = function (inAddress)
{
	var	valid = inAddress.length > 0;
	
	var	hadAt = false;
	var	local = "";
	var	domainElements = [];

	var	buffer = "";
	
	for (var i = 0; i < inAddress.length; i++)
	{
		var	ch = inAddress.charAt (i);
		
		if (ch == "@")
		{
			if (hadAt)
			{
				// console.error ("rejecting email address " + inAddress + " due to extra @ symbols");
				valid = false;
				break;
			}

			if (buffer.length === 0)
			{
				// console.error ("rejecting email address " + inAddress + " due to zero length local element");
				valid = false;
				break;
			}
			
			local = buffer;
			buffer = "";
			
			hadAt = true;
		}
		else
		if (ch == ".")
		{
			if (hadAt)
			{
				if (buffer.length === 0)
				{
					// console.error ("rejecting email address " + inAddress + " due to empty domain element");
					valid = false;
					break;
				}
				
				domainElements [domainElements.length] = buffer;
				buffer = "";
			}
			else
			{
				buffer += ch;
			}
		}
		else
		if ((ch >= "a" && ch <= "z") ||
			(ch >= "A" && ch <= "Z") ||
			(ch >= "0" && ch <= "9") ||
			("!#$%&'*+-/=?^_`{|}~".indexOf (ch) >= 0))
		{
			buffer += ch;
		}
		else
		{
			// console.error ("rejecting email address " + inAddress + " due to bad character " + ch);
			valid = false;
			break;
		}
	}

	if (valid && (buffer.length > 0))
	{
		if (hadAt)
		{
			domainElements [domainElements.length] = buffer;
		}
		else
		{
			local = buffer;
		}
	}
	
	// ASSUME already checked:
	// local length
	// individual domain element length
	// 
	
	if (valid && (! hadAt))
	{
		// console.error ("rejecting email address " + inAddress + " due to no @ character");
		valid = false;
	}
	
	if (valid && (domainElements.length < 2))
	{
		// console.error ("rejecting email address " + inAddress + " due to insufficient domain elements");
		valid = false;
	}
	
	if (valid && (domainElements [domainElements.length - 1].length < 2))
	{
		// console.error ("rejecting email address " + inAddress + " due to short final domain element");
		valid = false;
	}
	
	return valid;
};
