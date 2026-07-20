import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT3_STRUCTURE: Record<string, StoryNodeStructure> = {
  "act3_transition": {
    "id": "act3_transition",
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceObjectiveType": "visit_location",
    "guidanceNpcId": "npc_zarema",
    "choices": [
      {
        "text": "",
        "next": "park_entrance",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "act3_started",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "advanced_to_act3",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 3
          }
        ]
      },
      {
        "text": "",
        "next": "park_entrance",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "act3_started",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "advanced_to_act3",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "park_entrance": {
    "id": "park_entrance",
    "speaker": "narrator",
    "sceneId": "park_day",
    "guidanceObjectiveType": "visit_location",
    "soundEffect": "item_use",
    "choices": [
      {
        "text": "",
        "next": "park_explore_mode",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_10"
          },
          {
            "type": "addKarma",
            "value": 3
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
        "next": "act3_zarema_warning",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_10"
          },
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      }
    ]
  },
  "act3_zarema_warning": {
    "id": "act3_zarema_warning",
    "speaker": "Зарема",
    "sceneId": "park_day",
    "guidanceNpcId": "npc_zarema",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act3_zarema_arrest",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 8
            }
          },
          {
            "type": "setFlag",
            "flag": "promised_protect_zarema",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_zarema_arrest",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          }
        ]
      }
    ]
  },
  "act3_zarema_arrest": {
    "id": "act3_zarema_arrest",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/corridor_alarm.ogg",
    "musicCue": "danger",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "volodka_corridor",
    "guidanceNpcId": "npc_zarema",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act3_detention_infiltration",
        "goldenPath": true,
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
            "flag": "zarema_arrested",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "pledge_rescue_zarema",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "priority_rescue_zarema",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "zarema_rescue"
          }
        ]
      },
      {
        "text": "",
        "next": "act3_zarema_arrest_resist",
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 15
            }
          },
          {
            "type": "setFlag",
            "flag": "zarema_arrested",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "pledge_rescue_zarema",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "zarema_rescue"
          }
        ]
      },
      {
        "text": "",
        "next": "act3_zarema_arrest_cold",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "zarema_arrested",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "noted_guild_agents",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "zarema_rescue"
          }
        ]
      },
      {
        "text": "",
        "next": "act3_underground_meeting",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "zarema_arrested",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "called_maria_for_help",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "triggerQuest",
            "questId": "zarema_rescue"
          }
        ],
        "condition": {
          "flag": "maria_introduced",
          "minKarma": 40
        }
      }
    ]
  },
  "act3_zarema_arrest_resist": {
    "id": "act3_zarema_arrest_resist",
    "soundEffect": "error",
    "speaker": "narrator",
    "sceneId": "volodka_corridor",
    "choices": [
      {
        "text": "",
        "next": "act3_underground_meeting",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act3_guild_counterattack",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          }
        ]
      }
    ]
  },
  "act3_zarema_arrest_cold": {
    "id": "act3_zarema_arrest_cold",
    "speaker": "narrator",
    "sceneId": "volodka_corridor",
    "choices": [
      {
        "text": "",
        "next": "act3_underground_meeting",
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
        "next": "act3_maria_mystery",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "investigating_chip_plant",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act3_underground_meeting": {
    "id": "act3_underground_meeting",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "guidanceNpcId": "npc_maria",
    "choices": [
      {
        "text": "",
        "next": "act3_detention_infiltration",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 10
            }
          },
          {
            "type": "setFlag",
            "flag": "priority_rescue_zarema",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_vault_siege",
        "condition": {
          "minSkill": {
            "logic": 3
          }
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": -5
          },
          {
            "type": "setFlag",
            "flag": "priority_defend_vault",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_under_attack",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "rally_defenders_met",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "low_empathy",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "vault_defense"
          }
        ]
      },
      {
        "text": "",
        "next": "act3_choice_betrayal",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 8
          },
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          }
        ],
        "condition": {
          "minSkill": {
            "persuasion": 5
          }
        }
      }
    ]
  },
  "act3_choice_betrayal": {
    "id": "act3_choice_betrayal",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "autoSave": true,
    "musicCue": "tension",
    "speaker": "Виктория",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act3_detention_infiltration",
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 20
            }
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -5
          },
          {
            "type": "setFlag",
            "flag": "chose_zarema_over_vault",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_vault_siege",
        "effects": [
          {
            "type": "addKarma",
            "value": -3
          },
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "chose_vault_over_zarema",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_under_attack",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "rally_defenders_met",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "vault_defense"
          }
        ]
      },
      {
        "text": "",
        "next": "act3_maria_revelation",
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 15
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "refused_choice",
            "flagValue": true
          }
        ],
        "condition": {
          "minKarma": 60
        }
      }
    ]
  },
  "act3_detention_infiltration": {
    "id": "act3_detention_infiltration",
    "musicCue": "tension",
    "speaker": "narrator",
    "sceneId": "office_day",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act3_zarema_cell",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "stealth_infiltration",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "detention_breached",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "coding": 5
          }
        }
      },
      {
        "text": "",
        "next": "act3_zarema_cell",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "detention_breached",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_zarema_cell",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "hacked_security",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "detention_breached",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "logic": 6
          }
        }
      }
    ]
  },
  "act3_zarema_cell": {
    "id": "act3_zarema_cell",
    "speaker": "Зарема",
    "sceneId": "office_day",
    "guidanceNpcId": "npc_zarema",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act3_zarema_rescue_choice",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 10
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act3_zarema_rescue_choice",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "asked_zarema_intel",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act3_zarema_rescue_choice": {
    "id": "act3_zarema_rescue_choice",
    "autoSave": true,
    "musicCue": "danger",
    "speaker": "Зарема",
    "sceneId": "office_day",
    "guidanceNpcId": "npc_zarema",
    "guidanceObjectiveType": "make_choice",
    "condition": {
      "missingFlag": "zarema_choice_made"
    },
    "choices": [
      {
        "text": "",
        "next": "act3_save_zarema",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 15
            }
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "combat",
            "enemyType": "corporate_golem"
          },
          {
            "type": "setFlag",
            "flag": "zarema_choice_made",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_zarema_farewell",
        "effects": [
          {
            "type": "addKarma",
            "value": -5
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 15
          },
          {
            "type": "setFlag",
            "flag": "left_zarema",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "low_empathy",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "zarema_choice_made",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act3_save_zarema": {
    "id": "act3_save_zarema",
    "musicCue": "danger",
    "soundEffect": "quest_complete",
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act3_barista_safehouse",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "npcChange",
            "npcId": "cafe_barista",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "setFlag",
            "flag": "zarema_rescued",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "escaped_with_zarema",
            "flagValue": true
          },
          {
            "type": "collectPoem",
            "poemId": "poem_17"
          }
        ]
      },
      {
        "text": "",
        "next": "maria_warm",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "zarema_rescued",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act3_zarema_farewell": {
    "id": "act3_zarema_farewell",
    "musicCue": "emotional",
    "speaker": "Зарема",
    "sceneId": "office_day",
    "guidanceNpcId": "npc_zarema",
    "choices": [
      {
        "text": "",
        "next": "maria_warm",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 20
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -10
          },
          {
            "type": "setFlag",
            "flag": "zarema_farewell_heard",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act3_barista_safehouse": {
    "id": "act3_barista_safehouse",
    "ambientSound": "sounds/ambient/backroom_hum.ogg",
    "soundEffect": "ui_open",
    "speaker": "Бариста",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_barista",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "maria_warm",
        "effects": [
          {
            "type": "npcChange",
            "npcId": "cafe_barista",
            "npcChange": {
              "relation": 8
            }
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -8
          },
          {
            "type": "setFlag",
            "flag": "barista_act3_safehouse",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "maria_warm": {
    "id": "maria_warm",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "speaker": "Виктория",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act3_maria_mystery",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_11"
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
          }
        ]
      },
      {
        "text": "",
        "next": "act3_maria_revelation",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_11"
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          }
        ]
      }
    ]
  },
  "act3_maria_mystery": {
    "id": "act3_maria_mystery",
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "effects": [
      {
        "type": "triggerQuest",
        "questId": "maria_truth"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act3_maria_revelation",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "found_maria_records",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_underground_meeting",
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 1
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
        "next": "act3_underground_meeting",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "addKarma",
            "value": -3
          },
          {
            "type": "setFlag",
            "flag": "suspected_maria",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "low_empathy",
            "flagValue": true
          }
        ],
        "condition": {
          "maxKarma": 50
        }
      }
    ]
  },
  "act3_maria_revelation": {
    "id": "act3_maria_revelation",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/digital_pulse.ogg",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "Виктория",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act3_maria_truth_accepted",
        "goldenPath": true,
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 15
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 3
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "maria_truth_revealed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "maria_truth_accepted",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 20
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act3_maria_truth_accepted",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "addKarma",
            "value": -5
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "maria_truth_revealed",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": -10
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act3_maria_truth_accepted",
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "maria_truth_revealed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "maria_truth_accepted",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vowed_protect_maria",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 25
            }
          }
        ],
        "condition": {
          "minKarma": 55
        }
      }
    ]
  },
  "act3_maria_truth_accepted": {
    "id": "act3_maria_truth_accepted",
    "speaker": "Виктория",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_maria",
    "choices": [
      {
        "text": "",
        "next": "act3_albert_loyalty",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "maria_digital_alliance",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_albert_loyalty",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      }
    ]
  },
  "act3_albert_loyalty": {
    "id": "act3_albert_loyalty",
    "speaker": "Альберт",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_albert",
    "choices": [
      {
        "text": "",
        "next": "act3_albert_choice",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "albert",
            "npcChange": {
              "relation": 10
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act3_albert_choice",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "albert_pressure_details",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act3_albert_choice": {
    "id": "act3_albert_choice",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "act3_guild_counterattack",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "albert",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "act3_guild_counterattack",
        "goldenPath": true,
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "albert_diversion",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act3_guild_counterattack": {
    "id": "act3_guild_counterattack",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "condition": {
      "missingFlag": "aftermath_visited"
    },
    "choices": [
      {
        "text": "",
        "next": "act3_vault_siege",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "vault_under_attack",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "rally_defenders_met",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "vault_defense"
          }
        ]
      },
      {
        "text": "",
        "next": "act3_hide_network",
        "goldenPath": true,
        "condition": {
          "flag": "tolpa_honorary_chekist"
        },
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "vault_under_attack",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "tolpa_sanctuary_offered",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "rally_defenders_met",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_defense_held",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "tolpa_act3_sanctuary"
          },
          {
            "type": "triggerQuest",
            "questId": "vault_defense"
          }
        ]
      },
      {
        "text": "",
        "next": "act3_choice_betrayal",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "vault_evacuation_chosen",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_under_attack",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "vault_defense"
          }
        ]
      },
      {
        "text": "",
        "next": "act3_maria_revelation",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 5
            }
          }
        ],
        "condition": {
          "flag": "maria_true_nature_revealed"
        }
      },
      {
        "text": "",
        "next": "act3_aftermath",
        "condition": {
          "flag": "vault_defense_held"
        },
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "aftermath_visited",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act3_vault_siege": {
    "id": "act3_vault_siege",
    "ambientSound": "sounds/ambient/server_room_alarm.ogg",
    "musicCue": "danger",
    "soundEffect": "notify",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "complete_quest",
    "choices": [
      {
        "text": "",
        "next": "act3_hide_network",
        "condition": {
          "minSkill": {
            "coding": 4
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
            "value": -20
          },
          {
            "type": "setFlag",
            "flag": "vault_firewall_deployed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_defense_held",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_hide_network",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "vault_counterattack",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_firewall_deployed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_defense_held",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_hide_network",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_8"
          },
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "poem_shield_used",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_firewall_deployed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_defense_held",
            "flagValue": true
          }
        ],
        "condition": {
          "flag": "read_poem_1"
        }
      }
    ]
  },
  "act3_aftermath": {
    "id": "act3_aftermath",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "act3_prepare_counter",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "ready_for_infiltration",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_prepare_counter",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -10
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
        "next": "act3_prepare_counter",
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
            "type": "collectPoem",
            "poemId": "poem_15"
          }
        ]
      }
    ]
  },
  "act3_hide_network": {
    "id": "act3_hide_network",
    "ambientSound": "sounds/ambient/bunker_hum.ogg",
    "speaker": "Виктория",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "setFlag",
        "flag": "network_hidden",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "tolpa_act3_hide_sync",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "factory_unlocked",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act3_prepare_counter",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "offensive_strategy",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_prepare_counter",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
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
        "next": "act3_prepare_counter",
        "condition": {
          "flag": "tolpa_member"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "tolpa_sanctuary_offered",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "tolpa_act3_sanctuary"
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "chk_ru",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      },
      {
        "text": "",
        "next": "poem_virus_truth",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          }
        ]
      }
    ]
  },
  "poem_virus_truth": {
    "id": "poem_virus_truth",
    "ambientSound": "sounds/ambient/digital_pulse.ogg",
    "speaker": "narrator",
    "sceneId": "office_day",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "choices": [
      {
        "text": "",
        "next": "act3_prepare_counter",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 3
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "poem_virus_revealed",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_prepare_counter",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "poem_virus_revealed",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "npc_maria",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      }
    ]
  },
  "act3_prepare_counter": {
    "id": "act3_prepare_counter",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act3_dmitry_briefing",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "counter_plan_ready",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act3_dmitry_briefing",
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
      }
    ]
  },
  "act3_dmitry_briefing": {
    "id": "act3_dmitry_briefing",
    "soundEffect": "notify",
    "speaker": "Дмитрий",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "office_dmitry",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act3_decision_point",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "dmitry_briefing_complete",
            "flagValue": true
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -5
          }
        ]
      }
    ]
  },
  "act3_decision_point": {
    "id": "act3_decision_point",
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
        "next": "act4_transition",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "chose_creator_path",
            "flagValue": true
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "act3_path_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "minKarma": 60,
          "minSkill": {
            "writing": 7
          },
          "missingFlag": "act3_path_chosen"
        }
      },
      {
        "text": "",
        "next": "act4_transition",
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "chose_rebel_path",
            "flagValue": true
          },
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "act3_path_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "minKarma": 60,
          "minSkill": {
            "persuasion": 7
          },
          "missingFlag": "act3_path_chosen"
        }
      },
      {
        "text": "",
        "next": "act4_transition",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "chose_machine_path",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "act3_path_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "coding": 8
          },
          "flag": "low_empathy",
          "missingFlag": "act3_path_chosen"
        }
      },
      {
        "text": "",
        "next": "act4_transition",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "chose_exile_path",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "act3_path_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "maxKarma": 40,
          "missingFlag": "act3_path_chosen"
        }
      },
      {
        "text": "",
        "next": "act4_transition",
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "chose_poet_path",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "act3_path_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "flag": "all_poems_collected",
          "missingFlag": "act3_path_chosen"
        }
      },
      {
        "text": "",
        "next": "act4_transition",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "chose_public_path",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "act3_path_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "missingFlag": "act3_path_chosen"
        }
      },
      {
        "text": "",
        "next": "act4_infiltration_prep",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "chose_stealth_path",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "ready_for_infiltration",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "act3_path_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "missingFlag": "act3_path_chosen"
        }
      }
    ]
  }
} as Record<string, StoryNodeStructure>;
