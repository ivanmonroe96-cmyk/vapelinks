const collections = require('./src/data/collections.json');
const products = require('./src/data/products.json');
const fs = require('fs');
const path = require('path');

const productMap = {};
products.forEach(p => { productMap[p.handle] = p; });

const noImg = collections
  .filter(c => !c.image?.src && c.products_count > 5)
  .sort((a,b) => b.products_count - a.products_count)
  .slice(0, 30);

noImg.forEach(c => {
  const handles = c.product_handles || [];
  let firstImg = null;
  let localImg = null;
  for (const h of handles) {
    const p = productMap[h];
    if (p?.images?.length > 0 && p.images[0].src) {
      firstImg = p.images[0].src;
      // Check if we have a local copy
      const filename = path.basename(new URL(firstImg).pathname);
      const localPath = path.join('public/images/products', filename);
      if (fs.existsSync(localPath)) {
        localImg = '/images/products/' + filename;
      }
      break;
    }
  }
  console.log(`${c.title} (${c.products_count}) | handle: ${c.handle}`);
  if (localImg) {
    console.log(`  LOCAL: ${localImg}`);
  } else if (firstImg) {
    console.log(`  REMOTE: ${firstImg.substring(0, 120)}`);
  } else {
    console.log(`  NO IMAGES FOUND`);
  }
  console.log('');
});
