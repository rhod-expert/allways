import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-allways-blue hover:text-allways-navy text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-black text-allways-dark uppercase mb-2">Aviso Legal</h1>
          <p className="text-sm text-gray-400 mb-8">Ultima actualizacion: Febrero 2026</p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">1. Identificacion del titular</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            El presente sitio web es propiedad y esta operado por San Jose Import Export S.A., empresa constituida y registrada conforme a las leyes de la Republica del Paraguay, con RUC 80012345-6, con domicilio legal en Asuncion, Paraguay.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">2. Objeto del sitio</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Este sitio web tiene como objetivo exclusivo la gestion de la promocion "Allways Show de Premios", incluyendo el registro de participantes, la carga de facturas, la consulta de cupones y la comunicacion de resultados de sorteos.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">3. Propiedad intelectual</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Todos los contenidos del sitio web, incluyendo pero no limitado a textos, graficos, imagenes, logotipos, iconos, fotografias, diseño grafico, marcas y nombres comerciales son propiedad de San Jose Import Export S.A. o de sus respectivos titulares, y estan protegidos por las leyes de propiedad intelectual de la Republica del Paraguay y tratados internacionales aplicables. Queda prohibida su reproduccion, distribucion o modificacion sin autorizacion expresa.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">4. Condiciones de uso</h2>
          <p className="text-gray-600 leading-relaxed mb-2">El usuario se compromete a:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Utilizar el sitio web unicamente para los fines previstos en la promocion</li>
            <li>Proporcionar informacion veraz y exacta en los formularios de registro</li>
            <li>No intentar acceder de forma no autorizada a areas restringidas del sitio</li>
            <li>No utilizar el sitio para actividades ilicitas o fraudulentas</li>
            <li>No cargar contenido ofensivo, difamatorio o que viole derechos de terceros</li>
          </ul>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">5. Limitacion de responsabilidad</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            San Jose Import Export S.A. no sera responsable por danos directos o indirectos derivados del uso del sitio web, incluyendo pero no limitado a: interrupciones del servicio, errores tecnicos, perdida de datos o virus informaticos. La empresa realizara sus mejores esfuerzos para mantener el sitio disponible y funcionando correctamente, pero no garantiza su disponibilidad ininterrumpida.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">6. Enlaces externos</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            El sitio web puede contener enlaces a sitios de terceros. San Jose Import Export S.A. no se hace responsable del contenido, politicas de privacidad o practicas de dichos sitios. El acceso a sitios enlazados es bajo la exclusiva responsabilidad del usuario.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">7. Modificaciones</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            San Jose Import Export S.A. se reserva el derecho de modificar el presente aviso legal en cualquier momento, sin necesidad de notificacion previa. Las modificaciones entraran en vigencia a partir de su publicacion en el sitio web.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">8. Legislacion aplicable</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            El presente aviso legal se rige por las leyes de la Republica del Paraguay. Para cualquier controversia derivada del uso del sitio web, las partes se someten a la jurisdiccion exclusiva de los Tribunales Ordinarios de la ciudad de Asuncion, Paraguay.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">9. Contacto</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Para consultas legales, el usuario puede comunicarse a: legal@sanjoseimport.com.py o a la direccion fisica de San Jose Import Export S.A. en Asuncion, Paraguay.
          </p>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-400">
              San Jose Import Export S.A. - Asuncion, Paraguay - 2026
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
