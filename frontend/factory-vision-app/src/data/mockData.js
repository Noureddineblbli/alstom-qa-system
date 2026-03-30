export const PROJECTS = [
  { id: 'p1', name: 'Assembly Line A-12', location: 'Main Hall' },
  { id: 'p2', name: 'Chassis Welding B-04', location: 'Sector 4' },
  { id: 'p3', name: 'Electronics Mounting C-01', location: 'Clean Room' },
];

export const REFERENCES = [
  { 
    id: 'r1', 
    projectId: 'p1', 
    name: 'Standard Panel v2.4', 
    expectedSpecs: ['Width: 120cm', 'Height: 80cm', '4x M8 Bolts', 'Logo Position: Center'] 
  },
  { 
    id: 'r2', 
    projectId: 'p1', 
    name: 'Reinforced Panel v1.1', 
    expectedSpecs: ['Width: 120cm', 'Height: 80cm', '6x M10 Bolts', 'Logo Position: Top-Right'] 
  },
  { 
    id: 'r3', 
    projectId: 'p2', 
    name: 'Chassis Frame Type-X', 
    expectedSpecs: ['Length: 450cm', 'Width: 180cm', 'Weld Points: 42'] 
  },
];
