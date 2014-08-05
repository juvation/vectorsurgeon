// MidiReceiver.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

// use MMJ on Mac, thanks to idiotic Apple
import de.humatic.mmj.MidiInput;
import de.humatic.mmj.MidiOutput;
import de.humatic.mmj.MidiListener;
import de.humatic.mmj.MidiSystem;

// CLASS

public class MidiReceiver 
	implements MidiListener
{
	// PUBLIC CONSTRUCTOR
	
	public
	MidiReceiver (MidiInput inInput, MidiHost inMidiHost)
	{
		this.input = inInput;
		this.midiHost = inMidiHost;
	}
	
	// RECEIVER IMPLEMENTATION
	
	public void
	close ()
	{
		// i have never known close() to mean anything
		// in the javax.sound.midi stuff
	}
	
	public void
	midiInput (byte[] inMessage)
	{
// System.err.println ("received message of length " + inMessage.length);

		int	command = (int) (inMessage [0] & 0xf0);

		if (command == 0xf0)
		{
// System.err.println ("system exclusive message received");

			Exception	exception = null;
			
			try
			{
				if (inMessage.length <= 169)
				{
					Patch	patch = new Patch (inMessage);
					ControlWindow.getInstance ().openPatch (patch, true);
				}
				else
				if (inMessage.length <= 12293)
				{
					WaveBank	waveBank = new WaveBank (inMessage);
					ControlWindow.getInstance ().openWaveBank (waveBank, null, true, true);
				}
				else
				{
					Bank	bank = new Bank (inMessage);
					ControlWindow.getInstance ().openBank (bank, null, true, true);
				}
			}
			catch (Throwable inThrowable)
			{
				// report? how? we're not in the EDT
inThrowable.printStackTrace (System.err);
			}
		}
		else
		{
			int	channel = (int) (inMessage [0] & 0x0f);
			
			// check the device and the channel match
			if (this.input == this.midiHost.getMidiInputDevice ()
				&& channel == this.midiHost.getMidiChannel0 ())
			{
				if (command == 0xb0)
				{
					handleControlChange (inMessage);
				}
			}
			else
			if (this.input == this.midiHost.getMidiThruDevice ())
			{
				if (command == 0xb0)
				{
					this.midiHost.sendMidiControlChange (inMessage [1], inMessage [2]);
				}
				else
				if (command == 0xd0)
				{
					this.midiHost.sendMidiChannelPressure (inMessage [1]);
				}
				else
				if (command == 0x90)
				{
					handleNoteOn (inMessage);
				}
				else
				if (command == 0x80)
				{
					handleNoteOff (inMessage);
				}
				else
				if (command == 0xe0)
				{
					this.midiHost.sendMidiPitchBend (inMessage [1], inMessage [2]);
				}
			}
		}
	}

	// PRIVATE METHODS
	
	private void
	handleControlChange (byte[] inMessage)
	{
		// see what we're doing here
		int	controlNumber = (int) inMessage [1];
		
		if (controlNumber == 0x62)
		{
			// the shortly-to-arrive MSB will make this a full parameter number
			// for now, it's just the LSB
			this.parameterNumber = inMessage [2];
		}
		else
		if (controlNumber == 0x63)
		{
			// combine with previously cached parameter number LSB
			this.parameterNumber |= inMessage [2] << 8;
			
			// now we wait for data entry controller values
		}
		else
		if (controlNumber == 0x26)
		{
			this.parameterValueLSB = inMessage [2];
		}
		else
		if (controlNumber == 0x06)
		{
			// the MSB is bits 8:1
			int	parameterValue = inMessage [2] << 1;
			
			// and the MSB is either 0 or 0x40 
			// depending on whether that last bit is 1 or not
			if (this.parameterValueLSB != 0)
			{
				parameterValue |= 0x01;
			}

			this.midiHost.setParameterValueFromMIDI (this.parameterNumber, parameterValue);
			
			// wipe the cached LSB
			this.parameterValueLSB = 0;
		}
		else
		{
			// if the host wants unrecognised control change messages, let it know now
			this.midiHost.sendMidiControlChange (inMessage [1], inMessage [2]);
		}
	}
	
	private void
	handleNoteOff (byte[] inMessage)
	{
		this.midiHost.sendMidiNoteOff (inMessage [1]);
	}
	
	private void
	handleNoteOn (byte[] inMessage)
	{
		if (inMessage [2] == 0)
		{
			handleNoteOff (inMessage);
		}
		else
		{
			this.midiHost.sendMidiNoteOn (inMessage [1], inMessage [2]);
		}
	}
	
	// PRIVATE DATA
	
	private int
	parameterNumber = 0;
	
	private int
	parameterValueLSB = 0;
	
	private MidiInput
	input = null;

	private MidiHost
	midiHost = null;
	
}

