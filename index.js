import express from "express";
import fetch from "node-fetch";


const app = express();
const PORT = 4001;

// Tu usuario de Anilist para marcar favoritos (puedes cambiar por AniList si quieres)
const USER_ID = "7671831";

// ----------------------
// Helpers
// ----------------------

// Obtener tu biblioteca de usuario
async function getUserLibrary(userId) {
  const query = `
    query ($userId: Int!) {
      MediaListCollection(userId: $userId, type: ANIME) {
        lists {
          name
          entries {
            status
            score
            progress
            media {
              id
              title {
                romaji
                english
              }
              episodes
              coverImage {
                large
              }
              nextAiringEpisode {
                episode
                airingAt
              }
            }
          }
        }
      }
    }
  `
  try {
    const res = await 
      fetch(`https://graphql.anilist.co`, 
      {
        method: "POST",
        headers:  {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { userId }
        })
      });

    const json = await res.json();

    //console.log("Respuesta AniList:", JSON.stringify(json, null, 2));

    if (!json.data || !json.data.MediaListCollection) {
      console.error("La librería es privada o no existe.");
      return [];
    }
    return json.data.MediaListCollection.lists;
  } catch (err) {
    console.error("Error biblioteca Anilist:", err);
    return [];
  }
}

// const library = await getUserLibrary(7671831);
// console.log(library);


// Obtener animes en emisión desde AniList
async function getCurrentAnimeAniList() {
  const query = `
    query WeeklyAiring {
      Page(perPage: 50) {
        media(type: ANIME, status: RELEASING, sort: SCORE_DESC) {
          id
          title { romaji english }
          meanScore
          episodes
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
    if (!json.data?.Page?.media) return [];
    return json.data.Page.media;
  } catch (err) {
    console.error("Error obteniendo animes en emisión", err);
    return [];
  }
}

const debug = getCurrentAnimeAniList()

function splitWeeklyAnimes(weekly, libraryLists, minScore = 80) {
  const libraryIds = new Set(
    libraryLists.flatMap(list =>
      list.entries.map(entry => entry.media.id)
    )
  );

  const inLibrary = [];
  const topNotInLibrary = [];

  for (const anime of weekly) {
    if (libraryIds.has(anime.id)) {
      inLibrary.push(anime);
    } else if (anime.meanScore >= minScore) {
      topNotInLibrary.push(anime);
    }
  }

  return { inLibrary, topNotInLibrary };
}


// ----------------------
// Generar calendario semanal
// ----------------------
function groupByWeekday(animes) {
  const days = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [],
    Friday: [], Saturday: [], Sunday: []
  };

  // Agrupa los animes por día
  animes.forEach(anime => {
    if (!anime.nextAiringEpisode) return;

    const date = new Date(anime.nextAiringEpisode.airingAt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    if (!days[dayName]) return;

    days[dayName].push({
      id: anime.id,
      title: anime.title.english || anime.title.romaji,
      poster: anime.coverImage?.medium || null,
      nextEpisode: anime.nextAiringEpisode.episode,
      nextRelease: date.toISOString(),
      recommended: anime.recommended
    });
  });

  // Ordena y limita a 3 por día
  Object.keys(days).forEach(day => {
    days[day].sort((a, b) => {
      // Primero favoritos, luego recomendados
      if (a.recommended !== b.recommended) return a.recommended ? 1 : -1;
      // Dentro de cada grupo, ordenar por fecha de emisión
      return new Date(a.nextRelease) - new Date(b.nextRelease);
    });

    // Limitar a 3 animes por día
    days[day] = days[day].slice(0, 3);
  });

  return days;
}



// ----------------------
// Endpoint
// ----------------------
app.get("/weekly-anime", async (req, res) => {
  try {
    const libraryLists = await getUserLibrary(USER_ID);
    const weekly = await getCurrentAnimeAniList();

    const { inLibrary, topNotInLibrary } = splitWeeklyAnimes(
      weekly,
      libraryLists,
      80
    );

    // Mezclar y marcar recommended
    const combined = [
      ...inLibrary.map(a => ({ ...a, recommended: false })),
      ...topNotInLibrary.map(a => ({ ...a, recommended: true }))
    ];

    const grouped = groupByWeekday(combined);

    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo calendario semanal" });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
