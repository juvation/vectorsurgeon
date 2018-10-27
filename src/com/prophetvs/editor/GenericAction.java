//	GenericAction.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import java.util.Enumeration;
import java.util.Properties;

// CLASS

public class GenericAction
implements ActionListener
{
	public
	GenericAction (String inCommand)
	throws Exception
	{
		System.err.println ("GenericAction(" + inCommand + ")");
		
		this.command = inCommand;
		this.parameters = ControlWindow.getPropertiesResource (inCommand + ".properties");
	}

	// ACTIONLISTENER IMPLEMENTATION
	
	public void
	actionPerformed (ActionEvent inEvent)
	{
		ControlWindow	controlWindow = ControlWindow.getInstance ();
		PatchWindow	patchWindow = controlWindow.getPatchWindow ();

		Enumeration	parameterNames = this.parameters.propertyNames ();
		
		while (parameterNames.hasMoreElements ())
		{
			String	parameterName = (String) parameterNames.nextElement ();
			String	parameterValueString = this.parameters.getProperty (parameterName);
			
			try
			{
				int	parameterValue = Integer.parseInt (parameterValueString);
				
				patchWindow.setParameterValue (parameterName, parameterValue);
			}
			catch (Exception inException)
			{
				System.err.println (this.command + " action: exception setting parameter");
				System.err.println (parameterName + " = " + parameterValueString);
				System.err.println (inException.toString ());
			}
		}
	}
	
	// PRIVATE DATA
	
	private String
	command = null;
	
	private Properties
	parameters = null;
	
}

