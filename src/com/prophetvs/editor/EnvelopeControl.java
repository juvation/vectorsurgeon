//
//	EnvelopeControl.java
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

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;

import javax.swing.BorderFactory;
import javax.swing.JComponent;

import org.w3c.dom.Attr;
import org.w3c.dom.Node;
import org.w3c.dom.NamedNodeMap;

// CLASS

public class EnvelopeControl
	extends CustomControl
	implements MouseListener, MouseMotionListener
{
	public
	EnvelopeControl ()
	{
		// add some listeners for tracking mouse goodies
		addMouseListener (this);
		addMouseMotionListener (this);
	}
	
	// COMPONENT INTERFACE
	
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
		String[]	names = new String [9];
		
		for (int i = 0; i < 9; i++)
		{
			if (i < 4)
			{
				names [i] = this.rateParameterNames [i + 1];
			}
			else
			{
				names [i] = this.levelParameterNames [i - 4];
			}
		}
		
		return names;
	}
	
	public void
	initialise (PatchWindow inPatchWindow, Node inCustomNode)
	{
		this.patchWindow = inPatchWindow;
		
		NamedNodeMap	attributes = inCustomNode.getAttributes ();
		
		for (int i = 0; i < 5; i++)
		{
			// there ain't no rate parameter 0
			if (i > 0)
			{
				Attr	rateParameter = (Attr) attributes.getNamedItem ("rateparameter" + i);
				this.rateParameterNames [i] = rateParameter.getValue ();
			}
			
			// there ain't no level parameter 4 for amp env
			if (i < 4 || this.allowLevel4)
			{
				Attr	levelParameter = (Attr) attributes.getNamedItem ("levelparameter" + i);
				this.levelParameterNames [i] = levelParameter.getValue ();
			}
		}
		
		Attr	widthNode = (Attr) attributes.getNamedItem ("width");
		Attr	heightNode = (Attr) attributes.getNamedItem ("height");
		
		int	width = Integer.parseInt (widthNode.getValue ());
		int	height = Integer.parseInt (heightNode.getValue ());
		Dimension	size = new Dimension (width, height);
		
		setMinimumSize (size);
		setMaximumSize (size);
		setPreferredSize (size);
	}
	
	public void
	setParameterValue (String inParameterName, int inParameterValue)
	{
		for (int i = 0; i < 5; i++)
		{
			// there ain't no rate parameter 0
			if (i > 0)
			{
				if (this.rateParameterNames [i].equals (inParameterName))
				{
					this.rates [i] = inParameterValue;
				}
			}

			// there ain't no level parameter 4 for amp env
			if (i < 4 || this.allowLevel4)
			{
				if (this.levelParameterNames [i].equals (inParameterName))
				{
					this.levels [i] = inParameterValue;
				}
			}
		}

		fireChangeEvent (inParameterName, inParameterValue);

		repaint ();
	}
	
	// MOUSEINPUTLISTENER INTERFACE
	
	public void
	mouseClicked (MouseEvent inEvent)
	{
	}
	
	public void
	mouseDragged (MouseEvent inEvent)
	{
		if (this.pointIndex >= 0)
		{
			Point	mousePoint = inEvent.getPoint ();
	
			int	height = getSize ().height;
			int	width = getSize ().width;
			
			int	maxStageSize = width / (this.rates.length - 1);

			// calculate the screen constraints of this drag
			Rectangle	dragBounds = null;
			
			if (this.pointIndex == 0)
			{
				dragBounds = new Rectangle (0, 0, 0, height);
			}
			else
			{
				Point	previousScreenPoint = envelopeToScreen (this.pointIndex - 1);
				
				dragBounds = new Rectangle (previousScreenPoint.x, 0, maxStageSize, height);
				
				if (this.pointIndex == 4 && (!this.allowLevel4))
				{
					// constrain level 4 to zero for amp env
					dragBounds.setLocation (previousScreenPoint.x, height);
					dragBounds.setSize (dragBounds.width, 0);
				}
			}
		
			if (mousePoint.x < dragBounds.x)
			{
				mousePoint.setLocation (dragBounds.x, mousePoint.getY ());
			}
			
			if (mousePoint.y < dragBounds.y)
			{
				mousePoint.setLocation (mousePoint.getX (), dragBounds.y);
			}
			
			if (mousePoint.x > (dragBounds.x + dragBounds.width))
			{
				mousePoint.setLocation (dragBounds.x + dragBounds.width, mousePoint.getY ());
			}

			if (mousePoint.y > (dragBounds.y + dragBounds.height))
			{
				mousePoint.setLocation (mousePoint.getX (), dragBounds.y + dragBounds.height);
			}

			// convert the new point to percent
			// HACK VS specific: constrain to 0-99
			
			this.rates [this.pointIndex] = ((mousePoint.x - dragBounds.x) * 99) / maxStageSize;
			this.levels [this.pointIndex] = ((height - mousePoint.y) * 99) / height;

			// there ain't no rate parameter 0
			if (this.pointIndex > 0)
			{
				this.patchWindow.setPatchParameterValue
					(this.rateParameterNames [this.pointIndex], this.rates [this.pointIndex]);
			}
			
			// there ain't no level parameter 4 for amp env
			if (this.pointIndex < 4 || this.allowLevel4)
			{
				this.patchWindow.setPatchParameterValue
					(this.levelParameterNames [this.pointIndex], this.levels [this.pointIndex]);
			}
			
			Graphics	graphics = getGraphics ();
			
			erase (graphics);
			draw (graphics);
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
	
	public void
	mouseMoved (MouseEvent inEvent)
	{
	}

	public void
	mousePressed (MouseEvent inEvent)
	{
		this.pointIndex = findClosestPoint (inEvent.getX (), inEvent.getY ());

		Graphics	graphics = getGraphics ();
		
		erase (graphics);
		draw (graphics);
	}

	public void
	mouseReleased (MouseEvent inEvent)
	{
	}

	// public methods
	
	public void
	draw (Graphics inGraphics)
	{
		Point	lastPoint = new Point (0, getSize ().height);
		
		for (int i = 0; i < this.rates.length; i++)
		{
			Point	screenPoint = envelopeToScreen (i);
			
			// don't draw the first line
			if (i > 0)
			{
				inGraphics.drawLine (lastPoint.x, lastPoint.y, screenPoint.x, screenPoint.y);
			}
			
			// draw a bobble around the point
			inGraphics.fillOval (screenPoint.x - 5, screenPoint.y - 5, 10, 10);
			
			lastPoint = screenPoint;
		}
		
		// HACK draw the border
		// why does super.paintComponent() not do this??
		Rectangle	bounds = getBounds ();
		inGraphics.drawRect (0, 0, bounds.width - 1, bounds.height - 1);
	}
	
	public void
	erase (Graphics inGraphics)
	{
		inGraphics.setColor (getBackground ());
		inGraphics.fillRect (0, 0, getSize ().width, getSize ().height);
		inGraphics.setColor (getForeground ());
	}
	
	// HACK for amplitude envelope
	public void
	setAllowLevel4 (boolean inAllow)
	{
		this.allowLevel4 = inAllow;
	}
	
	// PRIVATE METHODS
	
	private int
	findClosestPoint (int inX, int inY)
	{
		Point	findPoint = new Point (inX, inY);
		
		int	closestIndex = 0;
		int	closestDistance = Integer.MAX_VALUE;
		
		for (int i = 0; i < this.rates.length; i++)
		{
			Point	screenPoint = envelopeToScreen (i);
			
			int	distance = (int) findPoint.distance (screenPoint);
			
			if (distance < closestDistance)
			{
				closestIndex = i;
				closestDistance = distance;
			}
		}
		
		// ensure the click is inside the ball
		if (closestDistance > 6)
		{
			closestIndex = -1;
		}

		return closestIndex;
	}
	
	private Point
	envelopeToScreen (int inPointIndex)
	{
		int	cumulativeX = 0;
		
		for (int i = 0; i < (inPointIndex + 1); i++)
		{
			cumulativeX += this.rates [i];
		}
		
		// scale the width from percent to screen width
		int	maxStageSize = getSize ().width / (this.rates.length - 1);
		int	x = cumulativeX * (maxStageSize * (inPointIndex + 1));
		x /= (inPointIndex + 1) * 100;
		
		int	sizeY = getSize ().height;
		
		// scale the height from percent to screen height
		int	y = (this.levels [inPointIndex] * sizeY) / 100;
		
		// and reverse because screen starts at top left
		y = sizeY - y;
		
		return new Point (x, y);
	}
	
	// private data
	
	private boolean
	allowLevel4 = false;
	
	private int
	pointIndex = 0;
	
	// percent
	private int[]
	levels = new int [5];

	private int[]
	rates = new int [5];
	
	private PatchWindow
	patchWindow = null;
	
	private String[]
	levelParameterNames = new String [5];
	
	private String[]
	rateParameterNames = new String [5];
	
}

