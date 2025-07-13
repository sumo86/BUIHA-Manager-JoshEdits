import { LegacyRecord } from '@/types';

export const legacyRecords: LegacyRecord[] = [
  // Edinburgh Eagles
  {
    playerName: "Angus MacLeod",
    teamName: "Edinburgh Eagles",
    category: "Points",
    type: "career",
    value: 250,
  },
  {
    playerName: "Fiona Campbell",
    teamName: "Edinburgh Eagles",
    category: "Goals",
    type: "season",
    value: 45,
    season: "2010-2011"
  },
  // London Dragons
  {
    playerName: "James Smith",
    teamName: "London Dragons",
    category: "Assists",
    type: "career",
    value: 180,
  },
  // Sheffield Bears
  {
    playerName: "Ben Carter",
    teamName: "Sheffield Bears",
    category: "SavePercentage",
    type: "season",
    value: 0.945,
    season: "2014-2015"
  },
  // Nottingham Mavericks
  {
    playerName: "Olivia Green",
    teamName: "Nottingham Mavericks",
    category: "Shutouts",
    type: "career",
    value: 22,
  },
  // Oxford University
  {
    playerName: "William Darcy",
    teamName: "Oxford University Blues",
    category: "PenaltyMinutes",
    type: "career",
    value: 350,
  },
  // Cambridge University
  {
    playerName: "Eleanor Vance",
    teamName: "Cambridge Blues",
    category: "GAA",
    type: "season",
    value: 1.88,
    season: "2018-2019"
  }
];