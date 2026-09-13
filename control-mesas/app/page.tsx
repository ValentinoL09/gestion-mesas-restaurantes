import Image from 'next/image';
import Link from 'next/link';
import FormContacto from './_components/FormContacto';
import { EMAIL_COMERCIAL, NOMBRE_PRODUCTO } from '../src/lib/contacto';

const pasoClaseIcono =
  'w-12 h-12 bg-blue-600/10 text-blue-400 rounded-xl flex items-center justify-center text-xl font-black';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100 selection:bg-blue-600/40">
      {/* Navegación */}
      <nav className="flex justify-between items-center px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-4">
          <Image src="/logo.png" alt="SmartTable" width={120} height={120} className="rounded-xl object-contain" priority />
          <span className="text-2xl font-black tracking-tight text-white">
            Smart<span className="text-blue-500">Table</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <a href="#contacto" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Contacto
          </a>
          <a
            href="#contacto"
            className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-sm"
          >
            Solicitar Demo
          </a>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_55%)] pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 text-center lg:pt-24">
            <p className="text-xs font-bold tracking-[0.25em] text-blue-500 uppercase mb-5">
              Gestión de mesas por QR
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Adiós a las esperas.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">
                Hola a las mesas inteligentes.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {NOMBRE_PRODUCTO} conecta cada mesa con tu equipo: el comensal escanea el QR, llama al mozo
              y pide la cuenta al instante. Vos lo ves en tiempo real desde un panel simple. Nadie instala nada.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contacto"
                className="px-8 py-4 text-lg font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-1"
              >
                Solicitar Demo
              </a>
              <a
                href="#como-funciona"
                className="px-8 py-4 text-lg font-bold bg-transparent text-gray-100 rounded-2xl border border-gray-700 hover:border-gray-500 transition-all"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Cómo funciona</h2>
          <p className="text-lg text-gray-400 mb-12">Cuatro pasos, cero fricción para tus clientes.</p>
          <div className="grid md:grid-cols-4 gap-6 text-left">
            {[
              { n: '1', t: 'El QR en cada mesa', d: 'Cada mesa lleva su propio QR. Una vez colocado, funciona siempre.' },
              { n: '2', t: 'El comensal escanea', d: 'Se abre la pantalla de tu restaurante al instante, sin descargar nada.' },
              { n: '3', t: 'Llega la alerta', d: '“Llamar al mozo” o “Pedir la cuenta” aparece en el panel en tiempo real.' },
              { n: '4', t: 'Atendés y liberás', d: 'Al atender la mesa, el sistema queda listo para el próximo servicio.' },
            ].map((paso) => (
              <div key={paso.n} className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                <div className={pasoClaseIcono}>{paso.n}</div>
                <h3 className="mt-5 text-lg font-bold text-white">{paso.t}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{paso.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Beneficios */}
        <section className="border-y border-gray-800 bg-white text-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-12">Por qué elegir SmartTable</h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              {[
                {
                  t: 'Sin apps ni registros',
                  d: 'El comensal solo escanea el QR. Nada de instalar, crear cuentas ni descargar nada.',
                },
                {
                  t: 'Avisos en tiempo real',
                  d: 'Cada llamada o pedido de cuenta llega al instante al panel. Ningún cliente espera de más.',
                },
                {
                  t: 'Tu marca en cada pantalla',
                  d: 'La vista del comensal lleva tu logo y tus colores: se siente como parte de tu restaurante.',
                },
                {
                  t: 'Más rotación, más ingresos',
                  d: 'Menos esperas para pedir la cuenta significa mesas que se liberan antes y facturan más.',
                },
              ].map((b) => (
                <div key={b.t} className="flex gap-5">
                  <div className="w-12 h-12 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl font-black">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{b.t}</h3>
                    <p className="mt-2 text-gray-500 leading-relaxed">{b.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Producto */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <p className="text-xs font-bold tracking-[0.25em] text-blue-500 uppercase mb-5">Pensado como producto</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-12">
            Construido para operar, no para demos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { t: 'Panel en tiempo real', d: 'Dashboard simple con el estado de cada mesa al momento.' },
              { t: 'Infraestructura Realtime', d: 'Notificaciones instantáneas sin recargas ni demoras.' },
              { t: 'QR estáticos', d: 'Imprimís una vez y funcionan para siempre. Sin vinculaciones.' },
              { t: 'Puesta en marcha', d: 'Te entregamos el sistema configurado con tu identidad.' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="font-bold text-white">{f.t}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Precios */}
        <section className="border-y border-gray-800 bg-gray-900/40">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
              Planes a medida de tu salón
            </h2>
            <p className="text-lg text-gray-400 mb-12">
              Cada restaurante es distinto. Armamos la propuesta con la cantidad de mesas y el volumen de tu local.
            </p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-gray-900 p-8 rounded-3xl border border-gray-700 relative">
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">
                    PLAN COMPLETO
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">Instalación + mantenimiento mensual</h3>
                <p className="mt-4 text-gray-400">
                  Un pago inicial de instalación y un mantenimiento mensual para operar en la nube.
                </p>
                <ul className="mt-8 space-y-4 text-gray-200 font-medium">
                  <li className="flex items-center gap-3"><span className="text-blue-400 text-xl">✔</span> Alta de mesas y QRs físicos para cada mesa</li>
                  <li className="flex items-center gap-3"><span className="text-blue-400 text-xl">✔</span> Configuración con tu marca</li>
                  <li className="flex items-center gap-3"><span className="text-blue-400 text-xl">✔</span> Capacitación al personal</li>
                  <li className="flex items-center gap-3"><span className="text-blue-400 text-xl">✔</span> Panel en tiempo real, hosting protegido y soporte</li>
                </ul>
                <a
                  href="#contacto"
                  className="mt-8 w-full py-3 inline-flex justify-center font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
                >
                  Consultar presupuesto
                </a>
              </div>
              <div className="bg-white text-gray-900 p-8 rounded-3xl shadow-sm relative">
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">
                    14 DÍAS GRATIS
                  </span>
                </div>
                <h3 className="text-2xl font-bold">Prueba SmartTable</h3>
                <p className="mt-4 text-gray-500">
                  Probá el sistema completo en tu salón durante 14 días, sin costo y sin compromiso.
                </p>
                <ul className="mt-8 space-y-4 text-gray-700 font-medium">
                  <li className="flex items-center gap-3"><span className="text-blue-600 text-xl">✔</span> Todas las funciones del plan completo</li>
                  <li className="flex items-center gap-3"><span className="text-blue-600 text-xl">✔</span> Sin tarjeta ni datos de pago</li>
                  <li className="flex items-center gap-3"><span className="text-blue-600 text-xl">✔</span> Asistencia en la puesta en marcha</li>
                </ul>
                <a
                  href="#contacto"
                  className="mt-8 w-full py-3 inline-flex justify-center font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Solicitar prueba
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Hablemos de tu restaurante
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed mb-8">
                Contanos cuántas mesas tenés y cómo trabaja tu salón hoy. Te armamos una propuesta
                a medida con el costo de instalación y el plan mensual.
              </p>
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <p className="text-sm text-gray-400 mb-2">Prefieres escribirnos directo?</p>
                <a
                  href={`mailto:${EMAIL_COMERCIAL}`}
                  className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {EMAIL_COMERCIAL}
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8">
              <FormContacto />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">
            © {new Date().getFullYear()} {NOMBRE_PRODUCTO}. Todos los derechos reservados.
          </span>
          <a href={`mailto:${EMAIL_COMERCIAL}`} className="text-sm text-gray-400 hover:text-white transition-colors">
            {EMAIL_COMERCIAL}
          </a>
        </div>
      </footer>
    </div>
  );
}