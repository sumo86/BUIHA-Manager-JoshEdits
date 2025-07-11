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
      const careerStats: { [key: string]: number } = { Goals: 0, Assists: 0, Points: 0, PenaltyMinutes: 0, Shutouts: 0, GamesPlayed: 0 };
      let totalGoalsAgainst = 0;
      let totalSaves = 0;
      let totalShotsAgainst = 0;

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
          careerStats.Goals += season.goals ?? 0;
          careerStats.Assists += season.assists ?? 0;
          careerStats.Points += season.points ?? 0;
          careerStats.PenaltyMinutes += season.penaltyMinutes ?? 0;
        } else {
          careerStats.Shutouts += season.shutouts ?? 0;
          if (season.goalsAgainstAverage && season.gamesPlayed > 0) {
            // Approximate goals against from GAA
            const goalsAgainstInSeason = (season.goalsAgainstAverage * season.gamesPlayed * 60) / 60; // Simplified
            totalGoalsAgainst += goalsAgainstInSeason;
          }
          if (season.savePercentage && season.gamesPlayed > 0) {
             // Cannot accurately reverse-engineer total saves/shots, so we'll use GAA and Shutouts for goalies
          }
        }
        careerStats.GamesPlayed += season.gamesPlayed;
      });

      // Career records
      if (isSkater) {
        skaterCategories.forEach(category => {
            const value = careerStats[category];
            const currentRecord = allRecords.career[category];
            if (!currentRecord || value > currentRecord.value) {
                allRecords.career[category] = {
                    playerName: player.name,
                    teamName: team.name,
                    value: value,
                };
            }
        });
      } else {
        // For goalies, we'll just use shutouts for career as GAA/SV% aren't simple sums
        const currentRecord = allRecords.career.Shutouts;
        if (!currentRecord || careerStats.Shutouts > currentRecord.value) {
            allRecords.career.Shutouts = {
                playerName: player.name,
                teamName: team.name,
                value: careerStats.Shutouts,
            };
        }
      }
    });
  });

  // Process legacy records
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

  return allRecords;
};