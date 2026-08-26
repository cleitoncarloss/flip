/**
 * Implementação do algoritmo SM-2 (SuperMemo 2), usado pelo Anki.
 * quality: 0 (errei) a 3 (fácil), mapeado a partir dos botões de avaliação.
 */

export const RATING = {
  AGAIN: 0,
  HARD: 1,
  GOOD: 2,
  EASY: 3,
};

export function nextReview(srs, rating) {
  let { repetitions, easeFactor, intervalDays } = srs;

  if (rating === RATING.AGAIN) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02))
    );

    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  }

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return {
    repetitions,
    easeFactor,
    intervalDays,
    dueAt: dueAt.toISOString(),
  };
}
