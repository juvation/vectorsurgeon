// PatchCellRenderer.java

// PACKAGE

package com.prophetvs.editor;


// IMPORTS

import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Font;

import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JTable;
import javax.swing.border.Border;
import javax.swing.table.TableCellRenderer;

public class PatchCellRenderer
	extends JComponent
	implements TableCellRenderer
{
	public
	PatchCellRenderer ()
	{
		setLayout (new BoxLayout (this, BoxLayout.Y_AXIS));
		setOpaque (false);
		
		this.titleLabel = new JLabel ();
		this.titleLabel.setFont (new Font ("Sans Serif", Font.BOLD, 12));
		add (this.titleLabel);
		
		Font	waveFont = new Font ("Sans Serif", Font.PLAIN, 10);
		
		this.waveALabel = new JLabel ();
		this.waveALabel.setFont (waveFont);
		add (this.waveALabel);
		this.waveBLabel = new JLabel ();
		this.waveBLabel.setFont (waveFont);
		add (this.waveBLabel);
		this.waveCLabel = new JLabel ();
		this.waveCLabel.setFont (waveFont);
		add (this.waveCLabel);
		this.waveDLabel = new JLabel ();
		this.waveDLabel.setFont (waveFont);
		add (this.waveDLabel);
		
		/*
		this.filterLabel = new JLabel ();
		this.filterLabel.setFont (waveFont);
		add (this.filterLabel);
		*/
		
		// inverted selections plain don't work
		// so resort to borders :-|
		this.border = BorderFactory.createLineBorder (Color.black, 1);
	}
	
	// COMPONENT OVERRIDE
	
	// in order to get the right size in BankWindow
	// delegating to Component gets it wrong
	// could just hardcode to 100, but it might be wrong on Windows etc
	public Dimension
	getPreferredSize ()
	{
		Dimension	size = super.getPreferredSize ();

		// leave the height alone
		
		// calculate the width based on our labels
		int	width = 0;
		
		if (this.filterLabel != null)
		{
			width = Math.max (width, this.filterLabel.getPreferredSize ().width);
		}
		
		width = Math.max (width, this.titleLabel.getPreferredSize ().width);
		width = Math.max (width, this.waveALabel.getPreferredSize ().width);
		width = Math.max (width, this.waveBLabel.getPreferredSize ().width);
		width = Math.max (width, this.waveCLabel.getPreferredSize ().width);
		width = Math.max (width, this.waveDLabel.getPreferredSize ().width);
		
		size.setSize (width, size.height);
		
		return size;
	}
	
	// TABLECELLRENDERER IMPLEMENTATION
	
	public Component
	getTableCellRendererComponent (JTable inTable, Object inValue,
		boolean inIsSelected, boolean inHasFocus, int inRow, int inColumn)
	{
		Patch	patch = (Patch) inValue;

		try
		{
// System.err.println ("cell row=" + inRow + " col=" + inColumn);
// System.err.println ("selected=" + inIsSelected + " hasfocus=" + inHasFocus);

			if (inIsSelected)
			{
				setBorder (this.border);
			}
			else
			{
				setBorder (null);
			}
			
			this.titleLabel.setText (patch.getPatchNumber () + " " + patch.getName ());
	
			// osc A waveform
			int	waveNumber = patch.getParameterValue ("WaveNumberA");
			if (waveNumber < 32)
			{
				this.waveALabel.setForeground (Color.red);
			}
			else
			{
				this.waveALabel.setForeground (Color.black);
			}
			this.waveALabel.setText ("A: " + patch.getWaveName (waveNumber));
			
			// osc B waveform
			waveNumber = patch.getParameterValue ("WaveNumberB");
			if (waveNumber < 32)
			{
				this.waveBLabel.setForeground (Color.red);
			}
			else
			{
				this.waveBLabel.setForeground (Color.black);
			}
			this.waveBLabel.setText ("B: " + patch.getWaveName (waveNumber));
			
			// osc C waveform
			waveNumber = patch.getParameterValue ("WaveNumberC");
			if (waveNumber < 32)
			{
				this.waveCLabel.setForeground (Color.red);
			}
			else
			{
				this.waveCLabel.setForeground (Color.black);
			}
			this.waveCLabel.setText ("C: " + patch.getWaveName (waveNumber));
			
			// osc D waveform
			waveNumber = patch.getParameterValue ("WaveNumberD");
			if (waveNumber < 32)
			{
				this.waveDLabel.setForeground (Color.red);
			}
			else
			{
				this.waveDLabel.setForeground (Color.black);
			}
			this.waveDLabel.setText ("D: " + patch.getWaveName (waveNumber));
			

			/*
			// filter summary
			
			String	filterString = "Filter: C"
				+ patch.getParameterValue ("FilterCutoff")
				+ "/R"
				+ patch.getParameterValue ("FilterResonance")
				+ "/E"
				+ patch.getParameterValue ("FilterEnvAmount");
				
			this.filterLabel.setText (filterString);
			*/
		}
		catch (VSException inException)
		{
System.err.println (inException);
		}
		
		return this;
	}
	
	public void
	setValue (Object inValue)
	{
	}
	
	// The following methods override the defaults for performance reasons

	/*
	protected void
	firePropertyChange (String inPropertyName, Object inOldValue, Object inNewValue)
	{
	}
	
	public void
	firePropertyChange (String inPropertyName, boolean inOldValue, boolean inNewValue)
	{
	}
	
	public void
	revalidate ()
	{
	}
	
	public void
	validate ()
	{
	}
	*/
	
	// PRIVATE DATA
	
	private Border
	border = null;
	
	private JLabel
	filterLabel = null;
	
	private JLabel
	titleLabel = null;
	
	private JLabel
	waveALabel = null;
	
	private JLabel
	waveBLabel = null;
	
	private JLabel
	waveCLabel = null;
	
	private JLabel
	waveDLabel = null;
	
}
