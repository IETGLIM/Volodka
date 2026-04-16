// ============================================
// SAVE/LOAD API — Server-side persistence
// ============================================

import { NextRequest, NextResponse } from 'next/server';

async function getPrisma() {
  const { db } = await import('@/lib/db');
  return db;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = 'default',
      slot = 1,
      label,
      version = 5,
      data,
      currentNodeId,
      playTime = 0,
      act = 1,
      path = 'none',
      mood = 50,
      creativity = 30,
      stability = 60,
      stress = 0,
      energy = 5,
    } = body as {
      userId?: string; slot?: number; label?: string; version?: number;
      data: string; currentNodeId: string; playTime?: number; act?: number;
      path?: string; mood?: number; creativity?: number; stability?: number;
      stress?: number; energy?: number;
    };

    if (!data || !currentNodeId) {
      return NextResponse.json({ error: 'Поля "data" и "currentNodeId" обязательны' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const save = await prisma.gameSave.upsert({
      where: { userId_slot: { userId, slot } },
      create: { userId, slot, label, version, data, currentNodeId, playTime, act, path, mood, creativity, stability, stress, energy },
      update: { label, version, data, currentNodeId, playTime, act, path, mood, creativity, stability, stress, energy },
    });

    return NextResponse.json({ saveId: save.id, savedAt: save.updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка сохранения';
    console.error('[Save API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const slot = parseInt(searchParams.get('slot') || '1', 10);
    const listOnly = searchParams.get('list') === 'true';

    const prisma = await getPrisma();

    if (listOnly) {
      const saves = await prisma.gameSave.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, slot: true, label: true, version: true, currentNodeId: true,
          playTime: true, act: true, path: true, mood: true, creativity: true,
          stability: true, stress: true, energy: true, updatedAt: true,
        },
      });
      return NextResponse.json({ saves });
    }

    const save = await prisma.gameSave.findUnique({
      where: { userId_slot: { userId, slot } },
    });

    if (!save) {
      return NextResponse.json({ error: 'Сохранение не найдено' }, { status: 404 });
    }

    return NextResponse.json({
      id: save.id, slot: save.slot, label: save.label, version: save.version,
      data: save.data, currentNodeId: save.currentNodeId, playTime: save.playTime,
      act: save.act, path: save.path, savedAt: save.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка загрузки';
    console.error('[Save API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const slot = parseInt(searchParams.get('slot') || '1', 10);

    const prisma = await getPrisma();
    await prisma.gameSave.deleteMany({ where: { userId, slot } });
    return NextResponse.json({ status: 'deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка удаления';
    console.error('[Save API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
