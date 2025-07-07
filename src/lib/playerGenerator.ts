import { Player, Position } from "@/types";

const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Emily", "Hannah", "Megan", "Lauren", "Jessica", "Sophie", "Olivia", "Charlotte", "Chloe", "Amy"];
const lastNames = ["Smith", "Jones", "Williams", "Brown", "Taylor", "Davies", "Wilson", "Evans", "Thomas", "Johnson", "Roberts", "Walker", "Wright", "Thompson", "White", "Green", "Hall", "Wood", "Harris", "Martin"];
const nationalities = ["British", "Canadian", "American", "Swedish", "Finnish", "Czech", "Slovak", "German", "Swiss", "Latvian"];
const eligibilities: Player['eligibility'][] = ["UG Year 1", "UG Year 2", "UG Year 3", "UG Year 4 (Masters)", "PhD", "Alumni"];
const skaterPositions: Position[] = ["C", "LW", "RW", "LD", "RD"];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generatePlayer = (usedJerseyNumbers: Set<number>, position: Position): Player => {
  let jerseyNumber: number;
  do {
    jerseyNumber = Math.floor(Math.random() * 98) + 1;
  } while (usedJerseyNumbers.has(jerseyNumber));
  usedJerseyNumbers.add(jerseyNumber);

  const primaryPosition = position;
  const positions: Position[] = [primaryPosition];

  if (primaryPosition !== 'G') {
    // 50% chance of a secondary position
    if (Math.random() > 0.5) {
      let secondaryPosition: Position;
      do {
        secondaryPosition = getRandomItem(skaterPositions);
      } while (positions.includes(secondaryPosition));
      positions.push(secondaryPosition);
    }
    // 20% chance of a tertiary position
    if (positions.length === 2 && Math.random() > 0.8) {
        let tertiaryPosition: Position;
        do {
            tertiaryPosition = getRandomItem(skaterPositions);
        } while (positions.includes(tertiaryPosition));
        positions.push(tertiaryPosition);
    }
  }


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
  };
};

export const generateRoster = (): Player[] => {
  const roster: Player[] = [];
  const usedJerseyNumbers = new Set<number>();

  // 2 Goalies
  roster.push(generatePlayer(usedJerseyNumbers, "G"));
  roster.push(generatePlayer(usedJerseyNumbers, "G"));

  // 7 Defencemen
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "LD"));
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, "RD"));
  
  // 11 Forwards
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, "C"));
  for (let i = 0; i < 4; i++) roster.push(generatePlayer(usedJerseyNumbers, "LW"));
  for (let i = 0; i < 3; i++) roster.push(generatePlayer(usedJerseyNumbers, "RW"));

  return roster.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
};