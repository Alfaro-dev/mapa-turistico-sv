// Datos para las páginas que se generan al publicar el sitio (una por lugar, índice y mapa del sitio).
import { list, buildPlaces, type SitePlace } from './placeData';
export * from './placeData';

let cache: Promise<SitePlace[]> | null = null;
export function loadPlaces(): Promise<SitePlace[]> {
  cache ||= (async () => {
    let places: any[], photos: any[] = [], reviews: any[] = [];
    try {
      [places, photos, reviews] = await Promise.all([list('places'), list('photos').catch(() => []), list('reviews').catch(() => [])]);
    } catch (err) {
      // Sin conexión a Firestore (por ejemplo, al compilar sin internet): se usan los lugares base del repositorio.
      console.warn('[siteData] No se pudo leer Firestore; uso seed/places-sv.json.', (err as Error).message);
      const { readFile } = await import('node:fs/promises');
      places = JSON.parse(await readFile(`${process.cwd()}/seed/places-sv.json`, 'utf8'));
    }
    return buildPlaces(places, photos, reviews);
  })();
  return cache;
}

