import { wordLists } from "../data/words.js";

const punctuationMarks = [",", ".", "'", ".", ","];
const numbers = ["12", "24", "42", "64", "128", "256", "404", "512", "1024"];

export function shuffleWords(words) {
  const shuffled = [...words];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function addPunctuation(word, index) {
  if (index > 0 && index % 8 === 0) {
    return `${word}${punctuationMarks[index % punctuationMarks.length]}`;
  }

  return word;
}

function addNumber(word, index) {
  if (index > 0 && index % 13 === 0) {
    return numbers[index % numbers.length];
  }

  return word;
}

export function generatePassage({ difficulty, mode, duration, punctuation, numbers: includeNumbers }) {
  const sourceWords = wordLists[difficulty] ?? wordLists.easy;
  const targetCount = mode === "words" ? duration : Math.max(120, duration * 4);
  const shuffled = shuffleWords(sourceWords);
  const passage = [];

  while (passage.length < targetCount) {
    passage.push(...shuffleWords(shuffled));
  }

  return passage.slice(0, targetCount).map((word, index) => {
    let nextWord = word;

    if (includeNumbers) {
      nextWord = addNumber(nextWord, index);
    }

    if (punctuation && !/^\d+$/.test(nextWord)) {
      nextWord = addPunctuation(nextWord, index);
    }

    return nextWord;
  });
}
