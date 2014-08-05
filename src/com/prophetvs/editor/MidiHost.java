// MidiHost.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import javax.sound.midi.MidiDevice;
import javax.sound.midi.MidiMessage;
import javax.sound.midi.MidiSystem;
import javax.sound.midi.MidiUnavailableException;
import javax.sound.midi.InvalidMidiDataException;
import javax.sound.midi.Receiver;
import javax.sound.midi.Sequencer;
import javax.sound.midi.ShortMessage;
import javax.sound.midi.SysexMessage;
import javax.sound.midi.Transmitter;

// CLASS

public interface MidiHost
{
	// PUBLIC ABSTRACT METHODS
	
	public abstract int
	getMidiChannel0 ();
	
	public abstract MidiDevice
	getMidiInputDevice ();
	
	public abstract MidiDevice
	getMidiOutputDevice ();
	
	public abstract MidiDevice
	getMidiThruDevice ();

	public abstract void
	sendMidiControlChange (int inControlNumber, int inControlValue);
	
	public abstract void
	sendMidiChannelPressure (int inPressure);
	
	public abstract void
	sendMidiMessage (MidiMessage inMessage)
		throws MidiUnavailableException;

	public abstract void
	sendMidiMessages (MidiMessage[] inMessages)
		throws MidiUnavailableException;

	public abstract void
	sendMidiNoteOff (int inNoteNumber);
	
	public abstract void
	sendMidiNoteOn (int inNoteNumber, int inVelocity);
	
	public abstract void
	sendMidiPitchBend (int inLSB, int inMSB);
	
	public abstract void
	sendMidiProgramChange (int inPatchNumber);

	public abstract void
	setParameterValueFromMIDI (int inParameterNumber, int inParameterValue);
	
}

