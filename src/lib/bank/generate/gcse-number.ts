/**
 * GCSE Number.
 *
 * Every answer here is built forwards: the generator chooses the answer and the
 * parameters that produce it, then writes the question. `HCF(a, b) = h` is not
 * computed by factorising a and b — it is arranged by constructing a = hp and
 * b = hq with p and q coprime, which makes h the HCF by construction. The
 * `check` hooks then verify it the other way round.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Rational, gcd, lcm, rat } from "./rational";
import { money, sup, toPlaces } from "./format";

const PRIMES = [2, 3, 5, 7, 11, 13];

/** Coprime pair, so the constructed HCF really is the HCF. */
function coprimePair(a: number, b: number): boolean {
  return gcd(a, b) === 1;
}

export const gcseNumber: Generator[] = [
  generator({
    key: "gcse.number.hcf",
    topic: "number",
    subtopic: "hcf-lcm",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 26,
    build: (rng) => {
      let h = rng.int(3, 14);
      let p = rng.int(2, 11);
      let q = rng.int(2, 11);
      /* Coprime multipliers, or h would not be the highest common factor. */
      for (let guard = 0; guard < 60 && (!coprimePair(p, q) || p === q); guard++) {
        p = rng.int(2, 11);
        q = rng.int(2, 11);
      }
      if (!coprimePair(p, q) || p === q) {
        h = 6;
        p = 2;
        q = 3;
      }

      const a = h * p;
      const b = h * q;

      return {
        prompt: `Find the highest common factor of ${a} and ${b}.`,
        answer: String(h),
        distractors: pickDistractors(String(h), [
          lcm(a, b), // the other one
          Math.min(a, b), // "the smaller number"
          h * Math.min(p, q),
          a * b,
        ]),
        explanation:
          `${a} = ${h} × ${p} and ${b} = ${h} × ${q}. ` +
          `${p} and ${q} share no factor above 1, so nothing larger than ${h} divides both. HCF = ${h}.`,
        check: () => (gcd(a, b) === h ? null : `HCF(${a}, ${b}) is ${gcd(a, b)}, not ${h}`),
      };
    },
  }),

  generator({
    key: "gcse.number.lcm",
    topic: "number",
    subtopic: "hcf-lcm",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 26,
    build: (rng) => {
      let h = rng.int(2, 9);
      let p = rng.int(2, 9);
      let q = rng.int(2, 9);
      for (let guard = 0; guard < 60 && (!coprimePair(p, q) || p === q); guard++) {
        p = rng.int(2, 9);
        q = rng.int(2, 9);
      }
      if (!coprimePair(p, q) || p === q) {
        h = 4;
        p = 3;
        q = 5;
      }

      const a = h * p;
      const b = h * q;
      const answer = h * p * q;

      return {
        prompt: `Find the lowest common multiple of ${a} and ${b}.`,
        answer: String(answer),
        distractors: pickDistractors(String(answer), [
          a * b, // forgot to divide by the HCF
          h, // gave the HCF
          Math.max(a, b),
          answer * 2,
        ]),
        explanation:
          `HCF(${a}, ${b}) = ${h}, so LCM = (${a} × ${b}) ÷ ${h} = ${a * b} ÷ ${h} = ${answer}. ` +
          `Multiplying the two numbers without dividing by the HCF counts the shared factor twice.`,
        check: () => (lcm(a, b) === answer ? null : `LCM(${a}, ${b}) is ${lcm(a, b)}, not ${answer}`),
      };
    },
  }),

  generator({
    key: "gcse.number.prime-factors",
    topic: "number",
    subtopic: "prime-factors",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 24,
    build: (rng) => {
      const chosen = rng.shuffle(PRIMES).slice(0, rng.int(2, 3));
      const powers = chosen.map(() => rng.int(1, 3));

      let n = 1;
      for (let i = 0; i < chosen.length; i++) n *= Math.pow(chosen[i], powers[i]);
      /* Keep it in the range a student would meet on paper. */
      if (n > 3000) {
        powers[0] = 1;
        n = chosen.reduce((acc, prime, i) => acc * Math.pow(prime, powers[i]), 1);
      }

      const order = chosen
        .map((prime, i) => ({ prime, power: powers[i] }))
        .sort((x, y) => x.prime - y.prime);

      const write = (parts: { prime: number; power: number }[]) =>
        parts.map((p) => (p.power === 1 ? String(p.prime) : `${p.prime}${sup(p.power)}`)).join(" × ");

      const answer = write(order);
      const bumped = order.map((p, i) => (i === 0 ? { ...p, power: p.power + 1 } : p));
      const dropped = order.length > 2 ? order.slice(0, -1) : order.map((p) => ({ ...p, power: 1 }));

      return {
        prompt: `Write ${n} as a product of its prime factors, using index notation.`,
        answer,
        distractors: pickDistractors(answer, [
          write(bumped),
          write(dropped),
          write(order.map((p) => ({ ...p, power: 1 }))),
          write([...order].reverse().map((p, i) => (i === 0 ? { ...p, power: p.power + 1 } : p))),
        ]),
        explanation:
          `Divide by the smallest prime repeatedly: ${n} = ${answer}. ` +
          `Multiplying it back gives ${order.reduce((acc, p) => acc * Math.pow(p.prime, p.power), 1)}.`,
        check: () => {
          const product = order.reduce((acc, p) => acc * Math.pow(p.prime, p.power), 1);
          return product === n ? null : `${answer} multiplies to ${product}, not ${n}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.number.standard-form-multiply",
    topic: "number",
    subtopic: "standard-form",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      /* Whole-number mantissas, so the multiplication is a times table rather
         than something you reach for a calculator to do. */
      const a = rat(rng.int(2, 9));
      const b = rat(rng.int(2, 9));
      const p = rng.nonZero(-6, 8);
      const q = rng.nonZero(-6, 8);

      const rawMantissa = a.mul(b).toNumber();
      /* Standard form needs 1 ≤ mantissa < 10, so a product over 10 carries. */
      const carry = rawMantissa >= 10 ? 1 : 0;
      const mantissa = carry ? rawMantissa / 10 : rawMantissa;
      const exponent = p + q + carry;

      const shown = toPlaces(mantissa, 3);
      const answer = `${shown} × 10${sup(exponent)}`;

      return {
        prompt:
          `Work out (${a} × 10${sup(p)}) × (${b} × 10${sup(q)}), ` +
          `giving your answer in standard form.`,
        answer,
        distractors: pickDistractors(answer, [
          `${toPlaces(rawMantissa, 3)} × 10${sup(p + q)}`, // forgot to renormalise
          `${shown} × 10${sup(p * q)}`, // multiplied the indices
          `${shown} × 10${sup(exponent - 1)}`,
          `${toPlaces(a.toNumber() + b.toNumber(), 3)} × 10${sup(p + q)}`,
        ]),
        explanation:
          `Multiply the numbers and add the indices: ${a} × ${b} = ` +
          `${toPlaces(rawMantissa, 3)}, and 10${sup(p)} × 10${sup(q)} = 10${sup(p + q)}. ` +
          (carry
            ? `${toPlaces(rawMantissa, 3)} is not between 1 and 10, so write it as ${shown} × 10 and carry one into the index: ${answer}.`
            : `That is already in standard form: ${answer}.`),
        check: () => {
          const expected = a.toNumber() * b.toNumber() * Math.pow(10, p + q);
          const got = mantissa * Math.pow(10, exponent);
          return Math.abs(expected - got) <= Math.abs(expected) * 1e-9
            ? null
            : `${answer} evaluates to ${got}, expected ${expected}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.number.percentage-of",
    topic: "number",
    subtopic: "percentages",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 24,
    build: (rng) => {
      /* Percentages you can build from 10% and 5%, on amounts that divide by
         20 — the whole question is meant to be done in your head. */
      const percent = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90]);
      const amount = rng.int(2, 40) * 20;
      const answer = (percent / 100) * amount;

      return {
        prompt: `Work out ${percent}% of ${money(amount)}.`,
        answer: money(answer),
        distractors: pickDistractors(money(answer), [
          money(amount - answer), // gave the remainder
          money(answer * 10), // decimal slip
          money(answer / 10),
          money((percent / 100) * amount * 2),
        ]),
        explanation:
          `${percent}% = ${percent}/100 = ${toPlaces(percent / 100, 4)}, ` +
          `so ${percent}% of ${money(amount)} = ${toPlaces(percent / 100, 4)} × ${amount} = ${money(answer)}.`,
        check: () =>
          Math.abs(answer * 100 - percent * amount) < 1e-9
            ? null
            : `${answer} is not ${percent}% of ${amount}`,
      };
    },
  }),

  generator({
    key: "gcse.number.percentage-change",
    topic: "number",
    subtopic: "percentages",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 24,
    build: (rng) => {
      const original = rng.int(2, 25) * 20;
      const percent = rng.pick([5, 10, 12, 15, 20, 25, 30, 40]);
      const rise = rng.bool();
      const changed = original * (1 + (rise ? percent : -percent) / 100);

      const answer = `${percent}% ${rise ? "increase" : "decrease"}`;

      return {
        prompt:
          `A price changes from ${money(original)} to ${money(changed)}. ` +
          `Work out the percentage change.`,
        answer,
        distractors: pickDistractors(answer, [
          `${percent}% ${rise ? "decrease" : "increase"}`, // right size, wrong direction
          `${toPlaces((Math.abs(changed - original) / changed) * 100, 1)}% ${rise ? "increase" : "decrease"}`, // divided by the new value
          `${percent * 2}% ${rise ? "increase" : "decrease"}`,
          `${toPlaces(Math.abs(changed - original), 2)}% ${rise ? "increase" : "decrease"}`,
        ]),
        explanation:
          `Change = ${money(Math.abs(changed - original))}. ` +
          `Percentage change divides by the ORIGINAL amount: ` +
          `${Math.abs(changed - original)} ÷ ${original} × 100 = ${percent}%, ` +
          `a ${rise ? "n increase" : " decrease"}. Dividing by the new price is the usual slip.`,
        check: () => {
          const computed = (Math.abs(changed - original) / original) * 100;
          return Math.abs(computed - percent) < 1e-9 ? null : `computed ${computed}%, expected ${percent}%`;
        },
      };
    },
  }),

  generator({
    key: "gcse.number.reverse-percentage",
    topic: "number",
    subtopic: "reverse-percentages",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      /* Multipliers of 0.5, 0.75, 0.8, 1.2, 1.25, 1.5 and 2 — every one of
         which divides an ordinary price without a calculator. */
      const percent = rng.pick([20, 25, 50, 100]);
      const rise = rng.bool();
      const multiplier = 1 + (rise ? percent : -percent) / 100;
      const original = rng.int(3, 30) * 20;
      const after = original * multiplier;

      const answer = money(original);
      /* The classic error: applying the percentage to the NEW price instead of
         dividing by the multiplier. */
      const naive = after * (rise ? 1 - percent / 100 : 1 + percent / 100);

      return {
        prompt:
          `After a ${percent}% ${rise ? "increase" : "reduction"}, an item costs ${money(after)}. ` +
          `What was the original price?`,
        answer,
        distractors: pickDistractors(answer, [
          money(naive),
          money(after * multiplier),
          money(after + (rise ? -1 : 1) * percent),
          money(original * multiplier * multiplier),
        ]),
        explanation:
          `The new price is ${toPlaces(multiplier, 2)} × the original, so divide rather than ` +
          `taking ${percent}% off the new price: ${money(after)} ÷ ${toPlaces(multiplier, 2)} = ${answer}. ` +
          `Taking ${percent}% of ${money(after)} gives ${money(naive)}, which is wrong because the ` +
          `percentage was never a percentage of the new price.`,
        check: () =>
          Math.abs(original * multiplier - after) < 1e-9
            ? null
            : `${original} × ${multiplier} is not ${after}`,
      };
    },
  }),

  generator({
    key: "gcse.number.compound-interest",
    topic: "number",
    subtopic: "compound-interest",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      /*
       * Asked as a MULTIPLIER rather than a pounds-and-pence total.
       *
       * "£2500 at 3.5% for 4 years" is a calculator question and nothing else —
       * the interesting step is knowing it is 1.035⁴, and everything after that
       * is typing. So the question asks for the thing worth knowing.
       */
      const rate = rng.pick([5, 10, 20, 25, 50]);
      const years = rng.int(2, 5);
      const rise = rng.bool();
      const multiplier = rat(100 + (rise ? rate : -rate), 100);

      const answer = `${multiplier}${sup(years)}`;

      return {
        prompt:
          `A quantity ${rise ? "increases" : "decreases"} by ${rate}% each year for ${years} years. ` +
          `Which expression gives the overall multiplier?`,
        answer,
        distractors: pickDistractors(answer, [
          `${multiplier} × ${years}`, // treated it as simple, not compound
          `${rat(100 + (rise ? -rate : rate), 100)}${sup(years)}`, // wrong direction
          `${rat(rate, 100)}${sup(years)}`, // used the rate, not the multiplier
          `${multiplier}${sup(years + 1)}`,
          `${rat(100 + (rise ? rate : -rate) * years, 100)}`,
        ]),
        explanation:
          `${rise ? "Adding" : "Taking off"} ${rate}% multiplies by ${multiplier} once. ` +
          `Doing that ${years} times multiplies by ${multiplier}${sup(years)} = ${answer}. ` +
          `Multiplying by ${years} instead would be simple interest, which never earns interest on interest.`,
        check: () => {
          const value = Math.pow(multiplier.toNumber(), years);
          const rise2 = rise ? value > 1 : value < 1;
          return rise2 ? null : `a ${rise ? "rise" : "fall"} should give a multiplier ${rise ? "above" : "below"} 1`;
        },
      };
    },
  }),

  generator({
    key: "gcse.number.fraction-add",
    topic: "number",
    subtopic: "fractions",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 26,
    build: (rng) => {
      const d1 = rng.int(2, 12);
      let d2 = rng.int(2, 12);
      if (d2 === d1) d2 = d1 === 12 ? 5 : d1 + 1;

      const n1 = rng.int(1, d1 - 1 || 1);
      const n2 = rng.int(1, d2 - 1 || 1);
      const add = rng.bool();

      const a = rat(n1, d1);
      const b = rat(n2, d2);
      const result = add ? a.add(b) : a.sub(b);

      /* Adding numerators and denominators separately — the single most common
         fraction error there is. */
      const naive = rat(add ? n1 + n2 : n1 - n2, add ? d1 + d2 : d1 - d2 || 1);

      return {
        prompt: `Work out ${a} ${add ? "+" : "−"} ${b}, giving your answer in its simplest form.`,
        answer: result.toString(),
        distractors: pickDistractors(result.toString(), [
          naive.toString(),
          rat(add ? n1 + n2 : n1 - n2, d1 * d2).toString(),
          (add ? a.sub(b) : a.add(b)).toString(),
          a.mul(b).toString(),
        ]),
        explanation:
          `A common denominator of ${lcm(d1, d2)} gives ` +
          `${(lcm(d1, d2) / d1) * n1}/${lcm(d1, d2)} ${add ? "+" : "−"} ${(lcm(d1, d2) / d2) * n2}/${lcm(d1, d2)} = ${result}. ` +
          `Adding the denominators as well is the error to avoid — denominators name the pieces, they are not quantities.`,
        check: () => {
          const expected = add ? n1 / d1 + n2 / d2 : n1 / d1 - n2 / d2;
          return Math.abs(result.toNumber() - expected) < 1e-9
            ? null
            : `${result} evaluates to ${result.toNumber()}, expected ${expected}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.number.fraction-multiply-divide",
    topic: "number",
    subtopic: "fractions",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 24,
    build: (rng) => {
      const a = rat(rng.int(1, 9), rng.int(2, 10));
      const b = rat(rng.int(1, 9), rng.int(2, 10));
      const multiply = rng.bool();
      const result = multiply ? a.mul(b) : a.div(b);

      return {
        prompt: `Work out ${a} ${multiply ? "×" : "÷"} ${b}, giving your answer in its simplest form.`,
        answer: result.toString(),
        distractors: pickDistractors(result.toString(), [
          (multiply ? a.div(b) : a.mul(b)).toString(), // forgot to flip, or flipped when they shouldn't
          a.add(b).toString(),
          rat(a.n * b.n, a.d + b.d).toString(),
          result.pow(2).toString(),
        ]),
        explanation: multiply
          ? `Multiply across: (${a.n} × ${b.n})/(${a.d} × ${b.d}) = ${a.n * b.n}/${a.d * b.d} = ${result}.`
          : `Dividing by ${b} is multiplying by ${rat(b.d, b.n)}: ${a} × ${rat(b.d, b.n)} = ${result}.`,
        check: () => {
          const expected = multiply ? a.toNumber() * b.toNumber() : a.toNumber() / b.toNumber();
          return Math.abs(result.toNumber() - expected) < 1e-9
            ? null
            : `${result} evaluates to ${result.toNumber()}, expected ${expected}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.number.bounds",
    topic: "number",
    subtopic: "bounds",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      const precision = rng.pick([1, 2, 5, 10, 0.1]);
      const steps = rng.int(4, 60);
      const value = Number((steps * precision).toFixed(2));
      const half = precision / 2;
      const upper = value + half;
      const lower = value - half;
      const wantUpper = rng.bool();

      const answer = toPlaces(wantUpper ? upper : lower, 3);
      const unit = precision >= 1 ? `the nearest ${precision}` : "1 decimal place";

      return {
        prompt:
          `A length is ${value} cm, measured to ${unit}. ` +
          `Write down the ${wantUpper ? "upper" : "lower"} bound.`,
        answer,
        distractors: pickDistractors(answer, [
          toPlaces(wantUpper ? lower : upper, 3), // the other bound
          toPlaces(wantUpper ? value + precision : value - precision, 3), // whole interval, not half
          toPlaces(value, 3),
          toPlaces(wantUpper ? upper + half : lower - half, 3),
        ]),
        explanation:
          `Rounding to ${unit} means the true value is within ${half} of ${value}. ` +
          `So the bounds are ${toPlaces(lower, 3)} ≤ length < ${toPlaces(upper, 3)}, ` +
          `and the ${wantUpper ? "upper" : "lower"} bound is ${answer}. ` +
          `Half the precision, not the whole of it — that is the step people skip.`,
        check: () =>
          Math.abs(upper - lower - precision) < 1e-9
            ? null
            : `bounds span ${upper - lower}, expected ${precision}`,
      };
    },
  }),

  generator({
    key: "gcse.number.indices",
    topic: "number",
    subtopic: "indices",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 24,
    build: (rng) => {
      const base = rng.pick(["a", "b", "x", "y"]);
      const p = rng.int(2, 9);
      const q = rng.int(2, 7);
      const mode = rng.pick(["multiply", "divide", "power"] as const);

      const exponent = mode === "multiply" ? p + q : mode === "divide" ? p - q : p * q;
      const expression =
        mode === "multiply"
          ? `${base}${sup(p)} × ${base}${sup(q)}`
          : mode === "divide"
            ? `${base}${sup(p)} ÷ ${base}${sup(q)}`
            : `(${base}${sup(p)})${sup(q)}`;

      const write = (e: number) => (e === 1 ? base : e === 0 ? "1" : `${base}${sup(e)}`);
      const answer = write(exponent);

      return {
        prompt: `Simplify ${expression}.`,
        answer,
        distractors: pickDistractors(answer, [
          write(mode === "multiply" ? p * q : mode === "divide" ? p / q : p + q), // wrong index law
          write(mode === "divide" ? q - p : p - q),
          `${base}${sup(p)}${base}${sup(q)}`,
          write(exponent + 1),
        ]),
        explanation:
          mode === "multiply"
            ? `Multiplying powers of the same base adds the indices: ${p} + ${q} = ${exponent}, giving ${answer}.`
            : mode === "divide"
              ? `Dividing powers of the same base subtracts the indices: ${p} − ${q} = ${exponent}, giving ${answer}.`
              : `A power of a power multiplies the indices: ${p} × ${q} = ${exponent}, giving ${answer}.`,
        check: () => {
          /* Verify numerically at base 2, where index laws must still hold. */
          const expected =
            mode === "multiply"
              ? Math.pow(2, p) * Math.pow(2, q)
              : mode === "divide"
                ? Math.pow(2, p) / Math.pow(2, q)
                : Math.pow(Math.pow(2, p), q);
          return Math.abs(Math.pow(2, exponent) - expected) < 1e-6
            ? null
            : `2${sup(exponent)} is ${Math.pow(2, exponent)}, expected ${expected}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.number.ratio-share",
    topic: "ratio",
    subtopic: "sharing",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 24,
    build: (rng) => {
      const p = rng.int(1, 7);
      const q = rng.int(1, 7);
      const parts = p + q;
      const unit = rng.int(3, 30);
      const total = parts * unit;
      const wantLarger = rng.bool();
      const share = (wantLarger ? Math.max(p, q) : Math.min(p, q)) * unit;

      return {
        prompt:
          `${money(total)} is shared between Amara and Ben in the ratio ${p} : ${q}. ` +
          `How much does the person with the ${wantLarger ? "larger" : "smaller"} share receive?`,
        answer: money(share),
        distractors: pickDistractors(money(share), [
          money(total - share), // the other share
          money(total / parts), // one part only
          money((total / 2) * (wantLarger ? 1 : 1)),
          money(share + unit),
        ]),
        explanation:
          `There are ${p} + ${q} = ${parts} parts, so one part is ${money(total)} ÷ ${parts} = ${money(unit)}. ` +
          `The ${wantLarger ? "larger" : "smaller"} share is ${wantLarger ? Math.max(p, q) : Math.min(p, q)} × ${money(unit)} = ${money(share)}.`,
        check: () => (parts * unit === total ? null : `parts do not reconstruct the total`),
      };
    },
  }),

  generator({
    key: "gcse.number.inverse-proportion",
    topic: "ratio",
    subtopic: "inverse-proportion",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      /* 24 is divisible by every value x can take, so y is always a whole
         number and the question reads like one a teacher would set. */
      const k = rng.int(2, 12) * 24;
      const x1 = rng.pick([2, 3, 4, 6, 8, 12]);
      const y1 = k / x1;
      let x2 = rng.pick([2, 3, 4, 6, 8, 12]);
      if (x2 === x1) x2 = x1 === 12 ? 2 : x1 * 2;
      const y2 = k / x2;

      const answer = Rational.of(k, x2).toString();

      return {
        prompt:
          `y is inversely proportional to x. When x = ${x1}, y = ${Rational.of(k, x1)}. ` +
          `Find y when x = ${x2}.`,
        answer,
        distractors: pickDistractors(answer, [
          Rational.of(y1 * x2, x1).toString(), // treated it as direct proportion
          Rational.of(k * x2, 1).toString(),
          Rational.of(x2, k).toString(),
          Rational.of(k, x1 + x2).toString(),
        ]),
        explanation:
          `Inverse proportion means xy is constant: k = ${x1} × ${Rational.of(k, x1)} = ${k}. ` +
          `So when x = ${x2}, y = ${k} ÷ ${x2} = ${answer}. ` +
          `Direct proportion would multiply where this divides, giving ${Rational.of(y1 * x2, x1)}.`,
        check: () =>
          Math.abs(x2 * y2 - k) < 1e-9 ? null : `x₂y₂ = ${x2 * y2}, expected the constant ${k}`,
      };
    },
  }),
];
