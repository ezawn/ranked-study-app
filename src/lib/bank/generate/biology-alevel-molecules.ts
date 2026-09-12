/**
 * Biology A-Level: biological molecules and molecular genetics.
 *
 * Two computed seams. Chargaff's rules turn a single base percentage into all
 * four, which is exactly the kind of question that looks like recall and is
 * actually arithmetic — and the answer is generated from the percentage rather
 * than typed, so a case can never be internally inconsistent. The triplet code
 * turns base counts into amino acid counts, where the only real difficulty is
 * knowing which way to divide.
 *
 * Everything else is structure and mechanism, and the distractors are built
 * from the specific confusions this topic invites: DNA against RNA, transcription
 * against translation, competitive against non-competitive inhibition.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, exact, num, slip, sup, tidy, wrongOptions } from "./physics-kit";

/* ==========================================================================
   Data
   ========================================================================== */

const MOLECULES = [
  { molecule: "starch", monomer: "alpha glucose", role: "Energy storage in plants", note: "Coiled and branched, so it is compact and insoluble" },
  { molecule: "glycogen", monomer: "alpha glucose", role: "Energy storage in animals", note: "More highly branched than starch, so it can be broken down faster" },
  { molecule: "cellulose", monomer: "beta glucose", role: "Structural support in plant cell walls", note: "Straight chains held by hydrogen bonds into strong microfibrils" },
  { molecule: "a triglyceride", monomer: "glycerol and three fatty acids", role: "Energy storage and insulation", note: "Contains more energy per gram than carbohydrate because it is more reduced" },
  { molecule: "a protein", monomer: "amino acids", role: "Enzymes, transport, structure and hormones", note: "The sequence determines the fold, and the fold determines the function" },
  { molecule: "DNA", monomer: "nucleotides", role: "Storage of genetic information", note: "A double helix with complementary base pairing" },
] as const;

/* Chargaff cases: one base percentage, from which the other three follow.
   Adenine is capped below 50 because A and T together cannot exceed 100. */
const CHARGAFF_CASES: { a: number; t: number; g: number; c: number }[] = (() => {
  const out: { a: number; t: number; g: number; c: number }[] = [];
  for (const a of [10, 15, 20, 22, 25, 28, 30, 32, 35, 40]) {
    const t = a;
    const rest = 100 - 2 * a;
    if (rest <= 0) continue;
    const g = exact(rest / 2, 2, "guanine percentage");
    /* A case where every base is 25% has no wrong answers left to offer. */
    if (agrees(g, a)) continue;
    out.push({ a, t, g, c: g });
  }
  return out;
})();

/* PCR cases: a starting number of molecules and a cycle count whose product is
   a number the bank can publish. */
const PCR_CASES: { start: number; cycles: number; copies: number }[] = (() => {
  const out: { start: number; cycles: number; copies: number }[] = [];
  for (const start of [1, 2, 5, 10, 100]) {
    for (let cycles = 1; cycles <= 10; cycles++) {
      const copies = start * Math.pow(2, cycles);
      if (!tidy(copies)) continue;
      out.push({ start, cycles, copies });
    }
  }
  return out;
})();

/* ==========================================================================
   The generators
   ========================================================================== */

export const biologyALevelMolecules: Generator[] = [
  generator({
    key: "bio.bioc.carbohydrates",
    subject: "biology",
    topic: "bio-biochemistry",
    subtopic: "carbohydrates",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 20,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        const m = rng.pick(MOLECULES);
        const asked = rng.bool();
        if (asked) {
          const answer = m.monomer;
          return {
            prompt: `What is ${m.molecule} built from?`,
            answer,
            distractors: wrongOptions(answer, MOLECULES.filter((x) => x.monomer !== m.monomer).map((x) => x.monomer)),
            explanation:
              `${m.molecule.charAt(0).toUpperCase()}${m.molecule.slice(1)} is a polymer of ${answer}. ${m.note}. ` +
              `Starch, glycogen and cellulose are all glucose polymers — what distinguishes them is the isomer used and how the chains are arranged.`,
          };
        }
        const answer = m.role;
        return {
          prompt: `What is the biological role of ${m.molecule}?`,
          answer,
          distractors: wrongOptions(answer, MOLECULES.filter((x) => x.role !== m.role).map((x) => x.role)),
          explanation: `${answer}. ${m.note}.`,
        };
      }

      const cases = [
        { q: "What is the difference between alpha and beta glucose?", a: "The hydroxyl group on carbon 1 points in opposite directions", wrong: ["They have different numbers of carbon atoms", "One is a polymer and the other a monomer", "Beta glucose contains nitrogen"], why: "A single reversed hydroxyl group is the whole difference, and it is enough to change the polymer completely: alpha gives the coiled chains of starch, beta gives the straight chains of cellulose. It is also why humans can digest one and not the other." },
        { q: "What type of reaction joins two monosaccharides?", a: "A condensation reaction, forming a glycosidic bond and releasing water", wrong: ["A hydrolysis reaction, using water", "An oxidation reaction, releasing energy", "A substitution reaction"], why: "Condensation joins and releases water; hydrolysis splits and uses water. The same pair of reactions builds and breaks every biological polymer." },
        { q: "What is the disaccharide formed from two glucose molecules?", a: "Maltose", wrong: ["Sucrose", "Lactose", "Fructose"], why: "Sucrose is glucose plus fructose and lactose is glucose plus galactose. Maltose is what amylase produces from starch, which is why it appears in digestion questions." },
        { q: "Why is cellulose strong?", a: "Straight chains lie side by side and are held together by many hydrogen bonds into microfibrils", wrong: ["Each chain contains a covalent double bond", "It is coiled tightly like starch", "It contains sulfur bridges"], why: "Any one hydrogen bond is weak, but there are enormous numbers of them along the length of the chains. Cellulose is the most abundant organic molecule on Earth largely because it is so hard to break down." },
        { q: "Why is starch a good storage molecule?", a: "It is insoluble, compact and easily hydrolysed back to glucose", wrong: ["It is soluble and easily transported", "It contains more energy per gram than lipid", "It cannot be broken down"], why: "Insolubility matters because dissolved glucose would draw water into the cell by osmosis. Being easy to hydrolyse matters because a store you cannot open is useless." },
        { q: "What is the test for a reducing sugar and its positive result?", a: "Heat with Benedict's solution — blue changes to brick red", wrong: ["Add iodine — orange changes to blue-black", "Add Biuret solution — blue changes to purple", "Add ethanol — the mixture turns cloudy"], why: "The colour passes through green and orange as the concentration rises, so it gives a rough measure as well as a yes or no. A non-reducing sugar such as sucrose must be hydrolysed with acid first." },
        { q: "How would you test for a non-reducing sugar?", a: "Do a negative Benedict's test, then hydrolyse with acid, neutralise and repeat", wrong: ["Add iodine solution", "Heat with Benedict's solution once", "Add Biuret solution"], why: "Sucrose has no free reducing group, so it must be split into its monosaccharides before Benedict's can detect it. Neutralising before the second test matters — Benedict's does not work in acid." },
        { q: "Why can humans digest starch but not cellulose?", a: "Human enzymes fit the alpha glycosidic bonds in starch but not the beta bonds in cellulose", wrong: ["Cellulose is too large to enter the gut", "Cellulose contains no glucose", "Starch is already digested before it is eaten"], why: "Enzyme specificity is shape-based, and the beta bond presents a different shape. Ruminants solve the problem by hosting microorganisms that have the right enzyme." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.bioc.lipids",
    subject: "biology",
    topic: "bio-biochemistry",
    subtopic: "lipids",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is a triglyceride made of?", a: "One glycerol molecule and three fatty acids", wrong: ["Three glycerol molecules and one fatty acid", "Two glycerol molecules and two fatty acids", "One glycerol molecule and two fatty acids plus a phosphate"], why: "A phospholipid replaces one fatty acid with a phosphate group, which is what makes it partly hydrophilic and therefore able to form membranes. A triglyceride has no such group and is entirely hydrophobic." },
        { q: "What bond joins glycerol to a fatty acid?", a: "An ester bond, formed by condensation", wrong: ["A glycosidic bond", "A peptide bond", "A hydrogen bond"], why: "Each polymer type has its own bond: glycosidic in carbohydrates, peptide in proteins, ester in lipids. All three form by condensation and break by hydrolysis." },
        { q: "What is the difference between a saturated and an unsaturated fatty acid?", a: "An unsaturated fatty acid contains one or more C=C double bonds", wrong: ["A saturated fatty acid contains double bonds", "An unsaturated fatty acid has no hydrogen", "They differ in the number of glycerol molecules"], why: "Double bonds kink the chain, so unsaturated molecules pack less well and melt at a lower temperature. This is why plant oils are liquid at room temperature and animal fats are solid." },
        { q: "Why do lipids contain more energy per gram than carbohydrates?", a: "They contain proportionally more hydrogen and less oxygen, so more can be oxidised", wrong: ["They are larger molecules", "They dissolve more easily", "They contain nitrogen"], why: "Roughly twice the energy per gram, which is why long-term storage is as fat rather than as glycogen. Being hydrophobic, fat also stores without the associated water that glycogen carries." },
        { q: "What makes a phospholipid suitable for forming membranes?", a: "It has a hydrophilic head and hydrophobic tails, so it forms a bilayer in water", wrong: ["It is entirely hydrophobic", "It is entirely hydrophilic", "It dissolves completely in water"], why: "The tails turn inwards away from water and the heads face outwards, which happens spontaneously. This dual nature is the whole basis of membrane structure." },
        { q: "What is the emulsion test for lipids?", a: "Mix with ethanol, then add water — a cloudy white emulsion indicates lipid", wrong: ["Heat with Benedict's solution", "Add iodine solution", "Add Biuret solution and observe purple"], why: "Lipid dissolves in ethanol but not in water, so adding water precipitates it as tiny droplets that scatter light. A negative result stays clear." },
        { q: "Why are lipids described as macromolecules rather than polymers?", a: "They are large but not built from many identical repeating monomers", wrong: ["They are smaller than polymers", "They contain no carbon", "They cannot be hydrolysed"], why: "A triglyceride has just four components joined, not a long repeating chain. Starch, protein and DNA are true polymers; lipids are not." },
        { q: "What role do lipids play other than energy storage?", a: "Insulation, protection of organs and formation of membranes and some hormones", wrong: ["Catalysing reactions", "Carrying genetic information", "Transporting oxygen"], why: "Steroid hormones are lipids, as is the myelin sheath around neurones. Catalysis is the proteins' job and information storage is DNA's." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.bioc.proteins",
    subject: "biology",
    topic: "bio-biochemistry",
    subtopic: "proteins",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What are the components of an amino acid?", a: "An amine group, a carboxyl group, a hydrogen and a variable R group, all on a central carbon", wrong: ["A sugar, a phosphate and a base", "Glycerol and a fatty acid", "Two carboxyl groups and a hydroxyl group"], why: "Only the R group differs between the twenty amino acids, and it is that group which gives each its chemical character. The rest is identical, which is what allows any amino acid to join to any other." },
        { q: "What bond joins two amino acids?", a: "A peptide bond, formed by condensation", wrong: ["An ester bond", "A glycosidic bond", "A hydrogen bond"], why: "The amine group of one reacts with the carboxyl group of the next and water is released. Hydrogen bonds are important in proteins too, but they hold the folded shape rather than the chain together." },
        { q: "What is the primary structure of a protein?", a: "The sequence of amino acids in the polypeptide chain", wrong: ["The folding into alpha helices and beta sheets", "The overall three-dimensional shape", "The joining of several polypeptide chains"], why: "Primary structure determines everything above it, because the R groups along the chain decide how it folds. A single substitution can therefore change the whole molecule's function." },
        { q: "What holds the secondary structure of a protein together?", a: "Hydrogen bonds between the atoms of the polypeptide backbone", wrong: ["Disulfide bridges between R groups", "Peptide bonds between amino acids", "Ionic bonds between chains"], why: "Alpha helices and beta pleated sheets are both patterns of backbone hydrogen bonding, so they can form in any sequence. Tertiary structure involves the R groups instead." },
        { q: "Which bonds contribute to tertiary structure?", a: "Hydrogen bonds, ionic bonds and disulfide bridges between R groups", wrong: ["Only peptide bonds", "Only hydrogen bonds in the backbone", "Only glycosidic bonds"], why: "Disulfide bridges are covalent and therefore much stronger than the others, which is why proteins containing many of them, such as keratin, are so tough. The rest are weak individually but numerous." },
        { q: "What is quaternary structure?", a: "The association of two or more polypeptide chains into one functional protein", wrong: ["The folding of a single chain", "The sequence of amino acids", "The hydrogen bonding of the backbone"], why: "Haemoglobin's four chains are the standard example, and its co-operative oxygen binding depends on them interacting. A protein with a single chain has no quaternary structure at all." },
        { q: "What is the test for protein and its positive result?", a: "Add Biuret solution — blue changes to purple", wrong: ["Heat with Benedict's solution — blue changes to brick red", "Add iodine — orange changes to blue-black", "Add ethanol and water — a white emulsion forms"], why: "Biuret detects peptide bonds, so it responds to any protein or polypeptide. No heating is needed, unlike Benedict's." },
        { q: "What happens when a protein denatures?", a: "The bonds holding its tertiary structure break and it loses its shape and function", wrong: ["Its peptide bonds break into amino acids", "It becomes a different protein", "It gains extra amino acids"], why: "Denaturing does not break the primary structure — the chain is intact but no longer correctly folded. This is why it is usually irreversible in practice even though nothing has been removed." },
        { q: "Why does a change of one amino acid sometimes destroy a protein's function?", a: "It can change the folding, altering the shape of the active site or binding region", wrong: ["It shortens the chain by one", "It always breaks every peptide bond", "It changes the protein into a lipid"], why: "Sickle cell anaemia is caused by a single amino acid substitution in haemoglobin. Whether a substitution matters depends entirely on where it is and what the new R group does." },
        { q: "What is the difference between a fibrous and a globular protein?", a: "Fibrous proteins are long and structural; globular proteins are compact and usually soluble", wrong: ["Fibrous proteins are smaller", "Globular proteins have no tertiary structure", "Fibrous proteins are always enzymes"], why: "Collagen and keratin are fibrous and structural; enzymes, haemoglobin and antibodies are globular and functional. The shape follows from the amino acid sequence in each case." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.bioc.water",
    subject: "biology",
    topic: "bio-biochemistry",
    subtopic: "water-properties",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Why is water described as a polar molecule?", a: "The oxygen pulls the shared electrons, giving it a slight negative charge and the hydrogens a slight positive one", wrong: ["It carries a full ionic charge", "It contains a metal atom", "It has an uneven number of atoms"], why: "The partial charges let water molecules attract each other by hydrogen bonding, and almost every other property follows from that. The molecule as a whole is neutral." },
        { q: "Why does water have a high specific heat capacity?", a: "Hydrogen bonds between molecules must be broken before the temperature can rise much", wrong: ["Water molecules are very heavy", "Water contains dissolved salts", "Water is transparent"], why: "This buffers organisms and aquatic habitats against rapid temperature change, which matters because enzymes are temperature-sensitive. It is the same hydrogen bonding that gives water its high latent heat of vaporisation." },
        { q: "Why is water's high latent heat of vaporisation biologically useful?", a: "Evaporating a small amount of water removes a large amount of heat, making sweating effective", wrong: ["It stops water from freezing", "It makes water a good solvent", "It allows water to travel up xylem"], why: "Breaking the hydrogen bonds to turn liquid into vapour takes a great deal of energy, and that energy comes from the skin. Panting in dogs works the same way." },
        { q: "Why is ice less dense than liquid water, and why does it matter?", a: "Hydrogen bonds hold the molecules in an open lattice, so ice floats and insulates the water below", wrong: ["Ice contains trapped air", "Ice molecules are smaller", "Ice has no hydrogen bonds"], why: "A floating ice layer lets ponds stay liquid underneath, so aquatic organisms survive the winter. If ice sank, bodies of water would freeze from the bottom up." },
        { q: "What property of water allows it to travel up the xylem in a continuous column?", a: "Cohesion between water molecules, caused by hydrogen bonding", wrong: ["Its high density", "Its low specific heat capacity", "Its ability to dissolve gases"], why: "Cohesion holds the column together under tension so evaporation at the leaves can pull it up. Adhesion to the xylem walls helps too." },
        { q: "Why is water a good solvent for biological reactions?", a: "Its polarity lets it surround and separate charged and polar molecules", wrong: ["It has a low boiling point", "It is chemically unreactive with everything", "It contains dissolved oxygen"], why: "Most metabolic reactions happen in solution, and transport in blood and xylem depends on dissolving substances. Non-polar molecules such as lipids do not dissolve, which is why they need carriers." },
        { q: "What is the role of water as a metabolite?", a: "It takes part directly in reactions such as hydrolysis, condensation and photosynthesis", wrong: ["It only acts as a solvent", "It only regulates temperature", "It is never chemically changed"], why: "Water is a reactant in photosynthesis and in every hydrolysis, and a product of every condensation and of respiration. It is not merely the medium — it is a participant." },
        { q: "What is surface tension in water caused by?", a: "Cohesion between water molecules at the surface, pulling them together", wrong: ["Air pressure pressing down", "Dissolved salts forming a film", "The evaporation of the top layer"], why: "Molecules at the surface have no water above them, so the net inward pull creates a kind of skin. Some insects exploit this to walk on water." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.bioc.nucleic-acids",
    subject: "biology",
    topic: "bio-biochemistry",
    subtopic: "nucleic-acids",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form <= 1) {
        const c = rng.pick(CHARGAFF_CASES);

        if (form === 0) {
          const answer = ans(c.g, "%");
          return {
            prompt:
              `A sample of double-stranded DNA contains ${c.a}% adenine. What percentage of its bases are guanine?`,
            answer,
            distractors: pickDistractors(answer, [
              slip(c.a, "%"), // assumed guanine equals adenine
              slip(100 - 2 * c.a, "%"), // gave guanine and cytosine together
              slip(50 - c.a, "%"), // subtracted from fifty
              slip(100 - c.a, "%"),
            ]),
            explanation:
              `Adenine pairs with thymine, so thymine is also ${c.a}%. That accounts for ${2 * c.a}% of the bases, leaving ${100 - 2 * c.a}% shared equally between guanine and cytosine: ` +
              `${100 - 2 * c.a} ÷ 2 = ${answer}. ` +
              `The step people skip is halving the remainder — G and C are two separate bases, not one.`,
            check: () => (agrees(2 * c.a + 2 * c.g, 100) ? null : "the four base percentages do not total 100"),
          };
        }

        const answer = ans(c.a, "%");
        return {
          prompt:
            `A sample of double-stranded DNA contains ${num(c.g)}% cytosine. What percentage of its bases are adenine?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(c.g, "%"), // assumed adenine equals cytosine
            slip(100 - 2 * c.g, "%"), // gave adenine and thymine together
            slip(50 - c.g, "%"),
            slip(100 - c.g, "%"),
          ]),
          explanation:
            `Cytosine pairs with guanine, so guanine is also ${num(c.g)}%, accounting for ${num(2 * c.g)}%. ` +
            `The remaining ${num(100 - 2 * c.g)}% is shared equally between adenine and thymine: ${num(100 - 2 * c.g)} ÷ 2 = ${answer}. ` +
            `Chargaff's rules hold only for DOUBLE-stranded DNA — in single-stranded DNA or RNA there is no pairing and no such relationship.`,
          check: () => (agrees(2 * c.a + 2 * c.g, 100) ? null : "the four base percentages do not total 100"),
        };
      }

      const cases = [
        { q: "What are the three components of a nucleotide?", a: "A pentose sugar, a phosphate group and a nitrogenous base", wrong: ["Two sugars and a base", "A sugar and two phosphates", "An amino acid, a sugar and a phosphate"], why: "Alternating sugars and phosphates form the backbone, with the bases projecting inwards. The same three-part structure builds both DNA and RNA." },
        { q: "What are the three main differences between DNA and RNA?", a: "RNA has ribose not deoxyribose, uracil not thymine, and is usually single-stranded", wrong: ["RNA has thymine not uracil, is double-stranded and contains no sugar", "DNA is single-stranded and contains uracil", "They are identical except in length"], why: "These three differences are the standard comparison and they come up constantly. RNA's single strand is what allows tRNA and rRNA to fold into working shapes." },
        { q: "What bond joins adjacent nucleotides in a strand?", a: "A phosphodiester bond, formed by condensation", wrong: ["A hydrogen bond", "A peptide bond", "A glycosidic bond"], why: "Phosphodiester bonds are covalent and form the sugar-phosphate backbone. Hydrogen bonds hold the two strands together, which is why the strands can separate for replication without breaking the backbone." },
        { q: "Why do A and T pair with two hydrogen bonds and C and G with three?", a: "The number of bonds is fixed by the arrangement of atoms on each base", wrong: ["It depends on the temperature", "It varies between organisms", "It is random"], why: "DNA rich in C and G is more stable and needs more energy to separate the strands, which matters in PCR. A purine always pairs with a pyrimidine, which keeps the helix a constant width." },
        { q: "What is semi-conservative replication?", a: "Each new DNA molecule contains one original strand and one newly made strand", wrong: ["Each new molecule is entirely newly made", "Half of each strand is new", "Only one of the two molecules contains original DNA"], why: "Meselson and Stahl demonstrated this with heavy nitrogen isotopes. Keeping one original strand as a template is what makes replication so accurate." },
        { q: "What is the role of DNA helicase in replication?", a: "It unwinds the helix and breaks the hydrogen bonds between the strands", wrong: ["It joins the new nucleotides together", "It proofreads the new strand", "It removes the primers"], why: "Helicase separates; DNA polymerase joins. Only the hydrogen bonds are broken, which is exactly why the strands can be separated without destroying either." },
        { q: "What is the role of DNA polymerase?", a: "It joins free nucleotides to the template strand, forming phosphodiester bonds", wrong: ["It unwinds the double helix", "It breaks hydrogen bonds", "It transports nucleotides into the nucleus"], why: "Each new nucleotide is positioned by complementary base pairing before polymerase bonds it in place, which is why the copy is faithful. Polymerase works in one direction only along each template." },
        { q: "What is ATP and why is it useful?", a: "A nucleotide with three phosphates whose terminal bond releases a small, usable amount of energy when hydrolysed", wrong: ["A protein that stores energy long-term", "A lipid used to insulate cells", "A carbohydrate broken down in respiration"], why: "The releases are small enough to be useful without waste, and immediate — glucose has to be respired first. ATP is remade continuously, so a cell holds only a small stock at any moment." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.bioc.enzyme-kinetics",
    subject: "biology",
    topic: "bio-biochemistry",
    subtopic: "enzyme-kinetics",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What happens to the rate of an enzyme-controlled reaction as substrate concentration rises?", a: "It increases and then levels off when all active sites are occupied", wrong: ["It increases indefinitely", "It decreases throughout", "It stays constant"], why: "The plateau is reached when the enzyme is saturated: every active site is busy, so adding substrate cannot help. Adding more ENZYME at that point would raise the rate." },
        { q: "What does Vmax represent?", a: "The maximum rate, reached when the enzyme is saturated with substrate", wrong: ["The substrate concentration at half the maximum rate", "The rate at zero substrate", "The optimum temperature"], why: "Km is the substrate concentration giving half Vmax, so the two describe different axes of the same curve. Vmax depends on how much enzyme is present; Km does not." },
        { q: "What does a low Km value indicate?", a: "The enzyme has a high affinity for its substrate", wrong: ["The enzyme has a low affinity for its substrate", "The enzyme works only at low temperatures", "The enzyme has a high maximum rate"], why: "A low Km means half the maximum rate is reached at a low substrate concentration, so the enzyme binds readily. Km is about binding, Vmax about throughput." },
        { q: "How does a competitive inhibitor work?", a: "It has a similar shape to the substrate and binds to the active site, blocking it", wrong: ["It binds elsewhere and changes the active site's shape", "It denatures the enzyme permanently", "It removes the substrate from solution"], why: "Because the two compete for the same site, increasing the substrate concentration overcomes the inhibition. Vmax is therefore unchanged while Km appears to rise." },
        { q: "How does a non-competitive inhibitor work?", a: "It binds at an allosteric site and changes the shape of the active site", wrong: ["It binds directly to the active site", "It has the same shape as the substrate", "It increases the reaction rate"], why: "Because it does not compete for the active site, adding more substrate does not help, so Vmax falls. This is the key experimental distinction between the two kinds of inhibition." },
        { q: "What effect does a competitive inhibitor have on Vmax and Km?", a: "Vmax is unchanged and Km appears to increase", wrong: ["Vmax falls and Km is unchanged", "Both fall", "Both increase"], why: "Enough substrate eventually outcompetes the inhibitor, so the maximum rate is still reachable — it just takes more substrate to get there. That is exactly what a raised Km means." },
        { q: "What is end-product inhibition?", a: "The product of a pathway inhibits an earlier enzyme, preventing overproduction", wrong: ["The substrate inhibits the first enzyme", "The enzyme destroys its own product", "The product denatures every enzyme in the cell"], why: "It is negative feedback applied to metabolism, and it usually works through a non-competitive allosteric site. Without it, a cell would keep making a product it already has enough of." },
        { q: "Why does the initial rate of reaction give the most reliable measure of enzyme activity?", a: "Substrate concentration is highest and has not yet fallen, so the rate is not limited by depletion", wrong: ["The enzyme is coldest at the start", "The product has not formed yet, so nothing can be measured", "The enzyme is not yet denatured"], why: "As substrate is used up the rate falls for reasons that have nothing to do with the variable being investigated. Taking the tangent at t = 0 removes that confounding effect." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Molecular genetics
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.gen.transcription",
    subject: "biology",
    topic: "bio-genetics",
    subtopic: "transcription",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is transcription?", a: "The copying of a gene's DNA sequence into a molecule of mRNA", wrong: ["The building of a protein from mRNA", "The replication of the whole DNA molecule", "The joining of amino acids into a chain"], why: "Transcription happens in the nucleus and produces RNA; translation happens at a ribosome and produces protein. The mRNA is a copy of one gene, not of the whole molecule." },
        { q: "Which enzyme carries out transcription?", a: "RNA polymerase", wrong: ["DNA polymerase", "DNA helicase", "DNA ligase"], why: "DNA polymerase does replication, using DNA nucleotides. RNA polymerase builds an RNA strand from the DNA template, so it uses uracil where the template has adenine." },
        { q: "Which strand of DNA is used as the template in transcription?", a: "The antisense, or template, strand", wrong: ["The sense strand", "Both strands equally", "Neither — a new strand is made from scratch"], why: "The mRNA produced is complementary to the template strand, which makes it identical to the sense strand except for uracil replacing thymine. Only one strand is transcribed for any given gene." },
        { q: "What replaces thymine in an mRNA molecule?", a: "Uracil", wrong: ["Adenine", "Cytosine", "Guanine"], why: "So wherever the template has adenine, the mRNA has uracil. Pairing is otherwise unchanged, and the substitution is one of the three standard DNA–RNA differences." },
        { q: "What are introns and exons?", a: "Introns are non-coding sections removed after transcription; exons are the coding sections joined together", wrong: ["Introns are coding and exons are non-coding", "Both are removed before translation", "Both code for amino acids"], why: "Splicing removes the introns from pre-mRNA and joins the exons, and alternative splicing lets one gene produce several proteins. Prokaryotes have no introns, so their mRNA needs no splicing." },
        { q: "Where does transcription take place in a eukaryotic cell?", a: "In the nucleus", wrong: ["At the ribosome", "In the mitochondria only", "In the cytoplasm"], why: "The DNA stays in the nucleus and the mRNA carries the message out through a nuclear pore. Prokaryotes have no nucleus, so transcription and translation happen together in the cytoplasm." },
        { q: "What is pre-mRNA?", a: "The initial transcript, containing both introns and exons, before splicing", wrong: ["The mRNA after it has left the nucleus", "A short RNA that carries amino acids", "The template strand of DNA"], why: "Splicing converts pre-mRNA into mature mRNA, which is what leaves the nucleus. tRNA is the molecule that carries amino acids." },
        { q: "Why does transcription produce a copy rather than sending the DNA itself to the ribosome?", a: "It protects the DNA and allows many copies of one gene to be made at once", wrong: ["DNA is too small to leave the nucleus", "DNA cannot bond to a ribosome", "The DNA would be used up"], why: "Damage to a single DNA molecule would be permanent, while mRNA is disposable. Making many transcripts also lets a cell scale protein production without duplicating genes." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.gen.translation",
    subject: "biology",
    topic: "bio-genetics",
    subtopic: "translation",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Where does translation take place?", a: "At a ribosome in the cytoplasm or on the rough endoplasmic reticulum", wrong: ["In the nucleus", "In the mitochondria only", "In the Golgi apparatus"], why: "Ribosomes on the rough ER make proteins destined for secretion or for membranes; free ribosomes make proteins for use in the cytoplasm. The Golgi modifies and packages proteins after they are made." },
        { q: "What is the role of tRNA?", a: "It carries a specific amino acid to the ribosome and pairs its anticodon with an mRNA codon", wrong: ["It carries the genetic message out of the nucleus", "It forms the structure of the ribosome", "It joins amino acids into a chain"], why: "Each tRNA has an anticodon at one end and an amino acid binding site at the other, which is what physically links the code to the protein. mRNA carries the message and rRNA forms the ribosome." },
        { q: "What is a codon?", a: "A sequence of three bases on mRNA that codes for one amino acid", wrong: ["A sequence of three bases on tRNA", "A single base on mRNA", "A whole gene"], why: "The three-base sequence on tRNA is the anticodon, and it is complementary to the codon. On DNA the equivalent is called a triplet." },
        { q: "How many bases code for one amino acid?", a: "Three", wrong: ["One", "Two", "Four"], why: "Two bases would give only 16 combinations, not enough for twenty amino acids; three gives 64, which is more than enough. The surplus is why the code is degenerate." },
        { q: "What does it mean to say the genetic code is degenerate?", a: "Most amino acids are coded for by more than one codon", wrong: ["Some codons code for more than one amino acid", "The code changes between species", "Some codons code for nothing at all"], why: "Degeneracy means a base substitution in the third position often changes nothing, which limits the damage mutations do. If one codon coded for several amino acids, translation would be ambiguous and useless." },
        { q: "What happens at a stop codon?", a: "Translation ends and the polypeptide is released", wrong: ["A special amino acid is added", "The ribosome reverses direction", "Transcription begins"], why: "There are three stop codons and none of them codes for an amino acid. A mutation that creates one early produces a truncated, usually non-functional protein." },
        { q: "What bond forms between adjacent amino acids during translation?", a: "A peptide bond", wrong: ["A phosphodiester bond", "A hydrogen bond", "A glycosidic bond"], why: "The ribosome catalyses its formation as each new tRNA arrives. Phosphodiester bonds join nucleotides, not amino acids." },
        { q: "What happens to a polypeptide after translation?", a: "It folds and may be modified, for example in the Golgi apparatus", wrong: ["It is immediately broken down", "It returns to the nucleus", "It becomes a molecule of mRNA"], why: "Folding produces the tertiary structure that gives the protein its function, and modifications such as adding sugar groups happen afterwards. A polypeptide straight off the ribosome is not usually a working protein yet." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.gen.code",
    subject: "biology",
    topic: "bio-genetics",
    subtopic: "genetic-code",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 28,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        const amino = rng.pick([10, 20, 25, 40, 50, 75, 100, 120, 150, 200, 250, 300]);
        const bases = exact(amino * 3, 0, "base count");
        const asked = rng.bool();

        if (asked) {
          const answer = ans(bases);
          return {
            prompt: `A polypeptide is ${amino} amino acids long. How many mRNA bases code for it, ignoring the stop codon?`,
            answer,
            distractors: pickDistractors(answer, [
              slip(amino, ""), // forgot the factor of three
              slip(amino / 3, ""), // divided instead of multiplying
              slip(amino * 2, ""),
              slip(bases + 3, ""),
            ]),
            explanation:
              `Each amino acid is coded for by a triplet of three bases, so ${amino} × 3 = ${answer}. ` +
              `A real mRNA is longer still, because it also carries a stop codon and untranslated regions at each end.`,
            check: () => (agrees(bases / 3, amino) ? null : "the base count does not divide into triplets"),
          };
        }

        const answer = ans(amino);
        return {
          prompt: `A section of mRNA contains ${num(bases)} bases. How many amino acids does it code for?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(bases, ""), // forgot the triplets
            slip(bases * 3, ""), // multiplied instead of dividing
            slip(bases / 2, ""),
            slip(amino - 1, ""),
          ]),
          explanation:
            `Three bases code for one amino acid, so ${num(bases)} ÷ 3 = ${answer}. ` +
            `In a eukaryotic GENE the count would be larger, because introns are transcribed and then removed before translation.`,
          check: () => (agrees(amino * 3, bases) ? null : "the amino acid count does not multiply back"),
        };
      }

      const cases = [
        { q: "Why must the genetic code be read in triplets rather than pairs?", a: "Pairs of four bases give only 16 combinations, too few for twenty amino acids", wrong: ["Triplets are easier for the ribosome to read", "Pairs would be too long", "There are only three bases in RNA"], why: "Four bases in threes give 64 combinations, comfortably more than needed. The surplus is what makes the code degenerate rather than exactly fitted." },
        { q: "What does it mean to say the genetic code is universal?", a: "The same codons code for the same amino acids in almost all organisms", wrong: ["Every organism has the same genes", "The code is the same in every cell of one organism only", "All organisms have the same number of chromosomes"], why: "This is what makes genetic engineering possible — a human gene works in a bacterium. It is also strong evidence for a single common ancestor." },
        { q: "What does it mean to say the genetic code is non-overlapping?", a: "Each base is part of only one codon, and the code is read in fixed sequential triplets", wrong: ["Codons can share bases with their neighbours", "Some bases are skipped", "Codons vary in length"], why: "Because the triplets do not overlap, inserting or deleting a base shifts every codon after it — a frameshift mutation. Overlapping codes would make such mutations less damaging but also constrain which sequences were possible." },
        { q: "What is a start codon and what does it code for?", a: "AUG, which codes for methionine and marks where translation begins", wrong: ["UAA, which codes for no amino acid", "AAA, which marks the end of a gene", "GGG, which codes for glycine"], why: "AUG does double duty, both starting translation and specifying an amino acid, so every polypeptide begins with methionine before processing. UAA is a stop codon." },
        { q: "How many codons are there in total, and how many code for amino acids?", a: "64 codons, of which 61 code for amino acids and 3 are stop codons", wrong: ["20 codons, one per amino acid", "64 codons, all of which code for amino acids", "16 codons, of which 3 are stop codons"], why: "4³ = 64. The 61 coding codons spread over twenty amino acids is exactly why most amino acids have more than one codon." },
        { q: "Why is degeneracy in the genetic code useful?", a: "A base substitution often produces the same amino acid, so the protein is unaffected", wrong: ["It allows one codon to make several proteins", "It speeds up translation", "It prevents all mutations"], why: "Third-position changes are especially likely to be silent. Degeneracy does not prevent mutations — it limits how many of them have consequences." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.gen.mutations",
    subject: "biology",
    topic: "bio-genetics",
    subtopic: "mutations",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is a substitution mutation?", a: "One base is replaced by another, changing at most one codon", wrong: ["One base is removed from the sequence", "An extra base is inserted", "A whole chromosome is duplicated"], why: "Because only one codon is affected, and because the code is degenerate, a substitution is often silent. Insertions and deletions are far more damaging because they shift the reading frame." },
        { q: "Why is a deletion mutation usually more serious than a substitution?", a: "It shifts the reading frame, so every codon after it is changed", wrong: ["It removes a whole gene", "It always creates a stop codon immediately", "It affects only the last amino acid"], why: "A frameshift usually produces a completely different and non-functional protein from that point on. A substitution changes at most one amino acid." },
        { q: "What is a silent mutation?", a: "A base change that does not alter the amino acid coded for", wrong: ["A mutation in a gene that is never used", "A mutation that deletes a base", "A mutation that stops transcription"], why: "Degeneracy makes this possible, especially for third-position changes. The DNA sequence has changed but the protein has not, so there is nothing for selection to act on." },
        { q: "What is a nonsense mutation?", a: "A base change that creates a stop codon, truncating the protein", wrong: ["A change that produces a longer protein", "A change with no effect on the protein", "A change in a non-coding region"], why: "A protein cut short is almost always non-functional, so nonsense mutations tend to be severe. A missense mutation changes one amino acid instead." },
        { q: "What can increase the rate of mutation?", a: "Mutagens such as ionising radiation, UV light and certain chemicals", wrong: ["A high-protein diet", "Rapid breathing", "Low temperatures"], why: "Mutagens damage DNA or interfere with replication. Mutations also occur spontaneously at a low rate from replication errors, which is why they happen even without any external cause." },
        { q: "Why do mutations in non-coding DNA usually have no effect?", a: "Those regions do not code for a protein, so the protein is unchanged", wrong: ["Non-coding DNA is not replicated", "Non-coding DNA repairs itself instantly", "Non-coding DNA contains no bases"], why: "Most of the human genome is non-coding, so most mutations land there. Some non-coding regions do regulate gene expression, so the rule is a generalisation rather than an absolute." },
        { q: "How can a mutation lead to a new allele?", a: "The altered base sequence is a different version of the same gene", wrong: ["It creates an entirely new gene position", "It duplicates the chromosome", "It always deletes the gene"], why: "This is the ultimate source of all genetic variation, since meiosis and fertilisation only reshuffle what already exists. Most new alleles are neutral or harmful; occasionally one is beneficial." },
        { q: "Where must a mutation occur to be inherited?", a: "In a gamete or in the cells that produce gametes", wrong: ["In any body cell", "In a skin cell only", "In the mitochondria of muscle cells"], why: "A mutation in a body cell affects only that cell and its descendants within the individual — which is how cancer starts, but not how inheritance works. Only germ line mutations pass to offspring." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.gen.expression",
    subject: "biology",
    topic: "bio-genetics",
    subtopic: "gene-expression",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Why do different cells in one organism look and behave differently despite having the same genes?", a: "Different genes are switched on and off in different cell types", wrong: ["Different cells contain different genes", "Cells lose the genes they do not need", "Each cell type has its own chromosomes"], why: "Every body cell has the whole genome; what differs is which parts are expressed. Differentiation is a matter of gene regulation, not gene loss — which is why a differentiated cell can, in principle, be reprogrammed." },
        { q: "What is a transcription factor?", a: "A protein that binds to DNA and increases or decreases the transcription of a gene", wrong: ["An enzyme that joins amino acids", "A section of DNA that codes for a protein", "A molecule that carries amino acids to the ribosome"], why: "Transcription factors are how signals from outside a cell reach its genes, which is how hormones such as oestrogen exert their effects. They act before transcription rather than after it." },
        { q: "How does DNA methylation affect gene expression?", a: "Adding methyl groups usually prevents transcription, switching the gene off", wrong: ["It always increases transcription", "It changes the base sequence permanently", "It removes the gene from the chromosome"], why: "Methylation is an epigenetic change: the DNA sequence is unaltered but its accessibility is. Some methylation patterns are inherited, which is why environment can affect gene expression across generations." },
        { q: "What does acetylation of histones do?", a: "It loosens the DNA-histone association, making transcription more likely", wrong: ["It tightens the DNA around the histone", "It cuts the DNA", "It changes the base sequence"], why: "Acetylation reduces the positive charge on histones so they hold the negatively charged DNA less tightly. Deacetylation does the reverse and represses transcription." },
        { q: "What is meant by an epigenetic change?", a: "A heritable change in gene expression that does not alter the DNA base sequence", wrong: ["A permanent change to the DNA sequence", "A mutation in a gamete", "A change in the number of chromosomes"], why: "Methylation and histone modification are the two standard mechanisms, and both respond to environmental factors such as diet and stress. Because they are reversible, they are a promising target for drugs." },
        { q: "How can a hormone such as oestrogen affect gene expression?", a: "It binds to a receptor that acts as a transcription factor, switching target genes on", wrong: ["It changes the DNA base sequence", "It destroys the mRNA of target genes", "It removes histones from chromosomes"], why: "Steroid hormones are lipid-soluble, so they pass through the membrane and act inside the cell. This is a slower route than a nerve impulse but its effects last much longer." },
        { q: "What is RNA interference?", a: "Small RNA molecules break down or block mRNA, preventing translation", wrong: ["RNA molecules cut DNA", "RNA prevents transcription from starting", "RNA replaces damaged proteins"], why: "It acts after transcription, on the message rather than the gene, and is a natural defence against viral RNA as well as a regulatory mechanism. It has become a widely used laboratory tool for switching single genes off." },
        { q: "How might epigenetic changes contribute to cancer?", a: "Methylation can silence tumour suppressor genes, allowing uncontrolled division", wrong: ["Methylation always destroys DNA", "Epigenetic changes cannot affect cell division", "Acetylation removes oncogenes"], why: "The gene is intact but switched off, so the brake on division is released without any mutation. Because the change is reversible in principle, drugs that reverse methylation are an active area of research." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.gen.pcr",
    subject: "biology",
    topic: "bio-genetics",
    subtopic: "pcr-sequencing",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 32,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        /* PCR doubles the number of copies each cycle. The pairs are enumerated
           because 100 molecules through 10 cycles gives 102 400, which crosses
           into standard form with a three-decimal mantissa and cannot be
           published — a case that would have thrown the first time a variant
           happened to draw it. */
        const { start, cycles, copies } = rng.pick(PCR_CASES);
        const answer = ans(copies);
        return {
          prompt:
            `A PCR reaction starts with ${start} DNA molecule${start === 1 ? "" : "s"} and runs for ${cycles} cycles. ` +
            `How many molecules are present at the end?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(start * cycles * 2, ""), // multiplied rather than doubling repeatedly
            slip(start * cycles, ""), // multiplied by the cycle count
            slip(Math.pow(2, cycles), ""), // ignored the starting number
            slip(copies / 2, ""),
          ]),
          explanation:
            `Each cycle doubles the number of molecules, so after ${cycles} cycles there are ${start} × 2${sup(cycles)} = ${start} × ${num(Math.pow(2, cycles))} = ${answer}. ` +
            `Doubling repeatedly is not the same as multiplying by the number of cycles — this is what makes PCR able to amplify a single molecule into billions in an afternoon.`,
          check: () => (agrees(copies / Math.pow(2, cycles), start) ? null : "the copy number does not halve back to the start"),
        };
      }

      const cases = [
        { q: "What are the three stages of one PCR cycle, in order?", a: "Denaturation at about 95 °C, annealing at about 55 °C, extension at about 72 °C", wrong: ["Annealing, denaturation, extension", "Extension, annealing, denaturation", "Denaturation, extension, annealing"], why: "The strands must separate before primers can bind, and primers must bind before polymerase can extend. The temperatures follow from what each step needs to happen." },
        { q: "Why is Taq polymerase used in PCR?", a: "It comes from a thermophilic bacterium and is not denatured at 95 °C", wrong: ["It works faster than other polymerases", "It can copy RNA as well as DNA", "It requires no primers"], why: "An ordinary polymerase would denature in the first denaturation step and have to be replaced every cycle. Taq's heat stability is what made PCR automatable." },
        { q: "What is the role of primers in PCR?", a: "They bind to the ends of the target sequence and give the polymerase a starting point", wrong: ["They separate the DNA strands", "They supply the nucleotides", "They cut the DNA at specific sequences"], why: "The primers also define which region is amplified, since only DNA between them is copied. Restriction enzymes are what cut at specific sequences." },
        { q: "Why is the mixture heated to about 95 °C at the start of each cycle?", a: "To break the hydrogen bonds between the two strands", wrong: ["To activate the polymerase", "To break the phosphodiester bonds", "To help the primers bind"], why: "Only the hydrogen bonds between the strands are broken, leaving each backbone intact as a template. Primers bind at a lower temperature in the next step." },
        { q: "What does gel electrophoresis separate DNA fragments by?", a: "Size, since smaller fragments travel further through the gel", wrong: ["Colour", "Base sequence", "Mass of the whole chromosome"], why: "DNA is negatively charged so it moves towards the positive electrode, and the gel acts as a sieve. Comparing distance travelled against a ladder of known sizes gives the fragment lengths." },
        { q: "Why is DNA attracted to the positive electrode in electrophoresis?", a: "The phosphate groups in its backbone are negatively charged", wrong: ["The bases carry a positive charge", "The gel repels it", "It is pushed by the buffer flow"], why: "Because every DNA fragment carries the same charge per unit length, separation depends on size alone. This is what makes the technique so straightforward to interpret." },
        { q: "What is one application of DNA sequencing?", a: "Identifying genes linked to disease and tracing evolutionary relationships", wrong: ["Amplifying a DNA sample", "Cutting DNA at specific points", "Separating DNA fragments by size"], why: "Amplification is PCR, cutting is restriction enzymes and separation is electrophoresis — sequencing reads the actual order of bases. The techniques are usually used together." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
