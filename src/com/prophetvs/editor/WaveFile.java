// WaveFile.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class WaveFile
{
	// STATIC METHODS
	
	public static void
	export (Wave inWave, File outFile)
		throws Exception
	{
		FileOutputStream	fos = new FileOutputStream (outFile);
		
		try
		{
			// RIFF magic
			write4ByteLiteral ("RIFF", fos);
		
			// RIFF chunk size
			// 44 (RIFF chunk + fmt chunk)
			// -8 (exclude RIFF magic and RIFF size)
			// +256 VS wave data converted to 16-bit
			write4ByteLittleEndianInteger (44 - 8 + 256, fos);
		
			// WAVE magic
			write4ByteLiteral ("WAVE", fos);

			// fmt magic
			write4ByteLiteral ("fmt ", fos);

			// size of fmt chunk
			write4ByteLittleEndianInteger (16, fos);
		
			// data format - PCM
			write2ByteLittleEndianInteger (1, fos);
		
			// channel count
			write2ByteLittleEndianInteger (1, fos);

			// sample rate - er what
			write4ByteLittleEndianInteger (44100, fos);
		
			// (sample Rate * bitsPerSample * channels) / 8
			write4ByteLittleEndianInteger (88200, fos);
		
			// (bits per sample * channels) / 8
			write2ByteLittleEndianInteger (2, fos);

			// bits per sample
			write2ByteLittleEndianInteger (16, fos);

			// data magic
			write4ByteLiteral ("data", fos);

			// data size
			write4ByteLittleEndianInteger (256, fos);
		
			// wave data
			// WAVE files don't support 12 bits
			// so we convert to 16-bit
			
			for (int i = 0; i < 128; i++)
			{
				double	sample = (double) inWave.getSample (i);

				sample /= 4096;
				sample *= 65536;
				
				write2ByteLittleEndianInteger ((int) sample, fos);
			}
		}
		finally
		{
			fos.close ();
		}
	}
	
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
	
	private static void
	write4ByteLiteral (String inLiteral, OutputStream outStream)
		throws IOException
	{
		byte[]	bytes = inLiteral.getBytes();
		
		outStream.write (bytes [0]);
		outStream.write (bytes [1]);
		outStream.write (bytes [2]);
		outStream.write (bytes [3]);
	}
	
	private static void
	write2ByteLittleEndianInteger (int inInteger, OutputStream outStream)
		throws IOException
	{
		outStream.write (inInteger & 0xff);
		outStream.write ((inInteger >> 8) & 0xff);
	}

	private static void
	write4ByteLittleEndianInteger (int inInteger, OutputStream outStream)
		throws IOException
	{
		outStream.write (inInteger & 0xff);
		outStream.write ((inInteger >> 8) & 0xff);
		outStream.write ((inInteger >> 16) & 0xff);
		outStream.write ((inInteger >> 24) & 0xff);
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

