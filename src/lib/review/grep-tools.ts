function normalizeToken(token: string) {
  return token.trim();
}

function escapeRegExp(value: string) {
  // Escape user/DB-provided strings so they are treated as literals in RegExp.
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function grepAny(repoContent: string, tokens: string[]) {
  for (const raw of tokens) {
    const token = normalizeToken(raw);
    if (!token) continue;

    const re = new RegExp(escapeRegExp(token), "i");
    if (re.test(repoContent)) {
      return true;
    }
  }

  return false;
}
