import { nameData } from './names';

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Based on BUIHA distribution:
// Combined UK nations = 66.2%
const nationalityGroups = {
    English: 60.0,
    Scottish: 3.0,
    Welsh: 2.2,
    NorthernIrish: 1.0,
    Canadian: 8.1,
    American: 5.9,
    European: 7.0,
    Asian: 4.0,
    African: 2.0,
    LatinAmerican: 2.4,
};

const specificNationalities = {
    English: ["English"],
    Scottish: ["Scottish"],
    Welsh: ["Welsh"],
    NorthernIrish: ["Northern Irish"],
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

const scottishTeams = ["St Andrews Typhoons", "Edinburgh Eagles", "Glasgow Stags"];

export const getRandomNationality = (teamName?: string): keyof typeof nameData => {
    const randomGroup = getRandomItem(weightedNationalities) as keyof typeof specificNationalities;
    
    // Apply Scottish bias if it's a Scottish team and a UK group was initially selected
    if (teamName && scottishTeams.includes(teamName) && 
        ['English', 'Scottish', 'Welsh', 'NorthernIrish'].includes(randomGroup)) {
        
        const roll = Math.random();
        // 75% chance for UK-born players to be Scottish for these teams
        if (roll < 0.75) { 
            return "Scottish";
        }
    }

    const specificList = specificNationalities[randomGroup];
    return getRandomItem(specificList) as keyof typeof nameData;
};