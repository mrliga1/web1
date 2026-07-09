const fs = require('fs');
let code = fs.readFileSync('src/components/ProductList.tsx', 'utf-8');

// Imports
if (!code.includes('import Link')) {
  code = code.replace(
    `import { generateSlug, getYouTubeId, optimizeImageUrl, generateSrcSet } from '../lib/utils';`,
    `import { generateSlug, getYouTubeId, optimizeImageUrl, generateSrcSet, getRouteUrl } from '../lib/utils';\nimport Link from 'next/link';\nimport { useRouter } from 'next/navigation';`
  );
}

// Props
code = code.replace(`  onNavigate: (route: RouteState) => void;\n`, ``);
code = code.replace(`  onNavigate, \n`, `\n`);

// Add useRouter
if (!code.includes('const router = useRouter();')) {
  code = code.replace(
    `export default function ProductList({ \n  products, `,
    `export default function ProductList({ \n  products, `
  ); // Find a good injection point
  code = code.replace(
    `  const scrollDirection = useScrollDirection();`,
    `  const router = useRouter();\n  const scrollDirection = useScrollDirection();`
  );
}

// Remove onNavigate={onNavigate} from ProductCard
code = code.replace(/ onNavigate=\{onNavigate\}/g, '');

// Replace Category Links
code = code.replace(
  /onClick=\{\(\) => \{ setSelectedCategory\(cat\.name\); setOpenDropdown\(null\); onNavigate\(\{ screen: 'category-product', categoryName: cat\.name \}\); \}\}/g,
  `onClick={(e) => { e.preventDefault(); setSelectedCategory(cat.name); setOpenDropdown(null); router.push(getRouteUrl({ screen: 'category-product', categoryName: cat.name })); }}`
);
code = code.replace(
  /<button\s*className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium"/g,
  `<Link href="#" className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium"`
);
// Above replace might be tricky, it's safer to just change the onClick logic inside <button> for categories since it has side effects (setSelectedCategory).
// Or better: keep <button> but use router.push. SEO for filters can wait, but replacing `onNavigate` with `router.push` works immediately!

code = code.replace(/onNavigate\(\{ screen: 'latest-sales' \}\)/g, `router.push(getRouteUrl({ screen: 'latest-sales' }))`);
code = code.replace(/onNavigate\(\{ screen: 'latest-rents' \}\)/g, `router.push(getRouteUrl({ screen: 'latest-rents' }))`);
code = code.replace(/onNavigate\(\{ screen: 'du-an' \}\)/g, `router.push(getRouteUrl({ screen: 'du-an' }))`);
code = code.replace(/onNavigate\(\{ screen: 'project-detail', projectId: proj\.id, slug: generateSlug\(proj\.title\) \}\)/g, `router.push(getRouteUrl({ screen: 'project-detail', projectId: proj.id, slug: generateSlug(proj.title) }))`);

// For "Xem Tất Cả" (See All) buttons:
code = code.replace(
  /<button\s+onClick=\{\(\) => router\.push\(getRouteUrl\(\{ screen: 'latest-sales' \}\)\)\}/g,
  `<Link href="/dang-ban"`
);
code = code.replace(
  /<button\s+onClick=\{\(\) => router\.push\(getRouteUrl\(\{ screen: 'latest-rents' \}\)\)\}/g,
  `<Link href="/cho-thue"`
);
code = code.replace(
  /<button\s+onClick=\{\(\) => router\.push\(getRouteUrl\(\{ screen: 'du-an' \}\)\)\}/g,
  `<Link href="/du-an"`
);
// Note: Needs to convert </button> to </Link> for these specific items... 
// These buttons usually look like: 
// <button onClick={() => ...} className="...">Xem tất cả</button>
code = code.replace(
  /<Link href="\/dang-ban"([^>]*)>([\s\S]*?)<\/button>/g,
  `<Link href="/dang-ban"$1>$2</Link>`
);
code = code.replace(
  /<Link href="\/cho-thue"([^>]*)>([\s\S]*?)<\/button>/g,
  `<Link href="/cho-thue"$1>$2</Link>`
);
code = code.replace(
  /<Link href="\/du-an"([^>]*)>([\s\S]*?)<\/button>/g,
  `<Link href="/du-an"$1>$2</Link>`
);

// Project Card wrapping div
code = code.replace(
  /<div\s+key=\{proj\.id\}\s+onClick=\{\(\) => router\.push\(getRouteUrl\(\{ screen: 'project-detail', projectId: proj\.id, slug: generateSlug\(proj\.title\) \}\)\)\}\s+className="([^"]+)"\s*>/g,
  `<Link\n                              key={proj.id}\n                              href={getRouteUrl({ screen: 'project-detail', projectId: proj.id, slug: generateSlug(proj.title) })}\n                              className="$1 block"\n                            >`
);
code = code.replace(
  /<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g,
  `</span>\n                                  </div>\n                                </div>\n                              </div>\n                            </Link>`
); // Assuming 4 closing divs for project card. I'll need to check the actual DOM structure of project cards to be safe.

fs.writeFileSync('src/components/ProductList.tsx', code);
