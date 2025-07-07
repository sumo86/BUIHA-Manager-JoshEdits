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
    const base = () => 40 + Math.floor(Math.random() * 35); // 40-74

    if (archetype.position === 'Goaltender') {
        const attributes: GoalieAttributes = {
            gloveHigh: base(),
            gloveLow: base(),
            stickHigh: base(),
            stickLow: base(),
            fiveHole: base(),
            positioning: base() + 10,
            reboundControl: base(),
            puckHandling: archetype.physicality === 'Puckhandler' ? base() + 15 : base(),
        };
        return attributes;
    } 
    
    const attributes: SkaterAttributes = {
        skating: base(),
        shooting: base(),
        passing: base(),
        puckControl: base(),
        defensiveAwareness: base(),
        stickChecking: base(),
        bodyChecking: base(),
        strength: base(),
        aggressiveness: base(),
        hockeyIQ: base(),
    };

    // Apply type-based modifiers
    if (archetype.type.includes('Offensive') || archetype.type.includes('Goalscorer')) attributes.shooting += 15;
    if (archetype.type.includes('Playmaker')) attributes.passing += 15;
    if (archetype.type.includes('Two-Way')) {
        attributes.shooting += 5;
        attributes.passing += 5;
        attributes.defensiveAwareness += 10;
    }
    if (archetype.type.includes('Defensive') || archetype.type.includes('Checking')) {
        attributes.defensiveAwareness += 15;
        attributes.stickChecking += 10;
    }
    if (archetype.type === 'Enforcer') {
        attributes.shooting -= 20;
        attributes.passing -= 20;
        attributes.puckControl -= 20;
        attributes.bodyChecking += 25;
        attributes.aggressiveness += 25;
    }

    // Apply physicality-based modifiers
    if (archetype.physicality === 'Physical') {
        attributes.bodyChecking += 15;
        attributes.strength += 10;
        attributes.aggressiveness += 10;
    } else if (archetype.physicality === 'Non-Physical') {
        attributes.bodyChecking -= 10;
        attributes.strength -= 5;
        attributes.aggressiveness -= 10;
    }

    // Clamp attributes between 20 and 99
    for (const key in attributes) {
        const attrKey = key as keyof SkaterAttributes;
        if (attributes[attrKey] > 99) attributes[attrKey] = 99;
        if (attributes[attrKey] < 20) attributes[attrKey] = 20;
    }

    return attributes;
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