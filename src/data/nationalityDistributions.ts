import { nameData } from './names';

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Based on BUIHA distribution:
// UK (44.1) + England (18.5) + Scotland (2.1) + Wales (1.5) = 66.2%
// Other (15.4%) is broken down into Euro/Asian/African/LatAm
const nationalityGroups = {
    British: 66.2,
    Canadian: 8.1,
    American: 5.9,
    European: 7.0,
    Asian: 4.0,
    African: 2.0,
    LatinAmerican: 2.4,
};

const specificNationalities = {
    British: ["British"],
    Canadian: ["Canadian"],
    American: ["American"],
    European: ["German", "French", "Czech", "Slovak", "Swedish", "Finnish", "Latvian", "Swiss"],
    Asian: ["Chinese", "Japanese", "Korean", "Indian", "Vietnamese"],
    African: ["Nigerian", "Ghanaian", "Kenyan", "South African"],
    LatinAmerican: ["Mexican", "Brazilian", "Argentinian", "Colombian"],
};

// Create a weighted array for efficient random selection
const weightedNationalities: string[] = [];
for (const group in nationalityGroups) {
    const weight = nationalityGroups[group as keyof typeof nationalityGroups];
    // Multiply by 10 to get a reasonable integer weight
    const numEntries = Math.round(weight * 10); 
    for (let i = 0; i < numEntries; i++) {
        weightedNationalities.push(group);
    }
}

export const getRandomNationality = (): keyof typeof nameData => {
    const randomGroup = getRandomItem(weightedNationalities) as keyof typeof specificNationalities;
    const specificList = specificNationalities[randomGroup];
    return getRandomItem(specificList) as keyof typeof nameData;
};