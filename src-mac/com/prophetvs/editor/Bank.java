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

public class Bank
{
	// PUBLIC CONSTRUCTOR

	public
	Bank (byte[] inBuffer)
		throws IOException, VSException
	{
		this (new ByteArrayInputStream (inBuffer));
	}
	
	public
	Bank (Patch inTemplate)
	{
		for (int i = 0; i < 100; i++)
		{
			this.patches [i] = new Patch (inTemplate);
			this.patches [i].setPatchNumber (i);
		}
		
		cachePatchNames ();
	}

	public
	Bank (InputStream inStream)
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
			|| buffer [2] != 0x0a || buffer [3] > 0x64)
		{
			throw new VSException ("malformed sysex header");
		}

		for (int i = 0; i < 100; i++)
		{
			this.patches [i] = new Patch ();

			this.patches [i].readPatchBuffer (inStream);
			this.patches [i].setPatchNumber (i);
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

		cachePatchNames ();
	}

	// PUBLIC METHODS

	public Patch
	getPatchCopy (int inPatchNumber)
	{
		return new Patch (this.patches [inPatchNumber]);
	}

	public Patch
	getPatch (int inPatchNumber)
	{
		return this.patches [inPatchNumber];
	}

	public String
	getPatchName (int inPatchNumber)
	{
		return getPatch (inPatchNumber).getName ();
	}
	
	// HACK mutable
	public String[]
	getPatchNames ()
	{
		return this.patchNames;
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
	setPatch (Patch inPatch)
	{
		setPatch (inPatch, inPatch.getPatchNumber ());
		
		this.isModified = true;
	}
	
	public void
	setPatch (Patch inPatch, int inPatchNumber)
	{
		this.patches [inPatchNumber] = inPatch;
		this.patchNames [inPatchNumber] = inPatch.getName ();
		
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
		b = 0x64;
		outStream.write (b);

		// write the patch buffers
		for (int i = 0; i < 100; i++)
		{
			Patch	patch = getPatch (i);

			patch.writePatchBuffer (outStream);
		}

		// write the sysex footer
		b = -9;
		outStream.write (b);
	}

	// PRIVATE METHODS
	
	private void
	cachePatchNames ()
	{
		for (int i = 0; i < 100; i++)
		{
			this.patchNames [i] = this.patches [i].getName ();
		}
	}
	
	// PRIVATE DATA

	private boolean
	isModified = false;
	
	private Patch[]
	patches = new Patch [100];
	
	private String[]
	patchNames = new String [100];
	
}


