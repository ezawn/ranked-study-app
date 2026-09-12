/**
 * Chemistry: Types of reaction, rates and equilibrium, and analysis.
 *
 * Mostly reasoning, with a computed seam through rates and pH. Where there is
 * arithmetic it follows the bank's rule — the answer is chosen and the
 * parameters built around it — and where there is not, each case names the
 * misconception its distractors come from and declares exactly as many variants
 * as it has cases.
 *
 * The reactivity series and the ion tests are the two places where a wrong fact
 * would be quietly taught as true, so both are drawn from a single table each
 * and the `check` hooks verify the ordering rather than restating it.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, cap, exact, num, slip, tidy, wrongOptions } from "./physics-kit";
import { formula } from "./chemistry-kit";

/* ==========================================================================
   Data
   ========================================================================== */

/** The reactivity series, most reactive first. Order is the whole point. */
const REACTIVITY = [
  "potassium", "sodium", "calcium", "magnesium", "aluminium", "zinc",
  "iron", "lead", "copper", "silver", "gold",
] as const;

/** Flame and precipitate tests, as taught across all three boards. */
const ION_TESTS = [
  { ion: "lithium", test: "flame test", result: "crimson flame" },
  { ion: "sodium", test: "flame test", result: "yellow flame" },
  { ion: "potassium", test: "flame test", result: "lilac flame" },
  { ion: "calcium", test: "flame test", result: "orange-red flame" },
  { ion: "copper(II)", test: "flame test", result: "green flame" },
  { ion: "copper(II)", test: "sodium hydroxide solution", result: "blue precipitate" },
  { ion: "iron(II)", test: "sodium hydroxide solution", result: "green precipitate" },
  { ion: "iron(III)", test: "sodium hydroxide solution", result: "brown precipitate" },
  { ion: "carbonate", test: "dilute acid", result: "fizzing, and the gas turns limewater cloudy" },
  { ion: "sulfate", test: "barium chloride solution with dilute acid", result: "white precipitate" },
  { ion: "chloride", test: "silver nitrate solution with dilute nitric acid", result: "white precipitate" },
  { ion: "bromide", test: "silver nitrate solution with dilute nitric acid", result: "cream precipitate" },
  { ion: "iodide", test: "silver nitrate solution with dilute nitric acid", result: "yellow precipitate" },
] as const;

const GAS_TESTS = [
  { gas: "oxygen", test: "It relights a glowing splint" },
  { gas: "hydrogen", test: "It burns with a squeaky pop" },
  { gas: "carbon dioxide", test: "It turns limewater milky" },
  { gas: "chlorine", test: "It bleaches damp litmus paper" },
  { gas: "ammonia", test: "It turns damp red litmus paper blue" },
] as const;

/**
 * Kc cases, enumerated rather than sampled.
 *
 * Picking Kc and three concentrations freely produces degenerate sets — with
 * [A] = [B] = [C] = 1 the answer IS Kc, and two of the four distractors land on
 * top of it. Enumerating and filtering means the generator can never be handed
 * a combination whose wrong answers are not wrong.
 */
const KC_CASES: { kc: number; a: number; b: number; c: number; d: number }[] = (() => {
  const out: { kc: number; a: number; b: number; c: number; d: number }[] = [];
  const ks = [0.25, 0.5, 2, 4, 5, 8, 10, 20, 25];
  const cs = [0.2, 0.5, 1, 2, 4, 5];
  for (const kc of ks) {
    for (const a of cs) {
      for (const b of cs) {
        for (const c of cs) {
          const d = (kc * a * b) / c;
          if (!tidy(d) || d > 50 || d < 0.05) continue;
          /* Every distractor must be a distinct number, and distinct from the
             answer, or the question has fewer than four real options. */
          const wrong = [(a * b) / (kc * c), kc * a * b * c, kc, c];
          if (wrong.some((w) => agrees(w, d))) continue;
          if (new Set(wrong.map((w) => w.toFixed(4))).size < 4) continue;
          out.push({ kc, a, b, c, d });
        }
      }
    }
  }
  if (out.length < 24) throw new Error(`Only ${out.length} usable Kc cases`);
  return out;
})();

/* ==========================================================================
   The generators
   ========================================================================== */

export const chemistryReactions: Generator[] = [
  /* ------------------------------------------------------------------------
     Acids, bases and neutralisation
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.react.acids",
    subject: "chemistry",
    topic: "chem-reactions",
    subtopic: "acids-bases",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What ion do all acids produce in aqueous solution?", a: "H⁺", wrong: ["OH⁻", "H₂", "O²⁻"], why: "An acid is a proton donor: in water it releases H⁺ ions, and it is those that give every acid its shared properties. Alkalis release OH⁻, which is why the two neutralise each other so cleanly." },
        { q: "What ion do all alkalis produce in aqueous solution?", a: "OH⁻", wrong: ["H⁺", "O²⁻", "H₂O"], why: "An alkali is a soluble base, and in solution it releases hydroxide ions. Neutralisation is simply H⁺ + OH⁻ → H₂O, which is why the ionic equation is the same for every strong acid–strong alkali pair." },
        { q: "What is the difference between a base and an alkali?", a: "An alkali is a base that dissolves in water", wrong: ["A base is a solid and an alkali is a liquid", "An alkali reacts with acids and a base does not", "There is no difference"], why: "All alkalis are bases, but not all bases are alkalis. Copper oxide is a base — it neutralises acids — but it does not dissolve, so it is not an alkali and it does not give an alkaline solution." },
        { q: "What is produced when an acid reacts with a metal oxide?", a: "A salt and water", wrong: ["A salt and hydrogen", "A salt and carbon dioxide", "A salt only"], why: "Metal oxide + acid → salt + water. Hydrogen is produced with a METAL, and carbon dioxide with a CARBONATE. Recognising which of the three you have is what decides the products." },
        { q: "What is produced when an acid reacts with a metal carbonate?", a: "A salt, water and carbon dioxide", wrong: ["A salt and water", "A salt and hydrogen", "A salt and oxygen"], why: "The carbonate ion becomes carbon dioxide and water, so all three products appear. The fizzing is the carbon dioxide, and it turns limewater milky — which is also the standard test for a carbonate." },
        { q: "What is produced when a reactive metal reacts with an acid?", a: "A salt and hydrogen", wrong: ["A salt and water", "A salt and oxygen", "A salt and carbon dioxide"], why: "Metal + acid → salt + hydrogen. The metal displaces hydrogen from the acid, so the gas given off pops with a lit splint. Unreactive metals such as copper do not react at all." },
        { q: "Hydrochloric acid is neutralised by sodium hydroxide. What salt is formed?", a: "Sodium chloride", wrong: ["Sodium sulfate", "Sodium nitrate", "Sodium hydroxide"], why: "The metal comes from the alkali and the rest of the salt name from the acid: hydrochloric gives chlorides, sulfuric gives sulfates, nitric gives nitrates. So sodium hydroxide plus hydrochloric acid gives sodium chloride." },
        { q: "Sulfuric acid reacts with copper(II) oxide. What are the products?", a: "Copper(II) sulfate and water", wrong: ["Copper(II) sulfate and hydrogen", "Copper(II) chloride and water", "Copper and sulfur dioxide"], why: "This is a metal oxide neutralising an acid, so the products are a salt and water. Sulfuric acid gives sulfates, and the copper keeps its 2+ charge from the oxide." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.react.ph",
    subject: "chemistry",
    topic: "chem-reactions",
    subtopic: "neutralisation",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 48,
    build: (rng) => {
      const cases = [
        { ph: 1, kind: "strongly acidic", indicator: "red", solution: "concentrated hydrochloric acid" },
        { ph: 3, kind: "acidic", indicator: "orange-red", solution: "vinegar" },
        { ph: 5, kind: "weakly acidic", indicator: "orange-yellow", solution: "black coffee" },
        { ph: 7, kind: "neutral", indicator: "green", solution: "pure water" },
        { ph: 9, kind: "weakly alkaline", indicator: "blue-green", solution: "baking soda solution" },
        { ph: 11, kind: "alkaline", indicator: "blue", solution: "ammonia solution" },
        { ph: 14, kind: "strongly alkaline", indicator: "purple", solution: "concentrated sodium hydroxide" },
      ];
      const c = rng.pick(cases);
      const asked = rng.pick(["kind", "colour", "compare"] as const);

      if (asked === "kind") {
        const answer = c.kind;
        return {
          prompt: `A solution has a pH of ${c.ph}. How would you describe it?`,
          answer,
          distractors: wrongOptions(answer, cases.filter((x) => x.kind !== c.kind).map((x) => x.kind).slice(0, 4)),
          explanation:
            `pH 7 is neutral; below 7 is acidic and above 7 is alkaline, and the further from 7 the stronger. ` +
            `pH ${c.ph} is therefore ${answer}. Each whole pH unit is a tenfold change in hydrogen ion concentration, so the scale moves faster than it looks.`,
        };
      }

      if (asked === "colour") {
        const answer = c.indicator;
        return {
          prompt: `What colour would universal indicator turn in a solution of pH ${c.ph}?`,
          answer,
          distractors: wrongOptions(answer, cases.filter((x) => x.indicator !== c.indicator).map((x) => x.indicator).slice(0, 4)),
          explanation:
            `Universal indicator runs red through orange and yellow for acids, green at neutral, and blue to purple for alkalis. ` +
            `At pH ${c.ph} it is ${answer}. Unlike a single indicator, it gives an approximate pH rather than a simple yes-or-no.`,
        };
      }

      const other = rng.pick(cases.filter((x) => x.ph !== c.ph));
      const stronger = c.ph < other.ph ? c : other;
      const answer = `pH ${stronger.ph}`;
      return {
        prompt: `Which is the more acidic solution: one at pH ${c.ph} or one at pH ${other.ph}?`,
        answer,
        distractors: wrongOptions(answer, [
          `pH ${stronger.ph === c.ph ? other.ph : c.ph}`,
          "They are equally acidic",
          "Neither is acidic",
        ]),
        explanation:
          `The lower the pH, the more acidic, so pH ${stronger.ph} is the more acidic of the two. ` +
          `The difference is ${Math.abs(c.ph - other.ph)} pH unit${Math.abs(c.ph - other.ph) === 1 ? "" : "s"}, which is a factor of 10${Math.abs(c.ph - other.ph) === 1 ? "" : `^${Math.abs(c.ph - other.ph)}`} in hydrogen ion concentration.`,
        check: () =>
          stronger.ph === Math.min(c.ph, other.ph) ? null : `pH ${stronger.ph} is not the lower of the two`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Redox and displacement
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.react.redox",
    subject: "chemistry",
    topic: "chem-reactions",
    subtopic: "redox",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "In terms of electrons, what is oxidation?", a: "Loss of electrons", wrong: ["Gain of electrons", "Loss of oxygen", "Gain of hydrogen"], why: "OIL RIG: Oxidation Is Loss, Reduction Is Gain — of electrons. Gaining oxygen is one common way to lose electrons, but the electron definition works even for reactions containing no oxygen at all." },
        { q: "In terms of electrons, what is reduction?", a: "Gain of electrons", wrong: ["Loss of electrons", "Gain of oxygen", "Loss of hydrogen"], why: "Reduction is gain of electrons. The name is historical — reduction in MASS when an ore lost its oxygen — but the modern definition is about electrons, and it is the one that generalises." },
        { q: "Zinc displaces copper from copper(II) sulfate solution. Which species is oxidised?", a: "Zinc, which loses two electrons to become Zn²⁺", wrong: ["Copper, which loses two electrons", "The sulfate ion", "Neither — this is not a redox reaction"], why: "Zn → Zn²⁺ + 2e⁻ is oxidation, and Cu²⁺ + 2e⁻ → Cu is reduction. The sulfate is a spectator ion. Every displacement reaction is a redox reaction, with electrons passing from the more reactive metal to the less reactive one's ions." },
        { q: "In the reaction Fe₂O₃ + 3CO → 2Fe + 3CO₂, what has happened to the iron?", a: "It has been reduced, because it has lost oxygen and gained electrons", wrong: ["It has been oxidised, because it has lost oxygen", "It has been oxidised, because it has gained electrons", "It is unchanged"], why: "Iron goes from Fe³⁺ in the oxide to neutral Fe metal, gaining three electrons each: reduction. The carbon monoxide gains oxygen and is oxidised, which is why it is called the reducing agent." },
        { q: "What is a reducing agent?", a: "A substance that gives electrons to something else and is itself oxidised", wrong: ["A substance that gains electrons and is itself reduced", "A substance that reduces the temperature of a reaction", "A substance that slows the reaction down"], why: "The agent does the opposite of what its name suggests happens to it. A reducing agent causes reduction in something else by handing over electrons, so it is itself oxidised — the naming trips almost everyone once." },
        { q: "Magnesium burns in oxygen to form magnesium oxide. What is the oxidising agent?", a: "Oxygen", wrong: ["Magnesium", "Magnesium oxide", "There is no oxidising agent"], why: "Oxygen takes electrons from magnesium, so it causes the oxidation and is the oxidising agent — and is itself reduced from O₂ to O²⁻. Magnesium, which loses the electrons, is the reducing agent." },
        { q: "What happens to the oxidation number of an element when it is oxidised?", a: "It increases", wrong: ["It decreases", "It stays the same", "It becomes zero"], why: "Losing electrons makes a species more positive, so its oxidation number rises. Fe²⁺ → Fe³⁺ is oxidation, and the number going from +2 to +3 is the quickest way to spot it." },
        { q: "Chlorine displaces bromine from potassium bromide. What is happening to the bromide ions?", a: "They are being oxidised — each loses an electron to become part of Br₂", wrong: ["They are being reduced", "They are acting as a catalyst", "They are unchanged spectator ions"], why: "2Br⁻ → Br₂ + 2e⁻ is oxidation. The chlorine takes those electrons and is reduced to Cl⁻. Halogen displacement is a redox reaction just as metal displacement is, with the more reactive halogen taking the electrons." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.react.displacement",
    subject: "chemistry",
    topic: "chem-reactions",
    subtopic: "displacement",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 48,
    build: (rng) => {
      const i = rng.int(0, REACTIVITY.length - 2);
      const j = rng.int(i + 1, REACTIVITY.length - 1);
      const more = REACTIVITY[i];
      const less = REACTIVITY[j];
      const asked = rng.bool();

      if (asked) {
        const answer = `Yes — ${more} is more reactive, so it displaces the ${less}`;
        return {
          prompt:
            `${cap(more)} is added to a solution of a ${less} salt. Does a reaction occur?`,
          answer,
          distractors: wrongOptions(answer, [
            `No — ${less} is more reactive, so nothing happens`,
            `No — a metal can never displace another metal from a solution`,
            `Yes — but only if the solution is heated first`,
          ]),
          explanation:
            `In the reactivity series ${more} sits above ${less}, so ${more} loses its electrons more readily. ` +
            `It gives them to the ${less} ions, which become ${less} metal, and the ${more} goes into solution. ` +
            `The reverse never happens: a less reactive metal cannot displace a more reactive one.`,
          check: () =>
            REACTIVITY.indexOf(more) < REACTIVITY.indexOf(less)
              ? null
              : `${more} is not above ${less} in the series`,
        };
      }

      const answer = `No — ${less} is less reactive than ${more}, so nothing happens`;
      return {
        prompt: `${cap(less)} is added to a solution of a ${more} salt. Does a reaction occur?`,
        answer,
        distractors: wrongOptions(answer, [
          `Yes — ${less} displaces the ${more}`,
          `Yes — any metal displaces any other metal given enough time`,
          `Yes — but only the colour of the solution changes`,
        ]),
        explanation:
          `${cap(less)} sits BELOW ${more} in the reactivity series, so it holds its electrons more tightly and cannot give them to ${more} ions. ` +
          `Displacement only runs one way: more reactive displaces less reactive.`,
        check: () =>
          REACTIVITY.indexOf(less) > REACTIVITY.indexOf(more)
            ? null
            : `${less} is not below ${more} in the series`,
      };
    },
  }),

  generator({
    key: "chem.react.precipitation",
    subject: "chemistry",
    topic: "chem-reactions",
    subtopic: "precipitation",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "What is a precipitate?", a: "An insoluble solid formed when two solutions are mixed", wrong: ["A gas released during a reaction", "A solid that dissolves as the reaction proceeds", "The liquid left after filtering"], why: "When two soluble compounds swap partners and one of the new combinations is insoluble, it drops out of solution as a solid. Filtering separates it; the solution passing through is the filtrate." },
        { q: "Silver nitrate solution is added to sodium chloride solution. What is observed?", a: "A white precipitate of silver chloride forms", wrong: ["A yellow precipitate of silver iodide forms", "Bubbles of chlorine gas are released", "No visible change"], why: "Silver chloride is insoluble, so it appears as a white solid. This is the standard test for chloride ions, and silver bromide (cream) and silver iodide (yellow) let you tell the three halides apart." },
        { q: "Why is dilute nitric acid added before testing for halide ions with silver nitrate?", a: "To remove carbonate ions, which would also give a white precipitate", wrong: ["To make the solution conduct electricity", "To dissolve the silver nitrate", "To speed the reaction up"], why: "Silver carbonate is also insoluble and white, so without the acid a carbonate would be mistaken for a chloride. The acid reacts any carbonate away first, leaving the test unambiguous." },
        { q: "How would you obtain a dry sample of a precipitate from the mixture?", a: "Filter it, wash it with distilled water and leave it to dry", wrong: ["Evaporate the whole mixture to dryness", "Distil the mixture", "Pour off the liquid and heat the solid strongly"], why: "Filtering separates the insoluble solid from the solution. Washing removes traces of the soluble products, and drying gently avoids decomposing it. Evaporating everything would leave the soluble salts mixed in with your product." },
        { q: "Barium chloride solution is added to a solution and a white precipitate forms that does not dissolve in acid. Which ion is present?", a: "Sulfate", wrong: ["Chloride", "Carbonate", "Nitrate"], why: "Barium sulfate is insoluble and, unlike barium carbonate, is unaffected by acid. Adding acid first is what distinguishes the two, since a carbonate would fizz and dissolve." },
        { q: "Why must the ionic equation for a precipitation reaction show a state symbol on the product?", a: "Because the (s) is what shows the product has left the solution", wrong: ["Because state symbols are required in every equation", "Because it shows the reaction is exothermic", "Because it identifies the spectator ions"], why: "The whole point of the reaction is that one combination is insoluble. Written Ag⁺(aq) + Cl⁻(aq) → AgCl(s), the state symbols tell the story: two dissolved ions become a solid." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.react.electrolysis",
    subject: "chemistry",
    topic: "chem-reactions",
    subtopic: "electrolysis",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Which electrode do positive ions travel to during electrolysis?", a: "The cathode, which is negative", wrong: ["The anode, which is positive", "The cathode, which is positive", "Neither — ions do not move"], why: "Opposite charges attract, so positive ions (cations) go to the negative electrode, the cathode. There they gain electrons and are reduced." },
        { q: "Molten lead(II) bromide is electrolysed. What forms at the cathode?", a: "Lead", wrong: ["Bromine", "Hydrogen", "Oxygen"], why: "The cathode is negative and attracts Pb²⁺, which gains two electrons and becomes lead metal. Bromine forms at the anode from Br⁻ losing electrons. In a MOLTEN salt there is no water, so only the two ions present can be discharged." },
        { q: "Why must an ionic compound be molten or dissolved before it can be electrolysed?", a: "The ions must be free to move to carry the current", wrong: ["The compound must be hot to react", "Solid compounds contain no ions", "Electricity cannot pass through any solid"], why: "The ions exist in the solid, but they are locked in the lattice. Melting or dissolving frees them to travel to the electrodes, and that movement of charge IS the current." },
        { q: "Concentrated sodium chloride solution is electrolysed. What forms at the anode?", a: "Chlorine", wrong: ["Oxygen", "Sodium", "Hydrogen"], why: "The anode attracts the negative ions, Cl⁻ and OH⁻. Chloride wins when the solution is concentrated, giving chlorine gas. In a DILUTE solution oxygen would be produced instead, which is why the concentration is specified." },
        { q: "Dilute sodium chloride solution is electrolysed. What forms at the cathode?", a: "Hydrogen", wrong: ["Sodium", "Chlorine", "Oxygen"], why: "Both Na⁺ and H⁺ are attracted to the cathode, and the less reactive element is discharged — hydrogen. Sodium is far too reactive to be produced from an aqueous solution, which is why it is extracted from the molten salt instead." },
        { q: "Why is aluminium extracted by electrolysis rather than by heating with carbon?", a: "Aluminium is more reactive than carbon, so carbon cannot displace it from its ore", wrong: ["Aluminium oxide does not melt", "Carbon would contaminate the aluminium", "Electrolysis is cheaper than heating"], why: "Reduction with carbon only works for metals below carbon in the reactivity series, such as iron. Aluminium is above it, so its ions hold their electrons too tightly and electricity must supply them instead — which is why aluminium was once more precious than gold." },
        { q: "Why is cryolite added to aluminium oxide during electrolysis?", a: "It lowers the melting point, saving energy", wrong: ["It increases the yield of aluminium", "It prevents the electrodes from reacting", "It makes the aluminium purer"], why: "Pure aluminium oxide melts at over 2000 °C. Dissolving it in molten cryolite allows the process to run near 950 °C, which is the difference between a viable industrial process and an impossible one." },
        { q: "Why do the carbon anodes in aluminium extraction need replacing regularly?", a: "Oxygen produced at the anode reacts with the carbon, burning it away", wrong: ["The aluminium coats them", "They dissolve in the cryolite", "The electric current wears them down"], why: "Oxygen is discharged at the anode and, at nearly 1000 °C, immediately reacts with the carbon to form carbon dioxide. The anodes are consumed and must be replaced, which is a significant part of the running cost." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Rates
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.rates.calculate",
    subject: "chemistry",
    topic: "chem-rates",
    subtopic: "rate-calculations",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      /* The rate is chosen and the quantities built around it. */
      const rate = rng.pick([0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 4, 5, 8, 10, 20, 25]);
      const time = rng.pick([2, 4, 5, 10, 20, 25, 40, 50, 100, 200]);
      const amount = exact(rate * time, 2);
      const unit = rng.pick(["cm³ of gas", "g of product"] as const);
      const rateUnit = unit === "cm³ of gas" ? "cm³/s" : "g/s";
      const asked = rng.pick(["rate", "amount", "time"] as const);

      if (asked === "rate") {
        const answer = ans(rate, rateUnit);
        return {
          prompt: `A reaction produces ${num(amount)} ${unit} in ${time} s. What is the mean rate of reaction?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(time / amount, rateUnit), // inverted the division
            slip(amount * time, rateUnit), // multiplied instead of dividing
            slip(amount, rateUnit), // gave the quantity
            slip(time, rateUnit), // gave the time
          ]),
          explanation:
            `Mean rate = quantity ÷ time = ${num(amount)} ÷ ${time} = ${answer}. ` +
            `This is a MEAN: the actual rate is fastest at the start, when the reactants are most concentrated, and falls as they are used up.`,
          check: () => (agrees(rate * time, amount) ? null : `rate × time gives ${rate * time}, not ${amount}`),
        };
      }

      if (asked === "amount") {
        const answer = ans(amount, unit);
        return {
          prompt: `A reaction proceeds at a mean rate of ${num(rate)} ${rateUnit} for ${time} s. How much is produced?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(rate / time, unit), // divided instead of multiplying
            slip(time / rate, unit), // inverted
            slip(rate, unit), // gave the rate
            slip(time, unit), // gave the time
          ]),
          explanation: `quantity = rate × time = ${num(rate)} × ${time} = ${answer}.`,
          check: () => (agrees(amount / time, rate) ? null : `amount ÷ time gives ${amount / time}, not ${rate}`),
        };
      }

      const answer = ans(time, "s");
      return {
        prompt: `A reaction proceeds at a mean rate of ${num(rate)} ${rateUnit} and produces ${num(amount)} ${unit}. How long does it take?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(rate * amount, "s"), // multiplied instead of dividing
          slip(rate / amount, "s"), // inverted the division
          slip(amount, "s"), // gave the quantity
          slip(rate, "s"), // gave the rate
        ]),
        explanation: `time = quantity ÷ rate = ${num(amount)} ÷ ${num(rate)} = ${answer}.`,
        check: () => (agrees(rate * time, amount) ? null : `rate × time gives ${rate * time}, not ${amount}`),
      };
    },
  }),

  generator({
    key: "chem.rates.collision-theory",
    subject: "chemistry",
    topic: "chem-rates",
    subtopic: "collision-theory",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "According to collision theory, what two conditions must be met for a reaction to occur?", a: "Particles must collide, and with at least the activation energy", wrong: ["Particles must collide, and the reaction must be exothermic", "Particles must be heated, and a catalyst must be present", "Particles must collide, and be of the same size"], why: "Colliding is necessary but not sufficient — most collisions simply bounce. Only those carrying at least the activation energy, and in the right orientation, lead to reaction." },
        { q: "Why does increasing the temperature increase the rate of reaction?", a: "Particles move faster, so they collide more often AND more collisions exceed the activation energy", wrong: ["Only because the particles collide more often", "Only because the activation energy falls", "Because the particles become smaller"], why: "Both effects operate, and the second is the larger. A modest temperature rise increases collision frequency a little but increases the FRACTION of collisions that are energetic enough a great deal, which is why rates are so sensitive to temperature." },
        { q: "Why does increasing the concentration of a solution increase the rate of reaction?", a: "There are more particles in the same volume, so collisions are more frequent", wrong: ["The particles move faster", "The activation energy is lowered", "The particles become more energetic"], why: "Concentration changes how CROWDED the particles are, not how fast they move. More particles per unit volume means more collisions per second, but each collision is no more energetic than before." },
        { q: "Why does powdering a solid reactant increase the rate of reaction?", a: "It increases the surface area, so more particles are exposed to collide with", wrong: ["It increases the concentration of the solid", "It raises the temperature of the solid", "It lowers the activation energy"], why: "Reaction happens at the surface of a solid. Breaking a lump into powder exposes far more of the substance at once, so collisions with the other reactant happen much more frequently." },
        { q: "What is activation energy?", a: "The minimum energy colliding particles need for a reaction to occur", wrong: ["The energy released by the reaction", "The energy needed to melt the reactants", "The difference in energy between reactants and products"], why: "It is the barrier a collision must clear, shown as the hump on a reaction profile. It is not the same as the overall energy change, which is the difference in level between reactants and products." },
        { q: "Increasing the pressure of a gas reaction increases its rate. Why?", a: "The same number of particles occupies a smaller volume, so collisions are more frequent", wrong: ["The particles gain energy from the pressure", "The activation energy falls at high pressure", "The gas becomes a liquid"], why: "Raising the pressure on a gas is the equivalent of raising the concentration of a solution: the particles are pushed closer together and collide more often. Their average energy is unchanged if the temperature is unchanged." },
        { q: "A reaction between a solid and an acid produces gas. How can its rate be measured?", a: "By measuring the volume of gas collected at regular intervals", wrong: ["By measuring the temperature at the end", "By weighing the acid before the reaction", "By measuring the pH at the end only"], why: "Rate needs a quantity measured AGAINST TIME, so readings must be taken repeatedly. Collecting the gas in a syringe, or measuring the flask's falling mass, both give the data a rate graph needs." },
        { q: "On a graph of gas volume against time, what does the gradient represent?", a: "The rate of reaction at that moment", wrong: ["The total amount of product", "The activation energy", "The concentration of the reactants"], why: "The gradient is volume per unit time, which is exactly the rate. It is steepest at the start and flattens as reactants are consumed; where the line becomes horizontal the reaction has stopped." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.rates.catalysts",
    subject: "chemistry",
    topic: "chem-rates",
    subtopic: "catalysts",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "How does a catalyst increase the rate of a reaction?", a: "It provides an alternative pathway with a lower activation energy", wrong: ["It lowers the temperature needed to react", "It increases the energy of the particles", "It increases the concentration of the reactants"], why: "The catalyst does not change the reactants' energy or the products'. It offers a different route over a lower barrier, so a much larger fraction of collisions has enough energy to succeed." },
        { q: "What happens to a catalyst during a reaction?", a: "It is chemically unchanged at the end and can be reused", wrong: ["It is used up in proportion to the products formed", "It becomes part of the product", "It is converted into a different catalyst"], why: "A catalyst takes part — often forming intermediates — but is regenerated by the end. That is why a tiny mass of it can process an enormous quantity of reactant." },
        { q: "Does a catalyst change the amount of product formed?", a: "No — it changes only how quickly equilibrium or completion is reached", wrong: ["Yes, it increases the yield", "Yes, it decreases the yield", "Yes, it changes which products form"], why: "A catalyst speeds up the forward and reverse reactions equally, so it reaches the same destination sooner. In industry that means the same yield at a lower temperature, which is a cost saving rather than a yield gain." },
        { q: "What effect does a catalyst have on the enthalpy change of a reaction?", a: "None — the reactants and products are unchanged", wrong: ["It makes the reaction more exothermic", "It makes the reaction less exothermic", "It reverses the sign of the enthalpy change"], why: "Enthalpy change is the difference in energy between reactants and products, and a catalyst alters neither. It only lowers the hump between them, which is why the two levels on a reaction profile stay exactly where they were." },
        { q: "What is used as the catalyst in the Haber process?", a: "Iron", wrong: ["Platinum", "Nickel", "Vanadium(V) oxide"], why: "Iron catalyses the reaction between nitrogen and hydrogen. Platinum is used in catalytic converters, nickel in hydrogenating vegetable oils, and vanadium(V) oxide in the Contact process — knowing which goes with which is worth the marks." },
        { q: "Why are enzymes described as biological catalysts?", a: "They are proteins that speed up reactions in living things without being used up", wrong: ["They are made of metal and speed up reactions in the body", "They are used up during digestion", "They raise the body's temperature to speed reactions up"], why: "Enzymes lower activation energies exactly as any catalyst does, letting reactions run fast at body temperature. Being proteins, they are denatured by heat or extreme pH — which is the one way they differ from industrial catalysts in practice." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.rates.le-chatelier",
    subject: "chemistry",
    topic: "chem-rates",
    subtopic: "le-chatelier",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What does Le Chatelier's principle state?", a: "A system at equilibrium shifts to oppose any change imposed on it", wrong: ["A system at equilibrium always shifts to the right", "A system at equilibrium cannot be changed", "A system at equilibrium shifts to increase the change imposed"], why: "The equilibrium moves in whichever direction partly cancels the disturbance. It never fully cancels it, which is why raising the pressure still leaves a higher pressure than before — just less high than it would otherwise have been." },
        { q: "For N₂ + 3H₂ ⇌ 2NH₃, what is the effect of increasing the pressure?", a: "The equilibrium shifts right, because there are fewer gas moles on that side", wrong: ["The equilibrium shifts left, toward more gas moles", "There is no effect, because the reaction is exothermic", "The equilibrium shifts right, because ammonia is a gas"], why: "Four moles of gas become two, so shifting right reduces the number of gas particles and opposes the pressure rise. Counting gas moles on each side is the whole method for pressure changes." },
        { q: "A forward reaction is exothermic. What happens to the equilibrium position when the temperature is raised?", a: "It shifts toward the reactants, because the backward reaction is endothermic", wrong: ["It shifts toward the products", "It does not move, only the rate changes", "It shifts toward whichever side has fewer moles"], why: "The system opposes the added heat by favouring the direction that absorbs it — the endothermic one, which here is backwards. This is why the Haber process runs at a compromise temperature: hotter is faster but gives a poorer yield." },
        { q: "What is the effect of adding a catalyst to a system at equilibrium?", a: "It reaches equilibrium faster but the position is unchanged", wrong: ["It shifts the equilibrium to the right", "It shifts the equilibrium to the left", "It prevents equilibrium being reached"], why: "A catalyst lowers the activation energy of the forward and backward reactions equally, so both speed up by the same factor and the balance point is untouched." },
        { q: "For a reaction with equal numbers of gas moles on both sides, what is the effect of changing the pressure?", a: "No change in the equilibrium position", wrong: ["It shifts right", "It shifts left", "The reaction stops"], why: "With the same number of gas particles either way, neither direction relieves the pressure change, so there is nothing for the system to oppose. H₂ + I₂ ⇌ 2HI is the standard example." },
        { q: "What does it mean for a reaction to be at dynamic equilibrium?", a: "The forward and backward reactions continue at equal rates, so concentrations stay constant", wrong: ["Both reactions have stopped", "Only the forward reaction continues", "The concentrations of reactants and products are equal"], why: "Nothing has stopped — the two opposing reactions are simply going at the same speed, so nothing appears to change. Note that equal RATES is not the same as equal CONCENTRATIONS, which is a common confusion." },
        { q: "What condition is required for a dynamic equilibrium to be established?", a: "The system must be closed, so nothing enters or leaves", wrong: ["The system must be at high pressure", "A catalyst must be present", "The reaction must be exothermic"], why: "If a product escapes — a gas leaving an open flask, say — the backward reaction can never balance the forward one, and the reaction simply goes to completion. Enclosure is what makes equilibrium possible at all." },
        { q: "Removing a product from an equilibrium mixture as it forms has what effect?", a: "The equilibrium shifts right to replace it, increasing the overall yield", wrong: ["The equilibrium shifts left", "The equilibrium is unaffected", "The reaction stops"], why: "The system opposes the removal by making more of what was taken. This is exploited industrially: liquefying and removing ammonia in the Haber process keeps pulling the equilibrium toward the product." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.rates.equilibrium-position",
    subject: "chemistry",
    topic: "chem-rates",
    subtopic: "equilibrium-position",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "What does it mean to say the equilibrium 'lies to the right'?", a: "The mixture contains more products than reactants at equilibrium", wrong: ["The forward reaction is faster than the backward one", "The reaction has gone to completion", "The reaction is exothermic"], why: "It describes the composition of the mixture, not the rates — at equilibrium the rates are equal by definition. Lying to the right means the products dominate the mixture." },
        { q: "The Haber process runs at about 450 °C even though a lower temperature would give a better yield. Why?", a: "At a lower temperature the reaction would be far too slow to be economic", wrong: ["A lower temperature would give a worse yield", "The catalyst only works above 450 °C", "Ammonia decomposes below 450 °C"], why: "It is a compromise. The forward reaction is exothermic, so cooling improves the yield but slows everything down; 450 °C sacrifices some yield for a rate that makes the plant viable, and unreacted gases are recycled." },
        { q: "Why does the Haber process use a pressure of around 200 atmospheres rather than a much higher one?", a: "Higher pressures would improve the yield but the plant would be too expensive and dangerous", wrong: ["Higher pressures would lower the yield", "The catalyst fails above 200 atmospheres", "Ammonia would decompose at higher pressure"], why: "Yield does keep improving with pressure — four gas moles become two — but the cost of vessels and pumps that can hold much more rises faster than the benefit. It is an economic compromise, not a chemical limit." },
        { q: "In the Contact process, why is a temperature of about 450 °C used?", a: "It balances a reasonable yield against an acceptable rate for an exothermic reaction", wrong: ["It maximises the yield", "It is the lowest temperature at which the reaction occurs", "It prevents the catalyst from melting"], why: "The same compromise as the Haber process: the forward reaction is exothermic, so a lower temperature would give more sulfur trioxide but far too slowly to be worth running." },
        { q: "What happens to the RATE of both forward and backward reactions when a system reaches equilibrium?", a: "They become equal and stay equal", wrong: ["Both fall to zero", "The forward rate exceeds the backward rate", "The backward rate exceeds the forward rate"], why: "Equilibrium is defined by the two rates matching. Both reactions continue at that shared rate, which is why the state is called dynamic rather than static." },
        { q: "Adding more of a reactant to a system at equilibrium has what effect on the position?", a: "It shifts right, using up some of the added reactant", wrong: ["It shifts left", "It has no effect", "It stops the reaction"], why: "The system opposes the increase by consuming some of what was added, which makes more product. Note it never uses up ALL of the addition — the new equilibrium still has more of that reactant than the old one." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.rates.kc",
    subject: "chemistry",
    topic: "chem-rates",
    subtopic: "equilibrium-constant",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 48,
    build: (rng) => {
      /* Kc built from concentrations that divide, for A + B ⇌ C + D. The cases
         are enumerated at module load, so every one of them is usable. */
      const { kc, a, b, c, d } = rng.pick(KC_CASES);

      const answer = ans(d, "mol/dm³");

      return {
        prompt:
          `For the equilibrium A + B ⇌ C + D, Kc = ${num(kc)}. At equilibrium [A] = ${num(a)}, [B] = ${num(b)} and [C] = ${num(c)} mol/dm³. ` +
          `What is [D]?`,
        answer,
        distractors: pickDistractors(answer, [
          slip((a * b) / (kc * c), "mol/dm³"), // inverted the expression
          slip(kc * a * b * c, "mol/dm³"), // multiplied by [C] instead of dividing
          slip(kc, "mol/dm³"), // gave Kc
          slip(c, "mol/dm³"), // gave [C]
        ]),
        explanation:
          `Kc = [C][D] ÷ ([A][B]), so [D] = Kc × [A][B] ÷ [C] = ${num(kc)} × ${num(a)} × ${num(b)} ÷ ${num(c)} = ${answer}. ` +
          `Products go on TOP of the expression and reactants underneath — getting that the wrong way round inverts the answer.`,
        check: () => {
          const recomputed = (c * d) / (a * b);
          return agrees(recomputed, kc) ? null : `the concentrations give Kc = ${recomputed}, not ${kc}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Analysis
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.analysis.ion-tests",
    subject: "chemistry",
    topic: "chem-analysis",
    subtopic: "chemical-tests",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 32,
    build: (rng) => {
      const useGas = rng.bool(0.3);

      if (useGas) {
        const g = rng.pick(GAS_TESTS);
        const asked = rng.bool();
        if (asked) {
          const answer = g.test;
          return {
            prompt: `What is the test for ${g.gas} gas?`,
            answer,
            distractors: wrongOptions(answer, GAS_TESTS.filter((x) => x.gas !== g.gas).map((x) => x.test)),
            explanation:
              `${cap(g.gas)}: ${answer.toLowerCase()}. ` +
              `These five tests come up repeatedly, and the commonest confusion is between relighting a glowing splint (oxygen) and the squeaky pop (hydrogen).`,
          };
        }
        const answer = g.gas;
        return {
          prompt: `An unknown gas is tested and the result is: ${g.test.toLowerCase()}. Which gas is it?`,
          answer,
          distractors: wrongOptions(answer, GAS_TESTS.filter((x) => x.gas !== g.gas).map((x) => x.gas)),
          explanation: `That result identifies ${answer}. ${g.test}`,
        };
      }

      const row = rng.pick(ION_TESTS);
      const asked = rng.bool();

      if (asked) {
        const answer = row.result;
        return {
          prompt: `A solution is tested for ${row.ion} ions using ${row.test}. What is the positive result?`,
          answer,
          distractors: wrongOptions(
            answer,
            ION_TESTS.filter((x) => x.result !== row.result).map((x) => x.result).slice(0, 5),
          ),
          explanation:
            `${cap(row.ion)} with ${row.test} gives a ${answer}. ` +
            `The colour is the whole result — writing "a precipitate forms" without naming the colour earns nothing, because every one of these tests gives a precipitate.`,
        };
      }

      const answer = row.ion;
      return {
        prompt: `Adding ${row.test} to a solution gives a ${row.result}. Which ion is present?`,
        answer,
        distractors: wrongOptions(
          answer,
          ION_TESTS.filter((x) => x.ion !== row.ion).map((x) => x.ion).slice(0, 5),
        ),
        explanation: `A ${row.result} with ${row.test} identifies ${answer} ions.`,
      };
    },
  }),

  generator({
    key: "chem.analysis.chromatography",
    subject: "chemistry",
    topic: "chem-analysis",
    subtopic: "chromatography",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      /* Rf built from the ratio, so it always lands on two decimal places.
         Every value here has at most two decimals and every solvent distance is
         a whole number, so the product is exact by construction — 0.625 was in
         this list once and threw, because an Rf of 0.625 cannot be published to
         two decimal places. */
      const rf = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9]);
      const solventDistance = rng.pick([4, 5, 8, 10, 12, 16, 20, 25]);
      const spotDistance = exact(rf * solventDistance, 2, "spot distance");

      const asked = rng.bool();

      if (asked) {
        const answer = ans(rf);
        return {
          prompt:
            `In a chromatogram the solvent front travels ${solventDistance} cm and a spot travels ${num(spotDistance)} cm. ` +
            `What is the Rf value of that spot?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(solventDistance / spotDistance, ""), // inverted the ratio
            slip(spotDistance, ""), // gave the spot distance
            slip(solventDistance - spotDistance, ""), // subtracted the distances
            slip(rf * 100, ""), // gave a percentage without saying so
          ]),
          explanation:
            `Rf = distance moved by the spot ÷ distance moved by the solvent = ${num(spotDistance)} ÷ ${solventDistance} = ${answer}. ` +
            `Rf is always between 0 and 1, because the spot can never travel further than the solvent carrying it — a value above 1 means the ratio is upside down.`,
          check: () => {
            if (rf > 1) return `an Rf of ${rf} is impossible`;
            return agrees(rf * solventDistance, spotDistance) ? null : `Rf × solvent gives ${rf * solventDistance}`;
          },
        };
      }

      const answer = ans(spotDistance, "cm");
      return {
        prompt:
          `A substance has an Rf value of ${num(rf)}. In a chromatogram where the solvent front travels ${solventDistance} cm, ` +
          `how far does the spot travel?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(solventDistance / rf, "cm"), // divided instead of multiplying
          slip(solventDistance, "cm"), // gave the solvent distance
          slip(solventDistance - spotDistance, "cm"), // gave the remaining distance
          slip(rf, "cm"), // gave the Rf as a distance
        ]),
        explanation:
          `distance = Rf × solvent distance = ${num(rf)} × ${solventDistance} = ${answer}. ` +
          `Since Rf is below 1, the spot always travels less far than the solvent front.`,
        check: () =>
          agrees(spotDistance / solventDistance, rf) ? null : `the ratio gives ${spotDistance / solventDistance}`,
      };
    },
  }),

  generator({
    key: "chem.analysis.purity",
    subject: "chemistry",
    topic: "chem-analysis",
    subtopic: "purity",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "In chemistry, what does it mean for a substance to be pure?", a: "It is a single element or compound, not mixed with anything else", wrong: ["It contains nothing harmful", "It is entirely natural", "It has been filtered"], why: "The chemical meaning is stricter than the everyday one. 'Pure orange juice' contains water, sugars, acids and more — a chemist would call it a mixture. A pure substance has one component only." },
        { q: "How does a pure substance behave when melted, compared with a mixture?", a: "It melts sharply at one fixed temperature", wrong: ["It melts over a range of temperatures", "It does not melt at all", "It melts at a lower temperature than any of its components"], why: "A sharp, fixed melting point is the test for purity. An impurity lowers the melting point AND spreads it over a range, so a broad or shifted melting point is direct evidence of contamination." },
        { q: "What is a formulation?", a: "A mixture designed so that each component has a specific purpose", wrong: ["A pure compound made industrially", "A mixture of only two substances", "Any solution of a solid in a liquid"], why: "Paints, fuels, medicines and cleaning products are all formulations: their proportions are chosen deliberately so each ingredient does a job. They are mixtures, but carefully designed ones rather than accidental ones." },
        { q: "A sample melts between 52 °C and 58 °C. What does this suggest?", a: "It is impure", wrong: ["It is pure and melts at 55 °C on average", "It is a pure element", "The thermometer is faulty"], why: "A melting RANGE rather than a single point is the signature of impurity. A pure substance would give a sharp transition; a six-degree spread means something else is present." },
        { q: "Why is paper chromatography able to separate the dyes in an ink?", a: "Different dyes have different affinities for the paper and the solvent, so they move at different speeds", wrong: ["Different dyes have different colours", "The dyes react with the paper at different rates", "Heavier dyes sink and lighter ones rise"], why: "Each dye divides itself between the stationary phase (the paper) and the mobile phase (the solvent). A dye that spends more time in the solvent travels further, which is exactly what the Rf value measures." },
        { q: "On a chromatogram, what does a single spot in a sample lane indicate?", a: "The sample is likely to be a pure substance", wrong: ["The sample contains exactly two components", "The sample failed to dissolve", "The solvent was the wrong one"], why: "One spot means one component travelling at one rate — good evidence of purity. Two or more spots prove a mixture. It is only good evidence rather than proof, since two components could coincidentally share an Rf in that solvent." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.analysis.spectroscopy",
    subject: "chemistry",
    topic: "chem-analysis",
    subtopic: "spectroscopy",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "In a mass spectrum, what does the peak with the highest mass-to-charge ratio usually represent?", a: "The molecular ion, giving the relative molecular mass", wrong: ["The most abundant fragment", "The base peak", "The lightest fragment"], why: "The molecular ion is the whole molecule with one electron removed, so its m/z gives the relative molecular mass directly. Peaks below it are fragments produced when the molecular ion breaks up." },
        { q: "Chlorine's mass spectrum shows peaks at m/z 35 and 37 in roughly a 3 : 1 ratio. What does this tell you?", a: "Chlorine has two isotopes, and the taller peak is the more abundant one", wrong: ["Chlorine forms two different compounds", "The spectrometer is miscalibrated", "Chlorine has two different charges"], why: "Peak heights give relative abundance. A 3 : 1 ratio of ³⁵Cl to ³⁷Cl gives a weighted mean of (35 × 75 + 37 × 25) ÷ 100 = 35.5, which is exactly the relative atomic mass in the data booklet." },
        { q: "What is the base peak in a mass spectrum?", a: "The tallest peak, from the most abundant ion", wrong: ["The peak at the highest m/z", "The peak at the lowest m/z", "The peak from the molecular ion"], why: "The base peak is simply the most abundant ion and is assigned 100% relative abundance. It is often a stable fragment rather than the molecular ion." },
        { q: "Why must a sample be ionised before it enters a mass spectrometer's analyser?", a: "Only charged particles can be deflected by the electric and magnetic fields", wrong: ["Ionisation makes the sample lighter", "Ionisation breaks the sample into elements", "Neutral molecules would react with the detector"], why: "The instrument separates particles by accelerating and deflecting them, and both depend on charge. A neutral molecule would pass straight through unaffected and never reach the detector in a measurable way." },
        { q: "Two isotopes of an element give peaks at m/z 63 and 65 with abundances of 75% and 25%. What is the relative atomic mass?", a: "63.5", wrong: ["64", "63", "65"], why: "The weighted mean is (63 × 75 + 65 × 25) ÷ 100 = (4725 + 1625) ÷ 100 = 63.5. A simple average would give 64, which would only be right if the two were equally abundant. This is copper." },
        { q: "What does the m/z axis on a mass spectrum represent?", a: "Mass divided by charge, which equals the mass for singly charged ions", wrong: ["Mass multiplied by charge", "The number of molecules detected", "The energy of each ion"], why: "Almost all ions in a standard spectrum carry a single positive charge, so m/z is numerically the same as the mass. Doubly charged ions appear at half their mass, which is occasionally the explanation for an unexpected peak." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
