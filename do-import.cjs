const https = require('https');
const fs = require('fs');

const PROJECT_ID = 'mapsv-1776175535';
const API_KEY = 'AIzaSyB01qLkC_RLRSeJfUf_5SGZFAm8WlA8YNE';

const placesJson = fs.readFileSync('/home/carlos/Documents/proyects/mapa-turistico-sv/places.json', 'utf8');
const places = JSON.parse(placesJson);

console.log('Importando ' + places.length + ' lugares...');

let imported = 0;
let errors = 0;

function importPlace(index) {
  return new Promise((resolve) => {
    const p = places[index];
    
    if (!p.name || !p.category) {
      console.log('SKIP ' + index + ': datos invalidos');
      resolve();
      return;
    }
    
    const data = {
      fields: {
        name: { stringValue: p.name },
        category: { stringValue: p.category },
        lat: { doubleValue: p.lat || 0 },
        lng: { doubleValue: p.lng || 0 },
        municipality: { stringValue: p.municipality || '' },
        department: { stringValue: p.department || '' },
        description: { stringValue: p.description || '' },
        price: { stringValue: p.price || '' },
        schedule: { stringValue: p.schedule || '' },
        recommendations: { arrayValue: { values: (p.recommendations || []).map(function(r) { return { stringValue: r }; }) } },
        photos: { arrayValue: { values: (p.photos || []).map(function(r) { return { stringValue: r }; }) } },
        visitCount: { integerValue: Math.floor(Math.random() * 50) + 5 }
      }
    };
    
    const body = JSON.stringify(data);
    
    const options = {
      hostname: 'firestore.googleapis.com',
      path: '/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/places?key=' + API_KEY,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = https.request(options, function(res) {
      let d = '';
      res.on('data', function(chunk) { d += chunk; });
      res.on('end', function() {
        if (res.statusCode === 200) {
          imported++;
          console.log('OK ' + (index+1) + '/' + places.length + ': ' + p.name);
        } else {
          errors++;
          console.log('ERR ' + (index+1) + ': ' + p.name + ' - ' + res.statusCode);
        }
        resolve();
      });
    });
    
    req.on('error', function(e) {
      errors++;
      console.log('ERR ' + index + ': ' + e.message);
      resolve();
    });
    
    req.write(body);
    req.end();
  });
}

async function run() {
  for (let i = 0; i < places.length; i++) {
    await importPlace(i);
    await new Promise(function(r) { setTimeout(r, 150); });
  }
  
  console.log('\n=== RESULTADO ===');
  console.log('Importados: ' + imported);
  console.log('Errores: ' + errors);
  console.log('Total: ' + places.length);
}

run();
