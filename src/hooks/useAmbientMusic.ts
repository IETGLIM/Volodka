"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// ПРОЦЕДУРНАЯ АТМОСФЕРНАЯ МУЗЫКА С КРОССФЕЙДАМИ
// ============================================
// Создаёт эмбиент-саундтрек на основе Web Audio API
// Без внешних файлов - всё генерируется в реальном времени

interface AmbientConfig {
  enabled: boolean;
  sceneId: string;
  mood: number;
  stress: number;
  creativity: number;
}

// Музыкальные режимы для разных сцен
const SCENE_SCALES: Record<string, { scale: number[]; tempo: number; intensity: number }> = {
  // Минорная пентатоника - меланхолия
  'home_evening': { 
    scale: [261.63, 293.66, 329.63, 392.00, 440.00], // C minor pentatonic
    tempo: 0.8, // Медленный
    intensity: 0.4 
  },
  'home_morning': { 
    scale: [261.63, 293.66, 329.63, 392.00, 440.00],
    tempo: 0.9,
    intensity: 0.5 
  },
  'kitchen_night': { 
    scale: [220.00, 246.94, 277.18, 329.63, 369.99], // A minor pentatonic
    tempo: 0.7,
    intensity: 0.35 
  },
  'kitchen_dawn': { 
    scale: [220.00, 246.94, 277.18, 329.63, 369.99],
    tempo: 0.85,
    intensity: 0.4 
  },
  
  // Более нейтральные тона - офис
  'office_morning': { 
    scale: [293.66, 329.63, 369.99, 440.00, 493.88], // D pentatonic
    tempo: 1.0,
    intensity: 0.5 
  },
  
  // Тёплые тона - кафе
  'cafe_evening': { 
    scale: [329.63, 369.99, 415.30, 493.88, 554.37], // E pentatonic (warm)
    tempo: 1.1,
    intensity: 0.55 
  },
  
  // Холодные, отстранённые - улица
  'street_night': { 
    scale: [196.00, 220.00, 261.63, 293.66, 329.63], // G minor
    tempo: 0.75,
    intensity: 0.3 
  },
  'street_winter': { 
    scale: [196.00, 220.00, 261.63, 293.66, 329.63],
    tempo: 0.7,
    intensity: 0.25 
  },
  
  // Мемориал - тихий, почтительный
  'memorial_park': { 
    scale: [174.61, 196.00, 220.00, 261.63, 293.66], // F minor
    tempo: 0.6,
    intensity: 0.2 
  },
  
  // Крыша - возвышенный
  'rooftop_night': { 
    scale: [329.63, 392.00, 440.00, 523.25, 587.33], // E major-ish
    tempo: 0.9,
    intensity: 0.45 
  },
  
  // Сон - эфирный
  'dream': { 
    scale: [261.63, 329.63, 392.00, 466.16, 523.25], // C# enharmonic
    tempo: 0.5,
    intensity: 0.35 
  },
  
  // Битва - напряжённый
  'battle': { 
    scale: [146.83, 164.81, 196.00, 220.00, 261.63], // D heavy
    tempo: 1.5,
    intensity: 0.7 
  },
  
  // По умолчанию
  'default': { 
    scale: [261.63, 293.66, 329.63, 392.00, 440.00],
    tempo: 1.0,
    intensity: 0.4 
  },
};

// Типы звуковых слоёв
type LayerType = 'bass' | 'pad' | 'melody' | 'noise' | 'accent';

interface SoundLayer {
  type: LayerType;
  nodes: (OscillatorNode | AudioBufferSourceNode)[];
  gain: GainNode;
}

export function useAmbientMusic(config: AmbientConfig) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const layersRef = useRef<Map<LayerType, SoundLayer>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousSceneRef = useRef<string>('');
  const crossfadeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Инициализация аудио-контекста
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      // Master gain с компрессором для мягкости
      const compressor = audioContextRef.current.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.value = 0.12; // Тихая фоновая музыка
      
      masterGainRef.current.connect(compressor);
      compressor.connect(audioContextRef.current.destination);
    } catch (e) {
      // Audio context not available
    }
  }, []);
  
  // Создание мягкого пэда (тянущийся звук)
  const createPad = useCallback((frequency: number, duration: number, volume: number = 0.3, layerType: LayerType = 'pad') => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Осциллятор
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    
    // Второй осциллятор для richness (обертоны)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = frequency * 1.002; // Лёгкий detune для ширины
    
    // Фильтр для мягкости
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800 + (frequency / 10);
    filter.Q.value = 0.7;
    
    // Gain для огибающей
    const gain = ctx.createGain();
    gain.gain.value = 0;
    
    // Gain для второго осциллятора (тише)
    const gain2 = ctx.createGain();
    gain2.gain.value = 0;
    
    // Соединение
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    filter.connect(gain2);
    gain.connect(masterGainRef.current);
    gain2.connect(masterGainRef.current);
    
    // Огибающая ADSR (плавное нарастание и затухание)
    const attackTime = duration * 0.2;
    const decayTime = duration * 0.1;
    const sustainLevel = volume * 0.7;
    const releaseTime = duration * 0.3;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attackTime);
    gain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(volume * 0.3, now + attackTime);
    gain2.gain.linearRampToValueAtTime(sustainLevel * 0.3, now + attackTime + decayTime);
    gain2.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.start(now);
    osc.stop(now + duration + 0.1);
    osc2.start(now);
    osc2.stop(now + duration + 0.1);
    
    // Сохраняем в слой
    const layer = layersRef.current.get(layerType);
    if (layer) {
      layer.nodes.push(osc, osc2);
    }
    
    // Очистка после окончания
    osc.onended = () => {
      const l = layersRef.current.get(layerType);
      if (l) {
        l.nodes = l.nodes.filter(n => n !== osc && n !== osc2);
      }
    };
  }, []);
  
  // Создание атмосферного шума (для глубины)
  const createNoise = useCallback((duration: number, volume: number = 0.03) => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Генерация розового шума (более мягкий)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Фильтр для смягчения шума
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300 + Math.random() * 200;
    
    const gain = ctx.createGain();
    gain.gain.value = volume;
    
    // Огибающая для шума
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + duration * 0.2);
    gain.gain.linearRampToValueAtTime(volume * 0.5, now + duration * 0.8);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);
    
    source.start();
    
    // Сохраняем в слой
    const layer = layersRef.current.get('noise');
    if (layer) {
      layer.nodes.push(source);
    }
  }, []);
  
  // Создание мелодичной фразы
  const playMelodicPhrase = useCallback(() => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    
    const sceneConfig = SCENE_SCALES[config.sceneId] || SCENE_SCALES['default'];
    const scale = sceneConfig.scale;
    
    // Модификация в зависимости от настроения
    const moodModifier = config.mood / 100; // 0-1
    const stressModifier = 1 - (config.stress / 200); // 0.5-1
    const creativityModifier = config.creativity / 200; // 0-0.5
    
    // Выбираем 2-4 ноты для фразы
    const phraseLength = Math.floor(Math.random() * 3) + 2;
    const selectedNotes: number[] = [];
    
    // При высокой креативности - более интересные интервалы
    const useExtensions = Math.random() < creativityModifier;
    
    for (let i = 0; i < phraseLength; i++) {
      const baseNote = scale[Math.floor(Math.random() * scale.length)];
      // Октавное варьирование
      const octaveShift = useExtensions && Math.random() > 0.6 
        ? (Math.random() > 0.5 ? 0.5 : 2) 
        : (Math.random() > 0.7 ? 0.5 : Math.random() > 0.5 ? 1 : 2);
      selectedNotes.push(baseNote * octaveShift);
    }
    
    // Играем ноты с задержкой, учитывая темп сцены
    const baseDelay = 800 / sceneConfig.tempo;
    selectedNotes.forEach((freq, i) => {
      setTimeout(() => {
        const duration = (2 + Math.random() * 2) * sceneConfig.tempo;
        const volume = (0.12 + moodModifier * 0.08) * stressModifier * sceneConfig.intensity;
        createPad(freq, duration, volume, 'melody');
      }, i * (baseDelay + Math.random() * 300));
    });
  }, [config.sceneId, config.mood, config.stress, config.creativity, createPad]);
  
  // Кроссфейд при смене сцены
  const crossfadeToScene = useCallback((newSceneId: string) => {
    if (!masterGainRef.current || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const crossfadeTime = 2; // 2 секунды на кроссфейд
    
    // Плавное снижение громкости
    masterGainRef.current.gain.linearRampToValueAtTime(0.06, now + crossfadeTime * 0.5);
    masterGainRef.current.gain.linearRampToValueAtTime(0.12, now + crossfadeTime);
    
    // Остановка всех текущих звуков
    layersRef.current.forEach((layer) => {
      layer.nodes.forEach(node => {
        try {
          node.stop();
        } catch {
          // Already stopped
        }
      });
      layer.nodes = [];
    });
    
    // После кроссфейда запускаем новую музыку
    setTimeout(() => {
      playMelodicPhrase();
    }, crossfadeTime * 1000);
  }, [playMelodicPhrase]);
  
  // Основной цикл эмбиента
  const startAmbient = useCallback(() => {
    if (!config.enabled) return;
    
    initAudio();
    setIsPlaying(true);
    
    const sceneConfig = SCENE_SCALES[config.sceneId] || SCENE_SCALES['default'];
    
    // Инициализация слоёв
    (['bass', 'pad', 'melody', 'noise', 'accent'] as LayerType[]).forEach(type => {
      if (!layersRef.current.has(type)) {
        layersRef.current.set(type, { type, nodes: [], gain: audioContextRef.current!.createGain() });
      }
    });
    
    // Фоновый слой - медленные пэды
    const playBackgroundLayer = () => {
      const scale = sceneConfig.scale;
      
      // Басовая нота (тоника)
      const bassFreq = scale[0] / 2;
      createPad(bassFreq, 10, 0.08 * sceneConfig.intensity, 'bass');
      
      // Через 5 секунд - вторая гармоника
      setTimeout(() => {
        if (scale[2]) {
          createPad(scale[2], 8, 0.06 * sceneConfig.intensity, 'pad');
        }
      }, 5000);
    };
    
    // Запуск слоёв
    playBackgroundLayer();
    playMelodicPhrase();
    
    // Периодическое добавление шумового слоя
    createNoise(12, 0.02);
    
    // Цикл с вариативностью
    intervalRef.current = setInterval(() => {
      if (!config.enabled) return;
      
      // Случайный выбор: пэд или мелодия
      const choice = Math.random();
      
      if (choice < 0.25) {
        playBackgroundLayer();
      } else if (choice < 0.55) {
        playMelodicPhrase();
      } else if (choice < 0.70) {
        // Редкий - тихий шум
        createNoise(6, 0.015);
      }
      // 30% тишина - паузы важны для атмосферы
      
    }, (6000 + Math.random() * 4000) / sceneConfig.tempo); // Адаптивный интервал
    
  }, [config.enabled, config.sceneId, initAudio, createPad, createNoise, playMelodicPhrase]);
  
  // Остановка
  const stopAmbient = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Плавное затухание активных нот
    layersRef.current.forEach((layer) => {
      layer.nodes.forEach(node => {
        try {
          node.stop();
        } catch {
          // Already stopped
        }
      });
      layer.nodes = [];
    });
    
    setIsPlaying(false);
  }, []);
  
  // Управление воспроизведением
  useEffect(() => {
    if (config.enabled && !isPlaying) {
      // Задержка старта - чтобы не мешать загрузке
      const startTimeout = setTimeout(() => {
        startAmbient();
      }, 2000);
      
      return () => clearTimeout(startTimeout);
    }
  }, [config.enabled, isPlaying, startAmbient]);
  
  // Отдельный эффект для остановки
  useEffect(() => {
    if (!config.enabled && isPlaying) {
      // Используем setTimeout, чтобы избежать синхронного setState
      const stopTimeout = setTimeout(() => {
        stopAmbient();
      }, 100);
      return () => clearTimeout(stopTimeout);
    }
  }, [config.enabled, isPlaying, stopAmbient]);
  
  // Смена сцены - кроссфейд
  useEffect(() => {
    if (isPlaying && config.enabled && previousSceneRef.current !== config.sceneId) {
      if (previousSceneRef.current) {
        crossfadeToScene(config.sceneId);
      }
      previousSceneRef.current = config.sceneId;
    }
  }, [config.sceneId, isPlaying, config.enabled, crossfadeToScene]);
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopAmbient();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopAmbient]);
  
  // Регулировка громкости по настроению и стрессу
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      const sceneConfig = SCENE_SCALES[config.sceneId] || SCENE_SCALES['default'];
      const baseVolume = 0.1 * sceneConfig.intensity;
      const stressAddition = (config.stress / 100) * 0.05; // Громче при стрессе
      const moodAddition = (config.mood / 200) * 0.03; // Тише при плохом настроении
      const targetVolume = Math.min(0.25, baseVolume + stressAddition + moodAddition);
      
      masterGainRef.current.gain.linearRampToValueAtTime(targetVolume, now + 0.5);
    }
  }, [config.stress, config.mood, config.sceneId]);
  
  return {
    isPlaying,
    startAmbient,
    stopAmbient,
  };
}

// ============================================
// КОМПОНЕНТ ДЛЯ ИНТЕГРАЦИИ
// ============================================

interface AmbientMusicPlayerProps {
  sceneId: string;
  mood: number;
  stress: number;
  creativity: number;
  enabled: boolean;
}

export function AmbientMusicPlayer({
  sceneId,
  mood,
  stress,
  creativity,
  enabled,
}: AmbientMusicPlayerProps) {
  useAmbientMusic({
    enabled,
    sceneId,
    mood,
    stress,
    creativity,
  });
  
  return null; // Невизуальный компонент
}

export default useAmbientMusic;
