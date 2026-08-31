/**
 * Mesma regra usada no backend (ver PASSWORD_POLICY em
 * backend/src/modules/users/users.dto.ts e backend/src/modules/auth/auth.dto.ts):
 * mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo. Mantida
 * aqui como fonte única pro frontend pra nenhum formulário validar mais
 * fraco que o servidor — isso fazia uma senha "válida" na tela ser
 * rejeitada só no submit, com um "Dados inválidos" genérico sem explicar o motivo.
 */
export const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_POLICY_MESSAGE =
  "A senha deve ter no mínimo 8 caracteres e incluir maiúscula, minúscula, número e símbolo";
