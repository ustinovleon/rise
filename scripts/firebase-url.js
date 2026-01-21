/**
 * Firebase Storage URL Generator for Rise Villas
 *
 * Usage:
 *   node scripts/firebase-url.js "Rise/Rise Villas/Рендеры/Экстерьер /Hi-Res/CAM_005249.jpg"
 *   node scripts/firebase-url.js --list exterior
 *   node scripts/firebase-url.js --list interior-villa
 *   node scripts/firebase-url.js --list location
 *   node scripts/firebase-url.js --search "CAM_005"
 *   node scripts/firebase-url.js --categories
 */

const fs = require('fs');
const path = require('path');

const BUCKET = 'kalinka-dashboard.firebasestorage.app';
const BASE_URL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/`;

// Generate Firebase Storage URL from path
function getUrl(filePath) {
    const encoded = encodeURIComponent(filePath);
    return `${BASE_URL}${encoded}?alt=media`;
}

// Load manifest
function loadManifest() {
    const manifestPath = path.join(__dirname, '..', 'firebase-assets.json');
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

// Get all categories
function getCategories() {
    const manifest = loadManifest();
    const project = manifest.projects['rise-villas'];

    return {
        'exterior': { data: project.renders.exterior.hi_res, basePath: project.basePath },
        'exterior-lowres': { data: project.renders.exterior.low_res, basePath: project.basePath },
        'exterior-night': {
            data: {
                path: project.renders.exterior.hi_res.path,
                files: project.renders.exterior.hi_res.files.filter(f => f.name.includes('NIGHT'))
            },
            basePath: project.basePath
        },
        'interior-villa': { data: project.renders.interior.villa_type3.hi_res, basePath: project.basePath },
        'interior-townhouse': { data: project.renders.interior.townhouse.hi_res, basePath: project.basePath },
        'location': { data: project.location, basePath: project.basePath },
        'masterplan': { data: project.masterplan, basePath: project.basePath },
        'promo': { data: project.promo, basePath: project.basePath },
        'floorplans-townhouse': { data: project.floorplans.townhouse, basePath: project.basePath },
        'floorplans-type1': { data: project.floorplans.villa_type1, basePath: project.basePath },
        'floorplans-type2': { data: project.floorplans.villa_type2, basePath: project.basePath },
        'floorplans-type3': { data: project.floorplans.villa_type3, basePath: project.basePath },
        'floorplans-type4': { data: project.floorplans.villa_type4_1, basePath: project.basePath },
        'floorplans-type5': { data: project.floorplans.villa_type5, basePath: project.basePath },
        'documents': { data: project.documents, basePath: project.basePath },
        'pricelist': { data: project.pricelist, basePath: project.basePath },
        'presentations': { data: project.presentations, basePath: project.basePath },
        'video': { data: project.renders.video, basePath: project.basePath }
    };
}

// List files in a category
function listCategory(categoryName) {
    const categories = getCategories();

    if (categoryName === 'all') {
        console.log('\n📁 Available categories:\n');
        Object.keys(categories).forEach(name => {
            const cat = categories[name];
            const count = cat.data.files ? cat.data.files.length : (cat.data.file_count || 0);
            console.log(`  ${name.padEnd(20)} (${count} files)`);
        });
        console.log('\nUsage: node firebase-url.js --list <category>');
        return;
    }

    const category = categories[categoryName];
    if (!category) {
        console.log(`Category "${categoryName}" not found.\n`);
        console.log('Available categories:', Object.keys(categories).join(', '));
        return;
    }

    const { data, basePath } = category;

    if (!data.files) {
        console.log(`Category "${categoryName}" has ${data.file_count || 0} files (list not available)`);
        return;
    }

    console.log(`\n📁 ${categoryName.toUpperCase()} (${data.path}):\n`);
    data.files.forEach(file => {
        const fullPath = `${basePath}/${data.path}/${file.name}`;
        console.log(`  ${file.name}`);
        console.log(`    📝 ${file.description}`);
        console.log(`    🔗 ${getUrl(fullPath)}\n`);
    });
}

// Search files by name across all categories
function searchFiles(query) {
    const categories = getCategories();
    const results = [];

    Object.entries(categories).forEach(([categoryName, category]) => {
        const { data, basePath } = category;
        if (!data.files) return;

        data.files.forEach(file => {
            if (file.name.toLowerCase().includes(query.toLowerCase()) ||
                file.description.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    category: categoryName,
                    file: file.name,
                    description: file.description,
                    path: `${basePath}/${data.path}/${file.name}`
                });
            }
        });
    });

    if (results.length === 0) {
        console.log(`No files found matching "${query}"`);
        return;
    }

    console.log(`\n🔍 Found ${results.length} file(s) matching "${query}":\n`);
    results.forEach(r => {
        console.log(`  [${r.category}] ${r.file}`);
        console.log(`    📝 ${r.description}`);
        console.log(`    🔗 ${getUrl(r.path)}\n`);
    });
}

// Quick reference for common use cases
function showQuickReference() {
    const manifest = loadManifest();
    const ref = manifest._quick_reference;
    const basePath = manifest.projects['rise-villas'].basePath;

    console.log('\n🚀 Quick Reference - Common Images:\n');

    console.log('  HERO IMAGE:');
    const heroPath = `${basePath}/${ref.hero_image}`;
    console.log(`    ${getUrl(heroPath)}\n`);

    console.log('  VILLA CARDS:');
    Object.entries(ref.villa_cards).forEach(([type, path]) => {
        const fullPath = `${basePath}/${path}`;
        console.log(`    ${type}: ${getUrl(fullPath)}`);
    });

    console.log('\n  NIGHT VIEWS:');
    ref.night_views.forEach(path => {
        const fullPath = `${basePath}/${path}`;
        console.log(`    ${getUrl(fullPath)}`);
    });

    console.log('\n  AERIAL VIEW:');
    console.log(`    ${getUrl(`${basePath}/${ref.aerial_view}`)}`);

    console.log('\n  LOCATION MAP:');
    console.log(`    ${getUrl(`${basePath}/${ref.location_map}`)}`);

    console.log('\n  MASTERPLAN:');
    console.log(`    ${getUrl(`${basePath}/${ref.masterplan}`)}`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
Firebase Storage URL Generator for Rise Villas

Usage:
  node firebase-url.js <path>              Generate URL for specific path
  node firebase-url.js --list <category>   List all files in category
  node firebase-url.js --list all          Show all categories
  node firebase-url.js --search <query>    Search files by name/description
  node firebase-url.js --quick             Show quick reference URLs
  node firebase-url.js --categories        List available categories

Categories:
  exterior, exterior-lowres, exterior-night
  interior-villa, interior-townhouse
  location, masterplan, promo
  floorplans-townhouse, floorplans-type1, floorplans-type2, etc.
  documents, pricelist, presentations, video

Examples:
  node firebase-url.js "Rise/Rise Villas/Рендеры/Экстерьер /Hi-Res/CAM_005249.jpg"
  node firebase-url.js --list exterior
  node firebase-url.js --search night
  node firebase-url.js --quick
`);
} else if (args[0] === '--list') {
    listCategory(args[1] || 'all');
} else if (args[0] === '--search') {
    searchFiles(args[1] || '');
} else if (args[0] === '--quick') {
    showQuickReference();
} else if (args[0] === '--categories') {
    listCategory('all');
} else {
    console.log('\n🔗 Generated URL:\n');
    console.log(getUrl(args[0]));
    console.log('');
}
