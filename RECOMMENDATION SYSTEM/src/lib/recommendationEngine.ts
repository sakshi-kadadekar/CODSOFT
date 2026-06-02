import { dataset, type Domain, type Item } from "@/data/items";

export type Algorithm = "collaborative" | "content";
export type Feedback = "like" | "dislike";

export interface UserPrefs {
  // itemId -> like/dislike
  feedback: Record<string, Feedback>;
}

export interface Recommendation extends Item {
  score: number; // 0..1
  reasons: string[];
}

const tagAffinity = (
  prefs: UserPrefs,
  domain: Domain,
): Record<string, number> => {
  const items = dataset[domain];
  const map: Record<string, number> = {};
  for (const [id, fb] of Object.entries(prefs.feedback)) {
    const item = items.find((it) => it.id === id);
    if (!item) continue;
    const w = fb === "like" ? 1 : -0.8;
    item.tags.forEach((t) => {
      map[t] = (map[t] ?? 0) + w;
    });
  }
  return map;
};

const normalize = (map: Record<string, number>): Record<string, number> => {
  const max = Math.max(1, ...Object.values(map).map((v) => Math.abs(v)));
  const out: Record<string, number> = {};
  for (const k of Object.keys(map)) out[k] = map[k] / max;
  return out;
};

export function tasteProfile(
  prefs: UserPrefs,
  domain: Domain,
): { tag: string; value: number }[] {
  const aff = normalize(tagAffinity(prefs, domain));
  return Object.entries(aff)
    .map(([tag, value]) => ({ tag, value: Math.max(0, Math.round(value * 100)) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

/** Content-based: score by tag overlap with what the user liked. */
export function contentBased(
  prefs: UserPrefs,
  domain: Domain,
): Recommendation[] {
  const items = dataset[domain];
  const aff = tagAffinity(prefs, domain);
  return items
    .filter((it) => prefs.feedback[it.id] !== "dislike")
    .map((it): Recommendation => {
      const raw =
        it.tags.reduce((acc, t) => acc + (aff[t] ?? 0), 0) +
        (it.rating - 3.5) * 0.4;
      const liked = prefs.feedback[it.id] === "like";
      const score = liked ? 0.99 : Math.max(0, Math.min(1, 0.5 + raw / 6));
      const matchedTags = it.tags.filter((t) => (aff[t] ?? 0) > 0);
      const reasons = matchedTags.length
        ? [`Matches your taste in ${matchedTags.slice(0, 2).join(" & ")}`]
        : [`Highly rated in ${it.tags[0]}`];
      return { ...it, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

/** Collaborative: pseudo "users like you also liked" — build synthetic peer
 *  cohorts by tag affinity and recommend items popular among the cohort. */
export function collaborative(
  prefs: UserPrefs,
  domain: Domain,
): Recommendation[] {
  const items = dataset[domain];
  const aff = normalize(tagAffinity(prefs, domain));
  // Simulate cohort popularity: items whose tags align with affinity get a
  // popularity bump derived from rating + a deterministic hash so the feed
  // feels different from content-based.
  return items
    .filter((it) => prefs.feedback[it.id] !== "dislike")
    .map((it): Recommendation => {
      const tagBoost =
        it.tags.reduce((acc, t) => acc + (aff[t] ?? 0), 0) / it.tags.length;
      const popularity = (it.rating / 5) * 0.7 + (hash(it.id) % 30) / 100;
      const liked = prefs.feedback[it.id] === "like";
      const score = liked
        ? 0.99
        : Math.max(0, Math.min(1, popularity * 0.6 + tagBoost * 0.5 + 0.15));
      return {
        ...it,
        score,
        reasons: [`Loved by people who like ${topAffinityTag(aff) ?? it.tags[0]}`],
      };
    })
    .sort((a, b) => b.score - a.score);
}

function topAffinityTag(aff: Record<string, number>): string | null {
  const entries = Object.entries(aff).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function recommend(
  algorithm: Algorithm,
  prefs: UserPrefs,
  domain: Domain,
): Recommendation[] {
  return algorithm === "collaborative"
    ? collaborative(prefs, domain)
    : contentBased(prefs, domain);
}

export function similar(item: Item, domain: Domain, limit = 4): Item[] {
  const items = dataset[domain];
  return items
    .filter((it) => it.id !== item.id)
    .map((it) => ({
      it,
      score: it.tags.filter((t) => item.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.it);
}
