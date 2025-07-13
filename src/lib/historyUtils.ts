import { Team, Player, LegacyRecord, TeamRecord, RecordCategory } from '@/types';
import { getOrganizationName } from '@/data/teams';

type AllRecords = {
  season: { [key in RecordCategory]?: TeamRecord };
  career: { [key in RecordCategory]?: TeamRecord };
};

const skaterCategories: RecordCategory[] = ['Goals', 'Assists', 'Points', 'PenaltyMinutes'];
const goalieCategories: RecordCategory[] = ['GAA', 'SavePercentage', 'Shutouts'];

export const processHistory = (teams: Team[], legacyRecords: LegacyRecord[]): AllRecords => {
  const allRecords: AllRecords = {
    season: {},
    career: {},
  };

  const orgNameMap = new Map<string, string>();
  teams.forEach(team => {
    orgNameMap.set(team.name, getOrganizationName(team.name));
  });

  // Process current player histories
  teams.forEach(team => {
    team.roster.forEach(player => {
      const isSkater = !player.positions.includes('G');
      const categories = isSkater ? skaterCategories : goalieCategories;
      
      const careerSkaterStats: { [key: string]: number } = { Goals: 0, Assists: 0, Points: 0, PenaltyMinutes: 0 };
      const careerGoalieStats = { Shutouts: 0, GamesPlayed: 0, totalGAAxGP: 0, totalSVxGP: 0 };

      player.history.forEach(season => {
        // Season records
        categories.forEach(category => {
          const key = category.toLowerCase() as keyof typeof season;
          const value = season[key as 'goals' | 'assists' | 'points' | 'penaltyMinutes' | 'goalsAgainstAverage' | 'savePercentage' | 'shutouts'];
          if (typeof value !== 'number') return;

          const currentRecord = allRecords.season[category];
          const isBetter = category === 'GAA' ? value < (currentRecord?.value ?? Infinity) : value > (currentRecord?.value ?? -1);

          if (!currentRecord || isBetter) {
            allRecords.season[category] = {
              playerName: player.name,
              teamName: season.team,
              value: value,
              season: season.season,
            };
          }
        });

        // Aggregate career stats
        if (isSkater) {
          careerSkaterStats.Goals += season.goals ?? 0;
          careerSkaterStats.Assists += season.assists ?? 0;
          careerSkaterStats.Points += season.points ?? 0;
          careerSkaterStats.PenaltyMinutes += season.penaltyMinutes ?? 0;
        } else { // Goalie
          careerGoalieStats.Shutouts += season.shutouts ?? 0;
          if (season.goalsAgainstAverage && season.gamesPlayed > 0) {
            careerGoalieStats.totalGAAxGP += season.goalsAgainstAverage * season.gamesPlayed;
          }
          if (season.savePercentage && season.gamesPlayed > 0) {
            careerGoalieStats.totalSVxGP += season.savePercentage * season.gamesPlayed;
          }
          careerGoalieStats.GamesPlayed += season.gamesPlayed;
        }
      });

      // Set career records from current players
      if (isSkater) {
        skaterCategories.forEach(category => {
            const value = careerSkaterStats[category];
            const currentRecord = allRecords.career[category];
            if (!currentRecord || value > currentRecord.value) {
                allRecords.career[category] = {
                    playerName: player.name,
                    teamName: team.name,
                    value: value,
                };
            }
        });
      } else { // Goalie
        // Require a minimum of 5 games for career goalie rate stats
        if (careerGoalieStats.GamesPlayed > 5) {
            const careerGAA = careerGoalieStats.totalGAAxGP / careerGoalieStats.GamesPlayed;
            const careerSV = careerGoalieStats.totalSVxGP / careerGoalieStats.GamesPlayed;

            // GAA (lower is better)
            const currentGaaRecord = allRecords.career.GAA;
            if (!currentGaaRecord || careerGAA < currentGaaRecord.value) {
                allRecords.career.GAA = {
                    playerName: player.name,
                    teamName: team.name,
                    value: careerGAA,
                };
            }

            // Save Percentage (higher is better)
            const currentSvRecord = allRecords.career.SavePercentage;
            if (!currentSvRecord || careerSV > currentSvRecord.value) {
                allRecords.career.SavePercentage = {
                    playerName: player.name,
                    teamName: team.name,
                    value: careerSV,
                };
            }
        }
        // Shutouts (higher is better)
        const currentShutoutRecord = allRecords.career.Shutouts;
        if (!currentShutoutRecord || careerGoalieStats.Shutouts > currentShutoutRecord.value) {
            allRecords.career.Shutouts = {
                playerName: player.name,
                teamName: team.name,
                value: careerGoalieStats.Shutouts,
            };
        }
      }
    });
  });

  // Process legacy records, potentially overwriting current player records
  legacyRecords.forEach(record => {
    const recordOrgName = getOrganizationName(record.teamName);
    const isRelevant = teams.some(t => orgNameMap.get(t.name) === recordOrgName);

    if (isRelevant) {
      const recordType = record.type;
      const category = record.category;
      const currentRecord = allRecords[recordType][category];
      const isBetter = category === 'GAA' ? record.value < (currentRecord?.value ?? Infinity) : record.value > (currentRecord?.value ?? -1);

      if (!currentRecord || isBetter) {
        allRecords[recordType][category] = {
          playerName: record.playerName,
          teamName: record.teamName,
          value: record.value,
          season: record.season,
        };
      }
    }
  });

  // Sanity check: A career record for a skater cannot be lower than the best single-season record.
  skaterCategories.forEach(category => {
    const seasonRecord = allRecords.season[category];
    const careerRecord = allRecords.career[category];

    if (seasonRecord && careerRecord && seasonRecord.value > careerRecord.value) {
        allRecords.career[category] = {
            playerName: seasonRecord.playerName,
            teamName: seasonRecord.teamName,
            value: seasonRecord.value,
        };
    }
  });

  return allRecords;
};