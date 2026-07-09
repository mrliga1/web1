const fs = require('fs');
let code = fs.readFileSync('src/components/ProductList.tsx', 'utf-8');

// Project Card wrapping div
code = code.replace(
  /<div\n\s*key=\{`\$\{proj\.id\}-\$\{idx\}`\}\n\s*onClick=\{\(\) => router\.push\(getRouteUrl\(\{ screen: 'project-detail', projectId: proj\.id, slug: generateSlug\(proj\.title\) \}\)\)\}\n\s*className="([^"]+)"\n\s*>/g,
  `<Link\n                              key={\`\${proj.id}-\${idx}\`}\n                              href={getRouteUrl({ screen: 'project-detail', projectId: proj.id, slug: generateSlug(proj.title) })}\n                              className="$1 block"\n                            >`
);

// We only want to replace the closing `</div>` for project card!
// Let's use string replace for the specific block.
const searchBlock = `                                  <span className="text-left line-clamp-2">
                                    {proj.location || proj.title}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}`;
                        
const replaceBlock = `                                  <span className="text-left line-clamp-2">
                                    {proj.location || proj.title}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        }}`;

code = code.replace(searchBlock, replaceBlock);

fs.writeFileSync('src/components/ProductList.tsx', code);
