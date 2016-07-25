// vs-send-parameter-action.js

monohm.provide ("VsSendParameterAction");

var	VsSendParameterAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (VsSendParameterAction, positron.action.Action);

VsSendParameterAction.prototype.fire = function (inEvent)
{
	positron.action.Action.prototype.fire.call (this, inEvent);

	if (this.actionArgs.length >= 3)
	{
		// note that port IDs are *strings*
		var	outputPortID = this.actionArgs [0];
		var	parameter = parseInt (this.actionArgs [1]);
		var	value = parseInt (this.actionArgs [2]);
		
		if (outputPortID.length == 0)
		{
			console.error ("empty output ID argument");
		}
		else
		if (isNaN (parameter))
		{
			console.error ("non-numeric parameter number argument: " + this.actionArgs [1]);
		}
		else
		if (isNaN (value))
		{
			console.error ("non-numeric parameter value argument: " + this.actionArgs [2]);
		}
		else
		{
			console.log ("setting parameter 0x" + parameter.toString (16) + " to " + value);
			
			// send parameter LSB
			var	message = [0xb0, 0x62, parameter & 0xff];
			gApplication.sendMIDI (outputPortID, message);

			// send parameter MSB
			message [1] = 0x63;
			message [2] = (parameter >> 8) & 0xff;
			gApplication.sendMIDI (outputPortID, message);
			
			// send value LSB
			message [1] = 0x26;
			message [2] = (value & 0x01) << 6;
			gApplication.sendMIDI (outputPortID, message);

			// send value MSB
			message [1] = 0x06;
			message [2] = (value >> 1) & 0x7f;
			gApplication.sendMIDI (outputPortID, message);
		}
	}
	else
	{
		console.error ("VSSendParameterAction with no outputid/param/value in args");
	}
	
	this.dispatchPrefixedEvent ();
};

