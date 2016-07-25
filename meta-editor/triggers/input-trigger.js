/**
*
* @license
* Copyright 2014 Monohm Inc.  All rights reserved.
*
**/

monohm.provide ("InputTrigger");

var	InputTrigger = function ()
{
	positron.trigger.Trigger.call (this);
}
monohm.inherits (InputTrigger, positron.trigger.Trigger);

InputTrigger.prototype.register = function (inAction)
{
	inAction.element.addEventListener
	(
		"input",
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

