/**
 * GCSE Probability and Statistics.
 *
 * Probabilities are kept as exact fractions right up to the point of display,
 * which matters more here than anywhere else in the bank: 1/3 as a decimal is
 * 0.3333333333333333, and a question whose options are four roundings of the
 * same number tests typing, not understanding.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Rational, rat } from "./rational";
import { toPlaces } from "./format";

export const gcseData: Generator[] = [
  generator({
    key: "gcse.data.single-event",
    topic: "probability",
    subtopic: "single-events",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 22,
    build: (rng) => {
      const red = rng.int(2, 9);
      const blue = rng.int(2, 9);
      const green = rng.int(2, 9);
      const total = red + blue + green;
      const colour = rng.pick(["red", "blue", "green"] as const);
      const count = colour === "red" ? red : colour === "blue" ? blue : green;
      const answer = rat(count, total).toString();

      return {
        prompt:
          `A bag contains ${red} red, ${blue} blue and ${green} green counters. ` +
          `One counter is taken at random. Find the probability it is ${colour}, as a fraction in its simplest form.`,
        answer,
        distractors: pickDistractors(answer, [
          rat(count, total - count).toString(), // compared to the others, not the total
          rat(total - count, total).toString(), // probability of NOT that colour
          rat(count, 3).toString(),
          rat(count + 1, total).toString(),
        ]),
        explanation:
          `There are ${total} counters altogether and ${count} are ${colour}, ` +
          `so P(${colour}) = ${count}/${total} = ${answer}. ` +
          `The denominator is the total, not the number of other counters.`,
        check: () => {
          const p = rat(count, total).toNumber();
          return p > 0 && p < 1 ? null : `probability ${p} outside (0, 1)`;
        },
      };
    },
  }),

  generator({
    key: "gcse.data.tree-diagram",
    topic: "probability",
    subtopic: "tree-diagrams",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 22,
    build: (rng) => {
      const red = rng.int(3, 8);
      const blue = rng.int(3, 8);
      const total = red + blue;

      /* Without replacement — the case where the second denominator changes,
         which is the entire point of the topic. */
      const bothRed = rat(red, total).mul(rat(red - 1, total - 1));
      const answer = bothRed.toString();

      const withReplacement = rat(red, total).mul(rat(red, total));

      return {
        prompt:
          `A bag holds ${red} red and ${blue} blue counters. Two are taken without replacement. ` +
          `Find the probability that both are red, as a fraction in its simplest form.`,
        answer,
        distractors: pickDistractors(answer, [
          withReplacement.toString(), // forgot that the bag changed
          rat(red, total).add(rat(red - 1, total - 1)).toString(), // added instead of multiplying
          rat(red * (red - 1), total * total).toString(),
          rat(red, total).toString(),
        ]),
        explanation:
          `P(first red) = ${red}/${total}. After taking one red there are ${red - 1} reds among ${total - 1} counters, ` +
          `so P(second red | first red) = ${red - 1}/${total - 1}. ` +
          `Multiplying along the branches: ${red}/${total} × ${red - 1}/${total - 1} = ${answer}. ` +
          `With replacement it would be ${withReplacement} — both denominators unchanged.`,
        check: () => {
          const p = bothRed.toNumber();
          const naive = withReplacement.toNumber();
          return p > 0 && p < naive
            ? null
            : `without replacement (${p}) should be below with replacement (${naive})`;
        },
      };
    },
  }),

  generator({
    key: "gcse.data.venn",
    topic: "probability",
    subtopic: "venn-diagrams",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      const both = rng.int(3, 12);
      const onlyA = rng.int(4, 20);
      const onlyB = rng.int(4, 20);
      const neither = rng.int(2, 15);
      const total = both + onlyA + onlyB + neither;

      const inA = both + onlyA;
      const inB = both + onlyB;
      const answer = rat(both + onlyA + onlyB, total).toString();

      return {
        prompt:
          `In a group of ${total} students, ${inA} study French and ${inB} study German. ` +
          `${both} study both. One student is chosen at random. ` +
          `Find the probability they study at least one of the two languages, as a fraction in its simplest form.`,
        answer,
        distractors: pickDistractors(answer, [
          rat(inA + inB, total).toString(), // double-counted the overlap
          rat(neither, total).toString(), // probability of neither
          rat(both, total).toString(),
          rat(onlyA + onlyB, total).toString(), // forgot the students doing both
        ]),
        explanation:
          `P(A or B) = P(A) + P(B) − P(both), because adding the two counts includes the ${both} ` +
          `students in the overlap twice: ${inA} + ${inB} − ${both} = ${inA + inB - both} students. ` +
          `So the probability is ${inA + inB - both}/${total} = ${answer}.`,
        check: () =>
          inA + inB - both === both + onlyA + onlyB
            ? null
            : `inclusion-exclusion does not match the region counts`,
      };
    },
  }),

  generator({
    key: "gcse.data.mean-frequency",
    topic: "statistics",
    subtopic: "averages",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      const values = [0, 1, 2, 3, 4];
      const frequencies = values.map(() => rng.int(2, 15));
      const totalFrequency = frequencies.reduce((a, b) => a + b, 0);
      const totalValue = values.reduce((sum, v, i) => sum + v * frequencies[i], 0);
      const mean = totalValue / totalFrequency;
      const answer = toPlaces(mean, 2);

      const naive = values.reduce((a, b) => a + b, 0) / values.length;

      return {
        prompt:
          `The number of pets owned by each of ${totalFrequency} students is recorded. ` +
          values.map((v, i) => `${v} pets: ${frequencies[i]} students`).join("; ") +
          `. Find the mean number of pets, to 2 decimal places.`,
        answer,
        distractors: pickDistractors(answer, [
          toPlaces(naive, 2), // averaged the values, ignoring frequency
          toPlaces(totalValue / values.length, 2), // divided by the number of categories
          toPlaces(totalFrequency / values.length, 2),
          toPlaces(mean * 2, 2),
        ]),
        explanation:
          `Multiply each value by its frequency and add: ${totalValue}. ` +
          `Divide by the total frequency, ${totalFrequency}, not by the number of categories: ` +
          `${totalValue} ÷ ${totalFrequency} = ${answer}.`,
        check: () => {
          const rebuilt = values.reduce((s, v, i) => s + v * frequencies[i], 0) / totalFrequency;
          return Math.abs(rebuilt - mean) < 1e-9 ? null : `mean does not reconstruct`;
        },
      };
    },
  }),

  generator({
    key: "gcse.data.grouped-mean",
    topic: "statistics",
    subtopic: "grouped-data",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 20,
    build: (rng) => {
      const width = rng.pick([10, 20]);
      const start = rng.pick([0, 10, 20]);
      const groups = [0, 1, 2, 3].map((i) => ({
        low: start + i * width,
        high: start + (i + 1) * width,
        frequency: rng.int(3, 18),
      }));

      const totalFrequency = groups.reduce((s, g) => s + g.frequency, 0);
      const estimate =
        groups.reduce((s, g) => s + ((g.low + g.high) / 2) * g.frequency, 0) / totalFrequency;
      const answer = toPlaces(estimate, 2);

      /* Using the lower bound instead of the midpoint — the standard slip. */
      const usingLow = groups.reduce((s, g) => s + g.low * g.frequency, 0) / totalFrequency;

      return {
        prompt:
          `Times are recorded in groups: ` +
          groups.map((g) => `${g.low} ≤ t < ${g.high}: ${g.frequency}`).join("; ") +
          `. Estimate the mean, to 2 decimal places.`,
        answer,
        distractors: pickDistractors(answer, [
          toPlaces(usingLow, 2),
          toPlaces(groups.reduce((s, g) => s + g.high * g.frequency, 0) / totalFrequency, 2),
          toPlaces(groups.reduce((s, g) => s + (g.low + g.high) / 2, 0) / groups.length, 2),
          toPlaces(estimate + width / 2, 2),
        ]),
        explanation:
          `Use the midpoint of each group as its representative value: ` +
          groups.map((g) => (g.low + g.high) / 2).join(", ") +
          `. Multiply by the frequencies, add, and divide by ${totalFrequency}: ${answer}. ` +
          `It is an estimate because the original values inside each group are gone.`,
        check: () => {
          const low = Math.min(...groups.map((g) => g.low));
          const high = Math.max(...groups.map((g) => g.high));
          return estimate > low && estimate < high
            ? null
            : `estimate ${estimate} lies outside the data range`;
        },
      };
    },
  }),

  generator({
    key: "gcse.data.median-iqr",
    topic: "statistics",
    subtopic: "averages",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 22,
    build: (rng) => {
      const count = rng.pick([7, 9, 11]);
      const data = Array.from({ length: count }, () => rng.int(1, 40)).sort((a, b) => a - b);
      const median = data[(count - 1) / 2];
      const lowerHalf = data.slice(0, (count - 1) / 2);
      const upperHalf = data.slice((count + 1) / 2);
      const q1 = quartile(lowerHalf);
      const q3 = quartile(upperHalf);
      const wantMedian = rng.bool();
      const iqr = q3 - q1;
      const answer = String(wantMedian ? median : iqr);

      return {
        prompt:
          `Find the ${wantMedian ? "median" : "interquartile range"} of this data: ${data.join(", ")}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(wantMedian ? iqr : median),
          String(data[data.length - 1] - data[0]), // the full range
          String(wantMedian ? data[Math.floor(count / 2) + 1] : q3),
          toPlaces(data.reduce((a, b) => a + b, 0) / count, 1),
        ]),
        explanation: wantMedian
          ? `The data is already in order with ${count} values, so the median is the ${(count + 1) / 2}th: ${median}.`
          : `Q1 = ${q1} and Q3 = ${q3}, so the interquartile range is ${q3} − ${q1} = ${iqr}. ` +
            `That is not the range — the range, ${data[data.length - 1] - data[0]}, uses the extremes and is far more sensitive to outliers.`,
        check: () => {
          const below = data.filter((v) => v < median).length;
          const above = data.filter((v) => v > median).length;
          return Math.abs(below - above) <= 2 ? null : `median does not split the data evenly`;
        },
      };
    },
  }),

  generator({
    key: "gcse.data.relative-frequency",
    topic: "probability",
    subtopic: "single-events",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const trials = rng.pick([50, 80, 100, 200, 250, 400]);
      const successes = rng.int(5, trials - 5);
      const p = Rational.of(successes, trials);
      const expected = Math.round(p.toNumber() * (trials * 2));
      const answer = String(expected);

      return {
        prompt:
          `A biased coin lands on heads ${successes} times in ${trials} spins. ` +
          `Estimate how many heads you would expect in ${trials * 2} spins.`,
        answer,
        distractors: pickDistractors(answer, [
          String(successes), // did not scale
          String(trials * 2 - expected), // expected tails
          String(Math.round(trials)),
          String(expected + trials),
        ]),
        explanation:
          `Relative frequency = ${successes}/${trials} = ${p}. ` +
          `Expected heads in ${trials * 2} spins = ${p} × ${trials * 2} = ${answer}. ` +
          `Doubling the trials doubles the expected count.`,
        check: () =>
          Math.abs(expected - p.toNumber() * trials * 2) <= 0.5
            ? null
            : `expected count does not match the relative frequency`,
      };
    },
  }),
];

/** Median of a half-sample, used for the quartiles. */
function quartile(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 1 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}
