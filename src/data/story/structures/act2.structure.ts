import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT2_STRUCTURE: Record<string, StoryNodeStructure> = {
  "act2_transition": {
    "id": "act2_transition",
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act2_albert_hint",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "act2_started",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "advanced_to_act2",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_maria_search",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "act2_started",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "advanced_to_act2",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act2_albert_hint": {
    "id": "act2_albert_hint",
    "ambientSound": "sounds/ambient/cafe_jazz_quiet.ogg",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_albert",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act2_albert_network_hint",
        "goldenPath": true,
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
        "next": "act2_albert_pre_crash",
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
  "act2_albert_network_hint": {
    "id": "act2_albert_network_hint",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_albert",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act2_maria_search",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "albert_network_hint",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_maria_search",
        "effects": [
          {
            "type": "addKarma",
            "value": 2
          }
        ]
      }
    ]
  },
  "act2_albert_pre_crash": {
    "id": "act2_albert_pre_crash",
    "soundEffect": "item_use",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_albert",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act2_albert_network_hint",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 1
          },
          {
            "type": "collectPoem",
            "poemId": "poem_6"
          },
          {
            "type": "discoverLore",
            "loreId": "lore_poem_virus"
          }
        ]
      },
      {
        "text": "",
        "next": "act2_maria_search",
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
  "act2_maria_search": {
    "id": "act2_maria_search",
    "ambientSound": "sounds/ambient/street_night_rain.ogg",
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceObjectiveType": "talk_to_npc",
    "guidanceNpcId": "npc_maria",
    "choices": [
      {
        "text": "",
        "next": "maria_introduction",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act2_maria_explains_network",
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
  "act2_maria_explains_network": {
    "id": "act2_maria_explains_network",
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act2_maria_meeting_place",
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "network_willing",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_maria_meeting_place",
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": 3
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
  "act2_maria_meeting_place": {
    "id": "act2_maria_meeting_place",
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "addStat",
        "stat": "stress",
        "value": -5
      },
      {
        "type": "setFlag",
        "flag": "act2_maria_search_active",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act2_network_initiation",
        "goldenPath": true,
        "effects": [
          {
            "type": "setFlag",
            "flag": "recited_poem_initiation",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "triggerQuest",
            "questId": "network_initiation"
          }
        ],
        "condition": {
          "minKarma": 30
        }
      },
      {
        "text": "",
        "next": "act2_network_initiation",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "recited_poem_initiation",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "network_initiation"
          }
        ],
        "condition": {
          "flag": "accepted_maria_chip"
        }
      },
      {
        "text": "",
        "next": "act2_network_hesitation",
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
  "act2_network_hesitation": {
    "id": "act2_network_hesitation",
    "speaker": "narrator",
    "sceneId": "street_night",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "collectPoem",
        "poemId": "poem_28"
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act2_network_initiation",
        "effects": [
          {
            "type": "setFlag",
            "flag": "recited_poem_initiation",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "network_initiation"
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
        "next": "act2_cafe_reflection",
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 1
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
  "act2_cafe_reflection": {
    "id": "act2_cafe_reflection",
    "ambientSound": "sounds/ambient/cafe_jazz_quiet.ogg",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act2_network_initiation"
      },
      {
        "text": "",
        "next": "act2_barista_conversation",
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
        "next": "cafe_evening_end",
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
        "next": "library_entrance",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "act2_library_from_cafe",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act2_barista_conversation": {
    "id": "act2_barista_conversation",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_barista",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act2_barista_revealed",
        "effects": [
          {
            "type": "npcChange",
            "npcId": "cafe_barista",
            "npcChange": {
              "relation": 10
            }
          }
        ]
      },
      {
        "text": "",
        "next": "act2_network_initiation",
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
  "act2_barista_revealed": {
    "id": "act2_barista_revealed",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_barista",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act2_safehouse_agreed",
        "effects": [
          {
            "type": "setFlag",
            "flag": "cafe_safehouse_agreed",
            "flagValue": true
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "triggerQuest",
            "questId": "cafe_safehouse"
          }
        ]
      },
      {
        "text": "",
        "next": "act2_network_initiation",
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
        "next": "act2_barista_followup",
        "condition": {
          "flag": "network_joined"
        }
      }
    ]
  },
  "act2_barista_followup": {
    "id": "act2_barista_followup",
    "soundEffect": "ui_open",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_barista",
    "guidanceObjectiveType": "complete_quest",
    "choices": [
      {
        "text": "",
        "next": "act2_safehouse_terminal",
        "effects": [
          {
            "type": "setFlag",
            "flag": "cafe_safehouse_agreed",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "cafe_safehouse"
          }
        ]
      },
      {
        "text": "",
        "next": "act2_vault_revealed",
        "effects": [
          {
            "type": "npcChange",
            "npcId": "cafe_barista",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "addKarma",
            "value": 2
          }
        ]
      }
    ]
  },
  "act2_safehouse_agreed": {
    "id": "act2_safehouse_agreed",
    "soundEffect": "item_use",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "npc_barista",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "act2_safehouse_terminal",
        "goldenPath": true,
        "effects": [
          {
            "type": "addItem",
            "itemId": "vault_key_fragment",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "safehouse_terminal_installed",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_network_initiation",
        "effects": [
          {
            "type": "addKarma",
            "value": 2
          },
          {
            "type": "npcChange",
            "npcId": "cafe_barista",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      }
    ]
  },
  "act2_safehouse_terminal": {
    "id": "act2_safehouse_terminal",
    "ambientSound": "sounds/ambient/backroom_hum.ogg",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "collect_item",
    "choices": [
      {
        "text": "",
        "next": "act2_safehouse_message",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "secure_channel_tested",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_safehouse_message",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "safehouse_extra_security",
            "flagValue": true
          }
        ],
        "condition": {
          "minSkill": {
            "coding": 5
          }
        }
      }
    ]
  },
  "act2_safehouse_message": {
    "id": "act2_safehouse_message",
    "soundEffect": "notify",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act2_dmitry_contact",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "contacted_dmitry_network",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_network_initiation",
        "effects": [
          {
            "type": "addKarma",
            "value": 2
          }
        ]
      }
    ]
  },
  "act2_dmitry_contact": {
    "id": "act2_dmitry_contact",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "autoSave": true,
    "soundEffect": "notify",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceNpcId": "office_dmitry",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act2_dmitry_office_meeting",
        "goldenPath": true,
        "effects": [
          {
            "type": "triggerQuest",
            "questId": "dmitry_defection"
          },
          {
            "type": "setFlag",
            "flag": "dmitry_meeting_agreed",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_dmitry_office_meeting",
        "effects": [
          {
            "type": "triggerQuest",
            "questId": "dmitry_defection"
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "dmitry_caution",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act2_network_initiation": {
    "id": "act2_network_initiation",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act2_network_oath",
        "goldenPath": true,
        "condition": {
          "minKarma": 35,
          "minSkill": {
            "writing": 3
          }
        },
        "effects": [
          {
            "type": "addKarma",
            "value": 8
          },
          {
            "type": "setFlag",
            "flag": "network_oath_taken",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "network_joined",
            "flagValue": true
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
        "next": "act2_network_oath",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "network_joined",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "network_oath_refused",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "volunteer_read",
        "effects": [
          {
            "type": "addSkill",
            "skill": "writing",
            "value": 1
          },
          {
            "type": "addKarma",
            "value": 3
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
  "act2_network_oath": {
    "id": "act2_network_oath",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "musicCue": "emotional",
    "soundEffect": "quest_complete",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "setFlag",
        "flag": "act2_network_initiation",
        "flagValue": true
      },
      {
        "type": "setFlag",
        "flag": "seeking_guild_vault",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act2_vault_revealed",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "addItem",
            "itemId": "vault_key_fragment",
            "value": 1
          },
          {
            "type": "addItem",
            "itemId": "network_comm_key",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "reading_reaction",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 2
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 3
            }
          },
          {
            "type": "addItem",
            "itemId": "network_comm_key",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "act2_network_members",
        "condition": {
          "flag": "network_oath_taken"
        },
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
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
  "act2_network_members": {
    "id": "act2_network_members",
    "ambientSound": "sounds/ambient/underground_hum.ogg",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "reading_reaction",
        "effects": [
          {
            "type": "addSkill",
            "skill": "empathy",
            "value": 1
          },
          {
            "type": "addKarma",
            "value": 2
          }
        ]
      },
      {
        "text": "",
        "next": "reading_reaction",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "shared_poem_code_story",
            "flagValue": true
          },
          {
            "type": "collectPoem",
            "poemId": "poem_13"
          }
        ]
      },
      {
        "text": "",
        "next": "reading_reaction",
        "effects": [
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 1
          },
          {
            "type": "setFlag",
            "flag": "shared_poem_code_story",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "reading_reaction": {
    "id": "reading_reaction",
    "musicCue": "emotional",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "volunteer_read",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_7"
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 2
            }
          }
        ]
      },
      {
        "text": "",
        "next": "volunteer_read",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_7"
          },
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          }
        ]
      }
    ]
  },
  "volunteer_read": {
    "id": "volunteer_read",
    "musicCue": "emotional",
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act2_bridge",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_8"
          },
          {
            "type": "addSkill",
            "skill": "writing",
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
        "next": "act2_vault_revealed",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_8"
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
  "act2_bridge": {
    "id": "act2_bridge",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "ambientSound": "sounds/ambient/winter_bridge.ogg",
    "soundEffect": "notify",
    "speaker": "narrator",
    "sceneId": "street_winter",
    "guidanceObjectiveType": "collect_item",
    "choices": [
      {
        "text": "",
        "next": "act2_vault_revealed",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_9"
          },
          {
            "type": "addSkill",
            "skill": "persuasion",
            "value": 2
          },
          {
            "type": "addKarma",
            "value": 4
          },
          {
            "type": "setFlag",
            "flag": "rooftop_unlocked",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_vault_revealed",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_9"
          },
          {
            "type": "addStat",
            "stat": "stress",
            "value": -3
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "act2_vault_revealed",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_9"
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 2
            }
          }
        ]
      }
    ]
  },
  "act2_vault_revealed": {
    "id": "act2_vault_revealed",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "condition": {
      "missingFlag": "vault_access_granted"
    },
    "musicCue": "mystery",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "abandoned_factory",
    "guidanceNpcId": "npc_maria",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "setFlag",
        "flag": "act2_vault_revealed",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act2_safehouse_agreed",
        "goldenPath": true,
        "effects": [
          {
            "type": "addKarma",
            "value": 5
          },
          {
            "type": "setFlag",
            "flag": "vault_protect_vowed",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_access_granted",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "cafe_safehouse_agreed",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "cafe_safehouse"
          }
        ]
      },
      {
        "text": "",
        "next": "act2_dmitry_office_meeting",
        "effects": [
          {
            "type": "addSkill",
            "skill": "logic",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "vault_copy_plan",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "vault_access_granted",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_dmitry_office_meeting",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "addKarma",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "vault_access_granted",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act2_dmitry_office_meeting": {
    "id": "act2_dmitry_office_meeting",
    "karmaThresholds": {
      "high": 70,
      "low": 35
    },
    "ambientSound": "sounds/ambient/server_room_hum.ogg",
    "speaker": "narrator",
    "sceneId": "office_day",
    "guidanceNpcId": "office_dmitry",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "cafe_evening_end",
        "goldenPath": true,
        "effects": [
          {
            "type": "addSkill",
            "skill": "coding",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "knows_protocol",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "heard_dmitry_story",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "dmitry_escape_planned",
            "flagValue": true
          },
          {
            "type": "npcChange",
            "npcId": "maria",
            "npcChange": {
              "relation": 5
            }
          }
        ]
      },
      {
        "text": "",
        "next": "cafe_evening_end",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 2
          },
          {
            "type": "setFlag",
            "flag": "alexander_mystery",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "heard_dmitry_story",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "cafe_evening_end": {
    "id": "cafe_evening_end",
    "ambientSound": "sounds/ambient/cafe_jazz_quiet.ogg",
    "speaker": "narrator",
    "sceneId": "cafe_evening",
    "guidanceObjectiveType": "make_choice",
    "choices": [
      {
        "text": "",
        "next": "act2_closing",
        "goldenPath": true,
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_5"
          },
          {
            "type": "collectPoem",
            "poemId": "poem_15"
          },
          {
            "type": "setFlag",
            "flag": "dmitry_defected",
            "flagValue": true
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
        "next": "act2_closing",
        "effects": [
          {
            "type": "collectPoem",
            "poemId": "poem_5"
          },
          {
            "type": "setFlag",
            "flag": "dmitry_defected",
            "flagValue": true
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
  "pier_arrival": {
    "id": "pier_arrival",
    "ambientSound": "sounds/ambient/river_pier_night.ogg",
    "speaker": "narrator",
    "sceneId": "river_pier",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "pier_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "visited_river_pier",
            "flagValue": true
          },
          {
            "type": "setFlag",
            "flag": "pier_chalk_poem_seen",
            "flagValue": true
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          },
          {
            "type": "collectPoem",
            "poemId": "poem_11"
          }
        ]
      }
    ]
  },
  "pier_explore_mode": {
    "id": "pier_explore_mode",
    "ambientSound": "sounds/ambient/river_pier_night.ogg",
    "speaker": "narrator",
    "sceneId": "river_pier",
    "guidanceObjectiveType": "visit_location",
    "choices": [
      {
        "text": "",
        "next": "pier_explore_mode",
        "effects": [
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "pier_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "pier_boat_hint",
            "flagValue": true
          },
          {
            "type": "addSkill",
            "skill": "intuition",
            "value": 1
          }
        ]
      },
      {
        "text": "",
        "next": "pier_explore_mode",
        "condition": {
          "flag": "visited_river_pier"
        },
        "effects": [
          {
            "type": "addStat",
            "stat": "stress",
            "value": -2
          }
        ]
      },
      {
        "text": "",
        "next": "abandoned_workshop",
        "goldenPath": true,
        "condition": {
          "flag": "factory_unlocked"
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
        "next": "pier_explore_mode"
      }
    ]
  },
  "zarema_bank_discovery": {
    "id": "zarema_bank_discovery",
    "speaker": "narrator",
    "sceneId": "zarema_albert_room",
    "choices": [
      {
        "text": "",
        "next": "zarema_room_explore_mode",
        "effects": [
          {
            "type": "setFlag",
            "flag": "found_zarema_bank",
            "flagValue": true
          },
          {
            "type": "triggerQuest",
            "questId": "bank_transfer"
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
  "act2_zarema_network": {
    "id": "act2_zarema_network",
    "speaker": "Зарема",
    "sceneId": "home_evening",
    "guidanceNpcId": "zarema",
    "guidanceObjectiveType": "talk_to_npc",
    "choices": [
      {
        "text": "",
        "next": "act3_transition",
        "effects": [
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 8
            }
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "zarema_knows_network",
            "flagValue": true
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
        "next": "act3_transition",
        "effects": [
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 3
            }
          },
          {
            "type": "setFlag",
            "flag": "zarema_knows_network",
            "flagValue": true
          }
        ]
      }
    ]
  },
  "act2_closing": {
    "id": "act2_closing",
    "ambientSound": "sounds/ambient/winter_street.ogg",
    "musicCue": "emotional",
    "autoSave": true,
    "speaker": "narrator",
    "sceneId": "street_winter",
    "guidanceObjectiveType": "make_choice",
    "effects": [
      {
        "type": "setFlag",
        "flag": "act2_safehouse_established",
        "flagValue": true
      }
    ],
    "choices": [
      {
        "text": "",
        "next": "act3_transition",
        "goldenPath": true,
        "effects": [
          {
            "type": "addStat",
            "stat": "energy",
            "value": 15
          },
          {
            "type": "setFlag",
            "flag": "act2_complete",
            "flagValue": true
          }
        ]
      },
      {
        "text": "",
        "next": "act2_zarema_network",
        "effects": [
          {
            "type": "npcChange",
            "npcId": "zarema",
            "npcChange": {
              "relation": 5
            }
          },
          {
            "type": "addKarma",
            "value": 3
          },
          {
            "type": "setFlag",
            "flag": "act2_complete",
            "flagValue": true
          }
        ]
      }
    ]
  }
} as Record<string, StoryNodeStructure>;
