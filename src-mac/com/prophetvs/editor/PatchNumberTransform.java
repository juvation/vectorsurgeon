// PatchNumberTransform.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.util.List;

// CLASS

public class PatchNumberTransform 
	implements Transform
{
	public String[]
	getTransformParameterNames ()
	{
		return new String [0];
	}
	
	public int
	transformParameter (String inParameterName, List<String> inTransformParameters,
		int inPatchNumber, int inParameterSize)
		throws VSException
	{
		return inPatchNumber;
	}

}

