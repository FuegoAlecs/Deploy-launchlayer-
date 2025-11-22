
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xqugncgzcuduswusxneg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdWduY2d6Y3VkdXN3dXN4bmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU1MDIzMiwiZXhwIjoyMDc2MTI2MjMyfQ.Cxcy9w6128N-Y5FLIfllZoczeLDSijaSwzrPr9ldwwA'
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectDatabase() {
  console.log('--- Inspecting beta_codes ---');
  const { data: betaCodes, error: betaError } = await supabase
    .from('beta_codes')
    .select('*')
    .limit(1);

  if (betaError) console.error('Error reading beta_codes:', betaError);
  else console.log('beta_codes sample:', betaCodes);

  console.log('\n--- Inspecting user_echo_limits ---');
  const { data: echoLimits, error: echoError } = await supabase
    .from('user_echo_limits')
    .select('*')
    .limit(1);

  if (echoError) console.log('Error reading user_echo_limits:', echoError.message);
  else console.log('user_echo_limits sample:', echoLimits);

  console.log('\n--- Inspecting echo_interactions ---');
  const { data: echoInteractions, error: interactionsError } = await supabase
    .from('echo_interactions')
    .select('*')
    .limit(1);

  if (interactionsError) console.log('Error reading echo_interactions:', interactionsError.message);
  else console.log('echo_interactions sample:', echoInteractions);
}

inspectDatabase();
