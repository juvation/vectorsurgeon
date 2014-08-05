// MidiHost.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

// use MMJ on Mac, thanks to idiotic Apple
import de.humatic.mmj.MidiInput;
import de.humatic.mmj.MidiOutput;
import de.humatic.mmj.MidiSystem;

// CLASS

public interface MidiHost
{
	// PUBLIC ABSTRACT METHODS
	
	public abstract int
	getMidiChannel0 ();
	
	public abstract MidiInput
	getMidiInputDevice ();
	
	public abstract MidiOutput
	getMidiOutputDevice ();
	
	public abstract MidiInput
	getMidiThruDevice ();

	public abstract void
	sendMidiControlChange (int inControlNumber, int inControlValue);
	
	public abstract void
	sendMidiChannelPressure (int inPressure);
	
	public abstract void
	sendMidiMessage (byte[] inMessage);

	public abstract void
	sendMidiMessage (int inCommand, int inData1);

	public abstract void
	sendMidiMessage (int inCommand, int inData1, int inData2);

	public abstract void
	sendMidiMessages (byte[][] inMessage);

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

