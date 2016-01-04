// JSON Generator for VectorWeb

// VS

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.File;
import java.io.OutputStream;
import java.io.OutputStreamWriter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;

// CLASS

public class Patch
{
	public static void
	main (String[] inArgs)
	throws Exception
	{
		Patch	patch = new Patch ();
		patch.setupParameters ();
		
		JSONWriter.writePretty (patch.parameterMap, new File ("parameter-map.json"));
		JSONWriter.writePretty (patch.parameterNameList, new File ("parameter-names.json"));
		JSONWriter.writePretty (patch.parameterSpecList, new File ("parameter-specs.json"));
		JSONWriter.writePretty (patch.waveNameList, new File ("wave-names.json"));
	}
	
	// PRIVATE STATIC METHODS

	// the range of the parameter can be different from the range the bit size
	// might suggest, and this affects the value scaling when we transmit it
	// over MIDI - hence the extra constructor param
	private Map<String, Object>
	makeParameterSpec (int inParameterNumber, int inOffset, int inSize, int inRange)
	{
		Map<String, Object>	parameterSpec = new HashMap<String, Object> ();
		parameterSpec.put ("number", inParameterNumber);
		parameterSpec.put ("offset", inOffset);
		parameterSpec.put ("size", inSize);
		parameterSpec.put ("range", inRange);
		
		// HACK calculate max/min
		parameterSpec.put ("min", 0);
		
		// HACK shift sign bits into place on bipolar values
		if (inSize == 8 && inRange == 199)
		{
			parameterSpec.put ("max", 99);
			parameterSpec.put ("min", -99);
		}
		else
		if (inSize == 7 && inRange == 127)
		{
			parameterSpec.put ("max", 63);
			parameterSpec.put ("min", -63);
		}
		else
		{
			parameterSpec.put ("max", inRange - 1);
		}
		
		return parameterSpec;
	}

	// this is for when the range *does* match the bit size
	private Map<String, Object>
	makeParameterSpec (int inParameterNumber, int inOffset, int inSize)
	{
		return makeParameterSpec (inParameterNumber, inOffset, inSize, 1 << inSize);
	}

	private void
	setupParameters ()
	{
		this.parameterMap = new HashMap<String, Map<String, Object>> ();
		this.parameterNumberMap = new HashMap<Integer, String> ();
		this.parameterNameList = new ArrayList<String> ();
		this.parameterSpecList = new ArrayList<Map<String, Object>> ();

		// HACK
		// the index into the parameter array
		// MUST be the VS parameter number
		
		addParameter ("WaveNumberA", makeParameterSpec (0x00, 0, 7, 128));
		addParameter ("WaveNumberB", makeParameterSpec (0x01, 7, 7, 128));
		addParameter ("WaveNumberC", makeParameterSpec (0x02, 14, 7, 128));
		addParameter ("WaveNumberD", makeParameterSpec (0x03, 21, 7, 128));
		addParameter ("CoarseFrequencyA", makeParameterSpec (0x04, 28, 5, 25));
		addParameter ("CoarseFrequencyB", makeParameterSpec (0x05, 33, 5, 25));
		addParameter ("CoarseFrequencyC", makeParameterSpec (0x06, 38, 5, 25));
		addParameter ("CoarseFrequencyD", makeParameterSpec (0x07, 43, 5, 25));
		addParameter ("FineFrequencyA", makeParameterSpec (0x08, 48, 7, 100));
		addParameter ("FineFrequencyB", makeParameterSpec (0x09, 55, 7, 100));
		addParameter ("FineFrequencyC", makeParameterSpec (0x0a, 62, 7, 100));
		addParameter ("FineFrequencyD", makeParameterSpec (0x0b, 69, 7, 100));

		addParameter ("FilterCutoff", makeParameterSpec (0x0c, 76, 7, 100));
		addParameter ("FilterResonance", makeParameterSpec (0x0d, 83, 7, 100));
		addParameter ("FilterEnvAmount", makeParameterSpec (0x0e, 90, 7, 100));

		addParameter ("LFO1Shape", makeParameterSpec (0x0f, 97, 3, 5));
		addParameter ("LFO2Shape", makeParameterSpec (0x10, 100, 3, 5));
		addParameter ("LFO1Rate", makeParameterSpec (0x11, 103, 7, 100));
		addParameter ("LFO2Rate", makeParameterSpec (0x12, 110, 7, 100));

		addParameter ("AmpEnvRate1", makeParameterSpec (0x13, 117, 7, 100));
		addParameter ("AmpEnvRate2", makeParameterSpec (0x14, 124, 7, 100));
		addParameter ("AmpEnvRate3", makeParameterSpec (0x15, 131, 7, 100));
		addParameter ("AmpEnvRate4", makeParameterSpec (0x16, 138, 7, 100));
		addParameter ("AmpEnvRate4A", makeParameterSpec (0x17, 145, 7, 100));
		addParameter ("AmpEnvLevel0", makeParameterSpec (0x18, 152, 7, 100));
		addParameter ("AmpEnvLevel1", makeParameterSpec (0x19, 159, 7, 100));
		addParameter ("AmpEnvLevel2", makeParameterSpec (0x1a, 166, 7, 100));
		addParameter ("AmpEnvLevel3", makeParameterSpec (0x1b, 173, 7, 100));
		addParameter ("AmpEnvLoop", makeParameterSpec (0x1c, 180, 3, 7));
		addParameter ("AmpEnvRepeat", makeParameterSpec (0x1d, 183, 3));

		addParameter ("FilterEnvRate1", makeParameterSpec (0x1e, 186, 7, 100));
		addParameter ("FilterEnvRate2", makeParameterSpec (0x1f, 193, 7, 100));
		addParameter ("FilterEnvRate3", makeParameterSpec (0x20, 200, 7, 100));
		addParameter ("FilterEnvRate4", makeParameterSpec (0x21, 207, 7, 100));
		addParameter ("FilterEnvRate4A", makeParameterSpec (0x22, 214, 7, 100));
		addParameter ("FilterEnvLevel0", makeParameterSpec (0x23, 221, 7, 100));
		addParameter ("FilterEnvLevel1", makeParameterSpec (0x24, 228, 7, 100));
		addParameter ("FilterEnvLevel2", makeParameterSpec (0x25, 235, 7, 100));
		addParameter ("FilterEnvLevel3", makeParameterSpec (0x26, 242, 7, 100));
		addParameter ("FilterEnvLevel4", makeParameterSpec (0x27, 249, 7, 100));
		addParameter ("FilterEnvLoop", makeParameterSpec (0x28, 256, 3, 7));
		addParameter ("FilterEnvRepeat", makeParameterSpec (0x29, 259, 3));

		addParameter ("MixEnvRate1", makeParameterSpec (0x2a, 262, 7, 100));
		addParameter ("MixEnvRate2", makeParameterSpec (0x2b, 269, 7, 100));
		addParameter ("MixEnvRate3", makeParameterSpec (0x2c, 276, 7, 100));
		addParameter ("MixEnvRate4", makeParameterSpec (0x2d, 283, 7, 100));
		addParameter ("MixEnvRate4A", makeParameterSpec (0x2e, 290, 7, 100));
		addParameter ("MixEnvXLevel0", makeParameterSpec (0x2f, 297, 7, 127));
		addParameter ("MixEnvXLevel1", makeParameterSpec (0x30, 304, 7, 127));
		addParameter ("MixEnvXLevel2", makeParameterSpec (0x31, 311, 7, 127));
		addParameter ("MixEnvXLevel3", makeParameterSpec (0x32, 318, 7, 127));
		addParameter ("MixEnvXLevel4", makeParameterSpec (0x33, 325, 7, 127));
		addParameter ("MixEnvYLevel0", makeParameterSpec (0x34, 332, 7, 127));
		addParameter ("MixEnvYLevel1", makeParameterSpec (0x35, 339, 7, 127));
		addParameter ("MixEnvYLevel2", makeParameterSpec (0x36, 346, 7, 127));
		addParameter ("MixEnvYLevel3", makeParameterSpec (0x37, 353, 7, 127));
		addParameter ("MixEnvYLevel4", makeParameterSpec (0x38, 360, 7, 127));
		addParameter ("MixEnvLoop", makeParameterSpec (0x39, 367, 3, 7));
		addParameter ("MixEnvRepeat", makeParameterSpec (0x3a, 370, 3));

		addParameter ("KeyboardMode", makeParameterSpec (0x3b, 373, 2, 3));
		addParameter ("SplitPoint", makeParameterSpec (0x3c, 375, 7, 128));
		addParameter ("LinkProgram", makeParameterSpec (0x3d, 382, 7, 100));
		addParameter ("DoubleModeDetune", makeParameterSpec (0x3e, 389, 5));
		addParameter ("DoubleModeDelay", makeParameterSpec (0x3f, 394, 7, 128));
		addParameter ("UnisonDetune", makeParameterSpec (0x40, 401, 3));
		addParameter ("Glide", makeParameterSpec (0x41, 404, 7, 100));
		addParameter ("ChorusRightLeft", makeParameterSpec (0x42, 411, 2));
		addParameter ("ChorusRate", makeParameterSpec (0x43, 413, 7, 100));
		addParameter ("ChorusDepth", makeParameterSpec (0x44, 420, 7, 100));
		addParameter ("ProgramVolume", makeParameterSpec (0x45, 427, 7, 100));

		addParameter ("Voice1Pan", makeParameterSpec (0x46, 434, 7, 127));
		addParameter ("Voice2Pan", makeParameterSpec (0x47, 441, 7, 127));
		addParameter ("Voice3Pan", makeParameterSpec (0x48, 448, 7, 127));
		addParameter ("Voice4Pan", makeParameterSpec (0x49, 455, 7, 127));
		addParameter ("Voice5Pan", makeParameterSpec (0x4a, 462, 7, 127));
		addParameter ("Voice6Pan", makeParameterSpec (0x4b, 469, 7, 127));
		addParameter ("Voice7Pan", makeParameterSpec (0x4c, 476, 7, 127));
		addParameter ("Voice8Pan", makeParameterSpec (0x4d, 483, 7, 127));

		addParameter ("Name1", makeParameterSpec (0x4e, 490, 5));
		addParameter ("Name2", makeParameterSpec (0x4f, 495, 5));
		addParameter ("Name3", makeParameterSpec (0x50, 500, 5));
		addParameter ("Name4", makeParameterSpec (0x51, 505, 5));
		addParameter ("Name5", makeParameterSpec (0x52, 510, 5));
		addParameter ("Name6", makeParameterSpec (0x53, 515, 5));
		addParameter ("Name7", makeParameterSpec (0x54, 520, 5));
		addParameter ("Name8", makeParameterSpec (0x55, 525, 5));

		addParameter ("ArpRate", makeParameterSpec (0x56, 530, 7, 100));
		addParameter ("ArpMode", makeParameterSpec (0x57, 537, 2));
		addParameter ("ArpScan", makeParameterSpec (0x58, 539, 3));
		addParameter ("ArpOctaves", makeParameterSpec (0x59, 542, 2));
		addParameter ("ArpRepeats", makeParameterSpec (0x5a, 544, 2));
		addParameter ("ArpSplit", makeParameterSpec (0x5b, 546, 2));
		addParameter ("ArpVoicing", makeParameterSpec (0x5c, 548, 1));
		addParameter ("ArpVelocity", makeParameterSpec (0x5d, 549, 1));
		addParameter ("ArpLayer", makeParameterSpec (0x5e, 550, 1));
		addParameter ("ArpRest", makeParameterSpec (0x5f, 551, 1));
		
		addParameter ("LFO1ModAmount", makeParameterSpec (0x60, 552, 7, 100));
		addParameter ("LFO2ModAmount", makeParameterSpec (0x61, 559, 7, 100));
		addParameter ("PressureModAmount", makeParameterSpec (0x62, 566, 8, 199));
		addParameter ("VelocityModAmount", makeParameterSpec (0x63, 574, 8, 199));
		addParameter ("KeyboardModAmount", makeParameterSpec (0x64, 582, 8, 199));
		addParameter ("FilterEnvModAmount", makeParameterSpec (0x65, 590, 8, 199));

		addParameter ("LFO1FreqAMod", makeParameterSpec (0x0100, 607, 1));
		addParameter ("LFO1FreqBMod", makeParameterSpec (0x0101, 606, 1));
		addParameter ("LFO1FreqCMod", makeParameterSpec (0x0102, 605, 1));
		addParameter ("LFO1FreqDMod", makeParameterSpec (0x0103, 604, 1));
		addParameter ("LFO1FilterCutoffMod", makeParameterSpec (0x0104, 603, 1));
		addParameter ("LFO1MixACMod", makeParameterSpec (0x0105, 602, 1));
		addParameter ("LFO1MixBDMod", makeParameterSpec (0x0106, 601, 1));
		addParameter ("LFO1LFO2RateMod", makeParameterSpec (0x0107, 600, 1));
		addParameter ("LFO1LFO2AmountMod", makeParameterSpec (0x0108, 599, 1));
		addParameter ("LFO1PanMod", makeParameterSpec (0x0109, 598, 1));

		addParameter ("LFO2FreqAMod", makeParameterSpec (0x0110, 617, 1));
		addParameter ("LFO2FreqBMod", makeParameterSpec (0x0111, 616, 1));
		addParameter ("LFO2FreqCMod", makeParameterSpec (0x0112, 615, 1));
		addParameter ("LFO2FreqDMod", makeParameterSpec (0x0113, 614, 1));
		addParameter ("LFO2FilterCutoffMod", makeParameterSpec (0x0114, 613, 1));
		addParameter ("LFO2MixACMod", makeParameterSpec (0x0115, 612, 1));
		addParameter ("LFO2MixBDMod", makeParameterSpec (0x0116, 611, 1));
		addParameter ("LFO2LFO1RateMod", makeParameterSpec (0x0117, 610, 1));
		addParameter ("LFO2LFO1AmountMod", makeParameterSpec (0x0118, 609, 1));
		addParameter ("LFO2PanMod", makeParameterSpec (0x0119, 608, 1));

		addParameter ("PressureFreqAMod", makeParameterSpec (0x0120, 632, 1));
		addParameter ("PressureFreqBMod", makeParameterSpec (0x0121, 631, 1));
		addParameter ("PressureFreqCMod", makeParameterSpec (0x0122, 630, 1));
		addParameter ("PressureFreqDMod", makeParameterSpec (0x0123, 629, 1));
		addParameter ("PressureFilterCutoffMod", makeParameterSpec (0x0124, 628, 1));
		addParameter ("PressureMixACMod", makeParameterSpec (0x0125, 627, 1));
		addParameter ("PressureMixBDMod", makeParameterSpec (0x0126, 626, 1));
		addParameter ("PressureLFO1RateMod", makeParameterSpec (0x0127, 625, 1));
		addParameter ("PressureLFO1AmountMod", makeParameterSpec (0x0128, 624, 1));
		addParameter ("PressureLFO2RateMod", makeParameterSpec (0x0129, 623, 1));
		addParameter ("PressureLFO2AmountMod", makeParameterSpec (0x012a, 622, 1));
		addParameter ("PressureAmpEnvMod", makeParameterSpec (0x012b, 621, 1));
		addParameter ("PressurePanMod", makeParameterSpec (0x012c, 620, 1));
		addParameter ("PressureChorusRateMod", makeParameterSpec (0x012d, 619, 1));
		addParameter ("PressureChorusDepthMod", makeParameterSpec (0x012e, 618, 1));
		
		addParameter ("VelocityFilterEnvMod", makeParameterSpec (0x0130, 637, 1));
		addParameter ("VelocityMixACMod", makeParameterSpec (0x0131, 636, 1));
		addParameter ("VelocityMixBDMod", makeParameterSpec (0x0132, 635, 1));
		addParameter ("VelocityAmpEnvMod", makeParameterSpec (0x0133, 634, 1));
		addParameter ("VelocityPanMod", makeParameterSpec (0x0134, 633, 1));

		addParameter ("KeyboardFilterCutoffMod", makeParameterSpec (0x0140, 641, 1));
		addParameter ("KeyboardMixACMod", makeParameterSpec (0x0141, 640, 1));
		addParameter ("KeyboardMixBDMod", makeParameterSpec (0x0142, 639, 1));
		addParameter ("KeyboardPanMod", makeParameterSpec (0x0143, 638, 1));
		
		addParameter ("FilterEnvFreqMod", makeParameterSpec (0x0150, 643, 1));
		addParameter ("FilterEnvPanMod", makeParameterSpec (0x0151, 642, 1));
		
		addParameter ("ModWheelLFO1AmountMod", makeParameterSpec (0x0160, 646, 1));
		addParameter ("ModWheelLFO2AmountMod", makeParameterSpec (0x0161, 645, 1));
		addParameter ("ModWheelChorusDepthMod", makeParameterSpec (0x0162, 644, 1));

		// now set up the wave name list
		this.waveNameList = new ArrayList<String> ();
		
		this.waveNameList.add ("0 User 1");
		this.waveNameList.add ("1 User 2");
		this.waveNameList.add ("2 User 3");
		this.waveNameList.add ("3 User 4");
		this.waveNameList.add ("4 User 5");
		this.waveNameList.add ("5 User 6");
		this.waveNameList.add ("6 User 7");
		this.waveNameList.add ("7 User 8");
		this.waveNameList.add ("8 User 9");
		this.waveNameList.add ("9 User 10");
		this.waveNameList.add ("10 User 11");
		this.waveNameList.add ("11 User 12");
		this.waveNameList.add ("12 User 13");
		this.waveNameList.add ("13 User 14");
		this.waveNameList.add ("14 User 15");
		this.waveNameList.add ("15 User 16");
		this.waveNameList.add ("16 User 17");
		this.waveNameList.add ("17 User 18");
		this.waveNameList.add ("18 User 19");
		this.waveNameList.add ("19 User 20");
		this.waveNameList.add ("20 User 21");
		this.waveNameList.add ("21 User 22");
		this.waveNameList.add ("22 User 23");
		this.waveNameList.add ("23 User 24");
		this.waveNameList.add ("24 User 25");
		this.waveNameList.add ("25 User 26");
		this.waveNameList.add ("26 User 27");
		this.waveNameList.add ("27 User 28");
		this.waveNameList.add ("28 User 29");
		this.waveNameList.add ("29 User 30");
		this.waveNameList.add ("30 User 31");
		this.waveNameList.add ("31 User 32");
		this.waveNameList.add ("32 Sine");
		this.waveNameList.add ("33 Saw");
		this.waveNameList.add ("34 Square");
		this.waveNameList.add ("35 Bell 1");
		this.waveNameList.add ("36 Bell 2");
		this.waveNameList.add ("37 Mellow Bell 1");
		this.waveNameList.add ("38 Bell 3");
		this.waveNameList.add ("39 Bell 4");
		this.waveNameList.add ("40 Reed 1");
		this.waveNameList.add ("41 Reed 2");
		this.waveNameList.add ("42 Reed 3");
		this.waveNameList.add ("43 Reed 4");
		this.waveNameList.add ("44 Bell 5");
		this.waveNameList.add ("45 HP Saw");
		this.waveNameList.add ("46 Hi BP Saw");
		this.waveNameList.add ("47 Hi BP Square");
		this.waveNameList.add ("48 Voice");
		this.waveNameList.add ("49 Accordion");
		this.waveNameList.add ("50 Mellow Bell 2");
		this.waveNameList.add ("51 Lifeless Saw");
		this.waveNameList.add ("52 Bright Wave 1");
		this.waveNameList.add ("53 Bright Wave 2");
		this.waveNameList.add ("54 Bright Wave 3");
		this.waveNameList.add ("55 Medium Wave 1");
		this.waveNameList.add ("56 Inharmonic Bell 1");
		this.waveNameList.add ("57 Medium Wave 2");
		this.waveNameList.add ("58 Bell 6");
		this.waveNameList.add ("59 Mellow Bell 3");
		this.waveNameList.add ("60 Bell 7");
		this.waveNameList.add ("61 Bright Wave 4");
		this.waveNameList.add ("62 Bright Wave 5");
		this.waveNameList.add ("63 Mellow Bell 4");
		this.waveNameList.add ("64 Bell 8");
		this.waveNameList.add ("65 Church Organ");
		this.waveNameList.add ("66 Bright Wave 6");
		this.waveNameList.add ("67 Mellow Wave 1");
		this.waveNameList.add ("68 Mellow Wave 2");
		this.waveNameList.add ("69 Bright Wave 7");
		this.waveNameList.add ("70 Clarinet");
		this.waveNameList.add ("71 Mellow Wave 3");
		this.waveNameList.add ("72 Mellow Wave 4");
		this.waveNameList.add ("73 Sax");
		this.waveNameList.add ("74 Mellow Wave 5");
		this.waveNameList.add ("75 Cheesy Wave 1");
		this.waveNameList.add ("76 Cheesy Wave 2");
		this.waveNameList.add ("77 Cheesy Wave 3");
		this.waveNameList.add ("78 Cheesy Wave 4");
		this.waveNameList.add ("79 Cheesy Wave 5");
		this.waveNameList.add ("80 Cheesy Wave 6");
		this.waveNameList.add ("81 Harmonica 1");
		this.waveNameList.add ("82 Harmonica 2");
		this.waveNameList.add ("83 Mellow Wave 5");
		this.waveNameList.add ("84 Nasal 1");
		this.waveNameList.add ("85 Nasal 2");
		this.waveNameList.add ("86 Bright Wave 8");
		this.waveNameList.add ("87 Bright wave 9");
		this.waveNameList.add ("88 Bright Wave 10");
		this.waveNameList.add ("89 Mellow Bell 5");
		this.waveNameList.add ("90 Mellow Bell 6");
		this.waveNameList.add ("91 Inharmonic Bell 2");
		this.waveNameList.add ("92 Nasal 3");
		this.waveNameList.add ("93 Bright Wave 11");
		this.waveNameList.add ("94 Mellow Bell 7");
		this.waveNameList.add ("95 Mellow Wave 6");
		this.waveNameList.add ("96 Super Mellow 1");
		this.waveNameList.add ("97 Mellow Wave 7");
		this.waveNameList.add ("98 Cheesy Wave 7");
		this.waveNameList.add ("99 Sparkle Pad");
		this.waveNameList.add ("100 Bell 9");
		this.waveNameList.add ("101 Nasal 4");
		this.waveNameList.add ("102 Nasal 5");
		this.waveNameList.add ("103 Cheesy Wave 8");
		this.waveNameList.add ("104 Cheesy Wave 9");
		this.waveNameList.add ("105 Cheesy Wave 10");
		this.waveNameList.add ("106 Cheesy Wave 11");
		this.waveNameList.add ("107 Cheesy Wave 12");
		this.waveNameList.add ("108 Cheesy Wave 13");
		this.waveNameList.add ("109 Bright Wave 12");
		this.waveNameList.add ("110 Bright Wave 13");
		this.waveNameList.add ("111 Cheesy Wave 13");
		this.waveNameList.add ("112 Cheesy Wave 14");
		this.waveNameList.add ("113 Spectrum");
		this.waveNameList.add ("114 Mellow Bell 8");
		this.waveNameList.add ("115 Cheesy Wave 15");
		this.waveNameList.add ("116 Super Mellow 2");
		this.waveNameList.add ("117 Super Mellow 3");
		this.waveNameList.add ("118 Planetarium");
		this.waveNameList.add ("119 5th reed");
		this.waveNameList.add ("120 Octave Wave");
		this.waveNameList.add ("121 5th Tri + Harm");
		this.waveNameList.add ("122 5th Pulse + Harm");
		this.waveNameList.add ("123 5th Square + Harm");
		this.waveNameList.add ("124 Mellow Wave 8");
		this.waveNameList.add ("125 Inharmonic Bell 3");
		this.waveNameList.add ("126 Silence");
		this.waveNameList.add ("127 White Noise");
		this.waveNameList.add ("");
	}

	private void
	addParameter (String inParamName, Map<String, Object> inParamSpec)
	{
		this.parameterNameList.add (inParamName);
		this.parameterSpecList.add (inParamSpec);

		this.parameterMap.put (inParamName, inParamSpec);
		
		this.parameterNumberMap.put
			((Integer) (inParamSpec.get ("number")), inParamName);
	}


	// PRIVATE STATIC DATA

	private Map<String, Map<String, Object>>
	parameterMap = null;

	private List<String>
	parameterNameList = null;

	private Map<Integer, String>
	parameterNumberMap = null;

	private List<Map<String, Object>>
	parameterSpecList = null;

	private List<String>
	waveNameList = null;

}

