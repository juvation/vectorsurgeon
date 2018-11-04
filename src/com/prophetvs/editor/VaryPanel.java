
// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.Container;
import java.awt.FlowLayout;
import java.awt.Window;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.ArrayList;
import java.util.List;

import javax.swing.BoxLayout;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JOptionPane;
import javax.swing.JRootPane;
import javax.swing.JScrollPane;
import javax.swing.JTextField;
import javax.swing.ListSelectionModel;
import javax.swing.border.TitledBorder;

import org.w3c.dom.Document;

// CLASS

public class VaryPanel
	extends JPanel
	implements ActionListener
{
	// CONSTRUCTOR
	
	public 
	VaryPanel ()
	{
		// LAYOUT

		setLayout (new FlowLayout (FlowLayout.LEADING));

		// CONTENTS
		
		JLabel	parameterLabel = new JLabel ("Parameter:");
		add (parameterLabel);
		
		// add the meta parameters first
		String[]	metaParameterNames = MetaParameters.getInstance ().getNames ();
		String[]	parameterNames = Patch.getParameterNamesArray ();
		String[]	names = new String [metaParameterNames.length + parameterNames.length];
		
		for (int i = 0; i < metaParameterNames.length; i++)
		{
			names [i] = metaParameterNames [i];
		}

		for (int i = 0; i < parameterNames.length; i++)
		{
			names [metaParameterNames.length + i] = parameterNames [i];
		}
		
		this.parameterPopup = new JComboBox (names);
		this.parameterPopup.setActionCommand ("PARAMETER_POPUP");
		this.parameterPopup.addActionListener (this);
		add (this.parameterPopup);
		
		this.minMaxLabel = new JLabel ();
		add (this.minMaxLabel);
		
		// right now force the min/max label update by setting the parameter popup value
		this.parameterPopup.setSelectedIndex (0);

		JLabel	transformLabel = new JLabel ("Transform:");
		add (transformLabel);

		try
		{
			VariationGenerator	generator = VariationGenerator.getInstance ();
			
			this.transformPopup = new JComboBox (generator.getTransformNames ());
			this.transformPopup.setActionCommand ("TRANSFORM_POPUP");
			this.transformPopup.addActionListener (this);
			add (this.transformPopup);
			
			// right now force a parameter update by setting the transform popup value
			this.transformPopup.setSelectedIndex (0);
		}
		catch (Throwable inThrowable)
		{
			ControlWindow.showErrorDialog ("Error", inThrowable);
		}
	}
	
	// ACTIONLISTENER IMPLEMENTATION
	
	public void
	actionPerformed (ActionEvent inEvent)
	{
		String	actionCommand = inEvent.getActionCommand ();
		
		if (actionCommand.equals ("PARAMETER_POPUP"))
		{
			String	parameterName = (String) this.parameterPopup.getSelectedItem ();
			
			try
			{
				// check for meta parameter!
				List<String>	parameterNames = MetaParameters.getInstance ().get (parameterName);
				
				if (parameterNames != null)
				{
					parameterName = parameterNames.get (0);
				}
				
				// this throws on bad name
				Patch.ParameterSpec	parameterSpec = Patch.getParameterSpec (parameterName);
				
				StringBuffer	minMaxString = new StringBuffer ();
				minMaxString.append ("Values: ");
				minMaxString.append (parameterSpec.min);
				minMaxString.append (" to ");
				minMaxString.append (parameterSpec.max);
				
				this.minMaxLabel.setText (minMaxString.toString ());
				
				packParent ();
			}
			catch (Throwable inThrowable)
			{
				ControlWindow.showErrorDialog ("Error", inThrowable);
			}
		}
		else
		if (actionCommand.equals ("TRANSFORM_POPUP"))
		{
			// blow away the existing parameter labels & values
			for (JLabel transformLabel : this.transformParameterLabels)
			{
				transformLabel.setVisible (false);
				transformLabel.getParent ().remove (transformLabel);
			}

			this.transformParameterLabels.clear ();
			
			for (JTextField transformField : this.transformParameterFields)
			{
				transformField.setVisible (false);
				transformField.getParent ().remove (transformField);
			}
			
			this.transformParameterFields.clear ();

			// remove the value cache
			this.transformParameterValues.clear ();
		
			// now set up the new stuff
			String	transformName = (String) this.transformPopup.getSelectedItem ();
			
			try
			{
				VariationGenerator	generator = VariationGenerator.getInstance ();
				Transform	transform = generator.getTransform (transformName);
	
				if (transform == null)
				{
System.err.println ("can't find transform for name: " + transformName);
				}
				else
				{
					String[]	transformParameterNames = transform.getTransformParameterNames ();
		
					for (String transformParameterName : transformParameterNames)
					{
						JLabel	label = new JLabel (transformParameterName);
						add (label);
						this.transformParameterLabels.add (label);
						
						JTextField	field = new JTextField ();
						field.setColumns (3);
						add (field);
						this.transformParameterFields.add (field);
					}
				}
				
				packParent ();
			}
			catch (Throwable inThrowable)
			{
inThrowable.printStackTrace (System.err);
			}
		}
	}
	
	// PUBLIC METHODS
	
	// read the values from the text fields into the value list
	// the alternative is DocumentListener - inefficient etc
	public void
	cacheParameterValues ()
	{
		this.transformParameterValues.clear ();
		
		for (JTextField valueField : this.transformParameterFields)
		{
			String	value = valueField.getText ();

			// this might be null, but the indexes into the lists
			// must be preserved - the client's lookout!
			this.transformParameterValues.add (value);
		}
	}
	
	public String
	getParameterName ()
	{
		return (String) this.parameterPopup.getSelectedItem ();
	}
	
	public List<String>
	getTransformParameters ()
	{
		return this.transformParameterValues;
	}
	
	public String
	getTransformName ()
	{
		return (String) this.transformPopup.getSelectedItem ();
	}
	
	// PRIVATE METHODS
	
	private void
	packParent ()
	{
		// this is stupid
		for (Container parent = this; parent != null; parent = parent.getParent ())
		{
			if (parent instanceof Window)
			{
				Window	parentWindow = (Window) parent;

				// why do we need this?
				parentWindow.pack ();

				// re-centre the window
				parentWindow.setLocationRelativeTo (null);
				break;
			}
		}
	}
	
	// PRIVATE DATA
	
	private JComboBox	
	parameterPopup = null;
	
	private JComboBox
	transformPopup = null;
	
	private JLabel
	minMaxLabel = null;
	
	private List<String>
	transformParameterValues = new ArrayList<String> ();
	
	private List<JTextField>
	transformParameterFields = new ArrayList<JTextField> ();
	
	private List<JLabel>
	transformParameterLabels = new ArrayList<JLabel> ();
	
}

