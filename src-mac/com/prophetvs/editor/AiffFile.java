// AiffFile.java

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

public class AiffFile
{
	// CONSTRUCTOR
	
	public
	AiffFile (File inFile)
		throws IOException, VSException
	{
		this.file = inFile;
		
		FileInputStream	fis = null;
		
		try
		{
			fis = new FileInputStream (this.file);
			
			String	riff = read4ByteLiteral (fis);
			
			if (! riff.equalsIgnoreCase ("form"))
			{
				throw new VSException ("not an aiff file (no FORM magic)");
			}
			
			int	riffChunkSize = read4ByteBigEndianInteger (fis);
			
			String	format = read4ByteLiteral (fis);
	
			if (format.equalsIgnoreCase ("aiff"))
			{
				this.littleEndian = false;
			}
			else
			if (format.equalsIgnoreCase ("aifc"))
			{
				// new-fangled little endian sowt file
				this.littleEndian = true;
			}
			else
			{
				throw new VSException ("not an aiff file (no AIFF/AIFC format in FORM chunk)");
			}
			
			long	fileOffset = 12;
			
			while (fis.available () > 0)
			{
				String	subChunkType = read4ByteLiteral (fis);
				long	subChunkSize = read4ByteBigEndianInteger (fis);

System.err.println ("found chunk type " + subChunkType);
System.err.println ("found chunk size " + subChunkSize);

				fileOffset += 8;
				
				this.chunkToSize.put (subChunkType.toLowerCase (), new Long (subChunkSize));
				this.chunkToOffset.put (subChunkType.toLowerCase (), new Long (fileOffset));
				
				if (subChunkType.equalsIgnoreCase ("comm"))
				{
					readCOMMChunk (fis, subChunkSize);
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
			
			// check there's a SSND chunk
			Long	dataOffsetObject = this.chunkToOffset.get ("ssnd");
			
			if (dataOffsetObject == null)
			{
				throw new VSException ("missing ssnd chunk");
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
		
		Long	dataOffsetObject = this.chunkToOffset.get ("ssnd");
		Long	dataSizeObject = this.chunkToSize.get ("ssnd");
		
		if (dataOffsetObject != null && dataSizeObject != null)
		{
			long	dataOffset = dataOffsetObject.longValue ();
			
			try
			{
				fis = new FileInputStream (this.file);
				fis.skip (dataOffset);
				
				// the SSND chunk isn't just linear audio
				// so now we need to read a few things
				int	commentOffset = read4ByteBigEndianInteger (fis);
				
				// skip the block size as the spec size it's always zero
				fis.skip (4);
				
				// skip the comment whose size we found earlier
				fis.skip (commentOffset);
				
				// big endian for AIFF
				// little endian for AIFC
				wave = new Wave (fis, this.numFrames, this.bitsPerSample, this.numChannels, this.littleEndian);
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
	
	private static int
	read2ByteBigEndianInteger (InputStream inStream)
		throws IOException
	{
		int	value = inStream.read () << 8;
		value |= inStream.read ();
		
		return value;
	}

	private static int
	read4ByteBigEndianInteger (InputStream inStream)
		throws IOException
	{
		int	value = inStream.read () << 24;
		value |= inStream.read () << 16;
		value |= inStream.read () << 8;
		value |= inStream.read ();
		
		return value;
	}

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

	private void
	readCOMMChunk (InputStream inStream, long inSubChunkLength)
		throws IOException, VSException
	{
		// num channels
		this.numChannels = read2ByteBigEndianInteger (inStream);
		
		// num frames
		this.numFrames = read4ByteBigEndianInteger (inStream);
		
		// bits per sample
		this.bitsPerSample = read2ByteBigEndianInteger (inStream);
		
		// sample rate - 80bit extended floating point
		inStream.skip (10);
		
		if (inSubChunkLength > 18)
		{
			// compression type
			String	compressionType = read4ByteLiteral (inStream);

			// compression name - pstring!
			String	compressionName = null;
			int	nameLength = inStream.read ();
			
			if (nameLength > 0)
			{
				byte[]	nameBuffer = new byte [nameLength];
				
				inStream.read (nameBuffer);
				
				compressionName = new String (nameBuffer, 0, nameLength);
			}

			// we may need to read a pstring pad byte
			if (((nameLength + 1) % 2) == 1)
			{
				inStream.skip (1);
			}
			
			if (! compressionType.equalsIgnoreCase ("sowt"))
			{
				if (compressionName == null || compressionName.length () == 0)
				{
					throw new VSException ("compression type " + compressionType + " not supported");
				}
				else
				{
					throw new VSException ("compression name " + compressionName + " not supported");
				}
			}
		}
		
		if (inSubChunkLength > 24)
		{
			inStream.skip (inSubChunkLength - 24);
		}
	}
	
	// PRIVATE DATA

	private boolean
	littleEndian = false;
	
	private int
	bitsPerSample = 0;
	
	private int
	numChannels = 0;
	
	private long
	numFrames = 0;
	
	private File
	file = null;
	
	private Map<String, Long>
	chunkToOffset = new HashMap<String, Long> ();

	private Map<String, Long>
	chunkToSize = new HashMap<String, Long> ();
	
	
}

