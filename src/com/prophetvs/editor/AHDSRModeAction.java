//	AHDSRModeAction.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

// CLASS

public class AHDSRModeAction
implements ActionListener
{
	public
	AHDSRModeAction ()
	{
	}

	// ACTIONLISTENER IMPLEMENTATION
	
	public void
	actionPerformed (ActionEvent inEvent)
	{
		String	actionCommand = inEvent.getActionCommand ();
		
// System.err.println ("AHDSRModeAction.actionPerformed(" + actionCommand + ")");

		ControlWindow	controlWindow = ControlWindow.getInstance ();
		PatchWindow	patchWindow = controlWindow.getPatchWindow ();

		if (actionCommand.equals ("AMP_AHDSR_MODE"))
		{
			patchWindow.setParameterValue ("AmpEnvLevel0", 0);
			patchWindow.setParameterValue ("AmpEnvLevel1", 99);
			
			// we don't zero hold time for AHDSR
			// patchWindow.setParameterValue ("AmpEnvRate2", 0);

			patchWindow.setParameterValue ("AmpEnvLevel2", 99);
		}
		else
		if (actionCommand.equals ("FILTER_AHDSR_MODE"))
		{
			patchWindow.setParameterValue ("FilterEnvLevel0", 0);
			patchWindow.setParameterValue ("FilterEnvLevel1", 99);

			// we don't zero hold time for AHDSR
			// patchWindow.setParameterValue ("FilterEnvRate2", 0);
			patchWindow.setParameterValue ("FilterEnvLevel2", 99);

			patchWindow.setParameterValue ("FilterEnvLevel4", 0);
		}
		else
		{
			System.err.println ("AHDSRModeAction with unknown action: " + actionCommand);
		}
	}
	
}

