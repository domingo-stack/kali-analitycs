module.exports = function auth(req) {
  const token = process.env.DASHBOARD_TOKEN;
  if (!token) return true; // Si no hay token configurado, permite todo

  // Verificar Authorization: Bearer TOKEN
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7) === token;
  }

  // Verificar ?token=TOKEN en query string
  if (req.query && req.query.token === token) return true;

  return false;
};
