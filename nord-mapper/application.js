

var	Application = function (inCallback)
{
	positron.Application.call (this, inCallback);
}
monohm.inherits (Application, positron.Application);

Application.prototype.start = function ()
{
	positron.Application.prototype.start.call (this);
}

Application.prototype.onMIDIMessage = function (inEvent)
{
	var	status = inEvent.data [0] & 0xf0;
	
	if (status == 0xb0)
	{
		var	controller = inEvent.data [1];
		var	handler = this.config.midi_controller_handlers [controller.toString ()];
	
		if (typeof handler == "number")
		{
			// map to the VS parameter and scale 7 bits to 8
			VsSendParameterAction.send (localStorage.midi_output_port, handler, inEvent.data [2] * 2);
		}
		else
		if (typeof handler == "string")
		{
			if (typeof this [handler] == "function")
			{
				this [handler].call (this, inEvent.data);
			}
			else
			{
				console.error ("no function for handler " + handler);
			}
		}
		else
		{
			console.error ("no handler for controller " + controller.toString ());
		}
	}
	else
	if (status == 0xf0)
	{
		// filter sysex
	}
	else
	{
		// copy everything else through
		gApplication.sendMIDIMessage (localStorage.midi_output_port, inMessage);
	}
}

// control byte handlers

Application.prototype.control = function (inMessage)
