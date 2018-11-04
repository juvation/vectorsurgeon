// CustomControl.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.util.ArrayList;
import java.util.List;

import javax.swing.JComponent;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

import org.w3c.dom.Node;

// CLASS

public abstract class CustomControl
	extends JComponent
{
	// PUBLIC ABSTRACT METHODS
	
	public abstract String[]
	getParameterNames ();
	
	public abstract void
	initialise (PatchWindow inPatchWindow, Node inCustomNode)
		throws VSException;
	
	public abstract void
	setParameterValue (String inParameterName, int inParameterValue);
	
	// PUBLIC METHODS
	
	public void
	addChangeListener (ChangeListener inChangeListener)
	{
		this.changeListeners.add (inChangeListener);
	}
	
	public void
	removeChangeListener (ChangeListener inChangeListener)
	{
		this.changeListeners.remove (inChangeListener);
	}

	// PROTECTED METHODS
	
	protected void
	fireChangeEvent (String inParameterName, int inParameterValue)
	{
		ChangeEvent	changeEvent
			= new CustomControlChangeEvent (this, inParameterName, inParameterValue);
		
		for (ChangeListener changeListener : this.changeListeners)
		{
			changeListener.stateChanged (changeEvent);
		}
	}
				
	// PRIVATE DATA
	
	private List<ChangeListener>
	changeListeners = new ArrayList<ChangeListener> ();
	
}



