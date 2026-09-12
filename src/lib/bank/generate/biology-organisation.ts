/**
 * Biology: organisation, respiration, and infection and response.
 *
 * The computed seams here are cardiac output, enzyme rates and the arithmetic
 * of breathing during exercise. Each is built from the answer outwards, so the
 * multiplication is one step and the mistake worth catching is choosing the
 * wrong two numbers to multiply rather than mis-keying a calculator.
 *
 * The recall content leans on the pattern that runs through the whole topic:
 * a structure's shape predicts its job. Villi, alveoli and capillaries are the
 * same three adaptations three times over, and the questions say so rather than
 * asking for three separate lists.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, exact, num, slip, tidy, wrongOptions } from "./physics-kit";

/* ==========================================================================
   Data
   ========================================================================== */

const ENZYMES = [
  { enzyme: "amylase", substrate: "starch", product: "maltose", where: "salivary glands, pancreas and small intestine" },
  { enzyme: "protease", substrate: "protein", product: "amino acids", where: "stomach, pancreas and small intestine" },
  { enzyme: "lipase", substrate: "lipids", product: "fatty acids and glycerol", where: "pancreas and small intestine" },
  { enzyme: "carbohydrase", substrate: "carbohydrates", product: "simple sugars", where: "the digestive system" },
] as const;

const BLOOD_PARTS = [
  { part: "red blood cells", job: "Carry oxygen, using haemoglobin" },
  { part: "white blood cells", job: "Defend the body against pathogens" },
  { part: "platelets", job: "Form clots to seal wounds" },
  { part: "plasma", job: "Carry dissolved substances such as glucose, carbon dioxide and urea" },
] as const;

const VESSELS = [
  { vessel: "artery", feature: "thick muscular and elastic walls with a narrow lumen", job: "carry blood away from the heart at high pressure" },
  { vessel: "vein", feature: "thin walls, a wide lumen and valves", job: "return blood to the heart at low pressure" },
  { vessel: "capillary", feature: "walls one cell thick", job: "allow exchange of substances with the tissues" },
] as const;

/* Extra wrong answers so a vessel question always has a full set of four. The
   named vessels are real (a venule and an arteriole are the small vessels
   either side of a capillary bed); the extra features are plausible mixes of
   the real ones. */
const EXTRA_VESSEL_NAMES = ["venule", "arteriole"] as const;
const EXTRA_VESSEL_FEATURES = [
  "thick walls, a wide lumen and no valves",
  "a single layer of muscle with valves at every junction",
] as const;

const PATHOGEN_TYPES = [
  { type: "virus", example: "measles", note: "Viruses reproduce inside host cells and burst them, which is why antibiotics do not work on them" },
  { type: "bacterium", example: "salmonella", note: "Bacteria reproduce rapidly and make toxins that damage tissue" },
  { type: "fungus", example: "rose black spot", note: "Fungi grow into tissue and can be treated with fungicides" },
  { type: "protist", example: "malaria", note: "Protists are often spread by a vector — mosquitoes, in the case of malaria" },
] as const;

/* Cardiac output cases. Stroke volume in cm³, heart rate in beats per minute,
   output in cm³/min — built so every product is writable. */
const CARDIAC_CASES: { stroke: number; rate: number; output: number }[] = (() => {
  const out: { stroke: number; rate: number; output: number }[] = [];
  for (const stroke of [50, 60, 70, 75, 80, 90, 100, 120]) {
    for (const rate of [50, 60, 70, 72, 75, 80, 100, 120, 150, 180]) {
      const output = stroke * rate;
      if (!tidy(output)) continue;
      out.push({ stroke, rate, output });
    }
  }
  return out;
})();

/* ==========================================================================
   The generators
   ========================================================================== */

export const biologyOrganisation: Generator[] = [
  generator({
    key: "bio.org.tissues",
    subject: "biology",
    topic: "bio-organisation",
    subtopic: "tissues-organs",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is a tissue?", a: "A group of similar cells working together to perform a shared function", wrong: ["A group of different organs", "A single specialised cell", "A group of organisms of one species"], why: "The hierarchy runs cell, tissue, organ, organ system, organism. A tissue is the first level at which cells co-operate, and its cells are similar to one another." },
        { q: "What is an organ?", a: "A group of different tissues working together to perform a function", wrong: ["A group of identical cells", "A group of organ systems", "A single very large cell"], why: "What makes something an organ is the combination of DIFFERENT tissues. The stomach has muscular tissue to churn, glandular tissue to secrete and epithelial tissue to line it." },
        { q: "Which of these is an organ system?", a: "The digestive system", wrong: ["The stomach", "Muscular tissue", "A red blood cell"], why: "The stomach is one organ within the digestive system; muscular tissue is one tissue within the stomach. Each level of the hierarchy contains the one below it." },
        { q: "Which tissues are found in the stomach?", a: "Muscular, glandular and epithelial tissue", wrong: ["Only muscular tissue", "Only glandular tissue", "Nervous tissue only"], why: "Muscle churns the food, glands secrete acid and enzymes, and epithelium lines and protects the surface. Three tissues doing three jobs is exactly what makes the stomach an organ rather than a tissue." },
        { q: "What is the function of glandular tissue?", a: "To produce and secrete substances such as enzymes and hormones", wrong: ["To contract and relax", "To cover and line surfaces", "To transmit electrical impulses"], why: "Contraction is muscular tissue and covering is epithelial tissue. Naming the tissue from the job it does is the reliable way through these questions." },
        { q: "Why is the stomach classed as an organ rather than a tissue?", a: "It contains several different tissues working together", wrong: ["It is larger than a tissue", "It contains only one type of cell", "It is inside the body"], why: "Size and position are irrelevant; the criterion is whether more than one tissue type is combined for a shared function. A muscle is a tissue however large it is." },
        { q: "Which organ system transports substances around the body?", a: "The circulatory system", wrong: ["The digestive system", "The respiratory system", "The nervous system"], why: "The circulatory system moves blood, and with it oxygen, glucose, carbon dioxide, urea and hormones. The digestive and respiratory systems load substances into it; the circulation distributes them." },
        { q: "What is the correct order of biological organisation, smallest first?", a: "Cell, tissue, organ, organ system, organism", wrong: ["Tissue, cell, organ, organism, organ system", "Organ, tissue, cell, organ system, organism", "Cell, organ, tissue, organism, organ system"], why: "Each level is built from the previous one. Keeping the order straight is what lets you classify an unfamiliar structure by asking what it is made of." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.org.enzymes",
    subject: "biology",
    topic: "bio-organisation",
    subtopic: "enzymes",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        const e = rng.pick(ENZYMES);
        const asked = rng.bool();
        if (asked) {
          const answer = e.product;
          return {
            prompt: `${e.enzyme.charAt(0).toUpperCase()}${e.enzyme.slice(1)} breaks down ${e.substrate}. What are the products?`,
            answer,
            distractors: wrongOptions(answer, ENZYMES.filter((x) => x.product !== e.product).map((x) => x.product)),
            explanation:
              `${e.enzyme.charAt(0).toUpperCase()}${e.enzyme.slice(1)} digests ${e.substrate} into ${answer}, and it is made in the ${e.where}. ` +
              `The name usually gives the substrate away: an -ase ending on the substrate's name.`,
          };
        }
        const answer = e.enzyme;
        return {
          prompt: `Which enzyme breaks down ${e.substrate}?`,
          answer,
          distractors: wrongOptions(answer, ENZYMES.filter((x) => x.enzyme !== e.enzyme).map((x) => x.enzyme)),
          explanation: `${answer.charAt(0).toUpperCase()}${answer.slice(1)} breaks ${e.substrate} into ${e.product}. It is produced in the ${e.where}.`,
        };
      }

      if (form === 1) {
        /* Rate from a time, built from the rate so the division is exact. */
        const rate = rng.pick([0.2, 0.25, 0.5, 1, 2, 2.5, 4, 5, 10, 20]);
        const amount = rng.pick([10, 20, 25, 50, 100]);
        const time = exact(amount / rate, 2, "time taken");
        const answer = ans(rate, "mg/s");
        return {
          prompt:
            `An enzyme breaks down ${amount} mg of substrate in ${num(time)} seconds. What is the rate of reaction?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(time / amount, "mg/s"), // inverted the fraction
            slip(amount * time, "mg/s"), // multiplied instead of dividing
            slip(amount, "mg/s"), // gave the amount
            slip(rate * 2, "mg/s"),
          ]),
          explanation:
            `Rate = amount ÷ time = ${amount} ÷ ${num(time)} = ${answer}. ` +
            `Rate is always "how much per unit time", so the quantity goes on top and the time underneath. ` +
            `An experiment that measures only the TIME to finish gives a rate of 1 ÷ time, which is a different calculation.`,
          check: () => (agrees(rate * time, amount) ? null : "the rate does not reproduce the amount"),
        };
      }

      const cases = [
        { q: "What is an enzyme?", a: "A biological catalyst that speeds up a reaction without being used up", wrong: ["A hormone that controls a reaction", "A substrate that is broken down", "A source of energy for a reaction"], why: "Being a catalyst means the enzyme emerges unchanged and can work again immediately, which is why very small quantities are enough. It is a protein, and its shape is what does the work." },
        { q: "What is the active site of an enzyme?", a: "The region whose shape is complementary to the substrate", wrong: ["The part that supplies energy", "The part that is broken down during the reaction", "The region that binds to the cell membrane"], why: "The substrate fits the active site rather like a key in a lock, which is why each enzyme works on one substrate only. Change the shape of the active site and the substrate no longer fits." },
        { q: "What happens to an enzyme above its optimum temperature?", a: "The active site changes shape and the enzyme denatures", wrong: ["It works faster indefinitely", "It becomes a different enzyme", "It turns into a substrate"], why: "Heat breaks the bonds holding the protein in its precise shape, so the active site no longer fits the substrate. Denaturing is permanent — cooling the enzyme down does not bring the activity back." },
        { q: "Why does enzyme activity increase between 20 °C and 37 °C?", a: "Molecules move faster, so there are more successful collisions with the active site", wrong: ["The enzyme becomes larger", "More enzyme is produced", "The substrate becomes more concentrated"], why: "Below the optimum, the ordinary kinetic argument applies: warmer means faster collisions. Above it, denaturing takes over and the rate collapses, which is why the graph is a peak rather than a rise." },
        { q: "What effect does the wrong pH have on an enzyme?", a: "It changes the shape of the active site, reducing or stopping activity", wrong: ["It makes the enzyme work faster", "It converts the enzyme into a substrate", "It has no effect on enzymes"], why: "The bonds holding the protein's shape are sensitive to charge, so pH matters as much as temperature. Stomach protease has an optimum near pH 2 while pancreatic enzymes prefer pH 8, and each is useless in the other's environment." },
        { q: "Why is the enzyme–substrate relationship described as specific?", a: "Each enzyme's active site fits only one substrate shape", wrong: ["Each enzyme works only at one temperature", "Each enzyme is found in only one organ", "Each enzyme can only be used once"], why: "Specificity comes from shape complementarity, so amylase cannot digest protein no matter how much of it is present. It is also why the body needs so many different enzymes." },
        { q: "How does bile help lipase work?", a: "It emulsifies fats into droplets, increasing the surface area for lipase to act on", wrong: ["It digests fats into fatty acids directly", "It denatures lipase", "It is an enzyme that breaks down protein"], why: "Bile is not an enzyme and breaks nothing down chemically. It does two physical jobs: neutralising stomach acid and breaking large fat globules into many small ones, which speeds the chemical digestion that follows." },
        { q: "Where is bile produced and where is it stored?", a: "Produced in the liver, stored in the gall bladder", wrong: ["Produced in the gall bladder, stored in the liver", "Produced and stored in the pancreas", "Produced in the stomach, stored in the small intestine"], why: "The liver makes it continuously and the gall bladder concentrates and releases it when fatty food arrives. It is released into the small intestine, where the pancreatic enzymes need an alkaline environment." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.org.digestion",
    subject: "biology",
    topic: "bio-organisation",
    subtopic: "digestive-system",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is the function of the small intestine?", a: "To complete digestion and absorb the soluble products into the blood", wrong: ["To absorb water from undigested food", "To produce bile", "To store faeces before egestion"], why: "Water absorption is the large intestine's job and bile comes from the liver. The small intestine's villi are what make it the absorbing organ — an enormous surface area with a rich blood supply." },
        { q: "Why must large food molecules be digested?", a: "They are too large and insoluble to be absorbed through the gut wall", wrong: ["They contain no energy until digested", "They would poison the blood", "They are the wrong temperature"], why: "Digestion converts insoluble polymers into small soluble molecules that can cross the intestinal wall. Starch has plenty of energy in it; the problem is purely one of getting it into the blood." },
        { q: "What does the stomach produce that helps protease work?", a: "Hydrochloric acid, giving the low pH that protease needs", wrong: ["Bile, to emulsify fats", "Sodium hydrogencarbonate, to raise the pH", "Amylase, to digest starch"], why: "Stomach protease has an optimum around pH 2, so the acid is not incidental — it is what allows digestion to happen there. The acid also kills most of the bacteria swallowed with food." },
        { q: "Which test identifies the presence of starch?", a: "Iodine solution, which turns blue-black", wrong: ["Benedict's solution, which turns brick red", "Biuret solution, which turns purple", "Ethanol, which turns cloudy white"], why: "Each food test has its own reagent and colour: iodine for starch, Benedict's for reducing sugars, Biuret for protein and the ethanol emulsion test for lipids. Mixing up which colour goes with which is the usual error." },
        { q: "What colour change indicates a reducing sugar in the Benedict's test?", a: "Blue to brick red on heating", wrong: ["Blue-black on adding the reagent", "Purple on adding the reagent", "Cloudy white on adding ethanol"], why: "Benedict's must be heated, and the colour goes through green and orange to brick red as the concentration rises — so the test is semi-quantitative. Iodine and Biuret work at room temperature." },
        { q: "What is the role of the liver in digestion?", a: "It produces bile, which emulsifies fats and neutralises stomach acid", wrong: ["It produces protease", "It absorbs glucose from the gut", "It stores faeces"], why: "Bile is the liver's contribution to digestion, though the liver does much else besides — storing glycogen, breaking down old red blood cells and dealing with toxins." },
        { q: "Where is amylase produced?", a: "In the salivary glands, the pancreas and the small intestine", wrong: ["In the stomach only", "In the liver only", "In the large intestine"], why: "Starch digestion begins in the mouth, is interrupted by stomach acid which denatures salivary amylase, and resumes in the small intestine with pancreatic amylase. The stomach makes protease, not amylase." },
        { q: "What happens to the products of digestion after absorption?", a: "They are carried in the blood to cells that need them", wrong: ["They are excreted in urine immediately", "They stay in the small intestine", "They are converted back into large molecules in the blood"], why: "Glucose goes to cells for respiration, amino acids are used to build new proteins, and fatty acids and glycerol are used for membranes and storage. Absorption is the handover from the digestive to the circulatory system." },
        { q: "What is the function of the large intestine?", a: "To absorb water from the remaining material", wrong: ["To digest protein", "To produce bile", "To absorb glucose"], why: "By the time material reaches the large intestine, the nutrients have gone; what remains is water and indigestible fibre. Absorbing that water is why faeces are solid." },
        { q: "Why is fibre important in the diet even though it is not digested?", a: "It gives the gut muscles something to push against, keeping material moving", wrong: ["It is broken down into glucose", "It kills harmful bacteria", "It is absorbed as a vitamin"], why: "Peristalsis works better with bulk to grip. Fibre is by definition not digested, which is exactly what makes it useful for this purpose." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.org.heart",
    subject: "biology",
    topic: "bio-organisation",
    subtopic: "heart-circulation",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        const c = rng.pick(CARDIAC_CASES);
        const answer = ans(c.output, "cm³/min");
        return {
          prompt:
            `A heart pumps ${c.stroke} cm³ of blood with each beat and beats ${c.rate} times a minute. What is the cardiac output?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(c.rate / c.stroke, "cm³/min"), // divided instead of multiplying
            slip(c.stroke + c.rate, "cm³/min"), // added the two
            slip(c.stroke, "cm³/min"), // gave the stroke volume
            slip(c.output / 60, "cm³/min"),
          ]),
          explanation:
            `Cardiac output = stroke volume × heart rate = ${c.stroke} × ${c.rate} = ${answer}. ` +
            `The units tell you the operation: cm³ per beat multiplied by beats per minute leaves cm³ per minute, with the beats cancelling.`,
          check: () => (agrees(c.output / c.rate, c.stroke) ? null : "the output does not divide back to the stroke volume"),
        };
      }

      if (form === 1) {
        const v = rng.pick(VESSELS);
        const asked = rng.bool();
        if (asked) {
          const answer = v.feature;
          return {
            prompt: `Which structural feature describes ${v.vessel === "artery" ? "an artery" : `a ${v.vessel}`}?`,
            answer,
            distractors: wrongOptions(answer, [
              ...VESSELS.filter((x) => x.feature !== v.feature).map((x) => x.feature),
              ...EXTRA_VESSEL_FEATURES,
            ]),
            explanation:
              `${v.vessel.charAt(0).toUpperCase()}${v.vessel.slice(1)}s have ${answer}, because they ${v.job}. ` +
              `Each feature follows from the pressure: high pressure needs thick walls, low pressure needs valves to stop backflow, and exchange needs the thinnest possible wall.`,
          };
        }
        const answer = v.vessel;
        return {
          prompt: `Which blood vessel has ${v.feature}?`,
          answer,
          distractors: wrongOptions(answer, [
            ...VESSELS.filter((x) => x.vessel !== v.vessel).map((x) => x.vessel),
            ...EXTRA_VESSEL_NAMES,
          ]),
          explanation: `That is ${answer === "artery" ? "an artery" : `a ${answer}`} — the feature exists so it can ${v.job}.`,
        };
      }

      const cases = [
        { q: "Why is the human circulatory system described as a double circulation?", a: "Blood passes through the heart twice for each complete circuit of the body", wrong: ["There are two hearts", "Blood flows in two directions at once", "There are two types of blood"], why: "One loop goes to the lungs and back, the other to the body and back. Returning to the heart in between means the blood can be re-pressurised, so it reaches the body at a much higher pressure than it could otherwise." },
        { q: "Why is the left ventricle wall thicker than the right?", a: "It pumps blood to the whole body, which needs a higher pressure", wrong: ["It holds more blood", "It receives blood from the lungs", "It contains more valves"], why: "The right ventricle only has to reach the lungs, a short low-pressure trip that also protects the delicate capillaries there. The left must supply everything from the brain to the feet." },
        { q: "Which blood vessel carries oxygenated blood away from the heart to the body?", a: "The aorta", wrong: ["The vena cava", "The pulmonary artery", "The pulmonary vein"], why: "The naming rule is that arteries carry blood AWAY from the heart, whatever it contains — which is why the pulmonary artery carries deoxygenated blood. Aorta out to the body, vena cava back from it." },
        { q: "What is the function of the valves in the heart?", a: "To prevent blood flowing backwards", wrong: ["To pump the blood", "To oxygenate the blood", "To slow the blood down"], why: "The heart muscle does the pumping; the valves only make sure the resulting flow goes one way. Veins have valves for the same reason, because the pressure there is too low to stop backflow on its own." },
        { q: "Which vessel supplies the heart muscle itself with oxygen?", a: "The coronary artery", wrong: ["The pulmonary artery", "The aorta directly", "The vena cava"], why: "The heart cannot absorb oxygen from the blood passing through its chambers, so it has its own supply branching off the aorta. Blockage of a coronary artery starves the muscle and causes a heart attack." },
        { q: "Where in the heart does deoxygenated blood arrive from the body?", a: "The right atrium", wrong: ["The left atrium", "The right ventricle", "The left ventricle"], why: "Blood enters an atrium and leaves from a ventricle, and the right side always handles deoxygenated blood. From the right atrium it passes to the right ventricle and out to the lungs." },
        { q: "What is the role of the pacemaker cells in the right atrium?", a: "They generate the electrical impulses that set the heart's rhythm", wrong: ["They oxygenate the blood", "They open and close the valves mechanically", "They filter the blood"], why: "The heart beats without any signal from the brain because these cells fire on their own. An artificial pacemaker takes over when they fail." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.org.blood",
    subject: "biology",
    topic: "bio-organisation",
    subtopic: "blood",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        const b = rng.pick(BLOOD_PARTS);
        const asked = rng.bool();
        if (asked) {
          const answer = b.job;
          return {
            prompt: `What is the function of ${b.part}?`,
            answer,
            distractors: wrongOptions(answer, BLOOD_PARTS.filter((x) => x.job !== b.job).map((x) => x.job)),
            explanation: `${answer}. Blood is a tissue with four components, and each has one clear job.`,
          };
        }
        const answer = b.part;
        return {
          prompt: `Which component of blood carries out this function: ${b.job.toLowerCase()}?`,
          answer,
          distractors: wrongOptions(answer, BLOOD_PARTS.filter((x) => x.part !== b.part).map((x) => x.part)),
          explanation: `That is the job of ${answer}.`,
        };
      }

      const cases = [
        { q: "Why do red blood cells have no nucleus?", a: "To make room for more haemoglobin", wrong: ["To make them lighter", "So they can divide faster", "So they can pass through the lungs"], why: "Losing the nucleus is a trade: the cell can carry more oxygen but cannot repair itself or divide, which is why red blood cells live only about 120 days and must be constantly replaced." },
        { q: "Why are red blood cells biconcave?", a: "It increases surface area for oxygen absorption and lets them squeeze through capillaries", wrong: ["It makes them float in plasma", "It allows them to store a nucleus", "It helps them clot"], why: "The dimpled disc shape gives more surface per unit volume than a sphere would, and the flexibility matters because capillaries are barely wider than the cells themselves." },
        { q: "What does haemoglobin combine with in the lungs?", a: "Oxygen, forming oxyhaemoglobin", wrong: ["Carbon dioxide, forming carbaminohaemoglobin", "Glucose, forming glycogen", "Water, forming plasma"], why: "The reaction is reversible: oxyhaemoglobin forms where oxygen is plentiful and breaks down where tissues have used oxygen up. That reversibility is what makes transport possible." },
        { q: "How do white blood cells defend the body?", a: "By engulfing pathogens, producing antibodies and producing antitoxins", wrong: ["By carrying oxygen to infected tissue", "By forming clots around pathogens", "By dissolving pathogens with acid in the blood"], why: "Phagocytes engulf; lymphocytes make antibodies against specific antigens and antitoxins against the poisons bacteria release. Clotting is the platelets' job." },
        { q: "What is the function of platelets?", a: "To form clots that seal wounds", wrong: ["To carry oxygen", "To produce antibodies", "To transport hormones"], why: "Clotting stops blood loss and keeps pathogens out, so it is both a circulatory and a defensive function. A shortage of platelets means wounds that will not stop bleeding." },
        { q: "What is carried in blood plasma?", a: "Dissolved glucose, carbon dioxide, urea, hormones and the blood cells themselves", wrong: ["Only water", "Only red blood cells", "Only oxygen"], why: "Plasma is the liquid everything else travels in. Oxygen is the exception: it is carried by haemoglobin inside the red blood cells, because it dissolves too poorly in plasma to be transported that way." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.org.lungs",
    subject: "biology",
    topic: "bio-organisation",
    subtopic: "lungs-gas-exchange",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Where does gas exchange take place in the lungs?", a: "In the alveoli", wrong: ["In the trachea", "In the bronchi", "In the diaphragm"], why: "The trachea and bronchi are pipes that carry air; only the alveoli have the thin walls and dense capillary network that exchange needs. Their combined surface area is roughly that of a tennis court." },
        { q: "What is the path of air into the lungs?", a: "Trachea, bronchi, bronchioles, alveoli", wrong: ["Bronchi, trachea, alveoli, bronchioles", "Alveoli, bronchioles, bronchi, trachea", "Trachea, bronchioles, bronchi, alveoli"], why: "The tubes branch and narrow all the way down, ending in the air sacs. Getting the order right also gets the structure right: wide and few at the top, narrow and numerous at the bottom." },
        { q: "How does the diaphragm cause air to enter the lungs?", a: "It contracts and flattens, increasing the volume of the chest and lowering the pressure", wrong: ["It relaxes and domes upwards, pushing air in", "It pumps air in like a muscle", "It absorbs oxygen directly"], why: "Breathing in is an active muscular movement that lowers the pressure inside the chest below atmospheric, so air flows in. Breathing out at rest is mostly passive — the muscles simply relax." },
        { q: "Which gas moves from the blood into the alveoli?", a: "Carbon dioxide", wrong: ["Oxygen", "Nitrogen", "Water vapour only"], why: "Blood arriving at the lungs is high in carbon dioxide and low in oxygen, so each gas moves down its own gradient in opposite directions. Both movements are diffusion and neither requires energy." },
        { q: "Why are alveoli surrounded by a network of capillaries?", a: "To carry gases away, maintaining a steep concentration gradient", wrong: ["To keep the alveoli warm", "To provide structural support", "To filter the air"], why: "If the blood did not move on, oxygen would accumulate on the blood side until the gradient vanished and diffusion stopped. A good blood supply is the third of the three exchange-surface adaptations." },
        { q: "Why does smoking damage gas exchange?", a: "It destroys alveolar walls, reducing the surface area available", wrong: ["It thins the alveolar walls too much", "It increases the number of alveoli", "It cools the lungs"], why: "Emphysema merges many small alveoli into fewer large spaces, so the total surface area falls dramatically. Smoke also paralyses the cilia that clear mucus, which is why a smoker's cough exists." },
        { q: "What effect does exercise have on breathing rate and why?", a: "It increases, to supply more oxygen and remove more carbon dioxide", wrong: ["It decreases, to conserve energy", "It stays the same", "It increases only to cool the body"], why: "Muscles respiring faster consume oxygen and produce carbon dioxide faster, so ventilation must rise to match. It is the rising carbon dioxide concentration, detected in the blood, that triggers the change." },
        { q: "Why is the inside of an alveolus moist?", a: "Gases must dissolve before they can diffuse across the membrane", wrong: ["To keep the lungs warm", "To trap dust particles", "To kill bacteria"], why: "Diffusion across a cell membrane happens in solution. The unavoidable consequence is that breathing loses water — which is why breath mists on a cold day." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Respiration
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.resp.aerobic",
    subject: "biology",
    topic: "bio-respiration",
    subtopic: "aerobic-respiration",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is the word equation for aerobic respiration?", a: "Glucose + oxygen → carbon dioxide + water", wrong: ["Carbon dioxide + water → glucose + oxygen", "Glucose → lactic acid", "Glucose + carbon dioxide → oxygen + water"], why: "Respiration is the reverse of photosynthesis in its inputs and outputs, which is why the two are so easily confused. Energy is released, not made — it was already stored in the glucose." },
        { q: "Where in the cell does aerobic respiration take place?", a: "In the mitochondria", wrong: ["In the nucleus", "In the ribosomes", "In the chloroplasts"], why: "Cells that need a lot of energy, such as muscle and sperm cells, contain many mitochondria. Chloroplasts do photosynthesis, which is a different process in a different organelle." },
        { q: "Is aerobic respiration exothermic or endothermic?", a: "Exothermic — it releases energy", wrong: ["Endothermic — it takes energy in", "Neither — energy is unchanged", "It depends on the organism"], why: "The energy released is used for movement, keeping warm and building larger molecules. Photosynthesis is the endothermic one, which is why it needs light." },
        { q: "What is respiration used for in living organisms?", a: "To release energy for movement, warmth and building larger molecules", wrong: ["To produce glucose", "To absorb oxygen from the air", "To remove waste from the blood"], why: "Respiration happens in every cell of every living thing, continuously. Making glucose is photosynthesis, and absorbing oxygen is breathing — a common confusion worth keeping separate." },
        { q: "What is the difference between breathing and respiration?", a: "Breathing moves air in and out of the lungs; respiration releases energy in cells", wrong: ["They are the same process", "Breathing happens in cells and respiration in the lungs", "Respiration only happens during exercise"], why: "Plants respire and have no lungs at all. Breathing is the transport step that supplies the oxygen respiration uses." },
        { q: "Why do muscle cells contain many mitochondria?", a: "They need a large and rapid supply of energy for contraction", wrong: ["They store glucose there", "They have no nucleus", "They need to photosynthesise"], why: "The number of mitochondria is a reliable indicator of a cell's energy demand. It is why trained endurance athletes have more of them in their muscle fibres than untrained people." },
        { q: "How could you show that a germinating seed is respiring?", a: "Show that it produces carbon dioxide and releases heat", wrong: ["Show that it produces oxygen", "Show that it absorbs carbon dioxide", "Show that it grows towards light"], why: "Carbon dioxide can be detected with limewater or hydrogencarbonate indicator, and the temperature rise can be measured with a thermometer in a vacuum flask. Producing oxygen would indicate photosynthesis instead." },
        { q: "What happens to the energy released by respiration that is not used for work?", a: "It is transferred to the surroundings as heat", wrong: ["It is destroyed", "It is stored as glucose", "It is converted back into oxygen"], why: "No energy transfer is fully efficient, and the losses appear as heat. In mammals and birds this is not entirely waste — it is what keeps body temperature constant." },
        { q: "Which of these is a use of the energy released by respiration in animals?", a: "Contracting muscles", wrong: ["Producing glucose from carbon dioxide", "Absorbing light energy", "Cooling the body below its surroundings"], why: "The three standard uses are movement, keeping warm and building larger molecules from smaller ones. Making glucose from carbon dioxide is photosynthesis and animals cannot do it." },
        { q: "Why do plants respire as well as photosynthesise?", a: "They need energy from glucose for their own life processes, day and night", wrong: ["They cannot photosynthesise at night", "Respiration produces the oxygen they need", "Only their roots respire"], why: "Photosynthesis stores energy; respiration releases it, and every living cell needs the release. Plants photosynthesise faster than they respire in daylight, which is why they are net oxygen producers overall." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.resp.anaerobic",
    subject: "biology",
    topic: "bio-respiration",
    subtopic: "anaerobic-respiration",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the product of anaerobic respiration in human muscle?", a: "Lactic acid", wrong: ["Ethanol and carbon dioxide", "Carbon dioxide and water", "Glucose and oxygen"], why: "Ethanol and carbon dioxide are the products in yeast and plants, not animals. The glucose is only partly broken down either way, which is why anaerobic respiration releases far less energy." },
        { q: "What are the products of anaerobic respiration in yeast?", a: "Ethanol and carbon dioxide", wrong: ["Lactic acid", "Carbon dioxide and water", "Glucose and oxygen"], why: "This is fermentation, and it is the basis of both brewing and baking — the ethanol matters in one and the carbon dioxide in the other. Animals cannot do it; they produce lactic acid instead." },
        { q: "Why does anaerobic respiration release less energy than aerobic respiration?", a: "The glucose is only partially broken down", wrong: ["Less glucose is used", "It happens more slowly", "It takes place outside the cell"], why: "Lactic acid and ethanol still contain a great deal of chemical energy, which is precisely why they can be used as fuels. Complete oxidation to carbon dioxide and water extracts far more." },
        { q: "What is oxygen debt?", a: "The extra oxygen needed after exercise to break down the lactic acid that accumulated", wrong: ["The oxygen used during exercise", "A shortage of oxygen in the blood at rest", "The oxygen stored in muscle before exercise"], why: "The debt is repaid by continuing to breathe deeply after exercise stops, which is why you keep panting at the end of a sprint. The liver does the actual conversion of lactic acid back to glucose." },
        { q: "Where is lactic acid broken down after exercise?", a: "In the liver, where it is converted back to glucose", wrong: ["In the muscles, where it is excreted", "In the lungs, where it is breathed out", "In the kidneys, where it becomes urine"], why: "Blood carries the lactic acid from the muscles to the liver, so recovery is a whole-body process rather than a local one. The oxygen debt is repaid as this conversion proceeds." },
        { q: "When does a muscle start to respire anaerobically?", a: "When the oxygen supply cannot keep up with demand during vigorous exercise", wrong: ["As soon as exercise begins", "Only when the muscle is at rest", "When blood glucose runs out"], why: "Aerobic respiration continues throughout; anaerobic respiration is an additional route used when demand outstrips supply. It provides energy quickly but cannot be sustained." },
        { q: "Why does anaerobic respiration cause muscle fatigue?", a: "Lactic acid builds up and lowers the pH, impairing muscle function", wrong: ["Glucose is used up entirely", "The muscles run out of mitochondria", "Carbon dioxide accumulates in the muscle"], why: "The acidity interferes with the enzymes and proteins the muscle relies on. Clearing the lactic acid is what recovery consists of, and it needs oxygen." },
        { q: "How is anaerobic respiration in yeast used industrially?", a: "In brewing for the ethanol and in baking for the carbon dioxide", wrong: ["In making yoghurt from lactic acid", "In producing antibiotics", "In extracting oxygen from air"], why: "The same reaction serves two industries because each wants a different product from it. Yoghurt does use fermentation, but by bacteria producing lactic acid rather than yeast producing ethanol." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.resp.metabolism",
    subject: "biology",
    topic: "bio-respiration",
    subtopic: "metabolism",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is metabolism?", a: "The sum of all the chemical reactions in a cell or the body", wrong: ["The rate at which an organism breathes", "The breakdown of food in the gut only", "The release of energy by respiration only"], why: "Metabolism includes both building up and breaking down, and respiration is only one of its reactions. Metabolic rate — how fast all this happens — is a separate quantity." },
        { q: "What is excess protein in the body converted into?", a: "Urea, which is excreted by the kidneys", wrong: ["Glycogen, stored in the liver", "Lipids, stored under the skin", "Glucose, used in respiration"], why: "Amino acids cannot be stored, so the nitrogen-containing part is removed in the liver by deamination and converted to urea. The remainder can be respired." },
        { q: "How is excess glucose stored in animals?", a: "As glycogen in the liver and muscles", wrong: ["As starch in the liver", "As cellulose in the muscles", "As urea in the blood"], why: "Starch and cellulose are plant polymers of glucose; glycogen is the animal equivalent. Storing it as a polymer avoids the osmotic problems that a high glucose concentration would cause." },
        { q: "What are lipid molecules made from?", a: "A molecule of glycerol and three fatty acids", wrong: ["Three amino acids", "A chain of glucose molecules", "Two glucose molecules"], why: "Glucose chains give starch, glycogen and cellulose; amino acid chains give proteins. Recognising which small units make which large molecule is the core of this topic." },
        { q: "What are proteins made from?", a: "Chains of amino acids", wrong: ["Chains of glucose", "Glycerol and fatty acids", "Chains of urea"], why: "The sequence of amino acids determines how the chain folds, and the fold determines the function. This is why a single change in the sequence can destroy an enzyme's activity." },
        { q: "What is glycogen used for?", a: "It is broken back down into glucose when the body needs energy", wrong: ["It is excreted in urine", "It is converted into protein", "It is used to build cell walls"], why: "Glycogen is a short-term energy store that can be mobilised quickly, which is why the liver and muscles keep it. Longer-term storage is as lipid." },
        { q: "Where does deamination take place?", a: "In the liver", wrong: ["In the kidneys", "In the small intestine", "In the muscles"], why: "The liver removes the amino group and forms ammonia, which is immediately converted to the less toxic urea. The kidneys then filter that urea out of the blood — a division of labour worth keeping straight." },
        { q: "What is meant by metabolic rate?", a: "The rate at which the chemical reactions in the body occur", wrong: ["The rate of breathing", "The rate at which food passes through the gut", "The rate at which the heart beats"], why: "Metabolic rate rises with exercise and differs between individuals and species. Small mammals have higher rates per gram than large ones, because they lose heat faster." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.resp.exercise",
    subject: "biology",
    topic: "bio-respiration",
    subtopic: "exercise-response",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        /* Breaths or beats over a period, built from the rate. */
        const rate = rng.pick([12, 15, 16, 18, 20, 24, 25, 30, 40]);
        const minutes = rng.pick([2, 3, 4, 5, 10]);
        const total = exact(rate * minutes, 0, "total");
        const answer = ans(rate, "breaths per minute");
        return {
          prompt:
            `A student takes ${total} breaths in ${minutes} minutes during exercise. What is their breathing rate?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(total * minutes, "breaths per minute"), // multiplied instead of dividing
            slip(minutes / total, "breaths per minute"), // inverted the fraction
            slip(total, "breaths per minute"), // gave the total
            slip(rate * 2, "breaths per minute"),
          ]),
          explanation:
            `Rate = total ÷ time = ${total} ÷ ${minutes} = ${answer}. ` +
            `A resting rate is around 12–15, so a raised figure during exercise is what you would expect: more oxygen in and more carbon dioxide out.`,
          check: () => (agrees(rate * minutes, total) ? null : "the rate does not reproduce the total"),
        };
      }

      const cases = [
        { q: "Why does heart rate increase during exercise?", a: "To deliver oxygen and glucose to the muscles faster and remove carbon dioxide", wrong: ["To cool the blood", "To increase the volume of blood in the body", "To reduce the oxygen demand of the muscles"], why: "Muscles respiring faster need supplies delivered and waste removed faster, and the only way to do that is to move the blood more quickly. Breathing rate and depth rise for the same reason." },
        { q: "Why does breathing become deeper as well as faster during exercise?", a: "To move more air per breath, increasing gas exchange further", wrong: ["To warm the incoming air", "To reduce the heart rate", "To remove lactic acid directly through the lungs"], why: "Rate and depth are two independent ways of increasing ventilation, and the body uses both. Lactic acid is not breathed out — it goes to the liver in the blood." },
        { q: "What causes muscle fatigue during prolonged vigorous exercise?", a: "A build-up of lactic acid from anaerobic respiration", wrong: ["A build-up of oxygen in the muscle", "A shortage of carbon dioxide", "Too much glycogen in the muscle"], why: "When the oxygen supply cannot keep up, some respiration goes anaerobic and lactic acid accumulates. Clearing it needs oxygen, which is what the oxygen debt represents." },
        { q: "Why do you continue to breathe heavily after exercise stops?", a: "To take in the extra oxygen needed to break down the lactic acid", wrong: ["To cool down the body", "Because the heart cannot slow down quickly", "To remove the extra glucose from the blood"], why: "The oxygen debt is repaid after the effort ends, so ventilation stays high until the lactic acid has been dealt with. How long that takes is a measure of fitness." },
        { q: "What happens to the glycogen stored in muscles during long exercise?", a: "It is converted back to glucose for respiration", wrong: ["It is excreted as urea", "It is converted to lactic acid directly", "It is stored as fat"], why: "Muscle glycogen is the immediate fuel reserve, which is why endurance athletes load carbohydrate before an event. When it runs out, performance drops sharply." },
        { q: "How does regular training affect the heart?", a: "The heart muscle grows stronger, so stroke volume rises and resting heart rate falls", wrong: ["The heart shrinks to save energy", "The number of hearts increases", "The heart rate rises permanently"], why: "A stronger heart moves the same volume per minute in fewer beats, which is why trained athletes often have resting pulses in the 40s. Cardiac output at rest is unchanged; it is achieved more efficiently." },
        { q: "Which measurement would best show that someone has recovered after exercise?", a: "Their heart rate has returned to its resting value", wrong: ["Their body temperature has risen", "Their breathing has stopped", "Their muscles have grown"], why: "Recovery time is a standard fitness measure precisely because a fitter person repays the oxygen debt faster. It is measured from the end of exercise to the return of the resting pulse." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Infection and response
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.inf.pathogens",
    subject: "biology",
    topic: "bio-infection",
    subtopic: "pathogens",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    /* Four pathogen types and seven written cases. */
    variants: 10,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        const p = rng.pick(PATHOGEN_TYPES);
        const answer = p.type;
        return {
          prompt: `${p.example.charAt(0).toUpperCase()}${p.example.slice(1)} is caused by which type of pathogen?`,
          answer,
          distractors: wrongOptions(answer, PATHOGEN_TYPES.filter((x) => x.type !== p.type).map((x) => x.type)),
          explanation: `${p.example.charAt(0).toUpperCase()}${p.example.slice(1)} is caused by a ${answer}. ${p.note}.`,
        };
      }

      const cases = [
        { q: "What is a pathogen?", a: "A microorganism that causes infectious disease", wrong: ["Any microorganism", "A type of white blood cell", "A chemical produced by bacteria"], why: "Most microorganisms are harmless or useful; only the disease-causing minority are pathogens. The four types are bacteria, viruses, fungi and protists." },
        { q: "How do bacteria make us feel ill?", a: "They reproduce rapidly and produce toxins that damage tissues", wrong: ["They burst our cells as they leave", "They consume all our glucose", "They block the blood vessels"], why: "Bursting host cells is what viruses do, which is a useful contrast: the two groups cause damage by different mechanisms and respond to different treatments." },
        { q: "How do viruses make us feel ill?", a: "They reproduce inside cells and burst them", wrong: ["They produce toxins outside cells", "They digest tissue with enzymes", "They compete with cells for oxygen"], why: "Because a virus reproduces inside our own cells, any drug that kills it tends to harm the cell too — which is why antiviral drugs are hard to develop and antibiotics do not work at all." },
        { q: "How is measles spread?", a: "By droplets from sneezes and coughs", wrong: ["By contaminated water", "By direct contact with soil", "By mosquito bites"], why: "Measles is highly infectious and can cause serious complications, which is why vaccination in early childhood matters. Malaria is the vector-borne example; cholera the waterborne one." },
        { q: "How is malaria transmitted?", a: "By mosquitoes acting as vectors", wrong: ["Through contaminated food", "By airborne droplets", "By direct skin contact"], why: "A vector carries a pathogen without necessarily being harmed by it. Because transmission depends on the mosquito, controlling malaria focuses on nets and breeding sites as much as on drugs." },
        { q: "What is the best way to reduce the spread of a waterborne disease such as cholera?", a: "Provide clean drinking water and proper sanitation", wrong: ["Vaccinate against all viruses", "Use insect nets at night", "Isolate all infected people permanently"], why: "The control measure has to match the transmission route. Nets stop vector-borne disease and hygiene stops droplet spread; neither helps against contaminated water." },
        { q: "How does HIV eventually cause AIDS?", a: "It attacks and destroys white blood cells, weakening the immune system", wrong: ["It destroys red blood cells", "It causes uncontrolled cell division", "It blocks the airways"], why: "Late-stage HIV leaves the body unable to fight infections it would normally shrug off, so people become ill from opportunistic infections. Antiretroviral drugs can hold the virus in check for decades." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inf.immune",
    subject: "biology",
    topic: "bio-infection",
    subtopic: "immune-system",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are the body's non-specific defences against pathogens?", a: "Skin, mucus and cilia, stomach acid and tears", wrong: ["Antibodies and antitoxins", "Vaccination and antibiotics", "Memory cells in the blood"], why: "Non-specific defences work against anything, without needing to recognise it first. Antibodies are the specific defence, produced only once a particular antigen has been encountered." },
        { q: "How do phagocytes destroy pathogens?", a: "They engulf them and digest them with enzymes", wrong: ["They produce antibodies against them", "They produce antitoxins to neutralise them", "They form clots around them"], why: "Phagocytosis is non-specific — a phagocyte will engulf almost anything foreign. Lymphocytes handle the specific response with antibodies." },
        { q: "What do lymphocytes produce to fight a specific pathogen?", a: "Antibodies that bind to the pathogen's antigens", wrong: ["Enzymes that digest the pathogen", "Mucus that traps the pathogen", "Acid that dissolves the pathogen"], why: "Each antibody is complementary to one antigen, which is why immunity to one disease gives no protection against another. Lymphocytes also make antitoxins against bacterial poisons." },
        { q: "What is an antigen?", a: "A molecule on the surface of a pathogen that the immune system recognises as foreign", wrong: ["A protein produced by white blood cells", "A poison released by bacteria", "A type of white blood cell"], why: "The antibody is what the body makes; the antigen is what it recognises. Keeping the two words apart is most of the battle in this topic." },
        { q: "Why is the second infection by the same pathogen usually dealt with faster?", a: "Memory cells remain and produce the correct antibody quickly", wrong: ["The pathogen becomes weaker over time", "The skin becomes thicker", "Antibodies from the first infection last forever"], why: "The antibodies themselves decline, but the memory cells persist, so the second response is faster and larger. This is the whole principle vaccination exploits." },
        { q: "How does mucus in the airways protect against infection?", a: "It traps pathogens, which cilia then move out of the lungs", wrong: ["It kills pathogens with acid", "It produces antibodies", "It absorbs pathogens into the blood"], why: "The mucus and cilia work as a pair — trapping alone would just accumulate pathogens. Smoking paralyses the cilia, which is why smokers get more chest infections." },
        { q: "What is the role of stomach acid in defence?", a: "It kills most pathogens swallowed in food and drink", wrong: ["It produces antibodies", "It traps pathogens in mucus", "It prevents pathogens entering through the skin"], why: "The stomach's pH of around 2 is lethal to most microorganisms. It is a non-specific chemical barrier, working on anything that arrives rather than on a particular pathogen." },
        { q: "What is an antitoxin?", a: "A protein produced by lymphocytes that neutralises a bacterial toxin", wrong: ["A drug that kills bacteria", "A chemical produced by pathogens", "A vaccine given before infection"], why: "Some bacteria harm us mainly through the poisons they release rather than by their numbers, so neutralising the toxin can be as important as killing the bacterium. Antibiotics are drugs, not something the body makes." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inf.vaccination",
    subject: "biology",
    topic: "bio-infection",
    subtopic: "vaccination",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What does a vaccine contain?", a: "Small quantities of dead or inactive forms of a pathogen", wrong: ["Antibodies taken from another person", "Antibiotics that kill the pathogen", "The full-strength living pathogen"], why: "The vaccine carries the antigens without the ability to cause disease, so the immune system learns to recognise them safely. Giving antibodies directly would provide immediate but temporary protection — a different technique." },
        { q: "How does vaccination make someone immune?", a: "It stimulates lymphocytes to produce antibodies and memory cells", wrong: ["It kills any pathogens already present", "It thickens the skin against infection", "It provides antibodies that last a lifetime"], why: "The memory cells are what matter: they persist, so a real infection later meets a fast, large antibody response. The antibodies made at the time of the vaccination fade." },
        { q: "What is herd immunity?", a: "When enough of a population is immune that the disease cannot spread easily", wrong: ["When animals pass immunity to humans", "When immunity is inherited from parents", "When everyone in a population has had the disease"], why: "Each infected person passes it to fewer than one other on average, so outbreaks die out — protecting even those who cannot be vaccinated. The proportion needed depends on how infectious the disease is." },
        { q: "Why can a vaccine sometimes cause mild symptoms?", a: "The immune system responds to the antigens as though to a real infection", wrong: ["The vaccine contains live disease-causing pathogens", "The vaccine damages white blood cells", "The needle causes an infection"], why: "A sore arm or a slight fever is the immune response itself, not the disease. It is why symptoms after a vaccination are usually mild and short-lived." },
        { q: "Why does the flu vaccine need to be given every year?", a: "The influenza virus mutates, so its antigens change", wrong: ["Antibodies are destroyed after a year", "The vaccine wears off after exactly one year", "The body forgets how to make antibodies"], why: "Memory cells recognise a specific antigen, and a mutated virus presents a different one, so old immunity no longer matches. Measles antigens barely change, which is why that vaccine lasts." },
        { q: "What might happen if vaccination rates fall significantly?", a: "Herd immunity is lost and outbreaks can occur", wrong: ["The pathogen becomes extinct", "Antibiotics stop working", "Everyone becomes naturally immune"], why: "Once enough susceptible people accumulate, a single case can spread. This is why measles reappears in communities where vaccination coverage drops." },
        { q: "Can antibiotics be used to prevent disease in the way vaccines do?", a: "No — antibiotics treat existing bacterial infections and have no effect on viruses", wrong: ["Yes, they work identically", "Yes, but only against viruses", "No, because antibiotics are harmful to all cells"], why: "Vaccination prepares the immune system in advance; antibiotics kill bacteria that are already present. Neither does the other's job, and neither works on the other's targets." },
        { q: "Why is it difficult to develop a vaccine against HIV?", a: "The virus mutates rapidly and attacks the immune cells themselves", wrong: ["HIV is a bacterium", "HIV has no antigens", "HIV is not infectious"], why: "A vaccine works by training the immune system, which is precisely the system HIV destroys, and rapid mutation means any target presented today may be gone tomorrow. Both problems have to be solved at once." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inf.antibiotics",
    subject: "biology",
    topic: "bio-infection",
    subtopic: "antibiotics",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What do antibiotics do?", a: "They kill bacteria inside the body without harming human cells", wrong: ["They kill viruses inside cells", "They relieve the symptoms of infection", "They stimulate the immune system"], why: "Antibiotics exploit differences between bacterial and human cells — penicillin, for instance, attacks the bacterial cell wall, which human cells do not have. Viruses reproduce inside our cells and offer no such target." },
        { q: "Why do antibiotics not work against viral infections?", a: "Viruses reproduce inside human cells, so killing them would damage the cells too", wrong: ["Viruses are too large", "Viruses have thicker cell walls", "Viruses are not alive"], why: "There is no separate viral machinery to attack in the way there is with a bacterium. This is why antivirals are far harder to develop and why prescribing antibiotics for a cold does nothing but breed resistance." },
        { q: "What do painkillers such as aspirin do?", a: "They relieve symptoms without killing the pathogen", wrong: ["They kill bacteria", "They kill viruses", "They stimulate antibody production"], why: "Treating the symptom leaves the immune system to deal with the cause. Confusing symptom relief with cure is why people sometimes expect a painkiller to shorten an illness." },
        { q: "How do bacteria become resistant to antibiotics?", a: "Random mutation produces resistant individuals, which survive and reproduce", wrong: ["Bacteria learn to avoid the antibiotic", "The antibiotic makes bacteria stronger", "Bacteria pass resistance to humans"], why: "This is natural selection at its clearest: the mutation happens by chance, and the antibiotic then selects for it. Overuse simply applies that selection more often." },
        { q: "Why should a course of antibiotics be completed even after symptoms improve?", a: "To kill the remaining bacteria before resistant ones can multiply", wrong: ["To build up immunity", "To prevent an allergic reaction", "So the drug does not go to waste"], why: "Feeling better means most bacteria are dead, not all of them, and the survivors are the least susceptible. Stopping early leaves exactly the population you least want to breed from." },
        { q: "Why is MRSA difficult to treat?", a: "It is resistant to many antibiotics, leaving few effective options", wrong: ["It is a virus", "It cannot be detected in the body", "It reproduces too slowly to be killed"], why: "Resistance accumulates over successive rounds of selection until few drugs remain. New antibiotics are developed slowly and expensively, so resistance is outpacing supply." },
        { q: "What can individuals do to slow the development of antibiotic resistance?", a: "Only use antibiotics when necessary and always finish the course", wrong: ["Take antibiotics for every illness", "Take a lower dose than prescribed", "Share antibiotics with family members"], why: "Every unnecessary course applies selection pressure for no benefit. Under-dosing is worse than not treating at all, because it kills the susceptible bacteria and spares the rest." },
        { q: "Where was penicillin discovered?", a: "In a mould, by Alexander Fleming", wrong: ["In a bacterium, by Louis Pasteur", "In a plant, by Joseph Lister", "In a virus, by Edward Jenner"], why: "Fleming noticed that Penicillium mould cleared the bacteria around it on a contaminated plate. Many antibiotics since have come from microorganisms that make them to compete with bacteria." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inf.drugs",
    subject: "biology",
    topic: "bio-infection",
    subtopic: "drug-development",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are new drugs tested for in preclinical trials?", a: "Toxicity, efficacy and dose, using cells, tissues and live animals", wrong: ["Only the price of manufacture", "Only whether patients like the taste", "Only the effect on healthy volunteers"], why: "Preclinical work happens before any human takes the drug, and it screens out most candidates. Healthy volunteers come later, in the first phase of clinical trials." },
        { q: "Why are new drugs first given to healthy volunteers at a very low dose?", a: "To check for harmful side effects before testing effectiveness", wrong: ["Because healthy people respond better", "To find the maximum possible dose immediately", "Because patients cannot consent"], why: "Safety comes before effectiveness, and a low starting dose limits the harm if something is wrong. Only after this do trials move to patients and to finding the optimum dose." },
        { q: "What is a placebo?", a: "A treatment with no active drug in it, used for comparison", wrong: ["A drug given at double the normal dose", "A drug that has failed testing", "The active drug given to the control group"], why: "People often improve simply because they are being treated, so a placebo separates the drug's effect from that. It is what makes a controlled trial informative." },
        { q: "What is a double-blind trial?", a: "Neither the patients nor the doctors know who receives the drug", wrong: ["The trial is run twice", "The patients cannot see the researchers", "Only the patients know what they are taking"], why: "Blinding the doctors matters as much as blinding the patients, because expectations affect how symptoms are recorded. It removes bias from both sides of the measurement." },
        { q: "Why do clinical trials take many years?", a: "Safety, effectiveness and dose must all be established in progressively larger groups", wrong: ["Drugs take years to manufacture", "Regulations require an exact ten-year wait", "Volunteers are hard to pay"], why: "Rare side effects only show up in large groups, and long-term effects only show up over time. The length of the process is a direct consequence of what it is trying to detect." },
        { q: "What must happen before a new drug can be prescribed?", a: "It must pass preclinical and clinical trials and be approved by regulators", wrong: ["It must be cheaper than existing drugs", "It must be tested only on animals", "It must be published in a newspaper"], why: "Approval depends on the evidence for safety and effectiveness, not on cost. Cost affects whether a health service chooses to buy it, which is a separate decision." },
        { q: "What is peer review, and why does it matter for drug research?", a: "Other scientists check the work before publication, which helps detect errors and false claims", wrong: ["Patients review their treatment", "The company checks its own results", "Regulators repeat the whole trial"], why: "Independent scrutiny catches mistakes and overstatement that the original researchers may not see. It is not a guarantee, but published results that have not been reviewed deserve far more caution." },
        { q: "Where did the drug digitalis originally come from?", a: "Foxglove plants", wrong: ["Willow bark", "Penicillium mould", "Bacteria in soil"], why: "Willow bark gave aspirin and Penicillium gave penicillin, so all three are examples of drugs first found in living organisms. Modern versions are synthesised, but the lead came from nature." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.inf.plant-disease",
    subject: "biology",
    topic: "bio-infection",
    subtopic: "plant-diseases",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What causes rose black spot?", a: "A fungus", wrong: ["A virus", "A bacterium", "A mineral deficiency"], why: "The fungus produces purple or black spots on leaves, which then drop, reducing photosynthesis and stunting growth. Fungicides and removing affected leaves both help." },
        { q: "What causes tobacco mosaic virus symptoms in plants?", a: "A virus that produces a mosaic pattern of discolouration on leaves", wrong: ["A fungus growing on the leaf surface", "A magnesium deficiency", "Aphids feeding on the sap"], why: "The discoloured areas contain less chlorophyll, so photosynthesis and growth are reduced. It affects a wide range of species, not only tobacco." },
        { q: "What does a nitrate deficiency cause in plants?", a: "Stunted growth, because nitrates are needed to make proteins", wrong: ["Yellow leaves, because nitrates make chlorophyll", "Wilting, because nitrates hold water", "Black spots on the leaves"], why: "Nitrate supplies the nitrogen for amino acids and therefore proteins, so a shortage limits the building of new tissue. Magnesium is the one needed for chlorophyll, and its deficiency causes yellowing." },
        { q: "What does a magnesium deficiency cause in plants?", a: "Chlorosis — yellowing of the leaves", wrong: ["Stunted growth with normal green leaves", "Black spots on the leaves", "Rapid excessive growth"], why: "Magnesium sits at the centre of the chlorophyll molecule, so without it the plant cannot make the pigment and the leaves pale. Distinguishing this from nitrate deficiency is the standard question." },
        { q: "How can plant diseases be identified?", a: "By reference to a gardening manual, laboratory testing or a monoclonal antibody test kit", wrong: ["Only by waiting for the plant to die", "Only by chemical analysis of the soil", "By measuring the plant's height"], why: "Visual identification is quick but unreliable; testing kits detect specific antigens and give a definite answer. Getting the identification right matters because the treatments differ completely." },
        { q: "What are the physical defences plants use against disease?", a: "A waxy cuticle, cell walls and layers of dead cells such as bark", wrong: ["Antibodies and antitoxins", "White blood cells in the sap", "Moving away from the pathogen"], why: "Plants have no immune system in the animal sense, so they rely on barriers plus chemical and mechanical adaptations. The waxy cuticle is the plant equivalent of skin." },
        { q: "Which of these is a chemical defence used by plants?", a: "Producing antibacterial compounds or poisons", wrong: ["Producing antibodies", "Producing white blood cells", "Producing stomach acid"], why: "Many familiar poisons and medicines started as plant chemical defences, including digitalis and quinine. Antibodies and white blood cells are animal defences only." },
        { q: "Which of these is a mechanical defence used by plants?", a: "Thorns, hairs and leaves that droop or curl when touched", wrong: ["Producing antibiotics", "Producing a waxy cuticle", "Closing the stomata at night"], why: "Mechanical defences deter herbivores rather than pathogens, and some also mimic other organisms to fool insects. The waxy cuticle counts as physical rather than mechanical." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
