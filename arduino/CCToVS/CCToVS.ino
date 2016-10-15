// CCToVS.ino

// maps incoming CCs to Prophet VS backwards NRPNs


#include <MIDI.h>

MIDI_CREATE_DEFAULT_INSTANCE();

// TYPEDEFS

// PROTOTYPES

void
setupParameterMap ();

void
onNoteOff (byte inChannel, byte inNote, byte inVelocity);

void
onNoteOn (byte inChannel, byte inNote, byte inVelocity);

void
onAfterTouchPoly (byte inChannel, byte inNote, byte inPressure);

void
onControlChange (byte inChannel, byte inNumber, byte inValue);

void
onProgramChange (byte inChannel, byte inNumber);

void
onPitchBend (byte inChannel, int inBend);

void
onClock ();

void
onStart ();

void
onContinue ();

void
onStop ();

void
onActiveSensing ();

// GLOBAL DATA

// configured by setupParameterMap()
int	parameters [128];

// SETUP

void
setup ()
{
  setupParameterMap ();
  
	// we don't want to clog up the VS with nonsense CCs
	MIDI.turnThruOff ();

	MIDI.setHandleNoteOff (onNoteOff);

  // Launch MIDI and listen to channel 1
  MIDI.begin (1);
}

// LOOP

void
loop ()
{
}

// 

void
setupParameterMap ()
{
	// the default map just copies everything straight over
	for (int i = 0; i < 128; i++)
	{
		parameters [i] = i;
	}
}

void
onNoteOff (byte inChannel, byte inNote, byte inVelocity)
{
	MIDI.sendNoteOff (inNote, inVelocity, inChannel);
}

void
onNoteOn (byte inChannel, byte inNote, byte inVelocity)
{
	MIDI.sendNoteOn (inNote, inVelocity, inChannel);
}

void
onAfterTouchPoly (byte inChannel, byte inNote, byte inPressure)
{
	MIDI.sendPolyPressure (inNote, inPressure, inChannel);
}

void
onControlChange (byte inChannel, byte inNumber, byte inValue)
{
	// send VS param select LSB
	MIDI.sendControlChange (0x62, inNumber & 0xff, inChannel);

	// send VS param select MSB
	MIDI.sendControlChange (0x63, (inNumber >> 8) & 0xff, inChannel);

	// send data slider LSB
	MIDI.sendControlChange (0x26, (inValue & 0x01) << 6, inChannel);

	// send data slider MSB
	MIDI.sendControlChange (0x06, (inValue >> 1) & 0x7f, inChannel);
}

void
onProgramChange (byte inChannel, byte inNumber)
{
	MIDI.sendProgramChange (inNumber, inChannel);
}

void
onPitchBend (byte inChannel, int inBend)
{
	MIDI.sendPitchBend (inBend, inChannel);
}

void
onClock ()
{
	MIDI.sendRealTime (midi::Clock);
}

void
onStart ()
{
	MIDI.sendRealTime (midi::Start);
}

void
onContinue ()
{
	MIDI.sendRealTime (midi::Continue);
}

void
onStop ()
{
	MIDI.sendRealTime (midi::Stop);
}

void
onActiveSensing ()
{
	MIDI.sendRealTime (midi::ActiveSensing);
}

