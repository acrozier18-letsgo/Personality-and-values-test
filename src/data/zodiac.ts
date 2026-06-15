export interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;     // Unicode symbol
  emoji: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  dateRange: string;  // display string
  startMonth: number; // 1-indexed
  startDay: number;
  endMonth: number;
  endDay: number;
  traits: string[];
  imageDescription: string; // Used in DALL-E prompt
  rulingPlanet: string;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: 'aries',
    name: 'Aries',
    symbol: '♈',
    emoji: '🐏',
    element: 'Fire',
    modality: 'Cardinal',
    dateRange: 'Mar 21 – Apr 19',
    startMonth: 3, startDay: 21,
    endMonth: 4,   endDay: 19,
    traits: ['bold', 'pioneering', 'impulsive', 'courageous', 'direct'],
    imageDescription: 'a bold ram with golden horns and a fiery aura',
    rulingPlanet: 'Mars',
  },
  {
    id: 'taurus',
    name: 'Taurus',
    symbol: '♉',
    emoji: '🐂',
    element: 'Earth',
    modality: 'Fixed',
    dateRange: 'Apr 20 – May 20',
    startMonth: 4, startDay: 20,
    endMonth: 5,   endDay: 20,
    traits: ['patient', 'reliable', 'sensual', 'stubborn', 'grounded'],
    imageDescription: 'a steadfast bull surrounded by lush meadows and wildflowers',
    rulingPlanet: 'Venus',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    symbol: '♊',
    emoji: '👯',
    element: 'Air',
    modality: 'Mutable',
    dateRange: 'May 21 – Jun 20',
    startMonth: 5, startDay: 21,
    endMonth: 6,   endDay: 20,
    traits: ['curious', 'adaptable', 'witty', 'restless', 'communicative'],
    imageDescription: 'twin figures intertwined, one gazing at the stars and one reading an open book',
    rulingPlanet: 'Mercury',
  },
  {
    id: 'cancer',
    name: 'Cancer',
    symbol: '♋',
    emoji: '🦀',
    element: 'Water',
    modality: 'Cardinal',
    dateRange: 'Jun 21 – Jul 22',
    startMonth: 6, startDay: 21,
    endMonth: 7,   endDay: 22,
    traits: ['nurturing', 'intuitive', 'protective', 'moody', 'empathic'],
    imageDescription: 'a luminous crab cradling a glowing pearl under a silver moon reflected on still water',
    rulingPlanet: 'Moon',
  },
  {
    id: 'leo',
    name: 'Leo',
    symbol: '♌',
    emoji: '🦁',
    element: 'Fire',
    modality: 'Fixed',
    dateRange: 'Jul 23 – Aug 22',
    startMonth: 7, startDay: 23,
    endMonth: 8,   endDay: 22,
    traits: ['charismatic', 'generous', 'dramatic', 'proud', 'warm-hearted'],
    imageDescription: 'a majestic lion with a sunlit golden mane seated on a throne of sunflowers',
    rulingPlanet: 'Sun',
  },
  {
    id: 'virgo',
    name: 'Virgo',
    symbol: '♍',
    emoji: '🌾',
    element: 'Earth',
    modality: 'Mutable',
    dateRange: 'Aug 23 – Sep 22',
    startMonth: 8, startDay: 23,
    endMonth: 9,   endDay: 22,
    traits: ['analytical', 'meticulous', 'helpful', 'perfectionist', 'modest'],
    imageDescription: 'a thoughtful figure among wheat fields and botanical drawings, surrounded by magnifying glasses and intricate scrolls',
    rulingPlanet: 'Mercury',
  },
  {
    id: 'libra',
    name: 'Libra',
    symbol: '♎',
    emoji: '⚖️',
    element: 'Air',
    modality: 'Cardinal',
    dateRange: 'Sep 23 – Oct 22',
    startMonth: 9,  startDay: 23,
    endMonth: 10,   endDay: 22,
    traits: ['diplomatic', 'fair-minded', 'social', 'indecisive', 'charming'],
    imageDescription: 'elegant scales balanced perfectly on a cloud, with rose petals falling and two paths diverging below',
    rulingPlanet: 'Venus',
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    symbol: '♏',
    emoji: '🦂',
    element: 'Water',
    modality: 'Fixed',
    dateRange: 'Oct 23 – Nov 21',
    startMonth: 10, startDay: 23,
    endMonth: 11,   endDay: 21,
    traits: ['intense', 'perceptive', 'secretive', 'transformative', 'determined'],
    imageDescription: 'a powerful scorpion wreathed in dark water and bioluminescent light, surrounded by swirling transformation symbols',
    rulingPlanet: 'Pluto',
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    symbol: '♐',
    emoji: '🏹',
    element: 'Fire',
    modality: 'Mutable',
    dateRange: 'Nov 22 – Dec 21',
    startMonth: 11, startDay: 22,
    endMonth: 12,   endDay: 21,
    traits: ['adventurous', 'optimistic', 'philosophical', 'restless', 'honest'],
    imageDescription: 'a centaur archer drawing a blazing arrow aimed at distant glowing horizons and star clusters',
    rulingPlanet: 'Jupiter',
  },
  {
    id: 'capricorn',
    name: 'Capricorn',
    symbol: '♑',
    emoji: '🐐',
    element: 'Earth',
    modality: 'Cardinal',
    dateRange: 'Dec 22 – Jan 19',
    startMonth: 12, startDay: 22,
    endMonth: 1,    endDay: 19,
    traits: ['disciplined', 'ambitious', 'patient', 'reserved', 'practical'],
    imageDescription: 'a wise mountain goat standing at a snowy peak, looking out over a vast valley under a starlit sky',
    rulingPlanet: 'Saturn',
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    symbol: '♒',
    emoji: '🏺',
    element: 'Air',
    modality: 'Fixed',
    dateRange: 'Jan 20 – Feb 18',
    startMonth: 1, startDay: 20,
    endMonth: 2,   endDay: 18,
    traits: ['independent', 'humanitarian', 'innovative', 'eccentric', 'idealistic'],
    imageDescription: 'a visionary water-bearer pouring cosmic light from an urn into a river of stars and circuit patterns',
    rulingPlanet: 'Uranus',
  },
  {
    id: 'pisces',
    name: 'Pisces',
    symbol: '♓',
    emoji: '🐟',
    element: 'Water',
    modality: 'Mutable',
    dateRange: 'Feb 19 – Mar 20',
    startMonth: 2, startDay: 19,
    endMonth: 3,   endDay: 20,
    traits: ['empathic', 'imaginative', 'spiritual', 'dreamy', 'compassionate'],
    imageDescription: 'two luminous fish swimming in opposite directions through an ocean of galaxies and aurora light',
    rulingPlanet: 'Neptune',
  },
];

export function getZodiacSign(month: number, day: number): ZodiacSign | null {
  for (const sign of ZODIAC_SIGNS) {
    if (sign.startMonth === sign.endMonth) {
      if (month === sign.startMonth && day >= sign.startDay && day <= sign.endDay) return sign;
    } else if (sign.startMonth > sign.endMonth) {
      // Wraps year (Capricorn: Dec 22 – Jan 19)
      if ((month === sign.startMonth && day >= sign.startDay) ||
          (month === sign.endMonth   && day <= sign.endDay)) return sign;
    } else {
      if ((month === sign.startMonth && day >= sign.startDay) ||
          (month >  sign.startMonth  && month < sign.endMonth) ||
          (month === sign.endMonth   && day <= sign.endDay)) return sign;
    }
  }
  return null;
}

export function getZodiacFromDate(dateStr: string): ZodiacSign | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  // Use UTC to avoid timezone-edge-day shifts
  return getZodiacSign(d.getUTCMonth() + 1, d.getUTCDate());
}

export const ELEMENT_COLORS: Record<string, string> = {
  Fire:  'from-orange-500 to-red-500',
  Earth: 'from-green-600 to-emerald-500',
  Air:   'from-sky-400 to-indigo-400',
  Water: 'from-blue-500 to-teal-400',
};

export const ELEMENT_BG: Record<string, string> = {
  Fire:  'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900',
  Earth: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
  Air:   'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900',
  Water: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
};
