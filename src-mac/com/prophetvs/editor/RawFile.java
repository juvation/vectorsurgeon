// RawFile.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class RawFile
{
	// CONSTRUCTOR
	
	public
	RawFile (File inFile)
		throws IOException, VSException
	{
		this.file = inFile;
		
		// not much checking we can do, really
		if (this.file.length () < 128)
		{
			throw new VSException ("file must be at least 128 bytes long");
		}

		// cap the size at 2k - supposed to be a single cycle!
		if (this.file.length () > 2048)
		{
			throw new VSException ("file limit is 2048 bytes");
		}
	}

	// PUBLIC METHODS
	
	public Wave
	makeVSWave ()
		throws IOException
	{
		FileInputStream	fis = null;
		Wave	wave = null;
		
		try
		{
				fis = new FileInputStream (this.file);
				
				// endianness doesn't matter, we assume 8 bit
				wave = new Wave (fis, file.length (), 8, 1, false);
		}
		finally
		{
			if (fis != null)
			{
				try
				{
					fis.close ();
				}
				catch (IOException inException)
				{
				}
			}
		}
		
		return wave;
	}

	private File
	file = null;
	
}

