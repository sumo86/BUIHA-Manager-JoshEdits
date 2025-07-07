import { Player, Position, PlayerArchetype, SkaterAttributes, GoalieAttributes } from "@/types";
import { archetypes } from "@/data/archetypes";

const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Emily", "Hannah", "Megan", "Lauren", "Jessica", "Sophie", "Olivia", "Charlotte", "Chloe", "Amy"];
const lastNames = ["Smith", "Jones", "Williams", "Brown", "Taylor", "Davies", "Wilson", "Evans", "Thomas", "Johnson", "Roberts", "Walker", "Wright", "Thompson", "White", "Green", "Hall", "Wood", "Harris", "Martin"];
const nationalities = ["British", "Canadian", "American", "Swedish", "Finnish", "Czech", "Slovak", "German", "Swiss", "Latvian"];
const eligibilities: Player['eligibility'][] = ["UG Year 1", "UG Year 2", "UG Year 3", "UG Year 4 (Masters)", "PhD", "Alumni"];
const skaterPositions: Position[] = ["C", "LW", "RW", "LD", "RD"];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getArchetypeForPosition = (position: Position): PlayerArchetype => {
    let positionGroup: PlayerArchetype['position'];
    if (['LD', 'RD'].includes(position)) positionGroup = 'Defenceman';
    else if (position === 'C') positionGroup = 'Centre';
    else if (['LW', 'RW'].includes(position)) positionGroup = 'Winger';
    else positionGroup = 'Goaltender';

    const possibleArchetypes = archetypes.filter(a => a.position === positionGroup);
    return getRandomItem(possibleArchetypes);
};

const generateAttributes = (archetype: PlayerArchetype): SkaterAttributes | GoalieAttributes => {
    const base = () => 1 + Math.floor(Math.random() * 10); // 1-10 base
    const clamp = (value: number) => Math.max(1, Math.min(20, Math.round(value)));

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


const generatePlayer = (usedJerseyNumbers: Set<number>, position: Position): Player => {
  let jerseyNumber: number;
  do {
    jerseyNumber = Math.floor(Math.random() * 98) + 1;
  } while (usedJerseyNumbers.has(jerseyNumber));
  usedJerseyNumbers.add(jerseyNumber);

  const primaryPosition = position;
  const positions: Position[] = [primaryPosition];

  if (primaryPosition !== 'G') {
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
  const attributes = generateAttributes(archetype);

  return {
    id: crypto.randomUUID(),
    jerseyNumber,
    name: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
    age: Math.floor(Math.random() * (28 - 18 + 1)) + 18,
    nationality: getRandomItem(nationalities),
    positions,
    starRating: Math.floor(Math.random() * 5) + 1,
    morale: "Content",
    healthStatus: "Healthy",
    eligibility: getRandomItem(eligibilities),
    archetype,
    attributes,
  };
};

export const generateRoster = (): Player[] => {
  const roster: Player[] = [];
  const usedJerseyNumbers = new Set<number>();

  roster.push(generatePlayer(usedJerseyNumbers, "G"));
  roster.push(generatePlayer(usedJerseyNumbers, "G"));

  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "LD"));
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, "RD"));
  
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, "C"));
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, "LW"));
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "RW"));

  return roster.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
};