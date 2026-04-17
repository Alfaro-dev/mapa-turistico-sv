import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface Ad {
  id?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: 'sidebar' | 'popup' | 'banner';
  active: boolean;
  createdAt?: any;
}

export interface TouristPlace {
  id: string;
  name: string;
  category: 'playa' | 'montaña' | 'histórico' | 'gastronomía' | 'cultura' | 'aventura' | 'río' | 'lago';
  lat: number;
  lng: number;
  description: string;
  municipality: string;
  department: string;
  schedule: string;
  price: string;
  imageUrl: string;
  recommendations: string[];
}

// Default places data - sources from ISTU (Instituto Salvadoreño de Turismo)
export const DEFAULT_PLACES: TouristPlace[] = [
  {
    id: '1',
    name: 'Lago de Coatepeque',
    category: 'lago',
    lat: 13.8667,
    lng: -89.5333,
    description: 'Hermoso lago de cráter de origen volcánico con aguas turquesas. Uno de los atractivos más visitados de El Salvador.',
    municipality: 'Coatepeque',
    department: 'Santa Ana',
    schedule: 'Abierto todos los días, 6:00 AM - 6:00 PM',
    price: 'Gratis (acceso público)',
    imageUrl: 'https://images.unsplash.com/photo-1585832822289-5cfc75410f7e?w=800',
    recommendations: ['Paseo en lancha', 'Pesca deportiva', 'Observación de aves', 'Fotografía']
  },
  {
    id: '2',
    name: 'Parque Nacional Cerro Verde',
    category: 'montaña',
    lat: 13.8283,
    lng: -89.6292,
    description: 'Área de protección natural con senderos, miradores y vista a los volcanes de Izco, Cerro Verde y Namasigue.',
    municipality: 'Cerro Verde',
    department: 'Sonsonate',
    schedule: 'Lunes a Domingo, 8:00 AM - 4:00 PM',
    price: '$3 extranjeros, $1 nacionales',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    recommendations: ['Senderismo', 'Ornitología', 'Picnic', 'Fotografía de naturaleza']
  },
  {
    id: '3',
    name: 'Ruta de las Flores',
    category: 'cultura',
    lat: 13.7833,
    lng: -89.7333,
    description: 'Ruta turística que atraviesa pueblos característicos: Nahuizalco, Salcoatitán, Juayúa, Apaneca y.atirro. Con restaurantes, miradores y cascadas.',
    municipality: 'Various',
    department: 'Sonsonate / Ahuachapán',
    schedule: 'Abierto todos los días (mejor época: noviembre - marzo)',
    price: 'Gratis (caminos públicos)',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    recommendations: ['Gastronomía local', 'Café de especialidad', 'Artesanías', 'Cascadas']
  },
  {
    id: '4',
    name: 'Parque Recreativo Costa del Sol',
    category: 'playa',
    lat: 13.4333,
    lng: -89.05,
    description: 'Parque recreativo frente al océano Pacífico con áreas verdes, restaurantes y acceso directo a la playa.',
    municipality: 'Estación、文',
    department: 'La Libertad',
    schedule: 'Diario, 7:00 AM - 6:00 PM',
    price: '$3 (nacionales), $6 (extranjeros)',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    recommendations: ['Piscinas', 'Restaurantes', 'Deportes acuáticos', 'Parqueo']
  },
  {
    id: '5',
    name: 'Tazumal',
    category: 'histórico',
    lat: 14.05,
    lng: -89.3833,
    description: 'Sitio arqueológico maya con pirámides y estructuras ceremoniales. Antigua ciudad ceremonial con más de 1,000 años de historia.',
    municipality: 'Chalchuapa',
    department: 'Santa Ana',
    schedule: 'Martes a Domingo, 9:00 AM - 4:00 PM',
    price: '$3 nacionales, $6 extranjeros',
    imageUrl: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800',
    recommendations: ['Visita guiada', 'Museo del sitio', 'Fotografía histórica']
  },
  {
    id: '6',
    name: 'Joya de Cerén',
    category: 'histórico',
    lat: 13.7,
    lng: -89.4167,
    description: 'Aldea agrícola maya sepultada por una erupci runa volcánica. Patrimonio de la Humanidad por la UNESCO.',
    municipality: 'Joya de Cerén',
    department: 'La Libertad',
    schedule: 'Martes a Domingo, 9:00 AM - 4:00 PM',
    price: '$3 nacionales, $6 extranjeros',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
    recommendations: ['Visita guiada', 'Museo interpretativo', 'Área de picnic']
  },
  {
    id: '7',
    name: 'Suchitoto',
    category: 'cultura',
    lat: 14.0333,
    lng: -89.0333,
    description: 'Pueblo colonial con calles empedradas, arte callejero, restaurantes típicos y la Laguna de Suchitlán.',
    municipality: 'Suchitoto',
    department: 'Cuscatlán',
    schedule: 'Abierto todos los días',
    price: 'Gratis (pueblo)',
    imageUrl: 'https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?w=800',
    recommendations: ['Paseo en lancha', 'Arte callejero', 'Gastronomía', 'Café de especialidad']
  },
  {
    id: '8',
    name: 'Playa El Tunco',
    category: 'playa',
    lat: 13.4833,
    lng: -89.3833,
    description: 'Famosa playa surferil con rocas enormes llamadas "El Tunco" y "El Soledad". Vida nocturna y restaurantes.',
    municipality: 'La Libertad',
    department: 'La Libertad',
    schedule: 'Abierto todos los días',
    price: 'Gratis (acceso público)',
    imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800',
    recommendations: ['Surf', 'Atardeceres', 'Vida nocturna', 'Comida marina']
  },
  {
    id: '9',
    name: 'Parque Natural Saburo Hirao',
    category: 'río',
    lat: 13.9167,
    lng: -89.15,
    description: 'Reserva natural con Ríos gemelos que forman pozas naturales de agua cristalina. Senderos y áreas de picnic.',
    municipality: 'Nejapa',
    department: 'San Salvador',
    schedule: 'Sábados, domingos y días festivos, 7:00 AM - 5:00 PM',
    price: '$1.50',
    imageUrl: 'https://images.unsplash.com/photo-1542000551-b0f91f2awfp?w=800',
    recommendations: ['Naturaleza', 'Senderismo', 'Picnic', 'Aves']
  },
  {
    id: '10',
    name: 'El Boquerón',
    category: 'montaña',
    lat: 13.7333,
    lng: -89.2833,
    description: 'Crat and Three volcanoes with trails, viewpoint of San Salvador, and visitor center.',
    municipality: 'San Salvador',
    department: 'San Salvador',
    schedule: 'Martes a Domingo, 9:00 AM - 4:00 PM',
    price: '$2',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    recommendations: ['Senderismo', 'Mirador', 'Flora y fauna', 'Pícnic']
  },
  {
    id: '11',
    name: 'Puerto de la Libertad',
    category: 'gastronomía',
    lat: 13.4833,
    lng: -89.3167,
    description: 'Puerto pesquero famous for its seafood, particularly "pupusas de mariscos", sunset views and coastal walk.',
    municipality: 'La Libertad',
    department: 'La Libertad',
    schedule: 'Abierto todos los días',
    price: 'Gratis',
    imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
    recommendations: ['Mariscos frescos', 'Pupusas de mariscos', 'Atardeceres', 'Surf']
  },
  {
    id: '12',
    name: 'Laguna de El Jocotal',
    category: 'lago',
    lat: 13.5833,
    lng: -88.35,
    description: 'Large lagoon known for its wetlands, migratory birds, and fishing. Boat rides available.',
    municipality: 'San Miguel',
    department: 'San Miguel',
    schedule: 'Abierto todos los días',
    price: 'Gratis (acceso público)',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    recommendations: ['Paseo en lancha', 'Observación de aves', 'Pesca', 'Camping']
  },
  {
    id: '13',
    name: 'Los Chocos (Nahuizalco)',
    category: 'río',
    lat: 13.7833,
    lng: -89.7667,
    description: 'Serie de cascadas y pozas naturales en el municipio de Nahuizalco. Ambiente natural pristine.',
    municipality: 'Nahuizalco',
    department: 'Sonsonate',
    schedule: 'Viernes a domingo y días festivos',
    price: '$2',
    imageUrl: 'https://images.unsplash.com/photo-1542000551-b0f91f2awfp?w=800',
    recommendations: ['Naturaleza', 'Poza natural', 'Senderismo', 'Fotografía']
  },
  {
    id: '14',
    name: 'Parque Fauna y Flora (Parque Natura)',
    category: 'aventura',
    lat: 13.5833,
    lng: -89.2833,
    description: 'Zoológico y parque natural con vida silvestre de El Salvador.里面有动物园，植物园和步道。',
    municipality: 'San Salvador',
    department: 'San Salvador',
    schedule: 'Martes a Domingo, 9:00 AM - 5:00 PM',
    price: '$5 adultos, $3 niños',
    imageUrl: 'https://images.unsplash.com/photo-1557166984-b0a9a6dcfc08?w=800',
    recommendations: ['Fauna nativa', 'Ornitología', 'Senderismo', 'Educación ambiental']
  },
  {
    id: '15',
    name: 'Volcán de San Miguel',
    category: 'montaña',
    lat: 13.4333,
    lng: -88.2667,
    description: 'Active volcano with panoramic views. Climbing to the crater is a popular adventure.',
    municipality: 'San Miguel',
    department: 'San Miguel',
    schedule: '最好联系当地导游',
    price: '$10 (con guía)',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    recommendations: ['Senderismo', 'Vista al crater', 'Aventura', 'Fotografía']
  }
];

// Fetch ads from Firebase (with fallback to demo ads)
export async function getAds(): Promise<Ad[]> {
  try {
    const adsRef = collection(db, 'ads');
    const snapshot = await getDocs(adsRef);
    if (snapshot.empty) {
      return getDefaultAds();
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ad[];
  } catch {
    return getDefaultAds();
  }
}

function getDefaultAds(): Ad[] {
  return [
    {
      id: 'demo-1',
      title: 'Tours El Salvador',
      imageUrl: 'https://via.placeholder.com/300x250/00ff88/000?text=Tours+SV',
      linkUrl: '#',
      position: 'sidebar',
      active: true
    },
    {
      id: 'demo-2',
      title: 'Hoteles El Salvador',
      imageUrl: 'https://via.placeholder.com/300x250/ff6b9d/000?text=Hoteles',
      linkUrl: '#',
      position: 'sidebar',
      active: true
    }
  ];
}

export async function saveAdFeedback(adId: string, action: 'view' | 'click') {
  try {
    await addDoc(collection(db, 'adAnalytics'), {
      adId,
      action,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('Error saving ad feedback:', err);
  }
}
