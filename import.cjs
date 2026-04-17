const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'mapsv-1776175535'
});

const db = admin.firestore();

const places = require('/home/carlos/Documents/proyects/mapa-turistico-sv/places.json');

async function importAll() {
  console.log('Importando ' + places.length + ' lugares...');
  
  let count = 0;
  
  for (const place of places) {
    if (!place.name || !place.category) continue;
    
    // Clean name
    const name = place.name.trim();
    
    const data = {
      name: name,
      category: place.category,
      lat: place.lat || 0,
      lng: place.lng || 0,
      municipality: place.municipality || '',
      department: place.department || '',
      description: place.description || '',
      price: place.price || '',
      schedule: place.schedule || '',
      recommendations: place.recommendations || [],
      photos: place.photos || [],
      visitCount: Math.floor(Math.random() * 50) + 5,
      createdAt: new Date()
    };
    
    await db.collection('places').add(data);
    count++;
    console.log('OK ' + count + ': ' + name);
    
    // Delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n✅ ' + count + ' lugares importados!');
}

importAll().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});