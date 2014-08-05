// SetTransform.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.util.List;
import java.util.Random;

// CLASS

public class SetTransform 
	implements Transform
{
	public String[]
	getTransformParameterNames ()
	{
		String[]	names = new String [1];
		
		names [0] = "Value";
		
		return names;
	}
	
	public int
	transformParameter (String inParameterName, List<String> inTransformParameters,
		int inPatchNumber, int inParameterSize)
		throws VSException
	{
		// get some things about the parameter
		Patch.ParameterSpec	parameterSpec = Patch.getParameterSpec (inParameterName);
		
		// check for params
		int	value = parameterSpec.min;

		if (inTransformParameters.size () > 0)
		{
			String	valueString = inTransformParameters.get (0);

			// saves an expensive try/catch
			if (valueString != null)
			{
				try
				{
					value = Integer.parseInt (valueString);
					
					value = Math.min (value, parameterSpec.max);
					value = Math.max (value, parameterSpec.min);
				}
				catch (Throwable inThrowable)
				{
					// value remains at parameterSpec.min
				}
			}
		}
					
		return value;
	}
	
}

