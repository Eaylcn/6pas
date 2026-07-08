export interface Club {
  id: string;
  name: string;
  leagueId: string;
}

export const clubs: Club[] = [
  // Turkish Premier Circuit
  { id: 'ist-falcons', name: 'Istanbul Falcons', leagueId: 'tpc' },
  { id: 'ank-meridian', name: 'Ankara Meridian', leagueId: 'tpc' },
  { id: 'izm-marina', name: 'İzmir Marina', leagueId: 'tpc' },
  { id: 'trb-bordo', name: 'Trabzon Bordo', leagueId: 'tpc' },
  // Iberian Crown League
  { id: 'mad-crown', name: 'Madrid Crown', leagueId: 'icl' },
  { id: 'val-sol', name: 'Valencia Sol', leagueId: 'icl' },
  { id: 'sev-roja', name: 'Sevilla Roja', leagueId: 'icl' },
  // English Metro League
  { id: 'man-forge', name: 'Manchester Forge', leagueId: 'eml' },
  { id: 'lon-borough', name: 'London Borough', leagueId: 'eml' },
  { id: 'liv-docks', name: 'Liverpool Docks', leagueId: 'eml' },
  { id: 'lon-blues', name: 'London Blues', leagueId: 'eml' },
  { id: 'man-reds', name: 'Manchester Reds', leagueId: 'eml' },
  // Italian Elite Division
  { id: 'mil-vesta', name: 'Milano Vesta', leagueId: 'ied' },
  { id: 'rom-aurea', name: 'Roma Aurea', leagueId: 'ied' },
  { id: 'tor-nero', name: 'Torino Nero', leagueId: 'ied' },
  { id: 'mil-serpenti', name: 'Milano Serpenti', leagueId: 'ied' },
  { id: 'nap-vulcano', name: 'Napoli Vulcano', leagueId: 'ied' },
  // French Star League
  { id: 'par-etoile', name: 'Paris Étoile', leagueId: 'fsl' },
  { id: 'lyo-lumiere', name: 'Lyon Lumière', leagueId: 'fsl' },
  { id: 'mar-azur', name: 'Marseille Azur', leagueId: 'fsl' },
  // German Power League
  { id: 'mun-adler', name: 'Munich Adler', leagueId: 'gpl' },
  { id: 'dor-vale', name: 'Dortmund Vale', leagueId: 'gpl' },
  { id: 'lev-fabrik', name: 'Leverkusen Fabrik', leagueId: 'gpl' },
  // Dutch North League
  { id: 'ams-noord', name: 'Amsterdam Noord', leagueId: 'dnl' },
  { id: 'rot-haven', name: 'Rotterdam Haven', leagueId: 'dnl' },
  // Portuguese Coast League
  { id: 'por-mare', name: 'Porto Maré', leagueId: 'pcl' },
  { id: 'lis-azul', name: 'Lisboa Azul', leagueId: 'pcl' },
  { id: 'lis-leao', name: 'Lisboa Leão', leagueId: 'pcl' },
];

export function clubsOfLeague(leagueId: string): Club[] {
  return clubs.filter((c) => c.leagueId === leagueId);
}
