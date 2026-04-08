// Nutrients tracked across the app (Smart Suggestions modal, Home screen, Profile)
export const TRACKED_NUTRIENT_KEYS = [
  'CALCIUM', 'CARBS', 'PROTEIN', 'VIT A', 'VIT C', 'VIT D', 'VIT E', 'VIT K',
  'VIT B6', 'FOLATE', 'VIT B12', 'IRON', 'MAGNEISUM', 'ZINC', 'POTASIUM',
  'SODIUM', 'FIBER', 'FAT',
];

// RDA fallback targets — used when a nutrient isn't in the user's DB profile
export const DEFAULT_NUTRIENT_TARGETS = [
  { nutrient_key: 'PROTEIN',   total_target_value: 50,    unit: 'g'   },
  { nutrient_key: 'CARBS',     total_target_value: 275,   unit: 'g'   },
  { nutrient_key: 'FAT',       total_target_value: 78,    unit: 'g'   },
  { nutrient_key: 'FIBER',     total_target_value: 28,    unit: 'g'   },
  { nutrient_key: 'CALCIUM',   total_target_value: 1300,  unit: 'mg'  },
  { nutrient_key: 'IRON',      total_target_value: 18,    unit: 'mg'  },
  { nutrient_key: 'MAGNEISUM', total_target_value: 420,   unit: 'mg'  },
  { nutrient_key: 'ZINC',      total_target_value: 11,    unit: 'mg'  },
  { nutrient_key: 'POTASIUM',  total_target_value: 4700,  unit: 'mg'  },
  { nutrient_key: 'SODIUM',    total_target_value: 2300,  unit: 'mg'  },
  { nutrient_key: 'VIT A',     total_target_value: 900,   unit: 'mcg' },
  { nutrient_key: 'VIT C',     total_target_value: 90,    unit: 'mg'  },
  { nutrient_key: 'VIT D',     total_target_value: 20,    unit: 'mcg' },
  { nutrient_key: 'VIT E',     total_target_value: 15,    unit: 'mg'  },
  { nutrient_key: 'VIT K',     total_target_value: 120,   unit: 'mcg' },
  { nutrient_key: 'VIT B6',    total_target_value: 1.7,   unit: 'mg'  },
  { nutrient_key: 'FOLATE',    total_target_value: 400,   unit: 'mcg' },
  { nutrient_key: 'VIT B12',   total_target_value: 2.4,   unit: 'mcg' },
];

export const filterTrackedNutrients = (summary) =>
  (summary || []).filter(item => TRACKED_NUTRIENT_KEYS.includes(item.nutrient_key));

// Merge profile targets with defaults — ensures all 18 tracked nutrients always appear
export const mergeWithDefaults = (summary) => {
  const filtered = filterTrackedNutrients(summary);
  const filteredKeys = new Set(filtered.map(item => item.nutrient_key));
  return [
    ...filtered,
    ...DEFAULT_NUTRIENT_TARGETS.filter(d => !filteredKeys.has(d.nutrient_key)),
  ];
};
