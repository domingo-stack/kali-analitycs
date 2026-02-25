const { createClient } = require('@supabase/supabase-js');
const auth = require('./_auth');
const getDates = require('./_dates');

const PERU_OFFSET_MS = -5 * 60 * 60 * 1000;

function toPeruDate(isoString) {
  const d = new Date(new Date(isoString).getTime() + PERU_OFFSET_MS);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD en hora Perú
}

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
    .select('created_at, event_name, conversation_id')
    .in('event_name', [
      'workflow_started',
      'payment_detected', 'payment_detected_out',
      'derivation_human_support', 'derivation_human_support_out',
    ])
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .limit(200000);

  if (error) return res.status(500).json({ error: error.message });

  // Agrupar por fecha Perú
  const days = {};
  (data || []).forEach(row => {
    const fecha = toPeruDate(row.created_at);
    if (!days[fecha]) days[fecha] = { fecha, convIds: new Set(), pagos: 0, derivaciones: 0 };

    if (row.event_name === 'workflow_started') {
      days[fecha].convIds.add(row.conversation_id);
    } else if (row.event_name === 'payment_detected' || row.event_name === 'payment_detected_out') {
      days[fecha].pagos++;
    } else {
      days[fecha].derivaciones++;
    }
  });

  const result = Object.values(days)
    .map(d => ({ fecha: d.fecha, conversaciones: d.convIds.size, pagos: d.pagos, derivaciones: d.derivaciones }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  res.json(result);
};
