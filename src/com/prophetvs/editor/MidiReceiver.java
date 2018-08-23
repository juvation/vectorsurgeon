// MidiReceiver.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.io.ByteArrayOutputStream;

import javax.sound.midi.MidiDevice;
import javax.sound.midi.MidiMessage;
import javax.sound.midi.Receiver;
import javax.sound.midi.ShortMessage;
import javax.sound.midi.SysexMessage;
import javax.swing.SwingUtilities;

// CLASS

public class MidiReceiver 
	implements Receiver
{
	// PUBLIC CONSTRUCTOR
	
	public
	MidiReceiver (MidiDevice inDevice, MidiHost inMidiHost)
	{
		this.device = inDevice;
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
	send (MidiMessage inMessage, long inTimeStamp)
	{
		if (inMessage instanceof SysexMessage)
		{
// System.err.println ("system exclusive message received");

			byte[]	data = inMessage.getMessage ();
			int	length = inMessage.getLength ();

			// if we're already caching
			// or this is a partial message
			if (this.sysexBuffer != null || data [length - 1] != -9)
			{                       	
				// make a buffer if necessary
				if (this.sysexBuffer == null)
				{
					this.sysexBuffer = new ByteArrayOutputStream ();
                                        
// System.err.println ("buffering " + length);

         // include the SEX byte
          this.sysexBuffer.write (data, 0, length);
				}
				else
				{
// System.err.println ("buffering " + (length - 1));
 
 					// exclude the initial EOX byte
					// that says this is a continuation
					this.sysexBuffer.write (data, 1, length - 1);
				}
			}
			
			// if this is a complete message then deal with it
			if (data [length - 1] == -9)
			{
// System.err.println ("dealing with message");

				// two possible places the message could be
				byte[]	message = null;
				
				// then get the buffer from the right spot
				if (this.sysexBuffer == null)
				{
					// in the message just received
					message = data;
				}
				else
				{
					// in the cache
					message = this.sysexBuffer.toByteArray ();
					
					// and dump the cache
					this.sysexBuffer = null;
				}

// System.err.println ("message length is " + message.length);

				Exception	exception = null;
				
				try
				{
					if (message.length <= 169)
					{
						Patch	patch = new Patch (message);
						ControlWindow.getInstance ().openPatch (patch, true);
					}
					else
					if (message.length <= 12293)
					{
						WaveBank	waveBank = new WaveBank (message);
						ControlWindow.getInstance ().openWaveBank (waveBank, null, true, true);
					}
					else
					{
						Bank	bank = new Bank (message);
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
// System.err.println ("not dealing with message right now");
			}
		}
		if (inMessage instanceof ShortMessage)
		{
			ShortMessage	shortMessage = (ShortMessage) inMessage;
			
			// check the device and the channel match
			if (this.device == this.midiHost.getMidiInputDevice ()
				&& shortMessage.getChannel () == this.midiHost.getMidiChannel0 ())
			{
				if (shortMessage.getCommand () == ShortMessage.CONTROL_CHANGE)
				{
					handleControlChange (shortMessage);
				}
				else
				if (shortMessage.getCommand () == ShortMessage.PROGRAM_CHANGE)
				{
					handleProgramChange (shortMessage);
				}
			}
			else
			if (this.device == this.midiHost.getMidiThruDevice ())
			{
				if (shortMessage.getCommand () == ShortMessage.CONTROL_CHANGE)
				{
					this.midiHost.sendMidiControlChange
						(shortMessage.getData1 (), shortMessage.getData2 ());
				}
				else
				if (shortMessage.getCommand () == ShortMessage.PROGRAM_CHANGE)
				{
					handleProgramChange (shortMessage);
				}
				else
				if (shortMessage.getCommand () == ShortMessage.CHANNEL_PRESSURE)
				{
					this.midiHost.sendMidiChannelPressure (shortMessage.getData1 ());
				}
				else
				if (shortMessage.getCommand () == ShortMessage.NOTE_ON)
				{
					handleNoteOn (shortMessage);
				}
				else
				if (shortMessage.getCommand () == ShortMessage.NOTE_OFF)
				{
					handleNoteOff (shortMessage);
				}
				else
				if (shortMessage.getCommand () == ShortMessage.PITCH_BEND)
				{
					this.midiHost.sendMidiPitchBend
						(shortMessage.getData1 (), shortMessage.getData2 ());
				}
			}
		}
	}

	// PRIVATE METHODS
	
	private void
	handleControlChange (ShortMessage inMessage)
	{
		// see what we're doing here
		int	controlNumber = inMessage.getData1 ();
		
		if (controlNumber == 0x62)
		{
			// the shortly-to-arrive MSB will make this a full parameter number
			// for now, it's just the LSB
			this.parameterNumber = inMessage.getData2 ();
		}
		else
		if (controlNumber == 0x63)
		{
			// combine with previously cached parameter number LSB
			this.parameterNumber |= inMessage.getData2 () << 8;
			
			// now we wait for data entry controller values
		}
		else
		if (controlNumber == 0x26)
		{
			this.parameterValueLSB = inMessage.getData2 ();
		}
		else
		if (controlNumber == 0x06)
		{
			// the MSB is bits 8:1
			int	parameterValue = inMessage.getData2 () << 1;
			
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
			this.midiHost.sendMidiControlChange (inMessage.getData1 (), inMessage.getData2 ());
		}
	}
	
	private void
	handleNoteOff (ShortMessage inMessage)
	{
		this.midiHost.sendMidiNoteOff (inMessage.getData1 ());
	}
	
	private void
	handleNoteOn (ShortMessage inMessage)
	{
		if (inMessage.getData2 () == 0)
		{
			handleNoteOff (inMessage);
		}
		else
		{
			this.midiHost.sendMidiNoteOn (inMessage.getData1 (), inMessage.getData2 ());
		}
	}
	
	private void
	handleProgramChange (ShortMessage inMessage)
	{
		// see what we're doing here
		int	patchNumber = inMessage.getData1 ();
		
		ControlWindow	controlWindow = ControlWindow.getInstance ();
		BankWindow	bankWindow = controlWindow.getBankWindowInProphet ();
		
		if (bankWindow != null)
		{
			// we are in the MIDI thread so defer to the UI thread
			RunnableTryOpenPatchWindow	runnable = new RunnableTryOpenPatchWindow (bankWindow, patchNumber);
			
			try
			{
				SwingUtilities.invokeAndWait (runnable);
			}
			catch (Exception inException)
			{
				System.err.println (inException);
			}
		}
	}
	
	// PRIVATE DATA
	
	private ByteArrayOutputStream
	sysexBuffer = null;
	
	private int
	parameterNumber = 0;
	
	private int
	parameterValueLSB = 0;
	
	private MidiDevice
	device = null;

	private MidiHost
	midiHost = null;
	
}

