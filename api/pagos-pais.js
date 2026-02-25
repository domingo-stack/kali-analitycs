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
    .select('event_name, country')
    .in('event_name', ['payment_detected', 'payment_detected_out'])
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .limit(200000);

  if (error) return res.status(500).json({ error: error.message });

  const paises = {};
  (data || []).forEach(row => {
    const pais = row.country || 'Desconocido';
    if (!paises[pais]) paises[pais] = { pais, total_pagos: 0, dentro_horario: 0, fuera_horario: 0 };
    paises[pais].total_pagos++;
    if (row.event_name === 'payment_detected') paises[pais].dentro_horario++;
    else paises[pais].fuera_horario++;
  });

  const result = Object.values(paises).sort((a, b) => b.total_pagos - a.total_pagos);
  res.json(result);
};
