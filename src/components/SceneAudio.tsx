'use client';

import { memo, useRef, useEffect } from 'react';
import { PositionalAudio } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface AmbientSoundProps {
  url: string;
  position?: [number, number, number];
  volume?: number;
  distance?: number;
  loop?: boolean;
  autoplay?: boolean;
}

// Компонент для позиционного звука в 3D пространстве
export const AmbientSound = memo(function AmbientSound({
  url,
  position = [0, 0, 0],
  volume = 0.5,
  distance = 5,
  loop = true,
  autoplay = true,
}: AmbientSoundProps) {
  const soundRef = useRef<THREE.PositionalAudio>(null);
  
  return (
    <PositionalAudio
      ref={soundRef}
      url={url}
      position={position}
      distance={distance}
      loop={loop}
      autoplay={autoplay}
      volume={volume}
    />
  );
});

// Предустановленные звуки для сцен
export const SceneAudio = memo(function SceneAudio({ 
  sceneId,
  isPlaying = true 
}: { 
  sceneId: string;
  isPlaying?: boolean;
}) {
  // Конфигурация звуков для каждой сцены
  const audioConfig: Record<string, AmbientSoundProps[]> = {
    kitchen_night: [
      { url: '/audio/ambient/room_tone.mp3', position: [0, 2, 0], volume: 0.3, distance: 10 },
      { url: '/audio/ambient/fridge_hum.mp3', position: [4, 1, -2], volume: 0.2, distance: 3 },
    ],
    kitchen_dawn: [
      { url: '/audio/ambient/morning_birds.mp3', position: [-3, 2, -5], volume: 0.3, distance: 8 },
      { url: '/audio/ambient/room_tone.mp3', position: [0, 2, 0], volume: 0.2, distance: 10 },
    ],
    office_morning: [
      { url: '/audio/ambient/office_hum.mp3', position: [0, 2, 0], volume: 0.4, distance: 15 },
      { url: '/audio/ambient/keyboard_typing.mp3', position: [-3, 1, 0], volume: 0.15, distance: 2 },
      { url: '/audio/ambient/keyboard_typing.mp3', position: [3, 1, 0], volume: 0.15, distance: 2 },
    ],
    cafe_evening: [
      { url: '/audio/ambient/cafe_ambient.mp3', position: [0, 2, -4], volume: 0.5, distance: 10 },
      { url: '/audio/ambient/coffee_machine.mp3', position: [0, 1, -6], volume: 0.2, distance: 3 },
    ],
    street_night: [
      { url: '/audio/ambient/night_city.mp3', position: [0, 3, 0], volume: 0.3, distance: 20 },
      { url: '/audio/ambient/distant_sirens.mp3', position: [10, 0, -20], volume: 0.1, distance: 30 },
    ],
    rooftop_night: [
      { url: '/audio/ambient/wind_high.mp3', position: [0, 5, 0], volume: 0.4, distance: 15 },
      { url: '/audio/ambient/city_distant.mp3', position: [0, 0, -20], volume: 0.2, distance: 25 },
    ],
    dream: [
      { url: '/audio/ambient/dream_ambient.mp3', position: [0, 2, 0], volume: 0.5, distance: 10 },
    ],
    battle: [
      { url: '/audio/ambient/battle_drone.mp3', position: [0, 3, 0], volume: 0.6, distance: 10 },
    ],
    memorial_park: [
      { url: '/audio/ambient/park_birds.mp3', position: [0, 5, 0], volume: 0.3, distance: 15 },
      { url: '/audio/ambient/wind_trees.mp3', position: [0, 3, 0], volume: 0.2, distance: 10 },
    ],
  };
  
  const sounds = audioConfig[sceneId] || [];
  
  if (!isPlaying) return null;
  
  return (
    <group>
      {sounds.map((sound, index) => (
        <AmbientSound
          key={`${sceneId}-${index}`}
          {...sound}
        />
      ))}
    </group>
  );
});

// Компонент для UI звуков
export const UISounds = {
  playClick: () => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/audio/ui/click.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  },
  
  playHover: () => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/audio/ui/hover.mp3');
    audio.volume = 0.1;
    audio.play().catch(() => {});
  },
  
  playNotification: () => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/audio/ui/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  },
  
  playAchievement: () => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/audio/ui/achievement.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  },
  
  playStressWarning: () => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/audio/ui/stress_warning.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  },
};

export default SceneAudio;
