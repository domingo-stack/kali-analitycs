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

  // Paso 1: todas las conversaciones del período con su country (workflow_started)
  const { data: wfData, error: wfError } = await supabase
    .from('bot_analytics_log')
    .select('conversation_id, country')
    .eq('event_name', 'workflow_started')
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .limit(200000);

  if (wfError) return res.status(500).json({ error: wfError.message });

  // Construir mapa conversation_id → country desde workflow_started
  const convCountry = {};
  const allConvIds = new Set();
  (wfData || []).forEach(row => {
    allConvIds.add(row.conversation_id);
    if (!convCountry[row.conversation_id] && row.country) {
      convCountry[row.conversation_id] = row.country;
    }
  });

  // Paso 2: para las conversaciones sin country, buscar en country_detected
  const sinPais = [...allConvIds].filter(id => !convCountry[id]);
  if (sinPais.length > 0) {
    // Supabase IN tiene límite ~1000 items — lo partimos en chunks si hace falta
    const chunks = [];
    for (let i = 0; i < sinPais.length; i += 1000) chunks.push(sinPais.slice(i, i + 1000));

    for (const chunk of chunks) {
      const { data: cdData } = await supabase
        .from('bot_analytics_log')
        .select('conversation_id, country')
        .eq('event_name', 'country_detected')
        .in('conversation_id', chunk)
        .limit(200000);

      (cdData || []).forEach(row => {
        if (!convCountry[row.conversation_id] && row.country) {
          convCountry[row.conversation_id] = row.country;
        }
      });
    }
  }

  // Paso 3: agrupar por país
  const paises = {};
  allConvIds.forEach(id => {
    const pais = convCountry[id] || 'Desconocido';
    paises[pais] = (paises[pais] || 0) + 1;
  });

  const result = Object.entries(paises)
    .map(([pais, conversaciones]) => ({ pais, conversaciones }))
    .sort((a, b) => b.conversaciones - a.conversaciones);

  res.json(result);
};
