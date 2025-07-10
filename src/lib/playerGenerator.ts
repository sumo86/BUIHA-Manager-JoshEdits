import { Player, Position, PlayerArchetype, SkaterAttributes, GoalieAttributes, PlayerSeasonStats } from "@/types";
import { archetypes } from "@/data/archetypes";
import { roles } from "@/data/roles";
import { teams as allTeamsData } from "@/data/teams";
import { getRandomNationality } from "@/data/nationalityDistributions";
import { getRandomNameForNationality } from "@/data/names";
import { divisionToTierMap, starRatingBands, calculateStarRating as calculateStarRatingFromUtils } from "./leagueUtils";

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

const generateAttributes = (archetype: PlayerArchetype, leagueDivision: string, targetStarRating: number): SkaterAttributes | GoalieAttributes => {
    const clamp = (value: number) => Math.max(1, Math.min(20, Math.round(value)));
    const isSkater = archetype.position !== 'Goaltender';
    const tierId = divisionToTierMap[leagueDivision] || 5;
    const playerTypeKey = isSkater ? 'skater' : 'goalie';
    const bands = starRatingBands[playerTypeKey][tierId];
    const targetBand = bands.find(b => b.stars === targetStarRating) || bands[0];
    const targetCA = getRandomValueInRange(targetBand.min, targetBand.max);

    const attrKeys = isSkater ? visibleSkaterKeys : visibleGoalieKeys;
    const numVisibleAttrs = attrKeys.length;
    const baseValue = Math.floor(targetCA / numVisibleAttrs);
    let remainder = targetCA % numVisibleAttrs;

    const generatedAttrs: { [key: string]: number } = {};
    attrKeys.forEach(key => {
        generatedAttrs[key] = baseValue;
    });

    while (remainder > 0) {
        const randomKey = getRandomItem(attrKeys);
        if (generatedAttrs[randomKey] < 20) {
            generatedAttrs[randomKey]++;
            remainder--;
        }
    }

    // Add hidden attributes
    const hiddenAttributeKeys = ['aging', 'ambition', 'bigGames', 'coachability', 'controversy', 'developmentRate', 'greed', 'handleFailure', 'handleSuccess', 'handleCritics', 'injuryProneness', 'intelligence', 'loyalty', 'mood', 'sportsmanship', 'professionalism', 'determination', 'leadership'];
    if (isSkater) {
        hiddenAttributeKeys.push('teamPlayer', 'temperament', 'passShootTendency');
    }
    hiddenAttributeKeys.forEach(key => {
        generatedAttrs[key] = getRandomValueInRange(1, 20);
    });

    const finalAttributes = generatedAttrs as unknown as SkaterAttributes | GoalieAttributes;

    // Apply archetype bonuses
    if (isSkater) {
        const attrs = finalAttributes as SkaterAttributes;
        if (archetype.type.includes('Offensive')) { attrs.offensiveRead += 5; attrs.puckhandling += 3; attrs.shootingAccuracy += 4; }
        if (archetype.type.includes('Playmaker')) { attrs.passing += 6; attrs.offensiveRead += 4; }
        if (archetype.type.includes('Goalscorer')) { attrs.shootingAccuracy += 6; attrs.shootingRange += 4; attrs.gettingOpen += 5; }
        if (archetype.type.includes('Two-Way')) { attrs.defensiveRead += 4; attrs.positioning += 4; attrs.stickchecking += 3; attrs.offensiveRead += 2; }
        if (archetype.type.includes('Defensive') || archetype.type.includes('Checking')) { attrs.defensiveRead += 6; attrs.positioning += 5; attrs.stickchecking += 5; attrs.checking += 4; attrs.shotBlocking += 4; attrs.hitting += 3; }
        if (archetype.type === 'Enforcer') { attrs.fighting += 10; attrs.aggression += 8; attrs.bravery += 6; attrs.hitting += 8; attrs.strength += 5; attrs.passing -= 5; attrs.puckhandling -= 5; attrs.shootingAccuracy -= 5; attrs.offensiveRead -= 6; }
        if (archetype.physicality === 'Physical') { attrs.strength += 5; attrs.hitting += 4; attrs.balance += 3; attrs.aggression += 3; } 
        else if (archetype.physicality === 'Non-Physical') { attrs.strength -= 3; attrs.hitting -= 4; attrs.aggression -= 4; attrs.fighting -= 5; }
    } else {
        const attrs = finalAttributes as GoalieAttributes;
        if (archetype.type === 'Standup') { attrs.positioning += 3; attrs.recovery -= 2; } 
        else if (archetype.type === 'Butterfly') { attrs.lowShots += 4; attrs.recovery += 2; attrs.positioning -= 2; }
        if (archetype.physicality === 'Puckhandler') { attrs.puckhandling += 8; attrs.passing += 6; }
    }

    // Final clamp
    Object.keys(finalAttributes).forEach(key => {
        (finalAttributes as any)[key] = clamp((finalAttributes as any)[key]);
    });

    return finalAttributes;
};

export const calculateCurrentAbility = (attributes: SkaterAttributes | GoalieAttributes, isSkater: boolean): number => {
    const keys = isSkater ? visibleSkaterKeys : visibleGoalieKeys;
    return keys.reduce((sum, key) => sum + (attributes as any)[key], 0);
};

export const calculateStarRating = (currentAbility: number, isSkater: boolean, leagueDivision: string): number => {
    return calculateStarRatingFromUtils(currentAbility, isSkater, leagueDivision);
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
    "UG Year 1": { min: 18, max: 19 },
    "UG Year 2": { min: 19, max: 20 },
    "UG Year 3": { min: 20, max: 21 },
    "UG Year 4": { min: 21, max: 22 },
    "Masters": { min: 22, max: 24 },
    "PhD": { min: 23, max: 28 },
    "Staff": { min: 25, max: 40 },
};

const getGamesPlayedForDivision = (leagueDivision: string): number => {
    if (leagueDivision.includes('Checking 1')) return 10;
    if (leagueDivision.includes('Checking 2')) return 6;
    if (leagueDivision.includes('Non Checking 1')) return 10;
    if (leagueDivision.includes('Non Checking 2 - North')) return 6;
    if (leagueDivision.includes('Non Checking 2 - South')) return 12;
    if (leagueDivision.includes('Non Checking 3')) return 6;
    return 10; // Default for any other case
};

const generateRandomSeasonStats = (
    isSkater: boolean, 
    teamName: string, 
    leagueDivision: string, 
    seasonYear: number, 
    previousCaptaincy: 'C' | 'A' | null = null,
    attributes?: SkaterAttributes | GoalieAttributes
): PlayerSeasonStats => {
    const gamesPlayed = getGamesPlayedForDivision(leagueDivision);
    
    if (isSkater && attributes) {
        const skaterAttrs = attributes as SkaterAttributes;
        const offensiveSkill = (skaterAttrs.offensiveRead + skaterAttrs.shootingAccuracy + skaterAttrs.gettingOpen + skaterAttrs.passing) / 4;

        const minPpg = 0.1;
        const maxPpg = 3.0;
        const ppg = minPpg + Math.pow((offensiveSkill - 1) / 19, 2) * (maxPpg - minPpg);

        const finalPpg = ppg * (0.8 + Math.random() * 0.4); // +/- 20% randomness
        const points = Math.round(finalPpg * gamesPlayed);

        const goalTendency = skaterAttrs.shootingAccuracy / (skaterAttrs.shootingAccuracy + skaterAttrs.passing + 0.1);
        let goals = Math.round(points * goalTendency);
        
        if (goals > points) {
            goals = points;
        }
        const assists = points - goals;

        const penaltyMinutes = Math.floor(Math.random() * gamesPlayed * 2);
        let captaincy: 'C' | 'A' | null = null;
        
        if (previousCaptaincy === 'A') {
            const roll = Math.random();
            if (roll < 0.75) captaincy = 'A';
            else if (roll < 0.90) captaincy = 'C';
            else captaincy = null;
        } else if (previousCaptaincy === 'C') {
            const roll = Math.random();
            if (roll < 0.95) captaincy = 'C';
            else if (roll < 0.99) captaincy = 'A';
            else captaincy = null;
        } else {
            const captaincyRoll = Math.random();
            if (captaincyRoll < 0.02) captaincy = 'C';
            else if (captaincyRoll < 0.07) captaincy = 'A';
        }

        return {
            season: `${seasonYear}-${seasonYear + 1}`,
            team: teamName,
            league: leagueDivision,
            gamesPlayed,
            goals,
            assists,
            points,
            penaltyMinutes,
            captaincy,
        };
    } else { // Fallback for goalies or if attributes are not passed
        if (isSkater) {
            const goals = Math.floor(Math.random() * (gamesPlayed * 0.8));
            const assists = Math.floor(Math.random() * (gamesPlayed * 1.2));
            const penaltyMinutes = Math.floor(Math.random() * gamesPlayed * 2);
            return {
                season: `${seasonYear}-${seasonYear + 1}`,
                team: teamName,
                league: leagueDivision,
                gamesPlayed,
                goals,
                assists,
                points: goals + assists,
                penaltyMinutes,
                captaincy: null,
            };
        } else { // Goalie
            const goalsAgainstAverage = parseFloat((Math.random() * (5.50 - 2.00) + 2.00).toFixed(2));
            const savePercentage = parseFloat((Math.random() * (0.930 - 0.880) + 0.880).toFixed(3));
            const shutouts = Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 1 : 0;

            return {
                season: `${seasonYear}-${seasonYear + 1}`,
                team: teamName,
                league: leagueDivision,
                gamesPlayed,
                goalsAgainstAverage,
                savePercentage,
                shutouts,
            };
        }
    }
};

const generatePlayer = (usedJerseyNumbers: Set<number>, position: Position, leagueDivision: string, teamName: string, targetStarRating: number, allowedEligibilities?: Player['eligibility'][]): Player => {
  let jerseyNumber: number;
  do {
    jerseyNumber = Math.floor(Math.random() * 98) + 1;
  } while (usedJerseyNumbers.has(jerseyNumber));
  usedJerseyNumbers.add(jerseyNumber);

  const primaryPosition = position;
  const positions: Position[] = [primaryPosition];
  const isSkater = primaryPosition !== 'G';

  if (isSkater) {
    if (Math.random() > 0.5) {
      let secondaryPosition: Position;
      do {
        secondaryPosition = getRandomItem(skaterPositions);
      } while (positions.includes(secondaryPosition));
      positions.push(secondaryPosition);
    }
    if (positions.length === 2 && Math.random() > 0.8) {
        let tertiaryPosition: Position;
        do {
            tertiaryPosition = getRandomItem(skaterPositions);
        } while (positions.includes(tertiaryPosition));
        positions.push(tertiaryPosition);
    }
  }

  const archetype = getArchetypeForPosition(position);
  const attributes = generateAttributes(archetype, leagueDivision, targetStarRating);
  
  const eligibilitiesToUse = allowedEligibilities || eligibilities;
  const eligibility = getRandomItem(eligibilitiesToUse);
  const ageRange = eligibilityAgeRanges[eligibility];
  const age = Math.floor(Math.random() * (ageRange.max - ageRange.min + 1)) + ageRange.min;
  
  let yearsLeftInProgram: number | undefined = undefined;
  if (eligibility === 'Masters') {
      yearsLeftInProgram = Math.floor(Math.random() * 2) + 1; // 1 or 2
  } else if (eligibility === 'PhD') {
      yearsLeftInProgram = Math.floor(Math.random() * 5) + 1; // 1 to 5
  }

  const currentAbility = calculateCurrentAbility(attributes, isSkater);
  
  let potentialBonus: number;
  if (isSkater) {
      potentialBonus = Math.floor(Math.random() * 100) * ((30 - age) / 12); 
  } else {
      potentialBonus = Math.floor(Math.random() * 50) * ((30 - age) / 12); 
  }

  const maxAbility = isSkater ? 560 : 260;
  let potentialAbility = Math.round(currentAbility + potentialBonus);
  if (potentialAbility > maxAbility) potentialAbility = maxAbility;
  if (potentialAbility < currentAbility) potentialAbility = currentAbility;

  const starRating = calculateStarRating(currentAbility, isSkater, leagueDivision);

  let role: string | undefined = undefined;
  let roleSuitability: { [key: string]: number } = {};

  if (isSkater) {
      const skaterAttributes = attributes as SkaterAttributes;
      const forwardPositions: Position[] = ['C', 'LW', 'RW'];
      const defencePositions: Position[] = ['LD', 'RD'];
      const isForward = forwardPositions.some(p => positions.includes(p));
      const isDefenceman = defencePositions.some(p => positions.includes(p));

      let finalSuitabilities: { [key: string]: number } = {};
      let bestRoleOverall = '';
      let highestSuitabilityOverall = -1;

      if (isForward) {
          const { suitabilities, bestRole, highestSuitability } = calculateRoleSuitability(skaterAttributes, 'Forward');
          finalSuitabilities = { ...finalSuitabilities, ...suitabilities };
          if (highestSuitability > highestSuitabilityOverall) {
              highestSuitabilityOverall = highestSuitability;
              bestRoleOverall = bestRole;
          }
      }
      if (isDefenceman) {
          const { suitabilities, bestRole, highestSuitability } = calculateRoleSuitability(skaterAttributes, 'Defenceman');
          finalSuitabilities = { ...finalSuitabilities, ...suitabilities };
          if (highestSuitability > highestSuitabilityOverall) {
              highestSuitabilityOverall = highestSuitability;
              bestRoleOverall = bestRole;
          }
      }
      
      roleSuitability = finalSuitabilities;
      role = bestRoleOverall;
  }

  const history: PlayerSeasonStats[] = [];
  const currentYear = new Date().getFullYear();
  let numPriorSeasons = 0;
  let lastSeasonCaptaincy: 'C' | 'A' | null = null;

  switch (eligibility) {
      case "UG Year 2": numPriorSeasons = 1; break;
      case "UG Year 3": numPriorSeasons = 2; break;
      case "UG Year 4": numPriorSeasons = 3; break;
      case "Staff": numPriorSeasons = Math.floor(Math.random() * 5) + 1; break;
      default: numPriorSeasons = 0; break;
  }

  for (let i = 0; i < numPriorSeasons; i++) {
      const seasonStats = generateRandomSeasonStats(isSkater, teamName, leagueDivision, currentYear - (numPriorSeasons - i), lastSeasonCaptaincy, attributes);
      history.push(seasonStats);
      lastSeasonCaptaincy = seasonStats.captaincy;
  }

  const gender = Math.random() < 0.8 ? 'Male' : 'Female';
  const nationality = getRandomNationality(teamName);
  const name = getRandomNameForNationality(nationality, gender);

  const currentStats: Player['currentStats'] = {
    gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0, wins: 0, losses: 0, draws: 0, 
    goalsAgainst: 0, shotsAgainst: 0, saves: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0,
  };

  return {
    id: crypto.randomUUID(), jerseyNumber, name, age, nationality, positions, starRating, morale: "Content", healthStatus: "Healthy",
    eligibility, archetype, attributes, currentAbility, potentialAbility, role, roleSuitability, captaincy: null,
    yearsLeftInProgram, history, trainingFocus: null, currentStats,
  };
};

const assignInitialCaptaincy = (roster: Player[]): Player[] => {
    const skaters = roster.filter(p => p.positions[0] !== 'G');
    if (skaters.length < 3) return roster;

    const priorCaptains = skaters.filter(p => p.eligibility !== 'UG Year 1' && p.history?.some(h => h.captaincy === 'C'));

    let captain: Player | undefined;
    if (priorCaptains.length > 0) {
        captain = priorCaptains.sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership)[0];
    } else {
        const eligibleCandidates = skaters.filter(p => p.eligibility !== 'UG Year 1');
        if (eligibleCandidates.length > 0) {
            captain = eligibleCandidates.sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership)[0];
        }
    }

    if (captain) captain.captaincy = 'C';

    const alternateCandidates = skaters.filter(p => p.id !== captain?.id).sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership);
    const alternates = alternateCandidates.slice(0, 2);
    alternates.forEach(alt => {
        const playerInRoster = roster.find(p => p.id === alt.id);
        if (playerInRoster) playerInRoster.captaincy = 'A';
    });

    return roster;
};

const tierStarDistribution: Record<number, Record<string, number>> = {
    1: { '5': 1, '4.5': 3, '4': 10, '3.5': 20, '3': 20, '2.5': 10, '2': 3, '1.5': 1 },
    2: { '4.5': 1, '4': 3, '3.5': 10, '3': 20, '2.5': 20, '2': 10, '1.5': 3, '1': 1 },
    3: { '4': 1, '3.5': 3, '3': 10, '2.5': 20, '2': 20, '1.5': 10, '1': 3 },
    4: { '3.5': 1, '3': 3, '2.5': 10, '2': 20, '1.5': 20, '1': 10 },
    5: { '3': 1, '2.5': 3, '2': 10, '1.5': 20, '1': 20 }
};

const getRandomStarRatingForTier = (tierId: number): number => {
    const distribution = tierStarDistribution[tierId];
    const weightedList: number[] = [];
    for (const starStr in distribution) {
        const stars = parseFloat(starStr);
        const weight = distribution[starStr];
        for (let i = 0; i < weight; i++) {
            weightedList.push(stars);
        }
    }
    return getRandomItem(weightedList);
};

export const generateRoster = (leagueDivision: string, teamName: string): Player[] => {
  const roster: Player[] = [];
  const usedJerseyNumbers = new Set<number>();
  const nonStaffEligibilities = eligibilities.filter(e => e !== 'Staff');
  const tierId = divisionToTierMap[leagueDivision] || 5;

  const generatePlayerForRoster = (pos: Position, elig?: Player['eligibility'][]) => {
      const targetStars = getRandomStarRatingForTier(tierId);
      return generatePlayer(usedJerseyNumbers, pos, leagueDivision, teamName, targetStars, elig);
  };

  roster.push(generatePlayerForRoster("G", nonStaffEligibilities));
  roster.push(generatePlayerForRoster("G", nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayerForRoster("LD", nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayerForRoster("RD", nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayerForRoster("C", nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayerForRoster("LW", nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayerForRoster("RW", nonStaffEligibilities));

  roster.push(generatePlayerForRoster("LD"));
  roster.push(generatePlayerForRoster("RD"));
  roster.push(generatePlayerForRoster("C"));
  roster.push(generatePlayerForRoster("LW"));
  roster.push(generatePlayerForRoster("RW"));

  const finalRoster = assignInitialCaptaincy(roster);
  return finalRoster.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
};

export const generateRecruits = (userLeagueDivision: string, allTeamNames: string[]): Player[] => {
    const recruits: Player[] = [];
    const usedJerseyNumbers = new Set<number>();
    const numRecruits = 30 + Math.floor(Math.random() * 21);
    const teamDivisionMap = new Map(allTeamsData.map(team => [team.name, team.leagueDivision]));

    for (let i = 0; i < numRecruits; i++) {
        let eligibility: Player['eligibility'];
        const sourceRoll = Math.random();
        const source: Player['source'] = sourceRoll < 0.6 ? 'Local' : (sourceRoll < 0.9 ? 'International' : 'Transfer');

        if (source === 'Transfer') {
            eligibility = getRandomItem(["UG Year 2", "UG Year 3", "UG Year 4", "Masters", "PhD"]);
        } else {
            eligibility = Math.random() < 0.85 ? "UG Year 1" : getRandomItem(["UG Year 2", "Masters"]);
        }

        const qualityRoll = Math.random();
        let estimatedQuality: Player['estimatedQuality'];
        let targetStarRating: number;

        if (qualityRoll < 0.49) { estimatedQuality = 'Beginner'; targetStarRating = getRandomItem([1, 1.5]); }
        else if (qualityRoll < 0.79) { estimatedQuality = 'Moderate'; targetStarRating = getRandomItem([2, 2.5]); }
        else if (qualityRoll < 0.94) { estimatedQuality = 'Intermediate'; targetStarRating = getRandomItem([3, 3.5]); }
        else if (qualityRoll < 0.98) { estimatedQuality = 'Experienced'; targetStarRating = getRandomItem([4, 4.5]); }
        else { estimatedQuality = 'Elite'; targetStarRating = 5; }
        
        const allPossiblePositions: Position[] = [...skaterPositions, 'G'];
        const position = getRandomItem(allPossiblePositions);
        
        const player = generatePlayer(usedJerseyNumbers, position, userLeagueDivision, "Unattached", targetStarRating, [eligibility]);
        
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
            
            const history: PlayerSeasonStats[] = [];
            const currentYear = new Date().getFullYear();
            let numPriorSeasons = eligibility === "UG Year 2" ? 1 : (Math.random() < 0.5 ? 1 : 2);
            let lastSeasonCaptaincy: 'C' | 'A' | null = null;

            for (let j = 0; j < numPriorSeasons; j++) {
                const seasonStats = generateRandomSeasonStats(player.positions[0] !== 'G', otherTeamName, otherTeamLeagueDivision, currentYear - (numPriorSeasons - j), lastSeasonCaptaincy, player.attributes);
                history.push(seasonStats);
                lastSeasonCaptaincy = seasonStats.captaincy;
            }
            player.history = history;
        } else {
            player.history = [];
        }

        recruits.push(player);
    }

    return recruits;
};