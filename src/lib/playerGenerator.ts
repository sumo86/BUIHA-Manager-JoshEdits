import { Player, SkaterAttributes, GoalieAttributes, Team, FacilityProject } from '@/types';
import { names } from '@/data/names';
import { skaterArchetypes, goalieArchetypes } from '@/data/archetypes';
import { getTierStats, getTierName } from '@/lib/leagueUtils';
import { v4 as uuidv4 } from 'uuid';
import { TierInfo } from '@/context/TeamContext';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getAbilityScore = (base: number, potential: number, isGoalie: boolean): number => {
    const range = isGoalie ? 15 : 25;
    return Math.max(1, Math.round(base + (Math.random() * range) - (range / 2) + (potential / 10)));
};

export const calculateCurrentAbility = (attributes: SkaterAttributes | GoalieAttributes, isGoalie: boolean): number => {
    let total = 0;
    let count = 0;
    if (isGoalie) {
        const goalieAttrs = attributes as GoalieAttributes;
        const weights = { angles: 2, breakaway: 2, glove: 3, blocker: 3, lowShots: 2, passing: 1, pokeCheck: 2, positioning: 3, recovery: 2, reflexes: 3, skating: 1, goaltenderStamina: 1 };
        for (const [attr, weight] of Object.entries(weights)) {
            total += (goalieAttrs[attr as keyof GoalieAttributes] as number) * weight;
            count += weight;
        }
    } else {
        const skaterAttrs = attributes as SkaterAttributes;
        const weights = {
            shootingAccuracy: 3, shootingRange: 2, passing: 2, puckControl: 2,
            speed: 2, acceleration: 2, agility: 2, balance: 1, stamina: 1, strength: 1, hitting: 1,
            offensiveRead: 3, defensiveRead: 3,
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

export const generatePlayer = (potentialAbility: number, isGoalie: boolean, leagueDivision: string, tierHierarchy: TierInfo[]): Omit<Player, 'id' | 'jerseyNumber' | 'team' | 'contract'> => {
    const firstName = getRandomItem(names).firstName;
    const lastName = getRandomItem(names).lastName;
    const age = Math.floor(Math.random() * 4) + 18;
    const eligibilityOptions: Player['eligibility'][] = ["UG Year 1", "UG Year 2", "UG Year 3", "UG Year 4", "Masters", "PhD"];
    const eligibility = getRandomItem(eligibilityOptions);

    const archetype = isGoalie ? getRandomItem(goalieArchetypes) : getRandomItem(skaterArchetypes);
    const attributes = { ...archetype.attributes };

    Object.keys(attributes).forEach(key => {
        const attrKey = key as keyof (SkaterAttributes | GoalieAttributes);
        (attributes[attrKey] as number) = getAbilityScore(attributes[attrKey] as number, potentialAbility, isGoalie);
    });

    const currentAbility = calculateCurrentAbility(attributes, isGoalie);
    const starRating = calculateStarRating(currentAbility, isGoalie, leagueDivision, tierHierarchy);

    const recruitmentCost = 50 + Math.floor(Math.pow(potentialAbility / 25, 2));

    return {
        id: uuidv4(),
        name: `${firstName} ${lastName}`,
        age,
        positions: isGoalie ? ['G'] : ['F'],
        attributes,
        potentialAbility,
        currentAbility,
        starRating,
        jerseyNumber: 0,
        eligibility,
        morale: 'Content',
        form: [],
        developmentHistory: [],
        trainingFocus: null,
        currentStats: [],
        history: [],
        recruitmentCost,
        healthStatus: 'Healthy',
        injury: null,
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