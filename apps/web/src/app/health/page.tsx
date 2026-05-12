export default function HealthPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="text-2xl font-black">Meme Foundry health</h1>
      <p data-testid="health-status" className="mt-2 text-emerald-300">
        ok
      </p>
    </main>
  );
}
