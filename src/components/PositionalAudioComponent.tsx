'use client';

import { useRef, useEffect, useState } from 'react';
import { PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';

interface PositionalAudioComponentProps {
  url: string;
  distance?: number;
  loop?: boolean;
  autoplay?: boolean;
  volume?: number;
  play?: boolean;
}

// Компонент для 3D позиционного звука в сцене
export default function PositionalAudioComponent({
  url,
  distance = 5,
  loop = true,
  autoplay = true,
  volume = 0.5,
  play = true,
}: PositionalAudioComponentProps) {
  const soundRef = useRef<THREE.PositionalAudio>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;

    if (play && loaded) {
      sound.play();
    } else if (!play && sound.isPlaying) {
      sound.pause();
    }
  }, [play, loaded]);

  useEffect(() => {
    const a = soundRef.current;
    if (!a) return;
    const withVolume = a as unknown as { setVolume?: (v: number) => void };
    if (typeof withVolume.setVolume === 'function') {
      withVolume.setVolume(volume);
    }
  }, [volume, loaded]);

  useEffect(() => {
    if (!url) return;
    const id = window.setInterval(() => {
      const a = soundRef.current;
      if (a?.buffer) {
        setLoaded(true);
        window.clearInterval(id);
      }
    }, 48);
    return () => window.clearInterval(id);
  }, [url]);

  // Заглушка - не рендерим если файла нет
  // В реальном проекте файлы должны быть в public/audio/
  if (!url) return null;

  return (
    <PositionalAudio
      ref={soundRef}
      url={url}
      distance={distance}
      loop={loop}
      autoplay={autoplay}
    />
  );
}

// Предустановленные звуки для объектов сцены
export const SceneSounds = {
  // Офис
  serverHum: {
    url: '/audio/sfx/server-hum.mp3',
    distance: 3,
    volume: 0.3,
  },
  keyboardTyping: {
    url: '/audio/sfx/keyboard.mp3',
    distance: 2,
    volume: 0.2,
  },
  acHum: {
    url: '/audio/sfx/ac-hum.mp3',
    distance: 10,
    volume: 0.15,
  },
  
  // Улица
  trafficDistant: {
    url: '/audio/sfx/traffic.mp3',
    distance: 15,
    volume: 0.2,
  },
  windAmbient: {
    url: '/audio/sfx/wind.mp3',
    distance: 20,
    volume: 0.15,
  },
  
  // Кафе
  cafeAmbient: {
    url: '/audio/sfx/cafe.mp3',
    distance: 8,
    volume: 0.3,
  },
  coffeeMachine: {
    url: '/audio/sfx/coffee-machine.mp3',
    distance: 3,
    volume: 0.25,
  },
  
  // Дом
  clockTick: {
    url: '/audio/sfx/clock.mp3',
    distance: 4,
    volume: 0.15,
  },
  fridgeHum: {
    url: '/audio/sfx/fridge.mp3',
    distance: 3,
    volume: 0.2,
  },
  
  // Специальные
  glitchAmbient: {
    url: '/audio/sfx/glitch-ambient.mp3',
    distance: 1,
    volume: 0.3,
  },
};
