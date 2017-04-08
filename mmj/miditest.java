//
//  Simple mmj demo
//
//  Created by Nils Peters on 1/13/07.
//  Copyright (c) 2007 __humatic__. All rights reserved.
//

import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import java.io.File;

import de.humatic.mmj.*;

import javax.sound.midi.*;
import java.util.Vector;

import java.util.prefs.Preferences;

public class miditest implements MidiListener, MidiSystemListener {
	
	private JComboBox ib,
					  ob;
					  
	private String[] hexChars = new String[]{"0","1", "2", "3", "4", "5","6","7","8","9","A", "B","C","D","E","F"};

	MidiOutput[] mos = new MidiOutput[4];
	MidiOutput mo;
	
	JFrame frame;
	private JCheckBox mouseOverCB = new JCheckBox();
	
	private Receiver[] receivers = new Receiver[4];
	private Receiver receiver;
	
	private boolean java = true,
					outputEnabled,
					hex = true;
					
	private int ch = 0,
				ctrl = 7,
				nr;
   
    javax.sound.midi.MidiDevice.Info[] ins;
	javax.sound.midi.MidiDevice.Info[] outs;
		
	private Preferences prefs;
			
    public miditest() {
        
		frame = new JFrame("mmj");
		
		Object[] options = { "javax.sound.midi", "mmj" };

		int result = JOptionPane.showOptionDialog(null, "Use javax.sound.midi.spi or mmj api?", "Select demo mode!",
								 JOptionPane.DEFAULT_OPTION, JOptionPane.WARNING_MESSAGE,
								 null, options, options[1]);
		
		java = result == 0;
		
		buildMMJDemo();
			
		frame.pack();
		
		frame.setLocation((int)(Toolkit.getDefaultToolkit().getScreenSize().getWidth()/2-frame.getWidth()/2), 40);
	
		frame.setVisible(true);
			
			
	}
	
	private void buildMMJDemo() {
		
		StringBuffer sb = new StringBuffer("mmj\n");
		sb.append("jar: "+de.humatic.mmj.MidiSystem.getJarVersion()+", dll: "+de.humatic.mmj.MidiSystem.getLibraryVersion()+"\n");
		sb.append("JDK: "+System.getProperty("java.version")+"\n");
		sb.append("OS: "+System.getProperty("os.name")+" "+System.getProperty("os.version")+" "+System.getProperty("os.arch"));
		System.out.println(sb.toString());
		
		boolean sendActiveSensing = false;
		
		if (!java){ 
		
			try{ de.humatic.mmj.MidiSystem.enableActiveSensing(sendActiveSensing); }catch (Exception e){}
			
			de.humatic.mmj.MidiSystem.initMidiSystem("mmj src", "mmj dest");
		
			de.humatic.mmj.MidiSystem.addSystemListener(this);
		
		} else {
		
			try{
				
				/** enable ActiveSensing if desired (default is off). This uses standard java api and will not hurt on other platforms **/
				
				if (sendActiveSensing) {
				
					prefs = Preferences.userRoot().node("de").node("humatic").node("mmj");
				
					prefs.put("as", String.valueOf(sendActiveSensing));
					
				}
				
			} catch (Exception e){}
			
			javax.sound.midi.MidiDevice.Info[] dev = javax.sound.midi.MidiSystem.getMidiDeviceInfo();
			int numIns = 0;
			int numOuts = 0;
			for (int i = 0; i < dev.length; i++) {
				System.out.println(dev[i]+" - "+dev[i].getClass());
				try{
					if (javax.sound.midi.MidiSystem.getMidiDevice(dev[i]).getMaxTransmitters() != 0) numIns++;
					if (javax.sound.midi.MidiSystem.getMidiDevice(dev[i]).getMaxReceivers() != 0) numOuts++;
				} catch (Exception me){}
			}
			
			ins = new javax.sound.midi.MidiDevice.Info[numIns];
			outs = new javax.sound.midi.MidiDevice.Info[numOuts];
			numIns = 0;
			numOuts = 0;
			for (int i = 0; i < dev.length; i++) {
				try{
					if (javax.sound.midi.MidiSystem.getMidiDevice(dev[i]).getMaxTransmitters() != 0) ins[numIns++] = javax.sound.midi.MidiSystem.getMidiDeviceInfo()[i];
					if (javax.sound.midi.MidiSystem.getMidiDevice(dev[i]).getMaxReceivers() != 0) outs[numOuts++] = javax.sound.midi.MidiSystem.getMidiDeviceInfo()[i];
				} catch (Exception me){}
			}
			
		}
		
		frame.getContentPane().setLayout(new BorderLayout());
		JPanel upper = new JPanel(new BorderLayout());
		upper.setPreferredSize(new Dimension(400, 90));
		JPanel upper1 = new JPanel();
		JPanel upper2 = new JPanel();

		
		if (!java) ib = new JComboBox(de.humatic.mmj.MidiSystem.getInputs());
		else ib =  new JComboBox(ins);
		ib.addItem("input");
		ib.setSelectedIndex(ib.getItemCount()-1);
		ib.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				if (ib.getSelectedIndex() >= ib.getItemCount()-1) return;
				if (!java) {
					MidiInput mi = openInput(ib.getSelectedIndex());
					System.out.println(mi+"\n"+mi.getDeviceInfo());
				} else {
					try{
						System.out.println("opening "+ins[ib.getSelectedIndex()]);
						MidiDevice myInPort = javax.sound.midi.MidiSystem.getMidiDevice(ins[ib.getSelectedIndex()]);
						myInPort.open();
						Transmitter t = myInPort.getTransmitter();
						t.setReceiver(new MidiIn(ins[ib.getSelectedIndex()].toString()));
					}catch (MidiUnavailableException mue){
						System.out.println("can't open MidiIn : " +mue.toString());
					}
				}
					
			}
		});
		
		upper1.add(ib);
		
		final JButton send = new JButton("send sysEx");
		send.setEnabled(false);
		
		if (!java) ob = new JComboBox(de.humatic.mmj.MidiSystem.getOutputs());
		else ob =  new JComboBox(outs);
		

		ob.addItem("output");
		ob.setSelectedIndex(ob.getItemCount()-1);
		ob.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				if (ob.getSelectedIndex() >= ob.getItemCount()-1) return;
				
				if (!java) {
					mo = openOutput(ob.getSelectedIndex());
					System.out.println(mo+"\n"+mo.getDeviceInfo());	
					//de.humatic.mmj.MidiSystem.setMidiThru(ib.getSelectedIndex(), ob.getSelectedIndex());
				} else {
					try{
						System.out.println("opening "+outs[ob.getSelectedIndex()]);
						MidiDevice myOutPort = javax.sound.midi.MidiSystem.getMidiDevice(outs[ob.getSelectedIndex()]);
						myOutPort.open();
						receiver = myOutPort.getReceiver();
						send.setEnabled(true);
						outputEnabled = true;
					}catch (MidiUnavailableException mue){
						System.out.println("can't open MidiOut : " +mue.toString());
					}
				}

				send.setEnabled(true);
				outputEnabled = true;
			}
		});

		upper1.add(ob);
		
		send.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				try{
					
					
					FileDialog fd = new FileDialog(new Frame(), "Select sysEx file", FileDialog.LOAD);
					fd.setVisible(true);
					File f = new File(fd.getDirectory()+fd.getFile());
					java.io.FileInputStream fis = new java.io.FileInputStream(f.getAbsoluteFile());
					byte[] data = new byte[(int)(f.length())];
					int offset = 0;
					while(offset < data.length) {
						int num = fis.read(data, offset, fis.available());
						offset+= num;
					}
					
					if (!java) {
						if ((data[0] & 0xFF) != 0xF0) {
							byte[] outData = new byte[data.length+1];
							outData[0] = (byte)0xF0;
							for (int i = 1; i < outData.length; i++) outData[i] = data[i-1];
							mo.sendMidi(outData);
						} else mo.sendMidi(data); 
					} else {
						if ((data[0] & 0xFF) == 0xF0) {
							byte[] outData = new byte[data.length-1];
							for (int i = 1; i < data.length; i++) outData[i-1] = data[i];
							sendJavaMidi(240, outData);
						} else sendJavaMidi(240, data);
					}
				} catch (Exception ex){ex.printStackTrace();}
			}
		});

		upper1.add(send);
		upper.add("North", upper1);
		frame.getContentPane().add("North", upper);
		
		upper2 = new JPanel(new GridLayout(1,0));
		upper2.add(createSlider("Pitch", 8192, 224, 0));
		upper2.add(createSlider("Modulation", 0, 176, 1));
		upper2.add(createControllerSlider( 128, 176));
		
		upper.add("Center", upper2);
		
		JPanel p = new JPanel(new BorderLayout());
		
		frame.getContentPane().add("Center", new Piano());
		
		frame.setDefaultCloseOperation(javax.swing.WindowConstants.EXIT_ON_CLOSE);
		
	}
	
	    
    public static void main(String[] args) {
        
		miditest test = new miditest();
    
	}
	
	private MidiInput openInput(int index) {
		
		MidiInput mi = de.humatic.mmj.MidiSystem.openMidiInput(index);
		
		MidiInputListener mil = new MidiInputListener(mi);
		
		return mi;
		
	}
		
	private MidiOutput openOutput(int index) {
		
		return de.humatic.mmj.MidiSystem.openMidiOutput(index);
	
	}	
	
	public void midiInput(byte[] data){
		
		for (int i = 0; i < data.length; i++) {
			//System.out.print((data[i] & 0xFF)+"  ");
			System.out.print(hexChars[(data[i] & 0xFF) / 16] );
			System.out.print(hexChars[(data[i] & 0xFF) % 16]+"  ");
			if (data.length > 5 && i % 15 == 0) System.out.println("");
		}
		System.out.println("");
		
	}
	
	public void systemChanged() {
		
		try{
			ib.removeAllItems();
			for (int i = 0; i < de.humatic.mmj.MidiSystem.getInputs().length; i++) ib.addItem(de.humatic.mmj.MidiSystem.getInputs()[i]);
		
			ob.removeAllItems();
			for (int i = 0; i < de.humatic.mmj.MidiSystem.getOutputs().length; i++) ob.addItem(de.humatic.mmj.MidiSystem.getOutputs()[i]);
		} catch (Exception e){}
		
		System.out.println("MIDI SYSTEM CHANGED");
		
	}
	
	void sendJavaMidi(int status, byte[] data) { 
		
		if (receiver == null) return;
		
		try{

			MidiMessage msg = null;

			if (status == 0xF0) {

				msg = new javax.sound.midi.SysexMessage();

				try{ ((SysexMessage)msg).setMessage(0xF0, data, data.length); }catch (InvalidMidiDataException imde){return;}

			} else if (status >= 250) {

				msg = new ShortMessage();

				try{((ShortMessage)msg).setMessage(status); }catch (InvalidMidiDataException imde){return;}

			} else {
			
				msg = new ShortMessage(); 

				try{((ShortMessage)msg).setMessage(status, data[0], data[1]); }catch (InvalidMidiDataException imde){return;}
			
			}

			if (msg == null) return;

			receiver.send(msg, 0); 
		
		}catch (Exception e){}

	}


	private class MidiIn implements Receiver{
		
		private String name;
		
		private MidiIn(String portName) { name = portName; }

		public void close(){}

		public void send(MidiMessage msg, long timeStamp) {

			//if (msg.getStatus() == 254) return;
			
			System.out.println("Input from: "+name);
			
			for (int i = 0; i < msg.getMessage().length; i++) {
				if (!hex) System.out.print(msg.getMessage()[i]+" ");
				else {
					System.out.print(hexChars[(msg.getMessage()[i] & 0xFF) / 16] );
					System.out.print(hexChars[(msg.getMessage()[i] & 0xFF) % 16]+"  ");
					if (msg.getLength() > 4 && (i+1) % 16 == 0) System.out.println("");
				}
			}
			System.out.println("");
		
		}
		
	}
	
	private JSlider createSlider(String name, final int def, final int status, final int cNr) {
		
		final JSlider slider = new JSlider(0, status < 224 ? 128 : 16384, def);
		slider.setBorder(new javax.swing.border.TitledBorder(name));
		slider.addChangeListener(new javax.swing.event.ChangeListener() {
			public void stateChanged(javax.swing.event.ChangeEvent e) {
				try{
					if (status < 224) {
						if (java) sendJavaMidi(status+ch, new byte[]{(byte)cNr, (byte)(slider.getValue())}); 
						else mo.sendMidi(new byte[]{(byte)(status+ch), (byte)cNr, (byte)(slider.getValue())}, de.humatic.mmj.MidiSystem.getHostTime());
					} else { 
						if (java) sendJavaMidi(status+ch, new byte[]{(byte)(slider.getValue() % 0x7F), (byte)(slider.getValue() / 128)}); 
						else mo.sendMidi(new byte[]{(byte)(status+ch), (byte)(slider.getValue() % 0x7F), (byte)(slider.getValue() / 128)}, de.humatic.mmj.MidiSystem.getHostTime());
					} 
				} catch (Exception ex){}
			}
		});
		return slider;
	}
	
	private JPanel createControllerSlider(final int def, final int status) {
		
		final JPanel cp = new JPanel(new BorderLayout());
		cp.setBorder(new javax.swing.border.TitledBorder("Controller"));
		final JSlider slider = new JSlider(0, 128, def);
		slider.addChangeListener(new javax.swing.event.ChangeListener() {
			public void stateChanged(javax.swing.event.ChangeEvent e) {
				try{
					if (java) sendJavaMidi(status+ch, new byte[]{(byte)ctrl, (byte)(slider.getValue())}); 
					else mo.sendMidi(new byte[]{(byte)(status+ch), (byte)ctrl, (byte)(slider.getValue())}, de.humatic.mmj.MidiSystem.getHostTime());
				} catch (Exception ex){}
			}
		});
		final JTextField tf = new JTextField("  7  ");
		tf.addActionListener(new java.awt.event.ActionListener() {
			public void actionPerformed(java.awt.event.ActionEvent e) {
				try{ ctrl = new Integer(tf.getText().trim()).intValue(); } catch (Exception ex){ ctrl = 7; }
			}
		});
 
		cp.add("Center", slider);
		cp.add("East", tf);
		return cp;
	}
	
	/** Piano & Key code basics taken from javasound demos (c) Sun Microsystems **/
     
	 class Key extends Rectangle {
        int noteState = 0;
        int kNum;
        boolean isBlack;

        public Key(int x, int y, int width, int height, int num, boolean black) {
            super(x, y, width, height);
            kNum = num;
            isBlack = black;
        }
        public boolean isNoteOn() {
            return noteState == 1;
        }
        public void on(int vel) {
		   try {
			   if (isBlack) vel = vel*2;
			   setNoteState(1);
			   if (java) sendJavaMidi(144, new byte[]{(byte)kNum, (byte)vel}); 
			   else {
				   mo.sendMidi(new byte[]{(byte)144, (byte)kNum, (byte)vel}, de.humatic.mmj.MidiSystem.getHostTime());
				}
			}catch (Exception me) {}
        }
        public void off() {
			try {
			    setNoteState(0);
				if (java) sendJavaMidi(128, new byte[]{(byte)kNum, (byte)0});
				else mo.sendMidi(new byte[]{(byte)128, (byte)kNum, (byte)0}, de.humatic.mmj.MidiSystem.getHostTime());
				
		   }catch (Exception me) {}
        }
        public void setNoteState(int state) {
            noteState = state;
        }

        public void transpose(int oct) {
			kNum += oct*12;
		}
    }



    /**
	 * Piano renders black & white keys and plays the notes for a MIDI
     * channel.
     */
    class Piano extends JPanel implements MouseListener {

        Vector keys = new Vector();
		Vector whiteKeys = new Vector();
		Vector blackKeys = new Vector();
        Key prevKey;
        java.util.Vector permanents = new Vector();
        final int kw = 18, kh = 128;
		final Color jfcBlue = new Color(204, 204, 255);
		final Color pink = new Color(255, 175, 175);
		boolean record;

        public Piano() {
            setLayout(new BorderLayout());
            setPreferredSize(new Dimension(42*kw, kh+1));
            int transpose = 36;
            int whiteIDs[] = { 0, 2, 4, 5, 7, 9, 11 };

            for (int i = 0, x = 0; i < 6; i++) {
                for (int j = 0; j < 7; j++, x += kw) {
                    int keyNum = i * 12 + whiteIDs[j] + transpose;
                    whiteKeys.add(new Key(x, 0, kw, kh, keyNum, false));
                   /* if (j == 0) {
						Key C = (Key)whiteKeys.elementAt(whiteKeys.size()-1);
						this.getGraphics().setColor(Color.black);
						this.getGraphics().drawString(("c"+new Integer(i).toString()), x+2, 100);
					}*/
                }
            }
            for (int i = 0, x = 0; i < 6; i++, x += kw) {
                int keyNum = i * 12 + transpose;
                blackKeys.add(new Key((x += kw)-4, 0, kw/2, kh/2, keyNum+1, true));
                blackKeys.add(new Key((x += kw)-4, 0, kw/2, kh/2, keyNum+3, true));
                x += kw;
                blackKeys.add(new Key((x += kw)-4, 0, kw/2, kh/2, keyNum+6, true));
                blackKeys.add(new Key((x += kw)-4, 0, kw/2, kh/2, keyNum+8, true));
                blackKeys.add(new Key((x += kw)-4, 0, kw/2, kh/2, keyNum+10, true));
            }
            keys.addAll(blackKeys);
            keys.addAll(whiteKeys);

            addMouseMotionListener(new MouseMotionAdapter() {
                public void mouseMoved(MouseEvent e) {
                    if (mouseOverCB.isSelected()) {
                        Key key = getKey(e.getPoint());
                        if (prevKey != null && prevKey != key) {
                            prevKey.off();
                        }
                        if (key != null && prevKey != key) {
                            key.on(e.getY());
                        }
                        prevKey = key;
                        repaint();
                    }
                }
            });
            addMouseListener(this);
        }

        public void mousePressed(MouseEvent e) {
			if (!outputEnabled) return;
            prevKey = getKey(e.getPoint());

            for (int i = 0; i < permanents.size(); i++) {
				if (permanents.elementAt(i).equals(prevKey)) {
				prevKey.off();
                repaint();
                permanents.removeElementAt(i);
                break;
				}
			}
            if (prevKey != null) {
				prevKey.on(e.getY());
                repaint();
            }
        }
        public void mouseReleased(MouseEvent e) {
			if (!outputEnabled) return;
            if (e.getButton() == MouseEvent.BUTTON3) {
				permanents.add(prevKey);
				return;
			}
            if (prevKey != null) {
                prevKey.off();
                repaint();
                //prevKey = null;
            }
        }
        public void mouseExited(MouseEvent e) {
           /* if (prevKey != null) {
                prevKey.off();
                repaint();
                prevKey = null;
            }*/
        }
        public void mouseClicked(MouseEvent e) { }
        public void mouseEntered(MouseEvent e) { }


        public Key getKey(Point point) {
            for (int i = 0; i < keys.size(); i++) {
                if (((Key) keys.get(i)).contains(point)) {
                    return (Key) keys.get(i);
                }
            }
            return null;
        }

        public void paint(Graphics g) {
            Graphics2D g2 = (Graphics2D) g;
            Dimension d = getSize();

            g2.setBackground(getBackground());
            g2.clearRect(0, 0, d.width, d.height);

            g2.setColor(Color.white);
            g2.fillRect(0, 0, 42*kw, kh);

            for (int i = 0; i < whiteKeys.size(); i++) {
                Key key = (Key) whiteKeys.get(i);
                if (key.isNoteOn()) {
                    g2.setColor(record ? pink : jfcBlue);
                    g2.fill(key);
                }
                g2.setColor(Color.black);
                g2.draw(key);
            }
            for (int i = 0; i < blackKeys.size(); i++) {
                Key key = (Key) blackKeys.get(i);
                if (key.isNoteOn()) {
                    g2.setColor(record ? pink : jfcBlue);
                    g2.fill(key);
                    g2.setColor(Color.black);
                    g2.draw(key);
                } else {
                    g2.setColor(Color.black);
                    g2.fill(key);
                }
            }
        }
    } // End class Piano
	
	private class MidiInputListener implements MidiListener {
		
		private MidiInput myInput;
		
		private MidiInputListener(MidiInput in) {
			
			myInput = in;
			
			in.addMidiListener(this);
			
		}
		
		public void midiInput(byte[] data){
			
			System.out.println("Input from: "+myInput.getName());
			for (int i = 0; i < data.length; i++) {
				System.out.print(hexChars[(data[i] & 0xFF) / 16] );
				System.out.print(hexChars[(data[i] & 0xFF) % 16]+"  ");
				if (data.length > 5 && (i+1) % 16 == 0) System.out.println("");
			}
			System.out.println("");
		
		}

	}		
			
}
			

