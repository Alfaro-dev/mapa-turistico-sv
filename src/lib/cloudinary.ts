// Subida de fotos a Cloudinary (plan gratis) con un preset sin firma.
// El preset "mapa_sv_fotos" ya limita en el servidor: solo imágenes
// (jpg, png, webp, heic), carpeta fija "mapa-sv", sin sobrescribir y
// reduce todo a máx. 1600 px con calidad automática.

const CLOUD_NAME = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || 'n6yslku2';
const UPLOAD_PRESET = import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'mapa_sv_fotos';
const MAX_BYTES = 5 * 1024 * 1024;

export type PhotoKind = 'places' | 'reviews';

/** Sube una imagen y devuelve su URL https. Lanza Error con un mensaje en español. */
export async function uploadImage(file: File, kind: PhotoKind, uid: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Ese archivo no es una foto. Elegí una imagen JPG, PNG o HEIC.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La foto pesa más de 5 MB. Elegí otra o tomala con menos resolución.');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  // Etiquetas para poder filtrar y moderar desde el panel de Cloudinary.
  form.append('tags', `${kind},uid_${uid}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    // El mensaje de Cloudinary viene en inglés: al turista le damos uno claro en español.
    console.error('Cloudinary:', data?.error?.message || res.status);
    throw new Error(res.status >= 500 || !res.status
      ? 'No se pudo subir la foto. Revisá tu conexión e intentá de nuevo.'
      : 'Esa foto no se pudo subir. Probá con otra en JPG o PNG.');
  }
  return data.secure_url as string;
}
