const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

// Replace logo wrapper
code = code.replace(
  /<div([^>]*id="logo-container"[^>]*)onClick=\{[^}]+\}/g,
  '<Link href="/"$1'
);
// Notice we need to change closing </div> of logo-container to </Link>
// The logo container ends before Desktop Nav Items
code = code.replace(
  /<\/span>\s*<\/div>\s*<\/>\s*\)\}\s*<\/div>/g,
  '</span>\n                </div>\n              </>\n            )}\n          </Link>'
);

// Replace Desktop Nav Menu Item
code = code.replace(
  /<button\s+key=\{item\.screen\}\s+id=\{`nav-\$\{item\.screen\}`\}\s+onClick=\{\(\) => \{\s*onNavigate\(\{ screen: item\.screen \}\);\s*setMobileMenuOpen\(false\);\s*\}\}/g,
  '<Link\n                  key={item.screen}\n                  id={`nav-${item.screen}`}\n                  href={getRouteUrl({ screen: item.screen })}'
);
code = code.replace(
  /<span className="relative z-10">\{item\.label\}<\/span>\s*\{\/\* Remove pill background per user request \*\/\}\s*<\/button>/g,
  '<span className="relative z-10">{item.label}</span>\n                </Link>'
);

// Replace Mobile Nav Menu Item
code = code.replace(
  /<button\s+key=\{item\.screen\}\s+onClick=\{\(\) => \{\s*onNavigate\(\{ screen: item\.screen \}\);\s*setMobileMenuOpen\(false\);\s*\}\}/g,
  '<Link\n                    key={item.screen}\n                    href={getRouteUrl({ screen: item.screen })}\n                    onClick={() => setMobileMenuOpen(false)}'
);
code = code.replace(
  /<span>\{item\.label\}<\/span>\s*<\/button>/g,
  '<span>{item.label}</span>\n                  </Link>'
);

// Replace Favorites Desktop
code = code.replace(
  /<button\s+onClick=\{\(\) => onNavigate\(\{ screen: 'favorites' \}\)\}\s+className=\{`p\.1\.5/g,
  '<Link\n                href="/yeu-thich"\n                className={`p.1.5'
);
code = code.replace(
  /<Heart className="w-4 h-4" \/>\s*<\/button>/g,
  '<Heart className="w-4 h-4" />\n              </Link>'
);

// Replace Favorites Mobile
code = code.replace(
  /<button\s+onClick=\{\(\) => onNavigate\(\{ screen: 'favorites' \}\)\}\s+className="sm:hidden flex/g,
  '<Link\n                href="/yeu-thich"\n                className="sm:hidden flex'
);
code = code.replace(
  /<Heart className="w-5 h-5" \/>\s*<\/button>/g,
  '<Heart className="w-5 h-5" />\n              </Link>'
);

// Replace Admin Desktop
code = code.replace(
  /<button\s+onClick=\{\(\) => \{\s*router\.push\('\/admin'\);\s*setUserDropdownOpen\(false\);\s*\}\}/g,
  '<Link\n                            href="/admin"\n                            onClick={() => setUserDropdownOpen(false)}'
);
code = code.replace(
  /<span>Khu Vực Quản Trị<\/span>\s*<\/button>/g,
  '<span>Khu Vực Quản Trị</span>\n                        </Link>'
);

// Replace Admin Mobile
code = code.replace(
  /<button\s+onClick=\{\(\) => \{ router\.push\('\/admin'\); setMobileMenuOpen\(false\); \}\}/g,
  '<Link \n                        href="/admin"\n                        onClick={() => setMobileMenuOpen(false)}'
);
code = code.replace(
  /Quản lý\s*<\/button>/g,
  'Quản lý\n                      </Link>'
);

fs.writeFileSync('src/components/Navbar.tsx', code);
