import { supabase } from '../src/lib/supabase';

async function test() {
  const { data, error } = await supabase.from('store_settings').select('*');
  console.log("store_settings:", { data, error });

  const { data: c, error: ce } = await supabase.from('carousel_settings').select('*');
  console.log("carousel_settings:", { data: c, error: ce });
}
test();
