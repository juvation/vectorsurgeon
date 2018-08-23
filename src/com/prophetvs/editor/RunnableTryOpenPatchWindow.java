// RunnableTryOpenPatchWindow.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

// CLASS

public class RunnableTryOpenPatchWindow
implements Runnable
{
	public
	RunnableTryOpenPatchWindow (BankWindow inBankWindow, int inPatchNumber)
	{
		this.bankWindow = inBankWindow;
		this.patchNumber = inPatchNumber;
	}

	// RUNNABLE IMPLEMENTATION

	public void
	run ()
	{
		this.bankWindow.tryOpenPatchWindow (this.patchNumber);
	}

	// PRIVATE DATA

	private int
	patchNumber = 0;
	
	private BankWindow
	bankWindow = null;
}


