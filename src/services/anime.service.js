import fetch from "node-fetch";

export async function getUserLibrary(userId) {
  const query = `
    query ($userId: Int!) {
      MediaListCollection(userId: $userId, type: ANIME) {
        lists {
          entries {
            media { id }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { userId } })
    });

    const json = await res.json();
    return json.data?.MediaListCollection?.lists || [];
  } catch {
    return [];
  }
}

export async function getCurrentAnime() {
  const query = `
    query {
      Page(perPage: 50) {
        media(type: ANIME, status: RELEASING, sort: SCORE_DESC) {
          id
          title { romaji english }
          meanScore
          coverImage { medium }
          nextAiringEpisode { airingAt episode }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const json = await res.json();
    return json.data?.Page?.media || [];
  } catch {
    return [];
  }
}

export function splitWeeklyAnimes(weekly, libraryLists, minScore = 80) {
  const libraryIds = new Set(
    libraryLists.flatMap(l => l.entries.map(e => e.media.id))
  );

  const inLibrary = [];
  const topNotInLibrary = [];

  for (const anime of weekly) {
    if (libraryIds.has(anime.id)) {
      inLibrary.push(anime);
    } else if ((anime.meanScore || 0) >= minScore) {
      topNotInLibrary.push(anime);
    }
  }

  return { inLibrary, topNotInLibrary };
}