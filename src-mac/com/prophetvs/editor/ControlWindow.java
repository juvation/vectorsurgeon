
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
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.prefs.Preferences;

// use MMJ on Mac, thanks to idiotic Apple
import de.humatic.mmj.MidiInput;
import de.humatic.mmj.MidiOutput;
import de.humatic.mmj.MidiSystem;

import javax.swing.BoxLayout;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JRootPane;
import javax.swing.KeyStroke;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;

import java.io.File;
import java.io.FileInputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;

// CLASS

public class ControlWindow
	extends JFrame
	implements ActionListener, MidiHost, WindowListener
{
	// MAINLINE
	
	public static void
	main (String[] inArgs)
		throws Exception
	{
		UIManager.setLookAndFeel (UIManager.getSystemLookAndFeelClassName ());
			
		sPrefs = Preferences.userRoot ().node (kPreferencesPath);
		
		String	configFilePath = sPrefs.get ("configFilePath", null);
		
		URL	configFileURL = null;
		
		if (configFilePath == null)
		{
			configFileURL = getResource ("prophetvs_ui.xml");
		}
		else
		{
			configFileURL = new File (configFilePath).toURI ().toURL ();
		}
		
		// this will default to the config file in the jar file
		// if anything goes wrong opening the user's config file
		Document	configDocument = initConfigFile (configFileURL);
		
		// OK, parsed OK, time to make the boss window
		sInstance = new ControlWindow (configDocument);
		sInstance.setLocationRelativeTo (null);
		sInstance.setVisible (true);
	}
	
	// PUBLIC STATIC METHODS
	
	public static File
	getFileForOpen (JFrame inFrame, String inTitle)
	{
		File	selectedFile = null;
		
		String	osName = System.getProperty ("os.name");

		if (osName.startsWith ("Mac"))
		{
			FileDialog	openDialog = new FileDialog
				(inFrame, inTitle, FileDialog.LOAD);
			
			String	directory = sPrefs.get
				("fileDialogDirectory", null);
			
			if (directory == null)
			{
				openDialog.setDirectory (".");
			}
			else
			{
				openDialog.setDirectory (directory);
			}
			
			openDialog.setVisible (true);
			
			String	file = openDialog.getFile ();
			
			if (file != null)
			{
				directory = openDialog.getDirectory ();
				
				if (directory != null)
				{
					String	path = null;
					
					if (directory.endsWith (File.separator))
					{
						path = directory + file;
					}
					else
					{
						path = directory + File.separatorChar + file;
					}
					
					selectedFile = new File (path);
					
					// set the directory for future opens
					sPrefs.put ("fileDialogDirectory", directory);
				}
			}
		}
		else
		{
			JFileChooser	openDialog = new JFileChooser ();

			String	directory = sPrefs.get ("fileDialogDirectory", null);
			
			if (directory == null)
			{
				openDialog.setCurrentDirectory (new File ("."));
			}
			else
			{
				openDialog.setCurrentDirectory (new File (directory));
			}
			
			openDialog.setDialogTitle (inTitle);
			openDialog.setFileSelectionMode (JFileChooser.FILES_ONLY);
			openDialog.setMultiSelectionEnabled (false);
			openDialog.setDragEnabled (true);

			int	response = openDialog.showOpenDialog (inFrame);

			if (response == JFileChooser.APPROVE_OPTION)
			{
				selectedFile = openDialog.getSelectedFile ();

				// set the directory for future opens
				sPrefs.put ("fileDialogDirectory", selectedFile.getParent ());
			}
		}
		
		return selectedFile;
	}
	
	public static File
	getFileForSave (Object inOwner, String inTitle, String inSelectedFileName)
	{
		File	selectedFile = null;
		
		String	osName = System.getProperty ("os.name");

		if (osName.startsWith ("Mac"))
		{
			FileDialog	dialog = null;
			
			if (inOwner instanceof Frame)
			{
				dialog = new FileDialog ((Frame) inOwner, inTitle, FileDialog.SAVE);
			}
			else
			if (inOwner instanceof Dialog)
			{
				dialog = new FileDialog ((Dialog) inOwner, inTitle, FileDialog.SAVE);
			}
			else
			{
				// HACK taking a chance here - just pass in a real owner!
				dialog = new FileDialog ((Frame) null, inTitle, FileDialog.SAVE);
			}
			
			if (inSelectedFileName != null)
			{
				dialog.setFile (inSelectedFileName);
			}
			
			dialog.setVisible (true);
			
			String	file = dialog.getFile ();
			
			if (file != null)
			{
				String	directory = dialog.getDirectory ();
				
				if (directory != null)
				{
					String	path = null;
					
					if (directory.endsWith (File.separator))
					{
						path = directory + file;
					}
					else
					{
						path = directory + File.separatorChar + file;
					}
					
					selectedFile = new File (path);
				}
			}
		}
		else
		{
			JFileChooser	openDialog = new JFileChooser ();

			openDialog.setDialogTitle (inTitle);
			// openDialog.setFileSelectionMode (JFileChooser.FILES_ONLY);
			openDialog.setMultiSelectionEnabled (false);
			openDialog.setDragEnabled (true);

			if (inSelectedFileName != null)
			{
				openDialog.setSelectedFile
					(new File (inSelectedFileName));
			}

			int	response = 0;
			
			if (inOwner instanceof Frame)
			{
				response = openDialog.showSaveDialog ((Frame) inOwner);
			}
			else
			if (inOwner instanceof Dialog)
			{
				response = openDialog.showSaveDialog ((Dialog) inOwner);
			}
			else
			{
				// HACK taking a chance here - just pass in a real owner!
				response = openDialog.showSaveDialog ((Dialog) inOwner);
			}

			if (response == JFileChooser.APPROVE_OPTION)
			{
				selectedFile = openDialog.getSelectedFile ();
			}
		}
		
		return selectedFile;
	}
	
	// SINGLETON ACCESS POINT
	
	public static ControlWindow
	getInstance ()
	{
		// the mainline constructs us
		// therefore no need to check here
		return sInstance;
	}
	
	// PUBLIC STATIC METHODS
	
	public static Properties
	getPropertiesResource (String inResourceName)
	throws Exception
	{
		URL	propertiesURL = ControlWindow.getResource (inResourceName);
		
		if (propertiesURL == null)
		{
			throw new FileNotFoundException (inResourceName);
		}
		
		Properties	properties = new Properties ();

		InputStream	uis = propertiesURL.openStream ();
		
		try
		{
			properties.load (uis);

			return properties;
		}
		finally
		{
			uis.close ();
		}
	}
	
	public static URL
	getResource (String inResourceName)
	{
		Thread	thread = Thread.currentThread ();
		ClassLoader	classLoader = thread.getContextClassLoader ();

		return classLoader.getResource (inResourceName);
	}
	
	public static Document
	initConfigFile (URL inConfigFileURL)
	{
		Document	configDocument = null;
		
		// this logic is a bit scruffy
		while (true)
		{
			InputStream	is = null;
			
			try
			{
				is = inConfigFileURL.openStream ();
				
				// parse the GUI XML file
				DocumentBuilderFactory documentFactory = DocumentBuilderFactory.newInstance ();
				DocumentBuilder documentBuilder = documentFactory.newDocumentBuilder ();
				configDocument = documentBuilder.parse (is);
				
				return configDocument;
			}
			catch (Throwable inThrowable)
			{
				// default to the jar file copy
				URL	configFileURL = getResource ("prophetvs_ui.xml");
			
				// hey WERE we using the default one?
				if (configFileURL.equals (inConfigFileURL))
				{
					// we failed with the regular config file
					// can't recover from here
					ControlWindow.showErrorDialog ("Error", inThrowable);
					ControlWindow.showErrorDialog ("Error", "Can't use default config file (panic).");
					System.exit (1);
				}
				else
				{
					ControlWindow.showErrorDialog ("Error", inThrowable);
					ControlWindow.showErrorDialog ("Error", "Using default config file.");
			
					// and blow away the preference
					sPrefs.remove ("configFilePath");
					
					inConfigFileURL = configFileURL;
				}
			}
			finally
			{
				if (is != null)
				{
					try
					{
						is.close ();
					}
					catch (Throwable inThrowable)
					{
					}
				}
			}
		}
	}
	
	
	public static int
	showConfirmDialog (String inTitle, String inMessage)
	{
		return JOptionPane.showConfirmDialog
			(null, inMessage, inTitle, JOptionPane.YES_NO_OPTION);
	}
	
	public static void
	showErrorDialog (String inTitle, String inMessage)
	{
		JOptionPane.showMessageDialog
			(null, inMessage, inTitle, JOptionPane.ERROR_MESSAGE);
	}
	
	public static void
	showErrorDialog (String inTitle, Throwable inThrowable)
	{
		inThrowable.printStackTrace (System.err);
		
		showErrorDialog (inTitle, inThrowable.toString ());
	}
	
	// PUBLIC CONSTRUCTOR
	
	public
	ControlWindow (Document inDocument)
	{
		this.document = inDocument;
		
		// CONSTRUCT MEMBERS
		
		this.offIcon = new ImageIcon (getResource ("vs_blue_button_off.gif"));
		this.onIcon = new ImageIcon (getResource ("vs_blue_button_on.gif"));
		
		// INITIALISE MIDI
		
		openMidi ();

		loadInitPatch ();
		
		// WINDOW CONFIG
		
		setDefaultCloseOperation (DO_NOTHING_ON_CLOSE);
		addWindowListener (this);

		// LAYOUT
		
		getContentPane ().setLayout (new BoxLayout (getContentPane (), BoxLayout.Y_AXIS));

		setBackground (Color.BLACK);
		setForeground (Color.WHITE);

		// BANNER

		JPanel	bannerPanel = new JPanel ();
		bannerPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		bannerPanel.setBackground (Color.BLACK);
		getContentPane ().add (bannerPanel);

		ImageIcon	bannerIcon = new ImageIcon (getResource ("vs_banner.gif"));
		JLabel	bannerLabel = new JLabel (bannerIcon);
		bannerPanel.add (bannerLabel);

		// BUTTONS

		JPanel	buttonPanel = new JPanel ();
		buttonPanel.setLayout (new BoxLayout (buttonPanel, BoxLayout.X_AXIS));
		buttonPanel.setBackground (Color.BLACK);
		getContentPane ().add (buttonPanel);

		createButtonWithLabel ("Open File...", "OPEN", buttonPanel);
		createButtonWithLabel ("Request Patches", "REQUEST_BANK", buttonPanel);
		createButtonWithLabel ("Request Waves", "REQUEST_WAVE_BANK", buttonPanel);
		createButtonWithLabel ("Keyboard", "KEYBOARD", buttonPanel);
		createButtonWithLabel ("Choose Config File...", "CHOOSE_CONFIG_FILE", buttonPanel);
		
		// add the MIDI configuration panel
		JPanel	midiDevicePanel = makeMIDIPanel ();
		
		if (midiDevicePanel != null)
		{
			getContentPane ().add (midiDevicePanel);
		}

		// COPYRIGHT ETC
		
		JPanel	blurbPanel = new JPanel ();
		blurbPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		blurbPanel.setBackground (Color.BLACK);
		getContentPane ().add (blurbPanel);
		
		JLabel	blurbLabel = new JLabel
			("Version 1.1.8 - Copyright 2019 Jason Proctor <jason@redfish.net>");
		blurbLabel.setForeground (Color.WHITE);
		blurbLabel.setBackground (Color.BLACK);
		blurbLabel.setFont (this.labelFont);
		blurbPanel.add (blurbLabel);
		
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
			
			Frame[]	frames = Frame.getFrames ();
			
			for (int i = 0; i < frames.length; i++)
			{
				Frame	frame = frames [i];
				
				if (frame.isVisible ()
					&& (frame instanceof BankWindow || frame instanceof WaveBankWindow))
				{
					frame.toFront ();
					frame.setVisible (false);
					
					if (frame.isVisible ())
					{
						// frame stayed open, abort quit
						closeWindow = false;
						break;
					}
				}
			}
			
			if (closeWindow)
			{
				closeMidi ();
				
				System.exit (0);
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
		if (actionCommand.equals ("OPEN"))
		{
			File	file = ControlWindow.getFileForOpen (this, "Select File");
			
			if (file != null)
			{
				// HACK - cache the file
				byte[]	buffer = new byte [16405];
				int	cc = 0;
				FileInputStream	fis = null;
				
				try
				{
					fis = new FileInputStream (file);
					cc = fis.read (buffer);
					
					if (cc <= 169)
					{
						Patch	patch = new Patch (buffer);
						openPatch (patch, false);
					}
					else
					if (cc <= 12293)
					{
						WaveBank	waveBank = new WaveBank (buffer);
						openWaveBank (waveBank, file, false, false);
					}
					else
					{
						Bank	bank = new Bank (buffer);
						openBank (bank, file, false, false);
					}
				}
				catch (Throwable inThrowable)
				{
					ControlWindow.showErrorDialog ("Error", inThrowable);
				}
			}
		}
		else
		if (actionCommand.equals ("REQUEST_BANK"))
		{
			try
			{
				byte[]	message = Machine.makeBankDumpRequestMessage ();
				
				if (message != null)
				{
					sendMidiMessage (message);
				}
			}
			catch (Throwable inThrowable)
			{
				ControlWindow.showErrorDialog ("Error", inThrowable);
			}
		}
		else
		if (actionCommand.equals ("REQUEST_WAVE_BANK"))
		{
			try
			{
				byte[]	message = Machine.makeWaveBankDumpRequestMessage ();
				
				if (message != null)
				{
					sendMidiMessage (message);
				}
			}
			catch (Throwable inThrowable)
			{
				ControlWindow.showErrorDialog ("Error", inThrowable);
			}
		}
		else
		if (actionCommand.equals ("KEYBOARD"))
		{
			if (this.keyboardWindow == null)
			{
				this.keyboardWindow = new KeyboardWindow ();
				this.keyboardWindow.setSize (600, 200);
				this.keyboardWindow.setLocationRelativeTo (null);
				this.keyboardWindow.setVisible (true);
			}
			
			this.keyboardWindow.setVisible (true);
			this.keyboardWindow.toFront ();
		}
		else
		if (actionCommand.equals ("CHOOSE_CONFIG_FILE"))
		{
			File	configFile = ControlWindow.getFileForOpen
				(this, "Select Machine Configuration File");
			
			if (configFile != null)
			{
				try
				{
					DocumentBuilderFactory	documentFactory = DocumentBuilderFactory.newInstance ();
					DocumentBuilder	documentBuilder = documentFactory.newDocumentBuilder ();
					this.document = documentBuilder.parse (configFile);
					
					sPrefs.put ("configFilePath", configFile.getAbsolutePath ());
					
				}
				catch (Throwable inThrowable)
				{
					ControlWindow.showErrorDialog ("Error", inThrowable);
					
					// reuse existing this.document, wherever that points...
				}
			}
		}
		else
		if (actionCommand.equals ("MIDI_INPUT_DEVICE_POPUP"))
		{
			saveMidiInputDevicePreference ();
		}
		else
		if (actionCommand.equals ("MIDI_OUTPUT_DEVICE_POPUP"))
		{
			sendMidiAllNotesOff ();
			
			if (this.keyboardWindow != null)
			{
				// clear any held notes in the keyboard
				this.keyboardWindow.reset ();
			}
			
			saveMidiOutputDevicePreference ();
		}
		else
		if (actionCommand.equals ("MIDI_THRU_DEVICE_POPUP"))
		{
			sendMidiAllNotesOff ();
			
			saveMidiThruDevicePreference ();
		}
		else
		if (actionCommand.equals ("MIDI_CHANNEL_POPUP"))
		{
			sendMidiAllNotesOff ();
			
			if (this.keyboardWindow != null)
			{
				// clear any held notes in the keyboard
				this.keyboardWindow.reset ();
			}

			saveMidiChannelPreference ();
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

	public BankWindow
	getBankWindowInProphet ()
	{
		BankWindow	bankWindow = null;
		
		Frame[]	frames = Frame.getFrames ();
		
		for (int i = 0; i < frames.length; i++)
		{
			Frame	frame = frames [i];
			
			if (frame.isVisible () && frame instanceof BankWindow)
			{
				bankWindow = (BankWindow) frame;
				
				if (bankWindow.isBankInProphet ())
				{
					break;
				}
				
				bankWindow = null;
			}
		}
		
		return bankWindow;
	}
	
	public Patch
	getInitPatch ()
	{
		return this.initPatch;
	}
	
	public Document
	getDocument ()
	{
		return this.document;
	}
	
	public int
	getMidiChannel0 ()
	{
		return this.midiChannel0;
	}

	public MidiInput
	getMidiInputDevice ()
	{
		return this.midiInputList.get (this.midiInputDeviceIndex);
	}
	
	public MidiOutput
	getMidiOutputDevice ()
	{
		return this.midiOutputList.get (this.midiOutputDeviceIndex);
	}

	public MidiInput
	getMidiThruDevice ()
	{
		return this.midiInputList.get (this.midiThruDeviceIndex);
	}
	
	public KeyboardWindow
	getKeyboardWindow ()
	{
		return this.keyboardWindow;
	}
	
	public PatchWindow
	getPatchWindow ()
	{
		return this.patchWindow;
	}
	
	public WaveWindow
	getWaveWindow ()
	{
		return this.waveWindow;
	}
	
	public void
	openBank (Bank inBank, File inBankFile, boolean inInProphet, boolean inModified)
	{
		BankWindow	bankWindow = new BankWindow (getDocument (), inBank, inBankFile, inInProphet);
		bankWindow.setBankModified (inModified);
		bankWindow.setLocationRelativeTo (null);
		bankWindow.setVisible (true);
	}
	
	public void
	openPatch (Patch inPatch, boolean inModified)
	{
		Bank	bank = new Bank (inPatch);
		BankWindow	bankWindow = new BankWindow (getDocument (), bank, null, false);
		bankWindow.setBankModified (inModified);
		bankWindow.setLocationRelativeTo (null);
		bankWindow.setVisible (true);
	}
	
	public void
	openWaveBank (WaveBank inWaveBank, File inWaveBankFile, boolean inInProphet, boolean inModified)
	{
		WaveBankWindow	waveBankWindow = new WaveBankWindow (inWaveBank, inWaveBankFile, inInProphet);
		waveBankWindow.setBankModified (inModified);
		waveBankWindow.setLocationRelativeTo (null);
		waveBankWindow.setVisible (true);
	}
	
	// PRIVATE METHODS
	
	private void
	loadInitPatch ()
	{
		URL	propertiesURL = ControlWindow.getResource ("init-patch.syx");
		
		if (propertiesURL == null)
		{
			ControlWindow.showErrorDialog ("Error", "can't find init-patch.syx");
			return;
		}
		
		InputStream	uis = null;
		
		try
		{
			uis = propertiesURL.openStream ();

			// oooh Patch does this for us, niiiiice Patch
			this.initPatch = new Patch (uis);
		}
		catch (Exception inException)
		{
			ControlWindow.showErrorDialog ("Error", "can't load init-patch.syx");
			ControlWindow.showErrorDialog ("Error", inException);
		}
		finally
		{
			if (uis != null)
			{
				try
				{
					uis.close ();
				}
				catch (Exception inException)
				{
				}
			}
		}
	}
	
	private void
	closeMidi ()
	{
		try
		{
			MidiSystem.closeMidiSystem ();
		}
		catch (Throwable inThrowable)
		{
		}
	}
	
	private void
	createButtonWithLabel (String inLabel, String inActionCommand, Container inContainer) 
	{
		// panel
		
		JPanel	buttonPanel = new JPanel ();
		buttonPanel.setLayout (new BoxLayout (buttonPanel, BoxLayout.Y_AXIS));
		inContainer.add (buttonPanel);

		// button

		JPanel	buttonIconPanel = new JPanel ();
		buttonIconPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		buttonIconPanel.setBackground (Color.BLACK);
		buttonPanel.add (buttonIconPanel);

		JButton	button = new JButton (this.offIcon);
		buttonIconPanel.add (button);
		button.setPressedIcon (this.onIcon);
		button.setBorder (null);
		button.setFocusPainted (false);
		button.setActionCommand (inActionCommand);
		button.addActionListener (this);
		
		// label

		JPanel	buttonLabelPanel = new JPanel ();
		buttonLabelPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		buttonLabelPanel.setBackground (Color.BLACK);
		buttonPanel.add (buttonLabelPanel);

		JLabel	buttonLabel = new JLabel (inLabel);
		buttonLabelPanel.add (buttonLabel);
		buttonLabel.setForeground (Color.WHITE);
		buttonLabelPanel.setBackground (Color.BLACK);
		buttonLabel.setFont (this.labelFont);
	}
	
	private void
	loadMidiChannelPreference ()
	{
		Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);
		
		// MIDI channel is saved by number
		int	midiChannel = prefs.getInt ("midiChannel", 1);

		// midi channels start at 1
		// popups number selections from 0
		this.midiChannelPopup.setSelectedIndex (midiChannel - 1);
	}
	
	private void
	loadMidiDevicePreference ()
	{
		Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);
		
		// INPUT DEVICE POPUP & THRU DEVICE POPUP
		
		if (this.midiInputList != null && this.midiInputList.size () > 0)
		{
			// use the first MIDI device as the default
			String	defaultName = this.midiInputList.get (0).getName ();
			
			String	inputPrefsDeviceName = prefs.get ("midiInputDeviceName", defaultName);
			String	thruPrefsDeviceName = prefs.get ("midiThruDeviceName", defaultName);

			int	selectedInputIndex = 0;
			int	selectedThruIndex = 0;
			
			for (int i = 0; i < this.midiInputList.size (); i++)
			{
				MidiInput	device = this.midiInputList.get (i);
				String	name = device.getName ();
				
				if (inputPrefsDeviceName.equalsIgnoreCase (name))
				{
					selectedInputIndex = i;
				}
				
				if (thruPrefsDeviceName.equalsIgnoreCase (name))
				{
					selectedThruIndex = i;
				}
			}
			
			this.midiInputDevicePopup.setSelectedIndex (selectedInputIndex);
			this.midiThruDevicePopup.setSelectedIndex (selectedThruIndex);
		}

		// OUTPUT DEVICE POPUP
		
		if (this.midiOutputList != null && this.midiOutputList.size () > 0)
		{
			// use the first MIDI device as the default
			String	defaultName = this.midiOutputList.get (0).getName ();
			
			String	prefsDeviceName = prefs.get ("midiOutputDeviceName", defaultName);

			int	selectedIndex = 0;
			
			for (int i = 0; i < this.midiOutputList.size (); i++)
			{
				MidiOutput	device = this.midiOutputList.get (i);
				String	name = device.getName ();
				
				if (prefsDeviceName.equalsIgnoreCase (name))
				{
					selectedIndex = i;
					break;
				}
			}
			
			this.midiOutputDevicePopup.setSelectedIndex (selectedIndex);
		}

	}
	
	private JPanel
	makeMIDIPanel ()
	{
		// PANEL
		
		JPanel	panel = new JPanel ();
		panel.setLayout (new FlowLayout (FlowLayout.CENTER));
		panel.setBackground (Color.BLACK);
		
		// MIDI INPUT DEVICE
		
		JLabel	label = new JLabel ("Input:");
		panel.add (label);
		label.setForeground (Color.white);
		label.setBackground (Color.black);
		label.setFont (this.labelFont);
		
		// build the name array for the input device popup
		String[]	inputDeviceNameArray = MidiSystem.getInputs ();
		
		this.midiInputDevicePopup = new JComboBox (inputDeviceNameArray);
		// this.midiInputDevicePopup.setPreferredSize (new Dimension (200, 30));
		this.midiInputDevicePopup.setActionCommand ("MIDI_INPUT_DEVICE_POPUP");
		this.midiInputDevicePopup.addActionListener (this);
		panel.add (this.midiInputDevicePopup);
		
		// MIDI OUTPUT DEVICE
		
		label = new JLabel ("Output:");
		panel.add (label);
		label.setForeground (Color.white);
		label.setBackground (Color.black);
		label.setFont (this.labelFont);
		
		// build the name array for the output device popup
		String[]	outputDeviceNameArray = MidiSystem.getOutputs ();
		
		this.midiOutputDevicePopup = new JComboBox (outputDeviceNameArray);
		// this.midiOutputDevicePopup.setPreferredSize (new Dimension (200, 30));
		this.midiOutputDevicePopup.setActionCommand ("MIDI_OUTPUT_DEVICE_POPUP");
		this.midiOutputDevicePopup.addActionListener (this);
		panel.add (this.midiOutputDevicePopup);
		
		// MIDI THRU DEVICE
		// reuse the input device names etc for the thru popup

		label = new JLabel ("Thru:");
		panel.add (label);
		label.setForeground (Color.white);
		label.setBackground (Color.black);
		label.setFont (this.labelFont);
		
		this.midiThruDevicePopup = new JComboBox (inputDeviceNameArray);
		// this.midiThruDevicePopup.setPreferredSize (new Dimension (200, 30));
		this.midiThruDevicePopup.setActionCommand ("MIDI_THRU_DEVICE_POPUP");
		this.midiThruDevicePopup.addActionListener (this);
		panel.add (this.midiThruDevicePopup);
		
		loadMidiDevicePreference ();
		
		// MIDI CHANNEL
		
		label = new JLabel ("Channel:");
		panel.add (label);
		label.setForeground (Color.white);
		label.setBackground (Color.black);
		label.setFont (this.labelFont);
		
		String[]	channelNames = new String [16];
		
		for (int i = 0; i < 16; i++)
		{
			channelNames [i] = Integer.toString (i + 1);
		}

		this.midiChannelPopup = new JComboBox (channelNames);
		this.midiChannelPopup.setActionCommand ("MIDI_CHANNEL_POPUP");
		this.midiChannelPopup.addActionListener (this);
		panel.add (this.midiChannelPopup);
		
		loadMidiChannelPreference ();
		
		return panel;
	}
	
	private void
	openMidi ()
	{
System.err.println ("using MMJ for MIDI");

		// build our device lists
		this.midiInputList = new ArrayList<MidiInput> ();

// System.err.println ("system has " + MidiSystem.getNumberOfInputs () + " inputs");

		for (int i = 0; i < MidiSystem.getNumberOfInputs (); i++)
		{
			try
			{
				MidiInput	input = MidiSystem.openMidiInput (i);

// System.err.println ("found input: " + input.getName ());
				
				this.midiInputList.add (input);
				
				input.addMidiListener (new MidiReceiver (input, this));

// System.err.println ("added listener for input: " + input.getName ());
			}
			catch (Throwable inThrowable)
			{
System.err.println (inThrowable);
			}
		}

		this.midiOutputList = new ArrayList<MidiOutput> ();

// System.err.println ("system has " + MidiSystem.getNumberOfOutputs () + " outputs");

		for (int i = 0; i < MidiSystem.getNumberOfOutputs (); i++)
		{
			try
			{
				MidiOutput	output = MidiSystem.openMidiOutput (i);
				
// System.err.println ("found output: " + output.getName ());
				
				this.midiOutputList.add (output);
			}
			catch (Throwable inThrowable)
			{
System.err.println (inThrowable);
			}
		}
	}
	
	// this gets called when the channel popup gets a value
	// ie during startup, and when the user changes it
	private void
	saveMidiChannelPreference ()
	{
		Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);
		
		if (this.midiChannelPopup != null)
		{
			int	selectedChannelIndex = this.midiChannelPopup.getSelectedIndex ();

			if (selectedChannelIndex == -1)
			{
				selectedChannelIndex = 0;
			}

			prefs.putInt ("midiChannel", selectedChannelIndex + 1);
			
			// and update our local cache
			this.midiChannel0 = selectedChannelIndex;
		}
	}
	
	// this gets called when the input device popup gets a value
	// ie during startup, and when the user changes it
	private void
	saveMidiInputDevicePreference ()
	{
		Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);
		
		// INPUT DEVICE POPUP

		if (this.midiInputDevicePopup != null)
		{
			int	selectedDeviceIndex = this.midiInputDevicePopup.getSelectedIndex ();
			
			if (selectedDeviceIndex == -1)
			{
				selectedDeviceIndex = 0;
			}
			
			String	selectedDevice
				= (String) this.midiInputDevicePopup.getItemAt (selectedDeviceIndex);
			
			prefs.put ("midiInputDeviceName", selectedDevice);
			
			// and update our local cache
			this.midiInputDeviceIndex = selectedDeviceIndex;
		}
	}
	
	// this gets called when the output device popup gets a value
	// ie during startup, and when the user changes it
	private void
	saveMidiOutputDevicePreference ()
	{
		Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);
		
		// OUTPUT DEVICE POPUP

		if (this.midiOutputDevicePopup != null)
		{
			int	selectedDeviceIndex = this.midiOutputDevicePopup.getSelectedIndex ();
			
			if (selectedDeviceIndex == -1)
			{
				selectedDeviceIndex = 0;
			}
			
			String	selectedDevice
				= (String) this.midiOutputDevicePopup.getItemAt (selectedDeviceIndex);
			
			prefs.put ("midiOutputDeviceName", selectedDevice);
			
			// and update our local cache
			this.midiOutputDeviceIndex = selectedDeviceIndex;
		}
	}
	
	// this gets called when the thru device popup gets a value
	// ie during startup, and when the user changes it
	private void
	saveMidiThruDevicePreference ()
	{
		Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);
		
		// THRU DEVICE POPUP

		if (this.midiThruDevicePopup != null)
		{
			int	selectedDeviceIndex = this.midiThruDevicePopup.getSelectedIndex ();
			
			if (selectedDeviceIndex == -1)
			{
				selectedDeviceIndex = 0;
			}
			
			String	selectedDevice
				= (String) this.midiThruDevicePopup.getItemAt (selectedDeviceIndex);
			
			prefs.put ("midiThruDeviceName", selectedDevice);
			
			// and update our local cache
			this.midiThruDeviceIndex = selectedDeviceIndex;
		}
	}
	
	public void
	sendBankDumpMessage (Bank inBank)
	throws Exception
	{
		sendMidiMessage (Machine.makeBankDumpMessage (inBank));
	}

	public void
	sendEnableParametersMessage ()
	throws Exception
	{
		sendMidiMessage (Machine.makeEnableParametersMessage ());
	}
	
	public void
	sendMidiAllNotesOff ()
	{
		for (int i = 0; i < this.midiHeldNotes.length; i++)
		{
			if (this.midiHeldNotes [i])
			{
				sendMidiNoteOff (i);
			}
		}
	}
	
	public void
	sendMidiChannelPressure (int inPressure)
	{
		try
		{
			sendMidiMessage (0xd0 | this.midiChannel0, inPressure);
		}
		catch (Throwable inThrowable)
		{
System.err.println (inThrowable);
		}
	}
	
	public void
	sendMidiControlChange (int inControlNumber, int inControlValue)
	{
		try
		{
			sendMidiMessage (0xb0 | this.midiChannel0, inControlNumber, inControlValue);
		}
		catch (Throwable inThrowable)
		{
System.err.println (inThrowable);
		}
	}
	
	public void
	sendMidiMessage (byte[] inMessage)
	{
		if (this.midiOutputDeviceIndex >= 0
			&& this.midiOutputDeviceIndex < this.midiOutputList.size ())
		{
			MidiOutput	output = this.midiOutputList.get (this.midiOutputDeviceIndex);

			output.sendMidi (inMessage);
		}
	}
	
	public void
	sendMidiMessage (int inCommand, int inData1)
	{
		byte[]	message = new byte [2];
		message [0] = (byte) (inCommand | this.midiChannel0);
		message [1] = (byte) inData1;
		
		this.sendMidiMessage (message);
	}
	
	public void
	sendMidiMessage (int inCommand, int inData1, int inData2)
	{
		byte[]	message = new byte [3];
		message [0] = (byte) (inCommand | this.midiChannel0);
		message [1] = (byte) inData1;
		message [2] = (byte) inData2;
		
		this.sendMidiMessage (message);
	}
	
	public void
	sendMidiMessages (byte[][] inMessage)
	{
		for (int i = 0; i < inMessage.length; i++)
		{
			sendMidiMessage (inMessage [i]);
		}
	}

	public void
	sendMidiPitchBend (int inLSB, int inMSB)
	{
		try
		{
			sendMidiMessage (0xe0 | this.midiChannel0, inLSB, inMSB);
		}
		catch (Throwable inThrowable)
		{
System.err.println (inThrowable);
		}
	}
	
	public void
	sendMidiProgramChange (int inPatchNumber)
	{
		try
		{
			sendMidiMessage (0xc0 | this.midiChannel0, inPatchNumber);
		}
		catch (Throwable inThrowable)
		{
System.err.println (inThrowable);
		}
	}
	
	public void
	sendMidiNoteOff (int inNoteNumber)
	{
		try
		{
			// the person responsible for the velocity=0 note off
			// should be eviscerated with a blunt spoon
			sendMidiNoteOn (inNoteNumber, 0);

			this.midiHeldNotes [inNoteNumber] = false;
		}
		catch (Throwable inThrowable)
		{
System.err.println (inThrowable);
		}
	}

	public void
	sendMidiNoteOn (int inNoteNumber, int inVelocity)
	{
		try
		{
			sendMidiMessage (0x90 | this.midiChannel0, inNoteNumber, inVelocity);
			
			this.midiHeldNotes [inNoteNumber] = true;
		}
		catch (Throwable inThrowable)
		{
System.err.println (inThrowable);
		}
	}
	
	public void
	sendParameterChangeMessage (String inName, int inValue)
	throws Exception
	{
		sendMidiMessages (Machine.makeParameterChangeMessage (this.midiChannel0, inName, inValue));
	}
	
	public void
	sendPatchDumpMessage (Patch inPatch)
	throws Exception
	{
		sendMidiMessage (Machine.makePatchDumpMessage (inPatch));
	}

	public void
	sendPatchNameChangeMessage (String inPatchName)
	throws Exception
	{
		sendMidiMessages (Machine.makePatchNameChangeMessage (this.midiChannel0, inPatchName));
	}
	
	public void
	sendWaveBankDumpMessage (WaveBank inWaveBank)
	throws Exception
	{
		sendMidiMessage (Machine.makeWaveBankDumpMessage (inWaveBank));
	}
	
	public void
	setKeyboardWindow (KeyboardWindow inKeyboardWindow)
	{
		this.keyboardWindow = inKeyboardWindow;
	}
	
	public void
	setParameterValueFromMIDI (int inParameterNumber, int inParameterValue)
	{
		if (this.patchWindow == null)
		{
// System.err.println ("ControlWindow.setParameterValue() with no patch window");
		}
		else
		{
			this.patchWindow.setParameterValueFromMIDI (inParameterNumber, inParameterValue);
		}
	}
	
	public void
	setPatchWindow (PatchWindow inPatchWindow)
	{
		this.patchWindow = inPatchWindow;
	}
	
	public void
	setWaveWindow (WaveWindow inWaveWindow)
	{
		this.waveWindow = inWaveWindow;
	}
	
	// STATIC PRIVATE FINAL DATA
	
	private static final String
	kPreferencesPath = "com/prophetvs/editor";
	
	// STATIC PRIVATE DATA
	
	private static ControlWindow
	sInstance = null;
	
	private static Preferences
	sPrefs = null;
	
	// PRIVATE DATA
	
	private boolean[]
	midiHeldNotes = new boolean [128];
	
	private int
	midiChannel0 = 0;
	
	private int
	midiInputDeviceIndex = 0;
	
	private int
	midiOutputDeviceIndex = 0;
	
	private int
	midiThruDeviceIndex = 0;
	
	private Bank
	bank = null;
	
	private Document
	document = null;
	
	private Font
	labelFont = new Font ("Helvetica", Font.ITALIC, 18);
	
	private ImageIcon
	offIcon = new ImageIcon ("vs_blue_button_off.gif");

	private ImageIcon
	onIcon = new ImageIcon ("vs_blue_button_on.gif");

	private JComboBox
	midiChannelPopup = null;
	
	private JComboBox
	midiInputDevicePopup = null;

	private JComboBox
	midiOutputDevicePopup = null;
	
	private JComboBox
	midiThruDevicePopup = null;
	
	private List<MidiInput>
	midiInputList = null;
	
	private List<MidiOutput>
	midiOutputList = null;
	
	private Map<JButton, Boolean>
	buttonClicked = new HashMap<JButton, Boolean> ();
	
	private Patch
	initPatch = null;
	
	// ControlWindow keeps track of the 3 pseudo-modals
	
	private PatchWindow
	patchWindow = null;
	
	private KeyboardWindow
	keyboardWindow = null;

	private WaveWindow
	waveWindow = null;
	
}

