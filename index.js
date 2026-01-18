import express from "express";
import fetch from "node-fetch";


const app = express();
const PORT = 4001;

// Tu usuario de Kitsu para marcar favoritos (puedes cambiar por AniList si quieres)
const USER_ID = "1674231";

// ----------------------
// Helpers
// ----------------------

// Obtener tu biblioteca de Kitsu
async function getUserLibrary() {
  try {
    const res = await fetch(`https://kitsu.io/api/edge/users/${USER_ID}/library-entries?filter[kind]=anime&page[limit]=100`);
    const json = await res.json();
    if (!json.data) return [];
    return json.data.map(entry => entry.relationships.anime?.data?.id);
  } catch (err) {
    console.error("Error biblioteca Kitsu:", err);
    return [];
  }
}

// Obtener animes en emisión desde AniList
async function getCurrentAnimeAniList(page = 1) {
  const query = `
    query WeeklyAiring($page: Int) {
      Page(page: $page, perPage: 50) {
        media(type: ANIME, status: RELEASING) {
          id
          title { romaji english }
          coverImage { medium }
          nextAiringEpisode { airingAt episode }
        }
      }
    }
  `;

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { page } })
  });

  const json = await res.json();
  if (!json.data?.Page?.media) return [];
  return json.data.Page.media;
}

// ----------------------
// Generar calendario semanal
// ----------------------
function groupByWeekday(animes, libraryIds) {
  const days = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [],
    Friday: [], Saturday: [], Sunday: []
  };

  animes.forEach(anime => {
    if (!anime.nextAiringEpisode) return; // solo los que tienen próximo episodio
    const date = new Date(anime.nextAiringEpisode.airingAt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    if (!days[dayName]) return;

    const isFollowed = libraryIds.includes(String(anime.id));
    days[dayName].push({
      id: anime.id,
      title: anime.title.english || anime.title.romaji,
      poster: anime.coverImage?.medium || null,
      nextEpisode: anime.nextAiringEpisode.episode,
      nextRelease: date.toISOString(),
      isFollowed
    });
  });

  // Ordenar por favoritos primero
  Object.keys(days).forEach(day => {
    days[day].sort((a, b) => (b.isFollowed ? 1 : 0) - (a.isFollowed ? 1 : 0));
  });

  return days;
}

// ----------------------
// Endpoint
// ----------------------
app.get("/weekly-anime", async (req, res) => {
  try {
    const libraryIds = await getUserLibrary();
    const currentAnime = await getCurrentAnimeAniList();
    const weekly = groupByWeekday(currentAnime, libraryIds);
    res.json(weekly);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo calendario semanal" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
