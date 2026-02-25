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

  const [convRes, pagosRes, derivRes] = await Promise.all([
    supabase.from('bot_analytics_log')
      .select('conversation_id')
      .eq('event_name', 'workflow_started')
      .gte('created_at', desde).lte('created_at', hasta).limit(200000),
    supabase.from('bot_analytics_log')
      .select('id')
      .in('event_name', ['payment_detected', 'payment_detected_out'])
      .gte('created_at', desde).lte('created_at', hasta).limit(200000),
    supabase.from('bot_analytics_log')
      .select('id')
      .in('event_name', ['derivation_human_support', 'derivation_human_support_out'])
      .gte('created_at', desde).lte('created_at', hasta).limit(200000),
  ]);

  if (convRes.error)  return res.status(500).json({ error: convRes.error.message });
  if (pagosRes.error) return res.status(500).json({ error: pagosRes.error.message });
  if (derivRes.error) return res.status(500).json({ error: derivRes.error.message });

  const conversaciones = new Set((convRes.data || []).map(r => r.conversation_id)).size;
  const pagos          = (pagosRes.data || []).length;
  const derivaciones   = (derivRes.data || []).length;
  const tasa_exito     = conversaciones > 0
    ? +(((conversaciones - derivaciones) / conversaciones) * 100).toFixed(1)
    : 0;

  res.json([{ total_conversaciones: conversaciones, total_pagos: pagos, total_derivaciones: derivaciones, tasa_exito_porcentaje: tasa_exito }]);
};
