'use client';

import { useState, type FormEvent } from 'react';
import { EMAIL_COMERCIAL, NOMBRE_PRODUCTO } from '../../src/lib/contacto';

export default function FormContacto() {
  const [nombre, setNombre] = useState('');
  const [restaurante, setRestaurante] = useState('');
  const [email, setEmail] = useState('');
  const [mesas, setMesas] = useState('');
  const [mensaje, setMensaje] = useState('');

  const redactarEnGmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const asunto = `${NOMBRE_PRODUCTO} — consulta de ${restaurante || nombre || 'un restaurante'}`;
    const cuerpo = [
      `Hola ${NOMBRE_PRODUCTO}:`,
      '',
      'Quiero conocer más sobre el sistema de mesas por QR.',
      '',
      `Restaurante: ${restaurante}`,
      `Nombre: ${nombre}`,
      `Email: ${email}`,
      `Cantidad de mesas: ${mesas || 'No especificada'}`,
      '',
      'Mensaje:',
      mensaje,
    ].join('\n');
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL_COMERCIAL)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.open(url, '_blank', 'noopener');
  };

  const campoClase =
    'w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition-all bg-white text-gray-900';

  return (
    <form onSubmit={redactarEnGmail} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nombreContacto" className="block text-sm font-medium text-gray-200 mb-1">
            Nombre
          </label>
          <input
            id="nombreContacto"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={campoClase}
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label htmlFor="restauranteContacto" className="block text-sm font-medium text-gray-200 mb-1">
            Restaurante
          </label>
          <input
            id="restauranteContacto"
            type="text"
            required
            value={restaurante}
            onChange={(e) => setRestaurante(e.target.value)}
            className={campoClase}
            placeholder="Nombre de tu local"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="emailContacto" className="block text-sm font-medium text-gray-200 mb-1">
            Tu correo
          </label>
          <input
            id="emailContacto"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campoClase}
            placeholder="tu@correo.com"
          />
        </div>
        <div>
          <label htmlFor="mesasContacto" className="block text-sm font-medium text-gray-200 mb-1">
            Cantidad de mesas <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="mesasContacto"
            type="number"
            min={1}
            value={mesas}
            onChange={(e) => setMesas(e.target.value)}
            className={campoClase}
            placeholder="Ej: 20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="mensajeContacto" className="block text-sm font-medium text-gray-200 mb-1">
          Mensaje
        </label>
        <textarea
          id="mensajeContacto"
          rows={4}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className={campoClase}
          placeholder="Contanos cómo trabaja tu salón hoy…"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors"
      >
        Redactar en Gmail
      </button>

      <p className="text-sm text-gray-400 text-center">
        Se abrirá tu correo con el mensaje listo. También podés escribirnos directo a{' '}
        <a href={`mailto:${EMAIL_COMERCIAL}`} className="text-blue-400 hover:underline font-medium">
          {EMAIL_COMERCIAL}
        </a>{' '}
        o usar tu app de correo.
      </p>
    </form>
  );
}