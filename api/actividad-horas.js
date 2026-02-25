const { createClient } = require('@supabase/supabase-js');
const auth = require('./_auth');
const getDates = require('./_dates');

const PERU_OFFSET_MS = -5 * 60 * 60 * 1000;

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
    .select('created_at')
    .eq('event_name', 'workflow_started')
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .limit(200000);

  if (error) return res.status(500).json({ error: error.message });

  const hourTotals = Array(24).fill(0);
  const daySet = new Set();

  (data || []).forEach(row => {
    const peruTime = new Date(new Date(row.created_at).getTime() + PERU_OFFSET_MS);
    const hour = peruTime.getUTCHours();
    const date = peruTime.toISOString().slice(0, 10);
    hourTotals[hour]++;
    daySet.add(date);
  });

  const numDias = Math.max(1, daySet.size);

  // Devolver total Y promedio para que el frontend pueda mostrar ambos
  const result = hourTotals.map((total, hora) => ({
    hora,
    total,                                        // total acumulado del período
    conversaciones: +(total / numDias).toFixed(1), // promedio por día (para el gráfico)
  }));

  res.json(result);
};
