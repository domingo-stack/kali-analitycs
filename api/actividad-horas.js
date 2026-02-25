const { createClient } = require('@supabase/supabase-js');
const auth = require('./_auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const periodo = parseInt(req.query.periodo) || 7;

  const desde = new Date();
  desde.setDate(desde.getDate() - periodo);

  // Service key + limit alto: sin row-limit de 1000 filas
  const { data, error } = await supabase
    .from('bot_analytics_log')
    .select('created_at, conversation_id')
    .eq('event_name', 'workflow_started')
    .gte('created_at', desde.toISOString())
    .limit(100000);

  if (error) return res.status(500).json({ error: error.message });

  // Agregar conversaciones únicas por hora en Perú (UTC-5)
  const hourSets = Array.from({ length: 24 }, () => new Set());
  (data || []).forEach(row => {
    const peruMs = new Date(row.created_at).getTime() - 5 * 3600 * 1000;
    const hour = new Date(peruMs).getUTCHours();
    hourSets[hour].add(row.conversation_id);
  });

  const result = hourSets.map((s, hora) => ({ hora, conversaciones: s.size }));
  res.json(result);
};
