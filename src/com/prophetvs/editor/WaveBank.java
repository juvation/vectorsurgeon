// Bank.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;

import javax.sound.midi.InvalidMidiDataException;
import javax.sound.midi.MidiMessage;
import javax.sound.midi.SysexMessage;

// CLASS

public class WaveBank
{
	// PUBLIC CONSTRUCTOR

	public
	WaveBank (byte[] inBuffer)
		throws IOException, VSException
	{
		this (new ByteArrayInputStream (inBuffer));
	}
	
	public
	WaveBank (Wave inTemplate)
	{
		for (int i = 0; i < 32; i++)
		{
			this.waves [i] = new Wave (inTemplate);
			this.waves [i].setWaveNumber (i);
		}
	}

	public
	WaveBank (InputStream inStream)
		throws IOException, VSException
	{
		byte[]	buffer = new byte [4];

		// read the header
		int	count = inStream.read (buffer, 0, 4);

		if (count != 4)
		{
			throw new VSException ("short bank header read");
		}

		if (buffer [0] != -16 || buffer [1] != 0x01
			|| buffer [2] != 0x0a || buffer [3] > 0x7f)
		{
			throw new VSException ("malformed sysex header");
		}

		for (int i = 0; i < 32; i++)
		{
			this.waves [i] = new Wave ();

			this.waves [i].readWaveBuffer (inStream);
			this.waves [i].setWaveNumber (i);
		}

		count = inStream.read (buffer, 0, 1);

		if (count != 1)
		{
			throw new VSException ("short bank footer read");
		}

		if (buffer [0] != -9)
		{
			throw new VSException ("malformed sysex footer");
		}

	}

	// PUBLIC METHODS

	public Wave
	getWaveCopy (int inWaveNumber)
	{
		return new Wave (this.waves [inWaveNumber]);
	}

	public Wave
	getWave (int inWaveNumber)
	{
		return this.waves [inWaveNumber];
	}

	public boolean
	isModified ()
	{
		return this.isModified;
	}
	
	public void
	setModified (boolean inIsModified)
	{
		this.isModified = inIsModified;
	}
	
	public void
	setWave (Wave inWave)
	{
		setWave (inWave, inWave.getWaveNumber ());
		
		this.isModified = true;
	}
	
	public void
	setWave (Wave inWave, int inWaveNumber)
	{
		this.waves [inWaveNumber] = new Wave (inWave);
		this.waves [inWaveNumber].setWaveNumber (inWaveNumber);
		
		this.isModified = true;
	}
	
	public void
	write (OutputStream outStream)
		throws IOException, VSException
	{
		// write the header
		byte	b = -16;
		outStream.write (b);
		b = 0x01;
		outStream.write (b);
		b = 0x0a;
		outStream.write (b);
		b = 0x7f;
		outStream.write (b);

		// write the wave buffers
		for (int i = 0; i < 32; i++)
		{
			this.waves [i].writeWaveBuffer (outStream);
		}

		// write the sysex footer
		b = -9;
		outStream.write (b);
	}

	// PRIVATE DATA

	private boolean
	isModified = false;
	
	private Wave[]
	waves = new Wave [32];
	
}

