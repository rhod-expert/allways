import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-black text-allways-dark uppercase mb-2">Politica de Privacidad</h1>
          <p className="text-sm text-gray-400 mb-8">Ultima actualizacion: Febrero 2026</p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">1. Responsable del tratamiento</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            San Jose Import Export S.A. (en adelante, "la Empresa"), con domicilio legal en Asuncion, Republica del Paraguay, es el responsable del tratamiento de los datos personales recopilados a traves del sitio web de la promocion "Allways Show de Premios".
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">2. Datos recopilados</h2>
          <p className="text-gray-600 leading-relaxed mb-2">Recopilamos los siguientes datos personales:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Nombre completo</li>
            <li>Numero de cedula de identidad</li>
            <li>Numero de telefono</li>
            <li>Direccion de correo electronico (opcional)</li>
            <li>Ciudad y departamento de residencia</li>
            <li>Numero de factura de compra</li>
            <li>Imagenes de facturas y productos</li>
          </ul>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">3. Finalidad del tratamiento</h2>
          <p className="text-gray-600 leading-relaxed mb-2">Los datos personales seran utilizados para:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Gestionar la participacion en la promocion "Allways Show de Premios"</li>
            <li>Verificar las facturas y productos registrados</li>
            <li>Generar y administrar cupones de participacion</li>
            <li>Contactar a los ganadores de los sorteos</li>
            <li>Cumplir con obligaciones legales y regulatorias</li>
            <li>Realizar comunicaciones relacionadas con la promocion</li>
          </ul>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">4. Base legal</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            El tratamiento de datos se realiza en base al consentimiento del participante, otorgado al momento de registrarse en la promocion, y conforme a la Ley N 6534/20 de Proteccion de Datos Personales Crediticios de la Republica del Paraguay.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">5. Conservacion de datos</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los datos personales seran conservados durante la vigencia de la promocion y por un periodo adicional de un (1) ano posterior a su finalizacion para cumplir con obligaciones legales. Transcurrido dicho plazo, los datos seran eliminados de forma segura.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">6. Comparticion de datos</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los datos personales no seran compartidos con terceros, salvo en los siguientes casos: (a) cuando sea requerido por autoridades competentes en cumplimiento de la ley; (b) con proveedores de servicios tecnologicos que asisten en la operacion de la plataforma, quienes estan obligados contractualmente a mantener la confidencialidad de los datos.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">7. Derechos del titular</h2>
          <p className="text-gray-600 leading-relaxed mb-2">El participante tiene derecho a:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Acceder a sus datos personales almacenados</li>
            <li>Solicitar la rectificacion de datos inexactos</li>
            <li>Solicitar la eliminacion de sus datos</li>
            <li>Oponerse al tratamiento de sus datos</li>
            <li>Solicitar la portabilidad de sus datos</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            Para ejercer estos derechos, el participante podra comunicarse por correo electronico a datos@sanjoseimport.com.py o por escrito a la direccion del Organizador.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">8. Seguridad</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La Empresa implementa medidas tecnicas y organizativas apropiadas para proteger los datos personales contra el acceso no autorizado, la alteracion, divulgacion o destruccion. Los datos se transmiten de forma cifrada mediante protocolo HTTPS y se almacenan en servidores seguros.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">9. Cookies</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            El sitio web puede utilizar cookies tecnicas necesarias para el funcionamiento del servicio. No se utilizan cookies de seguimiento ni de publicidad de terceros. Las cookies de sesion se eliminan automaticamente al cerrar el navegador.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">10. Modificaciones</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La Empresa se reserva el derecho de modificar esta Politica de Privacidad en cualquier momento. Las modificaciones seran publicadas en este mismo sitio web con la fecha de ultima actualizacion. Se recomienda al participante revisar periodicamente esta politica.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">11. Contacto</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Para consultas o reclamos relacionados con el tratamiento de datos personales, el participante puede comunicarse a: datos@sanjoseimport.com.py o a la direccion fisica de San Jose Import Export S.A. en Asuncion, Paraguay.
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
