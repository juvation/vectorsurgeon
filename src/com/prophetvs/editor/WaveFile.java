// WaveFile.java

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

public class WaveFile
{
	// CONSTRUCTOR
	
	public
	WaveFile (File inFile)
		throws IOException, VSException
	{
		this.file = inFile;
		
		FileInputStream	fis = null;
		
		try
		{
			fis = new FileInputStream (this.file);
			
			String	riff = read4ByteLiteral (fis);
			
			if (! riff.equalsIgnoreCase ("riff"))
			{
				throw new VSException ("not a wave file (no RIFF magic)");
			}
			
			// skip riff chunk size
			fis.skip (4);
			
			String	format = read4ByteLiteral (fis);
	
			if (! format.equalsIgnoreCase ("wave"))
			{
				throw new VSException ("not a wave file (no WAVE format in RIFF chunk)");
			}
			
			long	fileOffset = 12;
			
			while (fis.available () > 0)
			{
				String	subChunkType = read4ByteLiteral (fis);
				long	subChunkSize = read4ByteLittleEndianInteger (fis);

				fileOffset += 8;
				
				this.chunkToSize.put (subChunkType.toLowerCase (), new Long (subChunkSize));
				this.chunkToOffset.put (subChunkType.toLowerCase (), new Long (fileOffset));
				
				if (subChunkType.equalsIgnoreCase ("fmt "))
				{
					readFMTChunk (fis, subChunkSize);
				}
				else
				{
					fis.skip (subChunkSize);
				}
				
				fileOffset += subChunkSize;
			}
			
			if (this.bitsPerSample != 8
				&& this.bitsPerSample != 12
				&& this.bitsPerSample != 16
				&& this.bitsPerSample != 24)
			{
				throw new VSException ("bits per sample must be 8, 12, 16, or 24");
			}

			if (this.numChannels == 0)
			{
				throw new VSException ("number of channels must be greater than zero");
			}
		}
		finally
		{
			if (fis != null)
			{
				try
				{
					fis.close ();
				}
				catch (Throwable inThrowable)
				{
				}
			}
		}
	}

	// PUBLIC METHODS
	
	public Wave
	makeVSWave ()
		throws IOException
	{
		FileInputStream	fis = null;
		Wave	wave = null;
		
		Long	dataOffsetObject = this.chunkToOffset.get ("data");
		Long	dataSizeObject = this.chunkToSize.get ("data");
		
		if (dataOffsetObject != null && dataSizeObject != null)
		{
			long	dataOffset = dataOffsetObject.longValue ();
			
			try
			{
				fis = new FileInputStream (this.file);
				fis.skip (dataOffset);

				long	dataSize = dataSizeObject.longValue ();
				long	numSamples = dataSize / this.blockAlign;
				
				// by default, WAVEs are little-endian
				wave = new Wave (fis, numSamples, this.bitsPerSample, this.numChannels, true);
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
		}
		
		return wave;
	}
	
	// PRIVATE METHODS
	
	private static String
	read4ByteLiteral (InputStream inStream)
		throws IOException
	{
		byte[]	buffer = new byte [4];
		int	cc = inStream.read (buffer);
		if (cc != 4)
		{
			throw new EOFException ();
		}
		return new String (buffer, 0, 4);
	}

	private static int
	read2ByteLittleEndianInteger (InputStream inStream)
		throws IOException
	{
		int	value = inStream.read ();
		value |= inStream.read () << 8;
		
		return value;
	}

	private static long
	read4ByteLittleEndianInteger (InputStream inStream)
		throws IOException
	{
		int	value = inStream.read ();
		value |= inStream.read () << 8;
		value |= inStream.read () << 16;
		value |= inStream.read () << 24;
		
		return value;
	}

	private void
	readFMTChunk (InputStream inStream, long inSubChunkLength)
		throws IOException
	{
		// audio format
		inStream.skip (2);
		
		// num channels
		this.numChannels = read2ByteLittleEndianInteger (inStream);
		
		// sample rate
		inStream.skip (4);
		
		// byte rate
		inStream.skip (4);
		
		// block align
		this.blockAlign = read2ByteLittleEndianInteger (inStream);
		
		// bits per sample
		this.bitsPerSample = read2ByteLittleEndianInteger (inStream);
		
		// skip the rest of the chunk
		if (inSubChunkLength > 16)
		{
			inStream.skip (inSubChunkLength - 16);
		}
	}
	
	// PRIVATE DATA

	private int
	bitsPerSample = 0;
	
	private int
	blockAlign = 0;
	
	private int
	numChannels = 0;
	
	private File
	file = null;
	
	private Map<String, Long>
	chunkToOffset = new HashMap<String, Long> ();

	private Map<String, Long>
	chunkToSize = new HashMap<String, Long> ();
	
	
}

