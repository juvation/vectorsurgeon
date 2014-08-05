// CustomControl.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import javax.swing.JComponent;

import org.w3c.dom.Node;

// CLASS

public abstract class CustomControl
	extends JComponent
{
	public abstract String[]
	getParameterNames ();
	
	public abstract void
	initialise (PatchWindow inPatchWindow, Node inCustomNode)
		throws VSException;
	
	public abstract void
	setParameterValue (String inParameterName, int inParameterValue);
	
	public abstract void
	updateFromPatch ();
	
}



