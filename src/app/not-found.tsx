import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-4">404</p>
      <h1 className="text-2xl font-semibold text-slate-100 mb-3">Страница не найдена</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Такого адреса нет. ВОЛОДЬКА живёт только на главной — вернитесь туда и продолжите
        историю.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-500 transition-colors"
      >
        На главную
      </Link>
    </div>
  );
}
