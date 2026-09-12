/**
 * Biology: plants, and homeostasis and response.
 *
 * Two computed seams. The first is the inverse square law for light intensity,
 * which is the one piece of real physics in GCSE biology and the one students
 * most often reduce to "further away is dimmer" — the questions here use only
 * doublings and halvings so the factor of four is unmissable. The second is the
 * arithmetic of rates: bubbles per minute, water lost per hour, all built from
 * the rate outwards.
 *
 * Homeostasis is a single idea applied five times — detect a change, respond,
 * return to the set point — so the questions name that structure rather than
 * treating thermoregulation and blood glucose as separate lists.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, exact, num, slip, tidy, wrongOptions } from "./physics-kit";

/* ==========================================================================
   Data
   ========================================================================== */

const HORMONES = [
  { hormone: "insulin", gland: "pancreas", effect: "lowers blood glucose by making the liver store it as glycogen" },
  { hormone: "glucagon", gland: "pancreas", effect: "raises blood glucose by making the liver release stored glycogen" },
  { hormone: "adrenaline", gland: "adrenal glands", effect: "raises heart rate and blood glucose, preparing the body for action" },
  { hormone: "thyroxine", gland: "thyroid gland", effect: "controls the basal metabolic rate" },
  { hormone: "oestrogen", gland: "ovaries", effect: "causes the uterus lining to thicken and triggers the release of LH" },
  { hormone: "testosterone", gland: "testes", effect: "causes sperm production and male secondary sexual characteristics" },
  { hormone: "ADH", gland: "pituitary gland", effect: "makes the kidney tubules more permeable, so more water is reabsorbed" },
] as const;

const PLANT_TISSUES = [
  { tissue: "epidermal tissue", job: "Covers the leaf and is coated with a waxy cuticle to reduce water loss" },
  { tissue: "palisade mesophyll", job: "Packed with chloroplasts, and the main site of photosynthesis" },
  { tissue: "spongy mesophyll", job: "Contains air spaces so gases can diffuse to the photosynthesising cells" },
  { tissue: "xylem", job: "Carries water and mineral ions upwards from the roots" },
  { tissue: "phloem", job: "Carries dissolved sugars both up and down the plant" },
  { tissue: "meristem tissue", job: "Contains undifferentiated cells that can become any plant tissue" },
] as const;

/* Light intensity cases. Only doublings and halvings, so the inverse square
   factor is exactly four and the arithmetic stays mental. */
const LIGHT_CASES: { near: number; far: number; rateNear: number; rateFar: number }[] = (() => {
  const out: { near: number; far: number; rateNear: number; rateFar: number }[] = [];
  for (const near of [5, 10, 15, 20, 25]) {
    for (const rateNear of [16, 20, 24, 32, 40, 48, 60, 80, 100]) {
      const far = near * 2;
      const rateFar = rateNear / 4;
      if (!tidy(rateFar)) continue;
      out.push({ near, far, rateNear, rateFar });
    }
  }
  return out;
})();

/* ==========================================================================
   The generators
   ========================================================================== */

export const biologyPlants: Generator[] = [
  generator({
    key: "bio.plant.photosynthesis",
    subject: "biology",
    topic: "bio-plants",
    subtopic: "photosynthesis",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is the word equation for photosynthesis?", a: "Carbon dioxide + water → glucose + oxygen", wrong: ["Glucose + oxygen → carbon dioxide + water", "Carbon dioxide + oxygen → glucose + water", "Glucose + water → carbon dioxide + oxygen"], why: "Photosynthesis is the reverse of respiration in its inputs and outputs, which is exactly why the two get confused. Light energy is absorbed and stored in the glucose — it is not a reactant in the chemical sense but it is essential." },
        { q: "Where in a plant cell does photosynthesis take place?", a: "In the chloroplasts", wrong: ["In the mitochondria", "In the nucleus", "In the vacuole"], why: "Chloroplasts contain chlorophyll, which absorbs the light. Mitochondria do respiration — plants have both organelles because they do both processes." },
        { q: "Is photosynthesis endothermic or exothermic?", a: "Endothermic — it takes energy in", wrong: ["Exothermic — it releases energy", "Neither", "It depends on the time of day"], why: "The energy taken in from light is stored in the glucose, which is why the products contain more energy than the reactants. Respiration then releases it again." },
        { q: "What happens to the glucose a plant makes?", a: "It is used in respiration, or converted into starch, cellulose, lipids and amino acids", wrong: ["It is all used immediately in respiration", "It is stored as glycogen", "It is excreted through the leaves"], why: "Glucose is the raw material for almost everything the plant builds. It is stored as starch rather than glucose because starch is insoluble and so does not affect osmosis." },
        { q: "Why is glucose stored as starch rather than as glucose?", a: "Starch is insoluble, so it does not affect the water balance of the cell", wrong: ["Starch contains more energy per gram", "Glucose cannot be stored at all", "Starch is easier to transport"], why: "A high glucose concentration would draw water into the cell by osmosis. Storing it as an insoluble polymer solves that, which is also why animals use glycogen." },
        { q: "How could you test a leaf to show that photosynthesis has occurred?", a: "Test it for starch with iodine after removing the chlorophyll with boiling ethanol", wrong: ["Test it with limewater", "Test it with Benedict's solution without heating", "Weigh it before and after"], why: "Starch is the storage product, so its presence is evidence of photosynthesis. The ethanol step removes the green colour so the blue-black result is visible." },
        { q: "Why must a plant be destarched before a photosynthesis experiment?", a: "So any starch found afterwards must have been made during the experiment", wrong: ["To make the leaves greener", "To stop the plant respiring", "To remove the waxy cuticle"], why: "Without destarching, starch already present would give a positive result regardless of what the experiment did. Leaving the plant in the dark for a day or two uses up the existing store." },
        { q: "What does chlorophyll do?", a: "It absorbs light energy for photosynthesis", wrong: ["It absorbs carbon dioxide", "It transports water", "It stores glucose"], why: "Chlorophyll reflects green light, which is why leaves look green, and absorbs the red and blue wavelengths it uses. A variegated leaf photosynthesises only in the green parts, which is the standard experimental demonstration." },
        { q: "Why do plants need nitrate ions from the soil?", a: "To make amino acids and therefore proteins", wrong: ["To make chlorophyll", "To make glucose", "To absorb water"], why: "Photosynthesis provides carbon, hydrogen and oxygen but no nitrogen, so nitrogen must come from the soil. Magnesium is the ion needed for chlorophyll." },
        { q: "How does carbon dioxide reach the photosynthesising cells of a leaf?", a: "It diffuses in through the stomata and along the air spaces of the spongy mesophyll", wrong: ["It is absorbed by the roots and carried in the xylem", "It is made by the plant's mitochondria only", "It enters through the waxy cuticle"], why: "The whole leaf structure is built around getting gases in and light onto chloroplasts. Water comes from the roots; carbon dioxide comes from the air." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.plant.limiting",
    subject: "biology",
    topic: "bio-plants",
    subtopic: "limiting-factors",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form <= 1) {
        const c = rng.pick(LIGHT_CASES);

        if (form === 0) {
          const answer = ans(c.rateFar, "bubbles per minute");
          return {
            prompt:
              `Pondweed produces ${c.rateNear} bubbles per minute when a lamp is ${c.near} cm away. ` +
              `Assuming light is the only limiting factor, how many bubbles per minute would you expect at ${c.far} cm?`,
            answer,
            distractors: pickDistractors(answer, [
              slip(c.rateNear / 2, "bubbles per minute"), // halved rather than quartered
              slip(c.rateNear * 4, "bubbles per minute"), // applied the factor the wrong way
              slip(c.rateNear, "bubbles per minute"), // assumed no change
              slip(c.rateNear / 8, "bubbles per minute"),
            ]),
            explanation:
              `Light intensity follows an inverse square law: intensity ∝ 1 ÷ distance². ` +
              `Doubling the distance from ${c.near} cm to ${c.far} cm divides the intensity by 2² = 4, so the rate falls to ${c.rateNear} ÷ 4 = ${answer}. ` +
              `Halving the rate is the error to avoid — distance and intensity are not proportional.`,
            check: () => (agrees(c.rateNear / 4, c.rateFar) ? null : "the inverse square factor is wrong"),
          };
        }

        const answer = ans(c.rateNear, "bubbles per minute");
        return {
          prompt:
            `Pondweed produces ${num(c.rateFar)} bubbles per minute with a lamp ${c.far} cm away. ` +
            `Assuming light is the only limiting factor, what rate would you expect if the lamp is moved to ${c.near} cm?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(c.rateFar * 2, "bubbles per minute"), // doubled rather than quadrupled
            slip(c.rateFar / 4, "bubbles per minute"), // applied the factor the wrong way
            slip(c.rateFar, "bubbles per minute"), // assumed no change
            slip(c.rateFar * 8, "bubbles per minute"),
          ]),
          explanation:
            `Halving the distance multiplies the intensity by 2² = 4, so the rate rises to ${num(c.rateFar)} × 4 = ${answer}. ` +
            `The relationship is inverse SQUARE, so a small move close to the lamp changes the intensity far more than the same move further away.`,
          check: () => (agrees(c.rateFar * 4, c.rateNear) ? null : "the inverse square factor is wrong"),
        };
      }

      const cases = [
        { q: "What is a limiting factor?", a: "The factor in shortest supply, which is holding the rate back", wrong: ["Any factor that affects the rate", "The factor that is most plentiful", "A factor that stops the reaction entirely"], why: "At any moment one factor is the bottleneck, and increasing any of the others changes nothing. Which factor is limiting shifts as conditions change, which is why the graphs have a rising section and a plateau." },
        { q: "Which three factors can limit the rate of photosynthesis?", a: "Light intensity, carbon dioxide concentration and temperature", wrong: ["Light intensity, oxygen concentration and pH", "Water, oxygen and soil nitrate", "Temperature, humidity and wind speed"], why: "Chlorophyll level is sometimes counted as a fourth. Oxygen is a product rather than a requirement, and water is rarely limiting because a wilting plant closes its stomata first." },
        { q: "On a graph of photosynthesis rate against light intensity, what does the plateau indicate?", a: "Light is no longer the limiting factor — something else now is", wrong: ["The plant has died", "Light has become harmful", "The plant has run out of chlorophyll"], why: "The curve levels off because more light cannot help when carbon dioxide or temperature has become the bottleneck. Reading the plateau as damage rather than as a change of limiting factor is the standard misinterpretation." },
        { q: "Why does the rate of photosynthesis fall at very high temperatures?", a: "The enzymes controlling photosynthesis denature", wrong: ["Carbon dioxide evaporates", "Light cannot penetrate hot air", "The chlorophyll melts"], why: "Photosynthesis is a series of enzyme-controlled reactions, so it shows the same peak-shaped temperature curve as any enzyme process. Below the optimum, warmth helps; above it, the active sites lose their shape." },
        { q: "Why do greenhouse growers sometimes add carbon dioxide to the air?", a: "To remove carbon dioxide as a limiting factor and increase the rate of photosynthesis", wrong: ["To warm the greenhouse", "To kill pests", "To reduce water loss from the leaves"], why: "Greenhouses already control light and temperature, so carbon dioxide is often what remains limiting. The economics depend on whether the extra yield is worth the cost of the gas." },
        { q: "How does light intensity change as distance from a lamp doubles?", a: "It falls to one quarter", wrong: ["It halves", "It falls to one eighth", "It stays the same"], why: "The light spreads over a sphere whose area grows with the square of the radius, so intensity falls with the square of the distance. This is why the lamp distance in a pondweed experiment has to be measured carefully." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.plant.transport",
    subject: "biology",
    topic: "bio-plants",
    subtopic: "plant-transport",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What does the xylem transport?", a: "Water and dissolved mineral ions, upwards only", wrong: ["Dissolved sugars, in both directions", "Oxygen from the leaves to the roots", "Amino acids from the roots upwards"], why: "Xylem moves water up from the roots in a one-way stream driven by transpiration. Sugars go in the phloem, and that flow can run in either direction depending on where the plant needs them." },
        { q: "What does the phloem transport?", a: "Dissolved sugars, in both directions", wrong: ["Water only, upwards", "Mineral ions only, upwards", "Oxygen to the roots"], why: "Translocation moves sugar from where it is made or stored to where it is needed, which may be up towards a growing shoot or down towards a root. This two-way flow is the sharpest contrast with the xylem." },
        { q: "How is xylem tissue adapted to its function?", a: "It is made of dead hollow cells with no end walls, strengthened with lignin", wrong: ["It is made of living cells with sieve plates", "It has many mitochondria for active transport", "It is made of cells packed with chloroplasts"], why: "A continuous hollow tube offers the least resistance to flow, and lignin stops it collapsing under the tension. Sieve plates and living companion cells are phloem features." },
        { q: "How is phloem tissue adapted to its function?", a: "Living cells with perforated sieve plates, supported by companion cells", wrong: ["Dead hollow cells strengthened with lignin", "Cells packed with chloroplasts", "A single layer of cells with a waxy cuticle"], why: "Translocation is an active process, so the cells must be alive, and the companion cells supply the ATP. Sieve plates let the contents flow between cells while keeping the tube structured." },
        { q: "What drives the movement of water up the xylem?", a: "Transpiration pull, as water evaporates from the leaves", wrong: ["A pump in the roots", "Active transport in the xylem cells", "Gravity acting on the water column"], why: "Evaporation at the leaves puts the water column under tension, and cohesion between water molecules means the whole column is pulled up. The xylem cells are dead, so no pumping is possible." },
        { q: "Why is transport in phloem called translocation?", a: "Because sugars are moved from a source to a sink, in either direction", wrong: ["Because it only happens at night", "Because it moves water rather than sugar", "Because it uses no energy"], why: "The source is where sugar is made or released and the sink is where it is used or stored, and both can move around the plant with the seasons. Unlike the xylem's one-way stream, direction here depends on need." },
        { q: "Which tissue would you expect to contain more mitochondria, xylem or phloem?", a: "Phloem, because translocation is an active process", wrong: ["Xylem, because water moves against gravity", "Both equally", "Neither — plant tissues have no mitochondria"], why: "Xylem cells are dead and have no mitochondria at all. Water moves up the xylem without any energy input from the plant, driven entirely by evaporation." },
        { q: "How could you show that dissolved sugars travel in the phloem rather than the xylem?", a: "Remove a ring of bark, which contains phloem, and observe sugar accumulating above the cut", wrong: ["Measure the water loss from the leaves", "Place the stem in coloured dye and observe the leaves", "Count the stomata on the underside of a leaf"], why: "Ringing removes the phloem while leaving the xylem intact, so sugar transport stops but water transport continues. Coloured dye is the classic experiment for the xylem instead." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.plant.transpiration",
    subject: "biology",
    topic: "bio-plants",
    subtopic: "transpiration",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        /* Rate from a distance and a time, built from the rate. */
        const rate = rng.pick([0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 4, 5]);
        const minutes = rng.pick([2, 4, 5, 10, 20]);
        const distance = exact(rate * minutes, 2, "distance moved");
        const answer = ans(rate, "mm/min");
        return {
          prompt:
            `In a potometer, an air bubble moves ${num(distance)} mm in ${minutes} minutes. What is the rate of water uptake?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(minutes / distance, "mm/min"), // inverted the fraction
            slip(distance * minutes, "mm/min"), // multiplied instead of dividing
            slip(distance, "mm/min"), // gave the distance
            slip(rate / 2, "mm/min"),
          ]),
          explanation:
            `Rate = distance ÷ time = ${num(distance)} ÷ ${minutes} = ${answer}. ` +
            `A potometer measures water UPTAKE, which is slightly more than transpiration because some water is used in photosynthesis and to keep cells turgid — worth saying if a question asks what the apparatus actually measures.`,
          check: () => (agrees(rate * minutes, distance) ? null : "the rate does not reproduce the distance"),
        };
      }

      const cases = [
        { q: "What is transpiration?", a: "The evaporation of water from the leaves and its loss through the stomata", wrong: ["The absorption of water by the roots", "The movement of sugars in the phloem", "The uptake of carbon dioxide by the leaves"], why: "Transpiration is a consequence of having stomata open for gas exchange — the plant cannot let carbon dioxide in without letting water out. The transpiration stream that results is what pulls water up from the roots." },
        { q: "How does increasing temperature affect the transpiration rate?", a: "It increases it, because water evaporates faster", wrong: ["It decreases it, because stomata close", "It has no effect", "It increases it only at night"], why: "Warmer air holds more water and evaporation speeds up, so the rate rises. In extreme heat a plant may close its stomata to conserve water, which cuts transpiration at the cost of stopping photosynthesis." },
        { q: "How does increasing humidity affect the transpiration rate?", a: "It decreases it, because the concentration gradient for water vapour is smaller", wrong: ["It increases it", "It has no effect", "It stops it entirely"], why: "Transpiration is diffusion of water vapour out of the leaf, so a humid atmosphere flattens the gradient. This is why plants in a sealed bag lose very little water once the air inside is saturated." },
        { q: "How does wind affect the transpiration rate?", a: "It increases it, by removing the humid air next to the leaf", wrong: ["It decreases it, by cooling the leaf", "It has no effect", "It increases it only in the dark"], why: "Still air forms a humid layer at the leaf surface that slows further loss; wind sweeps it away and keeps the gradient steep. It is the same reason washing dries faster on a breezy day." },
        { q: "Where are stomata mostly found on a leaf, and why?", a: "On the lower surface, where they are shaded and lose less water", wrong: ["On the upper surface, to catch more light", "Evenly on both surfaces", "On the stem rather than the leaf"], why: "The upper surface is hotter and more exposed, so stomata there would lose water much faster. Floating plants such as water lilies reverse this, with stomata on top where the air is." },
        { q: "What controls the opening and closing of stomata?", a: "Guard cells, which change shape as they gain or lose water", wrong: ["The waxy cuticle", "The xylem vessels", "The palisade cells"], why: "Turgid guard cells bow apart and open the pore; flaccid ones close it. This gives the plant a way to trade gas exchange against water loss minute by minute." },
        { q: "Why do stomata usually close at night?", a: "Photosynthesis has stopped, so gas exchange is not needed and water can be conserved", wrong: ["To keep the leaf warm", "To let carbon dioxide in more easily", "To stop the phloem from working"], why: "Open stomata cost water, and the only reason to pay that cost is to let carbon dioxide in. In darkness there is nothing to gain, so the plant shuts them." },
        { q: "What is a potometer used to measure?", a: "The rate of water uptake by a plant shoot", wrong: ["The mass of water in a leaf", "The rate of photosynthesis", "The concentration of sugar in the phloem"], why: "It tracks a bubble moving along a capillary tube as the shoot draws water in. It is an approximation to transpiration rather than a direct measure of it, because a little water is used rather than lost." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.plant.tissues",
    subject: "biology",
    topic: "bio-plants",
    subtopic: "plant-tissues",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      const t = rng.pick(PLANT_TISSUES);
      const asked = rng.bool();

      if (asked) {
        const answer = t.job;
        return {
          prompt: `What is the function of ${t.tissue}?`,
          answer,
          distractors: wrongOptions(answer, PLANT_TISSUES.filter((x) => x.job !== t.job).map((x) => x.job)),
          explanation:
            `${answer}. ` +
            `A leaf is an organ built from these tissues in layers, arranged so light reaches the chloroplasts and gases reach the cells.`,
        };
      }

      const answer = t.tissue;
      return {
        prompt: `Which plant tissue has this function: ${t.job.toLowerCase()}?`,
        answer,
        distractors: wrongOptions(answer, PLANT_TISSUES.filter((x) => x.tissue !== t.tissue).map((x) => x.tissue)),
        explanation: `That is ${answer}. ${t.job}.`,
      };
    },
  }),

  generator({
    key: "bio.plant.hormones",
    subject: "biology",
    topic: "bio-plants",
    subtopic: "plant-hormones",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is a tropism?", a: "A growth response of a plant towards or away from a stimulus", wrong: ["A movement of a whole plant towards light", "A hormone produced by roots", "The rate at which a plant photosynthesises"], why: "The response is growth, not movement, which is why it is slow and permanent. Phototropism responds to light and gravitropism to gravity." },
        { q: "Which hormone controls phototropism in shoots?", a: "Auxin", wrong: ["Gibberellin", "Ethene", "Insulin"], why: "Auxin accumulates on the shaded side of a shoot, where it causes cells to elongate more, so the shoot bends towards the light. Insulin is an animal hormone and does not appear in plants at all." },
        { q: "How does auxin cause a shoot to bend towards light?", a: "It accumulates on the shaded side, where it makes cells elongate more", wrong: ["It accumulates on the lit side and speeds growth there", "It destroys cells on the shaded side", "It makes the shoot lean under its own weight"], why: "Unequal growth on the two sides produces the bend, so the faster-growing side ends up on the outside of the curve. In roots auxin has the opposite effect, inhibiting elongation, which is why roots bend the other way." },
        { q: "Why do roots grow downwards?", a: "Auxin gathers on the lower side and inhibits growth there, so the upper side grows faster", wrong: ["Auxin gathers on the lower side and speeds growth there", "Roots are heavier than shoots", "Roots grow away from water"], why: "The same hormone produces opposite responses in the two organs because root and shoot cells react to it differently. This is what lets one signal orient the whole plant correctly." },
        { q: "What is gibberellin used for commercially?", a: "To end seed dormancy, promote flowering and increase fruit size", wrong: ["To ripen fruit during transport", "To kill weeds selectively", "To root plant cuttings"], why: "Ethene ripens fruit, auxins are used as weedkillers and rooting powders, and gibberellins do the rest. Matching hormone to use is the standard question." },
        { q: "What is ethene used for commercially?", a: "To control the ripening of fruit during storage and transport", wrong: ["To kill weeds", "To promote root growth in cuttings", "To end seed dormancy"], why: "Fruit is picked unripe, transported cold, and then exposed to ethene to ripen on arrival. This is why supermarket fruit can travel a long way and still arrive undamaged." },
        { q: "How are auxins used as weedkillers?", a: "They make broad-leaved plants grow uncontrollably and die, leaving narrow-leaved crops unharmed", wrong: ["They stop all plants from photosynthesising", "They prevent seeds from germinating", "They dry out the soil"], why: "Selective weedkillers exploit a difference in sensitivity between the crop and the weed, so cereals survive while broad-leaved weeds are killed. The mechanism is disrupted growth rather than poisoning." },
        { q: "Why is rooting powder useful to a gardener?", a: "The auxin in it makes cuttings develop roots, so plants can be cloned easily", wrong: ["It kills fungi on the cutting", "It provides nitrates for growth", "It stops the cutting from wilting"], why: "Auxin promotes root formation, and because a cutting is genetically identical to the parent, this produces clones. Plants can do this because their meristem cells stay undifferentiated throughout life." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Homeostasis and response
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.homeo.nervous",
    subject: "biology",
    topic: "bio-homeostasis",
    subtopic: "nervous-system",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is homeostasis?", a: "The maintenance of a constant internal environment despite external changes", wrong: ["The growth of an organism over time", "The response of a plant to light", "The transfer of energy between organisms"], why: "Every homeostatic system has the same three parts: a receptor that detects the change, a coordination centre that processes it, and an effector that acts. Blood glucose, temperature and water balance are the same idea three times." },
        { q: "What makes up the central nervous system?", a: "The brain and the spinal cord", wrong: ["The brain and the sense organs", "The nerves and the muscles", "The spinal cord and the skin"], why: "The CNS is the coordination centre; everything else is peripheral, carrying information to and from it. Receptors and effectors sit outside it." },
        { q: "What is the role of a sensory neurone?", a: "To carry impulses from a receptor to the central nervous system", wrong: ["To carry impulses from the CNS to an effector", "To connect two neurones inside the CNS", "To detect the stimulus itself"], why: "The direction of travel is what names the neurone: sensory goes in, motor goes out, and relay connects them within the CNS. The receptor is a separate cell or structure that does the detecting." },
        { q: "What is an effector?", a: "A muscle or gland that carries out a response", wrong: ["A cell that detects a stimulus", "A neurone in the spinal cord", "A hormone in the blood"], why: "There are only two kinds of effector: muscles, which contract, and glands, which secrete. Whatever the stimulus, the response comes down to one of those two." },
        { q: "What happens at a synapse?", a: "A chemical is released, diffuses across the gap and triggers an impulse in the next neurone", wrong: ["The electrical impulse jumps the gap directly", "The two neurones fuse together", "The impulse is stopped permanently"], why: "The chemical step is what makes synapses slower than the rest of the pathway, and it is why they transmit in one direction only. Many drugs work by interfering with it." },
        { q: "Why is the nervous system faster than the hormonal system?", a: "Impulses travel electrically along neurones, whereas hormones travel in the bloodstream", wrong: ["Nerves are shorter than blood vessels", "Hormones are larger molecules", "The nervous system uses more energy"], why: "The trade-off is duration: nervous responses are fast and brief, hormonal ones slow and long-lasting. Which system a process uses tells you something about what it needs to do." },
        { q: "What is a receptor?", a: "A cell or structure that detects a stimulus", wrong: ["A muscle that responds to an impulse", "A neurone that connects to the brain", "A gland that secretes a hormone"], why: "Receptors are grouped in sense organs — light receptors in the eye, sound receptors in the ear — but they can also be scattered, as temperature receptors in the skin are." },
        { q: "In the pathway stimulus → response, what comes immediately after the receptor?", a: "A sensory neurone", wrong: ["An effector", "A motor neurone", "A gland"], why: "The order is stimulus, receptor, sensory neurone, coordination centre, motor neurone, effector, response. Writing it out in full is the reliable way to answer any question in this topic." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.homeo.reflex",
    subject: "biology",
    topic: "bio-homeostasis",
    subtopic: "reflex-arc",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Why are reflex actions faster than voluntary responses?", a: "The impulse does not travel to the conscious parts of the brain", wrong: ["Reflexes use hormones instead of neurones", "Reflex neurones are thicker", "Reflexes skip the effector"], why: "Bypassing conscious processing removes the slowest step, which is why you pull your hand from a hot object before you feel the pain. The pathway still includes a receptor, neurones and an effector." },
        { q: "What is the correct order of a reflex arc?", a: "Stimulus, receptor, sensory neurone, relay neurone, motor neurone, effector, response", wrong: ["Stimulus, motor neurone, relay neurone, sensory neurone, effector", "Receptor, effector, sensory neurone, motor neurone, response", "Stimulus, effector, relay neurone, receptor, response"], why: "Sensory in, relay across, motor out. The relay neurone sits in the spinal cord, which is what keeps the brain out of the loop." },
        { q: "Where is the relay neurone in a reflex arc found?", a: "In the spinal cord or unconscious part of the brain", wrong: ["In the muscle", "In the skin", "In the conscious part of the brain"], why: "Placing the connection in the spinal cord is what makes the reflex fast, since the impulse turns round before reaching the conscious brain. The brain is informed afterwards, which is why you feel the pain a moment later." },
        { q: "Why are reflex actions important?", a: "They protect the body from harm without waiting for a conscious decision", wrong: ["They allow the body to learn new skills", "They control the release of hormones", "They provide energy for movement"], why: "Speed is protective when the stimulus is dangerous. Some reflexes are not protective but automatic housekeeping, such as the pupil reflex or the control of breathing rate." },
        { q: "What happens at the junction between two neurones in a reflex arc?", a: "A neurotransmitter diffuses across the synapse and triggers an impulse in the next neurone", wrong: ["The impulse passes directly as electricity", "The neurones exchange nuclei", "The impulse is amplified by a hormone"], why: "There are two synapses in a typical reflex arc, and each adds a short delay. They also enforce one-way transmission, since only one side releases the chemical." },
        { q: "Which of these is a reflex action?", a: "Pulling your hand away from a hot object", wrong: ["Deciding to pick up a cup", "Writing your name", "Choosing what to eat"], why: "A reflex is automatic and involves no decision. The test is whether you could choose not to do it — you cannot choose to leave your hand on the hot object without deliberate effort against the reflex." },
        { q: "What is the effector in the reflex that narrows the pupil in bright light?", a: "The circular muscles of the iris", wrong: ["The optic nerve", "The retina", "The lens"], why: "The retina contains the receptors and the optic nerve carries the impulse, but the muscle is what acts. Naming the effector correctly means naming the muscle or gland, never the nerve." },
        { q: "Why does a reflex arc not involve the conscious brain?", a: "Involving it would slow the response and offer no benefit for a protective action", wrong: ["The brain cannot process pain", "The spinal cord blocks impulses to the brain", "The brain is too far from the spinal cord"], why: "The brain does receive the information, but only after the response has already begun. Nothing is blocked; the reflex simply does not wait." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.homeo.hormones",
    subject: "biology",
    topic: "bio-homeostasis",
    subtopic: "hormones",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 20,
    build: (rng) => {
      const h = rng.pick(HORMONES);
      const form = rng.int(0, 2);

      if (form === 0) {
        const answer = h.gland;
        return {
          prompt: `Which gland produces ${h.hormone}?`,
          answer,
          distractors: wrongOptions(answer, HORMONES.filter((x) => x.gland !== h.gland).map((x) => x.gland)),
          explanation: `${h.hormone.charAt(0).toUpperCase()}${h.hormone.slice(1)} is produced by the ${answer}, and it ${h.effect}.`,
        };
      }

      if (form === 1) {
        const answer = h.effect;
        return {
          prompt: `What does ${h.hormone} do?`,
          answer,
          distractors: wrongOptions(answer, HORMONES.filter((x) => x.effect !== h.effect).map((x) => x.effect)),
          explanation:
            `${h.hormone.charAt(0).toUpperCase()}${h.hormone.slice(1)}, from the ${h.gland}, ${answer}. ` +
            `Hormones travel in the blood, so they reach every cell but affect only those with the matching receptors.`,
        };
      }

      const answer = h.hormone;
      return {
        prompt: `Which hormone ${h.effect}?`,
        answer,
        distractors: wrongOptions(answer, HORMONES.filter((x) => x.hormone !== h.hormone).map((x) => x.hormone)),
        explanation: `That is ${answer}, produced by the ${h.gland}.`,
      };
    },
  }),

  generator({
    key: "bio.homeo.glucose",
    subject: "biology",
    topic: "bio-homeostasis",
    subtopic: "blood-glucose",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "Which organ monitors and controls blood glucose concentration?", a: "The pancreas", wrong: ["The liver", "The kidney", "The pituitary gland"], why: "The pancreas detects the change and releases insulin or glucagon; the liver is the effector that stores or releases the glucose. Keeping the detector and the effector apart is what makes this system make sense." },
        { q: "What does insulin do when blood glucose is too high?", a: "It makes liver and muscle cells take up glucose and store it as glycogen", wrong: ["It makes the liver release stored glucose", "It converts glucose into protein", "It causes glucose to be excreted in urine"], why: "Insulin lowers blood glucose by moving it out of the blood and into storage. Glucagon does the reverse, and the two together hold the concentration steady — a negative feedback loop." },
        { q: "What does glucagon do when blood glucose is too low?", a: "It makes the liver convert glycogen back into glucose and release it", wrong: ["It makes cells take up more glucose", "It converts protein into glycogen", "It stops the pancreas from working"], why: "Glucagon and glycogen are easy to confuse: glucagon is the hormone, glycogen the storage molecule. The hormone acts on the store." },
        { q: "What causes type 1 diabetes?", a: "The pancreas stops producing enough insulin", wrong: ["Body cells stop responding to insulin", "The liver stops storing glycogen", "Too much glucagon is produced"], why: "Type 1 is a failure of production and is treated with insulin injections. Type 2 is a failure of response, and is usually managed with diet, exercise and weight loss." },
        { q: "What causes type 2 diabetes?", a: "Body cells stop responding properly to insulin", wrong: ["The pancreas is destroyed at birth", "Too much insulin is produced", "The liver produces too much glycogen"], why: "The insulin is present but the cells ignore it, so glucose stays in the blood. Obesity is a major risk factor, which is why weight loss and exercise are the first-line treatment." },
        { q: "Why must a person with type 1 diabetes match their insulin dose to their meals and exercise?", a: "Too much insulin would drop blood glucose dangerously low", wrong: ["Insulin only works after eating", "Exercise destroys insulin", "Insulin is only needed at night"], why: "Both extremes are dangerous, so the dose has to track intake and activity. Exercise uses glucose, so it lowers the requirement — which is why it has to be planned for." },
        { q: "What is negative feedback?", a: "A control mechanism in which a change triggers a response that reverses it", wrong: ["A response that amplifies the original change", "A response that has no effect", "A hormone that blocks another hormone"], why: "Every homeostatic system works this way: high glucose triggers insulin, which lowers glucose, which switches insulin off. Amplification would be positive feedback, which is rare in homeostasis for obvious reasons." },
        { q: "How is glucose stored in the liver?", a: "As glycogen", wrong: ["As starch", "As cellulose", "As lipid only"], why: "Glycogen is the animal storage polymer, starch the plant one, and cellulose a structural molecule. Excess beyond what can be stored as glycogen is converted to lipid." },
        { q: "Why does someone with untreated diabetes have glucose in their urine?", a: "Blood glucose is so high that the kidneys cannot reabsorb it all", wrong: ["The kidneys stop working entirely", "Glucose is deliberately excreted as waste", "Insulin is excreted along with glucose"], why: "Normally the kidney reabsorbs all the filtered glucose, so none appears in urine. Above a threshold the reabsorption mechanism is saturated and the excess passes through — which is how diabetes was first diagnosed." },
        { q: "What happens to blood glucose during vigorous exercise?", a: "It falls as muscles respire, so glucagon is released to restore it", wrong: ["It rises, so glucagon is released", "It falls, so insulin is released", "It is unaffected by exercise"], why: "The direction of the change tells you which hormone responds: falling glucose calls for glucagon, rising glucose for insulin. Adrenaline also raises blood glucose during exertion." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.homeo.temperature",
    subject: "biology",
    topic: "bio-homeostasis",
    subtopic: "thermoregulation",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Which part of the brain monitors body temperature?", a: "The thermoregulatory centre in the hypothalamus", wrong: ["The cerebellum", "The pituitary gland", "The medulla"], why: "It monitors the temperature of the blood flowing through it and also receives impulses from temperature receptors in the skin. Both inputs matter: the core temperature is what must be controlled, but the skin gives early warning." },
        { q: "What happens to skin blood vessels when the body is too hot?", a: "They vasodilate, so more blood flows near the surface and more heat is lost", wrong: ["They vasoconstrict, reducing blood flow", "They move closer to the surface", "They carry less blood but move faster"], why: "The vessels do not move — the ones supplying surface capillaries widen so more blood passes through them. Describing it as vessels 'moving up and down' is the standard error." },
        { q: "How does sweating cool the body?", a: "Water evaporating from the skin takes energy with it", wrong: ["Sweat is colder than the body", "Sweat blocks heat from entering the skin", "Sweat reflects heat away"], why: "Evaporation requires energy, and it takes that energy from the skin. This is why sweating is much less effective in humid air, where evaporation is slow." },
        { q: "What happens to skin hairs when the body is too cold?", a: "Erector muscles contract and the hairs stand up, trapping an insulating layer of air", wrong: ["The hairs lie flat to reduce heat loss", "The hairs shed to conserve energy", "The hairs absorb heat from the air"], why: "The trapped air is the insulator, not the hair itself. It works far better in furry mammals than in humans, where the effect survives mainly as goosebumps." },
        { q: "Why does shivering warm the body?", a: "Muscles contract rapidly, and the respiration this needs releases heat", wrong: ["Movement generates friction against the air", "Shivering increases blood flow to the skin", "Shivering reduces sweating"], why: "Shivering is involuntary muscle contraction whose main product, from the body's point of view, is the waste heat of respiration. It is an expensive way to keep warm, which is why it feels exhausting." },
        { q: "What is vasoconstriction?", a: "The narrowing of blood vessels supplying skin capillaries, reducing heat loss", wrong: ["The widening of blood vessels near the skin", "The movement of blood vessels deeper into the skin", "The closing of sweat glands"], why: "Less blood at the surface means less heat radiated away, which is why skin looks pale in the cold. Vasodilation is the opposite response." },
        { q: "Why is a constant body temperature important?", a: "Enzymes work best at their optimum temperature and denature if it rises too far", wrong: ["It keeps the blood liquid", "It stops bacteria from growing", "It allows faster breathing"], why: "Every reaction in the body is enzyme-controlled, so the whole of metabolism depends on holding the temperature near 37 °C. A rise of a few degrees is dangerous precisely because denaturing is irreversible." },
        { q: "Is sweating an example of negative feedback?", a: "Yes — a rise in temperature triggers a response that lowers it", wrong: ["No — it makes the body hotter", "No — it is controlled by hormones", "Yes — it amplifies the temperature change"], why: "The response opposes the change that caused it, which is exactly what negative feedback means. Every homeostatic mechanism in the body follows the same pattern." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.homeo.kidneys",
    subject: "biology",
    topic: "bio-homeostasis",
    subtopic: "kidneys",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are the two main functions of the kidneys?", a: "To remove urea from the blood and to regulate water and ion levels", wrong: ["To produce urea and to store urine", "To digest protein and to absorb glucose", "To produce insulin and to filter oxygen"], why: "Urea is made in the liver, not the kidney — the kidney only removes it. Water balance is the other half of the job and is what ADH controls." },
        { q: "What happens during ultrafiltration in the kidney?", a: "Water, ions, glucose and urea are filtered out of the blood, while proteins and cells stay behind", wrong: ["Everything including proteins is filtered out", "Only urea is filtered out", "Only water is filtered out"], why: "The filter separates by size, so small molecules pass and large ones do not. Everything useful that gets through must then be reabsorbed, which is why filtration is followed by selective reabsorption." },
        { q: "What is selectively reabsorbed in the kidney tubules?", a: "All the glucose, plus the water and ions the body needs", wrong: ["Urea and excess water", "Proteins and blood cells", "Only urea"], why: "Glucose is reabsorbed completely, which is why it does not normally appear in urine. Urea is deliberately left behind — reabsorbing it would defeat the purpose." },
        { q: "Where is urea produced?", a: "In the liver, by the breakdown of excess amino acids", wrong: ["In the kidneys, by filtering blood", "In the bladder, from stored urine", "In the small intestine, during digestion"], why: "Deamination in the liver removes the amino group and produces ammonia, which is immediately converted to less toxic urea. The kidney's role is removal, not production." },
        { q: "Which part of the nephron is the target of ADH?", a: "The collecting duct and second convoluted tubule, whose permeability to water it raises", wrong: ["The glomerulus, where filtration happens", "The bladder, where urine is stored", "The renal artery, which supplies the kidney"], why: "ADH acts after filtration and after glucose reabsorption, on the last stretch where the final water content of the urine is decided. Filtration at the glomerulus is not hormonally adjusted at all." },
        { q: "What happens to ADH release when the blood is too concentrated?", a: "More ADH is released, so more water is reabsorbed and urine becomes concentrated", wrong: ["Less ADH is released", "ADH release stops entirely", "ADH is replaced by insulin"], why: "The response opposes the change, as in every negative feedback loop. Drinking a lot of water does the reverse: ADH falls and dilute urine is produced." },
        { q: "How does kidney dialysis work?", a: "Blood flows past a partially permeable membrane with dialysis fluid on the other side, so waste diffuses out", wrong: ["Blood is filtered through a fine mesh that removes all small molecules", "The blood is heated to destroy urea", "A machine adds insulin to the blood"], why: "The dialysis fluid contains the normal concentrations of glucose and ions, so those do not diffuse out, while it contains no urea, so urea does. The gradients are engineered to keep what is wanted and remove what is not." },
        { q: "What is one advantage of a kidney transplant over dialysis?", a: "It frees the patient from regular treatment sessions and dietary restriction", wrong: ["There is no risk of rejection", "No surgery is required", "It works for a guaranteed lifetime"], why: "A transplant restores continuous kidney function rather than intermittent treatment. The cost is immunosuppressant drugs to prevent rejection, and donor organs are scarce and do not last indefinitely." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.homeo.water",
    subject: "biology",
    topic: "bio-homeostasis",
    subtopic: "water-balance",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "How does the body lose water other than in urine?", a: "Through sweat, breathed-out air and faeces", wrong: ["Only through sweat", "Only through the skin", "Through the liver"], why: "None of these losses is controlled — the body cannot decide to sweat less to save water without overheating. Only urine volume is adjustable, which is why the kidney does the balancing." },
        { q: "Why is it important to control the water content of the blood?", a: "Cells would gain or lose water by osmosis and stop working properly", wrong: ["Water carries oxygen to the cells", "Water is needed to make urea", "Blood would freeze if too dilute"], why: "Too dilute and cells swell; too concentrated and they shrink. Either way the enzymes inside stop working at their normal rate, which is why the concentration is held so tightly." },
        { q: "What happens to urine volume on a hot day when you sweat a lot?", a: "It decreases, as more water is reabsorbed to compensate for sweat losses", wrong: ["It increases", "It stays the same", "It stops entirely"], why: "Sweating removes water the body cannot recover, so the kidney compensates by conserving what it can. The urine becomes smaller in volume and darker in colour." },
        { q: "What happens to urine after drinking a large volume of water?", a: "More dilute urine is produced, because less ADH is released", wrong: ["More concentrated urine is produced", "Urine production stops for several hours", "More urea is excreted"], why: "Diluted blood means less ADH, less water reabsorbed and a larger volume of pale urine. The amount of urea excreted does not change — only the water it is dissolved in." },
        { q: "What is deamination?", a: "The removal of the amino group from excess amino acids in the liver", wrong: ["The removal of urea from the blood by the kidney", "The breakdown of glucose in respiration", "The formation of protein from amino acids"], why: "Amino acids cannot be stored, so the excess must be dealt with. Deamination produces ammonia, which is converted at once to the far less toxic urea." },
        { q: "Why is ammonia converted into urea?", a: "Ammonia is highly toxic and urea is much less so", wrong: ["Urea contains more energy", "Ammonia cannot dissolve in blood", "Urea can be reabsorbed by the kidney"], why: "The conversion happens immediately in the liver, so ammonia never accumulates. Urea is deliberately not reabsorbed — the whole point is to excrete it." },
        { q: "Which organ removes carbon dioxide from the body?", a: "The lungs", wrong: ["The kidneys", "The liver", "The skin"], why: "Excretion is the removal of metabolic waste, and each waste product has its own route: carbon dioxide via the lungs, urea via the kidneys. Faeces are egested rather than excreted, since the material was never part of the body's metabolism." },
        { q: "Why do the ion levels in the blood need to be controlled?", a: "Wrong ion concentrations disturb osmosis and affect nerve and muscle function", wrong: ["Ions are needed to make urea", "Ions carry oxygen in the blood", "Ions provide energy for respiration"], why: "Ions determine the water potential of the blood, and sodium and potassium in particular are essential to nerve impulses. Excess ions are lost in urine along with excess water." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
