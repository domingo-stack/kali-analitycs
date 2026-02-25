const { createClient } = require('@supabase/supabase-js');
const auth = require('./_auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase.rpc('get_dashboard_actividad_diaria', {
    dias: parseInt(req.query.periodo) || 7
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
