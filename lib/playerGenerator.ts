import { v4 as uuidv4 } from 'uuid';
import { Player, Position, PlayerArchetype, SkaterAttributes, GoalieAttributes, FacilityProject } from "@/types";
import { archetypes } from "@/data/archetypes";
import { roles } from '@/data/roles';
import { getRandomNationality } from '@/data/nationalityDistributions'; // Correct import for nationality
import { nameData } from '@/data/names'; // Import nameData for firstNames and lastNames
import { getPotentialAbilityRange, skaterAbilityRanges, goalieAbilityRanges } from '@/data/abilityRanges'; // Correct imports for ability ranges

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomValueInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomGaussian = (mean: number, stdDev: number): number => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
};

const assignArchetype = (position: Position): PlayerArchetype => {
    const possibleArchetypes = archetypes.filter(a => {
        if (position === 'G') return a.position === 'Goaltender';
        if (['C', 'LW', 'RW'].includes(position)) return ['Centre', 'Winger'].includes(a.position);
        if (['LD', 'RD'].includes(position)) return a.position === 'Defenceman';
        return false;
    });
    return getRandomItem(possibleArchetypes);
};

const generateAttributes = (isSkater: boolean, potentialAbility: number): SkaterAttributes | GoalieAttributes => {
    // Adjust base to match the scale of abilityRanges (e.g., 0-500) to attributes (1-20)
    // If potentialAbility is 400, and we want average attribute to be 15, then 400 / X = 15 => X = 26.6
    const attributeScaleFactor = 26.6; // Derived from (Max CA in Checking 1 / Avg Max Attribute)
    const base = potentialAbility / attributeScaleFactor;
    const generateAttr = () => Math.max(1, Math.min(20, getRandomGaussian(base, 3)));

    if (isSkater) {
        return {
            acceleration: generateAttr(), agility: generateAttr(), balance: generateAttr(), fighting: generateAttr(),
            speed: generateAttr(), stamina: generateAttr(), strength: generateAttr(), hitting: generateAttr(),
            aggression: generateAttr(), bravery: generateAttr(), determination: generateAttr(), leadership: generateAttr(),
            professionalism: generateAttr(), teamPlayer: generateAttr(), temperament: generateAttr(), gettingOpen: generateAttr(),
            offensiveRead: generateAttr(), passing: generateAttr(), puckhandling: generateAttr(), screening: generateAttr(),
            shootingAccuracy: generateAttr(), shootingRange: generateAttr(), checking: generateAttr(), defensiveRead: generateAttr(),
            faceoffs: generateAttr(), positioning: generateAttr(), shotBlocking: generateAttr(), stickchecking: generateAttr(),
            aging: generateAttr(), ambition: generateAttr(), bigGames: generateAttr(), coachability: generateAttr(),
            controversy: generateAttr(), developmentRate: generateAttr(), greed: generateAttr(), handleFailure: generateAttr(),
            handleSuccess: generateAttr(), handleCritics: generateAttr(), injuryProneness: generateAttr(), intelligence: generateAttr(),
            loyalty: generateAttr(), mood: generateAttr(), sportsmanship: generateAttr(), passShootTendency: generateAttr(),
        };
    } else {
        return {
            blocker: generateAttr(), glove: generateAttr(), lowShots: generateAttr(), positioning: generateAttr(),
            rebound: generateAttr(), recovery: generateAttr(), reflexes: generateAttr(), passing: generateAttr(),
            pokeCheck: generateAttr(), puckhandling: generateAttr(), skating: generateAttr(), mentalToughness: generateAttr(),
            goaltenderStamina: generateAttr(), aging: generateAttr(), ambition: generateAttr(), bigGames: generateAttr(),
            coachability: generateAttr(), controversy: generateAttr(), developmentRate: generateAttr(), greed: generateAttr(),
            handleFailure: generateAttr(), handleSuccess: generateAttr(), handleCritics: generateAttr(), injuryProneness: generateAttr(),
            intelligence: generateAttr(), loyalty: generateAttr(), mood: generateAttr(), sportsmanship: generateAttr(),
            professionalism: generateAttr(), determination: generateAttr(), leadership: generateAttr(),
        };
    }
};

export const calculateCurrentAbility = (attributes: SkaterAttributes | GoalieAttributes, isSkater: boolean): number => {
    const attrs = Object.values(attributes);
    const sum = attrs.reduce((acc, val) => acc + (val || 0), 0);
    // Scale sum of attributes (1-20) to the ability range (0-500)
    // Assuming ~30-40 attributes, max sum ~600-800.
    // If max CA is 500, and max sum is 800, then scale by 500/800 = 0.625
    // Let's use a more direct scaling based on the number of attributes
    const numAttributes = attrs.length;
    const maxPossibleSum = numAttributes * 20; // Max value for each attribute is 20
    const targetMaxAbility = isSkater ? 500 : 250; // Approximate max from abilityRanges
    return (sum / maxPossibleSum) * targetMaxAbility;
};

export const calculateStarRating = (currentAbility: number, isSkater: boolean, leagueDivision: string): number => {
    const ranges = isSkater ? skaterAbilityRanges[leagueDivision] : goalieAbilityRanges[leagueDivision];
    if (!ranges) {
        console.warn(`Star rating ranges not found for division: ${leagueDivision}. Using default "Checking 2" ranges.`);
        const defaultRanges = isSkater ? skaterAbilityRanges["Checking 2"] : goalieAbilityRanges["Checking 2"];
        if (currentAbility >= defaultRanges["5"].min) return 5;
        if (currentAbility >= defaultRanges["4.5"].min) return 4.5;
        if (currentAbility >= defaultRanges["4"].min) return 4;
        if (currentAbility >= defaultRanges["3.5"].min) return 3.5;
        if (currentAbility >= defaultRanges["3"].min) return 3;
        if (currentAbility >= defaultRanges["2.5"].min) return 2.5;
        if (currentAbility >= defaultRanges["2"].min) return 2;
        if (currentAbility >= defaultRanges["1.5"].min) return 1.5;
        return 1;
    }

    // Check from highest star rating down
    if (currentAbility >= ranges["5"].min) return 5;
    if (currentAbility >= ranges["4.5"].min) return 4.5;
    if (currentAbility >= ranges["4"].min) return 4;
    if (currentAbility >= ranges["3.5"].min) return 3.5;
    if (currentAbility >= ranges["3"].min) return 3;
    if (currentAbility >= ranges["2.5"].min) return 2.5;
    if (currentAbility >= ranges["2"].min) return 2;
    if (currentAbility >= ranges["1.5"].min) return 1.5;
    return 1;
};

export const generatePlayer = (leagueDivision: string, existingTeamNames: string[], position?: Position): Player => {
    const isSkater = position !== 'G';
    const { paMin, paMax } = getPotentialAbilityRange(leagueDivision, isSkater); // Use new function
    const potentialAbility = getRandomValueInRange(paMin, paMax);
    const currentAbility = potentialAbility * (Math.random() * 0.3 + 0.6); // 60-90% of PA

    const playerPosition = position || getRandomItem(['C', 'LW', 'RW', 'LD', 'RD', 'G'] as Position[]);
    const nationalityName = getRandomNationality(); // Get nationality string
    const name = `${getRandomItem(nameData.firstNames[nationalityName] || nameData.firstNames.Other)} ${getRandomItem(nameData.lastNames[nationalityName] || nameData.lastNames.Other)}`;

    const attributes = generateAttributes(isSkater, potentialAbility);

    const player: Player = {
        id: uuidv4(),
        jerseyNumber: 0,
        name,
        age: getRandomValueInRange(18, 22),
        nationality: nationalityName, // Use nationality string
        positions: [playerPosition],
        starRating: calculateStarRating(currentAbility, isSkater, leagueDivision),
        morale: 'Content',
        healthStatus: 'Healthy',
        injury: null,
        eligibility: 'UG Year 1',
        archetype: assignArchetype(playerPosition),
        attributes,
        currentAbility,
        potentialAbility,
        role: undefined,
        roleSuitability: {},
        captaincy: null,
        history: [],
        trainingFocus: null,
        currentStats: [],
        activeInstructions: [],
    };

    return player;
};

export const generateRecruits = (leagueDivision: string, existingTeamNames: string[], count = 20, facilities: FacilityProject[] = []): Player[] => {
    const recruits: Player[] = [];
    for (let i = 0; i < count; i++) {
        const player = generatePlayer(leagueDivision, existingTeamNames);
        player.recruitmentCost = getRandomValueInRange(100, 1000);
        player.source = getRandomItem(['Local', 'International', 'Transfer']);
        player.estimatedQuality = getRandomItem(['Beginner', 'Moderate', 'Intermediate', 'Experienced', 'Elite']);
        recruits.push(player);
    }
    return recruits;
};

export const getGamesPlayedForDivision = (division: string): number => {
    if (division.includes("1")) return 20;
    if (division.includes("2")) return 16;
    if (division.includes("3")) return 12;
    return 16;
};