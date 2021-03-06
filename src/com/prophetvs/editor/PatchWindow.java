
// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.FlowLayout;
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
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.prefs.Preferences;

import javax.sound.midi.MidiMessage;
import javax.sound.midi.ShortMessage;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.KeyStroke;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JRootPane;
import javax.swing.JSlider;
import javax.swing.JTabbedPane;
import javax.swing.JTextField;
import javax.swing.border.TitledBorder;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

// CLASS

public class PatchWindow
	extends JFrame
	implements ActionListener, ChangeListener, ClipboardOwner, DocumentListener, MouseListener, WindowListener
{
	// CONSTRUCTOR
	
	public 
	PatchWindow (BankWindow inBankWindow, Document inDocument, Patch inPatch)
		throws Exception
	{
		this.bankWindow = inBankWindow;
		this.patch = inPatch;
		
		// CONFIGURATION
		
		setWindowTitle ();
		
		setResizable (false);
		setDefaultCloseOperation (DO_NOTHING_ON_CLOSE);
		addWindowListener (this);
		
		// LAYOUT
		
		getContentPane ().setLayout (new BorderLayout ());

		// add copy/paste actions
		Toolkit	toolkit = Toolkit.getDefaultToolkit ();
		KeyStroke copyKey = KeyStroke.getKeyStroke
			(KeyEvent.VK_C, toolkit.getMenuShortcutKeyMask (), false);
			
		Container	contentPane = getContentPane ();
		
		if (contentPane instanceof JComponent)
		{
			((JComponent) contentPane).registerKeyboardAction
				(this, "COPY", copyKey, JComponent.WHEN_FOCUSED);
		}
		
		// set up our xpath environment
		XPath	xpath = XPathFactory.newInstance ().newXPath ();

		// find the machine tag
		String expression = "machine";
		Node machineNode = (Node) xpath.evaluate
			(expression, inDocument, XPathConstants.NODE);
		
		// bail if not there
		if (machineNode == null)
		{
			throw new Exception ("missing machine node");
		}
		
		// find all the variable references
		expression = "declare[@name][@value]";
		NodeList	declareList = (NodeList) xpath.evaluate
			(expression, machineNode, XPathConstants.NODESET);
		
// System.err.println (declareList.getLength () + " valid declare statements found");
		
		for (int i = 0; i < declareList.getLength (); i++)
		{
			Node	node = declareList.item (i);
			NamedNodeMap	attributes = node.getAttributes ();
			
			Attr	nameNode = (Attr) attributes.getNamedItem ("name");
			Attr	valueNode = (Attr) attributes.getNamedItem ("value");

			this.variableMap.put (nameNode.getValue (), valueNode.getValue ());	
		}

		// get a list of pages
		expression = "page[@name]";
		NodeList	pageList = (NodeList) xpath.evaluate
			(expression, machineNode, XPathConstants.NODESET);
		
		if (pageList.getLength () == 0)
		{
			throw new Exception ("no patch window pages found");
		}
			
		this.tabbedPane = new JTabbedPane ();
		
		for (int i = 0; i < pageList.getLength (); i++)
		{
			Node	node = pageList.item (i);
			
			JPanel	page = new JPanel ();
			page.setLayout (new BorderLayout ());
			
			NamedNodeMap	attributes = node.getAttributes ();
			
			if (attributes != null)
			{
				Attr	nameNode = (Attr) attributes.getNamedItem ("name");
				
				this.tabbedPane.addTab (nameNode.getValue (), page);
			}
			
			// traverse the hierarchy of nodes
			// building Swing elements
			processNode (node, page);
		}
		
		// update the controls with the values from the patch
		copyPatchToControls ();

		// OK *now* add the action listeners etc to the controls
		activateControlListeners ();
		
		getContentPane ().add (this.tabbedPane, BorderLayout.CENTER);

		// toolbar
		JPanel	buttonBar = new JPanel ();
		buttonBar.setLayout (new FlowLayout (FlowLayout.CENTER));
		getContentPane ().add (buttonBar, BorderLayout.SOUTH);
		
		JButton	saveButton = new JButton ("Save to Bank");
		saveButton.setActionCommand ("SAVE_TO_BANK");
		saveButton.addActionListener (this);
		buttonBar.add (saveButton);
		
		JButton	saveAsButton = new JButton ("Save to File...");
		saveAsButton.setActionCommand ("SAVE_TO_FILE");
		saveAsButton.addActionListener (this);
		buttonBar.add (saveAsButton);
		
		JButton	sendButton = new JButton ("Send to Prophet");
		sendButton.setActionCommand ("SEND_PATCH");
		sendButton.addActionListener (this);
		buttonBar.add (sendButton);

		JButton	varyButton = new JButton ("Vary Patch...");
		varyButton.setActionCommand ("VARY");
		varyButton.addActionListener (this);
		buttonBar.add (varyButton);
		
		JButton	copyButton = new JButton ("Copy Patch");
		copyButton.setActionCommand ("COPY");
		copyButton.addActionListener (this);
		buttonBar.add (copyButton);
		
		JButton	keyboardButton = new JButton ("Keyboard");
		keyboardButton.setActionCommand ("KEYBOARD");
		keyboardButton.addActionListener (this);
		buttonBar.add (keyboardButton);
		
		// PACK
		pack ();
	}

	// COMPONENT OVERRIDES
	
	// it is a bug that i should have to do this
	// setVisible(false) should call windowIsClosing()
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
			
			if (this.bankWindow != null && this.patch.isModified ())
			{
				StringBuffer	buffer = new StringBuffer ();
				
				buffer.append ("Save \"");
				buffer.append (this.patch.getName ());
				buffer.append ("\" back to \"");
				buffer.append (this.bankWindow.getTitle ());
				buffer.append ("\" before closing?");
				
				int	response = JOptionPane.showConfirmDialog
					(this, buffer.toString (), "Confirm", JOptionPane.YES_NO_CANCEL_OPTION);
					
				if (response == JOptionPane.YES_OPTION)
				{
					this.bankWindow.setPatch (this.patch);
				}
				else
				if (response == JOptionPane.CANCEL_OPTION)
				{
					closeWindow = false;
				}
			}

			if (closeWindow)
			{
				ControlWindow.getInstance ().setPatchWindow (null);

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
		
// System.err.println ("PatchWindow.actionPerformed(" + actionCommand + ")");
		
		if (actionCommand.equals ("PARAMETER_POPUP"))
		{
			JComboBox	popup = (JComboBox) inEvent.getSource ();
			
			String	parameterName = this.componentToNameMap.get (popup);
			int	value = popup.getSelectedIndex ();
				
// System.err.println ("set popup " + parameterName + " to value " + value);

			setPatchParameterValue (parameterName, value);

			// now update any duplicates of those controls sigh
			updateDuplicateControls (parameterName, value, popup);
		}
		else
		if (actionCommand.equalsIgnoreCase ("KEYBOARD_CLOSE_ACTION"))
		{
			setVisible (false);
			
			if (! isVisible ())
			{
				dispose ();
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("SAVE_TO_BANK"))
		{
			if (this.patch.isModified ())
			{
				this.bankWindow.setPatch (this.patch);
				setPatchModified (false);
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("SAVE_TO_FILE"))
		{
			File	file = ControlWindow.getFileForSave (this, "Save", null);
				
			if (file != null)
			{
				FileOutputStream	fos = null;
				
				try
				{
					fos = new FileOutputStream (file);
					this.patch.write (fos);
				}
				catch (Exception inException)
				{
					ControlWindow.getInstance ().showErrorDialog ("Error", inException);
				}
				finally
				{
					if (fos != null)
					{
						try
						{
							fos.close ();
						}
						catch (Exception inException)
						{
						}
					}
				}
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("SEND_PATCH"))
		{
			StringBuffer	buffer = new StringBuffer ();
			buffer.append ("OK to overwrite patch ");
			buffer.append (this.patch.getPatchNumber ());
			buffer.append (" in Prophet?");
			
			int	response = ControlWindow.getInstance ().showConfirmDialog
				("Transmit", buffer.toString ());
			
			if (response == JOptionPane.YES_OPTION)
			{
				try
				{
					ControlWindow.getInstance ().sendPatchDumpMessage (this.patch);
				}
				catch (Exception inException)
				{
					ControlWindow.getInstance ().showErrorDialog ("Error", inException);
				}
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("VARY"))
		{
			VaryWindow	varyWindow = new VaryWindow (this.patch);
			varyWindow.setLocationRelativeTo (null);
			varyWindow.setVisible (true);
		}
		else
		if (actionCommand.equalsIgnoreCase ("COPY"))
		{
			TransferablePatch	transferable = new TransferablePatch (this.patch);
			Toolkit.getDefaultToolkit ().getSystemClipboard ().setContents (transferable, this);
		}
		else
		if (actionCommand.equals ("KEYBOARD"))
		{
			ControlWindow	controlWindow = ControlWindow.getInstance ();
			KeyboardWindow	keyboardWindow = controlWindow.getKeyboardWindow ();
			
			if (keyboardWindow == null)
			{
				keyboardWindow = new KeyboardWindow ();
				keyboardWindow.setSize (600, 200);
				keyboardWindow.setLocationRelativeTo (null);
				
				controlWindow.setKeyboardWindow (keyboardWindow);
			}
			
			keyboardWindow.setVisible (true);
			keyboardWindow.toFront ();
		}
	}
	
	// CHANGELISTENER IMPLEMENTATION
	
	public void
	stateChanged (ChangeEvent inEvent)
	{
		JComponent	source = (JComponent) inEvent.getSource ();

		// System.err.println ("stateChanged(" + source.getClass ().getName () + ")");
		
		String	parameterName = null;
		int	parameterValue = 0;
		
		if (source instanceof JSlider)
		{
			JSlider	slider = (JSlider) source;
			parameterName = this.componentToNameMap.get (slider);
			parameterValue = slider.getValue ();
			
// System.err.println ("set slider " + parameterName + " to value " + value);

			JLabel	valueLabel = this.componentToLabelMap.get (source);
			
			if (valueLabel != null)
			{
				valueLabel.setText (Integer.toString (parameterValue));
			}
			
			setPatchParameterValue (parameterName, parameterValue);
		}
		else
		if (source instanceof JCheckBox)
		{
			JCheckBox	checkBox = (JCheckBox) source;
			parameterName = this.componentToNameMap.get (checkBox);
			boolean	selected = checkBox.isSelected ();
			
// System.err.println ("set checkbox " + parameterName + " to value " + selected);

			parameterValue = selected ? 1 : 0;
			
			setPatchParameterValue (parameterName, parameterValue);
		}
		else
		if (source instanceof CustomControl)
		{
			// a special subclass of ChangeEvent 
			// so we don't send ALL the parameters for an envelope
			// when someone changes one parameter
			CustomControlChangeEvent	event = (CustomControlChangeEvent) inEvent;
			
			setPatchParameterValue (event.getParameterName (), event.getParameterValue ());
		}
		
		if (parameterName != null)
		{
			updateDuplicateControls (parameterName, parameterValue, source);
		}
			
	}
	
	// CLIPBOARD OWNER IMPLEMENTATION
	
	public void
	lostOwnership (Clipboard inClipboard, Transferable inContents)
	{
		// like we care
	}
	
	// DOCUMENTLISTENER IMPLEMENTATION
	
	// these correspond to the patch name field only - currently
	
	public void
	changedUpdate (DocumentEvent inEvent)
	{
		trackTextFieldChange (inEvent);
	}
	
	public void
	insertUpdate (DocumentEvent inEvent)
	{
		trackTextFieldChange (inEvent);
	}
	
	public void
	removeUpdate (DocumentEvent inEvent)
	{
		trackTextFieldChange (inEvent);
	}

	// MOUSELISTENER IMPLEMENTATION
	
  public void
  mouseClicked (MouseEvent inEvent)
  {
  	Object	source = inEvent.getSource ();
  	
  	if (source instanceof JLabel)
  	{
  		JLabel	label = (JLabel) source;
  		JComponent	component = this.labelToComponentMap.get (label);
  		
  		if (component == null)
  		{
  			System.err.println ("no component for label: " + label.getText ());
  		}
  		else
  		{
  			String	parameterName = this.componentToNameMap.get (component);
  			
  			if (parameterName == null)
  			{
  				System.err.println ("no name for component!");
  			}
  			else
  			{
  				Patch	initPatch = ControlWindow.getInstance ().getInitPatch ();
  				
  				try
  				{
						int	initValue = initPatch.getParameterValue (parameterName);
						setParameterValue (parameterName, initValue);
					}
					catch (VSException inException)
					{
						ControlWindow.showErrorDialog ("Error", inException);
					}
  			}
  		}
  	}
  }
  
  public void
  mousePressed (MouseEvent inEvent)
  {
  	Object	source = inEvent.getSource ();
  	
  	if (source instanceof JLabel)
  	{
			JLabel	label = (JLabel) source;
			label.setForeground (Color.WHITE);
			label.setBackground (Color.BLACK);
		}
  }
  
  public void
  mouseReleased (MouseEvent inEvent)
  {
  	Object	source = inEvent.getSource ();
  	
  	if (source instanceof JLabel)
  	{
			JLabel	label = (JLabel) source;
			label.setForeground (Color.BLACK);
			label.setBackground (Color.WHITE);
		}
  }
  
  public void
  mouseEntered (MouseEvent inEvent)
  {
  }

  public void
  mouseExited (MouseEvent inEvent)
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
		
		// caution! setVisible() is overridden
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
	
	// HACK needed by BankWindow's child window check
	public BankWindow
	getBankWindow ()
	{
		return this.bankWindow;
	}
	
	// HACK needed by custom control
	public Patch
	getPatch ()
	{
		return this.patch;
	}
	
	// for use by imperative clients of PatchWindow
	// like custom actions etc
	// so we have to go in at the top by setting the control value
	// somehow i get the feeling that we're doing these things in an awkward order...
	public void
	setParameterValue (String inParameterName, int inParameterValue)
	{
		try
		{
			setPatchModified (true);

			// check for meta parameter!
			MetaParameters	mp = MetaParameters.getInstance ();
			
			List<String>	patchParameterNames = mp.get (inParameterName);
			
			if (patchParameterNames == null)
			{
				// regular parameter

				// make the change in our patch
				this.patch.setParameterValue (inParameterName, inParameterValue);

				// the change handlers on the JComponents
				// will update the patch (again) and send the parameter change messages
				List<JComponent>	controls = this.nameToComponentMap.get (inParameterName);
				
				for (JComponent control : controls)
				{
					copyParameterToControl (inParameterName, control);
				}
			}
			else
			{
				// meta parameter(s)
				
				for (int i = 0; i < patchParameterNames.size (); i++)
				{
					String	patchParameterName = patchParameterNames.get (i);
					
					// make the change in our patch
					this.patch.setParameterValue (patchParameterName, inParameterValue);

					// the change handlers on the JComponents
					// will update the patch (again) and send the parameter change messages
					List<JComponent>	controls = this.nameToComponentMap.get (inParameterName);
				
					for (JComponent control : controls)
					{
						copyParameterToControl (inParameterName, control);
					}
				}
			}
		}
		catch (Exception inException)
		{
			// offensive UI? should we have a status pane instead?
			ControlWindow.showErrorDialog ("Error", inException);
		}
	}
	
	// used to remote-control Patcher from the Prophet
	// inParameterValue is a raw MIDI value
	public void
	setParameterValueFromMIDI (int inParameterNumber, int inParameterValue)
	{
		try
		{
			// look up the parameter spec
			String	parameterName = Patch.getParameterName (inParameterNumber);
			
			if (parameterName == null)
			{
System.err.println ("no parameter name for parameter number " + inParameterNumber);
			}
			else
			{
				// note we only switch to the first tab found
				// in the case of duplicates
				int	componentTabIndex = -1;
				
				// now look up the component for our parameter
				List<JComponent>	controls = nameToComponentMap.get (parameterName);
				
				for (JComponent control : controls)
				{
					if (componentTabIndex == -1)
					{
						// look up which tab it's in
						// btw, indexOfComponent() won't do the job here
						for (int i = 0; i < this.tabbedPane.getTabCount (); i++)
						{
							Component	component = this.tabbedPane.getComponentAt (i);
							
							if (component instanceof Container)
							{
								Container	container = (Container) component;
								
								// now traverse the jcomponent's parents
								// if we find container, it's in this tab (sigh)
								for (Container	parent = control.getParent ();
									parent != null;
									parent = parent.getParent ())
								{
									if (parent == container)
									{
										componentTabIndex = i;
										break;
									}
								}
							}
						}
						
						if (componentTabIndex >= 0)
						{
							this.tabbedPane.setSelectedIndex (componentTabIndex);
						}
					}
					
					// scale incoming value
					Patch.ParameterSpec	spec = Patch.getParameterSpec (parameterName);
					
					// get some more resolution
					double	doubleValue = (double) inParameterValue;
					
					// convert to 8 bit based units
					doubleValue /= 256;
					
					// scale up to range based units
					doubleValue *= spec.range;
					
					// and now back to integerland
					// TODO is floor() or ceil() best here? ceil() seems to give arg+1
					int	parameterValue = (int) Math.floor (doubleValue);

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
					
					// figure out what kind of jcomponent we have
					if (control instanceof JCheckBox)
					{
						JCheckBox	checkBox = (JCheckBox) control;
						checkBox.removeChangeListener (this);
						checkBox.setSelected (parameterValue != 0);
						checkBox.addChangeListener (this);
					}
					else
					if (control instanceof JComboBox)
					{
						JComboBox	popup = (JComboBox) control;
						popup.removeActionListener (this);
						popup.setSelectedIndex (parameterValue);
						popup.addActionListener (this);
					}
					else
					if (control instanceof JSlider)
					{
						JSlider	slider = (JSlider) control;
						slider.removeChangeListener (this);
						slider.setValue (parameterValue);
						slider.addChangeListener (this);
						
						JLabel	valueLabel = this.componentToLabelMap.get (slider);
						
						if (valueLabel != null)
						{
							valueLabel.setText (Integer.toString (parameterValue));
						}
					}
					else
					if (control instanceof CustomControl)
					{
						CustomControl	customControl = (CustomControl) control;
						customControl.removeChangeListener (this);
						customControl.setParameterValue (parameterName, parameterValue);
						customControl.addChangeListener (this);
					}
					
					// make the change in our patch
					this.patch.setParameterValue (parameterName, parameterValue);
					
					// give the user some nice visual feedback that the window has changed
					// (most likely Mac only)
					setPatchModified (true);
				}
			}
		}
		catch (Exception inException)
		{
System.err.println (inException);
		}
	}

	// called from the actionListeners on the controls
	public void
	setPatchParameterValue (String inParameterName, int inParameterValue)
	{
		try
		{
			setPatchModified (true);

			// check for meta parameter!
			MetaParameters	mp = MetaParameters.getInstance ();
			
			List<String>	patchParameterNames = mp.get (inParameterName);
			
			if (patchParameterNames == null)
			{
				// regular parameter

				// make the change in our patch
				this.patch.setParameterValue (inParameterName, inParameterValue);

				// and send them
				ControlWindow.getInstance ().sendParameterChangeMessage (inParameterName, inParameterValue);
			}
			else
			{
				// meta parameter(s)
				
				for (int i = 0; i < patchParameterNames.size (); i++)
				{
					String	patchParameterName = patchParameterNames.get (i);
					
					// make the change in our patch
					this.patch.setParameterValue (patchParameterName, inParameterValue);

					// the change handlers on the JComponents
					// will update the patch (again) and send the parameter change messages
					List<JComponent>	controls = this.nameToComponentMap.get (patchParameterName);
				
					for (JComponent control : controls)
					{
						copyParameterToControl (patchParameterName, control);
					}
				}
			}
		}
		catch (Exception inException)
		{
			// offensive UI? should we have a status pane instead?
			ControlWindow.showErrorDialog ("Error", inException);
		}
	}
	
	// PRIVATE METHODS
	
	private void
	activateControlListeners ()
	{
		Iterator<JComponent>	controls = this.componentToNameMap.keySet ().iterator ();
		
		while (controls.hasNext ())
		{
			JComponent	control = controls.next ();

			if (control instanceof JSlider)
			{
				JSlider	slider = (JSlider) control;
				slider.addChangeListener (this);
			}
			else
			if (control instanceof JComboBox)
			{
				JComboBox	popup = (JComboBox) control;
				popup.addActionListener (this);
			}
			else
			if (control instanceof JCheckBox)
			{
				JCheckBox	checkbox = (JCheckBox) control;
				checkbox.addChangeListener (this);
			}
			else
			if (control instanceof JTextField)
			{
				JTextField	textField = (JTextField) control;
				textField.getDocument ().addDocumentListener (this);
			}
			else
			if (control instanceof CustomControl)
			{
				CustomControl	customControl = (CustomControl) control;
				customControl.addChangeListener (this);
			}
		}
	}
	
	private void
	addToNameToComponentMap (String inParameterName, JComponent inControl)
	{
		if (inParameterName == null || inParameterName.length () == 0)
		{
			System.err.println ("addToNameToComponentMap() with null or empty parameter name");
			new Exception ().printStackTrace (System.err);
		}
		
		List<JComponent>	controls = this.nameToComponentMap.get (inParameterName);

		if (controls == null)
		{
			controls = new ArrayList<JComponent> ();
			this.nameToComponentMap.put (inParameterName, controls);
		}

		controls.add (inControl);
	}
	
	private void
	copyParameterToControl (String inParameterName, JComponent outControl)
	{
		// HACK check for meta-params
		if (inParameterName.equalsIgnoreCase ("$PatchName"))
		{
			if (outControl instanceof JTextField)
			{
				JTextField	textField = (JTextField) outControl;
				textField.setText (this.patch.getName ());
			}
		}
		else
		{
			int	value = 0;
			
			try
			{
				value = this.patch.getParameterValue (inParameterName);

				if (outControl instanceof JSlider)
				{
					JSlider	slider = (JSlider) outControl;
					slider.setValue (value);

					JLabel	valueLabel = this.componentToLabelMap.get (outControl);
					
					if (valueLabel != null)
					{
						valueLabel.setText (Integer.toString (value));
					}
				}
				else
				if (outControl instanceof JComboBox)
				{
					try
					{
						JComboBox	popup = (JComboBox) outControl;
						popup.setSelectedIndex (value);
					}
					catch (Exception inException)
					{
System.err.println ("error setting popup of parameter " + inParameterName);
System.err.println (inException);
					}
				}
				else
				if (outControl instanceof JCheckBox)
				{
					JCheckBox	checkbox = (JCheckBox) outControl;
					checkbox.setSelected (value != 0);
				}
				else
				if (outControl instanceof CustomControl)
				{
					CustomControl	customControl = (CustomControl) outControl;
					customControl.setParameterValue (inParameterName, value);
				}
			}
			catch (VSException inException)
			{
				inException.printStackTrace (System.err);
			}
		}
	}
	
	// note, the componentToNameMap is incompatible with custom controls
	// as custom controls have multiple parameter names (or *can*)
	// should be JComponent->List<String>
	// but the only problem is how we use it here
	// so we use nameToComponentMap instead!
	
	private void
	copyPatchToControls ()
	{
		for (String parameterName : this.nameToComponentMap.keySet ())
		{
			if (parameterName == null)
			{
				System.err.println ("null parameter name in name to component map!");
				continue;
			}
			
			List<JComponent>	controls = this.nameToComponentMap.get (parameterName);

			if (controls == null)
			{
				System.err.println ("found null controls for parameter " + parameterName);
				continue;
			}
			
			// check for meta parameter!
			MetaParameters	mp = MetaParameters.getInstance ();
			
			List<String>	patchParameterNames = mp.get (parameterName);
			
			for (JComponent control : controls)
			{
				if (patchParameterNames == null)
				{
					copyParameterToControl (parameterName, control);
				}
				else
				{
					// remember only do the first value
					// as the list of parameters might/will have different values
					if (patchParameterNames.size () > 0)
					{
						copyParameterToControl (patchParameterNames.get (0), control);
					}
				}
			}
		}
	}

	private void
	copyPatchToControlsOld ()
	{
		Iterator<JComponent>	controls = this.componentToNameMap.keySet ().iterator ();
		
		while (controls.hasNext ())
		{
			JComponent	control = controls.next ();
			String	parameterName = this.componentToNameMap.get (control);
			
			System.err.println ("copyPatchToControls() is copying " + parameterName);
			
			// check for meta parameter!
			MetaParameters	mp = MetaParameters.getInstance ();
			
			List<String>	patchParameterNames = mp.get (parameterName);
			
			if (patchParameterNames == null)
			{
				copyParameterToControl (parameterName, control);
			}
			else
			{
				// remember only do the first value
				// as the list of parameters might/will have different values
				if (patchParameterNames.size () > 0)
				{
					copyParameterToControl (patchParameterNames.get (0), control);
				}
			}
		}
	}
			
	private void
	processButton (Node inButtonNode, JPanel inPanel)
	throws Exception
	{
		NamedNodeMap	attributes = inButtonNode.getAttributes ();
		
		
		JPanel	componentPanel = new JPanel ();
		componentPanel.setLayout (new FlowLayout (FlowLayout.LEADING));
		inPanel.add (componentPanel);
		
		Attr	labelNode = (Attr) attributes.getNamedItem ("label");
		JButton	button = new JButton (labelNode.getValue ());
		componentPanel.add (button);

		ActionListener	actionListener = null;
		
		Attr	actionNode = (Attr) attributes.getNamedItem ("action");
		Attr	classNode = (Attr) attributes.getNamedItem ("class");
		
		if (classNode == null)
		{
			actionListener = new GenericAction (actionNode.getValue ());
		}
		else
		{
			Class	actionClass = Class.forName (classNode.getValue ());
			actionListener = (ActionListener) actionClass.newInstance ();
			button.setActionCommand (actionNode.getValue ());
		}
		
		button.addActionListener (actionListener);
	}
	
	private void
	processCheckbox (Node inCheckboxNode, JPanel inPanel)
	{
		NamedNodeMap	attributes = inCheckboxNode.getAttributes ();
		
		Attr	labelNode = (Attr) attributes.getNamedItem ("label");
		Attr	parameterNode = (Attr) attributes.getNamedItem ("parameter");
		
		JPanel	componentPanel = new JPanel ();
		componentPanel.setLayout (new FlowLayout (FlowLayout.LEADING));
		inPanel.add (componentPanel);
		
		JCheckBox	checkBox = new JCheckBox (labelNode.getValue ());
		componentPanel.add (checkBox);
		
		String	parameterName = parameterNode.getValue ();
		addToNameToComponentMap (parameterName, checkBox);
		this.componentToNameMap.put (checkBox, parameterName);
	}
	
	private void
	processCustomControl (Node inCustomNode, JPanel inPanel)
		throws Exception
	{
		NamedNodeMap	attributes = inCustomNode.getAttributes ();
		
		Attr	classNode = (Attr) attributes.getNamedItem ("class");
		Class	controlClass = Class.forName (classNode.getValue ());
		CustomControl	customControl = (CustomControl) controlClass.newInstance ();
		
		// let the control initialise itself from its XML node
		customControl.initialise (this, inCustomNode);
		
		// hook it up
		Attr	labelNode = (Attr) attributes.getNamedItem ("label");
		
		JPanel	componentPanel = new JPanel ();
		componentPanel.setLayout (new BoxLayout (componentPanel, BoxLayout.Y_AXIS));
		inPanel.add (componentPanel);

		JPanel	customPanel = new JPanel ();
		customPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		componentPanel.add (customPanel);
		
		customPanel.add (customControl);
		
		String[]	parameterNames = customControl.getParameterNames ();
		
		if (parameterNames != null && parameterNames.length > 0)
		{
			for (int i = 0; i < parameterNames.length; i++)
			{
				// have to have one entry in the component to name map
				// in order to be called to initialise ourselves - sigh
				if (i == 0)
				{
					this.componentToNameMap.put (customControl, parameterNames [0]);
				}
				
				addToNameToComponentMap (parameterNames [i], customControl);
			}
		}
		
		JPanel	labelPanel = new JPanel ();
		labelPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		
		JLabel	label = new JLabel (labelNode.getValue ());
		labelPanel.add (label);
		componentPanel.add (labelPanel);
	}
	
	private void
	processNode (Node inNode, JPanel inPanel)
		throws Exception
	{
		NodeList	children = inNode.getChildNodes ();

		for (int i = 0; i < children.getLength (); i++)
		{
			JPanel	subPanel = null;
			Node	node = children.item (i);
			String	name = node.getNodeName ();
			
			if (name.equalsIgnoreCase ("verticalbox"))
			{
				subPanel = new JPanel ();
				subPanel.setLayout (new BoxLayout (subPanel, BoxLayout.Y_AXIS));
				
				processNode (node, subPanel);
			}
			else
			if (name.equalsIgnoreCase ("horizontalbox"))
			{
				subPanel = new JPanel ();
				subPanel.setLayout (new BoxLayout (subPanel, BoxLayout.X_AXIS));
				
				processNode (node, subPanel);
			}
			else
			if (name.equalsIgnoreCase ("leadingpanel"))
			{
				subPanel = new JPanel ();
				subPanel.setLayout (new FlowLayout (FlowLayout.LEADING));
				
				processNode (node, subPanel);
			}
			else
			if (name.equalsIgnoreCase ("trailingpanel"))
			{
				subPanel = new JPanel ();
				subPanel.setLayout (new FlowLayout (FlowLayout.TRAILING));
				
				processNode (node, subPanel);
			}
			else
			if (name.equalsIgnoreCase ("horizontalcenter"))
			{
				subPanel = new JPanel ();
				subPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
				
				processNode (node, subPanel);
			}
			else
			if (name.equalsIgnoreCase ("verticalcenter"))
			{
				subPanel = new JPanel ();
				subPanel.setLayout (new BoxLayout (subPanel, BoxLayout.Y_AXIS));

				// now glue both sides to centre-align
				subPanel.add (Box.createGlue ());

				JPanel	subSubPanel = new JPanel ();
				subPanel.add (subSubPanel);

				subPanel.add (Box.createGlue ());
				
				processNode (node, subSubPanel);
			}
			else
			if (name.equalsIgnoreCase ("button"))
			{
				processButton (node, inPanel);
			}
			else
			if (name.equalsIgnoreCase ("checkbox"))
			{
				processCheckbox (node, inPanel);
			}
			else
			if (name.equalsIgnoreCase ("popup"))
			{
				processPopup (node, inPanel);
			}
			else
			if (name.equalsIgnoreCase ("slider"))
			{
				processSlider (node, inPanel);
			}
			else
			if (name.equalsIgnoreCase ("title"))
			{
				processTitle (node, inPanel);
			}
			else
			if (name.equalsIgnoreCase ("textfield"))
			{
				processTextField (node, inPanel);
			}
			else
			if (name.equalsIgnoreCase ("custom"))
			{
				processCustomControl (node, inPanel);
			}
			else
			{
				// process unknown node's children
				processNode (node, inPanel);
			}
			
			if (subPanel != null)
			{
				NamedNodeMap	attributes = node.getAttributes ();
				
				Attr	nameNode = (Attr) attributes.getNamedItem ("name");
				
				if (nameNode != null)
				{
					TitledBorder	border = (TitledBorder)
						BorderFactory.createTitledBorder (nameNode.getValue ());
					border.setTitleJustification (TitledBorder.CENTER);

					subPanel.setBorder (border);
				}

				inPanel.add (subPanel);
			}
		}
	}
	
	private void
	processPopup (Node inPopupNode, JPanel inPanel)
	{
		NamedNodeMap	attributes = inPopupNode.getAttributes ();
		
		Attr	labelNode = (Attr) attributes.getNamedItem ("label");
		Attr	parameterNode = (Attr) attributes.getNamedItem ("parameter");
		Attr	valueNode = (Attr) attributes.getNamedItem ("value");
		Attr	valueRefNode = (Attr) attributes.getNamedItem ("valueref");
		
		JPanel	componentPanel = new JPanel ();
		componentPanel.setLayout (new FlowLayout (FlowLayout.LEADING));
		inPanel.add (componentPanel);
		
		JPanel	popupPanel = new JPanel ();
		popupPanel.setLayout (new FlowLayout (FlowLayout.LEADING));
		componentPanel.add (popupPanel);
		
		JLabel	label = new JLabel (labelNode.getValue ());
		label.addMouseListener (this);
		popupPanel.add (label);
		
		String[]	popupValues = null;
		
		if (valueNode != null)
		{
			popupValues = valueNode.getValue ().split (",", -1);
		}
		else
		if (valueRefNode != null)
		{
			String	variableName = valueRefNode.getValue ();
			String	variableValue = (String) this.variableMap.get (variableName);
			
			popupValues = variableValue.split (",", -1);
		}
		else
		{
			popupValues = new String [1];
			popupValues [0] = "no values declared";
		}
		
		JComboBox	popup = new JComboBox (popupValues);
		popup.setActionCommand ("PARAMETER_POPUP");
		popup.setMaximumRowCount (20);
		popupPanel.add (popup);

		this.labelToComponentMap.put (label, popup);
		
		// update the maps
		String	parameterName = parameterNode.getValue ();
		addToNameToComponentMap (parameterName, popup);
		this.componentToNameMap.put (popup, parameterName);
	}
	
	private void
	processSlider (Node inSliderNode, JPanel inPanel)
	{
		NamedNodeMap	attributes = inSliderNode.getAttributes ();
		
		Attr	labelNode = (Attr) attributes.getNamedItem ("label");
		Attr	parameterNode = (Attr) attributes.getNamedItem ("parameter");
		Attr	maxNode = (Attr) attributes.getNamedItem ("max");
		Attr	minNode = (Attr) attributes.getNamedItem ("min");
		Attr	majorTickNode = (Attr) attributes.getNamedItem ("majortick");
		Attr	minorTickNode = (Attr) attributes.getNamedItem ("minortick");
		
		JPanel	componentPanel = new JPanel ();
		componentPanel.setLayout (new BoxLayout (componentPanel, BoxLayout.Y_AXIS));
		inPanel.add (componentPanel);

		JPanel	sliderPanel = new JPanel ();
		sliderPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		// sliderPanel.setMinimumSize (new Dimension (50, 100));
		// sliderPanel.setMaximumSize (new Dimension (50, 100));
		componentPanel.add (sliderPanel);
		
		JSlider	slider = new JSlider (JSlider.VERTICAL);
		
		// update the maps
		// this must be before the setMaximum()/setMinimum() calls
		// as they call stateChanged()
		String	parameterName = parameterNode.getValue ();
		addToNameToComponentMap (parameterName, slider);
		this.componentToNameMap.put (slider, parameterName);

		slider.setMaximum (Integer.parseInt (maxNode.getValue ()));
		slider.setMinimum (Integer.parseInt (minNode.getValue ()));
		
		if (majorTickNode != null)
		{
			slider.setMajorTickSpacing (Integer.parseInt (majorTickNode.getValue ()));
		}
		
		if (minorTickNode != null)
		{
			slider.setMinorTickSpacing (Integer.parseInt (minorTickNode.getValue ()));
		}
		
		slider.setPaintTicks (majorTickNode != null || minorTickNode != null);
		sliderPanel.add (slider);
		
		JPanel	valuePanel = new JPanel ();
		valuePanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		
		JLabel	valueLabel = new JLabel ();
		valueLabel.setText (Integer.toString (slider.getValue ()));
		this.componentToLabelMap.put (slider, valueLabel);
		valuePanel.add (valueLabel);
		componentPanel.add (valuePanel);
		
		JPanel	labelPanel = new JPanel ();
		labelPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		
		JLabel	label = new JLabel (labelNode.getValue ());
		label.addMouseListener (this);
		this.labelToComponentMap.put (label, slider);
		labelPanel.add (label);
		componentPanel.add (labelPanel);
	}

	private void
	processTextField (Node inTextFieldNode, JPanel inPanel)
	{
		NamedNodeMap	attributes = inTextFieldNode.getAttributes ();
		
		Attr	parameterNode = (Attr) attributes.getNamedItem ("parameter");
		Attr	lengthNode = (Attr) attributes.getNamedItem ("length");

		JPanel	componentPanel = new JPanel ();
		componentPanel.setLayout (new FlowLayout (FlowLayout.LEADING));
		inPanel.add (componentPanel);

		JTextField	textField = new JTextField ();
		textField.setActionCommand ("PARAMETER_TEXT_FIELD");
		textField.setColumns (Integer.parseInt (lengthNode.getValue ()));
		componentPanel.add (textField);
		
		String	parameterName = parameterNode.getValue ();
		addToNameToComponentMap (parameterName, textField);
		this.componentToNameMap.put (textField, parameterName);
	}
	
	private void
	processTitle (Node inTitleNode, JPanel inPanel)
	{
		NamedNodeMap	attributes = inTitleNode.getAttributes ();
		
		Attr	labelNode = (Attr) attributes.getNamedItem ("label");
		
		JPanel	componentPanel = new JPanel ();
		componentPanel.setLayout (new FlowLayout (FlowLayout.LEADING));
		inPanel.add (componentPanel);
		
		JLabel	label = new JLabel (labelNode.getValue ());
		componentPanel.add (label);
	}
	
	private void
	setPatchModified (boolean inModified)
	{
		getRootPane ().putClientProperty ("windowModified", new Boolean (inModified));
		getRootPane ().putClientProperty ("Window.documentModified", new Boolean (inModified));
		
		this.patch.setModified (inModified);
	}
	
	private void
	setWindowTitle ()
	{
		setTitle (this.patch.getPatchNumber () + " - " + this.patch.getName ());
	}
	
	private void
	trackTextFieldChange (DocumentEvent inEvent)
	{
		Iterator<JComponent>	controls = this.componentToNameMap.keySet ().iterator ();
		
		// jeezus christ
		while (controls.hasNext ())
		{
			JComponent	control = controls.next ();

			if (control instanceof JTextField)
			{
				JTextField	textField = (JTextField) control;
				
				if (inEvent.getDocument () == textField.getDocument ())
				{
					String	parameterName = this.componentToNameMap.get (textField);
					
					if (parameterName.equalsIgnoreCase ("$PatchName"))
					{
						String	text = textField.getText ();

// System.err.println ("trying to set patch name to '" + text + "'");

						this.patch.setName (text);

						// give the user some nice visual feedback that the window has changed
						// (most likely Mac only)
						setPatchModified (true);

						// and set the window title!
						// ...with the sanitised version of the name back from the patch
						setWindowTitle ();
						
						try
						{
							ControlWindow.getInstance ().sendPatchNameChangeMessage (text);
						}
						catch (Exception inException)
						{
System.err.println (inException);
						}
					}
					
					break;
				}
			}
		}
	}
	
	// copies a value to other controls off that name
	// with listening turned off of course
	private void
	updateDuplicateControls (String inParameterName, int inParameterValue, JComponent inControl)
	{
		// now update any duplicates of those controls sigh
		// this needs to be refactored btw
		List<JComponent>	controls = this.nameToComponentMap.get (inParameterName);
		
		// if there's only one, we already got it :-)
		if (controls.size () > 1)
		{
			for (JComponent control : controls)
			{
				if (inControl != control)
				{
					// figure out what kind of jcomponent we have
					// note JComboBox has an action listener not a change listener
					// so that's handled in actionListener
					// BUT we have one here just in case
					
					if (control instanceof JCheckBox)
					{
						JCheckBox	checkBox = (JCheckBox) control;
						checkBox.removeChangeListener (this);
						checkBox.setSelected (inParameterValue != 0);
						checkBox.addChangeListener (this);
					}
					else
					if (control instanceof JComboBox)
					{
						JComboBox	popup = (JComboBox) control;
						popup.removeActionListener (this);
						popup.setSelectedIndex (inParameterValue);
						popup.addActionListener (this);
					}
					else
					if (control instanceof JSlider)
					{
						JSlider	slider = (JSlider) control;
						slider.removeChangeListener (this);
						slider.setValue (inParameterValue);
						slider.addChangeListener (this);
					
						JLabel	valueLabel = this.componentToLabelMap.get (slider);
					
						if (valueLabel != null)
						{
							valueLabel.setText (Integer.toString (inParameterValue));
						}
					}
					else
					if (control instanceof CustomControl)
					{
						CustomControl	customControl = (CustomControl) control;
						customControl.removeChangeListener (this);
						customControl.setParameterValue (inParameterName, inParameterValue);
						customControl.addChangeListener (this);
					}
				}
			}
		}
	}
	
	// PRIVATE DATA
	
	private BankWindow
	bankWindow = null;
	
	private JTabbedPane
	tabbedPane = null;
	
	private Map<JComponent, String>
	componentToNameMap = new HashMap<JComponent, String> ();
	
	private Map<JComponent, JLabel>
	componentToLabelMap = new HashMap<JComponent, JLabel> ();
	
	private Map<JLabel, JComponent>
	labelToComponentMap = new HashMap<JLabel, JComponent> ();
	
	private Map<String, List<JComponent>>
	nameToComponentMap = new HashMap<String, List<JComponent>> ();
	
	private Map<String, String>
	variableMap = new HashMap<String, String> ();
	
	private Patch
	patch = null;
	
}

