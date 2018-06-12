
import java.io.*;

import com.prophetvs.editor.Bank;

public class PatchNames
{
	public static void
	main (String[] inArgs)
	throws Exception
	{
		byte[]	buffer = new byte [16405];
		int	cc = 0;
		FileInputStream	fis = new FileInputStream (inArgs [0]);

		cc = fis.read (buffer);
		
		if (cc == 16405)
		{
			Bank	bank = new Bank (buffer);
			
			String[]	names = bank.getPatchNames ();
			
			for (String name : names)
			{
				System.out.println (name);
			}
		}
		else
		{
			System.err.println ("bad read length from file: " + cc);
		}


	}

}


