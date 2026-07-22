// Approximate placements of major parties on the app's two political axes:
//   economic: −100 egalitarian/left … +100 market/right
//   social:   −100 libertarian … +100 authoritarian
// These are rough, widely-recognised positions for an illustrative match — not an
// exact or official measurement, and deliberately even-handed in description.

export interface Party {
  name: string;
  economic: number;
  social: number;
  blurb: string;
}

export const PARTIES: Record<string, Party[]> = {
  'United States': [
    { name: 'Democratic Party', economic: -30, social: -12, blurb: 'The larger centre-left party — broadly supports an active government role in the economy and socially progressive policies.' },
    { name: 'Republican Party', economic: 45, social: 32, blurb: 'The larger centre-right party — broadly favours free markets, lower taxes, and more traditional social values.' },
    { name: 'Libertarian Party', economic: 55, social: -68, blurb: 'Prioritises individual liberty and minimal government in both economic and personal life.' },
    { name: 'Green Party', economic: -68, social: -38, blurb: 'Left-wing and ecological — emphasises redistribution, social justice, and civil liberties.' },
  ],
  'United Kingdom': [
    { name: 'Labour', economic: -35, social: -10, blurb: 'Centre-left — supports public services, workers’ rights, and a mixed economy.' },
    { name: 'Conservative Party', economic: 40, social: 25, blurb: 'Centre-right — favours free markets, lower taxes, and traditional institutions.' },
    { name: 'Liberal Democrats', economic: -5, social: -35, blurb: 'Centrist and socially liberal — pro-market with a strong civil-liberties emphasis.' },
    { name: 'Green Party', economic: -65, social: -35, blurb: 'Left-wing and ecological — redistribution, social justice, and civil liberties.' },
    { name: 'Reform UK', economic: 45, social: 55, blurb: 'Right-wing populist — free-market economics with a nationalist, socially conservative streak.' },
  ],
  'Canada': [
    { name: 'Liberal Party', economic: -22, social: -15, blurb: 'Centrist to centre-left — a mixed economy with socially progressive positions.' },
    { name: 'Conservative Party', economic: 40, social: 22, blurb: 'Centre-right — free markets, lower taxes, and more traditional social values.' },
    { name: 'New Democratic Party', economic: -55, social: -25, blurb: 'Left-wing — public services, labour, and redistribution.' },
    { name: 'Green Party', economic: -50, social: -35, blurb: 'Left-ecological — environment, social justice, and civil liberties.' },
    { name: 'People’s Party', economic: 55, social: 30, blurb: 'Right-wing populist — small-government economics with socially conservative positions.' },
  ],
  'Australia': [
    { name: 'Labor', economic: -30, social: -8, blurb: 'Centre-left — supports public services, workers, and a mixed economy.' },
    { name: 'Liberal Party', economic: 40, social: 25, blurb: 'Centre-right (despite the name) — free markets and more traditional values.' },
    { name: 'The Nationals', economic: 35, social: 42, blurb: 'Rural centre-right — agrarian and socially conservative, in Coalition with the Liberals.' },
    { name: 'The Greens', economic: -60, social: -38, blurb: 'Left-ecological — environment, redistribution, and civil liberties.' },
    { name: 'One Nation', economic: 35, social: 62, blurb: 'Right-wing populist — nationalist and socially conservative.' },
  ],
  'Germany': [
    { name: 'SPD', economic: -35, social: -10, blurb: 'Centre-left social democrats — the welfare state, workers’ rights, and a mixed economy.' },
    { name: 'CDU/CSU', economic: 30, social: 18, blurb: 'Centre-right Christian democrats — a market economy with a social dimension and traditional values.' },
    { name: 'Greens', economic: -35, social: -35, blurb: 'Left-ecological — environment, social justice, and civil liberties.' },
    { name: 'FDP', economic: 45, social: -35, blurb: 'Classical liberals — free markets paired with strong individual freedoms.' },
    { name: 'Die Linke', economic: -65, social: -20, blurb: 'Left-wing — redistribution, welfare, and anti-militarism.' },
    { name: 'AfD', economic: 35, social: 60, blurb: 'Right-wing populist — nationalist and socially conservative.' },
  ],
  'France': [
    { name: 'La France Insoumise', economic: -70, social: -25, blurb: 'Left-wing — redistribution, ecology, and social movements.' },
    { name: 'Parti Socialiste', economic: -35, social: -15, blurb: 'Centre-left social democrats — welfare and a mixed economy.' },
    { name: 'Renaissance', economic: 20, social: 0, blurb: 'Liberal centrists — pro-market and pro-EU with a centrist social stance.' },
    { name: 'Les Républicains', economic: 40, social: 25, blurb: 'Centre-right — free markets and traditional values.' },
    { name: 'Rassemblement National', economic: 5, social: 55, blurb: 'Right-wing populist — nationalist and socially conservative, with protectionist economics.' },
    { name: 'Les Écologistes', economic: -45, social: -35, blurb: 'Green — environment, social justice, and civil liberties.' },
  ],
  'Netherlands': [
    { name: 'VVD', economic: 45, social: -10, blurb: 'Centre-right liberals — free markets with a socially liberal streak.' },
    { name: 'GroenLinks-PvdA', economic: -45, social: -30, blurb: 'Left/green alliance — welfare, environment, and social justice.' },
    { name: 'D66', economic: 5, social: -45, blurb: 'Progressive liberals — pro-market and strongly socially liberal.' },
    { name: 'CDA', economic: 20, social: 20, blurb: 'Christian-democratic centre — a mixed economy and traditional values.' },
    { name: 'PVV', economic: 10, social: 60, blurb: 'Right-wing populist — nationalist and socially conservative.' },
    { name: 'SP', economic: -65, social: -10, blurb: 'Left-wing socialists — redistribution and public services.' },
  ],
  'Sweden': [
    { name: 'Social Democrats', economic: -40, social: -10, blurb: 'Centre-left — the welfare state and a mixed economy.' },
    { name: 'Moderate Party', economic: 40, social: 10, blurb: 'Centre-right — free markets and lower taxes.' },
    { name: 'Sweden Democrats', economic: 15, social: 55, blurb: 'Right-wing populist — nationalist and socially conservative.' },
    { name: 'Left Party', economic: -70, social: -25, blurb: 'Left-wing — redistribution, feminism, and welfare.' },
    { name: 'Centre Party', economic: 25, social: -20, blurb: 'Liberal centre — markets, rural interests, and social openness.' },
    { name: 'Green Party', economic: -40, social: -35, blurb: 'Green — environment and civil liberties.' },
  ],
  'Spain': [
    { name: 'PSOE', economic: -35, social: -15, blurb: 'Centre-left social democrats — welfare and a mixed economy.' },
    { name: 'Partido Popular', economic: 40, social: 25, blurb: 'Centre-right — free markets and traditional values.' },
    { name: 'Vox', economic: 45, social: 60, blurb: 'Right-wing populist — nationalist and socially conservative.' },
    { name: 'Sumar', economic: -60, social: -30, blurb: 'Left-wing — redistribution, social movements, and civil liberties.' },
  ],
};

export const PARTY_COUNTRIES = Object.keys(PARTIES);
