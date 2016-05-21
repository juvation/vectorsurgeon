// vs-send-parameter-action.js

monohm.provide ("VsSendParameterAction");

var	VsSendParameterAction = function ()
{
	positron.action.Action.call (this);
}
monohm.inherits (VsSendParameterAction, positron.action.Action);

// STATIC

VsSendParameterAction.send = function (inOutputPortID, inParameter, inValue)
{
	// send parameter LSB
	var	message = [0xb0, 0x62, inParameter & 0xff];
	console.log (message);
	gApplication.sendMIDI (outputPortID, message);

	// send parameter MSB
	message [1] = 0x63;
	message [2] = (inParameter >> 8) & 0xff;
	console.log (message);
	gApplication.sendMIDI (outputPortID, message);

	// send value LSB
	message [1] = 0x26;
	message [2] = (inValue & 0x01) << 6;
	console.log (message);
	gApplication.sendMIDI (outputPortID, message);

	// send value MSB
	message [1] = 0x06;
	message [2] = (inValue >> 1) & 0x7f;
	console.log (message);
	gApplication.sendMIDI (outputPortID, message);
}

// ACTION

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
			console.error ("non-numeric parameter number argument");
		}
		else
		if (isNaN (value))
		{
			console.error ("non-numeric parameter value argument");
		}
		else
		{
			VsSendParameterAction.send (outputPortID, parameter, message);
		}
	}
	else
	{
		console.error ("VSSendParameterAction with no outputid/param/value in args");
	}
	
	this.dispatchPrefixedEvent ();
};

