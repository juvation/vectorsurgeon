
// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.FlowLayout;
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
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.prefs.Preferences;

import javax.sound.midi.InvalidMidiDataException;
import javax.sound.midi.MidiMessage;
import javax.sound.midi.SysexMessage;

import javax.swing.AbstractAction;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JOptionPane;
import javax.swing.JRootPane;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.KeyStroke;
import javax.swing.ListSelectionModel;
import javax.swing.border.TitledBorder;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;
import javax.swing.event.ListSelectionEvent;
import javax.swing.event.ListSelectionListener;
import javax.swing.table.DefaultTableColumnModel;
import javax.swing.ListSelectionModel;
import javax.swing.table.TableColumn;
import javax.swing.table.TableModel;
import javax.swing.table.TableCellRenderer;

import org.w3c.dom.Document;

// CLASS

public class BankWindow
	extends JFrame
	implements ActionListener, ClipboardOwner, ListSelectionListener, MouseListener
{
	// PUBLIC CONSTRUCTOR
	
	public 
	BankWindow (Document inDocument, Bank inBank, File inFile, boolean inBankInProphet)
	{
		this.document = inDocument;
		this.bank = inBank;
		this.file = inFile;
		
		// CONFIGURATION
		
		if (inFile == null)
		{
			setTitle ("New Bank " + sBankWindowNumber++);
		}
		else
		{
			setTitle (this.file.getName ());
		}

		// LAYOUT

		getContentPane ().setLayout (new BorderLayout ());

		// CONTENTS
		
		// NORTH PANE - BANK STATUS
		
		JPanel	statusPanel = new JPanel ();
		statusPanel.setLayout (new FlowLayout (FlowLayout.CENTER));
		getContentPane ().add (statusPanel, BorderLayout.NORTH);
		
		this.statusLabel = new JLabel ();
		statusPanel.add (this.statusLabel);
		
		setBankInProphet (inBankInProphet);
		
		// MAIN PANE - TABLE
		
		this.table = new JTable (kTableRowCount, kTableColumnCount)
		{
			public Dimension
			getPreferredScrollableViewportSize ()
			{
				return getPreferredSize ();
			}
			
			public boolean
			isCellEditable (int inRow, int inColumn)
			{
				return false;
			}
		};
		
		this.table.addMouseListener (this);
		this.table.setCellSelectionEnabled (true);
		this.table.setSelectionMode (ListSelectionModel.SINGLE_SELECTION);
		this.table.setDefaultRenderer (Object.class, new PatchCellRenderer ());
		this.table.setTableHeader (null);
		this.table.setAutoResizeMode (JTable.AUTO_RESIZE_OFF);

		ListSelectionModel	selectionModel = this.table.getSelectionModel ();
		selectionModel.addListSelectionListener (this);
		
		selectionModel = this.table.getColumnModel ().getSelectionModel ();
		selectionModel.addListSelectionListener (this);
		
		// override enter key
		
		KeyStroke	enter = KeyStroke.getKeyStroke (KeyEvent.VK_ENTER, 0);
		
		this.table.getInputMap (JTable.WHEN_ANCESTOR_OF_FOCUSED_COMPONENT).put (enter, "OPEN_PATCH");
		this.table.getActionMap ().put ("OPEN_PATCH", new EnterAction ());

		// add copy/paste actions
		Toolkit	toolkit = Toolkit.getDefaultToolkit ();
		KeyStroke copyKey = KeyStroke.getKeyStroke
			(KeyEvent.VK_C, toolkit.getMenuShortcutKeyMask (), false);
		KeyStroke pasteKey = KeyStroke.getKeyStroke
			(KeyEvent.VK_V, toolkit.getMenuShortcutKeyMask (), false);
		this.table.registerKeyboardAction
			(this, "COPY", copyKey, JComponent.WHEN_FOCUSED);
		this.table.registerKeyboardAction
			(this, "PASTE", pasteKey, JComponent.WHEN_FOCUSED);

		JScrollPane	scrollPane = new JScrollPane (this.table);
		getContentPane ().add (scrollPane, BorderLayout.CENTER);

		// set the cell contents
		for (int row = 0; row < kTableRowCount; row++)
		{
			for (int col = 0; col < kTableColumnCount; col++)
			{
				int	patchNumber = (row * kTableColumnCount) + col;
				this.table.setValueAt (this.bank.getPatch (patchNumber), row, col);
			}
		}
		
		// pack the cells
		packColumns (2);
		packRows (2);

		// toolbar
		JPanel	buttonBar = new JPanel ();
		buttonBar.setLayout (new FlowLayout (FlowLayout.CENTER));
		getContentPane ().add (buttonBar, BorderLayout.SOUTH);
		
		JButton	saveButton = new JButton ("Save Bank");
		saveButton.setActionCommand ("SAVE");
		saveButton.addActionListener (this);
		buttonBar.add (saveButton);
		
		JButton	saveAsButton = new JButton ("Save Bank as...");
		saveAsButton.setActionCommand ("SAVE_AS");
		saveAsButton.addActionListener (this);
		buttonBar.add (saveAsButton);
		
		JButton	sendBankButton = new JButton ("Send Bank to Prophet");
		sendBankButton.setActionCommand ("SEND_BANK");
		sendBankButton.addActionListener (this);
		buttonBar.add (sendBankButton);
		
		JButton	sendPatchButton = new JButton ("Send Patch to Prophet");
		sendPatchButton.setActionCommand ("SEND_PATCH");
		sendPatchButton.addActionListener (this);
		buttonBar.add (sendPatchButton);
		
		JButton	varyButton = new JButton ("Vary Patch...");
		varyButton.setActionCommand ("VARY");
		varyButton.addActionListener (this);
		buttonBar.add (varyButton);
		
		JButton	copyButton = new JButton ("Copy Patch");
		copyButton.setActionCommand ("COPY");
		copyButton.addActionListener (this);
		buttonBar.add (copyButton);
		
		JButton	pasteButton = new JButton ("Paste Patch");
		pasteButton.setActionCommand ("PASTE");
		pasteButton.addActionListener (this);
		buttonBar.add (pasteButton);
		
		JButton	swapPasteButton = new JButton ("Swap Paste Patch");
		swapPasteButton.setActionCommand ("SWAP_PASTE");
		swapPasteButton.addActionListener (this);
		buttonBar.add (swapPasteButton);
		
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
			
			// see if any child windows are open
			Frame[]	frames = Frame.getFrames ();
			
			for (int i = 0; i < frames.length; i++)
			{
				if (frames [i].isVisible () && frames [i] instanceof PatchWindow)
				{
					PatchWindow	patchWindow = (PatchWindow) frames [i];
					
					if (patchWindow.getBankWindow () == this)
					{
						// this will confirm saves etc
						patchWindow.setVisible (false);
						
						if (patchWindow.isVisible ())
						{
							closeWindow = false;
							break;
						}
					}
				}
			}

			if (closeWindow)
			{
				if (this.bank.isModified ())
				{
					StringBuffer	buffer = new StringBuffer ();
					
					buffer.append ("Save \"");
					buffer.append (getTitle ());
					buffer.append (" before closing?");
					
					int	response = JOptionPane.showConfirmDialog
						(this, buffer.toString (), "Confirm", JOptionPane.YES_NO_CANCEL_OPTION);
						
					if (response == JOptionPane.YES_OPTION)
					{
						saveBank (false);
					}
					else
					if (response == JOptionPane.CANCEL_OPTION)
					{
						closeWindow = false;
					}
				}
			}
			
			if (closeWindow)
			{
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
		if (actionCommand.equalsIgnoreCase ("SAVE")
			|| actionCommand.equalsIgnoreCase ("SAVE_AS"))
		{
			boolean	askForFile = false;
			
			if (actionCommand.equalsIgnoreCase ("SAVE_AS"))
			{
				askForFile = true;
			}
			else
			{
				if (this.file == null)
				{
					askForFile = true;
				}
			}
			
			saveBank (askForFile);
		}
		else
		if (actionCommand.equalsIgnoreCase ("SEND_BANK"))
		{
			int	response = ControlWindow.getInstance ().showConfirmDialog
				("Transmit", "OK to overwrite bank in Prophet?");
			
			if (response == JOptionPane.YES_OPTION)
			{
				try
				{
					ControlWindow.getInstance ().sendBankDumpMessage (this.bank);
					
					// this bank is now in the Prophet
					setBankInProphet (true);
				}
				catch (Exception inException)
				{
					ControlWindow.getInstance ().showErrorDialog ("Error", inException);
				}
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("SEND_PATCH"))
		{
			int row = this.table.getSelectedRow ();
			int column = this.table.getSelectedColumn ();

			if (row == -1 || column == -1)
			{
				ControlWindow.getInstance ().showErrorDialog
					("Error", "Please select a patch location to send.");
			}
			else
			{
				int	patchNumber = (row * kTableColumnCount) + column;
				Patch	patch = this.bank.getPatch (patchNumber);
				
				StringBuffer	buffer = new StringBuffer ();
				buffer.append ("OK to overwrite patch ");
				buffer.append (patch.getPatchNumber ());
				buffer.append (" in Prophet?");
				
				int	response = ControlWindow.getInstance ().showConfirmDialog
					("Transmit", buffer.toString ());
				
				if (response == JOptionPane.YES_OPTION)
				{
					try
					{
						ControlWindow.getInstance ().sendMidiMessage
							(Machine.makePatchDumpMessage (patch));
					}
					catch (Exception inException)
					{
						ControlWindow.getInstance ().showErrorDialog ("Error", inException);
					}
				}
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("VARY"))
		{
			int row = this.table.getSelectedRow ();
			int column = this.table.getSelectedColumn ();

			if (row == -1 || column == -1)
			{
				ControlWindow.getInstance ().showErrorDialog
					("Error", "Please select a patch location to vary.");
			}
			else
			{
				int	patchNumber = (row * kTableColumnCount) + column;
				Patch	patch = this.bank.getPatchCopy (patchNumber);
				VaryWindow	varyWindow = new VaryWindow (patch);
				varyWindow.setLocationRelativeTo (null);
				varyWindow.setVisible (true);
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("COPY"))
		{
			int row = this.table.getSelectedRow ();
			int column = this.table.getSelectedColumn ();

			if (row == -1 || column == -1)
			{
				ControlWindow.getInstance ().showErrorDialog
					("Error", "Please select a patch location to copy.");
			}
			else
			{
				int	patchNumber = (row * kTableColumnCount) + column;
				Patch	patch = this.bank.getPatchCopy (patchNumber);
				TransferablePatch	transferable = new TransferablePatch (patch);
				Toolkit.getDefaultToolkit ().getSystemClipboard ().setContents (transferable, this);
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("PASTE"))
		{
			int row = this.table.getSelectedRow ();
			int column = this.table.getSelectedColumn ();

			if (row == -1 || column == -1)
			{
				ControlWindow.getInstance ().showErrorDialog
					("Error", "Please select a patch location to paste.");
			}
			else
			{
				int	patchNumber = (row * kTableColumnCount) + column;

				Clipboard	clipboard = Toolkit.getDefaultToolkit ().getSystemClipboard ();
				Transferable	transferable = clipboard.getContents (this);
				
				if (transferable != null)
				{
					DataFlavor	flavour = new DataFlavor (Patch.class, "Prophet VS Patch");
					
					try
					{
						Object	data = transferable.getTransferData (flavour);
						
						if (data != null && data instanceof Patch)
						{
							Patch	patch = (Patch) data;
							
							// copy the patch!
							// it might get pasted twice and this is only a reference
							Patch	copy = new Patch (patch);
							
							// override the patch number in the patch
							// so it goes in the right place
							copy.setPatchNumber (patchNumber);
							setPatch (copy);
						}
					}
					catch (Exception inException)
					{
System.err.println (inException);
					}
				}
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("SWAP_PASTE"))
		{
			// this is a nondestructive paste which swaps the selection & paste buffer
			
			int row = this.table.getSelectedRow ();
			int column = this.table.getSelectedColumn ();

			if (row == -1 || column == -1)
			{
				ControlWindow.getInstance ().showErrorDialog
					("Error", "Please select a patch location to swap paste.");
			}
			else
			{
				int	patchNumber = (row * kTableColumnCount) + column;
				
				Clipboard	clipboard = Toolkit.getDefaultToolkit ().getSystemClipboard ();
				Transferable	transferable = clipboard.getContents (this);
				
				if (transferable != null)
				{
					DataFlavor	flavour = new DataFlavor (Patch.class, "Prophet VS Patch");
					
					try
					{
						Object	data = transferable.getTransferData (flavour);
						
						if (data != null && data instanceof Patch)
						{
							Patch	pastePatch = (Patch) data;
							
							// ok now copy the selection into the clipboard
							Patch	copyPatch = this.bank.getPatchCopy (patchNumber);
							transferable = new TransferablePatch (copyPatch);
							Toolkit.getDefaultToolkit ().getSystemClipboard ().setContents (transferable, this);

							// and now paste the saved patch into place
							// override the patch number in the patch
							// so it goes in the right place
							pastePatch.setPatchNumber (patchNumber);
							setPatch (pastePatch);
						}
					}
					catch (Exception inException)
					{
System.err.println (inException);
					}
				}
			}
		}
	}
	
	// CLIPBOARD OWNER IMPLEMENTATION
	
	public void
	lostOwnership (Clipboard inClipboard, Transferable inContents)
	{
		// like we care
	}
	
	// LIST SELECTION LISTENER IMPLEMENTATION
	
	// note we DO allow program changes from bank selection window changes
	// if the bank isn't in the prophet
	// it just becomes a handy way of selecting patches :-)
	public void
	valueChanged (ListSelectionEvent inEvent)
	{
		if (inEvent.getValueIsAdjusting ())
		{
			return;
		}
		
		if (ControlWindow.getInstance ().getPatchWindow () != null)
		{
			// don't send program changes from the bank window if there is a patch window up
			System.err.println ("patch window up, bank selection ignored");
			
			return;
		}

		int	row = this.table.getSelectedRow ();
		int	column = this.table.getSelectedColumn ();
		
		if (row >= 0 && column >= 0)
		{
			int	patchNumber = (row * 10) + column;
			
			ControlWindow.getInstance ().sendMidiProgramChange (patchNumber);
		}
		else
		{
			System.err.println ("selection event with no selection?!?");
		}
	}
	
	// MOUSE LISTENER IMPLEMENTATION

	public void
	mouseClicked (MouseEvent inEvent)
	{
		if (inEvent.getClickCount () == 2)
		{
			int row = this.table.rowAtPoint (inEvent.getPoint ());
			int column = this.table.columnAtPoint (inEvent.getPoint ());

			if (row != -1 && column != -1)
			{
				int	patchNumber = (row * kTableColumnCount) + column;

				tryOpenPatchWindow (patchNumber);
			}
		}
	}

	public void
	mousePressed (MouseEvent inEvent)
	{
	}

	public void
	mouseReleased (MouseEvent inEvent)
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

	// PUBLIC METHODS
	
	public boolean
	isBankInProphet ()
	{
		return this.isBankInProphet;
	}
	
	public void
	tryOpenPatchWindow (int inPatchNumber)
	{
		ControlWindow	controlWindow = ControlWindow.getInstance ();

		if (controlWindow.getPatchWindow () != null)
		{
			// close the patch window - will confirm write if dirty
			PatchWindow	patchWindow = controlWindow.getPatchWindow ();
			
			// this sets the control window's patch window to null
			// which we'll check for in a second
			patchWindow.setVisible (false);
		}

		if (controlWindow.getPatchWindow () == null)
		{
			if (! this.isBankInProphet)
			{
				// allow the user to override our flag
				int	response = ControlWindow.showConfirmDialog
					("Confirm", "This bank is not in the Prophet. OK to open patch editing windows anyway?");
				
				if (response == JOptionPane.YES_OPTION)
				{
					setBankInProphet (true);
				}
			}
			
			if (this.isBankInProphet)
			{
				openPatchWindow (inPatchNumber);
			}
		}
	}
	
	public void
	setBankInProphet (boolean inBankInProphet)
	{
		if (inBankInProphet)
		{
			this.statusLabel.setText (kInProphetStatus);
			this.statusLabel.setForeground (Color.blue);

			// now clear the flags of the other bank windows
			Frame[]	frames = Frame.getFrames ();
			
			for (int i = 0; i < frames.length; i++)
			{
				if (frames [i].isVisible () && frames [i] instanceof BankWindow)
				{
					BankWindow	bankWindow = (BankWindow) frames [i];
					
					if (bankWindow != this)
					{
						// this bank isn't in the Prophet
						// because *our* bank is in the Prophet!
						bankWindow.setBankInProphet (false);
					}
				}
			}
		}
		else
		{
			this.statusLabel.setText (kNotInProphetStatus);
			this.statusLabel.setForeground (Color.red);
		}
		
		this.isBankInProphet = inBankInProphet;
	}
	
	public void
	setBankModified (boolean inModified)
	{
		getRootPane ().putClientProperty ("windowModified", new Boolean (inModified));
		getRootPane ().putClientProperty ("Window.documentModified", new Boolean (inModified));
		
		this.bank.setModified (inModified);
	}
	
	// HACK?
	public void
	setPatch (Patch inPatch)
	{
		// update the "model"
		this.bank.setPatch (inPatch);

		// give the user some nice visual feedback that the window has changed
		// (most likely Mac only)
		setBankModified (true);

		// update the *other* "model" - sigh
		int	patchNumber = inPatch.getPatchNumber ();
		int	row = patchNumber / kTableColumnCount;
		int	col = patchNumber % kTableColumnCount;
		
		this.table.setValueAt (this.bank.getPatch (patchNumber), row, col);
	}

	// PRIVATE METHODS
	
	private void
	openPatchWindow (int inPatchNumber)
	{
		boolean	openEditor = true;
		
		// send a program change to the selected patch
		try
		{
			// enable all MIDI parameter options
			ControlWindow.getInstance ().sendMidiMessage (Machine.makeEnableParametersMessage ());
			
			// change to the right patch
			ControlWindow.getInstance ().sendMidiProgramChange (inPatchNumber);
		}
		catch (Exception inException)
		{
inException.printStackTrace (System.err);
			openEditor = false;
		}
		
		// if we had an error sending the midi, confirm the editor window open
		if (! openEditor)
		{
			int	response = JOptionPane.showConfirmDialog
				(this, "Could not send program change to Prophet. OK to open editor window?",
					"Confirm", JOptionPane.YES_NO_OPTION);
				
			openEditor = (response == JOptionPane.YES_OPTION);
		}
		
		if (openEditor)
		{
			try
			{
				Patch	patch = this.bank.getPatchCopy (inPatchNumber);
				PatchWindow	patchWindow = new PatchWindow (this, this.document, patch);
				ControlWindow.getInstance ().setPatchWindow (patchWindow);
				patchWindow.setLocationRelativeTo (null);
				patchWindow.setVisible (true);
			}
			catch (Exception inException)
			{
				ControlWindow.showErrorDialog ("Error", inException);
			}
		}
	}
	
	private void
	packColumns (int inMargin)
	{
		TableModel	model = this.table.getModel ();
		DefaultTableColumnModel	columnModel
			= (DefaultTableColumnModel) table.getColumnModel ();
			
		for (int col = 0; col < this.table.getColumnCount (); col++)
		{
			TableColumn	column = columnModel.getColumn (col);
			
			int	width = 0;

			// determine widest row in column
			for (int row = 0; row < this.table.getRowCount (); row++)
			{
				TableCellRenderer	renderer = this.table.getCellRenderer (row, col);
				Component	component = renderer.getTableCellRendererComponent
					(this.table, this.table.getValueAt (row, col), false, false, row, col);
				
				width = Math.max (width, component.getPreferredSize ().width);
			}
			
			// add the margin
			width += 2 * inMargin;
			
			column.setPreferredWidth (width);
		}
	}
	
	private void
	packRows (int inMargin)
	{
		for (int row = 0; row < this.table.getRowCount (); row++)
		{
			int	height = this.table.getRowHeight ();
			
			// determine highest cell in row
			for (int col = 0; col < this.table.getColumnCount (); col++)
			{
				TableCellRenderer	renderer = this.table.getCellRenderer (row, col);
				Component	component = this.table.prepareRenderer (renderer, row, col);
				int	componentHeight = component.getPreferredSize ().height + (2 * inMargin);
				
				height = Math.max (height, componentHeight);
			}
			
			this.table.setRowHeight (height);
		}
	}
	
	private boolean
	saveBank (boolean inAskForFile)
	{
		boolean	saved = false;
		
		if (inAskForFile || this.file == null)
		{
			File	tempFile = ControlWindow.getFileForSave (this, "Save", null);
			
			if (tempFile != null)
			{
				this.file = tempFile;
			}
		}
		
		if (this.file != null)
		{
			FileOutputStream	fos = null;
			
			try
			{
				fos = new FileOutputStream (this.file);
				this.bank.write (fos);
				
				setBankModified (false);
				saved = true;
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
		
		return saved;
	}
	
	// PRIVATE STATIC DATA
	
	private static int
	kTableColumnCount = 10;

	private static int
	kTableRowCount = 10;
	
	private static int
	sBankWindowNumber = 1;
	
	private static String
	kInProphetStatus = "This bank is in the Prophet. Patch editor windows can be opened.";
	
	private static String
	kNotInProphetStatus = "This bank is not in the Prophet. Opening patch editor windows will require confirmation.";
	
	// PRIVATE DATA

	private boolean
	isBankInProphet = false;
	
	private Bank
	bank = null;
	
	private Document
	document = null;
	
	private File
	file = null;
	
	private JLabel
	statusLabel = null;
	
	private JTable
	table = null;
	
	// INNER CLASSES
	
	class EnterAction
	extends AbstractAction
	{
		@Override
		public void
		actionPerformed (ActionEvent inEvent)
		{
			System.err.println ("EnterAction.actionPerformed()");
			
			ControlWindow	controlWindow = ControlWindow.getInstance ();

			if (controlWindow.getPatchWindow () != null)
			{
				// close the patch window - will confirm write if dirty
				PatchWindow	patchWindow = controlWindow.getPatchWindow ();
				
				// this sets the control window's patch window to null
				// which we'll check for in a second
				patchWindow.setVisible (false);
			}

			if (controlWindow.getPatchWindow () == null)
			{
				if (! BankWindow.this.isBankInProphet)
				{
					// allow the user to override our flag
					int	response = ControlWindow.showConfirmDialog
						("Confirm", "This bank is not in the Prophet. OK to open patch editing windows anyway?");
					
					if (response == JOptionPane.YES_OPTION)
					{
						setBankInProphet (true);
					}
				}
				
				if (BankWindow.this.isBankInProphet)
				{
					int	row = BankWindow.this.table.getSelectedRow ();
					int	column = BankWindow.this.table.getSelectedColumn ();
					
					if (row >= 0 && column >= 0)
					{
						int	patchNumber = (row * 10) + column;
						BankWindow.this.openPatchWindow (patchNumber);
					}
				}
			}
    }		
	}
   
}

