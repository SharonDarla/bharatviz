import { SitemapStream, streamToPromise } from 'sitemap';
import { createGzip } from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your domain
const DOMAIN = 'https://bharatviz.saketlab.in';

// Define your routes and their metadata
const routes = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: new Date()
  },
  {
    url: '/api',
    changefreq: 'monthly', 
    priority: 0.8,
    lastmod: new Date()
  }
];

// Generate sitemap
async function generateSitemap() {
  try {
    const sitemap = new SitemapStream({
      hostname: DOMAIN,
      xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9'
    });

    // Write each route
    routes.forEach(route => {
      sitemap.write({
        url: route.url,
        changefreq: route.changefreq,
        priority: route.priority,
        lastmod: route.lastmod
      });
    });

    sitemap.end();

    // Generate the sitemap XML
    const sitemapXML = await streamToPromise(sitemap);
    
    // Write to public directory with proper formatting
    const outputPath = path.join(__dirname, '../public/sitemap.xml');
    const formattedXML = sitemapXML.toString().replace(/></g, '>\n<');
    fs.writeFileSync(outputPath, formattedXML);
    
    console.log('✅ Sitemap generated successfully!');
    console.log(`📍 Location: ${outputPath}`);
    console.log(`🌐 Available at: ${DOMAIN}/sitemap.xml`);
    
    // Skip gzipped version for now (buffer issue)
    console.log('📦 Sitemap generation complete');
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}

export { generateSitemap, routes };