import { LegacyRecord } from '@/types';

export const legacyRecords: LegacyRecord[] = [
  // Edinburgh Eagles
  {
    playerName: "Angus MacLeod",
    teamName: "Edinburgh Eagles",
    category: "Points",
    type: "career",
    value: 850, // Adjusted from 250 to a more realistic career points record
  },
  {
    playerName: "Fiona Campbell",
    teamName: "Edinburgh Eagles",
    category: "Goals",
    type: "season",
    value: 68, // Adjusted from 45 to a more realistic single-season goals record
    season: "2010-2011"
  },
  // London Dragons
  {
    playerName: "James Smith",
    teamName: "London Dragons",
    category: "Assists",
    type: "career",
    value: 520, // Adjusted from 180 to a more realistic career assists record
  },
  // Sheffield Bears
  {
    playerName: "Ben Carter",
    teamName: "Sheffield Bears",
    category: "SavePercentage",
    type: "season",
    value: 0.938, // Adjusted from 0.945 to a slightly more realistic elite save percentage
    season: "2014-2015"
  },
  // Nottingham Mavericks
  {
    playerName: "Olivia Green",
    teamName: "Nottingham Mavericks",
    category: "Shutouts",
    type: "career",
    value: 35, // Adjusted from 22 to a more impressive career shutouts record
  },
  // Oxford University
  {
    playerName: "William Darcy",
    teamName: "Oxford University Blues",
    category: "PenaltyMinutes",
    type: "career",
    value: 600, // Adjusted from 350 to a higher, but believable, career penalty minutes record
  },
  // Cambridge University
  {
    playerName: "Eleanor Vance",
    teamName: "Cambridge Blues",
    category: "GAA",
    type: "season",
    value: 1.75, // Adjusted from 1.88 (lower is better for GAA)
    season: "2018-2019"
  }
];