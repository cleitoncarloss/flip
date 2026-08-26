/**
 * Implementação do algoritmo SM-2 (SuperMemo 2), usado pelo Anki.
 * quality: 0 (difícil/não lembrou) a 3 (fácil), mapeado a partir dos
 * botões de avaliação. O valor 1 (antigo "difícil, mas lembrei") não é
 * mais usado pela UI, mas a fórmula do fator de facilidade permanece
 * válida para ele caso seja reintroduzido no futuro.
 *
 * "Difícil" marca o cartão como devido imediatamente (não espera um
 * dia), e study-session.js o reinsere mais à frente na fila da sessão
 * atual, para reforçar o aprendizado no mesmo dia em vez de só amanhã.
 */

export const RATING = {
  DIFFICULT: 0,
  MEDIUM: 2,
  EASY: 3,
};

export function nextReview(srs, rating) {
  let { repetitions, easeFactor, intervalDays } = srs;

  if (rating === RATING.DIFFICULT) {
    repetitions = 0;
    intervalDays = 0;
    return {
      repetitions,
      easeFactor,
      intervalDays,
      dueAt: new Date().toISOString(),
    };
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
