

var	Application = function (inCallback)
{
	positron.Application.call (this, inCallback);
}
monohm.inherits (Application, positron.Application);

Application.prototype.start = function ()
{
	positron.Application.prototype.start.call (this);
}

Application.prototype.onmidimessage = function (inEvent)
{
	if (inEvent.target.id == localStorage.midi_input_id)
	{
		var	status = inEvent.data [0] & 0xf0;
		
		if (status == 0xb0)
		{
			var	controller = inEvent.data [1];
			var	handler = this.config.midi_controller_handlers [controller.toString ()];
		
			if (typeof handler == "number")
			{
				VsSendParameterAction.send (localStorage.midi_output_id, handler, inEvent.data [2] * 2);
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
				console.error ("unmapped controller " + controller.toString () + " = " + inEvent.data [2]);
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
			gApplication.sendMIDI (localStorage.midi_output_id, inEvent.data);
		}
	}
	else
	{
		// console.error ("input from port " + inEvent.target.id + " filtered");
	}
}

// control byte handlers

// set ADSR mode on the Prophet's amp and filter envelopes
Application.prototype.adsrmode = function (inMessage)
{
	console.log ("Application.adsrmode()");
	
	// set amp envelope levels 0 to minimum
	VsSendParameterAction.send (localStorage.midi_output_id, 0x18, 0);

	// set amp envelope levels 1-2 to maximum
	VsSendParameterAction.send (localStorage.midi_output_id, 0x19, 255);
	VsSendParameterAction.send (localStorage.midi_output_id, 0x1a, 255);
	
	// set amp rate 2 to zero
	VsSendParameterAction.send (localStorage.midi_output_id, 0x14, 0);
	
	// set filter envelope levels 0 to minimum
	VsSendParameterAction.send (localStorage.midi_output_id, 0x23, 0);

	// set filter envelope levels 1-2-4 to maximum
	VsSendParameterAction.send (localStorage.midi_output_id, 0x24, 255);
	VsSendParameterAction.send (localStorage.midi_output_id, 0x25, 255);
	VsSendParameterAction.send (localStorage.midi_output_id, 0x27, 0);
	
	// set filter rate 2 to zero
	VsSendParameterAction.send (localStorage.midi_output_id, 0x1f, 0);
	
}

// the Nord waves are
// 0 stepped-random
// 1 sawtooth
// 2 triangle
// 3 square
// 4 smooth random

// there are 5 VS waves
// which map into the ranges 0-255
// so the ranges are 
// 0-50	triangle
// 51-101 square
// 102-152 sawtooth
// 153-203 ramp
// 204-255 random
Application.LFOWaveMapping =
[
	230,	// stepped random
	130,	// sawtooth
	30,		// triangle
	80,		// square
	230		// smooth random
];

Application.prototype.lfo1wave = function (inMessage)
{
	var	nordLFOWave = inMessage [2];
	var	vsLFOWave = Application.LFOWaveMapping [nordLFOWave];
	
	VsSendParameterAction.send (localStorage.midi_output_id, 0x0f, vsLFOWave);
}

Application.prototype.lfo2wave = function (inMessage)
{
	var	nordLFOWave = inMessage [2];
	var	vsLFOWave = Application.LFOWaveMapping [nordLFOWave];
	
	VsSendParameterAction.send (localStorage.midi_output_id, 0x10, vsLFOWave);
}

Application.CoarseFrequencyMapping =
[
	0,
	123,
	255
];

// for this we set all 4 oscillators to a given spread
// we have 256 possible values
// and take the value of each oscillator's 0-12-24 tune
// from its 2 bits out of the 8
Application.prototype.osccoarsetune = function (inMessage)
{
	// console.log ("Application.osccoarsetune()");
	
	// the oddest thing is that the semitone knob on the NL2
	// sends 0-120 not 0-127
	// so scale that first
	var	value = Math.round ((inMessage [2] / 121) * 256);

	var	a = value & 0x3;
	a *= 2;
	a /= 3;
	a = Math.floor (a);
	
	VsSendParameterAction.send 
		(localStorage.midi_output_id, 0x04, Application.CoarseFrequencyMapping [a]);

	var	b = (value >> 2) & 0x3;
	b *= 2;
	b /= 3;
	b = Math.floor (a);

	VsSendParameterAction.send 
		(localStorage.midi_output_id, 0x05, Application.CoarseFrequencyMapping [b]);

	var	c = (value >> 4) & 0x3;
	c *= 2;
	c /= 3;
	c = Math.floor (a);

	VsSendParameterAction.send 
		(localStorage.midi_output_id, 0x06, Application.CoarseFrequencyMapping [c]);

	var	d = (value >> 6) & 0x3;
	d *= 2;
	d /= 3;
	d = Math.floor (a);

	VsSendParameterAction.send 
		(localStorage.midi_output_id, 0x07, Application.CoarseFrequencyMapping [d]);
}

Application.prototype.oscfinetune = function (inMessage)
{
	console.log ("Application.oscfinetune()");
}

