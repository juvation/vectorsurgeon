// VaryCellRenderer.java

// PACKAGE

package com.prophetvs.editor;

// IMPORTS

import java.awt.Component;

import javax.swing.JComboBox;
import javax.swing.JTable;
import javax.swing.table.TableCellRenderer;

public class VaryCellRenderer
	extends JComboBox
	implements TableCellRenderer
{
	public
	VaryCellRenderer (String[] inItems)
	{
		super (inItems);
	}
	
	// TABLECELLRENDERER IMPLEMENTATION
	
	public Component
	getTableCellRendererComponent (JTable inTable, Object inValue,
		boolean inIsSelected, boolean inHasFocus, int inRow, int inColumn)
	{
		if (inIsSelected)
		{
			setForeground (inTable.getSelectionForeground ());
			setBackground (inTable.getSelectionBackground ());
		}
		else
		{
			setForeground (inTable.getForeground ());
			setBackground (inTable.getBackground ());
		}
		
		// select the item
		setSelectedItem (inValue);
		
		return this;
	}

}
