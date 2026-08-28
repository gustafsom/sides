export { CURRICULUM_PACK, curriculumTargets, curriculumFramework } from './block5-framework.mjs';
export { block5Vocabulary } from './block5-vocabulary.mjs';
export { block5LearningItems } from './block5-chunks.mjs';
export { block5Grammar } from './block5-grammar.mjs';
export { block5Listening } from './block5-listening.mjs';
export { block5Reading } from './block5-reading.mjs';

import { block5Vocabulary } from './block5-vocabulary.mjs';
import { block5LearningItems } from './block5-chunks.mjs';
import { block5Grammar } from './block5-grammar.mjs';
import { block5Listening } from './block5-listening.mjs';
import { block5Reading } from './block5-reading.mjs';

export const block5Counts = {
  vocabulary:block5Vocabulary.length,
  learning:block5LearningItems.length,
  grammar:block5Grammar.length,
  listening:block5Listening.length,
  reading:block5Reading.length
};