import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT6_STRUCTURE: Record<string, StoryNodeStructure> = {
  "act6_bridge": {
    "id": "act6_bridge",
    "ambientSound": "sounds/ambient/room_morning.ogg",
    "proceduralAmbientOverride": "home",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act6_factory_investigation",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "act5_complete_time",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "traitor_in_the_guild"
          }
        ]
      },
      {
        "text": "",
        "next": "act6_maria_warning",
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
  "act6_maria_warning": {
    "id": "act6_maria_warning",
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "proceduralAmbientOverride": "street",
    "speaker": "Виктория",
    "sceneId": "street_night",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act6_factory_investigation",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "triggerQuest",
            "questId": "traitor_in_the_guild"
          }
        ]
      }
    ]
  },
  "act6_factory_investigation": {
    "id": "act6_factory_investigation",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "proceduralAmbientOverride": "factory",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "complete_quest",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_act6_01"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_traitor_discovery",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "alexander_logs_decrypted",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act6_zeka_encounter",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          }
        ]
      }
    ]
  },
  "act6_zeka_encounter": {
    "id": "act6_zeka_encounter",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "proceduralAmbientOverride": "factory",
    "speaker": "Жека",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_zheka",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act6_zeka_story"
      },
      {
        "text": "",
        "next": "act6_zeka_trust_test"
      }
    ]
  },
  "act6_zeka_story": {
    "id": "act6_zeka_story",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "proceduralAmbientOverride": "factory",
    "speaker": "Жека",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "act6_traitor_revealed",
        "effects": [
          {
            "type": "setFlag",
            "flag": "zeka_trusted",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act6_zeka_nadzor_origin",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          }
        ]
      }
    ]
  },
  "act6_zeka_trust_test": {
    "id": "act6_zeka_trust_test",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "proceduralAmbientOverride": "factory",
    "speaker": "Жека",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "act6_zeka_story",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "zeka_trusted",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "npc_zheka",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      }
    ]
  },
  "act6_zeka_nadzor_origin": {
    "id": "act6_zeka_nadzor_origin",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "proceduralAmbientOverride": "factory",
    "speaker": "Жека",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "act6_traitor_revealed",
        "effects": [
          {
            "type": "addKarma",
            "value": 2
          }
        ]
      }
    ]
  },
  "act6_traitor_discovery": {
    "id": "act6_traitor_discovery",
    "ambientSound": "sounds/ambient/digital_pulse.ogg",
    "proceduralAmbientOverride": "factory",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_dmitry",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act6_traitor_revealed",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "traitor_identity_known",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act6_traitor_revealed": {
    "id": "act6_traitor_revealed",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "proceduralAmbientOverride": "factory",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_dmitry",
    "guidanceObjectiveType": "visit_location",
    "effects": [
      {
        "type": "setFlag",
        "flag": "traitor_revealed",
        "flagValue": true
      },
      {
        "type": "collectPoem",
        "poemId": "poem_act6_03"
      },
      {
        "type": "collectPoem",
        "poemId": "poem_act6_05"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_office_confrontation",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 2
          }
        ]
      },
      {
        "text": "",
        "next": "act6_office_confrontation",
        "effects": [
          {
            "type": "addKarma",
            "value": -3
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
  "act6_office_confrontation": {
    "id": "act6_office_confrontation",
    "ambientSound": "sounds/ambient/office_night.ogg",
    "proceduralAmbientOverride": "office",
    "speaker": "Дмитрий",
    "sceneId": "office_day",
    "guidanceNpcId": "npc_dmitry",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act6_dmitry_confession",
        "condition": {
          "flag": "dmitry_defected"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 3
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
        "next": "act6_dmitry_confession",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
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
        "next": "act6_dmitry_confession",
        "effects": [
          {
            "type": "addKarma",
            "value": -2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 8
          }
        ]
      }
    ]
  },
  "act6_dmitry_confession": {
    "id": "act6_dmitry_confession",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/office_night.ogg",
    "proceduralAmbientOverride": "office",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "Дмитрий",
    "sceneId": "office_day",
    "guidanceNpcId": "npc_dmitry",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act6_alliance_formed",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "dmitry_forgiven",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -10
          },
          {
            "type": "collectPoem",
            "poemId": "poem_25"
          },
          {
            "type": "npcChange",
            "npcId": "npc_dmitry",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act6_dmitry_exiled",
        "effects": [
          {
            "type": "setFlag",
            "flag": "dmitry_exiled",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 2
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
  "act6_alliance_formed": {
    "id": "act6_alliance_formed",
    "ambientSound": "sounds/ambient/office_night.ogg",
    "proceduralAmbientOverride": "office",
    "speaker": "Дмитрий",
    "sceneId": "office_day",
    "guidanceNpcId": "npc_maxim",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act6_resistance_formed",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "traitor_fate_decided",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "underground_resistance"
          }
        ]
      }
    ]
  },
  "act6_dmitry_exiled": {
    "id": "act6_dmitry_exiled",
    "ambientSound": "sounds/ambient/office_night.ogg",
    "proceduralAmbientOverride": "office",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "office_day",
    "choices": [
      {
        "text": "",
        "next": "act6_resistance_formed",
        "effects": [
          {
            "type": "setFlag",
            "flag": "traitor_fate_decided",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "underground_resistance"
          },
          {
            "type": "addItem",
            "itemId": "dmitry_data_chip",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          }
        ]
      }
    ]
  },
  "act6_resistance_formed": {
    "id": "act6_resistance_formed",
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "proceduralAmbientOverride": "street",
    "speaker": "Максим",
    "sceneId": "street_night",
    "guidanceNpcId": "npc_maxim",
    "guidanceObjectiveType": "talk_to_npc",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_act6_04"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_resistance_briefing"
      },
      {
        "text": "",
        "next": "act6_resistance_briefing",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          }
        ]
      }
    ]
  },
  "act6_resistance_briefing": {
    "id": "act6_resistance_briefing",
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "proceduralAmbientOverride": "street",
    "speaker": "Аня",
    "sceneId": "street_night",
    "guidanceNpcId": "npc_anya",
    "guidanceObjectiveType": "complete_quest",
    "choices": [
      {
        "text": "",
        "next": "act6_data_heist_planning",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "resistance_joined",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "data_heist"
          }
        ]
      },
      {
        "text": "",
        "next": "resistance_bunker_hub",
        "condition": {
          "flag": "zeka_trusted"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "resistance_joined",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "resistance_bunker_found",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act6_data_heist_planning": {
    "id": "act6_data_heist_planning",
    "ambientSound": "sounds/ambient/cafe_evening_jazz.ogg",
    "proceduralAmbientOverride": "cafe",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "effects": [
      {
        "type": "setFlag",
        "flag": "three_defectors_recruited",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_heist_execution",
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
        "next": "act6_heist_execution",
        "goldenPath": true,
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
  "act6_heist_execution": {
    "id": "act6_heist_execution",
    "ambientSound": "sounds/ambient/corridor_alarm.ogg",
    "proceduralAmbientOverride": "corridor",
    "musicCue": "tension",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "office_day",
    "guidanceObjectiveType": "complete_quest",
    "effects": [
      {
        "type": "setFlag",
        "flag": "act6_heist_planned",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_heist_success",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "mainframe_hacked",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "blackmail_data_downloaded",
            "flagValue": true
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -15
          }
        ]
      }
    ]
  },
  "act6_heist_success": {
    "id": "act6_heist_success",
    "ambientSound": "sounds/ambient/corridor_alarm.ogg",
    "proceduralAmbientOverride": "corridor",
    "musicCue": "danger",
    "speaker": "narrator",
    "sceneId": "volodka_corridor",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act6_escape_success",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "data_heist_completed",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "system_infiltration"
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 12
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -10
          }
        ]
      }
    ]
  },
  "act6_escape_success": {
    "id": "act6_escape_success",
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "proceduralAmbientOverride": "street",
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceObjectiveType": "complete_quest",
    "choices": [
      {
        "text": "",
        "next": "act6_nadzor_revealed",
        "goldenPath": true,
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
  "act6_nadzor_revealed": {
    "id": "act6_nadzor_revealed",
    "ambientSound": "sounds/ambient/digital_pulse.ogg",
    "proceduralAmbientOverride": "factory",
    "speaker": "Жека",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act6_infiltration_prep",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "nadzor_truth_revealed",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 3
          }
        ]
      }
    ]
  },
  "act6_infiltration_prep": {
    "id": "act6_infiltration_prep",
    "ambientSound": "sounds/ambient/bunker_hum.ogg",
    "proceduralAmbientOverride": "basement",
    "speaker": "Максим",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_maxim",
    "guidanceObjectiveType": "visit_location",
    "autoSave": true,
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_act6_02"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_nadzor_battle",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "nadzor_entry_found",
            "flagValue": true
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 8
          }
        ]
      }
    ]
  },
  "act6_nadzor_battle": {
    "id": "act6_nadzor_battle",
    "ambientSound": "sounds/ambient/server_room_alarm.ogg",
    "proceduralAmbientOverride": "combat",
    "musicCue": "danger",
    "autoSave": true,
    "speaker": "Хранитель «Надзора»",
    "sceneId": "battle",
    "guidanceObjectiveType": "complete_quest",
    "choices": [
      {
        "text": "",
        "next": "act6_battle_victory",
        "goldenPath": true,
        "effects": [
          {
            "type": "combat",
            "enemyType": "nexus_guardian"
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 15
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -20
          }
        ]
      }
    ]
  },
  "act6_battle_victory": {
    "id": "act6_battle_victory",
    "ambientSound": "sounds/ambient/server_room_hum.ogg",
    "proceduralAmbientOverride": "basement",
    "speaker": "Система «Надзор»",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act6_core_choice",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "nadzor_core_accessed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "nadzor_infiltrated",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "nadzor_guardian_defeated",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act6_core_choice",
        "effects": [
          {
            "type": "setFlag",
            "flag": "nadzor_core_accessed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "nadzor_guardian_defeated",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 5
          }
        ]
      }
    ]
  },
  "act6_core_choice": {
    "id": "act6_core_choice",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/digital_pulse.ogg",
    "proceduralAmbientOverride": "basement",
    "musicCue": "discovery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "visit_location",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_26"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_rooftop_showdown",
        "goldenPath": true,
        "effects": [
          {
            "type": "triggerQuest",
            "questId": "rooftop_confrontation"
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
  "act6_rooftop_showdown": {
    "id": "act6_rooftop_showdown",
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "proceduralAmbientOverride": "rooftop",
    "musicCue": "tension",
    "speaker": "Тень «Надзора»",
    "sceneId": "factory_roof",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_act6_06"
      },
      {
        "type": "setFlag",
        "flag": "act6_infiltration_ready",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act6_final_confrontation",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "rooftop_entity_met",
            "flagValue": true
          },
          {
            "type": "combat",
            "enemyType": "void_echo"
          },
          {
            "type": "addKarma",
            "value": 5
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
        "next": "act6_final_confrontation",
        "effects": [
          {
            "type": "setFlag",
            "flag": "rooftop_entity_met",
            "flagValue": true
          },
          {
            "type": "combat",
            "enemyType": "void_echo"
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 12
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -10
          }
        ]
      }
    ]
  },
  "act6_final_confrontation": {
    "id": "act6_final_confrontation",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "proceduralAmbientOverride": "rooftop",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "Тень «Надзора»",
    "sceneId": "factory_roof",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_act6_07"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act7_bridge",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "act6_final_choice_made",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "rooftop_confrontation_done",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "rooftop_battle_won",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "chose_guardian_path",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -15
          },
          {
            "type": "triggerQuest",
            "questId": "rebuild_the_guild"
          }
        ],
        "condition": {
          "missingFlag": "act6_final_choice_made"
        }
      },
      {
        "text": "",
        "next": "act7_bridge",
        "effects": [
          {
            "type": "setFlag",
            "flag": "act6_final_choice_made",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "rooftop_confrontation_done",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "rooftop_battle_won",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "chose_liberator_path",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 15
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -20
          },
          {
            "type": "triggerQuest",
            "questId": "rebuild_the_guild"
          }
        ],
        "condition": {
          "missingFlag": "act6_final_choice_made"
        }
      }
    ]
  }
} as Record<string, StoryNodeStructure>;
