
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
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.prefs.Preferences;

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
import javax.swing.table.DefaultTableColumnModel;
import javax.swing.table.TableColumn;
import javax.swing.table.TableModel;
import javax.swing.table.TableCellRenderer;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;

// CLASS

public class WaveBankWindow
	extends JFrame
	implements ActionListener, ClipboardOwner, MouseListener
{
	// MAINLINE
	
	// CONSTRUCTOR
	
	public 
	WaveBankWindow (WaveBank inWaveBank, File inFile, boolean inWaveBankInProphet)
	{
		this.waveBank = inWaveBank;
		this.file = inFile;
		
		// CONFIGURATION
		
		setResizable (false);
		
		if (inFile == null)
		{
			setTitle ("New Wave Bank " + sWaveBankWindowNumber++);
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
		
		setWaveBankInProphet (inWaveBankInProphet);
		
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
		this.table.setDefaultRenderer (Object.class, new WaveCellRenderer ());
		this.table.setTableHeader (null);
		this.table.setAutoResizeMode (JTable.AUTO_RESIZE_OFF);

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
				int	waveNumber = (row * kTableColumnCount) + col;
				this.table.setValueAt (this.waveBank.getWave (waveNumber), row, col);
			}
		}
		
		// don't pack the wave bank window
		if (true)
		{
			packColumns (2);
			packRows (2);
		}
		
		// toolbar
		JPanel	buttonBar = new JPanel ();
		buttonBar.setLayout (new FlowLayout (FlowLayout.CENTER));
		getContentPane ().add (buttonBar, BorderLayout.SOUTH);
		
		JButton	saveButton = new JButton ("Save Waves");
		saveButton.setActionCommand ("SAVE");
		saveButton.addActionListener (this);
		buttonBar.add (saveButton);
		
		JButton	saveAsButton = new JButton ("Save Waves as...");
		saveAsButton.setActionCommand ("SAVE_AS");
		saveAsButton.addActionListener (this);
		buttonBar.add (saveAsButton);
		
		JButton	sendBankButton = new JButton ("Send Waves to Prophet");
		sendBankButton.setActionCommand ("SEND_WAVE_BANK");
		sendBankButton.addActionListener (this);
		buttonBar.add (sendBankButton);
		
		JButton	importButton = new JButton ("Import Wave");
		importButton.setActionCommand ("IMPORT");
		importButton.addActionListener (this);
		buttonBar.add (importButton);
		
		JButton	copyButton = new JButton ("Copy Wave");
		copyButton.setActionCommand ("COPY");
		copyButton.addActionListener (this);
		buttonBar.add (copyButton);
		
		JButton	pasteButton = new JButton ("Paste Wave");
		pasteButton.setActionCommand ("PASTE");
		pasteButton.addActionListener (this);
		buttonBar.add (pasteButton);
		
		JButton	swapPasteButton = new JButton ("Swap Paste Wave");
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
				if (frames [i].isVisible () && frames [i] instanceof WaveWindow)
				{
					WaveWindow	waveWindow = (WaveWindow) frames [i];
					
					if (waveWindow.getWaveBankWindow () == this)
					{
						// this will confirm saves etc
						waveWindow.setVisible (false);
						
						if (waveWindow.isVisible ())
						{
							closeWindow = false;
							break;
						}
					}
				}
			}

			if (closeWindow)
			{
				if (this.waveBank.isModified ())
				{
					StringBuffer	buffer = new StringBuffer ();
					
					buffer.append ("Save \"");
					buffer.append (getTitle ());
					buffer.append (" before closing?");
					
					int	response = JOptionPane.showConfirmDialog
						(this, buffer.toString (), "Confirm", JOptionPane.YES_NO_CANCEL_OPTION);
						
					if (response == JOptionPane.YES_OPTION)
					{
						saveWaveBank (false);
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
			
			saveWaveBank (askForFile);
		}
		else
		if (actionCommand.equalsIgnoreCase ("SEND_WAVE_BANK"))
		{
			int	response = ControlWindow.getInstance ().showConfirmDialog
				("Transmit", "OK to overwrite waves in Prophet?");
			
			if (response == JOptionPane.YES_OPTION)
			{
				try
				{
					ControlWindow.getInstance ().sendWaveBankDumpMessage (this.waveBank);
					
					// this bank is now in the Prophet
					setWaveBankInProphet (true);
				}
				catch (Exception inException)
				{
					ControlWindow.getInstance ().showErrorDialog ("Error", inException);
				}
			}
		}
		else
		if (actionCommand.equalsIgnoreCase ("IMPORT"))
		{
			int row = this.table.getSelectedRow ();
			int column = this.table.getSelectedColumn ();

			if (row == -1 || column == -1)
			{
				ControlWindow.getInstance ().showErrorDialog
					("Error", "Please select a wave location to which to import.");
			}
			else
			{
				File	file = ControlWindow.getFileForOpen (this, "Please select file for import");
				
				if (file != null)
				{
					Wave	wave = importWave (file);
					
					if (wave != null)
					{
						int	waveNumber = (row * kTableColumnCount) + column;
						wave.setWaveNumber (waveNumber);
						setWave (wave);
					}
				}
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
					("Error", "Please select a wave location to copy.");
			}
			else
			{
				int	waveNumber = (row * kTableColumnCount) + column;
				Wave	wave = this.waveBank.getWaveCopy (waveNumber);
				TransferableWave	transferable = new TransferableWave (wave);
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
					("Error", "Please select a wave location to paste.");
			}
			else
			{
				int	waveNumber = (row * kTableColumnCount) + column;

				Clipboard	clipboard = Toolkit.getDefaultToolkit ().getSystemClipboard ();
				Transferable	transferable = clipboard.getContents (this);
				
				if (transferable != null)
				{
					DataFlavor	flavour = new DataFlavor (Wave.class, "Prophet VS Wave");
					
					try
					{
						Object	data = transferable.getTransferData (flavour);
						
						if (data != null && data instanceof Wave)
						{
							Wave	wave = (Wave) data;
							
							// override the wave number in the wave
							// so it goes in the right place
							wave.setWaveNumber (waveNumber);
							setWave (wave);
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
					("Error", "Please select a wave location to swap paste.");
			}
			else
			{
				int	waveNumber = (row * kTableColumnCount) + column;
				
				Clipboard	clipboard = Toolkit.getDefaultToolkit ().getSystemClipboard ();
				Transferable	transferable = clipboard.getContents (this);
				
				if (transferable != null)
				{
					DataFlavor	flavour = new DataFlavor (Wave.class, "Prophet VS Wave");
					
					try
					{
						Object	data = transferable.getTransferData (flavour);
						
						if (data != null && data instanceof Wave)
						{
							Wave	pasteWave = (Wave) data;
							
							// ok now copy the selection into the clipboard
							Wave	copyWave = this.waveBank.getWaveCopy (waveNumber);
							transferable = new TransferableWave (copyWave);
							Toolkit.getDefaultToolkit ().getSystemClipboard ().setContents (transferable, this);

							// and now paste the saved wave into place
							// override the wave number in the wave
							// so it goes in the right place
							pasteWave.setWaveNumber (waveNumber);
							setWave (pasteWave);
						}
					}
					catch (Exception inException)
					{
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
	
	// MOUSE LISTENER IMPLEMENTATION

	public void
	mouseClicked (MouseEvent inEvent)
	{
		if (inEvent.getClickCount () == 2)
		{
			ControlWindow	controlWindow = ControlWindow.getInstance ();

			if (controlWindow.getWaveWindow () != null)
			{
				// allow the user to override our flag
				int	response = ControlWindow.showConfirmDialog
					("Confirm", "There is a wave editing window open. OK to close it?");
				
				if (response == JOptionPane.YES_OPTION)
				{
					WaveWindow	waveWindow = controlWindow.getWaveWindow ();
					waveWindow.setVisible (false);
				}
			}
			
			if (controlWindow.getWaveWindow () == null)
			{
				if (! this.waveBankInProphet)
				{
					// allow the user to override our flag
					int	response = ControlWindow.showConfirmDialog
						("Confirm", "This wave bank is not in the Prophet. OK to open wave editing windows anyway?");
					
					if (response == JOptionPane.YES_OPTION)
					{
						setWaveBankInProphet (true);
					}
				}
				
				if (this.waveBankInProphet)
				{
					int row = this.table.rowAtPoint (inEvent.getPoint ());
					int column = this.table.columnAtPoint (inEvent.getPoint ());
		
					if (row != -1 && column != -1)
					{
						int	waveNumber = (row * kTableColumnCount) + column;
						
						// send a program change to the selected patch
						try
						{
							Wave	wave = this.waveBank.getWaveCopy (waveNumber);
							WaveWindow	waveWindow = new WaveWindow (this, wave);
							ControlWindow.getInstance ().setWaveWindow (waveWindow);
							waveWindow.setLocationRelativeTo (null);
							waveWindow.setVisible (true);
						}
						catch (Exception inException)
						{
							ControlWindow.showErrorDialog ("Error", inException);
						}
					}
				}
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
	
	public void
	setWaveBankInProphet (boolean inWaveBankInProphet)
	{
		if (inWaveBankInProphet)
		{
			this.statusLabel.setText (kInProphetStatus);
			this.statusLabel.setForeground (Color.blue);

			// now clear the flags of the other bank windows
			Frame[]	frames = Frame.getFrames ();
			
			for (int i = 0; i < frames.length; i++)
			{
				if (frames [i].isVisible () && frames [i] instanceof WaveBankWindow)
				{
					WaveBankWindow	waveBankWindow = (WaveBankWindow) frames [i];
					
					if (waveBankWindow != this)
					{
						// this bank isn't in the Prophet
						// because *our* bank is in the Prophet!
						waveBankWindow.setWaveBankInProphet (false);
					}
				}
			}
		}
		else
		{
			this.statusLabel.setText (kNotInProphetStatus);
			this.statusLabel.setForeground (Color.red);
		}
		
		this.waveBankInProphet = inWaveBankInProphet;
	}
	
	public void
	setBankModified (boolean inModified)
	{
		getRootPane ().putClientProperty ("windowModified", new Boolean (inModified));
		getRootPane ().putClientProperty ("Window.documentModified", new Boolean (inModified));
		
		this.waveBank.setModified (inModified);
	}
	
	// HACK?
	public void
	setWave (Wave inWave)
	{
		// update the "model"
		this.waveBank.setWave (inWave);

		// give the user some nice visual feedback that the window has changed
		// (most likely Mac only)
		setBankModified (true);

		// update the *other* "model" - sigh
		int	waveNumber = inWave.getWaveNumber ();
		int	row = waveNumber / kTableColumnCount;
		int	col = waveNumber % kTableColumnCount;
		
		this.table.setValueAt (this.waveBank.getWave (waveNumber), row, col);
	}

	// PRIVATE METHODS
	
	private Wave
	importWave (File inFile)
	{
		Throwable	throwable = null;
		Wave	wave = null;
	
		// is it a wave file?
		try
		{
			WaveFile	file = new WaveFile (inFile);
			
			wave = file.makeVSWave ();
		}
		catch (Throwable inThrowable)
		{
			throwable = inThrowable;
		}
		
		if (throwable != null)
		{
			throwable = null;
			
			// is it an aiff file?
			try
			{
				AiffFile	file = new AiffFile (inFile);
				
				wave = file.makeVSWave ();
			}
			catch (Throwable inThrowable)
			{
				throwable = inThrowable;
			}
		}
		
		if (throwable != null)
		{
			throwable = null;
			
			// last chance - raw file
			// opens anything
			try
			{
				RawFile	file = new RawFile (inFile);
				
				wave = file.makeVSWave ();
			}
			catch (Throwable inThrowable)
			{
				throwable = inThrowable;
			}
		}
		
		if (throwable != null)
		{
			ControlWindow.showErrorDialog ("Error", "File is not a WAVE or AIFF file, and raw files must be 128-2048 bytes long."); 
		}
		
		return wave;
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
	saveWaveBank (boolean inAskForFile)
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
				this.waveBank.write (fos);
				
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
	kTableColumnCount = 8;

	private static int
	kTableRowCount = 4;
	
	private static int
	sWaveBankWindowNumber = 1;
	
	private static String
	kInProphetStatus = "This wave bank is in the Prophet.";
	
	private static String
	kNotInProphetStatus = "This wave bank is not in the Prophet.";
	
	// PRIVATE DATA

	private boolean
	waveBankInProphet = false;
	
	private WaveBank
	waveBank = null;
	
	private File
	file = null;
	
	private JLabel
	statusLabel = null;
	
	private JTable
	table = null;
	
}

