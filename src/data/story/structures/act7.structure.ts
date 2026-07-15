import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT7_STRUCTURE: Record<string, StoryNodeStructure> = {
  "act7_bridge": {
    "id": "act7_bridge",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act7_guild_rebuilding",
        "goldenPath": true,
        "effects": [
          {
            "type": "triggerQuest",
            "questId": "rebuild_the_guild"
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
  "act7_guild_rebuilding": {
    "id": "act7_guild_rebuilding",
    "ambientSound": "sounds/ambient/cafe_evening_jazz.ogg",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act7_charter_drafting",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          }
        ]
      },
      {
        "text": "",
        "next": "act7_community_voice",
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 3
          },
          {
            "type": "npcChange",
            "npcId": "npc_alina",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      }
    ]
  },
  "act7_charter_drafting": {
    "id": "act7_charter_drafting",
    "speaker": "Сергей",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_sergey",
    "guidanceObjectiveType": "complete_quest",
    "choices": [
      {
        "text": "",
        "next": "act7_library_archive",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "new_council_elected",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "npcChange",
            "npcId": "npc_sergey",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      }
    ]
  },
  "act7_community_voice": {
    "id": "act7_community_voice",
    "speaker": "Алина",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "kate",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act7_library_archive",
        "effects": [
          {
            "type": "setFlag",
            "flag": "new_council_elected",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "npc_alina",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      }
    ]
  },
  "act7_library_archive": {
    "id": "act7_library_archive",
    "ambientSound": "sounds/ambient/library_hush.ogg",
    "musicCue": "discovery",
    "autoSave": true,
    "speaker": "Катя",
    "sceneId": "library_day",
    "guidanceNpcId": "kate",
    "guidanceObjectiveType": "complete_quest",
    "choices": [
      {
        "text": "",
        "next": "act7_guild_restored",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "guild_restored",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "triggerQuest",
            "questId": "system_takedown"
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
  "act7_guild_restored": {
    "id": "act7_guild_restored",
    "speaker": "Максим",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_maxim",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act7_system_shutdown",
        "goldenPath": true,
        "effects": [
          {
            "type": "triggerQuest",
            "questId": "system_takedown"
          },
          {
            "type": "npcChange",
            "npcId": "npc_maxim",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      }
    ]
  },
  "act7_system_shutdown": {
    "id": "act7_system_shutdown",
    "ambientSound": "sounds/ambient/bunker_hum.ogg",
    "musicCue": "tension",
    "speaker": "Жека",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_zheka",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act7_core_battle",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "path_to_core_cleared",
            "flagValue": true
          },
          {
            "type": "combat",
            "enemyType": "nexus_guardian"
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 12
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
  "act7_core_battle": {
    "id": "act7_core_battle",
    "ambientSound": "sounds/ambient/server_room_hum.ogg",
    "autoSave": true,
    "speaker": "Жека",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act7_nadzor_dies",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "nadzor_shutdown_complete",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "core_defenses_disabled",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 15
          },
          {
            "type": "triggerQuest",
            "questId": "final_poem"
          }
        ]
      }
    ]
  },
  "act7_nadzor_dies": {
    "id": "act7_nadzor_dies",
    "ambientSound": "sounds/ambient/digital_pulse.ogg",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "Жека",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act7_final_poem_creation",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "nadzor_destroyed",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "final_poem"
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -15
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": 10
          }
        ]
      }
    ]
  },
  "act7_final_poem_creation": {
    "id": "act7_final_poem_creation",
    "ambientSound": "sounds/ambient/park_morning.ogg",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "park_day",
    "guidanceObjectiveType": "collect_item",
    "choices": [
      {
        "text": "",
        "next": "act7_poem_written",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "journey_reflected",
            "flagValue": true
          },
          {
            "type": "collectPoem",
            "poemId": "poem_29"
          },
          {
            "type": "collectPoem",
            "poemId": "poem_act7_01"
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
  "act7_poem_written": {
    "id": "act7_poem_written",
    "speaker": "narrator",
    "sceneId": "park_day",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act7_rooftop_recital",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "final_poem_written",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act7_rooftop_recital": {
    "id": "act7_rooftop_recital",
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
        "next": "act7_poem_published",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "final_poem_published",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "triggerQuest",
            "questId": "volodka_legacy"
          }
        ]
      }
    ]
  },
  "act7_poem_published": {
    "id": "act7_poem_published",
    "ambientSound": "sounds/ambient/city_broadcast.ogg",
    "musicCue": "emotional",
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act7_legacy_walk",
        "goldenPath": true,
        "effects": [
          {
            "type": "triggerQuest",
            "questId": "volodka_legacy"
          },
          {
            "type": "collectPoem",
            "poemId": "poem_27"
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -8
          }
        ]
      }
    ]
  },
  "act7_legacy_walk": {
    "id": "act7_legacy_walk",
    "ambientSound": "sounds/ambient/room_morning.ogg",
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "guidanceObjectiveType": "visit_location",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_act6_08"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act7_goodbye_zarema",
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
  "act7_goodbye_zarema": {
    "id": "act7_goodbye_zarema",
    "ambientSound": "sounds/ambient/kitchen_evening.ogg",
    "speaker": "Зарема",
    "sceneId": "home_evening",
    "guidanceNpcId": "npc_zarema",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act7_final_walk",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "npc_zarema",
            "npcChange": {
              "relation": 10
            }
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
  "act7_final_walk": {
    "id": "act7_final_walk",
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "speaker": "Виктория",
    "sceneId": "street_night",
    "guidanceNpcId": "npc_viktoria",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act7_maria_future",
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 2
          },
          {
            "type": "npcChange",
            "npcId": "npc_viktoria",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act7_maria_future",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "npcChange",
            "npcId": "npc_viktoria",
            "npcChange": {
              "relation": 8
            }
          }
        ]
      }
    ]
  },
  "act7_maria_future": {
    "id": "act7_maria_future",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "autoSave": true,
    "speaker": "Виктория",
    "sceneId": "street_night",
    "guidanceNpcId": "npc_viktoria",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act7_ending_poet_legacy",
        "condition": {
          "flag": "poet_chosen"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 12
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_guardian",
        "condition": {
          "flag": "creator_chosen"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 12
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_wanderer",
        "condition": {
          "flag": "revolution_chosen"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 8
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_wanderer",
        "condition": {
          "flag": "exile_chosen"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 5
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_guardian",
        "condition": {
          "flag": "machine_chosen"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 8
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_poet_legacy",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_guardian",
        "condition": {
          "flag": "chose_guardian_path"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 12
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_guardian",
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_wanderer",
        "condition": {
          "flag": "chose_liberator_path"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 5
          }
        ]
      },
      {
        "text": "",
        "next": "act7_ending_wanderer",
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_future_chosen",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act7_ending_poet_legacy": {
    "id": "act7_ending_poet_legacy",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "ambientSound": "sounds/ambient/cafe_evening_jazz.ogg",
    "musicCue": "discovery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act7_true_end",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_legacy_complete",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "ending_true_poet",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 15
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
        "next": "act7_poet_legacy_mirror",
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_legacy_complete",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "ending_true_poet",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 15
          }
        ]
      }
    ]
  },
  "act7_poet_legacy_mirror": {
    "id": "act7_poet_legacy_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "choices": [
      {
        "text": "",
        "next": "act7_true_end",
        "condition": {
          "flag": "creator_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "revolution_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "exile_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "machine_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "peace_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "poet_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "sacrifice_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "heard_machine_confession"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "tolpa_honorary_chekist"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "zarya_freed"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "zarya_shutdown"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "final_poem_read"
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
        "next": "act7_true_end",
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
        "next": "act7_true_end",
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
        "next": "act7_true_end",
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
        "next": "act7_true_end",
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
        "next": "act7_true_end"
      }
    ]
  },
  "act7_ending_guardian": {
    "id": "act7_ending_guardian",
    "karmaThresholds": {
      "high": 70,
      "low": 35
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
        "next": "act7_true_end",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_legacy_complete",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "ending_true_guardian",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 15
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
        "next": "act7_guardian_legacy_mirror",
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_legacy_complete",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "ending_true_guardian",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 15
          }
        ]
      }
    ]
  },
  "act7_guardian_legacy_mirror": {
    "id": "act7_guardian_legacy_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "library_day",
    "choices": [
      {
        "text": "",
        "next": "act7_true_end",
        "condition": {
          "flag": "creator_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "machine_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "chose_guardian_path"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "guild_restored"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "dmitry_forgiven"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "dmitry_exiled"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "tolpa_honorary_chekist"
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
        "next": "act7_true_end"
      }
    ]
  },
  "act7_ending_wanderer": {
    "id": "act7_ending_wanderer",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "ambientSound": "sounds/ambient/street_winter_wind.ogg",
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_winter",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act7_true_end",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_legacy_complete",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "ending_true_wanderer",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -20
          }
        ]
      },
      {
        "text": "",
        "next": "act7_wanderer_legacy_mirror",
        "effects": [
          {
            "type": "setFlag",
            "flag": "volodka_legacy_complete",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "ending_true_wanderer",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 10
          }
        ]
      }
    ]
  },
  "act7_wanderer_legacy_mirror": {
    "id": "act7_wanderer_legacy_mirror",
    "guidanceObjectiveType": "make_choice",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_winter",
    "choices": [
      {
        "text": "",
        "next": "act7_true_end",
        "condition": {
          "flag": "exile_chosen"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "chose_liberator_path"
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
        "next": "act7_true_end",
        "condition": {
          "flag": "revolution_chosen"
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
        "next": "act7_true_end",
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
        "next": "act7_true_end",
        "condition": {
          "flag": "tolpa_honorary_chekist"
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
        "next": "act7_true_end"
      }
    ]
  },
  "act7_true_end": {
    "id": "act7_true_end",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "ambientSound": "sounds/ambient/room_sunset.ogg",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "volodka_room",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_act7_ending"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": null,
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "game_completed",
            "flagValue": true
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -20
          }
        ]
      }
    ]
  }
} as Record<string, StoryNodeStructure>;
