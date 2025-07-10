// Mapping from full division names in the data to a tier ID
export const divisionToTierMap: { [key: string]: number } = {
    "BUIHA Checking 1": 1,
    "BUIHA Checking 2": 2,
    "BUIHA Non-Checking 1": 3,
    "BUIHA Non-Checking 2 - North": 4,
    "BUIHA Non-Checking 2 - South": 4,
    "BUIHA Non-Checking 3": 5,
};

type StarBand = { stars: number; min: number; max: number };

// Data transcribed from user's CSV for skaters, with goalie stats derived.
export const starRatingBands: { skater: Record<number, StarBand[]>; goalie: Record<number, StarBand[]> } = {
    skater: {
        1: [ // Checking 1
            { stars: 1, min: 0, max: 244 }, { stars: 1.5, min: 245, max: 264 }, { stars: 2, min: 265, max: 284 },
            { stars: 2.5, min: 285, max: 314 }, { stars: 3, min: 315, max: 354 }, { stars: 3.5, min: 355, max: 394 },
            { stars: 4, min: 395, max: 434 }, { stars: 4.5, min: 435, max: 463 }, { stars: 5, min: 464, max: 999 }
        ],
        2: [ // Checking 2
            { stars: 1, min: 0, max: 226 }, { stars: 1.5, min: 227, max: 236 }, { stars: 2, min: 237, max: 246 },
            { stars: 2.5, min: 247, max: 261 }, { stars: 3, min: 262, max: 276 }, { stars: 3.5, min: 277, max: 291 },
            { stars: 4, min: 292, max: 306 }, { stars: 4.5, min: 307, max: 321 }, { stars: 5, min: 322, max: 999 }
        ],
        3: [ // Non-Checking 1
            { stars: 1, min: 0, max: 208 }, { stars: 1.5, min: 209, max: 218 }, { stars: 2, min: 219, max: 228 },
            { stars: 2.5, min: 229, max: 238 }, { stars: 3, min: 239, max: 248 }, { stars: 3.5, min: 249, max: 258 },
            { stars: 4, min: 259, max: 268 }, { stars: 4.5, min: 269, max: 278 }, { stars: 5, min: 279, max: 999 }
        ],
        4: [ // Non-Checking 2
            { stars: 1, min: 0, max: 182 }, { stars: 1.5, min: 183, max: 192 }, { stars: 2, min: 193, max: 202 },
            { stars: 2.5, min: 203, max: 217 }, { stars: 3, min: 218, max: 226 }, { stars: 3.5, min: 227, max: 236 },
            { stars: 4, min: 237, max: 244 }, { stars: 4.5, min: 245, max: 256 }, { stars: 5, min: 257, max: 999 }
        ],
        5: [ // Non-Checking 3
            { stars: 1, min: 0, max: 170 }, { stars: 1.5, min: 171, max: 180 }, { stars: 2, min: 181, max: 190 },
            { stars: 2.5, min: 191, max: 200 }, { stars: 3, min: 201, max: 210 }, { stars: 3.5, min: 211, max: 220 },
            { stars: 4, min: 221, max: 230 }, { stars: 4.5, min: 231, max: 240 }, { stars: 5, min: 241, max: 999 }
        ]
    },
    goalie: {
        1: [ // Checking 1
            { stars: 1, min: 0, max: 113 }, { stars: 1.5, min: 114, max: 123 }, { stars: 2, min: 124, max: 132 },
            { stars: 2.5, min: 133, max: 146 }, { stars: 3, min: 147, max: 165 }, { stars: 3.5, min: 166, max: 183 },
            { stars: 4, min: 184, max: 202 }, { stars: 4.5, min: 203, max: 215 }, { stars: 5, min: 216, max: 999 }
        ],
        2: [ // Checking 2
            { stars: 1, min: 0, max: 105 }, { stars: 1.5, min: 106, max: 110 }, { stars: 2, min: 111, max: 114 },
            { stars: 2.5, min: 115, max: 121 }, { stars: 3, min: 122, max: 128 }, { stars: 3.5, min: 129, max: 135 },
            { stars: 4, min: 136, max: 142 }, { stars: 4.5, min: 143, max: 149 }, { stars: 5, min: 150, max: 999 }
        ],
        3: [ // Non-Checking 1
            { stars: 1, min: 0, max: 97 }, { stars: 1.5, min: 98, max: 101 }, { stars: 2, min: 102, max: 106 },
            { stars: 2.5, min: 107, max: 111 }, { stars: 3, min: 112, max: 115 }, { stars: 3.5, min: 116, max: 120 },
            { stars: 4, min: 121, max: 125 }, { stars: 4.5, min: 126, max: 130 }, { stars: 5, min: 131, max: 999 }
        ],
        4: [ // Non-Checking 2
            { stars: 1, min: 0, max: 85 }, { stars: 1.5, min: 86, max: 89 }, { stars: 2, min: 90, max: 94 },
            { stars: 2.5, min: 95, max: 101 }, { stars: 3, min: 102, max: 105 }, { stars: 3.5, min: 106, max: 110 },
            { stars: 4, min: 111, max: 113 }, { stars: 4.5, min: 114, max: 119 }, { stars: 5, min: 120, max: 999 }
        ],
        5: [ // Non-Checking 3
            { stars: 1, min: 0, max: 79 }, { stars: 1.5, min: 80, max: 84 }, { stars: 2, min: 85, max: 88 },
            { stars: 2.5, min: 89, max: 93 }, { stars: 3, min: 94, max: 98 }, { stars: 3.5, min: 99, max: 102 },
            { stars: 4, min: 103, max: 107 }, { stars: 4.5, min: 108, max: 112 }, { stars: 5, min: 113, max: 999 }
        ]
    }
};

export const calculateStarRating = (currentAbility: number, isSkater: boolean, leagueDivision: string): number => {
    const tierId = divisionToTierMap[leagueDivision] || 5;
    const playerType = isSkater ? 'skater' : 'goalie';
    const bands = starRatingBands[playerType][tierId];

    for (const band of bands) {
        if (currentAbility >= band.min && currentAbility <= band.max) {
            return band.stars;
        }
    }
    return 1; // Default to 1 star if something goes wrong
};