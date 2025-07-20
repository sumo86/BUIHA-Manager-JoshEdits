interface AbilityRange {
  min: number;
  max: number;
}

type DivisionRanges = {
  [star: string]: AbilityRange;
};

type FullRanges = {
  [divisionName: string]: DivisionRanges;
};

// Data transcribed from the user-provided CSV for skater abilities.
export const skaterAbilityRanges: FullRanges = {
  "Checking 1": {
    "5":   { min: 468, max: Infinity },
    "4.5": { min: 411, max: 467 },
    "4":   { min: 386, max: 410 },
    "3.5": { min: 366, max: 385 },
    "3":   { min: 346, max: 365 },
    "2.5": { min: 326, max: 345 },
    "2":   { min: 306, max: 325 },
    "1.5": { min: 296, max: 305 }, // Corrected from original CSV to ensure logical progression
    "1":   { min: 0,   max: 295 },
  },
  "Checking 2": {
    "5":   { min: 386, max: Infinity },
    "4.5": { min: 366, max: 385 },
    "4":   { min: 346, max: 365 },
    "3.5": { min: 326, max: 345 },
    "3":   { min: 306, max: 325 },
    "2.5": { min: 286, max: 305 },
    "2":   { min: 266, max: 285 },
    "1.5": { min: 246, max: 265 },
    "1":   { min: 0,   max: 245 },
  },
  "Non-Checking 1": {
    "5":   { min: 371, max: Infinity },
    "4.5": { min: 351, max: 370 },
    "4":   { min: 331, max: 350 },
    "3.5": { min: 311, max: 330 },
    "3":   { min: 291, max: 310 },
    "2.5": { min: 271, max: 290 },
    "2":   { min: 251, max: 270 },
    "1.5": { min: 231, max: 250 },
    "1":   { min: 0,   max: 230 },
  },
  "Non-Checking 2": {
    "5":   { min: 341, max: Infinity },
    "4.5": { min: 321, max: 340 },
    "4":   { min: 301, max: 320 },
    "3.5": { min: 281, max: 300 },
    "3":   { min: 261, max: 280 },
    "2.5": { min: 241, max: 260 },
    "2":   { min: 221, max: 240 },
    "1.5": { min: 201, max: 220 },
    "1":   { min: 0,   max: 200 },
  },
  "Non-Checking 3": {
    "5":   { min: 321, max: Infinity },
    "4.5": { min: 301, max: 320 },
    "4":   { min: 281, max: 300 },
    "3.5": { min: 261, max: 280 },
    "3":   { min: 241, max: 260 },
    "2.5": { min: 221, max: 240 },
    "2":   { min: 201, max: 220 },
    "1.5": { min: 181, max: 200 },
    "1":   { min: 0,   max: 180 },
  },
};

// Goalie ability ranges, scaled down from skater values (~46% ratio)
export const goalieAbilityRanges: FullRanges = {
  "Checking 1": {
    "5":   { min: 216, max: Infinity },
    "4.5": { min: 190, max: 215 },
    "4":   { min: 178, max: 189 },
    "3.5": { min: 169, max: 177 },
    "3":   { min: 160, max: 168 },
    "2.5": { min: 151, max: 159 },
    "2":   { min: 141, max: 150 },
    "1.5": { min: 137, max: 140 },
    "1":   { min: 0,   max: 136 },
  },
  "Checking 2": {
    "5":   { min: 178, max: Infinity },
    "4.5": { min: 169, max: 177 },
    "4":   { min: 160, max: 168 },
    "3.5": { min: 151, max: 159 },
    "3":   { min: 141, max: 150 },
    "2.5": { min: 132, max: 140 },
    "2":   { min: 123, max: 131 },
    "1.5": { min: 114, max: 122 },
    "1":   { min: 0,   max: 113 },
  },
  "Non-Checking 1": {
    "5":   { min: 171, max: Infinity },
    "4.5": { min: 162, max: 170 },
    "4":   { min: 153, max: 161 },
    "3.5": { min: 144, max: 152 },
    "3":   { min: 134, max: 143 },
    "2.5": { min: 125, max: 133 },
    "2":   { min: 116, max: 124 },
    "1.5": { min: 107, max: 115 },
    "1":   { min: 0,   max: 106 },
  },
  "Non-Checking 2": {
    "5":   { min: 157, max: Infinity },
    "4.5": { min: 148, max: 156 },
    "4":   { min: 139, max: 147 },
    "3.5": { min: 130, max: 138 },
    "3":   { min: 121, max: 129 },
    "2.5": { min: 111, max: 120 },
    "2":   { min: 102, max: 110 },
    "1.5": { min: 93,  max: 101 },
    "1":   { min: 0,   max: 92 },
  },
  "Non-Checking 3": {
    "5":   { min: 148, max: Infinity },
    "4.5": { min: 139, max: 147 },
    "4":   { min: 130, max: 138 },
    "3.5": { min: 121, max: 129 },
    "3":   { min: 111, max: 120 },
    "2.5": { min: 102, max: 110 },
    "2":   { min: 93,  max: 101 },
    "1.5": { min: 84,  max: 92 },
    "1":   { min: 0,   max: 83 },
  },
};

export const getPotentialAbilityRange = (leagueDivision: string, isSkater: boolean) => {
  const ranges = isSkater ? skaterAbilityRanges : goalieAbilityRanges;
  const divisionRanges = ranges[leagueDivision];
  if (!divisionRanges) {
    console.warn(`Potential ability ranges not found for division: ${leagueDivision}. Using default "Checking 2" ranges.`);
    const defaultRanges = isSkater ? skaterAbilityRanges["Checking 2"] : goalieAbilityRanges["Checking 2"];
    return { paMin: defaultRanges["1"].min, paMax: defaultRanges["5"].max === Infinity ? 500 : defaultRanges["5"].max };
  }

  const paMin = divisionRanges["1"].min;
  const paMax = divisionRanges["5"].max === Infinity ? 500 : divisionRanges["5"].max; // Cap Infinity for practical generation
  return { paMin, paMax };
};