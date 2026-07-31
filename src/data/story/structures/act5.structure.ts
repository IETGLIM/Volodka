import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT5_STRUCTURE: Record<string, StoryNodeStructure> = {
  "act5_peaceful_path": {
    "id": "act5_peaceful_path",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/cafe_evening_jazz.ogg",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "ending_creator",
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "creator_path",
            "flagValue": true
          }
        ],
        "condition": {
          "minKarma": 60,
          "minSkill": {
            "writing": 7
          }
        }
      },
      {
        "text": "",
        "next": "ending_reconciliation",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "alexander_allied",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "ending_reconciliation",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "old_code",
        "condition": {
          "flag": "barista_poems_received"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 1
          }
        ]
      }
    ]
  },
  "act5_revolution_path": {
    "id": "act5_revolution_path",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "musicCue": "tension",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "ending_rebel",
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "free_city",
            "flagValue": true
          }
        ],
        "condition": {
          "minKarma": 60,
          "minSkill": {
            "persuasion": 7
          }
        }
      },
      {
        "text": "",
        "next": "ending_machine",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "new_system",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "coding": 8
          },
          "flag": "low_empathy"
        }
      },
      {
        "text": "",
        "next": "ending_rebel",
        "effects": [
          {
            "type": "addKarma",
            "value": -5
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "low_empathy",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "join_resistance",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "secret_meeting",
        "condition": {
          "flag": "network_member"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          }
        ]
      }
    ]
  },
  "act5_exile_path": {
    "id": "act5_exile_path",
    "ambientSound": "sounds/ambient/street_winter_wind.ogg",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_winter",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "ending_exile",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -15
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "ending_exile",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "exile_promised_return",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act5_poet_path": {
    "id": "act5_poet_path",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "ending_poet",
        "effects": [
          {
            "type": "addKarma",
            "value": 15
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 3
          },
          {
            "type": "collectPoem",
            "poemId": "poem_23"
          }
        ]
      },
      {
        "text": "",
        "next": "ending_poet",
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "shared_final_poem",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "rooftop_of_the_world",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          }
        ]
      }
    ]
  },
  "act5_ending_sacrifice": {
    "id": "act5_ending_sacrifice",
    "ambientSound": "sounds/ambient/digital_pulse.ogg",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_maria",
    "choices": [
      {
        "text": "",
        "next": "act5_epilogue",
        "effects": [
          {
            "type": "addKarma",
            "value": 15
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "ending_sacrifice",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "volodka_merged_with_code",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act5_epilogue": {
    "id": "act5_epilogue",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "effects": [
      {
        "type": "setFlag",
        "flag": "freedom_virus_deployed",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "survived_shutdown",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_bridge",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "act5_epilogue_seen",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "zarya_confession_requested",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vladimir_echo_started",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "machine_confession"
          },
          {
            "type": "triggerQuest",
            "questId": "echo_of_vladimir"
          },
          {
            "type": "triggerQuest",
            "questId": "traitor_in_the_guild"
          }
        ]
      },
      {
        "text": "",
        "next": "start",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          }
        ]
      }
    ]
  },
  "act5_ending_epilogue": {
    "id": "act5_ending_epilogue",
    "ambientSound": "sounds/ambient/room_morning.ogg",
    "guidanceObjectiveType": "visit_location",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "effects": [
      {
        "type": "setFlag",
        "flag": "freedom_virus_deployed",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "survived_shutdown",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "zarya_confession_requested",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "vladimir_echo_started",
        "flagValue": true
      },
      {
        "type": "triggerQuest",
        "questId": "machine_confession"
      },
      {
        "type": "triggerQuest",
        "questId": "echo_of_vladimir"
      },
      {
        "type": "triggerQuest",
        "questId": "traitor_in_the_guild"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_bridge",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "act5_ending_epilogue_seen",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "ending_reconciliation": {
    "id": "ending_reconciliation",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/cafe_evening_jazz.ogg",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "cafe_explore_mode",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_18"
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_18"
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "ending_reconciliation_mirror",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_18"
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      }
    ]
  },
  "ending_reconciliation_mirror": {
    "id": "ending_reconciliation_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "choices": [
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_tea_zarema"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "read_zarema_letter"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_albert_message"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "basement_hum_heard"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_song_ritka"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "minKarma": 65
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue"
      }
    ]
  },
  "ending_creator": {
    "id": "ending_creator",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/library_hush.ogg",
    "musicCue": "discovery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "library_day",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "library_explore_mode",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_13"
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_13"
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "ending_creator_mirror",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_13"
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      }
    ]
  },
  "ending_creator_mirror": {
    "id": "ending_creator_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "library_day",
    "choices": [
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_openspace_window"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_first_poem"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_rooftop_dmitry"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "basement_hum_heard"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "minKarma": 65
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue"
      }
    ]
  },
  "ending_rebel": {
    "id": "ending_rebel",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "street_bench_view",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "collectPoem",
            "poemId": "poem_19"
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "collectPoem",
            "poemId": "poem_19"
          }
        ]
      },
      {
        "text": "",
        "next": "ending_rebel_mirror",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "collectPoem",
            "poemId": "poem_19"
          }
        ]
      }
    ]
  },
  "ending_rebel_mirror": {
    "id": "ending_rebel_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_night",
    "choices": [
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_rooftop_dmitry"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "zarema_rescued"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_albert_message"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "trofim_portwine_delivered"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_song_ritka"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "maxKarma": 35
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue"
      }
    ]
  },
  "ending_exile": {
    "id": "ending_exile",
    "ambientSound": "sounds/ambient/street_winter_wind.ogg",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_winter",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "street_winter_explore_mode",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "collectPoem",
            "poemId": "poem_20"
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "collectPoem",
            "poemId": "poem_20"
          }
        ]
      },
      {
        "text": "",
        "next": "ending_exile_mirror",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "collectPoem",
            "poemId": "poem_20"
          }
        ]
      }
    ]
  },
  "ending_exile_mirror": {
    "id": "ending_exile_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_winter",
    "choices": [
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_tea_zarema"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "read_zarema_letter"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_first_poem"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "basement_hum_heard"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_song_ritka"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "maxKarma": 35
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue"
      }
    ]
  },
  "ending_machine": {
    "id": "ending_machine",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/digital_pulse.ogg",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "sleep_dream",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "dream_explore_mode",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "collectPoem",
            "poemId": "poem_21"
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "collectPoem",
            "poemId": "poem_21"
          }
        ]
      },
      {
        "text": "",
        "next": "ending_machine_mirror",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "collectPoem",
            "poemId": "poem_21"
          }
        ]
      }
    ]
  },
  "ending_machine_mirror": {
    "id": "ending_machine_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "sleep_dream",
    "choices": [
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_openspace_window"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "read_zarema_letter"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_rooftop_dmitry"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "basement_hum_heard"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "thread_18_complete"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "maxKarma": 35
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue"
      }
    ]
  },
  "ending_poet": {
    "id": "ending_poet",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "setFlag",
        "flag": "final_poem_read",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "rooftop_explore_mode",
        "effects": [
          {
            "type": "addKarma",
            "value": 20
          },
          {
            "type": "collectPoem",
            "poemId": "poem_23"
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "effects": [
          {
            "type": "addKarma",
            "value": 20
          },
          {
            "type": "collectPoem",
            "poemId": "poem_23"
          }
        ]
      },
      {
        "text": "",
        "next": "ending_poet_mirror",
        "effects": [
          {
            "type": "addKarma",
            "value": 20
          },
          {
            "type": "collectPoem",
            "poemId": "poem_23"
          }
        ]
      }
    ]
  },
  "ending_poet_mirror": {
    "id": "ending_poet_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "choices": [
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_first_poem"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "zarema_rescued"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_openspace_window"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "quiet_song_ritka"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "flag": "basement_hum_heard"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "condition": {
          "minKarma": 65
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue"
      }
    ]
  },
  "secret_meeting": {
    "id": "secret_meeting",
    "speaker": "narrator",
    "sceneId": "street_night",
    "choices": [
      {
        "text": "",
        "next": "secret_meeting_inside",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "found_secret_meeting",
            "flagValue": true
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          }
        ]
      },
      {
        "text": "",
        "next": "secret_meeting_eavesdrop",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
          }
        ]
      },
      {
        "text": "",
        "next": "street_bench",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -2
          }
        ]
      }
    ]
  },
  "secret_meeting_inside": {
    "id": "secret_meeting_inside",
    "speaker": "narrator",
    "sceneId": "street_night",
    "choices": [
      {
        "text": "",
        "next": "act2_network_initiation",
        "condition": {
          "flag": "network_member"
        },
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "npc_maria",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "setFlag",
            "flag": "secret_meeting_joined",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_maria_explains_network",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
          }
        ]
      }
    ]
  },
  "secret_meeting_eavesdrop": {
    "id": "secret_meeting_eavesdrop",
    "speaker": "narrator",
    "sceneId": "street_night",
    "choices": [
      {
        "text": "",
        "next": "secret_meeting_inside",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "heard_protocol_oblivion",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_albert_hint",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "heard_protocol_oblivion",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "old_code": {
    "id": "old_code",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "choices": [
      {
        "text": "",
        "next": "old_code_read",
        "condition": {
          "missingFlag": "found_living_code"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "found_marat_code",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "found_living_code",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "secrets_of_old_code"
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -10
          }
        ]
      },
      {
        "text": "",
        "next": "cafe_explore_mode",
        "condition": {
          "missingFlag": "found_living_code"
        },
        "effects": [
          {
            "type": "addItem",
            "itemId": "marat_code_copy",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "copied_marat_code",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "found_marat_code",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "found_living_code",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "secrets_of_old_code"
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "cafe_explore_mode",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "Вернуться к расшифровке живого кода",
        "next": "old_code_read",
        "condition": {
          "flag": "found_living_code",
          "missingFlag": "decoded_poetic_code"
        }
      }
    ]
  },
  "old_code_read": {
    "id": "old_code_read",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_24"
      },
      {
        "type": "collectPoem",
        "poemId": "poem_33"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "cafe_explore_mode",
        "condition": {
          "missingFlag": "decoded_poetic_code"
        },
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "marat_code_map_decoded",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "decoded_poetic_code",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "secrets_of_old_code"
          }
        ]
      },
      {
        "text": "",
        "next": "cafe_explore_mode",
        "condition": {
          "missingFlag": "decoded_poetic_code"
        },
        "effects": [
          {
            "type": "npcChange",
            "npcId": "npc_maria",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "setFlag",
            "flag": "marat_code_map_decoded",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "decoded_poetic_code",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "secrets_of_old_code"
          }
        ]
      },
      {
        "text": "Отойти к стойке — расшифрую позже",
        "next": "cafe_explore_mode"
      }
    ]
  },
  "rooftop_of_the_world": {
    "id": "rooftop_of_the_world",
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "choices": [
      {
        "text": "",
        "next": "rooftop_realization",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 3
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "rooftop_epiphany",
            "flagValue": true
          },
          {
            "type": "collectPoem",
            "poemId": "poem_21"
          }
        ]
      },
      {
        "text": "",
        "next": "go_home",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -10
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
        "condition": {
          "minSkill": {
            "coding": 7
          }
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 3
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -15
          },
          {
            "type": "setFlag",
            "flag": "transmitted_from_rooftop",
            "flagValue": true
          },
          {
            "type": "collectPoem",
            "poemId": "poem_11"
          }
        ]
      }
    ]
  },
  "rooftop_realization": {
    "id": "rooftop_realization",
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "choices": [
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_12"
          },
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 3
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -10
          }
        ]
      },
      {
        "text": "",
        "next": "street_bench",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -5
          }
        ]
      }
    ]
  },
  "abandoned_workshop": {
    "id": "abandoned_workshop",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "factory_basement_familiar",
        "condition": {
          "flag": "zarya_monolith_examined"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 6
          },
          {
            "type": "setFlag",
            "flag": "entered_factory_basement",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "factory_basement",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "entered_factory_basement",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "factory_documents",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "searched_factory_floor",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "factory_residents",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 1
          }
        ]
      }
    ]
  },
  "factory_basement": {
    "id": "factory_basement",
    "speaker": "narrator",
    "sceneId": "factory_basement",
    "choices": [
      {
        "text": "",
        "next": "basement_explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "met_baba_zina",
            "flagValue": true
          },
          {
            "type": "collectPoem",
            "poemId": "poem_15"
          }
        ]
      },
      {
        "text": "",
        "next": "basement_explore_mode",
        "condition": {
          "minSkill": {
            "coding": 8
          }
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 3
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "talked_to_zarya",
            "flagValue": true
          },
          {
            "type": "collectPoem",
            "poemId": "poem_16"
          }
        ]
      },
      {
        "text": "",
        "next": "machine_confession_scene",
        "condition": {
          "flag": "zarya_confession_requested",
          "missingFlag": "machine_fate_decided"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          }
        ]
      }
    ]
  },
  "factory_basement_familiar": {
    "id": "factory_basement_familiar",
    "speaker": "narrator",
    "sceneId": "factory_basement",
    "choices": [
      {
        "text": "",
        "next": "basement_explore_mode",
        "effects": [
          {
            "type": "addKarma",
            "value": 4
          },
          {
            "type": "setFlag",
            "flag": "met_baba_zina",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "npc_trofim",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      },
      {
        "text": "",
        "next": "machine_confession_scene_familiar",
        "condition": {
          "flag": "zarya_confession_requested",
          "missingFlag": "machine_fate_decided"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 4
          }
        ]
      },
      {
        "text": "",
        "next": "machine_confession_scene_thread",
        "condition": {
          "flag": "thread_18_complete",
          "missingFlag": "machine_fate_decided"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 6
          }
        ]
      }
    ]
  },
  "machine_confession_scene": {
    "id": "machine_confession_scene",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "ambientSound": "sounds/ambient/basement_hum.ogg",
    "proceduralAmbientOverride": "basement",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "«Заря-М»",
    "sceneId": "factory_basement",
    "guidanceObjectiveType": "make_choice",
    "condition": {
      "missingFlag": "machine_fate_decided"
    },
    "effects": [
      {
        "type": "setFlag",
        "flag": "heard_machine_confession",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "basement_explore_mode",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "machine_fate_decided",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "zarya_freed",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -15
          }
        ]
      },
      {
        "text": "",
        "next": "basement_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "machine_fate_decided",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "zarya_shutdown",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "basement_explore_mode"
      }
    ]
  },
  "machine_confession_scene_familiar": {
    "id": "machine_confession_scene_familiar",
    "ambientSound": "sounds/ambient/basement_hum.ogg",
    "proceduralAmbientOverride": "basement",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "«Заря-М»",
    "sceneId": "factory_basement",
    "guidanceObjectiveType": "make_choice",
    "condition": {
      "missingFlag": "machine_fate_decided"
    },
    "effects": [
      {
        "type": "setFlag",
        "flag": "heard_machine_confession",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "basement_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "machine_fate_decided",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "zarya_freed",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -15
          }
        ]
      },
      {
        "text": "",
        "next": "basement_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "machine_fate_decided",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "zarya_shutdown",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 4
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 8
          }
        ]
      },
      {
        "text": "",
        "next": "basement_explore_mode"
      }
    ]
  },
  "machine_confession_scene_thread": {
    "id": "machine_confession_scene_thread",
    "ambientSound": "sounds/ambient/basement_hum.ogg",
    "proceduralAmbientOverride": "basement",
    "musicCue": "discovery",
    "autoSave": true,
    "speaker": "«Заря-М»",
    "sceneId": "factory_basement",
    "guidanceObjectiveType": "make_choice",
    "condition": {
      "missingFlag": "machine_fate_decided"
    },
    "effects": [
      {
        "type": "setFlag",
        "flag": "heard_machine_confession",
        "flagValue": true
      },
      {
        "type": "addSkill",
        "skill": "intuition",
        "value": 2
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "basement_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "machine_fate_decided",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "zarya_freed",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 12
          },
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 3
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -15
          }
        ]
      },
      {
        "text": "",
        "next": "basement_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "machine_fate_decided",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "zarya_shutdown",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "basement_explore_mode"
      }
    ]
  },
  "factory_documents": {
    "id": "factory_documents",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "factory_basement",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "found_father_letter",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "entered_factory_basement",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "kitchen_table",
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "npcChange",
            "npcId": "npc_zarema",
            "npcChange": {
              "relation": 15
            }
          },
          {
            "type": "setFlag",
            "flag": "found_father_letter",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "factory_residents": {
    "id": "factory_residents",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "factory_basement",
        "condition": {
          "minKarma": 40
        },
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          },
          {
            "type": "setFlag",
            "flag": "entered_factory_basement",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "factory_documents",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
          }
        ]
      }
    ]
  },
  "library_entrance": {
    "id": "library_entrance",
    "ambientSound": "sounds/ambient/library_hush.ogg",
    "speaker": "narrator",
    "sceneId": "library_day",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "visited_library",
            "flagValue": true
          },
          {
            "type": "collectPoem",
            "poemId": "poem_14"
          }
        ]
      },
      {
        "text": "",
        "next": "vladimir_secret_room",
        "condition": {
          "flag": "vladimir_echo_started"
        }
      },
      {
        "text": "",
        "next": "cafe_enter",
        "effects": [
          {
            "type": "addStat",
            "stat": "energy",
            "value": 5
          }
        ]
      }
    ]
  },
  "vladimir_secret_room": {
    "id": "vladimir_secret_room",
    "ambientSound": "sounds/ambient/library_hush.ogg",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "library_day",
    "guidanceObjectiveType": "collect_item",
    "choices": [
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "final_poem_read",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 3
          }
        ]
      }
    ]
  },
  "sleep_dream_entrance": {
    "id": "sleep_dream_entrance",
    "speaker": "narrator",
    "sceneId": "sleep_dream",
    "choices": [
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "dream_poem_seen",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "addStat",
            "stat": "energy",
            "value": 20
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -10
          }
        ]
      }
    ]
  },
  "join_resistance": {
    "id": "join_resistance",
    "speaker": "narrator",
    "sceneId": "street_night",
    "choices": [
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "joined_resistance",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "network_member",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "npc_maria",
            "npcChange": {
              "relation": 10
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_epilogue",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "joined_resistance",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "volodka_inner": {
    "id": "volodka_inner",
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "choices": [
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -10
          },
          {
            "type": "setFlag",
            "flag": "inner_pledge_poems",
            "flagValue": true
          }
        ],
        "condition": {
          "missingFlag": "inner_pledge_poems"
        }
      },
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 3
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "inner_pledge_poems",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "poetry_collection"
          }
        ],
        "condition": {
          "missingFlag": "inner_pledge_poems"
        }
      }
    ]
  },
  "factory_explore_mode": {
    "id": "factory_explore_mode",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "factory_basement_familiar",
        "condition": {
          "flag": "entered_factory_basement"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          }
        ]
      },
      {
        "text": "",
        "next": "factory_basement",
        "goldenPath": true,
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "entered_factory_basement",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "factory_documents",
        "effects": [
          {
            "type": "setFlag",
            "flag": "searched_factory_floor",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "factory_residents",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 4
          }
        ]
      },
      {
        "text": "Прослушать первую запись «В.Л.»",
        "next": "voice_of_the_past_listen_1",
        "condition": {
          "flag": "found_vladimir_recordings",
          "missingFlag": "listened_recording_1"
        }
      },
      {
        "text": "Прослушать вторую запись «В.Л.»",
        "next": "voice_of_the_past_listen_2",
        "condition": {
          "flag": "listened_recording_1",
          "missingFlag": "listened_recording_2"
        }
      },
      {
        "text": "Прослушать завещание «В.Л.»",
        "next": "voice_of_the_past_listen_final",
        "condition": {
          "flag": "listened_recording_2",
          "missingFlag": "listened_recording_final"
        }
      },
      {
        "text": "Оборона Хранилища — фаервол под ударом",
        "next": "act3_vault_siege",
        "condition": {
          "flag": "rally_defenders_met",
          "missingFlag": "vault_defense_held"
        }
      },
      {
        "text": "Уйти в подполье — спрятать Сеть",
        "next": "act3_hide_network",
        "condition": {
          "flag": "vault_defense_held",
          "missingFlag": "network_hidden"
        }
      },
      {
        "text": "Правда Виктории — потребовать ответ у Хранилища",
        "next": "act3_maria_revelation",
        "condition": {
          "flag": "found_maria_records",
          "missingFlag": "maria_truth_revealed"
        }
      },
      {
        "text": "Скрытый люк — секретный архив",
        "next": "act6_secret_archive_approach",
        "condition": {
          "requiredAct": 6,
          "missingFlag": "act6_secret_archive_active"
        }
      },
      {
        "text": "Дверь архива — «Голос Улиц»",
        "next": "act6_secret_archive_door",
        "condition": {
          "requiredAct": 6,
          "flag": "act6_secret_archive_active",
          "missingFlag": "act6_secret_archive_opened"
        }
      },
      {
        "text": "Расшифровать уличные записи",
        "next": "act6_secret_archive_decode",
        "condition": {
          "requiredAct": 6,
          "flag": "act6_secret_archive_opened",
          "missingFlag": "act6_secret_archive_decoded"
        }
      },
      {
        "text": "Вынести спасённые стихи",
        "next": "act6_secret_archive_extract",
        "condition": {
          "requiredAct": 6,
          "flag": "act6_secret_archive_decoded",
          "missingFlag": "act6_secret_archive_saved"
        }
      },
      {
        "text": "Запечатать архив до зачистки",
        "next": "act6_secret_archive_seal",
        "condition": {
          "requiredAct": 6,
          "flag": "act6_secret_archive_saved",
          "missingFlag": "act6_secret_archive_sealed"
        }
      },
      {
        "text": "Тайник Александра — логи гильдии",
        "next": "act6_traitor_approach",
        "condition": {
          "requiredAct": 6,
          "missingFlag": "alexander_logs_decrypted"
        }
      },
      {
        "text": "Расшифрованные логи — кто крот?",
        "next": "act6_traitor_discovery",
        "condition": {
          "flag": "alexander_logs_decrypted",
          "missingFlag": "traitor_revealed"
        }
      },
      {
        "text": "Крот найден — путь в офис к Дмитрию",
        "next": "act6_traitor_approach",
        "condition": {
          "flag": "traitor_revealed",
          "missingFlag": "traitor_fate_decided"
        }
      },
      {
        "text": "Ядро «Надзора» — точка входа",
        "next": "act6_nadzor_revealed",
        "condition": {
          "flag": "data_heist_completed",
          "missingFlag": "nadzor_truth_revealed"
        }
      },
      {
        "text": "Штурм «Надзора» — Хранитель ждёт",
        "next": "act6_infiltration_prep",
        "condition": {
          "flag": "nadzor_truth_revealed",
          "missingFlag": "act6_nadzor_battle_open"
        }
      },
      {
        "text": "Хранитель у ядра — бой или отступление",
        "next": "act6_nadzor_battle",
        "condition": {
          "flag": "act6_nadzor_battle_open",
          "missingFlag": "act6_nadzor_battle_resolved"
        }
      },
      {
        "text": "Хранитель пал — консоль ядра ждёт",
        "next": "act6_battle_victory",
        "condition": {
          "flag": "act6_battle_victory_open",
          "missingFlag": "act6_battle_victory_resolved"
        }
      },
      {
        "text": "Ядро открыто — выбор у терминала",
        "next": "act6_core_choice",
        "condition": {
          "flag": "nadzor_guardian_defeated",
          "missingFlag": "act6_infiltration_ready"
        }
      },
      {
        "text": "Отключение «Надзора» — Жека у ядра",
        "next": "act7_system_shutdown",
        "condition": {
          "flag": "guild_restored",
          "missingFlag": "path_to_core_cleared"
        }
      },
      {
        "text": "Штурм ядра — путь расчищен",
        "next": "act7_core_battle",
        "condition": {
          "flag": "path_to_core_cleared",
          "missingFlag": "nadzor_shutdown_complete"
        }
      },
      {
        "text": "Тишина после «Надзора» — выйти на поверхность",
        "next": "act7_nadzor_dies",
        "condition": {
          "flag": "nadzor_shutdown_complete",
          "missingFlag": "nadzor_destroyed"
        }
      },
      {
        "text": "Память «Зари-М» — три образа в leaking",
        "next": "quest_act5_factory_zarya_memory_restore_start",
        "condition": {
          "requiredAct": 5,
          "missingFlag": "quest_act5_factory_zarya_memory_restore_active"
        },
        "effects": [
          {
            "type": "triggerQuest",
            "questId": "quest_act5_factory_zarya_memory_restore"
          }
        ]
      },
      {
        "text": "Первая тень у паяльной — вернуть образ",
        "next": "quest_act5_zarya_fragment_1",
        "condition": {
          "flag": "quest_act5_factory_zarya_memory_restore_active",
          "missingFlag": "zarya_memory_fragment_1_done"
        }
      },
      {
        "text": "Третий образ — к паяльной станции",
        "next": "quest_act5_zarya_fragment_3",
        "condition": {
          "flag": "zarya_memory_fragment_2_done",
          "missingFlag": "zarya_memory_fragment_3_done"
        }
      },
      {
        "text": "Чайник ещё свистит у паяльной",
        "next": "factory_baba_zina_tea_kettle",
        "condition": {
          "flag": "factory_baba_zina_tea_active",
          "missingFlag": "factory_baba_zina_tea_kettle"
        }
      },
      {
        "text": "Заварка — мята и полынь",
        "next": "factory_baba_zina_tea_mint",
        "condition": {
          "flag": "factory_baba_zina_tea_kettle",
          "missingFlag": "factory_baba_zina_tea_mint"
        }
      },
      {
        "text": "Слушать гул «Зари» с чаем",
        "next": "factory_baba_zina_tea_hum",
        "condition": {
          "flag": "factory_baba_zina_tea_mint",
          "missingFlag": "factory_baba_zina_tea_hum"
        }
      },
      {
        "text": "Допить — и про 1987-й",
        "next": "factory_baba_zina_tea_history",
        "condition": {
          "flag": "factory_baba_zina_tea_hum",
          "missingFlag": "factory_baba_zina_tea_done"
        }
      },
      {
        "text": "",
        "next": "factory_explore_mode"
      }
    ]
  },
  "basement_explore_mode": {
    "id": "basement_explore_mode",
    "ambientSound": "sounds/ambient/basement_hum.ogg",
    "proceduralAmbientOverride": "basement",
    "speaker": "narrator",
    "sceneId": "factory_basement",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "factory_basement_familiar",
        "condition": {
          "flag": "met_baba_zina"
        },
        "effects": [
          {
            "type": "addKarma",
            "value": 2
          }
        ]
      },
      {
        "text": "",
        "next": "machine_confession_scene_thread",
        "condition": {
          "flag": "thread_18_complete",
          "missingFlag": "machine_fate_decided"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "zarya_confession_requested",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "machine_confession_scene_familiar",
        "condition": {
          "flag": "zarya_monolith_examined",
          "missingFlag": "machine_fate_decided"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "zarya_confession_requested",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "machine_confession_scene",
        "goldenPath": true,
        "condition": {
          "flag": "zarya_confession_requested",
          "missingFlag": "machine_fate_decided"
        }
      },
      {
        "text": "",
        "next": "factory_explore_mode",
        "effects": [
          {
            "type": "addStat",
            "stat": "energy",
            "value": 3
          }
        ]
      },
      {
        "text": "Прочитать стих «Зари-М»",
        "next": "voices_of_factory_poem",
        "condition": {
          "flag": "found_quantum_computer",
          "missingFlag": "read_factory_poem"
        }
      },
      {
        "text": "Скрыть «Зарю-М» от гильдии",
        "next": "voices_of_factory_protect",
        "condition": {
          "flag": "read_factory_poem",
          "missingFlag": "dmitry_factory_protect"
        }
      },
      {
        "text": "Второй образ — leaking-поток в стойках",
        "next": "quest_act5_zarya_fragment_2",
        "condition": {
          "flag": "zarya_memory_fragment_1_done",
          "missingFlag": "zarya_memory_fragment_2_done"
        }
      },
      {
        "text": "Стих-ключ в leaking — к шифру «Солныш»",
        "next": "quest_act5_bunker_poem_key",
        "condition": {
          "flag": "quest_act5_bunker_code_poem_break_active",
          "missingFlag": "bunker_poem_key_found"
        }
      },
      {
        "text": "Кассета грозы — второй образ «Зари-М»",
        "next": "factory_zarya_storm",
        "condition": {
          "flag": "factory_zarya_snow_done",
          "missingFlag": "factory_zarya_storm_done"
        }
      },
      {
        "text": "Фото Солныш — третий образ у Зины",
        "next": "factory_zarya_photo",
        "condition": {
          "flag": "factory_zarya_storm_done",
          "missingFlag": "factory_zarya_photo_done"
        }
      },
      {
        "text": "Три образа на шине — вернуть память",
        "next": "factory_zarya_memory_restore",
        "condition": {
          "flag": "factory_zarya_photo_done",
          "missingFlag": "factory_zarya_memory_done"
        }
      },
      {
        "text": "",
        "next": "basement_explore_mode"
      }
    ]
  }
} as Record<string, StoryNodeStructure>;
