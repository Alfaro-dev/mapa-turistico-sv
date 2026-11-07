# Mapa Turístico de El Salvador 🗺️🇸🇻

Sitio web con un **mapa interactivo** de lugares turísticos de El Salvador, con **panel de administración** para gestionar los lugares e **importación** masiva de datos.

## ✨ Funciones

- Mapa interactivo con **Leaflet**
- Listado de lugares turísticos
- Panel de administración con inicio de sesión
- Importación de lugares
- Datos almacenados en **Firebase**

## 🛠️ Stack

- **Astro** + **TypeScript**
- **Firebase** (Auth y base de datos)
- **Leaflet**
- **Tailwind CSS**

## 🚀 Cómo correrlo

```bash
npm install
npm run dev       # http://localhost:4321
```

Las credenciales de Firebase se leen desde variables de entorno.

---

Desarrollado por [Carlos Alfaro](https://carlosalfaro.dev).

## 🔒 Seguridad y despliegue de reglas

Las reglas de `firestore.rules` y `storage.rules` sirven tanto para esta web como para la app Flutter (mismo proyecto `mapsv-1776175535`).

- Todos pueden **leer** lugares, negocios, cupones, fotos y reseñas.
- Cada usuario solo **escribe lo suyo** (reseñas, fotos, check-ins, su perfil y sus negocios).
- **Lugares** y **anuncios** solo los crea o edita un administrador.
- El campo **`featured`** (negocio destacado, el plan pago) solo lo cambia un administrador.
- Los contadores (visitas, vistas, clics, reacciones) solo pueden subir de 1 en 1.

### Hacerte administrador

1. Inicia sesión una vez en la web (`/admin`) con tu cuenta de Google.
2. En la consola de Firebase → **Authentication**, copia tu **UID**.
3. En **Firestore** → crea la colección `admins` y dentro un documento cuyo ID sea tu UID (puede llevar un campo `nombre`).

Nadie puede crear documentos en `admins` desde la web ni desde la app; solo desde la consola.

### Publicar las reglas

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,storage
```

La primera vez, Firebase pregunta si las reglas de Storage pueden consultar Firestore (para saber quién es admin): responde que sí.
