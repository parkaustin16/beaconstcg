import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  db: { schema: 'catalog' },
});

(async () => {
  // Get all sets and find one with products
  const { data: sets } = await supabase.from('sets').select('set_id, name, code');
  
  let foundSet = null;
  let foundProducts = null;
  
  for (const set of sets || []) {
    const { data: products } = await supabase
      .from('products')
      .select('product_id')
      .eq('set_id', set.set_id)
      .limit(1);
    
    if (products?.length) {
      foundSet = set;
      foundProducts = products;
      break;
    }
  }

  if (!foundSet) {
    console.log('No sets with products found');
    process.exit(1);
  }

  const setId = foundSet.set_id;
  console.log(`Testing with set: ${foundSet.name} (${foundSet.code})\n`);

  // Get all products for this set
  const { data: products } = await supabase
    .from('products')
    .select('product_id')
    .eq('set_id', setId);

  console.log(`Products in this set: ${products?.length}`);
  
  const productIds = products?.map((p: any) => p.product_id) || [];
  
  // Get product_localizations for these products
  const { data: localizations } = await supabase
    .from('product_localizations')
    .select('*')
    .in('product_id', productIds);

  console.log(`Product_localizations for these products: ${localizations?.length}`);
  
  // Get Korean localizations
  const { data: krLocalizations } = await supabase
    .from('product_localizations')
    .select('*')
    .in('product_id', productIds)
    .eq('language', 'kr');

  console.log(`Korean product_localizations: ${krLocalizations?.length}`);
  
  if (krLocalizations?.length) {
    console.log('\nFirst Korean localization:');
    console.log(JSON.stringify(krLocalizations[0], null, 2));
  }

  // Check all distinct languages in product_localizations
  const { data: allLocs } = await supabase
    .from('product_localizations')
    .select('language')
    .limit(1000);

  const languages = new Set(allLocs?.map((l: any) => l.language));
  console.log(`\nLanguages in product_localizations:`, Array.from(languages));
})();
