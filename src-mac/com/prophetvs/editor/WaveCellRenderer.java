// WaveCellRenderer.java

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

public class WaveCellRenderer
	extends JComponent
	implements TableCellRenderer
{
	public
	WaveCellRenderer ()
	{
		setLayout (new BoxLayout (this, BoxLayout.Y_AXIS));
		setOpaque (false);
		
		this.titleLabel = new JLabel ();
		this.titleLabel.setFont (new Font ("Sans Serif", Font.BOLD, 12));
		add (this.titleLabel);
		
		this.waveView = new WaveView ();
		this.waveView.setPreferredSize (new Dimension (150, 150));
		add (this.waveView);
		
		// inverted selections plain don't work
		// so resort to borders :-|
		this.border = BorderFactory.createLineBorder (Color.black, 1);
	}
	
	// TABLECELLRENDERER IMPLEMENTATION
	
	public Component
	getTableCellRendererComponent (JTable inTable, Object inValue,
		boolean inIsSelected, boolean inHasFocus, int inRow, int inColumn)
	{
		Wave	wave = (Wave) inValue;

		if (inIsSelected)
		{
			setBorder (this.border);
		}
		else
		{
			setBorder (null);
		}
		
		if (wave != null)
		{
			this.titleLabel.setText ("WAVE " + wave.getWaveNumber ());
			this.waveView.setWave (wave);
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
	titleLabel = null;
	
	private WaveView
	waveView = null;
	
}
