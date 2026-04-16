import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <header className="mb-12">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Gestión de Juntas
        </h1>
        <p className="text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
          Sistema avanzado para la administración de juntas de dinero, ahorros grupales y préstamos internos.
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
        <Card 
          title="Participantes" 
          description="Gestiona los integrantes y sus opciones en cada junta."
          icon="👥"
          href="/participantes"
        />
        <Card 
          title="Juntas Activas" 
          description="Controla el estado, semanas y pagos de las juntas vigentes."
          icon="📅"
          href="/juntas"
        />
        <Card 
          title="Préstamos" 
          description="Administra los préstamos otorgados y el seguimiento de cuotas."
          icon="💰"
          href="/prestamos"
        />
      </main>

      <footer className="mt-20 text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} Juntas App - Desplegado en Vercel con Supabase
      </footer>
    </div>
  );
}

function Card({ title, description, icon, href }: { title: string; description: string; icon: string; href: string }) {
  return (
    <Link 
      href={href}
      className="group p-8 bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </Link>
  );
}
