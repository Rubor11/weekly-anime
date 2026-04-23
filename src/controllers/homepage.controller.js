import { getOnePieceCache } from "../services/onePiece.service.js";

export async function getOnePiece(req, res) {
  try {
    const data = await getOnePieceCache();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo One Piece" });
  }
}