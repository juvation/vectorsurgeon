// VariationGenerator.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.io.InputStream;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

// CLASS

public class VariationGenerator
{
	// PUBLIC STATIC METHODS
	
	public static VariationGenerator
	getInstance ()
		throws VSException
	{
		// save the cost of a sync block here
		if (sInstance == null)
		{
			synchronized (sSynchronizer)
			{
				if (sInstance == null)
				{	
					sInstance = new VariationGenerator ();
				}
			}
		}

		return sInstance;
	}
	
	// PRIVATE CONSTRUCTOR
	
	private
	VariationGenerator ()
		throws VSException
	{
		try
		{
			setupTransformMap ();
		}
		catch (Throwable inThrowable)
		{
			throw new VSException (inThrowable.toString ());
		}
	}
	
	// PUBLIC METHODS
	
	public Bank
	generate (Patch inPatch, List<TransformOperation> inTransformOperations)
		throws Exception
	{
		// skip through the transform list
		// and see if the user wants any name transforms
		boolean	numberPatchNames = true;
		
		for (TransformOperation operation : inTransformOperations)
		{
			String	patchParameterName = operation.getPatchParameter ();
			
			// HACK
			if (patchParameterName.length () == 5
				&& patchParameterName.startsWith ("Name"))
			{
				// the user is doing patch name operations
				// so leave them alone
				numberPatchNames = false;
				break;
			}
		}
		
		char	renameAlphabet = 'A';
		char	renameLetter = 'A';
		
		// make a new bank using our template as... the template
		Bank	bank = new Bank (inPatch);

		// apply the transform map to each patch in turn
		for (int i = 0; i < 100; i++)
		{
			// getting a reference here, not a copy
			Patch	patch = bank.getPatch (i);

			applyTransforms (patch, i, inTransformOperations);
			
			if (numberPatchNames)
			{
				// unfortunately the VS character set only has A-Z, 0-5, and space
				// so we can't renumber 0-100!
				// we do AA-AZ and BA-BZ etc instead
				// sigh
				
				StringBuffer	nameBuffer = new StringBuffer (patch.getName ());
				nameBuffer.setLength (6);
				
				nameBuffer.append (renameAlphabet);
				nameBuffer.append (renameLetter);
				
				if (renameLetter == 'Z')
				{
					// roll alphabets
					renameAlphabet++;
					renameLetter = 'A';
				}
				else
				{
					renameLetter++;
				}
				
				patch.setName (nameBuffer.toString ());
			}
		}

		return bank;
	}
	
	public Transform
	getTransform (String inName)
		throws Exception
	{
		return (Transform) this.transformMap.get (inName);
	}

	public String[]
	getTransformNames ()
	{
		return (String[]) this.transformMap.keySet ().toArray (new String [0]);
	}
	
	// PRIVATE METHODS
	
	private void
	applyTransforms (Patch ioPatch, int inPatchNumber,
		List<TransformOperation> inTransformOperations)
		throws VSException
	{
		for (TransformOperation transformOperation : inTransformOperations)
		{
			String	transformName = transformOperation.getTransform ();
			
			// look up the class for this name
			Transform	transform = this.transformMap.get (transformName);
			
			if (transform == null)
			{
				throw new VSException ("transform name not found: " + transformName);
			}
			
			String	patchParameterName = transformOperation.getPatchParameter ();
			Patch.ParameterSpec	parameterSpec = ioPatch.getParameterSpec (patchParameterName);

			if (parameterSpec == null)
			{
				throw new VSException
					("transform parameter name not found: " + patchParameterName);
			}
			
			// apply the transform
			int	newParameterValue = transform.transformParameter (patchParameterName,
				transformOperation.getTransformParameters (), inPatchNumber, parameterSpec.size);
				
			ioPatch.setParameterValue (patchParameterName, newParameterValue);
		}
	}

	private void
	setupTransformMap ()
		throws ClassNotFoundException, IllegalAccessException, InstantiationException, IOException
	{
		// load the transform map config file
		URL	transformPropertiesURL = ControlWindow.getResource ("transforms.properties");
		
		InputStream	uis = null;
		Properties	transformProperties = new Properties ();
		
		try
		{
			uis = transformPropertiesURL.openStream ();

			transformProperties.load (uis);
		}
		finally
		{
			if (uis != null)
			{
				try
				{
					uis.close ();
				}
				catch (Throwable inThrowable)
				{
				}
			}
		}

		this.transformMap = new HashMap<String, Transform> ();

		Enumeration	propertyNames
			= transformProperties.propertyNames ();

		while (propertyNames.hasMoreElements ())
		{
			String	transformName
				= (String) propertyNames.nextElement ();

			String	transformClassName
				= transformProperties.getProperty (transformName);

			Class	transformClass = Class.forName (transformClassName);

			Transform	transform = (Transform) transformClass.newInstance ();
			this.transformMap.put (transformName, transform);
		}
	}

	// PRIVATE STATIC DATA
	
	private static VariationGenerator
	sInstance = null;
	
	private static Object
	sSynchronizer = new Object ();
	
	// PRIVATE DATA
	
	private Map<String, Transform>
	transformMap = null;
	
}

