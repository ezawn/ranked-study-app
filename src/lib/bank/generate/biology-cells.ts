/**
 * Biology: cells, and transport in and out of them.
 *
 * Biology's numeric content is small but it is exactly where students lose
 * marks, so it gets the same treatment as physics: magnification, surface area
 * to volume ratio and percentage change in mass are all generated from the
 * answer outwards, and the unit conversion between millimetres and micrometres
 * is deliberately part of the work rather than smoothed away.
 *
 * The recall content is not a list of facts to memorise but a set of questions
 * with a named misconception behind each wrong option — "osmosis needs energy",
 * "plant cells have no mitochondria", "a ratio gets bigger as the cell grows".
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, exact, num, slip, tidy, wrongOptions } from "./physics-kit";

/* ==========================================================================
   Data
   ========================================================================== */

const ORGANELLES = [
  { name: "nucleus", job: "Contains the DNA and controls the cell's activities", where: "animal and plant" },
  { name: "mitochondrion", job: "The site of aerobic respiration, releasing energy", where: "animal and plant" },
  { name: "ribosome", job: "The site of protein synthesis", where: "animal and plant" },
  { name: "chloroplast", job: "Contains chlorophyll and is the site of photosynthesis", where: "plant only" },
  { name: "cell wall", job: "A rigid layer of cellulose that supports the cell", where: "plant only" },
  { name: "permanent vacuole", job: "Holds cell sap and helps keep the cell turgid", where: "plant only" },
  { name: "cell membrane", job: "Controls what enters and leaves the cell", where: "animal and plant" },
  { name: "cytoplasm", job: "The jelly-like medium where most chemical reactions happen", where: "animal and plant" },
] as const;

const SPECIALISED_CELLS = [
  { cell: "sperm cell", feature: "a tail and many mitochondria", why: "to swim to the egg and to supply the energy for swimming" },
  { cell: "red blood cell", feature: "no nucleus and a biconcave shape", why: "to carry more haemoglobin and to increase surface area for oxygen uptake" },
  { cell: "root hair cell", feature: "a long thin extension", why: "to increase the surface area for absorbing water and mineral ions" },
  { cell: "nerve cell", feature: "a long axon and branched endings", why: "to carry impulses over long distances and connect to many other cells" },
  { cell: "muscle cell", feature: "many mitochondria and protein fibres that shorten", why: "to contract repeatedly and to supply the energy contraction needs" },
  { cell: "xylem vessel", feature: "no end walls and a lignified wall", why: "to form a continuous hollow tube that is strong enough not to collapse" },
  { cell: "phloem sieve tube", feature: "sieve plates and companion cells", why: "to let dissolved sugars flow through while a neighbouring cell supplies the energy" },
] as const;

/* Magnification cases: a magnification, an actual size in micrometres, and the
   image size in millimetres that follows. Enumerated and filtered so every
   number in the question is writable without a calculator. */
const MAGNIFICATIONS: { mag: number; actualUm: number; imageMm: number }[] = (() => {
  const out: { mag: number; actualUm: number; imageMm: number }[] = [];
  for (const mag of [100, 200, 400, 500, 1000, 1500, 2000, 4000]) {
    for (const actualUm of [2, 5, 10, 20, 25, 50, 100, 200]) {
      const imageMm = (mag * actualUm) / 1000;
      if (!tidy(imageMm) || imageMm < 1 || imageMm > 200) continue;
      out.push({ mag, actualUm, imageMm });
    }
  }
  return out;
})();

/* Osmosis cases: a starting mass and a percentage change whose resulting mass
   lands on two decimal places. */
const OSMOSIS_CASES: { initial: number; percent: number; final: number }[] = (() => {
  const out: { initial: number; percent: number; final: number }[] = [];
  for (const initial of [2, 2.5, 4, 5, 8, 10, 20, 25, 40, 50]) {
    for (const percent of [-20, -15, -10, -5, 5, 10, 15, 20, 25]) {
      const final = initial * (1 + percent / 100);
      if (!tidy(final) || !tidy(final - initial)) continue;
      out.push({ initial, percent, final });
    }
  }
  return out;
})();

/* ==========================================================================
   The generators
   ========================================================================== */

export const biologyCells: Generator[] = [
  generator({
    key: "bio.cell.prok-euk",
    subject: "biology",
    topic: "bio-cells",
    subtopic: "prokaryotes-eukaryotes",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is the key structural difference between a prokaryotic and a eukaryotic cell?", a: "A prokaryotic cell has no nucleus", wrong: ["A prokaryotic cell has no DNA", "A prokaryotic cell has no cell membrane", "A prokaryotic cell has no cytoplasm"], why: "Prokaryotes do have DNA — it sits free in the cytoplasm as a single loop rather than enclosed in a nucleus. Membrane-bound organelles are absent for the same reason: prokaryotes have no internal membranes." },
        { q: "Where is the genetic material found in a bacterial cell?", a: "As a single loop of DNA free in the cytoplasm", wrong: ["Inside a nucleus", "Inside the mitochondria", "In the cell wall"], why: "Bacteria have no nucleus, so the chromosome floats in the cytoplasm, often alongside small extra rings called plasmids. Those plasmids are what make bacteria so useful in genetic engineering." },
        { q: "What is a plasmid?", a: "A small ring of DNA separate from the main bacterial chromosome", wrong: ["The bacterial nucleus", "A bacterial mitochondrion", "A protective outer coat"], why: "Plasmids carry extra genes, often for antibiotic resistance, and can be passed between bacteria. Because they can be cut open and rejoined, they are the standard vector for inserting a human gene into a bacterium." },
        { q: "Roughly how does the size of a typical bacterial cell compare with an animal cell?", a: "It is around a hundred times smaller in volume", wrong: ["It is about the same size", "It is around ten times larger", "It is around a thousand times larger"], why: "Bacteria are typically 1–5 μm across against 10–100 μm for an animal cell, so the linear difference of roughly ten becomes a much larger difference in volume. This is why light microscopes show bacteria as barely-resolved dots." },
        { q: "Which of these do prokaryotic cells have?", a: "Ribosomes", wrong: ["Mitochondria", "A nucleus", "Chloroplasts"], why: "Ribosomes are not membrane-bound, so prokaryotes have them and make proteins with them — they are simply smaller than eukaryotic ribosomes. Every organelle surrounded by a membrane is absent." },
        { q: "Where does aerobic respiration take place in a bacterial cell?", a: "On the cell membrane", wrong: ["In the mitochondria", "In the nucleus", "In the chloroplasts"], why: "With no mitochondria, the respiratory enzymes are anchored in the cell membrane instead. The chemistry is the same; only the location differs." },
        { q: "Which kingdom contains only prokaryotic organisms?", a: "Bacteria", wrong: ["Fungi", "Protists", "Plants"], why: "Fungi, protists, plants and animals are all eukaryotic — their cells have nuclei. Only bacteria and archaea are prokaryotic." },
        { q: "What is the bacterial cell wall made of?", a: "Peptidoglycan", wrong: ["Cellulose", "Chitin", "Lipid"], why: "Plant walls are cellulose and fungal walls are chitin; bacteria use peptidoglycan. The difference matters medically, because penicillin attacks peptidoglycan synthesis and therefore harms bacteria without harming human cells." },
        { q: "Are all prokaryotes harmful to humans?", a: "No — most are harmless and many are essential", wrong: ["Yes, all bacteria cause disease", "Yes, unless they are killed by antibiotics", "No, none of them can cause disease"], why: "Gut bacteria help digest food and make vitamins, and soil bacteria fix nitrogen. Only a small minority are pathogens, though those few are responsible for a great deal of disease." },
        { q: "Why are prokaryotic cells thought to have appeared before eukaryotic cells?", a: "They are simpler and the oldest fossils resemble them", wrong: ["They are larger", "They reproduce sexually", "They contain more DNA"], why: "The earliest microfossils are prokaryote-like, and the endosymbiotic theory explains eukaryotic mitochondria and chloroplasts as prokaryotes that were engulfed and kept. That theory is supported by those organelles having their own loop of DNA and their own ribosomes." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.cell.organelles",
    subject: "biology",
    topic: "bio-cells",
    subtopic: "cell-structures",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 20,
    build: (rng) => {
      const o = rng.pick(ORGANELLES);
      const form = rng.int(0, 2);

      if (form === 0) {
        const answer = o.job;
        return {
          prompt: `What is the function of the ${o.name}?`,
          answer,
          distractors: wrongOptions(answer, ORGANELLES.filter((x) => x.job !== o.job).map((x) => x.job)),
          explanation:
            `${answer}. ` +
            `${o.where === "plant only" ? "This structure is found in plant cells but not animal cells." : "This structure is found in both animal and plant cells."}`,
        };
      }

      if (form === 1) {
        const answer = o.name;
        return {
          prompt: `Which structure has this function: ${o.job.toLowerCase()}?`,
          answer,
          distractors: wrongOptions(answer, ORGANELLES.filter((x) => x.name !== o.name).map((x) => x.name)),
          explanation: `That is the ${answer}. ${o.job}.`,
        };
      }

      const answer = o.where === "plant only" ? "Plant cells only" : "Both animal and plant cells";
      return {
        prompt: `In which cells is the ${o.name} found?`,
        answer,
        distractors: wrongOptions(answer, [
          o.where === "plant only" ? "Both animal and plant cells" : "Plant cells only",
          "Animal cells only",
          "Neither animal nor plant cells",
        ]),
        explanation:
          `The ${o.name} is found in ${answer.toLowerCase()}. ` +
          `The three structures plant cells have and animal cells do not are the cell wall, the chloroplasts and the permanent vacuole — everything else is shared. ` +
          `Plant cells do have mitochondria: they respire as well as photosynthesise.`,
      };
    },
  }),

  generator({
    key: "bio.cell.microscopy",
    subject: "biology",
    topic: "bio-cells",
    subtopic: "microscopy",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 3);

      if (form === 3) {
        const cases = [
          { q: "What advantage does an electron microscope have over a light microscope?", a: "Much higher magnification and resolution, so smaller structures can be seen", wrong: ["It can be used on living specimens", "It is cheaper and more portable", "It shows specimens in natural colour"], why: "Electrons have a far shorter wavelength than light, so an electron microscope resolves structures a light microscope cannot — ribosomes and membranes, for instance. The cost is that specimens must be dead and in a vacuum, and the images are not naturally coloured." },
          { q: "What is meant by the resolution of a microscope?", a: "The smallest distance between two points that can still be seen as separate", wrong: ["How many times larger the image appears", "How bright the image is", "The thickness of the specimen"], why: "Magnification without resolution just gives a bigger blur. This is why a light microscope cannot usefully magnify beyond about ×1500 — the wavelength of light sets a floor on what can be resolved." },
          { q: "Why is a stain such as iodine used when preparing a slide?", a: "It makes structures that are otherwise transparent visible", wrong: ["It magnifies the specimen", "It kills the specimen instantly", "It increases the resolution of the microscope"], why: "Most cell structures are colourless, so without a stain there is nothing to see. Iodine shows starch and nuclei; methylene blue shows nuclei in cheek cells." },
          { q: "Why is a coverslip lowered at an angle onto a slide?", a: "To avoid trapping air bubbles", wrong: ["To magnify the specimen", "To stain the specimen", "To flatten the objective lens"], why: "Air bubbles look like dark-edged circles and are easily mistaken for cells. Lowering the coverslip from one edge pushes the air out ahead of it." },
        ];
        const c = rng.pick(cases);
        return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
      }

      const m = rng.pick(MAGNIFICATIONS);
      const imageUm = exact(m.imageMm * 1000, 2, "image size in micrometres");

      if (form === 0) {
        const answer = `×${num(m.mag)}`;
        return {
          prompt:
            `A cell with an actual width of ${m.actualUm} μm appears ${num(m.imageMm)} mm wide in a photograph. ` +
            `What is the magnification?`,
          answer,
          distractors: wrongOptions(answer, [
            `×${num(m.imageMm / m.actualUm)}`, // did not convert mm to μm
            `×${num(m.actualUm / m.imageMm)}`, // inverted the fraction
            `×${num(m.mag / 10)}`,
            `×${num(m.mag * 10)}`,
          ]),
          explanation:
            `Magnification = image size ÷ actual size, and both must be in the same unit. ` +
            `${num(m.imageMm)} mm = ${num(imageUm)} μm, so magnification = ${num(imageUm)} ÷ ${m.actualUm} = ${answer}. ` +
            `Converting first is the whole difficulty: forgetting the ×1000 gives an answer a thousand times too small.`,
          check: () => (agrees(imageUm / m.actualUm, m.mag) ? null : "the magnification does not reproduce"),
        };
      }

      if (form === 1) {
        const answer = ans(m.actualUm, "μm");
        return {
          prompt:
            `A cell appears ${num(m.imageMm)} mm wide in an image taken at a magnification of ×${num(m.mag)}. ` +
            `What is its actual width in micrometres?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(m.imageMm / m.mag, "μm"), // forgot to convert to μm
            slip(m.imageMm * m.mag, "μm"), // multiplied instead of dividing
            slip(imageUm * m.mag, "μm"),
            slip(m.actualUm * 10, "μm"),
          ]),
          explanation:
            `Actual size = image size ÷ magnification. Convert first: ${num(m.imageMm)} mm = ${num(imageUm)} μm, ` +
            `so actual size = ${num(imageUm)} ÷ ${num(m.mag)} = ${answer}. ` +
            `A real cell is a few micrometres to a hundred or so — an answer in millimetres is a signal that a conversion was missed.`,
          check: () => (agrees(m.actualUm * m.mag, imageUm) ? null : "the actual size does not scale back to the image"),
        };
      }

      const answer = ans(m.imageMm, "mm");
      return {
        prompt:
          `A structure ${m.actualUm} μm across is drawn at a magnification of ×${num(m.mag)}. How wide is the drawing in millimetres?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(m.actualUm * m.mag, "mm"), // left the answer in μm
          slip(m.actualUm / m.mag, "mm"), // divided instead of multiplying
          slip(m.imageMm * 10, "mm"),
          slip(m.imageMm / 10, "mm"),
        ]),
        explanation:
          `Image size = actual size × magnification = ${m.actualUm} × ${num(m.mag)} = ${num(imageUm)} μm. ` +
          `Dividing by 1000 converts that to ${answer}. ` +
          `The two conversions pull in opposite directions, so it is worth writing the unit at every step.`,
        check: () => (agrees(m.imageMm * 1000, m.actualUm * m.mag) ? null : "the drawing size does not follow from the magnification"),
      };
    },
  }),

  generator({
    key: "bio.cell.specialisation",
    subject: "biology",
    topic: "bio-cells",
    subtopic: "cell-specialisation",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const c = rng.pick(SPECIALISED_CELLS);
      const asked = rng.bool();

      if (asked) {
        const answer = c.feature;
        return {
          prompt: `Which adaptation does a ${c.cell} have?`,
          answer,
          distractors: wrongOptions(answer, SPECIALISED_CELLS.filter((x) => x.feature !== c.feature).map((x) => x.feature)),
          explanation: `A ${c.cell} has ${answer} — ${c.why}. Every specialisation is a structure that serves one job, which is why the shape tells you the function.`,
        };
      }

      const answer = c.cell;
      return {
        prompt: `Which cell has ${c.feature}?`,
        answer,
        distractors: wrongOptions(answer, SPECIALISED_CELLS.filter((x) => x.cell !== c.cell).map((x) => x.cell)),
        explanation: `That describes a ${answer} — the adaptation is there ${c.why}.`,
      };
    },
  }),

  generator({
    key: "bio.cell.stem-cells",
    subject: "biology",
    topic: "bio-cells",
    subtopic: "stem-cells",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is a stem cell?", a: "An undifferentiated cell that can divide to produce cells of different types", wrong: ["A cell that has lost its nucleus", "A cell that cannot divide", "A cell found only in plants"], why: "The defining property is potency — the ability to become other cell types — combined with the ability to keep dividing. Once a cell differentiates, it usually loses both." },
        { q: "Where are stem cells found in an adult human?", a: "In tissues such as bone marrow", wrong: ["Only in the brain", "Nowhere — adults have none", "In every cell of the body"], why: "Adult stem cells persist in tissues that renew themselves, and bone marrow is the standard example because it makes blood cells throughout life. They are more limited than embryonic stem cells in what they can become." },
        { q: "How do embryonic stem cells differ from adult stem cells?", a: "They can differentiate into any cell type, whereas adult stem cells are more limited", wrong: ["They cannot divide", "They are larger", "They are found in bone marrow"], why: "Embryonic stem cells are pluripotent, so in principle any tissue can be grown from them. That potential is the medical attraction, and the ethical objection to destroying embryos is what limits their use." },
        { q: "Where are stem cells found in plants?", a: "In the meristems", wrong: ["In the xylem", "In the leaves only", "Plants have no stem cells"], why: "Meristem tissue at root and shoot tips stays undifferentiated throughout the plant's life, which is why cuttings root and why plants can be cloned so easily. Animals have nothing equivalent." },
        { q: "What is therapeutic cloning?", a: "Producing an embryo with the same genes as the patient, to grow tissue that will not be rejected", wrong: ["Growing a whole cloned human", "Transplanting an organ from a donor", "Using antibiotics to treat infection"], why: "Because the cells carry the patient's own genes, the immune system does not attack them. The technique is medically promising and ethically contested for the same reason: it creates an embryo in order to use it." },
        { q: "What is one risk of using stem cells in medical treatment?", a: "Transferred cells may become infected with a virus or divide uncontrollably", wrong: ["Stem cells cannot survive outside the body", "Stem cells always cause immediate rejection", "Stem cells cannot divide"], why: "Cells cultured in a laboratory can pick up viruses, and cells that divide indefinitely are, by definition, doing what a tumour does. Both risks are why trials proceed slowly." },
        { q: "Why can stem cells from a patient's own bone marrow avoid rejection?", a: "They carry the patient's own antigens, so the immune system does not attack them", wrong: ["They have no cell membrane", "They are too small to be detected", "They suppress the immune system"], why: "Rejection happens when the immune system recognises foreign antigens on transplanted cells. Using the patient's own cells removes the problem entirely, which is a considerable advantage over donor transplants." },
        { q: "What does it mean for a cell to differentiate?", a: "To develop the structures it needs for a specialised function", wrong: ["To divide into two identical cells", "To lose its DNA", "To die"], why: "Differentiation switches particular genes on so the cell builds the proteins its role needs — many mitochondria in a muscle cell, haemoglobin in a red blood cell. Most animal cells differentiate early and permanently; plant cells retain the ability throughout life." },
        { q: "Why is the use of embryonic stem cells controversial?", a: "Obtaining them involves destroying an embryo", wrong: ["They do not work in treatments", "They are prohibitively expensive", "They cannot differentiate"], why: "People disagree about the moral status of an early embryo, and the disagreement is not one that more evidence resolves. Research into reprogramming adult cells is partly an attempt to sidestep it." },
        { q: "How could stem cells help someone with type 1 diabetes?", a: "They could be used to grow new insulin-producing cells for the pancreas", wrong: ["They could replace the patient's blood", "They could remove glucose from the blood directly", "They could be injected to lower blood pressure"], why: "Type 1 diabetes destroys the insulin-secreting cells in the pancreas, so replacing them addresses the cause rather than the symptoms. Injected insulin manages the condition; new cells could in principle end it." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.cell.cycle",
    subject: "biology",
    topic: "bio-cells",
    subtopic: "cell-cycle",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What happens during interphase of the cell cycle?", a: "The cell grows, replicates its DNA and makes more organelles", wrong: ["The chromosomes line up on the equator", "The cell divides into two", "The nuclear membrane breaks down"], why: "Interphase is by far the longest stage and it is where the preparation happens — a cell about to divide must have two copies of everything. The visible drama of mitosis is comparatively brief." },
        { q: "In which stage of mitosis do the chromosomes line up along the centre of the cell?", a: "Metaphase", wrong: ["Prophase", "Anaphase", "Telophase"], why: "Metaphase is the alignment stage; anaphase is when the copies are pulled apart. The order — prophase, metaphase, anaphase, telophase — is worth remembering as condense, line up, pull apart, re-form." },
        { q: "What is the result of one round of mitosis?", a: "Two genetically identical daughter cells", wrong: ["Four genetically different daughter cells", "Two cells with half the chromosome number", "One cell with twice the chromosome number"], why: "Mitosis copies; meiosis shuffles and halves. The identical output is exactly what growth, repair and asexual reproduction need." },
        { q: "Why must DNA be replicated before mitosis?", a: "So each daughter cell receives a complete copy of every chromosome", wrong: ["To make the cell larger", "To increase genetic variation", "To produce energy for division"], why: "Without replication the chromosome number would halve at every division. Replication is what makes the two daughter cells genuinely identical to the parent." },
        { q: "What is cytokinesis?", a: "The division of the cytoplasm to form two separate cells", wrong: ["The replication of DNA", "The separation of chromatids", "The condensing of chromosomes"], why: "Mitosis divides the nucleus; cytokinesis divides the rest. In plant cells a new cell wall forms between the two, which is why plant cells end up as neat rectangles." },
        { q: "Why do cells divide by mitosis in a multicellular organism?", a: "For growth, repair and replacement of worn-out cells", wrong: ["To produce gametes", "To create genetic variation", "To halve the chromosome number"], why: "Gametes come from meiosis, which halves the chromosome number and shuffles the genes. Everything else — growing, healing a cut, replacing skin — needs exact copies." },
        { q: "What happens to the chromosome number during mitosis?", a: "It stays the same in each daughter cell", wrong: ["It halves", "It doubles", "It varies between the two cells"], why: "Each daughter gets one copy of each replicated chromosome, so a diploid cell gives two diploid cells. Halving is meiosis, and it happens only in gamete formation." },
        { q: "Uncontrolled cell division can lead to what?", a: "The formation of a tumour", wrong: ["The formation of a gamete", "A reduction in chromosome number", "Increased genetic variation"], why: "The cell cycle has checkpoints that stop division when something is wrong. Cancer is what happens when mutations disable those controls and division continues unchecked." },
        { q: "Which part of the cell cycle takes the longest?", a: "Interphase", wrong: ["Metaphase", "Anaphase", "Cytokinesis"], why: "A cell spends most of its life in interphase growing and copying its DNA — often 90% or more of the cycle. This is why most cells in a prepared slide of a root tip look as though nothing is happening." },
        { q: "In a root tip squash, most cells appear to be in interphase. What does this suggest?", a: "Interphase occupies most of the cell cycle's duration", wrong: ["The root has stopped growing", "Mitosis does not occur in roots", "The stain has failed"], why: "The proportion of cells seen in a stage is roughly the proportion of time spent in it, because the slide is a snapshot of many cells at random points. This is the basis of the mitotic index calculation." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Transport in and out of cells
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.trans.diffusion",
    subject: "biology",
    topic: "bio-transport",
    subtopic: "diffusion",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is diffusion?", a: "The net movement of particles from high to low concentration, down a concentration gradient", wrong: ["The movement of water through a partially permeable membrane", "The movement of particles against a concentration gradient using energy", "The movement of particles from low to high concentration"], why: "Diffusion is passive and needs no energy from the cell — particles move randomly, and the net effect of that randomness is a flow down the gradient. Water through a membrane is osmosis; moving up a gradient is active transport." },
        { q: "Which of these increases the rate of diffusion?", a: "A steeper concentration gradient", wrong: ["A thicker membrane", "A smaller surface area", "A lower temperature"], why: "The three factors are gradient, surface area and distance, plus temperature. A steeper gradient means more particles arriving from one side than the other, so the net movement is faster." },
        { q: "Why does raising the temperature increase the rate of diffusion?", a: "Particles gain kinetic energy and move faster", wrong: ["The concentration gradient becomes steeper", "The membrane becomes thinner", "The particles become smaller"], why: "Diffusion is driven by random particle motion, so anything that speeds that motion speeds diffusion. The gradient itself is unchanged by temperature." },
        { q: "Does diffusion require energy from the cell?", a: "No — it is a passive process", wrong: ["Yes, it requires ATP", "Yes, but only in animal cells", "Only when the gradient is steep"], why: "The energy comes from the particles' own thermal motion, not from the cell's metabolism. This is the sharpest distinction between diffusion and active transport." },
        { q: "Which substances move into cells by diffusion?", a: "Oxygen and carbon dioxide", wrong: ["Only water", "Only glucose against a gradient", "Only large proteins"], why: "Small, uncharged molecules pass through the membrane freely. Large or charged particles need channels or carriers, and moving anything up its gradient needs energy." },
        { q: "How does a thinner exchange surface affect diffusion?", a: "It increases the rate, because the diffusion distance is shorter", wrong: ["It decreases the rate", "It has no effect", "It reverses the direction of diffusion"], why: "Rate is inversely related to distance, which is why alveoli and capillaries are both a single cell thick. Doubling the thickness roughly halves the rate." },
        { q: "What happens to net diffusion when the concentrations on both sides become equal?", a: "Net movement stops, though particles keep moving randomly", wrong: ["All particle movement stops", "Diffusion reverses", "Diffusion speeds up"], why: "Equilibrium is dynamic: particles cross in both directions at equal rates, so there is no NET change. Saying all movement stops is the classic misconception here." },
        { q: "Why is a large surface area important for diffusion?", a: "More particles can cross at once, so the rate is higher", wrong: ["It makes the concentration gradient steeper", "It shortens the diffusion distance", "It reduces the need for a membrane"], why: "Rate is proportional to area, which is why root hairs, villi and alveoli all multiply the available surface. Area, gradient and distance are three separate factors, and only area is changed here." },
        { q: "In the lungs, in which direction does oxygen diffuse?", a: "From the alveolus into the blood", wrong: ["From the blood into the alveolus", "From the blood into the trachea", "In both directions equally"], why: "Blood arriving at the lungs is low in oxygen and the alveolar air is high in it, so oxygen moves down its gradient into the blood. Carbon dioxide moves the other way for the same reason." },
        { q: "Why is the ventilation of the lungs important for gas exchange?", a: "It maintains the concentration gradients by refreshing the air", wrong: ["It makes the alveoli thinner", "It increases the surface area of the alveoli", "It warms the blood"], why: "Without breathing, alveolar oxygen would fall and carbon dioxide would rise until the gradients disappeared and exchange stopped. Ventilation keeps the gradients steep, which is one of the three diffusion factors." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.trans.osmosis",
    subject: "biology",
    topic: "bio-transport",
    subtopic: "osmosis",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form <= 1) {
        /* Percentage change in mass, built from the percentage so the arithmetic
           is exact both ways. The pairs are enumerated because a 5% change on a
           2.5 g piece is 2.625 g, which no student would be asked to write. */
        const { initial, percent, final } = rng.pick(OSMOSIS_CASES);
        const change = exact(final - initial, 2, "mass change");

        if (form === 0) {
          const answer = ans(percent, "%");
          return {
            prompt:
              `A piece of potato with a mass of ${num(initial)} g is left in a sugar solution. Its mass afterwards is ${num(final)} g. ` +
              `What is the percentage change in mass?`,
            answer,
            distractors: pickDistractors(answer, [
              slip(-percent, "%"), // right size, wrong direction
              slip((change / final) * 100, "%"), // divided by the final mass
              slip(change, "%"), // gave the change in grams as a percentage
              slip((final / initial) * 100, "%"), // gave the final as a percentage of the initial
            ]),
            explanation:
              `Percentage change = (change in mass ÷ INITIAL mass) × 100 = ${num(change)} ÷ ${num(initial)} × 100 = ${answer}. ` +
              `${percent > 0 ? "The mass rose, so water moved INTO the cells: the solution was more dilute than the cell contents." : "The mass fell, so water moved OUT of the cells: the solution was more concentrated than the cell contents."} ` +
              `Percentage change is used rather than raw change so that pieces of different starting sizes can be compared.`,
            check: () => (agrees(initial + (percent / 100) * initial, final) ? null : "the percentage does not reproduce the final mass"),
          };
        }

        const answer = ans(final, "g");
        return {
          prompt:
            `A piece of potato with a mass of ${num(initial)} g changes in mass by ${num(percent)}% after being left in a sugar solution. ` +
            `What is its final mass?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(initial - (percent / 100) * initial, "g"), // applied the change in the wrong direction
            slip(initial + percent, "g"), // treated the percentage as grams
            slip((initial * percent) / 100, "g"), // gave only the change
            slip(initial, "g"),
          ]),
          explanation:
            `A change of ${num(percent)}% of ${num(initial)} g is ${num(change)} g, so the final mass is ${num(initial)} + (${num(change)}) = ${answer}. ` +
            `A negative percentage means water has left the cells by osmosis, so the mass falls.`,
          check: () => (agrees(((final - initial) / initial) * 100, percent) ? null : "the final mass does not give the stated percentage"),
        };
      }

      const cases = [
        { q: "What is osmosis?", a: "The movement of water from a dilute to a concentrated solution through a partially permeable membrane", wrong: ["The movement of any particle down a concentration gradient", "The movement of water using energy from respiration", "The movement of solute from high to low concentration"], why: "Osmosis is specifically about WATER and specifically requires a partially permeable membrane, which lets water through but holds the solute back. The general case, for any particle and with no membrane needed, is diffusion." },
        { q: "What happens to an animal cell placed in pure water?", a: "It takes in water and may burst", wrong: ["It shrinks", "Nothing changes", "It becomes turgid and stable"], why: "Water moves in down the gradient, and an animal cell has no wall to resist the pressure, so it swells and lyses. A plant cell in the same water becomes turgid instead, because the cell wall pushes back." },
        { q: "What happens to a plant cell placed in a concentrated sugar solution?", a: "It loses water and becomes plasmolysed", wrong: ["It bursts", "It becomes turgid", "Nothing changes"], why: "Water leaves by osmosis, the vacuole shrinks and the membrane pulls away from the cell wall. The wall itself stays put, which is why a plant cell plasmolyses rather than bursting or collapsing entirely." },
        { q: "Why does a plant wilt when the soil is dry?", a: "Cells lose water and are no longer turgid, so they cannot support the plant", wrong: ["The chloroplasts stop working", "The cell walls dissolve", "The plant stops respiring"], why: "Turgor pressure — water pushing the membrane against the cell wall — is what keeps non-woody plants upright. Lose the water and the support goes with it, though the cells recover if water returns before they die." },
        { q: "In a potato-in-sugar-solution experiment, at what concentration does the mass not change?", a: "When the solution has the same concentration as the cell contents", wrong: ["In pure water", "In the most concentrated solution", "At 0.5 mol/dm³ always"], why: "No net movement means the gradient is zero, so the concentration inside and outside must be equal. Finding this point from a graph is how the experiment measures the internal concentration of the potato." },
        { q: "Why must potato pieces be dried before being weighed in an osmosis experiment?", a: "Surface water would add to the mass and distort the result", wrong: ["Wet potato cannot be weighed", "Drying stops the osmosis", "Water on the surface causes the potato to float"], why: "The measurement is of water that has moved into or out of the cells, so water clinging to the outside is a systematic error. Blotting each piece the same way keeps the comparison fair." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.trans.active",
    subject: "biology",
    topic: "bio-transport",
    subtopic: "active-transport",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is active transport?", a: "The movement of substances against a concentration gradient, using energy from respiration", wrong: ["The movement of substances down a concentration gradient", "The movement of water through a membrane", "The random movement of particles in a liquid"], why: "The defining features are the direction — up the gradient — and the energy cost. Moving down a gradient happens on its own and needs no energy at all." },
        { q: "Where does the energy for active transport come from?", a: "Respiration, in the form of ATP", wrong: ["The concentration gradient", "Sunlight, directly", "The kinetic energy of the particles"], why: "This is why cells that do a lot of active transport, such as root hair cells and the cells lining the small intestine, are packed with mitochondria. Cut off respiration and active transport stops." },
        { q: "Why do root hair cells use active transport?", a: "Mineral ions are more concentrated inside the cell than in the soil water", wrong: ["Water is more concentrated in the soil", "The soil is too cold for diffusion", "Diffusion cannot move ions at all"], why: "Diffusion would move ions the wrong way, out of the root, because the gradient points outwards. Active transport is the only way to keep taking them up, and it costs the plant energy." },
        { q: "Why is glucose absorbed by active transport in the small intestine?", a: "To take up glucose even when its concentration in the gut is lower than in the blood", wrong: ["Glucose is too large to diffuse", "Glucose is not soluble in water", "Diffusion would damage the villi"], why: "Diffusion handles the early stages when gut glucose is high, but it stops once the concentrations equalise. Active transport allows the last of the glucose to be absorbed rather than passing out of the body." },
        { q: "Which structure carries out active transport in a cell?", a: "Carrier proteins in the cell membrane", wrong: ["The cell wall", "The nucleus", "The ribosomes"], why: "Each carrier protein binds a specific substance, changes shape using energy from ATP and releases it on the other side. Their specificity is why a cell can select which ions to take up." },
        { q: "What happens to active transport if a cell's mitochondria are poisoned?", a: "It stops, because no ATP is available", wrong: ["It speeds up", "It continues unchanged", "It reverses direction"], why: "This is the standard experimental demonstration that a process is active rather than passive: block respiration and see whether transport continues. Diffusion and osmosis carry on regardless." },
        { q: "Which process moves substances both with and against a concentration gradient?", a: "None — diffusion moves down and active transport moves up", wrong: ["Osmosis", "Diffusion", "Active transport"], why: "The direction is what distinguishes the processes, so no single one does both. A cell may use diffusion and active transport for the same substance at different times, as the gut does with glucose." },
        { q: "Why do cells lining the small intestine contain many mitochondria?", a: "To supply the ATP needed for active transport of nutrients", wrong: ["To store the absorbed glucose", "To increase the surface area", "To digest the food chemically"], why: "The number of mitochondria in a cell is a reliable clue to how much energy the cell spends. Muscle cells, root hair cells and gut lining cells are all packed with them for the same underlying reason." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.trans.sa-vol",
    subject: "biology",
    topic: "bio-transport",
    subtopic: "surface-area-volume",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 20,
    build: (rng) => {
      const form = rng.int(0, 2);
      const side = rng.pick([1, 2, 3, 4, 5, 6, 10, 12]);
      const area = 6 * side * side;
      const volume = side * side * side;
      const ratio = exact(area / volume, 2, "surface area to volume ratio");

      if (form === 0) {
        const answer = ans(ratio);
        return {
          prompt:
            `A cube-shaped organism has sides of ${side} mm. What is its surface area to volume ratio?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(volume / area, ""), // inverted the ratio
            slip(area, ""), // gave the surface area
            slip(volume, ""), // gave the volume
            slip(side * 6, ""),
          ]),
          explanation:
            `Surface area = 6 × ${side}² = ${area} mm², volume = ${side}³ = ${volume} mm³, so the ratio is ${area} ÷ ${volume} = ${answer}. ` +
            `For a cube the ratio simplifies to 6 ÷ side, so it falls as the organism grows — which is the whole reason large organisms need exchange surfaces.`,
          check: () => (agrees(6 / side, ratio) ? null : "the ratio does not simplify to 6 over the side"),
        };
      }

      if (form === 1) {
        const answer = ans(area, "mm²");
        return {
          prompt: `A cube has sides of ${side} mm. What is its total surface area?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(side * side, "mm²"), // gave the area of one face
            slip(volume, "mm²"), // gave the volume
            slip(side * 6, "mm²"), // multiplied the side by six
            slip(area / 2, "mm²"),
          ]),
          explanation:
            `A cube has six identical faces, each ${side} × ${side} = ${side * side} mm², so the total is 6 × ${side * side} = ${answer}. ` +
            `Forgetting to multiply by six is the standard slip, and it makes every subsequent ratio six times too small.`,
          check: () => (agrees(area / 6, side * side) ? null : "the area is not six faces"),
        };
      }

      const cases = [
        { q: "What happens to the surface area to volume ratio as an organism gets larger?", a: "It decreases", wrong: ["It increases", "It stays the same", "It increases then decreases"], why: "Volume grows with the cube of the length while surface area grows only with the square, so the ratio falls as size rises. This single fact explains why large organisms need lungs, gills, guts and circulatory systems and single-celled ones do not." },
        { q: "Why can a single-celled organism rely on diffusion alone for gas exchange?", a: "Its surface area to volume ratio is large and no part is far from the surface", wrong: ["It does not respire", "It has a specialised exchange surface", "Diffusion is faster in small organisms"], why: "Every part of the cell is within a few micrometres of the membrane, so diffusion can supply it fast enough. Scale the organism up and the centre would starve long before oxygen arrived." },
        { q: "Why do small mammals such as mice have a higher metabolic rate per gram than large ones?", a: "Their large surface area to volume ratio means they lose heat faster and must replace it", wrong: ["They have more mitochondria per cell", "They eat different food", "They have a lower body temperature"], why: "Heat is lost across the surface but generated throughout the volume, so a small animal loses proportionally more. Mice must eat almost constantly; elephants have the opposite problem and need ways to shed heat." },
        { q: "How are exchange surfaces such as alveoli and villi adapted?", a: "They are folded or numerous to give a large surface area, and thin to shorten the diffusion path", wrong: ["They are thick to protect the cells", "They have a small surface area to control the rate", "They actively pump substances only"], why: "Every exchange surface in biology solves the same problem in the same three ways: large area, short distance, and a maintained concentration gradient. Recognising the pattern makes each new example predictable." },
        { q: "Two cubes have sides of 1 cm and 2 cm. Which has the larger surface area to volume ratio?", a: "The 1 cm cube", wrong: ["The 2 cm cube", "They are the same", "It cannot be determined"], why: "The ratio is 6 ÷ side, so 6 for the small cube and 3 for the large one. Doubling the side halves the ratio — the smaller object always wins." },
        { q: "Why does a flattened shape improve exchange for an organism?", a: "It increases surface area without increasing volume, and shortens the distance to the centre", wrong: ["It reduces the surface area", "It increases the volume", "It slows diffusion, allowing more time"], why: "Flatworms are the standard example: they have no circulatory system and rely on shape alone to keep every cell close to the surface. The same logic explains why leaves are thin and flat." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.trans.exchange",
    subject: "biology",
    topic: "bio-transport",
    subtopic: "exchange-surfaces",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are the three features common to all efficient exchange surfaces?", a: "A large surface area, a short diffusion distance and a maintained concentration gradient", wrong: ["A thick membrane, a small area and a steep gradient", "A large volume, a thick wall and active transport", "A small surface area, a long diffusion path and a good blood supply"], why: "Every example — alveoli, villi, gills, root hairs — solves the same problem in the same three ways. Once you know the pattern you can predict the adaptations of an exchange surface you have never seen." },
        { q: "How does a good blood supply improve an exchange surface?", a: "It carries substances away, keeping the concentration gradient steep", wrong: ["It thickens the surface", "It reduces the surface area", "It provides energy for diffusion"], why: "Diffusion slows as the two sides equalise, so removing what has crossed keeps the gradient steep. Blood does this at the alveoli, the villi and the kidney nephrons alike." },
        { q: "How are alveoli adapted for gas exchange?", a: "There are millions of them, they have walls one cell thick and they are surrounded by capillaries", wrong: ["They are large and thick-walled", "They have cilia to move gases", "They actively pump oxygen into the blood"], why: "Millions of tiny sacs give a surface area of roughly 70 m² in a space the size of a chest, and a single-cell wall makes the diffusion path minimal. Gas exchange is entirely passive — nothing is pumped." },
        { q: "How are villi adapted for absorption?", a: "They give a large surface area, have thin walls and a rich blood supply", wrong: ["They secrete digestive enzymes only", "They are thick to withstand acid", "They actively push food along the gut"], why: "Villi and the microvilli on their cells multiply the intestinal surface area many times over. Their capillaries carry absorbed glucose and amino acids away, keeping the gradient favourable." },
        { q: "How are fish gills adapted for gas exchange in water?", a: "Many thin filaments with lamellae give a huge surface area, and blood flows opposite to the water", wrong: ["They are thick to withstand water pressure", "They have a small surface area to conserve water", "They exchange gases only when the fish is still"], why: "Counter-current flow keeps a gradient along the whole length of the lamella, so the blood can pick up oxygen the entire way. If the flows ran in the same direction, exchange would stop halfway once the concentrations equalised." },
        { q: "How is a root hair cell adapted for absorbing water and minerals?", a: "A long narrow extension gives a large surface area, and many mitochondria supply energy for active transport", wrong: ["It contains many chloroplasts", "It has a thick waxy cuticle", "It has no cell membrane"], why: "The hair-like projection reaches between soil particles and multiplies the absorbing surface. Chloroplasts would be useless underground, and the mitochondria are there because mineral uptake is active." },
        { q: "Why does a leaf have air spaces in its spongy mesophyll?", a: "To allow carbon dioxide to diffuse to the photosynthesising cells", wrong: ["To store water", "To reduce the leaf's mass", "To trap light more effectively"], why: "The air spaces connect to the stomata and give every mesophyll cell a moist surface exposed to air. They are a gas exchange surface built into the leaf's structure." },
        { q: "Why must a gas exchange surface be moist?", a: "Gases must dissolve before they can diffuse across the membrane", wrong: ["Water carries the gases actively", "Dryness would kill the organism instantly", "Moisture increases the surface area"], why: "Diffusion across a membrane happens in solution, which is why alveoli are lined with fluid and why land animals lose water whenever they breathe. It is an unavoidable cost of gas exchange in air." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
