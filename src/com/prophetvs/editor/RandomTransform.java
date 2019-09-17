// RandomTransform.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.util.List;
import java.util.Random;

// CLASS

public class RandomTransform 
	implements Transform
{
	public String[]
	getTransformParameterNames ()
	{
		String[]	names = new String [2];
		
		names [0] = "Random Min";
		names [1] = "Random Max";
		
		return names;
	}
	
	public int
	transformParameter (Patch inPatch, String inParameterName, List<String> inTransformParameters,
		int inPatchNumber, int inParameterSize)
		throws VSException
	{
		if (this.random == null)
		{
			this.random = new Random ();

			random.setSeed (System.currentTimeMillis ());
		}

		// get some things about the parameter
		Patch.ParameterSpec	parameterSpec = Patch.getParameterSpec (inParameterName);
		
		int	randomMax = parameterSpec.max;
		int	randomMin = parameterSpec.min;

		// check for params

		if (inTransformParameters.size () > 0)
		{
			String	parameterValue = inTransformParameters.get (0);
			
			// saves an expensive try/catch
			if (parameterValue != null)
			{
				try
				{
					randomMin = Math.max
						(parameterSpec.min, Integer.parseInt (parameterValue));
				}
				catch (Throwable inThrowable)
				{
					// randomMin remains at parameterSpec.min
				}
			}
		}

		if (inTransformParameters.size () > 1)
		{
			String	parameterValue = inTransformParameters.get (1);
			
			// saves an expensive try/catch
			if (parameterValue != null)
			{
				try
				{
					randomMax = Math.min
						(parameterSpec.max, Integer.parseInt (parameterValue));
				}
				catch (Exception inException)
				{
					// randomMin remains at parameterSpec.min
				}
			}
		}

		// are the max and min values ok wrt each other?
		randomMax = Math.max (randomMax, randomMin);
		
		// ok what is the relative range of values?
		int	range = randomMax - randomMin;
		range++;
		
		// get a random number in that range
		int	value = Math.abs (this.random.nextInt ()) % range;

		// move into the absolute space
		value += randomMin;

		return value;
	}

	private Random
	random = null;
}

