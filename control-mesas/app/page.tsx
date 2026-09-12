import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-200">
      
      {/* Navegación */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tighter text-gray-900">
          Smart<span className="text-blue-600">Table</span>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/login" 
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            Acceso Clientes
          </Link>
          <button className="px-5 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm hidden sm:block">
            Registrar mi local
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center lg:pt-32">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
          Adiós a las esperas.<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Hola a las mesas inteligentes.
          </span>
        </h1>
        
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          El sistema de gestión por QR que permite a tus comensales llamar al mozo, pedir la cuenta y ver el menú en segundos, sin descargar ninguna aplicación.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 text-lg font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-1">
            Empieza Gratis Hoy
          </button>
          <button className="px-8 py-4 text-lg font-bold bg-white text-gray-800 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
            Ver Demo Interactiva
          </button>
        </div>

        {/* Sección de Beneficios */}
        <div className="mt-32 grid md:grid-cols-3 gap-10 text-left">
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-6">
              🚀
            </div>
            <h3 className="text-xl font-bold mb-3">Servicio Inmediato</h3>
            <p className="text-gray-500">Tus clientes piden lo que necesitan al instante. El mozo recibe la alerta en tiempo real en su panel.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-6">
              🎨
            </div>
            <h3 className="text-xl font-bold mb-3">Tu Propia Marca</h3>
            <p className="text-gray-500">Personaliza la vista del cliente con tu logotipo y los colores de tu restaurante. Hazlo sentir en casa.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6">
              📈
            </div>
            <h3 className="text-xl font-bold mb-3">Más Rotación</h3>
            <p className="text-gray-500">Al agilizar el momento de pedir la cuenta, las mesas se liberan más rápido, aumentando tus ingresos diarios.</p>
          </div>

        </div>
      </main>

    </div>
  );
}