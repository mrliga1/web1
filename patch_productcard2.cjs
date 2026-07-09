const fs = require('fs');
let code = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8');

code = code.replace(
  /<div\s*onClick=\{\(\) => onNavigate\(\{ screen: 'product-detail', productId: item\.id, slug: generateSlug\(item\.title\) \}\)\}\s*className="([^"]+)"\s*>/,
  `<Link\n      href={getRouteUrl({ screen: 'product-detail', productId: item.id, slug: generateSlug(item.title) })}\n      className="$1 block"\n    >`
);

code = code.replace(
  /      <\/div>\n    <\/div>\n  \);\n}/,
  `      </div>\n    </Link>\n  );\n}`
);

fs.writeFileSync('src/components/ProductCard.tsx', code);
