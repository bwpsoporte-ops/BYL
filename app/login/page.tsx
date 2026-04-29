import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/50 md:grid-cols-[1fr_430px]">
        <section className="hidden bg-[#102a4c] p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">BYL Finanzas</p>
            <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight">Finanzas privadas y compartidas con control profesional.</h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/70">
              Ingresos, gastos, tarjetas, proyectos y balance de pareja en una sola plataforma.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-950">
            <div className="rounded-md bg-white p-4">Privacidad por registro: privado o compartido.</div>
            <div className="rounded-md bg-white p-4">Balance de pareja, tarjetas, proyectos y presupuestos.</div>
          </div>
        </section>
        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Entrar</h2>
            <p className="mt-2 text-sm text-slate-500">Inicia sesión para ver tu dashboard financiero.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
