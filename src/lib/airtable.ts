/**
 * Fetch y parseo de registros del knowledge base de Airtable.
 * Se ejecuta en build time (SSG) — no expone credenciales al cliente.
 */

interface AirtableRecord {
  id: string;
  fields: {
    title: string;
    content: string;
    keywords?: string;
    category?: string;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// Fetch todos los registros de la tabla knowledge
async function fetchAllRecords(): Promise<AirtableRecord[]> {
  const token = import.meta.env.AIRTABLE_TOKEN;
  const baseId = import.meta.env.AIRTABLE_BASE_ID;
  const tableId = import.meta.env.AIRTABLE_TABLE_ID;

  if (!token || !baseId || !tableId) {
    console.warn('[Airtable] Variables de entorno no configuradas. Usando datos de respaldo.');
    return [];
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.warn(`[Airtable] Error ${res.status}: ${res.statusText}`);
    return [];
  }

  const data: AirtableResponse = await res.json();
  return data.records;
}

// Buscar un registro por título exacto
function findByTitle(records: AirtableRecord[], title: string): string {
  const record = records.find(r => r.fields.title === title);
  return record?.fields.content ?? '';
}

// Buscar registros por categoría
function findByCategory(records: AirtableRecord[], category: string): AirtableRecord[] {
  return records.filter(r => r.fields.category === category);
}

// ── Parsers por componente ──────────────────────────────────

export async function getKnowledge() {
  const records = await fetchAllRecords();
  if (records.length === 0) return null;

  return {
    empresa: parseEmpresa(records),
    servicios: parseServicios(records),
    precios: parsePrecios(records),
    equipo: parseEquipo(records),
    testimonios: parseTestimonios(records),
    contacto: parseContacto(records),
  };
}

function parseEmpresa(records: AirtableRecord[]) {
  return {
    info: findByTitle(records, 'Información general'),
    mision: findByTitle(records, 'Misión'),
    valores: findByTitle(records, 'Valores'),
  };
}

function parseServicios(records: AirtableRecord[]) {
  const serviciosRecords = findByCategory(records, 'servicios');
  const content: Record<string, string> = {};
  for (const r of serviciosRecords) {
    content[r.fields.title] = r.fields.content;
  }

  return [
    {
      icon: '🌐',
      title: 'Desarrollo Web',
      description: content['Alojamiento web para clientes']
        ? extraerPrimeraOracion(content['Servicios'], 'Sitios web modernos con Astro y Svelte. Landing pages, portafolios y gestores de contenido desplegados en Vercel.')
        : 'Sitios web modernos con Astro y Svelte. Landing pages, portafolios y gestores de contenido desplegados en Vercel.',
      features: ['Diseño responsive', 'HTTPS y CDN global', 'Optimización de velocidad'],
    },
    {
      icon: '🎬',
      title: 'Videos con IA',
      description: content['Videos con IA']
        ? extraerDescripcionVideo(content['Videos con IA'])
        : 'Creación de videos usando Kling AI y Gemini. 80% generación IA, 20% edición manual profesional.',
      features: ['Videos de 30s a 4 min', 'Proceso creativo IA', 'Edición profesional'],
    },
    {
      icon: '🗄️',
      title: 'Base de Datos',
      description: content['Base de datos para clientes']
        ? simplificar(content['Base de datos para clientes'])
        : 'Airtable para uso interno y gestores de contenido. Supabase (PostgreSQL) para apps con muchos usuarios.',
      features: ['Migración incluida', 'Administración completa', 'Escalable'],
    },
    {
      icon: '📝',
      title: 'Gestor de Contenido',
      description: content['Gestor de contenido']
        ? simplificar(content['Gestor de contenido'])
        : 'Interfaz personalizada para que tu equipo gestione contenido fácilmente, o acceso directo a Airtable.',
      features: ['UI personalizado', 'Fácil de usar', 'Base de datos incluida'],
    },
    {
      icon: '☁️',
      title: 'Hosting y Dominio',
      description: 'Alojamiento en Vercel con SSL automático, CDN global y monitoreo. Gestionamos tu dominio.',
      features: ['SSL automático', 'Deploy continuo', 'Monitoreo 24/7'],
    },
    {
      icon: '🤖',
      title: 'Automatización IA',
      description: 'Bot interno con IA, integraciones con Slack, GitHub y Vercel para optimizar flujos de trabajo.',
      features: ['Notificaciones automáticas', 'Asistente IA', 'Integraciones'],
    },
  ];
}

function parsePrecios(records: AirtableRecord[]) {
  const webContent = findByTitle(records, 'Alojamiento web para clientes');
  const videoContent = findByTitle(records, 'Videos con IA');

  // Extraer precios de videos del contenido
  const videoPricing = videoContent ? extraerPreciosVideo(videoContent) : null;

  return {
    web: {
      pagoUnico: 200,
      mensual: 65,
      anual: 55,
      ahorroAnual: 120,
      extras: 29,
      entrega: '5-7 días hábiles',
      incluido: [
        'Diseño, desarrollo y publicación',
        'Diseño responsive',
        'HTTPS, CDN global, SSL',
        'Optimización de velocidad',
        'Botón de WhatsApp incluido',
        'Páginas legales incluidas',
      ],
      mensualIncluye: [
        'Hosting + dominio (Vercel)',
        'Base de datos (Airtable)',
        'Gestión de contenido',
        'Monitoreo continuo',
        'Actualizaciones vía correo o Slack',
      ],
      extrasLista: [
        'Menú de platos', 'Banners y descuentos', 'Formulario de contacto',
        'Galería de fotos/videos', 'FAQ', 'Blog o noticias', 'WhatsApp',
        'Google Maps', 'Buscador', 'Sección de equipo',
        'Calendario de eventos', 'Descarga de PDFs', 'Multi-idioma', 'Modo oscuro',
      ],
    },
    videos: videoPricing ?? [
      { duracion: '30 seg', precio: 100, soles: '' },
      { duracion: 'Hasta 1 min', precio: 200, soles: 'S/750' },
      { duracion: '1 - 2 min', precio: 350, soles: 'S/1,300' },
      { duracion: '3 - 4 min', precio: 530, soles: 'S/2,000' },
    ],
  };
}

function parseEquipo(records: AirtableRecord[]) {
  const content = findByTitle(records, 'Fundadores');
  if (!content) return null;

  // Parsear datos de los fundadores desde el texto
  const team = [];

  if (content.includes('Jorge')) {
    const jorgeMatch = content.match(/Jorge[^.]*\./);
    const jorgeBio = jorgeMatch ? jorgeMatch[0].replace(/^.*Jorge (Vicuña )?/, '') : '';
    team.push({
      name: 'Jorge Vicuña',
      role: 'Software Developer',
      bio: content.includes('ex Yape')
        ? 'Ex Yape, ex Interbank, docente PUCP y ganador de Startup 2023. Lidera el desarrollo técnico y la arquitectura de todos los proyectos.'
        : jorgeBio,
      skills: ['Astro', 'Svelte', 'Supabase', 'Claude Code'],
    });
  }

  if (content.includes('Adri')) {
    team.push({
      name: 'Adriana Suárez',
      role: 'IA Video Creator',
      bio: content.includes('ex Crehana')
        ? 'Ex Crehana. Especialista en generación de contenido visual con inteligencia artificial. Dirige la producción de videos y contenido digital.'
        : 'Ex Crehana, especialista en contenido educativo. Dirige la producción audiovisual con IA y la propuesta narrativa de todos los proyectos.',
      skills: ['Kling AI', 'Gemini', 'Higgsfield', 'Prompt Engineering'],
    });
  }

  return team.length > 0 ? team : null;
}

function parseTestimonios(records: AirtableRecord[]) {
  const content = findByTitle(records, 'Testimonios de clientes');
  if (!content) return null;

  const testimonios = [];

  if (content.includes('Ayuda en Acción') || content.includes('AEA')) {
    testimonios.push({
      client: 'Ayuda en Acción (AEA)',
      contact: content.match(/Careli Taboada/) ? 'Careli Taboada' : 'Contacto AEA',
      role: content.includes('comunicadora') ? 'Comunicadora y Administradora' : 'Cliente',
      project: content.includes('administrador de contenidos')
        ? 'Administrador de contenidos con Airtable y Svelte, publicado en Vercel.'
        : 'Proyecto web con Airtable y Svelte.',
      type: 'CMS Personalizado',
    });
  }

  if (content.includes('PUCP')) {
    testimonios.push({
      client: 'PUCP',
      contact: 'Pontificia Universidad Católica del Perú',
      role: 'Universidad',
      project: content.includes('proyectos de estudiantes')
        ? 'Página de contenidos para exponer proyectos de estudiantes, construida con Astro y publicada en Vercel.'
        : 'Sitio web construido con Astro.',
      type: 'Sitio Web',
    });
  }

  return testimonios.length > 0 ? testimonios : null;
}

function parseContacto(records: AirtableRecord[]) {
  const contactoContent = findByTitle(records, 'Contacto');
  const procesoContent = findByTitle(records, 'Proceso de un proyecto');

  // Extraer email del contenido
  const emailMatch = contactoContent.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : 'suarezladriana@gmail.com';

  return {
    email,
    ubicacion: contactoContent.includes('Lima') ? 'Lima, Perú' : 'Lima, Perú',
    proceso: procesoContent || '',
  };
}

// ── Helpers ──────────────────────────────────────────────────

function extraerPrimeraOracion(text: string, fallback: string): string {
  if (!text) return fallback;
  const match = text.match(/^[^.]+\./);
  return match ? match[0] : fallback;
}

function extraerDescripcionVideo(text: string): string {
  // Extraer herramientas y porcentajes del texto de videos
  const herramientas = text.match(/(?:Kling AI|Gemini|Higgsfield)/g) || ['Kling AI', 'Gemini'];
  const porcentaje = text.match(/(\d+)%\s*generación/);
  const edicion = text.match(/(\d+)%\s*edición/);

  const gen = porcentaje ? porcentaje[1] : '80';
  const ed = edicion ? edicion[1] : '20';

  return `Creación de videos usando ${herramientas.join(' y ')}. ${gen}% generación IA, ${ed}% edición manual profesional.`;
}

function extraerPreciosVideo(text: string) {
  const precios: { duracion: string; precio: number; soles: string }[] = [];

  // Video de 30 segundos: $100
  const match30 = text.match(/30 segundos[:\s]*\$(\d+)/);
  if (match30) precios.push({ duracion: '30 seg', precio: parseInt(match30[1]), soles: '' });

  // Video corto (hasta 1 min): $200 (S/750)
  const matchCorto = text.match(/(?:corto|1 min)[^$]*\$(\d+)(?:\s*\(S\/([0-9,.]+)\))?/);
  if (matchCorto) precios.push({ duracion: 'Hasta 1 min', precio: parseInt(matchCorto[1]), soles: matchCorto[2] ? `S/${matchCorto[2]}` : '' });

  // Video medio (1-2 min): $350 (S/1,300)
  const matchMedio = text.match(/(?:medio|1-2 min)[^$]*\$(\d+)(?:\s*\(S\/([0-9,.]+)\))?/);
  if (matchMedio) precios.push({ duracion: '1 - 2 min', precio: parseInt(matchMedio[1]), soles: matchMedio[2] ? `S/${matchMedio[2]}` : '' });

  // Video largo (3-4 min): $530 (S/2,000)
  const matchLargo = text.match(/(?:largo|3-4 min)[^$]*\$(\d+)(?:\s*\(S\/([0-9,.]+)\))?/);
  if (matchLargo) precios.push({ duracion: '3 - 4 min', precio: parseInt(matchLargo[1]), soles: matchLargo[2] ? `S/${matchLargo[2]}` : '' });

  return precios.length > 0 ? precios : null;
}

function simplificar(text: string): string {
  // Tomar las primeras 2 oraciones como descripción
  const oraciones = text.split('. ').slice(0, 2);
  return oraciones.join('. ') + (oraciones.length > 0 ? '.' : '');
}
