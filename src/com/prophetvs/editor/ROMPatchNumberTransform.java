// ROMPatchNumberTransform.java

// returns a patch number in the ROM range (32-127)

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.util.List;

// CLASS

public class ROMPatchNumberTransform 
	implements Transform
{
	public String[]
	getTransformParameterNames ()
	{
		return new String [0];
	}
	
	public int
	transformParameter (Patch inPatch, String inParameterName, List<String> inTransformParameters,
		int inPatchNumber, int inParameterSize)
		throws VSException
	{
		int	value = inPatchNumber + 32;
		
		if (value > 127)
		{
			value = 127;
		}
		
		return value;
	}
	
}

