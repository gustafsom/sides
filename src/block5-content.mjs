export { CURRICULUM_PACK, curriculumTargets, curriculumFramework } from './block5-framework.mjs';

import { block5Vocabulary as baseVocabulary } from './block5-vocabulary.mjs';
import { block5LearningItems as baseLearningItems } from './block5-chunks.mjs';
import { block5Grammar as baseGrammar } from './block5-grammar.mjs';
import { block5Listening as baseListening } from './block5-listening.mjs';
import { block5Reading as baseReading } from './block5-reading.mjs';
import {
  block5xVocabulary,
  block5xLearningItems,
  block5xGrammar,
  block5xListening,
  block5xReading,
  block5xCounts
} from './block5x-content.mjs';

export const block5Vocabulary=[...baseVocabulary,...block5xVocabulary];
export const block5LearningItems=[...baseLearningItems,...block5xLearningItems];
export const block5Grammar=[...baseGrammar,...block5xGrammar];
export const block5Listening=[...baseListening,...block5xListening];
export const block5Reading=[...baseReading,...block5xReading];

export { block5xCounts };

export const block5Counts = {
  vocabulary:block5Vocabulary.length,
  learning:block5LearningItems.length,
  grammar:block5Grammar.length,
  listening:block5Listening.length,
  reading:block5Reading.length
};