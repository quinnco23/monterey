type PlaceholderPageProps = { title: string; description: string }

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-4xl font-black">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{description}</p>
    </main>
  )
}
