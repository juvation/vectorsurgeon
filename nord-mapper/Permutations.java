
// in order to CALCULATE this rather than looking it up


public class Permutations
{
	public static void
	main (String[] inArgs)
	throws Exception
	{
		int[]	parameters = {4, 5, 6, 7};
		int[]	values = {0, 12, 24};
		int[]	indexes = {0, 0, 0, 0};
		int	cores = 4;
		
		boolean	found = false;
		
		do
		{
			found = false;
			output (parameters, values, indexes);
			
			for (int i = 0; i < indexes.length; i++)
			{
				if (indexes [i] < (values.length - 1))
				{
					indexes [i]++;
					found = true;
					break;
				}
				else
				{
					// blown this index, reset it
					indexes [i] = 0;
				}
			}
		}
		while (found);
		
		// so the other way is to generate from a master index
		// 0-127
		// which we expand to 0-255 to get an integral number of bits per field
		// note our indexes start as 4 options and are trimmed to 3
		for (int i = 0; i < 255; i++)
		{
			int	a = i & 0x3;
			a *= 2;
			a /= 3;
			int	b = (i >> 2) & 0x3;
			b *= 2;
			b /= 3;
			int	c = (i >> 4) & 0x3;
			c *= 2;
			c /= 3;
			int	d = (i >> 6) & 0x3;
			d *= 2;
			d /= 3;
			
			System.out.print (i + " {");
			System.out.print (values [a] + ",");
			System.out.print (values [b] + ",");
			System.out.print (values [c] + ",");
			System.out.print (values [d]);
			System.out.println ("}");
		}
	}
	
	private static void
	output (int[] inParameters, int[] inValues, int[] inIndexes)
	{
		int	serial = inIndexes [0];
		
		serial += (inIndexes [1] * inValues.length);
		serial += (inIndexes [2] * inValues.length * inValues.length);
		serial += (inIndexes [3] * inValues.length * inValues.length * inValues.length);
		
		System.out.print (serial + " {");

		for (int i = 0; i < inIndexes.length; i++)
		{
			if (i > 0)
			{
				System.out.print (",");
			}
			
			System.out.print (inValues [inIndexes [i]]);
		}

		System.out.println ("}");
	}

	private static void
	output2 (int[] inParameters, int[] inValues, int[] inIndexes)
	{
		System.out.println ("[");

		for (int i = 0; i < inIndexes.length; i++)
		{
			System.out.println ("\t{");
			System.out.println ("\t\t\"parameter\" : " + inParameters [i] + ",");
			System.out.println ("\t\t\"value\" : " + inValues [inIndexes [i]]);

			System.out.print ("\t}");

			if (i < (inIndexes.length - 1))
			{
				System.out.println (",");
			}
			else
			{
				System.out.println ();
			}
		}

		System.out.println ("],");
	}
}

