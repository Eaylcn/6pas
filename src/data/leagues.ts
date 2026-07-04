export interface League {
  id: string;
  name: string;
}

export const leagues: League[] = [
  { id: 'tpc', name: 'Turkish Premier Circuit' },
  { id: 'icl', name: 'Iberian Crown League' },
  { id: 'eml', name: 'English Metro League' },
  { id: 'ied', name: 'Italian Elite Division' },
  { id: 'fsl', name: 'French Star League' },
  { id: 'gpl', name: 'German Power League' },
  { id: 'dnl', name: 'Dutch North League' },
  { id: 'pcl', name: 'Portuguese Coast League' },
];
