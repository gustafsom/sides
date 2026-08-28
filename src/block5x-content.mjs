import * as A1 from './block5x-a1.mjs';
import * as A2 from './block5x-a2.mjs';
import * as B1 from './block5x-b1.mjs';
import * as B2 from './block5x-b2.mjs';

const packs=[A1,A2,B1,B2];
export const block5xVocabulary=packs.flatMap(x=>x.vocabulary);
export const block5xLearningItems=packs.flatMap(x=>x.learning);
export const block5xGrammar=packs.flatMap(x=>x.grammar);
export const block5xListening=packs.flatMap(x=>x.listening);
export const block5xReading=packs.flatMap(x=>x.reading);

export const block5xCounts={
  vocabulary:block5xVocabulary.length,
  learning:block5xLearningItems.length,
  grammar:block5xGrammar.length,
  listening:block5xListening.length,
  reading:block5xReading.length
};