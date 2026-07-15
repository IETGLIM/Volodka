import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT4_STRUCTURE: Record<string, StoryNodeStructure> = {
  "act4_transition": {
    "id": "act4_transition",
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act4_infiltration_prep",
        "condition": {
          "flag": "chose_stealth_path"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "act4_started",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_infiltration_prep",
        "condition": {
          "flag": "ready_for_infiltration"
        },
        "effects": [
          {
            "type": "setFlag",
            "flag": "act4_started",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "vera_inspiration",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "act4_started",
            "flagValue": true
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": 10
          }
        ]
      },
      {
        "text": "",
        "next": "vera_inspiration",
        "effects": [
          {
            "type": "setFlag",
            "flag": "act4_started",
            "flagValue": true
          },
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 1
          }
        ]
      }
    ]
  },
  "vera_inspiration": {
    "id": "vera_inspiration",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "choices": [
      {
        "text": "",
        "next": "act4_public_leader",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_12"
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          }
        ]
      },
      {
        "text": "",
        "next": "act4_public_leader",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_12"
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "npcChange",
            "npcId": "solnysh",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      }
    ]
  },
  "act4_public_leader": {
    "id": "act4_public_leader",
    "ambientSound": "sounds/ambient/street_morning.ogg",
    "speaker": "narrator",
    "sceneId": "city_square",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act4_peaceful_march",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "public_speech_done",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_peaceful_march",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "public_speech_done",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act4_peaceful_march": {
    "id": "act4_peaceful_march",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/crowd_march.ogg",
    "musicCue": "emotional",
    "soundEffect": "notify",
    "proceduralAmbientOverride": "street",
    "speaker": "narrator",
    "sceneId": "city_square",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act4_march_continues",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
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
        "next": "act4_infiltration_prep",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "small_team_approach",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act4_march_continues": {
    "id": "act4_march_continues",
    "ambientSound": "sounds/ambient/crowd_march.ogg",
    "proceduralAmbientOverride": "street",
    "speaker": "narrator",
    "sceneId": "city_square",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act4_infiltration_prep",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "addKarma",
            "value": 3
          }
        ]
      },
      {
        "text": "",
        "next": "act4_infiltration_prep",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "maria_digital_entry",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act4_infiltration_prep": {
    "id": "act4_infiltration_prep",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_dmitry",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "setFlag",
        "flag": "act4_started",
        "flagValue": true
      },
      {
        "type": "triggerQuest",
        "questId": "guild_infiltration"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_infiltration_inside",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "npcChange",
            "npcId": "npc_dmitry",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "setFlag",
            "flag": "dmitry_as_ally",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_ally_found",
            "flagValue": true
          }
        ],
        "condition": {
          "flag": "dmitry_defected"
        }
      },
      {
        "text": "",
        "next": "act4_infiltration_inside",
        "condition": {
          "flag": "colleague_help_access"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "npcChange",
            "npcId": "npc_colleague",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "setFlag",
            "flag": "colleague_as_ally",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_ally_found",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_infiltration_inside",
        "condition": {
          "flag": "tolpa_honorary_chekist"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "tolpa_stalker_route",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_ally_found",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "tolpa_act4_exfiltration"
          },
          {
            "type": "npcChange",
            "npcId": "npc_chk_stalker",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act4_infiltration_inside",
        "condition": {
          "flag": "tolpa_stalker_route"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "guild_ally_found",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_infiltration_inside",
        "condition": {
          "flag": "dmitry_defected"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "dmitry_as_ally",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_ally_found",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_infiltration_inside",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "addSkill",
            "skill": "intuition",
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
        "next": "act4_quiet_hour",
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
  "act4_quiet_rooftop_dmitry": {
    "id": "act4_quiet_rooftop_dmitry",
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "effects": [
      {
        "type": "setFlag",
        "flag": "quiet_rooftop_dmitry",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_quiet_hour",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -5
          },
          {
            "type": "npcChange",
            "npcId": "npc_dmitry",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      }
    ]
  },
  "act4_quiet_tea_zarema": {
    "id": "act4_quiet_tea_zarema",
    "ambientSound": "sounds/ambient/kitchen_evening.ogg",
    "speaker": "Зарема",
    "sceneId": "home_evening",
    "effects": [
      {
        "type": "setFlag",
        "flag": "quiet_tea_zarema",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_quiet_hour",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -8
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": 5
          },
          {
            "type": "npcChange",
            "npcId": "npc_zarema",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      }
    ]
  },
  "act4_quiet_albert_message": {
    "id": "act4_quiet_albert_message",
    "speaker": "Альберт",
    "sceneId": "abandoned_factory",
    "effects": [
      {
        "type": "setFlag",
        "flag": "quiet_albert_message",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_quiet_hour",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -5
          },
          {
            "type": "npcChange",
            "npcId": "npc_barista",
            "npcChange": {
              "relation": 3
            }
          }
        ]
      }
    ]
  },
  "act4_quiet_openspace_window": {
    "id": "act4_quiet_openspace_window",
    "ambientSound": "sounds/ambient/office_night.ogg",
    "speaker": "narrator",
    "sceneId": "office_day",
    "effects": [
      {
        "type": "setFlag",
        "flag": "quiet_openspace_window",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_quiet_hour",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -5
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          }
        ]
      }
    ]
  },
  "act4_quiet_first_poem": {
    "id": "act4_quiet_first_poem",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "effects": [
      {
        "type": "setFlag",
        "flag": "quiet_first_poem",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_quiet_hour",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -5
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 1
          },
          {
            "type": "collectPoem",
            "poemId": "poem_1"
          }
        ]
      }
    ]
  },
  "act4_infiltration_inside": {
    "id": "act4_infiltration_inside",
    "ambientSound": "sounds/ambient/server_room_hum.ogg",
    "musicCue": "tension",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "office_day",
    "guidanceObjectiveType": "visit_location",
    "effects": [
      {
        "type": "setFlag",
        "flag": "guild_ally_found",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "guild_purity_protocol",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_core_server",
        "goldenPath": true,
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 8
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -15
          },
          {
            "type": "combat",
            "enemyType": "system_daemon"
          },
          {
            "type": "setFlag",
            "flag": "guild_core_accessed",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_core_server",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "tech_corridor_used",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_core_accessed",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "coding": 7
          }
        }
      },
      {
        "text": "",
        "next": "act4_core_server",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "guild_evidence_downloaded",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_core_accessed",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_core_server",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "poem_bypassed_security",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_core_accessed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_evidence_downloaded",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "writing": 6,
            "coding": 5
          }
        }
      }
    ]
  },
  "act4_core_server": {
    "id": "act4_core_server",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/server_room_alarm.ogg",
    "musicCue": "danger",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "office_day",
    "guidanceObjectiveType": "complete_quest",
    "choices": [
      {
        "text": "",
        "next": "act4_protocol_disabled",
        "goldenPath": true,
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
            "flag": "protocol_disable_started",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_protocol_disabled",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "vault_data_copied",
            "flagValue": true
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -15
          }
        ],
        "condition": {
          "minSkill": {
            "coding": 6
          }
        }
      },
      {
        "text": "",
        "next": "act4_protocol_disabled",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 3
          },
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "downloaded_all_poems",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "all_poems_collected",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "protocol_disable_started",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_protocol_disabled",
        "effects": [
          {
            "type": "addKarma",
            "value": 12
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "freed_living_poems",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "all_poems_collected",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "protocol_disable_started",
            "flagValue": true
          }
        ],
        "condition": {
          "minKarma": 60
        }
      },
      {
        "text": "",
        "next": "act4_protocol_disabled",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 4
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 15
          },
          {
            "type": "setFlag",
            "flag": "panopticon_destroyed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "protocol_disable_started",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "coding": 8
          }
        }
      }
    ]
  },
  "act4_protocol_disabled": {
    "id": "act4_protocol_disabled",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "musicCue": "discovery",
    "soundEffect": "quest_complete",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "office_day",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act4_escape",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "protocol_disabled",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_evidence_downloaded",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_broadcast_prep",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "protocol_disabled",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "guild_evidence_downloaded",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "broadcast_from_core",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act4_escape": {
    "id": "act4_escape",
    "ambientSound": "sounds/ambient/corridor_alarm.ogg",
    "musicCue": "danger",
    "guidanceObjectiveType": "visit_location",
    "speaker": "narrator",
    "sceneId": "office_day",
    "choices": [
      {
        "text": "",
        "next": "act4_broadcast_prep",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 15
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -20
          },
          {
            "type": "combat",
            "enemyType": "shadow_agent"
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "escaped_guild_hq",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_broadcast_prep",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "addStat",
            "stat": "energy",
            "value": -10
          },
          {
            "type": "setFlag",
            "flag": "escaped_guild_hq",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act4_broadcast_prep": {
    "id": "act4_broadcast_prep",
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "autoSave": true,
    "speaker": "Виктория",
    "sceneId": "rooftop_edge",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_21"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_broadcast_execute",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "broadcast_ready",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_broadcast_execute",
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 2
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "broadcast_ready",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act4_rooftop_broadcast": {
    "id": "act4_rooftop_broadcast",
    "speaker": "Виктория",
    "sceneId": "rooftop_edge",
    "choices": [
      {
        "text": "",
        "next": "act4_broadcast_prep",
        "effects": [
          {
            "type": "setFlag",
            "flag": "broadcast_ready",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act4_broadcast_execute": {
    "id": "act4_broadcast_execute",
    "karmaThresholds": {
      "high": 65,
      "low": 30
    },
    "ambientSound": "sounds/ambient/city_broadcast.ogg",
    "musicCue": "emotional",
    "soundEffect": "quest_complete",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "guidanceObjectiveType": "collect_item",
    "effects": [
      {
        "type": "setFlag",
        "flag": "broadcast_hacked",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "poetry_transmitted",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "poetry_broadcast_sent",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "all_poems_collected",
        "flagValue": true
      },
      {
        "type": "triggerQuest",
        "questId": "poetry_broadcast"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_broadcast_aftermath",
        "effects": [
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
            "flag": "all_poems_collected",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act4_broadcast_aftermath",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": 5
          }
        ]
      },
      {
        "text": "",
        "next": "act4_broadcast_aftermath",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 20
          },
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 5
          },
          {
            "type": "collectPoem",
            "poemId": "poem_22"
          },
          {
            "type": "setFlag",
            "flag": "volodka_personal_broadcast",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "writing": 8
          },
          "minKarma": 65
        }
      }
    ]
  },
  "act4_broadcast_aftermath": {
    "id": "act4_broadcast_aftermath",
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "musicCue": "emotional",
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act5_dawn",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "seeking_reconciliation",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act5_dawn",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "seeking_victory",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act5_dawn",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -10
          },
          {
            "type": "setFlag",
            "flag": "seeking_exit",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act5_dawn": {
    "id": "act5_dawn",
    "ambientSound": "sounds/ambient/rooftop_wind.ogg",
    "musicCue": "mystery",
    "speaker": "narrator",
    "sceneId": "rooftop_edge",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "setFlag",
        "flag": "act5_started",
        "flagValue": true
      },
      {
        "type": "triggerQuest",
        "questId": "final_code"
      },
      {
        "type": "triggerQuest",
        "questId": "night_before_dawn"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act4_final_choice",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
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
        "next": "act4_final_choice",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 2
          }
        ]
      },
      {
        "text": "",
        "next": "act4_final_choice",
        "effects": [
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
        "next": "act4_final_choice",
        "condition": {
          "flag": "tolpa_honorary_chekist"
        },
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "triggerQuest",
            "questId": "tolpa_act4_broadcast"
          }
        ]
      }
    ]
  },
  "act4_final_choice": {
    "id": "act4_final_choice",
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
        "next": "act5_peaceful_path",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "creator_chosen",
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
        "next": "act5_revolution_path",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "revolution_chosen",
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
        "next": "act5_exile_path",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 10
          },
          {
            "type": "setFlag",
            "flag": "exile_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "maxKarma": 40
        }
      },
      {
        "text": "",
        "next": "act5_revolution_path",
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "machine_chosen",
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
        "next": "act5_poet_path",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "poet_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "flag": "all_poems_collected"
        }
      },
      {
        "text": "",
        "next": "act5_peaceful_path",
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "peace_chosen",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act5_ending_sacrifice",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 2
          },
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "sacrifice_chosen",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "coding": 7,
            "writing": 7
          }
        }
      }
    ]
  }
} as Record<string, StoryNodeStructure>;
