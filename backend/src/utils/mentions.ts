function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convenção de menção usada no texto de comentários: "@Nome Completo", texto
 * puro (sem colchetes/ID embutido — trocado de propósito por um formato mais
 * limpo tanto ao digitar quanto ao exibir; ver conversa que motivou isso).
 * Como não há ID no texto, resolvemos por casamento de nome contra a lista de
 * candidatos (usuários ativos) informada — do nome mais longo pro mais curto,
 * pra "@Ana Paula" não resolver só a "Ana" quando as duas existirem, e com
 * fronteira de palavra (via lookaround) pra não casar "@Empresa" dentro de um
 * e-mail tipo "joao@Empresa.com". Trade-off aceito: se duas pessoas tiverem
 * exatamente o mesmo nome, ou o nome mudar depois do comentário, a notificação
 * pode não ir pra pessoa certa — o preço de não ter mais o ID embutido.
 */
export function extractMentionedUserIds(content: string, candidates: { id: string; name: string }[]): string[] {
  const sortedByNameLengthDesc = [...candidates].sort((a, b) => b.name.length - a.name.length);
  const foundIds = new Set<string>();
  for (const candidate of sortedByNameLengthDesc) {
    if (!candidate.name.trim()) continue;
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])@${escapeRegExp(candidate.name)}(?![\\p{L}\\p{N}])`, "u");
    if (pattern.test(content)) foundIds.add(candidate.id);
  }
  return Array.from(foundIds);
}
