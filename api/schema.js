const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Qué event_names existen y cuántos registros tiene cada uno
  const { data: events } = await supabase
    .from('bot_analytics_log')
    .select('event_name')
    .limit(100000);

  const counts = {};
  (events || []).forEach(r => {
    counts[r.event_name] = (counts[r.event_name] || 0) + 1;
  });

  // Muestra 3 filas de ejemplo con todas las columnas
  const { data: sample } = await supabase
    .from('bot_analytics_log')
    .select('*')
    .limit(3);

  res.json({ event_counts: counts, sample_row: sample });
};
