const https = require('https');

// Firebase config
const PROJECT_ID = 'mapsv-1776175535';
const API_KEY = 'AIzaSyB01qLkC_RLRSeJfUf_5SGZFAm8WlA8YNE';

const places = require('./places.json');

async function importPlaces() {
  console.log(`Importando ${places.length} lugares a Firebase...`);
  
  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    
    // Clean the name (remove leading space if any)
    if (place.name && place.name[0] === ' ') {
      place.name = place.name.substring(1);
    }
    
    const data = {
      name: place.name,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      municipality: place.municipality,
      department: place.department,
      description: place.description,
      price: place.price,
      schedule: place.schedule,
      recommendations: place.recommendations || [],
      photos: place.photos || [],
      visitCount: Math.floor(Math.random() * 50) + 5, // Random visits 5-55 for demo
      createdAt: { timestamp: { seconds: Date.now() / 1000 } }
    };
    
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/places?key=${API_KEY}&documentId=auto-${Date.now()}-${i}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      );
      
      if (response.ok) {
        console.log(`✓ ${i + 1}/${places.length}: ${place.name}`);
      } else {
        const error = await response.text();
        console.log(`✗ ${i + 1}/${places.length}: ${place.name} - Error: ${error}`);
      }
    } catch (err) {
      console.log(`✗ ${i + 1}/${places.length}: ${place.name} - Error: ${err.message}`);
    }
    
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n¡Importación completada!');
}

importPlaces().catch(console.error);
