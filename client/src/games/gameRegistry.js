import { Grid3x3, Link2, Search, Timer } from "lucide-react";

import MemoryMatchEditor from "./editors/MemoryMatchEditor";
import MatchPairsEditor from "./editors/MatchPairsEditor";
import WordSearchEditor from "./editors/WordSearchEditor";
import LetterHuntEditor from "./editors/LetterHuntEditor";

import MemoryMatchPlayer from "./players/MemoryMatchPlayer";
import MatchPairsPlayer from "./players/MatchPairsPlayer";
import WordSearchPlayer from "./players/WordSearchPlayer";
import LetterHuntPlayer from "./players/LetterHuntPlayer";

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
  },
  MATCH_PAIRS: {
    type: "MATCH_PAIRS",
    label: "Nối các cặp tương ứng",
    shortLabel: "Nối bảng",
    description: "Chạm 1 mục cột trái rồi chạm đúng mục tương ứng ở cột phải để nối.",
    icon: Link2,
    defaultConfig: () => ({ pairs: [] }),
    Editor: MatchPairsEditor,
    Player: MatchPairsPlayer,
  },
  WORD_SEARCH: {
    type: "WORD_SEARCH",
    label: "Tìm từ ẩn trong bảng chữ cái",
    shortLabel: "Tìm từ",
    description: "Kéo chọn theo hàng ngang / dọc / chéo để tìm các từ đang ẩn trong bảng.",
    icon: Search,
    defaultConfig: () => ({ words: [], rows: null, cols: null }),
    Editor: WordSearchEditor,
    Player: WordSearchPlayer,
  },
  LETTER_HUNT: {
    type: "LETTER_HUNT",
    label: "Săn chữ cái ghép từ khoá",
    shortLabel: "Tìm chữ trong bảng",
    description: "Chạm đúng thứ tự các chữ cái rải trong bảng để ghép thành từ khoá, chạy đua với thời gian.",
    icon: Timer,
    defaultConfig: () => ({ secretWord: "", rows: 8, cols: 8, timeLimitSeconds: 60 }),
    Editor: LetterHuntEditor,
    Player: LetterHuntPlayer,
  },
};

export const GAME_TYPE_LIST = Object.values(GAME_REGISTRY);

export function getGameDefinition(type) {
  return GAME_REGISTRY[type] || null;
}