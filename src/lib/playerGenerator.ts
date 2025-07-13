import { v4 as uuidv4 } from 'uuid';
import { Player, Position, SkaterAttributes, GoalieAttributes, PlayerArchetype } from '@/types';
import { archetypes } from '@/data/archetypes';
import { nationalities } from '@/data/nationalityDistributions';
import { abilityRanges } from '@/data/abilityRanges';
import { starRatingDistributions } from '@/data/starRatingDistribution';

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const getUniqueSkaterPosition = (currentPositions: Position[]): Position => {
  const allSkaterPositions: Position[] = ['C', 'LW', 'RW', 'LD', 'RD'];
  const availablePositions = allSkaterPositions.filter(pos => !currentPositions.includes(pos));
  return getRandomItem(availablePositions);
};

const getArchetypeForPosition = (position: Position): PlayerArchetype => {
  const relevantArchetypes = archetypes.filter(a => {
    if (position === 'C' || position === 'LW' || position === 'RW') {
      return a.position === 'Centre' || a.position === 'Winger';
    }
    if (position === 'LD' || position === 'RD') {
      return a.position === 'Defenceman';
    }
    return a.position === 'Goaltender';
  });
  return getRandomItem(relevantArchetypes);
};

export const calculateCurrentAbility = (attributes: SkaterAttributes | GoalieAttributes, isSkater: boolean): number => {
  if (isSkater) {
    const skaterAttrs = attributes as SkaterAttributes;
    return Math.round(
      (skaterAttrs.acceleration + skaterAttrs.agility + skaterAttrs.balance + skaterAttrs.speed + skaterAttrs.stamina + skaterAttrs.strength +
      skaterAttrs.hitting + skaterAttrs.aggression + skaterAttrs.bravery + skaterAttrs.determination + skaterAttrs.leadership + skaterAttrs.professionalism + skaterAttrs.teamPlayer + skaterAttrs.temperament +
      skaterAttrs.gettingOpen + skaterAttrs.offensiveRead + skaterAttrs.passing + skaterAttrs.puckhandling + skaterAttrs.screening + skaterAttrs.shootingAccuracy + skaterAttrs.shootingRange +
      skaterAttrs.checking + skaterAttrs.defensiveRead + skaterAttrs.faceoffs + skaterAttrs.positioning + skaterAttrs.shotBlocking + skaterAttrs.stickchecking) / 26
    );
  } else {
    const goalieAttrs = attributes as GoalieAttributes;
    return Math.round(
      (goalieAttrs.blocker + goalieAttrs.glove + goalieAttrs.lowShots + goalieAttrs.positioning + goalieAttrs.rebound + goalieAttrs.recovery + goalieAttrs.reflexes +
      goalieAttrs.passing + goalieAttrs.pokeCheck + goalieAttrs.puckhandling + goalieAttrs.skating + goalieAttrs.mentalToughness + goalieAttrs.goaltenderStamina +
      goalieAttrs.determination + goalieAttrs.leadership + goalieAttrs.professionalism + goalieAttrs.ambition + goalieAttrs.bigGames + goalieAttrs.coachability + goalieAttrs.controversy + goalieAttrs.greed + goalieAttrs.handleFailure + goalieAttrs.handleSuccess + goalieAttrs.handleCritics + goalieAttrs.injuryProneness + goalieAttrs.intelligence + goalieAttrs.loyalty + goalieAttrs.mood + goalieAttrs.sportsmanship) / 29
    );
  }
};

export const calculateStarRating = (ability: number, isSkater: boolean, leagueDivision: string): number => {
  const distribution = starRatingDistributions[leagueDivision];
  if (!distribution) return 0; // Should not happen if leagueDivision is valid

  // Assuming max attribute value is 20, so max ability is 20
  const maxAbility = 20; 
  const normalizedAbility = ability / maxAbility;

  // Find the star rating based on the distribution
  for (const rating in distribution) {
    if (normalizedAbility >= distribution[rating]) {
      return parseFloat(rating);
    }
  }
  return 0; // Default if no match
};

const generateAttributes = (isSkater: boolean, targetAbility?: number): SkaterAttributes | GoalieAttributes => {
  const baseAttributes: any = {
    aging: getRandomNumber(1, 20),
    ambition: getRandomNumber(1, 20),
    bigGames: getRandomNumber(1, 20),
    coachability: getRandomNumber(1, 20),
    controversy: getRandomNumber(1, 20),
    developmentRate: getRandomNumber(1, 20),
    greed: getRandomNumber(1, 20),
    handleFailure: getRandomNumber(1, 20),
    handleSuccess: getRandomNumber(1, 20),
    handleCritics: getRandomNumber(1, 20),
    injuryProneness: getRandomNumber(1, 20),
    intelligence: getRandomNumber(1, 20),
    loyalty: getRandomNumber(1, 20),
    mood: getRandomNumber(1, 20),
    sportsmanship: getRandomNumber(1, 20),
    professionalism: getRandomNumber(1, 20),
    determination: getRandomNumber(1, 20),
    leadership: getRandomNumber(1, 20),
  };

  if (isSkater) {
    return {
      ...baseAttributes,
      acceleration: getRandomNumber(1, 20),
      agility: getRandomNumber(1, 20),
      balance: getRandomNumber(1, 20),
      fighting: getRandomNumber(1, 20),
      speed: getRandomNumber(1, 20),
      stamina: getRandomNumber(1, 20),
      strength: getRandomNumber(1, 20),
      hitting: getRandomNumber(1, 20),
      aggression: getRandomNumber(1, 20),
      bravery: getRandomNumber(1, 20),
      teamPlayer: getRandomNumber(1, 20),
      temperament: getRandomNumber(1, 20),
      gettingOpen: getRandomNumber(1, 20),
      offensiveRead: getRandomNumber(1, 20),
      passing: getRandomNumber(1, 20),
      puckhandling: getRandomNumber(1, 20),
      screening: getRandomNumber(1, 20),
      shootingAccuracy: getRandomNumber(1, 20),
      shootingRange: getRandomNumber(1, 20),
      checking: getRandomNumber(1, 20),
      defensiveRead: getRandomNumber(1, 20),
      faceoffs: getRandomNumber(1, 20),
      positioning: getRandomNumber(1, 20),
      shotBlocking: getRandomNumber(1, 20),
      stickchecking: getRandomNumber(1, 20),
      passShootTendency: getRandomNumber(1, 20),
    } as SkaterAttributes;
  } else {
    return {
      ...baseAttributes,
      blocker: getRandomNumber(1, 20),
      glove: getRandomNumber(1, 20),
      lowShots: getRandomNumber(1, 20),
      positioning: getRandomNumber(1, 20),
      rebound: getRandomNumber(1, 20),
      recovery: getRandomNumber(1, 20),
      reflexes: getRandomNumber(1, 20),
      passing: getRandomNumber(1, 20),
      pokeCheck: getRandomNumber(1, 20),
      puckhandling: getRandomNumber(1, 20),
      skating: getRandomNumber(1, 20),
      mentalToughness: getRandomNumber(1, 20),
      goaltenderStamina: getRandomNumber(1, 20),
    } as GoalieAttributes;
  }
};

export const generatePlayer = (usedJerseyNumbers: Set<number>, position: Position, leagueDivision: string, teamName: string, allowedEligibilities?: Player['eligibility'][], options?: { targetStarRating?: number, targetAbility?: number }): Player => {
  let jerseyNumber: number;
  do { jerseyNumber = Math.floor(Math.random() * 98) + 1; } while (usedJerseyNumbers.has(jerseyNumber));
  usedJerseyNumbers.add(jerseyNumber);

  let positions: Position[] = [position];
  const isSkater = position !== 'G';
  if (isSkater) {
    if (Math.random() > 0.5) { 
      const newPosition: Position = getUniqueSkaterPosition(positions);
      positions.push(newPosition); 
    }
    if (positions.length === 2 && Math.random() > 0.8) { 
      const anotherNewPosition: Position = getUniqueSkaterPosition(positions);
      positions.push(anotherNewPosition); 
    }
  }

  const archetype = getArchetypeForPosition(position);
  let attributes: SkaterAttributes | GoalieAttributes;
  let targetAbility = options?.targetAbility;

  if (targetAbility) {
    // Logic to generate attributes around targetAbility (simplified for now)
    attributes = generateAttributes(isSkater); // Placeholder, would need more complex logic
  } else {
    attributes = generateAttributes(isSkater);
  }

  const currentAbility = calculateCurrentAbility(attributes, isSkater);
  const potentialAbility = currentAbility + getRandomNumber(0, 100); // Simple potential for now
  const starRating = calculateStarRating(currentAbility, isSkater, leagueDivision);

  const nationality = getRandomItem(nationalities);
  const age = getRandomNumber(18, 22);
  const eligibility: Player['eligibility'] = allowedEligibilities ? getRandomItem(allowedEligibilities) : 'UG Year 1'; // Default for now

  return {
    id: uuidv4(),
    jerseyNumber,
    name: "Player " + getRandomNumber(1, 1000), // Placeholder name
    age,
    nationality,
    positions,
    starRating,
    morale: "Content",
    healthStatus: "Healthy",
    injury: null,
    eligibility,
    archetype,
    attributes,
    currentAbility,
    potentialAbility,
    role: undefined,
    roleSuitability: {},
    captaincy: null,
    history: [],
    trainingFocus: null,
    currentStats: {
      gamesPlayed: 0, goals: 0, assists: 0, points: 0, penaltyMinutes: 0,
      wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0,
      shotsAgainst: 0, saves: 0, savePercentage: 0, goalsAgainstAverage: 0, shutouts: 0,
    },
    activeInstructions: [],
  };
};

export const generateRoster = (leagueDivision: string, teamName: string): Player[] => {
  const roster: Player[] = [];
  const usedJerseyNumbers = new Set<number>();

  // Generate 12 Forwards (C, LW, RW)
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, 'C', leagueDivision, teamName));
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, 'LW', leagueDivision, teamName));
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, 'RW', leagueDivision, teamName));

  // Generate 6 Defencemen (LD, RD)
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, 'LD', leagueDivision, teamName));
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, 'RD', leagueDivision, teamName));

  // Generate 2 Goalies (G)
  roster.push(generatePlayer(usedJerseyNumbers, 'G', leagueDivision, teamName));
  roster.push(generatePlayer(usedJerseyNumbers, 'G', leagueDivision, teamName));

  return roster;
};

export const generateRecruits = (leagueDivision: string, existingTeamNames: string[]): Player[] => {
  const recruits: Player[] = [];
  const usedJerseyNumbers = new Set<number>(); // For recruits, jersey numbers don't need to be unique across all teams yet

  const numRecruits = getRandomNumber(5, 10);
  for (let i = 0; i < numRecruits; i++) {
    const randomPosition: Position = getRandomItem(['C', 'LW', 'RW', 'LD', 'RD', 'G']);
    const recruit = generatePlayer(usedJerseyNumbers, randomPosition, leagueDivision, 'Recruit Pool', ['UG Year 1', 'UG Year 2', 'UG Year 3', 'UG Year 4']);
    recruit.recruitmentCost = getRandomNumber(500, 2000);
    recruit.source = getRandomItem(['Local', 'International']);
    recruit.estimatedQuality = getRandomItem(['Beginner', 'Moderate', 'Intermediate', 'Experienced', 'Elite']);
    recruits.push(recruit);
  }
  return recruits;
};