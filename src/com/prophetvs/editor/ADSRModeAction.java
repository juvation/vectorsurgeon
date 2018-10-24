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
			patchWindow.setControlValue ("AmpEnvLevel0", 0);
			patchWindow.setControlValue ("AmpEnvLevel1", 99);
			patchWindow.setControlValue ("AmpEnvRate2", 0);
			patchWindow.setControlValue ("AmpEnvLevel2", 99);
		}
		else
		if (actionCommand.equals ("FILTER_ADSR_MODE"))
		{
			patchWindow.setControlValue ("FilterEnvLevel0", 0);
			patchWindow.setControlValue ("FilterEnvLevel1", 99);
			patchWindow.setControlValue ("FilterEnvRate2", 0);
			patchWindow.setControlValue ("FilterEnvLevel2", 99);
			patchWindow.setControlValue ("FilterEnvLevel4", 0);
		}
		else
		{
			System.err.println ("ADSRModeAction with unknown action: " + actionCommand);
		}
	}
	
}

