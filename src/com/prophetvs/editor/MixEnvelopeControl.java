//
//	MixEnvelopeControl.java
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

import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Rectangle;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;

import javax.swing.JComponent;

import org.w3c.dom.Attr;
import org.w3c.dom.Node;
import org.w3c.dom.NamedNodeMap;

// CLASS

public class MixEnvelopeControl
	extends CustomControl
	implements MouseListener, MouseMotionListener
{
	public
	MixEnvelopeControl ()
	{
		// add some listeners for tracking mouse goodies
		addMouseListener (this);
		addMouseMotionListener (this);
	}
	
	// JCOMPONENT OVERRIDES
	
	public void
	paintComponent (Graphics inGraphics)
	{
		erase (inGraphics);
		draw (inGraphics);
	}
	
	// CUSTOMCONTROL IMPLEMENTATION
	
	public String[]
	getParameterNames ()
	{
		String[]	names = new String [2];
		
		names [0] = this.xParameterName;
		names [1] = this.yParameterName;
		
		return names;
	}
	
	public void
	initialise (PatchWindow inPatchWindow, Node inCustomNode)
	{
		this.patchWindow = inPatchWindow;
		
		NamedNodeMap	attributes = inCustomNode.getAttributes ();
		
		Attr	xParameterNameNode = (Attr) attributes.getNamedItem ("xparametername");
		Attr	yParameterNameNode = (Attr) attributes.getNamedItem ("yparametername");
		Attr	sizeNode = (Attr) attributes.getNamedItem ("size");
		
		this.xParameterName = xParameterNameNode.getValue ();
		this.yParameterName = yParameterNameNode.getValue ();
		
		int	sizeInt = Integer.parseInt (sizeNode.getValue ());
		Dimension	size = new Dimension (sizeInt, sizeInt);
		
		setMinimumSize (size);
		setMaximumSize (size);
		setPreferredSize (size);
	}
	
	public void
	setParameterValue (String inParameterName, int inParameterValue)
	{
		/*
		System.err.println
			("MixEnvelopeControl.setParameterValue(" + inParameterName + "," + inParameterValue + ")");
		*/
		
		if (inParameterName.equals (this.xParameterName))
		{
			this.xValue = inParameterValue;
			
			if (this.xValue > 63)
			{
				this.xValue = 63;
			}
			else
			if (this.xValue < -63)
			{
				this.xValue = -63;
			}
		}
		else
		if (inParameterName.equals (this.yParameterName))
		{
			this.yValue = inParameterValue;
			
			if (this.yValue > 63)
			{
				this.yValue = 63;
			}
			else
			if (this.yValue < -63)
			{
				this.yValue = -63;
			}
		}
		
		fireChangeEvent (inParameterName, inParameterValue);
				
		repaint ();
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
		mouseDragged (inEvent);
	}

	public void
	mouseReleased (MouseEvent inEvent)
	{
	}
	
	// MOUSEMOTIONLISTENER IMPLEMENTATION
	
	public void
	mouseDragged (MouseEvent inEvent)
	{
		if (this.envelopeBounds.contains (inEvent.getX (), inEvent.getY ()))
		{
			// scale pixels back to VS values
			double	xDouble = (double) inEvent.getX ();
			xDouble -= this.envelopeBounds.x;
			xDouble /= this.envelopeBounds.width;
			xDouble *= 127;
			xDouble -= 63;
			this.xValue = (int) Math.ceil (xDouble);

			double	yDouble = (double) inEvent.getY ();
			yDouble -= this.envelopeBounds.y;
			yDouble /= this.envelopeBounds.height;
			yDouble *= 127;
			yDouble -= 63;
			this.yValue = (int) Math.ceil (yDouble);

			this.patchWindow.setPatchParameterValue (this.xParameterName, xValue);
			this.patchWindow.setPatchParameterValue (this.yParameterName, yValue);
			
			repaint ();
		}
	}

	public void
	mouseMoved (MouseEvent inEvent)
	{
	}

	// PUBLIC METHODS
	
	public void
	draw (Graphics inGraphics)
	{
		FontMetrics	fm = getFontMetrics (getFont ());
		int	maxCharHeight = fm.getHeight ();
		int	maxCharWidth = fm.stringWidth ("M");
		
		if (maxCharHeight > maxCharWidth)
		{
			maxCharWidth = maxCharHeight;
		}
		else
		{
			maxCharHeight = maxCharWidth;
		}
		
		Rectangle	bounds = getBounds ();
		
		// osc A label
		String	name = "A";
		int	nameLength = fm.stringWidth (name);
		inGraphics.drawString (name, (maxCharWidth / 2) - (nameLength / 2),
			bounds.height / 2);
			
		// osc B label
		name = "B";
		nameLength = fm.stringWidth (name);
		inGraphics.drawString (name, (bounds.width / 2) - (nameLength / 2),
			maxCharHeight - fm.getMaxDescent ());

		// osc C label
		name = "C";
		nameLength = fm.stringWidth (name);
		inGraphics.drawString (name, bounds.width - (maxCharWidth / 2) - (nameLength / 2),
			bounds.height / 2);

		// osc D label
		name = "D";
		nameLength = fm.stringWidth (name);
		inGraphics.drawString (name, (bounds.width / 2) - (nameLength / 2),
			bounds.height - fm.getMaxDescent ());

		// calculate the location & size of the actual envelope rectangle
		this.envelopeBounds = new Rectangle (bounds);
		this.envelopeBounds.setBounds (maxCharWidth, maxCharHeight,
			bounds.width - (maxCharWidth * 2),
			bounds.height - (maxCharHeight * 2));

		inGraphics.drawRect (this.envelopeBounds.x, this.envelopeBounds.y,
			this.envelopeBounds.width, this.envelopeBounds.height);
			
		// set the clip rectangle so that the position indicator
		// doesn't overrun the envelope area
		inGraphics.setClip (this.envelopeBounds.x, this.envelopeBounds.y,
			this.envelopeBounds.width, this.envelopeBounds.height);
		
		// convert our values to pixel coordinates
		double	xDouble = (double) xValue;
		xDouble += 63;
		xDouble /= 127;
		xDouble *= this.envelopeBounds.width;
		int	xCoordinate = (int) Math.floor (xDouble);

		double	yDouble = (double) yValue;
		yDouble += 63;
		yDouble /= 127;
		yDouble *= this.envelopeBounds.height;
		int	yCoordinate = (int) Math.floor (yDouble);
		
		// draw the indicator
		inGraphics.fillOval (this.envelopeBounds.x + xCoordinate - 5,
			this.envelopeBounds.y + yCoordinate - 5, 10, 10);
	}
	
	public void
	erase (Graphics inGraphics)
	{
		inGraphics.setColor (getBackground ());
		inGraphics.fillRect (0, 0, getSize ().width, getSize ().height);
		inGraphics.setColor (getForeground ());
	}
	
	// PRIVATE DATA MEMBERS
	
	private int
	xValue = 0;
	
	private int 
	yValue = 0;
	
	private PatchWindow
	patchWindow = null;
	
	private Rectangle
	envelopeBounds = null;
	
	private String
	xParameterName = null;
	
	private String
	yParameterName = null;

}

