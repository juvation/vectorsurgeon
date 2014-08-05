//
//	WaveWindow.java
//
//	Copyright 2008 ArmoredMail, Inc.
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
import java.awt.Color;
import java.awt.Container;
import java.awt.Dialog;
import java.awt.Dimension;
import java.awt.FileDialog;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.Frame;
import java.awt.Toolkit;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.ClipboardOwner;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.Transferable;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.prefs.Preferences;

import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JRootPane;
import javax.swing.KeyStroke;

// CLASS

public class WaveWindow
	extends JFrame
	implements ActionListener, ClipboardOwner, MouseListener,
		MouseMotionListener, WindowListener
{
	// PUBLIC CONSTRUCTOR
	
	public
	WaveWindow (WaveBankWindow inWaveBankWindow, Wave inWave)
	{
		this.waveBankWindow = inWaveBankWindow;
		this.wave = inWave;
		
		// CONFIGURATION
		
		getContentPane ().setLayout (new BorderLayout ());

		setResizable (false);
		setDefaultCloseOperation (DO_NOTHING_ON_CLOSE);
		addWindowListener (this);
		
		// WAVE VIEW
		
		this.waveView = new WaveView (this.wave);
		this.waveView.setPreferredSize (new Dimension (500, 500));
		this.waveView.setAllowEditing (true);
		this.waveView.addMouseListener (this);
		this.waveView.addMouseMotionListener (this);
		getContentPane ().add (this.waveView, BorderLayout.CENTER);
		
		// BUTTONS

		JPanel	buttonPanel = new JPanel ();
		buttonPanel.setLayout (new BoxLayout (buttonPanel, BoxLayout.X_AXIS));
		getContentPane ().add (buttonPanel, BorderLayout.SOUTH);

		JButton	saveButton = new JButton ("Save to Wave Bank");
		saveButton.setActionCommand ("SAVE_TO_WAVE_BANK");
		saveButton.addActionListener (this);
		buttonPanel.add (saveButton);
		
		JButton	copyButton = new JButton ("Copy Wave");
		copyButton.setActionCommand ("COPY");
		copyButton.addActionListener (this);
		buttonPanel.add (copyButton);
		
		// PACK
		
		pack ();
	}

	// COMPONENT OVERRIDE
	
	public void
	setVisible (boolean inVisible)
	{
		if (inVisible)
		{
			super.setVisible (inVisible);
		}
		else
		{
			boolean	closeWindow = true;
			
			if (this.waveBankWindow != null && this.wave.isModified ())
			{
				StringBuffer	buffer = new StringBuffer ();
				
				buffer.append ("Save wave number ");
				buffer.append (Integer.toString (this.wave.getWaveNumber ()));
				buffer.append (" back to \"");
				buffer.append (this.waveBankWindow.getTitle ());
				buffer.append ("\" before closing?");
				
				int	response = JOptionPane.showConfirmDialog
					(this, buffer.toString (), "Confirm", JOptionPane.YES_NO_CANCEL_OPTION);
					
				if (response == JOptionPane.YES_OPTION)
				{
					this.waveBankWindow.setWave (this.wave);
				}
				else
				if (response == JOptionPane.CANCEL_OPTION)
				{
					closeWindow = false;
				}
			}

			if (closeWindow)
			{
				ControlWindow.getInstance ().setWaveWindow (null);
				
				super.setVisible (false);
				
				// do NOT dispose() here
			}
		}
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
		if (actionCommand.equalsIgnoreCase ("SAVE_TO_WAVE_BANK"))
		{
			if (this.wave.isModified ())
			{
				this.waveBankWindow.setWave (this.wave);
				setWaveModified (false);
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("COPY"))
		{
			TransferableWave	transferable = new TransferableWave (this.wave);
			Toolkit.getDefaultToolkit ().getSystemClipboard ().setContents (transferable, this);
		}
	}
	
	// CLIPBOARD OWNER IMPLEMENTATION
	
	public void
	lostOwnership (Clipboard inClipboard, Transferable inContents)
	{
		// like we care
	}
	
	// MOUSELISTENER IMPLEMENTATION
	
	public void
	mouseClicked (MouseEvent inEvent)
	{
	}

	public void
	mouseEntered (MouseEvent inEvent)
	{
	}

	public void
	mouseExited (MouseEvent inEvent)
	{
	}

	public void
	mousePressed (MouseEvent inEvent)
	{
		this.waveView.processEditEvent (inEvent);
		setWaveModified (true);
	}

	public void
	mouseReleased (MouseEvent inEvent)
	{
	}
	
	// MOUSEMOTIONLISTENER IMPLEMENTATION
	
	public void
	mouseDragged (MouseEvent inEvent)
	{
		this.waveView.processEditEvent (inEvent);
		setWaveModified (true);
	}

	public void
	mouseMoved (MouseEvent inEvent)
	{
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
		setVisible (false);
		
		if (! isVisible ())
		{
			dispose ();
		}
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
	
	public WaveBankWindow
	getWaveBankWindow ()
	{
		return this.waveBankWindow;
	}
	
	// PRIVATE METHODS

	private void
	setWaveModified (boolean inModified)
	{
		getRootPane ().putClientProperty ("windowModified", new Boolean (inModified));
		getRootPane ().putClientProperty ("Window.documentModified", new Boolean (inModified));
		
		this.wave.setModified (inModified);
	}

	// PRIVATE DATA
	
	private Wave
	wave = null;

	private WaveBankWindow
	waveBankWindow = null;
	
	private WaveView
	waveView = null;
	
}

