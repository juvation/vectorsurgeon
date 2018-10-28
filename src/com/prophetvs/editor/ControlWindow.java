
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
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.prefs.Preferences;

import javax.sound.midi.MidiDevice;
import javax.sound.midi.MidiMessage;
import javax.sound.midi.MidiSystem;
import javax.sound.midi.MidiUnavailableException;
import javax.sound.midi.InvalidMidiDataException;
import javax.sound.midi.Receiver;
import javax.sound.midi.Sequencer;
import javax.sound.midi.ShortMessage;
import javax.sound.midi.SysexMessage;
import javax.sound.midi.Transmitter;

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
		boolean	configFileOK = false;
		Document	configDocument = null;
		
		do
		{
			configFileOK = false;
			InputStream	is = null;
			
			try
			{
				is = inConfigFileURL.openStream ();
				
				// parse the GUI XML file
				DocumentBuilderFactory documentFactory = DocumentBuilderFactory.newInstance ();
				DocumentBuilder documentBuilder = documentFactory.newDocumentBuilder ();
				configDocument = documentBuilder.parse (is);
				
				configFileOK = true;
			}
			catch (Throwable inThrowable)
			{
				ControlWindow.showErrorDialog ("Error", inThrowable);
				ControlWindow.showErrorDialog ("Error", "Using default config file.");
				
				// default to the jar file copy
				inConfigFileURL = getResource ("prophetvs_ui.xml");
				
				// and blow away the preference
				sPrefs.remove ("configFilePath");
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
		while (!configFileOK);
		
				
		return configDocument;
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
		showErrorDialog (inTitle, inThrowable.toString ());
	}
	
	// PUBLIC CONSTRUCTOR
	
	public
	ControlWindow (Document inDocument)
	{
		// CACHE ARGUMENTS
		
		this.document = inDocument;
		
		// CONSTRUCT MEMBERS
		
		this.offIcon = new ImageIcon (getResource ("vs_blue_button_off.gif"));
		this.onIcon = new ImageIcon (getResource ("vs_blue_button_on.gif"));
		
		// INITIALISE MIDI
		
		openMidi ();
		
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
			("Version 1.1.6 - Copyright 2018 Jason Proctor <jason@redfish.net>");
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
				MidiMessage	message = Machine.makeBankDumpRequestMessage ();
				
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
				// ensure that the input port is around
				Transmitter	transmitter = getMidiTransmitter (this.midiInputDeviceIndex);
				
				MidiMessage	message = Machine.makeWaveBankDumpRequestMessage ();
				
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

	public MidiDevice
	getMidiInputDevice ()
	{
		return this.midiInputDeviceList.get (this.midiInputDeviceIndex);
	}
	
	public MidiDevice
	getMidiOutputDevice ()
	{
		return this.midiOutputDeviceList.get (this.midiOutputDeviceIndex);
	}

	public MidiDevice
	getMidiThruDevice ()
	{
		return this.midiInputDeviceList.get (this.midiThruDeviceIndex);
	}

	// transmitters are lazily instantiated to speed up startup time
	public Receiver
	getMidiReceiver (int inDeviceIndex)
		throws MidiUnavailableException
	{
		Receiver	receiver = null;
		
		if (inDeviceIndex >= 0 && inDeviceIndex < this.midiReceiverList.size ())
		{
			receiver = this.midiReceiverList.get (inDeviceIndex);
			
			if (receiver == null)
			{
				MidiDevice	device = this.midiOutputDeviceList.get (inDeviceIndex);
				receiver = device.getReceiver ();
				this.midiReceiverList.set (inDeviceIndex, receiver);
			}
		}
		
		return receiver;
	}

	// receivers are lazily instantiated to speed up startup time
	public Transmitter
	getMidiTransmitter (int inDeviceIndex)
		throws MidiUnavailableException
	{
		Transmitter	transmitter = null;
		
		if (inDeviceIndex >= 0 && inDeviceIndex < this.midiTransmitterList.size ())
		{
			transmitter = this.midiTransmitterList.get (inDeviceIndex);
			
			if (transmitter == null)
			{
				MidiDevice	device = this.midiInputDeviceList.get (inDeviceIndex);
				transmitter = device.getTransmitter ();
				transmitter.setReceiver (new MidiReceiver (device, this));
				this.midiTransmitterList.set (inDeviceIndex, transmitter);
			}
		}
		
		return transmitter;
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
	closeMidi ()
	{
		for (int i = 0; i < this.midiInputDeviceList.size (); i++)
		{
			MidiDevice	device = this.midiInputDeviceList.get (i);
			
			if (device.isOpen ())
			{
				try
				{
					device.close ();
				}
				catch (Throwable inThrowable)
				{
					// device.close() frequently crashes
					// with no good explanation
				}
			}
		}
		
		for (int i = 0; i < this.midiOutputDeviceList.size (); i++)
		{
			MidiDevice	device = this.midiOutputDeviceList.get (i);
			
			if (device.isOpen ())
			{
				try
				{
					device.close ();
				}
				catch (Throwable inThrowable)
				{
					// device.close() frequently crashes
					// with no good explanation
				}
			}
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
		buttonLabel.setForeground (Color.white);
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
		
		if (this.midiInputDeviceList != null && this.midiInputDeviceList.size () > 0)
		{
			// use the first MIDI device as the default
			String	defaultName
				= this.midiInputDeviceList.get (0).getDeviceInfo ().getName ();
			
			String	inputPrefsDeviceName = prefs.get ("midiInputDeviceName", defaultName);
			String	thruPrefsDeviceName = prefs.get ("midiThruDeviceName", defaultName);

			int	selectedInputIndex = 0;
			int	selectedThruIndex = 0;
			
			for (int i = 0; i < this.midiInputDeviceList.size (); i++)
			{
				MidiDevice	device = this.midiInputDeviceList.get (i);
				MidiDevice.Info	info = device.getDeviceInfo ();
				String	name = info.getName ();
				
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
		
		if (this.midiOutputDeviceList != null && this.midiOutputDeviceList.size () > 0)
		{
			// use the first MIDI device as the default
			String	defaultName
				= this.midiOutputDeviceList.get (0).getDeviceInfo ().getName ();
			
			String	prefsDeviceName = prefs.get
				("midiOutputDeviceName", defaultName);

			int	selectedIndex = 0;
			
			for (int i = 0; i < this.midiOutputDeviceList.size (); i++)
			{
				MidiDevice	device = this.midiOutputDeviceList.get (i);
				MidiDevice.Info	info = device.getDeviceInfo ();
				String	name = info.getName ();
				
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
		String[]	inputDeviceNameArray = new String [this.midiInputDeviceList.size ()];

		for (int i = 0; i < this.midiInputDeviceList.size (); i++)
		{
			MidiDevice	device = this.midiInputDeviceList.get (i);
			inputDeviceNameArray [i] = device.getDeviceInfo ().getName ();
		}
		
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
		String[]	outputDeviceNameArray = new String [this.midiOutputDeviceList.size ()];

		for (int i = 0; i < this.midiOutputDeviceList.size (); i++)
		{
			MidiDevice	device = this.midiOutputDeviceList.get (i);
			outputDeviceNameArray [i] = device.getDeviceInfo ().getName ();
		}
		
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
System.err.println ("using JavaMIDI for MIDI");

		// get a list of MIDI devices
		MidiDevice.Info[]	deviceInfoArray = MidiSystem.getMidiDeviceInfo ();

		if (deviceInfoArray == null || deviceInfoArray.length == 0)
		{
			return;
		}
		
		// build our device lists
		this.midiInputDeviceList = new ArrayList<MidiDevice> ();
		this.midiOutputDeviceList = new ArrayList<MidiDevice> ();

		// and the transmitter/receiver lists
		// btw input == transmitter, output == receiver
		this.midiReceiverList = new ArrayList<Receiver> ();
		this.midiTransmitterList = new ArrayList<Transmitter> ();
		
		for (int i = 0; i < deviceInfoArray.length; i++)
		{
			MidiDevice.Info	deviceInfo = deviceInfoArray [i];
			
			try
			{
				MidiDevice	device =  MidiSystem.getMidiDevice (deviceInfo);
				
				if (device instanceof Sequencer)
				{
					// we don't talk to Java Sequencers
					// but we *do* talk to Java Synthesizers
					// as some people have software Prophets
				}
				else
				{
					device.open ();
					
					// caution here: this can return -1 for "unlimited transmitters"
					if (device.getMaxTransmitters () != 0)
					{
						this.midiInputDeviceList.add (device);

						// transmitters are lazily instantiated now
						this.midiTransmitterList.add (null);
					}
							
					// caution here: this can return -1 for "unlimited receivers"
					if (device.getMaxReceivers () != 0)
					{
						this.midiOutputDeviceList.add (device);
						
						// receivers are lazily instantiated now
						this.midiReceiverList.add (null);
					}
				}
			}
			catch (Exception inException)
			{
				// can't open device
				// or couldn't get receiver/transmitter
				// == ignore the device
System.err.println (inException);
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
			
			try
			{
				// and ensure we have a transmitter cached
				// because we're listening... all the time
				getMidiTransmitter (this.midiInputDeviceIndex);
			}
			catch (Throwable inThrowable)
			{
System.err.println (inThrowable);
			}
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
			
			try
			{
				// and ensure we have a transmitter cached
				// because we're listening... all the time
				getMidiTransmitter (this.midiThruDeviceIndex);
			}
			catch (Throwable inThrowable)
			{
System.err.println (inThrowable);
			}
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
			ShortMessage	message = new ShortMessage ();
			message.setMessage (ShortMessage.CONTROL_CHANGE, this.midiChannel0, inPressure, 0);
			
			sendMidiMessage (message);
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
			ShortMessage	message = new ShortMessage ();
			message.setMessage (ShortMessage.CONTROL_CHANGE,
				this.midiChannel0, inControlNumber, inControlValue);
			
			sendMidiMessage (message);
		}
		catch (Throwable inThrowable)
		{
System.err.println (inThrowable);
		}
	}
	
	public void
	sendMidiMessage (MidiMessage inMessage)
		throws MidiUnavailableException
	{
		if (this.midiOutputDeviceIndex >= 0
			&& this.midiOutputDeviceIndex < this.midiOutputDeviceList.size ())
		{
			Receiver	receiver = getMidiReceiver (this.midiOutputDeviceIndex);
			receiver.send (inMessage, 0);
		}
	}
	
	public void
	sendMidiMessages (MidiMessage[] inMessages)
		throws MidiUnavailableException
	{
		for (int i = 0; i < inMessages.length; i++)
		{
			try
			{
				sendMidiMessage (inMessages [i]);
			}
			catch (Throwable inThrowable)
			{
System.err.println (inThrowable);
			}
		}
	}
	
	public void
	sendMidiPitchBend (int inLSB, int inMSB)
	{
		try
		{
			ShortMessage	message = new ShortMessage ();
			message.setMessage (ShortMessage.PROGRAM_CHANGE, this.midiChannel0, inLSB, inMSB);
			
			sendMidiMessage (message);
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
			ShortMessage	message = new ShortMessage ();
			message.setMessage (ShortMessage.PROGRAM_CHANGE, this.midiChannel0, inPatchNumber, 0);
			
			sendMidiMessage (message);
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
			ShortMessage	message = new ShortMessage ();
			message.setMessage (ShortMessage.NOTE_ON, this.midiChannel0, inNoteNumber, inVelocity);
			
			sendMidiMessage (message);
			
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
	
	private List<MidiDevice>
	midiInputDeviceList = null;
	
	private List<MidiDevice>
	midiOutputDeviceList = null;
	
	private List<Receiver>
	midiReceiverList = null;
	
	private List<Transmitter>
	midiTransmitterList = null;
	
	private Map<JButton, Boolean>
	buttonClicked = new HashMap<JButton, Boolean> ();
	
	// ControlWindow keeps track of the 3 pseudo-modals
	
	private PatchWindow
	patchWindow = null;
	
	private KeyboardWindow
	keyboardWindow = null;

	private WaveWindow
	waveWindow = null;
	
}

