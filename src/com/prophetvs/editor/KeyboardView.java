//
//	KeyboardView.java
//
//	Copyright 2019 Jason Proctor
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

import java.awt.Container;
import java.awt.Graphics;
import java.awt.Rectangle;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.List;

import javax.swing.JComponent;
import javax.swing.event.MouseInputListener;

public class KeyboardView
	extends JComponent
	implements MouseInputListener
{
	// PUBLIC CONSTRUCTOR
	
	public
	KeyboardView ()
	{
		setLayout (null);
		
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
	
	// MOUSEINPUTLISTENER INTERFACE
	
	public void
	mouseClicked (MouseEvent inEvent)
	{
	}
	
	public void
	mouseDragged (MouseEvent inEvent)
	{
		int	keyPressed = getMidiNoteNumber (inEvent);
		
		if (this.holdNotes)
		{
			if (keyPressed == this.lastKeyPressed)
			{
				// drag within our current note
				// don't do anything
			}
			else
			{
				// decide what to do with the note we dragged out of
				this.heldNotes [this.lastKeyPressed] = !this.heldNotes [this.lastKeyPressed];
				
				// and if that means it's no longer held
				if (! this.heldNotes [this.lastKeyPressed])
				{
					// turn it off
					ControlWindow.getInstance ().sendMidiNoteOff (this.lastKeyPressed);
				}
				
				// already holding this note?
				if (this.heldNotes [keyPressed])
				{
					// turn it off
					ControlWindow.getInstance ().sendMidiNoteOff (keyPressed);
					this.heldNotes [keyPressed] = false;
				}
				else
				{
					// hold it
					ControlWindow.getInstance ().sendMidiNoteOn (keyPressed, this.velocity);
				}
			}
		}
		else
		{
			if (keyPressed == this.lastKeyPressed)
			{
				// drag within our current note
				// don't do anything
			}
			else
			{
				ControlWindow.getInstance ().sendMidiNoteOff (this.lastKeyPressed);
				ControlWindow.getInstance ().sendMidiNoteOn (keyPressed, this.velocity);
			}
		}

		this.lastKeyPressed = keyPressed;
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
		int	keyPressed = getMidiNoteNumber (inEvent);
		
		if (this.holdNotes && this.heldNotes [keyPressed])
		{
			// this note is held, so this click is to turn it off
			// assuming we mouseup in this key or drag out
		}
		else
		{
			ControlWindow.getInstance ().sendMidiNoteOn (keyPressed, this.velocity);
		}
		
		this.lastKeyPressed = keyPressed;
	}
	
	public void
	mouseReleased (MouseEvent inEvent)
	{
		int	keyPressed = getMidiNoteNumber (inEvent);

		if (this.holdNotes)
		{
			// already holding this note?
			if (this.heldNotes [keyPressed])
			{
				// turn it off
				ControlWindow.getInstance ().sendMidiNoteOff (keyPressed);
				this.heldNotes [keyPressed] = false;
			}
			else
			{
				// hold it
				this.heldNotes [keyPressed] = true;
			}
		}
		else
		{
			ControlWindow.getInstance ().sendMidiNoteOff (keyPressed);
		}
	}

	// PUBLIC METHODS
	
	public int
	getOctaveOffset ()
	{
		return (this.octaveOffset / 12) - 4;
	}
	
	// called when the midi configuration changes
	// ControlWindow turns off *all* held midi notes
	// we just reset our hold table
	public void
	reset ()
	{
		for (int i = 0; i < this.heldNotes.length; i++)
		{
			this.heldNotes [i] = false;
		}
	}
	
	// called when the keyboard window goes away
	// note we turn off the keyboard notes *only*
	// not any midi thru'd ones!
	public void
	sendAllNotesOff ()
	{
		for (int i = 0; i < this.heldNotes.length; i++)
		{
			if (this.heldNotes [i])
			{
				ControlWindow.getInstance ().sendMidiNoteOff (i);
				this.heldNotes [i] = false;
			}
		}
	}
	
	public void
	setHoldNotes (boolean inHoldNotes)
	{
		this.holdNotes = inHoldNotes;
	}
	
	public boolean
	setOctaveOffset (int inOctaveOffset)
	{
		boolean	ok = inOctaveOffset >= -3 && inOctaveOffset <= 3;
		
		if (ok)
		{
			this.octaveOffset = (inOctaveOffset + 4) * 12;
		}
		
		return ok;
	}
	
	public void
	setVelocity (int inVelocity)
	{
		this.velocity = (int) Math.max (inVelocity, 1);
		this.velocity = (int) Math.min (inVelocity, 127);
	}
	
	// PRIVATE METHODS
	
	private void
	draw (Graphics inGraphics)
	{
		Rectangle	bounds = getBounds ();
		
		int	keyWidth = 0;
		this.numWhiteKeys = 0;
		
		for (int octave = 1; ; octave++)
		{
			this.numWhiteKeys = (octave * 7) + 1;
			keyWidth = bounds.width / this.numWhiteKeys;
			
			if (keyWidth < 40)
			{
				break;
			}
		}

		for (int key = 0; key < numWhiteKeys; key++)
		{
			inGraphics.drawRect (key * keyWidth, 0, keyWidth, bounds.height - 1);
		}
		
		List<Rectangle>	blackRectangles = new ArrayList<Rectangle> ();
		
		// for each octave
		int	numOctaves = numWhiteKeys / 7;
		
		for (int i = 0; i < numOctaves; i++)
		{
			int	octaveBase = i * (7 * keyWidth);
			
			// ASSUME black keys are half the width of white ones
			// and two thirds of the length
			
			for (int j = 0; j < this.blackKeyIndexes.length; j++)
			{
				int	x = octaveBase + ((blackKeyIndexes [j] + 1) * keyWidth) - (keyWidth / 4);
				
				Rectangle	blackKey = new Rectangle (x, 0, keyWidth / 2, (bounds.height * 2) / 3);
				
				inGraphics.fillRect (blackKey.x, blackKey.y, blackKey.width, blackKey.height);
			}
		}
	}
	
	private void
	erase (Graphics inGraphics)
	{
		inGraphics.setColor (getBackground ());
		inGraphics.fillRect (0, 0, getSize ().width, getSize ().height);
		inGraphics.setColor (getForeground ());
	}
	
	private int
	getMidiNoteNumber (MouseEvent inEvent)
	{
		int	mouseX = inEvent.getX ();
		int	mouseY = inEvent.getY ();
		
		Rectangle	bounds = getBounds ();
		
		// calculate the octave from the key
		// not the other way round
		// because error from the integer arithmetic accumulates
		
		int	keyWidth = bounds.width / this.numWhiteKeys;
		int	whiteKey = mouseX / keyWidth;
		int	octave = whiteKey / 7;		
		whiteKey -= (octave * 7);
		
		// for the final key number
		// start with the white key value
		int	midiKey = (octave * 12) + this.whiteKeyOffsets [whiteKey];

		// if the click is above the black key area
		if (mouseY < (bounds.height * 2) / 3)
		{
			int	keyStart = ((octave * 7) + whiteKey) * keyWidth;

			// try for a black key starting here
			if (whiteKey == 0 || whiteKey == 1 || whiteKey == 3 || whiteKey == 4 || whiteKey == 5)
			{
				int	blackKeyStart = keyStart + ((keyWidth * 3) / 4);
				
				if (mouseX >= blackKeyStart)
				{
					// huzzah we have a black key press
					midiKey++;
				}
			}

			// try for a black key ending here
			if (whiteKey == 1 || whiteKey == 2 || whiteKey == 4 || whiteKey == 5 || whiteKey == 6)
			{
				if (mouseX <= keyStart + (keyWidth / 4))
				{
					// huzzah we have a black key press
					midiKey--;
				}
			}
		}
		
		return midiKey + this.octaveOffset;
	}

	// PRIVATE DATA
	
	private boolean
	holdNotes = false;
	
	private boolean[]
	heldNotes = new boolean [128];
	
	private int
	lastKeyPressed = -1;
	
	private int
	numWhiteKeys = 0;
	
	private int
	octaveOffset = 48;
	
	private int
	velocity = 80;
	
	private int[]
	blackKeyIndexes = {0, 1, 3, 4, 5};

	private int[]
	whiteKeyOffsets = {0, 2, 4, 5, 7, 9, 11};
	
}

