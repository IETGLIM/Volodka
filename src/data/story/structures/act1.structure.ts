import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT1_STRUCTURE: Record<string, StoryNodeStructure> = {
  "start": {
    "id": "start",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "musicCue": "mystery",
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "guidanceObjectiveType": "visit_location",
    "autoSave": true,
    "choices": [
      {
        "text": "",
        "next": "explore_mode",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "woke_up",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "morning_ritual"
          }
        ]
      },
      {
        "text": "",
        "next": "room_terminal_wake",
        "effects": [
          {
            "type": "setFlag",
            "flag": "morning_ritual_terminal",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "explore_mode": {
    "id": "explore_mode",
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "room_table",
        "goldenPath": true
      },
      {
        "text": "",
        "next": "room_bookshelf"
      },
      {
        "text": "",
        "next": "room_wardrobe_memory"
      },
      {
        "text": "",
        "next": "corridor_door",
        "effects": [
          {
            "type": "transitionScene",
            "sceneId": "volodka_corridor"
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
        "condition": {
          "missingFlag": "room_free_explore_1"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -2
          },
          {
            "type": "setFlag",
            "flag": "room_free_explore_1",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
        "condition": {
          "flag": "room_free_explore_1",
          "missingFlag": "room_free_explore_2"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -1
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "room_free_explore_2",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
        "condition": {
          "flag": "room_free_explore_2",
          "missingFlag": "room_free_explore_3"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "room_free_explore_3",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "room_table": {
    "id": "room_table",
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_34"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "read_guild_message",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "go_to_cafe",
        "effects": [
          {
            "type": "setFlag",
            "flag": "accepted_guild_quest",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "incident_scroll_4729"
          }
        ]
      },
      {
        "text": "",
        "next": "corridor_door",
        "goldenPath": true,
        "effects": [
          {
            "type": "transitionScene",
            "sceneId": "volodka_corridor"
          }
        ]
      }
    ]
  },
  "room_bookshelf": {
    "id": "room_bookshelf",
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "choices": [
      {
        "text": "",
        "next": "explore_mode",
        "condition": {
          "missingPoem": "poem_2"
        },
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_2"
          },
          {
            "type": "addKarma",
            "value": 2
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
        "condition": {
          "collectedPoem": "poem_2"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
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
  "corridor_door": {
    "id": "corridor_door",
    "soundEffect": "door_open",
    "speaker": "narrator",
    "sceneId": "volodka_corridor",
    "autoSave": true,
    "choices": [
      {
        "text": "",
        "next": "corridor_explore_mode",
        "goldenPath": true,
        "effects": [
          {
            "type": "npcChange",
            "npcId": "solnysh",
            "npcChange": {
              "relation": 3
            }
          },
          {
            "type": "triggerQuest",
            "questId": "solnysh_comfort"
          }
        ]
      },
      {
        "text": "",
        "next": "kitchen_table"
      },
      {
        "text": "",
        "next": "street_bench"
      },
      {
        "text": "",
        "next": "go_home"
      }
    ]
  },
  "corridor_explore_mode": {
    "id": "corridor_explore_mode",
    "speaker": "narrator",
    "sceneId": "volodka_corridor",
    "guidanceNpcId": "solnysh",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "solnysh_corridor_talk"
      },
      {
        "text": "",
        "next": "umka_corridor_pet"
      },
      {
        "text": "",
        "next": "solnysh_door"
      },
      {
        "text": "",
        "next": "corridor_letter_open"
      },
      {
        "text": "",
        "next": "corridor_intercom_whisper"
      },
      {
        "text": "",
        "next": "kitchen_table",
        "goldenPath": true
      },
      {
        "text": "",
        "next": "street_bench"
      },
      {
        "text": "",
        "next": "go_home"
      },
      {
        "text": "",
        "next": "corridor_explore_mode",
        "condition": {
          "missingFlag": "corridor_free_explore_1"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -1
          },
          {
            "type": "setFlag",
            "flag": "corridor_free_explore_1",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "corridor_explore_mode",
        "condition": {
          "flag": "corridor_free_explore_1",
          "missingFlag": "corridor_free_explore_2"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "corridor_free_explore_2",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "solnysh_corridor_talk": {
    "id": "solnysh_corridor_talk",
    "speaker": "Солныш",
    "sceneId": "volodka_corridor",
    "choices": [
      {
        "text": "",
        "next": "corridor_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "solnysh_comforted",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "solnysh",
            "npcChange": {
              "relation": 8
            }
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "triggerQuest",
            "questId": "solnysh_comfort"
          }
        ]
      },
      {
        "text": "",
        "next": "solnysh_door"
      },
      {
        "text": "",
        "next": "corridor_explore_mode",
        "effects": [
          {
            "type": "npcChange",
            "npcId": "solnysh",
            "npcChange": {
              "relation": 3
            }
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      },
      {
        "text": "",
        "next": "corridor_explore_mode"
      }
    ]
  },
  "go_home": {
    "id": "go_home",
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "choices": [
      {
        "text": "",
        "next": "explore_mode"
      },
      {
        "text": "",
        "next": "room_table"
      },
      {
        "text": "",
        "next": "room_bookshelf"
      },
      {
        "text": "",
        "next": "corridor_door"
      },
      {
        "text": "",
        "next": "sleep_dream_entrance",
        "effects": [
          {
            "type": "addStat",
            "stat": "energy",
            "value": 30
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -15
          }
        ]
      }
    ]
  },
  "kitchen_table": {
    "id": "kitchen_table",
    "speaker": "narrator",
    "sceneId": "home_evening",
    "guidanceNpcId": "zarema",
    "guidanceObjectiveType": "talk_to_npc",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_35"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "kitchen_window",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      },
      {
        "text": "",
        "next": "zarema_radio_request",
        "condition": {
          "missingFlag": "zarema_radio_fixed"
        }
      },
      {
        "text": "",
        "next": "kitchen_window",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -5
          }
        ]
      }
    ]
  },
  "kitchen_window": {
    "id": "kitchen_window",
    "speaker": "narrator",
    "sceneId": "home_evening",
    "choices": [
      {
        "text": "",
        "next": "go_to_cafe",
        "goldenPath": true
      },
      {
        "text": "",
        "next": "go_home",
        "effects": [
          {
            "type": "addStat",
            "stat": "energy",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "balcony_thought",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 1
          }
        ]
      }
    ]
  },
  "cafe_enter": {
    "id": "cafe_enter",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "choices": [
      {
        "text": "",
        "next": "cafe_explore_mode",
        "goldenPath": true
      },
      {
        "text": "",
        "next": "cafe_barista",
        "effects": [
          {
            "type": "setFlag",
            "flag": "met_albert",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "albert",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      },
      {
        "text": "",
        "next": "cafe_barista",
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
  "cafe_barista": {
    "id": "cafe_barista",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "choices": [
      {
        "text": "",
        "next": "office_alexander",
        "goldenPath": true,
        "effects": [
          {
            "type": "addStat",
            "stat": "energy",
            "value": 15
          },
          {
            "type": "addKarma",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "cafe_special_coffee",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "asked_special_coffee",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "street_bench": {
    "id": "street_bench",
    "speaker": "narrator",
    "sceneId": "street_night",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_30"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "cafe_enter"
      },
      {
        "text": "",
        "next": "street_bench_view",
        "goldenPath": true
      },
      {
        "text": "",
        "next": "go_home",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      }
    ]
  },
  "street_bench_view": {
    "id": "street_bench_view",
    "speaker": "narrator",
    "sceneId": "street_night",
    "choices": [
      {
        "text": "",
        "next": "maria_curious",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "spotted_maria",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 2
          },
          {
            "type": "collectPoem",
            "poemId": "poem_19"
          }
        ]
      },
      {
        "text": "",
        "next": "cafe_enter",
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
  "office_alexander": {
    "id": "office_alexander",
    "speaker": "narrator",
    "sceneId": "office_day",
    "choices": [
      {
        "text": "",
        "next": "office_explore_mode",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "agreed_help_alexander",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "office_alexander",
            "npcChange": {
              "relation": 10
            }
          },
          {
            "type": "collectPoem",
            "poemId": "poem_20"
          }
        ]
      },
      {
        "text": "",
        "next": "office_incident_debrief",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "office_colleague",
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
  "office_colleague": {
    "id": "office_colleague",
    "speaker": "narrator",
    "sceneId": "office_day",
    "choices": [
      {
        "text": "",
        "next": "colleague_persuasion_line",
        "goldenPath": true,
        "condition": {
          "minSkill": {
            "persuasion": 3
          }
        }
      },
      {
        "text": "",
        "next": "office_alexander",
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "start_diagnosis",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "low_empathy",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "maria_curious": {
    "id": "maria_curious",
    "musicCue": "tension",
    "speaker": "narrator",
    "sceneId": "street_night",
    "effects": [
      {
        "type": "setFlag",
        "flag": "met_maria",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "cafe_enter",
        "goldenPath": true
      },
      {
        "text": "",
        "next": "maria_introduction",
        "effects": [
          {
            "type": "addItem",
            "itemId": "maria_data_chip",
            "value": 1
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "accepted_maria_chip",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "office_colleague",
            "npcChange": {
              "relation": -5
            }
          },
          {
            "type": "triggerQuest",
            "questId": "maria_connection"
          }
        ]
      },
      {
        "text": "",
        "next": "explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "asked_maria_identity",
            "flagValue": true
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
            "value": 3
          },
          {
            "type": "addKarma",
            "value": -3
          },
          {
            "type": "setFlag",
            "flag": "low_empathy",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "go_to_cafe": {
    "id": "go_to_cafe",
    "speaker": "narrator",
    "sceneId": "street_night",
    "choices": [
      {
        "text": "",
        "next": "street_bench",
        "goldenPath": true
      },
      {
        "text": "",
        "next": "street_guild_pulse"
      },
      {
        "text": "",
        "next": "cafe_enter"
      },
      {
        "text": "",
        "next": "maria_curious"
      },
      {
        "text": "",
        "next": "friday_arrives",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          }
        ]
      }
    ],
    "effects": [
      {
        "type": "setFlag",
        "flag": "going_to_cafe",
        "flagValue": true
      }
    ]
  },
  "start_diagnosis": {
    "id": "start_diagnosis",
    "speaker": "narrator",
    "sceneId": "office_day",
    "choices": [
      {
        "text": "",
        "next": "fix_success",
        "goldenPath": true,
        "condition": {
          "minSkill": {
            "coding": 2
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
            "flag": "started_decryption",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "office_colleague",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "compared_archives",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "colleague_persuasion_line": {
    "id": "colleague_persuasion_line",
    "speaker": "narrator",
    "sceneId": "office_day",
    "effects": [
      {
        "type": "triggerQuest",
        "questId": "vault_backup_trial"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "balcony_thought",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "colleague_help_access",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_access_granted",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "office_colleague",
            "npcChange": {
              "relation": 10
            }
          }
        ]
      },
      {
        "text": "",
        "next": "office_alexander",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "addKarma",
            "value": 2
          }
        ]
      }
    ]
  },
  "fix_success": {
    "id": "fix_success",
    "musicCue": "discovery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "office_day",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_32"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "office_colleague",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_1"
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "found_first_poem",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "read_poem_1",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "thread_lore_4729",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "solved_albert_riddle",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "proved_poetry_code_link",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "office_alexander",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_1"
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "reported_poem_to_alexander",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "read_poem_1",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "thread_lore_4729",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "balcony_thought": {
    "id": "balcony_thought",
    "speaker": "narrator",
    "sceneId": "home_evening",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_31"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "friday_arrives",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_3"
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": 3
          }
        ]
      },
      {
        "text": "",
        "next": "kitchen_table",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -10
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": 5
          }
        ]
      },
      {
        "text": "",
        "next": "room_table",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
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
  "friday_arrives": {
    "id": "friday_arrives",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "choices": [
      {
        "text": "",
        "next": "act2_transition",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_4"
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -5
          }
        ]
      },
      {
        "text": "",
        "next": "street_bench",
        "effects": [
          {
            "type": "addStat",
            "stat": "energy",
            "value": 5
          },
          {
            "type": "addKarma",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "kitchen_table",
        "effects": [
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 3
            }
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -8
          },
          {
            "type": "collectPoem",
            "poemId": "poem_16"
          }
        ]
      }
    ]
  },
  "maria_introduction": {
    "id": "maria_introduction",
    "speaker": "narrator",
    "sceneId": "street_night",
    "choices": [
      {
        "text": "",
        "next": "act2_maria_meeting_place",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_6"
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 8
            }
          },
          {
            "type": "setFlag",
            "flag": "maria_introduced",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_transition",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_6"
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "maria_introduced",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "go_to_cafe",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "maria_introduced",
            "flagValue": true
          }
        ]
      }
    ]
  },

  "sync_conference": {
    "id": "sync_conference",
    "sceneId": "volodka_room",
    "speaker": "narrator",
    "autoSave": true,
    "choices": [
      {
        "text": "",
        "next": "sync_alexander_opens",
        "effects": [
          { "type": "setFlag", "flag": "sync_terminal_approached", "flagValue": true },
          { "type": "setFlag", "flag": "sync_connected", "flagValue": true }
        ]
      }
    ]
  },

  "sync_alexander_opens": {
    "id": "sync_alexander_opens",
    "sceneId": "volodka_room",
    "speaker": "Александр",
    "choices": [
      {
        "text": "Слушаю, Александр.",
        "next": "sync_dmitry_report",
        "effects": [
          { "type": "addStat", "stat": "stress", "value": 2 }
        ]
      },
      {
        "text": "Опять пожар? Что на этот раз?",
        "next": "sync_dmitry_report",
        "effects": [
          { "type": "addKarma", "value": -2 },
          { "type": "addStat", "stat": "stress", "value": 3 }
        ]
      }
    ]
  },

  "sync_dmitry_report": {
    "id": "sync_dmitry_report",
    "sceneId": "volodka_room",
    "speaker": "Дмитрий",
    "choices": [
      {
        "text": "Дмитрий, ты уверен в этих цифрах?",
        "next": "sync_colleague_interrupts",
        "condition": { "minSkill": { "logic": 4 } },
        "effects": [
          { "type": "addSkill", "skill": "logic", "value": 1 }
        ]
      },
      {
        "text": "Понятно. Дальше.",
        "next": "sync_colleague_interrupts",
        "effects": [
          { "type": "addStat", "stat": "stress", "value": 1 }
        ]
      }
    ]
  },

  "sync_colleague_interrupts": {
    "id": "sync_colleague_interrupts",
    "sceneId": "volodka_room",
    "speaker": "Коллега",
    "choices": [
      {
        "text": "Коллега, не паникуй. Давайте по порядку.",
        "next": "sync_alexander_closing",
        "effects": [
          { "type": "addKarma", "value": 3 },
          { "type": "addSkill", "skill": "persuasion", "value": 1 }
        ]
      },
      {
        "text": "Молча слушать дальше.",
        "next": "sync_alexander_closing",
        "effects": [
          { "type": "addStat", "stat": "stress", "value": 2 }
        ]
      }
    ]
  },

  "sync_alexander_closing": {
    "id": "sync_alexander_closing",
    "sceneId": "volodka_room",
    "speaker": "Александр",
    "choices": [
      {
        "text": "Понял. Приступаю.",
        "next": "sync_end",
        "effects": [
          { "type": "setFlag", "flag": "sync_completed", "flagValue": true },
          { "type": "addXp", "value": 80 },
          { "type": "addKarma", "value": 3 },
          { "type": "addSkill", "skill": "persuasion", "value": 1 },
          { "type": "setFlag", "flag": "sync_done", "flagValue": true }
        ]
      },
      {
        "text": "Александр, мне нужно больше времени.",
        "next": "sync_end",
        "effects": [
          { "type": "setFlag", "flag": "sync_completed", "flagValue": true },
          { "type": "addStat", "stat": "stress", "value": 5 },
          { "type": "addXp", "value": 50 },
          { "type": "setFlag", "flag": "sync_done", "flagValue": true }
        ]
      }
    ]
  },

  "sync_end": {
    "id": "sync_end",
    "sceneId": "volodka_room",
    "speaker": "narrator",
    "choices": [
      {
        "text": "Хорошего дня, коллеги.",
        "next": null,
        "effects": [
          { "type": "setFlag", "flag": "sync_ended", "flagValue": true }
        ]
      }
    ]
  }
} as Record<string, StoryNodeStructure>;
