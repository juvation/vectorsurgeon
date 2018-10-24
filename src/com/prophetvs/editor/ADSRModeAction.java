//	ADSRModeAction.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

// CLASS

public class ADSRModeAction
implements ActionListener
{
	public
	ADSRModeAction ()
	{
	}

	// ACTIONLISTENER IMPLEMENTATION
	
	public void
	actionPerformed (ActionEvent inEvent)
	{
		String	actionCommand = inEvent.getActionCommand ();
		
// System.err.println ("ADSRModeAction.actionPerformed(" + actionCommand + ")");

		ControlWindow	controlWindow = ControlWindow.getInstance ();
		PatchWindow	patchWindow = controlWindow.getPatchWindow ();

		if (actionCommand.equals ("AMP_ADSR_MODE"))
		{
			patchWindow.setParameterValue ("AmpEnvLevel0", 0);
			patchWindow.setParameterValue ("AmpEnvLevel1", 99);
			patchWindow.setParameterValue ("AmpEnvRate2", 0);
			patchWindow.setParameterValue ("AmpEnvLevel2", 99);
		}
		else
		if (actionCommand.equals ("FILTER_ADSR_MODE"))
		{
			patchWindow.setParameterValue ("FilterEnvLevel0", 0);
			patchWindow.setParameterValue ("FilterEnvLevel1", 99);
			patchWindow.setParameterValue ("FilterEnvRate2", 0);
			patchWindow.setParameterValue ("FilterEnvLevel2", 99);
			patchWindow.setParameterValue ("FilterEnvLevel4", 0);
		}
		else
		{
			System.err.println ("ADSRModeAction with unknown action: " + actionCommand);
		}
	}
	
}

