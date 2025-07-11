import { Player, Position, PlayerArchetype, SkaterAttributes, GoalieAttributes, PlayerSeasonStats } from "@/types";
import { archetypes } from "@/data/archetypes";
import { roles } from "@/data/roles";
import { teams as allTeamsData } from "@/data/teams";
import { getRandomNationality } from "@/data/nationalityDistributions";
import { getRandomNameForNationality } from "@/data/names";
import { getTierStats, divisionTierStats } from "./leagueUtils";
import { starRatingDistribution } from "@/data/starRatingDistribution";
import { skaterAbilityRanges, goalieAbilityRanges } from "@/data/abilityRanges";

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

const generateAttributesForAbility = (archetype: PlayerArchetype, targetAbility: number, isSkater: boolean): SkaterAttributes | GoalieAttributes => {
    const clamp = (value: number) => Math.max(1, Math.min(20, Math.round(value)));
    const visibleKeys = isSkater ? visibleSkaterKeys : visibleGoalieKeys;

    const baseAvg = targetAbility / visibleKeys.length;
    const attributes = {} as any;
    visibleKeys.forEach(key => {
        attributes[key] = baseAvg + (Math.random() * 4 - 2);
    });

    if (isSkater) {
        const attrs = attributes as SkaterAttributes;
        if (archetype.type.includes('Offensive')) { attrs.offensiveRead += 5; attrs.puckhandling += 3; attrs.shootingAccuracy += 4; }
        if (archetype.type.includes('Playmaker')) { attrs.passing += 6; attrs.offensiveRead += 4; }
        if (archetype.type.includes('Goalscorer')) { attrs.shootingAccuracy += 6; attrs.shootingRange += 4; attrs.gettingOpen += 5; }
        if (archetype.type.includes('Two-Way')) { attrs.defensiveRead += 4; attrs.positioning += 4; attrs.stickchecking += 3; attrs.offensiveRead += 2; }
        if (archetype.type.includes('Defensive') || archetype.type.includes('Checking')) { attrs.defensiveRead += 6; attrs.positioning += 5; attrs.stickchecking += 5; attrs.checking += 4; attrs.shotBlocking += 4; attrs.hitting += 3; }
        if (archetype.type === 'Enforcer') { attrs.fighting += 10; attrs.aggression += 8; attrs.bravery += 6; attrs.hitting += 8; attrs.strength += 5; attrs.passing -= 5; attrs.puckhandling -= 5; attrs.shootingAccuracy -= 5; attrs.offensiveRead -= 6; }
        if (archetype.physicality === 'Physical') { attrs.strength += 5; attrs.hitting += 4; attrs.balance += 3; attrs.aggression += 3; } 
        else if (archetype.physicality === 'Non-Physical') { attrs.strength -= 3; attrs.hitting -= 4; attrs.aggression -= 4; attrs.fighting -= 5; }
    } else {
        const attrs = attributes as GoalieAttributes;
        if (archetype.type === 'Standup') { attrs.positioning += 3; attrs.recovery -= 2; } 
        else if (archetype.type === 'Butterfly') { attrs.lowShots += 4; attrs.recovery += 2; attrs.positioning -= 2; }
        if (archetype.physicality === 'Puckhandler') { attrs.puckhandling += 8; attrs.passing += 6; }
    }

    visibleKeys.forEach(key => { attributes[key] = clamp(attributes[key]); });

    let currentAbility = visibleKeys.reduce((sum, key) => sum + attributes[key], 0);
    let diff = Math.round(targetAbility - currentAbility);
    
    let attempts = 0;
    while (diff !== 0 && attempts < 1000) {
        if (diff > 0) {
            const keyToImprove = getRandomItem(visibleKeys.filter(k => attributes[k] < 20));
            if (keyToImprove) {
                attributes[keyToImprove]++;
                diff--;
            } else break;
        } else {
            const keyToNerf = getRandomItem(visibleKeys.filter(k => attributes[k] > 1));
            if (keyToNerf) {
                attributes[keyToNerf]--;
                diff++;
            } else break;
        }
        attempts++;
    }

    const generateHiddenAttribute = () => Math.floor(Math.random() * 20) + 1;
    if (isSkater) {
        const hiddenAttrs: Partial<SkaterAttributes> = { aging: generateHiddenAttribute(), ambition: generateHiddenAttribute(), bigGames: generateHiddenAttribute(), coachability: generateHiddenAttribute(), controversy: generateHiddenAttribute(), developmentRate: generateHiddenAttribute(), greed: generateHiddenAttribute(), handleFailure: generateHiddenAttribute(), handleSuccess: generateHiddenAttribute(), handleCritics: generateHiddenAttribute(), injuryProneness: generateHiddenAttribute(), intelligence: generateHiddenAttribute(), loyalty: generateHiddenAttribute(), mood: generateHiddenAttribute(), sportsmanship: generateHiddenAttribute(), determination: generateHiddenAttribute(), leadership: generateHiddenAttribute(), professionalism: generateHiddenAttribute(), teamPlayer: generateHiddenAttribute(), temperament: generateHiddenAttribute(), passShootTendency: generateHiddenAttribute() };
        Object.assign(attributes, hiddenAttrs);
    } else {
        const hiddenAttrs: Partial<GoalieAttributes> = { aging: generateHiddenAttribute(), ambition: generateHiddenAttribute(), bigGames: generateHiddenAttribute(), coachability: generateHiddenAttribute(), controversy: generateHiddenAttribute(), developmentRate: generateHiddenAttribute(), greed: generateHiddenAttribute(), handleFailure: generateHiddenAttribute(), handleSuccess: generateHiddenAttribute(), handleCritics: generateHiddenAttribute(), injuryProneness: generateHiddenAttribute(), intelligence: generateHiddenAttribute(), loyalty: generateHiddenAttribute(), mood: generateHiddenAttribute(), sportsmanship: generateHiddenAttribute(), professionalism: generateHiddenAttribute(), determination: generateHiddenAttribute(), leadership: generateHiddenAttribute() };
        Object.assign(attributes, hiddenAttrs);
    }

    return attributes as SkaterAttributes | GoalieAttributes;
};

export const calculateCurrentAbility = (attributes: SkaterAttributes | GoalieAttributes, isSkater: boolean): number => {
    const keys = isSkater ? visibleSkaterKeys : visibleGoalieKeys;
    return keys.reduce((sum, key) => sum + (attributes as any)[key], 0);
};

export const calculateStarRating = (currentAbility: number, isSkater: boolean, leagueDivision: string): number => {
    const tier = getTierStats(leagueDivision);
    const ranges = isSkater ? skaterAbilityRanges[tier.name] : goalieAbilityRanges[tier.name];

    if (!ranges) return 1; // Fallback

    // Iterate from highest star to lowest
    for (const star of Object.keys(ranges).sort((a, b) => parseFloat(b) - parseFloat(a))) {
        const { min, max } = ranges[star];
        if (currentAbility >= min && currentAbility <= max) {
            return parseFloat(star);
        }
    }
    return 1; // Default to 1 star if no range matches
};

const getTargetAbilityRange = (starRating: number, isSkater: boolean, leagueDivision: string): { min: number, max: number } => {
    const tier = getTierStats(leagueDivision);
    const ranges = isSkater ? skaterAbilityRanges[tier.name] : goalieAbilityRanges[tier.name];
    
    const range = ranges[String(starRating)];
    if (!range) { // Fallback for safety
        return isSkater ? { min: 200, max: 220 } : { min: 80, max: 100 };
    }

    // Handle Infinity for max range
    const maxAbility = range.max === Infinity 
        ? range.min + (isSkater ? 40 : 20) // If max is infinity, create a reasonable upper bound for generation
        : range.max;

    // Ensure a minimum floor for generated ability to prevent excessively low attributes
    const minFloor = (isSkater ? visibleSkaterKeys.length : visibleGoalieKeys.length) * 5; // e.g., 28 * 5 = 140 for skaters
    
    return { min: Math.max(range.min, minFloor), max: maxAbility };
};

const calculateRoleSuitability = (attributes: SkaterAttributes, playerPosition: 'Forward' | 'Defenceman'): { suitabilities: { [key: string]: number }, bestRole: string, highestSuitability: number } => {
    const suitabilities: { [key: string]: number } = {};
    let bestRole = '';
    let highestSuitability = -1;
    const applicableRoles = roles.filter(r => r.positions.includes(playerPosition));
    applicableRoles.forEach(role => {
        const totalAttributeValue = role.keyAttributes.reduce((sum, attr) => sum + attributes[attr], 0);
        const maxPossibleValue = role.keyAttributes.length * 20;
        const finalSuitability = Math.round(Math.min(20, Math.max(1, (totalAttributeValue / maxPossibleValue) * 19 + 1)));
        suitabilities[role.name] = finalSuitability;
        if (finalSuitability > highestSuitability) {
            highestSuitability = finalSuitability;
            bestRole = role.name;
        }
    });
    return { suitabilities, bestRole, highestSuitability };
};

const eligibilityAgeRanges: Record<Player['eligibility'], { min: number, max: number }> = { "UG Year 1": { min: 18, max: 19 }, "UG Year 2": { min: 19, max: 20 }, "UG Year 3": { min: 20, max: 21 }, "UG Year 4": { min: 21, max: 22 }, "Masters": { min: 22, max: 24 }, "PhD": { min: 23, max: 28 }, "Staff": { min: 25, max: 40 } };
const getGamesPlayedForDivision = (leagueDivision: string): number => {
    if (leagueDivision.includes('Checking 1')) return 10; if (leagueDivision.includes('Checking 2')) return 6; if (leagueDivision.includes('Non Checking 1')) return 10; if (leagueDivision.includes('Non Checking 2 - North')) return 6; if (leagueDivision.includes('Non Checking 2 - South')) return 12; if (leagueDivision.includes('Non Checking 3')) return 6; return 10;
};

const generateRandomSeasonStats = (isSkater: boolean, teamName: string, leagueDivision: string, seasonYear: number, previousCaptaincy: 'C' | 'A' | null = null, attributes?: SkaterAttributes | GoalieAttributes): PlayerSeasonStats => {
    const gamesPlayed = getGamesPlayedForDivision(leagueDivision);
    if (isSkater && attributes) {
        const skaterAttrs = attributes as SkaterAttributes;
        const offensiveSkill = (skaterAttrs.offensiveRead + skaterAttrs.shootingAccuracy + skaterAttrs.gettingOpen + skaterAttrs.passing) / 4;
        const ppg = 0.1 + Math.pow((offensiveSkill - 1) / 19, 2) * (3.0 - 0.1);
        const points = Math.round(ppg * (0.8 + Math.random() * 0.4) * gamesPlayed);
        let goals = Math.round(points * (skaterAttrs.shootingAccuracy / (skaterAttrs.shootingAccuracy + skaterAttrs.passing + 0.1)));
        if (goals > points) goals = points;
        const assists = points - goals;
        const penaltyMinutes = Math.floor(Math.random() * gamesPlayed * 2);
        let captaincy: 'C' | 'A' | null = null;
        if (previousCaptaincy === 'A') { const roll = Math.random(); if (roll < 0.75) captaincy = 'A'; else if (roll < 0.90) captaincy = 'C'; } else if (previousCaptaincy === 'C') { const roll = Math.random(); if (roll < 0.95) captaincy = 'C'; else if (roll < 0.99) captaincy = 'A'; } else { const captaincyRoll = Math.random(); if (captaincyRoll < 0.02) captaincy = 'C'; else if (captaincyRoll < 0.07) captaincy = 'A'; }
        return { season: `${seasonYear}-${seasonYear + 1}`, team: teamName, league: leagueDivision, gamesPlayed, goals, assists, points, penaltyMinutes, captaincy };
    } else {
        if (isSkater) { const goals = Math.floor(Math.random() * (gamesPlayed * 0.8)); const assists = Math.floor(Math.random() * (gamesPlayed * 1.2)); return { season: `${seasonYear}-${seasonYear + 1}`, team: teamName, league: leagueDivision, gamesPlayed, goals, assists, points: goals + assists, penaltyMinutes: Math.floor(Math.random() * gamesPlayed * 2), captaincy: null }; }
        else { const gaa = parseFloat((Math.random() * (5.50 - 2.00) + 2.00).toFixed(2)); const svp = parseFloat((Math.random() * (0.930 - 0.880) + 0.880).toFixed(3)); return { season: `${seasonYear}-${seasonYear + 1}`, team: teamName, league: leagueDivision, gamesPlayed, goalsAgainstAverage: gaa, savePercentage: svp, shutouts: Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 1 : 0 }; }
    }
};

const generatePlayer = (usedJerseyNumbers: Set<number>, position: Position, leagueDivision: string, teamName: string, allowedEligibilities?: Player['eligibility'][], options?: { targetStarRating?: number, targetAbility?: number }): Player => {
  let jerseyNumber: number;
  do { jerseyNumber = Math.floor(Math.random() * 98) + 1; } while (usedJerseyNumbers.has(jerseyNumber));
  usedJerseyNumbers.add(jerseyNumber);

  const positions: Position[] = [position];
  const isSkater = position !== 'G';
  if (isSkater) {
    if (Math.random() > 0.5) { 
      let secondaryPosition: Position; 
      while (true) {
        secondaryPosition = getRandomItem(skaterPositions); 
        if (!positions.some((p: Position) => p === secondaryPosition)) { // Explicit cast here
          break;
        }
      }
      positions.push(secondaryPosition);
    }
    if (positions.length === 2 && Math.random() > 0.8) { 
      let tertiaryPosition: Position; 
      while (true) {
        tertiaryPosition = getRandomItem(skaterPositions); 
        if (!positions.some((p: Position) => p === tertiaryPosition)) { // Explicit cast here
          break;
        }
      }
      positions.push(tertiaryPosition);
    }
  }

  const archetype = getArchetypeForPosition(position);
  let attributes: SkaterAttributes | GoalieAttributes;
  let targetAbility = options?.targetAbility;

  if (options?.targetStarRating && !targetAbility) {
      const { min, max } = getTargetAbilityRange(options.targetStarRating, isSkater, leagueDivision);
      targetAbility = getRandomValueInRange(min, max);
  }
  
  attributes = generateAttributesForAbility(archetype, targetAbility!, isSkater);

  const eligibilitiesToUse = allowedEligibilities || eligibilities;
  const eligibility = getRandomItem(eligibilitiesToUse);
  const age = getRandomValueInRange(eligibilityAgeRanges[eligibility].min, eligibilityAgeRanges[eligibility].max);
  
  let yearsLeftInProgram: number | undefined;
  if (eligibility === 'Masters') yearsLeftInProgram = getRandomValueInRange(1, 2);
  else if (eligibility === 'PhD') yearsLeftInProgram = getRandomValueInRange(1, 5);

  const currentAbility = calculateCurrentAbility(attributes, isSkater);
  const starRating = options?.targetStarRating ?? calculateStarRating(currentAbility, isSkater, leagueDivision);
  
  const potentialBonus = Math.floor(Math.random() * (isSkater ? 100 : 50)) * ((30 - age) / 12);
  const maxAbility = isSkater ? 560 : 260;
  let potentialAbility = Math.min(maxAbility, Math.round(currentAbility + potentialBonus));
  if (potentialAbility < currentAbility) potentialAbility = currentAbility;

  let role: string | undefined, roleSuitability: { [key: string]: number } = {};
  if (isSkater) {
      const skaterAttributes = attributes as SkaterAttributes;
      const isForward = ['C', 'LW', 'RW'].some(p => positions.includes(p));
      const isDefenceman = ['LD', 'RD'].some(p => positions.includes(p));
      let finalSuitabilities: { [key: string]: number } = {}, bestRoleOverall = '', highestSuitabilityOverall = -1;
      if (isForward) { const { suitabilities, bestRole, highestSuitability } = calculateRoleSuitability(skaterAttributes, 'Forward'); finalSuitabilities = { ...finalSuitabilities, ...suitabilities }; if (highestSuitability > highestSuitabilityOverall) { highestSuitabilityOverall = highestSuitability; bestRoleOverall = bestRole; } }
      if (isDefenceman) { const { suitabilities, bestRole, highestSuitability } = calculateRoleSuitability(skaterAttributes, 'Defenceman'); finalSuitabilities = { ...finalSuitabilities, ...suitabilities }; if (highestSuitability > highestSuitabilityOverall) { highestSuitabilityOverall = highestSuitability; bestRoleOverall = bestRole; } }
      roleSuitability = finalSuitabilities; role = bestRoleOverall;
  }

  const history: PlayerSeasonStats[] = [];
  const currentYear = new Date().getFullYear();
  let numPriorSeasons = 0;
  if (eligibility === "UG Year 2") numPriorSeasons = 1; else if (eligibility === "UG Year 3") numPriorSeasons = 2; else if (eligibility === "UG Year 4") numPriorSeasons = 3; else if (eligibility === "Staff") numPriorSeasons = getRandomValueInRange(1, 5);
  let lastSeasonCaptaincy: 'C' | 'A' | null = null;
  for (let i = 0; i < numPriorSeasons; i++) { const seasonStats = generateRandomSeasonStats(isSkater, teamName, leagueDivision, currentYear - (numPriorSeasons - i), lastSeasonCaptaincy, attributes); history.push(seasonStats); lastSeasonCaptaincy = seasonStats.captaincy; }

  const gender = Math.random() < 0.8 ? 'Male' : 'Female';
  const nationality = getRandomNationality(teamName);
  const name = getRandomNameForNationality(nationality, gender);

  return { id: crypto.randomUUID(), jerseyNumber, name, age, nationality, positions, starRating, morale: "Content", healthStatus: "Healthy", injury: null, eligibility, archetype, attributes, currentAbility, potentialAbility, role, roleSuitability, captaincy: null, yearsLeftInProgram, history, trainingFocus: null, currentStats: { gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0, wins: 0, losses: 0, draws: 0, goalsAgainst: 0, shotsAgainst: 0, saves: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0 } };
};

const assignInitialCaptaincy = (roster: Player[]): Player[] => {
    const skaters = roster.filter(p => p.positions[0] !== 'G');
    if (skaters.length < 3) return roster;
    const priorCaptains = skaters.filter(p => p.eligibility !== 'UG Year 1' && p.history?.some(h => h.captaincy === 'C'));
    let captain: Player | undefined;
    if (priorCaptains.length > 0) { captain = priorCaptains.sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership)[0]; }
    else { const eligible = skaters.filter(p => p.eligibility !== 'UG Year 1'); if (eligible.length > 0) captain = eligible.sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership)[0]; }
    if (captain) captain.captaincy = 'C';
    const alternates = skaters.filter(p => p.id !== captain?.id).sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership).slice(0, 2);
    alternates.forEach(alt => { const player = roster.find(p => p.id === alt.id); if (player) player.captaincy = 'A'; });
    return roster;
};

const getStarCountsForRoster = (tierName: string, rosterSize: number): Record<string, number> => {
    const distribution = starRatingDistribution[tierName as keyof typeof starRatingDistribution];
    const percentages: Record<string, number> = {};
    let totalPercentage = 0;
    for (const star in distribution) { const { min, max } = distribution[star]; const picked = Math.random() * (max - min) + min; percentages[star] = picked; totalPercentage += picked; }
    for (const star in percentages) { percentages[star] /= totalPercentage; }
    const counts: Record<string, number> = {};
    let totalPlayers = 0;
    for (const star in percentages) { const count = Math.round(percentages[star] * rosterSize); counts[star] = count; totalPlayers += count; }
    let diff = rosterSize - totalPlayers;
    const stars = Object.keys(counts).sort((a, b) => parseFloat(b) - parseFloat(a));
    while (diff !== 0) { for (const star of stars) { if (diff === 0) break; if (diff > 0) { counts[star]++; diff--; } else { if (counts[star] > 0) { counts[star]--; diff++; } } } }
    return counts;
};

export const generateRoster = (leagueDivision: string, teamName: string): Player[] => {
  const roster: Player[] = [];
  const usedJerseyNumbers = new Set<number>();
  const rosterPositions: Position[] = [ "G", "G", "LD", "LD", "LD", "LD", "RD", "RD", "RD", "RD", "C", "C", "C", "C", "LW", "LW", "LW", "LW", "RW", "RW", "RW", "RW" ];
  
  const tier = getTierStats(leagueDivision);
  const starCounts = getStarCountsForRoster(tier.name, rosterPositions.length);
  const targetStars: number[] = [];
  for (const star in starCounts) { for (let i = 0; i < starCounts[star]; i++) { targetStars.push(parseFloat(star)); } }
  for (let i = targetStars.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [targetStars[i], targetStars[j]] = [targetStars[j], targetStars[i]]; }

  rosterPositions.forEach(position => {
      const targetStarRating = targetStars.pop()!;
      const player = generatePlayer(usedJerseyNumbers, position, leagueDivision, teamName, undefined, { targetStarRating });
      roster.push(player);
  });

  const finalRoster = assignInitialCaptaincy(roster);
  return finalRoster.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
};

export const generateRecruits = (userLeagueDivision: string, allTeamNames: string[]): Player[] => {
    const recruits: Player[] = [];
    const usedJerseyNumbers = new Set<number>();
    const numRecruits = 30 + Math.floor(Math.random() * 21);
    const teamDivisionMap = new Map(allTeamsData.map(team => [team.name, team.leagueDivision]));

    for (let i = 0; i < numRecruits; i++) {
        const sourceRoll = Math.random();
        const source: Player['source'] = sourceRoll < 0.6 ? 'Local' : (sourceRoll < 0.9 ? 'International' : 'Transfer');
        const eligibility = source === 'Transfer' 
            ? getRandomItem(["UG Year 2", "UG Year 3", "UG Year 4", "Masters", "PhD"] as Player['eligibility'][]) 
            : (Math.random() < 0.85 
                ? "UG Year 1" 
                : getRandomItem(["UG Year 2", "Masters"] as Player['eligibility'][]));
        
        const qualityRoll = Math.random();
        let estimatedQuality: Player['estimatedQuality'];
        if (qualityRoll < 0.49) estimatedQuality = 'Beginner'; else if (qualityRoll < 0.79) estimatedQuality = 'Moderate'; else if (qualityRoll < 0.94) estimatedQuality = 'Intermediate'; else if (qualityRoll < 0.98) estimatedQuality = 'Experienced'; else estimatedQuality = 'Elite';
        
        const position = getRandomItem([...skaterPositions, 'G']) as Position;
        const isSkater = position !== 'G';

        let targetCurrentAbilityMin: number, targetCurrentAbilityMax: number;
        if (estimatedQuality === 'Beginner') { targetCurrentAbilityMin = isSkater ? divisionTierStats[5].skater : divisionTierStats[5].goalie; targetCurrentAbilityMax = isSkater ? divisionTierStats[4].skater : divisionTierStats[4].goalie; }
        else if (estimatedQuality === 'Moderate') { targetCurrentAbilityMin = isSkater ? divisionTierStats[4].skater : divisionTierStats[4].goalie; targetCurrentAbilityMax = isSkater ? divisionTierStats[3].skater : divisionTierStats[3].goalie; }
        else if (estimatedQuality === 'Intermediate') { targetCurrentAbilityMin = isSkater ? divisionTierStats[3].skater : divisionTierStats[3].goalie; targetCurrentAbilityMax = isSkater ? divisionTierStats[2].skater : divisionTierStats[2].goalie; }
        else if (estimatedQuality === 'Experienced') { targetCurrentAbilityMin = isSkater ? divisionTierStats[2].skater : divisionTierStats[2].goalie; targetCurrentAbilityMax = isSkater ? divisionTierStats[1].skater : divisionTierStats[1].goalie; }
        else { const tier1 = divisionTierStats[1]; targetCurrentAbilityMin = isSkater ? tier1.skater + (tier1.step.skater * 0.25) : tier1.goalie + (tier1.step.goalie * 0.25); targetCurrentAbilityMax = isSkater ? tier1.skater + (tier1.step.skater * 2.0) : tier1.goalie + (tier1.step.goalie * 2.0); }

        const targetAbility = getRandomValueInRange(targetCurrentAbilityMin, targetCurrentAbilityMax);
        const player = generatePlayer(usedJerseyNumbers, position, userLeagueDivision, "Unattached", [eligibility], { targetAbility });
        
        if (estimatedQuality === 'Beginner') player.recruitmentCost = getRandomValueInRange(75, 150);
        else if (estimatedQuality === 'Moderate') player.recruitmentCost = getRandomValueInRange(150, 300);
        else if (estimatedQuality === 'Intermediate') player.recruitmentCost = getRandomValueInRange(300, 500);
        else if (estimatedQuality === 'Experienced') player.recruitmentCost = getRandomValueInRange(500, 750);
        else player.recruitmentCost = getRandomValueInRange(750, 1500);

        player.source = source;
        player.estimatedQuality = estimatedQuality;
        player.jerseyNumber = 0;
        player.morale = "Content";

        if (source === 'Transfer' && eligibility !== 'UG Year 1') {
            const otherTeamName = getRandomItem(allTeamNames);
            const otherTeamLeagueDivision = teamDivisionMap.get(otherTeamName) || userLeagueDivision;
            const numPriorSeasons = eligibility === "UG Year 2" ? 1 : getRandomValueInRange(1, 2);
            let lastSeasonCaptaincy: 'C' | 'A' | null = null;
            for (let j = 0; j < numPriorSeasons; j++) { const seasonStats = generateRandomSeasonStats(isSkater, otherTeamName, otherTeamLeagueDivision, new Date().getFullYear() - (numPriorSeasons - j), lastSeasonCaptaincy, player.attributes); player.history.push(seasonStats); lastSeasonCaptaincy = seasonStats.captaincy; }
        }

        recruits.push(player);
    }
    return recruits;
};