# Интеграция 3D-моделей (GLTF)

## Структура папок

```
public/
├── models/
│   ├── player.glb           # Модель игрока
│   ├── npc_maria.glb        # Мария (кухня)
│   ├── npc_barista.glb      # Бариста (кафе)
│   ├── npc_visitor.glb      # Посетитель кафе
│   ├── npc_poet.glb         # Поэт (кафе)
│   ├── npc_elder.glb        # Старик (парк)
│   ├── npc_dog_walker.glb   # Выгуливатель собак
│   ├── npc_shadow.glb       # Тень (крыша)
│   ├── npc_colleague.glb    # Коллега (офис)
│   ├── npc_boss.glb         # Начальник (офис)
│   └── npc_stranger.glb     # Незнакомец (улица)
```

## Требования к моделям

### Формат
- **GLB** (рекомендуется) или **GLTF**
- Оптимизированные для веб (low-poly)

### Анимации (обязательно)
Модели должны содержать следующие анимации:
- `Idle` - покой (обязательно)
- `Walk` - ходьба (опционально)
- `Run` - бег (для игрока)
- `Talk` - разговор (опционально)

### Масштаб
- Модели должны быть в масштабе 1 unit = 1 метр
- Высота персонажа ~1.8 units

## Использование

### Игрок

```tsx
<Player
  modelPath="/models/player.glb"
  animations={{
    idle: 'Idle',
    walk: 'Walk',
    run: 'Run',
  }}
  position={[0, 1, 3]}
/>
```

### NPC

```tsx
// В npcDefinitions.ts
{
  id: 'cafe_barista',
  name: 'Бариста',
  model: 'barista',
  modelPath: '/models/npc_barista.glb',
  animations: {
    idle: 'Idle',
    walk: 'Walk',
    talk: 'Talk',
  },
  scale: 1,
  // ...
}
```

## Fallback

Если модель не загружена или путь не указан, отображается **fallback-модель** (капсула с базовыми цветами).

## Бесплатные модели

Рекомендуемые источники:
1. [Mixamo](https://www.mixamo.com) - бесплатные персонажи с анимациями
2. [Sketchfab](https://sketchfab.com) - поиск по "free download"
3. [Quaternius](https://quaternius.com) - бесплатные low-poly модели

## Экспорт из Blender

1. Установите **glTF Blender I/O** addon
2. Экспорт: `File → Export → glTF 2.0 (.glb)`
3. Настройки:
   - Format: **GLB**
   - Include: ✅ Animation
   - Transform: +Y Up
   - Mesh: ✅ Apply Modifiers

## Оптимизация

1. **Текстуры**: Используйте сжатые текстуры (WebP, KTX2)
2. **Полигонов**: < 5000 треугольников на персонажа
3. **Анимации**: Удаляйте неиспользуемые ключевые кадры
4. **Draco compression**: Включите для уменьшения размера файла
