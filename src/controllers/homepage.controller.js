import { getOnePieceCache } from "../services/onePiece.service.js";
import {
  getUserLibrary,
  getCurrentAnime,
  splitWeeklyAnimes
} from "../services/anime.service.js";

import {
  getTodayTop5,
  formatHomepage
} from "../services/daily.service.js";

const USER_ID = "7671831";


// /hompage/one-piece
export async function getOnePiece(req, res) {
  try {
    const data = await getOnePieceCache();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo One Piece" });
  }
}

// /homepage/daily
export async function getHomepageDaily(req, res) {
  try {
    const library = await getUserLibrary(USER_ID);
    const weekly = await getCurrentAnime();

    const { inLibrary, topNotInLibrary } =
      splitWeeklyAnimes(weekly, library);

    const combined = [
      ...inLibrary.map(a => ({ ...a, recommended: false })),
      ...topNotInLibrary.map(a => ({ ...a, recommended: true }))
    ];

    const todayTop5 = getTodayTop5(combined);
    const result = formatHomepage(todayTop5);

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "daily error" });
  }
}