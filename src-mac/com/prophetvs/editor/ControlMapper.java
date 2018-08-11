
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
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
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

public class ControlMapper
	extends JFrame
	implements ActionListener, MidiHost
{
	// MAINLINE
	
	public static void
	main (String[] inArgs)
		throws Exception
	{
		UIManager.setLookAndFeel (UIManager.getSystemLookAndFeelClassName ());
			
		sPrefs = Preferences.userRoot ().node (kPreferencesPath);

		ControlMapper	mapper = new ControlMapper ();
		mapper.setLocationRelativeTo (null);
		mapper.setVisible (true);
	}

	// PUBLIC CONSTRUCTOR
	
	public
	ControlMapper ()
	{
		// INITIALISE MIDI
		
		openMidi ();
		
		// WINDOW CONFIG
		
		setDefaultCloseOperation (EXIT_ON_CLOSE);

		// LAYOUT
		
		getContentPane ().setLayout (new BoxLayout (getContentPane (), BoxLayout.Y_AXIS));

		setBackground (Color.black);
		setForeground (Color.white);

		// add the control routing panel
		getContentPane ().add (makeRoutingPanel ());
		
		// add the MIDI configuration panel
		JPanel	midiDevicePanel = makeMIDIPanel ();
		
		if (midiDevicePanel != null)
		{
			getContentPane ().add (midiDevicePanel);
		}
		
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
			closeMidi ();
			System.exit (0);
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
		if (actionCommand.equals ("MIDI_INPUT_DEVICE_POPUP"))
		{
			saveMidiInputDevicePreference ();
		}
		else
		if (actionCommand.equals ("MIDI_OUTPUT_DEVICE_POPUP"))
		{
			sendMidiAllNotesOff ();
			
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

			saveMidiChannelPreference ();
		}
		else
		if (actionCommand.startsWith ("MIDI_ROUTE_SOURCE_"))
		{
			String	sourceString = actionCommand.substring ("MIDI_ROUTE_SOURCE_".length ());
			int	sourceNumber = Integer.parseInt (sourceString);

			Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);
		
			prefs.put ("midiRouteSource" + sourceNumber,
				(String) this.midiRouteSources [sourceNumber].getSelectedItem ());
		}
		else
		if (actionCommand.startsWith ("MIDI_ROUTE_DESTINATION_"))
		{
			String	destinationString = actionCommand.substring ("MIDI_ROUTE_DESTINATION_".length ());
			int	destinationNumber = Integer.parseInt (destinationString);

			Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);
		
			prefs.put ("midiRouteDestination" + destinationNumber,
				(String) this.midiRouteDestinations [destinationNumber].getSelectedItem ());
		}
	}
	
	// PUBLIC METHODS

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
	
	private JPanel
	makeRoutingPanel ()
	{
		Preferences	prefs = Preferences.userRoot ().node (kPreferencesPath);

		// PANEL
		
		JPanel	panel = new JPanel ();
		panel.setLayout (new BoxLayout (panel, BoxLayout.Y_AXIS));

		// PREP CONTROL NAMES
		
		String[]	controlNames = new String [128];
		
		for (int i = 0; i < controlNames.length; i++)
		{
			controlNames [i] = new String ("" + i);
		}
		
		// PREP VS PARAMETER NAMES
		
		String[]	parameterNames = Patch.getParameterNamesArray ();

		// ROUTES
		
		for (int i = 0; i < 5; i++)
		{
			JPanel	routePanel = new JPanel ();
			routePanel.setLayout (new FlowLayout (FlowLayout.CENTER));
			
			routePanel.add (new JLabel ("CC:"));
			
			this.midiRouteSources [i] = new JComboBox (controlNames);
			this.midiRouteSources [i].setActionCommand ("MIDI_ROUTE_SOURCE_" + i);
			this.midiRouteSources [i].addActionListener (this);
			routePanel.add (this.midiRouteSources [i]);

			String	savedSource = prefs.get ("midiRouteSource" + i, "0");
			this.midiRouteSources [i].setSelectedItem (savedSource);

			routePanel.add (new JLabel ("Parameter:"));

			this.midiRouteDestinations [i] = new JComboBox (parameterNames);
			this.midiRouteDestinations [i].setActionCommand ("MIDI_ROUTE_DESTINATION_" + i);
			this.midiRouteDestinations [i].addActionListener (this);
			routePanel.add (this.midiRouteDestinations [i]);
			
			String	savedDestination = prefs.get ("midiRouteDestination" + i, "WaveNumberA");
			this.midiRouteDestinations [i].setSelectedItem (savedDestination);

			panel.add (routePanel);
		}
		
		return panel;
	}
	
	private void
	openMidi ()
	{
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
	
	public void
	sendMidiAllNotesOff ()
	{
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
	
	public void
	sendMidiChannelPressure (int inPressure)
	{
	}
	
	public void
	sendMidiControlChange (int inControlNumber, int inControlValue)
	{
// System.err.println ("control " + inControlNumber + " value " + inControlValue);

		String	parameterName = null;
		
		// find the parameter source that matches, if any
		for (int i = 0; i < this.midiRouteSources.length; i++)
		{
			String	source = (String) this.midiRouteSources [i].getSelectedItem ();
			
			int	sourceNumber = Integer.parseInt (source);
			
			if (sourceNumber == inControlNumber)
			{
				parameterName = (String) this.midiRouteDestinations [i].getSelectedItem ();
				break;
			}
		}
		
// System.err.println ("parameterName " + parameterName);

		if (parameterName != null)
		{
			try
			{
				// scale incoming value
				Patch.ParameterSpec	spec = Patch.getParameterSpec (parameterName);
			
				// scale to range based units
				int	parameterValue = inControlValue;
				parameterValue *= spec.range;
				parameterValue /= 128;
			
				// apply hacks to take care of the signedness
				if (spec.size == 8 && spec.range == 199)
				{
					parameterValue -= 99;
				}
				else
				if (spec.size == 7 && spec.range == 127)
				{
					parameterValue -= 63;
				}
				
// System.err.println ("parameterValue " + parameterValue);

				// generate the MIDI messages to update the Prophet
				MidiMessage[]	messages = Machine.makeParameterChangeMessage
					(getMidiChannel0 (), parameterName, parameterValue);
					
				sendMidiMessages (messages);
			}
			catch (Exception inException)
			{
System.err.println (inException);
			}
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
	sendMidiProgramChange (int inPatchNumber)
	{
	}

	public void
	sendMidiPitchBend (int inLSB, int inMSB)
	{
	}

	public void
	sendMidiNoteOff (int inNoteNumber)
	{
	}

	public void
	sendMidiNoteOn (int inNoteNumber, int inVelocity)
	{
	}
	
	// this is for updating local state with changes from the Prophet
	// we don't do that, hence...
	public void
	setParameterValueFromMIDI (int inParameterNumber, int inParameterValue)
	{
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
	
	private int
	midiChannel0 = 0;
	
	private int
	midiInputDeviceIndex = 0;
	
	private int
	midiOutputDeviceIndex = 0;
	
	private int
	midiThruDeviceIndex = 0;
	
	private Font
	labelFont = new Font ("Helvetica", Font.ITALIC, 18);

	private JComboBox
	midiChannelPopup = null;
	
	private JComboBox
	midiInputDevicePopup = null;

	private JComboBox
	midiOutputDevicePopup = null;
	
	private JComboBox
	midiThruDevicePopup = null;
	
	private JComboBox[]
	midiRouteDestinations = new JComboBox [128];
	
	private JComboBox[]
	midiRouteSources = new JComboBox [128];
	
	private List<MidiDevice>
	midiInputDeviceList = null;
	
	private List<MidiDevice>
	midiOutputDeviceList = null;
	
	private List<Receiver>
	midiReceiverList = null;
	
	private List<Transmitter>
	midiTransmitterList = null;
	
}

