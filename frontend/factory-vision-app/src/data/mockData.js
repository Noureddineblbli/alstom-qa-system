export const PROJECTS = [
  { id: 'p1', name: 'Assembly Line A-12', location: 'Main Hall' },
  { id: 'p2', name: 'Chassis Welding B-04', location: 'Sector 4' },
  { id: 'p3', name: 'Electronics Mounting C-01', location: 'Clean Room' },
];

export const REFERENCES = [
  { 
    id: 'r1', 
    projectId: 'p1', 
    name: 'Standard Panel Type-R1', 
    expectedSpecs: ['Width: 120cm', 'Height: 80cm', '4x M8 Bolts', 'Logo Position: Center'] ,
    slots: [
      {"slot_id": "R1-S1",  "expected_calibre": "18",       "expected_identification": "14Q98",  "position_index": 1},
      {"slot_id": "R1-S2",  "expected_calibre": "5",       "expected_identification": "23Q01",  "position_index": 2},
      {"slot_id": "R1-S3",  "expected_calibre": "5",       "expected_identification": "23Q08",  "position_index": 3},
      {"slot_id": "R1-S4",  "expected_calibre": "5",       "expected_identification": "23Q07",  "position_index": 4},
      {"slot_id": "R1-S5",  "expected_calibre": "3",       "expected_identification": "23Q09",  "position_index": 5},
      {"slot_id": "R1-S6",  "expected_calibre": "3",       "expected_identification": "52Q24",  "position_index": 6},
      {"slot_id": "R1-S7",  "expected_calibre": "5",       "expected_identification": "52Q14",  "position_index": 7},
      {"slot_id": "R1-S8",  "expected_calibre": "5",       "expected_identification": "24Q04",  "position_index": 8},
      {"slot_id": "R1-S9",  "expected_calibre": "5",       "expected_identification": "24Q16",  "position_index": 9},
      {"slot_id": "R1-S10", "expected_calibre": "5",       "expected_identification": "24Q01",  "position_index": 10},
      {"slot_id": "R1-S11", "expected_calibre": "3",       "expected_identification": "25Q01",  "position_index": 11},
      {"slot_id": "R1-S12", "expected_calibre": "5",       "expected_identification": "25Q02",  "position_index": 12},
      {"slot_id": "R1-S13", "expected_calibre": "5",       "expected_identification": "25Q03",  "position_index": 13},
      {"slot_id": "R1-S14", "expected_calibre": "5",       "expected_identification": "25Q08",  "position_index": 14},
      {"slot_id": "R1-S15", "expected_calibre": "3",       "expected_identification": "25Q13",  "position_index": 15},
      {"slot_id": "R1-S16", "expected_calibre": "1",       "expected_identification": "26Q03",  "position_index": 16},
      {"slot_id": "R1-S17", "expected_calibre": "5",       "expected_identification": "31Q01",  "position_index": 17},
      {"slot_id": "R1-S18", "expected_calibre": "MISSING", "expected_identification": "SPARE",  "position_index": 18}
    ],
    updatedAt: '2026-05-05T10:00:00Z'
  },
  { 
    id: 'r2', 
    projectId: 'p2', 
    name: 'Precision Frame Type-R2', 
    expectedSpecs: ['Width: 120cm', 'Height: 80cm', '6x M10 Bolts', 'Logo Position: Top-Right'] ,
    slots: [
      {"slot_id": "R2-S1",  "expected_calibre": "10",       "expected_identification": "11Q03",  "position_index": 1},
      {"slot_id": "R2-S2",  "expected_calibre": "10",       "expected_identification": "31Q04",  "position_index": 2},
      {"slot_id": "R2-S3",  "expected_calibre": "5",       "expected_identification": "31Q05",  "position_index": 3},
      {"slot_id": "R2-S4",  "expected_calibre": "5",       "expected_identification": "41Q02",  "position_index": 4},
      {"slot_id": "R2-S5",  "expected_calibre": "16",      "expected_identification": "41Q01",  "position_index": 5},
      {"slot_id": "R2-S6",  "expected_calibre": "5",       "expected_identification": "41Q04",  "position_index": 6},
      {"slot_id": "R2-S7",  "expected_calibre": "5",       "expected_identification": "41Q05",  "position_index": 7},
      {"slot_id": "R2-S8",  "expected_calibre": "5",       "expected_identification": "41Q06",  "position_index": 8},
      {"slot_id": "R2-S9",  "expected_calibre": "5",       "expected_identification": "41Q07",  "position_index": 9},
      {"slot_id": "R2-S10", "expected_calibre": "5",       "expected_identification": "51Q01",  "position_index": 10},
      {"slot_id": "R2-S11", "expected_calibre": "5",       "expected_identification": "52Q10",  "position_index": 11},
      {"slot_id": "R2-S12", "expected_calibre": "5",       "expected_identification": "52Q13",  "position_index": 12},
      {"slot_id": "R2-S13", "expected_calibre": "5",       "expected_identification": "61Q01",  "position_index": 13},
      {"slot_id": "R2-S14", "expected_calibre": "5",       "expected_identification": "61Q02",  "position_index": 14},
      {"slot_id": "R2-S15", "expected_calibre": "5",       "expected_identification": "61Q03",  "position_index": 15},
      {"slot_id": "R2-S16", "expected_calibre": "5",       "expected_identification": "61Q04",  "position_index": 16},
      {"slot_id": "R2-S17", "expected_calibre": "8",       "expected_identification": "61Q05",  "position_index": 17},
      {"slot_id": "R2-S18", "expected_calibre": "5",       "expected_identification": "61Q12",  "position_index": 18}
    ],
    updatedAt: '2026-05-04T14:30:00Z'
  }
];

export const USERS = [
  { id: 'u1', name: 'Ahntate Ridouane', email: 'ahnrid@alstom.com', password: '123', role: 'Operator', lastActive: '2026-05-05T14:20:00Z' },
  { id: 'u2', name: 'Blibli Noureddine', email: 'blinou@alstom.com', password: 'd123', role: 'Operator', lastActive: '2026-05-05T15:10:00Z' },
  { id: 'u3', name: 'Allaoui Mohammed', email: 'allmoh@alstom.com', password: '123', role: 'Admin', lastActive: '2026-05-04T16:45:00Z' },
];
