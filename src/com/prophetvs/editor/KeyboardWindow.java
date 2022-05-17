//
//	KeyboardWindow.java
//
//	Copyright 2019 Jason Proctor
//
//	$Author$
//	$Date$
//	$Revision$
//	$Locker$
//
//	CVS modification log
//
//	$Log$
//
//

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.BorderLayout;
import java.awt.Toolkit;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;

import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JRootPane;
import javax.swing.JSlider;
import javax.swing.KeyStroke;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

// CLASS

public class KeyboardWindow
	extends JFrame
	implements ActionListener, ChangeListener, WindowListener
{
	// PUBLIC CONSTRUCTOR
	
	public
	KeyboardWindow ()
	{
		setTitle ("Keyboard");

		// CONFIGURATION
		
		setResizable (false);
		addWindowListener (this);
		
		// LAYOUT
		
		getContentPane ().setLayout (new BorderLayout ());
		
		// KEYBOARD VIEW
		
		this.keyboardView = new KeyboardView ();
		getContentPane ().add (this.keyboardView, BorderLayout.CENTER);
		
		// BUTTONS

		JPanel	controlPanel = new JPanel ();
		controlPanel.setLayout (new BoxLayout (controlPanel, BoxLayout.X_AXIS));
		getContentPane ().add (controlPanel, BorderLayout.SOUTH);

		JButton	octaveDownButton = new JButton ("Octave Down");
		octaveDownButton.setActionCommand ("OCTAVE_DOWN");
		octaveDownButton.addActionListener (this);
		controlPanel.add (octaveDownButton);
		
		this.octaveLabel = new JLabel ("0");
		controlPanel.add (this.octaveLabel);
		
		JButton	octaveUpButton = new JButton ("Octave Up");
		octaveUpButton.setActionCommand ("OCTAVE_UP");
		octaveUpButton.addActionListener (this);
		controlPanel.add (octaveUpButton);

		JLabel	velocityLabel = new JLabel ("Velocity");
		controlPanel.add (velocityLabel);
		
		JSlider	velocitySlider = new JSlider (JSlider.HORIZONTAL);
		velocitySlider.addChangeListener (this);
		velocitySlider.setMaximum (127);
		velocitySlider.setMinimum (1);
		velocitySlider.setMajorTickSpacing (16);
		velocitySlider.setPaintTicks (true);
		controlPanel.add (velocitySlider);
		
		// update the keyboard view
		velocitySlider.setValue (80);
		
		JCheckBox	holdCheckBox = new JCheckBox ("Hold");
		holdCheckBox.addChangeListener (this);
		controlPanel.add (holdCheckBox);
		
		// PACK
		
		pack ();
	}

	// COMPONENT OVERRIDE
	
	public void
	setVisible (boolean inVisible)
	{
		if (! inVisible)
		{
			sendAllNotesOff ();
		}
	
		super.setVisible (inVisible);
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
			
			// do NOT dispose
		}
		else
		if (actionCommand.equalsIgnoreCase ("OCTAVE_DOWN"))
		{
			int	octaveOffset = this.keyboardView.getOctaveOffset ();
			
			octaveOffset--;
			
			if (this.keyboardView.setOctaveOffset (octaveOffset))
			{
				this.octaveLabel.setText ("" + octaveOffset);
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("OCTAVE_UP"))
		{
			int	octaveOffset = this.keyboardView.getOctaveOffset ();
			
			octaveOffset++;
			
			if (this.keyboardView.setOctaveOffset (octaveOffset))
			{
				this.octaveLabel.setText ("" + octaveOffset);
			}
		}
	}
	
	// CHANGELISTENER IMPLEMENTATION
	
	public void
	stateChanged (ChangeEvent inEvent)
	{
		JComponent	source = (JComponent) inEvent.getSource ();
		
		if (source instanceof JSlider)
		{
			JSlider	slider = (JSlider) source;
			this.keyboardView.setVelocity (slider.getValue ());
		}
		else
		if (source instanceof JCheckBox)
		{
			JCheckBox	checkBox = (JCheckBox) source;
			
			this.keyboardView.setHoldNotes (checkBox.isSelected ());
			
			if (! checkBox.isSelected ())
			{
				sendAllNotesOff ();
			}
		}
	}
	
	// WINDOWLISTENER IMPLEMENTATION
	
	public void
	windowOpened (WindowEvent inEvent)
	{
	}

	public void
	windowClosed (WindowEvent inEvent)
	{
	}

	public void
	windowClosing (WindowEvent inEvent)
	{
		sendAllNotesOff ();
		
		setVisible (false);
		
		// do NOT dispose
		// CloseWindow assumes the window stays around
	}

	public void
	windowIconified (WindowEvent inEvent)
	{
	}

	public void
	windowDeiconified (WindowEvent inEvent)
	{
	}

	public
	void windowActivated (WindowEvent inEvent)
	{
	}

	public
	void windowDeactivated (WindowEvent inEvent)
	{
	}

	// PUBLIC METHODS
	
	// called when the MIDI configuration changes
	public void
	reset ()
	{
		this.keyboardView.reset ();
	}
	
	// called when the keyboard window goes away
	public void
	sendAllNotesOff ()
	{
		this.keyboardView.sendAllNotesOff ();
	}
	
	// PRIVATE DATA
	
	private JLabel
	octaveLabel = null;
	
	private KeyboardView
	keyboardView = null;
	
}

