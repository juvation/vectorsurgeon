var	Application = function (inCallback)
{
	positron.Application.call (this, inCallback);
	
	this.midiChannel0 = 0;
	this.midiInputPortID = 0;
	this.midiOutputPortID = 0;
	this.currentParameterNumber = -1;
}
monohm.inherits (Application, positron.Application);

// called from positron "call" action
// hence params are in object params
Application.prototype.sendMIDIParameterChangeMessage = function ()
{
	// HACK
	var	inParameterNumber = 12;
	var	inValue = this.params.value;
	
	console.log ("sendMIDIParameterChangeMessage(" + this.params.value + ")");
	
	var	messageBuffer = new Array ();
	
	// if we're sending a value on the current parameter
	// then there's no need for the parameter select messages
	if (inParameterNumber != this.currentParameterNumber)
	{
		console.log ("new parameter number: " + inParameterNumber);
		
		var	parameterNumberLSB = inParameterNumber & 0xff;
		var	parameterNumberMSB = (inParameterNumber >> 8) & 0xff;
		
		messageBuffer.push (0xb0 | this.midiChannel0);
		messageBuffer.push (0x62);
		messageBuffer.push (parameterNumberLSB);

		messageBuffer.push (0xb0 | this.midiChannel0);
		messageBuffer.push (0x63);
		messageBuffer.push (parameterNumberMSB);
	}

	// convert to range-based units
	inValue /= 100;
	
	// scale up to 8-bit range
	inValue *= 256;
	
	// back to integerland
	inValue = Math.ceil (inValue);
	
	// MSB is bits 8:1
	var	valueMSB = (inValue >> 1) & 0x7f;
	
	// LSB is bit 0 shifted
	var	valueLSB = (inValue & 0x01) << 6;
	
	messageBuffer.push (0xb0 | this.midiChannel0);
	messageBuffer.push (0x26);
	messageBuffer.push (valueLSB);
	
	messageBuffer.push (0xb0 | this.midiChannel0);
	messageBuffer.push (0x06);
	messageBuffer.push (valueMSB);
	
	console.log ("sending MIDI message");
	console.log (messageBuffer);
	
	gApplication.sendMIDI (this.midiOutputPortID, messageBuffer);
}

// called from positron "call" action
// hence params are in object params
Application.prototype.setMIDIOutputChannel = function ()
{
	console.log ("setMIDIOutputChannel(" + this.params.value + ")");

	this.midiChannel0 = parseInt (this.params.value);
}

// called from positron "call" action
// hence params are in object params
Application.prototype.setMIDIOutputPortID = function ()
{
	console.log ("setMIDIOutputPortID(" + this.params.value + ")");

	this.midiOutputPortID = parseInt (this.params.value);
}

