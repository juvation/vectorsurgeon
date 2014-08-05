// TransferableWave.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.UnsupportedFlavorException;

// CLASS

public class TransferableWave
	implements Transferable
{
	public
	TransferableWave (Wave inWave)
	{
		this.wave = inWave;
	}
	
	// TRANSFERABLE IMPLEMENTATION
	
	public Object
	getTransferData (DataFlavor inFlavor)
		throws UnsupportedFlavorException
	{
		if (inFlavor.getRepresentationClass () != Wave.class)
		{
			// huh? why not just return null here?
			throw new UnsupportedFlavorException (inFlavor);
		}
		
		return this.wave;
	}
	
	public DataFlavor[]
	getTransferDataFlavors ()
	{
		DataFlavor[]	flavors = new DataFlavor [1];
		flavors [0] = new DataFlavor (Wave.class, "Prophet VS Wave");
		
		return flavors;
	}
	
	public boolean
	isDataFlavorSupported (DataFlavor inFlavor)
	{
		return (inFlavor.getRepresentationClass () == Wave.class);
	}
	
	// PRIVATE DATA
	
	private Wave
	wave = null;
	
}

