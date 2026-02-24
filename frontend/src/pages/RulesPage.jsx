import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export default function RulesPage() {
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
          <h1 className="text-3xl font-black text-allways-dark uppercase mb-2">Bases y Condiciones</h1>
          <p className="text-sm text-gray-400 mb-8">Ultima actualizacion: Febrero 2026</p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">1. Organizador</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La promocion "Allways Show de Premios" (en adelante, "la Promocion") es organizada por San Jose Import Export S.A. (en adelante, "el Organizador"), con domicilio legal en Asuncion, Republica del Paraguay, RUC 80012345-6.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">2. Vigencia</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La Promocion tendra vigencia desde el 1 de febrero de 2026 hasta el 31 de diciembre de 2026, inclusive. Los sorteos mensuales se realizaran el ultimo dia habil de cada mes. El sorteo final del automovil Renault Kwid 0 KM se realizara en diciembre de 2026, en fecha a confirmar.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">3. Ambito territorial</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La Promocion es valida en todo el territorio de la Republica del Paraguay. Las compras deben realizarse en puntos de venta habilitados dentro del pais.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">4. Participantes</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Podran participar todas las personas fisicas, mayores de 18 anos, residentes en la Republica del Paraguay, que posean cedula de identidad vigente. Quedan excluidos los empleados directos de San Jose Import Export S.A. y sus familiares directos (conyuges, padres, hijos y hermanos).
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">5. Mecanica de participacion</h2>
          <p className="text-gray-600 leading-relaxed mb-2">Para participar, el interesado debera:</p>
          <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-4">
            <li>Adquirir uno o mas productos de las marcas participantes (Empalux, Scotch-Brite, Wyda, Allways, Allways Health, Guapo, Trento) en cualquier punto de venta habilitado.</li>
            <li>Ingresar al sitio web de la Promocion y registrarse completando el formulario con sus datos personales.</li>
            <li>Cargar la fotografia de la factura de compra y, opcionalmente, la fotografia de los productos adquiridos.</li>
            <li>Cada producto participante adquirido genera un (1) cupon para el sorteo mensual correspondiente.</li>
            <li>Todos los cupones generados durante el ano participan automaticamente en el sorteo final del automovil.</li>
          </ol>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">6. Marcas participantes</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Las marcas cuyos productos participan en la Promocion son: Empalux, Scotch-Brite, Wyda, Allways, Allways Health, Guapo y Trento. El Organizador se reserva el derecho de agregar marcas participantes durante la vigencia de la Promocion, previa comunicacion en el sitio web.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">7. Validacion de registros</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Cada registro sera verificado por el equipo del Organizador. Se verificara que la factura sea legible, corresponda a productos participantes y cumpla con los requisitos. El Organizador se reserva el derecho de rechazar registros que no cumplan con las condiciones establecidas. Los registros rechazados no generan cupones.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">8. Premios</h2>
          <p className="text-gray-600 leading-relaxed mb-2">Los premios mensuales seran los siguientes:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Febrero: Licuadora Personal</li>
            <li>Marzo: Air Fryer</li>
            <li>Abril: Patinete Electrico</li>
            <li>Mayo: Licuadora Oster</li>
            <li>Junio: Robo Aspirador</li>
            <li>Julio: Smart TV 55"</li>
            <li>Agosto: iPhone 16</li>
            <li>Septiembre: Scooter Electrico</li>
            <li>Octubre: Air Fryer</li>
            <li>Noviembre: Moto 0 KM</li>
            <li>Diciembre (Gran Sorteo Final): Renault Kwid 0 KM</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los premios no son canjeables por dinero en efectivo. Las imagenes de los premios son referenciales y pueden variar en color o modelo.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">9. Sorteos</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los sorteos se realizaran de forma electronica, mediante un sistema aleatorio certificado. Los ganadores seran notificados por telefono y/o correo electronico al contacto registrado. Los ganadores tendran un plazo de 15 dias habiles para reclamar su premio presentando su cedula de identidad original.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">10. Impuestos y gastos</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los impuestos que pudieran derivarse de la entrega de los premios seran responsabilidad del ganador. El Organizador asumira el costo del premio en si, pero no gastos adicionales como transporte, seguro, patentamiento (en caso del automovil), u otros gastos asociados.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">11. Proteccion de datos</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los datos personales recopilados seran tratados conforme a la Ley N 6534/20 de Proteccion de Datos Personales Crediticios y a la Politica de Privacidad publicada en el sitio web de la Promocion. El participante autoriza al Organizador a utilizar su nombre e imagen en caso de resultar ganador, para fines publicitarios de la Promocion.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">12. Aceptacion</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La participacion en la Promocion implica la aceptacion total e incondicional de estas Bases y Condiciones. El Organizador se reserva el derecho de modificar las presentes bases en cualquier momento, comunicando oportunamente los cambios a traves del sitio web.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">13. Jurisdiccion</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Para cualquier controversia derivada de la presente Promocion, las partes se someten a la jurisdiccion de los Tribunales Ordinarios de la ciudad de Asuncion, Republica del Paraguay, renunciando a cualquier otro fuero o jurisdiccion.
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
