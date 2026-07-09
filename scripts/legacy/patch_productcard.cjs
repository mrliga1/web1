const fs = require('fs');
let code = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8');

// Imports
code = code.replace(
  `import { Product, RouteState } from '../types';`,
  `import { Product } from '../types';\nimport Link from 'next/link';\nimport { getRouteUrl } from '../lib/utils';`
);

// Props
code = code.replace(
  `  onNavigate: (route: RouteState) => void;\n`,
  ``
);

// Function signature
code = code.replace(
  `export default function ProductCard({ item, onNavigate, badgeText, badgeColor, priority = false }: ProductCardProps) {`,
  `export default function ProductCard({ item, badgeText, badgeColor, priority = false }: ProductCardProps) {`
);

// Wrapper element
code = code.replace(
  `    <div\n      onClick={() => onNavigate({ screen: 'product-detail', productId: item.id, slug: generateSlug(item.title) })}\n      className="w-full shrink-0 bg-bg-surface hover:bg-bg-base border border-border-color hover:border-primary/30 rounded-lg overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-row sm:flex-col"\n    >`,
  `    <Link\n      href={getRouteUrl({ screen: 'product-detail', productId: item.id, slug: generateSlug(item.title) })}\n      className="w-full shrink-0 bg-bg-surface hover:bg-bg-base border border-border-color hover:border-primary/30 rounded-lg overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-row sm:flex-col block"\n    >`
);

// Closing element (the last </div> is at line 113)
code = code.replace(
  `      </div>\n    </div>\n  );\n}`,
  `      </div>\n    </Link>\n  );\n}`
);

fs.writeFileSync('src/components/ProductCard.tsx', code);
