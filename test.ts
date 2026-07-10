import { supabase } from './src/supabase';
async function test() {
  const { data: products } = await supabase.from('products').select('data').limit(1);
  if (products) {
    console.log(typeof products[0].data);
    console.log(products[0].data.title);
  }
}
test();
