// Chinese zodiac (Sheng Xiao) — animal + Five-Element (Wu Xing) of the birth year.
// The zodiac year rolls over at Chinese New Year (a lunisolar date that drifts
// between late January and mid-February), NOT January 1 — so we look up the exact
// CNY start date for the Gregorian year and shift back a year for dates before it.

export interface ChineseAnimal {
  id: string;
  name: string;
  emoji: string;
  yinYang: 'Yang' | 'Yin';
  fixedElement: string;      // the animal's own fixed element (traditional)
  traits: string[];
  description: string;
}

export interface ChineseElement {
  name: 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
  emoji: string;
  quality: string;           // short flavour of what the element adds
}

export const CHINESE_ELEMENTS: Record<string, ChineseElement> = {
  Wood:  { name: 'Wood',  emoji: '🌳', quality: 'growth-minded, generous, and cooperative' },
  Fire:  { name: 'Fire',  emoji: '🔥', quality: 'dynamic, passionate, and adventurous' },
  Earth: { name: 'Earth', emoji: '⛰️', quality: 'grounded, patient, and reliable' },
  Metal: { name: 'Metal', emoji: '⚔️', quality: 'determined, disciplined, and resolute' },
  Water: { name: 'Water', emoji: '💧', quality: 'intuitive, adaptable, and persuasive' },
};

// Ordered from Rat. Index 0 corresponds to years where (year - 4) % 12 === 0.
export const CHINESE_ANIMALS: ChineseAnimal[] = [
  {
    id: 'rat', name: 'Rat', emoji: '🐀', yinYang: 'Yang', fixedElement: 'Water',
    traits: ['quick-witted', 'resourceful', 'charming', 'adaptable', 'ambitious'],
    description: 'Rats are sharp, imaginative, and endlessly resourceful. They read a room quickly, spot opportunity where others miss it, and adapt with ease — though their restlessness and caution can make them hard to pin down.',
  },
  {
    id: 'ox', name: 'Ox', emoji: '🐂', yinYang: 'Yin', fixedElement: 'Earth',
    traits: ['diligent', 'dependable', 'patient', 'strong-willed', 'honest'],
    description: 'Oxen are steady, methodical, and quietly determined. They earn trust through reliability and hard work rather than flash, and once set on a path they are almost impossible to move — for better and for worse.',
  },
  {
    id: 'tiger', name: 'Tiger', emoji: '🐅', yinYang: 'Yang', fixedElement: 'Wood',
    traits: ['brave', 'confident', 'competitive', 'charismatic', 'impulsive'],
    description: 'Tigers are bold, magnetic, and fiercely independent. Natural leaders who charge at challenges head-on, they inspire others with their courage — but their intensity and unpredictability can be a double-edged sword.',
  },
  {
    id: 'rabbit', name: 'Rabbit', emoji: '🐇', yinYang: 'Yin', fixedElement: 'Wood',
    traits: ['gentle', 'elegant', 'kind', 'diplomatic', 'cautious'],
    description: 'Rabbits are gentle, refined, and socially graceful. They value harmony, avoid conflict, and treat others with quiet compassion — though their aversion to risk can tip into over-caution.',
  },
  {
    id: 'dragon', name: 'Dragon', emoji: '🐉', yinYang: 'Yang', fixedElement: 'Earth',
    traits: ['confident', 'ambitious', 'energetic', 'charismatic', 'visionary'],
    description: 'Dragons are the most flamboyant of the signs — confident, ambitious, and brimming with energy. They dream big and draw people into their orbit, though pride and impatience can trip them up.',
  },
  {
    id: 'snake', name: 'Snake', emoji: '🐍', yinYang: 'Yin', fixedElement: 'Fire',
    traits: ['wise', 'intuitive', 'graceful', 'private', 'strategic'],
    description: 'Snakes are wise, perceptive, and deeply intuitive. They think before they speak, keep their own counsel, and move with quiet elegance — enigmatic to others and rarely caught off guard.',
  },
  {
    id: 'horse', name: 'Horse', emoji: '🐎', yinYang: 'Yang', fixedElement: 'Fire',
    traits: ['energetic', 'independent', 'adventurous', 'warm', 'free-spirited'],
    description: 'Horses are lively, free-spirited, and warm-hearted. They crave movement, travel, and new horizons, winning friends with easy charm — though they can be impatient and struggle to sit still.',
  },
  {
    id: 'goat', name: 'Goat', emoji: '🐐', yinYang: 'Yin', fixedElement: 'Earth',
    traits: ['gentle', 'compassionate', 'creative', 'calm', 'artistic'],
    description: 'Goats are tender, creative, and thoughtful. Drawn to beauty and peace, they nurture the people around them and think deeply — though they can worry, and their indecision may frustrate the more decisive.',
  },
  {
    id: 'monkey', name: 'Monkey', emoji: '🐒', yinYang: 'Yang', fixedElement: 'Metal',
    traits: ['clever', 'curious', 'playful', 'inventive', 'sociable'],
    description: 'Monkeys are clever, curious, and irrepressibly playful. Quick problem-solvers with a mischievous streak, they thrive on novelty and wit — though their restlessness can read as inconstancy.',
  },
  {
    id: 'rooster', name: 'Rooster', emoji: '🐓', yinYang: 'Yin', fixedElement: 'Metal',
    traits: ['observant', 'hardworking', 'confident', 'honest', 'meticulous'],
    description: 'Roosters are sharp-eyed, hardworking, and forthright. Proud of their competence and unafraid to speak plainly, they hold high standards for themselves and others — sometimes to a fault.',
  },
  {
    id: 'dog', name: 'Dog', emoji: '🐕', yinYang: 'Yang', fixedElement: 'Earth',
    traits: ['loyal', 'honest', 'protective', 'fair', 'kind'],
    description: 'Dogs are loyal, principled, and deeply fair. They stand up for the people and causes they believe in and value honesty above almost anything — though their strong sense of justice can make them anxious or stubborn.',
  },
  {
    id: 'pig', name: 'Pig', emoji: '🐖', yinYang: 'Yin', fixedElement: 'Water',
    traits: ['generous', 'sincere', 'easygoing', 'diligent', 'good-natured'],
    description: 'Pigs are warm, sincere, and generous to a fault. Easygoing and hardworking, they enjoy life’s comforts and give freely of themselves — though their trusting nature can leave them open to being taken advantage of.',
  },
];

// Chinese New Year (day 1) Gregorian dates as [month, day], covering the birth-year
// dropdown range. Dates before these fall in the previous zodiac year.
const CHINESE_NEW_YEAR: Record<number, [number, number]> = {
  1920: [2, 20], 1921: [2, 8],  1922: [1, 28], 1923: [2, 16], 1924: [2, 5],
  1925: [1, 24], 1926: [2, 13], 1927: [2, 2],  1928: [1, 23], 1929: [2, 10],
  1930: [1, 30], 1931: [2, 17], 1932: [2, 6],  1933: [1, 26], 1934: [2, 14],
  1935: [2, 4],  1936: [1, 24], 1937: [2, 11], 1938: [1, 31], 1939: [2, 19],
  1940: [2, 8],  1941: [1, 27], 1942: [2, 15], 1943: [2, 5],  1944: [1, 25],
  1945: [2, 13], 1946: [2, 2],  1947: [1, 22], 1948: [2, 10], 1949: [1, 29],
  1950: [2, 17], 1951: [2, 6],  1952: [1, 27], 1953: [2, 14], 1954: [2, 3],
  1955: [1, 24], 1956: [2, 12], 1957: [1, 31], 1958: [2, 18], 1959: [2, 8],
  1960: [1, 28], 1961: [2, 15], 1962: [2, 5],  1963: [1, 25], 1964: [2, 13],
  1965: [2, 2],  1966: [1, 21], 1967: [2, 9],  1968: [1, 30], 1969: [2, 17],
  1970: [2, 6],  1971: [1, 27], 1972: [2, 15], 1973: [2, 3],  1974: [1, 23],
  1975: [2, 11], 1976: [1, 31], 1977: [2, 18], 1978: [2, 7],  1979: [1, 28],
  1980: [2, 16], 1981: [2, 5],  1982: [1, 25], 1983: [2, 13], 1984: [2, 2],
  1985: [2, 20], 1986: [2, 9],  1987: [1, 29], 1988: [2, 17], 1989: [2, 6],
  1990: [1, 27], 1991: [2, 15], 1992: [2, 4],  1993: [1, 23], 1994: [2, 10],
  1995: [1, 31], 1996: [2, 19], 1997: [2, 7],  1998: [1, 28], 1999: [2, 16],
  2000: [2, 5],  2001: [1, 24], 2002: [2, 12], 2003: [2, 1],  2004: [1, 22],
  2005: [2, 9],  2006: [1, 29], 2007: [2, 18], 2008: [2, 7],  2009: [1, 26],
  2010: [2, 14], 2011: [2, 3],  2012: [1, 23], 2013: [2, 10], 2014: [1, 31],
  2015: [2, 19], 2016: [2, 8],  2017: [1, 28], 2018: [2, 16], 2019: [2, 5],
  2020: [1, 25], 2021: [2, 12], 2022: [2, 1],  2023: [1, 22], 2024: [2, 10],
  2025: [1, 29], 2026: [2, 17], 2027: [2, 6],  2028: [1, 26], 2029: [2, 13],
  2030: [2, 3],  2031: [1, 23], 2032: [2, 11], 2033: [1, 31], 2034: [2, 19],
  2035: [2, 8],  2036: [1, 28], 2037: [2, 15], 2038: [2, 4],  2039: [1, 24],
  2040: [2, 12], 2041: [2, 1],  2042: [1, 22], 2043: [2, 10], 2044: [1, 30],
  2045: [2, 17], 2046: [2, 6],  2047: [1, 26], 2048: [2, 14], 2049: [2, 2],
  2050: [1, 23],
};

export interface ChineseZodiacResult {
  animal: ChineseAnimal;
  element: ChineseElement;
  yearName: string;   // e.g. "Metal Rat"
  zodiacYear: number; // the Chinese zodiac year the birth date belongs to
}

/** Resolve the Chinese zodiac year that a Gregorian (year, month, day) falls in. */
function resolveZodiacYear(year: number, month: number, day: number): number {
  const cny = CHINESE_NEW_YEAR[year];
  if (cny) {
    const [cnyMonth, cnyDay] = cny;
    if (month < cnyMonth || (month === cnyMonth && day < cnyDay)) return year - 1;
    return year;
  }
  // Outside the table: approximate by treating anything before Feb 4 as the prior year.
  if (month === 1 || (month === 2 && day < 4)) return year - 1;
  return year;
}

export function getChineseZodiac(dateStr: string): ChineseZodiacResult | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  const zodiacYear = resolveZodiacYear(year, month, day);
  const animalIndex = (((zodiacYear - 4) % 12) + 12) % 12;
  const elementNames: ChineseElement['name'][] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
  const elementIndex = Math.floor(((((zodiacYear - 4) % 10) + 10) % 10) / 2);

  const animal = CHINESE_ANIMALS[animalIndex];
  const element = CHINESE_ELEMENTS[elementNames[elementIndex]];

  return {
    animal,
    element,
    yearName: `${element.name} ${animal.name}`,
    zodiacYear,
  };
}
