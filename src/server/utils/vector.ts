export function toPgVector(values: number[]) {
  return `[${values.join(",")}]`;
}

export function averageVectors(vectors: number[][]) {
  if (vectors.length === 0) {
    return [];
  }

  const size = vectors[0]?.length ?? 0;
  const sums = Array.from({ length: size }, () => 0);

  for (const vector of vectors) {
    for (let index = 0; index < size; index += 1) {
      sums[index] += vector[index] ?? 0;
    }
  }

  return sums.map((value) => Number((value / vectors.length).toFixed(8)));
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    magA += a[index] * a[index];
    magB += b[index] * b[index];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function parseVector(raw: string | number[] | null | undefined) {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.map(Number);
  }

  return raw
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));
}
