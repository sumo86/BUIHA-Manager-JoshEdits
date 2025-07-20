import { SkaterAttributes, GoalieAttributes, TrainingFocus } from "@/types";

export const trainingFocusesMap: { [key: string]: (keyof SkaterAttributes | keyof GoalieAttributes)[] } = {
    "Skating": ["acceleration", "agility", "balance", "speed", "skating"],
    "Shooting": ["shootingAccuracy", "shootingRange", "gettingOpen"],
    "Playmaking": ["passing", "puckhandling", "offensiveRead"],
    "Defense": ["checking", "defensiveRead", "positioning", "shotBlocking", "stickchecking", "pokeCheck"],
    "Physical": ["strength", "stamina", "fighting", "hitting", "aggression", "bravery"],
    "Mental": ["determination", "leadership", "professionalism", "teamPlayer", "temperament", "mentalToughness"],
    "Goaltending": ["blocker", "glove", "lowShots", "positioning", "rebound", "recovery", "reflexes", "goaltenderStamina"]
};

export const skaterFocuses: TrainingFocus[] = ["Skating", "Shooting", "Playmaking", "Defense", "Physical", "Mental"];
export const goalieFocuses: TrainingFocus[] = ["Goaltending", "Mental"];