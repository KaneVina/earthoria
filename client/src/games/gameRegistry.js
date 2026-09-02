import { Grid3x3, Link2, Search, Timer } from "lucide-react";

import MemoryMatchEditor from "./editors/MemoryMatchEditor";
import MatchPairsEditor from "./editors/MatchPairsEditor";
import WordSearchEditor from "./editors/WordSearchEditor";
import LetterHuntEditor from "./editors/LetterHuntEditor";

import MemoryMatchPlayer from "./players/MemoryMatchPlayer";
import MatchPairsPlayer from "./players/MatchPairsPlayer";
import WordSearchPlayer from "./players/WordSearchPlayer";
import LetterHuntPlayer from "./players/LetterHuntPlayer";

import {
  validateMemoryMatch,
  validateMatchPairs,
  validateWordSearchFull,
  validateLetterHunt,
} from "./validators";

export const GAME_REGISTRY = {
  MEMORY_MATCH: {
    type: "MEMORY_MATCH",
    label: "Lật thẻ ghép đôi",
    shortLabel: "Ghép ô",
    description: "Lật từng thẻ để tìm và ghép đúng 2 thẻ thành 1 cặp.",
    icon: Grid3x3,
    defaultConfig: () => ({ pairs: [] }),
    Editor: MemoryMatchEditor,
    Player: MemoryMatchPlayer,
    validate: validateMemoryMatch,
  },
  MATCH_PAIRS: {
    type: "MATCH_PAIRS",
    label: "Nối các cặp tương ứng",
    shortLabel: "Nối bảng",
    description:
      "Chạm 1 mục cột trái rồi chạm đúng mục tương ứng ở cột phải để nối.",
    icon: Link2,
    defaultConfig: () => ({ pairs: [] }),
    Editor: MatchPairsEditor,
    Player: MatchPairsPlayer,
    validate: validateMatchPairs,
  },
  WORD_SEARCH: {
    type: "WORD_SEARCH",
    label: "Tìm từ ẩn trong bảng chữ cái",
    shortLabel: "Tìm từ",
    description:
      "Kéo chọn theo hàng ngang / dọc / chéo để tìm các từ đang ẩn trong bảng.",
    icon: Search,
    defaultConfig: () => ({ words: [], rows: null, cols: null }),
    Editor: WordSearchEditor,
    Player: WordSearchPlayer,
    validate: validateWordSearchFull,
  },
  LETTER_HUNT: {
    type: "LETTER_HUNT",
    label: "Săn chữ cái ghép từ khoá",
    shortLabel: "Tìm chữ trong bảng",
    description:
      "Chạm đúng thứ tự các chữ cái rải trong bảng để ghép thành từ khoá, chạy đua với thời gian.",
    icon: Timer,
    defaultConfig: () => ({
      secretWord: "",
      rows: 8,
      cols: 8,
      timeLimitSeconds: 60,
    }),
    Editor: LetterHuntEditor,
    Player: LetterHuntPlayer,
    validate: validateLetterHunt,
  },
};

export const GAME_TYPE_LIST = Object.values(GAME_REGISTRY);

export function getGameDefinition(type) {
  return GAME_REGISTRY[type] || null;
}

// Chạy validate() của loại trò chơi tương ứng, trả về mảng lỗi (rỗng = hợp lệ).
// Bọc try/catch để 1 lỗi bất ngờ trong logic kiểm tra không làm crash trang lưu.
export function validateGameConfig(type, config) {
  const def = getGameDefinition(type);
  if (!def?.validate) return [];
  try {
    return def.validate(config) || [];
  } catch {
    return [
      "Không thể kiểm tra nội dung trò chơi — vui lòng kiểm tra lại dữ liệu đã nhập.",
    ];
  }
}
