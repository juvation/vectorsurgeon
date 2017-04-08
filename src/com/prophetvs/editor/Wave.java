// Wave.java

// VS wave storage class

package com.prophetvs.editor;

// VS

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.sound.midi.MidiMessage;
import javax.sound.midi.ShortMessage;
import javax.sound.midi.SysexMessage;
import javax.sound.midi.InvalidMidiDataException;

// CLASS

public class Wave
{
	// PUBLIC CONSTRUCTOR

	// construct from uncompressed binary stream, eg WAVE file, etc
	public
	Wave (InputStream inStream, long inNumSamples, int inBitsPerSample, int inNumChannels, boolean inLittleEndian)
		throws IOException
	{
		int	numVSSamples = 128;
		long	sampleIndex = 0;
		
		for (int i = 0; i < numVSSamples; i++)
		{
			double	nextSampleIndexDouble = (((double) i / (double) numVSSamples) * (double) inNumSamples);
			long	nextSampleIndex = (int) Math.ceil (nextSampleIndexDouble);
			nextSampleIndex++;
			
			int	total = 0;
			int	samplesToAverage = (int) (nextSampleIndex - sampleIndex);
			
			for (; sampleIndex < nextSampleIndex; sampleIndex++)
			{
				total += getNextSample (inStream, inBitsPerSample, inNumChannels, inLittleEndian);
				
				// skip any extra channels
				for (int j = 0; j < inNumChannels - 1; j++)
				{
					inStream.skip (inBitsPerSample / 8);
					
					if ((inBitsPerSample % 8) > 0)
					{
						inStream.skip (1);
					}
				}
			}
			
			int	sample = total / samplesToAverage;

			// now write the sample as 3 LSB first nybbles
			setSample (i, sample);
		}
	}
	
	// this is stupid
	// java should know how to clone() properly
	public
	Wave (Wave inCopy)
	{
		System.arraycopy
			(inCopy.buffer, 0, this.buffer, 0, this.buffer.length);
			
		this.waveNumber = inCopy.waveNumber;
	}

	public
	Wave ()
	{
	}

	// PUBLIC METHODS

	// sample is signed 12-bit
	public int
	getSample (int inSampleNumber)
	{
		int	sample = 0;
		
		if (inSampleNumber >= 0 && inSampleNumber < 128)
		{
			sample = this.buffer [inSampleNumber * 2];
			sample <<= 4;
			sample |= this.buffer [(inSampleNumber * 2) + 1];
			sample <<= 4;

			// hold it! the lsbs for all the samples are stored in the last 128 byte chunk
			// weird eh?
			// thanks to Jurgen for finding this
			sample |= this.buffer [256 + inSampleNumber];
			
			// and... sign extend
			sample <<= 20;
			sample >>= 20;
		}

		return sample;
	}
	
	// HACK mutable
	public byte[]
	getWaveBuffer ()
	{
		return this.buffer;
	}
	
	public int
	getWaveNumber ()
	{
		return this.waveNumber;
	}
	
	public boolean
	isModified ()
	{
		return this.isModified;
	}
	
	// mainly used by WaveBank
	// to set the wave buffer
	// independently of the sysex wrapper
	public void
	readWaveBuffer (InputStream inStream)
		throws IOException
	{
		int	count = inStream.read (this.buffer, 0, 384);

		if (count != 384)
		{
			throw new IOException ("short read");
		}
	}

	public void
	setModified (boolean inIsModified)
	{
		this.isModified = inIsModified;
	}
	
	// sample comes in 12-bit signed
	public void
	setSample (int inSampleNumber, int inSample)
	{
		if (inSampleNumber >= 0 && inSampleNumber < 128)
		{
			this.buffer [inSampleNumber * 2] = (byte) ((inSample >> 8) & 0xf);

			// The MS nibble must be converted to 2s complement instead of 0-15 integer
			// Accomplished by flipping most significant bit ( ^ 1 << 3 )
			// (thanks to Henrik Rydell for finding and fixing this bug)
			this.buffer [inSampleNumber * 2] = (byte) ((inSample >> 8) & 0xf ^ 1 << 3 );

			// hold it! the lsbs for all the samples are stored in the last 128 byte chunk
			// weird eh?
			// thanks to Jurgen for finding this
			this.buffer [256 + inSampleNumber] = (byte) (inSample & 0xf);

			this.isModified = true;
		}
	}
	
	public void
	setWaveNumber (int inWaveNumber)
	{
		this.waveNumber = inWaveNumber;
	}

	// includes sysex header
	public void
	write (OutputStream outStream)
		throws IOException
	{
		outStream.write (this.buffer, 0, this.buffer.length);
	}

	// excludes sysex header
	public void
	writeWaveBuffer (OutputStream outStream)
		throws IOException
	{
		outStream.write (this.buffer, 0, 384);
	}

	// PRIVATE METHODS
	
	private int
	getNextSample (InputStream inStream, int inBitsPerSample, int inNumChannels, boolean inLittleEndian)
		throws IOException
	{
		int	sample = 0;
		
		if (inBitsPerSample >= 8)
		{
			sample = inStream.read ();
		}
		
		if (inBitsPerSample >= 12)
		{
			if (inLittleEndian)
			{
				sample |= inStream.read () << 8;
			}
			else
			{
				sample <<= 8;
				sample |= inStream.read ();
			}
		}
		
		if (inBitsPerSample >= 24)
		{
			if (inLittleEndian)
			{
				sample |= inStream.read () << 16;
			}
			else
			{
				sample <<= 8;
				sample |= inStream.read ();
			}
		}
		
		if (inBitsPerSample >= 16)
		{
			// honour the sign of the sample
			sample <<= (32 - inBitsPerSample);
			sample >>= (32 - inBitsPerSample);
			
			// convert to unsigned
			double	midPoint = Math.pow (2.0, (double) (inBitsPerSample - 1));
			
			sample += (int) midPoint;
		}
		
		// scale to 12-bits
		if (inBitsPerSample != 12)
		{
			// scale the sample to 0..1
			double	sampleDouble = (double) sample / Math.pow (2.0, (double) inBitsPerSample);
			
			// scale back up to 12-bits
			sample = (int) (sampleDouble * 4096);
		}
		
		return sample;
	}

	// PRIVATE STATIC FINAL DATA

	private static final int
	kBufferSize = 384;

	// PRIVATE DATA

	private boolean
	isModified = false;
	
	private byte[]
	buffer = new byte [kBufferSize];

	private int
	waveNumber = 0;
	
}

