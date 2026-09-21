export interface Proveedor {
  id: string;
  categoria: string | null;
  subcategoria: string | null;
  nombre: string | null;
  municipio: string | null;
  zona: string | null;
  direccion: string | null;
  latitud: string | null;
  longitud: string | null;
  telefono: string | null;
  sitio_web: string | null;
  horario: string | null;
  nivel_precio: string | null;
  precio_referencial: string | null;
  google_maps_url: string | null;
  place_id: string | null;
  rnt: string | null;
  descripcion: string | null;
  foto_url: string | null;
  estado: string | null;
  notas: string | null;
}

export interface Ruta {
  ruta_id: string;
  nombre: string | null;
  municipios: string | null;
  tipo: string | null;
  duracion_sugerida: string | null;
  dificultad: string | null;
  publico: string | null;
  descripcion: string | null;
  n_paradas: string | null;
  km_linea_recta: string | null;
  estado: string | null;
}

export interface Parada {
  ruta_id: string;
  orden: string;
  proveedor_id: string;
  nombre: string | null;
  tipo_parada: string | null;
  municipio: string | null;
  latitud: string | null;
  longitud: string | null;
  km_desde_anterior: string | null;
  nota: string | null;
}

export interface Actividad {
  actividad_id: string;
  nombre: string | null;
  tipo: string | null;
  municipio: string | null;
  proveedor_id: string | null;
  proveedor: string | null;
  duracion: string | null;
  dificultad: string | null;
  precio: string | null;
  notas: string | null;
  estado: string | null;
}

export const CATEGORY_ORDER = ['Hospedaje', 'Restaurante', 'Atractivo turístico', 'Agencia / Operador'] as const;

export function publicProviders(providers: Proveedor[]): Proveedor[] {
  return providers.filter((p) => p.estado !== 'No publicar');
}

export function isZonaInfluencia(proveedor: Proveedor): boolean {
  return proveedor.zona === 'Zona de influencia' || proveedor.estado === null;
}

export function categorySlug(categoria: string | null): string {
  const map: Record<string, string> = {
    Hospedaje: 'hospedaje',
    Restaurante: 'restaurante',
    'Atractivo turístico': 'atractivo',
    'Agencia / Operador': 'agencia',
  };
  return (categoria && map[categoria]) || 'hospedaje';
}

export function genericImageUrl(categoria: string | null): string {
  return `/images/generico-${categorySlug(categoria)}.svg`;
}

export function normalizePhone(telefono: string | null): string | null {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, '');
  if (digits.length === 0) return null;
  return digits.startsWith('57') ? digits : `57${digits}`;
}

export function whatsappLink(telefono: string | null, proveedorNombre?: string | null): string | null {
  const digits = normalizePhone(telefono);
  if (!digits) return null;
  const text = proveedorNombre
    ? encodeURIComponent(`Hola, vi "${proveedorNombre}" en Mi Región del Tequendama. ¿Me dan información?`)
    : '';
  return `https://wa.me/${digits}${text ? `?text=${text}` : ''}`;
}

export function telLink(telefono: string | null): string | null {
  if (!telefono) return null;
  const href = `tel:+${normalizePhone(telefono)}`;
  return href;
}

export function formatTelefono(telefono: string | null): string {
  if (!telefono) return '';
  return telefono.replace(/\s+/g, ' ');
}

export function remotePhotoUrl(fotoUrl: string | null): string | null {
  if (!fotoUrl) return null;
  return fotoUrl;
}

export function showIfPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== '';
}

export function ordinaList(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function categoriaPara(proveedor: Proveedor): string {
  return proveedor.categoria || 'Hospedaje';
}