

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

			// console.log ("handler = " + handler);
		
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

// used to prevent unnecessary chatter during coarse tweaking
Application.prototype.oscillatorCoarseTunings = 
[
	-1,
	-1,
	-1,
	-1
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

	// and then scale to the range of permutations for the oscs
	// assuming values 0,12,24
	// no dissonance here! :-)
	// which is 3^4 = 81

	value = Math.floor (value / 3.16);

	var	a = value % 3;
	
	if (a != this.oscillatorCoarseTunings [0])
	{
		this.oscillatorCoarseTunings [0] = a;

		VsSendParameterAction.send 
			(localStorage.midi_output_id, 0x04, Application.CoarseFrequencyMapping [a]);
 	}
 
	var	b = Math.floor ((value / 3) % 3);

	if (b != this.oscillatorCoarseTunings [1])
	{
		this.oscillatorCoarseTunings [1] = b;

		VsSendParameterAction.send 
			(localStorage.midi_output_id, 0x05, Application.CoarseFrequencyMapping [b]);
	}

	var	c = Math.floor ((value / 9) % 3);

	if (c != this.oscillatorCoarseTunings [2])
	{
		this.oscillatorCoarseTunings [2] = c;

		VsSendParameterAction.send 
			(localStorage.midi_output_id, 0x06, Application.CoarseFrequencyMapping [c]);
	}

	var	d = Math.floor ((value / 27) % 3);

	if (d != this.oscillatorCoarseTunings [3])
	{
		this.oscillatorCoarseTunings [3] = d;

		VsSendParameterAction.send 
			(localStorage.midi_output_id, 0x07, Application.CoarseFrequencyMapping [d]);
	}
}

Application.FineFrequencyMapping =
[
	0,
	2,
	4,
	8
];

// used to prevent unnecessary chatter during fine tweaking
Application.prototype.oscillatorFineTunings = 
[
	-1,
	-1,
	-1,
	-1
];

Application.prototype.oscfinetune = function (inMessage)
{
	console.log ("Application.oscfinetune(" + inMessage [2] + ")");

	// the oddest thing is that the semitone knob on the NL2
	// sends 0-120 not 0-127
	// so scale that first
	// var	value = Math.round ((inMessage [2] / 121) * 256);

	// scale 0..127 to 0..255 to make subsequent bitfielding easier!
	var	value = inMessage [2] * 2;

	var	a = value % 4;
	
	if (a != this.oscillatorFineTunings [0])
	{
		this.oscillatorFineTunings [0] = a;

		VsSendParameterAction.send 
			(localStorage.midi_output_id, 0x08, Application.FineFrequencyMapping [a]);
 	}
 
	var	b = Math.floor ((value / 4) % 4);

	if (b != this.oscillatorFineTunings [1])
	{
		this.oscillatorFineTunings [1] = b;

		VsSendParameterAction.send 
			(localStorage.midi_output_id, 0x09, Application.FineFrequencyMapping [b]);
	}

	var	c = Math.floor ((value / 16) % 4);

	if (c != this.oscillatorFineTunings [2])
	{
		this.oscillatorFineTunings [2] = c;

		VsSendParameterAction.send 
			(localStorage.midi_output_id, 0x0a, Application.FineFrequencyMapping [c]);
	}

	var	d = Math.floor ((value / 64) % 4);

	if (d != this.oscillatorFineTunings [3])
	{
		this.oscillatorFineTunings [3] = d;

		VsSendParameterAction.send 
			(localStorage.midi_output_id, 0x0b, Application.FineFrequencyMapping [d]);
	}
}

Application.prototype.oscwavearandom = function (inMessage)
{
	console.log ("Application.oscwavearandom()");

	VsSendParameterAction.send 
		(localStorage.midi_output_id, 0x00, Math.floor (Math.random () * 256));
}

Application.prototype.oscwavebrandom = function (inMessage)
{
	console.log ("Application.oscwavebrandom()");

	VsSendParameterAction.send 
		(localStorage.midi_output_id, 0x01, Math.floor (Math.random () * 256));
}

Application.prototype.oscwavecrandom = function (inMessage)
{
	console.log ("Application.oscwavecrandom()");

	VsSendParameterAction.send 
		(localStorage.midi_output_id, 0x02, Math.floor (Math.random () * 256));
}

Application.prototype.oscwavedrandom = function (inMessage)
{
	console.log ("Application.oscwavedrandom()");

	VsSendParameterAction.send 
		(localStorage.midi_output_id, 0x03, Math.floor (Math.random () * 256));
}

