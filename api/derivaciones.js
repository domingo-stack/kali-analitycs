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
    .select('event_name')
    .in('event_name', ['derivation_human_support', 'derivation_human_support_out'])
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .limit(200000);

  if (error) return res.status(500).json({ error: error.message });

  let dentro = 0, fuera = 0;
  (data || []).forEach(row => {
    if (row.event_name === 'derivation_human_support') dentro++;
    else fuera++;
  });

  res.json([{ total: dentro + fuera, dentro_horario: dentro, fuera_horario: fuera }]);
};
