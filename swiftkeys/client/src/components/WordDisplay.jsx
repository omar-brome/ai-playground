import { motion } from "framer-motion";
import Cursor from "./Cursor.jsx";

function Character({ character, typedCharacter, isCurrent, isCursorPosition }) {
  const isTyped = typedCharacter !== undefined;
  const isCorrect = isTyped && typedCharacter === character;
  const isIncorrect = isTyped && typedCharacter !== character;

  return (
    <span className="relative inline-flex">
      {isCurrent && isCursorPosition && <Cursor />}
      {isIncorrect ? (
        <motion.span
          animate={{ x: [0, -1, 1, 0] }}
          transition={{ duration: 0.16 }}
          className="text-[#f87171]"
        >
          {character}
        </motion.span>
      ) : (
        <span className={isCorrect ? "text-[#a3e635]" : "text-neutral-500"}>{character}</span>
      )}
    </span>
  );
}

function WordDisplay({ wordStates }) {
  const currentIndex = wordStates.findIndex((wordState) => wordState.isCurrent);
  const startIndex = Math.max(0, currentIndex - 9);
  const visibleWords = wordStates.slice(startIndex, startIndex + 56);

  return (
    <div className="h-[8.4rem] overflow-hidden rounded-3xl bg-[#141414] p-5 font-mono text-[22px] leading-[2.35rem] text-neutral-500 shadow-inner shadow-black/30 md:text-2xl">
      <motion.div layout className="flex flex-wrap gap-x-3 gap-y-1">
        {visibleWords.map((wordState, localIndex) => {
          const wordIndex = startIndex + localIndex;
          const characters = wordState.word.split("");
          const extraCharacters = wordState.input.slice(characters.length).split("");

          return (
            <span
              key={`${wordState.word}-${wordIndex}`}
              className={`rounded-md px-1 transition ${
                wordState.isCurrent ? "bg-[#e2b714]/10 underline decoration-[#e2b714] underline-offset-8" : ""
              }`}
            >
              {characters.map((character, characterIndex) => (
                <Character
                  key={`${wordIndex}-${characterIndex}`}
                  character={character}
                  typedCharacter={wordState.input[characterIndex]}
                  isCurrent={wordState.isCurrent}
                  isCursorPosition={characterIndex === wordState.input.length}
                />
              ))}
              {extraCharacters.map((character, characterIndex) => (
                <motion.span
                  key={`${wordIndex}-extra-${characterIndex}`}
                  animate={{ x: [0, -1, 1, 0] }}
                  transition={{ duration: 0.16 }}
                  className="text-[#f87171]"
                >
                  {character}
                </motion.span>
              ))}
              {wordState.isCurrent && wordState.input.length >= characters.length && <Cursor />}
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}

export default WordDisplay;
