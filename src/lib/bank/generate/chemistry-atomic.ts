/**
 * Chemistry: Atomic structure, bonding and the periodic table.
 *
 * Half of this file is computed and half is reasoning, and the split is honest
 * about which is which.
 *
 * THE COMPUTED HALF works like the rest of the bank: particle counts come from
 * the atomic number and mass number, electron configurations from the shell
 * rules, and relative atomic masses from weighted means of isotope abundances
 * chosen so the mean lands on one decimal place. Every one carries a `check`.
 *
 * THE REASONING HALF — why an ionic lattice conducts when molten but not when
 * solid, why graphite is soft and diamond is not — has no arithmetic to verify,
 * so it is written case by case and each case names the misconception its
 * distractors come from. Those generators declare exactly as many variants as
 * they have cases, because a reasoning question has no parameters to vary and
 * claiming otherwise would make the framework throw.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, cap, exact, num, slip, tidy, wrongOptions } from "./physics-kit";
import { ATOMIC_NUMBERS, ELEMENT_NAMES, RELATIVE_MASSES, formula } from "./chemistry-kit";

/* ==========================================================================
   Data
   ========================================================================== */

/** Isotopes worth asking about, with mass numbers students meet. */
const ISOTOPES: readonly { symbol: string; a: number }[] = [
  { symbol: "C", a: 12 }, { symbol: "C", a: 13 }, { symbol: "C", a: 14 },
  { symbol: "O", a: 16 }, { symbol: "O", a: 18 },
  { symbol: "Cl", a: 35 }, { symbol: "Cl", a: 37 },
  { symbol: "H", a: 1 }, { symbol: "H", a: 2 }, { symbol: "H", a: 3 },
  { symbol: "Na", a: 23 }, { symbol: "Mg", a: 24 }, { symbol: "Mg", a: 26 },
  { symbol: "K", a: 39 }, { symbol: "K", a: 41 },
  { symbol: "Ca", a: 40 }, { symbol: "Fe", a: 56 }, { symbol: "Cu", a: 63 },
  { symbol: "Cu", a: 65 }, { symbol: "Br", a: 79 }, { symbol: "Br", a: 81 },
  { symbol: "N", a: 14 }, { symbol: "S", a: 32 }, { symbol: "Al", a: 27 },
  { symbol: "Ne", a: 20 }, { symbol: "Ne", a: 22 }, { symbol: "Li", a: 7 },
];

/**
 * Two-isotope mixtures whose weighted mean lands on one decimal place.
 *
 * Built from the abundance rather than checked afterwards: the percentages that
 * work are the ones ending in 0 or 5 for a mass gap of 2, which is why they are
 * enumerated rather than drawn at random.
 */
const ABUNDANCES: readonly { symbol: string; a1: number; a2: number; p1: number; mean: number }[] = (() => {
  const out: { symbol: string; a1: number; a2: number; p1: number; mean: number }[] = [];
  const pairs = [
    { symbol: "Cl", a1: 35, a2: 37 },
    { symbol: "Cu", a1: 63, a2: 65 },
    { symbol: "Br", a1: 79, a2: 81 },
    { symbol: "B", a1: 10, a2: 11 },
    { symbol: "Li", a1: 6, a2: 7 },
    { symbol: "Ga", a1: 69, a2: 71 },
    { symbol: "Ag", a1: 107, a2: 109 },
  ];
  for (const pair of pairs) {
    for (let p1 = 10; p1 <= 90; p1 += 5) {
      const mean = (pair.a1 * p1 + pair.a2 * (100 - p1)) / 100;
      if (!tidy(mean)) continue;
      out.push({ symbol: pair.symbol, a1: pair.a1, a2: pair.a2, p1, mean });
    }
  }
  return out;
})();

/** Elements whose electron configuration follows the simple 2, 8, 8 rule. */
const SHELL_ELEMENTS = [
  "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
  "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
];

/** The 2, 8, 8, 2 filling, as written at GCSE. */
function shellConfiguration(z: number): string {
  const shells: number[] = [];
  let left = z;
  for (const capacity of [2, 8, 8, 2]) {
    if (left <= 0) break;
    const inShell = Math.min(left, capacity);
    shells.push(inShell);
    left -= inShell;
  }
  return shells.join(",");
}

/** Group number from the outer shell, for the elements above. */
function groupOf(z: number): number | null {
  const shells = shellConfiguration(z).split(",").map(Number);
  const outer = shells[shells.length - 1];
  if (z === 2) return 0; // helium is in group 0 despite having two electrons
  if (outer === 8) return 0;
  return outer;
}

const IONS: readonly { symbol: string; charge: number }[] = [
  { symbol: "Na", charge: 1 }, { symbol: "K", charge: 1 }, { symbol: "Li", charge: 1 },
  { symbol: "Mg", charge: 2 }, { symbol: "Ca", charge: 2 }, { symbol: "Ba", charge: 2 },
  { symbol: "Al", charge: 3 },
  { symbol: "Cl", charge: -1 }, { symbol: "Br", charge: -1 }, { symbol: "I", charge: -1 },
  { symbol: "O", charge: -2 }, { symbol: "S", charge: -2 },
];

/* ==========================================================================
   The generators
   ========================================================================== */

export const chemistryAtomic: Generator[] = [
  /* ------------------------------------------------------------------------
     Sub-atomic particles
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.atom.particles",
    subject: "chemistry",
    topic: "chem-atomic",
    subtopic: "sub-atomic-particles",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 48,
    build: (rng) => {
      const iso = rng.pick(ISOTOPES);
      const z = ATOMIC_NUMBERS[iso.symbol];
      const neutrons = iso.a - z;
      const asked = rng.pick(["neutrons", "protons", "electrons"] as const);
      const name = ELEMENT_NAMES[iso.symbol];

      if (asked === "neutrons") {
        const answer = ans(neutrons);
        return {
          prompt:
            `An atom of ${name} has mass number ${iso.a} and atomic number ${z}. ` +
            `How many neutrons does it contain?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(iso.a, ""), // gave the mass number
            slip(z, ""), // gave the atomic number
            slip(iso.a + z, ""), // added instead of subtracting
            slip(neutrons + 1, ""), // off by one
          ]),
          explanation:
            `The mass number counts protons AND neutrons; the atomic number counts protons alone. ` +
            `Neutrons = ${iso.a} − ${z} = ${answer}. ` +
            `Changing the neutron count gives an isotope of the same element; changing the proton count gives a different element entirely.`,
          check: () => (agrees(neutrons + z, iso.a) ? null : `${neutrons} + ${z} ≠ ${iso.a}`),
        };
      }

      if (asked === "protons") {
        const answer = ans(z);
        return {
          prompt:
            `An atom of ${name} has mass number ${iso.a} and ${neutrons} neutrons. ` +
            `How many protons does it have?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(iso.a, ""), // gave the mass number
            slip(neutrons, ""), // gave the neutron count
            slip(iso.a + neutrons, ""), // added instead of subtracting
            slip(z * 2, ""), // doubled
          ]),
          explanation:
            `Protons = mass number − neutrons = ${iso.a} − ${neutrons} = ${answer}. ` +
            `The proton number is what defines the element: every ${name} atom has ${z} protons, whatever its mass number.`,
          check: () => (agrees(z + neutrons, iso.a) ? null : `${z} + ${neutrons} ≠ ${iso.a}`),
        };
      }

      const answer = ans(z);
      return {
        prompt: `A neutral atom of ${name} has ${z} protons. How many electrons does it have?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(iso.a, ""), // gave the mass number
          slip(neutrons, ""), // gave the neutron count
          slip(z + 1, ""), // off by one
          slip(0, ""), // said neutral means no electrons
        ]),
        explanation:
          `A neutral atom has equal numbers of protons and electrons, so their charges cancel: ${answer}. ` +
          `An ION is an atom that has gained or lost electrons, which is precisely why it carries a charge.`,
        check: () => (agrees(z, ATOMIC_NUMBERS[iso.symbol]) ? null : `atomic number mismatch`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Isotopes and relative atomic mass
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.atom.isotopes",
    subject: "chemistry",
    topic: "chem-atomic",
    subtopic: "isotopes",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 48,
    build: (rng) => {
      const iso = rng.pick(ISOTOPES);
      const z = ATOMIC_NUMBERS[iso.symbol];
      const other = rng.pick([2, 1, 3]);
      const name = ELEMENT_NAMES[iso.symbol];
      const answer = `Same number of protons (${z}), different number of neutrons`;

      return {
        prompt:
          `${cap(name)}-${iso.a} and ${name}-${iso.a + other} are isotopes of the same element. ` +
          `How do their atoms differ?`,
        answer,
        distractors: wrongOptions(answer, [
          `Different number of protons, same number of neutrons`,
          `Different number of electrons, same number of protons`,
          `Different number of protons and electrons`,
          `They are identical in every way except their name`,
        ]),
        explanation:
          `Isotopes are atoms of the same element — so the same ${z} protons — with different numbers of neutrons: ` +
          `${iso.a - z} and ${iso.a + other - z} respectively. ` +
          `Because chemistry is decided by the ELECTRONS, and the electron count follows the proton count, isotopes react identically. ` +
          `Only their mass and their nuclear stability differ.`,
        check: () =>
          agrees(iso.a - z + other, iso.a + other - z)
            ? null
            : "the neutron counts do not differ by the stated amount",
      };
    },
  }),

  generator({
    key: "chem.atom.ram",
    subject: "chemistry",
    topic: "chem-atomic",
    subtopic: "relative-atomic-mass",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 48,
    build: (rng) => {
      const row = rng.pick(ABUNDANCES);
      const p2 = 100 - row.p1;
      const name = ELEMENT_NAMES[row.symbol] ?? row.symbol;
      const answer = ans(row.mean);

      return {
        prompt:
          `A sample of ${name} contains ${row.p1}% of the mass-${row.a1} isotope and ${p2}% of the mass-${row.a2} isotope. ` +
          `Calculate its relative atomic mass.`,
        answer,
        distractors: pickDistractors(answer, [
          slip((row.a1 + row.a2) / 2, ""), // took a simple average, ignoring abundance
          slip(row.a1, ""), // gave the lighter isotope
          slip(row.a2, ""), // gave the heavier isotope
          slip((row.a1 * p2 + row.a2 * row.p1) / 100, ""), // swapped the two abundances
        ]),
        explanation:
          `Relative atomic mass is the weighted mean: (${row.a1} × ${row.p1} + ${row.a2} × ${p2}) ÷ 100 = ` +
          `(${row.a1 * row.p1} + ${row.a2 * p2}) ÷ 100 = ${answer}. ` +
          `A simple average would only be right if the two isotopes were equally abundant, and they rarely are — which is why chlorine is 35.5 and not 36.`,
        check: () => {
          const recomputed = (row.a1 * row.p1 + row.a2 * p2) / 100;
          if (!agrees(recomputed, row.mean)) return `the weighted mean is ${recomputed}, not ${row.mean}`;
          /* And it must lie between the two isotope masses, or the weighting
             has gone the wrong way. */
          return row.mean > Math.min(row.a1, row.a2) && row.mean < Math.max(row.a1, row.a2)
            ? null
            : `a mean of ${row.mean} lies outside ${row.a1}–${row.a2}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Electron configuration and ions
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.atom.configuration",
    subject: "chemistry",
    topic: "chem-atomic",
    subtopic: "electron-configuration",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const symbol = rng.pick(SHELL_ELEMENTS);
      const z = ATOMIC_NUMBERS[symbol];
      const config = shellConfiguration(z);
      const name = ELEMENT_NAMES[symbol];
      const answer = config;

      return {
        prompt: `Write the electron configuration of ${name} (atomic number ${z}) in terms of its shells.`,
        answer,
        /* A symmetric configuration such as 2,8,8 reads the same reversed, and
           hydrogen has no previous element, so both of those candidates can
           silently vanish. Neighbours two either side always survive. */
        distractors: wrongOptions(answer, [
          shellConfiguration(z + 1), // used the next element
          shellConfiguration(z + 2), // counted two too many electrons
          z > 1 ? shellConfiguration(z - 1) : "", // used the previous element
          z > 2 ? shellConfiguration(z - 2) : "", // counted two too few
          config.split(",").reverse().join(","), // wrote the shells outwards-in
          `${z}`, // gave the atomic number
        ]),
        explanation:
          `Fill the shells in order: the first holds 2 electrons, the second and third hold 8 each. ` +
          `${z} electrons gives ${answer}. ` +
          `The number in the OUTER shell is what decides the chemistry, and it is also the group number.`,
        check: () => {
          const total = config.split(",").reduce((sum, n) => sum + Number(n), 0);
          return agrees(total, z) ? null : `the configuration holds ${total} electrons, not ${z}`;
        },
      };
    },
  }),

  generator({
    key: "chem.atom.group-from-config",
    subject: "chemistry",
    topic: "chem-atomic",
    subtopic: "electron-configuration",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 40,
    build: (rng) => {
      const symbol = rng.pick(SHELL_ELEMENTS.filter((s) => ATOMIC_NUMBERS[s] <= 20));
      const z = ATOMIC_NUMBERS[symbol];
      const config = shellConfiguration(z);
      const group = groupOf(z);
      const period = config.split(",").length;
      const asked = rng.bool();

      if (asked && group !== null) {
        const answer = `Group ${group}`;
        return {
          prompt: `An element has the electron configuration ${config}. Which group of the periodic table is it in?`,
          answer,
          /* Group and period frequently coincide (2,8 is group 8 of period 2 by
             these rules only for the noble gases, but 2,1 is group 1 period 2),
             so the candidates are drawn from the whole range and filtered. */
          distractors: wrongOptions(answer, [
            `Group ${period}`, // gave the period instead
            `Group ${group === 0 ? 7 : group + 1}`, // off by one
            `Group ${group <= 1 ? 6 : group - 1}`, // off by one the other way
            `Group ${config.split(",")[0]}`, // used the innermost shell
            `Group ${z}`, // gave the atomic number
            "Group 4", // a plausible middle-of-the-table guess
            "Group 0", // assumed a full outer shell
          ]),
          explanation:
            `The group number is the number of electrons in the OUTER shell. ` +
            `${config} has ${config.split(",").slice(-1)[0]} in its outer shell, so it is in ${answer}. ` +
            `${group === 0 ? "A full outer shell means group 0 — the noble gases, which is why they are unreactive." : "Elements in the same group react similarly because they have the same outer-shell count."}`,
          check: () => {
            const outer = Number(config.split(",").slice(-1)[0]);
            return group === 0 || outer === group ? null : `outer shell ${outer} does not match group ${group}`;
          },
        };
      }

      const answer = `Period ${period}`;
      return {
        prompt: `An element has the electron configuration ${config}. Which period of the periodic table is it in?`,
        answer,
        distractors: wrongOptions(answer, [
          `Period ${group ?? 1}`, // gave the group instead
          `Period ${period + 1}`, // off by one
          `Period ${period + 2}`, // off by two
          `Period ${z}`, // gave the atomic number
          `Period ${config.split(",")[0]}`, // used the innermost shell count
        ]),
        explanation:
          `The period number is the number of occupied shells. ${config} has ${period} shell${period === 1 ? "" : "s"}, so it is in ${answer}. ` +
          `Going down a group adds a shell; going across a period fills the shell you are already in.`,
        check: () => {
          const shells = config.split(",").length;
          return agrees(shells, period) ? null : `counted ${shells} shells, not ${period}`;
        },
      };
    },
  }),

  generator({
    key: "chem.atom.ions",
    subject: "chemistry",
    topic: "chem-atomic",
    subtopic: "ions",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 24,
    build: (rng) => {
      const ion = rng.pick(IONS);
      const z = ATOMIC_NUMBERS[ion.symbol];
      const name = ELEMENT_NAMES[ion.symbol];
      const electrons = z - ion.charge;
      const asked = rng.bool();

      if (asked) {
        const sign = ion.charge > 0 ? "+" : "−";
        const size = Math.abs(ion.charge);
        const answer = `${size === 1 ? "" : size}${sign}`;
        return {
          prompt: `What charge does a ${name} ion carry?`,
          answer,
          distractors: wrongOptions(answer, [
            `${size === 1 ? "" : size}${ion.charge > 0 ? "−" : "+"}`, // right size, wrong sign
            `${size + 1}${sign}`, // one too many
            `${size === 1 ? 2 : 1}${sign}`, // the other common size
            "0", // said the ion is neutral
          ]),
          explanation:
            `${cap(name)} has ${z} electrons, with ${shellConfiguration(z).split(",").slice(-1)[0]} in its outer shell. ` +
            `It ${ion.charge > 0 ? `LOSES ${size} to empty that shell` : `GAINS ${size} to fill it`}, ` +
            `leaving ${electrons} electrons against ${z} protons — a charge of ${answer}. ` +
            `Metals lose electrons and form positive ions; non-metals gain them and form negative ions.`,
          check: () => (agrees(z - electrons, ion.charge) ? null : `protons minus electrons gives ${z - electrons}`),
        };
      }

      const answer = ans(electrons);
      return {
        prompt:
          `A ${name} ion carries a charge of ${ion.charge > 0 ? "+" : "−"}${Math.abs(ion.charge)}. ` +
          `${cap(name)} has atomic number ${z}. How many electrons does the ion have?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(z, ""), // gave the neutral atom's count
          slip(z + ion.charge, ""), // added the charge instead of subtracting
          slip(Math.abs(ion.charge), ""), // gave the charge
          slip(electrons + 2, ""), // out by the wrong amount
        ]),
        explanation:
          `A ${ion.charge > 0 ? "positive" : "negative"} charge means the atom has ${ion.charge > 0 ? "LOST" : "GAINED"} electrons. ` +
          `Electrons = ${z} ${ion.charge > 0 ? "−" : "+"} ${Math.abs(ion.charge)} = ${answer}. ` +
          `The proton count never changes — that would make it a different element.`,
        check: () => (agrees(z - electrons, ion.charge) ? null : `the charge does not follow from the counts`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Bonding — reasoning
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.bond.ionic",
    subject: "chemistry",
    topic: "chem-bonding",
    subtopic: "ionic-bonding",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What holds an ionic compound together?", a: "Strong electrostatic attraction between oppositely charged ions in all directions", wrong: ["Shared pairs of electrons between atoms", "A sea of delocalised electrons", "Weak forces between molecules"], why: "Ionic bonding is electrostatic attraction between ions of opposite charge. It acts in every direction, which is why ions build up into a giant lattice rather than pairing off into molecules." },
        { q: "Why do ionic compounds have high melting points?", a: "Many strong electrostatic attractions must be broken throughout the giant lattice", wrong: ["The covalent bonds within each molecule are strong", "The ions are very heavy", "The delocalised electrons hold the lattice together"], why: "Every ion is attracted to several oppositely charged neighbours, and melting means overcoming enough of those attractions to let the lattice flow. There is a lot of energy stored in a structure that extends in every direction." },
        { q: "Why does solid sodium chloride not conduct electricity, while molten sodium chloride does?", a: "The ions are fixed in the lattice when solid but free to move when molten", wrong: ["Solid sodium chloride has no ions until it melts", "Melting creates free electrons", "The solid is a covalent structure and the liquid is ionic"], why: "Conduction needs charged particles that can MOVE. The ions exist in both states, but only in the liquid can they travel to an electrode. Dissolving it in water has the same effect for the same reason." },
        { q: "Magnesium reacts with oxygen to form magnesium oxide. What happens to the electrons?", a: "Each magnesium atom transfers two electrons to an oxygen atom", wrong: ["Each pair of atoms shares two electrons", "Magnesium gains two electrons from oxygen", "The electrons become delocalised between all the atoms"], why: "Magnesium is in group 2 and loses two electrons to empty its outer shell; oxygen is in group 6 and gains two to fill its own. The result is Mg²⁺ and O²⁻, held together electrostatically." },
        { q: "Why is the formula of magnesium chloride MgCl₂ rather than MgCl?", a: "The compound must be electrically neutral, and Mg²⁺ needs two Cl⁻ ions to balance it", wrong: ["Magnesium is twice as heavy as chlorine", "Chlorine atoms always come in pairs", "Magnesium has two outer electrons so it bonds twice as strongly"], why: "Ionic formulae are decided by charge balance. One 2+ ion needs two 1− ions to cancel out. The Cl₂ in chlorine GAS is a different thing entirely — that is a covalent molecule of two atoms." },
        { q: "Why are ionic compounds usually brittle?", a: "Displacing one layer brings like charges together, and they repel and split the crystal", wrong: ["The bonds between molecules are weak", "The ions are held only loosely", "They contain trapped air"], why: "In an undisturbed lattice each ion has oppositely charged neighbours. Push one layer along by one ion and suddenly positives face positives; the repulsion pushes the layers apart and the crystal cleaves." },
        { q: "What type of elements typically combine to form ionic bonds?", a: "A metal and a non-metal", wrong: ["Two non-metals", "Two metals", "A metal and a noble gas"], why: "Metals have few outer electrons and lose them readily; non-metals have nearly full shells and gain them. Two non-metals instead SHARE electrons, which is covalent bonding, and two metals form a metallic bond." },
        { q: "Why do many ionic compounds dissolve in water?", a: "Water molecules are polar and can surround and separate the ions", wrong: ["Water breaks the ionic bonds into atoms", "Ionic compounds react with water to form new substances", "The ions are lighter than water"], why: "Water's slightly positive hydrogen ends attract negative ions and its slightly negative oxygen end attracts positive ions. Enough of these interactions can pull ions out of the lattice — the ions are separated, not destroyed." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.bond.covalent",
    subject: "chemistry",
    topic: "chem-bonding",
    subtopic: "covalent-bonding",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is a covalent bond?", a: "A shared pair of electrons between two atoms", wrong: ["The transfer of electrons from one atom to another", "An attraction between oppositely charged ions", "A sea of delocalised electrons"], why: "In a covalent bond both atoms attract the same shared pair, and that shared attraction holds them together. Both nuclei effectively count the pair toward a full outer shell." },
        { q: "How many covalent bonds does a carbon atom normally form?", a: "Four", wrong: ["Two", "Six", "One"], why: "Carbon has four outer electrons and needs four more to reach eight, so it forms four shared pairs. That is why carbon builds chains and rings, and why organic chemistry exists at all." },
        { q: "Why does carbon dioxide have a very low boiling point despite its strong covalent bonds?", a: "The forces BETWEEN its molecules are weak, and only those need to be overcome", wrong: ["Its covalent bonds are actually weak", "It has no bonds at all when solid", "It is an ionic compound"], why: "Boiling separates molecules from one another; it does not break the bonds inside them. The C=O bonds are strong, but the intermolecular forces holding one CO₂ molecule to the next are feeble, so very little energy is needed." },
        { q: "Why does diamond have an extremely high melting point?", a: "It is a giant covalent structure, so melting means breaking many strong covalent bonds", wrong: ["Its molecules are very heavy", "The forces between its molecules are unusually strong", "It contains ionic bonds as well"], why: "Diamond has no separate molecules — every carbon is covalently bonded to four others throughout the crystal. Melting it means breaking covalent bonds themselves, not merely separating molecules." },
        { q: "Why is graphite soft and slippery while diamond is hard?", a: "Graphite is made of layers with weak forces between them that can slide", wrong: ["Graphite's covalent bonds are weaker than diamond's", "Graphite is ionic and diamond is covalent", "Graphite contains no covalent bonds"], why: "Within each layer graphite's bonds are as strong as diamond's, but the layers themselves are held together only weakly and slide over one another. Diamond's rigid three-dimensional network has no such planes." },
        { q: "Why does graphite conduct electricity when diamond does not?", a: "Each carbon in graphite bonds to only three others, leaving one delocalised electron per atom", wrong: ["Graphite contains free ions", "Graphite's bonds are metallic", "Diamond's electrons are too heavy to move"], why: "Carbon has four outer electrons. In graphite only three are used in bonding, so the fourth is delocalised and free to move along the layers. In diamond all four are locked into bonds, leaving nothing mobile to carry a current." },
        { q: "How many covalent bonds are there in a molecule of methane, CH₄?", a: "Four single bonds", wrong: ["One bond, shared between all five atoms", "Eight bonds", "Two double bonds"], why: "Each hydrogen shares one electron pair with the carbon, giving four separate single bonds. The carbon reaches eight outer electrons and each hydrogen reaches two, which is a full first shell." },
        { q: "What is a double covalent bond?", a: "Two shared pairs of electrons between the same two atoms", wrong: ["Two separate single bonds to different atoms", "A bond twice as long as a single bond", "One shared pair and one transferred electron"], why: "A double bond is four electrons — two pairs — shared between the same two atoms. It is shorter and stronger than a single bond, and in alkenes it is the site where addition reactions happen." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.bond.metallic",
    subject: "chemistry",
    topic: "chem-bonding",
    subtopic: "metallic-bonding",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "What is metallic bonding?", a: "Positive metal ions attracted to a sea of delocalised electrons", wrong: ["Shared pairs of electrons between neighbouring metal atoms", "Attraction between positive and negative metal ions", "Weak forces between metal molecules"], why: "Metal atoms release their outer electrons into a shared pool. The resulting positive ions are held in place by their attraction to that delocalised sea, which extends through the whole structure." },
        { q: "Why do metals conduct electricity well?", a: "The delocalised electrons are free to move through the structure", wrong: ["The metal ions move through the structure", "Metals contain free protons", "The covalent bonds carry the current"], why: "A current is moving charge. In a metal the delocalised electrons drift when a voltage is applied, while the positive ions stay put. This is also why metals conduct heat well — the same mobile electrons carry energy." },
        { q: "Why can metals be hammered into shape without shattering?", a: "The layers of ions can slide over each other while the electron sea keeps holding them together", wrong: ["The bonds between metal atoms are weak", "Metals are made of separate molecules that rearrange", "Hammering melts the metal briefly"], why: "Because the delocalised electrons are not tied to any particular pair of ions, sliding one layer past another does not break the bonding. In an ionic lattice the same displacement brings like charges together and the crystal shatters." },
        { q: "Why are alloys usually harder than pure metals?", a: "Atoms of different sizes disrupt the regular layers, so they cannot slide as easily", wrong: ["Alloys contain stronger covalent bonds", "Alloys have more delocalised electrons", "Alloys are ionic rather than metallic"], why: "A pure metal's neatly stacked identical atoms slide readily. Introducing atoms of a different size distorts the layers and blocks that sliding, which is exactly why steel is harder than iron." },
        { q: "Why do metals generally have high melting points?", a: "The attraction between the positive ions and the delocalised electrons is strong", wrong: ["Metal atoms are very heavy", "Metals contain giant covalent structures", "The forces between metal molecules are strong"], why: "Melting means overcoming the electrostatic attraction between every metal ion and the shared electron sea, which is strong and extends throughout the structure. Group 1 metals are the exception, with only one electron each contributed and correspondingly weaker bonding." },
        { q: "What happens to the outer electrons of a metal atom in metallic bonding?", a: "They are delocalised and shared throughout the whole structure", wrong: ["They are transferred to a non-metal atom", "They remain in a fixed shell around their own atom", "They are shared with exactly one neighbouring atom"], why: "They leave their parent atoms entirely and belong to the structure as a whole, not to any one pair of atoms. That is what distinguishes metallic bonding from both ionic transfer and covalent sharing." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.bond.structure",
    subject: "chemistry",
    topic: "chem-bonding",
    subtopic: "structure-properties",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "A substance melts at 801 °C, does not conduct as a solid, but conducts when molten. What is it?", a: "An ionic compound", wrong: ["A metal", "A simple molecular substance", "A giant covalent structure"], why: "The high melting point rules out simple molecules; conducting only when molten is the signature of ions that are fixed in a lattice until it melts. A metal would conduct in both states, and most giant covalent structures conduct in neither." },
        { q: "A substance melts at −78 °C and does not conduct electricity in any state. What is it?", a: "A simple molecular substance", wrong: ["An ionic compound", "A metal", "A giant covalent structure"], why: "A very low melting point means only weak intermolecular forces need breaking, and no conduction in any state means no free ions and no free electrons. Carbon dioxide is the standard example." },
        { q: "A substance conducts electricity as a solid and can be drawn into a wire. What is it?", a: "A metal", wrong: ["An ionic compound", "A simple molecular substance", "A giant covalent structure"], why: "Conducting as a solid means mobile charge without melting, which points to delocalised electrons. Being ductile confirms it: the layers slide without the bonding breaking." },
        { q: "A substance melts above 3000 °C and does not conduct electricity. What is it?", a: "A giant covalent structure", wrong: ["An ionic compound", "A metal", "A simple molecular substance"], why: "An enormous melting point means covalent bonds themselves must be broken, but no conduction rules out both ions and delocalised electrons. Diamond and silicon dioxide are the usual examples." },
        { q: "Why do simple molecular substances have low melting and boiling points?", a: "Only the weak forces between molecules need to be overcome, not the covalent bonds", wrong: ["Their covalent bonds are weak", "They contain no bonds at all", "Their molecules are very light"], why: "Melting and boiling separate whole molecules; they do not break the bonds inside them. Intermolecular forces are far weaker than covalent bonds, so very little energy is needed." },
        { q: "Why does the boiling point of the alkanes rise as the chain gets longer?", a: "Longer molecules have more surface contact, so the intermolecular forces are stronger", wrong: ["The covalent bonds get stronger along the series", "Longer molecules are ionic", "The molecules become more reactive"], why: "The forces between molecules grow with the size and surface area of the molecule. More contact means more attraction to overcome, so more energy is needed to separate them." },
        { q: "Why can a nanoparticle be far more effective as a catalyst than the same mass of ordinary powder?", a: "Nanoparticles have a much larger surface area to volume ratio", wrong: ["Nanoparticles are chemically different substances", "Nanoparticles are heavier for their size", "Nanoparticles are ionic"], why: "Catalysis happens on the surface. Dividing the same mass into far smaller particles multiplies the available surface enormously, so a much smaller mass does the same job." },
        { q: "What happens to the surface area to volume ratio of a cube as its side length is halved?", a: "It doubles", wrong: ["It halves", "It stays the same", "It quadruples"], why: "Surface area scales with the square of the side and volume with the cube, so the ratio scales with 1/side. Halving the side doubles the ratio — which is the whole reason nanoparticles behave so differently from bulk material." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.bond.intermolecular",
    subject: "chemistry",
    topic: "chem-bonding",
    subtopic: "intermolecular-forces",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "Why does water have an unusually high boiling point for such a small molecule?", a: "Hydrogen bonding between molecules is much stronger than ordinary intermolecular forces", wrong: ["Its covalent bonds are unusually strong", "It is an ionic compound", "Water molecules are unusually heavy"], why: "Hydrogen bonds form when hydrogen is bonded to nitrogen, oxygen or fluorine. Water can form several per molecule, and breaking them takes far more energy than the boiling point of a molecule this size would otherwise suggest." },
        { q: "Which intermolecular force is present between ALL molecules?", a: "London (dispersion) forces", wrong: ["Hydrogen bonding", "Permanent dipole-dipole forces", "Ionic attraction"], why: "London forces arise from instantaneous, fluctuating distributions of electrons, so every molecule has them. Dipole-dipole forces need a permanent polarity and hydrogen bonds need H bonded to N, O or F." },
        { q: "Why is ice less dense than liquid water?", a: "Hydrogen bonds hold the molecules in an open lattice with gaps", wrong: ["Ice molecules are lighter than water molecules", "Ice contains trapped air", "The covalent bonds lengthen on freezing"], why: "The directional nature of hydrogen bonding forces the molecules into a hexagonal arrangement with empty space in it. Melting collapses that structure, so liquid water is denser — which is why ice floats." },
        { q: "Which of these would have the highest boiling point?", a: "A molecule capable of hydrogen bonding", wrong: ["A molecule with only London forces", "A molecule with permanent dipoles but no hydrogen bonding", "A molecule with no intermolecular forces at all"], why: "For molecules of comparable size the strength runs London < dipole-dipole < hydrogen bonding. Every molecule has London forces; hydrogen bonding is the strongest of the three and dominates when present." },
        { q: "Why do the boiling points of the noble gases increase down the group?", a: "Larger atoms have more electrons, so their London forces are stronger", wrong: ["They become more reactive down the group", "They start to form hydrogen bonds", "Their covalent bonds strengthen"], why: "Noble gases are single atoms with no bonds between them at all — only London forces. More electrons mean a larger instantaneous dipole and stronger attraction, so more energy is needed to separate the atoms." },
        { q: "What is needed for hydrogen bonding to occur between molecules?", a: "Hydrogen bonded directly to nitrogen, oxygen or fluorine", wrong: ["Any molecule containing hydrogen", "Any molecule with a permanent dipole", "Hydrogen bonded to carbon"], why: "Only N, O and F are electronegative and small enough to leave the hydrogen nucleus sufficiently exposed. Methane contains plenty of hydrogen but forms no hydrogen bonds at all, which is why it boils at −162 °C." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     The periodic table
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.periodic.groups",
    subject: "chemistry",
    topic: "chem-periodic",
    subtopic: "groups-periods",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "What do all the elements in the same group of the periodic table have in common?", a: "The same number of electrons in their outer shell", wrong: ["The same number of shells", "The same relative atomic mass", "The same number of neutrons"], why: "Group number equals outer-shell electron count, and the outer shell decides how an element reacts. That is why the periodic table's columns are families of chemically similar elements." },
        { q: "What does the period number of an element tell you?", a: "The number of occupied electron shells", wrong: ["The number of outer-shell electrons", "The number of protons", "The number of neutrons"], why: "Each period corresponds to filling a new shell. Going across a period fills the shell you are in; going down a group starts a new one, which is why atoms get larger down a group." },
        { q: "Why was Mendeleev's periodic table accepted while earlier attempts were not?", a: "He left gaps for undiscovered elements and correctly predicted their properties", wrong: ["He listed every known element without exception", "He ordered them strictly by atomic mass with no exceptions", "He was the first to use atomic number"], why: "Mendeleev's willingness to leave gaps — and to swap a few elements out of strict mass order — meant his table made testable predictions. When gallium and germanium were found with the predicted properties, the table's authority was established." },
        { q: "Why are the elements now ordered by atomic number rather than atomic mass?", a: "Atomic number reflects the proton count, which fixes the element's identity and chemistry", wrong: ["Atomic number is easier to measure", "Atomic mass was found to be constant for all elements", "Atomic number is always a whole number and mass is not"], why: "A few pairs — such as argon and potassium — fall in the wrong chemical order by mass but the right one by proton number. Once protons were understood, ordering by atomic number resolved every such anomaly." },
        { q: "Where are the metals found in the periodic table?", a: "On the left and in the centre", wrong: ["On the right", "Only in the top two rows", "Scattered evenly throughout"], why: "Metals occupy the left-hand and central regions, non-metals the top right, with a diagonal band of semi-metals between. Metals have few outer electrons and lose them readily, which is the origin of both the position and the properties." },
        { q: "Why are the group 0 elements unreactive?", a: "They already have a full outer shell, so they have no tendency to gain, lose or share electrons", wrong: ["They have no electrons in their outer shell", "They are too heavy to react", "They exist only as single atoms"], why: "A full outer shell is the stable arrangement every other element is reacting to achieve. Having it already, noble gases have nothing to gain from reacting — which is also why they exist as single atoms rather than molecules." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.periodic.group-1",
    subject: "chemistry",
    topic: "chem-periodic",
    subtopic: "group-1",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "Why does reactivity INCREASE down group 1?", a: "The outer electron is further from the nucleus and more shielded, so it is lost more easily", wrong: ["The atoms have more outer electrons further down", "The nuclear charge decreases down the group", "The atoms become lighter down the group"], why: "Group 1 reactions involve losing the single outer electron. Further down, that electron sits in a shell further from the nucleus with more inner shells screening it, so the attraction holding it is weaker and it goes more readily." },
        { q: "What is produced when a group 1 metal reacts with water?", a: "A metal hydroxide and hydrogen gas", wrong: ["A metal oxide and oxygen gas", "A metal chloride and hydrogen gas", "A metal hydroxide and oxygen gas"], why: "For example 2Na + 2H₂O → 2NaOH + H₂. The resulting solution is alkaline, which is why the group is called the alkali metals, and the hydrogen released is what makes the reaction so vigorous." },
        { q: "Why are group 1 metals stored under oil?", a: "To keep them away from oxygen and water vapour in the air", wrong: ["To keep them cool", "To stop them evaporating", "To prevent them dissolving in the air"], why: "They react readily with both oxygen and water, and a freshly cut surface tarnishes within seconds. Oil excludes both and keeps the metal usable." },
        { q: "What charge do group 1 ions carry?", a: "1+", wrong: ["1−", "2+", "2−"], why: "Group 1 atoms have one outer electron and lose it to reach a full shell, leaving one more proton than electrons. Losing an electron always gives a POSITIVE ion, which is the point students most often invert." },
        { q: "Which is more reactive, lithium or potassium?", a: "Potassium, because its outer electron is further from the nucleus", wrong: ["Lithium, because it is lighter", "Lithium, because it has fewer shells to get through", "They are equally reactive because both are in group 1"], why: "Potassium is further down the group, so its outer electron is in a more distant, better-shielded shell and is lost more easily. Reactivity in group 1 increases down the group — the opposite of group 7." },
        { q: "What happens to melting point down group 1?", a: "It decreases", wrong: ["It increases", "It stays constant", "It rises then falls"], why: "The metallic bonding weakens down the group because the delocalised electrons are further from the increasingly large positive ions. Caesium melts at 28 °C, barely above room temperature." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.periodic.group-7",
    subject: "chemistry",
    topic: "chem-periodic",
    subtopic: "group-7",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "Why does reactivity DECREASE down group 7?", a: "The outer shell is further from the nucleus, so an incoming electron is attracted less strongly", wrong: ["The atoms have fewer outer electrons further down", "The nuclear charge decreases down the group", "The atoms become lighter down the group"], why: "Group 7 reactions involve GAINING an electron, so the opposite trend to group 1 applies: the further the outer shell is from the nucleus and the more shielded it is, the weaker the pull on an incoming electron. Fluorine is the most reactive." },
        { q: "Chlorine is bubbled through potassium bromide solution and the solution turns orange. What has happened?", a: "Chlorine has displaced bromine, because chlorine is more reactive", wrong: ["Bromine has displaced chlorine", "The potassium has been displaced", "No reaction — the colour is from the chlorine"], why: "A more reactive halogen displaces a less reactive one from its salt: Cl₂ + 2KBr → 2KCl + Br₂. The orange colour is the bromine released. The reverse reaction does not happen." },
        { q: "What charge do group 7 ions carry?", a: "1−", wrong: ["1+", "7−", "7+"], why: "Group 7 atoms have seven outer electrons and gain one to reach eight, giving one more electron than protons — a 1− charge. The group number gives the outer-shell count, not the charge." },
        { q: "What is the physical state of bromine at room temperature?", a: "A liquid", wrong: ["A gas", "A solid", "A gas that condenses on contact with air"], why: "Fluorine and chlorine are gases, bromine is a liquid and iodine is a solid. The trend is caused by intermolecular forces strengthening down the group as the molecules gain electrons." },
        { q: "Why do the halogens exist as diatomic molecules such as Cl₂?", a: "Two atoms share a pair of electrons so each reaches a full outer shell", wrong: ["They are held together by ionic bonds", "Two atoms are needed to make the mass correct", "They are attracted by delocalised electrons"], why: "Each halogen atom needs one more electron. Sharing a pair with another atom of the same element achieves that for both, giving a single covalent bond and a stable molecule." },
        { q: "Why does the boiling point increase down group 7?", a: "Larger molecules have more electrons and therefore stronger intermolecular forces", wrong: ["The covalent bonds become stronger down the group", "The molecules become ionic down the group", "Reactivity increases down the group"], why: "The covalent bond WITHIN each molecule actually weakens down the group, but boiling separates molecules rather than breaking bonds. More electrons mean stronger London forces, so the boiling point rises." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.periodic.transition",
    subject: "chemistry",
    topic: "chem-periodic",
    subtopic: "transition-metals",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "Which of these is a typical property of transition metals but NOT of group 1 metals?", a: "Forming ions with more than one possible charge", wrong: ["Conducting electricity", "Being malleable", "Having a metallic lustre"], why: "Iron forms both Fe²⁺ and Fe³⁺; copper forms Cu⁺ and Cu²⁺. Group 1 metals only ever form 1+ ions. The other three properties are shared by all metals." },
        { q: "Why are transition metal compounds usually coloured?", a: "Their partly filled d sub-shells absorb particular wavelengths of visible light", wrong: ["They contain unusually heavy atoms", "They are always ionic", "They react with light to form new compounds"], why: "The partly filled d orbitals allow electron transitions of exactly the energy of visible photons. Group 1 compounds have no such partly filled sub-shell and are white or colourless." },
        { q: "How do transition metals compare with group 1 metals in reactivity?", a: "They are much less reactive", wrong: ["They are much more reactive", "They are equally reactive", "They do not react at all"], why: "Copper does not react with water at all, where sodium reacts violently. That relative unreactivity is precisely why transition metals are useful for construction, wiring and coinage." },
        { q: "What is a common industrial use of transition metals that group 1 metals cannot fill?", a: "Acting as catalysts", wrong: ["Making alkaline solutions", "Producing hydrogen on contact with water", "Colouring flames in fireworks"], why: "Iron in the Haber process, nickel in hydrogenation, platinum in catalytic converters. Their ability to hold several oxidation states lets them form and release intermediates, which is what a catalyst does." },
        { q: "How do the melting points of transition metals compare with those of group 1 metals?", a: "They are much higher", wrong: ["They are much lower", "They are about the same", "They have no fixed melting point"], why: "Iron melts at 1538 °C where sodium melts at 98 °C. Transition metals contribute more electrons to the delocalised sea and have smaller ions, so the metallic bonding is far stronger." },
        { q: "Iron forms both Fe²⁺ and Fe³⁺ ions. What is the name of the compound FeCl₃?", a: "Iron(III) chloride", wrong: ["Iron(II) chloride", "Iron chloride", "Triiron chloride"], why: "Three chloride ions at 1− each must be balanced by a single 3+ iron ion, so this is iron(III). The Roman numeral gives the charge on the metal ion, and it is required precisely because transition metals have a choice." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.periodic.trends",
    subject: "chemistry",
    topic: "chem-periodic",
    subtopic: "periodic-trends",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "What happens to atomic radius ACROSS a period, from left to right?", a: "It decreases", wrong: ["It increases", "It stays the same", "It increases then decreases"], why: "Electrons are being added to the SAME shell while the nuclear charge rises, so the whole shell is pulled in more tightly. Shielding is essentially unchanged across a period, so the increasing nuclear charge wins." },
        { q: "What happens to atomic radius DOWN a group?", a: "It increases", wrong: ["It decreases", "It stays the same", "It decreases then increases"], why: "Each step down adds a whole new shell, so the outer electrons are further out and better shielded from the nucleus. The extra distance outweighs the extra nuclear charge." },
        { q: "What happens to first ionisation energy across a period?", a: "It generally increases", wrong: ["It generally decreases", "It stays constant", "It falls sharply at every step"], why: "The outer electron is held more tightly as nuclear charge rises and the atom shrinks, so more energy is needed to remove it. There are small dips — for example between group 2 and group 3 — caused by sub-shell structure." },
        { q: "Why does first ionisation energy decrease down a group?", a: "The outer electron is further from the nucleus and better shielded", wrong: ["The nuclear charge decreases down the group", "The atoms have fewer electrons down the group", "The outer shell becomes fuller down the group"], why: "Two effects both help the electron leave: greater distance from the nucleus, and more inner shells screening it from the nuclear charge. Together they outweigh the increase in proton number." },
        { q: "Which element has the higher first ionisation energy, sodium or magnesium?", a: "Magnesium, because it has a greater nuclear charge with the same shielding", wrong: ["Sodium, because it is more reactive", "Sodium, because it has fewer electrons", "They are equal because they are in the same period"], why: "Both have their outer electron in the third shell with the same inner shielding, but magnesium has one more proton pulling on it. More nuclear charge with unchanged shielding means a higher ionisation energy." },
        { q: "Why is the second ionisation energy of any element always larger than the first?", a: "The electron is being removed from a positive ion, which holds it more tightly", wrong: ["The second electron is always in a lower shell", "The nuclear charge increases after the first ionisation", "The atom becomes heavier after the first ionisation"], why: "After the first electron leaves, the remaining electrons are held by the same nuclear charge but there is one fewer of them to share it and to repel one another. Pulling a negative electron away from a now-positive ion always costs more." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
