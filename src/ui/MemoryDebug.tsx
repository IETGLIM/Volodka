'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// ============================================
// ТИПЫ
// ============================================

interface MemoryNode {
  id: string;
  position: [number, number, number];
  label: string;
  connected: boolean;
  correctConnections: string[];
  currentConnections: string[];
  color: string;
}

interface MemoryDebugProps {
  difficulty: 1 | 2 | 3;
  onComplete: (success: boolean, score: number) => void;
  timeLimit?: number;
}

// ============================================
// 3D КОМПОНЕНТЫ
// ============================================

function MemoryNodeMesh({ 
  node, 
  isSelected,
  isHovered,
  onClick,
  onHover
}: { 
  node: MemoryNode;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hover: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    meshRef.current.position.y = node.position[1] + Math.sin(t * 2 + node.position[0]) * 0.05;
    
    if (isSelected) {
      meshRef.current.rotation.y = t * 0.5;
    }
  });
  
  const scale = isSelected ? 1.2 : isHovered ? 1.1 : 1;
  
  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        scale={scale}
      >
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial 
          color={node.connected ? '#22c55e' : node.color}
          emissive={isSelected ? '#ffffff' : node.connected ? '#22c55e' : node.color}
          emissiveIntensity={isSelected ? 0.5 : node.connected ? 0.3 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Метка */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
      
      {/* Индикатор соединения */}
      {node.connected && (
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  );
}

function ConnectionLine({ start, end, isActive }: { 
  start: [number, number, number]; 
  end: [number, number, number];
  isActive: boolean;
}) {
  const lineRef = useRef<Line2>(null);

  useFrame(({ clock }) => {
    if (!lineRef.current || !isActive) return;
    const material = lineRef.current.material as LineMaterial;
    material.opacity = 0.5 + Math.sin(clock.elapsedTime * 3) * 0.3;
  });
  
  return (
    <Line
      ref={lineRef}
      points={[start, end]}
      color={isActive ? '#22c55e' : '#ef4444'}
      lineWidth={2}
      transparent
      opacity={isActive ? 0.8 : 0.4}
    />
  );
}

function Scene({ 
  nodes, 
  selectedNode,
  connections,
  onNodeClick,
  onNodeHover
}: { 
  nodes: MemoryNode[];
  selectedNode: string | null;
  connections: Array<{ from: string; to: string; correct: boolean }>;
  onNodeClick: (id: string) => void;
  onNodeHover: (id: string | null) => void;
}) {
  return (
    <>
      {/* Освещение */}
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={1} color="#a855f7" />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#00ffff" />
      <pointLight position={[5, 3, 5]} intensity={0.5} color="#ff00ff" />
      
      {/* Узлы */}
      {nodes.map(node => (
        <MemoryNodeMesh
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id}
          isHovered={false}
          onClick={() => onNodeClick(node.id)}
          onHover={(hover) => onNodeHover(hover ? node.id : null)}
        />
      ))}
      
      {/* Линии соединений */}
      {connections.map((conn, idx) => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return null;
        return (
          <ConnectionLine
            key={idx}
            start={fromNode.position}
            end={toNode.position}
            isActive={conn.correct}
          />
        );
      })}
      
      {/* Подсказка для соединения */}
      {selectedNode && (
        <mesh position={[0, -1, 0]}>
          <planeGeometry args={[10, 0.5]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={0.8} />
        </mesh>
      )}
      
      <OrbitControls 
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================

export default function MemoryDebug({ 
  difficulty, 
  onComplete,
  timeLimit = 60
}: MemoryDebugProps) {
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connections, setConnections] = useState<Array<{ from: string; to: string; correct: boolean }>>([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameState, setGameState] = useState<'playing' | 'success' | 'failed' | 'timeout'>('playing');
  const [score, setScore] = useState(0);
  
  // Генерация узлов на основе сложности
  const generateNodes = useCallback(() => {
    const nodeCount = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#6366f1'];
    
    const labels = [
      'Память 1',
      'Травма',
      'Надежда',
      'Утрата',
      'Любовь',
      'Страх',
      'Радость',
      'Боль'
    ];
    
    const newNodes: MemoryNode[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2 + (i % 2) * 0.5;
      
      newNodes.push({
        id: `node-${i}`,
        position: [
          Math.cos(angle) * radius,
          0.5 + Math.sin(i * 0.5) * 0.3,
          Math.sin(angle) * radius
        ],
        label: labels[i] || `Нода ${i}`,
        connected: false,
        correctConnections: [],
        currentConnections: [],
        color: colors[i % colors.length]
      });
    }
    
    // Устанавливаем правильные соединения
    const connectionCount = difficulty === 1 ? 3 : difficulty === 2 ? 5 : 7;
    for (let i = 0; i < connectionCount; i++) {
      const from = newNodes[i].id;
      const to = newNodes[(i + 1) % nodeCount].id;
      newNodes[i].correctConnections.push(to);
    }
    
    setNodes(newNodes);
  }, [difficulty]);
  
  // Инициализация
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generateNodes();
  }, []);
  
  // Таймер
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState]);
  
  // Проверка победы
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const allCorrect = nodes.every(node => {
      const correctSet = new Set(node.correctConnections);
      const currentSet = new Set(node.currentConnections);
      
      if (correctSet.size !== currentSet.size) return false;
      
      for (const conn of correctSet) {
        if (!currentSet.has(conn)) return false;
      }
      return true;
    });
    
    if (allCorrect && nodes.length > 0) {
      const finalScore = Math.floor((timeLeft / timeLimit) * 100 * difficulty);
      // Используем setTimeout, чтобы избежать синхронного setState
      setTimeout(() => {
        setScore(finalScore);
        setGameState('success');
      }, 0);
      setTimeout(() => onComplete(true, finalScore), 2000);
    }
  }, [nodes, connections, gameState, timeLeft, timeLimit, difficulty, onComplete]);
  
  // Обработка клика по узлу
  const handleNodeClick = useCallback((nodeId: string) => {
    if (gameState !== 'playing') return;
    
    if (selectedNode === null) {
      setSelectedNode(nodeId);
    } else if (selectedNode === nodeId) {
      setSelectedNode(null);
    } else {
      // Создаём соединение
      const fromNode = nodes.find(n => n.id === selectedNode);
      const toNode = nodes.find(n => n.id === nodeId);
      
      if (fromNode && toNode) {
        // Проверяем, правильное ли это соединение
        const isCorrect = fromNode.correctConnections.includes(nodeId);
        
        // Добавляем соединение
        setConnections(prev => [
          ...prev.filter(c => !(c.from === selectedNode && c.to === nodeId)),
          { from: selectedNode, to: nodeId, correct: isCorrect }
        ]);
        
        // Обновляем узлы
        setNodes(prev => prev.map(n => {
          if (n.id === selectedNode) {
            return {
              ...n,
              currentConnections: [...n.currentConnections, nodeId],
              connected: n.correctConnections.includes(nodeId)
            };
          }
          return n;
        }));
        
        // Добавляем очки за правильное соединение
        if (isCorrect) {
          setScore(prev => prev + 10 * difficulty);
        } else {
          setScore(prev => Math.max(0, prev - 5));
        }
      }
      
      setSelectedNode(null);
    }
  }, [selectedNode, nodes, gameState, difficulty]);
  
  // Завершение при таймауте
  useEffect(() => {
    if (gameState === 'timeout') {
      setTimeout(() => onComplete(false, score), 2000);
    }
  }, [gameState, onComplete, score]);
  
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col">
      {/* Заголовок */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
        <div className="text-white">
          <h2 className="text-xl font-bold text-cyan-400">🔧 ДЕБАГГИНГ ПАМЯТИ</h2>
          <p className="text-sm text-slate-400">Уровень сложности: {difficulty}</p>
        </div>
        
        <div className="text-right">
          <div className={`text-3xl font-mono ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
          <div className="text-sm text-purple-400">Счёт: {score}</div>
        </div>
      </div>
      
      {/* Инструкции */}
      <div className="absolute bottom-24 left-4 right-4 z-10 text-center">
        <p className="text-slate-400 text-sm">
          {selectedNode 
            ? '👆 Выберите второй узел для соединения' 
            : '👆 Кликните на узел, чтобы выбрать его'}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Соедините {nodes.filter(n => n.correctConnections.length > 0).length} правильных пар
        </p>
      </div>
      
      {/* 3D Сцена */}
      <div className="flex-1">
        <Canvas camera={{ position: [0, 4, 6], fov: 50 }}>
          <Scene
            nodes={nodes}
            selectedNode={selectedNode}
            connections={connections}
            onNodeClick={handleNodeClick}
            onNodeHover={() => {}}
          />
        </Canvas>
      </div>
      
      {/* Результаты */}
      <AnimatePresence>
        {gameState === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-green-900/80 flex items-center justify-center z-20"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="text-6xl mb-4"
              >
                ✅
              </motion.div>
              <h3 className="text-3xl font-bold text-green-400 mb-2">ПАМЯТЬ ВОССТАНОВЛЕНА</h3>
              <p className="text-xl text-white">Очки: {score}</p>
            </div>
          </motion.div>
        )}
        
        {gameState === 'timeout' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-red-900/80 flex items-center justify-center z-20"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="text-6xl mb-4"
              >
                💥
              </motion.div>
              <h3 className="text-3xl font-bold text-red-400 mb-2">ОШИБКА ПАМЯТИ</h3>
              <p className="text-xl text-white">Время истекло</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
