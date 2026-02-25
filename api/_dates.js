/**
 * Parsea los query params y devuelve { desde, hasta } en ISO UTC
 * Soporta:
 *   ?periodo=7|30|90   → últimos N días
 *   ?periodo=month     → primer día del mes actual (hora Perú) hasta ahora
 *   ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD → rango custom (fechas en hora Perú, UTC-5)
 */
const PERU_OFFSET_MS = -5 * 60 * 60 * 1000;

module.exports = function getDates(query) {
  const nowUtc = new Date();

  if (query.desde && query.hasta) {
    const desde = new Date(query.desde + 'T00:00:00-05:00').toISOString();
    const hasta  = new Date(query.hasta  + 'T23:59:59-05:00').toISOString();
    return { desde, hasta };
  }

  if (query.periodo === 'month') {
    // Primer día del mes actual en hora Perú
    const nowPeru = new Date(nowUtc.getTime() + PERU_OFFSET_MS);
    const year  = nowPeru.getUTCFullYear();
    const month = String(nowPeru.getUTCMonth() + 1).padStart(2, '0');
    const desde = new Date(`${year}-${month}-01T00:00:00-05:00`).toISOString();
    return { desde, hasta: nowUtc.toISOString() };
  }

  const dias = parseInt(query.periodo) || 7;
  const desde = new Date(nowUtc.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();
  return { desde, hasta: nowUtc.toISOString() };
};
