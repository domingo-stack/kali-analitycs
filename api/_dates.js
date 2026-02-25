/**
 * Parsea los query params y devuelve { desde, hasta } en ISO UTC
 * Soporta ?periodo=7 o ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD (fechas en hora Perú, UTC-5)
 */
module.exports = function getDates(query) {
  if (query.desde && query.hasta) {
    const desde = new Date(query.desde + 'T00:00:00-05:00').toISOString();
    const hasta  = new Date(query.hasta  + 'T23:59:59-05:00').toISOString();
    return { desde, hasta };
  }
  const dias = parseInt(query.periodo) || 7;
  const hasta = new Date().toISOString();
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
  return { desde, hasta };
};
