export type LeaderboardRow = {
  name: string;
  score: number;
  timeSpentSeconds: number;
  createdAt: number;
};

const key = (quizId: string) => `leaderboard:${quizId}`;

export function readLeaderboard(quizId: string): LeaderboardRow[] {
  const raw = localStorage.getItem(key(quizId));
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw) as LeaderboardRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeLeaderboard(quizId: string, rows: LeaderboardRow[]) {
  localStorage.setItem(key(quizId), JSON.stringify(rows));
}

export function upsertLeaderboardRow(quizId: string, row: LeaderboardRow) {
  const rows = readLeaderboard(quizId);

  const better = (a: LeaderboardRow, b: LeaderboardRow) => {
    if (a.score !== b.score) return a.score > b.score;
    return a.timeSpentSeconds < b.timeSpentSeconds;
  };

  const i = rows.findIndex((r) => r.name === row.name);
  if (i >= 0) {
    rows[i] = better(row, rows[i]) ? row : rows[i];
  } else {
    rows.push(row);
  }

  rows.sort((x, y) => {
    if (y.score !== x.score) return y.score - x.score;
    return x.timeSpentSeconds - y.timeSpentSeconds;
  });

  writeLeaderboard(quizId, rows.slice(0, 50));
}
