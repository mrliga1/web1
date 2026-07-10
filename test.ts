import { supabase } from './src/supabase';
import { generateSlug } from './src/lib/utils';
async function test() {
  const { data: products } = await supabase.from('products').select('data');
  if (products) {
    const slug = 'can-ho-quan-2';
    const matchedItem = products.find((n: any) => generateSlug(n.data?.title || '') === slug);
    if (matchedItem) {
      const itemData = matchedItem.data;
      const location = itemData.district || "Đang cập nhật";
      const price = itemData.priceText || "Thỏa thuận";
      const area = itemData.area ? `${itemData.area}m2` : "";
      const bedrooms = itemData.bedrooms ? `${itemData.bedrooms} PN` : "";
      
      let richDesc = `📍 Vị trí: ${location} | 💰 Giá: ${price}`;
      if (area) richDesc += ` | 📐 Diện tích: ${area}`;
      if (bedrooms) richDesc += ` | 🛏️ ${bedrooms}`;
      richDesc += `. Khám phá chi tiết tại Greenia Homes!`;

      console.log(richDesc);
    } else {
      console.log('Not found');
    }
  }
}
test();
