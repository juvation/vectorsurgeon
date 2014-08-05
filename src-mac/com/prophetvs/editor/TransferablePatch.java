// TransferablePatch.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.UnsupportedFlavorException;

// CLASS

public class TransferablePatch
	implements Transferable
{
	public
	TransferablePatch (Patch inPatch)
	{
		this.patch = inPatch;
	}
	
	// TRANSFERABLE IMPLEMENTATION
	
	public Object
	getTransferData (DataFlavor inFlavor)
		throws UnsupportedFlavorException
	{
		if (inFlavor.getRepresentationClass () != Patch.class)
		{
			// huh? why not just return null here?
			throw new UnsupportedFlavorException (inFlavor);
		}
		
		return this.patch;
	}
	
	public DataFlavor[]
	getTransferDataFlavors ()
	{
		DataFlavor[]	flavors = new DataFlavor [1];
		flavors [0] = new DataFlavor (Patch.class, "Prophet VS Patch");
		
		return flavors;
	}
	
	public boolean
	isDataFlavorSupported (DataFlavor inFlavor)
	{
		return (inFlavor.getRepresentationClass () == Patch.class);
	}
	
	// PRIVATE DATA
	
	private Patch
	patch = null;
	
}

