// Patch.java

// VS patch storage class

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

public class Patch
{
	// PUBLIC STATIC METHODS

	// for external clients requesting param specs
	public static Iterator
	getParameterNames ()
	{
		// this is because static{} is broken
		if (sParameterMap == null)
		{
			setupParameters ();
		}

		return sParameterNameList.iterator ();
	}
	
	public static String[]
	getParameterNamesArray ()
	{
		// this is because static{} is broken
		if (sParameterMap == null)
		{
			setupParameters ();
		}

		return (String[]) sParameterNameList.toArray (new String [0]);
	}
	
	// for external clients requesting param specs
	public static String
	getParameterName (int inParameterNumber)
		throws VSException
	{
		// this is because static{} is broken
		if (sParameterMap == null)
		{
			setupParameters ();
		}

		String	name = (String) sParameterNumberMap.get (inParameterNumber);
		
		if (name == null)
		{
			throw new VSException ("parameter " + inParameterNumber + " not found");
		}
		
		return name;
	}

	// for external clients requesting param specs
	public static ParameterSpec
	getParameterSpec (String inParameter)
		throws VSException
	{
		// this is because static{} is broken
		if (sParameterMap == null)
		{
			setupParameters ();
		}

		ParameterSpec	spec = (ParameterSpec) sParameterMap.get (inParameter);
		
		if (spec == null)
		{
			throw new VSException ("parameter " + inParameter + " not found");
		}
		
		return spec;
	}

	public static String
	getWaveName (int inWaveNumber)
	{
		// this is because static{} is broken
		if (sParameterMap == null)
		{
			setupParameters ();
		}

		String	waveName = null;
		
		if (inWaveNumber >= 0 && inWaveNumber < sWaveNameList.size ())
		{
			waveName = sWaveNameList.get (inWaveNumber);
		}
		
		return waveName;
	}
	
	// PUBLIC CONSTRUCTOR

	public
	Patch (byte[] inBuffer)
		throws IOException, VSException
	{
		this (new ByteArrayInputStream (inBuffer));
	}
	
	// this reads the full sysex dump
	// unlike setPatch()
	public
	Patch (InputStream inStream)
		throws IOException, VSException
	{
		// this is because static{} is broken
		if (sParameterMap == null)
		{
			setupParameters ();
		}

		// read the entire patch
		int	count = inStream.read (this.buffer, 0, 169);

		if (count != 169)
		{
			throw new VSException ("short read");
		}

		if (this.buffer [0] != -16 || this.buffer [1] != 0x01
			|| this.buffer [2] != 0x0a)
		{
			throw new VSException ("malformed sysex header");
		}
	}

	// this is stupid
	// java should know how to clone() properly
	public
	Patch (Patch inCopy)
	{
		// this is because static{} is broken
		if (sParameterMap == null)
		{
			setupParameters ();
		}

		System.arraycopy
			(inCopy.buffer, 0, this.buffer, 0, this.buffer.length);
	}

	public
	Patch ()
	{
		// this is because static{} is broken
		if (sParameterMap == null)
		{
			setupParameters ();
		}

		// preroll the sysex header

		// EX header
		// stupid java thinks bytes are signed
		// this.buffer [0] = 0xf0;
		this.buffer [0] = -16;

		// sequential ID
		this.buffer [1] = 0x01;

		// VS patch dump
		this.buffer [2] = 0x0a;

		// patch number
		this.buffer [3] = 0x00;

		// EOX footer
		// stupid java thinks bytes are signed
		// this.buffer [168] = 0xf7;
		this.buffer [168] = -9;
	}

	// PUBLIC METHODS

	public boolean
	isModified ()
	{
		return this.isModified;
	}
	
	public String
	getName ()
	{
		StringBuffer	nameBuffer = new StringBuffer ();
		
		try
		{
			for (int i = 1; i < 9; i++)
			{
				String	parameterName = "Name" + i;
				int	value = getParameterValue (parameterName);
				
				char	nameCharacter;
				
				if (value < 26)
				{
					// it's an uppercase alphabetic character
					nameCharacter = (char) ('A' + value);
				}
				else
				if (value < 31)
				{
					// it's a numeric digit
					value -= 26;
					nameCharacter = (char) ('0' + value);
				}
				else
				{
					// it's the space character
					nameCharacter = ' ';
				}
				
				nameBuffer.append (nameCharacter);
			}
		}
		catch (VSException inException)
		{
			// huh?
			// return whatever's in the buffer
		}
		
		return nameBuffer.toString ();
	}
	
	public int
	getParameterCount ()
	{
		return sParameterNameList.size ();
	}

	public int
	getParameterSize (String inParameter)
		throws VSException
	{
		ParameterSpec	spec = getParameterSpec (inParameter);

		return spec.size;
	}

	public int
	getParameterValue (String inParameter)
		throws VSException
	{
		ParameterSpec	spec = getParameterSpec (inParameter);

		// find the byte offset
		int	byteIndex = 4;
		byteIndex += spec.offset / 4;

		// find the bit offset
		int	bitIndex = spec.offset % 4;

		int	answer = 0;
		int	bit = 0;
		int	bite = 0;
		int	mask = 0;

		for (int i = 0; i < spec.size; i++)
		{
			bite = this.buffer [byteIndex];

			mask = 1 << (3 - bitIndex);
			bit = (bite & mask);

			// shift the bit into position 1
			bit >>= (3 - bitIndex);

			// put the bit in place
			// technically don't need to shift the first time
			// but we'll just be shifting zeroes, so...
			answer = (answer << 1) | bit;

			// next bit
			bitIndex++;

			// roll nybbles if necessary
			if (bitIndex == 4)
			{
				byteIndex++;
				bitIndex = 0;
			}
		}

		// HACK shift sign bits into place on bipolar values
		if (spec.size == 8 && spec.range == 199)
		{
			// shift the sign bit into place
			answer <<= 24;
			answer >>= 24;
		}
		else
		if (spec.size == 7 && spec.range == 127)
		{
			// shift the sign bit into place
			answer <<= 25;
			answer >>= 25;
		}
		
		return answer;
	}

	public int
	getPatchNumber ()
	{
		return (int) this.buffer [3];
	}
	
	public void
	setName (String inName)
	{
		// convert patch name to upper case
		String	patchName = inName.toUpperCase ();
		
		for (int i = 0; i < 8; i++)
		{
			// assume space
			char	ch = ' ';
			
			if (i < patchName.length ())
			{
				ch = patchName.charAt (i);
			}
			
			// assume space
			int	parameterValue = 31;
			
			if (ch >= 'A' && ch <= 'Z')
			{
				parameterValue = (int) (ch - 'A');
			}
			else
			if (ch >= '0' && ch <= '5')
			{
				parameterValue = 26 + (int) (ch - '0');
			}
			else
			{
				// default to space
			}
			
			String	parameterName = "Name" + (i + 1);
			
			try
			{
				setParameterValue (parameterName, parameterValue);
			}
			catch (VSException inException)
			{
				// huh?
			}
		}
	}
	
	public void
	setParameterValue (String inParameterName, int inValue)
		throws VSException
	{
		// check that we're actually changing the value
		int	currentValue = getParameterValue (inParameterName);
		
		if (currentValue != inValue)
		{
			this.isModified = true;

			ParameterSpec	spec = getParameterSpec (inParameterName);
	
			// tweak the value appropriately
			// to ensure we don't overrun the bit space
			// where the size doesn't imply the range

			if (inValue > spec.max)
			{
				inValue = spec.max;
			}
			
			if (inValue < spec.min)
			{
				inValue = spec.min;
			}
			
			// offset into buffer of param values
			int	byteIndex = 4;
			byteIndex += spec.offset / 4;
	
			int	bitIndex = spec.offset % 4;
	
			int	bit = 0;
			int	mask = 0;
	
			for (int i = 0; i < spec.size; i++)
			{
				mask = 1 << (3 - bitIndex);
	
				// zero out the bit in the patch memory
				this.buffer [byteIndex] &= ~mask;
	
				// roll the value bit into the lsb
				bit = inValue >> (spec.size - i - 1);
				
				// isolate it 
				bit &= 0x01;
	
				// shift the into position
				bit <<= (3 - bitIndex);
	
				// wap it in the patch memory
				this.buffer [byteIndex] |= bit;
	
				// next bit
				bitIndex++;
	
				// roll nybbles if necessary
				if (bitIndex == 4)
				{
					byteIndex++;
					bitIndex = 0;
				}
			}
		}
	}

	// mainly used by Bank
	// to set the patch buffer
	// independently of the sysex wrapper
	public void
	readPatchBuffer (InputStream inStream)
		throws IOException
	{
		int	count = inStream.read (this.buffer, 4, 164);

		if (count != 164)
		{
			throw new IOException ("short read");
		}
	}

	public void
	setModified (boolean inIsModified)
	{
		this.isModified = inIsModified;
	}
	
	public void
	setPatchNumber (int inPatchNumber)
	{
		this.buffer [3] = (byte) inPatchNumber;
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
	writePatchBuffer (OutputStream outStream)
		throws IOException
	{
		outStream.write (this.buffer, 4, 164);
	}

	// INNER TYPE

	static class ParameterSpec
	{
		// the range of the parameter can be different from the range the bit size
		// might suggest, and this affects the value scaling when we transmit it
		// over MIDI - hence the extra constructor param
		public
		ParameterSpec (String inName, int inParameterNumber, int inOffset, int inSize, int inRange)
		{
			this.name = inName;
			this.parameterNumber  = inParameterNumber;
			this.offset = inOffset;
			this.size = inSize;
			this.range = inRange;

			// HACK calculate max/min
			
			// HACK shift sign bits into place on bipolar values
			if (this.size == 8 && this.range == 199)
			{
				this.max = 99;
				this.min = -99;
			}
			else
			if (this.size == 7 && this.range == 127)
			{
				this.max = 63;
				this.min = -63;
			}
			else
			{
				this.max = this.range - 1;
			}
		}

		// this is for when the range *does* match the bit size
		public
		ParameterSpec (String inName, int inParameterNumber, int inOffset, int inSize)
		{
			this (inName, inParameterNumber, inOffset, inSize, 1 << inSize);
		}
		
		public String
		name = null;
		
		public int
		max = 0;
		
		public int
		min = 0;
		
		public int
		offset = 0;

		public int
		parameterNumber = 0;
		
		public int
		range = 0;
		
		public int
		size = 0;
	}

	// PRIVATE STATIC METHODS

	private static void
	setupParameters ()
	{
		sParameterMap = new HashMap<String, ParameterSpec> ();
		sParameterNumberMap = new HashMap<Integer, String> ();
		sParameterNameList = new ArrayList<String> ();
		sParameterSpecList = new ArrayList<ParameterSpec> ();

		// HACK
		// the index into the parameter array
		// MUST be the VS parameter number
		
		addParameter ("WaveNumberA", new ParameterSpec (0x00, 0, 7, 128));
		addParameter ("WaveNumberB", new ParameterSpec (0x01, 7, 7, 128));
		addParameter ("WaveNumberC", new ParameterSpec (0x02, 14, 7, 128));
		addParameter ("WaveNumberD", new ParameterSpec (0x03, 21, 7, 128));
		addParameter ("CoarseFrequencyA", new ParameterSpec (0x04, 28, 5, 25));
		addParameter ("CoarseFrequencyB", new ParameterSpec (0x05, 33, 5, 25));
		addParameter ("CoarseFrequencyC", new ParameterSpec (0x06, 38, 5, 25));
		addParameter ("CoarseFrequencyD", new ParameterSpec (0x07, 43, 5, 25));
		addParameter ("FineFrequencyA", new ParameterSpec (0x08, 48, 7, 100));
		addParameter ("FineFrequencyB", new ParameterSpec (0x09, 55, 7, 100));
		addParameter ("FineFrequencyC", new ParameterSpec (0x0a, 62, 7, 100));
		addParameter ("FineFrequencyD", new ParameterSpec (0x0b, 69, 7, 100));

		addParameter ("FilterCutoff", new ParameterSpec (0x0c, 76, 7, 100));
		addParameter ("FilterResonance", new ParameterSpec (0x0d, 83, 7, 100));
		addParameter ("FilterEnvAmount", new ParameterSpec (0x0e, 90, 7, 100));

		addParameter ("LFO1Shape", new ParameterSpec (0x0f, 97, 3, 5));
		addParameter ("LFO2Shape", new ParameterSpec (0x10, 100, 3, 5));
		addParameter ("LFO1Rate", new ParameterSpec (0x11, 103, 7, 100));
		addParameter ("LFO2Rate", new ParameterSpec (0x12, 110, 7, 100));

		addParameter ("AmpEnvRate1", new ParameterSpec (0x13, 117, 7, 100));
		addParameter ("AmpEnvRate2", new ParameterSpec (0x14, 124, 7, 100));
		addParameter ("AmpEnvRate3", new ParameterSpec (0x15, 131, 7, 100));
		addParameter ("AmpEnvRate4", new ParameterSpec (0x16, 138, 7, 100));
		addParameter ("AmpEnvRate4A", new ParameterSpec (0x17, 145, 7, 100));
		addParameter ("AmpEnvLevel0", new ParameterSpec (0x18, 152, 7, 100));
		addParameter ("AmpEnvLevel1", new ParameterSpec (0x19, 159, 7, 100));
		addParameter ("AmpEnvLevel2", new ParameterSpec (0x1a, 166, 7, 100));
		addParameter ("AmpEnvLevel3", new ParameterSpec (0x1b, 173, 7, 100));
		addParameter ("AmpEnvLoop", new ParameterSpec (0x1c, 180, 3, 7));
		addParameter ("AmpEnvRepeat", new ParameterSpec (0x1d, 183, 3));

		addParameter ("FilterEnvRate1", new ParameterSpec (0x1e, 186, 7, 100));
		addParameter ("FilterEnvRate2", new ParameterSpec (0x1f, 193, 7, 100));
		addParameter ("FilterEnvRate3", new ParameterSpec (0x20, 200, 7, 100));
		addParameter ("FilterEnvRate4", new ParameterSpec (0x21, 207, 7, 100));
		addParameter ("FilterEnvRate4A", new ParameterSpec (0x22, 214, 7, 100));
		addParameter ("FilterEnvLevel0", new ParameterSpec (0x23, 221, 7, 100));
		addParameter ("FilterEnvLevel1", new ParameterSpec (0x24, 228, 7, 100));
		addParameter ("FilterEnvLevel2", new ParameterSpec (0x25, 235, 7, 100));
		addParameter ("FilterEnvLevel3", new ParameterSpec (0x26, 242, 7, 100));
		addParameter ("FilterEnvLevel4", new ParameterSpec (0x27, 249, 7, 100));
		addParameter ("FilterEnvLoop", new ParameterSpec (0x28, 256, 3, 7));
		addParameter ("FilterEnvRepeat", new ParameterSpec (0x29, 259, 3));

		addParameter ("MixEnvRate1", new ParameterSpec (0x2a, 262, 7, 100));
		addParameter ("MixEnvRate2", new ParameterSpec (0x2b, 269, 7, 100));
		addParameter ("MixEnvRate3", new ParameterSpec (0x2c, 276, 7, 100));
		addParameter ("MixEnvRate4", new ParameterSpec (0x2d, 283, 7, 100));
		addParameter ("MixEnvRate4A", new ParameterSpec (0x2e, 290, 7, 100));
		addParameter ("MixEnvXLevel0", new ParameterSpec (0x2f, 297, 7, 127));
		addParameter ("MixEnvXLevel1", new ParameterSpec (0x30, 304, 7, 127));
		addParameter ("MixEnvXLevel2", new ParameterSpec (0x31, 311, 7, 127));
		addParameter ("MixEnvXLevel3", new ParameterSpec (0x32, 318, 7, 127));
		addParameter ("MixEnvXLevel4", new ParameterSpec (0x33, 325, 7, 127));
		addParameter ("MixEnvYLevel0", new ParameterSpec (0x34, 332, 7, 127));
		addParameter ("MixEnvYLevel1", new ParameterSpec (0x35, 339, 7, 127));
		addParameter ("MixEnvYLevel2", new ParameterSpec (0x36, 346, 7, 127));
		addParameter ("MixEnvYLevel3", new ParameterSpec (0x37, 353, 7, 127));
		addParameter ("MixEnvYLevel4", new ParameterSpec (0x38, 360, 7, 127));
		addParameter ("MixEnvLoop", new ParameterSpec (0x39, 367, 3, 7));
		addParameter ("MixEnvRepeat", new ParameterSpec (0x3a, 370, 3));

		addParameter ("KeyboardMode", new ParameterSpec (0x3b, 373, 2, 3));
		addParameter ("SplitPoint", new ParameterSpec (0x3c, 375, 7, 128));
		addParameter ("LinkProgram", new ParameterSpec (0x3d, 382, 7, 100));
		addParameter ("DoubleModeDetune", new ParameterSpec (0x3e, 389, 5));
		addParameter ("DoubleModeDelay", new ParameterSpec (0x3f, 394, 7, 128));
		addParameter ("UnisonDetune", new ParameterSpec (0x40, 401, 3));
		addParameter ("Glide", new ParameterSpec (0x41, 404, 7, 100));
		addParameter ("ChorusRightLeft", new ParameterSpec (0x42, 411, 2));
		addParameter ("ChorusRate", new ParameterSpec (0x43, 413, 7, 100));
		addParameter ("ChorusDepth", new ParameterSpec (0x44, 420, 7, 100));
		addParameter ("ProgramVolume", new ParameterSpec (0x45, 427, 7, 100));

		addParameter ("Voice1Pan", new ParameterSpec (0x46, 434, 7, 127));
		addParameter ("Voice2Pan", new ParameterSpec (0x47, 441, 7, 127));
		addParameter ("Voice3Pan", new ParameterSpec (0x48, 448, 7, 127));
		addParameter ("Voice4Pan", new ParameterSpec (0x49, 455, 7, 127));
		addParameter ("Voice5Pan", new ParameterSpec (0x4a, 462, 7, 127));
		addParameter ("Voice6Pan", new ParameterSpec (0x4b, 469, 7, 127));
		addParameter ("Voice7Pan", new ParameterSpec (0x4c, 476, 7, 127));
		addParameter ("Voice8Pan", new ParameterSpec (0x4d, 483, 7, 127));

		addParameter ("Name1", new ParameterSpec (0x4e, 490, 5));
		addParameter ("Name2", new ParameterSpec (0x4f, 495, 5));
		addParameter ("Name3", new ParameterSpec (0x50, 500, 5));
		addParameter ("Name4", new ParameterSpec (0x51, 505, 5));
		addParameter ("Name5", new ParameterSpec (0x52, 510, 5));
		addParameter ("Name6", new ParameterSpec (0x53, 515, 5));
		addParameter ("Name7", new ParameterSpec (0x54, 520, 5));
		addParameter ("Name8", new ParameterSpec (0x55, 525, 5));

		addParameter ("ArpRate", new ParameterSpec (0x56, 530, 7, 100));
		addParameter ("ArpMode", new ParameterSpec (0x57, 537, 2));
		addParameter ("ArpScan", new ParameterSpec (0x58, 539, 3));
		addParameter ("ArpOctaves", new ParameterSpec (0x59, 542, 2));
		addParameter ("ArpRepeats", new ParameterSpec (0x5a, 544, 2));
		addParameter ("ArpSplit", new ParameterSpec (0x5b, 546, 2));
		addParameter ("ArpVoicing", new ParameterSpec (0x5c, 548, 1));
		addParameter ("ArpVelocity", new ParameterSpec (0x5d, 549, 1));
		addParameter ("ArpLayer", new ParameterSpec (0x5e, 550, 1));
		addParameter ("ArpRest", new ParameterSpec (0x5f, 551, 1));
		
		addParameter ("LFO1ModAmount", new ParameterSpec (0x60, 552, 7, 100));
		addParameter ("LFO2ModAmount", new ParameterSpec (0x61, 559, 7, 100));
		addParameter ("PressureModAmount", new ParameterSpec (0x62, 566, 8, 199));
		addParameter ("VelocityModAmount", new ParameterSpec (0x63, 574, 8, 199));
		addParameter ("KeyboardModAmount", new ParameterSpec (0x64, 582, 8, 199));
		addParameter ("FilterEnvModAmount", new ParameterSpec (0x65, 590, 8, 199));

		addParameter ("LFO1FreqAMod", new ParameterSpec (0x0100, 607, 1));
		addParameter ("LFO1FreqBMod", new ParameterSpec (0x0101, 606, 1));
		addParameter ("LFO1FreqCMod", new ParameterSpec (0x0102, 605, 1));
		addParameter ("LFO1FreqDMod", new ParameterSpec (0x0103, 604, 1));
		addParameter ("LFO1FilterCutoffMod", new ParameterSpec (0x0104, 603, 1));
		addParameter ("LFO1MixACMod", new ParameterSpec (0x0105, 602, 1));
		addParameter ("LFO1MixBDMod", new ParameterSpec (0x0106, 601, 1));
		addParameter ("LFO1LFO2RateMod", new ParameterSpec (0x0107, 600, 1));
		addParameter ("LFO1LFO2AmountMod", new ParameterSpec (0x0108, 599, 1));
		addParameter ("LFO1PanMod", new ParameterSpec (0x0109, 598, 1));

		addParameter ("LFO2FreqAMod", new ParameterSpec (0x0110, 617, 1));
		addParameter ("LFO2FreqBMod", new ParameterSpec (0x0111, 616, 1));
		addParameter ("LFO2FreqCMod", new ParameterSpec (0x0112, 615, 1));
		addParameter ("LFO2FreqDMod", new ParameterSpec (0x0113, 614, 1));
		addParameter ("LFO2FilterCutoffMod", new ParameterSpec (0x0114, 613, 1));
		addParameter ("LFO2MixACMod", new ParameterSpec (0x0115, 612, 1));
		addParameter ("LFO2MixBDMod", new ParameterSpec (0x0116, 611, 1));
		addParameter ("LFO2LFO1RateMod", new ParameterSpec (0x0117, 610, 1));
		addParameter ("LFO2LFO1AmountMod", new ParameterSpec (0x0118, 609, 1));
		addParameter ("LFO2PanMod", new ParameterSpec (0x0119, 608, 1));

		addParameter ("PressureFreqAMod", new ParameterSpec (0x0120, 632, 1));
		addParameter ("PressureFreqBMod", new ParameterSpec (0x0121, 631, 1));
		addParameter ("PressureFreqCMod", new ParameterSpec (0x0122, 630, 1));
		addParameter ("PressureFreqDMod", new ParameterSpec (0x0123, 629, 1));
		addParameter ("PressureFilterCutoffMod", new ParameterSpec (0x0124, 628, 1));
		addParameter ("PressureMixACMod", new ParameterSpec (0x0125, 627, 1));
		addParameter ("PressureMixBDMod", new ParameterSpec (0x0126, 626, 1));
		addParameter ("PressureLFO1RateMod", new ParameterSpec (0x0127, 625, 1));
		addParameter ("PressureLFO1AmountMod", new ParameterSpec (0x0128, 624, 1));
		addParameter ("PressureLFO2RateMod", new ParameterSpec (0x0129, 623, 1));
		addParameter ("PressureLFO2AmountMod", new ParameterSpec (0x012a, 622, 1));
		addParameter ("PressureAmpEnvMod", new ParameterSpec (0x012b, 621, 1));
		addParameter ("PressurePanMod", new ParameterSpec (0x012c, 620, 1));
		addParameter ("PressureChorusRateMod", new ParameterSpec (0x012d, 619, 1));
		addParameter ("PressureChorusDepthMod", new ParameterSpec (0x012e, 618, 1));
		
		addParameter ("VelocityFilterEnvMod", new ParameterSpec (0x0130, 637, 1));
		addParameter ("VelocityMixACMod", new ParameterSpec (0x0131, 636, 1));
		addParameter ("VelocityMixBDMod", new ParameterSpec (0x0132, 635, 1));
		addParameter ("VelocityAmpEnvMod", new ParameterSpec (0x0133, 634, 1));
		addParameter ("VelocityPanMod", new ParameterSpec (0x0134, 633, 1));

		addParameter ("KeyboardFilterCutoffMod", new ParameterSpec (0x0140, 641, 1));
		addParameter ("KeyboardMixACMod", new ParameterSpec (0x0141, 640, 1));
		addParameter ("KeyboardMixBDMod", new ParameterSpec (0x0142, 639, 1));
		addParameter ("KeyboardPanMod", new ParameterSpec (0x0143, 638, 1));
		
		addParameter ("FilterEnvFreqMod", new ParameterSpec (0x0150, 643, 1));
		addParameter ("FilterEnvPanMod", new ParameterSpec (0x0151, 642, 1));
		
		addParameter ("ModWheelLFO1AmountMod", new ParameterSpec (0x0160, 646, 1));
		addParameter ("ModWheelLFO2AmountMod", new ParameterSpec (0x0161, 645, 1));
		addParameter ("ModWheelChorusDepthMod", new ParameterSpec (0x0162, 644, 1));

		// now set up the wave name list
		sWaveNameList = new ArrayList<String> ();
		
		sWaveNameList.add ("0 User 1");
		sWaveNameList.add ("1 User 2");
		sWaveNameList.add ("2 User 3");
		sWaveNameList.add ("3 User 4");
		sWaveNameList.add ("4 User 5");
		sWaveNameList.add ("5 User 6");
		sWaveNameList.add ("6 User 7");
		sWaveNameList.add ("7 User 8");
		sWaveNameList.add ("8 User 9");
		sWaveNameList.add ("9 User 10");
		sWaveNameList.add ("10 User 11");
		sWaveNameList.add ("11 User 12");
		sWaveNameList.add ("12 User 13");
		sWaveNameList.add ("13 User 14");
		sWaveNameList.add ("14 User 15");
		sWaveNameList.add ("15 User 16");
		sWaveNameList.add ("16 User 17");
		sWaveNameList.add ("17 User 18");
		sWaveNameList.add ("18 User 19");
		sWaveNameList.add ("19 User 20");
		sWaveNameList.add ("20 User 21");
		sWaveNameList.add ("21 User 22");
		sWaveNameList.add ("22 User 23");
		sWaveNameList.add ("23 User 24");
		sWaveNameList.add ("24 User 25");
		sWaveNameList.add ("25 User 26");
		sWaveNameList.add ("26 User 27");
		sWaveNameList.add ("27 User 28");
		sWaveNameList.add ("28 User 29");
		sWaveNameList.add ("29 User 30");
		sWaveNameList.add ("30 User 31");
		sWaveNameList.add ("31 User 32");
		sWaveNameList.add ("32 Sine");
		sWaveNameList.add ("33 Saw");
		sWaveNameList.add ("34 Square");
		sWaveNameList.add ("35 Bell 1");
		sWaveNameList.add ("36 Bell 2");
		sWaveNameList.add ("37 Mellow Bell 1");
		sWaveNameList.add ("38 Bell 3");
		sWaveNameList.add ("39 Bell 4");
		sWaveNameList.add ("40 Reed 1");
		sWaveNameList.add ("41 Reed 2");
		sWaveNameList.add ("42 Reed 3");
		sWaveNameList.add ("43 Reed 4");
		sWaveNameList.add ("44 Bell 5");
		sWaveNameList.add ("45 HP Saw");
		sWaveNameList.add ("46 Hi BP Saw");
		sWaveNameList.add ("47 Hi BP Square");
		sWaveNameList.add ("48 Voice");
		sWaveNameList.add ("49 Accordion");
		sWaveNameList.add ("50 Mellow Bell 2");
		sWaveNameList.add ("51 Lifeless Saw");
		sWaveNameList.add ("52 Bright Wave 1");
		sWaveNameList.add ("53 Bright Wave 2");
		sWaveNameList.add ("54 Bright Wave 3");
		sWaveNameList.add ("55 Medium Wave 1");
		sWaveNameList.add ("56 Inharmonic Bell 1");
		sWaveNameList.add ("57 Medium Wave 2");
		sWaveNameList.add ("58 Bell 6");
		sWaveNameList.add ("59 Mellow Bell 3");
		sWaveNameList.add ("60 Bell 7");
		sWaveNameList.add ("61 Bright Wave 4");
		sWaveNameList.add ("62 Bright Wave 5");
		sWaveNameList.add ("63 Mellow Bell 4");
		sWaveNameList.add ("64 Bell 8");
		sWaveNameList.add ("65 Church Organ");
		sWaveNameList.add ("66 Bright Wave 6");
		sWaveNameList.add ("67 Mellow Wave 1");
		sWaveNameList.add ("68 Mellow Wave 2");
		sWaveNameList.add ("69 Bright Wave 7");
		sWaveNameList.add ("70 Clarinet");
		sWaveNameList.add ("71 Mellow Wave 3");
		sWaveNameList.add ("72 Mellow Wave 4");
		sWaveNameList.add ("73 Sax");
		sWaveNameList.add ("74 Mellow Wave 5");
		sWaveNameList.add ("75 Cheesy Wave 1");
		sWaveNameList.add ("76 Cheesy Wave 2");
		sWaveNameList.add ("77 Cheesy Wave 3");
		sWaveNameList.add ("78 Cheesy Wave 4");
		sWaveNameList.add ("79 Cheesy Wave 5");
		sWaveNameList.add ("80 Cheesy Wave 6");
		sWaveNameList.add ("81 Harmonica 1");
		sWaveNameList.add ("82 Harmonica 2");
		sWaveNameList.add ("83 Mellow Wave 5");
		sWaveNameList.add ("84 Nasal 1");
		sWaveNameList.add ("85 Nasal 2");
		sWaveNameList.add ("86 Bright Wave 8");
		sWaveNameList.add ("87 Bright wave 9");
		sWaveNameList.add ("88 Bright Wave 10");
		sWaveNameList.add ("89 Mellow Bell 5");
		sWaveNameList.add ("90 Mellow Bell 6");
		sWaveNameList.add ("91 Inharmonic Bell 2");
		sWaveNameList.add ("92 Nasal 3");
		sWaveNameList.add ("93 Bright Wave 11");
		sWaveNameList.add ("94 Mellow Bell 7");
		sWaveNameList.add ("95 Mellow Wave 6");
		sWaveNameList.add ("96 Super Mellow 1");
		sWaveNameList.add ("97 Mellow Wave 7");
		sWaveNameList.add ("98 Cheesy Wave 7");
		sWaveNameList.add ("99 Sparkle Pad");
		sWaveNameList.add ("100 Bell 9");
		sWaveNameList.add ("101 Nasal 4");
		sWaveNameList.add ("102 Nasal 5");
		sWaveNameList.add ("103 Cheesy Wave 8");
		sWaveNameList.add ("104 Cheesy Wave 9");
		sWaveNameList.add ("105 Cheesy Wave 10");
		sWaveNameList.add ("106 Cheesy Wave 11");
		sWaveNameList.add ("107 Cheesy Wave 12");
		sWaveNameList.add ("108 Cheesy Wave 13");
		sWaveNameList.add ("109 Bright Wave 12");
		sWaveNameList.add ("110 Bright Wave 13");
		sWaveNameList.add ("111 Cheesy Wave 13");
		sWaveNameList.add ("112 Cheesy Wave 14");
		sWaveNameList.add ("113 Spectrum");
		sWaveNameList.add ("114 Mellow Bell 8");
		sWaveNameList.add ("115 Cheesy Wave 15");
		sWaveNameList.add ("116 Super Mellow 2");
		sWaveNameList.add ("117 Super Mellow 3");
		sWaveNameList.add ("118 Planetarium");
		sWaveNameList.add ("119 5th reed");
		sWaveNameList.add ("120 Octave Wave");
		sWaveNameList.add ("121 5th Tri + Harm");
		sWaveNameList.add ("122 5th Pulse + Harm");
		sWaveNameList.add ("123 5th Square + Harm");
		sWaveNameList.add ("124 Mellow Wave 8");
		sWaveNameList.add ("125 Inharmonic Bell 3");
		sWaveNameList.add ("126 Silence");
		sWaveNameList.add ("127 White Noise");
		sWaveNameList.add ("");
	}

	private static void
	addParameter (String inParamName, ParameterSpec inParamSpec)
	{
		sParameterNameList.add (inParamName);
		sParameterSpecList.add (inParamSpec);

		sParameterMap.put (inParamName, inParamSpec);
		sParameterNumberMap.put
			(new Integer (inParamSpec.parameterNumber), inParamName);
	}

	// PRIVATE STATIC FINAL DATA

	private static final int
	kBufferSize = 4 + 164 + 1;

	// PRIVATE STATIC DATA

	private static List<String>
	sParameterNameList = null;

	private static List<String>
	sWaveNameList = null;

	private static List<ParameterSpec>
	sParameterSpecList = null;

	private static Map<Integer, String>
	sParameterNumberMap = null;

	private static Map<String, ParameterSpec>
	sParameterMap = null;

	// PRIVATE DATA

	private boolean
	isModified = false;
	
	private byte[]
	buffer = new byte [kBufferSize];

}

