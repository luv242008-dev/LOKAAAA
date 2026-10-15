export type Location = {
  id: string;
  name: string;
  emoji: string;
  mood: string;
  description: string;
  activities: string[];
  accent: string;
};

export const locations: Location[] = [
  {
    id: 'arbol',
    name: 'Árbol de los sueños',
    emoji: '🌳',
    mood: 'Espiritu libre',
    description: 'Un rincón tranquilo donde Ari mira el cielo y escucha el viento entre las ramas.',
    activities: ['dibujar nubes', 'escuchar pájaros', 'contar historias'],
    accent: '#7cc68b',
  },
  {
    id: 'snoopy',
    name: 'Caseta de Snoopy',
    emoji: '🏠',
    mood: 'Divertido y creativo',
    description: 'La caseta roja se llena de imaginación. Aquí todo puede volverse una aventura.',
    activities: ['inventar misiones', 'reposar en la terraza', 'ver la vista del barrio'],
    accent: '#f2a65a',
  },
  {
    id: 'muro',
    name: 'Muro de pensar',
    emoji: '🧠',
    mood: 'Reflexivo',
    description: 'El lugar ideal para mirar al infinito y dejar que la idea florezca despacio.',
    activities: ['pensar sin prisa', 'resolver enigmas', 'dibujar planes'],
    accent: '#8db7ff',
  },
  {
    id: 'casa',
    name: 'Casa de Charlie Brown',
    emoji: '🏡',
    mood: 'Calmado y cercano',
    description: 'Una casa llena de recuerdos, pequeñas tareas y el abrazo cotidiano del barrio.',
    activities: ['organizar objetos', 'tomar un descanso', 'ver el atardecer'],
    accent: '#d18ae8',
  },
  {
    id: 'cuaderno',
    name: 'Cuaderno de Ari',
    emoji: '📓',
    mood: 'Curioso',
    description: 'Aquí cada descubrimiento se convierte en una nota, un dibujo o un pequeño gran plan.',
    activities: ['anotar ideas', 'guardar recuerdos', 'hacer listas de aventuras'],
    accent: '#f18c9e',
  },
];

export const missions = [
  'Recoger una historia nueva del barrio.',
  'Visitar el lugar favorito del día.',
  'Guardar un recuerdo en el cuaderno.',
  'Buscar un detalle escondido en cada rincón.',
  'Terminar con una sonrisa y un buen plan.',
];
