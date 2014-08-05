// TransformOperation.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.util.List;

// CLASS

public class TransformOperation 
{
	// PUBLIC CONSTRUCTOR
	
	public
	TransformOperation (String inPatchParameter, String inTransform,
		List<String> inTransformParameters)
	{
		this.patchParameter = inPatchParameter;
		this.transform = inTransform;
		this.transformParameters = inTransformParameters;
	}
	
	// PUBLIC METHODS
	
	public String
	getTransform ()
	{
		return this.transform;
	}
	
	public String
	getPatchParameter ()
	{
		return this.patchParameter;
	}
	
	public List<String>
	getTransformParameters ()
	{
		return this.transformParameters;
	}
	
	// PRIVATE DATA
	
	private String
	patchParameter = null;
	
	private List<String>
	transformParameters = null;
	
	private String
	transform = null;
	
}

