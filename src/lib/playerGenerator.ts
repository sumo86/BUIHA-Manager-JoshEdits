import { Player, Position, PlayerArchetype, SkaterAttributes, GoalieAttributes, PlayerSeasonStats } from "@/types";
import { archetypes } from "@/data/archetypes";
import { roles } from "@/data/roles";
import { teams as allTeamsData } from "@/data/teams";
import { getRandomNationality } from "@/data/nationalityDistributions";
import { getRandomNameForNationality } from "@/data/names";
import { getDivisionBaseName, getAbilityThresholds, starRatingDistribution, calculateStarRating } from "./leagueUtils";

const eligibilities: Player['eligibility'][] = ["UG Year 1", "UG Year 2", "UG Year 3", "UG Year 4", "Masters", "PhD", "Staff"];
const skaterPositions: Position[] = ["C", "LW", "RW", "LD", "RD"];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomValueInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getArchetypeForPosition = (position: Position): PlayerArchetype => {
    let positionGroup: PlayerArchetype['position'];
    if (['LD', 'RD'].includes(position)) positionGroup = 'Defenceman';
    else if (position === 'C') positionGroup = 'Centre';
    else if (['LW', 'RW'].includes(position)) positionGroup = 'Winger';
    else positionGroup = 'Goaltender';

    const possibleArchetypes = archetypes.filter(a => a.position === positionGroup);
    return getRandomItem(possibleArchetypes);
};

const visibleSkaterKeys: (keyof SkaterAttributes)[] = ['acceleration', 'agility', 'balance', 'fighting', 'speed', 'stamina', 'strength', 'hitting', 'aggression', 'bravery', 'determination', 'leadership', 'professionalism', 'teamPlayer', 'temperament', 'gettingOpen', 'offensiveRead', 'passing', 'puckhandling', 'screening', 'shootingAccuracy', 'shootingRange', 'checking', 'defensiveRead', 'faceoffs', 'positioning', 'shotBlocking', 'stickchecking'];
const visibleGoalieKeys: (keyof GoalieAttributes)[] = ['blocker', 'glove', 'lowShots', 'positioning', 'rebound', 'recovery', 'reflexes', 'passing', 'pokeCheck', 'puckhandling', 'skating', 'mentalToughness', 'goaltenderStamina'];

export const calculateCurrentAbility = (attributes: SkaterAttributes | GoalieAttributes, isSkater: boolean): number => {
    const keys = isSkater ? visibleSkaterKeys : visibleGoalieKeys;
    return keys.reduce((sum, key) => sum + (attributes as any)[key], 0);
};

const generateAttributesForAbility = (targetAbility: number, archetype: PlayerArchetype, isSkater: boolean): SkaterAttributes | GoalieAttributes => {
    const clamp = (value: number) => Math.max(1, Math.min(20, Math.round(value)));
    const keys = isSkater ? visibleSkaterKeys : visibleGoalieKeys;
    const baseAttrs: any = {};
    keys.forEach(key => baseAttrs[key] = 1);

    let attributes = baseAttrs as SkaterAttributes | GoalieAttributes;

    // Distribute points
    let pointsToDistribute = targetAbility - keys.length;
    while (pointsToDistribute > 0) {
        const keyToIncrement = getRandomItem(keys);
        if ((attributes as any)[keyToIncrement] < 20) {
            (attributes as any)[keyToIncrement]++;
            pointsToDistribute--;
        }
    }

    // Generate hidden attributes separately
    const hiddenKeys = isSkater ? 
        ['aging', 'ambition', 'bigGames', 'coachability', 'controversy', 'developmentRate', 'greed', 'handleFailure', 'handleSuccess', 'handleCritics', 'injuryProneness', 'intelligence', 'loyalty', 'mood', 'passShootTendency', 'sportsmanship'] :
        ['aging', 'ambition', 'bigGames', 'coachability', 'controversy', 'developmentRate', 'greed', 'handleFailure', 'handleSuccess', 'handleCritics', 'injuryProneness', 'intelligence', 'leadership', 'loyalty', 'mood', 'professionalism', 'sportsmanship', 'determination'];
    
    hiddenKeys.forEach(key => (attributes as any)[key] = getRandomValueInRange(1, 20));

    // Clamp all attributes to be safe
    Object.keys(attributes).forEach(key => {
        (attributes as any)[key] = clamp((attributes as any)[key]);
    });

    return attributes;
};

const calculateRoleSuitability = (attributes: SkaterAttributes, playerPosition: 'Forward' | 'Defenceman'): { suitabilities: { [key: string]: number }, bestRole: string, highestSuitability: number } => {
    const suitabilities: { [key: string]: number } = {};
    let bestRole = '';
    let highestSuitability = -1;

    const applicableRoles = roles.filter(r => r.positions.includes(playerPosition));

    applicableRoles.forEach(role => {
        const totalAttributeValue = role.keyAttributes.reduce((sum, attr) => {
            return sum + attributes[attr];
        }, 0);

        const maxPossibleValue = role.keyAttributes.length * 20;
        const normalizedSuitability = (totalAttributeValue / maxPossibleValue) * 19 + 1;
        const finalSuitability = Math.round(Math.min(20, Math.max(1, normalizedSuitability)));

        suitabilities[role.name] = finalSuitability;

        if (finalSuitability > highestSuitability) {
            highestSuitability = finalSuitability;
            bestRole = role.name;
        }
    });

    return { suitabilities, bestRole, highestSuitability };
};

const eligibilityAgeRanges: Record<Player['eligibility'], { min: number, max: number }> = {
    "UG Year 1": { min: 18, max: 19 }, "UG Year 2": { min: 19, max: 20 },
    "UG Year 3": { min: 20, max: 21 }, "UG Year 4": { min: 21, max: 22 },
    "Masters": { min: 22, max: 24 }, "PhD": { min: 23, max: 28 }, "Staff": { min: 25, max: 40 },
};

const generatePlayer = (
    usedJerseyNumbers: Set<number>, 
    position: Position, 
    leagueDivision: string, 
    teamName: string, 
    targetStarRating: number,
    allowedEligibilities?: Player['eligibility'][]
): Player => {
    let jerseyNumber: number;
    do { jerseyNumber = getRandomValueInRange(1, 98); } while (usedJerseyNumbers.has(jerseyNumber));
    usedJerseyNumbers.add(jerseyNumber);

    const isSkater = position !== 'G';
    const thresholds = getAbilityThresholds(isSkater, leagueDivision);
    const { min, max } = thresholds[targetStarRating];
    const currentAbility = getRandomValueInRange(min, max);

    const archetype = getArchetypeForPosition(position);
    const attributes = generateAttributesForAbility(currentAbility, archetype, isSkater);

    const eligibilitiesToUse = allowedEligibilities || eligibilities;
    const eligibility = getRandomItem(eligibilitiesToUse);
    const ageRange = eligibilityAgeRanges[eligibility];
    const age = getRandomValueInRange(ageRange.min, ageRange.max);

    let potentialBonus = isSkater ? Math.floor(Math.random() * 100) * ((30 - age) / 12) : Math.floor(Math.random() * 50) * ((30 - age) / 12);
    let potentialAbility = Math.round(currentAbility + potentialBonus);
    const maxAbility = isSkater ? 560 : 260;
    if (potentialAbility > maxAbility) potentialAbility = maxAbility;
    if (potentialAbility < currentAbility) potentialAbility = currentAbility;

    let role: string | undefined;
    let roleSuitability: { [key: string]: number } = {};
    if (isSkater) {
        const { suitabilities, bestRole } = calculateRoleSuitability(attributes as SkaterAttributes, position.includes('D') ? 'Defenceman' : 'Forward');
        roleSuitability = suitabilities;
        role = bestRole;
    }

    const gender = Math.random() < 0.8 ? 'Male' : 'Female';
    const nationality = getRandomNationality(teamName);
    const name = getRandomNameForNationality(nationality, gender);

    return {
        id: crypto.randomUUID(), jerseyNumber, name, age, nationality,
        positions: [position], starRating: targetStarRating, morale: "Content", healthStatus: "Healthy",
        eligibility, archetype, attributes, currentAbility, potentialAbility, role, roleSuitability,
        captaincy: null, yearsLeftInProgram: undefined, history: [], trainingFocus: null,
        currentStats: { gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0, wins: 0, losses: 0, draws: 0, goalsAgainst: 0, shotsAgainst: 0, saves: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0 },
    };
};

const assignInitialCaptaincy = (roster: Player[]): Player[] => {
    const skaters = roster.filter(p => p.positions[0] !== 'G');
    if (skaters.length < 3) return roster;
    const captain = skaters.sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership)[0];
    if (captain) captain.captaincy = 'C';
    const alternates = skaters.filter(p => p.id !== captain?.id).slice(0, 2);
    alternates.forEach(alt => alt.captaincy = 'A');
    return roster;
};

export const generateRoster = (leagueDivision: string, teamName: string): Player[] => {
    const roster: Player[] = [];
    const usedJerseyNumbers = new Set<number>();
    const baseName = getDivisionBaseName(leagueDivision);
    const distribution = starRatingDistribution[baseName];

    const rosterComposition = [
        { pos: 'G', count: 2 }, { pos: 'LD', count: 4 }, { pos: 'RD', count: 4 },
        { pos: 'C', count: 5 }, { pos: 'LW', count: 5 }, { pos: 'RW', count: 5 },
    ];
    const rosterSize = rosterComposition.reduce((sum, p) => sum + p.count, 0);

    const starRatingPool: number[] = [];
    let totalPercentage = 0;
    for (const [star, range] of Object.entries(distribution)) {
        const percentage = (range.min + range.max) / 2 / 100;
        totalPercentage += percentage;
        const count = Math.round(rosterSize * percentage);
        for (let i = 0; i < count; i++) {
            starRatingPool.push(parseFloat(star));
        }
    }
    // Adjust pool to match roster size exactly, adding/removing average players
    while (starRatingPool.length < rosterSize) starRatingPool.push(3.0);
    while (starRatingPool.length > rosterSize) starRatingPool.splice(Math.floor(Math.random() * starRatingPool.length), 1);

    rosterComposition.forEach(comp => {
        for (let i = 0; i < comp.count; i++) {
            const poolIndex = Math.floor(Math.random() * starRatingPool.length);
            const targetStarRating = starRatingPool.splice(poolIndex, 1)[0];
            roster.push(generatePlayer(usedJerseyNumbers, comp.pos as Position, leagueDivision, teamName, targetStarRating));
        }
    });

    return assignInitialCaptaincy(roster).sort((a, b) => a.jerseyNumber - b.jerseyNumber);
};

export const generateRecruits = (userLeagueDivision: string, allTeamNames: string[]): Player[] => {
    const recruits: Player[] = [];
    const usedJerseyNumbers = new Set<number>();
    const numRecruits = 30 + Math.floor(Math.random() * 21);
    const teamDivisionMap = new Map(allTeamsData.map(team => [team.name, team.leagueDivision]));

    for (let i = 0; i < numRecruits; i++) {
        const qualityRoll = Math.random();
        let estimatedQuality: Player['estimatedQuality'];
        let targetStarRange: {min: number, max: number};

        if (qualityRoll < 0.49) { estimatedQuality = 'Beginner'; targetStarRange = {min: 1, max: 2}; } 
        else if (qualityRoll < 0.79) { estimatedQuality = 'Moderate'; targetStarRange = {min: 2, max: 3}; } 
        else if (qualityRoll < 0.94) { estimatedQuality = 'Intermediate'; targetStarRange = {min: 3, max: 4}; } 
        else if (qualityRoll < 0.98) { estimatedQuality = 'Experienced'; targetStarRange = {min: 4, max: 4.5}; } 
        else { estimatedQuality = 'Elite'; targetStarRange = {min: 4.5, max: 5}; }
        
        const allPossiblePositions: Position[] = [...skaterPositions, 'G'];
        const position = getRandomItem(allPossiblePositions);
        const starOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].filter(s => s >= targetStarRange.min && s <= targetStarRange.max);
        const targetStarRating = getRandomItem(starOptions);

        const player = generatePlayer(usedJerseyNumbers, position, userLeagueDivision, "Unattached", targetStarRating, ["UG Year 1"]);
        
        player.estimatedQuality = estimatedQuality;
        player.recruitmentCost = (targetStarRating * 100) + getRandomValueInRange(-50, 50);
        player.starRating = calculateStarRating(player.currentAbility, player.positions[0] !== 'G', userLeagueDivision);

        recruits.push(player);
    }
    return recruits;
};