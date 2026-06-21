const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /async function startServer\(\) \{[\s\S]*?startServer\(\);/m;

const replacement = `async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');

  let vite;
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files but DON'T fall back to index.html immediately
    app.use(express.static(distPath, { index: false }));
  }

  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || (req.path.includes('.') && !req.path.includes('index.html'))) {
      return next();
    }

    try {
      let indexHtml = '';
      if (!isProd) {
        indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
        indexHtml = await vite.transformIndexHtml(req.originalUrl, indexHtml);
      } else {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          indexHtml = fs.readFileSync(indexPath, 'utf8');
        } else {
          return res.status(404).send('Not found');
        }
      }

      let title = 'Greenia Homes - Phân Phối BĐS Cao Cấp';
      let desc = 'Greenia Homes là đơn vị chuyên Phân phối các sản phẩm BĐS cao cấp tại Tp HCM và các khu vực khác. Hotline: 0932 966 700.';
      let image = 'https://raw.githubusercontent.com/thuanx2/GreenHome/main/public/uploads/thump2-1748805904033.jpg';
      
      try {
        if (admin.apps && admin.apps.length > 0) {
           const db = admin.firestore();
           let match;
           if ((match = req.path.match(/^\\/project\\/([a-zA-Z0-9]+)/))) {
              const docSnap = await db.collection('projects').doc(match[1]).get();
              if (docSnap.exists) {
                 const data = docSnap.data();
                 title = data.title || title;
                 desc = (data.description || desc).replace(/<[^>]+>/g, '').substring(0, 160);
                 image = data.imageUrl || data.thumbnailUrl || (data.images && data.images[0]) || image;
              }
           } else if ((match = req.path.match(/^\\/product\\/([a-zA-Z0-9]+)/))) {
              const docSnap = await db.collection('products').doc(match[1]).get();
              if (docSnap.exists) {
                 const data = docSnap.data();
                 title = data.title || title;
                 desc = (data.description || desc).replace(/<[^>]+>/g, '').substring(0, 160);
                 image = data.imageUrl || data.thumbnailUrl || (data.images && data.images[0]) || image;
              }
           } else if ((match = req.path.match(/^\\/news\\/([a-zA-Z0-9]+)/))) {
              const docSnap = await db.collection('news').doc(match[1]).get();
              if (docSnap.exists) {
                 const data = docSnap.data();
                 title = data.title || title;
                 desc = (data.content || desc).replace(/<[^>]+>/g, '').substring(0, 160);
                 image = data.imageUrl || data.thumbnailUrl || image;
              }
           }
        }
      } catch (err) {
        console.error('OG Tag DB Fetch Error:', err);
      }

      const ogTags = \`
        <meta property="og:title" content="\${title.replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="\${desc.replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="\${image}" />
        <meta name="twitter:card" content="summary_large_image" />
      \`;
      
      indexHtml = indexHtml.replace('</head>', ogTags + '\\n</head>');
      res.status(200).set({ 'Content-Type': 'text/html' }).send(indexHtml);
    } catch (e) {
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`[Greenia Fullstack Server] active on http://0.0.0.0:\${PORT}\`);
  });
}

startServer();`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
