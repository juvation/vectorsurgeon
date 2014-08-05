// Machine.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

// CLASS

public class Machine
{
	// PUBLIC STATIC METHODS
	
	public static byte[]
	makeEnableParametersMessage ()
	{
		byte[]	buffer = new byte [4];
		
		// stupid java thinks that bytes are signed
		
		// SYSEX header
		buffer [0] = -16;
		
		// Sequential ID
		buffer [1] = 0x01;

		// enable all MIDI
		buffer [2] = 0x7e;
		
		// EOX
		buffer [3] = -9;
		
		return buffer;
	}
	
	public static byte[]
	makeBankDumpRequestMessage ()
	{
		byte[]	buffer = new byte [5];
		
		// stupid java thinks that bytes are signed
		
		// SYSEX header
		buffer [0] = -16;
		
		// Sequential ID
		buffer [1] = 0x01;

		// program dump
		buffer [2] = 0x00;
		
		// program number - 0x64 == all
		buffer [3] = 0x64;
		
		// EOX
		buffer [4] = -9;
		
		return buffer;
	}
	
	public static byte[]
	makeBankDumpMessage (Bank inBank)
	{
		ByteArrayOutputStream	bos = null;
		
		try
		{
			bos = new ByteArrayOutputStream ();
			inBank.write (bos);
		}
		catch (Exception inException)
		{
			// on a BOS? huh?
		}
		
		byte[]	buffer = bos.toByteArray ();
		
		return buffer;
	}
	
	public static byte[][]
	makeParameterChangeMessage (int inMidiChannel0, String inParameterName, int inValue)
		throws VSException
	{
		byte[][]	messages = new byte [4][3];
		
		Patch.ParameterSpec	parameterSpec = Patch.getParameterSpec (inParameterName);
		int	parameterLSB = parameterSpec.parameterNumber & 0xff;
		int	parameterMSB = (parameterSpec.parameterNumber >> 8) & 0xff;
		
// System.err.println ("transmitting parameter MSB 0x" + Integer.toHexString (parameterMSB));
// System.err.println ("transmitting parameter LSB 0x" + Integer.toHexString (parameterLSB));

		// parameter select LSB
		messages [0] = new byte [3];
		messages [0][0] = (byte) (0xb0 | inMidiChannel0);
		messages [0][1] = (byte) 0x62;
		messages [0][2] = (byte) parameterLSB;

		messages [1] = new byte [3];
		messages [1][0] = (byte) (0xb0 | inMidiChannel0);
		messages [1][1] = (byte) 0x63;
		messages [1][2] = (byte) parameterMSB;
		
		// ok now the data entry slider bit
		// this has a resolution of 8 bits
		// we must use all the resolution
		// no matter what the parameter size
		// weird eh?
		
		// HACK convert to positive range
		if (parameterSpec.size == 8 && parameterSpec.range == 199)
		{
			inValue += 99;
		}
		
		if (parameterSpec.size == 7 && parameterSpec.range == 127)
		{
			inValue += 63;
		}

		// get some more resolution
		double	doubleValue = (double) inValue;
		
		// convert to range-based units
		doubleValue /= parameterSpec.range;
		
		// scale up to 8 bit range
		doubleValue *= 256;
		
		// and now back to integerland
		inValue = (int) Math.ceil (doubleValue);

		// the msb is bits 8:1
		int	valueMSB = (byte) ((inValue >> 1) & 0x7f);
		
		// the lsb is bit 0 shifted
		int	valueLSB = (byte) ((inValue & 0x01) << 6);

// System.err.println ("transmitting data MSB " + valueMSB);
// System.err.println ("transmitting data LSB " + valueLSB);

		messages [2][0] = (byte) (0xb0 | inMidiChannel0);
		messages [2][1] = (byte) 0x26;
		messages [2][2] = (byte) valueLSB;

		messages [3][0] = (byte) (0xb0 | inMidiChannel0);
		messages [3][1] = (byte) 0x06;
		messages [3][2] = (byte) valueMSB;
		
		return messages;
	}
	
	public static byte[]
	makePatchDumpMessage (Patch inPatch)
	{
		ByteArrayOutputStream	bos = null;
		
		try
		{
			bos = new ByteArrayOutputStream ();
			inPatch.write (bos);
		}
		catch (Exception inException)
		{
			// on a BOS? huh?
		}
		
		byte[]	buffer = bos.toByteArray ();
		
		return buffer;
	}
	
	public static byte[][]
	makePatchNameChangeMessage (int inMidiChannel0, String inPatchName)
		throws VSException
	{
		// convert patch name to upper case
		String	patchName = inPatchName.toUpperCase ();
		
		byte[][]	messageList = new byte [32][3];

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
			
			byte[][]	messages = makeParameterChangeMessage
				(inMidiChannel0, parameterName, parameterValue);
				
			if (messages != null)
			{
				for (int j = 0; j < messages.length; j++)
				{
					messageList [(i * 4) + j][0] = messages [j][0];
					messageList [(i * 4) + j][1] = messages [j][1];
					messageList [(i * 4) + j][2] = messages [j][2];
				}
			}
		}
		
		return messageList;
	}
	
	public static byte[]
	makeWaveBankDumpMessage (WaveBank inWaveBank)
	{
		ByteArrayOutputStream	bos = null;
		
		try
		{
			bos = new ByteArrayOutputStream ();
			inWaveBank.write (bos);
		}
		catch (Exception inException)
		{
			// on a BOS? huh?
		}
		
		byte[]	buffer = bos.toByteArray ();
		
		return buffer;
	}
	
	public static byte[]
	makeWaveBankDumpRequestMessage ()
	{
		byte[]	buffer = new byte [5];
		
		// stupid java thinks that bytes are signed
		
		// SYSEX header
		buffer [0] = -16;
		
		// Sequential ID
		buffer [1] = 0x01;

		// program dump
		buffer [2] = 0x00;
		
		// program number - 0x74 == all waves
		buffer [3] = 0x7f;
		
		// EOX
		buffer [4] = -9;

		return buffer;
	}
	
}


