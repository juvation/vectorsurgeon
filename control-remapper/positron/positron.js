/*
Copyright (c) 2014 Monohm Inc.

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
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

// have to ensure positron is made in a Node-compatible way
monohm.provide ("positron.Dummy");

positron.provide = function (inProvided)
{
	console.error ("positron.provide() is deprecated, please use monohm.provide() instead");
	monohm.provide (inProvided);
};

positron.require = function (inRequired)
{
	console.error ("positron.require() is deprecated, please use monohm.require() instead");
	monohm.require (inRequired);
};

positron.inherits = function (inSubClass, inSuperClass)
{
	console.error ("positron.inherits() is deprecated, please use monohm.inherits() instead");
	monohm.inherits (inSubClass, inSuperClass);
};


/**
*
* @license
* Copyright 2014 Monohm Inc.	All rights reserved.
*
**/

// analytics.js
// dummy & default implementations of the analytics interface

monohm.provide ("positron.Analytics");
monohm.provide ("positron.DummyAnalytics");

/**
 * @constructor
 */
positron.Analytics =
function positron_Analytics ()
{
	if (this.appID)
	{
		console.error ("Analytics constructed twice?!?");
	}
	else
	{
		this.appID = gApplication.getConfigEntry ("analytics.appID");
		this.url = gApplication.getConfigEntry ("analytics.captureURL");
		this.batchSize = gApplication.getConfigEntryWithDefault ("analytics.batchSize", 5);
		this.maxErrorCount = gApplication.getConfigEntryWithDefault ("analytics.maxErrorCount", 5);
		
		this.batch = new Array ();
		
		// if the upload error count reaches the maximum
		// then basically the queue shuts down
		this.errorCount = 0;
	
		// determine the app instance ID from the name and a timestamp
		// there is no way of making this really unique, btw
		var	now = new Date ();
		
		// hopefully this is pretty unique :-)
		this.instanceID = "" + this.appID + "-" + now.getTime () + "-" + Math.floor (Math.random () * 100);
		
		this.fire
		({
			timestamp: new Date ().getTime (),
			domain: "analytics",
			name: "startup"
		});
	}
};

positron.Analytics.prototype.checkBatch =
function Analytics_checkBatch ()
{
	if (!this.sending && (this.batch.length >= this.batchSize))
	{
		this.flushBatch ();
	}
};

positron.Analytics.prototype.flushBatch =
function Analytics_flushBatch ()
{
	if (gApplication.isLogging (gApplication.kLogAnalytics)) console.log ("Analytics.flushBatch()");
	if (gApplication.isLogging (gApplication.kLogAnalytics)) console.log (this.batch.length + " records in batch");

	var	query = "app_id=" + this.appID + "&instance_id=" + this.instanceID + "&";
	
	for (var i = 0; i < this.batch.length; i++)
	{
		var	event = this.batch [i];
		
		for (var property in event)
		{
			if (event.hasOwnProperty (property))
			{
				var	value = event [property];
				
				if (typeof (value) == "string")
				{
					if (value && value.length)
					{
						// TODO should we escape here?
						query += property + "_" + i + "=" + event [property] + "&";
					}
				}
				else
				if (typeof (value) == "number")
				{
					query += property + "_" + i + "=" + event [property] + "&";
				}
			}
		}
	}
	
	if (gApplication.isLogging (gApplication.kLogAnalytics)) console.log (this.url);
	if (gApplication.isLogging (gApplication.kLogAnalytics)) console.log (query);
	
	this.sending = true;
	
	var	self = this;
	
	monohm.Network.ajax
	({
		url: this.url,
		data: query,
		dataType: "json",
		async: true,
		type: "POST",
		success: function (inData, inTextStatus, inXHR)
		{
			if (gApplication.isLogging (gApplication.kLogAnalytics)) console.log ("analytics capture successful");
			
			self.sending = false;
			self.errorCount = 0;
			self.batch.length = 0;
		},
		error: function (inXHR, inTextStatus, inError)
		{
			console.error ("analytics report error");
			console.error (inTextStatus);
			
			self.sending = false;
			self.errorCount++;
			
			if (self.errorCount >= self.maxErrorCount)
			{
				// reporting is hosed, shut down
				if (gApplication.isLogging (gApplication.kLogAnalytics))
				{
					console.error ("max analytics upload error count reached, shutting down");
				}
				
				self.batch.length = 0;
			}
		}
	});


};

positron.Analytics.prototype.fire =
function Analytics_fire (inEvent)
{
	if (this.errorCount < this.maxErrorCount)
	{
		if (gApplication.isLogging (gApplication.kLogAnalytics))
			console.log ("Analytics.report() " + inEvent.domain + "/" + inEvent.page + "/" + inEvent.view + "/" + inEvent.name + "/" + inEvent.detail);

		if (inEvent.domain && inEvent.timestamp && inEvent.name)
		{
			var	event = new Object ();
			
			// fyi, these property names are the http post parameter name stems
			// note we only send appID and instanceID once (good)
			event.timestamp = inEvent.timestamp;
			event.domain = inEvent.domain;
			event.page = inEvent.page;
			event.view = inEvent.view;
			event.name = inEvent.name;
			event.detail = inEvent.detail;
			
			this.batch.push (event);
			
			this.checkBatch ();
		}
		else
		{
			console.error ("malformed event");
			console.error ("domain = " + inEvent.domain);
			console.error ("name = " + inEvent.name);
			console.error ("timestamp = " + inEvent.timestamp);
		}
	}
	else
	{
		// if we log here, then we will log a *lot*
	}
};

// DummyAnalytics
// the analytics handler installed by default, does nothing

/**
 * @constructor
 */
positron.DummyAnalytics =
function positron_DummyAnalytics ()
{
	positron.Analytics.call (this);
	
	if (gApplication.isLogging (gApplication.kLogAnalytics)) console.log ("DummyAnalytics() with app name " + this.appName);
};
monohm.inherits (positron.DummyAnalytics, positron.Analytics);

positron.DummyAnalytics.prototype.fire =
function DummyAnalytics_fire (inEvent)
{
	if (gApplication.isLogging (gApplication.kLogAnalytics))
	{
		console.log ("Analytics.fire() " + inEvent.domain + "/" + inEvent.page + "/"
			+ inEvent.view + "/" + inEvent.name + "/" + inEvent.detail);
	}
};

// GoogleAnalytics


/*

GA init code, put in index.html etc

<script type="text/javascript">

	var	account = 'UA-XXXXXXXX-X';
	
  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', testAccount]);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>


*/

// assume that the ga stuff has been initialised
// and that _setAccount has been called
// and that _trackPageview has been called for the root page
positron.GoogleAnalytics =
function positron_GoogleAnalytics ()
{
}

positron.GoogleAnalytics.prototype.fire =
function GoogleAnalytics_fire (inEvent)
{
	// for now only report actual page visible transitions
	// maybe we will do more in future!
	if (inEvent.name == "visible" && inEvent.view == null)
	{
		console.log ("GoogleAnalytics.fire() page url: " + document.location.href);
		
		if (typeof (_gaq) == "object")
		{
			// log with a url override
			// as GA might well decide that Positron apps are always on the index page (sigh)
			_gaq.push (["_trackPageview", document.location.href]);
		}
		else
		{
			if (! this.reportedError)
			{
				console.error ("GA unavailable, can't fire event");
				this.reportedError = true;
			}
		}
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc. All rights reserved.
*
**/

// positron.Cache.js

/**
 * @constructor
 */
positron.Cache = function (inWindow)
{
if (gApplication.isLogging (gApplication.kLogCache)) console.log ("Cache()");

  this.cache = new Object ();
  this.lifeTimes = new Object ();
  this.accessTimes = new Object ();
  
  // for callbacks
  var self = this;
  
  // gc once a minute
  this.purgeTask = setInterval
  (
    function ()
    {
      self.garbageCollect ();
    },
    60000
  );
};

positron.Cache.prototype.get = function (inKey)
{
  var value = this.cache [inKey];
  
  if (value)
  {
    this.accessTimes [inKey] = new Date ().getTime ();
  }

  return value;
};

positron.Cache.prototype.put = function (inKey, inValue, inLifeTime)
{
  this.cache [inKey] = inValue;
  
  if (! inLifeTime)
  {
    // default lifetime = 30s
    inLifeTime = 30000;
  }

  if (gApplication.isLogging (gApplication.kLogCache))
  	console.log ("Cache.put() with key " + inKey + " and lifetime " + inLifeTime);
  
  this.lifeTimes [inKey] = inLifeTime;
  this.accessTimes [inKey] = new Date ().getTime ();
};

positron.Cache.prototype.flush = function (inKey)
{
  if (gApplication.isLogging (gApplication.kLogCache))
  	console.log ("Cache.flush(" + inKey + ")");

	delete this.cache [inKey];
};

positron.Cache.prototype.flushAll = function ()
{
  if (gApplication.isLogging (gApplication.kLogCache))
  	console.log ("Cache.flushAll()");

	for (var key in this.cache)
	{
		if (this.cache.hasOwnProperty (key))
		{
			this.flush (key);
		}
	}
};

positron.Cache.prototype.garbageCollect = function ()
{
  var collected = 0;
  
  var now = new Date ().getTime ();
  
  for (var key in this.cache)
  {
    var lifeTime = this.lifeTimes [key];
    
    if (typeof (lifeTime) == "number")
    {
      // OK we have a good "key", can proceed
      
      var accessTime = this.accessTimes [key];
      
      if ((now - accessTime) > lifeTime)
      {
        delete this.cache [key];
        delete this.lifeTimes [key];
        delete this.accessTimes [key];
        
        collected++;
      }
    }
  }
  
  if (collected > 0)
  {
    if (gApplication.isLogging (gApplication.kLogCache))
    	console.log ("Cache garbage collected " + collected + " entries");
  }
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.CSS");

positron.CSS = new Object ();

// this isn't necessarily prefixed, as we map the other way, too...
positron.CSS.getBrowserEntity = function (inPropertyName, inEntityTable)
{
	var	prefixedPropertyName = inPropertyName;
	
	if (gApplication.browser.type && gApplication.browser.type.length)
	{
		var	browser = inEntityTable [gApplication.browser.type];
		
		if (!browser)
		{
			console.error ("CSS.getBrowserEntity() does not support browser type: " + gApplication.browser.type);
			browser = inEntityTable ["default"];
		}
		
		prefixedPropertyName = browser [inPropertyName];
		
		if (!prefixedPropertyName || !prefixedPropertyName.length)
		{
			console.error ("CSS.getBrowserEntity() has no property map for : " + inPropertyName);
			prefixedPropertyName = inPropertyName;
		}
	}
	else
	{
		console.error ("CSS.getBrowserEntity() can't determine browser type");
	}
	
	// console.log ("return " + prefixedPropertyName);

	return prefixedPropertyName;
}

positron.CSS.getPrefixedEvent = function (inEventName)
{
	// console.log ("CSS.getPrefixedEvent(" + inEventName + ")");
	
	return positron.CSS.getBrowserEntity (inEventName, gApplication.getConfigEntry ("prefixed-events"));
}

positron.CSS.getPrefixedProperty = function (inPropertyName)
{
	// console.log ("CSS.getPrefixedProperty(" + inPropertyName + ")");
	
	return positron.CSS.getBrowserEntity (inPropertyName, gApplication.getConfigEntry ("prefixed-properties"));
}

positron.CSS.getRatifiedProperty = function (inPropertyName)
{
	// console.log ("CSS.getRatifiedProperty(" + inPropertyName + ")");
	
	return positron.CSS.getBrowserEntity (inPropertyName, gApplication.getConfigEntry ("ratified-properties"));
}

// parses ONE property, but may end up with several values
// eg for transform stuffz
positron.CSS.parsePropertyValue = function (inText)
{
	// console.log ("CSS.parsePropertyValue() on " + inText);
	
	var	values = new Object ();
	
	// HACK ensure we don't fall over constructs like (0px, 0px) etc in the split below
	// this is stupid and we should do it right
	inText = inText.split (", ").join (",");
	
	var	valueElements = inText.split (" ");
	
	for (var i = 0; i < valueElements.length; i++)
	{
		var	valueElement = valueElements [i];

		var	value = new Object ();
		value.parameters = new Array ();

		var	openParenIndex = valueElement.indexOf ("(");
		
		if (openParenIndex > 0)
		{
			value.value = valueElement.substring (0, openParenIndex);
			
			var	closeParenIndex = valueElement.indexOf (")", openParenIndex);
			
			// thankfully we can assume that the browser's CSS parser will reject
			// any badly formed style
			var	parameterString = valueElement.substring (openParenIndex + 1, closeParenIndex);
			var	parameterStringElements = parameterString.split (",");
			
			for (var j = 0; j < parameterStringElements.length; j++)
			{
				var	parameterStringElement = parameterStringElements [j];
				var	parameterValueAndUnits = monohm.String.parseValueAndUnits (parameterStringElement, 0, "");
				
				value.parameters.push (parameterValueAndUnits);
			}
		}
		else
		{
			value.value = valueElement;
		}
		
		values [value.value] = value;
	}

	return values;	
}

positron.CSS.parseStyle = function (inElement)
{
	var	styles = new Object ();
	
	var	style = inElement.getAttribute ("style");

	if (style && style.length)
	{
		var	declarations = style.split (";");
	
		for (var i = 0; i < declarations.length; i++)
		{
			var	declaration = monohm.String.stripSpaces (declarations [i]);

			if (declaration && declaration.length)
			{
				var	colonIndex = declaration.indexOf (":");
				
				if (colonIndex > 0)
				{
					var	property = monohm.String.stripSpaces (declaration.substring (0, colonIndex));

					if (property && property.length)
					{
						var	value = monohm.String.stripSpaces (declaration.substring (colonIndex + 1));
						var	values = positron.CSS.parsePropertyValue (value);
						
						styles [property] = values;
					}
					else
					{
						console.error ("rejecting blank property from: " + declaration);
					}
				}
				else
				{
					console.error ("rejecting declaration: " + declaration);
				}
			}
			else
			{
				// this happens all the time if the style has a ; at the end
				// so don't bother logging it
				// console.error ("empty declaration in style");
			}
		}
	}
	else
	{
		// this will happen all the time, too
		// console.error ("parseStyle() with empty style attribute");
	}

	return styles;
}

positron.CSS.unparsePropertySubvalue = function (inValue)
{
	var	valueString = inValue.value;
	
	if (value.parameters.length > 0)
	{
		valueString += "(";

		for (var i = 0; i < value.parameters.length; i++)
		{
			if (i > 0)
			{
				valueString += ",";
			}
			
			valueString += value.parameters [i].value;
			valueString += value.parameters [i].units;
		}
		
		valueString += ")";
	}

	return valueString;		
}

positron.CSS.unparsePropertyValue = function (inValues)
{
	var	valueStrings = new Array ();
	
	for (var value in inValues)
	{
		valueStrings.push (positron.CSS.unparsePropertySubvalue (inValues [value]));
	}
	
	return valueStrings.join (" ");
}

positron.CSS.unparseStyle = function (inStyles)
{
	var	styleStrings = new Array ();
	
	for (var property in inStyles)
	{
		var	style = inStyles [property];
		
		styleStrings.push (positron.CSS.unparsePropertyValue (style));
	}
	
	return styleStrings.join ("; ");
}


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.DOM");

positron.DOM = new Object ();

// hopefully we won't need too much here
// on account of adopting jQuery an' all
// however, jQuery only selects *elements*
// so sometimes we need the regular DOM API

positron.DOM.addClass = function (inElement, inClassName)
{
	monohm.DOM.addClass (inElement, inClassName);
};

positron.DOM.addPrefixedClass = function (inElement, inClassName)
{
	monohm.DOM.addClass (inElement, gApplication.getCSSClassPrefix () + inClassName);
}

// load a script using <script> and onload/error handlers
// safe and async
positron.DOM.addScript = function (inURL, inCallback)
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

positron.DOM.addStyleSheet = function (inURL, inViewPageName, inPage)
{
	var cssAttributeName = null;
	
	if (inViewPageName)
	{
		if (inPage)
		{
			cssAttributeName = gApplication.getAttributePrefix () + "page";
		}
		else
		{
			cssAttributeName = gApplication.getAttributePrefix () + "view";
		}
	}
	
	// catch potential jquery issues here with bad or odd view names
	try
	{
		var	viewCSSInclude = false;
		
		if (inViewPageName)
		{
			viewCSSInclude = document.querySelector ("head [" + cssAttributeName + "=" + inViewPageName + "]");
		}
		
		if (!viewCSSInclude)
		{
			var	cssPath = null;
			
			if (inPage)
			{
				cssPath = gApplication.getPageCSSPath (inViewPageName);
			}
			else
			{
				cssPath = gApplication.getViewCSSPath (inViewPageName);
			}
			
			var	link = document.createElement ("link");
			link.setAttribute ("href", cssPath);
			link.setAttribute ("type", "text/css");
			link.setAttribute ("rel", "stylesheet");
			link.setAttribute ("media", "screen,print");
			
			if (inViewPageName)
			{
				link.setAttribute (cssAttributeName, inViewPageName);
			}

			var	head = document.querySelector ("head");
			var	last = head.querySelector ("link:last-of-type");
	
			if (last && last.nextSibling)
			{
				head.insertBefore (link, last.nextSibling);
			}
			else
			{
				head.appendChild (link);
			}
		}
	}
	catch (inError)
	{
		console.error ("error adding style tag for view/page (" + inViewPageName + ")");
		console.error (inError);
	}
}

// inParent: old parent node
// inNewParent: new parent node
positron.DOM.copyChildren = function (inParent, inNewParent)
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
		console.error ("positron.DOM.copyChildren() passed bad parent");
		console.error (inParent);
	}
};

positron.DOM.createEvent = function (inType, inDetail)
{
	return monohm.DOM.createEvent (inType, inDetail);
}

positron.DOM.dispatchEvent = function (inElement, inType, inDetail)
{
	monohm.DOM.dispatchEvent (inElement, inType, inDetail);
}

// after much back and forth, decided to trust getAttribute()
// i think the problem is that if (value) fails if value is a zero length string
// i blamed getAttribute() for so long, but Js is to blame really

// inElement: DOM element
// inParam: attribute name
// return: string
positron.DOM.getAttributeValue = function (inElement, inAttributeName)
{
	return inElement.getAttribute (inAttributeName);
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: string
positron.DOM.getAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	result = positron.DOM.getAttributeValue (inElement, inParam);
	
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
positron.DOM.getBooleanAttributeValue = function (inElement, inParam)
{
	return positron.DOM.getBooleanAttributeValueWithDefault (inElement, inParam, false);
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: boolean
positron.DOM.getBooleanAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	value = positron.DOM.getAttributeValue (inElement, inParam);
	
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

positron.DOM.getCompositeElements = function (inElement, inViewKeyAttributeName, inSelectorAttributeName)
{
	var	viewKey = inElement.getAttribute (inViewKeyAttributeName);
	var	selector = inElement.getAttribute (inSelectorAttributeName);

	return positron.DOM.resolveCompositeElements (inElement, viewKey, selector);
}

positron.DOM.getData = function (inElement, inKey)
{
	var	data = null;
	
	if (inElement && inElement.data)
	{
		if (inKey && inKey.length)
		{
			data = inElement.data [inKey];
		}
		else
		{
			// no key - pass entire map back
			data = inElement.data;
		}
	}
	
	return data;
};

// gets a date from an element via one of two methods
// datekey attribute contains the key of a date in context
// year/month/day/hour/minute/second/millisecond attributes
// once a null is detected in the discrete fields, the remainder are ignored
positron.DOM.kDateAttributes = 
{
	"year" : 0,
	"month" : 1,
	"month1" : 1,
	"day" : 2,
	"hour" : 3,
	"minute" : 4,
	"second" : 5,
	"millisecond" : 6
};

positron.DOM.getDate = function (inElement, inContext)
{
	var	date = null;
	
	var	dateKey = inElement.getAttribute ("datekey");
	var	dateString = inElement.getAttribute ("string");
	var	msString = inElement.getAttribute ("ms");
	
	if (dateKey && dateKey.length)
	{
		date = gApplication.getContextReference (dateKey, inContext);
		
		if (date && date.getTime)
		{
			// date checks out
		}
		else
		{
			date = null;
		}
	}
	else
	if (dateString && dateString.length)
	{
		date = new Date (dateString);
	}
	else
	if (msString && msString.length)
	{
		var	ms = parseInt (msString);
		
		if (! isNaN (ms))
		{
			date = new Date (ms);
		}
	}
	else
	{
		// default all the fields to now
		// so we never get gaps in the array
		var	now = new Date ();

		var	dateFields = new Array ();
		dateFields [0] = now.getFullYear ();
		dateFields [1] = now.getMonth ();
		dateFields [2] = now.getDate ();
		dateFields [3] = now.getHours ();
		dateFields [4] = now.getMinutes ();
		dateFields [5] = now.getSeconds ();
		dateFields [6] = now.getMilliseconds ();
		
		for (var attribute in positron.DOM.kDateAttributes)
		{
			var	attributeString = inElement.getAttribute (attribute);
			
			if (attributeString && attributeString.length)
			{
				var	value = parseInt (attributeString);
				
				if (isNaN (value))
				{
					console.error ("DOM.getDate() with bad attribute: "
						+ positron.DOM.kDateAttributes [i] + "=" + attributeString);

					break;
				}

				// there's a special place in hell for the guy who zero-based months
				if (attribute.toLowerCase () == "month1")
				{
					value--;
				}
				
				var	index = positron.DOM.kDateAttributes [attribute];
				dateFields [index] = value;
			}
			else
			{
				// we allow gaps in the date fields - at dev's risk
			}
		}

		// this is fucking stupid and Javascript should be ashamed
		// can't use apply() on Date - tried various ways and nothing worked
		date = new Date (dateFields [0], dateFields [1], dateFields [2], dateFields [3], dateFields [4], dateFields [5], dateFields [6]);
	}
	
	return date;
};

// inElement: DOM element
// inParam: attribute name
// return: int
positron.DOM.getIntAttributeValue = function (inElement, inParam)
{
	return positron.DOM.getIntAttributeValueWithDefault (inElement, inParam, 0);
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: int
positron.DOM.getIntAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	value = positron.DOM.getAttributeValue (inElement, inParam);
	
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
positron.DOM.getFloatAttributeValue = function (inElement, inParam)
{
	return positron.DOM.getFloatAttributeValueWithDefault (inElement, inParam, 0);
};

// inElement: DOM element
// inParam: attribute name
// inDefault: default value
// return: int
positron.DOM.getFloatAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	value = positron.DOM.getAttributeValue (inElement, inParam);
	
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

positron.DOM.getParentView = function (inNode)
{
	var	view = null;
	
	// do NOT start with the current node
	// as this will cause the cancellation of event handlers on the view element
	// even though the view element itself is staying put during a refresh
	for (var parentNode = inNode.parentNode; parentNode; parentNode = parentNode.parentNode)
	{
		view = positron.DOM.getData (parentNode, "view");
		
		if (view)
		{
			break;
		}
	}
	
	// this is an error
	// every node should at least have Window as a view
	if (!view)
	{
		console.error ("could not find parent view for node...");
		console.error (inNode);
		console.error ("likely due to overlapping refreshes?");

		/*
		console.error (new Error ().stack);
		
		console.error ("dumping parents...");
		for (var parentNode = inNode; parentNode; parentNode = parentNode.parentNode)
		{
			console.log (parentNode);
		}
		*/
		
		view = gApplication.window;
	}
	
	return view;
}

positron.DOM.getPrefixedAttribute = function (inElement, inAttributeName)
{
	return inElement.getAttribute (gApplication.getAttributePrefix () + inAttributeName);
}

positron.DOM.getPrefixedAttributeName = function (inAttributeName)
{
	return gApplication.getAttributePrefix () + inAttributeName;
}

// returns the parent view that is in the process of refreshing
// used by view.refresh() to disallow subviews refreshing while their parent is at it
positron.DOM.getRefreshingParentView = function (inNode)
{
	var	view = null;
	
	for (var parentNode = inNode.parentNode; parentNode; parentNode = parentNode.parentNode)
	{
		view = positron.DOM.getData (parentNode, "view");
		
		if (view && view.isRefreshing ())
		{
			break;
		}
	}
	
	return view;
}

// inElement: DOM element
// inParam: attribute name
// return: int
positron.DOM.getTimeAttributeValue = function (inElement, inParam)
{
	var	value = positron.DOM.getAttributeValue (inElement, inParam);
	
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
positron.DOM.getTimeAttributeValueWithDefault = function (inElement, inParam, inDefault)
{
	var	value = positron.DOM.getAttributeValue (inElement, inParam);
	
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

positron.DOM.hasChildren = function (inElement)
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

positron.DOM.hasClass = function (inElement, inClassName)
{
	var	has = false;
	
	// i've seen this... don't know how
	if (inElement.classList)
	{
		has = inElement.classList.contains (inClassName);
	}
	else
	{
		console.log ("null class list for ");
		console.log (inElement);
	}

	return has;
};

positron.DOM.hasPrefixedClass = function (inElement, inClassName)
{
	return positron.DOM.hasClass (inElement, gApplication.getCSSClassPrefix () + inClassName);
}

positron.DOM.insertChildrenBefore = function (inParentElement, inBeforeElement)
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
positron.DOM.isValidNode = function (inNode)
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

positron.DOM.moveChildren = function (inParent, inNewParent)
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

positron.DOM.queryPrefixedAttribute = function (inElement, inAttributeName)
{
	return inElement.querySelectorAll ("[" + gApplication.getAttributePrefix () + inAttributeName + "]");
}

positron.DOM.removeChildren = function (inElement)
{
	while (inElement.hasChildNodes ())
	{
		inElement.removeChild (inElement.firstChild);
	}
}

positron.DOM.removeClass = function (inElement, inClassName)
{
	inElement.classList.remove (inClassName);
};

positron.DOM.removeNode = function (inNode)
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

positron.DOM.removePrefixedAttribute = function (inElement, inAttributeName)
{
	inElement.removeAttribute (gApplication.getAttributePrefix () + inAttributeName);
}

positron.DOM.removePrefixedClass = function (inElement, inClassName)
{
	positron.DOM.removeClass (inElement, gApplication.getCSSClassPrefix () + inClassName);
}

positron.DOM.replaceWithChildren = function (inElement)
{
	// console.log ("DOM.replaceWithChildren()");
	// console.log (inElement);
	// console.log (inElement.parentNode);
	
	positron.DOM.insertChildrenBefore (inElement, inElement);
  
  if (inElement.parentNode)
  {
    inElement.parentNode.removeChild (inElement);
  }
};

positron.DOM.requestAnimationFrame = function (inCallback)
{
	if (!window.requestAnimationFrame)
	{
		window.requestAnimationFrame = window.mozRequestAnimationFrame ||
																	 window.webkitRequestAnimationFrame ||
																	 window.msRequestAnimationFrame; // if we... still care
	}
	
	window.requestAnimationFrame (inCallback);
};

positron.DOM.resolveCompositeElements = function (inElement, inViewKey, inSelector)
{
	var	viewElement = null;

	if (inViewKey && inViewKey.length)
	{
		var	view = null;
		
		if (inViewKey == gApplication.getCSSClassPrefix () + "this-view-key")
		{
			view = positron.DOM.getParentView (inElement);
		}
		else
		{
			view = gApplication.getView (inViewKey);
		}
		
		if (view)
		{
			viewElement = view.element;
		}
		else
		{
			console.error ("resolveCompositeElements() cannot find view with key " + inViewKey);
		}
	}

	var	elements = null;

	if (inSelector && inSelector.length)
	{
		if (inSelector == "this-element")
		{
			console.log
				("this-element is deprecated, please use " + gApplication.getCSSClassPrefix () + "this-element instead");
			
			elements = [inElement];
		}
		else
		if (inSelector == gApplication.getCSSClassPrefix () + "this-element")
		{
			elements = [inElement];
		}
		else
		{
			if (!viewElement)
			{
				viewElement = document;
			}
			
			elements = viewElement.querySelectorAll (inSelector);
		}
	}
	else
	{
		if (viewElement)
		{
			elements = [viewElement];
		}
		else
		{
			elements = new Array ();
		}
	}
	
	return elements;
}

// if the array has one element, then handle as selector
// if the array has multiple elements, then handle as view/selector
// saves huge code in all clients
positron.DOM.resolveCompositeElementsArray = function (inElement, inArray)
{
	var	elements = null;
	
	if (inArray && Array.isArray (inArray) && (inArray.length > 0))
	{
		if (inArray.length > 1)
		{
			elements = positron.DOM.resolveCompositeElements (inElement, inArray [0], inArray [1]);
		}
		else
		{
			elements = positron.DOM.resolveCompositeElements (inElement, null, inArray [0]);
		}
	}
	else
	{
		console.error ("resolveCompositeElementsArray() with empty array");
		elements = new Array ();
	}
	
	return elements;
}

positron.DOM.setData = function (inElement, inKey, inValue)
{
	if (! inElement.data)
	{
		inElement.data = new Object ();
	}
	
	inElement.data [inKey] = inValue;
};

positron.DOM.setPrefixedAttribute = function (inElement, inAttributeName, inAttributeValue)
{
	inElement.setAttribute (gApplication.getAttributePrefix () + inAttributeName, inAttributeValue);
}

positron.DOM.toggleClass = function (inElement, inClassName)
{
	inElement.classList.toggle (inClassName);
}

positron.DOM.togglePrefixedClass = function (inElement, inClassName)
{
	positron.DOM.toggleClass (inElement, gApplication.getCSSClassPrefix () + inClassName);
}

// Loader.js

monohm.provide ("positron.Loader");

/**
 * @constructor
 */
positron.Loader = function (inCallbackObject, inLoaderCount)
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Loader().add()");

  this.callbackObject = inCallbackObject;
  
  if (typeof (inLoaderCount) == "number" && inLoaderCount > 0)
  {
  	this.loaderCount = inLoaderCount;
  }
  else
  {
  	this.loaderCount = 2;
  }
  
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("loader count is " + this.loaderCount);

  // the number of active loads
  this.loadCount = 0;
  
  // this advances with each asset load until the queue is exhausted
  // at which point it is reset
  this.assetIndex = 0;
  
  // this advances with each asset addition until the queue is exhausted
  // at which point it is reset
  this.assetCount = 0;

  this.queue = new Array ();
  
};

positron.Loader.prototype.add = function (inOneOrMany, inRunOnAdd)
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Loader.add()");

  var running = this.queue.length > 0;
  
  if (typeof (inOneOrMany) == "object" && typeof (inOneOrMany.length) == "number"
    && inOneOrMany.length > 0)
  {
    for (var i = 0; i < inOneOrMany.length; i++)
    {
      this.add (inOneOrMany [i], false);
    }
    
    if (! running)
    {
      this.fireStartCallback ();

      for (var i = 0; i < this.loaderCount; i++)
      {
	      this.run ();
			}
    }
  }
  else
  if (typeof (inOneOrMany) == "string")
  {
    this.queue.push (inOneOrMany);
    
    this.assetCount++;
    
    // if the loader is already running, don't start it
    if (! running)
    {
      var run = true;
      
      if (typeof (inRunOnAdd) != "undefined")
      {
        run = inRunOnAdd;
      }
      
      if (run)
      {
        this.fireStartCallback ();

				for (var i = 0; i < this.loaderCount; i++)
				{
					this.run ();
				}
      }
    }
  }
};

positron.Loader.prototype.run = function ()
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Loader.run() with queue length of " + this.queue.length);

  if (this.queue.length > 0)
  {
    var url = this.queue.shift ();

		if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Loader.run() loading url: " + url);
    
    // i'd make these callbacks methods, but js won't let me
    var self = this;
      
    if (this.isImageURL (url))
    {
      var image = new Image ();
      
      image.onload = function ()
      {
        self.onLoad (url);
      }
      
      image.onerror = function ()
      {
        self.onLoadError (url);
      }

			this.loadCount++;
      image.src = url;
    }
    else
    {
      var xhr = new XMLHttpRequest ();
      
      xhr.onreadystatechange = function ()
      {
        if (this.readyState == 4)
        {
          // status is 0 for success if loading off the filesystem
          // status is 200 for success if loading off the network
          if (this.status == 0 || this.status == 200)
          {
            self.onLoad (url);
          }
          else
          {
            self.onLoadError (url);
          }
        }
      };
      
      this.loadCount++;
      
      xhr.open ("GET", url, true);
      xhr.send ();
    }
  }
};

positron.Loader.prototype.isRunning = function ()
{
	return this.loadCount > 0;
};

// PRIVATE

positron.Loader.prototype.onLoad = function (inURL)
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Loader.onLoad() with " + inURL);

	this.loadCount--;
  this.assetIndex++;
  
  this.fireProgressCallback ();
  this.run ();
};

positron.Loader.prototype.onLoadError = function (inURL)
{
console.error ("Loader.onLoadError() with " + inURL);

	this.loadCount--;
  this.assetIndex++;

  this.fireProgressCallback ();
  this.run ();
};

positron.Loader.prototype.isImageURL = function (inURL)
{
  var lowerCaseURL = inURL.toLowerCase ();
  
  // handle the situation where there are arguments on t'end of the URL
  var	urlElements = lowerCaseURL.split ("?");
  var	urlStem = urlElements [0];
  
  return this.stringEndsWith (urlStem, ".jpg") || this.stringEndsWith (urlStem, ".jpeg")
    || this.stringEndsWith (urlStem, ".png") || this.stringEndsWith (urlStem, ".gif");
};

positron.Loader.prototype.stringEndsWith = function (inString, inSuffix)
{
  return inString.length > inSuffix.length && inString.substr (0 - inSuffix.length) == inSuffix;
};

positron.Loader.prototype.fireStartCallback = function ()
{
  if (this.callbackObject && (typeof (this.callbackObject.onLoadStart) == "function"))
  {
    this.callbackObject.onLoadStart (this);
  }
}

positron.Loader.prototype.fireFinishCallback = function ()
{
  if (this.callbackObject && (typeof (this.callbackObject.onLoadFinish) == "function"))
  {
    this.callbackObject.onLoadFinish (this);
  }
}

positron.Loader.prototype.fireProgressCallback = function ()
{
	var percentage = (this.assetIndex / this.assetCount) * 100;
    
  if (this.callbackObject && (typeof (this.callbackObject.onLoadProgress) == "function"))
  {
    this.callbackObject.onLoadProgress (this, this.assetIndex, this.assetCount, percentage);
  }
  
	if (percentage == 100)
	{
		this.fireFinishCallback ();

		// essentially reset the progress callbacks
		// until something else is added
		this.assetIndex = 0;
		this.assetCount = 0;
	}
}

monohm.provide ("positron.OAuth");

positron.OAuth = new Object ();

positron.OAuth.callService = function (inRequest, inCallback)
{
	var	headers = new Object ();
	headers ["Authorization"] = positron.OAuth.getAuthorisationHeader (inRequest);
	headers ["Content-Type"] = "application/x-www-form-urlencoded";

	var	self = this;
	
	monohm.Network.ajax
	({
		url: inRequest.url,
		data: monohm.Network.objectToURIData (inRequest.httpParameters),
		type: inRequest.method,
		headers: headers,
		dataType: inRequest.dataType,
		async: true,
		success: function (inData, inTextStatus, inXHR)
		{
			if (inRequest.dataType == "json" && typeof (inData) == "string")
			{
				inData = JSON.parse (inData);
			}
			
			try
			{
				inCallback (null, inData);
			}
			catch (inError)
			{
				console.error ("OAuth: error calling callback");
				console.error (inError);
				throw inError;
			}
		},
		error: function (inXHR, inTextStatus, inError)
		{
			console.log ("error() called");
			console.log (inError);
			inCallback (inError);
		}
	});
}

positron.OAuth.createRequest = function (inService)
{
	if (!inService)
	{
		throw new Error ("positron.OAuth.createRequest() called with no service name");
	}
	
	var	request = new Object ();
	request.service = inService;
	request.authParameters = new Object ();
	request.authParameters.oauth_consumer_key = gApplication.config.oauth [inService].consumer_key;
	request.authParameters.oauth_signature_method = "HMAC-SHA1";
	request.authParameters.oauth_version = "1.0";
	request.authParameters.oauth_timestamp = positron.OAuth.getTimestamp ();
	request.authParameters.oauth_nonce = positron.OAuth.getNonce ();
	request.httpParameters = new Object ();
	
	return request;
}

positron.OAuth.createRequest2 = function (inService)
{
	if (!inService)
	{
		throw new Error ("positron.OAuth.createRequest2() called with no service name");
	}
	
	var	request = new Object ();
	request.service = inService;
	request.authParameters = new Object ();
	request.authParameters.client_id = gApplication.config.oauth [inService].consumer_key;
	request.authParameters.oauth_signature_method = "HMAC-SHA1";
	request.authParameters.oauth_version = "1.0";
	request.authParameters.oauth_timestamp = positron.OAuth.getTimestamp ();
	request.authParameters.oauth_nonce = positron.OAuth.getNonce ();
	request.httpParameters = new Object ();
	
	return request;
}

positron.OAuth.deauthoriseService = function (inService)
{
	localStorage.removeItem ("positron_" + inService + "_request_token");
	localStorage.removeItem ("positron_" + inService + "_request_token_secret");

	localStorage.removeItem ("positron_" + inService + "_access_token");
	localStorage.removeItem ("positron_" + inService + "_access_token_secret");

	// arse protect
	
	localStorage.removeItem (inService + "_request_token");
	localStorage.removeItem (inService + "_request_token_secret");

	localStorage.removeItem (inService + "_access_token");
	localStorage.removeItem (inService + "_access_token_secret");
}

positron.OAuth.getAccessToken = function (inService)
{
	return localStorage ["positron_" + inService + "_access_token"];
}

positron.OAuth.getAccessTokenSecret = function (inService)
{
	return localStorage ["positron_" + inService + "_access_token_secret"];
}

positron.OAuth.getAuthorisationHeader = function (inRequest)
{
	var	header = "OAuth realm=\"\"";
	
	for (var key in inRequest.authParameters)
	{
		header += "," + key + "=\"" + positron.OAuth.percentEncode (inRequest.authParameters [key]) + "\"";
	}
	
	return header;
}

positron.OAuth.getBaseString = function (inRequest)
{
	var	parameters = new Array ();
	
	for (var key in inRequest.authParameters)
	{
		parameters.push
		({
			name: key,
			value: inRequest.authParameters [key]
		});
	}
	
	for (var key in inRequest.httpParameters)
	{
		parameters.push
		({
			name: key,
			value: inRequest.httpParameters [key]
		});
	}
	
	parameters.sort
	(
		function (inOne, inTwo)
		{
			var	result = 0;
			
			if (inOne.name < inTwo.name)
			{
				result = -1;
			}
			else
			if (inOne.name > inTwo.name)
			{
				result = 1;
			}
			
			return result;
		}
	);
	
	var	parameterString = "";
	
	for (var i = 0; i < parameters.length; i++)
	{
		if (parameterString.length > 0)
		{
			parameterString += "&";
		}
		
		// seems like the values are encoded here
		// AND the whole string is encoded, too
		parameterString += parameters [i].name + "=" + positron.OAuth.percentEncode (parameters [i].value);
	}
	
	return inRequest.method.toUpperCase () + "&"
		+ positron.OAuth.percentEncode (inRequest.url) + "&"
		+ positron.OAuth.percentEncode (parameterString);
}

positron.OAuth.kNonceCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";

positron.OAuth.getNonce = function ()
{
	var	nonce = "";
	
	for (var i = 0; i < 32; i++)
	{
		var	random = Math.floor (Math.random () * positron.OAuth.kNonceCharacters.length);
		nonce += positron.OAuth.kNonceCharacters.substr (random, 1);
	}
	
	return nonce;
}

positron.OAuth.getRequestToken = function (inService)
{
	return localStorage ["positron_" + inService + "_request_token"];
}

positron.OAuth.getRequestTokenSecret = function (inService)
{
	return localStorage ["positron_" + inService + "_request_token_secret"];
}

positron.OAuth.getSignature = function (inKey, inString)
{
	b64pad = "=";
	return b64_hmac_sha1 (inKey, inString);
}

positron.OAuth.getTimestamp = function ()
{
	return Math.floor (new Date ().getTime () / 1000);
}

// assumes the response fields don't need decoding
positron.OAuth.parseResponse = function (inResponseString)
{
	var	response = new Object ();
	var	elements = inResponseString.split ("&");

	for (var i = 0; i < elements.length; i++)
	{
		var	element = elements [i];
		var	index = element.indexOf ("=");
		var	name = element.substring (0, index);
		var	value = element.substring (index + 1);

		response [name] = value;
	}
	
	return response;
}

positron.OAuth.percentEncode = function (inString)
{
	var	s = encodeURIComponent (inString);

	// Now replace the values which encodeURIComponent doesn't do
	// encodeURIComponent ignores: - _ . ! ~ * ' ( )
	// OAuth dictates the only ones you can ignore are: - _ . ~
	// Source: http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Functions:encodeURIComponent
	s = s.replace (/\!/g, "%21");
	s = s.replace (/\*/g, "%2A");
	s = s.replace (/\'/g, "%27");
	s = s.replace (/\(/g, "%28");
	s = s.replace (/\)/g, "%29");

	return s;
}

positron.OAuth.saveState = function ()
{
	console.log ("positron.OAuth.saveState() stubbed");
}

positron.OAuth.setAccessTokens = function (inService, inAccessToken, inAccessTokenSecret)
{
	localStorage ["positron_" + inService + "_access_token"] = inAccessToken;
	localStorage ["positron_" + inService + "_access_token_secret"] = inAccessTokenSecret;
}

positron.OAuth.setRequestTokens = function (inService, inRequestToken, inRequestTokenSecret)
{
	localStorage ["positron_" + inService + "_request_token"] = inRequestToken;
	localStorage ["positron_" + inService + "_request_token_secret"] = inRequestTokenSecret;
	
	// setting the request tokens removes the access tokens
	localStorage.removeItem ("positron_" + inService + "_access_token");
	localStorage.removeItem ("positron_" + inService + "_access_token_secret");
}

monohm.provideStatic ("positron.Twitter");

// PRE-AUTHENTICATION APIS

// call in this order :-)

// note this requires consumer secret
positron.Twitter.getRequestToken = function (inCallback)
{
	console.log ("Twitter.getRequestToken()");
	
	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "POST";
	request.dataType = "text";
	request.url = "https://twitter.com/oauth/request_token";
	
	// need at least one HTTP parameter for some reason
	request.httpParameters.dummy = "yes";

	request.authParameters.oauth_callback = gApplication.config.oauth ["twitter"].callback;

	var	key = positron.OAuth.percentEncode (gApplication.config.oauth.twitter.consumer_secret) + "&";
	var	baseString = positron.OAuth.getBaseString (request);
	request.authParameters.oauth_signature = positron.OAuth.getSignature (key, baseString);

	positron.OAuth.callService
	(
		request,
		function (inError, inData)
		{
			if (inError)
			{
				inCallback (inError);
			}
			else
			{
				var	response = positron.OAuth.parseResponse (inData);
				
				if (response.oauth_token)
				{
					positron.OAuth.setRequestTokens ("twitter", response.oauth_token, response.oauth_token_secret);
					inCallback (null, response);
				}
				else
				{
					inCallback (new Error ("no token in response"));
				}
			}
		}
	);
}

// requires consumer secret and request token secret
positron.Twitter.getAccessToken = function (inVerifier, inCallback)
{
	console.log ("Twitter.getAccessToken()");
	
	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "POST";
	request.dataType = "text";
	request.url = "https://twitter.com/oauth/access_token";
	
	// need at least one HTTP parameter for some reason
	request.httpParameters.dummy = "yes";

	request.authParameters.oauth_token = positron.OAuth.getRequestToken ("twitter");
	request.authParameters.oauth_verifier = inVerifier;

	var	key = positron.OAuth.percentEncode (gApplication.config.oauth.twitter.consumer_secret) + "&" 
		+ positron.OAuth.percentEncode (positron.OAuth.getRequestTokenSecret ("twitter"));
	var	baseString = positron.OAuth.getBaseString (request);
	request.authParameters.oauth_signature = positron.OAuth.getSignature (key, baseString);
	
	var	self = this;

	positron.OAuth.callService
	(
		request,
		function (inError, inData)
		{
			if (inError)
			{
				inCallback (inError);
			}
			else
			{
				var	response = positron.OAuth.parseResponse (inData);
				
				if (response.oauth_token)
				{
					positron.OAuth.setAccessTokens ("twitter", response.oauth_token, response.oauth_token_secret);
			
					inCallback (null, response);
				}
				else
				{
					inCallback (new Error ("no oauth token in response"));
				}
			}
		}
	);
}


// AUTHENTICATED APIS

positron.Twitter.getMentions = function (inCallback)
{
	console.log ("Twitter.getMentions()");
	
	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "GET";
	request.dataType = "json";
	request.url = "https://api.twitter.com/1.1/statuses/mentions_timeline.json";
	
	// need SOMETHING in the POST parameters, doesn't matter what
	request.httpParameters.dummy = "true";

	positron.Twitter.requestAuthenticated (request, inCallback);
}

positron.Twitter.getSettings = function (inCallback)
{
	console.log ("Twitter.getSettings()");
	
	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "GET";
	request.dataType = "json";
	request.url = "https://api.twitter.com/1.1/account/settings.json";
	
	// need SOMETHING in the POST parameters, doesn't matter what
	request.httpParameters.dummy = "true";
	
	positron.Twitter.requestAuthenticated (request, inCallback);
}

positron.Twitter.getTimeline = function (inCallback)
{
	console.log ("Twitter.getTimeline()");
	
	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "GET";
	request.dataType = "json";
	request.url = "https://api.twitter.com/1.1/statuses/home_timeline.json";
	
	// need SOMETHING in the POST parameters, doesn't matter what
	request.httpParameters.dummy = "true";

	positron.Twitter.requestAuthenticated (request, inCallback);
}

positron.Twitter.setStatus = function (inStatus, inCallback)
{
	console.log ("Twitter.setStatus(" + inStatus + ")");
	
	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "POST";
	request.dataType = "json";
	request.url = "https://api.twitter.com/1.1/statuses/update.json";

	request.httpParameters.status = inStatus;

	positron.Twitter.requestAuthenticated (request, inCallback);
}

// PRIVATE

// all the authenticated APIs bottleneck through here

positron.Twitter.requestAuthenticated = function (inRequest, inCallback)
{
	inRequest.authParameters.oauth_token = positron.OAuth.getAccessToken ("twitter");

	var	baseString = positron.OAuth.getBaseString (inRequest);
	var	key = positron.OAuth.percentEncode (gApplication.config.oauth.twitter.consumer_secret) + "&" 
		+ positron.OAuth.percentEncode (positron.OAuth.getAccessTokenSecret ("twitter"));
	inRequest.authParameters.oauth_signature = positron.OAuth.getSignature (key, baseString);

	positron.OAuth.callService
	(
		inRequest,
		function (inError, inData)
		{
			if (inError)
			{
				inCallback (inError);
			}
			else
			{
				if (inData.errors && inData.errors.length)
				{
					inCallback (new Error (inData.errors [0].message));
				}
				else
				{
					inCallback (null, inData);
				}
			}
		}
	);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provideStatic ("positron.Util");

// pretends to be jquery $.ajax
positron.Util.ajax = function (inRequest)
{
	console.error ("positron.Util.ajax() is deprecated, please use monohm.Network.ajax()");
	return monohm.Network.ajax (inRequest);
};

// note this does *not* lowercase the remainder of the string
positron.Util.capitalise = function (inString)
{
	console.error ("positron.Util.capitalise() is deprecated, please use monohm.String.capitalise()");
	return monohm.String.capitalise (inString);
}

positron.Util.clone = function (inObject)
{
	console.error ("positron.Util.clone() is deprecated, please use monohm.Object.clone()");
	return monohm.Object.ajax (inObject);
}

// returns whatever the last nonzero compare was
// or -1 for type mismatches, etc
positron.Util.compare = function (inOne, inTwo)
{
	console.error ("positron.Util.compare() is deprecated, please use monohm.Object.compare()");
	return monohm.Object.compare (inOne, inTwo);
}

// note, no operator precedence is supported
positron.Util.evaluateArithmeticExpression = function (inString)
{
	var	sum = 0;
	var	term = 0;
	var	operand = '+';
	
	// sorry, you have to order your expression properly
	var	elements = inString.split (' ');
	
	for (var i = 0; i < elements.length; i++)
	{
		if (elements [i].length)
		{
			if (i % 2)
			{
				operand = elements [i];
			}
			else
			{
				var	number = elements [i];
				
				if (number.toLowerCase () == "random")
				{
					term = Math.random ();
				}
				else
				{
					term = positron.Util.parseNumeric (number);
				}
				
				if (isNaN (term))
				{
					console.error ("term " + i + " evaluates to NaN in " + inString);
				}
				else
				{
					switch (operand)
					{
						case '+':
							sum += term;
							break;
						case '-':
							sum -= term;
							break;
						case '/':
							sum /= term;
							break;
						case '*':
							sum *= term;
							break;
						case '%':
							sum %= term;
							break;
						case '<<':
							sum <<= term;
							break;
						case '>>':
							sum >>= term;
							break;
						case '&':
							sum &= term;
							break;
						case '|':
							sum |= term;
							break;
						case '^':
							sum ^= term;
							break;
						default:
							console.error ("unrecognised operand: " + operand);
							break;
					}
				}
			}
		}
	}
	
	return sum;
}

positron.Util.evaluateExpressionChain = function (inExpressionChain)
{
	// console.log ("positron.Util.evaluateExpressionChain()");
	// console.log (inExpressionChain);

	var	expressions = monohm.String.parseTokens (inExpressionChain);
	var	expression = new Array ();
	var	success = false;
	var	logical = false;
	
	for (var i = 0; i < expressions.length; i++)
	{
		if (logical)
		{
			var	compare = expressions [i].toLowerCase ();
			
			if (compare == "or" || compare == "||")
			{
				if (success)
				{
					break;
				}
			}
			else
			if (compare == "and" || compare == "&&")
			{
				if (!success)
				{
					break;
				}
			}
			else
			{
				// should we support more logical stuff here?
				console.error ("unsupported logical operator: " + compare);
				success = false;
				break;
			}
			
			logical = false;
		}
		else
		{
			expression.push (expressions [i]);
			
			if (expression.length == 3)
			{
				success = this.evaluateExpression (expression);
				expression.length = 0;
				
				// grab the logical expression next time
				logical = true;
			}
		}
	}
	
	return success;
};

// this is only intended to be called from evaluateExpressionChain() above
positron.Util.evaluateExpression = function (inExpression)
{
	// console.log ("evaluateExpression() on " + inExpression);
	
	var	success = false;
	var	first = positron.Util.parseNumeric (inExpression [0]);
	var	second = positron.Util.parseNumeric (inExpression [2]);
	
	if (isNaN (first) || isNaN (second))
	{
		first = inExpression [0];
		second = inExpression [2];
	}

	switch (inExpression [1])
	{
		case "==":
		case "equals":
			success = first == second;
			break;
		case "!=":
		case "doesnotequal":
		case "notequals":
			success = first != second;
			break;
		case ">":
		case "greaterthan":
			success = first > second;
			break;
		case ">=":
		case "greaterthanorequal":
			success = first >= second;
			break;
		case "<":
		case "lessthan":
			success = first < second;
			break;
		case "<=":
		case "lessthanorequal":
			success = first <= second;
			break;
		case "contains":
			if (typeof (first) == "string")
			{
				success = first.indexOf (second) >= 0;
			}
			else
			{
				console.error ("contains operand used on numeric expression (skip)");
				success = true;
			}
			break;
		case "containsignorecase":
			if (typeof (first) == "string")
			{
				success = first.toLowerCase ().indexOf (second.toLowerCase ()) >= 0;
			}
			else
			{
				console.error ("containsignorecase operand used on numeric expression (skip)");
				success = true;
			}
			break;
		case "doesnotcontain":
			if (typeof (first) == "string")
			{
				success = first.indexOf (second) < 0;
			}
			else
			{
				console.error ("doesnotcontain operand used on numeric expression (skip)");
				success = true;
			}
			break;
		case "doesnotcontainignorecase":
			if (typeof (first) == "string")
			{
				success = first.toLowerCase ().indexOf (second.toLowerCase ()) < 0;
			}
			else
			{
				console.error ("doesnotcontainignorecase operand used on numeric expression (skip)");
				success = true;
			}
			break;
		default:
			console.error ("unknown operand: " + inExpression [1]);
			break;
	}
	
	// console.log ("return " + success);
	
	return success;
}

positron.Util.get2DDistance = function (inX1, inY1, inX2, inY2)
{
	return Math.sqrt (Math.pow ((inX1 - inX2), 2) + Math.pow ((inY1 - inY2), 2))
}

// remove any last number-only element from the attribute name
// so that "action-1" matches the attributelet for "action"
positron.Util.getAttributeSpec =
function Util_getAttributeSpec (inAttributeName)
{
	var	numberedAttribute = true;
	var	nameElements = inAttributeName.split ('-');
	
	if (nameElements.length > 1)
	{
		var	lastElement = nameElements [nameElements.length - 1];
		
		for (var i = 0; i < lastElement.length; i++)
		{
			if ("0123456789".indexOf (lastElement.charAt (i)) == -1)
			{
				// ok so the last element is not a number
				// bail
				numberedAttribute = false;
				break;
			}
		}
	}
	else
	{
		numberedAttribute = false;
	}
	
	var	attributeSpec = new Object ();
	
	if (numberedAttribute)
	{
		attributeSpec.number = parseInt (nameElements.pop ());
		attributeSpec.name = nameElements.join ('-');
	}
	else
	{
		attributeSpec.number = -1;
		attributeSpec.name = inAttributeName;
	}
	
	return attributeSpec;
}

positron.Util.getEventX = function (inEvent)
{
	var	x = 0;
	
	if (inEvent.changedTouches)
	{
		x = inEvent.changedTouches [0].pageX;
	}
	else
	{
		if (inEvent.pageX || inEvent.pageY)
		{
			x = inEvent.pageX;
		}
		else
		if (inEvent.clientX || inEvent.clientY)
		{
			x = inEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		}
	}

	return x;
}

positron.Util.getEventY = function (inEvent)
{
	var	y = 0;
	
	if (inEvent.changedTouches)
	{
		y = inEvent.changedTouches [0].pageY;
	}
	else
	{
		if (inEvent.pageX || inEvent.pageY)
		{
			y = inEvent.pageY;
		}
		else
		if (inEvent.clientX || inEvent.clientY)
		{
			y = inEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
	}
	
	return y;
}

positron.Util.getJSON = function (inURL)
{
	console.error ("positron.Util.getJSON() is deprecated, please use monohm.Network.getJSONSync()");
	return monohm.Network.getJSONSync (inURL);
}

positron.Util.getTextSync = function (inURL, inParams)
{
	console.error ("positron.Util.getTextSync() is deprecated, please use monohm.Network.getTextSync()");
	return monohm.Network.getTextSync (inURL, inParams);
}

// can be used without gApplication
positron.Util.getURLContents = function (inURL, inParams, inMethod, inDataType, inAsync, inCallback)
{
	console.error ("positron.Util.getURLContents() is deprecated, please use monohm.Network.get()");

	var	url = inURL;
	var	q = url.charAt (url.length - 1);
	
	if (q != "?")
	{
		url += "q";
		url += "?";
	}
	
	if (typeof (inParams) == "object")
	{
		url += positron.Util.objectToURIData (inParams);
	}
	else
	{
		url += inParams;
	}
	
	return monohm.Network.ajax (url, inDataType, inCallback);
}

positron.Util.globalEval = function (inCode)
{
	(
		window.execScript ||
		function (inCode)
		{
			window ["eval"].call (window, inCode);
		}
	)(inCode);
}

positron.Util.instantiate = function (inFullClassName)
{
	console.error ("positron.Util.instantiate() is deprecated, please use monohm.Object.instantiate()");
	return monohm.Object.instantiate (inFullClassName);
}

positron.Util.isCrossDomainRequest = function (inURL)
{
	console.error ("positron.Util.isCrossDomainRequest() is deprecated, please use monohm.Network.isCrossDomainRequest()");
	return monohm.Network.isCrossDomainRequest (inURL);
}

positron.Util.isEmpty = function (inObject)
{
	console.error ("positron.Util.isEmpty() is deprecated, please use monohm.Object.isEmpty()");
	return monohm.Object.ajax (inObject);
}

positron.Util.isJSONPRequest = function (inRequest)
{
	console.error ("positron.Util.isJSONPRequest() is deprecated, please use monohm.Network.isJSONPRequest()");
	return monohm.Network.isJSONPRequest (inRequest);
}

positron.Util.parseNumeric = function (inTerm)
{
	var	number = parseFloat (inTerm);
	
	if (isNaN (number) || (number == 0))
	{
		// parseInt() handles 0xff etc
		// which parseFloat() thinks is zero
		number = parseInt (inTerm);
	}

	return number;
}

positron.Util.jsonp = function (inRequest)
{
	console.error ("positron.Util.jsonp() is deprecated, please use monohm.Network.jsonp()");
	return monohm.Network.jsonp (inRequest);
}

positron.Util.loadActionlet = function (inClassName)
{
	return positron.Util.loadCodelet (inClassName, "actions");
}

// codelet is a new name for actionlet, taglet, etc :-)
positron.Util.loadCodelet = function (inClassName, inDirectory)
{
	var	path = inDirectory + "/" + monohm.String.camelToHyphen (inClassName) + ".js";
	var	code = monohm.Network.getTextSync (path);
	
	var	loaded = false;
	
	if (code && code.length)
	{
		try
		{
			positron.Util.globalEval (code);
			loaded = true;
		}
		catch (inError)
		{
		}
	}
	
	return loaded;
}

positron.Util.loadCodeletAsync = function (inClassName, inDirectory, inCallback)
{
	var	path = inDirectory + "/" + monohm.String.camelToHyphen (inClassName) + ".js";
	
	positron.DOM.addScript (path, inCallback);
}

positron.Util.loadAttributelet = function (inClassName)
{
	return positron.Util.loadCodelet (inClassName, "attributes");
}

positron.Util.loadEventlet = function (inClassName)
{
	return positron.Util.loadCodelet (inClassName, "events");
}

positron.Util.loadTaglet = function (inClassName)
{
	return positron.Util.loadCodelet (inClassName, "tags");
}

positron.Util.loadTriggerlet = function (inClassName)
{
	return positron.Util.loadCodelet (inClassName, "triggers");
}

positron.Util.logArray = function (inObject)
{
	console.log ("[");
	
	for (var i = 0; i < inObject.length; i++)
	{
		var	member = inObject [i];
		var	memberType = typeof (member);
		
		if (memberType == "function")
		{
			console.log ("(function)");
		}
		else
		{
			console.log (member);
		}
	}

	console.log ("]");
}

positron.Util.logObject = function (inObject, inObjectName)
{
	if (typeof (inObjectName) == "string")
	{
		console.log (inObjectName);
	}
	
	for (var key in inObject)
	{
		console.log (key + " (" + typeof (key) + ")");
		
		var	value = inObject [key];
		var	valueType = typeof (value);
		
		if (Array.isArray (value))
		{
			positron.Util.logArray (value);
		}
		else
		if (valueType == null)
		{
			console.log ("(null)");
		}
		else
		if (valueType == "object")
		{
			console.log (value);
		}
		else
		if (valueType == "function")
		{
			console.log ("(function)");
		}
		else
		{
			console.log (value);
		}
	}
}

positron.Util.kExtensionToContentType = 
{
	"css" : "text/css",
	"gif" : "image/gif",
	"htm" : "application/html",
	"html" : "application/html",
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
positron.Util.mapExtensionToContentType = function (inString)
{
	console.error ("positron.Util.mapExtensionToContentType() is deprecated, please use monohm.Mime.mapExtensionToContentType()");
	return monohm.Mime.mapExtensionToContentType (inString);
}

positron.Util.merge = function (inObject, outObject)
{
	console.error ("positron.Util.merge() is deprecated, please use monohm.Object.merge()");
	return monohm.Object.merge (inObject, outObject);
}

positron.Util.objectToURIData = function (inObject)
{
	console.error ("positron.Util.objectToURIData() is deprecated, please use monohm.Network.objectToURIData()");
	return monohm.Network.objectToURIData (inObject);
}

positron.Util.parseFloat = function (inString, inDefault)
{
	console.error ("positron.Util.parseFloat() is deprecated, please use monohm.String.parseFloat()");
	return monohm.String.parseFloat (inString, inDefault);
}

positron.Util.parseInt = function (inString, inDefault)
{
	console.error ("positron.Util.parseInt() is deprecated, please use monohm.String.parseInt()");
	return monohm.String.parseInt (inString, inDefault);
}

positron.Util.parseParams = function (inParamString)
{
	// console.log ("parseParams(" + inParamString + ")");
	
	var	params = new Object ();
	
	var	inKey = true;
	var	key = "";
	var	quoteCharacter = null;
	var	value = "";
	
	if (inParamString)
	{
		for (var i = 0; i < inParamString.length; i++)
		{
			var	ch = inParamString.charAt (i);
			
			if (ch == quoteCharacter)
			{
				quoteCharacter = null;
			}
			else
			if (quoteCharacter)
			{
				if (inKey)
				{
					key += ch;
				}
				else
				{
					value += ch;
				}
			}
			else
			if (ch == '\\')
			{
				var	add = null;
				
				if (i < (inParamString.length - 1))
				{
					i++;
					add = inParamString.charAt (i);
				}
				else
				{
					add = ch;
				}
				
				if (inKey)
				{
					key += add;
				}
				else
				{
					value += add;
				}
			}
			else
			if (ch == '\'' || ch == '"')
			{
				quoteCharacter = ch;
			}
			else
			if (ch == ':')
			{
				if (inKey)
				{
					inKey = false;
				}
				else
				{
					value += ch;
				}
			}
			else
			if (ch == ';')
			{
				key = monohm.String.stripSpaces (key);
				value = monohm.String.stripSpaces (value);
				
				if (key.length)
				{
					params [key] = value;
				}
				else
				{
					console.error ("zero length key...");
				}
				
				inKey = true;
				key = "";
				value = "";
			}
			else
			{
				if (inKey)
				{
					key += ch;	
				}
				else
				{
					value += ch;
				}
			}
		}
		
		if (!inKey && key.length)
		{
			key = monohm.String.stripSpaces (key);
			value = monohm.String.stripSpaces (value);

			if (key.length)
			{
				params [key] = value;
			}
			else
			{
				console.error ("zero length key...");
			}
		}
	}
	
	return params;
}

positron.Util.parseTime = function (inTimeString, inDefault)
{
	console.error ("positron.Util.parseTime() is deprecated, please use monohm.String.parseTime()");
	return monohm.String.parseTime (inTimeString, inDefault);
}

positron.Util.parseTokens = function (inString)
{
	console.error ("positron.Util.parseTokens() is deprecated, please use monohm.String.parseTokens()");
	return monohm.String.parseTokens (inString);
}

positron.Util.replaceAll = function (inString, inReplace, inWith)
{
	console.error ("positron.Util.replaceAll() is deprecated, please use monohm.String.replaceAll()");
	return monohm.String.replaceAll (inString, inReplace, inWith);
}

positron.Util.parseValueAndUnits = function (inString, inDefaultValue, inDefaultUnits)
{
	console.error ("positron.Util.parseValueAndUnits() is deprecated, please use monohm.String.parseValueAndUnits()");
	return monohm.String.parseValueAndUnits (inString, inDefaultValue, inDefaultUnits);
}

positron.Util.smartJoin = function (inArray, inDelimiter)
{
	console.error ("positron.Util.smartJoin() is deprecated, please use monohm.String.smartJoin()");
	return monohm.String.smartJoin (inArray, inDelimiter);
}

positron.Util.stripSpaces = function (inString)
{
	console.error ("positron.Util.stripSpaces() is deprecated, please use monohm.String.stripSpaces()");
	return monohm.String.stripSpaces (inString);
}

positron.Util.unparseParams = function (inParams)
{
	var unparsed = "";
	
	if (inParams)
	{
		for (var key in inParams)
		{
			var value = inParams [key];
			
			if (typeof (key) == "string")
			{
				var	valueType = typeof (value);
				
				if (valueType == "string" || valueType == "number" || valueType == "boolean")
				{
					unparsed += key + ": " + value + ";";
				}
			}
		}
	}
	
	return unparsed;
}

positron.Util.validateEmailAddress = function (inAddress)
{
	console.error ("positron.Util.validateEmailAddress() is deprecated, please use monohm.String.validateEmailAddress()");
	return monohm.String.validateEmailAddress (inAddress);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.View");

positron.View = function positron_View ()
{
	this.deferredActions = new Array ();
	this.deferredTasks = new Array ();
	this.cancellableActions = new Array ();
}

positron.View.prototype.addCancellableAction =
function View_addCancellableAction (inAction)
{
	if (gApplication.isLogging (gApplication.kLogViews))
		console.log ("View(" + this.key + ").addCancellableAction(" + inAction.toString () + ")");
	
	this.cancellableActions.push (inAction);
}

positron.View.prototype.addDeferredAction =
function View_addDeferredAction (inAction)
{
	if (gApplication.isLogging (gApplication.kLogViews))
		console.log ("View(" + this.key + ").addDeferredAction(" + inAction.toString () + ")");
	
	this.deferredActions.push (inAction);
}

// this is for generic tasks
positron.View.prototype.addDeferredTask =
function View_addDeferredTask (inTask)
{
	if (gApplication.isLogging (gApplication.kLogViews))
		console.log ("View(" + this.key + ").addDeferredTask()");
	
	this.deferredTasks.push (inTask);
}

// caution, this just cancels the walker
// for use in specific appropriate circumstances only
// like a superview is refreshing
positron.View.prototype.cancelRefresh =
function View_cancelRefresh ()
{
	if (this.treeWalker)
	{
		this.treeWalker.cancel ();
		this.treeWalker = null;
	}
}

positron.View.prototype.cancelSubviewRefreshes =
function View_cancelSubviewRefreshes ()
{
	var	subviewElements = this.element.querySelectorAll ("[" + gApplication.getAttributePrefix () + "view]");
	
	if (subviewElements)
	{
		for (var i = 0; i < subviewElements.length; i++)
		{
			var	view = positron.DOM.getData (subviewElements [i], "view");
			
			if (view)
			{
				view.cancelRefresh ();
			}
		}
	}
}

positron.View.prototype.cancelTransitions =
function View_cancelTransitions ()
{
	if (this.isTransitioningIn ())
	{
		positron.removeClass (this.element, this.transitionInClass);
		this.transitionInClass = null;
	}

	if (this.isTransitioningOut ())
	{
		positron.removeClass (this.element, this.transitionOutClass);
		this.transitionOutClass = null;
	}
}

positron.View.prototype.configure =
function View_configure (inKey, inElement, inContext, inPage)
{
	if (gApplication.isLogging (gApplication.kLogViews))
		console.log ("View.configure(" + inKey + ")");

	this.key = inKey;
	this.element = inElement;
	this.html = this.element.innerHTML;
	this.page = inPage;
	
	this.params = new Object ();
	
	// if we're initially invisible
	// then refresh on the next show()
	this.showing = false;
	this.refreshing = !this.isVisible ();
	
	// HACK check to see whether we're a view or page here
	// the alternative is a completely separate Page.configure()
	// which might have side effects as View matures
	if (this.page)
	{
		this.context = gApplication.makeContext (inContext);
	}
	else
	{
		this.context = gApplication.makeContext (gApplication.context);
	}

	var	animationEndEventName = positron.CSS.getPrefixedEvent ("animationend");
	
	// for callbacks
	var	self = this;
	
	this.element.addEventListener
	(
		animationEndEventName,
		function (inEvent)
		{
			var	view = positron.DOM.getData (inEvent.target, "view");
			
			if (view)
			{
				self.onAnimationEnd (view);
				inEvent.stopPropagation ();
			}
		},
		false
	);
}

positron.View.prototype.fireAnalyticsEvent =
function View_fireAnalyticsEvent (inEventName, inDetail)
{
	gApplication.fireAnalyticsEvent
	({
		timestamp: new Date ().getTime (),
		domain: this.page ? "view" : "page",
		page: this.page ? this.page.key : this.key,
		view: this.page ? this.key : null,
		name: inEventName,
		detail: inDetail
	});
}

positron.View.prototype.hide =
function View_hide (inTransitionOutClass)
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.hide(" + this.key + ")");
	
	if (this.isTransitioningIn ())
	{
		positron.DOM.removeClass (this.element, this.transitionInClass);
		this.transitionInClass = null;
		positron.DOM.addPrefixedClass (this.element, "invisible");
	}
	else
	if (this.isTransitioningOut ())
	{
		// we are transitioning out, leave alone
	}
	else
	if (this.isVisible ())
	{
		positron.DOM.removePrefixedClass (this.element, "visible");
		
		if (inTransitionOutClass && inTransitionOutClass.length)
		{
			this.transitionOutClass = inTransitionOutClass;
		}
		else
		{
			this.transitionOutClass = gApplication.getCSSClassPrefix () + "transition-invisible";
		}
		
		this.onBeforeInvisible ();
		new positron.BeforeInvisibleTreeWalker ().startWalkChildren (this.element);

		positron.DOM.addClass (this.element, this.transitionOutClass);
	}
	else
	{
		// we are already invisible
		console.log ("view is already invisible");
	}
}

positron.View.prototype.isRefreshing =
function View_isRefreshing ()
{
	return this.refreshing;
}

positron.View.prototype.isTransitioning =
function View_isTransitioning ()
{
	return this.isTransitioningIn () || this.isTransitioningOut ();
}

positron.View.prototype.isTransitioningIn =
function View_isTransitioningIn ()
{
	return this.transitionInClass && this.transitionInClass.length
		&& positron.DOM.hasClass (this.element, this.transitionInClass);
}

positron.View.prototype.isTransitioningOut =
function View_isTransitioningOut ()
{
	return this.transitionOutClass && this.transitionOutClass.length
		&& positron.DOM.hasClass (this.element, this.transitionOutClass);
}

positron.View.prototype.isVisible =
function View_isVisible ()
{
	return ! positron.DOM.hasPrefixedClass (this.element, "invisible");
}

positron.View.prototype.refresh =
function View_refresh (inTransitionInClass)
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.refresh(" + this.key + ")");

	this.refreshing = true;
	this.wasRefreshing = false;
	
	// if any of our subviews are refreshing, cancel them
	this.cancelSubviewRefreshes ();
	
	this.show (inTransitionInClass);
}

positron.View.prototype.run =
function View_run ()
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.run(" + this.key + ")");

	this.refreshing = true;
	this.running = true;
	
	// if any of our subviews are refreshing, cancel them
	this.cancelSubviewRefreshes ();
	
	// strongarm us invisible
	this.cancelTransitions ();
	positron.DOM.addClass (this.element, gApplication.getCSSClassPrefix () + "invisible");
	
	this.show ();
}

// NOTE put params into context discretely
// putting the params object into context may seem convenient
// BUT it masks ALL params from inherited contexts like Page and Application
positron.View.prototype.setParams =
function View_setParams (inParams)
{
	if (inParams)
	{
		for (var key in inParams)
		{
			this.setParam (key, inParams [key]);
		}
	}
}

// ALWAYS go through here to set params
// as it updates context, too
positron.View.prototype.setParam =
function View_setParam (inKey, inValue)
{
	this.params [inKey] = inValue;
	this.context.put ("params." + inKey, inValue);
}

positron.View.prototype.show =
function View_show (inTransitionInClass)
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.show(" + this.key + ")");

	var	refreshingSuperview = positron.DOM.getRefreshingParentView (this.element);
	
	if (refreshingSuperview)
	{
		console.error ("View.show(" + this.key + ") rejected due to refreshing superview (" + refreshingSuperview.key + ")");
		return;
	}
	
	// assume that we are NOT doing a visibility transition
	// if the view is invisible and not transitioning, then we do one
	this.showing = false;
	this.wasRefreshing = false;
	
	if (this.isTransitioningIn ())
	{
		if (gApplication.isLogging (gApplication.kLogViews)) console.log ("view is transitioning in, refreshing it...");
		
		// only cancel the treewalker if another refresh is pending
		if (this.treeWalker && this.refreshing)
		{
			this.treeWalker.cancel ();
			this.treeWalker = null;
		}
	}
	else
	if (this.isTransitioningOut ())
	{
		if (gApplication.isLogging (gApplication.kLogViews)) console.log ("view is transitioning out, stopping it...");
		
		positron.DOM.removeClass (this.element, this.transitionOutClass);
		this.transitionOutClass = null;
		positron.DOM.addPrefixedClass (this.element, "visible");
	}
	else
	if (this.isVisible ())
	{
		if (gApplication.isLogging (gApplication.kLogViews)) console.log ("view is visible...");

		// only cancel the treewalker if another refresh is pending
		if (this.treeWalker && this.refreshing)
		{
			this.treeWalker.cancel ();
			this.treeWalker = null;
		}
	}
	else
	{
		if (!this.running)
		{
			// the view is currently invisible and not transitioning
			// so show it
			this.showing = true;
		}
	}

	// console.log ("showing? " + this.showing);
	// console.log ("refreshing? " + this.refreshing);
	
	if (this.showing)
	{
		// do this before the plumbing so the code sees its own structure
		this.onBeforeVisible ();
	}

	if (this.refreshing)
	{
		// we're dumping the current markup
		// so cancel any existing cancellable actions
		this.cancelActions ();
		
		// make the refresh & progress elements, etc
		this.prepareForDynamics ();
	}
	
	if (this.showing)
	{
		this.fireAnalyticsEvent ("show");
	}
	
	if (this.refreshing)
	{
		this.fireAnalyticsEvent ("refresh");
	}

	// cancel any scheduled refresh
	this.refreshScheduled = false;
	
	if (this.showing)
	{
		positron.DOM.removePrefixedClass (this.element, "invisible");

		if (inTransitionInClass && inTransitionInClass.length)
		{
			this.transitionInClass = inTransitionInClass;
		}
		else
		{
			this.transitionInClass = gApplication.getCSSClassPrefix () + "transition-visible";
		}
		
		positron.DOM.addClass (this.element, this.transitionInClass);

		if (this.refreshing)
		{
			// showing AND refreshing
			
			// keep track of the fact that we're in a refresh timeout
			this.refreshScheduled = true;
			
			// give the browser time to process the class changes
			// so hopefully we don't get a FOTC
			var	self = this;
	
			setTimeout
			(
				function ()
				{
					// if nobody has unscheduled us...
					if (self.refreshScheduled)
					{
						self.refreshScheduled = false;
						
						// this is extra arse protect
						// as the refreshScheduled flag should prevent us from arriving here
						// when another refresh happened between scheduling and firing
						if (self.refreshElement)
						{
							// run the refresh walker in OBV mode
							self.treeWalker = new positron.RefreshTreeWalker (self, true);
							self.treeWalker.startWalkChildren (self.refreshElement, self.context);
						}
						else
						{
							console.error ("refresh with no refresh element, scheduled flag is not enough");
						}
					}
				},
				1
			);
		}
		else
		{
			// showing and NOT refreshing
			
			// these are guaranteed to be synchronous
			new positron.BeforeVisibleTreeWalker ().walkChildren (this.element);
			new positron.VisibleTreeWalker ().walkChildren (this.element);
			
			this.showing = false;
		}
	}
	else
	{
		if (this.refreshing)
		{
			// refreshing and NOT showing
			
			this.fireAnalyticsEvent ("refresh");
			
			// refreshes don't need a setTimeout()
			// as we're not doing any visibility changes
			this.treeWalker = new positron.RefreshTreeWalker (this, false);
			this.treeWalker.startWalkChildren (this.refreshElement, this.context);
		}
		else
		{
			// show with no refresh on already visible view, do nothing
		}
	}
}

// PRIVATE

positron.View.prototype.cancelActions =
function View_cancelActions ()
{
	// console.log ("View(" + this.key + ").cancelActions()");

	this.cancelPrivateActions ();
	
	var	subviewElements = this.element.querySelectorAll ("[" + gApplication.getAttributePrefix () + "view]");
	
	if (subviewElements)
	{
		for (var i = 0; i < subviewElements.length; i++)
		{
			var	subview = positron.DOM.getData (subviewElements [i], "view");
			
			if (subview)
			{
				subview.cancelPrivateActions ();
			}
		}
	}
}

// cancel *our* cancellable actions, as opposed to the subviews'
positron.View.prototype.cancelPrivateActions =
function View_cancelPrivateActions ()
{
	// console.log ("View(" + this.key + ").cancelPrivateActions(" + this.cancellableActions.length + ")");

	for (var i = 0; i < this.cancellableActions.length; i++)
	{
		var	action = this.cancellableActions [i];
		
		try
		{
			action.cancel ();
		}
		catch (inError)
		{
			console.error ("error trying to cancel action: " + action.toString ());
			console.error (inError.message);
		}
	}
	
	this.cancellableActions.length = 0;
}

positron.View.prototype.prepareForDynamics =
function View_prepareForDynamics ()
{
	this.refreshElement = document.createElement ("div");
	positron.DOM.addPrefixedClass (this.refreshElement, "invisible");
	positron.DOM.addPrefixedClass (this.refreshElement, "view-refresh");
	positron.DOM.removeChildren (this.element);
	this.refreshElement.innerHTML = this.html;
	this.element.appendChild (this.refreshElement);

	// note we make this regardless
	// so that even if there is no progress selector specified
	// devs can style it
	this.progressElement = document.createElement ("div");
	positron.DOM.addPrefixedClass (this.progressElement, "view-progress");
	
	var	progressElements = positron.DOM.getCompositeElements
		(this.element, positron.DOM.getPrefixedAttributeName ("progress-view"),
			positron.DOM.getPrefixedAttributeName ("progress-selector"));
	
	if (progressElements.length)
	{
		this.progressElement.innerHTML = progressElements [0].innerHTML;
	}
	
	this.element.appendChild (this.progressElement);
}

positron.View.prototype.registerDeferredActions =
function View_registerDeferredActions ()
{
	// console.log ("View(" + this.key + ").registerDeferredActions()");
	
	this.registerPrivateDeferredActions ();
	
	var	subviewElements = this.element.querySelectorAll ("[" + gApplication.getAttributePrefix () + "view]");
	
	if (subviewElements)
	{
		for (var i = 0; i < subviewElements.length; i++)
		{
			var	subview = positron.DOM.getData (subviewElements [i], "view");
			
			if (subview)
			{
				subview.registerPrivateDeferredActions ();
			}
		}
	}
}

positron.View.prototype.registerPrivateDeferredActions =
function View_registerPrivateDeferredActions ()
{
	// console.log ("View(" + this.key + ").registerPrivateDeferredActions(" + this.deferredActions.length + ")");

	for (var i = 0; i < this.deferredActions.length; i++)
	{
		var	action = this.deferredActions [i];
		
		try
		{
			if (gApplication.isLogging (gApplication.kLogViews))
				console.log ("View(" + this.key + ") registering deferred action (" + action.toString () + ")");

			if (action.trigger)
			{
				action.trigger.register (action);
				
				// we registered ok, see if we need to schedule a cancel
				if (action.trigger.requiresCancel ())
				{
					this.addCancellableAction (action);
				}
			}
			else
			{
				console.error ("deferred action has no trigger: " + action.toString ());
			}
		}
		catch (inError)
		{
			console.error ("error trying to register action: " + action.toString ());
			console.error (inError.message);
		}
	}
	
	this.deferredActions.length = 0;
}

positron.View.prototype.runDeferredTasks =
function View_runDeferredTasks ()
{
	// console.log ("View(" + this.key + ").runDeferredTasks()");
	
	this.runPrivateDeferredTasks ();
	
	var	subviewElements = this.element.querySelectorAll ("[" + gApplication.getAttributePrefix () + "view]");
	
	if (subviewElements)
	{
		for (var i = 0; i < subviewElements.length; i++)
		{
			var	subview = positron.DOM.getData (subviewElements [i], "view");
			
			if (subview)
			{
				subview.runPrivateDeferredTasks ();
			}
		}
	}
}

positron.View.prototype.runPrivateDeferredTasks =
function View_runPrivateDeferredTasks ()
{
	// console.log ("View(" + this.key + ").runPrivateDeferredTasks(" + this.deferredTasks.length + ")");

	for (var i = 0; i < this.deferredTasks.length; i++)
	{
		var	task = this.deferredTasks [i];
		
		try
		{
			if (gApplication.isLogging (gApplication.kLogViews))
				console.log ("View(" + this.key + ") running deferred task ()");

			if (task.run)
			{
				task.run ();
			}
			else
			{
				console.error ("deferred task as no run() function");
			}
		}
		catch (inError)
		{
			console.error ("error trying to run task");
			console.error (inError.message);
		}
	}
	
	this.deferredTasks.length = 0;
}

// CALLBACKS

positron.View.prototype.onWalkComplete =
function View_onWalkComplete (inTreeWalker)
{
	// if the completing treewalker is different to the one we have
	// then do nothing -- it's a cancelled walker finishing in a setTimeout() gap
	// and we're already about to start a new one
	if (inTreeWalker == this.treeWalker)
	{
		this.treeWalker = null;
		
		if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onWalkComplete(" + this.key + ")");
		
		positron.DOM.replaceWithChildren (this.refreshElement);
		this.refreshElement = null;
	
		positron.DOM.removeNode (this.progressElement);
		this.progressElement = null;
	
		// give the browser a chance to react to DOM changes
		// as onDOMReady() may ask for size, etc
		var	self = this;
	
		setTimeout
		(
			function ()
			{
				self.onDOMReady ();
			},
			1
		);
	}
	else
	{
		console.error ("treewalkers don't match, ignoring onWalkComplete");
	}
}

// VIEW LIFECYCLE EVENTS

positron.View.prototype.onAnimationEnd =
function View_onAnimationEnd (inEvent)
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onAnimationEnd(" + this.key + ")");
	
	if (this.transitionInClass && positron.DOM.hasClass (this.element, this.transitionInClass))
	{
		positron.DOM.removeClass (this.element, this.transitionInClass);
		this.transitionInClass = undefined;
		positron.DOM.addPrefixedClass (this.element, "visible");
		
		this.onVisible ();
	}
	else
	if (this.transitionOutClass && positron.DOM.hasClass (this.element, this.transitionOutClass))
	{
		positron.DOM.removeClass (this.element, this.transitionOutClass);
		this.transitionOutClass = undefined;
		positron.DOM.addPrefixedClass (this.element, "invisible");
		
		this.onInvisible ();
	}
}

positron.View.prototype.onLoaded =
function View_onLoaded ()
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onLoaded(" + this.key + ")");

	this.fireAnalyticsEvent ("loaded");
}

positron.View.prototype.onBeforeVisible =
function View_onBeforeVisible ()
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onBeforeVisible(" + this.key + ")");
}

positron.View.prototype.onVisible =
function View_onVisible ()
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onVisible(" + this.key + ")");

	// if we're doing a dynamic show
	if (this.showing)
	{
		// are we still in the dynamics run?
		if (this.treeWalker)
		{
			// must be some async calls outstanding, etc
			// console.log ("treewalker extant, waiting for completion...");
		}
		else
		{
			// we're done
			this.showing = false;
			this.refreshing = false;
			this.running = false;
			
			new positron.VisibleTreeWalker ().startWalkChildren (this.element);
			
			if (this.wasRefreshing)
			{
				this.wasRefreshing = false;
				
				// console.log ("view was refreshing, calling onRefreshComplete() from onVisible()");
				this.onRefreshComplete ();
			}
			
			var	event = positron.DOM.createEvent
			(
				gApplication.getEventPrefix () + "showview",
				{
					viewKey: this.key
				}
			);
			
			window.dispatchEvent (event);
			
			// HACK if we're a page, notify application
			// can't do this in the subclass
			if (!this.page)
			{
				gApplication.onPageVisible (this.key);
			}
		}
	}

	this.fireAnalyticsEvent ("visible");
}

positron.View.prototype.onDOMReady =
function View_onDOMReady ()
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onDOMReady(" + this.key + ")");

	// console.log ("showing? " + this.showing);
	// console.log ("refreshing? " + this.refreshing);
	
	if (this.refreshing)
	{
		this.refreshing = false;
		this.running = false;
		
		if (this.showing)
		{
			// in order for the on-visible treewalker to run
			// the DOM must be ready *and* the animation must have finished
			if (this.isVisible () && !this.isTransitioning ())
			{
				// we're done
				this.showing = false;

				new positron.VisibleTreeWalker ().walkChildren (this.element);
				
				this.onRefreshComplete ();

				// HACK if we're a page, notify application
				// can't do this in the subclass
				if (!this.page)
				{
					gApplication.onPageVisible (this.key);
				}
			}
			else
			{
				// wait for onVisible()
				this.wasRefreshing = true;
			}
		}
		else
		{
			this.onRefreshComplete ();
		}

	}
}

// this is called once all refresh-related activity is done
// DOM is ready, view is visible, all that
positron.View.prototype.onRefreshComplete =
function View_onRefreshComplete ()
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onRefreshComplete(" + this.key + ")");
	
	this.runDeferredTasks ();
	this.registerDeferredActions ();

	var	event = positron.DOM.createEvent
	(
		gApplication.getEventPrefix () + "refreshview",
		{
			viewKey: this.key
		}
	);
	
	window.dispatchEvent (event);
}

positron.View.prototype.onBeforeInvisible =
function View_onBeforeInvisible ()
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onBeforeInvisible(" + this.key + ")");
}

positron.View.prototype.onInvisible =
function View_onInvisible ()
{
	if (gApplication.isLogging (gApplication.kLogViews)) console.log ("View.onInvisible(" + this.key + ")");

	this.fireAnalyticsEvent ("invisible");
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.Page");

// there is almost nothing to Page
// in most apps, Page will contain 99% app-specific code, likely

positron.Page =
function positron_Page ()
{
	positron.View.call (this);
	
	this.views = new Object ();
}
monohm.inherits (positron.Page, positron.View);

// PUBLIC APIS

positron.Page.prototype.addView =
function Page_addView (inViewKey, inView)
{
	// console.log ("Page(" + this.key + ").addView(" + inViewKey + ")");
	this.views [inViewKey] = inView;
}

positron.Page.prototype.getView =
function Page_getView (inViewKey)
{
	return this.views [inViewKey];
}

positron.Page.prototype.hasView =
function Page_hasView (inViewKey)
{
	return this.views [inViewKey] != null;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.ActionFactory");

// STATIC

positron.ActionFactory =
function ActionFactory ()
{
}

// note this now passes back an action which is *created* but not *registered*
positron.ActionFactory.createAction =
function ActionFactory_createAction
	(inElement, inContext, inActionAttributeName, inParamAttributeName, inParamKeysAttributeName, infireParamKeysAttributeName, inCallback)
{
	var	actionString = inElement.getAttribute (inActionAttributeName);
	
	if (actionString && actionString.length)
	{
		var	self = this;
		
		var	actionSpec = positron.ActionFactory.parseAction (actionString);
		
		if (actionSpec.actionName)
		{
			var	self = this;
			
			gApplication.getActionletAsync
			(
				actionSpec.actionName,
				function (inAction, inGetActionSync)
				{
					if (inAction)
					{
						actionSpec.element = inElement;
						actionSpec.params = self.parseParams (inElement, inParamAttributeName);

						// HACK also keep track of the explicit as opposed to implicit params
						// as some actions definitely do NOT want the implicit ones
						// inserted by default triggers, etc
						actionSpec.explicitParams = self.parseParams (inElement, inParamAttributeName);
			
						// also keep track of parameter keys
						// which are substituted by key at walk time
						actionSpec.paramKeys = self.parseParams (inElement, inParamKeysAttributeName);

						for (var paramKey in actionSpec.paramKeys)
						{
							var	param = actionSpec.paramKeys [paramKey];
							var	value = gApplication.getContextReference (param, inContext);
				
							if (value)
							{
								actionSpec.params [paramKey] = value;
								actionSpec.explicitParams [paramKey] = value;
							}
						}
			
						// also keep track of parameter keys
						// which are substituted at action time, not walk time
						actionSpec.fireParamKeys = self.parseParams (inElement, infireParamKeysAttributeName);
			
						self.getTriggerlet
						(
							actionSpec,
							function (inTriggerlet, inGetTriggerSync)
							{
								if (inTriggerlet)
								{
if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("found trigger (" + actionSpec.triggerName + ")");

									inAction.trigger = inTriggerlet;
								}
								else
								{
									// always whine if the trigger name has a prefix and we can't find it
									if (actionSpec.triggerName.indexOf ("-") > 0)
									{
if (gApplication.isLogging (gApplication.kLogTrigger)) console.error ("no triggerlet found for prefixed name " + actionSpec.triggerName);
									}
									else
									{
if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("no triggerlet, registering listener for " + actionSpec.triggerName);
									}
	
									inAction.trigger = new positron.trigger.DefaultTrigger (actionSpec.triggerName);
								}

								inAction.configure (actionSpec);
								inCallback (inAction, inGetActionSync && inGetTriggerSync);
							}
						);
					}
					else
					{
						console.error ("no actionlet for action name " + actionSpec.actionName);
						inCallback (inAction, inGetActionSync);
					}
				}
			);
		}
		else
		{
			inCallback (null, true);
		}
	}
	else
	{
		inCallback (null, true);
	}
}

// intended for use by Js clients
positron.ActionFactory.fireAction =
function ActionFactory_fireAction (inActionString, inActionParams, inElement)
{
	var	actionSpec = positron.ActionFactory.parseAction (inActionString);
	
	if (actionSpec.actionName)
	{
		gApplication.getActionletAsync
		(
			actionSpec.actionName,
			function (inAction, inSync)
			{
				if (inAction)
				{
					if (inElement)
					{
						actionSpec.element = inElement;
					}
					else
					{
						actionSpec.element = window;
					}
			
					// we don't support param-keys or fire-param-keys
					// as the params come in as Js
					// and this is fire time, not walk time
					actionSpec.params = inActionParams;
					actionSpec.explicitParams = inActionParams;
			
					inAction.configure (actionSpec);
					inAction.fire ();
				}
				else
				{
					console.error ("no actionlet for action name " + actionSpec.actionName);
				}
			}
		);
	}
	else
	{
		console.error ("no action name in action " + inActionString);
	}
}

positron.ActionFactory.getTriggerlet =
function ActionFactory_getTriggerlet (inActionSpec, inCallback)
{
	if (inActionSpec.triggerName)
	{
		gApplication.getTriggerletAsync (inActionSpec.triggerName, inCallback);
	}
	else
	{
		inCallback (null, true);
	}
}

positron.ActionFactory.parseAction =
function ActionFactory_parseAction (inActionString)
{
	// console.log ("ActionFactory.parseAction(" + inActionString + ")");

	inActionString = monohm.String.stripSpaces (inActionString);
	
	var	actionString = "";
	var	triggerString = "";
	var	hadTriggerString = false;
	var	inTriggerString = false;
	
	for (var i = 0; i < inActionString.length; i++)
	{
		var	ch = inActionString.charAt (i);
		
		if (inTriggerString)
		{
			if (ch == ')')
			{
				inTriggerString = false;
				hadTriggerString = true;
			}
			else
			{
				triggerString += ch;
			}
		}
		else
		if (hadTriggerString)
		{
			actionString += ch;
		}
		else
		{
			if (ch == '(')
			{
				inTriggerString = true;
			}
			else
			{
				hadTriggerString = true;
				actionString += ch;
			}
		}
	}

	var	action = new Object ();
	
	var	triggerSpec = this.parseSpec (triggerString);
	action.triggerName = triggerSpec.name;
	action.triggerArgs = triggerSpec.args;
	action.triggerArgString = triggerSpec.argString;
	
	action.capturePhase = false;
	action.preventDefault = false;
	action.stopPropagation = false;
	
	// check for our special last argument
	if (action.triggerArgs.length > 0)
	{
		var	lastEventArg = action.triggerArgs [action.triggerArgs.length - 1];
		
		if (lastEventArg.length > 1
			&& (lastEventArg.charAt (0) == ":" || lastEventArg.charAt (0) == "-"))
		{
			if (lastEventArg.charAt (0) == ":")
			{
				console.error (": in trigger flags is deprecated, please use - instead");
			}
			
			for (var i = 1; i < lastEventArg.length; i++)
			{
				var	ch = lastEventArg.charAt (i);
				
				if (ch == 'c')
				{
					action.capturePhase = true;
				}
				else
				if (ch == 'p')
				{
					action.preventDefault = true;
				}
				else
				if (ch == 's')
				{
					action.stopPropagation = true;
				}
				else
				{
					console.error ("unknown trigger flag: " + ch);
				}
			}
			
			// remove the arg so the trigger doesn't see it
			action.triggerArgs.pop ();
			
			// and rejig the trigger arg string too
			action.triggerArgString = action.triggerArgs.join ("/");
		}
	}
		
	// event name is allowed a default of "click"
	if (!action.triggerName || !action.triggerName.length)
	{
		action.triggerName = "click";
	}

	// backside protect now we support space delimiters
	actionString = monohm.String.stripSpaces (actionString);
	
	var	actionSpec = this.parseSpec (actionString);
	action.actionName = actionSpec.name;
	action.actionArgs = actionSpec.args;
	action.actionArgString = actionSpec.argString;

	return action;	
};

positron.ActionFactory.parseParams = function (inElement, inAttributeName)
{
	var	params = null;
	var	paramString = inElement.getAttribute (inAttributeName);
	
	if (paramString)
	{
		params = positron.Util.parseParams (paramString);
	}
	else
	{
		params = new Object ();
	}
	
	return params;
}

// anyone suggest a better name?
positron.ActionFactory.parseSpec = function (inSpecString)
{
	var	spec = new Object ();
	
	var	delimiterIndex = -1;
	
	var	colonIndex = inSpecString.indexOf (':');
	var	spaceIndex = inSpecString.indexOf (' ');
	
	if (colonIndex > 0)
	{
		if (spaceIndex > 0)
		{
			if (colonIndex < spaceIndex)
			{
				delimiterIndex = colonIndex;
			}
			else
			{
				delimiterIndex = spaceIndex;
			}
		}
		else
		{
			delimiterIndex = colonIndex;
		}
	}
	else
	{
		delimiterIndex = spaceIndex;
	}
	
	if (delimiterIndex > 0)
	{
		spec.name = monohm.String.stripSpaces (inSpecString.substring (0, delimiterIndex));
		
		var	argString = inSpecString.substring (delimiterIndex + 1);
		argString = monohm.String.stripSpaces (argString);

		var	quoted = false;
		
		// HACK rudimentary check for quoting here
		if (argString.length > 1)
		{
			if ((argString [0] == "\"" || argString  [0] == "'")
				&& argString [0] == argString [argString.length - 1])
			{
				argString = argString.substring (1, argString.length - 1);
				quoted = true;
			}
		}

		// save the entire arg string so that some triggers/actions can use it all
		spec.argString = argString;

		spec.args = argString.split ('/');
		
		// only strip spaces from discrete args if the arg string wasn't quoted
		if (!quoted)
		{
			for (var i = 0; i < spec.args.length; i++)
			{
				spec.args [i] = monohm.String.stripSpaces (spec.args [i]);
			}
		}
	}
	else
	{
		spec.name = monohm.String.stripSpaces (inSpecString);
		spec.args = new Array ();
		spec.argString = "";
	}

	return spec;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.Action");

positron.action.Action = function ()
{
}

positron.action.Action.prototype.cancel = function ()
{
	if (this.trigger)
	{
		this.trigger.cancel ();
	}
}

positron.action.Action.prototype.configure = function (inActionSpec)
{
	this.element = inActionSpec.element;
	
	this.triggerName = inActionSpec.triggerName;
	this.triggerArgs = inActionSpec.triggerArgs;
	this.triggerArgString = inActionSpec.triggerArgString;

	this.actionName = inActionSpec.actionName;
	this.actionArgs = inActionSpec.actionArgs;
	this.actionArgString = inActionSpec.actionArgString;
	
	// should rename these?
	this.params = inActionSpec.params;
	this.explicitParams = inActionSpec.explicitParams;

	this.paramKeys = inActionSpec.paramKeys;
	this.fireParamKeys = inActionSpec.fireParamKeys;
	
	this.preventDefault = inActionSpec.preventDefault;
	this.stopPropagation = inActionSpec.stopPropagation;
}

// do NOT add a prefix
// largely for use by plugins
positron.action.Action.prototype.dispatchEvent = function (inDetail)
{
	this.dispatchEventType (this.actionName, inDetail);
}

positron.action.Action.prototype.dispatchEventType = function (inType, inDetail)
{
	if (gApplication.getConfigEntry ("window-events." + inType, false))
	{
		element = window;
	}
	else
	{
		element = this.element;
	}
	
	if (element)
	{
		monohm.DOM.dispatchEvent
		(
			element,
			inType,
			inDetail
		);
	}
	else
	{
		// idr how this happens, but actions do check
		console.error ("can't dispatch event of type " + inType + " due to no element");
	}
}

// add the regular event prefix
// for use by standard unprefixed Positron actions
positron.action.Action.prototype.dispatchPrefixedEvent = function (inDetail)
{
	this.dispatchEventType (gApplication.getEventPrefix () + this.actionName, inDetail);
}

// so we can do p-play-sound-start and p-play-sound-end
// without hardwiring the "play-sound" segment
positron.action.Action.prototype.dispatchPrefixedSuffixedEvent = function (inSuffix, inDetail)
{
	this.dispatchEventType (gApplication.getEventPrefix () + this.actionName + inSuffix, inDetail);
}

positron.action.Action.prototype.register = function (inContext)
{
	// move the deferral decision to config
	if (gApplication.config.deferredTriggers && gApplication.config.deferredTriggers [this.triggerName])
	{
		if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("deferring trigger (" + this.triggerName + ")");
		
		// let the trigger find things in context
		this.trigger.preRegister (this, inContext);
		
		// defer this registration until after the treewalk is finished
		positron.DOM.getParentView (this.element).addDeferredAction (this);
	}
	else
	{
		try
		{
			this.trigger.register (this, inContext);
			
			// we registered ok, see if we need to schedule a cancel
			if (this.trigger.requiresCancel ())
			{
				positron.DOM.getParentView (this.element).addCancellableAction (this);
			}
		}
		catch (inError)
		{
			console.error ("error while running trigger (" + this.triggerName + ")");
			console.error (inError.message);
		}
	}
};

positron.action.Action.prototype.fire = function (inEvent)
{
	this.fireAnalyticsEvent ();
	
	if (inEvent)
	{
		// we always guarantee this, saves confusion
		this.params.event = inEvent;
		
		if (this.preventDefault)
		{
			if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("preventing default on event");
			inEvent.preventDefault ();
		}
		
		if (this.stopPropagation)
		{
			if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("stop propagation on event");
			inEvent.stopPropagation ();
		}
	}
	
	for (var fireKey in this.fireParamKeys)
	{
		var	paramFireKeyValue = this.fireParamKeys [fireKey];

		if (paramFireKeyValue && paramFireKeyValue.length)
		{
			// strip any extraneous "params." at the start, which is forgiveable
			paramFireKeyValue = paramFireKeyValue.replace (/^params\./, "");

			// can only reference off params in param keys
			var	object = this.params;
	
			var	fireKeyValueElements = paramFireKeyValue.split (".");
			
			for (var i = 0; (i < fireKeyValueElements.length) && object; i++)
			{
				object = object [fireKeyValueElements [i]];
			}
			
			if (object)
			{
				this.params [fireKey] = object;
				this.explicitParams [fireKey] = object;
			}
			else
			{
				console.error ("failed to traverse param fire key at element " + fireKeyValueElements [i]);
				console.error ("fire key was " + fireKey);
			}
		}
	}
};

// this happens on action.fire()
// so fire the trigger event
// then the action one
// for some nice cause and effect
positron.action.Action.prototype.fireAnalyticsEvent = function ()
{
	var	view = null;
	
	if (this.element)
	{
		if (this.element == document.head || this.element == document.body || this.element == window)
		{
			view = gApplication.window;
		}
		else
		{
			view = positron.DOM.getParentView (this.element);
		}
	}
	
	var	page = null;
	
	if (view)
	{
		// caution, the enclosing view might *be* a page
		if (view.page)
		{
			page = view.page;
		}
		else
		{
			// view.page is null, therefore view is a page
			page = view;
			view = null;
		}
	}
	else
	{
		page = gApplication.page;
	}
	
	// ensure that the action event goes after the trigger one
	var	timestamp = new Date ().getTime ();
	
	// if the trigger fires its own events, don't do it here
	if (!this.trigger || !this.trigger.firesAnalyticsEvents ())
	{
		gApplication.fireAnalyticsEvent
		({
			domain: "trigger",
			timestamp: timestamp,
			page: page.key,
			view: view ? view.key : null,
			name: this.triggerName,
			detail: "args=" + this.triggerArgString
		});
	}
	
	gApplication.fireAnalyticsEvent
	({
		timestamp: timestamp + 1,
		domain: "action",
		page: page.key,
		view: view ? view.key : null,
		name: this.actionName,
		detail: "args=" + this.actionArgString + "&params=" + positron.Util.unparseParams (this.params)
	});
}

// a little nicer for triggers than setting in params directly
positron.action.Action.prototype.setParam = function (inKey, inValue)
{
	this.params [inKey] = inValue;
}

// a little nicer for triggers than setting in params directly
positron.action.Action.prototype.setParams = function (inParams)
{
	for (var key in inParams)
	{
		this.setParam (key, inParams [key]);
	}
}

positron.action.Action.prototype.toString = function ()
{
	var	string = "(" + this.triggerName;
	
	if (this.triggerArgString.length > 0)
	{
		string += ": " + this.triggerArgString;
	}
	
	string += ") " + this.actionName;
	
	if (this.actionArgString.length > 0)
	{
		string += ": " + this.actionArgString;
	}
	
	return string;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.ValidateFormAction");

// validates forms according to the HTML5 standard
// unlike most browsers
// must be registered on the <form> tag

positron.action.ValidateFormAction = function ()
{
	positron.action.Action.call (this);

	this.formValidators = new Object ();
	this.formValidators.email = this.validateEmail;
	this.formValidators.file = this.validateFile;
	this.formValidators.number = this.validateNumber;
	this.formValidators.url = this.validateURL;

}
monohm.inherits (positron.action.ValidateFormAction, positron.action.Action);

positron.action.ValidateFormAction.prototype.fire = function (inEvent)
{
	// run eventlets
	positron.action.Action.prototype.fire.call (this, inEvent);

	try
	{
		var formValid = true;
		var	firstInvalidInput = null;
		
		var	form = inEvent.target;
		
		for (var i = 0; i < form.elements.length; i++)
		{
			var	element = form.elements [i];
			var	tagName = element.tagName.toLowerCase ();
			
			var	valid = true;
			
			if (tagName == "button")
			{
				// nothing to be validated for a button
			}
			else
			if (tagName == "input")
			{
				valid = this.validateInput (element);
			}
			else
			if (tagName == "select")
			{
				valid = this.validateSelect (element);
			}
			else
			if (tagName == "textarea")
			{
				valid = this.validateTextArea (element);
			}
			else
			{
				console.error ("unknown tag name in form validator (" + tagName + ")");
			}
			
			if (valid)
			{
				positron.DOM.removeClass (element, "error");
			}
			else
			{
				positron.DOM.addClass (element, "error");
				
				formValid = false;
				
				if (firstInvalidInput == null)
				{
					// console.error ("marking first invalid input");
					// console.error (element);
					firstInvalidInput = element;
				}
			}
		}
		
		if (! formValid)
		{
			firstInvalidInput.focus ();
		}
	}
	catch (inError)
	{
		console.error (inError);
	}
	
	// if the form failed validation, stop it submitting
	// otherwise, leave for subclass to handle
	if (! formValid)
	{
  	inEvent.preventDefault ();
	}
	
	return formValid;
};

// element tag type validators

positron.action.ValidateFormAction.prototype.validateInput = function (inInput)
{
	var	valid = true;
	var	value = inInput.value;

	if (value == null)
	{
		value = "";
	}
	
	var	required = inInput.getAttribute ("required");
	
	// sadly we have to let the zero length attribute mean "true"
	// thanks, DOM designers!
	if (required && (required.toLowerCase () != "false"))
	{
		valid = value != null && value.length > 0;
	}
	else
	{
		// if the field is empty and not required, skip it
		if (value == "")
		{
			return true;
		}
	}
	
	if (valid)
	{
		var	pattern = inInput.getAttribute ("pattern");
		
		if (pattern && pattern.length)
		{
			valid = this.validatePattern (value, pattern);
		}
	}

	if (valid)
	{
		var	type = inInput.getAttribute ("type");
		
		if (type && type.length)
		{
			type = type.toLowerCase ();
		}
		else
		{
			type = "text";
		}
		
		var	validator = this.formValidators [type];
		
		if (validator)
		{
			valid = validator.call (this, inInput);
		}
	}
	
	return valid;
}

positron.action.ValidateFormAction.prototype.validateSelect = function (inSelect)
{
	var	valid = true;
	
	if (inSelect.selectedIndex == -1)
	{
		valid = false;
	}
	else
	{
		var	option = inSelect.options [inSelect.selectedIndex];
		valid = option.value && option.value.length;
	}
	
	return valid;
}

positron.action.ValidateFormAction.prototype.validateTextArea = function (inTextArea)
{
	var	valid = true;
	var	value = inTextArea.value;

	if (value == null)
	{
		value = "";
	}
	
	var	required = inTextArea.getAttribute ("required");
	
	// sadly we have to let the zero length attribute mean "true"
	// thanks, DOM designers!
	if (required && (required.toLowerCase () != "false"))
	{
		valid = value != null && value.length > 0;
	}

	// looks like "required" is the only validator allowed on <textarea>
	return valid;
}

// input type validators

positron.action.ValidateFormAction.prototype.validateEmail = function (inInput)
{
	var	valid = false;
	
	var	value = inInput.value;
	
	if (value && value.length)
	{
		valid = monohm.String.validateEmailAddress (value);
	}
	
	return valid;
}

// handy because some browsers (i'm looking at you, Apple) 
// don't enforce required when it comes to "file" type inputs sigh
positron.action.ValidateFormAction.prototype.validateFile = function (inInput)
{
	return inInput.value && inInput.value.length;
}

positron.action.ValidateFormAction.prototype.validateNumber = function (inInput)
{
	var	valid = true;
	
	var	value = inInput.value;
	value = parseInt (value);
	
	if (isNaN (value))
	{
		valid = false;
	}
	else
	{
		var	min = inInput.getAttribute ("min");
		
		if (min && min.length)
		{
			min = parseInt (min);
			
			if (isNaN (min))
			{
				min = null;
			}
		}

		var	max = inInput.getAttribute ("max");
		
		if (max && max.length)
		{
			max = parseInt (max);
			
			if (isNaN (max))
			{
				max = null;
			}
		}
		
		if (typeof (min) == "number")
		{
			valid = value >= min;
		}
		
		if (valid)
		{
			if (typeof (max) == "number")
			{
				valid = value <= max;
			}
		}
	}
	
	return valid;
}

positron.action.ValidateFormAction.prototype.validateURL = function (inInput)
{
	var	valid = false;
	
	var	value = inInput.value;
	
	if (value && value.length)
	{
		valid = value.match (new RegExp ("[a-zA-Z]+:")) != null;
	}
	
	return valid;
}

// not an input type validator, this responds to the "pattern" attribute

positron.action.ValidateFormAction.prototype.validatePattern = function (inValue, inPattern)
{
	return inValue.match (new RegExp (inPattern)) != null;
}




/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.AddClassAction");

positron.action.AddClassAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.AddClassAction, positron.action.Action);

positron.action.AddClassAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 1)
	{
		var	specifiers = this.actionArgs.slice (1);
		var	elements = positron.DOM.resolveCompositeElementsArray (this.element, specifiers);

		for (var i = 0; i < elements.length; i++)
		{
			positron.DOM.addClass (elements [i], this.actionArgs [0]);
		}
	}
	else
	{
		console.error ("AddClassAction with bad arguments: " + this.actionArgString);
	}

	this.dispatchPrefixedEvent ();
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.AddToListAction");

positron.action.AddToListAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.AddToListAction, positron.action.Action);

positron.action.AddToListAction.prototype.fire = function (inEvent, inContext)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		var	listKey = this.actionArgs [0];

		var	list = gApplication.getContextReference (listKey, gApplication.context);
		
		if (list && Array.isArray (list))
		{
			var	compareObject = null;
			
			// check to see whether we have explicit keys to compare
			for (var i = 1; i < this.actionArgs.length; i++)
			{
				var	compareKey = this.actionArgs [i];
				
				if (compareKey.length)
				{
					var	compareValue = this.explicitParams [compareKey];
					
					if (compareValue)
					{
						if (compareObject == null)
						{
							compareObject = new Object ();
						}

						compareObject [compareKey] = compareValue;
					}
					else
					{
						console.error ("AddToListAction: found empty compare value for key " + compareKey);
					}
				}
				else
				{
					console.error ("AddToListAction: found empty compare key at index " + i);
				}
			}
			
			if (compareObject == null)
			{
				compareObject = this.explicitParams;
			}
			
			var	found = false;
			
			for (var i = 0; i < list.length; i++)
			{
				var	listEntry = list [i];
				
				found = true;
				
				for (var paramKey in compareObject)
				{
					if (monohm.Object.compare (listEntry [paramKey], compareObject [paramKey]) != 0)
					{
						found = false;
						break;
					}
				}
				
				// now we have proper key support
				// update when found
				if (found)
				{
					list [i] = monohm.Object.clone (this.explicitParams);
					break;
				}
			}
			
			if (!found)
			{
				list.push (monohm.Object.clone (this.explicitParams));
			}
		}
		else
		{
			if (list)
			{
				console.error ("AddToListAction finds non-list context entry with key " + listKey);
			}
			else
			{
				list = new Array ();
				list.push (monohm.Object.clone (this.explicitParams));

				gApplication.context.put (listKey, list);
			}
		}
	}
	else
	{
		console.error ("AddToListAction with no list key in arguments");
	}
	
	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.AddToMapAction");

positron.action.AddToMapAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.AddToMapAction, positron.action.Action);

positron.action.AddToMapAction.prototype.fire = function (inEvent, inContext)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 1 && this.actionArgs [0].length > 0 && this.actionArgs [1].length > 0)
	{
		var	key = this.actionArgs [0];
		var	mapKey = this.actionArgs [1];

		if (this.explicitParams [key])
		{
			var	map = gApplication.getContextReference (mapKey, gApplication.context);
			
			if (!map)
			{
				map = new Object ();
				gApplication.context.put (mapKey, map);
			}

			map [this.explicitParams [key]] = monohm.Object.clone (this.explicitParams);
		}
		else
		{
			console.error ("AddToMapAction with bad key parameter " + key);
		}
	}
	else
	{
		console.error ("AddToMapAction with no map key and/or key in arguments");
	}
	
	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.AjaxFormAction");

// submit the form as an Ajax request
// dispatch events when the request returns
// must be registered on the <form> tag

positron.action.AjaxFormAction = function ()
{
	positron.action.ValidateFormAction.call (this);
}
monohm.inherits (positron.action.AjaxFormAction, positron.action.ValidateFormAction);

positron.action.AjaxFormAction.prototype.fire = function (inEvent)
{
	if (! positron.action.ValidateFormAction.prototype.fire.call (this, inEvent))
	{
		return;
	}
	
	// we never let the form submit
	inEvent.preventDefault ();

	// ASSUME that we're registered on the form tag
	var	form = inEvent.target;

	// start with the action from the form tag, as it might have some parameters in it
	var	action = form.action;
	
	if (!action || !action.length)
	{
		console.error ("form has no action, not proceeding");
		return;
	}
	
	var	sendRequest = true;
	
	var	parameters = null;
	var	actionElements = action.split ('?');
	action = actionElements [0];
	
	if (actionElements.length > 1)
	{
		parameters = actionElements [1];
	}
	else
	{
		parameters = "";
	}
	
	for (var i = 0; i < form.elements.length; i++)
	{
		var	element = form.elements [i];
		var	tagName = element.tagName.toLowerCase ();
		
		if (tagName == "input" || tagName == "textarea")
		{
			if (element.type == "file")
			{
				console.error ("input type file not supported");
				sendRequest = false;
				break;
			}
			
			if (parameters.length > 0)
			{
				parameters += "&";
			}
			
			parameters += element.name + '=' + element.value;
		}
		else
		if (tagName == "select")
		{
			var	selectedOption = element.options [element.selectedIndex];

			if (parameters.length > 0)
			{
				parameters += "&";
			}
			
			parameters += element.name + '=' + selectedOption.value;
		}
		else
		{
			console.error ("unknown tag name in form validator (" + tagName + ")");
		}
	}
	
	if (sendRequest)
	{
		var	method = null;
		
		if (form.method && form.method.length)
		{
			method = form.method;
		}
		else
		{
			method = "GET";
		}
		
		var	self = this;
		
		monohm.Network.ajax
		({
			url: action,
			data: parameters,
			type: method,
			dataType: "json",
			async: true,
			success: function (inData, inTextStatus, inXHR)
			{
				if (gApplication && gApplication.isLogging (gApplication.kLogLoader))
					console.log ("success");
	
				self.dispatchPrefixedEvent (inData);
			},
			error: function (inXHR, inTextStatus, inError)
			{
				if (gApplication && gApplication.isLogging (gApplication.kLogLoader))
				{
					console.error ("load of " + action + " failed");
					console.error (inError);
				}

				self.dispatchPrefixedEvent
				(
					{
						error: inError
					}
				);
			}
		});
	}
	
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.AjaxAction");

positron.action.AjaxAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.AjaxAction, positron.action.Action);

positron.action.AjaxAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	url = this.actionArgString;
	
	if (url == null || url.length == 0)
	{
		console.error ("AjaxAction with no URL in arguments");

		this.dispatchPrefixedEvent
		(
			{
				error: "AjaxAction with no URL in arguments"
			}
		);
	}
	else
	{
		var	self = this;

		monohm.Network.ajax
		({
			url: url,
			data: this.explicitParams,
			dataType: "json",
			async: true,
			type: this.actionName == "ajaxget" ? "GET" : "POST",
			success: function (inData, inTextStatus, inXHR)
			{
				self.dispatchPrefixedEvent (inData);
			},
			error: function (inXHR, inTextStatus, inError)
			{
				if (gApplication && gApplication.isLogging (gApplication.kLogLoader))
				{
					console.error ("load of " + url + " failed");
					console.error (inError.message);
				}

				self.dispatchPrefixedEvent
				(
					{
						error: inError
					}
				);
			}
		});
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.AlertAction");

positron.action.AlertAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.AlertAction, positron.action.Action);

positron.action.AlertAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgString && this.actionArgString.length)
	{
		alert (this.actionArgString);

		this.dispatchPrefixedEvent ();
	}
	else
	{
		if (this.params.message)
		{
			alert (this.params.message);
		}
		else
		{
			alert ("AlertAction with no arg string or message param");
		}
	}
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.AppendValueAction");

positron.action.AppendValueAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.AppendValueAction, positron.action.Action);

positron.action.AppendValueAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length > 0)
	{
		var	elements = positron.DOM.resolveCompositeElementsArray (this.element, this.actionArgs);

		var	value = this.params.value;
		
		if (typeof (value) == "string")
		{
			for (var i = 0; i < elements.length; i++)
			{
				elements [i].value += value;
				
				if (elements [i].tagName.toLowerCase () == "textarea")
				{
					elements [i].value += "\n";
				}
			}
		}
	}
	else
	{
		console.error ("AppendValueAction with bad arguments: " + this.actionArgString);
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.CallAction");

positron.action.CallAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.CallAction, positron.action.Action);

positron.action.CallAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	argument1 = this.actionArgs.length > 0 ? this.actionArgs [0] : undefined;
	var	argument2 = this.actionArgs.length > 1 ? this.actionArgs [1] : undefined;

	if (argument1 && argument1.length)
	{
		var	view = null;
		
		if (argument2 && argument2.length)
		{
			view = gApplication.getView (argument2);
			
			if (!view)
			{
				console.error ("cannot find view (" + argument2 + ")");
				return;
			}
		}
		
		if (view)
		{
			if (typeof (view [argument1]) == "function")
			{
				view.setParams (this.params);
				
				try
				{
					view [argument1].call (view, inEvent);
				}
				catch (inError)
				{
					console.log ("error invoking " + view.key + "." + argument1 + "()");
					console.error (inError.message);
				}
			}
			else
			{
				console.error ("cannot find method " + view.key + "." + argument1);
			}
		}
		else
		{
			var	found = false;
			var	parent = this.element;
			
			do
			{
				var	view = positron.DOM.getData (parent, "view");
	
				if (view)
				{
					if (typeof (view [argument1]) == "function")
					{
						found = true;
	
						view.setParams (this.params);
					
						try
						{
							view [argument1].call (view, inEvent);
						}
						catch (inError)
						{
							console.log ("error invoking " + view.key + "." + argument1 + "()");
							console.error (inError.message);
						}
						
						break;
					}
				}
			}
			while (parent = parent.parentNode);
			
			if (!found)
			{
				if (typeof (gApplication [argument1]) == "function")
				{
					gApplication.setParams (this.params);
					gApplication [argument1].call (gApplication, inEvent);
				}
				else
				{
					if (typeof (window [argument1]) == "function")
					{
						window [argument1].call (argument1, inEvent, this.params);
					}
					else
					{
						console.error ("CallAction cannot find function (" + argument1 + ")");
					}
				}
			}
		}
	}
	else
	{
		console.error ("CallAction.process() called with insufficient arguments");
		console.error (this.element);
	}

	this.dispatchPrefixedEvent ();
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.ClearListAction");

positron.action.ClearListAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.ClearListAction, positron.action.Action);

positron.action.ClearListAction.prototype.fire = function (inEvent, inContext)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		var	listKey = this.actionArgs [0];

		var	list = gApplication.getContextReference (listKey, gApplication.context);
		
		if (list && Array.isArray (list))
		{
			list.length = 0;
		}
		else
		{
			console.error ("ClearListAction can't find list with key " + mapKey);
		}
	}
	else
	{
		console.error ("ClearListAction with no list key in arguments");
	}
	
	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.ClearMapAction");

positron.action.ClearMapAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.ClearMapAction, positron.action.Action);

positron.action.ClearMapAction.prototype.fire = function (inEvent, inContext)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		var	mapKey = this.actionArgs [0];
		
		var	map = gApplication.getContextReference (mapKey, gApplication.context);
		
		if (map)
		{
			for (var key in map)
			{
				if (map.hasOwnProperty (key))
				{
					delete map [key];
				}
			}
		}
		else
		{
			console.error ("ClearMapAction can't find map with key " + mapKey);
		}
	}
	else
	{
		console.error ("ClearMapAction with no map key arguments");
	}
	
	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.CloseWebSocketAction");

positron.action.CloseWebSocketAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.CloseWebSocketAction, positron.action.Action);

positron.action.CloseWebSocketAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		var	webSocketName = this.actionArgs [0];
		var	webSocket = gApplication.getWebSocket (webSocketName);
		
		if (webSocket)
		{
			gApplication.removeWebSocket (webSocketName);
		}
		else
		{
			console.log ("CloseWebSocketAction can't find websocket with name: " + webSocketName);
		}
	}
	else
	{
		console.error ("CloseWebSocketAction with no socket name argument");
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.ConfirmAction");

positron.action.ConfirmAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.ConfirmAction, positron.action.Action);

positron.action.ConfirmAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgString.length > 0)
	{
		if (confirm (this.actionArgString))
		{
			this.dispatchPrefixedEvent ();
		}
	}
	else
	{
		console.error ("ConfirmAction with no message in arguments");
	}
	
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.DelayAction");

positron.action.DelayAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.DelayAction, positron.action.Action);

positron.action.DelayAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	time = 1000;
	
	if (this.actionArgs.length > 0)
	{
		time = monohm.String.parseTime (this.actionArgs [0], 1000);
		
		if (time <= 0)
		{
			time = 1000;
		}
	}

	var	self = this;
	
	setTimeout
	(
		function ()
		{
			self.dispatchPrefixedEvent ();
		},
		time
	);
	
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.DeleteSQLRecordAction");

positron.action.DeleteSQLRecordAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.DeleteSQLRecordAction, positron.action.Action);

positron.action.DeleteSQLRecordAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length < 4)
	{
		console.error ("DeleteSQLRecordAction requires database, table, column & value arguments");
		return;
	}

	var	self = this;
	
	monohm.SQLDatabase.delete
	(
		this.actionArgs [0],
		this.actionArgs [1],
		this.actionArgs [2],
		this.actionArgs [3],
		function (inError)
		{
			if (inError)
			{
				console.error ("error deleting from table " + self.actionArgString);
				console.error (inError);
			}
			
			self.dispatchPrefixedEvent ();
		}
	);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.DispatchEventAction");

positron.action.DispatchEventAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.DispatchEventAction, positron.action.Action);

positron.action.DispatchEventAction.prototype.fire = function (inEvent)
{
	if (this.actionArgs.length && this.actionArgs [0].length)
	{
		var	eventName = this.actionArgs [0];

		var	dispatchElement = null;
		
		if (gApplication.getConfigEntry ("window-events." + eventName, false))
		{
			dispatchElement = window;
		}
		else
		{
			dispatchElement = this.element;
		}
		
		monohm.DOM.dispatchEvent (dispatchElement, eventName, this.explicitParams);
	}
	else
	{
		console.error ("DispatchEventAction with no event type in arguments");
	}
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.DispatchFormAction");

// validate the form
// then copy its elements into an event
// and dispatch
// so that the receiving action is isolated from the form

positron.action.DispatchFormAction = function ()
{
	positron.action.ValidateFormAction.call (this);
}
monohm.inherits (positron.action.DispatchFormAction, positron.action.ValidateFormAction);

positron.action.DispatchFormAction.prototype.fire = function (inEvent)
{
	if (! positron.action.ValidateFormAction.prototype.fire.call (this, inEvent))
	{
		return;
	}
	
	// we never let the form submit
	inEvent.preventDefault ();

	var	dispatch = true;
	
	// form values
	var	eventDetail = new Object ();
	
	// ASSUME that we're registered on the form tag
	var	form = inEvent.target;

	for (var i = 0; i < form.elements.length; i++)
	{
		var	element = form.elements [i];
		var	tagName = element.tagName.toLowerCase ();
		
		if (tagName == "input")
		{
			if (element.type == "file")
			{
				console.error ("input type file not supported");
				dispatch = false;
				break;
			}
			
			if (element.type == "submit")
			{
				continue;
			}
			
			eventDetail [element.name] = element.value;
		}
		else
		if (tagName == "select")
		{
			var	selectedOption = element.options [element.selectedIndex];
			eventDetail [element.name] = selectedOption.value;
		}
		else
		if (tagName == "button")
		{
			// nothing to be copied for buttons
		}
		else
		if (tagName == "textarea")
		{
			eventDetail [element.name] = element.value;
		}
		else
		{
			console.error ("unknown tag name in form dispatch (" + tagName + ")");
		}
	}
	
	if (dispatch)
	{
		this.dispatchPrefixedEvent (eventDetail);
	}
	else
	{
		console.error ("form dispatch defeated");
	}
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.FlushCacheAction");

positron.action.FlushCacheAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.FlushCacheAction, positron.action.Action);

positron.action.FlushCacheAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length > 0)
	{
		for (var i = 0; i < this.actionArgs.length; i++)
		{
			var	key = this.actionArgs [i];
			
			if (key && key.length)
			{
				gApplication.cache.flush (key);
			}
		}
	}
	else
	{
		gApplication.cache.flushAll ();
	}
	
	this.dispatchPrefixedEvent ();
};


/**
*
* @license
* Copyright Â© 2013 Jason Proctor.  All rights reserved.
*
**/

monohm.provide ("positron.action.FacebookAuthoriseAction");

positron.action.FacebookAuthoriseAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.FacebookAuthoriseAction, positron.action.Action);

positron.action.FacebookAuthoriseAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	url = "https://www.facebook.com/v2.0/dialog/oauth";
	url += "?client_id=" + gApplication.config.oauth.facebook.consumer_key;
	url += "&redirect_uri=" + gApplication.config.oauth.facebook.redirect_uri;
	url += "&response_type=token";

	window.open (url);
};

/**
*
* @license
* Copyright Â© 2013 Jason Proctor.  All rights reserved.
*
**/

monohm.provide ("positron.action.FacebookDeauthoriseAction");

positron.action.FacebookDeauthoriseAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.FacebookDeauthoriseAction, positron.action.Action);

positron.action.FacebookDeauthoriseAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	positron.OAuth.deauthoriseService ("facebook");
	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright Â© 2013 Jason Proctor.  All rights reserved.
*
**/

monohm.provide ("GoogleAuthoriseAction");

positron.action.GoogleAuthoriseAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.GoogleAuthoriseAction, positron.action.Action);

positron.action.GoogleAuthoriseAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	url = "https://accounts.google.com/o/oauth2/auth";
	url += "?client_id=" + gApplication.config.oauth.google.client_id;
	url += "&scope=" + gApplication.config.oauth.google.scope;
	url += "&redirect_uri=" + gApplication.config.oauth.google.redirect_uri;
	url += "&response_type=token";

	window.open (url);
};

/**
*
* @license
* Copyright Â© 2013 Jason Proctor.  All rights reserved.
*
**/

monohm.provide ("GoogleDeauthoriseAction");

positron.action.GoogleDeauthoriseAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.GoogleDeauthoriseAction, positron.action.Action);

positron.action.GoogleDeauthoriseAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	positron.OAuth.deauthoriseService ("google");
	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.GotoURLAction");

positron.action.GotoURLAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.GotoURLAction, positron.action.Action);

positron.action.GotoURLAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	url = this.actionArgString;
	
	if (url == null || url.length == 0)
	{
		url = this.params.url;
	}
	
	if (url && url.length)
	{
		console.log ("GotoURLAction going to " + url);
		document.location.href = url;
	}
	else
	{
		console.error ("GotoURLAction with no URL in first argument or url parameter");
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.HideViewAction");

positron.action.HideViewAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.HideViewAction, positron.action.Action);

positron.action.HideViewAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	var	argument1 = this.actionArgs.length > 0 ? this.actionArgs [0] : undefined;
	var	argument2 = this.actionArgs.length > 1 ? this.actionArgs [1] : undefined;

	if (argument1 && argument1.length)
	{
		gApplication.hideView (argument1, argument2);
	}
	else
	{
		console.error ("HideViewAction: no view key argument");
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.InsertSQLRecordAction");

positron.action.InsertSQLRecordAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.InsertSQLRecordAction, positron.action.Action);

positron.action.InsertSQLRecordAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length < 2)
	{
		console.error ("InsertSQLRecordAction requires database & table arguments");
		return;
	}

	var	self = this;
	
	monohm.SQLDatabase.insert
	(
		this.actionArgs [0],
		this.actionArgs [1],
		this.explicitParams,
		function (inError)
		{
			if (inError)
			{
				console.error ("error inserting into table " + self.actionArgs [0] + "/" + self.actionArgs [1]);
				console.error (inError);
			}

			self.dispatchPrefixedEvent ();
		}
	);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.LogAction");

positron.action.LogAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.LogAction, positron.action.Action);

positron.action.LogAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (typeof (console) != "undefined" && typeof (console.log) == "function")
	{
		if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
		{
			console.log (this.actionArgs [0]);
		}
		else
		{
			console.log (positron.Util.unparseParams (this.params));
		}
	}

	this.dispatchPrefixedEvent ();
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.OpenWindowAction");

positron.action.OpenWindowAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.OpenWindowAction, positron.action.Action);

positron.action.OpenWindowAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	child = null;
	
	if (this.actionArgString.length > 0)
	{
		// sadly, some environments don't like the 3rd param to window.open()
		if (monohm.Object.isEmpty (this.explicitParams))
		{
			child = window.open (this.actionArgString, "child");
		}
		else
		{
			child = window.open (this.actionArgString, "child", this.explicitParams);
		}
	}
	else
	{
		console.error ("OpenWindowAction with no message in arguments");
	}

	this.dispatchPrefixedEvent
	(
		{
			window: child
		}
	);
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.PlaySoundAction");

positron.action.PlaySoundAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.PlaySoundAction, positron.action.Action);

positron.action.PlaySoundAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	
	var	soundName = null;

	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		soundName = this.actionArgs [0];
		
		// this is largely for playing point-sound effects
		// so every sound has its own context
		var	audioContext = gApplication.getAudioContext (soundName);
		var	sound = gApplication.getSound (soundName);
		
		if (sound)
		{
			var source = audioContext.createBufferSource ();
			source.buffer = sound;
			source.connect (audioContext.destination);
			
			var	self = this;
			
			source.onended = function ()
			{
				self.dispatchPrefixedSuffixedEvent
				(
					"-end",
					{
						name: soundName
					}
				);
			}
			
			// used for stopping the sound, among other things
			gApplication.setAudioSource (soundName, source);

			source.start (0);
			
			// note, can't factor this up above
			// as actions etc will run before the sound starts
			// ideally, they would happen simultaneously
			this.dispatchPrefixedSuffixedEvent ("-start");
		}
		else
		{
			console.error ("can't find sound (" + soundName + ")");
			this.dispatchPrefixedSuffixedEvent ("-start");
			this.dispatchPrefixedSuffixedEvent ("-end");
		}
	}
	else
	{
		console.error ("PlaySoundAction: no sound name argument");
		this.dispatchPrefixedSuffixedEvent ("-start");
		this.dispatchPrefixedSuffixedEvent ("-end");
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.PromptAction");

positron.action.PromptAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.PromptAction, positron.action.Action);

positron.action.PromptAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgString.length > 0)
	{
		var	entry = prompt (this.actionArgs [0], this.actionArgs [1]);
		
		// if the user deletes all the text and hits OK
		// we do NOT continue
		if (entry && entry.length)
		{
			this.dispatchPrefixedEvent
			(
				{
					value: entry
				}
			);
		}
	}
	else
	{
		console.error ("PromptAction with no message in arguments");
	}
	
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.RefreshViewAction");

positron.action.RefreshViewAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.RefreshViewAction, positron.action.Action);

positron.action.RefreshViewAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	var	argument1 = this.actionArgs.length > 0 ? this.actionArgs [0] : undefined;
	var	argument2 = this.actionArgs.length > 1 ? this.actionArgs [1] : undefined;

	if (argument1 && argument1.length)
	{
		gApplication.refreshView (argument1, this.params, argument2);
	}
	else
	{
		console.error ("RefreshViewAction: no view key argument");
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.RemoveAttributeAction");

positron.action.RemoveAttributeAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.RemoveAttributeAction, positron.action.Action);

positron.action.RemoveAttributeAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	elements = positron.DOM.resolveCompositeElementsArray (this.element, this.actionArgs);
	
	for (var i = 0; i < elements.length; i++)
	{
		for (var key in this.explicitParams)
		{
			elements [i].removeAttribute (key);
		}
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.RemoveClassAction");

positron.action.RemoveClassAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.RemoveClassAction, positron.action.Action);

positron.action.RemoveClassAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 1)
	{
		var	specifiers = this.actionArgs.slice (1);
		var	elements = positron.DOM.resolveCompositeElementsArray (this.element, specifiers);

		for (var i = 0; i < elements.length; i++)
		{
			positron.DOM.removeClass (elements [i], this.actionArgs [0]);
		}
	}
	else
	{
		console.error ("RemoveClassAction with bad arguments: " + this.actionArgString);
	}

	this.dispatchPrefixedEvent ();
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.RemoveElementAction");

positron.action.RemoveElementAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.RemoveElementAction, positron.action.Action);

positron.action.RemoveElementAction.prototype.fire = function (inEvent, inContext)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	// if there is only one action argument, assume just the selector
	if (this.actionArgs.length > 0)
	{
		var	elements = positron.DOM.resolveCompositeElementsArray (this.element, this.actionArgs);

		for (var i = 0; i < elements.length; i++)
		{
			positron.DOM.removeNode (elements [i]);
		}
	}
	else
	{
		console.error ("RemoveElementAction with bad arguments: " + this.actionArgString);
	}
	
	this.dispatchPrefixedEvent ();
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.RemoveFromListAction");

positron.action.RemoveFromListAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.RemoveFromListAction, positron.action.Action);

positron.action.RemoveFromListAction.prototype.fire = function (inEvent, inContext)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		var	listKey = this.actionArgs [0];

		var	list = gApplication.getContextReference (listKey, gApplication.context);
		
		if (list && Array.isArray (list))
		{
			for (var i = 0; i < list.length; i++)
			{
				var	listEntry = list [i];
				
				var	found = true;
				
				for (var paramKey in this.explicitParams)
				{
					if (listEntry [paramKey] != this.explicitParams [paramKey])
					{
						found = false;
						break;
					}
				}
				
				if (found)
				{
					list.splice (i, 1);

					// assume the list doesn't have dupes
					break;
				}
			}
		}
		else
		{
			console.error ("RemoveFromListAction can't find list with key " + listKey);
		}
	}
	else
	{
		console.error ("RemoveFromListAction with no list key in arguments");
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.RemoveFromMapAction");

positron.action.RemoveFromMapAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.RemoveFromMapAction, positron.action.Action);

positron.action.RemoveFromMapAction.prototype.fire = function (inEvent, inContext)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 1 && this.actionArgs [0].length > 0 && this.actionArgs [1].length > 0)
	{
		var	key = this.actionArgs [0];
		var	mapKey = this.actionArgs [1];
		
		var	map = gApplication.getContextReference (mapKey, gApplication.context);
		
		if (map)
		{
			if (this.explicitParams [key])
			{
				delete map [this.explicitParams [key]];
			}
			else
			{
				console.error ("RemoveFromMapAction with bad key parameter " + key);
			}
		}
		else
		{
			console.error ("RemoveFromMapAction can't find map with key " + mapKey);
		}
	}
	else
	{
		console.error ("RemoveFromMapAction with no map key and/or key in arguments");
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.RunViewAction");

positron.action.RunViewAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.RunViewAction, positron.action.Action);

positron.action.RunViewAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	var	argument1 = this.actionArgs.length > 0 ? this.actionArgs [0] : undefined;

	if (argument1 && argument1.length)
	{
		gApplication.runView (argument1, this.params);
	}
	else
	{
		console.error ("RunViewAction: no view key argument");
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.ScrollAction");

positron.action.ScrollAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.ScrollAction, positron.action.Action);

positron.action.ScrollAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		var	arg = this.actionArgs [0];
		var	position = parseInt (arg);
		
		if (isNaN (position))
		{
			if (arg.charAt (0) == '#')
			{
				arg = arg.substring (1);
				
				var	element = document.getElementById (arg);
				
				if (!element)
				{
					element = document.querySelector ("a[name=" + arg + "]");
				}
				
				if (element)
				{
					element.scrollIntoView ();
				}
				else
				{
					console.error ("ScrollAction: can't find anchor #" + arg);
				}
			}
			else
			{
				console.error ("ScrollAction: argument is neither position nor anchor");
			}
		}
		else
		{
			documentElement.scrollTop (0, position);
		}
	}
	else
	{
		console.error ("ScrollAction: no position or anchor argument");
	}

	this.dispatchPrefixedEvent ();
};

// send-midi-action.js

monohm.provide ("positron.action.SendMIDIAction");

positron.action.SendMIDIAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SendMIDIAction, positron.action.Action);

positron.action.SendMIDIAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length > 0)
	{
		var	portID = parseInt (this.actionArgs [0]);
		
		if (isNaN (portID))
		{
			console.error ("SendMIDIAction with bad port ID " + this.actionArgs [0]);
		}
		else
		{
			if (this.params.message && Array.isArray (this.params.message))
			{
				// HACK we don't currently support the time stamp
				gApplication.sendMIDI (portID, this.params.message);
			}
			else
			{
				// WebMIDI coerces numbers to Uint8s for us
				// which is extraordinarily nice of a standard API
				var	message = new Array ();

				message.push (this.params.status);
				message.push (this.params.data_0);
				message.push (this.params.data_1);
				message.push (this.params.data_2);
				
				for (var i = 0; i < message.length; i++)
				{
					var	byteString = message [i];
					
					if (byteString)
					{
						var	byte = parseInt (byteString);
		
						if (isNaN (byte))
						{
							// we support hex, which is extraordinarily...
							byte = parseInt (byteString, 16);
						}

						if (isNaN (byte))
						{
							console.error ("can't parse data byte from " + byteString);
						}
						else
						{
							message [i] = byte;
						}
					}
					else
					{
						if (i == 0)
						{
							console.error ("no message or status in parameters");
						}
						else
						{
							message.length = i;
							
							gApplication.sendMIDI (portID, message);
						}
					}
				}
			}
		}
	}
	else
	{
		console.error ("SendMIDIAction with no port ID in arguments");
	}
	
	this.dispatchPrefixedEvent ();
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SendWebSocketAction");

positron.action.SendWebSocketAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SendWebSocketAction, positron.action.Action);

positron.action.SendWebSocketAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		var	webSocketName = this.actionArgs [0];
		var	webSocket = gApplication.getWebSocket (webSocketName);
		
		if (webSocket)
		{
			// console.log ("sending to web socket: " + webSocketName);
			// console.log (JSON.stringify (this.explicitParams));
			
			webSocket.send (JSON.stringify (this.explicitParams));
		}
		else
		{
			console.error ("SendWebSocketAction can't find websocket with name: " + webSocketName);
		}
	}
	else
	{
		console.error ("SendWebSocketAction with no socket name argument");
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SelectClassAction");

positron.action.SelectClassAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SelectClassAction, positron.action.Action);

positron.action.SelectClassAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	deselectors = null;
	var	selectors = null;
	
	// action args are view/selector/class
	// view & selector specify the element to be selected
	// class specifies the other elements to be deselected
	
	if (this.actionArgs.length > 1)
	{
		var	deselector = null;

		if (this.actionArgs.length > 2)
		{
			deselector = this.actionArgs [2];
			
			if (deselector.length)
			{
				selectors = positron.DOM.resolveCompositeElements (this.element, this.actionArgs [0], this.actionArgs [1]);
				deselectors = positron.DOM.resolveCompositeElements (this.element, this.actionArgs [0], this.actionArgs [2]);
			}
		}
		else
		{
			deselector = this.actionArgs [1];
			
			if (deselector.length)
			{
				selectors = positron.DOM.resolveCompositeElements (this.element, null, this.actionArgs [0]);
				deselectors = positron.DOM.resolveCompositeElements (this.element, null, this.actionArgs [1]);
			}
		}
	}
	
	if (deselectors)
	{
		for (var i = 0; i < deselectors.length; i++)
		{
			positron.DOM.removeClass (deselectors [i], "selected");
		}

		for (var i = 0; i < selectors.length; i++)
		{
			positron.DOM.addClass (selectors [i], "selected");
		}
	}
	else
	{
		console.error ("SelectClassAction with bad action arguments");
		console.error (this.actionArgs);
	}
	
	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SetAction");

positron.action.SetAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SetAction, positron.action.Action);

positron.action.SetAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	context = gApplication.context;
	
	if (this.actionArgs.length > 0)
	{
		var	contextName = this.actionArgs [0];
		
		if (contextName == "page")
		{
			context = gApplication.page.context;
		}
		else
		if (contextName == "view")
		{
			var	view = positron.DOM.getParentView (this.element);
			
			if (view)
			{
				context = view.context;
			}
		}
		else
		if (contextName != "application")
		{
			console.error ("SetAction with unknown context name '" + contextName + "'");
		}
	}
	
	console.log ("SetAction setting");
	console.log (this.explicitParams);
	
	for (var key in this.explicitParams)
	{
		if (typeof (key) == "string")
		{
			console.log ("SetAction setting explicit param: " + key);
			context.put (key, this.explicitParams [key]);
		}
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SetAttributeAction");

positron.action.SetAttributeAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SetAttributeAction, positron.action.Action);

positron.action.SetAttributeAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	elements = positron.DOM.resolveCompositeElementsArray (this.element, this.actionArgs);

	for (var i = 0; i < elements.length; i++)
	{
		for (var key in this.explicitParams)
		{
			var	value = this.explicitParams [key];
			var	type = typeof (value);
			
			if (type == "string")
			{
				elements [i].setAttribute (key, value);
			}
			else
			if (type == "number")
			{
				elements [i].setAttribute (key, "" + value);
			}
		}
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SetLocalStorageAction");

positron.action.SetLocalStorageAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SetLocalStorageAction, positron.action.Action);

positron.action.SetLocalStorageAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("SetLocalStorageAction.fire()");
	
	if (localStorage)
	{
		// ensure we take the explicit params
		// and not any cruft inserted by triggers, etc
		for (var key in this.explicitParams)
		{
			var	value = this.explicitParams [key];
			
			if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("setting localStorage." + key + " to " + value);

			localStorage [key] = value;
		}
	}
	else
	{
		console.error ("SetLocalStorage with no localStorage functionality");
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SetPageAction");

positron.action.SetPageAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SetPageAction, positron.action.Action);

positron.action.SetPageAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	argument1 = this.actionArgs.length > 0 ? this.actionArgs [0] : undefined;
	var	argument2 = this.actionArgs.length > 1 ? this.actionArgs [1] : undefined;
	var	argument3 = this.actionArgs.length > 2 ? this.actionArgs [2] : undefined;

	gApplication.setPage (argument1, this.params, argument2, argument3);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SetParamsAction");

positron.action.SetParamsAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SetParamsAction, positron.action.Action);

positron.action.SetParamsAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	argument1 = this.actionArgs.length > 0 ? this.actionArgs [0] : undefined;
	var	argument2 = this.actionArgs.length > 1 ? this.actionArgs [1] : undefined;

	var	receiver = null;
		
	if (argument1)
	{
		if (argument1 == "application")
		{
			receiver = gApplication;
		}
		else
		if (argument1 == "page")
		{
			var	page = null;
			
			// second arg is page key
			if (argument2 && argument2.length)
			{
				page = gApplication.getPage (argument2);
				
				if (page)
				{
					receiver = page;
				}
				else
				{
					console.error ("setparams could not find page: " + argument2);
				}
			}
			else
			{
				receiver = gApplication.getPage ();
			}
		}
		else
		if (argument1 == "view")
		{
			var	view = null;
			
			// second arg is view key
			if (argument2 && argument2.length)
			{
				view = gApplication.getView (argument2);
				
				if (view)
				{
					receiver = view;
				}
				else
				{
					console.error ("setparams could not find view: " + argument2);
				}
			}
			else
			{
				console.error ("setparams with no view key specified");
			}
		}

		if (receiver)
		{
			receiver.setParams (this.params);
		}
	}
	else
	{
		console.error ("setparams with no first argument");
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SetStyleAction");

positron.action.SetStyleAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SetStyleAction, positron.action.Action);

positron.action.SetStyleAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length > 0)
	{
		var	elements = positron.DOM.resolveCompositeElementsArray (this.element, this.actionArgs);

		for (var i = 0; i < elements.length; i++)
		{
			for (var key in this.explicitParams)
			{
				elements [i].style [key] = this.explicitParams [key];
			}
		}
	}
	else
	{
		console.error ("SetStyleAction with bad action arguments: " + this.actionArgString);
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SetTransformAction");

positron.action.SetTransformAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SetTransformAction, positron.action.Action);

positron.action.SetTransformAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	// if there is only one action argument, assume just the selector
	if (this.actionArgs.length > 0)
	{
		var	elements = positron.DOM.resolveCompositeElementsArray (this.element, this.actionArgs);

		for (var i = 0; i < elements.length; i++)
		{
			var	styles = positron.CSS.parseStyle (elements [i]);
			var	prefixedTransform = positron.CSS.getPrefixedProperty ("transform");

			transform = styles [prefixedTransform];
	
			var	valueStrings = new Array ();
			
			if (transform)
			{
				for (var name in transform)
				{
					var	newValue = this.params [name];
					
					if (newValue)
					{
						delete transform [name];
					}
					else
					{
						valueStrings.push (positron.CSS.unparsePropertySubvalue (transform [name]));
					}
				}
			}
			
			for (var key in this.params)
			{
				var	value = this.params [key];
				
				if (typeof (value) == "string")
				{
					valueStrings.push (key + value);
				}
			}
			
			var	newValueString = valueStrings.join (" ");
			console.log (prefixedTransform + ": " + newValueString);

			elements [i].style [prefixedTransform] = newValueString;
		}
	}
	else
	{
		console.error ("SetTransformAction with bad arguments: " + this.actionArgString);
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SetValueAction");

positron.action.SetValueAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.SetValueAction, positron.action.Action);

positron.action.SetValueAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length > 0)
	{
		var	elements = positron.DOM.resolveCompositeElementsArray (this.element, this.actionArgs);

		var	value = this.params.value;
		
		for (var i = 0; i < elements.length; i++)
		{
			if (typeof (value) == "string")
			{
				elements [i].value = value;
			}
			else
			{
				elements [i].value = "";
			}
		}
	}
	else
	{
		console.error ("SetValueAction with bad arguments: " + this.actionArgString);
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.StopSoundAction");

positron.action.StopSoundAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.StopSoundAction, positron.action.Action);

positron.action.StopSoundAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length > 0 && this.actionArgs [0].length > 0)
	{
		var	soundName = this.actionArgs [0];

		var	audioSource = gApplication.getAudioSource (soundName);
	
		if (audioSource)
		{
			// stopping the audio source expires it
			gApplication.setAudioSource (soundName, null);

			audioSource.stop (0);
		}
		else
		{
			console.error ("can't find audio source (" + soundName + ")");
		}
	}
	else
	{
		console.error ("StopSoundAction: no sound name argument");
	}

	this.dispatchPrefixedEvent ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.SubmitFormAction");

// submit the first enclosing form we find
// handy for onchange handlers on form elements

positron.action.SubmitFormAction = function ()
{
	positron.action.ValidateFormAction.call (this);
}
monohm.inherits (positron.action.SubmitFormAction, positron.action.ValidateFormAction);

positron.action.SubmitFormAction.prototype.fire = function (inEvent)
{
	var	formElement = null;
	
	if (this.actionArgs.length > 0 && this.actionArgs [0].length)
	{
		formElement = document.forms [this.actionArgs [0]];
	}
	else
	if (this.element.form)
	{
		formElement = this.element;
	}
	else
	{
		for (var element = this.element; element; element = element.parentNode)
		{
			if (element.tagName.toLowerCase () == "form")
			{
				formElement = element;
				break;
			}
		}
	}
	
	if (formElement)
	{
		// we can't call submit() off the form
		// because that will bypass any onsubmit handlers
		// which is a huge bug IMHO
		// so instead we fake up a submit event
		// rubbish web
		formElement.dispatchEvent (positron.DOM.createEvent ("submitform", {}));
	}
	else
	{
		console.error ("SubmitFormAction cannot find form to submit");
	}
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.ShowViewAction");

positron.action.ShowViewAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.ShowViewAction, positron.action.Action);

positron.action.ShowViewAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	var	argument1 = this.actionArgs.length > 0 ? this.actionArgs [0] : undefined;
	var	argument2 = this.actionArgs.length > 1 ? this.actionArgs [1] : undefined;

	if (argument1 && argument1.length)
	{
		gApplication.showView (argument1, this.params, argument2);
	}
	else
	{
		console.error ("ShowViewAction: no view key argument");
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.ToggleClassAction");

positron.action.ToggleClassAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.ToggleClassAction, positron.action.Action);

positron.action.ToggleClassAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	if (this.actionArgs.length > 1)
	{
		var	specifiers = this.actionArgs.slice (1);
		var	elements = positron.DOM.resolveCompositeElementsArray (this.element, specifiers);

		for (var i = 0; i < elements.length; i++)
		{
			positron.DOM.toggleClass (elements [i], this.actionArgs [0]);
		}
	}
	else
	{
		console.error ("ToggleClassAction with bad arguments: " + this.actionArgString);
	}

	this.dispatchPrefixedEvent ();
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.action.ToggleViewAction");

positron.action.ToggleViewAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.ToggleViewAction, positron.action.Action);

positron.action.ToggleViewAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);
	
	var	argument1 = this.actionArgs.length > 0 ? this.actionArgs [0] : undefined;
	var	argument2 = this.actionArgs.length > 1 ? this.actionArgs [1] : undefined;
	var	argument3 = this.actionArgs.length > 1 ? this.actionArgs [2] : undefined;

	if (argument1 && argument1.length)
	{
		gApplication.toggleView (argument1, this.params, argument2, argument3);
	}
	else
	{
		console.error ("ToggleViewAction: no view key argument");
	}
};


monohm.provide ("positron.action.TwitterAuthoriseAction");

positron.action.TwitterAuthoriseAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.TwitterAuthoriseAction, positron.action.Action);

positron.action.TwitterAuthoriseAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "POST";
	request.dataType = "text";
	request.url = "https://twitter.com/oauth/request_token";
	
	// need at least one HTTP parameter for some reason
	request.httpParameters.dummy = "yes";

	request.authParameters.oauth_callback = gApplication.config.oauth ["twitter"].callback;

	var	key = positron.OAuth.percentEncode (gApplication.config.oauth.twitter.consumer_secret) + "&";
	var	baseString = positron.OAuth.getBaseString (request);
	request.authParameters.oauth_signature = positron.OAuth.getSignature (key, baseString);

	var	self = this;

	positron.OAuth.callService
	(
		request,
		function (inError, inData)
		{
			if (inError)
			{
				console.error (inError);
			}
			else
			{
				var	response = positron.OAuth.parseResponse (inData);
				
				if (response.oauth_token)
				{
					positron.OAuth.setRequestTokens ("twitter", response.oauth_token, response.oauth_token_secret);
					window.open ("https://twitter.com/oauth/authorize?oauth_token=" + response.oauth_token);
				}
				else
				{
					console.error ("parse error on response");
					console.error (inData);
				}
			}
		}
	);
};


monohm.provide ("positron.action.TwitterDeauthoriseAction");

positron.action.TwitterDeauthoriseAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.TwitterDeauthoriseAction, positron.action.Action);

positron.action.TwitterDeauthoriseAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	positron.OAuth.deauthoriseService ("twitter");
	this.dispatchPrefixedEvent ();
};


monohm.provide ("positron.action.TwitterSetStatusAction");

positron.action.TwitterSetStatusAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (positron.action.TwitterSetStatusAction, positron.action.Action);

positron.action.TwitterSetStatusAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.params.status)
	{
		var	self = this;
		
		positron.Twitter.setStatus
		(
			this.params.status,
			function (inError, inData)
			{
				if (inError)
				{
					console.error (inError);
				}

				self.dispatchPrefixedEvent ();
			}
		);
	}
	else
	{
		console.error ("TwitterSetStatusAction with no status in params");
		this.dispatchPrefixedEvent ();
	}
};


/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.attribute.Attribute");

positron.attribute.Attribute = function ()
{
}

// return boolean - true for done, false for wait
positron.attribute.Attribute.prototype.process = function (inElement, inContext, inAttributeName, inAttributeNumber)
{
	console.error ("Attribute.process() called (abstract)");
	
	return true;
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.attribute.ActionAttribute");

positron.attribute.ActionAttribute = function ()
{
	positron.attribute.Attribute.call (this);
}
monohm.inherits (positron.attribute.ActionAttribute, positron.attribute.Attribute);

positron.attribute.ActionAttribute.prototype.process =
function (inElement, inContext, inAttributeName, inAttributeNumber, inTreeWalker)
{
	var	sync = true;
	
	var	prefix = gApplication.getAttributePrefix ();

	var	actionAttributeName = null;

	if (inAttributeNumber >= 0)
	{
		actionAttributeName = prefix + "action-" + inAttributeNumber;
	}
	else
	{
		actionAttributeName = prefix + "action";
	}
	
	var	actionString = inElement.getAttribute (actionAttributeName);
	
	if (actionString && actionString.length)
	{
		// params are evaluated as values at walk time
		var	paramAttributeName = prefix + "action-";
		
		if (inAttributeNumber >= 0)
		{
			paramAttributeName += inAttributeNumber + "-";
		}

		paramAttributeName += "params";

		// param keys are evaluated as keys at walk time
		var	paramKeysAttributeName = prefix + "action-";
		
		if (inAttributeNumber >= 0)
		{
			paramKeysAttributeName += inAttributeNumber + "-";
		}

		paramKeysAttributeName += "param-keys";

		// param fire keys are evaluated as keys at fire time
		var	fireParamKeysAttributeName = prefix + "action-";
		
		if (inAttributeNumber >= 0)
		{
			fireParamKeysAttributeName += inAttributeNumber + "-";
		}

		fireParamKeysAttributeName += "fire-param-keys";

		sync = false;
		
		positron.ActionFactory.createAction
		(
			inElement,
			inContext,
			actionAttributeName,
			paramAttributeName,
			paramKeysAttributeName,
			fireParamKeysAttributeName,
			function (inAction, inSync)
			{
				sync = inSync;
				
				if (inAction)
				{
					inAction.register (inContext);
				}
				
				if (inTreeWalker && !inSync)
				{
					inTreeWalker.onAttributeWalkComplete ();
				}
			}
		);
	}
	else
	{
		console.error ("no value for attribute " + actionAttributeName);
	}
	
	return sync;
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.attribute.ViewAttribute");

positron.attribute.ViewAttribute = function ()
{
	positron.attribute.Attribute.call (this);
}
monohm.inherits (positron.attribute.ViewAttribute, positron.attribute.Attribute);

positron.attribute.ViewAttribute.prototype.process =
function (inElement, inContext, inAttributeName, inAttributeNumber, inTreeWalker)
{
	var	viewAttribute = inElement.getAttribute (inAttributeName);

	// console.log ("ViewAttribute.process() on " + viewAttribute);
	
	if (viewAttribute == null || viewAttribute.length == 0)
	{
		console.error ("blank view attribute");
		console.error (inElement);
		return;
	}
	
	var	loadFlags = "chj";
	
	var	viewAttributeElements = viewAttribute.split (':');

	if (viewAttributeElements.length > 1)
	{
		console.error ("load flags in p-view are deprecated, please use p-view-flags instead");
		
		// zero length load flags means don't load anything
		// (apart from inline markup)
		loadFlags = viewAttributeElements [1];
	}

	// if we have both, honour view-flags
	
	var	flags = positron.DOM.getPrefixedAttribute (inElement, "view-flags");
	
	// caution here, strings evaluate to false if they're zero length - THANKS GUYS
	if (typeof (flags) == "string")
	{
		loadFlags = flags;
	}
	
	var	viewName = viewAttributeElements [0];
	
	if (loadFlags.indexOf ("c") >= 0)
	{
		// careful here, if the view name is a fully qualified class name
		// we won't be able to dynamically load CSS for it
		// which is fine, because component CSS should be manually included anyway
		if (viewName.indexOf ('.') == -1)
		{
			// this will check for duplicates
			positron.DOM.addStyleSheet (gApplication.getViewCSSPath (viewName), viewName, false);
		}
	}

	var	self = this;
	var	sync = false;
	
	this.loadViewHTML
	(
		inElement,
		loadFlags,
		gApplication.getViewHTMLPath (viewName),
		function (inHTML, inLoadHTMLSync)
		{
			if (inHTML)
			{
				inElement.innerHTML = inHTML;
			}
	
			self.loadViewJs
			(
				viewName,
				positron.DOM.getPrefixedAttribute (inElement, "view-class"),
				loadFlags,
				function (inView, inLoadViewSync)
				{
					sync = inLoadHTMLSync && inLoadViewSync;

					if (inView == null)
					{
						className = gApplication.getConfigEntry ("viewClassName");
		
						inView = monohm.Object.instantiate (className);

						if (inView == null)
						{
							console.error ("ViewAttribute cannot instantiate configured default view class " + className);
			
							inView = new positron.View ();
						}
					}
	
					var	viewKey = viewName;
	
					var	viewKeyAttribute = positron.DOM.getPrefixedAttribute (inElement, "view-key");
	
					if (viewKeyAttribute && viewKeyAttribute.length)
					{
						viewKey = viewKeyAttribute;
					}
	
					inView.configure (viewKey, inElement, inContext, gApplication.getPage ());
	
					// have to do parameter stuff after configure()

					var	viewParamsAttribute = positron.DOM.getPrefixedAttribute (inElement, "view-params");
	
					if (viewParamsAttribute && viewParamsAttribute.length)
					{
						inView.setParams (positron.Util.parseParams (viewParamsAttribute));
					}

					var	viewParamKeysAttribute = positron.DOM.getPrefixedAttribute (inElement, "view-param-keys");
	
					if (viewParamKeysAttribute && viewParamKeysAttribute.length)
					{
						var	paramKeys = positron.Util.parseParams (viewParamsAttribute);
		
						for (var paramKey in paramKeys)
						{
							var	param = paramKeys [paramKey];
							var	value = gApplication.getContextReference (param, inContext);
			
							if (value)
							{
								inView.setParam (paramKey, value);
							}
						}
					}

					positron.DOM.setData (inElement, "view", inView);
					gApplication.getPage ().addView (viewKey, inView);
					inView.onLoaded ();
					
					if (! sync)
					{
						inTreeWalker.onAttributeWalkComplete ();
					}
				}
			);
		}
	);

	return sync;
};

positron.attribute.ViewAttribute.prototype.loadViewHTML =
function ViewAttribute_loadViewHTML (inElement, inLoadFlags, inHTMLPath, inCallback)
{
	// console.log ("ViewAttribute.loadHTML(" + inHTMLPath + ")");
	
	// inline markup overrides the load
	if (positron.DOM.hasChildren (inElement))
	{
		inCallback (null, true);
	}
	else
	{
		if (inLoadFlags.indexOf ("h") >= 0)
		{
			monohm.Network.getTextAsync
			(
				inHTMLPath,
				function (inError, inHTML)
				{
					inCallback (inHTML, false);
				}
			);
		}
		else
		{
			inCallback (null, true);
		}
	}
}

positron.attribute.ViewAttribute.prototype.loadViewJs =
function ViewAttribute_loadViewJs (inViewName, inClassName, inLoadFlags, inCallback)
{
	// console.log ("ViewAttribute.loadView(" + inViewName + ")");

	var	sync = true;
	var	view = null;
	
	if (inClassName && inClassName.length)
	{
		view = monohm.Object.instantiate (inClassName);

		if (view == null)
		{
			console.error ("ViewAttribute cannot instantiate specified view class " + className);
		}
	}
	else
	{
		if (inLoadFlags.indexOf ("j") >= 0)
		{
			sync = false;
			
			gApplication.getViewletAsync
			(
				inViewName,
				function (inView, inSync)
				{
					sync = inSync;
					
					if (inSync)
					{
						view = inView;
					}
					else
					{
						inCallback (inView, inSync);
					}
				}
			);
		}
	}
	
	if (sync)
	{
		inCallback (view, true);
	}
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.DelegateHashMap");

/**
 * @constructor
 * @param {Object=} inDelegate
 */
positron.DelegateHashMap = function (inDelegate)
{
	// instance member setup
	this.map = new Object ();
	this.delegate = inDelegate;
};

positron.DelegateHashMap.prototype.get = function (inKey)
{
	var	result = this.map [inKey];

	// don't test if(result) here, it will fail for zero integers
	if (typeof (result) == "undefined" || (typeof (result) == "object" && result == null))
	{
		if (this.delegate)
		{
			result = this.delegate.get (inKey);
		}
	}
	
	return result;
};

positron.DelegateHashMap.prototype.getDelegate = function ()
{
	return this.delegate;
};

positron.DelegateHashMap.prototype.put = function (inKey, inValue)
{
	this.map [inKey] = inValue;
};

positron.DelegateHashMap.prototype.remove = function (inKey)
{
	delete this.map [inKey];
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.Tag");

// CONSTRUCTOR

/**
 * @constructor
 */
positron.tag.Tag = function ()
{
	this.requiredAttributes = new Array ();
};

// inElement: DOM element
// return: true/false
positron.tag.Tag.prototype.checkRequiredAttributes = function (inElement)
{
	var	valid = true;

	for (var i = 0; i < this.requiredAttributes.length; i++)
	{
		var attribute = inElement.getAttribute (this.requiredAttributes [i]);

		if (attribute == null || attribute.length == 0)
		{
			console.error ("<" + inElement.tagName + "> requires attribute (" + this.requiredAttributes [i] + ")");
			
			valid = false;
			break;
		}
	}
	
	return valid;
};

// METHODS

// inElement: DOM element
// inContext: DelegateHashMap
// inTreeWalker: JanxTreeWalker
// return: true if the element is still in the tree
// the Tag is expected to manage its own tree
positron.tag.Tag.prototype.process = function (inElement, inContext, inTreeWalker)
{
console.error ("Tag.process() called, should be overridden");

	return this.walkChildren (inElement, inContext, inTreeWalker);
};

// no subwalker = complete our treewalker
positron.tag.Tag.prototype.dontWalkChildren = function (inElement)
{
	positron.DOM.removeNode (inElement);
	inTreeWalker.onWalkComplete ();
	
	// so you can assign "sync" to this
	return true;
}

// inNewContextEntry is optional
// if provided, a new context is made with it as the named entry
// shorthand for all those tags that otherwise have to make their own context
positron.tag.Tag.prototype.walkChildren = function (inElement, inContext, inTreeWalker, inNewContextEntry)
{
	var	context = inContext;
	
	if (typeof (inNewContextEntry) != "undefined")
	{
		context = gApplication.makeContext (inContext);
		context.put (this.getName (inElement), inNewContextEntry);
	}
	
	var	treeWalker = inTreeWalker.makeSubTreeWalker (this);
	return treeWalker.startWalkChildren (inElement, context);
}

positron.tag.Tag.prototype.onWalkComplete = function (inTreeWalker)
{
	positron.DOM.replaceWithChildren (inTreeWalker.rootNode);
	inTreeWalker.superTreeWalker.onWalkComplete (inTreeWalker);
}

// inElement: DOM element
// return: string
positron.tag.Tag.prototype.getDefaultName = function (inElement)
{
  // note we do NOT support namespaces any more
  var	name = inElement.tagName.toLowerCase ();
	
	var	elements = name.split ("-");
	
	// <walrus> = walrus
	// <p-walrus> = walrus
	// <p-walrus-whiskers> = whiskers
	return elements [elements.length - 1];
};

// inElement: DOM element
// return: string
positron.tag.Tag.prototype.getName = function (inElement)
{
	var	name = positron.DOM.getAttributeValue (inElement, "name");
	
	if (!name || !name.length)
	{
		name = this.getDefaultName (inElement);
	}
	
	return name;
};

// inElement: DOM element
// return: string
positron.tag.Tag.prototype.getNameDot = function (inElement)
{
	var	name = positron.DOM.getAttributeValue (inElement, "name");
	
	if (!name || !name.length)
	{
		name = this.getDefaultName (inElement);
	}

	if (name.length > 0)
	{
		name += '.';
	}
	else
	{
		// leave as blank
	}
	
	return name;
};


/**
*
* @license
* Copyright 2014 Monohm Inc. All rights reserved.
*
**/

monohm.provide ("positron.tag.AjaxTag");

monohm.require ("positron.tag.Tag");
monohm.require ("positron.DelegateHashMap");

// CONSTRUCTOR

/**
 * @constructor
 */
positron.tag.AjaxTag = function ()
{
	positron.tag.Tag.call (this);
	
	// subclasses should configure their own required attributes
	this.requiredAttributes.push ("url");
};
monohm.inherits (positron.tag.AjaxTag, positron.tag.Tag);

// INTERFACE

// HACK should the default be json?
positron.tag.AjaxTag.prototype.getDataType = function (inElement)
{
	console.error ("AjaxTag.getDataType() called! #abstract");
	return "ajax";
};

positron.tag.AjaxTag.prototype.getURL = function (inElement, inCallback)
{
	inCallback (positron.DOM.getAttributeValue (inElement, "url"));
};

positron.tag.AjaxTag.prototype.onContentReceived = function (inElement, inContext, inData)
{
	console.error ("AjaxTag.onContentReceived() called! #abstract");
	return inContext;
};

// ITag IMPLEMENTATION

// inElement: DOM element
// inContext: map<string,string>
// inTreeWalker: tree walker
// return: true if the tag remains in the tree (in this case, mostly false)
positron.tag.AjaxTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = true;
	var	cacheKey = inElement.getAttribute ("cachekey");
	
	if (cacheKey && cacheKey.length)
	{
		var	cacheEntry = gApplication.cache.get (cacheKey);
	
		if (cacheEntry)
		{
			if (gApplication.isLogging (gApplication.kLogCache))
				console.log ("AjaxTag: cache hit on " + cacheKey);
	
			var newContext = this.onContentReceived (inElement, inContext, cacheEntry);
			sync = this.walkChildren (inElement, newContext, inTreeWalker);
		}
		else
		{
			if (gApplication.isLogging (gApplication.kLogCache)) console.log
				("AjaxTag: cache miss on " + cacheKey);
		}
	}
	
	if (cacheEntry == null)
	{
		// we stash the data in the cache in the treewalker's completor
		this.doProcess (inElement, inContext, inTreeWalker);
		
		sync = false;
	}
	
	return sync;
};


// inElement: DOM element
// inContext: DelegateHashMap
// inTreeWalker: JanxTreeWalker
// return: true if the tag remains in the tree (in this case, mostly false)
positron.tag.AjaxTag.prototype.doProcess = function (inElement, inContext, inTreeWalker)
{
  var tagNameElements = inElement.tagName.toLowerCase ().split (":");
  var tagName = tagNameElements [tagNameElements.length - 1];  

	var	self = this;
	
	// virtualised so that subclasses can override the URL strategy
	// and made async thanks to the travesty that is social
	this.getURL
	(
		inElement,
		function (inURL)
		{
			var	dataType = self.getDataType (inElement);
			var	method = positron.DOM.getAttributeValue (inElement, "method");

			if (method == null || method.length == 0)
			{
				method = "GET";
			}
			else
			{
				// permit get, post, etc
				method = method.toUpperCase ();
			}
	
			var	url = inURL;
			var	data = "";
			
			var	queryIndex = url.indexOf ("?");
	
			if (queryIndex >= 0 && (queryIndex < (url.length - 2)))
			{
				var fullURL = url;
				url = fullURL.substring (0, queryIndex);
				data = fullURL.substring (queryIndex + 1);
			}

			monohm.Network.ajax
			({
				url: url,
				data: data,
				dataType: dataType,
				async: true,
				type: method,
				success: function (inData, inTextStatus, inXHR)
				{
					self.onContentReceived
					(
						inElement,
						inContext,
						inData,
						function (inNewContext)
						{
							self.cacheResponse (inElement, inData);
							self.walkChildren (inElement, inNewContext, inTreeWalker);
						}
					);
				},
				error: function (inXHR, inTextStatus, inError)
				{
					console.error ("load of " + url + " failed");
					console.error (inError);
			
					self.walkChildren (inElement, inContext, inTreeWalker);
				}
			});
		}
	);
};

// note that this depends on the new-style async Tags which don"t use temporary fragments
// the element passed in here *must* be the element passed to expand()
positron.tag.AjaxTag.prototype.cacheResponse = function (inElement, inData)
{
  var cacheKey = inElement.getAttribute ("cachekey");
  
  if (cacheKey && cacheKey.length)
  {
		var cacheLifeTime = inElement.getAttribute ("cachelifetime");
		
		if (cacheLifeTime && cacheLifeTime.length)
		{
			cacheLifeTime = parseInt (cacheLifeTime);
		}
		else
		{
			// if you're using cache with a Tag
			// and don"t specify a lifetime
			// your record sits there for a while! :-)
			if (gApplication.isLogging (gApplication.kLogCache))
				console.log ("AjaxTag: using default lifetime on " + cacheKey);
	
			cacheLifeTime = 15 * 60 * 1000;
		}
		
		gApplication.cache.put (cacheKey, inData, cacheLifeTime);
	}
};
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.JSONTag");

monohm.require ("positron.tag.Tag");
monohm.require ("positron.DelegateHashMap");

// CONSTRUCTOR

/**
 * @constructor
 */
positron.tag.JSONTag = function ()
{
	positron.tag.AjaxTag.call (this);
};
monohm.inherits (positron.tag.JSONTag, positron.tag.AjaxTag);

// AJAXTag OVERRIDES

positron.tag.JSONTag.prototype.getDataType = function (inElement)
{
  var jsonp = positron.DOM.getAttributeValue (inElement, "jsonp");
  jsonp = jsonp && jsonp.toLowerCase () == "true";
  
  return jsonp ? "jsonp" : "json";
};

positron.tag.JSONTag.prototype.onContentReceived = function (inElement, inContext, inData, inCallback)
{
	var	context = gApplication.makeContext (inContext);
	context.put (this.getName (inElement), inData);
	
	inCallback (context);
};
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
	note we *can't* use p-action here because it would go through the regular action stuff
	and the deal with <p-action> is that its actions fire immediately
*/

monohm.provide ("positron.tag.ActionTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.ActionTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.ActionTag, positron.tag.Tag);

positron.tag.ActionTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	foundAction = false;
	
	for (var i = -1; true; i++)
	{
		var	actionAttributeName = null;
		
		if (i >= 0)
		{
			actionAttributeName = "action-" + i;
		}
		else
		{
			actionAttributeName = "action";
		}
		
		var	actionString = inElement.getAttribute (actionAttributeName);
		
		if (actionString && actionString.length)
		{
			foundAction = true;

			var	paramAttributeName = null;
			
			if (i >= 0)
			{
				paramAttributeName = "action-" + i + "-params";
			}
			else
			{
				paramAttributeName = "action-params";
			}

			var	paramKeysAttributeName = null;
			
			if (i >= 0)
			{
				paramKeysAttributeName = "action-" + i + "-param-keys";
			}
			else
			{
				paramKeysAttributeName = "action-param-keys";
			}

			var	fireParamKeysAttributeName = null;
			
			if (i >= 0)
			{
				fireParamKeysAttributeName = "action-" + i + "-fire-param-keys";
			}
			else
			{
				fireParamKeysAttributeName = "action-fire-param-keys";
			}

			var	action = positron.ActionFactory.createAction
			(
				inElement,
				inContext,
				actionAttributeName,
				paramAttributeName,
				paramKeysAttributeName,
				fireParamKeysAttributeName,
				function (inAction, inSync)
				{
					sync = inSync;
					
					if (inAction)
					{
						inAction.fire (null, inContext);
					}
				}
			);
			
		}
		else
		{
			if (i > 0)
			{
				break;
			}
		}
	}
	
	if (!foundAction)
	{
		console.error ("ActionTag found no actions on element");
		console.error (inElement);
	}

	if (sync)
	{
		sync = this.walkChildren (inElement, inContext, inTreeWalker);
	}
	
	return sync;
}

/**
*
* @license
* Copyright 2014 Monohm Inc. All rights reserved.
*
**/

monohm.provide ("positron.tag.BearingTag");

monohm.require ("positron.tag.Tag");
monohm.require ("positron.DelegateHashMap");

// CONSTRUCTOR

/**
 * @constructor
 */
positron.tag.BearingTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("from_latitude");
	this.requiredAttributes.push ("from_longitude");
	this.requiredAttributes.push ("to_latitude");
	this.requiredAttributes.push ("to_longitude");
};
monohm.inherits (positron.tag.BearingTag, positron.tag.Tag);

// INTERFACE

// inElement: DOM element
// inContext: map<string,string>
// inTreeWalker: tree walker
// return: true if the tag remains in the tree (in this case, mostly false)
positron.tag.BearingTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	fromLatitude = monohm.String.parseFloat (inElement.getAttribute ("from_latitude"), 0);
	var	fromLongitude = monohm.String.parseFloat (inElement.getAttribute ("from_longitude"), 0);
	var	toLatitude = monohm.String.parseFloat (inElement.getAttribute ("to_latitude"), 0);
	var	toLongitude = monohm.String.parseFloat (inElement.getAttribute ("to_longitude"), 0);

	var	absoluteBearing = monohm.Location.bearing (fromLatitude, fromLongitude, toLatitude, toLongitude);

	var	heading = monohm.String.parseFloat (inElement.getAttribute ("heading"), 0);
	var	relativeBearing = ((absoluteBearing - heading) + 360) % 360;
	
	var	bearing = 
	{
		absolute: absoluteBearing,
		relative: relativeBearing
	};
	
	return this.walkChildren (inElement, inContext, inTreeWalker, bearing);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag does basic string casing
  usage: <uppercase> <lowercase> <changecase case="lower|upper">
*/

monohm.provide ("positron.tag.ChangeCaseTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.ChangeCaseTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("string");
};
monohm.inherits (positron.tag.ChangeCaseTag, positron.tag.Tag);


positron.tag.ChangeCaseTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
  var string = inElement.getAttribute ("string");
  
  // this strips the first hyphen prefix
  // giving us (in theory) the actual tag name
  var tagName = this.getDefaultName (inElement);

  var newString = null;
  
  var mode = null;
  
  if (tagName == "uppercase")
  {
    mode = "upper";
  }
  else
  if (tagName == "lowercase")
  {
    mode = "lower";
  }
  else
  if (tagName == "capitalcase")
  {
    mode = "capital";
  }
  else
  {
    mode = inElement.getAttribute ("mode");
  }
  
  if (mode == "upper")
  {
    newString = string.toUpperCase ();
  }
  else
  if (mode == "lower")
  {
    newString = string.toLowerCase ();
  }
  else
  if (mode == "capital")
  {
    newString = string.substring (0, 1).toUpperCase () + string.substring (1).toLowerCase ();
  }
  else
  {
    console.error ("<" + tagName + "> supplied with bad mode parameter: " + mode);
  }
  
	return this.walkChildren (inElement, inContext, inTreeWalker, newString);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.CircleTag");
monohm.require ("positron.tag.Tag");

/**
 * @constructor
 */
positron.tag.CircleTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("radius");
};
monohm.inherits (positron.tag.CircleTag, positron.tag.Tag);

positron.tag.CircleTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	degree = monohm.DOM.getIntAttributeValue (inElement, "degree");
	var	radius = monohm.DOM.getIntAttributeValueWithDefault (inElement, "radius", 1);

	var	radian = Math.PI / 180;

	var	x = Math.cos (degree * radian) * radius;
	var	y = Math.sin (degree * radian) * radius;

	var	circle =
	{
		degrees: degree,
		radians: degree * radian,
		x: x,
		y: y
	};

	return this.walkChildren (inElement, inContext, inTreeWalker, circle);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  a comment that doesn't appear in the final DOM
*/

monohm.provide ("positron.tag.CommentTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.CommentTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.CommentTag, positron.tag.Tag);

positron.tag.CommentTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	positron.DOM.removeNode (inElement);
	return true;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.ConditionTag");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.ConditionTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.ConditionTag, positron.tag.Tag);

// inElement: DOM element
// inContext: map<string,string>
// return: true/false
positron.tag.ConditionTag.prototype.matches = function (inElement, inContext)
{
	return false;
},

// Tag 

// inElement: DOM element
// inContext: map<string,string>
// inTreeWalker: tree walker
positron.tag.ConditionTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = true;
	
	if (this.matches (inElement, inContext))
	{
		sync = this.walkChildren (inElement, inContext, inTreeWalker);
	}
	else
	{
		positron.DOM.removeNode (inElement);
		inTreeWalker.onWalkComplete ();
	}
	
	return sync;
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

// dateTag.js

monohm.provide ("positron.tag.DateTag");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.DateTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.DateTag, positron.tag.Tag);

positron.tag.DateTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	date = positron.DOM.getDate (inElement);

	if (!date)
	{
		date = new Date ();
	}
	
	var	hours24 = date.getHours ();
	var	hours12 = hours24 > 12 ? hours24 - 12 : hours24;
	
	var newContext = gApplication.makeContext (inContext);
	newContext.put (this.getName (inElement), date);
	newContext.put (this.getNameDot (inElement) + "year", date.getFullYear ());
	newContext.put (this.getNameDot (inElement) + "month", date.getMonth () + 1);
	newContext.put (this.getNameDot (inElement) + "month0", date.getMonth ());
	newContext.put (this.getNameDot (inElement) + "day", date.getDate ());
	newContext.put (this.getNameDot (inElement) + "dayofyear", monohm.Date.getDayOfYear (date));
	newContext.put (this.getNameDot (inElement) + "hours", hours24);
	newContext.put (this.getNameDot (inElement) + "hours24", hours24);
	newContext.put (this.getNameDot (inElement) + "hours12", hours12);
	newContext.put (this.getNameDot (inElement) + "minutes", date.getMinutes ());
	newContext.put (this.getNameDot (inElement) + "seconds", date.getSeconds ());
	newContext.put (this.getNameDot (inElement) + "milliseconds", date.getMilliseconds ());
	newContext.put (this.getNameDot (inElement) + "ms", date.getTime ());
	newContext.put (this.getNameDot (inElement) + "string", date.toString ());

  return this.walkChildren (inElement, newContext, inTreeWalker);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.DelayTag");
monohm.require ("positron.tag.Tag");

/**
 * @constructor
 */
positron.tag.DelayTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("time");
};
monohm.inherits (positron.tag.DelayTag, positron.tag.Tag);

positron.tag.DelayTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	time = monohm.String.parseTime (inElement.getAttribute ("time", 1000));

	var	self = this;
	
	setTimeout
	(
		function ()
		{
			self.walkChildren (inElement, inContext, inTreeWalker);
		},
		time
	);

	return false;
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

// CONSTRUCTOR

positron.tag.DistanceTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("from_latitude");
	this.requiredAttributes.push ("from_longitude");
	this.requiredAttributes.push ("to_latitude");
	this.requiredAttributes.push ("to_longitude");
};
monohm.inherits (positron.tag.DistanceTag, positron.tag.Tag);

positron.tag.DistanceTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	fromLatitude = positron.DOM.getFloatAttributeValue (inElement, "from_latitude") * (Math.PI / 180);
	var	fromLongitude = positron.DOM.getFloatAttributeValue (inElement, "from_longitude") * (Math.PI / 180);
	var	toLatitude = positron.DOM.getFloatAttributeValue (inElement, "to_latitude") * (Math.PI / 180);
	var	toLongitude = positron.DOM.getFloatAttributeValue (inElement, "to_longitude") * (Math.PI / 180);

	var	distance = new Object ();

	distance.m = Math.acos (Math.sin (fromLatitude) * Math.sin (toLatitude) + 
		Math.cos (fromLatitude) * Math.cos (toLatitude) *
		Math.cos (toLongitude - fromLongitude)) * 6371000;

	distance.km = distance.m / 1000;
	distance.mi = (distance.km * 5) / 8;
	distance.yards = distance.mi * 1760;
	distance.feet = distance.mi * 5280;

  return this.walkChildren (inElement, inContext, inTreeWalker, distance);
}

/**
*
* @license
* Copyright © 2013 Jason Proctor.  All rights reserved.
*
**/

// CONSTRUCTOR

positron.tag.FacebookTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.FacebookTag, positron.tag.Tag);

positron.tag.FacebookTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = false;
	var	accessToken = positron.OAuth.getAccessToken ("facebook");

	if (accessToken)
	{
		var	self = this;
		
		monohm.Network.getJSONAsync
		(
			"https://graph.facebook.com/me?access_token=" + accessToken,
			function (inError, inData)
			{
				console.log (inData);
				
				var	facebook = new Object ();
				
				if (inError || inData.errors)
				{
					facebook.authorised = false;
				}
				else
				{
					facebook.authorised = true;
				}
				
				self.walkChildren (inElement, inContext, inTreeWalker, facebook);
			}
		);
	}
	else
	{
		var	facebook = new Object ();
		facebook.authorised = false;
		
		sync = this.walkChildren (inElement, inContext, inTreeWalker, facebook);
	}
	
	return sync;	
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.GeoBoxTag");
monohm.require ("positron.tag.Tag");

/**
 * @constructor
 */
positron.tag.GeoBoxTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("latitude");
	this.requiredAttributes.push ("longitude");
	this.requiredAttributes.push ("radius");
};
monohm.inherits (positron.tag.GeoBoxTag, positron.tag.Tag);

positron.tag.GeoBoxTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	latitude = monohm.String.parseFloat (inElement.getAttribute ("latitude"), 37.75);
	var	longitude = monohm.String.parseFloat (inElement.getAttribute ("longitude"), -122.75);

	var	radiusString = inElement.getAttribute ("radius");
	var	boundingBox = monohm.Location.boundingBox (latitude, longitude, radiusString);
	
	return this.walkChildren (inElement, inContext, inTreeWalker, boundingBox);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag does get from context, permitting computed keys
*/

monohm.provide ("positron.tag.GetTag");

/**
 * @constructor
 */
positron.tag.GetTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("key");
};
monohm.inherits (positron.tag.GetTag, positron.tag.Tag);


positron.tag.GetTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
  var key = inElement.getAttribute ("key");
  var	value = gApplication.getContextReference (key, inContext);
  
  return this.walkChildren (inElement, inContext, inTreeWalker, value);
}

monohm.provide ("positron.tag.GmailMessageTag");

// this was a subclass of JSONTag
// but then i came to my senses

positron.tag.GmailMessageTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("id");
}
monohm.inherits (positron.tag.GmailMessageTag, positron.tag.Tag);

// AJAXTAG OVERRIDES

positron.tag.GmailMessageTag.prototype.process = function (inElement, inTreeWalker, inContext)
{
	var	url = "https://www.googleapis.com/gmail/v1/users/me/messages/" + inElement.getAttribute ("id") + "?alt=json&";
	url += "access_token=" + positron.OAuth.getAccessToken ("google") + "&";
	
	var	self = this;
	
	monohm.Network.getJSONAsync
	(
		url,
		function (inError, inMessage)
		{
			var	message = null;
			
			if (inError)
			{
				console.error (inError);
			}
			else
			if (inMessage.error)
			{
				console.error (inMessage.error.message);
			}
			else
			{
				message = self.remixMessage (inMessage);
			}

			self.walkChildren (inElement, inTreeWalker, inContext, message);
		}
	);
	
	return url;
}

// convert google's useless format into something handy
positron.tag.GmailMessageTag.prototype.remixMessage = function (inMessage)
{
	var	message = new Object ();
	
	// first, copy the actually useful stuff
	message.id = inMessage.id;
	message.historyId = inMessage.historyId;
	message.labelIds = inMessage.labelIds;
	message.sizeEstimate = inMessage.sizeEstimate;
	message.snippet = inMessage.snippet;
	message.threadId = inMessage.threadId;
	
	// now make a map of the headers -- oo what a concept
	message.headers = new Object ();
	
	for (var i = 0; i < inMessage.payload.headers.length; i++)
	{
		var	header = inMessage.payload.headers [i];
		message.headers [header.name] = header.value;
	}
	
	// now try to make some kind of sense out of the body
	if (inMessage.payload.body.size > 0)
	{
		// apparently gmail's base64 is slightly nonstandard
		message.body = atob (inMessage.payload.body.data.replace (/-/g, '+').replace (/_/g, '/'));
	}
	else
	{
		if (inMessage.payload.parts.length)
		{
			message.body = "";
			
			for (var i = 0; i < inMessage.payload.parts.length; i++)
			{
				var	part = inMessage.payload.parts [i];
				var	partBody = part.body.data;
						
				// apparently gmail's base64 is slightly nonstandard
				message.body += atob (partBody.replace (/-/g, '+').replace (/_/g, '/'));
			}
		}
	}

	return message;
}

monohm.provide ("positron.tag.GmailMessagesTag");

positron.tag.GmailMessagesTag = function ()
{
	positron.tag.JSONTag.call (this);
	
	// unconfigure our superclass's required attributes
	// as we don't need any
	this.requiredAttributes.length = 0;
}
monohm.inherits (positron.tag.GmailMessagesTag, positron.tag.JSONTag);

// AJAXTAG OVERRIDES

positron.tag.GmailMessagesTag.prototype.getURL = function (inElement, inCallback)
{
	var	url = "https://www.googleapis.com/gmail/v1/users/me/messages?alt=json&";
	
	url += "access_token=" + positron.OAuth.getAccessToken ("google") + "&";
	
	if (monohm.DOM.getBooleanAttributeValue (inElement, "important"))
	{
		url += "labelIds=IMPORTANT&";
	}

	if (monohm.DOM.getBooleanAttributeValue (inElement, "unread"))
	{
		url += "q=is:unread&";
	}
	
	var	maxResults = monohm.DOM.getIntAttributeValueWithDefault (inElement, "limit", 100);
	url += "maxResults=" + maxResults + "&";

	inCallback (url);
}
monohm.provide ("positron.tag.GmailThreadsTag");

positron.tag.GmailThreadsTag = function ()
{
	positron.tag.JSONTag.call (this);
}
monohm.inherits (positron.tag.GmailThreadsTag, positron.tag.JSONTag);

// must do this as the ajax tag checks for a URL attribute
positron.tag.GmailThreadsTag.prototype.checkRequiredAttributes = function ()
{
	return true;
}

positron.tag.GmailThreadsTag.prototype.getURL = function (inElement, inCallback)
{
	var	url = "https://www.googleapis.com/gmail/v1/users/me/threads?alt=json&";
	
	url += "access_token=" + positron.OAuth.getAccessToken ("google");
	
	if (monohm.DOM.getBooleanAttributeValue (inElement, "important"))
	{
		url += "labelIds=IMPORTANT&";
	}

	if (monohm.DOM.getBooleanAttributeValue (inElement, "unread"))
	{
		url += "q=is:unread&";
	}
	
	var	maxResults = monohm.DOM.getIntAttributeValueWithDefault (inElement, "limit", 100);
	url += "maxResults=" + maxResults + "&";

	inCallback (url);
}
monohm.provide ("positron.tag.positron.tag.GoogleTag");

// CONSTRUCTOR

positron.tag.GoogleTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.GoogleTag, positron.tag.Tag);

positron.tag.GoogleTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = false;
	var	accessToken = positron.OAuth.getAccessToken ("google");

	if (accessToken)
	{
		var	self = this;

		monohm.Network.getJSONAsync
		(
			"https://www.googleapis.com/gmail/v1/users/me/threads?maxResults=1&alt=json&access_token=" + accessToken,
			function (inError, inData)
			{
				var	google = new Object ();
				
				if (inError || inData.error)
				{
					google.authorised = false;
				}
				else
				{
					google.authorised = true;
				}
				
				self.walkChildren (inElement, inContext, inTreeWalker, google);
			}
		);
	}
	else
	{
		var	google = new Object ();
		google.authorised = false;
		
		sync = this.walkChildren (inElement, inContext, inTreeWalker, google);
	}
	
	return sync;	
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

// if_Tag.js

monohm.provide ("positron.tag.IfTag");
monohm.require ("positron.tag.ConditionTag");

/**
 * @constructor
 */
positron.tag.IfTag = function ()
{
	positron.tag.ConditionTag.call (this);
};
monohm.inherits (positron.tag.IfTag, positron.tag.ConditionTag);

// inElement: DOM element
// inContext: map<string,string>
// return: true/false
positron.tag.IfTag.prototype.matches = function (inElement, inContext)
{
	var	matches = false;
	var	trueAttribute = positron.DOM.getAttributeValue (inElement, "true");
	var	falseAttribute = positron.DOM.getAttributeValue (inElement, "false");
	var	emptyAttribute = positron.DOM.getAttributeValue (inElement, "empty");
	var	notEmptyAttribute = positron.DOM.getAttributeValue (inElement, "notempty");
	
	if (typeof trueAttribute == "string")
	{
		matches = positron.Util.evaluateExpressionChain (trueAttribute);
	}
	else
	if (typeof falseAttribute == "string")
	{
		matches = !positron.Util.evaluateExpressionChain (falseAttribute);
	}
	else
	if (typeof emptyAttribute == "string")
	{
		matches = emptyAttribute.length == 0;
	}
	else
	if (typeof notEmptyAttribute == "string")
	{
		matches = notEmptyAttribute.length > 0;
	}
	else
	{
		console.error ("<if> requires true, false, empty, or notempty attribute");
		console.error (inElement);
	}
	
	return matches;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
this Tag provides a solution for the situation where the browser
sees tags with templated attribute values in markup, which results in errors.
examples would be <img>, <movie>, etc

simply point nu:img, nu:movie, etc at this Tag and it will transform to img, movie, etc
*/

monohm.provide ("positron.tag.IsolatorTag");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.IsolatorTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.IsolatorTag, positron.tag.Tag);

positron.tag.IsolatorTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = true;
	
	var	newTagName = this.getDefaultName (inElement);
	var	newTag = document.createElement (newTagName);
	
	if (inElement.hasAttributes)
	{
		for (var i = 0; i < inElement.attributes.length; i++)
		{
			newTag.setAttribute (inElement.attributes [i].name, inElement.attributes [i].value);
		}
	}

	positron.DOM.moveChildren (inElement, newTag);
	inElement.parentNode.replaceChild (newTag, inElement);

	var	treeWalker = inTreeWalker.makeSubTreeWalker (this);
	return treeWalker.startWalk (newTag, inContext);
}

// override as the base class will remove the tag from the tree
positron.tag.IsolatorTag.prototype.onWalkComplete = function (inTreeWalker)
{
	inTreeWalker.superTreeWalker.onWalkComplete (inTreeWalker);
}

// join-tag.js

/*
  this Tag joins a list according to a delimiter and puts the string into context
*/

monohm.provide ("positron.tag.JoinTag");

/**
 * @constructor
 */
positron.tag.JoinTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("key");
};
monohm.inherits (positron.tag.JoinTag, positron.tag.Tag);

positron.tag.JoinTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var key = inElement.getAttribute ("key");
	var delimiter = positron.DOM.getAttributeValueWithDefault (inElement, "delimiter", " ");
	var smart = positron.DOM.getBooleanAttributeValueWithDefault (inElement, "smart", false);
	var	elements = gApplication.getContextReference (key, inContext);

	var	joined = null;
	
	if (Array.isArray (elements))
	{
		if (smart)
		{
			joined = monohm.String.smartJoin (elements, delimiter);
		}
		else
		{
			joined = elements.join (delimiter);
		}
	}
	else
	{
		console.error ("JoinTag could not find elements for key " + key);
	}

	return this.walkChildren (inElement, inContext, inTreeWalker, joined);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.ListTag");

monohm.require ("positron.tag");
monohm.require ("positron.DelegateHashMap");

// CONSTRUCTOR

/**
 * @constructor
 */
positron.tag.ListTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("key");
};
monohm.inherits (positron.tag.ListTag, positron.tag.Tag);

// inElement: DOM element
// inContext: map<string,string>
// inTreeWalker: tree walker
// return: node to replace inElement
positron.tag.ListTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = true;
	
	var	name = this.getName (inElement);
	
	var	listPlaceholder = document.createElement ("div");
	listPlaceholder.setAttribute ("class", gApplication.getCSSClassPrefix () + "list-place-holder");
	positron.DOM.addPrefixedClass (listPlaceholder, "list-place-holder");
	inElement.parentNode.replaceChild (listPlaceholder, inElement);

	var	elements = this.getElements (inElement, inContext, inTreeWalker);

	if (elements && Array.isArray (elements))
	{
		var	offset = 0;
	  var limit = elements.length;
	  var	pageSize = 0;
	  
	  var offsetAttribute = inElement.getAttribute ("offset");
	  
	  if (offsetAttribute && offsetAttribute.length)
	  {
	    offset = parseInt (offsetAttribute);
	    
	    if (isNaN (offset))
	    {
	    	offset = 0;
	    }
	    else
	    {
		    offset = Math.max (offset, 0);
		  }
	  }
	  
	  var limitAttribute = inElement.getAttribute ("limit");
	  
	  if (limitAttribute && limitAttribute.length)
	  {
	    limit = parseInt (limitAttribute);
	    
	    if (isNaN (limit))
	    {
	    	limit = elements.length;
	    }
	    else
	    {
		    limit = Math.min (limit, elements.length);
		  }
	  }
	  
	  var pageSizeAttribute = inElement.getAttribute ("pagesize");
	  
	  if (pageSizeAttribute && pageSizeAttribute.length)
	  {
	    pageSize = parseInt (pageSizeAttribute);
	    
	    if (isNaN (pageSize))
	    {
	    	pageSize = 0;
	    }
	  }
	  
	  var	searchKey = inElement.getAttribute ("searchkey");
	  
	  if (searchKey && (searchKey.length == 0))
	  {
	  	searchKey = null;
	  }
	  
	  var	searchValue = inElement.getAttribute ("searchvalue");
	  
	  if (searchValue && (searchValue.length == 0))
	  {
	  	searchValue = null;
	  }
	  
	  this.matchedElements = new Array ();
	  
	  // zip through finding out how many matching items we have, sigh
		for (var i = offset; (i < offset + limit) && (i < elements.length); i++)
		{
			var	element = elements [i];
			var	include = true;
			
			if (searchKey != null && searchValue != null)
			{
				include = typeof (element) == "object" && element [searchKey] == searchValue;
			}
			
			if (include)
			{
				this.matchedElements.push (element);
			}
		}

	  if (this.matchedElements.length > 0)
	  {
	  	if (pageSize == 0)
	  	{
	  		pageSize = this.matchedElements.length;
	  	}
	  	
	  	new monohm.AsyncListHelper
	  	(
	  		{
		  		this: this,
		  		list: this.matchedElements,
		  		iterate: function (inHelper, inListElement)
		  		{
		  			// AsyncListHelper starts on construction
		  			// so we have to save it here
		  			this.listHelper = inHelper;
		  			
						var	elementPlaceholder = document.createElement ("div");
						elementPlaceholder.setAttribute ("index", "" + inHelper.index);
						positron.DOM.addPrefixedClass (elementPlaceholder, "list-element-place-holder");
						listPlaceholder.appendChild (elementPlaceholder);
					
						var	elementContext = gApplication.makeContext (inContext);
						elementContext.put (name, inListElement);
		
						// stick some meta in there, ooo
						var	index = inHelper.index - offset;
		
						// global stuff, pertaining into the entire collection
						elementContext.put (name + ".meta.globalindex", inHelper.index);
						elementContext.put (name + ".meta.globalcount", this.matchedElements.length);
					
						// local stuff, pertaining to the elements we are including
						elementContext.put (name + ".meta.index", index);
						elementContext.put (name + ".meta.count", limit);
						elementContext.put (name + ".meta.isfirst", index == 0);
						elementContext.put (name + ".meta.islast", index == (limit - 1));
					
						// local page-oriented stuff
						var	pageIndex = 0;
						var	withinPageIndex = 0;
						var	pageCount = 1;
					
						if (pageSize > 0)
						{
							pageIndex = Math.floor (index / pageSize);
							pageCount = Math.ceil (limit / pageSize);
						}
					
						withinPageIndex = index - (pageIndex * pageSize);
						elementContext.put (name + ".meta.inpageindex", withinPageIndex);

						elementContext.put (name + ".meta.isfirstinpage", withinPageIndex == 0);
						elementContext.put (name + ".meta.islastinpage", withinPageIndex == (pageSize - 1));
						
						elementContext.put (name + ".meta.pageindex", pageIndex);
						elementContext.put (name + ".meta.pagecount", pageCount);
						elementContext.put (name + ".meta.isfirstpage", pageIndex == 0);
						elementContext.put (name + ".meta.islastpage", pageIndex == (pageCount - 1));
					
						positron.DOM.copyChildren (inElement, elementPlaceholder);

						// onWalkComplete() steps the list helper
						this.walkChildren (elementPlaceholder, elementContext, inTreeWalker);
		  		},
		  		complete: function ()
		  		{
						positron.DOM.replaceWithChildren (listPlaceholder);
						inTreeWalker.onWalkComplete ();
		  		}
		  	}
	  	);
		}
		else
		{
			// no qualifying list elements
			positron.DOM.removeNode (listPlaceholder);
			inTreeWalker.onWalkComplete ();
		}
	}
	else
	{
		// couldn't find list in context
		positron.DOM.removeNode (listPlaceholder);
		inTreeWalker.onWalkComplete ();
	}
	
	return sync;
};

// TAG OVERRIDE

positron.tag.ListTag.prototype.onWalkComplete = function (inTreeWalker)
{
	positron.DOM.replaceWithChildren (inTreeWalker.rootNode);
	this.listHelper.onIteration ();
}

// DEFAULT IMPLEMENTATION

// note that subclasses can override this, so it has to be here
positron.tag.ListTag.prototype.getElements = function (inElement, inContext, inTreeWalker)
{
	var	keyAttribute = positron.DOM.getAttributeValue (inElement, "key");
	var	elements = gApplication.getContextReference (keyAttribute, inContext);
	
	if (!elements || !Array.isArray (elements))
	{
		console.error ("ListTag could not find list with key " + keyAttribute);
	}
	
	return elements;
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag does get from context, permitting computed keys
*/

monohm.provide ("positron.tag.LocalStorageTag");

/**
 * @constructor
 */
positron.tag.LocalStorageTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("key");
};
monohm.inherits (positron.tag.LocalStorageTag, positron.tag.Tag);

positron.tag.LocalStorageTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	key = inElement.getAttribute ("key");
	return this.walkChildren (inElement, inContext, inTreeWalker, localStorage [key]);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.LocaliseTag");
monohm.require ("positron.tag.Tag");

/**
 * @constructor
 */
positron.tag.LocaliseTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("key");
};
monohm.inherits (positron.tag.LocaliseTag, positron.tag.Tag);

positron.tag.LocaliseTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	key = inElement.getAttribute ("key");
	
	if (key.length > 8 && key.substr (0, 8) == "strings.")
	{
		// developer thoughtfully included the "strings." prefix...
	}
	else
	{
		key = "strings." + key;
	}

	var	newContext = inContext;
	
	var	string = gApplication.getContextReference (key, inContext);
	
	if (string && string.length)
	{
		// ok now we see if there are any context key remappings
		var	paramString = inElement.getAttribute ("params");
		
		if (paramString)
		{
			var	params = positron.Util.parseParams (paramString);
			
			newContext = gApplication.makeContext (inContext);
			
			for (var key in params)
			{
				newContext.put (key, params [key]);
			}
		}
		
		inElement.innerText = gApplication.expandText (string, newContext, false);
	}
	else
	{
		console.error ("could not find localisation string with key " + key);
	}

	// wow, a tag that doesn't walk its subtree!
	this.walkChildren	(inElement, inContext, inTreeWalker);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.LocationTag");
monohm.require ("positron.tag.Tag");

/**
 * @constructor
 */
positron.tag.LocationTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.LocationTag, positron.tag.Tag);

positron.tag.LocationTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = false;
	
	if (navigator.geolocation)
	{
		var	self = this;
		
		navigator.geolocation.getCurrentPosition
		(
			function (inPosition)
			{
				self.walkChildren (inElement, inContext, inTreeWalker, inPosition);
			},
			function (inError)
			{
				console.error ("error getting position");
				console.error (inError.message);
				
				self.walkChildren (inElement, inContext, inTreeWalker);
			}
		);
	}
	else
	{
		console.error ("browser does not support geolocation API");
		
		sync = this.walkChildren (inElement, inContext, inTreeWalker);
	}

	return sync;
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag logs stuff
  values, values from keys, or the current context
  
  <nu:log
    value="value" OR valuekey="valuekey" OR nothing
    >
  </nu:log>
  
  this element pulls itself after logging
*/

monohm.provide ("positron.tag.LogTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.LogTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.LogTag, positron.tag.Tag);

positron.tag.LogTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
  var value = inElement.getAttribute ("value");
  var valueKey = inElement.getAttribute ("valuekey");

	console.log ("LogTag logging");
  
  if (value && value.length)
  {
    // value is the direct value
  }
  else
  if (valueKey && valueKey.length)
  {
		console.log (valueKey);

    // can't use inContext.get() because the key may be compound
    // requiring walking, etc
    value = gApplication.getContextReference (valueKey, inContext);
  }
  else
  {
    value = inContext;
  }
  
	console.log (value);
	console.log ("(type = " + typeof (value) + ")");

	return this.walkChildren (inElement, inContext, inTreeWalker);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.MapTag");

monohm.require ("positron.tag");
monohm.require ("positron.DelegateHashMap");

// CONSTRUCTOR

// i have to say, how the ListTag interoperates with other list-generators is nice

positron.tag.MapTag = function ()
{
	positron.tag.ListTag.call (this);
};
monohm.inherits (positron.tag.MapTag, positron.tag.ListTag);

// LISTTAG OVERRIDES

positron.tag.MapTag.prototype.getElements = function (inElement, inContext, inTreeWalker)
{
	var	map = null;
	var	mapKeyAttribute = positron.DOM.getAttributeValue (inElement, "key");

	if (mapKeyAttribute)
	{
		map = gApplication.getContextReference (mapKeyAttribute, inContext);

		if (Array.isArray (map) || typeof (map) != 'object')
		{
			map = null;
		}
	}
	
	var	list = null;
	
	if (map)
	{
		list = new Array ();
		
	  for (var key in map)
	  {
	  	if (map.hasOwnProperty (key))
	  	{
				var	element = new Object ();
				element.key = key;
				element.value = map [key];
				
				list.push (element);
			}
	  }
	}
	else
	{
		console.error ("MapTag could not find elements for key " + positron.DOM.getAttributeValue (inElement, "key"));
	}

	return list;
}


// midi-tag.js

monohm.provide ("positron.tag.MIDITag");

// CONSTRUCTOR

positron.tag.MIDITag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.MIDITag, positron.tag.Tag);

// inElement: DOM element
// inContext: map<string,string>
// inTreeWalker: tree walker
// return: true if the tag remains in the tree (in this case, mostly false)
positron.tag.MIDITag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	self = this;
	
	gApplication.requestMIDI
	(
		function (inAvailable)
		{
			var	midi = 
			{
				available: inAvailable
			};
			
			self.walkChildren (inElement, inContext, inTreeWalker, midi);
		}
	);

};

// midi-inputs-tag.js

monohm.provide ("positron.tag.MIDIInputsTag");

// CONSTRUCTOR

positron.tag.MIDIInputsTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.MIDIInputsTag, positron.tag.Tag);

// inElement: DOM element
// inContext: map<string,string>
// inTreeWalker: tree walker
// return: true if the tag remains in the tree (in this case, mostly false)
positron.tag.MIDIInputsTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	this.walkChildren (inElement, inContext, inTreeWalker, gApplication.getMIDIInputs ());
};

// midi-inputs-tag.js

monohm.provide ("positron.tag.MIDIMessageTag");

// CONSTRUCTOR

positron.tag.MIDIMessageTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("key");
};
monohm.inherits (positron.tag.MIDIMessageTag, positron.tag.Tag);

// inElement: DOM element
// inContext: map<string,string>
// inTreeWalker: tree walker
// return: true if the tag remains in the tree (in this case, mostly false)
positron.tag.MIDIMessageTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	message = new Object ();
	
	var	key = inElement.getAttribute ("key");
	var	data = gApplication.getContextReference (key, inContext);
	
	if (data)
	{
		if (typeof data.BYTES_PER_ELEMENT == "number")
		{
			message.size = data.length;
			message.bytes = new Array ();
			message.string = "";
			
			for (var i = 0; i < message.size; i++)
			{
				var	byte = data [i];
				message.bytes [i] = byte;
				
				if (i > 0)
				{
					message.string += " ";
					message ["data_" + (i - 1)] = byte;
					message ["data_" + (i - 1) + "_hex"] = "0x" + byte.toString (16);
				}
				else
				{
					message.status = byte;
					message.status_hex = "0x" + byte.toString (16);
				}
				
				message.string += "0x" + byte.toString (16);
			}
		}
		else
		{
			console.error ("MIDIMessageTag with no message data in context");
		}
	}
	else
	{
		console.error ("MIDIMessageTag with no message data in context");
	}
	
	this.walkChildren (inElement, inContext, inTreeWalker, message);
};

// midi-inputs-tag.js

monohm.provide ("positron.tag.MIDIOutputsTag");

// CONSTRUCTOR

positron.tag.MIDIOutputsTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.MIDIOutputsTag, positron.tag.Tag);

// inElement: DOM element
// inContext: map<string,string>
// inTreeWalker: tree walker
// return: true if the tag remains in the tree (in this case, mostly false)
positron.tag.MIDIOutputsTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	this.walkChildren (inElement, inContext, inTreeWalker, gApplication.getMIDIOutputs ());
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.MoveTag");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.MoveTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.MoveTag, positron.tag.Tag);

positron.tag.MoveTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	// schedule us to show any deferred views
	positron.DOM.getParentView (inElement).addDeferredTask (this);
	
	return this.walkChildren (inElement, inContext, inTreeWalker);
}

// runs when the parent refresh is complete
// to show any views which are marked deferred
positron.tag.MoveTag.prototype.run = function ()
{
	// console.log ("MoveTag.run()");
	
	if (this.destinationElement)
	{
		var	deferredViewElements = positron.DOM.queryPrefixedAttribute (this.destinationElement, "defer-show");

		for (var i = 0; i < deferredViewElements.length; i++)
		{
			var	deferredViewElement = deferredViewElements [i];
			
			var	deferredView = positron.DOM.getData (deferredViewElement, "view");
			
			if (deferredView && !deferredView.isVisible ())
			{
				deferredView.show ();
			}
			else
			{
				console.error ("element with defer-show attribute has no view");
				console.error (deferredViewElement);
			}
			
			// ensure we only do this once
			positron.DOM.removePrefixedAttribute (deferredViewElement, "defer-show");
		}
	}
}

positron.tag.MoveTag.prototype.onWalkComplete = function (inTreeWalker)
{
	var	element = inTreeWalker.rootNode;
	var	condemned = new Array ();
	
	var	unique = positron.DOM.getBooleanAttributeValueWithDefault (element, "unique", false);
	var	update = positron.DOM.getBooleanAttributeValueWithDefault (element, "update", true);
	var	deleteChild = positron.DOM.getBooleanAttributeValueWithDefault (element, "delete", false);
	
	var	destinationElements = positron.DOM.getCompositeElements (element, "view", "selector");
	
	if (destinationElements && destinationElements.length)
	{
		// HACK we only honour the first found destination element
		this.destinationElement = destinationElements [0];

		if (unique)
		{
			for (var i = 0; i < this.destinationElement.childNodes.length; i++)
			{
				var	destinationChild = this.destinationElement.childNodes [i];
				
				if (destinationChild.nodeType == destinationChild.ELEMENT_NODE)
				{
					var	id = destinationChild.getAttribute ("id");
					
					if (id && id.length)
					{
						var	newChild = element.querySelector ("#" + id);
						
						if (newChild)
						{
							if (update)
							{
								for (var j = 0; j < newChild.attributes.length; j++)
								{
									var	name = newChild.attributes.item (j).nodeName;
									var	newValue = newChild.attributes.item (j).nodeValue;
									
									var	oldValue = destinationChild.getAttribute (name);
									
									if (newValue != oldValue)
									{
										destinationChild.setAttribute (name, newValue);
									}
								}
							
								// update the element's contents, too
								positron.DOM.removeChildren (destinationChild);
								positron.DOM.moveChildren (newChild, destinationChild);
							}
							
							condemned.push (newChild);
						}
						else
						{
							if (deleteChild)
							{
								condemned.push (destinationChild);
							}
						}
					}
				}
			}
			
			if (condemned)
			{
				for (var i = 0; i < condemned.length; i++)
				{
					positron.DOM.removeNode (condemned [i]);
				}
			}
			
			// we've already updated existing ones
			// and removed old ones
			// so just add the new ones
			for (var i = 0; i < element.childNodes.length; i++)
			{
				var	newChild = element.childNodes [i];
				
				if (newChild.nodeType == newChild.ELEMENT_NODE)
				{
					this.destinationElement.appendChild (newChild);
				}
			}
		}
		else
		{
			// not tracking uniques, so just bung the new ones on the end of the destination
			while (element.childNodes.length > 0)
			{
				this.destinationElement.appendChild (element.childNodes [0]);
			}
		}
	}
	else
	{
		console.error ("MoveTag has no destination element");
		console.error (element);
	}

	positron.tag.Tag.prototype.onWalkComplete.call (this, inTreeWalker);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.NumberFormatTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.NumberFormatTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("number");
	this.requiredAttributes.push ("type");
};
monohm.inherits (positron.tag.NumberFormatTag, positron.tag.Tag);

positron.tag.NumberFormatTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var number = parseFloat (inElement.getAttribute ("number"));
	var type = inElement.getAttribute ("type");
	var digits = monohm.String.parseInt (inElement.getAttribute ("digits"), 2);

  var newValue = null;
  
  if (type == "fixed")
  {
    newValue = number.toFixed (digits);
  }
  else
  if (type == "precision")
  {
    newValue = number.toPrecision (digits);
  }
  else
  if (type == "frontpad")
  {
  	newValue = number;

  	while (newValue.toString ().length < digits)
  	{
  		newValue = "0" + newValue;
  	}
  }
  else
  if (type == "floor")
  {
    newValue = Math.floor (number);
  }
  else
  if (type == "ceil")
  {
    newValue = Math.ceil (number);
  }
  else
  if (type == "round")
  {
    newValue = Math.round (number);
  }
  else
  if (type == "hex")
  {
    newValue = number.toString (16);
  }
  else
  if (type == "prefixedhex")
  {
    newValue = "0x" + number.toString (16);
  }
  else
  {
    console.error ("bad type (" + type + ") passed to <numberformat>");
  }
  
  return this.walkChildren (inElement, inContext, inTreeWalker, newValue);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag does basic string substitution
*/

monohm.provide ("positron.tag.NumbersTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.NumbersTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("start");
	this.requiredAttributes.push ("stop");
};
monohm.inherits (positron.tag.NumbersTag, positron.tag.Tag);

positron.tag.NumbersTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	start = positron.DOM.getIntAttributeValueWithDefault (inElement, "start", 1);
	var	stop = positron.DOM.getIntAttributeValueWithDefault (inElement, "stop", 10);
	var	step = positron.DOM.getIntAttributeValueWithDefault (inElement, "step", 1);
	
	if (step == 0)
	{
		step = 1;
	}
	else
	if (step < 0)
	{
		step *= -1;
	}
	
	var	numbers = new Array ();
	
	if (start < stop)
	{
		for (var i = start; i <= stop; i += step)
		{
			numbers.push (i);
		}
	}
	else
	if (start > stop)
	{
		for (var i = start; i >= stop; i -= step)
		{
			numbers.push (i);
		}
	}
	
  return this.walkChildren (inElement, inContext, inTreeWalker, numbers);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.PageListTag");

monohm.require ("positron.tag");
monohm.require ("positron.DelegateHashMap");

// CONSTRUCTOR

/**
 * @constructor
 */
positron.tag.PageListTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("key");
};
monohm.inherits (positron.tag.PageListTag, positron.tag.Tag);

positron.tag.PageListTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = true;
	
	var	keyAttribute = positron.DOM.getAttributeValue (inElement, "key");
	var	elements = gApplication.getContextReference (keyAttribute, inContext);

	if (elements && Array.isArray (elements))
	{
		var	pageSize = elements.length;
		var pageSizeAttribute = inElement.getAttribute ("pagesize");
	
		if (pageSizeAttribute && pageSizeAttribute.length)
		{
			pageSize = parseInt (pageSizeAttribute);
		
			if (isNaN (pageSize))
			{
				pageSize = elements.length;
			}
		}
		
		var	listOfLists = new Array ();
		
		for (var i = 0; i < elements.length; i++)
		{
			var	pageIndex = Math.floor (i / pageSize);
			
			if (! listOfLists [pageIndex])
			{
				listOfLists [pageIndex] = new Array ();
			}
			
			listOfLists [pageIndex].push (elements [i]);
		}
		
		this.walkChildren (inElement, inContext, inTreeWalker, listOfLists);
	}
	else
	{
		console.error ("PageListTag could not find list with key " + keyAttribute);

		this.walkChildren (inElement, inContext, inTreeWalker);
	}
	
	return sync;
};

// DEFAULT IMPLEMENTATION

// note that subclasses can override this, so it has to be here
positron.tag.ListTag.prototype.getElements = function (inElement, inContext, inTreeWalker)
{
	var	keyAttribute = positron.DOM.getAttributeValue (inElement, "key");
	return gApplication.getContextReference (keyAttribute, inContext);
};
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag does basic string substitution
*/

monohm.provide ("positron.tag.PrefixedPropertyTag");

/**
 * @constructor
 */
positron.tag.PrefixedPropertyTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("property");
};
monohm.inherits (positron.tag.PrefixedPropertyTag, positron.tag.Tag);

positron.tag.PrefixedPropertyTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var neutralProperty = inElement.getAttribute ("property");
  var	prefixedProperty = positron.CSS.getPrefixedProperty (neutralProperty);
  
  return this.walkChildren (inElement, inContext, inTreeWalker, prefixedProperty);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag does basic string substitution
*/

monohm.provide ("positron.tag.QuerySelectorTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.QuerySelectorTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.QuerySelectorTag, positron.tag.Tag);

positron.tag.QuerySelectorTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	this.walkChildren (inElement, inContext, inTreeWalker,
		positron.DOM.getCompositeElements (element, "view", "selector"));
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag does basic string substitution
*/

monohm.provide ("positron.tag.ReplaceTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.ReplaceTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("string");
	this.requiredAttributes.push ("replace");
};
monohm.inherits (positron.tag.ReplaceTag, positron.tag.Tag);

positron.tag.ReplaceTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var string = inElement.getAttribute ("string");
	var replace = inElement.getAttribute ("replace");
	var withString = inElement.getAttribute ("with");
	var	regexp = positron.DOM.getBooleanAttributeValueWithDefault (inElement, "regexp", false);
	var	all = positron.DOM.getBooleanAttributeValueWithDefault (inElement, "all", false);
	
	// should be possible to have a blank string for "with"
	if (!withString)
	{
		withString = "";
	}
	
	var	newString = null;
	
	if (regexp)
	{
		replace = new RegExp (replace);
	}
	
	if (all)
	{
		newString = string.split (replace).join (withString);
	}
	else
	{
		newString = string.replace (replace, withString);
	}
	
  return this.walkChildren (inElement, inContext, inTreeWalker, newString);
}


monohm.provide ("positron.tag.SelectOptionTag");

positron.tag.SelectOptionTag =
function SelectOptionTag ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("value");
};
monohm.inherits (positron.tag.SelectOptionTag, positron.tag.Tag);

positron.tag.SelectOptionTag.prototype.process =
function SelectOptionTag_process (inElement, inContext, inTreeWalker)
{
	this.element = inElement;
	this.value = inElement.getAttribute ("value").toLowerCase ();
	
	return this.walkChildren (inElement, inContext, inTreeWalker);
};

positron.tag.SelectOptionTag.prototype.onWalkComplete =
function SelectOptionTag_onWalkComplete (inTreeWalker)
{
	var	options = this.element.querySelectorAll ("option");

	for (var i = 0; i < options.length; i++)
	{
		var	value = options [i].getAttribute ("value").toLowerCase ();
		
		options [i].selected = (value == this.value);
	}
	
	return positron.tag.Tag.prototype.onWalkComplete.call (this, inTreeWalker);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

/*
  this Tag does copying of values from one key to another
  AND MORE IMPORTANTLY AND USEFULLY
  promotion of context values in scope
  
  <nu:set
    key="somekey"
    value="value" OR valuekey="valuekey"
    context="application,window,page"
    >
  </nu:set>

  value OR valuekey
  context is optional
*/

monohm.provide ("positron.tag.SetTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.SetTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.SetTag, positron.tag.Tag);

positron.tag.SetTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
  var value = inElement.getAttribute ("value");
  var valueKey = inElement.getAttribute ("valuekey");
  var expression = inElement.getAttribute ("expression");
  var scope = inElement.getAttribute ("context");
  
  if (typeof (value) == "string")
  {
    // value is the direct value
    // note we have to allow a blank string here
  }
  else
  if (valueKey && valueKey.length)
  {
    // can't use inContext.get() because the key may be compound
    // requiring walking, etc
    value = gApplication.getContextReference (valueKey, inContext);
  }
  else
  if (expression && expression.length)
  {
  	value = positron.Util.evaluateArithmeticExpression (expression);
  }
  else
  {
    console.error ("SetTag called with neither value, valuekey, nor expression");
    console.error (inElement);
  }
  
  // the context we use for walking the subtree
  var walkContext = inContext;
  
  // the context we are altering
  var putContext = null;
  
  if (scope && scope.length)
  {
    if (scope == "application")
    {
      putContext = gApplication.context;
    }
    else
    if (scope == "page")
    {
      putContext = gApplication.getPage ().context;
    }
    else
    if (scope == "view")
    {
    	var	view = positron.DOM.getParentView (inElement);
    	
    	if (view)
    	{
    		putContext = view.context;
    	}
    	else
    	{
    		console.error ("could not find parent view for element");
    		console.error (inElement);
    	}
    }
    else
    if (scope == "current")
    {
    	putContext = inContext;
    }
    else
    {
      console.error ("SetTag called with bad context: " + scope);
    }
  }
  else
  {
    // assume immediate scope, so make a new context
    putContext = gApplication.makeContext (inContext);
    
    // and walk with this context, too
    walkContext = putContext;
  }
  
  if (putContext)
  {
    putContext.put (this.getName (inElement), value);
  }

  return this.walkChildren (inElement, walkContext, inTreeWalker);
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.SoundTag");

monohm.require ("positron.tag.Tag");
monohm.require ("positron.DelegateHashMap");

// CONSTRUCTOR

/**
 * @constructor
 */
positron.tag.SoundTag = function ()
{
	positron.tag.AjaxTag.call (this);
	
	this.requiredAttributes.push ("soundname");
};
monohm.inherits (positron.tag.SoundTag, positron.tag.AjaxTag);

// AJAXTag OVERRIDES

positron.tag.SoundTag.prototype.getDataType = function (inElement)
{
	return "arraybuffer";
};

positron.tag.SoundTag.prototype.onContentReceived = function (inElement, inContext, inData, inCallback)
{
	var	audioContextName = inElement.getAttribute ("audiocontext");
	
	if (audioContextName == null || audioContextName.length == 0)
	{
		audioContextName = "default";
	}
	
	var	self = this;
	
	var	audioContext = gApplication.getAudioContext (audioContextName);

	audioContext.decodeAudioData
	(
		inData,
		function (inSound)
		{
			gApplication.addSound (inElement.getAttribute ("soundname"), inSound);
			
			// should we do this?
			var	context = gApplication.makeContext (inContext);
			context.put (self.getName (inElement), inSound);
	
			inCallback (context);
		}
	);
};

// split-tag.js

/*
  this Tag splits a string according to a delimiter and puts the list of elements into context
*/

monohm.provide ("positron.tag.SplitTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.SplitTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("string");
};
monohm.inherits (positron.tag.SplitTag, positron.tag.Tag);

positron.tag.SplitTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var string = inElement.getAttribute ("string");
	var delimiter = positron.DOM.getAttributeValueWithDefault (inElement, "delimiter", " ");
	var	regexp = positron.DOM.getBooleanAttributeValueWithDefault (inElement, "regexp", false);
	
	if (regexp)
	{
		delimiter = new RegExp (delimiter);
	}

  return this.walkChildren (inElement, inContext, inTreeWalker, string.split (delimiter));
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.SQLQueryTag");
monohm.require ("positron.tag.Tag");

/**
 * @constructor
 */
positron.tag.SQLQueryTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("database");
	this.requiredAttributes.push ("query");
};
monohm.inherits (positron.tag.SQLQueryTag, positron.tag.Tag);

positron.tag.SQLQueryTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	databaseName = inElement.getAttribute ("database");
	var	query = inElement.getAttribute ("query");

	var	version = inElement.getAttribute ("version");
	
	if (version == null || version.length == 0)
	{
		// apparently a null string means we don't care about versioning
		version = "";
	}

	var	size = inElement.getAttribute ("size");
	
	if (size == null || size.length == 0)
	{
		size = 5 * 1024 * 1024;
	}
	else
	{
		size = parseInt (size);
		
		if (isNan (size) || size <= 0)
		{
			size = 5 * 1024 * 1024;
		}
	}

	var	parameters = inElement.getAttribute ("parameters");
	
	if (parameters != null && parameters.length > 0)
	{
		parameters = parameters.split (",");
	}
	else
	{
		parameters = new Array ();
	}
	
	var	self = this;
	
	monohm.SQLDatabase.open
	(
		databaseName,
		function (inError, inDatabase)
		{
			if (inError)
			{
				console.error ("error opening database");
				console.error (inError);
				self.walkChildren (inElement, inContext, inTreeWalker);
			}
			else
			{
				inDatabase.transaction
				(
					function (inTransaction)
					{
						inTransaction.executeSql
						(
							query,
							parameters,
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
						
								self.walkChildren (inElement, inContext, inTreeWalker, results);
							},
							function (inTransaction, inError)
							{
								console.error (inError);

								self.walkChildren (inElement, inContext, inTreeWalker);
							}
						);
					}
				);
			}
		}
	);
	
	return false;
}


// string-tag.js

/*
  this Tag puts a string corresponding to the charcode into context
*/

monohm.provide ("positron.tag.StringTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.StringTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("charcode");
};
monohm.inherits (positron.tag.StringTag, positron.tag.Tag);

positron.tag.StringTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var charCodeString = inElement.getAttribute ("charcode");
	var	charCode = parseInt (charCodeString);
	
	var	string = null;
	
	if (isNaN (charCode))
	{
		console.error ("StringTag with bad char code");
	}
	else
	{
		string = String.fromCharCode (charCode);
	}

  return this.walkChildren (inElement, inContext, inTreeWalker, string);
}

// substring-tag.js

/*
  this tag is a declarative interface to string.substr(offset, limit)
*/

monohm.provide ("positron.tag.SubstringTag");
monohm.require ("positron.DelegateHashMap");
monohm.require ("positron.tag");

/**
 * @constructor
 */
positron.tag.SubstringTag = function ()
{
	positron.tag.Tag.call (this);

	this.requiredAttributes.push ("string");
	this.requiredAttributes.push ("offset");
};
monohm.inherits (positron.tag.SubstringTag, positron.tag.Tag);

positron.tag.SubstringTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	string = inElement.getAttribute ("string");
	var	offset = monohm.DOM.getIntAttributeValue (inElement, "offset", 0);
	var	limit = monohm.DOM.getIntAttributeValue (inElement, "limit", Number.MAX_VALUE);
	var	ellipsis = inElement.getAttribute ("ellipsis");

	var	subString = string.substr (offset, limit);

	if (ellipsis && ellipsis.length)
	{
		subString += ellipsis;
	}
		
  return this.walkChildren (inElement, inContext, inTreeWalker, subString);
}

// throw-tag.js

monohm.provide ("positron.tag.ThrowTag");

/**
 * @constructor
 */
positron.tag.ThrowTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.ThrowTag, positron.tag.Tag);

positron.tag.ThrowTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	throw new Error ("error intentionally thrown by ThrowTag");
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.TimeAgoTag");

// CONSTRUCTOR

positron.tag.TimeAgoTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.TimeAgoTag, positron.tag.Tag);

positron.tag.TimeAgoTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
  var ms = inElement.getAttribute ("ms");
  
  if (ms && ms.length)
  {
  	ms = parseInt (ms);
  	
  	if (isNaN (ms))
  	{
  		ms = 0;
  	}
  }
  else
	{
		var	seconds = inElement.getAttribute ("s");
		
		if (seconds && seconds.length)
		{
			seconds = parseInt (seconds);
			
			if (isNaN (seconds))
			{
				seconds = 0;
			}
		}
		else
		{
			seconds = 0;
		}
		
		ms = seconds * 1000;
	}
	
	if (ms == 0)
	{
		console.error ("TimeAgoTaglet: error parsing ms/s attributes, defaulting to zero ms");
	}

	var	timeago = new Object ();
	
	var	then = new Date (ms);
	var	now = new Date ();

	var	milliseconds = now.getTime () - then.getTime ();
	var	seconds = milliseconds / 1000;
	
	var	firstNonZeroName = null;
	var	firstNonZeroValue = 0;
	
	for (var i = 0; i < this.kTimeUnits.length; i++)
	{
		var	unit = this.kTimeUnits [i];
		
		var	value = Math.floor (seconds / unit.divisor);
		
		if (value > 0 && firstNonZeroName == null)
		{
			firstNonZeroName = unit.name;
			firstNonZeroValue = value;
		}
		
		seconds -= (value * unit.divisor);
		
		timeago [unit.name] = value;
	}
	
	if (firstNonZeroName == null)
	{
		timeago.units = "ms";
		timeago.value = milliseconds;
	}
	else
	{
		timeago.units = firstNonZeroName;
		timeago.value = firstNonZeroValue;
	}
	
  return this.walkChildren (inElement, inContext, inTreeWalker, timeago);
};

positron.tag.TimeAgoTag.prototype.kTimeUnits = 
[	
	{
		name: "years",
		divisor: 31536000
	},
	{
		name: "months",
		divisor: 2529000
	},
	{
		name: "weeks",
		divisor: 604800
	},
	{
		name: "days",
		divisor: 86400
	},
	{
		name: "hours",
		divisor: 3600
	},
	{
		name: "minutes",
		divisor: 60
	},
	{
		name: "seconds",
		divisor: 1
	},
]

monohm.provide ("positron.tag.TwitterTag");

// CONSTRUCTOR

positron.tag.TwitterTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.TwitterTag, positron.tag.Tag);

positron.tag.TwitterTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	self = this;
	
	positron.Twitter.getSettings
	(
		function (inError, inData)
		{
			var	twitter = new Object ();

			if (inError || inData.errors)
			{
				twitter.authorised = false;
			}
			else
			{
				twitter.authorised = true;
			}
			
			self.walkChildren (inElement, inContext, inTreeWalker, twitter);
		}
	);
	
	/*
	var	sync = false;
	var	accessToken = positron.OAuth.getAccessToken ("twitter");
	var	accessTokenSecret = positron.OAuth.getAccessTokenSecret ("twitter");
	
	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "GET";
	request.dataType = "json";
	request.url = "https://api.twitter.com/1.1/account/settings.json";

	// need SOMETHING in the POST parameters, doesn't matter what
	request.httpParameters.dummy = "true";

	request.authParameters.oauth_token = positron.OAuth.getAccessToken ("twitter");;

	var	baseString = positron.OAuth.getBaseString (request);
	var	key = positron.OAuth.percentEncode (gApplication.config.oauth.twitter.consumer_secret) + "&" 
		+ positron.OAuth.percentEncode (positron.OAuth.getAccessTokenSecret ("twitter"));
	request.authParameters.oauth_signature = positron.OAuth.getSignature (key, baseString);

	var	self = this;

	positron.OAuth.callService
	(
		request,
		function (inError, inData)
		{
			var	twitter = new Object ();

			if (inError || inData.errors)
			{
				twitter.authorised = false;
			}
			else
			{
				twitter.authorised = true;
			}
			
			self.walkChildren (inElement, inContext, inTreeWalker, twitter);
		}
	);
	*/
		
	return false;
}

/**
*
* @license
* Copyright © 2013 Jason Proctor.  All rights reserved.
*
**/

// CONSTRUCTOR

monohm.provide ("positron.tag.TwitterMentionsTag");

positron.tag.TwitterMentionsTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.TwitterMentionsTag, positron.tag.Tag);

// called when the treewalker encounters the element
// 
positron.tag.TwitterMentionsTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	self = this;
	
	positron.Twitter.getMentions
	(
		function (inError, inData)
		{
			if (inError)
			{
				console.error (inError);
			}
			
		 	self.walkChildren (inElement, inContext, inTreeWalker, inData);
		}
	);

	/*
	var	request = positron.OAuth.createRequest ("twitter");
	request.method = "GET";
	request.dataType = "json";
	request.url = "https://api.twitter.com/1.1/statuses/mentions_timeline.json";
	
	// need SOMETHING in the POST parameters, doesn't matter what
	request.httpParameters.dummy = "true";

	request.authParameters.oauth_token = positron.OAuth.getAccessToken ("twitter");
	
	var	baseString = positron.OAuth.getBaseString (request);
	var	key = positron.OAuth.percentEncode (gApplication.config.oauth.twitter.consumer_secret) + "&" 
		+ positron.OAuth.percentEncode (positron.OAuth.getAccessTokenSecret ("twitter"));
	request.authParameters.oauth_signature = positron.OAuth.getSignature (key, baseString);

	var	self = this;
	
	positron.OAuth.callService
	(
		request,
		function (inError, inData)
		{
			if (typeof (inData) == "string")
			{
				inData = JSON.parse (inData);
			}
			
		 	self.walkChildren (inElement, inContext, inTreeWalker, inData);
		}
	);
	*/
	
	return false;
}

/**
*
* @license
* Copyright © 2013 Jason Proctor.  All rights reserved.
*
**/

// CONSTRUCTOR

monohm.provide ("positron.tag.TwitterTimelineTag");

positron.tag.TwitterTimelineTag = function ()
{
	positron.tag.Tag.call (this);
};
monohm.inherits (positron.tag.TwitterTimelineTag, positron.tag.Tag);

// called when the treewalker encounters the element
// 
positron.tag.TwitterTimelineTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	self = this;
	
	positron.Twitter.getTimeline
	(
		function (inError, inData)
		{
			if (inError)
			{
				console.error (inError);
			}
			
		 	self.walkChildren (inElement, inContext, inTreeWalker, inData);
		}
	);

	return false;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.tag.WebSocketTag");
monohm.require ("positron.tag.Tag");

/**
 * @constructor
 */
positron.tag.WebSocketTag = function ()
{
	positron.tag.Tag.call (this);
	
	this.requiredAttributes.push ("url");
};
monohm.inherits (positron.tag.WebSocketTag, positron.tag.Tag);

positron.tag.WebSocketTag.prototype.process = function (inElement, inContext, inTreeWalker)
{
	var	sync = false;
	
	var	url = inElement.getAttribute ("url");
	var	protocol = inElement.getAttribute ("protocol");
	
	var	self = this;
	
	// console.log ("WebSocketTag opening WebSocket to " + url);

	// keep track of who walks, it's a shitshow down there
	var	walked = false;
	
	try
	{
		var	webSocket = new WebSocket (url, protocol);
		var	webSocketName = this.getName (inElement);
		
		// keeping them in context is not good enough
		// all kinds of things need to find them
		gApplication.addWebSocket (webSocketName, webSocket);
		
		// ok now this is really hosed
		// new WebSocket() will throw internally if it fails
		// without calling any handlers
		// get this - it just console.error()s!
		// we are screwed in that case
		// so if we haven't been called back in 5 seconds
		// we close the socket and resume treewalking
		// #crap
		
		var	rescueTimeout = setTimeout
		(
			function ()
			{
				console.log ("websocket rescue timeout fires, closing socket");
				
				rescueTimeout = null;
				
				try
				{
					webSocket.close ();
				}
				catch (inError)
				{
					console.error (inError.message);
				}
				
				// arse protect mode
				if (!walked)
				{
					walked = true;
					
					var	newContext = gApplication.makeContext (inContext);
					newContext.put ("error", "WebSocket connection failed (rescue callback fired)");
					self.walkChildren (inElement, newContext, inTreeWalker);
				}
			},
			5000
		);
		
		webSocket.onopen = function ()
		{
			if (rescueTimeout)
			{
				clearTimeout (rescueTimeout);
				rescueTimeout = null;
			}
			
			if (!walked)
			{
				walked = true;
				self.walkChildren (inElement, inContext, inTreeWalker);
			}
		}

		webSocket.onerror = function ()
		{
			console.error ("websocket onerror called (ignored)...");
		}
		
		webSocket.onclose = function ()
		{
			// console.error ("websocket onclose called...");
		}
	}
	catch (inError)
	{
		console.error ("error opening WebSocket...");
		console.error (inError);
		
		// if we catch here, we're sync
		sync = true;
		
		walked = true;
		
		var	newContext = gApplication.makeContext (inContext);
		newContext.put ("error", inError.message);
		this.walkChildren (inElement, newContext, inTreeWalker);
	}
	
	return sync;
};
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.Trigger");

positron.trigger.Trigger = function ()
{
}

positron.trigger.Trigger.prototype.cancel = function ()
{
};

// override this to take control of trigger events (away from action)
positron.trigger.Trigger.prototype.firesAnalyticsEvents = function ()
{
	return false;
}

// this is for deferred triggers to get a look at context before it goes away
positron.trigger.Trigger.prototype.preRegister = function (inAction, inContext)
{
};

positron.trigger.Trigger.prototype.register = function (inAction, inContext)
{
	console.error ("Trigger.register() called (abstract)");
};

positron.trigger.Trigger.prototype.requiresCancel = function ()
{
	return false;
}

monohm.provide ("positron.trigger.AnimationFrameTrigger");

positron.trigger.AnimationFrameTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}

monohm.inherits (positron.trigger.AnimationFrameTrigger, positron.trigger.Trigger);

positron.trigger.AnimationFrameTrigger.prototype.cancel = function (inAction)
{
	this.canContinue = false;
}

positron.trigger.AnimationFrameTrigger.prototype.register = function (inAction)
{
  this.time = monohm.String.parseTime (inAction.triggerArgs [0], 33);  
  
  if (this.time == 0)
  {
  	// this can happen if the HTML guy *quotes* zero in the markup
    // console.log ("AnimationFrameTrigger defaulting frame rate to 30fps");
    this.time = 33;
  }

	this.action = inAction;
	this.canContinue = true;
	this.steps = 0;
	this.lastDrawTime = 0;

  var self = this;

  function animationStep (inTimestamp) 
  {
    var progress = inTimestamp - self.lastDrawTime;

    if (progress > self.time)
    {
			self.lastDrawTime = inTimestamp;
      self.action.params.step = self.steps;
      self.steps ++;
			
			self.action.fire ();
    }

    if (self.canContinue) 
    {      
      positron.DOM.requestAnimationFrame(animationStep);
    }
  }
    
  positron.DOM.requestAnimationFrame(animationStep);
};

positron.trigger.AnimationFrameTrigger.prototype.requiresCancel = function ()
{
	return true;
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.ChangeTrigger");

positron.trigger.ChangeTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.ChangeTrigger, positron.trigger.Trigger);

positron.trigger.ChangeTrigger.prototype.register = function (inAction)
{
	inAction.element.addEventListener
	(
		"change",
		function (inEvent)
		{
			var	value = null;
			var	target = inEvent.target;
			var	tag = target.tagName;
	
			if (tag)
			{
				tag = tag.toLowerCase ();
		
				if (tag == "select")
				{
					var	selectedOption = target.options [target.selectedIndex];
			
					if (selectedOption)
					{
						value = selectedOption.value;
					}
				}
				else
				if (tag == "input")
				{
					var	type = target.getAttribute ("type");
			
					if (type == "checkbox")
					{
						value = target.checked;
					}
					else
					{
						value = target.value;
					}
				}
		
				inAction.params.value = value;
				inAction.fire (inEvent);
			}
		}
	);
	
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.CircleTrigger");

positron.trigger.CircleTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.CircleTrigger, positron.trigger.Trigger);

positron.trigger.CircleTrigger.prototype.cancel = function (inAction)
{
	console.log ("CircleTrigger.cancel()");

	if (this.interval)
	{
		clearInterval (this.interval);
		this.interval = null;
	}
}

positron.trigger.CircleTrigger.prototype.register = function (inAction)
{
	var	degreeBump = monohm.String.parseInt (inAction.triggerArgs [0], 5);
	var	interval = monohm.String.parseTime (inAction.triggerArgs [1], 100);

	console.log ("CircleTrigger: degree is " + degreeBump);
	console.log ("CircleTrigger: interval is " + interval);
	
	var	degree = 0;
	var	radian = Math.PI / 180;
	var	inCircle = false;
	
	this.interval = setInterval
	(
		function ()
		{
			// the radius is always 1
			var	x = Math.cos (degree * radian);
			var	y = Math.sin (degree * radian);

			inAction.params.degrees = degree;
			inAction.params.radians = degree * radian;
			inAction.params.x = x;
			inAction.params.y = y;
			
			inAction.fire ();
			
			degree += degreeBump;
			
			if (degree >= 360)
			{
				degree = 0;
			}
		},
		interval
	);
	
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.ClickTrigger");

positron.trigger.ClickTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.ClickTrigger, positron.trigger.Trigger);

positron.trigger.ClickTrigger.prototype.register = function (inAction)
{
	var	maxDowntime = 5000;
	var	slop = 0;
	
	if (inAction.triggerArgs.length > 0)
	{
		maxDowntime = monohm.String.parseTime (inAction.triggerArgs [0], 5000);

		if (maxDowntime < 0)
		{
			maxDowntime = 5000;
		}
		
		if (inAction.triggerArgs.length > 1)
		{
			var	value = monohm.String.parseValueAndUnits (inAction.triggerArgs [1], 0);
			
			if (value.value > 0)
			{
				slop = value.value;
			}
		}		
	}
	
	var	downEventName = null;
	var	upEventName = null;
	var	leaveEventName = null;
	var	cancelEventName = null;
	
	if (gApplication.browser.isMobile)
	{
		downEventName = "touchstart";
		upEventName = "touchend";
		leaveEventName = "touchleave";
		cancelEventName = "touchcancel";
	}
	else
	{
		downEventName = "mousedown";
		upEventName = "mouseup";
		leaveEventName = "mouseleave";
		cancelEventName = null;
	}

	// should these really be instance variables, now taglets are no longer flyweights?
	var	active = false;
	var	timestamp = 0;
	var	x = 0;
	var	y = 0;
	
	inAction.element.addEventListener
	(
		downEventName,
		function (inEvent)
		{
			active = true;

			x = positron.Util.getEventX (inEvent);
			y = positron.Util.getEventY (inEvent);
			
			timestamp = inEvent.timeStamp;
		},
		false
	);

	inAction.element.addEventListener
	(
		upEventName,
		function (inEvent)
		{
			if (active)
			{
				active = false;
				
				var	upTimestamp = inEvent.timeStamp;
				var	downtime = upTimestamp - timestamp;
				
				if (downtime > maxDowntime)
				{
					// console.log ("rejecting click due to downtime of " + downtime);
				}
				else
				{
					var	eventX = positron.Util.getEventX (inEvent);
					var	eventY = positron.Util.getEventY (inEvent);
				
					if (slop == 0 || positron.Util.get2DDistance (x, y, eventX, eventY) <= slop)
					{
						// which event should we pass here?
						inAction.fire (inEvent);
					}
				}
			}
		},
		false
	);

	inAction.element.addEventListener
	(
		leaveEventName,
		function (inEvent)
		{
			if (active)
			{
				// console.log ("leave event, cancelling click/tap");
				active = false;
			}
		},
		false
	);
	
	if (gApplication.browser.isMobile)
	{
		inAction.element.addEventListener
		(
			"touchcancel",
			function (inEvent)
			{
				if (active)
				{
					// console.log ("cancel touch event, cancelling tap");
					active = false;
				}
			},
			false
		);
	}
	
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.DefaultTrigger");

positron.trigger.DefaultTrigger = function (inEventName)
{
	positron.trigger.Trigger.call (this);
	
	this.eventName = inEventName;
}
monohm.inherits (positron.trigger.DefaultTrigger, positron.trigger.Trigger);

positron.trigger.DefaultTrigger.prototype.cancel = function ()
{
	this.listenElement.removeEventListener (this.eventName, this.onEventBound);
}

positron.trigger.DefaultTrigger.prototype.onEvent = function (inEvent)
{
	if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("caught " + this.eventName);
	if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("firing action " + this.action.actionName);

	this.action.fire (inEvent);
}

positron.trigger.DefaultTrigger.prototype.register = function (inAction)
{
	// console.log ("DefaultTrigger.register()");

	this.action = inAction;
	
	// false = don't whine if we can't find it
	if (gApplication.getConfigEntry ("window-events." + this.eventName, false))
	{
		this.listenElement = window;
	}
	else
	{
		this.listenElement = this.action.element;
	}
	
	this.onEventBound = this.onEvent.bind (this);
	this.listenElement.addEventListener (this.eventName, this.onEventBound, this.action.capturePhase);
};

positron.trigger.DefaultTrigger.prototype.requiresCancel = function ()
{
	return true;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.LocationTrigger");

positron.trigger.LocationTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.LocationTrigger, positron.trigger.Trigger);

positron.trigger.LocationTrigger.prototype.cancel = function ()
{
	if (this.watch)
	{
		clearWatch (this.watch);
		this.watch = null;
	}
}

positron.trigger.LocationTrigger.prototype.register = function (inAction)
{
	if (navigator.geolocation)
	{
		var	self = this;
		
		this.watch = navigator.geolocation.watchPosition
		(
			function (inPosition)
			{
				if (positron.DOM.isValidNode (inAction.element))
				{
					inAction.setParam ("position", inPosition);
					inAction.setParam ("latitude", inPosition.coords.latitude);
					inAction.setParam ("longitude", inPosition.coords.longitude);
					inAction.setParam ("accuracy", inPosition.coords.accuracy);
					inAction.fire ();
				}
				else
				{
					if (self.watch)
					{
						clearWatch (self.watch);
						self.watch = null;
					}
				}
			},
			function (inError)
			{
				if (positron.DOM.isValidNode (inAction.element))
				{
					inAction.params.error = inError;
					inAction.fire ();
				}
				else
				{
					if (self.watch)
					{
						clearWatch (self.watch);
						self.watch = null;
					}
				}
			}
		);
	}
	else
	{
		console.error ("browser does not support geolocation API");
	}
};

positron.trigger.LocationTrigger.prototype.requiresCancel = function ()
{
	return true;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.DeferTrigger");

positron.trigger.DeferTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.DeferTrigger, positron.trigger.Trigger);

positron.trigger.DeferTrigger.prototype.register = function (inAction, inContext)
{
	if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("DeferTrigger.register/fire(" + inAction.toString () + ")");
	
	return inAction.fire ();
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.DelayTrigger");

positron.trigger.DelayTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.DelayTrigger, positron.trigger.Trigger);

positron.trigger.DelayTrigger.prototype.cancel = function ()
{
	if (this.timeout)
	{
		clearTimeout (this.timeout);
		this.timeout = null;
	}
}

positron.trigger.DelayTrigger.prototype.register = function (inAction)
{
	var	time = monohm.String.parseTime (inAction.triggerArgs [0], 1000);

	this.timeout = setTimeout
	(
		function ()
		{
			inAction.fire ();
		},
		time
	);
};

positron.trigger.DelayTrigger.prototype.requiresCancel = function ()
{
	return true;
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.DispatchFormTrigger");

positron.trigger.DispatchFormTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.DispatchFormTrigger, positron.trigger.Trigger);

positron.trigger.DispatchFormTrigger.prototype.register = function (inAction)
{
	// console.log ("DispatchFormTrigger.process()");
	// console.log (inEvent);

	// sadly we have to hardwire events here
	// as we can't know which action will throw the event that we catch
	
	inAction.element.addEventListener
	(
		gApplication.getEventPrefix () + "dispatchform",
		function (inEvent)
		{
			for (var key in inEvent.detail)
			{
				inAction.params [key] = inEvent.detail [key];
				inAction.explicitParams [key] = inEvent.detail [key];
			}
		
			inAction.fire (inEvent);
		}
	);

	inAction.element.addEventListener
	(
		gApplication.getEventPrefix () + "dispatch-form",
		function (inEvent)
		{
			for (var key in inEvent.detail)
			{
				inAction.params [key] = inEvent.detail [key];
				inAction.explicitParams [key] = inEvent.detail [key];
			}
		
			inAction.fire (inEvent);
		}
	);
	
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.DoubleClickTrigger");

positron.trigger.DoubleClickTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.DoubleClickTrigger, positron.trigger.Trigger);

positron.trigger.DoubleClickTrigger.prototype.register = function (inAction)
{
	var	time = monohm.String.parseTime (inAction.triggerArgs [0], 500);
	var	slop = monohm.String.parseTime (inAction.triggerArgs [1], 10);
	
	var	downEventName = null;
	
	if (gApplication.browser.isMobile)
	{
		downEventName = "touchstart";
	}
	else
	{
		downEventName = "mousedown";
	}

	// should these really be instance variables, now taglets are no longer flyweights?
	var	timestamp = 0;
	var	x = 0;
	var	y = 0;
	var	active = false;

	inAction.element.addEventListener
	(
		downEventName,
		function (inEvent)
		{
			var	eventX = positron.Util.getEventX (inEvent);
			var	eventY = positron.Util.getEventY (inEvent);
			var	eventTimestamp = inEvent.timeStamp;
			
			if (active)
			{
				// already had one down event
				var	delta = eventTimestamp - timestamp;

				if (delta < time)
				{
					var	distance = positron.Util.get2DDistance (eventX, eventY, x, y);
					
					if (distance <= slop)
					{
						inAction.fire (inEvent);
					}
					else
					{
						console.error ("rejecting double click due to slop");
					}
				}
				else
				{
					console.error ("rejecting double click due to timestamp");
				}
				
				active = false;
			}
			else
			{
				active = true;
				x = positron.Util.getEventX (inEvent);
				y = positron.Util.getEventY (inEvent);
				timestamp = inEvent.timeStamp;
			}
		},
		false
	);
};

monohm.provide ("positron.trigger.FacebookAuthoriseTrigger");

positron.trigger.FacebookAuthoriseTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.FacebookAuthoriseTrigger, positron.trigger.Trigger);

positron.trigger.FacebookAuthoriseTrigger.prototype.cancel = function ()
{
	window.removeEventListener ("message", this.onMessageBound);
}

positron.trigger.FacebookAuthoriseTrigger.prototype.onMessage = function (inEvent)
{
	var	eventType = gApplication.getEventPrefix () + "facebook-authorise";

	if (inEvent.data && (inEvent.data.type == eventType))
	{
		if (inEvent.data.oauth_access_token)
		{
			positron.OAuth.setAccessTokens ("facebook", inEvent.data.oauth_access_token);
			this.action.fire ();
		}
		else
		{
			console.error ("facebook authorise event with no access token, ignoring");
		}
	}
}

positron.trigger.FacebookAuthoriseTrigger.prototype.register = function (inAction)
{
	this.action = inAction;
	
	this.onMessageBound = this.onMessage.bind (this);
	window.addEventListener ("message", this.onMessageBound, this.action.capturePhase);
};

positron.trigger.FacebookAuthoriseTrigger.prototype.requiresCancel = function ()
{
	return true;
}

monohm.provide ("positron.trigger.GoogleAuthoriseTrigger");

positron.trigger.GoogleAuthoriseTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.GoogleAuthoriseTrigger, positron.trigger.Trigger);

positron.trigger.GoogleAuthoriseTrigger.prototype.cancel = function ()
{
	window.removeEventListener ("message", this.onMessageBound);
}

positron.trigger.GoogleAuthoriseTrigger.prototype.onMessage = function (inEvent)
{
	var	eventType = gApplication.getEventPrefix () + "google-authorise";

	if (inEvent.data && (inEvent.data.type == eventType))
	{
		if (inEvent.data.oauth_access_token)
		{
			positron.OAuth.setAccessTokens ("google", inEvent.data.oauth_access_token);
			this.action.fire ();
		}
		else
		{
			console.error ("google authorise event with no access token, ignoring");
		}
	}
}

positron.trigger.GoogleAuthoriseTrigger.prototype.register = function (inAction)
{
	this.action = inAction;
	
	this.onMessageBound = this.onMessage.bind (this);
	window.addEventListener ("message", this.onMessageBound, this.action.capturePhase);
};

positron.trigger.GoogleAuthoriseTrigger.prototype.requiresCancel = function ()
{
	return true;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.HeadingTrigger");

positron.trigger.HeadingTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.HeadingTrigger, positron.trigger.Trigger);

positron.trigger.HeadingTrigger.prototype.cancel = function ()
{
	window.removeEventListener ("deviceorientation", this.onHeadingChangeBound);
}

positron.trigger.HeadingTrigger.prototype.onHeadingChange = function (inEvent)
{
	if (inEvent.webkitCompassHeading)
	{
		this.action.params.heading = inEvent.webkitCompassHeading;
	}
	else
	{
		this.action.params.heading = 360 - inEvent.alpha;
	}
	
	this.action.fire (inEvent);
}

positron.trigger.HeadingTrigger.prototype.register = function (inAction)
{
	console.log ("HeadingTrigger.register()");

	this.action = inAction;
	
	this.onHeadingChangeBound = this.onHeadingChange.bind (this);
	window.addEventListener ("deviceorientation", this.onHeadingChangeBound, this.action.capturePhase);
}

positron.trigger.HeadingTrigger.prototype.requiresCancel = function ()
{
	return true;
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.IntervalTrigger");

positron.trigger.IntervalTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.IntervalTrigger, positron.trigger.Trigger);

positron.trigger.IntervalTrigger.prototype.cancel = function (inAction)
{
	// console.log ("IntervalTrigger.cancel()");

	if (this.interval)
	{
		// console.log ("clearing interval " + this.interval);
		
		clearInterval (this.interval);
		this.interval = null;
	}
}

positron.trigger.IntervalTrigger.prototype.register = function (inAction)
{
	// console.log ("IntervalTrigger.register()");
	
	var	time = monohm.String.parseTime (inAction.triggerArgs [0], 1000);

	var	self = this;
	
	this.interval = setInterval
	(
		function ()
		{
			inAction.fire ();
		},
		time
	);
	
	// console.log ("registered interval " + this.interval);
};

positron.trigger.IntervalTrigger.prototype.requiresCancel = function ()
{
	return true;
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.KeyDownTrigger");

positron.trigger.KeyDownTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.KeyDownTrigger, positron.trigger.Trigger);

positron.trigger.KeyDownTrigger.prototype.cancel = function ()
{
	window.removeEventListener ("keydown", this.onKeyDownBound);
}

positron.trigger.KeyDownTrigger.prototype.onKeyDown = function (inEvent)
{
	if (this.keyCode == 0 || this.keyCode == inEvent.keyCode || this.keyCode == inEvent.keyIdentifier.toLowerCase ())
	{
		this.action.fire (inEvent);
	}
}

positron.trigger.KeyDownTrigger.prototype.register = function (inAction)
{
	console.log ("KeyDownTrigger.register()");
	
	this.action = inAction;
	this.keyCode = 0;
	
	if (inAction.triggerArgs.length > 0)
	{
		var	keyName = inAction.triggerArgs [0];
		
		this.keyCode = parseInt (keyName);
		
		if (isNaN (keyCode))
		{
			// could be a key identifier
			this.keyCode = keyName;
		}
	}
	
	this.onKeyDownBound = this.onKeyDown.bind (this);
	window.addEventListener ("keydown", this.onKeyDownBound, this.action.capturePhase);
}

positron.trigger.KeyDownTrigger.prototype.requiresCancel = function ()
{
	return true;
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.KeyPressTrigger");

positron.trigger.KeyPressTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.KeyPressTrigger, positron.trigger.Trigger);

positron.trigger.KeyPressTrigger.prototype.cancel = function ()
{
	window.removeEventListener ("keydown", this.onKeyPressBound);
}

positron.trigger.KeyPressTrigger.prototype.onKeyPress = function (inEvent)
{
	if (this.keyCode == 0 || this.keyCode == inEvent.keyCode || this.keyCode == inEvent.keyIdentifier.toLowerCase ())
	{
		this.action.fire (inEvent);
	}
}

positron.trigger.KeyPressTrigger.prototype.register = function (inAction)
{
	console.log ("KeyPressTrigger.register()");
	
	this.action = inAction;
	this.keyCode = 0;
	
	if (inAction.triggerArgs.length > 0)
	{
		var	keyName = inAction.triggerArgs [0];
		
		this.keyCode = parseInt (keyName);
		
		if (isNaN (keyCode))
		{
			// could be a key identifier
			this.keyCode = keyName;
		}
	}
	
	this.onKeyPressBound = this.onKeyPress.bind (this);
	window.addEventListener ("keypress", this.onKeyPressBound, this.action.capturePhase);
}

positron.trigger.KeyPressTrigger.prototype.requiresCancel = function ()
{
	return true;
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.LocationTrigger");

positron.trigger.LocationTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.LocationTrigger, positron.trigger.Trigger);

positron.trigger.LocationTrigger.prototype.cancel = function ()
{
	if (this.watch)
	{
		clearWatch (this.watch);
		this.watch = null;
	}
}

positron.trigger.LocationTrigger.prototype.register = function (inAction)
{
	if (navigator.geolocation)
	{
		var	self = this;
		
		this.watch = navigator.geolocation.watchPosition
		(
			function (inPosition)
			{
				if (positron.DOM.isValidNode (inAction.element))
				{
					inAction.setParam ("position", inPosition);
					inAction.setParam ("latitude", inPosition.coords.latitude);
					inAction.setParam ("longitude", inPosition.coords.longitude);
					inAction.setParam ("accuracy", inPosition.coords.accuracy);
					inAction.fire ();
				}
				else
				{
					if (self.watch)
					{
						clearWatch (self.watch);
						self.watch = null;
					}
				}
			},
			function (inError)
			{
				if (positron.DOM.isValidNode (inAction.element))
				{
					inAction.params.error = inError;
					inAction.fire ();
				}
				else
				{
					if (self.watch)
					{
						clearWatch (self.watch);
						self.watch = null;
					}
				}
			}
		);
	}
	else
	{
		console.error ("browser does not support geolocation API");
	}
};

positron.trigger.LocationTrigger.prototype.requiresCancel = function ()
{
	return true;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.LongClickTrigger");

positron.trigger.LongClickTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.LongClickTrigger, positron.trigger.Trigger);

positron.trigger.LongClickTrigger.prototype.register = function (inAction)
{
	var	minDowntime = 500;
	var	slop = 0;
	
	if (inAction.triggerArgs.length > 0)
	{
		minDowntime = monohm.String.parseTime (inAction.triggerArgs [0], 500);

		if (minDowntime < 0)
		{
			minDowntime = 500;
		}
		
		if (inAction.triggerArgs.length > 1)
		{
			var	value = monohm.String.parseValueAndUnits (inAction.triggerArgs [1], 0);
			
			if (value.value > 0)
			{
				slop = value.value;
			}
		}		
	}

	var	downEventName = null;
	var	upEventName = null;
	var	leaveEventName = null;
	var	moveEventName = null;
	var	cancelEventName = null;
	
	if (gApplication.browser.isMobile)
	{
		downEventName = "touchstart";
		upEventName = "touchend";
		leaveEventName = "touchleave";
		moveEventName = "touchmove";
		cancelEventName = "touchcancel";
	}
	else
	{
		downEventName = "mousedown";
		upEventName = "mouseup";
		leaveEventName = "mouseleave";
		moveEventName = "mousemove";
		cancelEventName = null;
	}

	// should these really be instance variables, now taglets are no longer flyweights?
	var	timeout = null;
	var	timestamp = 0;
	var	x = 0;
	var	y = 0;
	
	inAction.element.addEventListener
	(
		downEventName,
		function (inEvent)
		{
			x = positron.Util.getEventX (inEvent);
			y = positron.Util.getEventY (inEvent);

			timestamp = inEvent.timeStamp;
			
			timeout = setTimeout
			(
				function ()
				{
					timeout = null;
					inAction.fire (inEvent);
				},
				minDowntime
			);
		},
		false
	);

	inAction.element.addEventListener
	(
		upEventName,
		function (inEvent)
		{
			if (timeout)
			{
				clearTimeout (timeout);
				timeout = null;
			}
		},
		false
	);

	inAction.element.addEventListener
	(
		moveEventName,
		function (inEvent)
		{
			if (timeout)
			{
				var	eventX = positron.Util.getEventX (inEvent);
				var	eventY = positron.Util.getEventY (inEvent);

				if (slop > 0 || positron.Util.get2DDistance (x, y, eventX, eventY) > slop)
				{
					clearTimeout (timeout);
					timeout = null;
				}
			}
		},
		false
	);

	inAction.element.addEventListener
	(
		leaveEventName,
		function (inEvent)
		{
			if (timeout)
			{
				// console.log ("leave event, cancelling long click/tap");

				clearTimeout (timeout);
				timeout = null;
			}
		},
		false
	);
	
	if (gApplication.browser.isMobile)
	{
		inAction.element.addEventListener
		(
			"touchcancel",
			function (inEvent)
			{
				if (timeout)
				{
					clearTimeout (timeout);
					timeout = null;
				}
			},
			false
		);
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.MIDIMessageTrigger");

positron.trigger.MIDIMessageTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.MIDIMessageTrigger, positron.trigger.Trigger);

positron.trigger.MIDIMessageTrigger.prototype.cancel = function ()
{
	gApplication.removeMIDIListener (this.portID, this.onMIDIMessageBound);
}

positron.trigger.MIDIMessageTrigger.prototype.onMIDIMessage = function (inEvent)
{
	this.action.fire (inEvent);
};

positron.trigger.MIDIMessageTrigger.prototype.register = function (inAction)
{
	if (inAction.triggerArgs.length > 0)
	{
		this.portID = parseInt (inAction.triggerArgs [0]);
		
		if (isNaN (this.portID))
		{
			console.error ("MIDIMessageTrigger with bad port ID: " + this.portID);
		}
		else
		{
			this.action = inAction;
			
			this.onMIDIMessageBound = this.onMIDIMessage.bind (this);
			gApplication.addMIDIListener (this.portID, this.onMIDIMessageBound);
		}
	}
	else
	{
		console.error ("MIDIMessageTrigger with no port ID in arguments");
	}
};

positron.trigger.MIDIMessageTrigger.prototype.requiresCancel = function ()
{
	return true;
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.MouseDownTrigger");

positron.trigger.MouseDownTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.MouseDownTrigger, positron.trigger.Trigger);

positron.trigger.MouseDownTrigger.prototype.register = function (inAction)
{
	var	eventName = null;
	
	if (gApplication.browser.isMobile)
	{
		eventName = "touchstart";
	}
	else
	{
		eventName = "mousedown";
	}

	inAction.element.addEventListener
	(
		eventName,
		function (inEvent)
		{
			inAction.fire (inEvent);
		},
		inAction.capturePhase
	);

};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.MouseMoveTrigger");

positron.trigger.MouseMoveTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.MouseMoveTrigger, positron.trigger.Trigger);

positron.trigger.MouseMoveTrigger.prototype.register = function (inAction)
{
	var	eventName = null;
	
	if (gApplication.browser.isMobile)
	{
		eventName = "touchmove";
	}
	else
	{
		eventName = "mousemove";
	}

	inAction.element.addEventListener
	(
		eventName,
		function (inEvent)
		{
			inAction.fire (inEvent);
		},
		inAction.capturePhase
	);

};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.MouseUpTrigger");

positron.trigger.MouseUpTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.MouseUpTrigger, positron.trigger.Trigger);

positron.trigger.MouseUpTrigger.prototype.register = function (inAction)
{
	var	eventName = null;
	
	if (gApplication.browser.isMobile)
	{
		eventName = "touchend";
	}
	else
	{
		eventName = "mouseup";
	}

	inAction.element.addEventListener
	(
		eventName,
		function (inEvent)
		{
			inAction.fire (inEvent);
		},
		inAction.capturePhase
	);

};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.NowTrigger");

positron.trigger.NowTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.NowTrigger, positron.trigger.Trigger);

positron.trigger.NowTrigger.prototype.register = function (inAction, inContext)
{
	if (gApplication.isLogging (gApplication.kLogTrigger)) console.log ("NowTrigger.register/fire(" + inAction.toString () + ")");
	
	return inAction.fire (null, inContext);
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.PrefixedEventTrigger");

positron.trigger.PrefixedEventTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.PrefixedEventTrigger, positron.trigger.Trigger);

positron.trigger.PrefixedEventTrigger.prototype.register = function (inAction)
{
	console.log ("PrefixedEventTrigger.register()");
	
	if (inAction.triggerArgs.length)
	{
		var	neutralEventName = inAction.triggerArgs [0];
		var	prefixedEventName = positron.CSS.getPrefixedEvent (neutralEventName);
		
		if (!prefixedEventName)
		{
			console.error ("no event mapping for " + neutralEventName + ", using default");
			
			prefixedEventName = neutralEventName;
		}

		inAction.element.addEventListener
		(
			prefixedEventName,
			function (inEvent)
			{
				inAction.fire (inEvent);
			},
			false
		);
	}
	else
	{
		console.error ("PrefixedEventTrigger: no event argument supplied");
	}
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.RefreshViewTrigger");

positron.trigger.RefreshViewTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.RefreshViewTrigger, positron.trigger.Trigger);

positron.trigger.RefreshViewTrigger.prototype.cancel = function ()
{
	window.removeEventListener (gApplication.getEventPrefix () + "refreshview", this.onRefreshViewBound);
}

positron.trigger.RefreshViewTrigger.prototype.onRefreshView = function (inEvent)
{
	if (inEvent.detail && (inEvent.detail.viewKey == this.viewKey))
	{
		this.action.fire (inEvent);
	}
}

positron.trigger.RefreshViewTrigger.prototype.register = function (inAction)
{
	// console.log ("RefreshViewTrigger.register()");
	
	if (inAction.triggerArgs.length > 0 && inAction.triggerArgs [0].length > 0)
	{
		this.action = inAction;
		this.viewKey = inAction.triggerArgs [0];
		
		this.onRefreshViewBound = this.onRefreshView.bind (this);
		window.addEventListener (gApplication.getEventPrefix () + "refreshview", this.onRefreshViewBound, this.action.capturePhase);
	}
	else
	{
		console.error ("RefreshViewTrigger with no view key");
	}
	
}

positron.trigger.RefreshViewTrigger.prototype.requiresCancel = function ()
{
	return this.action != null;
}
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.ShowViewTrigger");

positron.trigger.ShowViewTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.ShowViewTrigger, positron.trigger.Trigger);

positron.trigger.ShowViewTrigger.prototype.cancel = function ()
{
	window.removeEventListener (gApplication.getEventPrefix () + "showview", this.onShowViewBound);
}

positron.trigger.ShowViewTrigger.prototype.onShowView = function (inEvent)
{
	if (inEvent.detail && (inEvent.detail.viewKey == this.viewKey))
	{
		this.action.fire (inEvent);
	}
}

positron.trigger.ShowViewTrigger.prototype.register = function (inAction)
{
	// console.log ("ShowViewTrigger.register()");
	
	if (inAction.triggerArgs.length > 0 && inAction.triggerArgs [0].length > 0)
	{
		this.action = inAction;
		this.viewKey = inAction.triggerArgs [0];
		
		this.onShowViewBound = this.onShowView.bind (this);
		window.addEventListener (gApplication.getEventPrefix () + "showview", this.onShowViewBound, this.action.capturePhase);
	}
	else
	{
		console.error ("ShowViewTrigger with no view key");
	}
	
}

positron.trigger.ShowViewTrigger.prototype.requiresCancel = function ()
{
	return this.action != null;
}
monohm.provide ("positron.trigger.TwitterAuthoriseTrigger");

positron.trigger.TwitterAuthoriseTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.TwitterAuthoriseTrigger, positron.trigger.Trigger);

positron.trigger.TwitterAuthoriseTrigger.prototype.cancel = function ()
{
	window.removeEventListener ("message", this.onMessageBound);
}

positron.trigger.TwitterAuthoriseTrigger.prototype.onMessage = function (inEvent)
{
	var	eventType = gApplication.getEventPrefix () + "twitter-authorise";
	
	if (inEvent.data && (inEvent.data.type == eventType))
	{
		var	self = this;
		
		if (inEvent.data.oauth_verifier)
		{
			positron.Twitter.getAccessToken
			(
				inEvent.data.oauth_verifier,
				function (inError, inResponse)
				{
					if (inError)
					{
						console.error (inError);
					}
					else
					{
						self.action.fire ();
					}
				}
			);
		}
		else
		{
			console.error ("twitter authorise event with no verifier, ignoring");
		}
	}
}

positron.trigger.TwitterAuthoriseTrigger.prototype.register = function (inAction)
{
	this.action = inAction;
	
	this.onMessageBound = this.onMessage.bind (this);
	window.addEventListener ("message", this.onMessageBound, this.action.capturePhase);
};

positron.trigger.TwitterAuthoriseTrigger.prototype.requiresCancel = function ()
{
	return true;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.trigger.WebSocketMessageTrigger");

positron.trigger.WebSocketMessageTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (positron.trigger.WebSocketMessageTrigger, positron.trigger.Trigger);

positron.trigger.WebSocketMessageTrigger.prototype.cancel = function ()
{
	if (this.webSocket)
	{
		this.webSocket.onmessage = null;
		this.webSocket = null;
	}
}

positron.trigger.WebSocketMessageTrigger.prototype.register = function (inAction, inContext)
{
	// console.log ("positron.trigger.WebSocketMessageTrigger.register()");

	if (inAction.triggerArgs.length > 0 && inAction.triggerArgs [0].length > 0)
	{
		var	webSocketName = inAction.triggerArgs [0];
		this.webSocket = gApplication.getWebSocket (webSocketName);
		
		if (this.webSocket)
		{
			this.webSocket.onmessage = function (inMessage)
			{
				if (gApplication.isLogging (gApplication.kLogTrigger))
				{
					console.log ("received message on websocket: " + webSocketName);
					console.log (inMessage.data);
				}
				
				var	data = inMessage.data;
				
				// wanted to use instanceof here for more resolution
				// but strings are not guaranteed to be strings, seems like
				// #fail
				if (typeof (data) == "string")
				{
					try
					{
						inAction.params.message = JSON.parse (inMessage.data);
						
						// JSON parsing worked
						inAction.params.type = "json";
					}
					catch (inError)
					{
						inAction.params.message = inMessage.data;
						inAction.params.type = "string";
					}
				}
				else
				{
					inAction.params.message = inMessage.data;
					inAction.params.type = "arraybuffer";
				}
				
				inAction.fire ();
			}
		}
		else
		{
			console.error ("WebSocketMessageTrigger can't find websocket with name: " + webSocketName);
		}
	}
	else
	{
		console.error ("WebSocketMessageTrigger with no socket name argument");
	}
}


positron.trigger.WebSocketMessageTrigger.prototype.requiresCancel = function ()
{
	return true;
}

monohm.provide ("positron.view.MediaClientView");

positron.view.MediaClientView = function ()
{
	positron.View.call (this);
};
monohm.inherits (positron.view.MediaClientView, positron.View);

// VIEW OVERRIDES

// EVENT HANDLERS

positron.view.MediaClientView.prototype.onMouseDown = function (inEvent)
{
	this.mouseDown = true;

	var	width = parseInt (window.getComputedStyle (this.element).width);
	
	if (inEvent.changedTouches)
	{
		this.setPositionFromFraction ((inEvent.changedTouches [0].pageX - inEvent.target.offsetLeft) / width);
	}
	else
	{
		this.setPositionFromFraction (inEvent.offsetX / width);
	}
}

positron.view.MediaClientView.prototype.onMouseMove = function (inEvent)
{
	if (this.mouseDown)
	{
		var	width = parseInt (window.getComputedStyle (this.element).width);
	
		if (inEvent.changedTouches)
		{
			this.setPositionFromFraction ((inEvent.changedTouches [0].pageX - inEvent.target.offsetLeft) / width);
		}
		else
		{
			this.setPositionFromFraction (inEvent.offsetX / width);
		}
	}
}

positron.view.MediaClientView.prototype.onMouseUp = function (inEvent)
{
	this.mouseDown = false;
}

// API

positron.view.MediaClientView.prototype.play = function ()
{
	// console.log ("positron.view.MediaClientView.play()");

	var	mediaView = gApplication.getView (positron.DOM.getPrefixedAttribute (this.element, "media-view"));
	
	if (mediaView)
	{
		mediaView.play ();
	}
	else
	{
		console.error ("play() called with no media server view");
	}
}

positron.view.MediaClientView.prototype.pause = function ()
{
	// console.log ("positron.view.MediaClientView.pause()");

	var	mediaView = gApplication.getView (positron.DOM.getPrefixedAttribute (this.element, "media-view"));
	
	if (mediaView)
	{
		mediaView.pause ();
	}
	else
	{
		console.error ("pause() called with no media server view");
	}
}

// fraction runs 0..1
positron.view.MediaClientView.prototype.setPositionFromFraction = function (inFraction)
{
	// console.log ("positron.view.MediaClientView.setPositionFromFraction() " + inFraction);

	var	mediaView = gApplication.getView (positron.DOM.getPrefixedAttribute (this.element, "media-view"));
	
	if (mediaView)
	{
		mediaView.setPositionFromFraction (inFraction);
	}
	else
	{
		console.error ("positron.view.MediaClientView.setPositionFromFraction() called with no media server view");
	}
}

// percent runs 0..100
positron.view.MediaClientView.prototype.setPositionFromPercent = function (inPercent)
{
	// console.log ("positron.view.MediaClientView.setPositionFromPercent() " + inPercent);

	var	mediaView = gApplication.getView (positron.DOM.getPrefixedAttribute (this.element, "media-view"));
	
	if (mediaView)
	{
		mediaView.setPositionFromPercent (inPercent);
	}
	else
	{
		console.error ("positron.view.MediaClientView.setPositionFromPercent() called with no media server view");
	}
}


monohm.provide ("positron.view.MediaServerView");

positron.view.MediaServerView = function ()
{
	positron.View.call (this);
	
	this.events = 
	[
		"canplay",
		"canplaythrough",
		"ended",
		"loadedmetadata",
		"pause",
		"play",
		"progress",
		"timeupdate"
	];
	
};

monohm.inherits (positron.view.MediaServerView, positron.View);

// VIEW OVERRIDES

positron.view.MediaServerView.prototype.onDOMReady = function ()
{
	positron.View.prototype.onDOMReady.call (this);
	
	this.mediaElement = this.element.querySelector ("video,audio");
	
	if (this.mediaElement)
	{
		// can't cleanly decide whether to add autoplay attribute in markup, so...
		if (this.params.autoplay && (this.params.autoplay == "true"))
		{
			this.mediaElement.setAttribute ("autoplay", "true");
		}
		
		var	self = this;
		
		// we COULD do this in markup, but since there are 7 of them...
		for (var i = 0; i < this.events.length; i++)
		{
			this.mediaElement.addEventListener
			(
				this.events [i],
				function (inEvent)
				{
					self.onMediaEvent (inEvent);
				},
				false
			);
		}
	}
	
	// first init, or new source, results in reset status
	this.mediaState = new Object ();
	this.mediaState.loadedmetadata = false;
	this.mediaState.playing = false;
	this.mediaState.ended = false;
	this.mediaState.canplay = false;
	this.mediaState.canplaythrough = false;
	
	this.mediaState.progress = new Object ();
	this.mediaState.progress.percent = 0;
	this.mediaState.progress.ratio = 0;
	this.mediaState.progress.hours = 0;
	this.mediaState.progress.minutes = 0;
	this.mediaState.progress.seconds = 0;
	this.mediaState.progress.milliseconds = 0;

	this.mediaState.play = new Object ();
	this.mediaState.play.percent = 0;
	this.mediaState.play.ratio = 0;
	this.mediaState.play.hours = 0;
	this.mediaState.play.minutes = 0;
	this.mediaState.play.seconds = 0;
	this.mediaState.play.milliseconds = 0;

	this.mediaState.remaining = new Object ();
	this.mediaState.remaining.hours = 0;
	this.mediaState.remaining.minutes = 0;
	this.mediaState.remaining.seconds = 0;
	this.mediaState.remaining.milliseconds = 0;

	this.mediaState.duration = new Object ();
	this.mediaState.duration.hours = 0;
	this.mediaState.duration.minutes = 0;
	this.mediaState.duration.seconds = 0;
	this.mediaState.duration.milliseconds = 0;

}

// API

positron.view.MediaServerView.prototype.play = function ()
{
	if (this.mediaElement)
	{
		if (! this.mediaState.playing)
		{
			this.mediaElement.play ();
		}
	}
	else
	{
		console.error ("media element is not present");
	}
}

positron.view.MediaServerView.prototype.pause = function ()
{
	if (this.mediaElement)
	{
		this.mediaElement.pause ();
	}
	else
	{
		console.error ("media element is not present");
	}
}

// fraction runs 0..1
positron.view.MediaServerView.prototype.setPositionFromFraction = function (inFraction)
{
	if (this.mediaElement)
	{
		if (typeof (this.mediaElement.duration) == "number")
		{
			if (inFraction >= 0 && inFraction <= 1)
			{
				this.mediaElement.currentTime = inFraction * this.mediaElement.duration;
			}
			else
			{
				console.error ("setPositionFromFraction() called with bad fraction: " + inFraction);
			}
		}
		else
		{
			console.error ("setPositionFromFraction() called before duration known");
		}
	}
	else
	{
		console.error ("setPositionFromFraction() called with no media element");
	}
}

// percent runs 0..100
positron.view.MediaServerView.prototype.setPositionFromPercent = function (inPercent)
{
	if (this.mediaElement)
	{
		if (typeof (this.mediaElement.duration) == "number")
		{
			if (inPercent >= 0 && inPercent <= 100)
			{
				var	fraction = inPercent / 100;
				
				this.mediaElement.currentTime = fraction * this.mediaElement.duration;
			}
			else
			{
				console.error ("setPositionFromPercent() called with bad percent: " + inPercent);
			}
		}
		else
		{
			console.error ("setPositionFromPercent() called before duration known");
		}
	}
	else
	{
		console.error ("setPositionFromPercent() called with no media element");
	}
}

// CALLBACKS

positron.view.MediaServerView.prototype.onMediaEvent = function (inEvent)
{
	// console.log ("positron.view.MediaServerView.onMediaEvent() with type " + inEvent.type);
	// console.log (inEvent);
	
	// we keep our own status around to account for browser irregularities, etc
	// and so clients always have the current state available
	this.updateState (inEvent);
	
	// find the media clients with this view as their server
	// TODO may want to cache this list during playback?
	var	clients = document.querySelectorAll
		("[" + gApplication.getCSSClassPrefix () + "media-view=" + this.key + "]");
	
	for (var i = 0; i < clients.length; i++)
	{
		var	sendEvent = true;
		
		var	listenerEvents = positron.DOM.getPrefixedAttribute (clients [i], "media-events");
		
		if (listenerEvents && listenerEvents.length)
		{
			sendEvent = false;
			
			var	listenerEventElements = listenerEvents.split (',');
			
			for (var j = 0; j < listenerEventElements.length; j++)
			{
				if (inEvent.type == monohm.String.stripSpaces (listenerEventElements [j]))
				{
					sendEvent = true;
					break;
				}
			}
		}
		else
		{
			// the default is "receive all events"
		}
		
		if (sendEvent)
		{
			var	clientView = positron.DOM.getData (clients [i], "view");

			if (clientView)
			{
				// get rid of onMediaEvent()
				// because we're just doing regular Positron mechanics here
				clientView.setParam ("event", inEvent);
				clientView.setParam ("mediastate", this.mediaState);
				clientView.refresh ();
			}
		}
	}
}

// PRIVATE METHODS

positron.view.MediaServerView.prototype.convertTime = function (inTime, outConverted)
{
	var	fullSeconds = Math.floor (inTime);
	
	outConverted.milliseconds = Math.floor ((inTime - fullSeconds) * 1000);
	outConverted.seconds = fullSeconds % 60;
	outConverted.minutes = Math.floor ((fullSeconds / 60) % 60);
	outConverted.hours = Math.floor (fullSeconds / 3600);
}

positron.view.MediaServerView.prototype.updateState = function (inEvent)
{
	if (inEvent.type == "loadedmetadata")
	{
		this.mediaState.loadedmetadata = true;
		
		this.mediaState.duration.value = this.mediaElement.duration;
		this.convertTime (this.mediaElement.duration, this.mediaState.duration);
	}
	else
	if (inEvent.type == "canplay")
	{
		this.mediaState.canplay = true;
	}
	else
	if (inEvent.type == "canplaythrough")
	{
		this.mediaState.canplaythrough = true;
	}
	else
	if (inEvent.type == "progress")
	{
		// careful, some browsers give us progress without duration, sigh
		if (typeof (this.mediaElement.duration) == "number" && !isNaN (this.mediaElement.duration))
		{
			this.mediaState.progress.value = this.mediaElement.currentTime;

			var	bufferedEnd = 0;
			
			// careful again, can get issues with end(0) here :-\
			try
			{
				bufferedEnd = this.mediaElement.buffered.end (0);
			}
			catch (inError)
			{
				this.mediaState.progress.percent = 0;
			}

			// percent is 0..100
			this.mediaState.progress.percent = bufferedEnd / this.mediaElement.duration;
			this.mediaState.progress.percent = Math.round (this.mediaState.progress.percent * 100);
			
			// ratio is 0..1 in 100ths
			this.mediaState.progress.ratio = this.mediaState.progress.percent / 100;
			
			// calculate real time
			this.convertTime (bufferedEnd, this.mediaState.progress);
		}
	}
	else
	if (inEvent.type == "play")
	{
		this.mediaState.playing = true;
		this.mediaState.paused = false;
		this.mediaState.ended = false;
	}
	else
	if (inEvent.type == "pause")
	{
		this.mediaState.playing = false;
		this.mediaState.paused = true;
	}
	else
	if (inEvent.type == "ended")
	{
		this.mediaState.playing = false;
		this.mediaState.ended = true;
		
		if (! this.mediaState.paused)
		{
			// ok so we didn't get a pause event prior to the ended event
			// which means that the next time we call play() we won't get a play event
			// known Safari problem
			// solution is to call pause() ourselves
			this.mediaElement.pause ();
		}
	}
	else
	if (inEvent.type == "timeupdate")
	{
		// careful, some browsers give us progress without duration, sigh
		if (typeof (this.mediaElement.duration) == "number" && !isNaN (this.mediaElement.duration))
		{
			this.mediaState.play.value = this.mediaElement.currentTime;

			// percent is 0..100
			this.mediaState.play.percent = this.mediaElement.currentTime / this.mediaElement.duration;
			this.mediaState.play.percent = Math.round (this.mediaState.play.percent * 100);

			// ratio is 0..1 in 100ths
			this.mediaState.play.ratio = this.mediaState.play.percent / 100;
			
			// calculate real time
			this.convertTime (this.mediaElement.currentTime, this.mediaState.play);
			
			this.mediaState.remaining.value = this.mediaElement.duration - this.mediaElement.currentTime;

			// percent is 0..100
			this.mediaState.remaining.percent = this.mediaState.remaining.value / this.mediaElement.duration;
			this.mediaState.remaining.percent = Math.round (this.mediaState.remaining.percent * 100);
			
			// ratio is 0..1 in 100ths
			this.mediaState.remaining.ratio = this.mediaState.remaining.percent / 100;

			// calculate real time
			this.convertTime (this.mediaState.remaining.value, this.mediaState.remaining);
		}
	}
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.TreeWalker");

/**
 * @constructor
 */
positron.TreeWalker = function ()
{
};

// INTERFACE

positron.TreeWalker.prototype.onElement = function (inElement)
{
	console.error ("TreeWalker.onElement() (abstract) called");
};

positron.TreeWalker.prototype.onTextNode = function (inTextNode)
{
	// don't squawk here, some walkers don't care about text
	// console.error ("TreeWalker.onTextNode() (abstract) called");
};

// PUBLIC METHODS

positron.TreeWalker.prototype.startWalk = function (inNode, inContext)
{
	this.mInStart = true;
	this.walk (inNode);
	this.mInStart = false;
};

positron.TreeWalker.prototype.startWalkChildren = function (inNode, inContext)
{
	this.mInStart = true;
	this.walkChildren (inNode, inContext);
	this.mInStart = false;
};

// PRIVATE METHODS

// overrideable for walkers that want to go in no-go zones...
positron.TreeWalker.prototype.canWalk = function (inElement)
{
	var	walk = true;
	
	if (positron.DOM.hasPrefixedClass (inElement, "page-container"))
	{
		walk = false;
	}
	
	return walk;
}

positron.TreeWalker.prototype.walk = function (inNode, inContext)
{
	if (gApplication.isLogging (gApplication.kLogTreeWalker))
	{
		if (inNode.nodeType == inNode.ELEMENT_NODE)
		{
			var	className = inNode.getAttribute ("class");
			console.log ("TreeWalker.walk(" + inNode.nodeName.toLowerCase () + (className ? " " + className : "") + ")");
		}
	}
	
	var	walkChildren = true;

	if (inNode.nodeType == inNode.ELEMENT_NODE) // ELEMENT_NODE
	{
		if (this.canWalk (inNode))
		{
			var	result = this.onElement (inNode, inContext);
			
			if (typeof (result) == "boolean")
			{
				walkChildren = result;
			}
		}
		else
		{
			// sacred area, invisible to walkers
			walkChildren = false;
		}
	}
	else
	if (inNode.nodeType == inNode.TEXT_NODE)
	{
		this.onTextNode (inNode, inContext);
	}
	
	if (walkChildren)
	{
		this.walkChildren (inNode, inContext);
	}
};

positron.TreeWalker.prototype.walkChildren = function (inNode, inContext)
{
	if (inNode.hasChildNodes ())
	{
		var child = null;
		var nextChild = inNode.firstChild;
		
		// walk this way because children can disappear in walk()
		do
		{
			child = nextChild;
			nextChild = null;
			
			if (child)
			{
				nextChild = child.nextSibling;
		
				this.walk (child, inContext);
			}
		}
		while (nextChild);
	}
};
/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.RefreshTreeWalker");

// this should really inherit from an async tree walker class

// CONSTRUCTOR

// HACK before visible means "act like a refreshing before visible tree walker"
// as the OBV walker is now sync and non-refreshing
positron.RefreshTreeWalker =
function positron_RefreshTreeWalker (inListener, inBeforeVisible)
{
	this.listener = inListener;
	this.beforeVisible = inBeforeVisible;
	
	this.cancelled = false;
}

positron.RefreshTreeWalker.prototype.cancel =
function RefreshTreeWalker_cancel ()
{
	// console.log ("RefreshTreeWalker.cancel()");
	
	this.cancelled = true;
	
	if (this.subTreeWalker)
	{
		this.subTreeWalker.cancel ();
	}
}

positron.RefreshTreeWalker.prototype.isCancelled =
function RefreshTreeWalker_isCancelled ()
{
	return this.cancelled;
}

positron.RefreshTreeWalker.prototype.startWalk =
function RefreshTreeWalker_startWalk (inNode, inContext)
{
	this.context = inContext;
	this.rootNode = inNode;
	
	this.nextNode = inNode;

	return this.onWalkComplete ();
}

positron.RefreshTreeWalker.prototype.startWalkChildren =
function RefreshTreeWalker_startWalkChildren (inNode, inContext)
{
	if (gApplication.isLogging (gApplication.kLogTreeWalker)) console.log ("positron.RefreshTreeWalker.startWalkChildren()");
	if (gApplication.isLogging (gApplication.kLogTreeWalker)) console.log (inNode);
	
	var	done = true;

	if (inNode)
	{
		this.context = inContext;
		this.rootNode = inNode;
		
		if (this.rootNode.hasChildNodes ())
		{
			this.nextNode = this.rootNode.firstChild;
			
			done = this.onWalkComplete (null);
		}
		else
		{
			// console.log ("walk complete, calling listener");
			this.listener.onWalkComplete (this);
		}
	}
	else
	{
		console.error ("RefreshTreeWalker.startWalkChildren() with null parent node");
		var	error = new Error ("RefreshTreeWalker.startWalkChildren() with null parent node");
		console.error (error.stack);
	}
	
	return done;
}

positron.RefreshTreeWalker.prototype.walk =
function RefreshTreeWalker_walk (inNode)
{
	if (gApplication.isLogging (gApplication.kLogTreeWalker)) console.log ("positron.RefreshTreeWalker.walk()");
	if (gApplication.isLogging (gApplication.kLogTreeWalker)) console.log (inNode);
	
	var	done = true;
	
	if (inNode.nodeType == inNode.ELEMENT_NODE)
	{
		done = this.onElement (inNode, this.context);
	}
	else
	if (inNode.nodeType == inNode.TEXT_NODE)
	{
		done = this.onTextNode (inNode, this.context);
	}
	
	return done;
}

positron.RefreshTreeWalker.prototype.findNextNode =
function RefreshTreeWalker_findNextNode (inNode)
{
	this.nextNode = null;
	
	if (inNode.nodeType == inNode.ELEMENT_NODE)
	{
		// here, we only need to find out whether a tag has a taglet mapped
		// we don't need to load it, which saves us a potentially async operation
		if (gApplication.config.tags [inNode.nodeName.toLowerCase ()])
		{
			// taglets are responsible for walking their subtrees
		}
		else
		if (positron.DOM.getPrefixedAttribute (inNode, "view"))
		{
			// views are responsible for walking their subtrees
		}
		else
		if (positron.DOM.getPrefixedAttribute (inNode, "localise"))
		{
			// localisation is responsible for walking its subtree
		}
		else
		if (inNode.hasChildNodes ())
		{
			this.nextNode = inNode.firstChild;
		}
	}

	if (! this.nextNode)
	{
		if (inNode != this.rootNode)
		{
			this.nextNode = inNode.nextSibling;
			var	parent = inNode;
			
			while (this.nextNode == null)
			{
				parent = parent.parentNode;
				this.nextNode = parent;

				if (this.nextNode == this.rootNode)
				{
					this.nextNode = null;
					break;
				}
				
				this.nextNode = this.nextNode.nextSibling;
			}
		}
	}

}

// this is the arse-protect done pre running attributelets
// as an attributelet might delete the element under consideration
// so find a next node which is *not* inside the provided element
positron.RefreshTreeWalker.prototype.findNextNodeOutside =
function RefreshTreeWalker_findNextNodeOutside (inElement)
{
	var nextNode = null;

	nextNode = inElement.nextSibling;
	
	if (! nextNode)
	{
		nextNode = inElement.parentNode;
		
		if (nextNode == this.rootNode)
		{
			nextNode = null;
		}
		else
		{
			nextNode = nextNode.nextSibling;
		}
	}
	return nextNode;
}

// we virtualise this so that refreshers make more refreshers
// and OBVs make more OBVs, etc
positron.RefreshTreeWalker.prototype.makeSubTreeWalker =
function RefreshTreeWalker_makeSubTreeWalker (inListener)
{
	this.subTreeWalker = new positron.RefreshTreeWalker (inListener, this.beforeVisible);
	this.subTreeWalker.superTreeWalker = this;
	
	return this.subTreeWalker;
}

// TREEWALKER IMPLEMENTATION

// REMEMBER here that findNextNode() special-cases some kinds of element
// that need to do their own subwalk
// SO this.nextNode may be inside the element (normal situation)
// OR this element's sibling, etc (if something on this element does its own subwalk)
// so don't read this thinking that the next node is always one of this element's children
positron.RefreshTreeWalker.prototype.onElement =
function RefreshTreeWalker_onElement (inElement, inContext)
{
	// console.log ("RefreshTreeWalker.onElement()");
	// console.log (inElement);

	this.expandAttributeValues (inElement, inContext);
	
	// ok, in case an attributelet deletes the element
	// we have to go off and find the next element to process
	// as the current "next node" may be *inside* the element that got deleted
	this.tempNextNode = this.findNextNodeOutside (inElement);
	
	// prep for potentially async attribute run
	this.attributeSync = true;
	this.attributeIndex = -1;
	this.element = inElement;
	this.context = inContext;

	// honour any required attribute order
	// as some have dependencies on others
	if (this.attributesToCheck)
	{
		this.attributesToCheck.length = 0;
	}
	else
	{
		this.attributesToCheck = new Array ();
	}
	
	var	configAttributes = gApplication.getConfigEntry ("attributeOrder");
	
	if (Array.isArray (configAttributes))
	{
		for (var i = 0; i < configAttributes.length; i++)
		{
			this.attributesToCheck.push (configAttributes [i]);
		}
	}

	for (var i = 0; i < this.element.attributes.length; i++)
	{
		var attribute = this.element.attributes.item (i);
		var	attributeName = attribute.name.toLowerCase ();
		
		// leave out ones we already have
		if (configAttributes.indexOf (attributeName) == -1)
		{
			this.attributesToCheck.push (attributeName);
		}
	}
	
	// run any attributelets associated with attribute names
	// when done, go on to taglet handling
	return this.onAttributeWalkComplete ();
}

// requires --
// this.attributeSync = true
// this.element
// this.context
// this.attributeIndex
// this.attributesToCheck
// set up by onElement()
positron.RefreshTreeWalker.prototype.onAttributeWalkComplete =
function RefreshTreeWalker_onAttributeWalkComplete ()
{
	// console.log ("RefreshTreeWalker.onAttributeWalkComplete()");
	// console.log (this.element);
	// console.log (this.attributeIndex);

	var	self = this;

	if (this.cancelled)
	{
		return true;
	}

	for (this.attributeIndex++; this.attributeIndex < this.attributesToCheck.length; this.attributeIndex++)
	{
		var	attributeName = this.attributesToCheck [this.attributeIndex];

		if (this.element.getAttribute (attributeName))
		{
			var	attributeSpec = positron.Util.getAttributeSpec (attributeName);

			// assume we're async
			// and override if we get called back sync
			// SIGH
			var	tempAttributeSync = false;

			gApplication.getAttributeletAsync
			(
				attributeSpec.name,
				function (inAttributelet, inSync)
				{
					if (inAttributelet)
					{
						var	sync = inAttributelet.process
							(self.element, self.context, attributeSpec.name, attributeSpec.number, self);
						
						if (sync)
						{
							// the attribute itself was sync
							if (inSync)
							{
								// and getting it was sync
								// then this operation is all sync
								tempAttributeSync = true;
							}
							else
							{
								// getting it was async
								// so the attribute walk in turn goes async
								self.attributeSync = false;
								self.onAttributeWalkComplete ();
							}
						}
						else
						{
							// the attributelet itself was async
							// so the attribute walk in turn goes async
							// and we wait for it to call us back
							self.attributeSync = false;
						}
					}
					else
					{
						// no attribute
						if (inSync)
						{
							tempAttributeSync = true;
						}
						else
						{
							self.attributeSync = false;
							self.onAttributeWalkComplete ();
						}
					}
				}
			);

			// we can go sync->async, but not async->sync
			if (this.attributeSync)
			{
				this.attributeSync = tempAttributeSync;
			}
			
			// if *this particular* attribute call was sync
			// keep going, otherwise break and wait
			if (! tempAttributeSync)
			{
				break;
			}
		}
	}

	if (this.attributeSync)
	{
		// if we're done with attributes and still sync
		// then move on to do the tags
		this.attributeSync = this.runTaglet (true);
	}
	else
	{
		if (this.attributeIndex < this.attributesToCheck.length)
		{
			// wait for the attributelet to call onAttributeWalkComplete()
		}
		else
		{
			// doesn't matter whether the tags are sync or not
			// we still stay async as the attributes were async
			this.runTaglet (false);
		}
	}
	
	return this.attributeSync;
}

positron.RefreshTreeWalker.prototype.onTextNode =
function RefreshTreeWalker_onTextNode (inNode, inContext)
{
	// console.log ("RefreshTreeWalker.onTextNode(" + monohm.String.stripSpaces (inNode.nodeValue) + ")");
	
	var	done = true;
	
	var	expandedText = null;
	
	try
	{
		expandedText = gApplication.expandText (inNode.nodeValue, inContext);
	}
	catch (inError)
	{
		console.error ("error expanding text (" + inNode.nodeValue + ")");
		console.error (inError);
		
		// leave the text alone so the dev can see the problem
		expandedText = inNode.nodeValue;
	}
	
	if (expandedText != inNode.nodeValue)
	{
		/*
		console.log ("caution: subwalk of text nodes removed");

		inNode.nodeValue = expandedText;
		*/

		var	span = document.createElement ("span");
		positron.DOM.addPrefixedClass (span, "span");
		span.innerHTML = expandedText;

		inNode.parentNode.replaceChild (span, inNode);
		
		this.subTreeWalker = this.makeSubTreeWalker (this);
		this.subTreeWalker.startWalkChildren (span, inContext);

		// the subtreewalker will call us back when done
		done = false;
	}
	
	return done;
}

positron.RefreshTreeWalker.prototype.onView =
function RefreshTreeWalker_onView (inView)
{
	if (this.beforeVisible)
	{
		inView.onBeforeVisible ();
	}
}

positron.RefreshTreeWalker.prototype.onWalkComplete =
function RefreshTreeWalker_onWalkComplete (inTreeWalker)
{
	// console.log ("positron.RefreshTreeWalker.onWalkComplete()");
	// console.log (inTreeWalker.rootNode);

	this.subTreeWalker = null;
	
	// this guards against a tag not checking its treewalker has been cancelled
	// prior to calling its completor
	if (this.cancelled)
	{
		return;
	}
	
	if (inTreeWalker)
	{
		var	node = inTreeWalker.rootNode;
		
		if (node)
		{
			if (node.nodeType == node.ELEMENT_NODE)
			{
				if (positron.DOM.hasPrefixedClass (node, "span"))
				{
					positron.DOM.replaceWithChildren (node);
				}
				else
				{
					var	view = positron.DOM.getData (node, "view");
			
					if (view)
					{
						// give the browser a chance to react to DOM changes
						// as onDOMReady() may ask for size, etc
						setTimeout
						(
							function ()
							{
								view.onDOMReady ();
							},
							1
						);
					}
				}
			}
		}
	}
	
	// ok, walk as far as we can, sync
	// if we hit async, wait for completion
	
	var	done = true;
	var	node = null;
	
	if (this.nextNode)
	{
		do
		{
			node = this.nextNode;
			
			if (node)
			{
				this.findNextNode (node);
				done = this.walk (node);
			}
		}
		while (node && done);
	}
	
	if (node)
	{
		// implying that we stopped due to a subwalk
		// wait for onWalkComplete()
	}
	else
	{
		// implying that we stopped due to running out of nodes
		if (this.listener)
		{
			this.listener.onWalkComplete (this);
		}
		else
		{
			console.error ("walk complete with no listener...");
			console.error (this.rootNode);
		}
	}
	
	return done;
}

// PRIVATE

positron.RefreshTreeWalker.prototype.runTaglet =
function RefreshTreeWalker_runTaglet (inSync)
{
	// console.log ("RefreshTreeWalker.runTaglet(" + inSync + ")");
	// console.log (this.element);

	var	done = true;
	
	if (this.element.parentNode)
	{
		var	tagName = this.element.tagName.toLowerCase ();
		
		if (gApplication.config.tags [tagName])
		{
			// if getTagletAsync() completes sync, it will reset "done"
			done = false;
		
			var	self = this;
		
			gApplication.getTagletAsync
			(
				tagName,
				function (inTaglet, inGetTagletSync)
				{
					done = inGetTagletSync;

					if (inTaglet)
					{
						if (inTaglet.checkRequiredAttributes (self.element))
						{
							try
							{
								// the taglet's treewalker will call us back when done
								done = false;

								// note that the taglet is expected to finalise its subtree
								inTaglet.process (self.element, self.context, self);
							}
							catch (inError)
							{
								console.error ("error while running tag <" + tagName + ">");
								console.error (inError.message);
								console.error (inError.stack);
								console.error (self.element);
						
								// can we survive this?
								// we don't know how far the taglet got before crashing
								self.onWalkComplete ();
							}
						}
						else
						{
							console.error ("tag <" + tagName + "> failed its attribute check");

							if (!inGetTagletSync)
							{
								self.onWalkComplete ();
							}
						}
					}
					else
					{
						console.error ("tag <" + tagName + "> does not have associated taglet");
					
						if (!inGetTagletSync)
						{
							self.onWalkComplete ();
						}
					}
				}
			);
		}
		else
		{
			var	subwalked = false;
			
			if (positron.DOM.getPrefixedAttribute (this.element, "view"))
			{
				var	view = positron.DOM.getData (this.element, "view");
	
				if (view && view.isVisible ())
				{
					// give the subclasses a chance
					this.onView (view);
		
					// views have their own context in the chain
					// primarily for <p-set>
					var	newContext = view.context;

					// add the view's initial params to the subwalk context
					for (var key in view.params)
					{
						newContext.put ("params." + key, view.params [key]);
					}
		
					// the subtreewalker will call us back when done
					subwalked = true;
					done = false;
		
					this.subTreeWalker = this.makeSubTreeWalker (this);
					this.subTreeWalker.startWalkChildren (this.element, newContext);
				}
				else
				{
					if (!view)
					{
						console.error ("yikes! view parameter with no view instance!");
						console.error (this.element);
					}
				}
			}
			else
			if (positron.DOM.getPrefixedAttribute (this.element, "localise"))
			{
				// do nothing here, as the localiser replaced the element's innerHTML
			}
			else
			{
				// nothing special about this element
			}

			if (subwalked)
			{
				// something started a subwalker, so let it go
			}
			else
			{
				// ASSUME that if we got a taglet, then done is false
				if (done)
				{
					if (inSync)
					{
						// we're being called sync from within getTagletAsync()
						// so tell our caller to keep walking
					}
					else
					{
						// tag is sync but attributes were async
						// so wrap this walk
						done = false;

						this.onWalkComplete (null);
					}
				}
			}
		}
	}
	else
	{
		// the element got deleted by an attribute
		// use our stashed "outside this element" next-node...
		this.nextNode = this.tempNextNode;
	}

	return done;
}

positron.RefreshTreeWalker.prototype.expandAttributeValues =
function RefreshTreeWalker_expandAttributeValues (inElement, inContext)
{
  if (inElement.attributes && inElement.attributes.length)
  {
    for (var i = 0; i < inElement.attributes.length; i++)
    {
      var attribute = inElement.attributes.item (i);
      
      var expandedValue = gApplication.expandText (attribute.value, inContext);
      
      if (expandedValue != attribute.value)
      {
        attribute.value = expandedValue;
      }
    }
  }
};

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.BeforeVisibleTreeWalker");

/**
 * @constructor
 */
positron.BeforeVisibleTreeWalker = function ()
{
	positron.TreeWalker.call (this);
};
monohm.inherits (positron.BeforeVisibleTreeWalker, positron.TreeWalker);

// TREEWALKER OVERRIDES

positron.BeforeVisibleTreeWalker.prototype.onElement = function (inElement)
{
	var	walkChildren = true;
	
	var	view = positron.DOM.getData (inElement, "view");
	
	if (view)
	{
		// don't pass visibility events to invisible or transitioning views
		// and don't walk into them
		if (view.isVisible () && !view.isTransitioning ())
		{
			view.onBeforeVisible ();
		}
		else
		{
			walkChildren = false;
		}
	}
	
	return walkChildren;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.BeforeInvisibleTreeWalker");

/**
 * @constructor
 */
positron.BeforeInvisibleTreeWalker = function ()
{
	positron.TreeWalker.call (this);
};
monohm.inherits (positron.BeforeInvisibleTreeWalker, positron.TreeWalker);

// TREEWALKER OVERRIDES

positron.BeforeInvisibleTreeWalker.prototype.onElement = function (inElement)
{
	var	walkChildren = true;
	
	var	view = positron.DOM.getData (inElement, "view");
	
	if (view)
	{
		// don't pass visibility events to invisible or transitioning views
		// and don't walk into them
		if (view.isVisible () && !view.isTransitioning ())
		{
			view.onBeforeInvisible ();
		}
		else
		{
			walkChildren = false;
		}
	}
	
	return walkChildren;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.InvisibleTreeWalker");

/**
 * @constructor
 */
positron.InvisibleTreeWalker = function ()
{
	positron.TreeWalker.call (this);
};
monohm.inherits (positron.InvisibleTreeWalker, positron.TreeWalker);

// TREEWALKER OVERRIDES

positron.InvisibleTreeWalker.prototype.onElement = function (inElement)
{
	var	walkChildren = true;
	
	var	view = positron.DOM.getData (inElement, "view");
	
	if (view)
	{
		// don't pass visibility events to invisible or transitioning views
		// and don't walk into them
		if (view.isVisible () && !view.isTransitioning ())
		{
			view.onInvisible ();
		}
		else
		{
			walkChildren = false;
		}
	}
	
	return walkChildren;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("positron.VisibleTreeWalker");

/**
 * @constructor
 */
positron.VisibleTreeWalker = function ()
{
	positron.TreeWalker.call (this);
};
monohm.inherits (positron.VisibleTreeWalker, positron.TreeWalker);

// TREEWALKER OVERRIDES

positron.VisibleTreeWalker.prototype.onElement = function (inElement)
{
	var	walkChildren = true;
	
	var	view = positron.DOM.getData (inElement, "view");
	
	if (view)
	{
		// don't pass visibility events to invisible or transitioning views
		// and don't walk into them
		if (view.isVisible () && !view.isTransitioning ())
		{
			view.onVisible ();
		}
		else
		{
			walkChildren = false;
		}
	}
	
	return walkChildren;
}

/**
*
* @license
* Copyright 2014 Monohm Inc.	 All rights reserved.
*
**/

monohm.provide ("positron.Application");

// MAINLINE

var	gApplication = null;
var	gApplicationPlugins = new Array ();

document.addEventListener
(
	"DOMContentLoaded",
	function ()
	{
		// immediately make <body> invisible
		document.body.style.display = "none";

		// this sets gApplication, pre-callback
		positron.CreateApplication
		(
			function (inError)
			{
				if (inError)
				{
					console.error ("error creating application");
					console.error (inError);
				}
				else
				{
					gApplication.start ();
				}
			}
		);
	},
	false
);

// STATIC METHODS

positron.CreateApplication = 
function positron_CreateApplication (inCallback)
{
	// see if application.js was loaded via a script tag
	if (typeof (Application) == "function")
	{
		try
		{
			gApplication = new Application (inCallback);
		}
		catch (inError)
		{
			error = inError;
			gApplication = null;
		}
	}
	else
	{
		// see if there is an application.js waiting for us
		positron.DOM.addScript
		(
			"application.js",
			function (inSuccess)
			{
				if (inSuccess)
				{
					if (typeof (Application) == "function")
					{
						var	error = null;
			
						try
						{
							gApplication = new Application (inCallback);
				
							// ensure we have the correct type
							if (typeof (gApplication.start) != "function")
							{
								gApplication = null;
							}
						}
						catch (inError)
						{
							error = inError;
							gApplication = null;
						}
		
						// only moan if we found an Application class
						// that wasn't suitable
						if (!gApplication)
						{
							console.error ("unable to instantiate Application class");
				
							if (error)
							{
								console.error (error.message);
							}
				
							console.error ("please ensure that Application inherits from positron.Application");
							console.error ("and that Application() calls positron.Application.call(this)");
						}
					}
				}
				
				if (!gApplication)
				{
					gApplication = new positron.Application (inCallback);
				}
			}
		);
	}
}

// CONSTRUCTOR

positron.Application = 
function positron_Application (inCallback)
{
	// so that code inside the constructor can reference the global
	gApplication = this;
	
	var	self = this;
	
	this.loadConfig
	(
		"positron/positron.json",
		function (inError)
		{
			if (inError)
			{
				console.error ("error loading config " + inError);
				inCallback (inError);
			}
			else
			{
				// plugins may also merge config into self.config
				self.installPlugins
				(
					function ()
					{
						// note load application.json LAST so it can override anything
						self.loadConfig
						(
							"application.json",
							function (inError)
							{
								if (inError)
								{
									console.error ("error loading application.json");
									console.error (inError);
								}

								// now we have config, make body invisible the proper way
								// this ensures that showWindow() can use the regular view.show()
								document.body.style.display = "";
								positron.DOM.addPrefixedClass (document.body, "invisible");

								self.pages = new Object ();
								self.cache = new positron.Cache ();
	
								self.params = new Object ();

								self.context = gApplication.makeContext ();
								self.context.put ("config", self.config);
	
								self.audioContexts = new Object ();
								self.audioSources = new Object ();
								self.sounds = new Object ();
								self.webSockets = new Object ();
	
								self.setupRequest ();
								self.setupLogging ();
								self.setupBrowserFlags ();
								self.setupDisplayClass ();
								self.setupAnalytics ();
								self.setupWindow ();
	
								window.addEventListener
								(
									"hashchange",
									function (inEvent)
									{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("hashchange event fires!");
if (gApplication.isLogging (gApplication.kLogApplication)) console.log (document.location.hash);

										self.setPageFromHash ();

										inEvent.preventDefault ();
										inEvent.stopPropagation ();
									},
									false
								);

								if (self.config.localisation.enabled)
								{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("localisation enabled");

									self.loadLocalisationStrings
									(
										function ()
										{
											if (inCallback)
											{
												inCallback ();
											}
											else
											{
												console.error ("positron.Application constructed with no callback function");
											}
										}
									);
								}
								else
								{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("localisation disabled");

									if (inCallback)
									{
										inCallback ();
									}
									else
									{
										console.error ("positron.Application constructed with no callback function");
									}
								}
							}
						);
					}
				);
			}
		}
	);

}

// CONFIG ACCESSORS

positron.Application.prototype.getAttributePrefix = 
function Application_getAttributePrefix ()
{
	return this.config.attributePrefix;
}

positron.Application.prototype.getCSSClassPrefix = 
function Application_getCSSClassPrefix ()
{
	return this.config.cssClassPrefix;
}

positron.Application.prototype.getEventPrefix = 
function Application_getEventPrefix ()
{
	return this.config.eventPrefix;
}

positron.Application.prototype.getTagPrefix = 
function Application_getTagPrefix ()
{
	return this.config.tagPrefix;
}

positron.Application.prototype.getURLParameterPrefix = 
function Application_getURLParameterPrefix ()
{
	return this.config.urlParameterPrefix;
}

positron.Application.prototype.getPageCSSPath = 
function Application_getPageCSSPath (inPageKey)
{
	return this.config.pageCSSPath.split ("$page;").join (inPageKey);
}

positron.Application.prototype.getPageHTMLPath = 
function Application_getPageHTMLPath (inPageKey)
{
	return this.config.pageHTMLPath.split ("$page;").join (inPageKey);
}

positron.Application.prototype.getPageJSPath = 
function Application_getPageJSPath (inPageKey)
{
	return this.config.pageJSPath.split ("$page;").join (inPageKey);
}

positron.Application.prototype.getViewCSSPath = 
function Application_getViewCSSPath (inViewKey)
{
	return this.config.viewCSSPath.split ("$view;").join (inViewKey);
}

positron.Application.prototype.getViewHTMLPath = 
function Application_getViewHTMLPath (inViewKey)
{
	return this.config.viewHTMLPath.split ("$view;").join (inViewKey);
}

positron.Application.prototype.getViewJSPath = 
function Application_getViewJSPath (inViewKey)
{
	return this.config.viewJSPath.split ("$view;").join (inViewKey);
}

positron.Application.prototype.getActionletAsync = 
function Application_getActionletAsync (inActionName, inCallback)
{
	return this.getCodeletAsync (inActionName, null, this.config.actions, "Action", "actions", inCallback);
}

positron.Application.prototype.getAttributeletAsync = 
function Application_getAttributeletAsync (inAttributeName, inCallback)
{
	return this.getCodeletAsync (inAttributeName, this.getAttributePrefix (), this.config.attributes, "Attribute", "attributes", inCallback);
}

positron.Application.prototype.getCodeletAsync = 
function Application_getCodeletAsync (inName, inPrefix, inConfigDomain, inClassSuffix, inDirectoryName, inCallback)
{
	// if a codelet is mapped in config, that name wins
	var	codeletClassName = inConfigDomain [inName];
	
	/*
	disabling class name inferral
	until we fix some issues - like how to infer package names etc
	do we default to positron.directoryname or pass yet another parameter for package subclass? yuck
	if (codeletClassName == null || codeletClassName.length == 0)
	{
		// try to infer a class name
		var	name = inName;
		
		if (inPrefix)
		{
			if (monohm.String.startsWith (name, inPrefix))
			{
				name = name.substr (0, inPrefix.length);

				// true here means capitalise the first character
				codeletClassName = monohm.String.hyphenToCamel (name, true);
		
				if (inClassSuffix)
				{
					name += inClassSuffix;
				}
			}
			else
			{
				// prefix specified but name didn't match == no dice
				// eg, we don't try to async-load a taglet for "class"
				// unless someone actually maps it
			}
		}
		else
		{
			// true here means capitalise the first character
			codeletClassName = monohm.String.hyphenToCamel (name, true);
	
			if (inClassSuffix)
			{
				name += inClassSuffix;
			}
		}
	}
	*/
	
	if (codeletClassName && codeletClassName.length)
	{
		codelet = monohm.Object.instantiate (codeletClassName);

		if (codelet)
		{
			inCallback (codelet, true);
		}
		else
		{
			positron.Util.loadCodeletAsync
			(
				codeletClassName,
				inDirectoryName,
				function (inSuccess)
				{
					var	codelet = null;
					
					if (inSuccess)
					{
						codelet = monohm.Object.instantiate (codeletClassName);
					}
					else
					{
						console.error ("cannot instantiate codelet (" + inName + ") from " + inDirectoryName);
					}

					inCallback (codelet, false);
				}
			);
		}
	}
	else
	{
		inCallback (null, true);
	}
}

positron.Application.prototype.getTagletAsync = 
function Application_getTagletAsync (inTagName, inCallback)
{
	this.getCodeletAsync
	(
		inTagName,
		this.getTagPrefix (),
		this.config.tags,
		"Tag",
		"tags",
		function (inTaglet, inSync)
		{
			if (inTaglet == null && inTagName.indexOf ("-") > 0)
			{
				// a little squawk if we can't find a taglet for a prefixed tag name
				if (gApplication.isLogging (gApplication.kLogApplication))
				{
					console.error ("Application.getTaglet() can't find taglet for tag (" + inTagName + ")");
				}
			}
			
			inCallback (inTaglet, inSync);
		}
	);
}

positron.Application.prototype.getTriggerletAsync = 
function Application_getTriggerletAsync (inTriggerName, inCallback)
{
	this.getCodeletAsync (inTriggerName, null, this.config.triggers, "Trigger", "triggers", inCallback);
}

positron.Application.prototype.getViewletAsync = 
function Application_getViewletAsync (inViewName, inCallback)
{
	var	sync = true;
	
	var	view = null;
	var	error = null;
	
	// try the view name mapping first
	var	viewClassName = this.config.views [inViewName];
	
	if (viewClassName && viewClassName.length)
	{
		// if there is a view class name mapping, it must be the name of an immediately accessible class
		view = monohm.Object.instantiate (viewClassName);
	}
	
	if (view == null)
	{
		// try the raw value from the attribute first
		// so we can support com.company.ComponentName
		// but ideally you'd map those in the config
		view = monohm.Object.instantiate (inViewName);

		if (view == null)
		{
			var	viewClassName = monohm.String.hyphenToCamel (inViewName, true) + "View";
			
			view = monohm.Object.instantiate (viewClassName);

			if (view == null)
			{
				sync = false;
				
				positron.DOM.addScript
				(
					gApplication.getViewJSPath (inViewName),
					function (inSuccess)
					{
						if (inSuccess)
						{
							view = monohm.Object.instantiate (viewClassName);
						}
						
						inCallback (view, false);
					}
				);
			}
		}
	}
	
	if (sync)
	{
		if (view == null)
		{
			console.error ("cannot instantiate view (" + inViewName + ")");
		}

		inCallback (view, true);
	}
}

// PUBLIC API

positron.Application.prototype.addMIDIListener = 
function Application_addMIDIListener (inPortID, inListener)
{
	if (this.midiAccess)
	{
		var	port = this.midiAccess.inputs.get (inPortID);
		
		if (port)
		{
			var	listeners = null;
			
			if (this.midiListeners)
			{
				listeners = this.midiListeners [inPortID];
			}
			else
			{
				this.midiListeners = new Object ();
			}
			
			if (!listeners)
			{
				listeners = new Array ();
				this.midiListeners [inPortID] = listeners;
			}
			
			listeners.push (inListener);
		}
		else
		{
			console.error ("Application.addMIDIListener() with bad port ID: " + inPortID);
		}
	}
	else
	{
		console.error ("Application.addMIDIListener() with no MIDI access");
	}
}

// this takes the result of decodeAudioData()
positron.Application.prototype.addSound = 
function Application_addSound (inName, inSound)
{
	// console.log ("adding sound: " + inName);
	
	this.sounds [inName] = inSound;
}

positron.Application.prototype.addWebSocket = 
function Application_addWebSocket (inName, inWebSocket)
{
	// console.log ("adding web socket: " + inName);
	
	this.removeWebSocket (inName);
	this.webSockets [inName] = inWebSocket;
}

positron.Application.prototype.getAudioContext = 
function Application_getAudioContext (inName)
{
	if (inName == null || inName.length == 0)
	{
		inName = "default";
	}

	var	context = this.audioContexts [inName];
	
	if (!context)
	{
		if (window.AudioContext)
		{
			context = new AudioContext ();
		}
		else
		if (window.webkitAudioContext)
		{
			context = new webkitAudioContext ();
		}
		else
		{
			throw new Error ("cannot find AudioContext class");
		}
		
		this.audioContexts [inName] = context;
	}
	
	return context;
}

positron.Application.prototype.getAudioSource = 
function Application_getAudioSource (inName)
{
	var	source = this.audioSources [inName];
	
	if (!source)
	{
		console.error ("can't get source (" + inName + ")");
	}
	
	return source;
}

positron.Application.prototype.getSound = 
function Application_getSound (inName)
{
	var	sound = this.sounds [inName];
	
	if (!sound)
	{
		console.error ("can't get sound (" + inName + ")");
	}
	
	return sound;
}

positron.Application.prototype.setAudioSource = 
function Application_setAudioSource (inName, inSource)
{
	this.audioSources [inName] = inSource;
}

positron.Application.prototype.getWebSocket = 
function Application_getWebSocket (inName)
{
	return this.webSockets [inName];
}

positron.Application.prototype.readWebSocket = 
function Application_readWebSocket (inName, inCallback)
{
}

positron.Application.prototype.removeWebSocket = 
function Application_removeWebSocket (inName)
{
	var	webSocket = this.webSockets [inName];
	
	if (webSocket)
	{
		// console.log ("removing web socket: " + inName);
	
		// if it's connecting or open, close it
		if (webSocket.readyState == 0 || webSocket.readyState == 1)
		{
			try
			{
				// console.log ("closing web socket: " + inName);
				webSocket.close ();
			}
			catch (inError)
			{
			}
		}
		
		delete this.webSockets [inName];
	}
	else
	{
		// this will happen all the time
		// as a result of the call from add() above
		// so don't log this
	}
}

positron.Application.prototype.fireAction = 
function Application_fireAction (inActionString, inActionParams)
{
	return positron.ActionFactory.fireAction (inActionString, inActionParams);
}

positron.Application.prototype.fireAnalyticsEvent = 
function Application_fireAnalyticsEvent (inEvent)
{
	if (this.analytics)
	{
		this.analytics.fire (inEvent);
	}
}

positron.Application.prototype.getConfigEntry = 
function Application_getConfigEntry (inConfigKey, inComplain)
{
	var	value = monohm.Config.getEntry ("positron", inConfigKey);
	
	if (value == null)
	{
		if (typeof (inComplain) == "undefined" || inComplain)
		{
			console.error ("cannot find config item (" + inConfigKey + ")");
		}
	}
	
	return value;
}

positron.Application.prototype.getConfigEntryWithDefault = 
function Application_getConfigEntryWithDefault (inConfigKey, inDefaultValue)
{
	var	value = this.getConfigEntry (inConfigKey, false);
	
	if (typeof (value) == "undefined")
	{
		value = inDefaultValue;
	}
	
	return value;
}

// expand context references in text
// Positron syntax is $something.or.other;
// optionally escaping it (for the purposes of parameters in attributes, etc)
positron.Application.prototype.expandText = 
function Application_expandText (inText, inContext)
{
	var	inEntity = false;
	var	result = "";
	var	textBuffer = "";

	for (var i = 0; i < inText.length; i++)
	{
		var	ch = inText.charAt (i);

		if (ch == '$')
		{
			if (inEntity)
			{
				textBuffer = '$' + textBuffer;
			}
			else
			{
				inEntity = true;
			}
			
			result += textBuffer;
			textBuffer = "";
		}
		else
		if (ch == ';')
		{
			if (inEntity)
			{
				if (textBuffer.length > 0)
				{
					var	value = this.getContextReference (textBuffer, inContext);

					if (typeof (value) == "undefined" || value == null)
					{
						// add nothing to the buffer
						// note here that typeof (null) == "object"
						// therefore this check has to be here
					}
					else
					{
						if (typeof (value) == "string")
						{
							// don't escape anything! use keys if having issues
							result += value;
						}
						else
						if (typeof (value) == "number")
						{
							result += "" + value;
						}
						else
						if (typeof (value) == "boolean")
						{
							result += value;
						}
						else
						if (Array.isArray (value))
						{
							// anything but ""
							// as the existence needs to fail against "" in <ifnot>
							result += "ARRAY";
						}
						else
						if (typeof (value) == "object")
						{
							// anything but ""
							// as the existence needs to fail against "" in <ifnot>
							result += "OBJECT";
						}
					}
					
					textBuffer = "";
				}
				
				inEntity = false;
			}
			else
			{
				textBuffer += ch;
			}
		}
		else
		if (ch >= 'A' && ch <= 'Z')
		{
			textBuffer += ch;
		}
		else
		if (ch >= 'a' && ch <= 'z')
		{
			textBuffer += ch;
		}
		else
		if (ch >= '0' && ch <= '9')
		{
			textBuffer += ch;
		}
		else
		if (ch == '_' || ch == '.' || ch == ':' || ch == '-' || ch == '#')
		{
			textBuffer += ch;
		}
		else
		{
			textBuffer += ch;
			
			// illegal character for variable reference
			if (inEntity)
			{
				textBuffer = '$' + textBuffer;
				
				inEntity = false;
			}
		}
	}
	
	if (textBuffer.length > 0)
	{
		if (inEntity)
		{
			result += '$';
		}
		
		result += textBuffer;
	}

	return result;
}

positron.Application.prototype.getMIDIInputs = 
function Application_getMIDIInputs ()
{
	var	inputs = new Array ();
	
	if (this.midiAccess)
	{
		this.midiAccess.inputs.forEach
		(
			function (inPort)
			{
				var	port = 
				{
					id: inPort.id,
					name: inPort.name
				};
				
				inputs.push (port);
			}
		);
	}
	
	return inputs;
}

positron.Application.prototype.getMIDIOutputs = 
function Application_getMIDIOutputs ()
{
	var	outputs = new Array ();
	
	if (this.midiAccess)
	{
		this.midiAccess.outputs.forEach
		(
			function (inPort)
			{
				var	port = 
				{
					id: inPort.id,
					name: inPort.name
				};
				
				outputs.push (port);
			}
		);
	}
	
	return outputs;
}

// inContextKey: complex key, eg this.that.the.other
// inContext: current context
// return: resolved value, or null
positron.Application.prototype.getContextReference = 
function Application_getContextReference (inContextKey, inContext)
{
// console.log ("TreeWalker.getContextReference() on " + inContextKey);
	
	var	value = null;

	var	validContextIndex = 0;
	var	validContextKey = null;
	var	validContextObject = null;
	
	var	expressionElements = inContextKey.split ('.');

	var	contextKey = "";
	
	for (var i = 0; i < expressionElements.length; i++)
	{
		if (contextKey.length > 0)
		{
			contextKey += '.';
		}
		
		contextKey += expressionElements [i];

		var	contextObject = inContext.get (contextKey);

		// do NOT use if (contextObject) here
		// as it will fail if it's the number zero!
		if (typeof (contextObject) != "undefined")
		{
			validContextObject = contextObject;
			validContextKey = contextKey;
			validContextIndex = i;
		}
	}

	if (validContextKey)
	{
		value = validContextObject;
		
		// remember to update validContextObject
		// so we have the correct object off which to call any functions found
		for (var i = validContextIndex + 1;
			i < expressionElements.length;
			i++, validContextObject = value)
		{
			// careful here, we could be walking a wrapped native object
			// that doesn't like requests for unknown properties
			try
			{
				value = value [expressionElements [i]];
			}
			catch (inError)
			{
				console.error ("error fetching expression element " + expressionElements [i]);
				console.error ("context key is " + inContextKey);
				
				value = null;
				break;
			}
			
			if (typeof (value) == "undefined" || value == null)
			{
				// bzzzt
				break;
			}

			if (typeof (value) == "function")
			{
				value = value.call (validContextObject);
			}
			else
			{
				// keep going
			}
		}
	}
	
	return value;
};

positron.Application.prototype.makeContext = 
function Application_makeContext (inParentContext)
{
	return new positron.DelegateHashMap (inParentContext);
}

// PUBLIC METHODS

positron.Application.prototype.isLogging = 
function Application_isLogging (inMask)
{
	return (this.logMask & inMask) ? true : false;
};

positron.Application.prototype.start = 
function Application_start ()
{
	if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.start()");
	
	this.showWindow ();
}

// PAGE API

positron.Application.prototype.getPage = 
function Application_getPage (inPageKey)
{
	var	page = this.page;
	
	if (inPageKey)
	{
		page = this.pages [inPageKey];
	}
	
	return page;
}

positron.Application.prototype.setPage = 
function Application_setPage (inPageKey, inParams, inTransitionInClass, inTransitionOutClass)
{
	if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.setPage(" + inPageKey + ")");

  var setHash = true;
	var	newHash = null;
	
	if (this.page)
	{
		// ok, so if we set the hash to the same as it was before, we won't get a hashchange event
		// so see whether the hash is the same...
		var	currentHash = this.page.key + "," + positron.Util.unparseParams (this.page.params);
		newHash = inPageKey + "," + positron.Util.unparseParams (inParams);
		
		// HACK is the decasing necessary?
		// not sure whether the browser will do a case insensitive compare for hashchange firing purposes
		if (currentHash.toLowerCase () == newHash.toLowerCase ())
		{
			setHash = false;
		}
	}
	
  if (setHash)
	{
		this.pageTransitionInClass = inTransitionInClass;
		this.pageTransitionOutClass = inTransitionOutClass;
		
		// causes hashchange event to fire and setPageInternal() to be called
		document.location.hash = newHash;
	}
	else
  {
  	// refresh on the current page
  	// the hash won't change, so we won't get the event
  	// so bypass the hashchange mechanism
  	this.setPageInternal (inPageKey, inParams, inTransitionInClass, inTransitionOutClass);
  }
	
  return true;
}

// VIEW API

positron.Application.prototype.getView = 
function Application_getView (inViewKey)
{
	var	view = this.page.getView (inViewKey);
	
	if (!view && (this.page != this.window))
	{
		view = this.window.getView (inViewKey);
	}
	
	return view;
}

positron.Application.prototype.hideView = 
function Application_hideView (inViewKey, inTransitionOutClass)
{
	// console.log ("Application.hideView(" + inViewKey + ")");

	var	view = this.getView (inViewKey);
	
	if (view)
	{
		view.hide (inTransitionOutClass);
	}
	else
	{
		console.error ("view (" + inViewKey + ") not found");
	}
}

positron.Application.prototype.refreshView = 
function Application_refreshView (inViewKey, inParams, inTransitionInClass)
{
	// console.log ("Application.refreshView(" + inViewKey + ")");

	var	view = this.getView (inViewKey);
	
	if (view)
	{
		view.setParams (inParams);
		view.refresh (inTransitionInClass);
	}
	else
	{
		console.error ("view (" + inViewKey + ") not found");
	}
}

positron.Application.prototype.removeMIDIListener = 
function Application_removeMIDIListener (inPortID, inListener)
{
	if (this.midiAccess)
	{
		var	port = this.midiAccess.inputs.get (inPortID);
		
		if (port)
		{
			var	listeners = null;
			
			if (this.midiListeners)
			{
				listeners = this.midiListeners [inPortID];
			}
			
			if (listeners)
			{
				var	index = listeners.indexOf (inListener);
			
				if (index >= 0)
				{
					listeners.splice (index, 1);
				}
			}
			else
			{
				console.error ("Application.removeMIDIListener() on port with no listeners");
			}
		}
		else
		{
			console.error ("Application.removeMIDIListener() with bad port ID: " + inPortID);
		}
	}
	else
	{
		console.error ("Application.removeMIDIListener() with no MIDI access");
	}
}

positron.Application.prototype.requestMIDI = 
function Application_requestMIDI (inCallback)
{
	if (typeof navigator.requestMIDIAccess == "function")
	{
		var	self = this;
		
		try
		{
			// first try, request sysex
			navigator.requestMIDIAccess
			({
				sysex: true
			}).then
			(
				function (inAccess)
				{
					self.setupMIDI (inAccess);
					inCallback (true);
				},
				function (inErrorMessage)
				{
					console.error ("requestMIDIAccess() failed");
					console.error (inErrorMessage);
					inCallback (false);
				}
			);
		}
		catch (inError)
		{
			console.error (inError);

			try
			{
				// second try, don't request sysex
				navigator.requestMIDIAccess ().then
				(
					function (inAccess)
					{
						self.midiAccess = inAccess;
						self.setupMIDI (inAccess);
						inCallback (true);
					}
				);
			}
			catch (inError2)
			{
				console.error (inError2);
			}
		}
	}
	else
	{
		inCallback (false);
	}
}

positron.Application.prototype.runView = 
function Application_runView (inViewKey, inParams)
{
	// console.log ("Application.runView(" + inViewKey + ")");

	var	view = this.getView (inViewKey);
	
	if (view)
	{
		view.setParams (inParams);
		view.run ();
	}
	else
	{
		console.error ("view (" + inViewKey + ") not found");
	}
}

// inData can be array<number>
// or Uint8Array
positron.Application.prototype.sendMIDI = 
function Application_sendMIDI (inPortID, inData)
{
	if (this.midiAccess)
	{
		var	port = this.midiAccess.outputs.get (inPortID);
		
		if (port)
		{
			port.send (inData);
		}
		else
		{
			console.error ("Application.sendMIDI() with bad port ID: " + inPortID);
		}
	}
	else
	{
		console.error ("Application.sendMIDI() with no MIDI access");
	}
}

positron.Application.prototype.showView = 
function Application_showView (inViewKey, inParams, inTransitionInClass)
{
	// console.log ("Application.showView(" + inViewKey + ")");

	var	view = this.getView (inViewKey);
	
	if (view)
	{
		view.setParams (inParams);
		view.show (inTransitionInClass);
	}
	else
	{
		console.error ("view (" + inViewKey + ") not found");
	}
}

positron.Application.prototype.toggleView =
function Application_toggleView (inViewKey, inParams, inTransitionInClass, inTransitionOutClass)
{
	// console.log ("Application.toggleView(" + inViewKey + ")");

	var	view = this.getView (inViewKey);
	
	if (view)
	{
		if (view.isVisible ())
		{
			view.hide (inTransitionOutClass);
		}
		else
		{
			view.setParams (inParams);
			view.show (inTransitionInClass);
		}
	}
	else
	{
		console.error ("view (" + inViewKey + ") not found");
	}
}

// CALLBACKS

positron.Application.prototype.onApplicationStartupComplete = 
function Application_onApplicationStartupComplete (inLoader)
{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.onApplicationStartupComplete()");
}

positron.Application.prototype.onLoadStart = 
function Application_onLoadStart (inLoader)
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Application.onLoadStart()");
}

positron.Application.prototype.onLoadFinish = 
function Application_onLoadFinish (inLoader)
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Application.onLoadFinish()");
}

positron.Application.prototype.onLoadProgress = 
function Application_onLoadProgress (inLoader)
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Application.onLoadProgress()");
}

positron.Application.prototype.onPageVisible = 
function Application_onPageVisible (inPageKey)
{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.onPageVisible(" + inPageKey + ")");
	
	if (this.loadingInitialPage)
	{
		this.loadingInitialPage = false;
		this.onApplicationStartupComplete ();
	}
	else
	if (inPageKey == "window")
	{
		this.onWindowVisible ();
	}
}

// the walk of the root page completes here
// ASSUME we only walk the root page once
positron.Application.prototype.onWalkComplete = 
function Application_onWalkComplete (inTreeWalker)
{
	// console.log ("Application.onWalkComplete()");

	positron.DOM.removePrefixedClass (this.window.element, "invisible");
	
	var	self = this;
	
	setTimeout
	(
		function ()
		{
			// console.log ("Application.onWalkComplete() calling window.onDOMReady()");
			
			self.window.onDOMReady ();
		},
		1
	);
}

positron.Application.prototype.onBeforeInitialPageVisible = 
function Application_onBeforeInitialPageVisible ()
{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.onBeforeInitialPageVisible()");
}

positron.Application.prototype.onInitialPageVisible = 
function Application_onInitialPageVisible ()
{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.onInitialPageVisible()");
}

positron.Application.prototype.onBeforeWindowVisible = 
function Application_onBeforeWindowVisible ()
{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.onBeforeWindowVisible()");
}

// caution MUST call superclass from overrides
positron.Application.prototype.onWindowVisible = 
function Application_onWindowVisible ()
{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.onWindowVisible()");

	this.preloadAssets ();
	this.setInitialPage ();
}

// PRIVATE METHODS

positron.Application.prototype.getPageSpecFromHash = 
function Application_getPageSpecFromHash ()
{
	var	pageSpec = new Object ();
	
  if (document.location.hash && document.location.hash.length)
  {
    var hash = document.location.hash;
    
    // seems like "hash" comes complete with a... hash, sigh
    if (hash.charAt (0) == '#')
    {
      hash = hash.substring (1);
    }
    
    var hashElements = hash.split (",");

    if (hashElements.length > 0 && hashElements [0].length > 0)
    {
      pageSpec.key = hashElements [0];
      
      if (hashElements.length > 1)
      {
        pageSpec.params = positron.Util.parseParams (unescape (hashElements [1]));
      }
    }
  }
  
  return pageSpec;
}

// called from the hashchange event handler
positron.Application.prototype.setInitialPage = 
function Application_setInitialPage ()
{
	// console.log ("Application.setInitialPage()");
	
  var pageSpec = this.getPageSpecFromHash ();
  
  var body = document.querySelector ("body");
  
  if (!pageSpec.key || !pageSpec.key.length)
  {
   	pageSpec.key = positron.DOM.getPrefixedAttribute (body, "start-page");
    
    if (pageSpec.key && pageSpec.key.length)
    {
      if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("found start page of " + pageSpec.key);
    }
  }

  var setPageDelay = positron.DOM.getPrefixedAttribute (body, "start-page-delay");
  
  if (setPageDelay && setPageDelay.length)
  {
    if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("found start page delay of " + setPageDelay);

    setPageDelay = parseInt (setPageDelay);
    
    if (setPageDelay <= 0 || isNaN (setPageDelay))
    {
      setPageDelay = 1;
    }
  }
  else
  {
    setPageDelay = 1;
  }
  
  // if there's still no page key, don't set a page
  if (pageSpec.key && pageSpec.key.length)
  {
    // for callbacks
    var self = this;
    
    setTimeout
    (
			function ()
      {
      	self.loadingInitialPage = true;
      	
        self.setPageInternal (pageSpec.key, pageSpec.params,
          self.pageTransitionOutClass, self.pageTransitionInClass);

        self.pageTransitionOutClass = undefined;
        self.pageTransitionInClass = undefined;
      },
      setPageDelay
    );
  }
  else
  {
  	this.onApplicationStartupComplete ();
  }
}

positron.Application.prototype.setPageFromHash = 
function Application_setPageFromHash ()
{
  var pageSpec = this.getPageSpecFromHash ();

  if (pageSpec.key && pageSpec.key.length)
  {
		this.setPageInternal (pageSpec.key, pageSpec.params,
			this.pageTransitionInClass, this.pageTransitionOutClass);

		this.pageTransitionOutClass = undefined;
		this.pageTransitionInClass = undefined;
	}
	else
	{
		console.error ("Application.setPageFromHash(): no page key found");
	}
}

positron.Application.prototype.setPageInternal =
function Application_setPageInternal (inPageKey, inParams, inTransitionInClass, inTransitionOutClass)
{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.setPageInternal(" + inPageKey + ")");

	var newPage = this.pages [inPageKey];
	
	if (newPage)
	{
		this.setPageInternal2 (newPage, inParams, inTransitionInClass, inTransitionOutClass);
	}
	else
	{
		var	self = this;
		
		this.loadPage
		(
			inPageKey,
			function (inPage)
			{
				if (inPage)
				{
					self.pages [inPageKey] = inPage;
					self.setPageInternal2 (inPage, inParams, inTransitionInClass, inTransitionOutClass);
				}
				else
				{
					console.error ("could not load page (" + inPageKey + ")");

					if (self.loadingInitialPage)
					{
						self.loadingInitialPage = false;
						self.onApplicationStartupComplete ();
					}
				}
			}
		);
	}
}

// this async virus is really getting on my tits
positron.Application.prototype.setPageInternal2 =
function Application_setPageInternal2 (inPage, inParams, inTransitionInClass, inTransitionOutClass)
{
	if (inPage.key == this.page.key)
	{
		if (this.page != this.window)
		{
			this.page.setParams (inParams);
			this.page.refresh ();
		}
	}
	else
	{
		if (this.page != this.window)
		{
			this.page.hide (inTransitionOutClass);
		}
	
		if (this.loadingInitialPage)
		{
			this.onBeforeInitialPageVisible ();
		}
	
		this.page = inPage;
		this.page.setParams (inParams);
		this.page.refresh (inTransitionInClass);
	}
}

// ALWAYS go through here to set params
// as it updates context, too
positron.Application.prototype.setParams =  
function Application_setParams (inParams)
{
	for (var key in inParams)
	{
		this.setParam (key, inParams [key]);
	}
}

// ALWAYS go through here to set individual params
// as it updates context, too
positron.Application.prototype.setParam = 
function Application_setParam (inKey, inValue)
{
	this.params [inKey] = inValue;
	this.context.put ("params." + inKey, inValue);
}

// showing the root page is different
// as obviously we can't hide the template markup in the same way...
// and arguably this should only be done once
positron.Application.prototype.showWindow = 
function Application_showWindow ()
{
	this.onBeforeWindowVisible ();
	this.window.show ();
}

// PRIVATE?

positron.Application.prototype.installPlugins = 
function Application_installPlugins (inCallback)
{
	if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.installPlugins() has " + gApplicationPlugins.length + " plugins to run");
	
	new monohm.AsyncListHelper
	(
		{
			this: this,
			list: gApplicationPlugins,
			iterate: function (inHelper, inItem)
			{
				try
				{
					inItem.install
					(
						function ()
						{
							inHelper.onIteration ();
						}
					);
				}
				catch (inError)
				{
					console.error (inError);
					inHelper.onIteration ();
				}
			},
			complete: function ()
			{
				inCallback ();
			}
		}
	);
}

positron.Application.prototype.loadConfig = 
function Application_loadConfig (inPath, inCallback)
{
	if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.loadConfig(" + inPath + ")");

	if (!this.config)
	{
		this.config = new Object ();
	
		// ensure we have a few basics
	
		this.config.actions = new Object ();
		this.config.attributes = new Object ();
		this.config.events = new Object ();
		this.config.tags = new Object ();
		this.config.triggers = new Object ();
		this.config.views = new Object ();

		monohm.Config.setDomain ("positron", this.config);
	}
	
	monohm.Config.load 
	(
		"positron",
		inPath,
		function (inError, inConfig)
		{
			// this.config remains our pointer into the Monohm config space
			inCallback (inError);
		}
	);
}

positron.Application.prototype.loadLocalisationStrings = 
function Application_loadLocalisationStrings (inCallback)
{
	if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.loadLocalisationStrings()");

	var	strings = null;
	var	language = this.browser.language;
	
	if (language && language.length)
	{
		monohm.Network.getJSONAsync
		(
			"localisation/strings-" + language + ".json",
			function (inError, inStrings)
			{
				if (inStrings)
				{
					gApplication.context.put ("strings", strings);
					inCallback ();
				}
				else
				{
					monohm.Network.getJSONAsync
					(
						"localisation/strings.json",
						function (inError, inStrings)
						{
							if (inStrings)
							{
								gApplication.context.put ("strings", inStrings);
							}
							
							inCallback ();
						}
					);
				}
			}
		);
	}
	else
	{
		monohm.Network.getJSONAsync
		(
			"localisation/strings.json",
			function (inError, inStrings)
			{
				if (inStrings)
				{
					gApplication.context.put ("strings", inStrings);
				}
				
				inCallback ();
			}
		);
	}
}

positron.Application.prototype.loadPage = 
function Application_loadPage (inPageKey, inCallback)
{
	if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("Application.loadPage(" + inPageKey + ")");
	
	// ensure we have a page container
	var pageContainerID = gApplication.getCSSClassPrefix () + "page-container";
	var pageContainer = document.querySelector ("#" + pageContainerID);
	
	if (!pageContainer)
	{
		pageContainer = document.createElement ("div");
		pageContainer.setAttribute ("id", pageContainerID);
		document.querySelector ("body").appendChild (pageContainer);
	}
	
	var tempElement = document.createElement ("div");
	
	// do we already have this style?
	var pageCSSAttribute = gApplication.getAttributePrefix () + "page";
	
	var	pageCSSInclude = document.querySelector ("head [" + pageCSSAttribute + "=" + inPageKey + "]");
	
	if (!pageCSSInclude)
	{
		// this will check for duplicates
		positron.DOM.addStyleSheet (gApplication.getPageCSSPath (inPageKey), inPageKey, true);
	}

	var	self = this;
	
	monohm.Network.getTextAsync
	(
		gApplication.getPageHTMLPath (inPageKey),
		function (inError, inHTML)
		{
			if (inHTML)
			{
				tempElement.innerHTML = inHTML;
			}
			
			self.loadPageJs
			(
				inPageKey,
				function (inPage)
				{
					// find the page element
					var pageElement = null;
					var pageKeyAttributeName = gApplication.getAttributePrefix () + "page";
	
					if (tempElement.hasChildNodes)
					{
						for (var child = tempElement.firstChild;
							child != null && child.nodeType == child.ELEMENT_NODE;
							child = child.nextSibling)
						{
							var pageKey = positron.DOM.getPrefixedAttribute (child, "page");
			
							if (pageKey && pageKey.length)
							{
								pageElement = child;
								break;
							}
						}
					}
	
					if (pageElement)
					{
						inPage.configure (inPageKey, pageElement);
		
						var	pageParamsAttribute = positron.DOM.getPrefixedAttribute (pageElement, "page-params");
		
						if (pageParamsAttribute && pageParamsAttribute.length)
						{
							inPage.setParams (positron.Util.parseParams (pageParamsAttribute));
						}
		
						positron.DOM.setData (pageElement, "page", inPage);
						positron.DOM.setData (pageElement, "view", inPage);
		
						positron.DOM.addPrefixedClass (pageElement, "invisible");
						pageContainer.appendChild (pageElement);
	
						inPage.onLoaded ();
					}
					else
					{
						console.error ("no page element for page (" + inPageKey + ")");
						inPage = null;
					}
	
					inCallback (inPage);
				}
			);
		}
	);
}

positron.Application.prototype.loadPageJs =
function Application_loadPageJs (inPageKey, inCallback)
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Application.loadPageJs()");

	var page = monohm.Object.instantiate (monohm.String.capitalise (inPageKey) + "Page");

	if (page == null)
	{
		var	self = this;
		
		positron.DOM.addScript
		(
			gApplication.getPageJSPath (inPageKey),
			function (inSuccess)
			{
				var	page = null;
				var	pageClassName = monohm.String.capitalise (inPageKey) + "Page";

				if (inSuccess)
				{
					page = monohm.Object.instantiate (pageClassName);
				}

				if (page == null)
				{
					console.error ("cannot instantiate " + pageClassName);
					page = monohm.Object.instantiate (self.getConfigEntry ("pageClassName"));
				}
				
				inCallback (page);
			}
		);
	}
	else
	{
		if (page == null)
		{
			page = monohm.Object.instantiate (this.getConfigEntry ("pageClassName"));
		}
	
		inCallback (page);
	}
}

positron.Application.prototype.preloadAssets =
function Application_preloadAssets ()
{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("Application.preloadAssets()");

	// for callbacks
	var	self = this;
	
	monohm.Network.getJSONAsync
	(
		"preload.json",
		function (inError, inData)
		{
			if (inError)
			{
if (gApplication.isLogging (gApplication.kLogLoader)) console.error ("load of preload.json failed");
			}
			else
			{
				if (inData && Array.isArray (inData))
				{
if (gApplication.isLogging (gApplication.kLogLoader)) console.log ("preload.json has " + inData.length + " assets");

					if (inData.length > 0)
					{
						self.assetLoader = new positron.Loader (self);
						self.assetLoader.add (inData);
					}
				}
				else
				{
if (gApplication.isLogging (gApplication.kLogLoader)) console.error ("preload.json empty or bad format");
				}
			}
		}
	);
}

positron.Application.prototype.setupAnalytics = 
function Application_setupAnalytics ()
{
	var	analyticsClassName = this.getConfigEntry ("analytics.className");
	
	if (analyticsClassName && analyticsClassName.length)
	{
		// this will read config for its setup
		this.analytics = monohm.Object.instantiate (analyticsClassName);
		
		if (!this.analytics)
		{
			console.error ("cannot instantiate analytics class (" + analyticsClassName + ")");
		}
	}
	else
	{
		this.analytics = new positron.DummyAnalytics ();
	}
}

positron.Application.prototype.setupBrowserFlags = 
function Application_setupBrowserFlags ()
{
  this.browser = new Object ();
  
  var userAgent = navigator.userAgent;

if (gApplication.isLogging (gApplication.kLogApplication)) console.log (userAgent);

	// one might think that navigator.appName and navigator.appVersion would be useful
	// and one would be wrong :-)
	
	// browser's actual name & version
	this.browser.name = "unknown";
	this.browser.versionNumber = 0;
	this.browser.version = "0";
	this.browser.type = "unknown";
	
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
			this.browser.name = "firefox";
			this.browser.type = "gecko";
			this.browser.version = elements2 [1];
			this.browser.isGecko = true;
		}
		else
		if (elements2 [0] == "Version")
		{
			// sigh, opera is nonstandard
			if (elements1 [0].substring (0, 5) == "Opera")
			{
				this.browser.name = "opera";
				this.browser.type = "opera";
				this.browser.version = elements2 [1];
			}
		}
		else
		if (elements2 [0] == "MSIE")
		{
			this.browser.name = "ie";
			this.browser.type = "ie";
			this.browser.isIE = true;
			this.browser.isIE9 = true;
			
			// the version is the next *space* delimited version with the semicolon clipped, sigh
			var	version = elements1 [i + 1];
			this.browser.version = version.substring (0, version.length - 1);
		}
	}

	// sort out the WebKit versioning mess
	if (this.browser.type == "unknown")
	{
		if (chromeVersion.length > 0)
		{
			this.browser.name = "chrome";
			this.browser.type = "webkit";
			this.browser.version = chromeVersion;
			this.browser.isWebKit = true;
		}
		else
		if (safariVersion.length > 0)
		{
			this.browser.name = "safari";
			this.browser.type = "webkit";
			this.browser.version = safariVersion;
			this.browser.isWebKit = true;
		}
		else
		if (appleWebKitVersion.length > 0)
		{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("applewebkit only detected, going with safari");

			this.browser.name = "safari";
			this.browser.type = "webkit";
			this.browser.version = appleWebKitVersion;
			this.browser.isWebKit = true;
		}
		else
		{
			console.error ("could not determine browser type");
		}
	}
	
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("type of browser is " + this.browser.type);

	// fwiw
	this.browser.versionNumber = parseFloat (this.browser.version);

	// mobile or desktop
	if (userAgent.indexOf ("iPhone") >= 0)
	{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("iphone browser detected");

		this.browser.isMobile = true;
		this.browser.isIPhone = true;
	}
	else
	if (userAgent.indexOf ("iPad") >= 0)
	{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("ipad browser detected");

		this.browser.isMobile = true;
		this.browser.isIPad = true;
	}
	else
	if (userAgent.indexOf ("Android") >= 0)
	{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("android browser detected");

		this.browser.isMobile = true;
		this.browser.isAndroid = true;
	}
	else
	if (this.browser.type == "gecko" && userAgent.indexOf ("Mobile") >= 0)
	{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("firefox mobile browser detected");

		this.browser.isMobile = true;
		this.browser.isFirefoxMobile = true;
	}
	else
	{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("desktop browser detected");

		this.browser.isMobile = false;
	}

	// language
	
	// ASSUME setupURLParameters() has been called
	var	language = this.params [this.getURLParameterPrefix () + "lang"];
	
	if (language && language.length)
	{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("setting language from lang parameter - " + language);

		this.browser.language = language;
	}
	else
	{
		if (navigator.userLanguage && navigator.userLanguage.length)
		{
			// IE
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("setting language from navigator.userLanguage - " + navigator.userLanguage);

			this.browser.language = navigator.userLanguage;
		}
		else
		if (navigator.language && navigator.language.length)
		{
			// WebKit/Gecko/etc
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("setting language from navigator.language - " + navigator.language);

			this.browser.language = navigator.language;
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
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("setting language from user agent - " + navigator.language);

				this.browser.language = possibleLanguage;
			}
			else
			{
if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("defaulting language to en-us");

				this.browser.language = "en-us";
			}
		}
	}
	
	this.browser.language = this.browser.language.toLowerCase ();

  // and... update our janx context so these are accessible in markup
  // could just put this.browser into context, but the cases are not compatible
  this.context.put ("browser.name", this.browser.name);
  this.context.put ("browser.version", this.browser.version);
  this.context.put ("browser.versionnumber", this.browser.versionNumber);
  this.context.put ("browser.type", this.browser.type);
  this.context.put ("browser.iswebkit", this.browser.isWebKit ? "true" : "false");
  this.context.put ("browser.isgecko", this.browser.isGecko ? "true" : "false");
  this.context.put ("browser.isopera", this.browser.isOpera ? "true" : "false");
  this.context.put ("browser.isie9", this.browser.isIE9 ? "true" : "false");
  this.context.put ("browser.ismobile", this.browser.isMobile ? "true" : "false");
  this.context.put ("browser.isiphone", this.browser.isIPhone ? "true" : "false");
  this.context.put ("browser.isipad", this.browser.isIPad ? "true" : "false");
  this.context.put ("browser.isios", (this.browser.isIPhone || this.browser.isIPad) ? "true" : "false");
  this.context.put ("browser.isandroid", this.browser.isAndroid ? "true" : "false");
  this.context.put ("browser.isfirefoxmobile", this.browser.isFirefoxMobile ? "true" : "false");
  this.context.put ("browser.language", this.browser.language);

};

positron.Application.prototype.setupDisplayClass = 
function Application_setupDisplayClass ()
{
	this.displayClass = null;
		
	if (this.config.displayClass)
	{
		for (var key in this.config.displayClass)
		{
			var	criteria = this.config.displayClass [key];
			
			if (criteria && criteria.length)
			{
				criteria = monohm.String.replaceAll
					(criteria, "width", new String (document.documentElement.clientWidth));

				criteria = monohm.String.replaceAll
					(criteria, "height", new String (document.documentElement.clientHeight));

				criteria = monohm.String.replaceAll
					(criteria, "pixelratio", new String (window.devicePixelRatio));

				var	orientation = null;
				
				if (window.orientation)
				{
					orientation = window.orientation;
				}
				else
				if (window.matchMedia)
				{
					if (window.matchMedia ("(orientation: portrait)").matches)
					{
						orientation = "portrait";
					}
					else
					if (window.matchMedia ("(orientation: landscape)").matches)
					{
						orientation = "landscape";
					}
					else
					{
						orientation = "unknown";
					}
				}

				criteria = monohm.String.replaceAll (criteria, "orientation", orientation);
				
				var matches = positron.Util.evaluateExpressionChain (criteria);
				
				if (matches)
				{
					if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("matched display class " + key);
					this.displayClass = key;
					break;
				}
			}
		}
		
		if (this.displayClass)
		{
			for (var key in this.config.displayClass)
			{
				if (key == this.displayClass)
				{
					document.body.classList.add (key);
				}
				else
				{
					document.body.classList.remove (key);
				}
			}
		}
		else
		{
			console.error ("no matching display class found");
		}
		
		var	bound = this.setupDisplayClass.bind (this);
		
		window.onresize = bound;
		window.addEventListener ("orientationchange", bound);
	}
}

// must be called *after* setupRequest()
positron.Application.prototype.setupLogging = 
function Application_setupLogging ()
{
	this.logMask = 0;
	
	this.logKeywords = new Object ();
	
	this.kLogAll = 0xffffff;
	this.logKeywords ["all"] = this.kLogAll;

	this.kLogApplication = 0x1;
	this.logKeywords ["app"] = this.kLogApplication;

	this.kLogViews = 0x2;
	this.logKeywords ["view"] = this.kLogViews;
	
	this.kLogLoader = 0x4;
	this.logKeywords ["loader"] = this.kLogLoader;

	this.kLogTreeWalker = 0x8;
	this.logKeywords ["treewalker"] = this.kLogTreeWalker;

	this.kLogAnalytics = 0x10;
	this.logKeywords ["analytics"] = this.kLogAnalytics;

	this.kLogTrigger = 0x20;
	this.logKeywords ["trigger"] = this.kLogTrigger;

	this.kLogAction = 0x40;
	this.logKeywords ["action"] = this.kLogAction;

	this.kLogCache = 0x80;
	this.logKeywords ["cache"] = this.kLogCache;

	// see if we have any parameters for turning on logging
	var logging = this.request.params [gApplication.getURLParameterPrefix () + "log"];
	
	if (logging && logging.length)
	{
		var logElements = logging.split (',');
		
		for (var i = 0; i < logElements.length; i++)
		{
			var mask = this.logKeywords [logElements [i]];
			
			if (typeof (mask) == "number")
			{
				this.logMask |= mask;

				console.log ("enabling log type (" + logElements [i] + ")");
			}
			else
			{
				console.error ("could not find log mask for keyword (" + logElements [i] + ")");
			}
		}
	}		 

	var keywords = "";
	
	for (var keyword in this.logKeywords)
	{
		if (typeof (keyword) == "string")
		{
			if (keywords.length > 0)
			{
				keywords += ', ';
			}
			
			keywords += keyword;
		}
	}
	
	if (gApplication.isLogging (gApplication.kLogApplication)) console.log ("allowed logging keywords are... " + keywords);
};

positron.Application.prototype.setupMIDI = 
function Application_setupMIDI (inAccess)
{
	this.midiAccess = inAccess;
	
	var	self = this;
	
	this.midiAccess.inputs.forEach
	(
		function (inPort)
		{
			inPort.onmidimessage = function (inEvent)
			{
				var	listeners = self.midiListeners [inPort.id];
				
				if (listeners)
				{
					for (var i = 0; i < listeners.length; i++)
					{
						listeners [i] (inEvent);
					}
				}
			}
		}
	);
}

positron.Application.prototype.setupRequest = 
function Application_setupRequest ()
{
	var request = new Object ();
	request.location = document.location;
	request.params = new Object ();
	
	var searchElements = document.location.search.split ('?');
	
	if (searchElements.length > 1)
	{
		var urlParams = searchElements [1];
		
		if (urlParams.length > 1)
		{
			var params = urlParams.split ('&');
			
			for (var i = 0; i < params.length; i++)
			{
				var keyValue = params [i].split ('=');
				
				if (keyValue.length > 1)
				{
					if (keyValue [0].length && keyValue [1].length)
					{
						request.params [keyValue [0]] = keyValue [1];
					}
				}
			}
		}
	}

	// i'd leave this out, but other areas need it
	// and i don't want clients of context other than Janx
	this.request = request;
	
	this.context.put ("request", request);
};

positron.Application.prototype.setupWindow = 
function Application_setupWindow ()
{
	var	body = document.querySelector ("body");
	
	this.window = monohm.Object.instantiate (this.getConfigEntry ("pageClassName"));
	this.window.configure ("window", body);
	this.window.innerHTML = "";
	
	positron.DOM.setData (body, "page", this.window);
	positron.DOM.setData (body, "view", this.window);
	
	this.page = this.window;
};

