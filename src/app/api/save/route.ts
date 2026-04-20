// ============================================
// SAVE/LOAD API — Server-side persistence
// ============================================
// По умолчанию выключено. Включение: **`ENABLE_CLOUD_GAME_SAVE=1`**, **`DATABASE_URL`**, **`SAVE_API_SECRET`**
// (заголовок **`Authorization: Bearer <SAVE_API_SECRET>`** на каждый запрос). Идентификатор пользователя
// на сервере — только **`SAVE_USER_ID`** (клиентский `userId` в теле/query не доверяем).

import { NextRequest, NextResponse } from 'next/server';
import { CLOUD_SAVE_MAX_DATA_BYTES } from '@/lib/persistedGameSnapshot';

const CLOUD_SAVE_DISABLED_BODY = {
  error:
    'Облачные сохранения отключены. Прогресс хранится в localStorage (клиент). Для сервера задайте ENABLE_CLOUD_GAME_SAVE=1 и защитите API (auth).',
  code: 'CLOUD_SAVE_DISABLED' as const,
};

function assertCloudSaveEnabled(): NextResponse | null {
  if (process.env.ENABLE_CLOUD_GAME_SAVE === '1') return null;
  return NextResponse.json(CLOUD_SAVE_DISABLED_BODY, { status: 403 });
}

function assertSaveApiSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.SAVE_API_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        error:
          'Для облачных сохранений задайте SAVE_API_SECRET на сервере и передавайте Authorization: Bearer с этим значением.',
        code: 'SAVE_SECRET_MISSING' as const,
      },
      { status: 503 },
    );
  }
  const raw = request.headers.get('authorization') ?? '';
  const token = raw.length > 7 && raw.slice(0, 7).toLowerCase() === 'bearer ' ? raw.slice(7).trim() : '';
  if (token !== secret) {
    return NextResponse.json(
      {
        error: 'Требуется заголовок Authorization: Bearer с SAVE_API_SECRET.',
        code: 'SAVE_UNAUTHORIZED' as const,
      },
      { status: 401 },
    );
  }
  return null;
}

function serverSaveUserId(): string {
  const id = process.env.SAVE_USER_ID?.trim();
  return id && id.length > 0 ? id : 'default';
}

async function getPrisma() {
  const { db } = await import('@/lib/db');
  return db;
}

export async function POST(request: NextRequest) {
  const disabled = assertCloudSaveEnabled();
  if (disabled) return disabled;
  const unauthorized = assertSaveApiSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const userId = serverSaveUserId();
    const {
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
      slot?: number; label?: string; version?: number;
      data: string; currentNodeId: string; playTime?: number; act?: number;
      path?: string; mood?: number; creativity?: number; stability?: number;
      stress?: number; energy?: number;
    };

    if (data == null || !currentNodeId) {
      return NextResponse.json({ error: 'Поля "data" и "currentNodeId" обязательны' }, { status: 400 });
    }
    if (typeof data !== 'string') {
      return NextResponse.json(
        { error: 'Поле "data" должно быть строкой (JSON снимка)', code: 'SAVE_DATA_NOT_STRING' as const },
        { status: 400 },
      );
    }
    const dataUtf8Bytes = new TextEncoder().encode(data).length;
    if (dataUtf8Bytes > CLOUD_SAVE_MAX_DATA_BYTES) {
      return NextResponse.json(
        {
          error: `Поле "data" превышает лимит ${CLOUD_SAVE_MAX_DATA_BYTES} байт UTF-8 (${dataUtf8Bytes} байт).`,
          code: 'SAVE_PAYLOAD_TOO_LARGE' as const,
          maxBytes: CLOUD_SAVE_MAX_DATA_BYTES,
          bytes: dataUtf8Bytes,
        },
        { status: 413 },
      );
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
  const disabled = assertCloudSaveEnabled();
  if (disabled) return disabled;
  const unauthorized = assertSaveApiSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(request.url);
    const userId = serverSaveUserId();
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
  const disabled = assertCloudSaveEnabled();
  if (disabled) return disabled;
  const unauthorized = assertSaveApiSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(request.url);
    const userId = serverSaveUserId();
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
