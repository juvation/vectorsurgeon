
// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Frame;
import java.awt.Toolkit;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JRootPane;
import javax.swing.JScrollPane;
import javax.swing.KeyStroke;

// CLASS

public class VaryWindow
	extends JFrame
	implements ActionListener
{
	// CONSTRUCTOR
	
	public 
	VaryWindow (Patch inPatch)
	{
		this.patch = inPatch;
		
		// CONFIGURATION
		
		setSize (600, 400);
		
		// TITLE
		
		setTitle ("Variation on " + inPatch.getName ());

		// LAYOUT

		getContentPane ().setLayout (new BorderLayout ());

		// CONTENTS
		
		// MAIN PANE - SCROLLING LIST OF VARYPANELS

		this.listPanel = new JPanel ();
		this.listPanel.setLayout (new BoxLayout (this.listPanel, BoxLayout.Y_AXIS));
		getContentPane ().add (this.listPanel);
		
		JScrollPane	scrollPane = new JScrollPane (this.listPanel);
		getContentPane ().add (scrollPane, BorderLayout.CENTER);
		
		// toolbar
		JPanel	buttonBar = new JPanel ();
		buttonBar.setLayout (new FlowLayout (FlowLayout.CENTER));
		getContentPane ().add (buttonBar, BorderLayout.SOUTH);
		
		JButton	addButton = new JButton ("Add Parameter Transform");
		addButton.addActionListener (this);
		addButton.setActionCommand ("ADD");
		buttonBar.add (addButton);
		
		JButton	varyButton = new JButton ("Generate Bank");
		varyButton.addActionListener (this);
		varyButton.setActionCommand ("GENERATE");
		buttonBar.add (varyButton);
		
		pack ();
	}
	
	// JFRAME OVERRIDES
	
	public JRootPane
	createRootPane ()
	{
		JRootPane rootPane = new JRootPane ();
		
		int menuShortcutKey = Toolkit.getDefaultToolkit ().getMenuShortcutKeyMask ();

		String	osName = System.getProperty ("os.name");

		KeyStroke keyStroke = null;
		
		if (osName.startsWith ("Windows"))
		{
			keyStroke = KeyStroke.getKeyStroke (KeyEvent.VK_F4, menuShortcutKey);
		}
		else
		if (osName.startsWith ("Mac"))
		{
			keyStroke = KeyStroke.getKeyStroke (KeyEvent.VK_W, menuShortcutKey);
		}
		else
		{
			// no shortcuts for other OSes (yet)
		}
		
		if (keyStroke != null)
		{
			rootPane.registerKeyboardAction (this, "KEYBOARD_CLOSE_ACTION",
				keyStroke, JComponent.WHEN_IN_FOCUSED_WINDOW);
		}
		
		return rootPane;
	}
    
	// ACTIONLISTENER IMPLEMENTATION
	
	public void
	actionPerformed (ActionEvent inEvent)
	{
		String	actionCommand = inEvent.getActionCommand ();
		
		if (actionCommand.equalsIgnoreCase ("KEYBOARD_CLOSE_ACTION"))
		{
			setVisible (false);
			
			if (! isVisible ())
			{
				dispose ();
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("ADD"))
		{
			VaryPanel	panel = new VaryPanel ();
			
			this.varyPanelList.add (panel);
			this.listPanel.add (panel);
			
			// why do we need this?
			pack ();
		}
		else
		if (actionCommand.equalsIgnoreCase ("GENERATE"))
		{
			if (this.varyPanelList.size () == 0)
			{
				ControlWindow.showErrorDialog ("Error", "Please add variations to generate.");
			}
			else
			{
				List<TransformOperation>	operations = new ArrayList<TransformOperation> ();
				
				// instantiate a TransformOperation for each varypanel in the list
				for (VaryPanel panel : this.varyPanelList)
				{
					panel.cacheParameterValues ();
					
					TransformOperation	operation = new TransformOperation
						(panel.getParameterName (), panel.getTransformName (), 
							panel.getTransformParameters ());
						
					operations.add (operation);
				}
				
				try
				{
					VariationGenerator	generator = VariationGenerator.getInstance ();
					Bank	bank = generator.generate (this.patch, operations);
					ControlWindow.getInstance ().openBank (bank, null, false, true);
				}
				catch (Throwable inThrowable)
				{
					ControlWindow.showErrorDialog ("Error", inThrowable);
				}
			}
		}
	}
	
	// PUBLIC METHODS
	
	// PRIVATE DATA

	private List<VaryPanel>
	varyPanelList = new ArrayList<VaryPanel> ();
	
	private JPanel
	listPanel = null;
	
	private Patch
	patch = null;
	
}

