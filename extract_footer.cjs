const fs = require('fs');

const appCode = fs.readFileSync('src/App.tsx', 'utf-8');

const footerStart = appCode.indexOf('<footer');
// We need to find the matching closing tag </footer>
let footerEnd = appCode.indexOf('</footer>', footerStart);
if (footerEnd !== -1) {
    footerEnd += '</footer>'.length;
}

const footerBlock = appCode.slice(footerStart, footerEnd);

let footerComponent = `import React from 'react';
import Link from 'next/link';
import { Building2, Compass, Home, MapPin, Search } from 'lucide-react';
import { getRouteUrl } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();
  
  return (
    ${footerBlock}
  );
}
`;

// Replace handleNavigate with Link
footerComponent = footerComponent.replace(/<button\s+onClick=\{\(\) => handleNavigate\(\{ screen: "([^"]+)" \}\)\}\s+className="([^"]+)"\s*>/g, 
  `<Link href={getRouteUrl({ screen: "$1" })} className="$2">`);
footerComponent = footerComponent.replace(/<button\s+onClick=\{\(\) => handleNavigate\(\{ screen: '([^']+)' \}\)\}\s+className="([^"]+)"\s*>/g, 
  `<Link href={getRouteUrl({ screen: '$1' })} className="$2">`);
footerComponent = footerComponent.replace(/<button\s+onClick=\{\(\) =>\s*handleNavigate\(\{\s*screen: "category-product",\s*categoryName: "([^"]+)",\s*\}\)\s*\}\s+className="([^"]+)"\s*>/g, 
  `<Link href={getRouteUrl({ screen: 'category-product', categoryName: '$1' })} className="$2">`);

// Replace button closing tag with Link closing tag (this requires matching, we'll just replace </button> inside the <li> items)
footerComponent = footerComponent.replace(/<\/button>/g, `</Link>`);

fs.writeFileSync('src/components/Footer.tsx', footerComponent);

// Now remove the footer from App.tsx and import it
const newAppCode = appCode.slice(0, footerStart) + '<Footer />' + appCode.slice(footerEnd);
// Also need to import Footer
let updatedAppCode = newAppCode;
if (!updatedAppCode.includes('import Footer')) {
    updatedAppCode = updatedAppCode.replace('import Navbar', 'import Footer from "./components/Footer";\nimport Navbar');
}
fs.writeFileSync('src/App.tsx', updatedAppCode);
console.log('Footer extracted successfully!');
