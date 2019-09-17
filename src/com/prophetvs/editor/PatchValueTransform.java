// PatchValueTransform.java

// sets the value to the value of the given parameter name in the *current* patch
// so if you wanted WaveA to be random, and WaveB to be what you just set WaveA to
// you do it like this
// SUPER ghetto at the moment as the relevant information isn't available
// so you have to copy the name from the parameter popup (eyeroll)

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.util.List;

// CLASS

public class PatchValueTransform 
	implements Transform
{
	public String[]
	getTransformParameterNames ()
	{
		String[]	names = new String [1];
		names [0] = "Parameter Name";
		
		return names;
	}
	
	public int
	transformParameter (Patch inPatch, String inParameterName, List<String> inTransformParameters,
		int inPatchNumber, int inParameterSize)
		throws VSException
	{
		String	parameterName = inTransformParameters.get (0);
		
		if (parameterName == null || parameterName.length () == 0)
		{
			throw new VSException ("no parameter name for PatchValueTransform");
		}
		
		// this throws if we get the parameter name wrong
		return inPatch.getParameterValue (parameterName);
	}

}

