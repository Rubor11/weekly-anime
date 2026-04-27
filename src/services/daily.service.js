export function getTodayTop5(combined) {
  const today = new Date().getDay();

  const enriched = combined
    .filter(a => a.nextAiringEpisode?.airingAt)
    .map(a => ({
      anime: a,
      time: a.nextAiringEpisode.airingAt * 1000
    }));

  const sameDay = enriched
    .filter(x => new Date(x.time).getDay() === today)
    .map(x => x.anime);

  const sortedAllByTime = enriched
    .sort((a, b) => a.time - b.time)
    .map(x => x.anime);

  const result = [...sameDay];

  for (const anime of sortedAllByTime) {
    if (result.length >= 5) break;
    if (!result.find(a => a.id === anime.id)) {
      result.push(anime);
    }
  }

  return result.slice(0, 5);
}

export function formatHomepage(animes) {
  return {
    data: animes.map(anime => {
      const date = new Date(anime.nextAiringEpisode.airingAt * 1000);

      return {
        id: anime.title?.english || anime.title?.romaji,
        ip_address:
          `Ep ${anime.nextAiringEpisode.episode} · ` +
          date.toLocaleString("es-ES", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })
      };
    })
  };
}