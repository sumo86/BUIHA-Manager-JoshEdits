import { Player, Position, PlayerArchetype, SkaterAttributes, GoalieAttributes, PlayerSeasonStats } from "@/types";
import { archetypes } from "@/data/archetypes";
import { roles } from "@/data/roles";
import { teams as allTeamsData } from "@/data/teams";
import { getRandomNationality } from "@/data/nationalityDistributions";
import { getRandomNameForNationality } from "@/data/names";

const eligibilities: Player['eligibility'][] = ["UG Year 1", "UG Year 2", "UG Year 3", "UG Year 4", "Masters", "PhD", "Staff"];
const skaterPositions: Position[] = ["C", "LW", "RW", "LD", "RD"];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
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

const divisionTiers: { [key: string]: { skater: number, goalie: number, step: { skater: number, goalie: number } } } = {
    'Checking 1': { skater: 420, goalie: 190, step: { skater: 30, goalie: 15 } },
    'Checking 2': { skater: 360, goalie: 160, step: { skater: 30, goalie: 15 } },
    'Non-Checking 1': { skater: 320, goalie: 140, step: { skater: 28, goalie: 13 } },
    'Non-Checking 2': { skater: 280, goalie: 120, step: { skater: 28, goalie: 13 } },
    'Non-Checking 3': { skater: 240, goalie: 100, step: { skater: 25, goalie: 12 } },
};

const generateAttributes = (archetype: PlayerArchetype, leagueDivision: string): SkaterAttributes | GoalieAttributes => {
    const clamp = (value: number) => Math.max(1, Math.min(20, Math.round(value)));

    const tierKey = Object.keys(divisionTiers).find(key => leagueDivision.includes(key)) || 'Non-Checking 3';
    const tier = divisionTiers[tierKey];

    const isSkater = archetype.position !== 'Goaltender';
    const numVisibleSkaterAttrs = 28;
    const numVisibleGoalieAttrs = 13;

    const avgAbilityForDivision = isSkater ? tier.skater : tier.goalie;
    const numVisibleAttrs = isSkater ? numVisibleSkaterAttrs : numVisibleGoalieAttrs;
    const targetAvgPerAttr = avgAbilityForDivision / numVisibleAttrs;

    const base = () => {
        return targetAvgPerAttr + (Math.random() * 10 - 5);
    };

    const generateHidden = () => ({
        aging: base(), ambition: base(), bigGames: base(), coachability: base(),
        controversy: base(), developmentRate: base(), greed: base(), handleFailure: base(),
        handleSuccess: base(), handleCritics: base(), injuryProneness: base(), intelligence: base(),
        loyalty: base(), mood: base(), sportsmanship: base(),
    });

    if (archetype.position === 'Goaltender') {
        const attrs: GoalieAttributes = {
            blocker: base(), glove: base(), lowShots: base(), positioning: base() + 5,
            rebound: base(), recovery: base(), reflexes: base() + 3, passing: base(),
            pokeCheck: base(), puckhandling: base(), skating: base(), mentalToughness: base() + 3,
            goaltenderStamina: base(),
            ...generateHidden(),
            professionalism: base(), determination: base(), leadership: base(),
        };

        if (archetype.type === 'Standup') { attrs.positioning += 3; attrs.recovery -= 2; } 
        else if (archetype.type === 'Butterfly') { attrs.lowShots += 4; attrs.recovery += 2; attrs.positioning -= 2; }
        if (archetype.physicality === 'Puckhandler') { attrs.puckhandling += 8; attrs.passing += 6; }

        Object.keys(attrs).forEach(key => {
            const attrKey = key as keyof GoalieAttributes;
            attrs[attrKey] = clamp(attrs[attrKey]);
        });
        return attrs;
    } 
    
    const attrs: SkaterAttributes = {
        acceleration: base(), agility: base(), balance: base(), fighting: base(), speed: base(),
        stamina: base(), strength: base(), hitting: base(), aggression: base(), bravery: base(),
        determination: base(), leadership: base(), professionalism: base(), teamPlayer: base(),
        temperament: base(), gettingOpen: base(), offensiveRead: base(), passing: base(),
        puckhandling: base(), screening: base(), shootingAccuracy: base(), shootingRange: base(),
        checking: base(), defensiveRead: base(), faceoffs: base(), positioning: base(),
        shotBlocking: base(), stickchecking: base(),
        ...generateHidden(),
        passShootTendency: base(),
    };

    if (archetype.type.includes('Offensive')) { attrs.offensiveRead += 5; attrs.puckhandling += 3; attrs.shootingAccuracy += 4; }
    if (archetype.type.includes('Playmaker')) { attrs.passing += 6; attrs.offensiveRead += 4; }
    if (archetype.type.includes('Goalscorer')) { attrs.shootingAccuracy += 6; attrs.shootingRange += 4; attrs.gettingOpen += 5; }
    if (archetype.type.includes('Two-Way')) { attrs.defensiveRead += 4; attrs.positioning += 4; attrs.stickchecking += 3; attrs.offensiveRead += 2; }
    if (archetype.type.includes('Defensive') || archetype.type.includes('Checking')) { attrs.defensiveRead += 6; attrs.positioning += 5; attrs.stickchecking += 5; attrs.checking += 4; attrs.shotBlocking += 4; attrs.hitting += 3; }
    if (archetype.type === 'Enforcer') { attrs.fighting += 10; attrs.aggression += 8; attrs.bravery += 6; attrs.hitting += 8; attrs.strength += 5; attrs.passing -= 5; attrs.puckhandling -= 5; attrs.shootingAccuracy -= 5; attrs.offensiveRead -= 6; }
    if (archetype.physicality === 'Physical') { attrs.strength += 5; attrs.hitting += 4; attrs.balance += 3; attrs.aggression += 3; } 
    else if (archetype.physicality === 'Non-Physical') { attrs.strength -= 3; attrs.hitting -= 4; attrs.aggression -= 4; attrs.fighting -= 5; }

    Object.keys(attrs).forEach(key => {
        const attrKey = key as keyof SkaterAttributes;
        attrs[attrKey] = clamp(attrs[attrKey]);
    });
    return attrs;
};

const calculateCurrentAbility = (attributes: SkaterAttributes | GoalieAttributes, isSkater: boolean): number => {
    const visibleSkaterKeys: (keyof SkaterAttributes)[] = ['acceleration', 'agility', 'balance', 'fighting', 'speed', 'stamina', 'strength', 'hitting', 'aggression', 'bravery', 'determination', 'leadership', 'professionalism', 'teamPlayer', 'temperament', 'gettingOpen', 'offensiveRead', 'passing', 'puckhandling', 'screening', 'shootingAccuracy', 'shootingRange', 'checking', 'defensiveRead', 'faceoffs', 'positioning', 'shotBlocking', 'stickchecking'];
    const visibleGoalieKeys: (keyof GoalieAttributes)[] = ['blocker', 'glove', 'lowShots', 'positioning', 'rebound', 'recovery', 'reflexes', 'passing', 'pokeCheck', 'puckhandling', 'skating', 'mentalToughness', 'goaltenderStamina'];
    
    if (isSkater) {
        return visibleSkaterKeys.reduce((sum, key) => sum + (attributes as SkaterAttributes)[key], 0);
    } else {
        return visibleGoalieKeys.reduce((sum, key) => sum + (attributes as GoalieAttributes)[key], 0);
    }
};

const calculateStarRating = (currentAbility: number, isSkater: boolean, leagueDivision: string): number => {
    const tierKey = Object.keys(divisionTiers).find(key => leagueDivision.includes(key)) || 'Non-Checking 3';
    const tier = divisionTiers[tierKey];
    
    const avgAbility = isSkater ? tier.skater : tier.goalie;
    const step = isSkater ? tier.step.skater : tier.step.goalie;
    
    const diff = currentAbility - avgAbility;

    if (diff > step * 1.75) return 5;
    if (diff > step * 1.25) return 4.5;
    if (diff > step * 0.75) return 4;
    if (diff > step * 0.25) return 3.5;
    if (diff > -0.25 * step) return 3;
    if (diff > -0.75 * step) return 2.5;
    if (diff > -1.25 * step) return 2;
    if (diff > -1.75 * step) return 1.5;
    return 1;
};

const calculateRoleSuitability = (attributes: SkaterAttributes, playerPosition: 'Forward' | 'Defenceman'): { suitabilities: { [key: string]: number }, bestRole: string, highestSuitability: number } => {
    const suitabilities: { [key: number]: number } = {};
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

const generateRandomSeasonStats = (isSkater: boolean, teamName: string, leagueDivision: string, seasonYear: number, previousCaptaincy: 'C' | 'A' | null = null): PlayerSeasonStats => {
    const gamesPlayed = Math.floor(Math.random() * 11) + 15; // 15-25 games
    let goals = 0;
    let assists = 0;
    let penaltyMinutes = 0;
    let captaincy: 'C' | 'A' | null = null;

    if (isSkater) {
        goals = Math.floor(Math.random() * 10) + 1; // 1-10 goals
        assists = Math.floor(Math.random() * 15) + 1; // 1-15 assists
        penaltyMinutes = Math.floor(Math.random() * 30) + 5; // 5-35 PIM
        
        if (previousCaptaincy === 'A') {
            if (Math.random() < 0.8) { // 80% chance to retain 'A'
                captaincy = 'A';
            } else {
                const roll = Math.random();
                if (roll < 0.1) captaincy = 'C'; // 10% chance to become C
                else captaincy = null; // 10% chance to lose it
            }
        } else if (previousCaptaincy === 'C') {
            if (Math.random() < 0.9) { // 90% chance to retain 'C'
                captaincy = 'C';
            } else {
                const roll = Math.random();
                if (roll < 0.5) captaincy = 'A'; // 5% chance to become A
                else captaincy = null; // 5% chance to lose it
            }
        } else {
            const captaincyRoll = Math.random();
            if (captaincyRoll < 0.15) { // 15% chance of being captain
                captaincy = 'C';
            } else if (captaincyRoll < 0.40) { // 25% chance of being alternate
                captaincy = 'A';
            }
        }
    } else { // Goalie
        goals = 0;
        assists = Math.random() < 0.1 ? 1 : 0; // 10% chance of 1 assist
        penaltyMinutes = Math.random() < 0.2 ? 2 : 0; // 20% chance of 2 PIM
    }

    return {
        season: `${seasonYear}-${seasonYear + 1}`,
        team: teamName,
        league: leagueDivision,
        gamesPlayed,
        goals,
        assists,
        points: goals + assists,
        penaltyMinutes,
        captaincy,
    };
};

const generatePlayer = (usedJerseyNumbers: Set<number>, position: Position, leagueDivision: string, teamName: string, allowedEligibilities?: Player['eligibility'][]): Player => {
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
  const attributes = generateAttributes(archetype, leagueDivision);
  
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
  
  const potentialBonus = Math.floor(Math.random() * 150) * ((30 - age) / 12);
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
  let lastSeasonCaptaincy: 'C' | 'A' | null = null; // Track captaincy for persistence

  switch (eligibility) {
      case "UG Year 2": numPriorSeasons = 1; break;
      case "UG Year 3": numPriorSeasons = 2; break;
      case "UG Year 4": numPriorSeasons = 3; break;
      case "Staff": numPriorSeasons = Math.floor(Math.random() * 5) + 1; break;
      default: numPriorSeasons = 0; break;
  }

  for (let i = 0; i < numPriorSeasons; i++) {
      const seasonStats = generateRandomSeasonStats(isSkater, teamName, leagueDivision, currentYear - (numPriorSeasons - i), lastSeasonCaptaincy);
      history.push(seasonStats);
      lastSeasonCaptaincy = seasonStats.captaincy; // Update for next iteration
  }

  const gender = Math.random() < 0.8 ? 'Male' : 'Female';
  const nationality = getRandomNationality();
  const name = getRandomNameForNationality(nationality, gender);

  return {
    id: crypto.randomUUID(),
    jerseyNumber,
    name,
    age,
    nationality,
    positions,
    starRating,
    morale: "Content",
    healthStatus: "Healthy",
    eligibility,
    archetype,
    attributes,
    currentAbility,
    potentialAbility,
    role,
    roleSuitability,
    captaincy: null,
    yearsLeftInProgram,
    history,
  };
};

const assignInitialCaptaincy = (roster: Player[]): Player[] => {
    const skaters = roster.filter(p => p.positions[0] !== 'G');
    if (skaters.length < 3) return roster;

    // --- Assign Captain ---
    // Find players with prior captaincy experience, not in their first year
    const priorCaptains = skaters.filter(p => 
        p.eligibility !== 'UG Year 1' &&
        p.history?.some(h => h.captaincy === 'C')
    );

    let captain: Player | undefined;

    if (priorCaptains.length > 0) {
        // If prior captains exist, pick the one with the highest leadership
        captain = priorCaptains.sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership)[0];
    } else {
        // Otherwise, pick the non-first-year player with the highest leadership
        const eligibleCandidates = skaters.filter(p => p.eligibility !== 'UG Year 1');
        if (eligibleCandidates.length > 0) {
            captain = eligibleCandidates.sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership)[0];
        }
    }

    if (captain) {
        captain.captaincy = 'C';
    }

    // --- Assign Alternates ---
    // Find the top two players by leadership, excluding the captain
    const alternateCandidates = skaters
        .filter(p => p.id !== captain?.id)
        .sort((a, b) => (b.attributes as SkaterAttributes).leadership - (a.attributes as SkaterAttributes).leadership);
    
    const alternates = alternateCandidates.slice(0, 2);
    alternates.forEach(alt => {
        const playerInRoster = roster.find(p => p.id === alt.id);
        if (playerInRoster) {
            playerInRoster.captaincy = 'A';
        }
    });

    return roster;
};


export const generateRoster = (leagueDivision: string, teamName: string): Player[] => {
  const roster: Player[] = [];
  const usedJerseyNumbers = new Set<number>();
  const nonStaffEligibilities = eligibilities.filter(e => e !== 'Staff');

  roster.push(generatePlayer(usedJerseyNumbers, "G", leagueDivision, teamName, nonStaffEligibilities));
  roster.push(generatePlayer(usedJerseyNumbers, "G", leagueDivision, teamName, nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "LD", leagueDivision, teamName, nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "RD", leagueDivision, teamName, nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "C", leagueDivision, teamName, nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "LW", leagueDivision, teamName, nonStaffEligibilities));
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "RW", leagueDivision, teamName, nonStaffEligibilities));

  roster.push(generatePlayer(usedJerseyNumbers, "LD", leagueDivision, teamName));
  roster.push(generatePlayer(usedJerseyNumbers, "RD", leagueDivision, teamName));
  roster.push(generatePlayer(usedJerseyNumbers, "C", leagueDivision, teamName));
  roster.push(generatePlayer(usedJerseyNumbers, "LW", leagueDivision, teamName));
  roster.push(generatePlayer(usedJerseyNumbers, "RW", leagueDivision, teamName));

  const finalRoster = assignInitialCaptaincy(roster);

  return finalRoster.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
};

export const generateRecruits = (userLeagueDivision: string, allTeamNames: string[]): Player[] => {
    const recruits: Player[] = [];
    const usedJerseyNumbers = new Set<number>();
    const numRecruits = 30 + Math.floor(Math.random() * 21); // 30-50 recruits

    const teamDivisionMap = new Map(allTeamsData.map(team => [team.name, team.leagueDivision]));

    for (let i = 0; i < numRecruits; i++) {
        let eligibility: Player['eligibility'];
        const sourceRoll = Math.random();
        const source: Player['source'] = sourceRoll < 0.6 ? 'Local' : (sourceRoll < 0.9 ? 'International' : 'Transfer');

        if (source === 'Transfer') {
            const eligibilityOptionsForTransfers: Player['eligibility'][] = ["UG Year 2", "UG Year 3", "UG Year 4", "Masters", "PhD"];
            eligibility = getRandomItem(eligibilityOptionsForTransfers);
        } else {
            eligibility = Math.random() < 0.85 ? "UG Year 1" : getRandomItem(["UG Year 2", "Masters"]);
        }

        const qualityRoll = Math.random();
        const estimatedQuality: Player['estimatedQuality'] = 
            qualityRoll < 0.5 ? 'Beginner' :
            qualityRoll < 0.8 ? 'Moderate' :
            qualityRoll < 0.95 ? 'Intermediate' : 'Experienced';

        const allPossiblePositions: Position[] = [...skaterPositions, 'G'];
        const position = getRandomItem(allPossiblePositions);
        
        const genericDivisionForBaseGeneration = 'Non-Checking 3'; 
        const player = generatePlayer(usedJerseyNumbers, position, genericDivisionForBaseGeneration, "Unattached", [eligibility]);

        let targetCurrentAbilityMin: number;
        let targetCurrentAbilityMax: number;

        const isSkater = player.positions[0] !== 'G';

        if (estimatedQuality === 'Beginner') {
            targetCurrentAbilityMin = isSkater ? divisionTiers['Non-Checking 3'].skater : divisionTiers['Non-Checking 3'].goalie;
            targetCurrentAbilityMax = isSkater ? divisionTiers['Non-Checking 2'].skater : divisionTiers['Non-Checking 2'].goalie;
        } else if (estimatedQuality === 'Moderate') {
            targetCurrentAbilityMin = isSkater ? divisionTiers['Non-Checking 2'].skater : divisionTiers['Non-Checking 2'].goalie;
            targetCurrentAbilityMax = isSkater ? divisionTiers['Non-Checking 1'].skater : divisionTiers['Non-Checking 1'].goalie;
        } else if (estimatedQuality === 'Intermediate') {
            targetCurrentAbilityMin = isSkater ? divisionTiers['Non-Checking 1'].skater : divisionTiers['Non-Checking 1'].goalie;
            targetCurrentAbilityMax = isSkater ? divisionTiers['Checking 1'].skater : divisionTiers['Checking 1'].goalie;
            // Apply boost for Intermediate
            targetCurrentAbilityMin += isSkater ? 10 : 5;
            targetCurrentAbilityMax += isSkater ? 10 : 5;
        } else { // Experienced
            targetCurrentAbilityMin = isSkater ? divisionTiers['Checking 2'].skater : divisionTiers['Checking 2'].goalie;
            targetCurrentAbilityMax = isSkater ? divisionTiers['Checking 1'].skater : divisionTiers['Checking 1'].goalie;
            // Apply boost for Experienced
            targetCurrentAbilityMin += isSkater ? 15 : 8;
            targetCurrentAbilityMax += isSkater ? 15 : 8;
        }

        player.currentAbility = getRandomValueInRange(targetCurrentAbilityMin, targetCurrentAbilityMax);
        
        const potentialBonus = Math.floor(Math.random() * 150) * ((30 - player.age) / 12);
        player.potentialAbility = Math.round(player.currentAbility + potentialBonus);
        const maxAbility = isSkater ? 560 : 260;
        if (player.potentialAbility > maxAbility) player.potentialAbility = maxAbility;
        if (player.potentialAbility < player.currentAbility) player.potentialAbility = player.currentAbility;

        player.starRating = calculateStarRating(player.currentAbility, isSkater, userLeagueDivision);

        player.source = source;
        player.estimatedQuality = estimatedQuality;
        player.jerseyNumber = 0;
        player.morale = "Content";
        player.role = undefined;

        if (source === 'Transfer' && eligibility !== 'UG Year 1') {
            const otherTeamName = getRandomItem(allTeamNames);
            const otherTeamLeagueDivision = teamDivisionMap.get(otherTeamName) || userLeagueDivision;
            
            const history: PlayerSeasonStats[] = [];
            const currentYear = new Date().getFullYear();
            let numPriorSeasons = eligibility === "UG Year 2" ? 1 : (Math.random() < 0.5 ? 1 : 2);
            let lastSeasonCaptaincy: 'C' | 'A' | null = null;

            for (let j = 0; j < numPriorSeasons; j++) {
                const seasonStats = generateRandomSeasonStats(player.positions[0] !== 'G', otherTeamName, otherTeamLeagueDivision, currentYear - (numPriorSeasons - j), lastSeasonCaptaincy);
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