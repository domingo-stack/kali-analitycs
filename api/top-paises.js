const { createClient } = require('@supabase/supabase-js');
const auth = require('./_auth');
const getDates = require('./_dates');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { desde, hasta } = getDates(req.query);

  const { data, error } = await supabase
    .from('bot_analytics_log')
    .select('conversation_id, country')
    .eq('event_name', 'workflow_started')
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .limit(200000);

  if (error) return res.status(500).json({ error: error.message });

  // Agrupar por país, contar conversation_id únicos
  const paises = {};
  (data || []).forEach(row => {
    const pais = row.country || 'Desconocido';
    if (!paises[pais]) paises[pais] = new Set();
    paises[pais].add(row.conversation_id);
  });

  const result = Object.entries(paises)
    .map(([pais, ids]) => ({ pais, conversaciones: ids.size }))
    .sort((a, b) => b.conversaciones - a.conversaciones);

  res.json(result);
};
