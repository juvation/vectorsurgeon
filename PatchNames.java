
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
		
		FileInputStream	fis = null;
		
		for (int i = 0; i < inArgs.length; i++)
		{
			String	fileName = inArgs [i];
			
			try
			{
				fis = new FileInputStream (fileName);

				cc = fis.read (buffer);
				
				if (cc == 16405)
				{
					Bank	bank = new Bank (buffer);
					
					String[]	names = bank.getPatchNames ();
					
					for (int j = 0; j < names.length; j++)
					{
						System.out.println (fileName + " - " + j + " - " + names [j]);
					}
				}
				else
				{
					// probably a waves dump or something, ignore
					// System.err.println ("bad read length from file: " + fileName);
				}
			}
			catch (Exception inException)
			{
				System.err.println (inException);
			}
			finally
			{
				fis.close ();
			}
		}
	}

}


