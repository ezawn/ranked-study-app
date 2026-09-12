/**
 * Biology: ecology, and populations and communities.
 *
 * Three computed seams, all built from the answer outwards. Energy transfer
 * efficiency is a percentage of a percentage and invites the same two errors
 * every time — dividing the wrong way round, and forgetting the ×100. Quadrat
 * estimates are a scale-up whose difficulty is entirely in the ratio of areas.
 * And Hardy-Weinberg only works without a calculator if q² is a perfect square
 * of a one-decimal number, so every case here is generated from q.
 *
 * The recall content is organised around interdependence: what happens to X if
 * Y changes. That is what ecology questions actually ask, and it is a different
 * skill from naming the parts of a food chain.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, exact, num, slip, tidy, wrongOptions } from "./physics-kit";

/* ==========================================================================
   Data
   ========================================================================== */

/* Hardy-Weinberg cases. q is chosen to one decimal place, so q², p² and 2pq are
   all exact to two — which is what makes the question answerable in the head. */
const HW_CASES: { q: number; p: number; qq: number; pp: number; het: number }[] = (() => {
  const out: { q: number; p: number; qq: number; pp: number; het: number }[] = [];
  for (const q of [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]) {
    const p = exact(1 - q, 2, "p");
    const qq = exact(q * q, 2, "q squared");
    const pp = exact(p * p, 2, "p squared");
    const het = exact(2 * p * q, 2, "heterozygote frequency");
    if (!tidy(qq) || !tidy(pp) || !tidy(het)) continue;
    /* q = 0.5 is excluded above because it makes p = q and p² = q², which
       collapses three of the four distractors onto the answer. */
    if (agrees(p, q) || agrees(pp, qq) || agrees(het, q) || agrees(het, p)) continue;
    out.push({ q, p, qq, pp, het });
  }
  return out;
})();

/* Energy transfer cases: an efficiency and the energy at the lower level, so
   the energy at the higher one follows exactly. */
const ENERGY_CASES: { available: number; efficiency: number; transferred: number }[] = (() => {
  const out: { available: number; efficiency: number; transferred: number }[] = [];
  for (const available of [1000, 2000, 4000, 5000, 8000, 10000, 20000, 50000]) {
    for (const efficiency of [1, 2, 4, 5, 10, 20, 25]) {
      const transferred = (available * efficiency) / 100;
      if (!tidy(transferred)) continue;
      out.push({ available, efficiency, transferred });
    }
  }
  return out;
})();

/* ==========================================================================
   The generators
   ========================================================================== */

export const biologyEcology: Generator[] = [
  generator({
    key: "bio.eco.ecosystems",
    subject: "biology",
    topic: "bio-ecology",
    subtopic: "ecosystems",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is an ecosystem?", a: "The interaction of a community of living organisms with the non-living parts of their environment", wrong: ["All the organisms of one species in an area", "All the living organisms in an area", "The non-living parts of an area only"], why: "The word covers both halves — the community AND the physical environment — and specifically their interaction. A community alone is just the living part." },
        { q: "What is a population?", a: "All the organisms of one species living in a habitat", wrong: ["All the organisms of all species in a habitat", "One organism and its offspring", "The non-living parts of a habitat"], why: "Population is one species; community is all of them together. Getting this pair the right way round is the foundation for everything else in ecology." },
        { q: "What is a community?", a: "All the populations of different species living in a habitat", wrong: ["One population of a single species", "The physical conditions of a habitat", "A group of ecosystems"], why: "The community is the living component of an ecosystem, and adding the abiotic factors makes it an ecosystem. Populations are its building blocks." },
        { q: "Which of these is an abiotic factor?", a: "Light intensity", wrong: ["Availability of food", "Number of predators", "New pathogens"], why: "Abiotic means non-living: light, temperature, moisture, pH, wind, carbon dioxide and oxygen levels. Food, predators, competitors and pathogens are all biotic because they involve other organisms." },
        { q: "Which of these is a biotic factor?", a: "The number of predators", wrong: ["Soil pH", "Wind intensity", "Moisture level"], why: "Biotic factors are living: competition, predation, pathogens and food availability. The test is whether another organism is involved." },
        { q: "What does interdependence mean in an ecosystem?", a: "Species depend on each other for food, shelter, pollination and seed dispersal", wrong: ["Species live entirely independently", "Only predators depend on other species", "Species compete but never co-operate"], why: "Because species depend on one another, removing one can affect many others. This is why the loss of a pollinator can matter far more than its own numbers suggest." },
        { q: "What is a stable community?", a: "One in which the species and environmental factors are in balance, so population sizes stay roughly constant", wrong: ["One in which no organisms ever die", "One with only one species", "One that never changes at all"], why: "Stability means fluctuating around a level rather than being frozen. Oak woodland and tropical rainforest are the standard examples." },
        { q: "What do plants compete with each other for?", a: "Light, space, water and mineral ions from the soil", wrong: ["Mates, territory and food", "Only water", "Prey and shelter"], why: "Plants make their own food, so they never compete for it. Animals compete for food, mates and territory instead — the two lists barely overlap." },
        { q: "What do animals compete with each other for?", a: "Food, mates and territory", wrong: ["Light and mineral ions", "Carbon dioxide and water only", "Nothing — animals do not compete"], why: "Territory usually secures the other two, which is why so much animal behaviour is about defending it. Plants compete for light and soil resources instead." },
        { q: "What does it mean for an organism to be adapted to its environment?", a: "It has features that allow it to survive in the conditions where it normally lives", wrong: ["It can change its features during its lifetime", "It survives in any environment", "It has no competitors"], why: "Adaptations may be structural, behavioural or functional, and extremophiles show how far this can go. The features are inherited, not developed on demand." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.eco.food-chains",
    subject: "biology",
    topic: "bio-ecology",
    subtopic: "food-chains",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form <= 1) {
        const c = rng.pick(ENERGY_CASES);

        if (form === 0) {
          const answer = ans(c.efficiency, "%");
          return {
            prompt:
              `A trophic level receives ${num(c.available)} kJ of energy, and ${num(c.transferred)} kJ is transferred to the next level. ` +
              `What percentage of the energy is transferred?`,
            answer,
            distractors: pickDistractors(answer, [
              slip((c.available / c.transferred) * 100, "%"), // inverted the fraction
              slip(c.transferred / c.available, "%"), // forgot the ×100
              slip(c.transferred, "%"), // gave the energy as a percentage
              slip(100 - c.efficiency, "%"), // gave the energy lost instead
            ]),
            explanation:
              `Efficiency = energy transferred ÷ energy available × 100 = ${num(c.transferred)} ÷ ${num(c.available)} × 100 = ${answer}. ` +
              `Around 10% is typical between levels, and the other 90% is lost as heat from respiration, in movement, and in the parts not eaten or not digested. ` +
              `This is why food chains rarely have more than four or five levels.`,
            check: () => (agrees((c.transferred / c.available) * 100, c.efficiency) ? null : "the efficiency does not reproduce"),
          };
        }

        const answer = ans(c.transferred, "kJ");
        return {
          prompt:
            `A trophic level receives ${num(c.available)} kJ of energy. If ${c.efficiency}% is transferred to the next level, how much energy does that level receive?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(c.available * c.efficiency, "kJ"), // forgot to divide by 100
            slip(c.available - c.transferred, "kJ"), // gave the energy lost
            slip(c.available / c.efficiency, "kJ"), // divided by the percentage
            slip(c.available, "kJ"),
          ]),
          explanation:
            `${c.efficiency}% of ${num(c.available)} kJ = ${num(c.available)} × ${c.efficiency} ÷ 100 = ${answer}. ` +
            `The remaining ${num(c.available - c.transferred)} kJ is lost, mostly as heat from respiration — which is why a pyramid of biomass narrows so sharply.`,
          check: () => (agrees((c.transferred / c.available) * 100, c.efficiency) ? null : "the transferred energy does not match the percentage"),
        };
      }

      const cases = [
        { q: "What is a producer?", a: "An organism that makes its own food, usually by photosynthesis", wrong: ["An organism that eats plants", "An organism that breaks down dead material", "The top predator in a food chain"], why: "Producers are the entry point for energy into almost every ecosystem, converting light into chemical energy. Everything above them depends on what they capture." },
        { q: "What does an arrow in a food chain represent?", a: "The direction in which energy and biomass flow", wrong: ["Which organism eats which, pointing at the prey", "The order in which organisms evolved", "The direction the animals move"], why: "The arrow points from the eaten to the eater, following the energy. Drawing them the other way round is the classic error and reverses the whole meaning of the diagram." },
        { q: "Why do food chains rarely have more than five trophic levels?", a: "Only about 10% of energy passes to each level, so there is too little left to support another", wrong: ["Predators refuse to eat other predators", "There are not enough species", "Energy increases at each level, causing overcrowding"], why: "Starting from a large amount at the producer level, five transfers at 10% leaves a ten-thousandth. There is simply not enough energy left to support a viable population." },
        { q: "How is energy lost between trophic levels?", a: "As heat from respiration, in movement, and in uneaten or undigested material", wrong: ["It is destroyed", "It is converted into new species", "It escapes into space directly"], why: "Energy is never destroyed — it is transferred to the surroundings in forms the next level cannot use. Faeces and urine also carry energy away, which decomposers then exploit." },
        { q: "What is a decomposer?", a: "An organism that breaks down dead material, releasing nutrients back into the ecosystem", wrong: ["An organism that eats only plants", "A producer that has died", "A predator at the top of a food chain"], why: "Bacteria and fungi are the main decomposers, and without them nutrients would stay locked in dead bodies. They are what connects the end of a food chain back to the start." },
        { q: "What is a trophic level?", a: "A feeding level in a food chain", wrong: ["A type of habitat", "A measure of population size", "The energy content of an organism"], why: "Producers are level 1, primary consumers level 2, and so on. Decomposers are usually shown separately because they act on every level." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.eco.biodiversity",
    subject: "biology",
    topic: "bio-ecology",
    subtopic: "biodiversity",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is biodiversity?", a: "The variety of different species of all living organisms in an ecosystem or on Earth", wrong: ["The number of individuals of one species", "The total mass of living material", "The number of habitats in a country"], why: "It is about the variety of species, not their abundance. High biodiversity makes an ecosystem more stable, because species depend less on any one other species." },
        { q: "Why does high biodiversity make an ecosystem more stable?", a: "Species are less dependent on any single other species for food or shelter", wrong: ["More species means more competition", "Larger populations resist disease", "It reduces the number of predators"], why: "Redundancy is the point: if one species declines, others can take its place in the web. A simple ecosystem has no such backup, which is why monocultures are so fragile." },
        { q: "How does deforestation reduce biodiversity?", a: "It destroys habitats, so species that depend on them are lost", wrong: ["It increases carbon dioxide only", "It cools the local climate", "It has no effect on species numbers"], why: "Habitat loss is the leading cause of extinction worldwide. Deforestation also releases carbon dioxide and reduces the uptake of it, so it affects climate as well." },
        { q: "How does the destruction of peat bogs affect the atmosphere?", a: "Decay or burning of the peat releases stored carbon dioxide", wrong: ["It absorbs carbon dioxide faster", "It has no effect on carbon dioxide", "It releases oxygen"], why: "Peat is partly decayed plant material that has accumulated over thousands of years because waterlogged conditions prevent full decay. Draining or burning it releases carbon that had been locked away." },
        { q: "What is one way of maintaining biodiversity?", a: "Breeding programmes for endangered species and protecting rare habitats", wrong: ["Introducing new species from other countries", "Increasing the use of fertilisers", "Removing predators from ecosystems"], why: "Field margins, hedgerows, habitat protection and reducing deforestation all help. Introducing non-native species usually reduces biodiversity by outcompeting what is already there." },
        { q: "Why does a growing human population threaten biodiversity?", a: "More land is used for building, farming and waste, and more resources are consumed", wrong: ["Humans eat all other species", "Humans produce more oxygen", "Population size has no effect on biodiversity"], why: "The pressure comes through land use, pollution and resource extraction rather than direct predation. Rising standards of living increase resource use per person as well." },
        { q: "What is the effect of releasing untreated sewage into a river?", a: "Bacteria multiply and use up the oxygen, killing fish and other aquatic life", wrong: ["The river becomes more oxygenated", "Only the appearance of the water changes", "It increases biodiversity"], why: "The nutrients feed microorganisms whose respiration strips the oxygen from the water. Fertiliser runoff causes the same problem by a slightly longer route, through algal growth." },
        { q: "Why do scientists monitor lichen or invertebrate species in a habitat?", a: "They are indicator species whose presence or absence signals pollution levels", wrong: ["They are the most numerous species", "They are the easiest to catch", "They have no ecological role"], why: "Lichens are sensitive to sulfur dioxide in air and certain invertebrates to oxygen levels in water, so their distribution maps pollution. It is a cheap and continuous alternative to chemical testing." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.eco.carbon",
    subject: "biology",
    topic: "bio-ecology",
    subtopic: "carbon-cycle",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "Which process removes carbon dioxide from the atmosphere?", a: "Photosynthesis", wrong: ["Respiration", "Combustion", "Decomposition"], why: "Photosynthesis is the only major process that takes carbon dioxide out; respiration, combustion and decay all put it back. The balance between them is what determines atmospheric levels." },
        { q: "Which processes return carbon dioxide to the atmosphere?", a: "Respiration, combustion and decomposition", wrong: ["Photosynthesis only", "Photosynthesis and respiration", "Only the burning of fossil fuels"], why: "All three release the carbon that photosynthesis captured. Decomposition matters because it returns the carbon in dead material rather than leaving it locked away." },
        { q: "What is the role of decomposers in the carbon cycle?", a: "They break down dead organisms and waste, releasing carbon dioxide through their respiration", wrong: ["They store carbon permanently", "They convert carbon dioxide into glucose", "They have no role in the carbon cycle"], why: "Without decomposers, carbon would accumulate in dead material and the cycle would stall. They also release the mineral nutrients plants need." },
        { q: "How did fossil fuels form?", a: "From the remains of organisms that did not fully decay, compressed over millions of years", wrong: ["From volcanic rock", "From carbon dioxide dissolving in the sea", "From decomposed material within a few decades"], why: "Burning them releases carbon that has been out of the cycle for hundreds of millions of years, which is why it adds to atmospheric levels rather than simply circulating." },
        { q: "Why does burning fossil fuels increase atmospheric carbon dioxide?", a: "It releases carbon that had been locked away for millions of years", wrong: ["It destroys plants that would absorb it", "It creates new carbon atoms", "It stops photosynthesis from happening"], why: "The carbon cycle is roughly balanced on short timescales; fossil fuels inject carbon from outside that balance. Deforestation adds to the problem by removing the plants that would absorb some of it." },
        { q: "How is carbon transferred from plants to animals?", a: "Animals eat plants and take in the carbon compounds they contain", wrong: ["Animals absorb carbon dioxide directly from plants", "Carbon is transferred through the soil", "It is not transferred between them"], why: "Feeding moves carbon along the food chain in the form of carbohydrates, proteins and lipids. Some of it is respired back to the atmosphere at each level." },
        { q: "What happens to the carbon in an organism when it dies?", a: "Decomposers release it as carbon dioxide, or it may form fossil fuels if decay is prevented", wrong: ["It disappears entirely", "It stays in the body forever", "It is converted directly into oxygen"], why: "Which of the two routes the carbon takes depends on the conditions: normal decay returns it quickly, while waterlogged or anoxic conditions can lock it away for a very long time." },
        { q: "Why is the carbon cycle described as a cycle?", a: "The same carbon atoms are used repeatedly, moving between the atmosphere, living things and the ground", wrong: ["Carbon is created and destroyed repeatedly", "It happens once a year", "Only plants take part in it"], why: "There is a fixed stock of carbon and it circulates rather than being made or used up. Human activity has not created carbon but has moved a large amount of it from long-term storage into circulation." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.eco.water",
    subject: "biology",
    topic: "bio-ecology",
    subtopic: "water-cycle",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What drives the water cycle?", a: "Energy from the Sun, which evaporates water", wrong: ["Energy from the Earth's core", "The respiration of plants", "The rotation of the Earth"], why: "Solar energy evaporates water from oceans, lakes and land, and it condenses as it rises and cools. Everything else in the cycle follows from that first step." },
        { q: "What is transpiration's role in the water cycle?", a: "It returns water from plants to the atmosphere as vapour", wrong: ["It moves water from the air into the soil", "It converts water into glucose", "It has no role in the cycle"], why: "Over a forest, transpiration can contribute a large share of the water vapour in the air above it. This is why deforestation can reduce local rainfall." },
        { q: "What happens during condensation in the water cycle?", a: "Water vapour cools and forms droplets, making clouds", wrong: ["Liquid water turns to vapour", "Water soaks into the ground", "Water is absorbed by plants"], why: "Air cools as it rises, and cooler air holds less vapour, so the excess condenses onto tiny particles. Precipitation follows when the droplets grow heavy enough." },
        { q: "Why is fresh water important to living organisms?", a: "Most organisms need it for cell processes and cannot use salt water directly", wrong: ["It contains more oxygen than salt water", "It is easier to store", "It weighs less than salt water"], why: "The salt in seawater would draw water out of cells by osmosis. Fresh water is a small fraction of the Earth's total, and much of it is frozen or underground." },
        { q: "How can potable water be produced from salty water?", a: "By desalination, using distillation or reverse osmosis", wrong: ["By filtration alone", "By adding chlorine", "By boiling and collecting the residue"], why: "The salt has to be separated from the water, not just filtered out, so distillation or a membrane process is needed. Both use a great deal of energy, which is why desalination is expensive." },
        { q: "What does potable water mean?", a: "Water that is safe to drink", wrong: ["Water that is chemically pure", "Water that has been boiled", "Water taken from a river"], why: "Potable water contains dissolved substances but at safe levels, so it is not the same as pure water. Chemically pure water would be undrinkably flat and is not the aim." },
        { q: "Why is sewage treated before being released?", a: "To remove organic matter and harmful microorganisms", wrong: ["To add nutrients to rivers", "To make it drinkable immediately", "To increase its temperature"], why: "Untreated sewage feeds bacteria whose respiration strips oxygen from the water and can carry pathogens. Treatment removes solids, digests the organic matter and kills the microorganisms." },
        { q: "Where does most of the water in the water cycle evaporate from?", a: "The oceans", wrong: ["Plants", "Rivers", "Ice caps"], why: "Oceans cover most of the Earth's surface, so they dominate evaporation. Transpiration from plants matters locally, especially over forests, but is small in the global total." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.eco.sampling",
    subject: "biology",
    topic: "bio-ecology",
    subtopic: "sampling",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        /* Population estimate from a mean count. Built so the scale-up is exact. */
        const mean = rng.pick([2, 3, 4, 5, 6, 8, 10, 12]);
        const quadratArea = rng.pick([1, 4]);
        const totalArea = rng.pick([100, 200, 400, 500, 1000, 2000]);
        const estimate = exact((mean * totalArea) / quadratArea, 0, "population estimate");
        const answer = ans(estimate);
        return {
          prompt:
            `A student counts a mean of ${mean} daisies per ${quadratArea} m² quadrat. ` +
            `What is the estimated population in a field of ${num(totalArea)} m²?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(mean * totalArea * quadratArea, ""), // multiplied by the quadrat area
            slip(totalArea / mean, ""), // divided the wrong way
            slip(mean, ""), // gave the mean
            slip(estimate / 2, ""),
          ]),
          explanation:
            `Scale the mean up by the ratio of areas: ${mean} × ${num(totalArea)} ÷ ${quadratArea} = ${answer}. ` +
            `The estimate is only as good as the sampling — quadrats must be placed randomly, and more of them gives a more reliable mean.`,
          check: () => (agrees((estimate * quadratArea) / totalArea, mean) ? null : "the estimate does not scale back to the mean"),
        };
      }

      if (form === 1) {
        /* A mean from a small set of counts, chosen so the division is exact. */
        const counts = rng.pick([
          [4, 6, 8, 6],
          [2, 5, 3, 6],
          [10, 12, 14, 8],
          [1, 3, 5, 7],
          [9, 11, 7, 13],
          [6, 6, 9, 3],
          [15, 20, 25, 20],
        ]);
        const total = counts.reduce((a, b) => a + b, 0);
        const mean = exact(total / counts.length, 2, "mean count");
        const answer = ans(mean);
        return {
          prompt: `Quadrat counts of ${counts.join(", ")} are recorded. What is the mean number per quadrat?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(total, ""), // gave the total
            slip(counts.length, ""), // gave the number of quadrats
            slip(Math.max(...counts), ""), // gave the largest count
            slip(total / (counts.length - 1), ""), // divided by one too few
          ]),
          explanation:
            `Mean = total ÷ number of quadrats = ${total} ÷ ${counts.length} = ${answer}. ` +
            `Divide by how many readings there are, not by one fewer — the range and the mean are different summaries and it is worth quoting both.`,
          check: () => (agrees(mean * counts.length, total) ? null : "the mean does not reproduce the total"),
        };
      }

      const cases = [
        { q: "Why must quadrats be placed randomly?", a: "To avoid bias, so the sample represents the whole area", wrong: ["To make counting faster", "To find the areas with the most organisms", "To keep the quadrats the same size"], why: "Choosing where to put a quadrat, even unconsciously, tends to favour interesting patches. Random coordinates from a random number generator remove that influence." },
        { q: "When would you use a transect rather than random quadrats?", a: "When investigating how distribution changes along an environmental gradient", wrong: ["When the area is very large", "When you want an unbiased estimate of total population", "When there are no plants present"], why: "A transect line running from a shaded area to an open one, or up a beach, deliberately samples systematically rather than randomly — because the question is about the pattern, not the total." },
        { q: "How does increasing the number of quadrats affect an estimate?", a: "It makes the estimate more reliable", wrong: ["It makes the estimate larger", "It makes the estimate smaller", "It has no effect"], why: "A larger sample reduces the influence of chance variation between quadrats. It does not systematically raise or lower the answer, only tightens it." },
        { q: "What does a quadrat measure?", a: "The number or percentage cover of organisms in a known area", wrong: ["The mass of organisms in an area", "The height of plants", "The pH of the soil"], why: "Percentage cover is used when individuals cannot be counted, as with grass or moss. Either way the point is a count per unit area that can be scaled up." },
        { q: "Why is a mean used rather than a single quadrat count?", a: "Individual quadrats vary, so a mean gives a more representative value", wrong: ["A single count is impossible to make", "The mean is always larger", "It makes the calculation easier"], why: "Organisms are rarely spread evenly, so any one quadrat may be unusually rich or poor. Averaging several smooths that out." },
        { q: "What is a belt transect?", a: "A series of quadrats placed at intervals along a line", wrong: ["A single very large quadrat", "A line with no quadrats, recording only what it touches", "A random arrangement of quadrats"], why: "The belt transect adds abundance data to the line, so you can see both what is present and how much. A line transect records only what the line itself crosses." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.eco.human-impact",
    subject: "biology",
    topic: "bio-ecology",
    subtopic: "human-impact",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "How does fertiliser runoff damage a river?", a: "It causes algae to grow, which blocks light and then decays, using up oxygen", wrong: ["It poisons fish directly", "It makes the water too acidic", "It removes all nutrients from the water"], why: "Eutrophication runs in stages: nutrients, algal bloom, light blocked, plants die, bacteria decompose them and strip the oxygen, fish suffocate. The fertiliser itself is not the poison." },
        { q: "What causes acid rain?", a: "Sulfur dioxide and nitrogen oxides from burning fossil fuels dissolving in rainwater", wrong: ["Carbon dioxide alone", "Methane from cattle", "Chlorofluorocarbons"], why: "Acid rain damages trees and acidifies lakes, killing fish. Carbon dioxide does make rain slightly acidic naturally, but the damaging acidity comes from sulfur and nitrogen oxides." },
        { q: "Which gases are the main contributors to global warming?", a: "Carbon dioxide and methane", wrong: ["Oxygen and nitrogen", "Sulfur dioxide and nitrogen oxides", "Helium and argon"], why: "These absorb outgoing infrared radiation and re-emit it, warming the surface. Sulfur dioxide and nitrogen oxides cause acid rain instead — different pollutants, different problem." },
        { q: "What are two consequences of global warming?", a: "Rising sea levels and changes to species distribution and migration patterns", wrong: ["Increased ozone layer thickness", "Reduced carbon dioxide levels", "Cooler oceans"], why: "Warming affects ice cover, sea level, weather patterns and where species can live. Some of these effects reinforce one another, which is why the projections are uncertain but the direction is not." },
        { q: "How does deforestation contribute to global warming?", a: "It removes trees that absorb carbon dioxide, and burning them releases more", wrong: ["It cools the air by removing shade", "It has no effect on atmospheric gases", "It increases oxygen levels"], why: "The effect is double: less uptake and more release. Land cleared for cattle and rice fields also produces methane, adding a third contribution." },
        { q: "What is the effect of releasing smoke and gases into the atmosphere from industry?", a: "Air pollution, including acid rain and particulates that harm health", wrong: ["Improved plant growth", "Cooling of the whole planet", "No measurable effect"], why: "Particulates cause respiratory illness and, by reflecting sunlight, can cause local cooling — but the overall effect of industrial emissions is harmful. Acid rain comes from the sulfur and nitrogen oxides in the same emissions." },
        { q: "Why is landfill waste an environmental problem?", a: "It takes up land and can release methane and toxic substances into soil and water", wrong: ["It absorbs carbon dioxide", "It increases biodiversity", "It has no effect once buried"], why: "Buried organic waste decays anaerobically and produces methane, a potent greenhouse gas. Some landfill sites now capture that methane and burn it for energy." },
        { q: "What is the main driver of increasing human impact on the environment?", a: "A growing population combined with a rising standard of living", wrong: ["A falling population", "Reduced use of resources", "A decrease in agriculture"], why: "Both factors multiply: more people, each using more. This is why efficiency gains alone have not reduced total impact." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Populations and communities (A-Level)
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.pop.hardy-weinberg",
    subject: "biology",
    topic: "bio-populations",
    subtopic: "hardy-weinberg",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 20,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form <= 1) {
        const c = rng.pick(HW_CASES);

        if (form === 0) {
          const answer = ans(c.q);
          return {
            prompt:
              `In a population at Hardy-Weinberg equilibrium, ${num(c.qq)} of individuals show a recessive phenotype. ` +
              `What is the frequency of the recessive allele, q?`,
            answer,
            distractors: pickDistractors(answer, [
              slip(c.qq, ""), // gave q² rather than q
              slip(c.p, ""), // gave p
              slip(c.het, ""), // gave the heterozygote frequency
              slip(1 - c.qq, ""),
            ]),
            explanation:
              `The recessive phenotype requires two recessive alleles, so its frequency is q² = ${num(c.qq)}. ` +
              `Taking the square root gives q = ${answer}. ` +
              `The single commonest error is reporting q² as q — always check whether the question gives you a phenotype frequency (which is q²) or an allele frequency (which is q).`,
            check: () => (agrees(c.q * c.q, c.qq) ? null : "q does not square to the given frequency"),
          };
        }

        const answer = ans(c.het);
        return {
          prompt:
            `In a population at Hardy-Weinberg equilibrium, the recessive allele has frequency q = ${num(c.q)}. ` +
            `What proportion of the population is heterozygous?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(c.qq, ""), // gave q²
            slip(c.pp, ""), // gave p²
            slip(c.p * c.q, ""), // forgot the factor of two
            slip(c.q, ""),
          ]),
          explanation:
            `p = 1 − q = ${num(c.p)}, and heterozygotes are 2pq = 2 × ${num(c.p)} × ${num(c.q)} = ${answer}. ` +
            `The factor of two is there because a heterozygote can be formed two ways round, and dropping it halves the answer. ` +
            `As a check, p² + 2pq + q² = ${num(c.pp)} + ${num(c.het)} + ${num(c.qq)} = 1.`,
          check: () => (agrees(c.pp + c.het + c.qq, 1) ? null : "the three frequencies do not sum to one"),
        };
      }

      const cases = [
        { q: "What does the Hardy-Weinberg equation p² + 2pq + q² = 1 represent?", a: "The frequencies of the three genotypes in a population", wrong: ["The frequencies of the two alleles", "The number of individuals in a population", "The rate at which a population evolves"], why: "p² is the homozygous dominant, 2pq the heterozygous and q² the homozygous recessive. The companion equation p + q = 1 handles the alleles themselves." },
        { q: "What does p + q = 1 mean in the Hardy-Weinberg principle?", a: "The frequencies of the two alleles must add to one", wrong: ["The number of genotypes must add to one", "Each individual has one allele", "The population is always evolving"], why: "With only two alleles at the locus, every allele in the gene pool is one or the other. This is what lets you find p once you know q." },
        { q: "Which condition is NOT required for Hardy-Weinberg equilibrium?", a: "A high mutation rate", wrong: ["A large population", "Random mating", "No migration into or out of the population"], why: "The conditions are: large population, random mating, no migration, no mutation and no selection. A high mutation rate is precisely what would break the equilibrium." },
        { q: "Why is the Hardy-Weinberg principle useful even though its conditions are rarely met?", a: "Departures from the predicted frequencies indicate that something such as selection is acting", wrong: ["It predicts which mutations will occur", "It gives the exact size of a population", "It proves that evolution does not happen"], why: "It works as a null model: the interesting result is when the real frequencies differ from it. That difference is evidence that one of the conditions is being violated." },
        { q: "In a population at equilibrium, q = 0.2. What is p?", a: "0.8", wrong: ["0.2", "0.4", "0.04"], why: "p + q = 1, so p = 1 − 0.2 = 0.8. Squaring either value gives a genotype frequency rather than an allele frequency — 0.04 is q², not p." },
        { q: "Why must a population be large for Hardy-Weinberg equilibrium to hold?", a: "Small populations are subject to genetic drift, which changes allele frequencies by chance", wrong: ["Large populations mutate less", "Small populations cannot reproduce", "Large populations have more alleles"], why: "In a small population, chance alone can shift frequencies substantially in a single generation. The equation assumes those random fluctuations average out, which needs numbers." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.pop.growth",
    subject: "biology",
    topic: "bio-populations",
    subtopic: "population-growth",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are the phases of a typical population growth curve?", a: "Lag, exponential, stationary and death phases", wrong: ["Exponential, lag, death and stationary phases", "Growth and decline only", "A single steady rise"], why: "The lag phase is when organisms adjust and synthesise enzymes, the exponential phase when resources are plentiful, and the stationary phase when births balance deaths. The shape is the same whether the organism is a bacterium or a deer." },
        { q: "What limits population growth in the stationary phase?", a: "Resources become limited and waste accumulates, so births balance deaths", wrong: ["The organisms stop reproducing entirely", "Mutation rates increase", "The population becomes genetically uniform"], why: "The population has reached the carrying capacity of its environment. It is a dynamic balance rather than a halt — individuals are still born and still die." },
        { q: "What is carrying capacity?", a: "The maximum population size an environment can support sustainably", wrong: ["The total number of species in a habitat", "The rate at which a population grows", "The number of offspring one individual can have"], why: "It depends on the resource in shortest supply, and it can change if conditions change. A population may briefly overshoot it, but only at the cost of a subsequent crash." },
        { q: "Why is the exponential phase not sustained indefinitely?", a: "Resources run out and waste products accumulate", wrong: ["Organisms lose the ability to divide", "The environment expands to match", "Predators always arrive at that moment"], why: "Exponential growth means a constant proportional increase, which very quickly becomes an enormous absolute increase. No finite environment can supply that for long." },
        { q: "What is a density-dependent factor?", a: "A factor whose effect increases as the population becomes more crowded, such as disease or competition", wrong: ["A factor that affects all populations equally, such as a flood", "A factor that only affects small populations", "A factor unrelated to the population"], why: "Density-dependent factors regulate populations towards the carrying capacity, because their effect strengthens as numbers rise. Weather is the classic density-independent factor — a frost kills the same proportion whatever the density." },
        { q: "What is a density-independent factor?", a: "A factor such as a flood or fire whose effect does not depend on population size", wrong: ["Competition for food", "Disease transmission", "Predation pressure"], why: "These can cause large sudden changes but do not regulate a population around a stable level, because they carry no feedback. Density-dependent factors are what produce the stationary phase." },
        { q: "What happens to a bacterial population in the death phase?", a: "Deaths exceed reproduction as nutrients are exhausted and toxins accumulate", wrong: ["The bacteria migrate elsewhere", "The population becomes stable", "Reproduction speeds up"], why: "The environment has become actively hostile rather than merely limiting. In a closed culture this is inevitable, which is why industrial fermenters replenish nutrients continuously." },
        { q: "Why does the lag phase occur at the start of population growth?", a: "Organisms are adapting, synthesising enzymes and preparing to divide", wrong: ["There are too many predators at first", "The organisms are too old to reproduce", "The environment is too large"], why: "Cells transferred to a new medium need time to make the enzymes for the nutrients available. The length of the lag phase depends on how different the new conditions are." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.pop.succession",
    subject: "biology",
    topic: "bio-populations",
    subtopic: "succession",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is ecological succession?", a: "The gradual change in the species present in a habitat over time", wrong: ["The daily movement of animals through a habitat", "The seasonal change in a habitat's appearance", "The extinction of all species in a habitat"], why: "Each stage changes the environment in ways that make it more suitable for the next, and less suitable for itself. That self-displacement is what drives the sequence forward." },
        { q: "What is a pioneer species?", a: "The first species to colonise a bare habitat, often able to survive harsh conditions", wrong: ["The largest species in a habitat", "The last species to arrive", "A species introduced by humans"], why: "Lichens on bare rock are the standard example: they tolerate extremes and begin the process of soil formation. They are eventually outcompeted by the species their own presence made possible." },
        { q: "What is a climax community?", a: "The stable final stage of succession for a given climate", wrong: ["The stage with the fewest species", "The first stage of succession", "A community with no plants"], why: "In much of Britain it is oak or beech woodland. It is stable rather than unchanging — species come and go, but the overall composition persists." },
        { q: "How does each stage of succession change the environment?", a: "It makes conditions more suitable for other species, which then outcompete it", wrong: ["It makes conditions worse for every species", "It leaves conditions unchanged", "It removes all nutrients permanently"], why: "Pioneers build soil and retain water, and each subsequent stage adds depth and shelter. The irony is that each stage engineers its own replacement." },
        { q: "What is deflected succession?", a: "Succession halted before the climax community by human activity such as grazing or mowing", wrong: ["Succession that runs backwards", "Succession that skips a stage", "Succession in a marine habitat"], why: "A grazed field would become woodland if left alone, so the grassland is a plagioclimax maintained by the grazing. Much of the British landscape is in this state." },
        { q: "How does species diversity typically change during succession?", a: "It increases, then may fall slightly at the climax stage", wrong: ["It decreases throughout", "It stays constant", "It doubles at every stage"], why: "More complex habitats support more niches, so diversity rises through the middle stages. At the climax a few dominant species may crowd others out, so peak diversity often comes just before it." },
        { q: "What starts primary succession?", a: "Colonisation of a completely bare surface with no soil, such as new volcanic rock", wrong: ["Regrowth after a forest fire", "The introduction of a new predator", "A change in the weather"], why: "Secondary succession starts where soil already exists, as after a fire, so it runs much faster. Primary succession has to build the soil first." },
        { q: "Why does soil depth increase during succession?", a: "Dead organisms and weathered rock accumulate as humus and mineral particles", wrong: ["Rain deposits new soil from elsewhere", "Plants convert air directly into soil", "Animals carry soil in"], why: "Each generation of plants dies and decays, adding organic matter. Deeper soil holds more water and nutrients, which is what allows larger plants to establish." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.pop.competition",
    subject: "biology",
    topic: "bio-populations",
    subtopic: "competition",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is interspecific competition?", a: "Competition between individuals of different species for the same resource", wrong: ["Competition between individuals of the same species", "Competition between predators and prey", "Competition between plants and the weather"], why: "Interspecific is between species, intraspecific within one. The prefixes are worth learning properly, because the two have quite different consequences." },
        { q: "What is intraspecific competition?", a: "Competition between individuals of the same species", wrong: ["Competition between different species", "Competition between an organism and its environment", "Competition between predators only"], why: "It is usually more intense than interspecific competition, because members of one species need exactly the same resources. It is also the main density-dependent factor regulating a population." },
        { q: "What is an ecological niche?", a: "The role an organism plays and the conditions it needs within its habitat", wrong: ["The physical space an organism occupies", "The number of offspring an organism has", "The food an organism eats, and nothing else"], why: "A niche includes where an organism lives, what it eats, when it is active and what eats it. Two species with identical niches cannot coexist indefinitely — one will outcompete the other." },
        { q: "What is the competitive exclusion principle?", a: "Two species with identical niches cannot coexist indefinitely in the same habitat", wrong: ["Two species always share a habitat equally", "Competition always causes extinction", "Species with different niches cannot coexist"], why: "One species will be marginally better and will gradually displace the other. Coexistence is possible when the niches differ enough — which is why closely related species often specialise on slightly different resources." },
        { q: "How does intraspecific competition regulate a population?", a: "As numbers rise, competition intensifies and fewer individuals survive to reproduce", wrong: ["It has no effect on numbers", "It causes exponential growth", "It removes only the oldest individuals"], why: "The negative feedback pushes the population back towards carrying capacity from either direction. This is what produces the stationary phase of a growth curve." },
        { q: "Why can the introduction of a non-native species reduce biodiversity?", a: "It may outcompete native species that occupy a similar niche", wrong: ["It always brings new diseases only", "It reduces the amount of sunlight", "It cannot survive outside its native range"], why: "Grey squirrels displacing red squirrels in Britain is the standard example. Introduced species often arrive without their usual predators or parasites, which gives them an advantage." },
        { q: "What resources do plants compete for?", a: "Light, water, space and mineral ions", wrong: ["Food, mates and territory", "Oxygen and carbon dioxide only", "Shelter and nesting sites"], why: "Plants make their own food, so they never compete for it. Their competition is for the inputs to photosynthesis and for the soil resources that support it." },
        { q: "What advantage does a species gain from occupying a specialised niche?", a: "It faces less competition from other species", wrong: ["It can survive any environmental change", "It always has more offspring", "It becomes immune to predation"], why: "Specialisation reduces overlap and therefore competition. The cost is vulnerability: a specialist is much more exposed than a generalist if its particular resource disappears." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.pop.predator-prey",
    subject: "biology",
    topic: "bio-populations",
    subtopic: "predator-prey",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "In a predator-prey cycle, which population peaks first?", a: "The prey population", wrong: ["The predator population", "They peak simultaneously", "Neither population peaks"], why: "Predators can only increase after their food supply has, so the predator curve lags behind the prey curve. That lag is the signature of the relationship on a graph." },
        { q: "Why does the predator population fall after the prey population falls?", a: "There is less food, so fewer predators survive and reproduce", wrong: ["Predators migrate immediately", "Predators stop hunting", "Prey become poisonous"], why: "The mechanism is starvation and reduced breeding success rather than any behavioural change. The fall in predators then allows the prey to recover, and the cycle repeats." },
        { q: "What happens to the prey population when predator numbers fall?", a: "It recovers, because fewer prey are eaten", wrong: ["It falls further", "It stays constant", "It becomes extinct"], why: "This is the negative feedback that produces the oscillation: each population's change reverses the pressure on the other. Neither drives the other extinct in a stable system." },
        { q: "Why do predator-prey cycles rarely look as regular in real data as in textbooks?", a: "Other factors such as disease, weather and alternative food sources also affect the populations", wrong: ["Real populations do not cycle at all", "The data is always measured wrongly", "Predators do not really eat prey"], why: "The two-species model isolates one relationship from a web of many. The classic lynx and hare data does show the pattern, but with irregularities that other factors explain." },
        { q: "Why do predators rarely drive their prey to extinction?", a: "As prey become scarce they are harder to find, so predator numbers fall first", wrong: ["Predators deliberately conserve prey", "Prey reproduce infinitely fast", "Predators switch to eating plants"], why: "The negative feedback protects both. Extinctions caused by predation usually involve an introduced predator that the prey has no defences against, where the feedback does not operate in time." },
        { q: "How does predation act as a selection pressure on prey?", a: "Individuals with better camouflage, speed or defences are more likely to survive and reproduce", wrong: ["It causes prey to mutate deliberately", "It affects all prey equally", "It has no evolutionary effect"], why: "Predators remove the least well-adapted, so the alleles for effective defence become more common. The predators are under reciprocal pressure, which is why such pairs often show an evolutionary arms race." },
        { q: "What is the effect of removing a top predator from an ecosystem?", a: "Prey numbers may rise sharply, affecting the species further down the food web", wrong: ["Nothing changes", "All species increase equally", "The ecosystem becomes more stable"], why: "The effect cascades: more herbivores means heavier grazing, which changes the plant community and everything depending on it. Reintroducing wolves to Yellowstone is the best-documented example of the reverse." },
        { q: "In a graph of predator and prey numbers over time, what does the horizontal gap between peaks show?", a: "The time it takes the predator population to respond to a change in prey numbers", wrong: ["An error in the data", "The lifespan of the predator", "The migration distance of the prey"], why: "Predators must eat, breed and raise young before their numbers reflect an abundance of prey, so the response is delayed. That delay is what turns a simple relationship into an oscillation." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
