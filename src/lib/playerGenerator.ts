import { Player, SkaterAttributes, GoalieAttributes, Team, FacilityProject } from '@/types';
import { getRandomNameForNationality } from '@/data/names'; // Corrected import for names
import { archetypes } from '@/data/archetypes'; // Corrected import for archetypes
import { getTierStats, getTierName } from '@/lib/leagueUtils';
import { v4 as uuidv4 } from 'uuid';
import { TierInfo } from '@/context/TeamContext';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Filter archetypes once
const skaterArchetypes = archetypes.filter(a => a.position !== 'Goaltender');
const goalieArchetypes = archetypes.filter(a => a.position === 'Goaltender');

const getAbilityScore = (base: number, potential: number, isGoalie: boolean): number => {
    const range = isGoalie ? 15 : 25;
    return Math.max(1, Math.round(base + (Math.random() * range) - (range / 2) + (potential / 10)));
};

export const calculateCurrentAbility = (attributes: SkaterAttributes | GoalieAttributes, isGoalie: boolean): number => {
    let total = 0;
    let count = 0;
    if (isGoalie) {
        const goalieAttrs = attributes as GoalieAttributes;
        const weights = { blocker: 3, glove: 3, lowShots: 2, positioning: 3, rebound: 2, recovery: 2, reflexes: 3, passing: 1, pokeCheck: 1, puckhandling: 1, skating: 1, mentalToughness: 1, goaltenderStamina: 1 };
        for (const [attr, weight] of Object.entries(weights)) {
            total += (goalieAttrs[attr as keyof GoalieAttributes] as number) * weight;
            count += weight;
        }
    } else {
        const skaterAttrs = attributes as SkaterAttributes;
        const weights = {
            shootingAccuracy: 3, shootingRange: 2, passing: 2, puckhandling: 2,
            speed: 2, acceleration: 2, agility: 2, balance: 1, stamina: 1, strength: 1, hitting: 1,
            offensiveRead: 3, defensiveRead: 3,
            aggression: 1, bravery: 1, checking: 1, faceoffs: 1, gettingOpen: 1, positioning: 1, screening: 1, shotBlocking: 1, stickchecking: 1,
        };
        for (const [attr, weight] of Object.entries(weights)) {
            total += (skaterAttrs[attr as keyof SkaterAttributes] as number) * weight;
            count += weight;
        }
    }
    return Math.round((total / count) * 10);
};

export const calculateStarRating = (ability: number, isSkater: boolean, leagueDivision: string, tierHierarchy: TierInfo[]): number => {
    const tierStats = getTierStats(leagueDivision, tierHierarchy);
    const baseAbility = isSkater ? tierStats.skater : tierStats.goalie;
    const step = isSkater ? tierStats.step.skater : tierStats.step.goalie;

    const diff = ability - baseAbility;
    let stars = 3.0 + (diff / step);

    return Math.max(0.5, Math.min(5.0, Math.round(stars * 2) / 2));
};

export const generatePlayer = (potentialAbility: number, isGoalie: boolean, leagueDivision: string, tierHierarchy: TierInfo[]): Player => {
    const nationality = 'English'; // Default nationality
    const fullName = getRandomNameForNationality(nationality, Math.random() < 0.5 ? 'Male' : 'Female');
    const [firstName, lastName] = fullName.split(' ');

    const age = Math.floor(Math.random() * 4) + 18;
    const eligibilityOptions: Player['eligibility'][] = ["UG Year 1", "UG Year 2", "UG Year 3", "UG Year 4", "Masters", "PhD"];
    const eligibility = getRandomItem(eligibilityOptions);

    const archetype = isGoalie ? getRandomItem(goalieArchetypes) : getRandomItem(skaterArchetypes);
    
    const initialAttributes: SkaterAttributes | GoalieAttributes = isGoalie ? {
        blocker: 10, glove: 10, lowShots: 10, positioning: 10, rebound: 10, recovery: 10, reflexes: 10,
        passing: 10, pokeCheck: 10, puckhandling: 10, skating: 10, mentalToughness: 10, goaltenderStamina: 10,
        aging: 10, ambition: 10, bigGames: 10, coachability: 10, controversy: 10, developmentRate: 10,
        greed: 10, handleFailure: 10, handleSuccess: 10, handleCritics: 10, injuryProneness: 10,
        intelligence: 10, loyalty: 10, mood: 10, sportsmanship: 10, professionalism: 10, determination: 10, leadership: 10,
    } : {
        acceleration: 10, agility: 10, balance: 10, fighting: 10, speed: 10, stamina: 10, strength: 10,
        hitting: 10, aggression: 10, bravery: 10, determination: 10, leadership: 10, professionalism: 10,
        teamPlayer: 10, temperament: 10, gettingOpen: 10, offensiveRead: 10, passing: 10,
        puckhandling: 10, screening: 10, shootingAccuracy: 10, shootingRange: 10, checking: 10,
        defensiveRead: 10, faceoffs: 10, positioning: 10, shotBlocking: 10, stickchecking: 10,
        aging: 10, ambition: 10, bigGames: 10, coachability: 10, controversy: 10, developmentRate: 10,
        greed: 10, handleFailure: 10, handleSuccess: 10, handleCritics: 10, injuryProneness: 10,
        intelligence: 10, loyalty: 10, mood: 10, sportsmanship: 10, passShootTendency: 10,
    };

    const attributes = { ...initialAttributes };

    Object.keys(attributes).forEach(key => {
        const attrKey = key as keyof (SkaterAttributes | GoalieAttributes);
        if (typeof attributes[attrKey] === 'number') {
            (attributes[attrKey] as number) = getAbilityScore(attributes[attrKey] as number, potentialAbility, isGoalie);
        }
    });

    const currentAbility = calculateCurrentAbility(attributes, isGoalie);
    const starRating = calculateStarRating(currentAbility, isGoalie, leagueDivision, tierHierarchy);

    const recruitmentCost = 50 + Math.floor(Math.pow(potentialAbility / 25, 2));

    return {
        id: uuidv4(),
        name: `${firstName} ${lastName}`,
        age,
        nationality, // Added missing property
        positions: isGoalie ? ['G'] : ['C'],
        archetype: archetype,
        attributes,
        potentialAbility,
        currentAbility,
        starRating,
        jerseyNumber: 0,
        eligibility,
        morale: 'Content',
        healthStatus: 'Healthy',
        injury: null,
        role: undefined,
        roleSuitability: {},
        captaincy: null,
        yearsLeftInProgram: undefined,
        history: [],
        trainingFocus: null,
        currentStats: [],
        activeInstructions: [], // Added missing property
        source: 'Local',
        estimatedQuality: undefined,
        recruitmentCost,
        alumniStatus: undefined,
        isContinuingEducation: undefined,
        continuingEducationStartSeason: undefined,
    };
};

export const generateRecruits = (leagueDivision: string, existingTeamNames: string[], count = 30, facilities: FacilityProject[], tierHierarchy: TierInfo[]): Player[] => {
    const recruits: Player[] = [];
    const tierName = getTierName(leagueDivision);
    const hasScoutingDept = facilities.some(f => f.id === 'scouting_dept_1' && f.status === 'Completed');
    const potentialAbilityRanges = {
        "Checking 1": { min: 100, max: 180 },
        "Checking 2": { min: 80, max: 160 },
        "Non-Checking 1": { min: 70, max: 150 },
        "Non-Checking 2": { min: 60, max: 130 },
        "Non-Checking 3": { min: 50, max: 120 },
    };
    const range = potentialAbilityRanges[tierName as keyof typeof potentialAbilityRanges] || { min: 40, max: 110 };
    
    for (let i = 0; i < count; i++) {
        let potentialAbility = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        if (hasScoutingDept) {
            potentialAbility = Math.min(200, potentialAbility * 1.1);
        }
        const isGoalie = Math.random() < 0.15;
        recruits.push(generatePlayer(potentialAbility, isGoalie, leagueDivision, tierHierarchy));
    }
    return recruits;
};

export const getGamesPlayedForDivision = (leagueDivision: string): number => {
    const tierName = getTierName(leagueDivision);
    if (tierName.startsWith("Checking")) return 16;
    return 12;
};

export const generateRoster = (leagueDivision: string, tierHierarchy: TierInfo[]): Player[] => {
    const roster: Player[] = [];
    const numSkaters = 18;
    const numGoalies = 3;

    for (let i = 0; i < numSkaters; i++) {
        roster.push(generatePlayer(Math.floor(Math.random() * 100) + 50, false, leagueDivision, tierHierarchy));
    }
    for (let i = 0; i < numGoalies; i++) {
        roster.push(generatePlayer(Math.floor(Math.random() * 100) + 50, true, leagueDivision, tierHierarchy));
    }
    return roster;
};