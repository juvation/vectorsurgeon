// CustomControlChangeEvent.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import javax.swing.JComponent;
import javax.swing.event.ChangeEvent;

// CLASS

public class CustomControlChangeEvent
extends ChangeEvent
{
	// PUBLIC CONSTRUCTOR

	public
	CustomControlChangeEvent (Object inSource, String inParameterName, int inParameterValue)
	{
		super (inSource);
		
		this.parameterName = inParameterName;
		this.parameterValue = inParameterValue;
	}
	
	public String
	getParameterName ()
	{
		return this.parameterName;
	}
	
	public int
	getParameterValue ()
	{
		return this.parameterValue;
	}
					
	// PRIVATE DATA
	
	private String
	parameterName = null;
	
	private int
	parameterValue = 0;
	
}



