// Export Notion CV data to JSON for PocketBase import
// Run: node scripts/export_notion_data.js

const https = require('https');

const NOTION_API_KEY = process.env.NOTION_API_KEY;

function notionRequest(path, body = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.notion.com',
      path: path,
      method: body ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function exportData() {
  // Database IDs from your Notion workspace
  const CV_PROFILE_ID = '33b48520-43ad-8077-bf3d-dbe0639e68d1'; // Théo Perotti - baked
  
  console.log('Exporting data from Notion...');
  
  // Export all databases
  const data = {
    cv_profiles: [{ 
      id: 'default',
      slug: 'theo-perotti',
      name: 'Théo Perotti - Full-Stack Developer',
      template: 'classic',
      is_default: true
    }],
    persons: [],
    emplois: [],
    projets: [],
    competences: [],
    diplomes: []
  };
  
  // Add logic to fetch and transform Notion data here
  // ... (implementation would call Notion API and transform data)
  
  const fs = require('fs');
  fs.writeFileSync('pb_data/seed.json', JSON.stringify(data, null, 2));
  console.log('Data exported to pb_data/seed.json');
}

exportData();
