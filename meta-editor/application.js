monohm.Config.set ("positron",
{
	"actions" :
	{
		"vs-send-parameter" : "VsSendParameterAction"
	},

	"triggers" :
	{
		"input" : "InputTrigger"
	},

	"template_lists" : 
	{
		"amp_envelope" :
		[
			{
				"name" : "Organ",
				"template" : "amp_organ"
			},
			{
				"name" : "Piano",
				"template" : "amp_piano"
			}
		],
		"filter_envelope" :
		[
			{
				"name" : "Organ",
				"template" : "filter_organ"
			},
			{
				"name" : "Piano",
				"template" : "filter_piano"
			}
		]
	},

	"templates" :
	{
		"amp_organ" :
		[
			{
				"name" : "AmpEnvLevel0",
				"value" : 0
			},
			{
				"name" : "AmpEnvRate1",
				"value" : 0
			},
			{
				"name" : "AmpEnvLevel1",
				"value" : 255
			},
			{
				"name" : "AmpEnvRate2",
				"value" : 0
			},
			{
				"name" : "AmpEnvLevel2",
				"value" : 255
			},
			{
				"name" : "AmpEnvRate3",
				"value" : 100
			},
			{
				"name" : "AmpEnvLevel3",
				"value" : 255
			},
			{
				"name" : "AmpEnvRate4",
				"value" : 50
			}
		],
		"amp_piano" :
		[
			{
				"name" : "AmpEnvLevel0",
				"value" : 0
			},
			{
				"name" : "AmpEnvRate1",
				"value" : 0
			},
			{
				"name" : "AmpEnvLevel1",
				"value" : 255
			},
			{
				"name" : "AmpEnvRate2",
				"value" : 0
			},
			{
				"name" : "AmpEnvLevel2",
				"value" : 255
			},
			{
				"name" : "AmpEnvRate3",
				"value" : 100
			},
			{
				"name" : "AmpEnvLevel3",
				"value" : 0
			},
			{
				"name" : "AmpEnvRate4",
				"value" : 50
			}
		],
		"filter_organ" :
		[
			{
				"name" : "FilterEnvLevel0",
				"value" : 0
			},
			{
				"name" : "FilterEnvRate1",
				"value" : 0
			},
			{
				"name" : "FilterEnvLevel1",
				"value" : 255
			},
			{
				"name" : "FilterEnvRate2",
				"value" : 0
			},
			{
				"name" : "FilterEnvLevel2",
				"value" : 255
			},
			{
				"name" : "FilterEnvRate3",
				"value" : 100
			},
			{
				"name" : "FilterEnvLevel3",
				"value" : 255
			},
			{
				"name" : "FilterEnvRate4",
				"value" : 50
			},
			{
				"name" : "FilterEnvLevel4",
				"value" : 0
			}
		],
		"filter_piano" :
		[
			{
				"name" : "FilterEnvLevel0",
				"value" : 0
			},
			{
				"name" : "FilterEnvRate1",
				"value" : 0
			},
			{
				"name" : "FilterEnvLevel1",
				"value" : 255
			},
			{
				"name" : "FilterEnvRate2",
				"value" : 0
			},
			{
				"name" : "FilterEnvLevel2",
				"value" : 255
			},
			{
				"name" : "FilterEnvRate3",
				"value" : 100
			},
			{
				"name" : "FilterEnvLevel3",
				"value" : 0
			},
			{
				"name" : "FilterEnvRate4",
				"value" : 50
			},
			{
				"name" : "FilterEnvLevel4",
				"value" : 0
			}
		]
	},
	
	"vs_parameter_map" :
	{
		"WaveNumberA" :
		{
			"min" : 0,
			"max" : 127,
			"range" : 128,
			"number" : 0,
			"offset" : 0,
			"size" : 7
		},
		"WaveNumberB" :
		{
			"min" : 0,
			"max" : 127,
			"range" : 128,
			"number" : 1,
			"offset" : 7,
			"size" : 7
		},
		"WaveNumberC" :
		{
			"min" : 0,
			"max" : 127,
			"range" : 128,
			"number" : 2,
			"offset" : 14,
			"size" : 7
		},
		"WaveNumberD" :
		{
			"min" : 0,
			"max" : 127,
			"range" : 128,
			"number" : 3,
			"offset" : 21,
			"size" : 7
		},
		"CoarseFrequencyA" :
		{
			"min" : 0,
			"max" : 24,
			"range" : 25,
			"number" : 4,
			"offset" : 28,
			"size" : 5
		},
		"CoarseFrequencyB" :
		{
			"min" : 0,
			"max" : 24,
			"range" : 25,
			"number" : 5,
			"offset" : 33,
			"size" : 5
		},
		"CoarseFrequencyC" :
		{
			"min" : 0,
			"max" : 24,
			"range" : 25,
			"number" : 6,
			"offset" : 38,
			"size" : 5
		},
		"CoarseFrequencyD" :
		{
			"min" : 0,
			"max" : 24,
			"range" : 25,
			"number" : 7,
			"offset" : 43,
			"size" : 5
		},
		"FineFrequencyA" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 8,
			"offset" : 48,
			"size" : 7
		},
		"FineFrequencyB" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 9,
			"offset" : 55,
			"size" : 7
		},
		"FineFrequencyC" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 10,
			"offset" : 62,
			"size" : 7
		},
		"FineFrequencyD" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 11,
			"offset" : 69,
			"size" : 7
		},
		
		
		"AmpEnvRate1" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 19,
			"offset" : 117,
			"size" : 7
		},
		"AmpEnvRate2" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 20,
			"offset" : 124,
			"size" : 7
		},
		"AmpEnvRate3" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 21,
			"offset" : 131,
			"size" : 7
		},
		"AmpEnvRate4" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 22,
			"offset" : 138,
			"size" : 7
		},
		"AmpEnvRate4A" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 23,
			"offset" : 145,
			"size" : 7
		},

		"AmpEnvLevel0" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 24,
			"offset" : 152,
			"size" : 7
		},
		"AmpEnvLevel1" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 25,
			"offset" : 159,
			"size" : 7
		},
		"AmpEnvLevel2" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 26,
			"offset" : 166,
			"size" : 7
		},
		"AmpEnvLevel3" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 27,
			"offset" : 173,
			"size" : 7
		},

		"FilterEnvRate1" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 30,
			"offset" : 186,
			"size" : 7
		},
		"FilterEnvRate2" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 31,
			"offset" : 193,
			"size" : 7
		},
		"FilterEnvRate3" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 32,
			"offset" : 200,
			"size" : 7
		},
		"FilterEnvRate4" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 33,
			"offset" : 207,
			"size" : 7
		},
		"FilterEnvRate4A" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 34,
			"offset" : 214,
			"size" : 7
		},

		"FilterEnvLevel0" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 35,
			"offset" : 221,
			"size" : 7
		},
		"FilterEnvLevel1" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 36,
			"offset" : 228,
			"size" : 7
		},
		"FilterEnvLevel2" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 37,
			"offset" : 235,
			"size" : 7
		},
		"FilterEnvLevel3" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 38,
			"offset" : 242,
			"size" : 7
		},
		"FilterEnvLevel4" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 39,
			"offset" : 249,
			"size" : 7
		},

		"LFO1Rate" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 17,
			"offset" : 103,
			"size" : 7
		},
		"KeyboardMixACMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 321,
			"offset" : 640,
			"size" : 1
		},
		"LFO1PanMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 265,
			"offset" : 598,
			"size" : 1
		},
		"KeyboardPanMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 323,
			"offset" : 638,
			"size" : 1
		},
		"LFO1LFO2AmountMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 264,
			"offset" : 599,
			"size" : 1
		},
		"PressureFreqCMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 290,
			"offset" : 630,
			"size" : 1
		},
		"LFO2FilterCutoffMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 276,
			"offset" : 613,
			"size" : 1
		},
		"LFO2MixBDMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 278,
			"offset" : 611,
			"size" : 1
		},
		"ArpScan" :
		{
			"min" : 0,
			"max" : 7,
			"range" : 8,
			"number" : 88,
			"offset" : 539,
			"size" : 3
		},
		"LFO1FreqAMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 256,
			"offset" : 607,
			"size" : 1
		},
		"MixEnvXLevel0" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 47,
			"offset" : 297,
			"size" : 7
		},
		"KeyboardFilterCutoffMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 320,
			"offset" : 641,
			"size" : 1
		},
		"FilterEnvRepeat" :
		{
			"min" : 0,
			"max" : 7,
			"range" : 8,
			"number" : 41,
			"offset" : 259,
			"size" : 3
		},
		"MixEnvXLevel2" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 49,
			"offset" : 311,
			"size" : 7
		},
		"ModWheelLFO2AmountMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 353,
			"offset" : 645,
			"size" : 1
		},
		"MixEnvXLevel1" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 48,
			"offset" : 304,
			"size" : 7
		},
		"MixEnvXLevel4" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 51,
			"offset" : 325,
			"size" : 7
		},
		"PressureFreqAMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 288,
			"offset" : 632,
			"size" : 1
		},
		"MixEnvXLevel3" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 50,
			"offset" : 318,
			"size" : 7
		},
		"ArpRate" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 86,
			"offset" : 530,
			"size" : 7
		},
		"PressureAmpEnvMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 299,
			"offset" : 621,
			"size" : 1
		},
		"AmpEnvLoop" :
		{
			"min" : 0,
			"max" : 6,
			"range" : 7,
			"number" : 28,
			"offset" : 180,
			"size" : 3
		},
		"LFO1FreqDMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 259,
			"offset" : 604,
			"size" : 1
		},
		"FilterResonance" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 13,
			"offset" : 83,
			"size" : 7
		},
		"ArpRest" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 95,
			"offset" : 551,
			"size" : 1
		},
		"ModWheelChorusDepthMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 354,
			"offset" : 644,
			"size" : 1
		},
		"LFO2FreqAMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 272,
			"offset" : 617,
			"size" : 1
		},
		"FilterEnvModAmount" :
		{
			"min" : -99,
			"max" : 99,
			"range" : 199,
			"number" : 101,
			"offset" : 590,
			"size" : 8
		},
		"VelocityPanMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 308,
			"offset" : 633,
			"size" : 1
		},
		"LFO2MixACMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 277,
			"offset" : 612,
			"size" : 1
		},
		"Voice4Pan" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 73,
			"offset" : 455,
			"size" : 7
		},
		"AmpEnvRepeat" :
		{
			"min" : 0,
			"max" : 7,
			"range" : 8,
			"number" : 29,
			"offset" : 183,
			"size" : 3
		},
		"LFO2FreqCMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 274,
			"offset" : 615,
			"size" : 1
		},
		"LinkProgram" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 61,
			"offset" : 382,
			"size" : 7
		},
		"LFO1Shape" :
		{
			"min" : 0,
			"max" : 4,
			"range" : 5,
			"number" : 15,
			"offset" : 97,
			"size" : 3
		},
		"VelocityFilterEnvMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 304,
			"offset" : 637,
			"size" : 1
		},
		"Voice3Pan" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 72,
			"offset" : 448,
			"size" : 7
		},
		"FilterEnvLoop" :
		{
			"min" : 0,
			"max" : 6,
			"range" : 7,
			"number" : 40,
			"offset" : 256,
			"size" : 3
		},
		"Voice7Pan" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 76,
			"offset" : 476,
			"size" : 7
		},
		"LFO2PanMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 281,
			"offset" : 608,
			"size" : 1
		},
		"PressureMixBDMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 294,
			"offset" : 626,
			"size" : 1
		},
		"FilterCutoff" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 12,
			"offset" : 76,
			"size" : 7
		},
		"MixEnvRate4A" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 46,
			"offset" : 290,
			"size" : 7
		},
		"LFO2LFO1RateMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 279,
			"offset" : 610,
			"size" : 1
		},
		"ArpVelocity" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 93,
			"offset" : 549,
			"size" : 1
		},
		"ArpVoicing" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 92,
			"offset" : 548,
			"size" : 1
		},
		"ModWheelLFO1AmountMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 352,
			"offset" : 646,
			"size" : 1
		},
		"ChorusDepth" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 68,
			"offset" : 420,
			"size" : 7
		},
		"LFO2ModAmount" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 97,
			"offset" : 559,
			"size" : 7
		},
		"MixEnvYLevel4" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 56,
			"offset" : 360,
			"size" : 7
		},
		"LFO2Shape" :
		{
			"min" : 0,
			"max" : 4,
			"range" : 5,
			"number" : 16,
			"offset" : 100,
			"size" : 3
		},
		"MixEnvYLevel1" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 53,
			"offset" : 339,
			"size" : 7
		},
		"MixEnvYLevel0" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 52,
			"offset" : 332,
			"size" : 7
		},
		"MixEnvYLevel3" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 55,
			"offset" : 353,
			"size" : 7
		},
		"Voice5Pan" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 74,
			"offset" : 462,
			"size" : 7
		},
		"MixEnvYLevel2" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 54,
			"offset" : 346,
			"size" : 7
		},
		"VelocityMixACMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 305,
			"offset" : 636,
			"size" : 1
		},
		"PressureFreqDMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 291,
			"offset" : 629,
			"size" : 1
		},
		"Name4" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 81,
			"offset" : 505,
			"size" : 5
		},
		"Name3" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 80,
			"offset" : 500,
			"size" : 5
		},
		"LFO2FreqBMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 273,
			"offset" : 616,
			"size" : 1
		},
		"Name6" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 83,
			"offset" : 515,
			"size" : 5
		},
		"Name5" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 82,
			"offset" : 510,
			"size" : 5
		},
		"VelocityMixBDMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 306,
			"offset" : 635,
			"size" : 1
		},
		"PressureLFO2RateMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 297,
			"offset" : 623,
			"size" : 1
		},
		"Name8" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 85,
			"offset" : 525,
			"size" : 5
		},
		"DoubleModeDetune" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 62,
			"offset" : 389,
			"size" : 5
		},
		"Name7" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 84,
			"offset" : 520,
			"size" : 5
		},
		"PressureFreqBMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 289,
			"offset" : 631,
			"size" : 1
		},
		"Name2" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 79,
			"offset" : 495,
			"size" : 5
		},
		"MixEnvRepeat" :
		{
			"min" : 0,
			"max" : 7,
			"range" : 8,
			"number" : 58,
			"offset" : 370,
			"size" : 3
		},
		"ChorusRate" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 67,
			"offset" : 413,
			"size" : 7
		},
		"Name1" :
		{
			"min" : 0,
			"max" : 31,
			"range" : 32,
			"number" : 78,
			"offset" : 490,
			"size" : 5
		},
		"PressureFilterCutoffMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 292,
			"offset" : 628,
			"size" : 1
		},
		"UnisonDetune" :
		{
			"min" : 0,
			"max" : 7,
			"range" : 8,
			"number" : 64,
			"offset" : 401,
			"size" : 3
		},
		"LFO1FilterCutoffMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 260,
			"offset" : 603,
			"size" : 1
		},
		"Voice2Pan" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 71,
			"offset" : 441,
			"size" : 7
		},
		"Voice8Pan" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 77,
			"offset" : 483,
			"size" : 7
		},
		"ArpLayer" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 94,
			"offset" : 550,
			"size" : 1
		},
		"SplitPoint" :
		{
			"min" : 0,
			"max" : 127,
			"range" : 128,
			"number" : 60,
			"offset" : 375,
			"size" : 7
		},
		"LFO1FreqBMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 257,
			"offset" : 606,
			"size" : 1
		},
		"MixEnvLoop" :
		{
			"min" : 0,
			"max" : 6,
			"range" : 7,
			"number" : 57,
			"offset" : 367,
			"size" : 3
		},
		"ProgramVolume" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 69,
			"offset" : 427,
			"size" : 7
		},
		"PressureLFO2AmountMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 298,
			"offset" : 622,
			"size" : 1
		},
		"VelocityAmpEnvMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 307,
			"offset" : 634,
			"size" : 1
		},
		"PressurePanMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 300,
			"offset" : 620,
			"size" : 1
		},
		"LFO2LFO1AmountMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 280,
			"offset" : 609,
			"size" : 1
		},
		"PressureMixACMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 293,
			"offset" : 627,
			"size" : 1
		},
		"VelocityModAmount" :
		{
			"min" : -99,
			"max" : 99,
			"range" : 199,
			"number" : 99,
			"offset" : 574,
			"size" : 8
		},
		"Glide" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 65,
			"offset" : 404,
			"size" : 7
		},
		"KeyboardMixBDMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 322,
			"offset" : 639,
			"size" : 1
		},
		"PressureLFO1RateMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 295,
			"offset" : 625,
			"size" : 1
		},
		"LFO2FreqDMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 275,
			"offset" : 614,
			"size" : 1
		},
		"LFO1MixBDMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 262,
			"offset" : 601,
			"size" : 1
		},
		"FilterEnvPanMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 337,
			"offset" : 642,
			"size" : 1
		},
		"PressureLFO1AmountMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 296,
			"offset" : 624,
			"size" : 1
		},
		"ArpOctaves" :
		{
			"min" : 0,
			"max" : 3,
			"range" : 4,
			"number" : 89,
			"offset" : 542,
			"size" : 2
		},
		"DoubleModeDelay" :
		{
			"min" : 0,
			"max" : 127,
			"range" : 128,
			"number" : 63,
			"offset" : 394,
			"size" : 7
		},
		"PressureChorusRateMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 301,
			"offset" : 619,
			"size" : 1
		},
		"LFO1MixACMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 261,
			"offset" : 602,
			"size" : 1
		},
		"PressureChorusDepthMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 302,
			"offset" : 618,
			"size" : 1
		},
		"MixEnvRate3" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 44,
			"offset" : 276,
			"size" : 7
		},
		"MixEnvRate4" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 45,
			"offset" : 283,
			"size" : 7
		},
		"MixEnvRate1" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 42,
			"offset" : 262,
			"size" : 7
		},
		"Voice1Pan" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 70,
			"offset" : 434,
			"size" : 7
		},
		"MixEnvRate2" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 43,
			"offset" : 269,
			"size" : 7
		},
		"ChorusRightLeft" :
		{
			"min" : 0,
			"max" : 3,
			"range" : 4,
			"number" : 66,
			"offset" : 411,
			"size" : 2
		},
		"FilterEnvAmount" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 14,
			"offset" : 90,
			"size" : 7
		},
		"ArpSplit" :
		{
			"min" : 0,
			"max" : 3,
			"range" : 4,
			"number" : 91,
			"offset" : 546,
			"size" : 2
		},
		"ArpMode" :
		{
			"min" : 0,
			"max" : 3,
			"range" : 4,
			"number" : 87,
			"offset" : 537,
			"size" : 2
		},
		"LFO2Rate" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 18,
			"offset" : 110,
			"size" : 7
		},
		"PressureModAmount" :
		{
			"min" : -99,
			"max" : 99,
			"range" : 199,
			"number" : 98,
			"offset" : 566,
			"size" : 8
		},
		"Voice6Pan" :
		{
			"min" : -63,
			"max" : 63,
			"range" : 127,
			"number" : 75,
			"offset" : 469,
			"size" : 7
		},
		"LFO1FreqCMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 258,
			"offset" : 605,
			"size" : 1
		},
		"ArpRepeats" :
		{
			"min" : 0,
			"max" : 3,
			"range" : 4,
			"number" : 90,
			"offset" : 544,
			"size" : 2
		},
		"LFO1ModAmount" :
		{
			"min" : 0,
			"max" : 99,
			"range" : 100,
			"number" : 96,
			"offset" : 552,
			"size" : 7
		},
		"FilterEnvFreqMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 336,
			"offset" : 643,
			"size" : 1
		},
		"KeyboardModAmount" :
		{
			"min" : -99,
			"max" : 99,
			"range" : 199,
			"number" : 100,
			"offset" : 582,
			"size" : 8
		},
		"LFO1LFO2RateMod" :
		{
			"min" : 0,
			"max" : 1,
			"range" : 2,
			"number" : 263,
			"offset" : 600,
			"size" : 1
		},
		"KeyboardMode" :
		{
			"min" : 0,
			"max" : 2,
			"range" : 3,
			"number" : 59,
			"offset" : 373,
			"size" : 2
		}
	},

	"vs_parameter_names":
	[
		"WaveNumberA",
		"WaveNumberB",
		"WaveNumberC",
		"WaveNumberD",
		"CoarseFrequencyA",
		"CoarseFrequencyB",
		"CoarseFrequencyC",
		"CoarseFrequencyD",
		"FineFrequencyA",
		"FineFrequencyB",
		"FineFrequencyC",
		"FineFrequencyD",
		"FilterCutoff",
		"FilterResonance",
		"FilterEnvAmount",
		"LFO1Shape",
		"LFO2Shape",
		"LFO1Rate",
		"LFO2Rate",
		"AmpEnvRate1",
		"AmpEnvRate2",
		"AmpEnvRate3",
		"AmpEnvRate4",
		"AmpEnvRate4A",
		"AmpEnvLevel0",
		"AmpEnvLevel1",
		"AmpEnvLevel2",
		"AmpEnvLevel3",
		"AmpEnvLoop",
		"AmpEnvRepeat",
		"FilterEnvRate1",
		"FilterEnvRate2",
		"FilterEnvRate3",
		"FilterEnvRate4",
		"FilterEnvRate4A",
		"FilterEnvLevel0",
		"FilterEnvLevel1",
		"FilterEnvLevel2",
		"FilterEnvLevel3",
		"FilterEnvLevel4",
		"FilterEnvLoop",
		"FilterEnvRepeat",
		"MixEnvRate1",
		"MixEnvRate2",
		"MixEnvRate3",
		"MixEnvRate4",
		"MixEnvRate4A",
		"MixEnvXLevel0",
		"MixEnvXLevel1",
		"MixEnvXLevel2",
		"MixEnvXLevel3",
		"MixEnvXLevel4",
		"MixEnvYLevel0",
		"MixEnvYLevel1",
		"MixEnvYLevel2",
		"MixEnvYLevel3",
		"MixEnvYLevel4",
		"MixEnvLoop",
		"MixEnvRepeat",
		"KeyboardMode",
		"SplitPoint",
		"LinkProgram",
		"DoubleModeDetune",
		"DoubleModeDelay",
		"UnisonDetune",
		"Glide",
		"ChorusRightLeft",
		"ChorusRate",
		"ChorusDepth",
		"ProgramVolume",
		"Voice1Pan",
		"Voice2Pan",
		"Voice3Pan",
		"Voice4Pan",
		"Voice5Pan",
		"Voice6Pan",
		"Voice7Pan",
		"Voice8Pan",
		"Name1",
		"Name2",
		"Name3",
		"Name4",
		"Name5",
		"Name6",
		"Name7",
		"Name8",
		"ArpRate",
		"ArpMode",
		"ArpScan",
		"ArpOctaves",
		"ArpRepeats",
		"ArpSplit",
		"ArpVoicing",
		"ArpVelocity",
		"ArpLayer",
		"ArpRest",
		"LFO1ModAmount",
		"LFO2ModAmount",
		"PressureModAmount",
		"VelocityModAmount",
		"KeyboardModAmount",
		"FilterEnvModAmount",
		"LFO1FreqAMod",
		"LFO1FreqBMod",
		"LFO1FreqCMod",
		"LFO1FreqDMod",
		"LFO1FilterCutoffMod",
		"LFO1MixACMod",
		"LFO1MixBDMod",
		"LFO1LFO2RateMod",
		"LFO1LFO2AmountMod",
		"LFO1PanMod",
		"LFO2FreqAMod",
		"LFO2FreqBMod",
		"LFO2FreqCMod",
		"LFO2FreqDMod",
		"LFO2FilterCutoffMod",
		"LFO2MixACMod",
		"LFO2MixBDMod",
		"LFO2LFO1RateMod",
		"LFO2LFO1AmountMod",
		"LFO2PanMod",
		"PressureFreqAMod",
		"PressureFreqBMod",
		"PressureFreqCMod",
		"PressureFreqDMod",
		"PressureFilterCutoffMod",
		"PressureMixACMod",
		"PressureMixBDMod",
		"PressureLFO1RateMod",
		"PressureLFO1AmountMod",
		"PressureLFO2RateMod",
		"PressureLFO2AmountMod",
		"PressureAmpEnvMod",
		"PressurePanMod",
		"PressureChorusRateMod",
		"PressureChorusDepthMod",
		"VelocityFilterEnvMod",
		"VelocityMixACMod",
		"VelocityMixBDMod",
		"VelocityAmpEnvMod",
		"VelocityPanMod",
		"KeyboardFilterCutoffMod",
		"KeyboardMixACMod",
		"KeyboardMixBDMod",
		"KeyboardPanMod",
		"FilterEnvFreqMod",
		"FilterEnvPanMod",
		"ModWheelLFO1AmountMod",
		"ModWheelLFO2AmountMod",
		"ModWheelChorusDepthMod"
	],
	
	"vs_wave_names" :
	[
		"0 User 1",
		"1 User 2",
		"2 User 3",
		"3 User 4",
		"4 User 5",
		"5 User 6",
		"6 User 7",
		"7 User 8",
		"8 User 9",
		"9 User 10",
		"10 User 11",
		"11 User 12",
		"12 User 13",
		"13 User 14",
		"14 User 15",
		"15 User 16",
		"16 User 17",
		"17 User 18",
		"18 User 19",
		"19 User 20",
		"20 User 21",
		"21 User 22",
		"22 User 23",
		"23 User 24",
		"24 User 25",
		"25 User 26",
		"26 User 27",
		"27 User 28",
		"28 User 29",
		"29 User 30",
		"30 User 31",
		"31 User 32",
		"32 Sine",
		"33 Saw",
		"34 Square",
		"35 Bell 1",
		"36 Bell 2",
		"37 Mellow Bell 1",
		"38 Bell 3",
		"39 Bell 4",
		"40 Reed 1",
		"41 Reed 2",
		"42 Reed 3",
		"43 Reed 4",
		"44 Bell 5",
		"45 HP Saw",
		"46 Hi BP Saw",
		"47 Hi BP Square",
		"48 Voice",
		"49 Accordion",
		"50 Mellow Bell 2",
		"51 Lifeless Saw",
		"52 Bright Wave 1",
		"53 Bright Wave 2",
		"54 Bright Wave 3",
		"55 Medium Wave 1",
		"56 Inharmonic Bell 1",
		"57 Medium Wave 2",
		"58 Bell 6",
		"59 Mellow Bell 3",
		"60 Bell 7",
		"61 Bright Wave 4",
		"62 Bright Wave 5",
		"63 Mellow Bell 4",
		"64 Bell 8",
		"65 Church Organ",
		"66 Bright Wave 6",
		"67 Mellow Wave 1",
		"68 Mellow Wave 2",
		"69 Bright Wave 7",
		"70 Clarinet",
		"71 Mellow Wave 3",
		"72 Mellow Wave 4",
		"73 Sax",
		"74 Mellow Wave 5",
		"75 Cheesy Wave 1",
		"76 Cheesy Wave 2",
		"77 Cheesy Wave 3",
		"78 Cheesy Wave 4",
		"79 Cheesy Wave 5",
		"80 Cheesy Wave 6",
		"81 Harmonica 1",
		"82 Harmonica 2",
		"83 Mellow Wave 5",
		"84 Nasal 1",
		"85 Nasal 2",
		"86 Bright Wave 8",
		"87 Bright wave 9",
		"88 Bright Wave 10",
		"89 Mellow Bell 5",
		"90 Mellow Bell 6",
		"91 Inharmonic Bell 2",
		"92 Nasal 3",
		"93 Bright Wave 11",
		"94 Mellow Bell 7",
		"95 Mellow Wave 6",
		"96 Super Mellow 1",
		"97 Mellow Wave 7",
		"98 Cheesy Wave 7",
		"99 Sparkle Pad",
		"100 Bell 9",
		"101 Nasal 4",
		"102 Nasal 5",
		"103 Cheesy Wave 8",
		"104 Cheesy Wave 9",
		"105 Cheesy Wave 10",
		"106 Cheesy Wave 11",
		"107 Cheesy Wave 12",
		"108 Cheesy Wave 13",
		"109 Bright Wave 12",
		"110 Bright Wave 13",
		"111 Cheesy Wave 13",
		"112 Cheesy Wave 14",
		"113 Spectrum",
		"114 Mellow Bell 8",
		"115 Cheesy Wave 15",
		"116 Super Mellow 2",
		"117 Super Mellow 3",
		"118 Planetarium",
		"119 5th reed",
		"120 Octave Wave",
		"121 5th Tri + Harm",
		"122 5th Pulse + Harm",
		"123 5th Square + Harm",
		"124 Mellow Wave 8",
		"125 Inharmonic Bell 3",
		"126 Silence",
		"127 White Noise"
	]
	
});

