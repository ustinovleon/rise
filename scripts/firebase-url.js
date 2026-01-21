/**
 * Firebase Storage URL Generator for Rise Villas
 *
 * Usage:
 *   node scripts/firebase-url.js "Rise/Rise Villas/Рендеры/Экстерьер/Hi-Res/CAM_001244.jpg"
 *   node scripts/firebase-url.js --list exterior
 *   node scripts/firebase-url.js --search "CAM_005"
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

// List files in a category
function listCategory(category) {
    const manifest = loadManifest();
    const project = manifest.projects['rise-villas'];
    const basePath = project.basePath;

    const categories = {
        'exterior': project.renders.exterior,
        'interior': project.renders.interior,
        'aerial': project.renders.aerial,
        'location': project.location,
        'plans': project.plans,
        'masterplan': project.masterplan,
        'amenities': project.amenities
    };

    const cat = categories[category];
    if (!cat) {
        console.log('Available categories:', Object.keys(categories).join(', '));
        return;
    }

    console.log(`\n📁 ${category.toUpperCase()} (${cat.path}):\n`);
    cat.files.forEach(file => {
        const fullPath = `${basePath}/${cat.path}/${file.name}`;
        console.log(`  ${file.name}`);
        console.log(`    📝 ${file.description}`);
        console.log(`    🔗 ${getUrl(fullPath)}\n`);
    });
}

// Search files by name
function searchFiles(query) {
    const manifest = loadManifest();
    const project = manifest.projects['rise-villas'];
    const basePath = project.basePath;
    const results = [];

    function searchInCategory(category, categoryName) {
        category.files.forEach(file => {
            if (file.name.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    category: categoryName,
                    file: file.name,
                    description: file.description,
                    path: `${basePath}/${category.path}/${file.name}`
                });
            }
        });
    }

    searchInCategory(project.renders.exterior, 'exterior');
    searchInCategory(project.renders.interior, 'interior');
    searchInCategory(project.renders.aerial, 'aerial');
    searchInCategory(project.location, 'location');
    searchInCategory(project.plans, 'plans');
    searchInCategory(project.masterplan, 'masterplan');
    searchInCategory(project.amenities, 'amenities');

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

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
Firebase Storage URL Generator

Usage:
  node firebase-url.js <path>              Generate URL for specific path
  node firebase-url.js --list <category>   List all files in category
  node firebase-url.js --search <query>    Search files by name

Categories: exterior, interior, aerial, location, plans, masterplan, amenities

Examples:
  node firebase-url.js "Rise/Rise Villas/Рендеры/Экстерьер/Hi-Res/CAM_005249.jpg"
  node firebase-url.js --list exterior
  node firebase-url.js --search CAM_005
`);
} else if (args[0] === '--list') {
    listCategory(args[1] || 'exterior');
} else if (args[0] === '--search') {
    searchFiles(args[1] || '');
} else {
    console.log('\n🔗 Generated URL:\n');
    console.log(getUrl(args[0]));
    console.log('');
}
