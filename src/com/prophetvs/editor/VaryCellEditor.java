// VaryCellEditor.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.Component;

import javax.swing.JComboBox;
import javax.swing.DefaultCellEditor;

public class VaryCellEditor
	extends DefaultCellEditor
{
	public
	VaryCellEditor (String[] inItems)
	{
		super (new JComboBox (inItems));
	}

}
