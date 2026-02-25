module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const checks = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    DASHBOARD_TOKEN: !!process.env.DASHBOARD_TOKEN,
    supabase_module: false,
    supabase_connect: null,
  };

  try {
    const { createClient } = require('@supabase/supabase-js');
    checks.supabase_module = true;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const { error } = await supabase.from('bot_analytics_log').select('id').limit(1);
    checks.supabase_connect = error ? error.message : 'ok';
  } catch (e) {
    checks.supabase_module_error = e.message;
  }

  res.json(checks);
};
