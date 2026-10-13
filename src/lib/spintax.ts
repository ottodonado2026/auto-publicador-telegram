/**
 * Parser de Spintax recursivo y de alto rendimiento
 * Transforma cadenas con sintaxis {opcion1|opcion2|opcion3} en variaciones aleatorias únicas.
 */
export function parseSpintax(text: string): string {
  if (!text) return "";

  const spintaxRegex = /\{([^{}]+)\}/g;

  let current = text;
  let hasMatches = true;

  // Bucle para resolver spintax anidado de adentro hacia afuera
  while (hasMatches) {
    const matches = current.match(spintaxRegex);
    if (!matches) {
      hasMatches = false;
      break;
    }

    current = current.replace(spintaxRegex, (_, choices) => {
      const options = choices.split("|");
      const randomIndex = Math.floor(Math.random() * options.length);
      return options[randomIndex] || "";
    });
  }

  return current;
}

/**
 * Calcula el número aproximado de combinaciones únicas posibles en un texto Spintax
 */
export function calculateSpintaxCombinations(text: string): number {
  if (!text) return 1;

  const spintaxRegex = /\{([^{}]+)\}/g;
  let total = 1;
  let match;

  while ((match = spintaxRegex.exec(text)) !== null) {
    const options = match[1].split("|").filter(Boolean);
    if (options.length > 0) {
      total *= options.length;
    }
  }

  return total;
}
