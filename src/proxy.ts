import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 16+: файл **`proxy`** (ранее **`middleware`**) — логика у границы запроса.
 *
 * Приложение — одна страница (`/`). Любой другой путь без файла/роута даёт 404 в проде.
 * Перенаправляем на главную, кроме API, статики Next и известных публичных префиксов.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname === '/undefined') {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/scenes') ||
    pathname.startsWith('/models') ||
    pathname.startsWith('/models-external') ||
    pathname.startsWith('/audio') ||
    pathname === '/robots.txt' ||
    pathname === '/logo.svg' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Явные статические файлы из public (расширение в конце пути)
  if (/\.[a-zA-Z0-9]{1,8}$/.test(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
