// Transform.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.util.List;

// CLASS

public interface Transform 
{
	public abstract String[]
	getTransformParameterNames ();
	
	public abstract int
	transformParameter (Patch inPatch, String inParameter, List<String> inParameters,
		int inPatchNumber, int inParameterSize)
		throws VSException;

}

