// MetaParameters.java

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

public class MetaParameters
{
	// PUBLIC STATIC METHODS
	
	public static MetaParameters
	getInstance ()
	{
		// save the cost of a sync block here
		if (sInstance == null)
		{
			synchronized (sSynchronizer)
			{
				if (sInstance == null)
				{	
					sInstance = new MetaParameters ();
				}
			}
		}

		return sInstance;
	}

	// PRIVATE CONSTRUCTOR
	
	private
	MetaParameters ()
	{
		try
		{
			setupMap ();
		}
		catch (Throwable inThrowable)
		{
			// this isn't critical so we don't burden the user
			// otherwise EVERYTHING has to throw
			System.err.println (inThrowable.toString ());
		}
	}
	
	// PUBLIC METHODS
	
	public List<String>
	get (String inMetaParameterName)
	{
		return map.get (inMetaParameterName);
	}
	
	public String[]
	getNames ()
	{
		return (String[]) this.map.keySet ().toArray (new String [0]);
	}
		
	// PRIVATE METHODS

	private void
	setupMap ()
	throws Exception
	{
		// load the metaparameter map config file
		URL	propertiesURL = ControlWindow.getResource ("metaparameters.properties");
		Properties	properties = new Properties ();

		InputStream	uis = null;
		
		try
		{
			uis = propertiesURL.openStream ();

			properties.load (uis);
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

		Enumeration	names = properties.propertyNames ();

		while (names.hasMoreElements ())
		{
			String	name = (String) names.nextElement ();
			String	namesCSV = properties.getProperty (name);
			String[]	namesArray = namesCSV.split (",", -1);
			
			List<String>	namesList = new ArrayList<String> ();
			
			for (int i = 0; i < namesArray.length; i++)
			{
				namesList.add (namesArray [i].trim ());
			}

			this.map.put (name, namesList);
		}
	}

	// PRIVATE STATIC DATA
	
	private static MetaParameters
	sInstance = null;
	
	private static Object
	sSynchronizer = new Object ();
	
	// PRIVATE DATA

	private Map<String, List<String>>
	map = new HashMap<String, List<String>> ();
	
}

