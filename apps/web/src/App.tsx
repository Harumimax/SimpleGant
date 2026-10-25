export function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
          <span className="text-base font-semibold">SimpleGant</span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-semibold">Проекты</h1>
            <p className="mt-1 text-sm text-slate-600">
              Здесь появятся ваши диаграммы Ганта.
            </p>
          </div>
          <button
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white opacity-50"
            disabled
            type="button"
          >
            Создать проект
          </button>
        </div>

        <div className="py-16 text-center">
          <p className="text-sm font-medium text-slate-700">Проектов пока нет</p>
        </div>
      </section>
    </main>
  );
}
