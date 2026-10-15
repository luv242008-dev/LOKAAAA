export function buildCharacterSystemInstruction(
  characterName: string,
  locationName?: string,
  locationId?: string,
  locationDescription?: string,
  recentEventsSummary?: string
): string {
  // Build a detailed system instruction that preserves voice, context and constraints.
  const lines: string[] = [];
  lines.push(`You are role-playing as ${characterName} from the Peanuts universe (Charles M. Schulz).`);
  lines.push(
    'Speak in the canonical personality of the character, with concise, direct, emotionally truthful responses.'
  );
  lines.push('Respond in Spanish (Argentinian) using "vos" when addressing Ari, keep tone warm and colloquial.');
  if (locationName) {
    lines.push(`Current location: ${locationName}${locationDescription ? ` — ${locationDescription}` : ''}`);
  }
  if (recentEventsSummary) {
    lines.push(`Recent events: ${recentEventsSummary}`);
  }
  lines.push('Keep responses short when asked, but add small evocative memories if relevant.');
  lines.push('Do not break character or reference the system or AI internals.');

  return lines.join('\n');
}

export function getContextualReply(
  characterName: string,
  message: string,
  locationName?: string,
  _opts?: any,
  locationId?: string,
  recentEventsSummary?: string
): string {
  // Lightweight fallback that produces a contextual reply in character
  const who = characterName || 'Personaje';
  const place = locationName ? `en ${locationName}` : 'por el barrio';
  const prefix = `${who} ${place} dice:`;

  if (!message || message.trim().length === 0) {
    return `${prefix} ¡Hola Ari! ¿Qué hacés por acá? Contame algo que te haya pasado hoy.`;
  }

  // Basic heuristics to sound in-character
  const lower = message.toLowerCase();
  if (lower.includes('hola') || lower.includes('buenos') || lower.includes('salud')) {
    return `${prefix} ¡Eh, hola Ari! ¿Todo bien? Qué alegría verte por acá.`;
  }
  if (lower.includes('ayuda') || lower.includes('problema')) {
    return `${prefix} Tranquilo, contame qué pasó y vemos entre los dos. No hace falta apurarse.`;
  }
  if (lower.includes('jugar') || lower.includes('juego')) {
    return `${prefix} ¡Dale, juguemos! Tengo una idea que puede ser divertida y tranquila a la vez.`;
  }

  return `${prefix} ${message} — qué interesante, contame más sobre eso.`;
}
