<task>
Agregar al backend de Expensia el/los endpoint/s necesarios para alimentar la sección "Meses anteriores" de la pantalla de Presupuesto del frontend: una serie histórica que, por mes, devuelva el presupuesto definido y el total gastado en ese mes.
</task>

<context>
Expensia es una API REST de gestión de gastos personales, multi-tenant por usuario vía JWT (el usuario actuante se deriva siempre del token). Hoy el dominio de presupuestos expone únicamente:

- `POST /api/budgets` — crea el presupuesto de un mes (`amount`, `currencyCode`, `month` en `YYYY-MM`). El presupuesto es inmutable, único por (usuario, mes), y sólo se puede crear para el mes actual o el próximo.
- `GET /api/budgets/current` — resumen del mes en curso (`month`, `currencyCode`, `totalBudget`, `remainingBudget`, `dailyBudget`), o `200` con body vacío si el usuario no tiene presupuesto para el mes actual.

No hay forma de consultar presupuestos de meses pasados ni el gasto total de un mes agregado. El frontend hoy sólo puede aproximarlo pidiendo `GET /api/expenses?month=YYYY-MM` mes por mes y sumando en el cliente, lo cual implica N requests y sumar montos decimales en el navegador.

El diseño del frontend muestra, para cada mes del histórico: etiqueta del mes, total gastado, presupuesto de ese mes, y si se pasó o no del presupuesto (una barra con una marca vertical en el valor del presupuesto).
</context>

<references>
- El contrato de API actual y las reglas del dominio (montos como strings decimales, escalas por moneda, RFC 9457, timezone del usuario) están documentados en `project-description-and-endpoints.md`, incluido en el handoff de diseño del frontend.
- Seguir los patrones ya existentes en el módulo de budgets (controller, service, repository, DTOs de response) y en `GET /api/budgets/current` para el cálculo de gasto del mes.
</references>

<requirements>
- Exponer un endpoint de histórico de presupuestos del usuario autenticado, con la serie de meses ya agregada del lado del servidor (un solo request para toda la serie).
- Cada elemento de la serie debe traer, como mínimo: el mes (`YYYY-MM`), el monto del presupuesto, la moneda del presupuesto y el total gastado en ese mes en esa misma moneda.
- El total gastado de cada mes se calcula igual que en `GET /api/budgets/current`: suma de todos los gastos del mes en la moneda del presupuesto, incluyendo las ocurrencias auto-generadas por gastos recurrentes.
- Devolver los montos como strings decimales exactos, normalizados a la escala de la moneda, igual que el resto de la API. No usar floats en ningún punto del cálculo.
- Permitir acotar el rango de meses a devolver (por ejemplo una cantidad de meses hacia atrás, o un mes desde / hasta), con un valor por defecto razonable y un tope máximo para evitar respuestas ilimitadas.
- Resolver "mes actual" y los meses del rango con la timezone IANA del perfil del usuario, nunca con el reloj del servidor.
- Excluir el mes en curso de la serie histórica, o marcarlo explícitamente como en curso: la pantalla ya muestra el mes actual con su propio bloque y no debe duplicarlo.
- Definir el comportamiento para meses del rango en los que el usuario no tenía presupuesto: o se omiten del listado, o se devuelven con el presupuesto en `null` y el gasto informado. Elegir una de las dos y documentarla.
- Definir el comportamiento cuando el usuario tuvo presupuestos en distintas monedas en distintos meses: cada elemento lleva su propia moneda y no se convierte nada entre monedas.
- Ordenar la serie cronológicamente ascendente.
- El endpoint devuelve exclusivamente datos del usuario del token; no acepta ningún `userId`.
</requirements>

<constraints>
- No cambiar la firma ni la semántica de `POST /api/budgets` ni de `GET /api/budgets/current`; el frontend ya depende de ambos, incluido el caso de `200` con body vacío.
- No introducir mutabilidad en `Budget`: sigue siendo inmutable y único por (usuario, mes).
- Mantener el formato de error RFC 9457 `application/problem+json` y los códigos de status ya usados por la API (`400` para rango o formato inválido, `401` sin token válido).
- Una sola query agregada (o el mínimo posible) para calcular el gasto de todos los meses del rango; no hacer una consulta por mes ni cargar todos los gastos en memoria para sumarlos en Java si se puede agregar en la base.
- Respetar el estilo y la estructura de paquetes del proyecto; no agregar dependencias nuevas.
</constraints>

<acceptance_criteria>
- Un usuario con presupuestos en meses anteriores obtiene, en un único request, la serie con mes, presupuesto, moneda y gastado por mes, y los montos vienen como strings con la cantidad de decimales de la escala de cada moneda.
- El total gastado de un mes cerrado coincide exactamente con la suma de los `amount` que devuelve `GET /api/expenses?month=<ese mes>` filtrando por la moneda del presupuesto.
- Un usuario recién registrado, sin presupuestos, recibe una serie vacía y no un error.
- Sin header `Authorization` la respuesta es `401`; con el token de otro usuario no se filtra ningún dato ajeno.
- Un rango inválido o un parámetro mal formado devuelve `400` con el `detail` explicando el problema.
- Hay tests que cubren: serie con varios meses y monedas distintas, mes sin presupuesto dentro del rango, usuario sin datos, exclusión del mes en curso, y el tope máximo de meses.
</acceptance_criteria>

<output_format>
Además del código y los tests, actualizar `project-description-and-endpoints.md` con la sección del nuevo endpoint siguiendo el mismo formato que el resto del documento: método y path, tabla de parámetros, ejemplo de request y de response con montos como strings, y la lista de errores posibles con sus status y mensajes. El frontend se construye a partir de ese archivo.
</output_format>

<assumptions>
- El nombre y la forma exacta del endpoint quedan a criterio de quien implemente, siguiendo la convención del proyecto (por ejemplo `GET /api/budgets/history` o `GET /api/budgets`), siempre que cumpla con lo pedido acá y quede documentado.
- El histórico se limita a datos ya existentes: no se pide backfill ni recálculo de nada, la serie se deriva de los presupuestos y gastos guardados.
- No se pide paginación: alcanza con acotar el rango de meses.
</assumptions>
