import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

const sorteos = [
  {
    nombre: 'Primer Sorteo',
    fecha: 'Lunes 25 de mayo de 2026',
    premios: 'Un (1) Televisor, Dos (2) Licuadoras Mix, Un (1) Vale de Compra por valor de 500.000 Gs.',
  },
  {
    nombre: 'Segundo Sorteo',
    fecha: 'Lunes 29 de junio de 2026',
    premios: 'Un (1) Televisor, Un (1) Air Fryer, Dos (2) Licuadoras Mix, Un (1) Vale de Compra por valor de 500.000 Gs.',
  },
  {
    nombre: 'Tercer Sorteo',
    fecha: 'Lunes 27 de julio de 2026',
    premios: 'Un (1) Televisor, Una (1) Aspiradora Robot, Dos (2) Licuadoras Mix, Un (1) Vale de Compra por valor de 500.000 Gs.',
  },
  {
    nombre: 'Cuarto Sorteo',
    fecha: 'Lunes 31 de agosto de 2026',
    premios: 'Una (1) Motocicleta, Un (1) Air Fryer, Una (1) Licuadora Mix, Dos (2) Vales de Compra por valor de 500.000 Gs.',
  },
  {
    nombre: 'Quinto Sorteo',
    fecha: 'Lunes 28 de septiembre de 2026',
    premios: 'Un (1) Teléfono Celular, Un (1) Air Fryer, Una (1) Scooter, Una (1) Patinadora, Un (1) Vale de Compra por valor de 500.000 Gs.',
  },
  {
    nombre: 'Sexto Sorteo',
    fecha: 'Lunes 26 de octubre de 2026',
    premios: 'Una (1) Motocicleta, Un (1) Teléfono Celular, Una (1) Aspiradora Robot, Una (1) Licuadora Mix, Un (1) Vale de Compra por valor de 500.000 Gs.',
  },
  {
    nombre: 'Séptimo Sorteo',
    fecha: 'Lunes 30 de noviembre de 2026',
    premios: 'Un (1) Auto Fiat Mobi mecánico, motor 1.0 cc, combustible Flex, 0 km.',
  },
]

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
          <p className="text-base font-semibold text-allways-navy mb-1">Promoción “Promoción Allways 2026”</p>
          <p className="text-sm text-gray-400 mb-8">Última actualización: mayo de 2026</p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 1. Organizador</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            SAN JOSÉ IMPORT EXPORT S.A., con Número de Registro Único del Contribuyente RUC: 80056321-2, con domicilio en Ciudad del Este, Departamento de Alto Paraná, en adelante el ORGANIZADOR, representado por el señor Rivelino Cesar Schiochet, con Número de Documento de Identidad N° 4.619.404, y con domicilio situado en la calle Guayaibí Nº 1065 – Barrio Amambay, Ciudad del Este, del Departamento de Alto Paraná, teléfono 061 573 649 / 572261 / 578 442, realizará la promoción denominada Sorteo “PROMOCIÓN ALLWAYS 2026”, en adelante la PROMOCIÓN.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 2. Vigencia</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La PROMOCIÓN tendrá vigencia desde el 10/05/2026 hasta el 30/11/2026, y será válida para todo el territorio nacional.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 3. Participantes</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Podrán participar de la PROMOCIÓN todas las personas físicas que cumplan los requisitos establecidos en estas bases y condiciones.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 4. Restricciones de participación</h2>
          <p className="text-gray-600 leading-relaxed mb-2">
            No podrán participar de la PROMOCIÓN, ni hacerse acreedores de los premios:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Los menores de 18 años.</li>
            <li>Los prófugos de la justicia o con privación de libertad por mandato judicial.</li>
            <li>El propietario, los funcionarios o empleados del ORGANIZADOR, o sus parientes, hasta el segundo grado de consanguineidad y afinidad.</li>
            <li>Agencias vinculadas al Organizador.</li>
          </ul>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 5. Sistema de participación</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Participan de la promoción todas las personas que se encuentren habilitadas y que no se encuentren comprendidas en lo citado en el artículo anterior, y accederán mediante la adquisición de un producto ALLWAYS Health, la cual generará un cupón numerado con todos los datos del jugador y del sorteo.
          </p>
          <p className="text-gray-600 leading-relaxed mb-2">
            El participante deberá realizar las siguientes acciones a fin de participar del sorteo:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Primero: Adquirir productos ALLWAYS.</li>
            <li>Segundo: Registrar la factura de compra en la página web a través del landing oficial de la marca del producto.</li>
            <li>Tercero: La factura deberá estar a nombre del participante inscrito.</li>
            <li>Cuarto: Subir una foto legible de la factura.</li>
            <li>Quinto: Indicar la cantidad de productos.</li>
            <li>Sexto: Indicar nombre del vendedor del producto.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            El participante podrá cargar múltiples facturas en el periodo de vigencia de la campaña.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            El participante, bajo su responsabilidad, tiene el deber de verificar que los datos sean correctamente registrados. En consecuencia, los errores en el registro de los datos serán exclusiva responsabilidad del participante y, de existir errores o de no haberse completado todos los ítems solicitados en el cupón, este no tendrá validez para el sorteo.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los cupones serán depositados y registrados digitalmente en una urna habilitada para el efecto. El cupón es individual e intransferible.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 6. El cupón</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Documento que otorga al adquiriente la titularidad del derecho legal a participar del sorteo, el cual será el comprobante de participación que garantiza, en caso de que el número coincida, con el resultado de la PROMOCIÓN.
          </p>
          <p className="text-gray-600 leading-relaxed mb-2">Datos esenciales del cupón:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Número de participación: identificador único que se coteja durante el sorteo.</li>
            <li>Información del sorteo: nombre del evento, fecha, hora y lugar donde se llevará a cabo.</li>
            <li>Descripción del premio: detalle de lo que el ganador recibirá.</li>
          </ul>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 7. Premios</h2>
          <p className="text-gray-600 leading-relaxed mb-2">
            Durante la PROMOCIÓN serán sorteados/entregados los siguientes premios:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Primer Premio: Un AUTO de la marca Fiat Mobi Mecánico 1.0 cc Flex 0 KM año 2026.</li>
            <li>Segundo Premio: Dos MOTOCICLETAS de la marca Kenton Viva 110 0 KM.</li>
            <li>Tercer Premio: Dos TELÉFONOS CELULARES de la marca IPHONE 16 A3287 128GB.</li>
            <li>Cuarto Premio: Tres TELEVISIONES de la marca SMARTFY de 50”.</li>
            <li>Quinto Premio: Tres Electrodomésticos AIR FRYER de la marca JAM JM-TN40B 4LTS.</li>
            <li>Sexto Premio: Dos Electrodomésticos ASPIRADORA ROBOT de la marca XION XI-VRCROBOT20 BI-VOLTAJE.</li>
            <li>Séptimo Premio: Ocho Electrodomésticos LICUADORA MIX de la marca XION XI (4 de 600 ml y 4 de 380 ml).</li>
            <li>Octavo Premio: Una Bicicleta tipo SCOOTER de la marca HYE HY-SC8.5 BLUE GRAF.</li>
            <li>Noveno Premio: Una PATINADORA de la marca JOOG SCOOTER RS10.</li>
            <li>Décimo Premio: Siete VALES DE COMPRAS por 500.000 Gs.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los gastos de la transferencia del premio por escritura pública estarán a cargo del ORGANIZADOR, conforme al Art. 18° de la Ley 1016/97.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 8. Sorteo y premios</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Se estipula la realización de promociones mensuales, en las cuales se realizará un sorteo en forma mensual, en los meses de mayo a noviembre del corriente año. Los sorteos serán realizados en los siguientes meses con sus respectivos premios:
          </p>
          <div className="space-y-3 mb-4">
            {sorteos.map((s) => (
              <div key={s.nombre} className="rounded-lg border border-gray-200 p-4">
                <p className="font-bold text-allways-dark uppercase mb-1">{s.nombre}</p>
                <p className="text-gray-600 text-sm mb-1">
                  <span className="font-semibold">Fecha:</span> {s.fecha}
                </p>
                <p className="text-gray-600 text-sm">
                  <span className="font-semibold">Premios:</span> {s.premios}
                </p>
              </div>
            ))}
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            El sorteo será realizado en las fechas propuestas del corriente año 2026, en el local del ORGANIZADOR, a las 15:00 horas, en la casa Matriz de Ciudad del Este, San José Import Export S.A., ubicada sobre la calle Guayaibí Nº 1065 – Barrio Amambay, Ciudad del Este, del Departamento de Alto Paraná.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Como sistema de sorteo se empleará el uso de los CUPONES, el cual arrojará como resultado ganador a aquel que, al azar, haya sido retenido el número de los CUPONES designado para el efecto.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            La persona que resulte ganadora deberá presentarse dentro de los 60 días de realizado el mismo y deberá presentar al responsable del sorteo su documento de identidad correspondiente, el que será cotejado con el cupón ganador, debiendo coincidir todos los datos; en caso contrario, se anulará el cupón e inmediatamente se procederá a realizar un nuevo sorteo.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Las personas que resulten ganadoras de VALES de compras podrán canjearlos en cualquier PDV cercano al Cliente.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            No será permitido cambiar o canjear los premios sorteados por dinero o por Vales de compras.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 9. Exclusión</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            En el caso en que el ORGANIZADOR constate que el potencial ganador se encuentra inhabilitado por hallarse dentro de las restricciones de participación establecidas en la cláusula 4° de estas bases y condiciones, se procederá a la anulación del cupón seleccionado, dejando constancia del hecho mediante acta notarial donde se describirá en detalle el motivo.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 10. Notificación</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los ganadores serán notificados vía telefónica en el transcurso de las 48 horas posteriores al sorteo. Además, el listado de ganadores (nombre, apellido y tres últimos dígitos del documento de identidad) será publicado en la página web del ORGANIZADOR y en sus redes sociales.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 11. Retiro de premios</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            El ganador tendrá un plazo improrrogable de 60 días posteriores a la fecha del sorteo para retirar el premio, y a tal efecto deberá presentarse en el lugar indicado por el ORGANIZADOR. Asimismo, deberá presentar al responsable del sorteo su documento de identidad correspondiente, el que será cotejado con el cupón ganador, debiendo coincidir todos los datos.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 12. Premios vacantes</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Cumplido el plazo sin que se haya presentado el ganador, el premio será destinado al financiamiento del FONARESS, conforme a lo establecido en la Ley 6703/20.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 13. Responsabilidad</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            El ORGANIZADOR no será responsable del uso o destino que el ganador otorgue a los premios recibidos.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 14. Publicidad</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La publicidad del sorteo se realizará en las redes sociales que el ORGANIZADOR pueda proporcionar.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Asimismo, el ganador, al momento de aceptar y retirar el premio, otorga de manera gratuita al ORGANIZADOR el derecho a publicitar su nombre e imagen, para la difusión en comerciales de televisión, radio, prensa escrita o redes sociales, por un plazo de 12 meses contados desde finalizada la PROMOCIÓN. La cesión de derechos será otorgada al solo efecto de publicitar el resultado de la promoción de referencia, y no será utilizada para otros fines.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 15. Privacidad</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Los datos personales que el ORGANIZADOR reciba o posea de los participantes serán tratados de acuerdo con la legislación vigente en materia de protección de datos de carácter personal. El ORGANIZADOR se compromete a dar un tratamiento prudente y cuidadoso de los datos entregados por el PARTICIPANTE y almacenados al momento del registro de la PROMOCIÓN. En caso de que el registro de participación sea realizado por medios electrónicos, el ORGANIZADOR informará al PARTICIPANTE del uso o destino que hará de la información personal recopilada, mediante mensaje que será publicado en la misma plataforma de registro.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 16. Modificaciones</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            El ORGANIZADOR podrá, previa autorización de CONAJZAR, modificar, extender, ampliar, suspender o cancelar esta PROMOCIÓN cuando circunstancias imprevistas así lo justifiquen. En todos los casos, las modificaciones introducidas deberán ajustarse a la legislación vigente y no afectarán derechos adquiridos.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 17. Reglamento de la promoción</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La participación en esta promoción implica la aceptación de lo establecido en estas bases y condiciones, documento que estará a disposición de los participantes en el sitio web del organizador y en sus redes sociales. La eventual declaración de nulidad de una o más cláusulas de estas Bases y Condiciones no afectará la validez de las demás cláusulas.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 18. Interpretación</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Ante cualquier discrepancia o contradicción que pudiese existir entre las disposiciones establecidas en las presentes Bases y Condiciones y en los reglamentos de condiciones de uso mencionados en el artículo anterior, prevalecerá lo establecido en las presentes Bases y Condiciones.
          </p>

          <h2 className="text-xl font-bold text-allways-navy mt-8 mb-3">Artículo 19. Jurisdicción</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Toda situación que pudiera derivar en un conflicto entre el ORGANIZADOR y el PARTICIPANTE podrá ser resuelta, a pedido de las partes, por la CONAJZAR. Queda además expedita la vía jurisdiccional, en caso de que los interesados así lo consideren para la mejor defensa de sus derechos, y a tal efecto se establece la Circunscripción Judicial correspondiente a la Ciudad de Ciudad del Este de la República del Paraguay.
          </p>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-400">
              San José Import Export S.A. — Ciudad del Este, Paraguay — 2026
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
