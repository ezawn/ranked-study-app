/**
 * Biology: inheritance, and evolution and classification.
 *
 * The genetic crosses here are generated rather than tabulated. A cross is
 * defined by the two parent genotypes; the offspring ratio and every percentage
 * in the question are worked out from those by code, so a question can never
 * claim a 3:1 ratio for a cross that does not give one. The `check` hooks
 * recount the Punnett square a second way.
 *
 * The chromosome arithmetic — 46 to 46 in mitosis, 46 to 23 in meiosis — is
 * generated from a species' diploid number for the same reason: it is the fact
 * students most often get backwards, and hard-coding it would let an error
 * through unnoticed.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, num, slip, wrongOptions } from "./physics-kit";

/* ==========================================================================
   Genetic crosses
   ========================================================================== */

interface Cross {
  /** Parent genotypes, e.g. "Bb" and "Bb". */
  a: string;
  b: string;
  /** What the dominant allele codes for, in words. */
  dominant: string;
  recessive: string;
  trait: string;
}

const CROSSES: readonly Cross[] = [
  { a: "Bb", b: "Bb", dominant: "brown eyes", recessive: "blue eyes", trait: "eye colour" },
  { a: "Bb", b: "bb", dominant: "brown eyes", recessive: "blue eyes", trait: "eye colour" },
  { a: "BB", b: "bb", dominant: "brown eyes", recessive: "blue eyes", trait: "eye colour" },
  { a: "Tt", b: "Tt", dominant: "tall stems", recessive: "short stems", trait: "stem height" },
  { a: "Tt", b: "tt", dominant: "tall stems", recessive: "short stems", trait: "stem height" },
  { a: "Rr", b: "Rr", dominant: "round seeds", recessive: "wrinkled seeds", trait: "seed shape" },
  { a: "Rr", b: "rr", dominant: "round seeds", recessive: "wrinkled seeds", trait: "seed shape" },
  { a: "Ff", b: "Ff", dominant: "black fur", recessive: "white fur", trait: "fur colour" },
  { a: "Ff", b: "ff", dominant: "black fur", recessive: "white fur", trait: "fur colour" },
  { a: "Gg", b: "Gg", dominant: "green pods", recessive: "yellow pods", trait: "pod colour" },
  { a: "Gg", b: "gg", dominant: "green pods", recessive: "yellow pods", trait: "pod colour" },
  { a: "Pp", b: "Pp", dominant: "purple flowers", recessive: "white flowers", trait: "flower colour" },
  { a: "Pp", b: "pp", dominant: "purple flowers", recessive: "white flowers", trait: "flower colour" },
  { a: "PP", b: "pp", dominant: "purple flowers", recessive: "white flowers", trait: "flower colour" },
  { a: "Ss", b: "Ss", dominant: "smooth coats", recessive: "shaggy coats", trait: "coat texture" },
  { a: "Ss", b: "ss", dominant: "smooth coats", recessive: "shaggy coats", trait: "coat texture" },
  { a: "Tt", b: "TT", dominant: "tall stems", recessive: "short stems", trait: "stem height" },
];

/** Every offspring genotype from a cross, as the sixteen-free Punnett square. */
function offspringOf(cross: Cross): string[] {
  const out: string[] = [];
  for (const one of cross.a.split("")) {
    for (const two of cross.b.split("")) {
      /* Alleles are written dominant first, so "bB" and "Bb" are one genotype. */
      out.push([one, two].sort((x, y) => (x.toLowerCase() === y.toLowerCase() ? (x < y ? -1 : 1) : 0)).join(""));
    }
  }
  return out;
}

/** How many of the four offspring show the dominant phenotype. */
function dominantCount(cross: Cross): number {
  const upper = cross.a[0].toUpperCase();
  return offspringOf(cross).filter((g) => g.includes(upper)).length;
}

/** The phenotype ratio as a string: "3:1", "1:1", "all dominant" and so on. */
function ratioOf(cross: Cross): string {
  const dom = dominantCount(cross);
  const rec = 4 - dom;
  if (rec === 0) return "All offspring show the dominant phenotype";
  if (dom === 0) return "All offspring show the recessive phenotype";
  const divisor = gcd(dom, rec);
  return `${dom / divisor} : ${rec / divisor} (${cross.dominant} : ${cross.recessive})`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const SPECIES = [
  { name: "human", diploid: 46 },
  { name: "chimpanzee", diploid: 48 },
  { name: "dog", diploid: 78 },
  { name: "fruit fly", diploid: 8 },
  { name: "pea plant", diploid: 14 },
  { name: "mouse", diploid: 40 },
  { name: "cat", diploid: 38 },
  { name: "onion", diploid: 16 },
] as const;

/* ==========================================================================
   The generators
   ========================================================================== */

export const biologyGenetics: Generator[] = [
  generator({
    key: "bio.inh.dna",
    subject: "biology",
    topic: "bio-inheritance",
    subtopic: "dna-structure",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is the shape of a DNA molecule?", a: "A double helix of two strands", wrong: ["A single straight chain", "A branched network", "A folded sheet"], why: "Two strands wound round each other and held by base pairs. The structure is what makes replication possible: separate the strands and each is a template for a new partner." },
        { q: "What are the four bases in DNA?", a: "A, T, C and G", wrong: ["A, U, C and G", "A, T, C and U", "A, B, C and D"], why: "Uracil replaces thymine in RNA, not DNA, which is the distinction the wrong answers are built on. The order of these four bases is the genetic information." },
        { q: "Which bases pair together in DNA?", a: "A with T, and C with G", wrong: ["A with C, and T with G", "A with G, and T with C", "A with A, and T with T"], why: "Complementary base pairing means one strand's sequence completely determines the other's, which is what makes accurate copying possible. Pairing a purine with a pyrimidine also keeps the helix a constant width." },
        { q: "What is a gene?", a: "A section of DNA that codes for a particular sequence of amino acids", wrong: ["A whole chromosome", "A protein found in the nucleus", "A pair of alleles"], why: "The gene is the instruction; the protein is the product. A gene is much shorter than a chromosome, which carries thousands of them." },
        { q: "What is a chromosome?", a: "A long molecule of DNA carrying many genes", wrong: ["A single gene", "A protein that copies DNA", "A structure found only in gametes"], why: "Humans have 23 pairs, and each chromosome carries hundreds or thousands of genes. Chromosomes are only visible as distinct structures when they condense during cell division." },
        { q: "What makes up a nucleotide?", a: "A sugar, a phosphate group and a base", wrong: ["Two sugars and a base", "A protein and a base", "A sugar and two phosphates"], why: "The sugar and phosphate alternate to form the backbone, and the base sticks inwards to pair with its partner. Repeating this unit millions of times gives a DNA strand." },
        { q: "What is the genome of an organism?", a: "The entire genetic material of that organism", wrong: ["A single gene", "The set of proteins it makes", "The chromosomes found only in gametes"], why: "Sequencing the human genome has helped identify genes linked to disease and trace human migration. It is the complete set, not a selected part." },
        { q: "Why does the order of bases in a gene matter?", a: "It determines the order of amino acids, and therefore the protein's shape and function", wrong: ["It determines the length of the chromosome", "It determines how fast the cell divides", "It has no effect on the protein"], why: "Shape follows sequence and function follows shape, so a single base change can destroy an enzyme's activity. This chain of consequence is why mutations matter." },
        { q: "Where is DNA found in a eukaryotic cell?", a: "In the nucleus, and in small amounts in mitochondria and chloroplasts", wrong: ["Only in the cytoplasm", "Only in the ribosomes", "In the cell membrane"], why: "The mitochondrial and chloroplast DNA is evidence for the endosymbiotic theory — these organelles look like former prokaryotes that were engulfed and retained." },
        { q: "Why is DNA described as a polymer?", a: "It is a long chain built from many repeating nucleotide units", wrong: ["It contains two strands", "It is found in the nucleus", "It can be copied"], why: "Proteins, starch and cellulose are polymers too, each built from a different monomer. Recognising the pattern makes the term useful rather than just a label." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inh.genes",
    subject: "biology",
    topic: "bio-inheritance",
    subtopic: "genes-chromosomes",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 20,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        const s = rng.pick(SPECIES);
        const asked = rng.bool();
        if (asked) {
          const answer = ans(s.diploid / 2);
          return {
            prompt: `A ${s.name} body cell contains ${s.diploid} chromosomes. How many are in one of its gametes?`,
            answer,
            distractors: pickDistractors(answer, [
              slip(s.diploid, ""), // gave the diploid number
              slip(s.diploid * 2, ""), // doubled instead of halving
              slip(s.diploid / 4, ""),
              slip(s.diploid / 2 + 1, ""),
            ]),
            explanation:
              `Gametes are haploid — they carry one chromosome from each pair — so a ${s.name} gamete has ${s.diploid} ÷ 2 = ${answer}. ` +
              `Fertilisation restores the diploid number, which is why halving at meiosis is essential rather than incidental.`,
            check: () => (agrees((s.diploid / 2) * 2, s.diploid) ? null : "the haploid number does not double back"),
          };
        }
        const answer = ans(s.diploid);
        return {
          prompt: `A ${s.name} gamete contains ${s.diploid / 2} chromosomes. How many are in a body cell?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(s.diploid / 2, ""), // gave the haploid number
            slip(s.diploid / 4, ""), // halved again
            slip(s.diploid * 2, ""),
            slip(s.diploid + 2, ""),
          ]),
          explanation:
            `Two gametes fuse at fertilisation, so the body cell has twice the gamete's number: ${s.diploid / 2} × 2 = ${answer}. ` +
            `Chromosomes in body cells come in matched pairs, one from each parent.`,
          check: () => (agrees((s.diploid / 2) * 2, s.diploid) ? null : "the diploid number is not twice the haploid"),
        };
      }

      const cases = [
        { q: "What is an allele?", a: "A different version of the same gene", wrong: ["A different gene on the same chromosome", "A chromosome from the father", "A protein made by a gene"], why: "Alleles occupy the same position on a pair of chromosomes and code for the same characteristic in different ways. Having two of them, one from each parent, is what makes dominance and recessiveness possible." },
        { q: "What does homozygous mean?", a: "Having two identical alleles for a gene", wrong: ["Having two different alleles for a gene", "Having only one allele for a gene", "Having a gene on the X chromosome"], why: "Homozygous dominant (BB) and homozygous recessive (bb) both count. Heterozygous (Bb) is the one with two different alleles." },
        { q: "What does heterozygous mean?", a: "Having two different alleles for a gene", wrong: ["Having two identical alleles", "Having no alleles for a gene", "Having an extra chromosome"], why: "A heterozygous individual shows the dominant phenotype but can still pass on the recessive allele, which is why recessive conditions appear in children of unaffected parents." },
        { q: "What is the difference between genotype and phenotype?", a: "Genotype is the alleles present; phenotype is the characteristic they produce", wrong: ["Genotype is what you see; phenotype is the alleles", "They are the same thing", "Genotype applies to plants and phenotype to animals"], why: "Two different genotypes can give the same phenotype: BB and Bb both give brown eyes. This is why you cannot always read the genotype from appearance alone." },
        { q: "What does it mean for an allele to be dominant?", a: "It is expressed whenever it is present, even alongside a recessive allele", wrong: ["It is the more common allele in the population", "It is always beneficial", "It is found on the X chromosome"], why: "Dominance is about expression, not frequency or benefit — a dominant allele can be rare and harmful. Polydactyly is dominant and rare; cystic fibrosis is recessive and its allele is more common." },
        { q: "When is a recessive characteristic shown?", a: "Only when both alleles are recessive", wrong: ["Whenever one recessive allele is present", "Only in males", "Only in the first generation"], why: "A single dominant allele masks it, so the recessive phenotype needs the homozygous recessive genotype. This is why recessive disorders can skip generations." },
        { q: "What is a carrier of a genetic disorder?", a: "Someone heterozygous for a recessive disorder, who does not have it but can pass it on", wrong: ["Someone who has the disorder", "Someone with two recessive alleles", "Someone who has been infected"], why: "Carriers are healthy, which is why recessive disorders can appear unexpectedly in a family. Two carriers have a one in four chance of an affected child at each conception." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inh.mitosis",
    subject: "biology",
    topic: "bio-inheritance",
    subtopic: "mitosis",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "How many daughter cells does one mitotic division produce?", a: "Two", wrong: ["Four", "One", "Eight"], why: "Two identical cells from one, each with the full chromosome number. Meiosis produces four, each with half — the two divisions differ in both counts." },
        { q: "Are the daughter cells of mitosis genetically identical to the parent?", a: "Yes, identical", wrong: ["No, they have half the genes", "No, they are genetically varied", "Only in plants"], why: "The DNA is replicated exactly before division, so each daughter receives a complete copy. This is what growth and repair require — a randomly varied replacement cell would be useless." },
        { q: "Where in the body does mitosis occur?", a: "Wherever growth, repair or replacement is needed", wrong: ["Only in the reproductive organs", "Only in bone marrow", "Only during childhood"], why: "Skin, gut lining and blood cells are replaced constantly throughout life. Mitosis in the reproductive organs makes more of the cells that will later undergo meiosis, so it happens there too." },
        { q: "What must happen before mitosis begins?", a: "The DNA is replicated and the cell makes extra organelles", wrong: ["The chromosome number halves", "The nucleus dissolves permanently", "The cell shrinks"], why: "Both daughter cells need a full set of everything, so the preparation is a doubling. All of this happens during interphase, which is most of the cell cycle." },
        { q: "What is the role of mitosis in asexual reproduction?", a: "It produces offspring genetically identical to the parent", wrong: ["It produces varied offspring", "It halves the chromosome number", "It combines DNA from two parents"], why: "Asexual reproduction is fast and needs no partner, but the clones it produces have no genetic variation — so a change in the environment can wipe out the whole population." },
        { q: "During which stage of mitosis are the chromatids pulled to opposite poles?", a: "Anaphase", wrong: ["Prophase", "Metaphase", "Telophase"], why: "Metaphase lines them up on the equator and anaphase pulls them apart, so the alphabetical order matches the sequence. Telophase then re-forms the two nuclei." },
        { q: "What happens to the nuclear membrane during mitosis?", a: "It breaks down early and re-forms around each new nucleus", wrong: ["It stays intact throughout", "It divides in half", "It is destroyed permanently"], why: "The membrane must break down for the spindle to reach the chromosomes, and re-form so each daughter cell has a proper nucleus. Its disappearance and return bracket the visible stages." },
        { q: "Why is mitosis described as producing clones?", a: "Every daughter cell has exactly the same genes as the parent cell", wrong: ["Because the cells are the same size", "Because it happens only in plants", "Because the cells cannot divide again"], why: "A clone is a genetically identical copy, and mitosis makes them by definition. Plant cuttings and identical twins are clones for the same reason." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inh.meiosis",
    subject: "biology",
    topic: "bio-inheritance",
    subtopic: "meiosis",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "How many cells does one meiotic division produce?", a: "Four", wrong: ["Two", "One", "Eight"], why: "Two divisions in succession give four cells, each haploid and each genetically different. Mitosis gives two identical diploid cells — the counts are the quickest way to tell the two processes apart." },
        { q: "What is the chromosome number of the cells produced by meiosis?", a: "Half that of the parent cell", wrong: ["The same as the parent cell", "Double that of the parent cell", "It varies between the four cells"], why: "Halving is essential because fertilisation doubles it again — without meiosis the number would rise every generation. This is why meiosis happens only in gamete formation." },
        { q: "Where in the body does meiosis take place?", a: "In the reproductive organs", wrong: ["In the skin", "In the liver", "In every tissue"], why: "Meiosis makes gametes, so it is confined to the ovaries and testes. Every other dividing cell in the body uses mitosis." },
        { q: "Why does meiosis produce genetic variation?", a: "Chromosomes are shuffled between pairs and assorted randomly into the gametes", wrong: ["Because the DNA is copied inaccurately", "Because mutations always occur", "Because the cells are haploid"], why: "Independent assortment and crossing over together mean no two gametes are alike. That variation, plus the random combination at fertilisation, is why siblings differ." },
        { q: "What happens at fertilisation?", a: "Two haploid gametes fuse to form a diploid zygote", wrong: ["A diploid cell divides into two haploid cells", "Two diploid cells fuse", "One gamete divides by mitosis"], why: "Fertilisation restores the full chromosome number and combines genes from two parents. The zygote then divides by mitosis to build the whole organism." },
        { q: "How does the genetic content of gametes from one person compare?", a: "They differ from one another", wrong: ["They are all identical", "They are identical within one parent but differ between parents", "Half are identical and half differ"], why: "This is exactly why siblings are not identical. It also means the number of possible children from one couple is astronomically large." },
        { q: "Why is sexual reproduction advantageous in a changing environment?", a: "The variation it produces means some offspring may be better suited to new conditions", wrong: ["It produces more offspring than asexual reproduction", "It is faster than asexual reproduction", "It requires less energy"], why: "Variation is the raw material natural selection acts on. Asexual reproduction is faster and needs no mate, but a uniform population has no reserve of difference to draw on." },
        { q: "What happens immediately after fertilisation?", a: "The zygote divides repeatedly by mitosis to form an embryo", wrong: ["The zygote divides by meiosis", "The zygote halves its chromosome number again", "The zygote becomes a gamete"], why: "Meiosis has done its job by this point; everything from here is growth, which needs identical cells. Cells then differentiate into the specialised types the organism needs." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inh.crosses",
    subject: "biology",
    topic: "bio-inheritance",
    subtopic: "punnett-squares",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    /* Seventeen crosses across three question forms. Many crosses share a
       genotype question — BB × bb has only one possible offspring genotype — so
       the real space is smaller than 17 × 3 and the dedupe needs headroom. */
    variants: 20,
    build: (rng) => {
      const cross = rng.pick(CROSSES);
      const dom = dominantCount(cross);
      const rec = 4 - dom;
      const form = rng.int(0, 2);

      if (form === 0) {
        const percent = (dom / 4) * 100;
        const answer = ans(percent, "%");
        return {
          prompt:
            `In a cross between a ${cross.a} parent and a ${cross.b} parent, where the dominant allele gives ${cross.dominant}, ` +
            `what percentage of offspring would be expected to show ${cross.dominant}?`,
          answer,
          distractors: pickDistractors(answer, [
            slip((rec / 4) * 100, "%"), // gave the recessive percentage
            slip(50, "%"), // assumed an even split
            slip(dom, "%"), // gave the count rather than the percentage
            slip(((dom + 1) / 4) * 100, "%"),
          ]),
          explanation:
            `The Punnett square gives four equally likely combinations: ${offspringOf(cross).join(", ")}. ` +
            `${dom} of the 4 contain a dominant allele, so ${dom} ÷ 4 × 100 = ${answer}. ` +
            `These are probabilities for each offspring independently, not a guarantee about any actual set of four.`,
          check: () => (agrees(dom + rec, 4) ? null : "the Punnett square does not have four cells"),
        };
      }

      if (form === 1) {
        const answer = ratioOf(cross);
        const alternatives = ["3 : 1 (dominant : recessive)", "1 : 1 (dominant : recessive)", "All offspring show the dominant phenotype", "1 : 3 (dominant : recessive)", "2 : 1 (dominant : recessive)"];
        return {
          prompt:
            `A ${cross.a} plant is crossed with a ${cross.b} plant, where the dominant allele gives ${cross.dominant} and the recessive gives ${cross.recessive}. ` +
            `What phenotype ratio would you expect in the offspring?`,
          answer,
          distractors: wrongOptions(
            answer,
            alternatives.filter((x) => x !== answer && !x.startsWith(answer.slice(0, 5))),
          ),
          explanation:
            `The four combinations are ${offspringOf(cross).join(", ")}, of which ${dom} show ${cross.dominant} and ${rec} show ${cross.recessive}. ` +
            `A heterozygous × heterozygous cross gives 3 : 1, a heterozygous × homozygous recessive cross gives 1 : 1, and a homozygous dominant parent means every offspring shows the dominant phenotype.`,
          check: () => (agrees(dom + rec, 4) ? null : "the offspring counts do not total four"),
        };
      }

      const genotypes = offspringOf(cross);
      const unique = [...new Set(genotypes)];
      const target = rng.pick(unique);
      const count = genotypes.filter((g) => g === target).length;
      const percent = (count / 4) * 100;
      const answer = ans(percent, "%");
      return {
        prompt:
          `A ${cross.a} individual is crossed with a ${cross.b} individual. What percentage of the offspring would be expected to have the genotype ${target}?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(100 - percent, "%"), // gave the complement
          slip(25, "%"), // assumed one cell in four regardless
          slip(count, "%"), // gave the count rather than the percentage
          slip(percent / 2, "%"),
        ]),
        explanation:
          `The Punnett square gives ${genotypes.join(", ")}. ` +
          `${count} of the 4 are ${target}, so ${count} ÷ 4 × 100 = ${answer}. ` +
          `Genotype ratios are finer than phenotype ratios: a 3 : 1 phenotype split hides a 1 : 2 : 1 genotype split underneath.`,
        check: () => (count >= 1 && count <= 4 ? null : `a count of ${count} is impossible in a four-cell square`),
      };
    },
  }),

  generator({
    key: "bio.inh.sex",
    subject: "biology",
    topic: "bio-inheritance",
    subtopic: "sex-determination",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Which pair of chromosomes determines biological sex in humans?", a: "The 23rd pair", wrong: ["The 1st pair", "The 22nd pair", "All 23 pairs together"], why: "The other 22 pairs are called autosomes and carry everything else. Isolating sex determination to one pair is what makes the inheritance so straightforward." },
        { q: "What are the sex chromosomes of a human female?", a: "XX", wrong: ["XY", "YY", "X only"], why: "A female can only pass on an X, so the father's gamete decides the sex of the child. YY does not occur — every individual needs at least one X to survive." },
        { q: "What are the sex chromosomes of a human male?", a: "XY", wrong: ["XX", "YY", "Y only"], why: "Because males produce X and Y gametes in equal numbers, the ratio of male to female births is close to 1:1. This falls straight out of a Punnett square of XX × XY." },
        { q: "What is the probability of a child being male?", a: "50%", wrong: ["25%", "75%", "It depends on the mother"], why: "The XX × XY cross gives XX, XX, XY, XY — two of four. The mother contributes an X either way, so the father's gamete alone determines the outcome." },
        { q: "Which parent determines the sex of a child?", a: "The father, because he produces both X and Y gametes", wrong: ["The mother, because she carries the egg", "Both equally", "Neither — it is random after fertilisation"], why: "The mother can only supply an X. Historically this was often assumed backwards, which is a good illustration of how a simple Punnett square settles a question." },
        { q: "Why are sex-linked disorders more common in males?", a: "Males have only one X chromosome, so a single recessive allele is expressed", wrong: ["Males have more mutations", "Males have two X chromosomes", "The Y chromosome carries the disorder"], why: "A female with one affected X usually has a healthy allele on the other and is a carrier. A male has no second X to mask it, so the recessive allele shows." },
        { q: "In a cross between an XX and an XY parent, what ratio of male to female offspring is expected?", a: "1 : 1", wrong: ["3 : 1", "1 : 3", "2 : 1"], why: "Two of the four Punnett square cells are XX and two are XY. Actual birth ratios differ very slightly from this for reasons unrelated to the genetics." },
        { q: "What does the Y chromosome carry that the X does not?", a: "The gene that triggers development of male characteristics", wrong: ["All the genes for eye colour", "Twice as many genes as the X", "The genes for blood group"], why: "The Y is much smaller than the X and carries far fewer genes. Its key role is the switch that starts male development; most other genes on the X have no counterpart on it." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inh.disorders",
    subject: "biology",
    topic: "bio-inheritance",
    subtopic: "genetic-disorders",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Is cystic fibrosis caused by a dominant or a recessive allele?", a: "Recessive", wrong: ["Dominant", "Sex-linked dominant", "It is not genetic"], why: "Both parents must pass on the affected allele, so carriers are healthy and the condition can skip generations. Polydactyly is the dominant example, and only one affected allele is needed there." },
        { q: "Is polydactyly caused by a dominant or a recessive allele?", a: "Dominant", wrong: ["Recessive", "Sex-linked recessive", "It is not inherited"], why: "One affected allele is enough, so an affected person has at least one affected parent. Cystic fibrosis is the recessive counterpart, and the contrast between them is the standard question." },
        { q: "What is the chance of two carriers of cystic fibrosis having an affected child?", a: "25%", wrong: ["50%", "75%", "100%"], why: "Each parent is Cc, so the cross gives CC, Cc, cC, cc — one in four is cc. The other three are unaffected, and two of them are carriers themselves." },
        { q: "What is embryo screening?", a: "Testing embryos for genetic disorders before implantation or during pregnancy", wrong: ["Screening adults for infections", "Changing an embryo's genes", "Selecting the sex of a child"], why: "Screening identifies but does not change. It raises ethical questions about which conditions justify not implanting an embryo, and about how such decisions should be made." },
        { q: "What is a concern raised about embryo screening?", a: "It may lead to selecting embryos for non-medical characteristics", wrong: ["It is impossible to do accurately", "It always harms the embryo", "It cannot detect genetic disorders"], why: "The technology is accurate; the disagreements are about where to draw the line. Cost and the position of people living with the conditions being screened for are also part of the debate." },
        { q: "How is a genetic disorder different from an infectious disease?", a: "It is caused by inherited alleles rather than by a pathogen", wrong: ["It can be treated with antibiotics", "It only appears in adulthood", "It is always fatal"], why: "Genetic disorders cannot be caught or passed on by contact, only inherited. This is why treatment aims at symptoms or, increasingly, at the genes themselves." },
        { q: "Why can a recessive disorder appear in a child whose parents are both unaffected?", a: "Both parents can be heterozygous carriers", wrong: ["The disorder was caught from the environment", "One parent must have had it as a child", "A mutation always occurs at fertilisation"], why: "A carrier has one affected and one normal allele, so shows no symptoms but can pass the affected allele on. Two carriers meeting is the usual explanation for an unexpected case." },
        { q: "If one parent has polydactyly and is heterozygous, and the other is unaffected, what is the chance of an affected child?", a: "50%", wrong: ["25%", "75%", "100%"], why: "The cross is Dd × dd, giving Dd, Dd, dd, dd — two of four inherit the dominant allele. A dominant disorder in a heterozygous parent gives one in two at every conception." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inh.variation",
    subject: "biology",
    topic: "bio-inheritance",
    subtopic: "variation",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are the two causes of variation within a species?", a: "Genes inherited from parents and the environment", wrong: ["Only genes", "Only the environment", "Only random mutation"], why: "Most characteristics are affected by both — height depends on genes and on nutrition. Mutation is the ultimate source of new genetic variation, but it is part of the genetic cause rather than a third one." },
        { q: "Which of these is caused only by the environment?", a: "A scar from an injury", wrong: ["Blood group", "Eye colour", "Natural hair colour"], why: "Blood group and eye colour are entirely genetic; height and weight are both. A scar cannot be inherited, which is what makes it a clean example." },
        { q: "Which of these is determined only by genes?", a: "Blood group", wrong: ["Body mass", "A tattoo", "Language spoken"], why: "Blood group is unaffected by diet, exercise or upbringing. Body mass is genetic and environmental; the other two are purely environmental." },
        { q: "What is a mutation?", a: "A random change to the sequence of bases in DNA", wrong: ["A deliberate change made by a cell", "A change caused by the environment only", "The mixing of alleles at fertilisation"], why: "Mutations happen continuously and most have no effect at all. Occasionally one changes a protein enough to alter the phenotype, and that is where new variation ultimately comes from." },
        { q: "Do most mutations affect the phenotype?", a: "No — most have no effect at all", wrong: ["Yes, all mutations change the phenotype", "Yes, and they are always harmful", "No, mutations never have any effect"], why: "Many fall in non-coding regions or change a base without changing the amino acid. A small number are harmful, and a very small number are beneficial — those are the ones natural selection can act on." },
        { q: "Why is variation within a species important?", a: "It allows natural selection to act, so the species can adapt to change", wrong: ["It makes all individuals equally fit", "It prevents mutations occurring", "It reduces competition entirely"], why: "Without differences there is nothing for selection to select. A population of clones faces a new disease or climate with no reserve of difference to draw on." },
        { q: "What is the main source of new alleles in a population?", a: "Mutation", wrong: ["Meiosis", "Fertilisation", "Mitosis"], why: "Meiosis and fertilisation shuffle existing alleles into new combinations, which produces variation but no new alleles. Only mutation creates a version that did not exist before." },
        { q: "Why do identical twins raised apart still differ in some characteristics?", a: "Environmental factors affect many characteristics as well as genes", wrong: ["Their DNA changes over time to become different", "One twin is a clone and the other is not", "Identical twins have different genes"], why: "Twins are the natural experiment that separates the two causes, since the genes are held constant. Differences that emerge must therefore be environmental." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Evolution and classification
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.evo.selection",
    subject: "biology",
    topic: "bio-evolution",
    subtopic: "natural-selection",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is the theory of evolution by natural selection?", a: "Species gradually change over time as individuals better suited to their environment survive and reproduce", wrong: ["Individuals change during their lives and pass those changes on", "Species were created in their present form", "Organisms choose useful characteristics to develop"], why: "Selection acts on variation that already exists — it does not create it in response to need. The idea that individuals change and pass the change on is Lamarck's, and it is what Darwin's account replaced." },
        { q: "Where does the variation that natural selection acts on come from?", a: "Random mutation and the shuffling of alleles in sexual reproduction", wrong: ["The organism's efforts during its lifetime", "The environment directly changing genes usefully", "Nowhere — variation is created by selection"], why: "The variation comes first and selection acts on it afterwards. Mutations are random with respect to what would be useful, which is why evolution has no foresight." },
        { q: "Why do individuals with a beneficial characteristic become more common over generations?", a: "They are more likely to survive, reproduce and pass on the alleles for it", wrong: ["They live forever", "They mutate more often", "They choose to have more offspring"], why: "The mechanism is differential reproduction, not differential effort. Over many generations a small advantage compounds into a large change in the population." },
        { q: "Why is it wrong to say that giraffes evolved long necks because they needed to reach high leaves?", a: "Variation in neck length existed first, and the longer-necked individuals simply survived and reproduced more", wrong: ["Giraffes did not evolve long necks at all", "Needing something does cause it to evolve", "Neck length is entirely environmental"], why: "Need cannot direct a mutation — mutations are random with respect to what would be useful. The environment does the selecting after the fact, which is why evolution has no foresight and cannot produce what has never varied." },
        { q: "Who proposed the theory of evolution by natural selection alongside Darwin?", a: "Alfred Russel Wallace", wrong: ["Jean-Baptiste Lamarck", "Gregor Mendel", "Louis Pasteur"], why: "Wallace reached the same conclusion independently, and their work was presented together in 1858. Mendel worked out inheritance, which was the missing mechanism Darwin lacked." },
        { q: "Why was Darwin's theory only gradually accepted?", a: "It conflicted with religious views, and the mechanism of inheritance was not yet known", wrong: ["No evidence was ever provided", "Darwin never published it", "It was proved wrong at first"], why: "Without genetics there was no explanation of how variation arose or was passed on, so a key part of the argument was missing. Mendel's work supplied it, but was not widely known until decades later." },
        { q: "What did Lamarck propose?", a: "That characteristics acquired during an organism's life are passed to its offspring", wrong: ["That variation arises by random mutation", "That species never change", "That the fittest individuals survive"], why: "A blacksmith's strong arms would, on this account, be inherited by his children. Evidence does not support it — changes to the body do not alter the alleles in the gametes." },
        { q: "What evidence would you expect if two species share a recent common ancestor?", a: "Similar DNA sequences and similar anatomical structures", wrong: ["Identical habitats", "The same number of offspring", "Similar sizes"], why: "DNA comparison is the strongest modern evidence and has revised many classifications. Similar structures with different uses — a bat's wing and a human hand — point the same way." },
        { q: "Why is antibiotic resistance a good illustration of natural selection?", a: "It happens quickly enough to be observed and follows the same steps", wrong: ["Because bacteria evolve deliberately", "Because it only occurs in laboratories", "Because it involves no mutation"], why: "Bacteria reproduce in minutes, so many generations pass in a day. Everything Darwin described — variation, selection, inheritance — happens on a timescale a class can watch." },
        { q: "Does natural selection act on individuals or populations?", a: "It acts on individuals, but the change appears in the population over generations", wrong: ["It acts on populations, which change together", "It acts on individuals, who change during their lives", "It acts only on whole species at once"], why: "An individual either reproduces or does not; it does not evolve. Evolution is the change in allele frequencies across a population, which is why it needs many generations." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.evo.evidence",
    subject: "biology",
    topic: "bio-evolution",
    subtopic: "evidence-for-evolution",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are fossils?", a: "The remains or traces of organisms from millions of years ago, preserved in rock", wrong: ["The bones of recently dead animals", "Rocks shaped like animals by chance", "Living organisms found deep underground"], why: "Fossils form by mineral replacement, by preservation in conditions where decay cannot happen, or as traces such as footprints and burrows. They are direct evidence of what once lived." },
        { q: "Why is the fossil record incomplete?", a: "Many organisms were soft-bodied and decayed, and many fossils have not been found or were destroyed", wrong: ["Fossils only form in the last thousand years", "Scientists have found every fossil that exists", "Fossils cannot form from land animals"], why: "Fossilisation needs unusual conditions, so it captures a biased and partial sample. This is why the earliest stages of life are so poorly recorded." },
        { q: "What can fossils tell us about extinct species?", a: "How they looked, and how species have changed over time", wrong: ["What colour they were", "What sounds they made", "How intelligent they were"], why: "Soft tissue is rarely preserved, so colour and behaviour are largely inference rather than direct evidence. Sequence and structural change over time are what the record shows most clearly." },
        { q: "What is extinction?", a: "When no individuals of a species remain anywhere", wrong: ["When a species becomes rare", "When a species moves to a new habitat", "When a species stops evolving"], why: "Extinction is permanent and total, and it is the normal fate of most species that have ever lived. New disease, new predators, environmental change and competition are the usual causes." },
        { q: "Which of these could cause a species to become extinct?", a: "A sudden change in the environment the species cannot adapt to", wrong: ["An increase in genetic variation", "An increase in available food", "A reduction in the number of predators"], why: "Extinction happens when the rate of environmental change outpaces the population's ability to adapt. More variation makes extinction less likely, not more." },
        { q: "How does DNA evidence support evolution?", a: "More closely related species have more similar DNA sequences", wrong: ["DNA is identical in all living things", "DNA changes only in fossils", "DNA cannot be compared between species"], why: "Molecular comparisons have confirmed many relationships worked out from anatomy and corrected others. They also give a rough clock, since differences accumulate over time." },
        { q: "What does the similarity between a bat's wing, a whale's flipper and a human arm suggest?", a: "They share a common ancestor with the same underlying bone structure", wrong: ["They evolved to look similar by coincidence", "They all live in similar habitats", "They are all the same species"], why: "The same bones, rearranged for different uses, is the signature of common descent rather than of shared function. Structures that look alike but are built differently — an insect wing and a bird wing — tell the opposite story." },
        { q: "Why did Darwin's theory need Mendel's work to be complete?", a: "Mendel explained how characteristics are inherited, which Darwin could not", wrong: ["Mendel proved fossils were real", "Mendel discovered natural selection first", "Mendel showed species do not change"], why: "Darwin had no account of how variation arose or was passed on, and the prevailing blending theory of inheritance would have erased variation within a few generations. Particulate inheritance solved that problem." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.evo.speciation",
    subject: "biology",
    topic: "bio-evolution",
    subtopic: "speciation",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is a species?", a: "A group of organisms that can breed together to produce fertile offspring", wrong: ["A group of organisms that look alike", "A group of organisms living in the same habitat", "A group of organisms with identical DNA"], why: "Fertility is the key word: a horse and a donkey produce a mule, but the mule is sterile, so they remain separate species. Appearance can mislead in both directions." },
        { q: "What is the first step in speciation?", a: "Two populations become isolated so they can no longer interbreed", wrong: ["The two populations begin to look different", "A mutation occurs in every individual", "One population becomes extinct"], why: "Isolation stops gene flow, so the two populations can accumulate different changes. Without it, interbreeding keeps the gene pool mixed and the populations converge." },
        { q: "How does geographical isolation lead to new species?", a: "Separated populations face different conditions and are selected in different directions until they can no longer interbreed", wrong: ["The populations decide to become different", "One population mutates on purpose", "The populations swap genes across the barrier"], why: "Different environments select different variants, and the differences accumulate. When they become great enough to prevent successful interbreeding, the populations have become separate species." },
        { q: "When are two isolated populations considered separate species?", a: "When they can no longer interbreed to produce fertile offspring", wrong: ["When they look noticeably different", "As soon as they are separated", "When they live in different countries"], why: "The test is reproductive, not visual. Some very similar-looking populations are separate species and some very different-looking ones are not." },
        { q: "Who first described speciation on the Galapagos Islands?", a: "Charles Darwin", wrong: ["Gregor Mendel", "Alfred Wallace", "Carl Linnaeus"], why: "The finches on different islands had beaks suited to different foods, which suggested a common ancestor diverging under different conditions. Wallace developed the same theory from work in south-east Asia." },
        { q: "What might isolate two populations of the same species?", a: "A mountain range, a river, or a stretch of ocean between them", wrong: ["A difference in their DNA", "A difference in their diet alone", "The passage of time alone"], why: "The barrier must stop interbreeding, so geography is the usual cause. Time alone does nothing if the populations continue to mix, because gene flow keeps them uniform." },
        { q: "Do the two isolated populations experience the same selection pressures?", a: "No — different environments select for different characteristics", wrong: ["Yes, always identical pressures", "Neither population experiences any selection", "Only one population experiences selection"], why: "If the pressures were identical, the two populations would change in the same way and stay compatible. Divergence needs different conditions as well as isolation." },
        { q: "Why are mules not considered a species?", a: "They are sterile, so they cannot produce offspring of their own", wrong: ["They are too rare", "They look like both parents", "They cannot survive in the wild"], why: "A species must be able to reproduce itself. The mule's sterility comes from having an odd number of chromosomes, which prevents normal meiosis." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.evo.classification",
    subject: "biology",
    topic: "bio-evolution",
    subtopic: "classification",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the order of the Linnaean classification system, largest group first?", a: "Kingdom, phylum, class, order, family, genus, species", wrong: ["Species, genus, family, order, class, phylum, kingdom, in that order as written", "Kingdom, class, phylum, family, order, genus, species", "Phylum, kingdom, order, class, family, species, genus"], why: "Each level is a subdivision of the one above, so the groups get smaller and more similar as you go down. The binomial name uses the last two levels." },
        { q: "What is the binomial naming system?", a: "Each species is named by its genus and species, as in Homo sapiens", wrong: ["Each species has two common names", "Each species is named after two scientists", "Each species is given a number and a letter"], why: "One universal name per species avoids the confusion of common names, which differ between languages and regions. The genus is capitalised and the species is not." },
        { q: "What are the three domains in the three-domain system?", a: "Archaea, Bacteria and Eukaryota", wrong: ["Animals, Plants and Fungi", "Prokaryotes, Eukaryotes and Viruses", "Kingdom, Phylum and Class"], why: "Carl Woese proposed this after RNA sequencing showed that archaea and bacteria, though both prokaryotic, differ from each other as much as either does from us. It replaced a five-kingdom system that had grouped them together." },
        { q: "Why was the classification system changed after the development of DNA analysis?", a: "Genetic evidence revealed relationships that anatomy alone had missed", wrong: ["The old system was too simple to teach", "Scientists ran out of names", "Fossils were found to be fakes"], why: "Classification aims to reflect evolutionary relationships, so better evidence about those relationships changes the groupings. Several species have been moved as a result." },
        { q: "What is an evolutionary tree?", a: "A diagram showing how species are related and when they diverged", wrong: ["A record of the age of individual organisms", "A map of where species live", "A diagram of a food chain"], why: "Branch points represent common ancestors, so the closer two species branch, the more recently they diverged. Modern trees are built from DNA evidence as well as fossils and anatomy." },
        { q: "In the name Homo sapiens, which part is the genus?", a: "Homo", wrong: ["sapiens", "Both parts together", "Neither — it is a common name"], why: "The genus comes first and is capitalised; the species follows in lower case. Two species in the same genus are closely related, which the shared first word makes visible." },
        { q: "Why are common names unsuitable for scientific classification?", a: "One organism can have many common names and one name can refer to different organisms", wrong: ["Common names are too long", "Common names change every year", "Common names are secret"], why: "A robin in Britain and a robin in North America are different birds. Binomial names are unique and universal, which is exactly the problem they were invented to solve." },
        { q: "Which group would contain the most closely related organisms?", a: "A genus", wrong: ["A kingdom", "A phylum", "A class"], why: "Groups get smaller and more similar down the hierarchy, so members of a genus share more recent ancestry than members of a class. A species is narrower still, but the question asks about groups containing several species." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.evo.breeding",
    subject: "biology",
    topic: "bio-evolution",
    subtopic: "selective-breeding",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is selective breeding?", a: "Choosing organisms with a desired characteristic and breeding them together over generations", wrong: ["Changing an organism's genes in a laboratory", "Cloning an organism", "Allowing organisms to breed at random"], why: "It is artificial selection: humans choose who reproduces, rather than the environment doing so. Genetic engineering changes genes directly, which is a different technique with different risks." },
        { q: "What is one risk of selective breeding?", a: "Reduced genetic variation, leaving the population vulnerable to disease", wrong: ["The offspring become sterile", "It causes random mutations", "It always produces clones"], why: "Repeatedly breeding closely related individuals shrinks the gene pool. Inbreeding also brings harmful recessive alleles together, which is why some pedigree breeds have characteristic health problems." },
        { q: "Which of these is an example of selective breeding?", a: "Breeding cows that produce the most milk together over many generations", wrong: ["Inserting a gene into a bacterium", "Taking a cutting from a plant", "Vaccinating a herd of cattle"], why: "Selective breeding works through reproduction and takes many generations. Taking a cutting is cloning, and inserting a gene is genetic engineering." },
        { q: "How long does selective breeding take to produce a noticeable change?", a: "Many generations", wrong: ["A single generation", "A few weeks", "It is instantaneous"], why: "Each round of selection shifts the population slightly, so change accumulates slowly. This is the main practical difference from genetic engineering, which can achieve a specific change in one step." },
        { q: "Why might a farmer selectively breed wheat plants?", a: "To produce a variety with a higher yield or better disease resistance", wrong: ["To make the plants grow without water", "To turn wheat into a different species", "To remove all their genes"], why: "Almost every crop and domestic animal is the product of thousands of years of this process. Modern wheat looks very little like its wild ancestor." },
        { q: "What is inbreeding?", a: "Breeding closely related individuals, which increases the risk of inherited disease", wrong: ["Breeding two different species together", "Breeding organisms from different countries", "Breeding without human involvement"], why: "Close relatives share alleles, so their offspring are more likely to be homozygous for harmful recessives. It is the main long-term cost of intensive selective breeding." },
        { q: "How does selective breeding differ from natural selection?", a: "Humans choose which individuals reproduce, rather than the environment", wrong: ["It does not involve inheritance", "It produces no variation at all", "It changes genes directly"], why: "The mechanism is identical — differential reproduction acting on existing variation — but the selecting agent is different. Darwin used domestic breeding as evidence precisely because of this parallel." },
        { q: "Which characteristics might be selected for in dogs?", a: "Temperament, size, or a particular working ability", wrong: ["Resistance to antibiotics", "The ability to photosynthesise", "A change in the number of chromosomes"], why: "Selection can only act on variation that already exists in the population, so it cannot introduce something entirely new. This is the fundamental limit that genetic engineering removes." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.evo.engineering",
    subject: "biology",
    topic: "bio-evolution",
    subtopic: "genetic-engineering",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is genetic engineering?", a: "Transferring a gene from one organism into another so that it produces a desired characteristic", wrong: ["Breeding organisms with desired characteristics", "Cloning an organism from a single cell", "Removing all genes from an organism"], why: "Unlike selective breeding, this can move a gene between species and works in a single generation. It requires knowing which gene does what, which is why it followed rather than preceded genome sequencing." },
        { q: "What is used to cut a gene out of a chromosome?", a: "Restriction enzymes", wrong: ["Ligase enzymes", "Protease enzymes", "Amylase enzymes"], why: "Restriction enzymes cut at specific base sequences, often leaving sticky ends that pair with a matching cut elsewhere. Ligase then joins the pieces — the two enzymes do opposite jobs." },
        { q: "What is a vector in genetic engineering?", a: "Something that carries the gene into the host cell, such as a plasmid or a virus", wrong: ["An enzyme that cuts DNA", "The organism the gene came from", "The protein the gene codes for"], why: "The word means the same thing as in disease transmission — a carrier. Plasmids are convenient because bacteria take them up readily and copy them." },
        { q: "How is human insulin produced commercially?", a: "The human insulin gene is inserted into bacteria, which are grown and produce insulin", wrong: ["It is extracted from human blood donors", "It is made entirely by chemical synthesis", "It is taken from pigs only"], why: "Bacteria reproduce quickly and the insulin they make is identical to the human protein, which avoids the reactions that animal insulin sometimes caused. This was one of the first commercial applications of genetic engineering." },
        { q: "What is a genetically modified crop?", a: "A crop given a gene from another organism, for example for pest resistance", wrong: ["A crop bred over many generations", "A crop grown without soil", "A cloned crop plant"], why: "GM crops can be given herbicide tolerance, pest resistance or improved nutritional value, such as golden rice's vitamin A. The concerns are ecological and economic rather than about the technique itself." },
        { q: "What is one concern raised about GM crops?", a: "Effects on wild flowers and insects, and uncertainty about long-term health effects", wrong: ["They cannot reproduce", "They produce no yield", "They cannot be eaten at all"], why: "Reduced insect populations around GM fields is a documented concern, and gene transfer to wild relatives is another. Long-term health effects have not been demonstrated but are still debated." },
        { q: "At what stage is a gene usually transferred in a GM plant or animal?", a: "At an early stage of development, so all the cells receive it", wrong: ["In adulthood, into a single organ", "Just before the organism reproduces", "Into the gametes only, after birth"], why: "Transferring the gene early means every cell descended from that one carries it. Doing it later would produce a patchwork organism in which only some tissues had the gene." },
        { q: "What is gene therapy?", a: "Treating an inherited disorder by inserting a working copy of the faulty gene", wrong: ["Breeding out a disorder over generations", "Removing an organ affected by a disorder", "Vaccinating against a genetic disorder"], why: "It aims at the cause rather than the symptoms, and trials have had some success. Getting the gene into enough of the right cells, and keeping it working, are the practical obstacles." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
