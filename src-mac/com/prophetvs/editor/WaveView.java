// WaveView.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.Graphics;
import java.awt.Rectangle;
import java.awt.event.MouseEvent;
import java.io.ByteArrayInputStream;

import javax.swing.JComponent;

public class WaveView
	extends JComponent
{
	// PUBLIC CONSTRUCTOR
	
	public
	WaveView (Wave inWave)
	{
		this.wave = inWave;

		// our window parent handles mouse listening
		// to keep track of modified etc
	}
	
	// WaveCellRenderer must reuse the same WaveView
	// uses setWave()
	public
	WaveView ()
	{
		// our window parent handles mouse listening
		// to keep track of modified etc
	}
	
	// COMPONENT INTERFACE
	
	public void
	paintComponent (Graphics inGraphics)
	{
		erase (inGraphics);
		draw (inGraphics);
	}
	
	// PUBLIC METHODS
	
	// samples are converted to 12-bit unsigned for the purposes of drawing them
	public void
	draw (Graphics inGraphics)
	{
		Rectangle	bounds = getBounds ();

		for (int i = 0; i < 128; i++)
		{
			if (i < 127)
			{
				int	thisSample = this.wave.getSample (i);
				thisSample += 2048;
				
				int	thisX = (int) (((double) i / 128) * bounds.getWidth ());
				double	thisScaledSample = ((double) thisSample / 4096.0) * bounds.getHeight ();
				int	thisY = (int) (bounds.getHeight () - thisScaledSample);
	
				int	nextSample = this.wave.getSample (i + 1);
				nextSample += 2048;

				int	nextX = (int) (((double) (i + 1) / 128) * bounds.getWidth ());
				double	nextScaledSample = ((double) nextSample / 4096.0) * bounds.getHeight ();
				int	nextY = (int) (bounds.getHeight () - nextScaledSample);

				inGraphics.drawLine (thisX, thisY, nextX, nextY);
			}
		}
	}
	
	public void
	erase (Graphics inGraphics)
	{
		inGraphics.setColor (getBackground ());
		inGraphics.fillRect (0, 0, getSize ().width, getSize ().height);
		inGraphics.setColor (getForeground ());
	}
	
	public void
	processEditEvent (MouseEvent inEvent)
	{
		Rectangle	bounds = getBounds ();
		
		if (inEvent.getX () < bounds.getX ())
		{
			return;
		}
		
		if (inEvent.getX () >= (bounds.getX () + bounds.getWidth ()))
		{
			return;
		}
		
		if (inEvent.getY () < bounds.getY ())
		{
			return;
		}
		
		if (inEvent.getY () >= (bounds.getY () + bounds.getHeight ()))
		{
			return;
		}

		// figure out which sample we clicked on
		double	sampleNumberDouble = (double) inEvent.getX ();
		sampleNumberDouble /= bounds.getWidth ();
		sampleNumberDouble *= 128;
		int	sampleNumber = (int) Math.floor (sampleNumberDouble);
		
		// and figure out the magnitude of the sample
		// remember the Y coordinate is inverted
		double	sampleDouble = (double) inEvent.getY ();
		sampleDouble = bounds.getHeight () - sampleDouble;
		sampleDouble /= bounds.getHeight ();
		sampleDouble *= 4096;
		int	sample = (int) Math.floor (sampleDouble);
		
		// convert sample to 12-bit signed for storage
		sample -= 2048;
		
		this.wave.setSample (sampleNumber, sample);
		
		repaint ();
	}
	
	public void
	setAllowEditing (boolean inAllowEditing)
	{
		this.allowEditing = inAllowEditing;
	}
	
	public void
	setWave (Wave inWave)
	{
		this.wave = inWave;
	}
	
	// PRIVATE METHODS
	
	// PRIVATE DATA
	
	private boolean
	allowEditing = false;
	
	private Wave
	wave = null;
	
}

