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
    .select('created_at, conversation_id')
    .eq('event_name', 'workflow_started')
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .limit(200000);

  if (error) return res.status(500).json({ error: error.message });

  // Para cada conversación única, quedarnos solo con su PRIMER evento del período
  const convFirstTs = {};
  (data || []).forEach(row => {
    const ts = new Date(row.created_at).getTime();
    if (!convFirstTs[row.conversation_id] || ts < convFirstTs[row.conversation_id]) {
      convFirstTs[row.conversation_id] = ts;
    }
  });

  // Distribuir cada conversación en la hora de su primer evento (hora Perú)
  const hourTotals = Array(24).fill(0);
  const daySet = new Set();

  Object.values(convFirstTs).forEach(ts => {
    const peruTime = new Date(ts + PERU_OFFSET_MS);
    const hour = peruTime.getUTCHours();
    const date = peruTime.toISOString().slice(0, 10);
    hourTotals[hour]++;
    daySet.add(date);
  });

  // total = suma de conversaciones únicas (debe coincidir con KPI)
  // conversaciones = promedio diario por hora (para el gráfico)
  const numDias = Math.max(1, daySet.size);
  const result = hourTotals.map((total, hora) => ({
    hora,
    total,
    conversaciones: +(total / numDias).toFixed(1),
  }));

  res.json(result);
};
