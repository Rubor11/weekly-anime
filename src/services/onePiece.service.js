import fetch from "node-fetch";

let onePieceCache = {
  chapter: null,
  title: null,
  publishAt: null,
  lastUpdate: null,
};

async function updateOnePiece() {
  try {
    const mangaId = "a1c7c817-4e59-43b7-9365-09675a149a6f";
    const languages = ["es", "en", "any"];

    let chapter = null;

    for (const lang of languages) {
      let url;

      if (lang === "any") {
        url = `https://api.mangadex.org/manga/${mangaId}/feed?limit=1&order[chapter]=desc`;
      } else {
        url = `https://api.mangadex.org/manga/${mangaId}/feed?limit=1&order[chapter]=desc&translatedLanguage[]=${lang}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.data?.length) {
        chapter = json.data[0];
        break;
      }
    }

    if (!chapter) return;

    onePieceCache = {
      chapter: chapter.attributes.chapter,
      title: chapter.attributes.title || null,
      publishAt: chapter.attributes.publishAt,
      readerUrl: `https://one-piece-fans2.com/manga/es/todos/${chapter.attributes.chapter}`,
      externalUrl: chapter.attributes.externalUrl || null,
      lastUpdate: new Date().toISOString(),
    };

  } catch (err) {
    console.error(err);
  }
}

// actualización automática
updateOnePiece();
setInterval(updateOnePiece, 60 * 60 * 1000);

// acceso controlado
export async function getOnePieceCache() {
  if (!onePieceCache.chapter) {
    await updateOnePiece();
  }
  return onePieceCache;
}