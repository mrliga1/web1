import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  \/\/ Sync hash routing triggers for browsers\n  useEffect\(\(\) \=\> \{\n[\s\S]*?window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\);\n  \};\n/m;

const replacement = `  // Sync routing triggers for browsers
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (!path || path === '/' || path === '/home' || path === '#home') {
        setRoute({ screen: 'home' });
      } else if (path === '/san-pham') {
        setRoute({ screen: 'san-pham' });
      } else if (path === '/du-an') {
        setRoute({ screen: 'du-an' });
      } else if (path === '/tin-tuc') {
        setRoute({ screen: 'tin-tuc' });
      } else if (path === '/lien-he') {
        setRoute({ screen: 'lien-he' });
      } else if (path.startsWith('/product/')) {
        const id = path.replace('/product/', '').split('-')[0];
        setRoute({ screen: 'product-detail', productId: id });
      } else if (path.startsWith('/project/')) {
        const id = path.replace('/project/', '').split('-')[0];
        setRoute({ screen: 'project-detail', projectId: id });
      } else if (path.startsWith('/news/')) {
        const id = path.replace('/news/', '').split('-')[0];
        setRoute({ screen: 'news-detail', newsId: id });
      } else if (path === '/admin') {
        setRoute({ screen: 'admin' });
      } else if (path.startsWith('/category-product/')) {
        const catName = decodeURIComponent(path.replace('/category-product/', ''));
        setRoute({ screen: 'category-product', categoryName: catName });
      } else if (path.startsWith('/category-news/')) {
        const catName = decodeURIComponent(path.replace('/category-news/', ''));
        setRoute({ screen: 'category-news', categoryName: catName });
      } else if (path === '/latest-sales') {
        setRoute({ screen: 'latest-sales' });
      } else if (path === '/latest-rents') {
        setRoute({ screen: 'latest-rents' });
      } else if (path === '/terms-of-use') {
        setRoute({ screen: 'terms-of-use' });
      } else if (path === '/privacy-policy') {
        setRoute({ screen: 'privacy-policy' });
      } else {
        // Fallback for unknown paths
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Run once initially on load
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update hash when React navigation triggers
  const handleNavigate = (newRoute: RouteState) => {
    setRoute(newRoute);
    window.scrollTo(0, 0); // Reset scroll position when navigating to a new page
    let targetPath = '/';
    
    if (newRoute.screen === 'home') targetPath = '/';
    else if (newRoute.screen === 'san-pham') targetPath = '/san-pham';
    else if (newRoute.screen === 'du-an') targetPath = '/du-an';
    else if (newRoute.screen === 'tin-tuc') targetPath = '/tin-tuc';
    else if (newRoute.screen === 'lien-he') targetPath = '/lien-he';
    else if (newRoute.screen === 'product-detail' && newRoute.productId) targetPath = \`/product/\${newRoute.productId}\${newRoute.slug ? \`-\${newRoute.slug}\` : ''}\`;
    else if (newRoute.screen === 'project-detail' && newRoute.projectId) targetPath = \`/project/\${newRoute.projectId}\${newRoute.slug ? \`-\${newRoute.slug}\` : ''}\`;
    else if (newRoute.screen === 'news-detail' && newRoute.newsId) targetPath = \`/news/\${newRoute.newsId}\${newRoute.slug ? \`-\${newRoute.slug}\` : ''}\`;
    else if (newRoute.screen === 'admin') targetPath = '/admin';
    else if (newRoute.screen === 'category-product' && newRoute.categoryName) targetPath = \`/category-product/\${encodeURIComponent(newRoute.categoryName)}\`;
    else if (newRoute.screen === 'category-product') targetPath = '/category-product';
    else if (newRoute.screen === 'category-news' && newRoute.categoryName) targetPath = \`/category-news/\${encodeURIComponent(newRoute.categoryName)}\`;
    else if (newRoute.screen === 'category-news') targetPath = '/category-news';
    else if (newRoute.screen === 'latest-sales') targetPath = '/latest-sales';
    else if (newRoute.screen === 'latest-rents') targetPath = '/latest-rents';
    else if (newRoute.screen === 'terms-of-use') targetPath = '/terms-of-use';
    else if (newRoute.screen === 'privacy-policy') targetPath = '/privacy-policy';

    if (targetPath && window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
