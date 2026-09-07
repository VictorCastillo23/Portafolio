// Placeholder home page for the scaffold phase. Section assembly (Hero, About,
// Experience, Credentials, Projects, Contact) is wired in a later phase once
// the data layer and section components exist.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm text-accent">Portafolio</p>
      <h1 className="text-3xl font-bold text-text sm:text-5xl">
        Víctor Castillo
      </h1>
      <p className="max-w-md text-muted">
        Scaffold en construcción — el contenido del sitio se agrega en las
        siguientes fases.
      </p>
    </main>
  );
}
