// JSONWriter.java

// IMPORTS

import java.io.File;
import java.io.FileWriter;
import java.io.OutputStream;
import java.io.IOException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;

// CLASS

// wrapper around Jackson's utilities
// note the assumption that the top-level thing is a JSON object
// and not, say, an array or primitive

public class JSONWriter
{
	public static void
	write (Object inObject, File outFile)
	throws IOException
	{
		write (inObject, new FileWriter (outFile));
	}

	public static void
	write (Object inObject, Writer outWriter)
	throws IOException
	{
		JsonFactory	factory = new JsonFactory ();
		JsonGenerator	generator = factory.createGenerator (outWriter);
		writeValue (inObject, generator);
		generator.flush ();
	}

	public static void
	writePretty (Object inObject, File outFile)
	throws IOException
	{
		writePretty (inObject, new FileWriter (outFile));
	}

	public static void
	writePretty (Object inObject, Writer outWriter)
	throws IOException
	{
		JsonFactory	factory = new JsonFactory ();
		JsonGenerator	generator = factory.createGenerator (outWriter);
		generator.setPrettyPrinter (new DefaultPrettyPrinter ());
		writeValue (inObject, generator);
		generator.flush ();
	}

	// PRIVATE STATIC METHODS
	
	private static void
	writeValue (Object inObject, JsonGenerator inGenerator)
	throws IOException
	{
		if (inObject instanceof Map)
		{
			Map<String, Object>	object = (Map<String, Object>) inObject;
			
			inGenerator.writeStartObject ();
			
			for (String key : object.keySet ())
			{
				inGenerator.writeFieldName (key);
				writeValue (object.get (key), inGenerator);
			}
			
			inGenerator.writeEndObject ();
		}
		else
		if (inObject instanceof List)
		{
			List<Object>	array = (List<Object>) inObject;
			
			inGenerator.writeStartArray ();
			
			for (Object object : array)
			{
				writeValue (object, inGenerator);
			}
			
			inGenerator.writeEndArray ();
		}
		else
		if (inObject instanceof String)
		{
			inGenerator.writeString ((String) inObject);
		}
		else
		if (inObject instanceof Integer)
		{
			inGenerator.writeNumber ((Integer) inObject);
		}
		else
		if (inObject instanceof Long)
		{
			inGenerator.writeNumber ((Long) inObject);
		}
		else
		if (inObject instanceof Double)
		{
			inGenerator.writeNumber ((Double) inObject);
		}
		else
		if (inObject instanceof Float)
		{
			inGenerator.writeNumber ((Float) inObject);
		}
		else
		if (inObject instanceof Boolean)
		{
			inGenerator.writeBoolean ((Boolean) inObject);
		}
		else
		if (inObject == null)
		{
			inGenerator.writeNull ();
		}
		else
		{
			System.err.println ("unsupported object type: " + inObject.getClass ().getName ());
			inGenerator.writeNull ();
		}
	}

	private static final String
	TAG = "JSONWriter";
		
}

