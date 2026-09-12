/**
 * Biology A-Level: energy transfer, nervous and muscular control, immunity,
 * and practical skills.
 *
 * The statistics here are the reason this file has a generator at all rather
 * than a list. Standard deviation and chi-squared are both sums of squared
 * differences, and both are unanswerable without a calculator unless the data
 * is constructed to make them clean. So the data sets are constructed: the
 * standard deviation ones come from a family whose sample SD is exactly the
 * step size, and the chi-squared ones from a deviation chosen to divide.
 *
 * The rest is mechanism, and the distractors are built from the confusions
 * these topics reliably produce — depolarisation against repolarisation, the
 * light-dependent stage against the light-independent one, cell-mediated
 * against humoral immunity.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, exact, num, slip, tidy, wrongOptions } from "./physics-kit";

/* ==========================================================================
   Constructed data sets
   ========================================================================== */

/**
 * Five-value data sets of the form a, a, a+d, a+2d, a+2d.
 *
 * The mean is a+d and the sum of squared deviations is 4d², so the sample
 * standard deviation — dividing by n−1 = 4 — is exactly d. Every other family
 * of small data sets gives an irrational SD, which would make the question a
 * calculator exercise rather than a test of the method.
 */
const SD_SETS: { values: number[]; mean: number; sd: number }[] = (() => {
  const out: { values: number[]; mean: number; sd: number }[] = [];
  for (const a of [1, 2, 3, 4, 5, 6, 8, 10]) {
    for (const d of [1, 2, 3, 4, 5]) {
      const values = [a, a, a + d, a + 2 * d, a + 2 * d];
      const mean = a + d;
      if (!tidy(mean) || !tidy(d)) continue;
      out.push({ values, mean, sd: d });
    }
  }
  return out;
})();

/**
 * Chi-squared cases for a 3:1 monohybrid ratio.
 *
 * With expected values 3N/4 and N/4 and a deviation d in each direction,
 * χ² = d² × 16 ÷ (3N). Enumerated and filtered so that value is writable.
 */
const CHI_CASES: { total: number; expectedHigh: number; expectedLow: number; observedHigh: number; observedLow: number; chi: number }[] = (() => {
  const out: { total: number; expectedHigh: number; expectedLow: number; observedHigh: number; observedLow: number; chi: number }[] = [];
  for (const total of [80, 120, 160, 200, 240, 320, 400]) {
    const expectedHigh = (total * 3) / 4;
    const expectedLow = total / 4;
    if (!Number.isInteger(expectedHigh) || !Number.isInteger(expectedLow)) continue;
    for (const d of [3, 4, 5, 6, 8, 10, 12, 15, 20]) {
      const chi = (d * d) / expectedHigh + (d * d) / expectedLow;
      if (!tidy(chi) || chi > 30) continue;
      out.push({
        total,
        expectedHigh,
        expectedLow,
        observedHigh: expectedHigh + d,
        observedLow: expectedLow - d,
        chi,
      });
    }
  }
  return out;
})();

/* ==========================================================================
   The generators
   ========================================================================== */

export const biologyALevelSystems: Generator[] = [
  /* ------------------------------------------------------------------------
     Energy transfer
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.energy.photo-stages",
    subject: "biology",
    topic: "bio-energy",
    subtopic: "photosynthesis-stages",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "Where in the chloroplast does the light-dependent stage take place?", a: "On the thylakoid membranes", wrong: ["In the stroma", "In the outer membrane", "In the intermembrane space"], why: "The thylakoid membranes hold the chlorophyll and the electron transport chain, and the space inside them is where the proton gradient builds. The light-independent stage happens in the stroma, the fluid around them." },
        { q: "What are the products of the light-dependent stage?", a: "ATP, reduced NADP and oxygen", wrong: ["Glucose and oxygen", "ATP and glucose", "Carbon dioxide and water"], why: "The ATP and reduced NADP are then used in the light-independent stage to fix carbon dioxide. Glucose is a product of the whole process, not of this stage alone." },
        { q: "Where does the oxygen released in photosynthesis come from?", a: "The photolysis of water", wrong: ["Carbon dioxide", "Glucose", "ATP"], why: "Light splits water into protons, electrons and oxygen, and the oxygen is a by-product. Isotope labelling of the oxygen in water rather than in carbon dioxide is what established this." },
        { q: "What is photolysis?", a: "The splitting of water by light energy into protons, electrons and oxygen", wrong: ["The splitting of glucose by light", "The joining of carbon dioxide to a five-carbon compound", "The reduction of NADP"], why: "Photolysis replaces the electrons that chlorophyll loses when light excites them, which is what allows the electron transport chain to keep running. The protons contribute to the gradient that makes ATP." },
        { q: "Where does the light-independent stage take place?", a: "In the stroma", wrong: ["On the thylakoid membranes", "In the outer chloroplast membrane", "In the cytoplasm"], why: "The enzymes of the Calvin cycle are dissolved in the stroma, next to the membranes that supply them with ATP and reduced NADP. Being in the stroma is also why the cycle is temperature-sensitive in a way the light reactions are less so." },
        { q: "What does RuBisCO catalyse?", a: "The joining of carbon dioxide to ribulose bisphosphate", wrong: ["The splitting of water", "The reduction of GP to TP", "The synthesis of ATP"], why: "This is carbon fixation, the step that brings inorganic carbon into an organic molecule. RuBisCO is thought to be the most abundant enzyme on Earth, and it is also famously slow." },
        { q: "What is GP reduced to in the Calvin cycle, and what is used?", a: "Triose phosphate, using ATP and reduced NADP", wrong: ["Ribulose bisphosphate, using only ATP", "Glucose, using only reduced NADP", "Carbon dioxide, using ATP"], why: "This reduction is where the products of the light-dependent stage are spent, which is why the Calvin cycle stops in the dark once they run out. Most of the triose phosphate is then used to regenerate RuBP." },
        { q: "What happens to most of the triose phosphate produced in the Calvin cycle?", a: "It is used to regenerate ribulose bisphosphate", wrong: ["It is all converted into glucose", "It is exported to the mitochondria", "It is broken down into carbon dioxide"], why: "Five out of every six triose phosphate molecules go back into regenerating RuBP, which is why the cycle turns many times to produce one hexose sugar. Only the sixth leaves the cycle." },
        { q: "How many turns of the Calvin cycle are needed to produce one molecule of glucose?", a: "Six", wrong: ["One", "Two", "Twelve"], why: "Each turn fixes one carbon dioxide, and glucose has six carbons. Twelve triose phosphates are made in the process, of which ten regenerate RuBP." },
        { q: "Why does the Calvin cycle stop shortly after the light is removed?", a: "It runs out of the ATP and reduced NADP that the light-dependent stage supplies", wrong: ["RuBisCO denatures in the dark", "Carbon dioxide cannot enter the leaf in the dark", "The stroma freezes"], why: "The light-independent stage does not need light directly, but it depends completely on the products of the stage that does. Calling it the 'dark reaction' has misled generations of students on exactly this point." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.energy.resp-stages",
    subject: "biology",
    topic: "bio-energy",
    subtopic: "respiration-stages",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "Where does glycolysis take place?", a: "In the cytoplasm", wrong: ["In the mitochondrial matrix", "On the inner mitochondrial membrane", "In the nucleus"], why: "Glycolysis is the only stage outside the mitochondrion, which is why it can happen anaerobically and in cells with no mitochondria at all. Everything after it requires the organelle." },
        { q: "What are the products of glycolysis from one glucose molecule?", a: "Two pyruvate, a net two ATP and two reduced NAD", wrong: ["Two pyruvate and 34 ATP", "Six carbon dioxide and six water", "One pyruvate and four ATP"], why: "Four ATP are made but two are invested at the start, so the net gain is two. The large ATP yield comes later, from oxidative phosphorylation." },
        { q: "Where does the link reaction take place?", a: "In the mitochondrial matrix", wrong: ["In the cytoplasm", "On the inner mitochondrial membrane", "In the intermembrane space"], why: "Pyruvate is actively transported into the matrix first. There it is decarboxylated and oxidised to acetyl coenzyme A, releasing carbon dioxide and reducing NAD." },
        { q: "What is produced in the link reaction from one pyruvate?", a: "Acetyl coenzyme A, carbon dioxide and reduced NAD", wrong: ["Two ATP and water", "Lactate and NAD", "Glucose and oxygen"], why: "No ATP is made directly here — the value of the stage is the reduced NAD and the acetyl group it feeds into the Krebs cycle. The carbon dioxide is the first of the waste carbon to leave." },
        { q: "Where does the Krebs cycle take place?", a: "In the mitochondrial matrix", wrong: ["In the cytoplasm", "In the intermembrane space", "On the outer mitochondrial membrane"], why: "The Krebs cycle enzymes are dissolved in the matrix alongside the link reaction enzymes. The electron transport chain, by contrast, is embedded in the inner membrane." },
        { q: "What is the main value of the Krebs cycle to the cell?", a: "It produces reduced NAD and reduced FAD to feed the electron transport chain", wrong: ["It produces most of the cell's ATP directly", "It produces oxygen", "It produces glucose"], why: "Only one ATP per turn is made directly, but the reduced coenzymes carry electrons that yield far more later. This is why respiration collapses without oxygen even though the earlier stages do not use it." },
        { q: "Where does oxidative phosphorylation take place?", a: "On the inner mitochondrial membrane", wrong: ["In the matrix", "In the cytoplasm", "In the outer membrane"], why: "The electron carriers and ATP synthase are embedded there, and the cristae fold the membrane to increase its area. The proton gradient is built across it, into the intermembrane space." },
        { q: "What is the role of oxygen in aerobic respiration?", a: "It is the final electron acceptor, combining with electrons and protons to form water", wrong: ["It is used directly in glycolysis", "It reacts with glucose in the Krebs cycle", "It carries electrons along the chain"], why: "Without a final acceptor the chain backs up, the coenzymes stay reduced and the Krebs cycle stops. This is why oxygen matters even though no earlier stage uses it." },
        { q: "Roughly how many ATP are produced per glucose molecule in aerobic respiration?", a: "Around 30 to 32", wrong: ["Exactly 2", "Around 100", "Around 10"], why: "The older figure of 38 assumes perfect efficiency, but transporting reduced NAD into the mitochondrion and leakage across the membrane both cost something. Anaerobic respiration yields only the net 2 from glycolysis." },
        { q: "What happens to reduced NAD when no oxygen is available?", a: "It cannot be reoxidised by the electron transport chain, so it is used to reduce pyruvate instead", wrong: ["It is destroyed", "It is converted to reduced FAD", "It accumulates with no consequences"], why: "Reducing pyruvate to lactate or ethanol regenerates NAD so glycolysis can continue. The cell gets very little ATP but stays running, which is the whole point of anaerobic respiration." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.energy.chemiosmosis",
    subject: "biology",
    topic: "bio-energy",
    subtopic: "chemiosmosis",
    curriculumLevel: "YEAR_13",
    difficulty: 9,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is chemiosmosis?", a: "The synthesis of ATP driven by protons flowing down a gradient through ATP synthase", wrong: ["The movement of water across a membrane", "The direct transfer of a phosphate from a substrate", "The oxidation of glucose in the cytoplasm"], why: "The energy of the electrons is used to build a gradient, and the gradient then drives ATP synthesis — an indirect route. Substrate-level phosphorylation is the direct alternative and accounts for far less ATP." },
        { q: "How is the proton gradient established in a mitochondrion?", a: "Electron carriers use the energy from electrons to pump protons into the intermembrane space", wrong: ["Protons diffuse in from the cytoplasm", "ATP synthase pumps the protons", "Oxygen pushes protons across the membrane"], why: "The gradient is built actively using energy released as electrons pass along the chain, and ATP synthase then harvests it. ATP synthase is a turbine, not a pump — running it backwards is what a poison such as cyanide effectively causes." },
        { q: "Where do protons accumulate during oxidative phosphorylation?", a: "In the intermembrane space", wrong: ["In the matrix", "In the cytoplasm", "Inside ATP synthase"], why: "The high concentration outside the inner membrane and low concentration inside it is the stored energy. The protons then flow back into the matrix through ATP synthase." },
        { q: "Where do protons accumulate during the light-dependent stage of photosynthesis?", a: "In the thylakoid space", wrong: ["In the stroma", "In the cytoplasm", "Between the two chloroplast envelope membranes"], why: "The mechanism mirrors the mitochondrion exactly, with the thylakoid space playing the role of the intermembrane space. Recognising the parallel makes both easier to remember." },
        { q: "What is the role of ATP synthase?", a: "It allows protons to flow back down the gradient and uses the energy to make ATP from ADP and phosphate", wrong: ["It pumps protons across the membrane", "It splits water into protons and oxygen", "It carries electrons along the chain"], why: "The proton flow physically rotates part of the enzyme, which is what drives the synthesis. It is one of very few molecular machines that literally spins." },
        { q: "What effect would a chemical that makes the inner mitochondrial membrane permeable to protons have?", a: "The gradient would collapse and ATP synthesis would stop, though electron transport would continue and release heat", wrong: ["ATP synthesis would speed up", "Electron transport would stop immediately", "Glycolysis would stop"], why: "Uncouplers such as dinitrophenol do exactly this, and the energy appears as heat instead of ATP. Brown adipose tissue in mammals uses a controlled version of this to generate warmth deliberately." },
        { q: "Why is the inner mitochondrial membrane folded into cristae?", a: "To increase the surface area available for the electron transport chain and ATP synthase", wrong: ["To hold more DNA", "To increase the volume of the matrix", "To let more oxygen dissolve"], why: "More membrane means more of the machinery, so more ATP per mitochondrion. Cells with high energy demands have mitochondria with especially dense cristae." },
        { q: "Why must the inner mitochondrial membrane be impermeable to protons except through ATP synthase?", a: "Otherwise the gradient would leak away without producing any ATP", wrong: ["Protons would poison the matrix", "The membrane would dissolve", "Electrons could not pass along the chain"], why: "The whole design depends on funnelling the return flow through one channel that does work. This is why the mitochondrion needs two membranes: one to build a gradient across, one to enclose the whole organelle." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.energy.ecosystems",
    subject: "biology",
    topic: "bio-energy",
    subtopic: "energy-transfer-ecosystems",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is gross primary production?", a: "The total chemical energy the producers convert from light in a given area and time", wrong: ["The energy left after producers have respired", "The energy passed to primary consumers", "The total mass of producers"], why: "Net primary production is GPP minus the energy the producers use in respiration, and it is NPP that is available to the next level. The distinction is the whole point of the pair of terms." },
        { q: "What is net primary production?", a: "Gross primary production minus the energy lost by the producers in respiration", wrong: ["The total energy captured from light", "The energy in the top consumer", "The energy lost as heat"], why: "NPP is what is left as biomass and therefore what herbivores can eat. Typical figures are around a third to a half of GPP." },
        { q: "Why is energy transfer between trophic levels so inefficient?", a: "Much of the energy is lost in respiration, in movement and in material that is not eaten or not digested", wrong: ["Energy is destroyed at each level", "Consumers refuse most of their food", "Energy leaks into the soil"], why: "Around 10% typically passes between levels, and none of the rest is destroyed — it is simply transferred in forms the next level cannot use. Faeces and urine carry energy to the decomposers instead." },
        { q: "Why is energy transfer more efficient in a fish farm than in a cattle farm?", a: "Fish are ectothermic, so they lose far less energy maintaining body temperature", wrong: ["Fish eat less food overall", "Fish have no waste products", "Water contains more energy than air"], why: "Endotherms spend a large share of their intake keeping warm, which is energy not turned into biomass. This is why intensive farming also restricts movement and keeps animals warm — both reduce respiratory losses." },
        { q: "How is the energy in biomass at a trophic level usually measured?", a: "By burning a dried sample in a calorimeter and measuring the heat released", wrong: ["By weighing the fresh sample", "By counting the organisms", "By measuring the oxygen the sample consumes"], why: "Drying removes water, which contributes mass but no energy, so dry mass is the fair comparison. The method is destructive, which is why it uses a sample rather than the whole population." },
        { q: "Why are pyramids of biomass sometimes inverted in aquatic ecosystems?", a: "Phytoplankton have a small standing biomass but reproduce very fast", wrong: ["Aquatic consumers weigh less than producers", "Water reduces the mass of organisms", "There is no energy transfer in water"], why: "Biomass measures a snapshot, not the rate of production, so a fast-turnover producer can support more consumer biomass than its own. A pyramid of energy is never inverted, which is why it is the more reliable representation." },
        { q: "What is the purpose of a pyramid of energy?", a: "To show the energy flow through each trophic level over a period of time", wrong: ["To show the number of organisms", "To show the mass of organisms at one moment", "To show the number of species"], why: "Because it measures flow rather than a snapshot, it is always widest at the bottom. Pyramids of number and of biomass can both be inverted." },
        { q: "How can farming practices increase the energy available to humans?", a: "By shortening food chains and reducing energy losses from the animals being farmed", wrong: ["By adding more trophic levels", "By feeding livestock on meat", "By increasing animal movement"], why: "Eating plants directly avoids one 90% loss. Within livestock farming, restricting movement and controlling temperature both cut respiratory losses, though the welfare implications are contested." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.energy.nutrient-cycles",
    subject: "biology",
    topic: "bio-energy",
    subtopic: "nutrient-cycles",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What do nitrogen-fixing bacteria do?", a: "Convert atmospheric nitrogen gas into ammonia or ammonium compounds", wrong: ["Convert ammonium into nitrite and nitrate", "Convert nitrate into nitrogen gas", "Break down proteins into ammonia"], why: "Nitrogen gas is unreactive, so this step is what brings nitrogen into the biological cycle at all. Some fixers live free in the soil; others live in root nodules in a mutualistic relationship with legumes." },
        { q: "What do nitrifying bacteria do?", a: "Oxidise ammonium to nitrite and then nitrite to nitrate", wrong: ["Convert nitrogen gas to ammonia", "Convert nitrate to nitrogen gas", "Break down dead organisms"], why: "Nitrate is the form plants absorb most readily, so nitrification makes nitrogen usable. Because it is an oxidation, it needs oxygen — which is why waterlogged soils are poor in nitrate." },
        { q: "What do denitrifying bacteria do?", a: "Convert nitrate back into nitrogen gas, returning it to the atmosphere", wrong: ["Convert nitrogen gas into ammonia", "Convert ammonia into nitrate", "Fix carbon dioxide"], why: "They thrive in anaerobic conditions, which is why waterlogged soil loses fertility. Good drainage and ploughing suppress them by keeping the soil aerobic." },
        { q: "What is ammonification?", a: "The production of ammonia from nitrogen-containing organic compounds by saprobionts", wrong: ["The conversion of ammonia to nitrate", "The fixing of atmospheric nitrogen", "The absorption of nitrate by roots"], why: "Decomposers break down proteins, nucleic acids and urea and release the nitrogen as ammonia. Without it, nitrogen would stay locked in dead material." },
        { q: "Why do farmers plough fields and improve drainage?", a: "To keep the soil aerobic, favouring nitrifying bacteria over denitrifying ones", wrong: ["To kill nitrogen-fixing bacteria", "To increase denitrification", "To remove all bacteria from the soil"], why: "Nitrification needs oxygen and denitrification is favoured without it, so aerating the soil shifts the balance towards making nitrate available. It is a way of managing the bacteria rather than the chemicals directly." },
        { q: "Why are legume crops useful in crop rotation?", a: "Their root nodules host nitrogen-fixing bacteria, which enrich the soil with nitrogen compounds", wrong: ["They absorb less nitrate than other crops", "They kill denitrifying bacteria", "They produce their own fertiliser chemically"], why: "The relationship is mutualistic: the plant supplies carbohydrate and the bacteria supply fixed nitrogen. Rotating legumes into a field reduces the fertiliser needed for the crop that follows." },
        { q: "Why is phosphate important to living organisms?", a: "It is needed for ATP, phospholipids and nucleic acids", wrong: ["It is needed to make chlorophyll", "It is used directly as an energy source", "It carries oxygen in the blood"], why: "Unlike nitrogen, phosphorus has no significant atmospheric reservoir, so the phosphorus cycle depends on weathering of rock and on decomposition. This is why phosphate fertiliser is mined rather than manufactured from air." },
        { q: "How does the phosphorus cycle differ from the nitrogen cycle?", a: "Phosphorus has no gaseous phase, so it cycles through rock, soil, water and organisms", wrong: ["Phosphorus cannot be absorbed by plants", "Phosphorus needs no bacteria at all", "Phosphorus is fixed from the atmosphere"], why: "The absence of an atmospheric reservoir makes phosphorus cycling slow and local, and phosphate a genuinely finite agricultural resource. Mycorrhizal fungi help plants absorb it from soil where it is scarce." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Nervous and muscular control
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.ctrl.action-potentials",
    subject: "biology",
    topic: "bio-control",
    subtopic: "action-potentials",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What maintains the resting potential of a neurone?", a: "The sodium-potassium pump, moving three sodium ions out for every two potassium ions in", wrong: ["Sodium ions diffusing in through open channels", "The sodium-potassium pump moving ions in equal numbers", "Chloride ions being pumped out"], why: "The unequal exchange, plus the membrane's greater permeability to potassium, leaves the inside about −70 mV relative to the outside. It costs ATP continuously, which is why neurones are so energy-hungry." },
        { q: "What happens during depolarisation?", a: "Voltage-gated sodium channels open and sodium ions rush in, making the inside less negative", wrong: ["Potassium ions rush out", "Sodium ions are pumped out", "Chloride ions enter the axon"], why: "The influx is passive, down both the concentration and the electrical gradient. It is also self-reinforcing, which is what makes an action potential all-or-nothing once threshold is reached." },
        { q: "What happens during repolarisation?", a: "Sodium channels close and potassium channels open, so potassium ions leave", wrong: ["Sodium ions continue to enter", "The sodium-potassium pump reverses", "Calcium ions enter the axon"], why: "Potassium leaving restores the negative interior. The channels are slow to close, which overshoots and produces the brief hyperpolarisation that follows." },
        { q: "What is the refractory period?", a: "A short time after an action potential when the neurone cannot be stimulated again", wrong: ["The time taken for the impulse to reach the synapse", "The period when the neurone is at rest between stimuli", "The delay at a synapse"], why: "It ensures impulses travel in one direction only and limits their frequency. Sodium channels are inactivated during it and must reset before another action potential is possible." },
        { q: "What does all-or-nothing mean in the context of action potentials?", a: "An action potential either occurs at full size or not at all, regardless of stimulus strength", wrong: ["Larger stimuli produce larger action potentials", "Action potentials vary with the neurone's length", "All neurones fire together"], why: "Stimulus intensity is coded by the FREQUENCY of action potentials and by how many neurones fire, not by their size. This is why a stronger stimulus feels stronger despite identical individual impulses." },
        { q: "How does myelination increase the speed of conduction?", a: "The impulse jumps between nodes of Ranvier, so depolarisation happens only there", wrong: ["Myelin conducts electricity along the axon", "Myelin increases the diameter of the axon", "Myelin pumps sodium ions faster"], why: "Saltatory conduction skips the membrane between nodes, so far fewer patches of membrane need to be depolarised. It can be twenty times faster than conduction along an unmyelinated axon of the same diameter." },
        { q: "How does axon diameter affect conduction speed?", a: "A wider axon conducts faster, because there is less resistance to the flow of ions", wrong: ["A wider axon conducts more slowly", "Diameter has no effect", "Only myelination affects speed"], why: "This is why squid have giant axons for their escape response — a solution to the same problem that vertebrates solved with myelin. Temperature also matters, which is why ectotherms are sluggish when cold." },
        { q: "What is the threshold potential?", a: "The level of depolarisation that must be reached for an action potential to be triggered", wrong: ["The maximum voltage an action potential reaches", "The resting potential of the neurone", "The voltage at which the neurone dies"], why: "Below threshold, sodium channels do not open in sufficient numbers and the membrane returns to rest. At threshold the influx becomes self-reinforcing, which is where all-or-nothing behaviour comes from." },
        { q: "How is the intensity of a stimulus represented in the nervous system?", a: "By the frequency of action potentials and the number of neurones firing", wrong: ["By the size of each action potential", "By the speed of each impulse", "By the length of the refractory period"], why: "Because action potentials are all-or-nothing, size cannot carry the information. Frequency coding is why the refractory period matters — it sets a ceiling on the maximum signal." },
        { q: "Why does an action potential travel in only one direction along an axon?", a: "The region behind it is in its refractory period and cannot be depolarised again", wrong: ["Sodium channels exist only on one side", "The myelin sheath blocks the reverse direction", "The axon narrows towards one end"], why: "Directionality comes from the refractory period rather than from any structural asymmetry. Stimulating an isolated axon in the middle sends impulses both ways, which confirms it." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.ctrl.synapses",
    subject: "biology",
    topic: "bio-control",
    subtopic: "synapses",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What triggers the release of neurotransmitter at a synapse?", a: "Calcium ions entering the presynaptic knob when the action potential arrives", wrong: ["Sodium ions entering the postsynaptic membrane", "Potassium ions leaving the presynaptic knob", "The neurotransmitter diffusing back"], why: "Depolarisation opens voltage-gated calcium channels, and the calcium causes vesicles to fuse with the membrane. Calcium is the link between the electrical signal and the chemical one." },
        { q: "Why does transmission at a synapse happen in only one direction?", a: "Only the presynaptic knob contains vesicles of neurotransmitter, and only the postsynaptic membrane has receptors", wrong: ["The synaptic cleft is too narrow to cross twice", "Calcium ions flow in only one direction", "The refractory period prevents it"], why: "The asymmetry is structural, which is what makes synapses the point at which the nervous system's wiring becomes directional. The refractory period gives directionality along an axon, not across a synapse." },
        { q: "What happens to acetylcholine after it has bound to the postsynaptic receptors?", a: "It is broken down by acetylcholinesterase and the products are reabsorbed", wrong: ["It stays bound permanently", "It diffuses back across intact and is reused directly", "It is destroyed by the postsynaptic neurone's nucleus"], why: "Without breakdown, the receptors would remain occupied and the postsynaptic neurone would fire continuously. Nerve agents work by inhibiting this enzyme, which is why they are so rapidly lethal." },
        { q: "What is summation at a synapse?", a: "Several small stimuli combining to reach the threshold for an action potential", wrong: ["Two action potentials merging into a larger one", "Neurotransmitter accumulating permanently", "Two axons fusing together"], why: "Spatial summation combines input from several neurones; temporal summation combines rapid repeated input from one. Either way, a stimulus too weak on its own can trigger a response." },
        { q: "What is an inhibitory synapse?", a: "One where the neurotransmitter makes the postsynaptic membrane more negative, so an action potential is less likely", wrong: ["One where no neurotransmitter is released", "One where the impulse travels backwards", "One that permanently blocks the neurone"], why: "Inhibition usually works by opening chloride or potassium channels, hyperpolarising the membrane. Combining excitatory and inhibitory inputs is how a neurone performs something like a computation." },
        { q: "What is the role of the synaptic cleft?", a: "It is the gap the neurotransmitter diffuses across", wrong: ["It conducts the electrical impulse", "It stores the neurotransmitter", "It removes calcium ions"], why: "The gap is around 20 nm, so diffusion across it takes well under a millisecond but still adds a delay. That synaptic delay is why a reflex arc with two synapses is slower than a bare axon of the same length." },
        { q: "How can a drug act as a stimulant at a synapse?", a: "By mimicking the neurotransmitter or preventing its breakdown or reuptake", wrong: ["By destroying the postsynaptic receptors", "By blocking calcium channels", "By removing the myelin sheath"], why: "Anything that increases the time or amount of transmitter in contact with the receptors amplifies the signal. Inhibitory drugs do the reverse, blocking receptors or preventing release." },
        { q: "Why do synapses make the nervous system more than a set of wires?", a: "They allow signals to be summed, filtered, amplified or inhibited before passing on", wrong: ["They speed up conduction", "They store long-term memories directly as chemicals", "They prevent all signals from being lost"], why: "A neurone receiving thousands of inputs fires only if the balance of excitation and inhibition reaches threshold. Synapses actually slow conduction down — their value is in the processing, not the speed." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.ctrl.muscle",
    subject: "biology",
    topic: "bio-control",
    subtopic: "muscle-contraction",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the sliding filament theory?", a: "Actin filaments slide past myosin filaments, shortening the sarcomere without the filaments themselves shortening", wrong: ["The myosin filaments contract and become shorter", "The actin filaments dissolve and re-form", "The whole muscle cell shrinks uniformly"], why: "Neither filament changes length — the overlap increases. This is why the I band and H zone shorten while the A band, which is the length of the myosin, does not." },
        { q: "What happens to the sarcomere during contraction?", a: "The I band and H zone shorten while the A band stays the same length", wrong: ["The A band shortens and the I band stays the same", "All bands shorten equally", "All bands lengthen"], why: "The A band is defined by the myosin filament, whose length is fixed. Which bands change is the standard way of testing whether a student understands sliding rather than shrinking." },
        { q: "What is the role of calcium ions in muscle contraction?", a: "They bind to troponin, moving tropomyosin off the myosin binding sites on actin", wrong: ["They provide the energy for the power stroke", "They break the actin-myosin bridges", "They pump sodium out of the muscle cell"], why: "Calcium is the trigger and ATP is the energy source — two separate roles. Calcium is released from the sarcoplasmic reticulum when the action potential arrives and pumped back afterwards." },
        { q: "What is the role of ATP in muscle contraction?", a: "It provides energy for the power stroke and is needed to detach myosin from actin", wrong: ["It binds to troponin to expose binding sites", "It is released from the sarcoplasmic reticulum", "It carries the impulse along the muscle fibre"], why: "The second role explains rigor mortis: with no ATP, the cross-bridges cannot detach and the muscle stays locked. Calcium handles the triggering." },
        { q: "What is the difference between slow and fast twitch muscle fibres?", a: "Slow twitch contract slowly, resist fatigue and are rich in mitochondria and myoglobin", wrong: ["Slow twitch fatigue faster", "Fast twitch have more mitochondria", "Slow twitch rely on anaerobic respiration"], why: "Slow twitch are built for endurance and respire aerobically; fast twitch generate rapid powerful contractions anaerobically and tire quickly. Most muscles contain both in proportions that vary with the muscle's role." },
        { q: "Why do muscles act in antagonistic pairs?", a: "Muscles can only pull, so a second muscle is needed to move the bone back", wrong: ["Muscles work better in pairs by sharing the load", "One muscle pushes while the other pulls", "It doubles the strength available"], why: "Contraction shortens a muscle and generates a pull; nothing in the mechanism can push. The biceps and triceps at the elbow are the standard example." },
        { q: "What is phosphocreatine used for in muscle?", a: "It regenerates ATP rapidly during the first seconds of intense activity", wrong: ["It provides oxygen to the muscle", "It removes lactate from the muscle", "It binds calcium ions"], why: "It donates a phosphate directly to ADP, which is faster than any respiratory pathway but exhausts within seconds. Aerobic and anaerobic respiration then take over." },
        { q: "What causes rigor mortis?", a: "ATP production stops, so myosin heads cannot detach from actin", wrong: ["Calcium ions are pumped out too quickly", "Muscle proteins denature immediately", "The muscles run out of oxygen only"], why: "Detachment is the step that requires ATP, so without it the cross-bridges stay locked. The stiffness passes as the proteins themselves begin to break down." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.ctrl.receptors",
    subject: "biology",
    topic: "bio-control",
    subtopic: "receptors",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is a generator potential?", a: "A small depolarisation in a receptor cell, which triggers an action potential if it reaches threshold", wrong: ["The full action potential in a sensory neurone", "The resting potential of a receptor", "The potential across a synapse"], why: "Generator potentials are graded — a stronger stimulus produces a larger one — unlike action potentials, which are all-or-nothing. Summing several small ones is how weak stimuli can eventually be detected." },
        { q: "How does a Pacinian corpuscle detect pressure?", a: "Deformation stretches the membrane, opening stretch-mediated sodium channels", wrong: ["Pressure warms the neurone, opening channels", "Pressure releases a hormone into the blood", "Pressure breaks the myelin sheath"], why: "The lamellae around the nerve ending convert pressure into membrane deformation. It responds to CHANGES in pressure rather than steady pressure, which is why you stop noticing your clothes." },
        { q: "What is the difference between rod and cone cells?", a: "Rods are sensitive in low light but give no colour and low acuity; cones need bright light but give colour and high acuity", wrong: ["Rods detect colour and cones detect only light", "Cones work in dim light and rods in bright light", "Rods have higher acuity than cones"], why: "Rods share connections to a single sensory neurone, which sums their input and boosts sensitivity at the cost of resolution. Each cone has its own connection, which preserves detail but needs more light." },
        { q: "Why do rods give greater sensitivity but lower visual acuity than cones?", a: "Many rods connect to one sensory neurone, so their signals sum but their positions are indistinguishable", wrong: ["Rods are larger than cones", "Rods contain more pigment types", "Rods are found only at the fovea"], why: "Retinal convergence is a genuine trade-off between sensitivity and resolution. This is why faint stars are easier to see slightly off-centre, away from the cone-packed fovea." },
        { q: "Where are cone cells most concentrated?", a: "At the fovea", wrong: ["At the periphery of the retina", "At the blind spot", "Evenly across the retina"], why: "The fovea is where the image falls when you look directly at something, which is why detail vision is central. The blind spot has no receptors at all, being where the optic nerve leaves." },
        { q: "How many types of cone cell does a human retina contain?", a: "Three, each responding most strongly to a different range of wavelengths", wrong: ["One", "Two", "Four"], why: "Colour is worked out from the relative responses of the three types rather than measured directly. Colour blindness usually results from one type being absent or altered." },
        { q: "What is a receptor's specificity?", a: "It responds to one type of stimulus only", wrong: ["It responds to all stimuli equally", "It responds only to strong stimuli", "It responds only once"], why: "A rod responds to light and not to pressure, whatever the pressure's strength. This is why the brain can interpret the source of a signal from which neurone it arrives on." },
        { q: "How is a receptor a transducer?", a: "It converts one form of energy, such as light or pressure, into a nervous impulse", wrong: ["It amplifies the stimulus without changing it", "It stores energy for later use", "It converts nervous impulses into movement"], why: "Whatever the stimulus, the output is always the same kind of electrical signal — which is what makes a single nervous system able to handle light, sound, pressure and temperature." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.ctrl.homeostatic",
    subject: "biology",
    topic: "bio-control",
    subtopic: "homeostatic-control",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are the components of a negative feedback loop?", a: "A receptor, a coordination centre and an effector, with the response opposing the change", wrong: ["A receptor and an effector only", "Two effectors acting together", "A stimulus that amplifies itself"], why: "Naming the three parts for any given system — glucose, temperature, water — turns a list of facts into one repeatable structure. The response opposing the change is what makes it negative." },
        { q: "Why is negative feedback more common than positive feedback in physiology?", a: "It restores a set point, keeping conditions stable", wrong: ["It is faster than positive feedback", "It requires no energy", "Positive feedback does not exist in the body"], why: "Positive feedback amplifies a change and is therefore destabilising, so the body uses it only where a rapid one-way change is wanted — in childbirth and in the rising phase of an action potential." },
        { q: "Which of these is an example of positive feedback?", a: "Oxytocin release during labour, which increases contractions and further oxytocin release", wrong: ["Insulin release when blood glucose rises", "Sweating when body temperature rises", "ADH release when blood is too concentrated"], why: "Positive feedback drives a process to completion rather than holding it steady, which is exactly what childbirth needs. The other three are all classic negative feedback loops." },
        { q: "Why does having two hormones with opposite effects give better control than one?", a: "The system can correct a change in either direction rather than only waiting for it to decay", wrong: ["It doubles the speed of every response", "It means less hormone is needed", "It removes the need for receptors"], why: "Insulin and glucagon are the standard pair. With only one hormone, correction in the other direction would depend on the first simply wearing off, which is slow and imprecise." },
        { q: "What is a set point in homeostasis?", a: "The value the body attempts to maintain, around which conditions fluctuate", wrong: ["A fixed value that never changes at all", "The maximum survivable value", "The point at which feedback stops"], why: "Conditions oscillate around the set point rather than sitting exactly on it, because correction can only begin once a deviation has been detected. Some set points shift deliberately — a fever raises the temperature set point." },
        { q: "Why is a delay inherent in any homeostatic system?", a: "The change must be detected before the correction can begin", wrong: ["Hormones travel more slowly than needed", "Receptors are always far from effectors", "Effectors respond only once a day"], why: "This is why blood glucose rises after a meal before falling again rather than staying flat. The size of the oscillation depends on how quickly the loop responds." },
        { q: "How does the hormonal system differ from the nervous system in homeostatic control?", a: "It is slower to act but its effects are longer-lasting and more widespread", wrong: ["It is faster and more localised", "It uses electrical impulses along nerves", "It affects only one cell at a time"], why: "Hormones travel in the blood and reach every cell, affecting those with matching receptors. Which system controls a process tells you something about whether speed or duration matters more." },
        { q: "What would happen to the body if a homeostatic mechanism failed?", a: "Conditions would drift away from the set point, and enzymes and cells would stop working properly", wrong: ["The body would adopt a new stable set point immediately", "Nothing would change", "Positive feedback would take over safely"], why: "Type 1 diabetes is the clearest example: without insulin, blood glucose rises unchecked, with consequences throughout the body. Every homeostatic system exists because some process is sensitive to the variable it controls." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Immunity
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.imm.antibodies",
    subject: "biology",
    topic: "bio-immunity",
    subtopic: "antibodies",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the structure of an antibody?", a: "Four polypeptide chains — two heavy and two light — with two variable regions that bind antigen", wrong: ["A single polypeptide chain with one binding site", "Two chains with no variable region", "A carbohydrate molecule with a protein core"], why: "The variable regions differ between antibodies and give the specificity; the constant regions are the same and let phagocytes recognise any antibody. Having two binding sites is what allows antibodies to clump pathogens together." },
        { q: "What is agglutination?", a: "Antibodies binding several pathogens together into clumps", wrong: ["Antibodies destroying pathogens directly with enzymes", "Pathogens bursting from within", "White blood cells fusing together"], why: "Clumping immobilises pathogens and makes them easier for phagocytes to engulf several at a time. It works because each antibody has two binding sites." },
        { q: "Why is an antibody specific to one antigen?", a: "Its variable region has a shape complementary to that antigen only", wrong: ["It is produced only once", "It is made of a unique type of amino acid", "It binds to the pathogen's DNA"], why: "The same shape-complementarity principle underlies enzymes and receptors. It means immunity to one pathogen gives no protection against another." },
        { q: "What is the role of the constant region of an antibody?", a: "It is recognised by phagocytes, which then engulf the bound pathogen", wrong: ["It binds to the antigen", "It varies between antibodies to give specificity", "It carries the antibody through the cell membrane"], why: "Splitting the two jobs between two regions is what lets one phagocyte respond to antibodies against thousands of different pathogens. Only the variable region binds antigen." },
        { q: "Why does an antibody have two antigen binding sites rather than one?", a: "It can bind two pathogens at once, clumping them together for phagocytes to engulf", wrong: ["One site is a spare in case the first is damaged", "The second site binds to the phagocyte", "It needs two sites to recognise the antigen's shape"], why: "Agglutination depends entirely on an antibody being able to bridge two pathogens. The phagocyte binds to the constant region instead, which is a separate part of the molecule." },
        { q: "What is an autoimmune disease?", a: "One in which the immune system attacks the body's own cells", wrong: ["One caused by a bacterial infection", "One in which no antibodies are produced", "One passed from parent to child by antibodies"], why: "The mechanism is a failure to distinguish self from non-self, which normally develops before birth. Type 1 diabetes and rheumatoid arthritis are examples." },
        { q: "What is passive immunity?", a: "Immunity from antibodies given from outside, which is immediate but temporary", wrong: ["Immunity from making your own antibodies after infection", "Immunity from vaccination", "Immunity that lasts a lifetime"], why: "Antibodies crossing the placenta or in breast milk protect a baby before its own immune system is capable. Because no memory cells are made, the protection fades as the antibodies are broken down." },
        { q: "Why does active immunity last longer than passive immunity?", a: "The body produces memory cells that persist and can respond rapidly to a second exposure", wrong: ["The antibodies given are more numerous", "The antibodies never break down", "The pathogen is permanently destroyed"], why: "Memory cells are the difference. Passive immunity supplies the antibodies themselves, which decay with nothing left behind." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.imm.phagocytosis",
    subject: "biology",
    topic: "bio-immunity",
    subtopic: "phagocytosis",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are the stages of phagocytosis, in order?", a: "Recognition and attachment, engulfing into a phagosome, fusion with a lysosome, digestion by enzymes", wrong: ["Digestion, engulfing, attachment, release", "Engulfing, attachment, release, digestion", "Attachment, digestion, engulfing, fusion"], why: "The lysosome supplies the hydrolytic enzymes, and it fuses only after the pathogen is enclosed — which keeps the enzymes away from the phagocyte's own cytoplasm." },
        { q: "What is a phagosome?", a: "The vesicle formed when a phagocyte engulfs a pathogen", wrong: ["The lysosome containing digestive enzymes", "The nucleus of a phagocyte", "A vesicle containing antibodies"], why: "The phagosome is the container and the lysosome is the source of enzymes; the two fuse to form a phagolysosome. Keeping the names apart makes the sequence easy to describe." },
        { q: "What enzymes does a lysosome contribute to phagocytosis?", a: "Hydrolytic enzymes such as lysozymes, which digest the pathogen", wrong: ["Polymerases, which copy the pathogen's DNA", "Ligases, which join molecules together", "Synthases, which build ATP"], why: "Hydrolysis breaks the pathogen's molecules down into fragments the phagocyte can absorb or display. Keeping these enzymes inside a membrane-bound organelle protects the phagocyte itself." },
        { q: "What is antigen presentation?", a: "A phagocyte displays antigens from a digested pathogen on its own surface membrane", wrong: ["A pathogen displays its antigens to attack cells", "An antibody presents itself to a lymphocyte", "A lymphocyte displays its own antigens"], why: "This is the bridge between the non-specific and specific responses: presented antigens are what activate the T cells. It is why phagocytosis is more than simple disposal." },
        { q: "Is phagocytosis specific or non-specific?", a: "Non-specific — a phagocyte will engulf any foreign material", wrong: ["Specific — each phagocyte responds to one pathogen", "Specific — it requires matching antibodies", "Neither — it is not part of immunity"], why: "Phagocytes act immediately on anything recognised as foreign, which is why they are the first line of cellular defence. The specific response takes days to mount." },
        { q: "How do antibodies make phagocytosis more effective?", a: "They bind to pathogens and their constant regions are recognised by phagocytes", wrong: ["They digest the pathogen before it is engulfed", "They prevent the phagocyte from moving away", "They convert the pathogen into a lysosome"], why: "This is called opsonisation, and it links the specific and non-specific responses in the other direction. Agglutination helps too, by presenting several pathogens at once." },
        { q: "Which type of white blood cell carries out phagocytosis?", a: "Phagocytes such as neutrophils and macrophages", wrong: ["B lymphocytes", "T lymphocytes", "Platelets"], why: "Lymphocytes handle the specific response with antibodies and cell-mediated killing. Macrophages are the ones that go on to present antigens, which is how the two systems connect." },
        { q: "Why is phagocytosis described as the first line of cellular defence?", a: "It begins immediately, before the specific immune response has developed", wrong: ["It is the only defence the body has", "It happens only after antibodies are made", "It occurs before the pathogen enters the body"], why: "The specific response takes several days to produce enough antibodies, and phagocytes hold the line meanwhile. Physical barriers such as skin come before either, but they are not cellular defences." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.imm.cell-mediated",
    subject: "biology",
    topic: "bio-immunity",
    subtopic: "cell-mediated",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the cell-mediated response?", a: "T lymphocytes responding to antigen-presenting cells, including killing infected body cells", wrong: ["B lymphocytes producing antibodies into the blood", "Phagocytes engulfing pathogens", "Antibodies clumping pathogens together"], why: "It targets the body's OWN cells once they are infected or abnormal, which antibodies in the blood cannot reach. The humoral response handles pathogens outside cells." },
        { q: "What is the humoral response?", a: "B lymphocytes producing antibodies against antigens in body fluids", wrong: ["T cells killing infected cells directly", "Phagocytes presenting antigens", "The skin acting as a barrier"], why: "'Humoral' refers to the body fluids the antibodies circulate in. The two responses work together — helper T cells from the cell-mediated arm are needed to activate B cells." },
        { q: "What do helper T cells do?", a: "They stimulate B cells, cytotoxic T cells and phagocytes after recognising a presented antigen", wrong: ["They kill infected cells directly", "They produce antibodies", "They engulf pathogens"], why: "They are the coordinators of the whole specific response, which is why HIV destroying them is so devastating. Cytotoxic T cells do the killing." },
        { q: "How do cytotoxic T cells kill infected cells?", a: "They release perforin, which makes holes in the cell membrane", wrong: ["They release antibodies onto the cell", "They engulf the cell whole", "They inject the cell with lysosomes"], why: "Destroying the host cell destroys the virus factory inside it. It is a drastic measure that is only worth it because a virus-infected cell is already lost." },
        { q: "What is clonal selection?", a: "The specific lymphocyte whose receptor matches the antigen is selected and stimulated to divide", wrong: ["All lymphocytes divide in response to any antigen", "Lymphocytes change shape to fit the antigen", "The antigen selects which antibody to become"], why: "The body already carries a huge variety of lymphocytes before any infection, and the antigen picks out the one that fits. Lymphocytes do not adapt to the pathogen — they are selected." },
        { q: "What do plasma cells do?", a: "They secrete large quantities of antibody", wrong: ["They store memory of past infections for years", "They engulf pathogens", "They present antigens to T cells"], why: "Plasma cells are short-lived antibody factories, producing thousands of molecules a second. Memory cells are the long-lived ones, and they secrete nothing until reactivated." },
        { q: "Why is the secondary immune response faster and larger than the primary?", a: "Memory cells persist and divide rapidly into plasma cells on a second exposure", wrong: ["The pathogen is weaker the second time", "Antibodies from the first exposure are still present in quantity", "The skin becomes impermeable to that pathogen"], why: "The primary response is slow because clonal selection and expansion take days. Memory cells skip that delay, which is what vaccination is designed to produce." },
        { q: "How does the immune system distinguish self from non-self?", a: "Lymphocytes that respond to the body's own antigens are destroyed or suppressed during development", wrong: ["The body's own cells have no antigens", "Antibodies can only bind foreign shapes by chance", "Phagocytes check each cell's DNA"], why: "Self-antigens are present on every body cell, so tolerance has to be learned rather than assumed. Autoimmune disease is what happens when this process fails." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.imm.monoclonal",
    subject: "biology",
    topic: "bio-immunity",
    subtopic: "monoclonal-antibodies",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are monoclonal antibodies?", a: "Identical antibodies produced by clones of a single B cell, all binding one antigen", wrong: ["A mixture of antibodies against many antigens", "Antibodies produced by T cells", "Antibodies that bind to any pathogen"], why: "Being identical and specific is what makes them useful as precise tools. They are made by fusing a B cell with a tumour cell so the hybrid both makes antibody and divides indefinitely." },
        { q: "How does a pregnancy test use monoclonal antibodies?", a: "Antibodies bind the hormone hCG in urine and carry a coloured marker to a test line", wrong: ["Antibodies destroy hCG so a colour disappears", "Antibodies detect the mother's DNA", "Antibodies measure the pH of the urine"], why: "Mobile antibodies bind hCG and are then captured by fixed antibodies at the test line, concentrating the colour. The control line captures the mobile antibodies whether or not hCG is present, which is what shows the test worked." },
        { q: "How can monoclonal antibodies be used to treat cancer?", a: "They can be made specific to antigens on cancer cells and used to deliver a drug directly", wrong: ["They dissolve tumours on contact", "They prevent all cell division in the body", "They replace the patient's immune system"], why: "Targeting reduces the dose needed and spares healthy tissue, which is the main advantage over conventional chemotherapy. Some also work by blocking growth signals rather than by delivering anything." },
        { q: "What is the advantage of targeted drug delivery using monoclonal antibodies?", a: "Side effects are reduced because the drug reaches mainly the target cells", wrong: ["The drug becomes more powerful", "No drug is needed at all", "It works on every type of cancer"], why: "Conventional chemotherapy affects all rapidly dividing cells, which is why it causes hair loss and nausea. Targeting narrows the effect to cells carrying a particular antigen." },
        { q: "What is the ELISA test used for?", a: "Detecting the presence and quantity of a specific antigen or antibody in a sample", wrong: ["Amplifying DNA", "Separating proteins by size", "Sequencing a genome"], why: "It uses an enzyme linked to an antibody to produce a colour change, and the intensity indicates quantity. PCR amplifies DNA and electrophoresis separates by size — different tools for different questions." },
        { q: "Why must an ELISA plate be washed thoroughly between steps?", a: "To remove unbound antibodies, which would otherwise give a false positive", wrong: ["To keep the plate cool", "To dilute the sample", "To activate the enzyme"], why: "Any antibody left behind produces colour whether or not the antigen is present. Washing is what makes the result mean something." },
        { q: "How are monoclonal antibodies produced?", a: "A B cell making the desired antibody is fused with a tumour cell to form a hybridoma", wrong: ["They are synthesised chemically from amino acids", "They are extracted from donated blood", "They are grown directly from bacteria without modification"], why: "The B cell supplies the specificity and the tumour cell the ability to divide indefinitely. The hybridoma is then cultured to produce identical antibody in quantity." },
        { q: "What is one ethical concern about monoclonal antibody production?", a: "Mice are used to produce the cells, raising animal welfare questions", wrong: ["The antibodies are always dangerous to patients", "The technique cannot be tested before use", "Patients cannot give consent"], why: "Deliberately inducing tumour cells in mice is the standard route, and it is the main welfare objection. Testing on humans afterwards also requires careful trial design and informed consent, as any drug does." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.imm.hiv",
    subject: "biology",
    topic: "bio-immunity",
    subtopic: "hiv-viruses",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the structure of HIV?", a: "RNA and reverse transcriptase inside a capsid, surrounded by a lipid envelope with attachment proteins", wrong: ["DNA inside a cell wall", "RNA inside a cell membrane with mitochondria", "A protein coat only, with no genetic material"], why: "The envelope comes from the host cell's membrane, taken as the virus buds out. The attachment proteins are what let it bind to helper T cells specifically." },
        { q: "Which cells does HIV infect?", a: "Helper T cells", wrong: ["Red blood cells", "Phagocytes only", "Nerve cells"], why: "Because helper T cells coordinate both the humoral and cell-mediated responses, destroying them disables the whole specific immune system. This is why AIDS is defined by opportunistic infections." },
        { q: "What does reverse transcriptase do?", a: "It makes DNA from the virus's RNA template", wrong: ["It makes RNA from DNA", "It joins amino acids into proteins", "It cuts host DNA at specific sites"], why: "The reverse of normal transcription, which is where retroviruses get their name. The resulting DNA is then inserted into the host's own chromosome." },
        { q: "Why do antibiotics not work against viruses?", a: "Viruses have no cell structures such as cell walls or ribosomes for antibiotics to target", wrong: ["Viruses are too small for antibiotics to reach", "Viruses are killed only by heat", "Antibiotics are absorbed by the host first"], why: "Antibiotics exploit differences between bacterial and human cells; a virus uses the host's own machinery and offers no separate target. Antivirals usually target virus-specific enzymes such as reverse transcriptase instead." },
        { q: "How is AIDS distinguished from HIV infection?", a: "AIDS is the stage at which helper T cell numbers have fallen enough for opportunistic infections to take hold", wrong: ["AIDS is a different virus", "AIDS occurs immediately after infection", "AIDS is HIV that has been treated"], why: "A person can carry HIV for many years without developing AIDS, particularly on antiretroviral treatment. The distinction is about immune function, not about the virus itself." },
        { q: "How do antiretroviral drugs work?", a: "They inhibit enzymes such as reverse transcriptase or protease that the virus needs to replicate", wrong: ["They kill the virus with antibiotics", "They rebuild destroyed helper T cells", "They prevent the virus from entering the body"], why: "Targeting virus-specific enzymes spares the host's own machinery. Combination therapy is used because the virus mutates so fast that any single drug would soon be evaded." },
        { q: "Why are viruses not considered living organisms by most definitions?", a: "They cannot reproduce or carry out metabolism without a host cell", wrong: ["They contain no genetic material", "They are too small to be alive", "They never change or evolve"], why: "They have genetic material and they evolve, but they have no metabolism of their own and cannot reproduce independently. Where to draw the line is a genuine and unresolved question." },
        { q: "How is HIV transmitted?", a: "Through the exchange of body fluids such as blood, semen and breast milk", wrong: ["Through the air in droplets", "By touching a contaminated surface", "By insect bites"], why: "The virus does not survive long outside the body, which is why casual contact carries no risk. Knowing the transmission routes is what makes prevention possible." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Practical skills and analysis
     ------------------------------------------------------------------------ */

  generator({
    key: "bio.meth.design",
    subject: "biology",
    topic: "bio-methods",
    subtopic: "experimental-design",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the independent variable in an experiment?", a: "The variable the experimenter deliberately changes", wrong: ["The variable that is measured", "A variable kept constant", "A variable that cannot be controlled"], why: "The dependent variable is what you measure in response, and control variables are held constant. Naming all three explicitly is what makes an experimental design assessable." },
        { q: "Why are control variables important?", a: "They ensure any change in the dependent variable is caused by the independent variable", wrong: ["They make the experiment faster", "They increase the number of results", "They replace the need for repeats"], why: "Without them, an observed effect could be caused by something else that happened to change too. Repeats address random error, which is a separate problem." },
        { q: "What is the purpose of a control experiment?", a: "To show what happens without the treatment, providing a baseline for comparison", wrong: ["To repeat the experiment for reliability", "To keep variables constant", "To calculate the mean"], why: "A boiled-enzyme control shows that any change observed really is the enzyme's doing. It is different from a control variable, which is a condition held constant." },
        { q: "Why are repeats important in an experiment?", a: "They reduce the effect of random error and allow anomalies to be identified", wrong: ["They remove systematic error", "They change the independent variable", "They make the result more precise by definition"], why: "Averaging repeats cancels random variation, but a systematic error — a mis-calibrated instrument — repeats identically every time. Only checking the method or the equipment can find that." },
        { q: "What is the difference between accuracy and precision?", a: "Accuracy is closeness to the true value; precision is how closely repeats agree with each other", wrong: ["They mean the same thing", "Accuracy is how many decimal places are recorded", "Precision is closeness to the true value"], why: "A consistently mis-calibrated balance gives precise but inaccurate readings — the classic illustration of why the two must be distinguished." },
        { q: "What is a systematic error?", a: "An error that affects every reading in the same direction, such as a mis-set zero", wrong: ["An error that varies randomly between readings", "A mistake made once during the experiment", "An error caused by too few repeats"], why: "Repeating does not help, because the error repeats too. This is why equipment is calibrated and why a zero is checked before measuring." },
        { q: "What makes a variable a confounding variable?", a: "It changes alongside the independent variable and could explain the result instead", wrong: ["It is measured but not controlled deliberately", "It has no effect on the outcome", "It is the same as the dependent variable"], why: "Confounding is why controlled conditions matter so much: an uncontrolled variable that happens to correlate with the treatment makes the result uninterpretable. Randomisation is one way of breaking such correlations." },
        { q: "Why should a large sample size be used where possible?", a: "It reduces the influence of chance variation and makes the result more representative", wrong: ["It guarantees the hypothesis is correct", "It removes the need for a control", "It eliminates systematic error"], why: "Larger samples narrow the uncertainty around a mean and make statistical tests more able to detect a real effect. They do nothing about bias in how the sample was chosen." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.meth.sd",
    subject: "biology",
    topic: "bio-methods",
    subtopic: "standard-deviation",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form <= 1) {
        const set = rng.pick(SD_SETS);
        const total = set.values.reduce((a, b) => a + b, 0);

        if (form === 0) {
          const answer = ans(set.mean);
          return {
            prompt: `A student records the values ${set.values.join(", ")}. What is the mean?`,
            answer,
            distractors: pickDistractors(answer, [
              slip(total, ""), // gave the total
              slip(set.values[2], ""), // gave the middle value
              slip(total / (set.values.length - 1), ""), // divided by one too few
              slip(Math.max(...set.values), ""),
            ]),
            explanation:
              `Mean = total ÷ number of values = ${total} ÷ ${set.values.length} = ${answer}. ` +
              `The median here happens to be the same value, but that is a coincidence of this data set rather than a rule.`,
            check: () => (agrees(set.mean * set.values.length, total) ? null : "the mean does not reproduce the total"),
          };
        }

        const answer = ans(set.sd);
        return {
          prompt:
            `A student records the values ${set.values.join(", ")}, which have a mean of ${num(set.mean)}. ` +
            `What is the standard deviation?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(set.sd * set.sd, ""), // gave the variance
            slip(set.mean, ""), // gave the mean
            slip(Math.max(...set.values) - Math.min(...set.values), ""), // gave the range
            slip(set.sd * 2, ""),
          ]),
          explanation:
            `Subtract the mean from each value, square the results, add them, divide by n − 1 = ${set.values.length - 1}, and take the square root. ` +
            `The squared deviations are ${set.values.map((v) => Math.pow(v - set.mean, 2)).join(", ")}, totalling ${set.values.reduce((a, v) => a + Math.pow(v - set.mean, 2), 0)}, ` +
            `so the standard deviation is ${answer}. ` +
            `Forgetting the final square root leaves you with the variance, which is the commonest slip here.`,
          check: () => {
            const ss = set.values.reduce((a, v) => a + Math.pow(v - set.mean, 2), 0);
            return agrees(Math.sqrt(ss / (set.values.length - 1)), set.sd) ? null : "the data does not give the stated standard deviation";
          },
        };
      }

      const cases = [
        { q: "What does the standard deviation of a data set tell you?", a: "How spread out the values are around the mean", wrong: ["The average of the values", "The largest value in the set", "The number of values collected"], why: "Two samples can share a mean and differ completely in spread, which is why the mean alone is rarely enough. A small standard deviation means the values cluster tightly." },
        { q: "Why is standard deviation more useful than the range?", a: "It uses every value, not just the two extremes", wrong: ["It is easier to calculate", "It is always a whole number", "It ignores anomalous results automatically"], why: "The range is decided by two points and is therefore very sensitive to a single outlier. Standard deviation takes account of the whole distribution." },
        { q: "What do error bars showing standard deviation indicate on a graph?", a: "The spread of the data around each mean, which helps judge whether differences are meaningful", wrong: ["The exact range of possible values", "The number of repeats performed", "The accuracy of the equipment used"], why: "If bars for two means overlap substantially, the difference between them may well be chance. A statistical test is needed to decide properly, but the bars give a first impression." },
        { q: "What does a large standard deviation suggest about a data set?", a: "The values are widely spread around the mean", wrong: ["The mean is inaccurate", "There were too few repeats", "The experiment was performed incorrectly"], why: "Wide spread may reflect genuine biological variation rather than any fault in the method. It does make differences between groups harder to establish." },
        { q: "Why is n − 1 used rather than n when calculating standard deviation from a sample?", a: "It corrects for the fact that a sample tends to underestimate the spread of the whole population", wrong: ["It makes the number smaller for convenience", "One value is always discarded as an anomaly", "The mean counts as one of the values"], why: "Using n would systematically underestimate the population standard deviation. The correction matters most for small samples, which is exactly the situation in most school experiments." },
        { q: "Two samples have the same mean but different standard deviations. What does this tell you?", a: "The values in one sample are more spread out than in the other", wrong: ["One sample has more values", "One sample is more accurate", "The samples are identical"], why: "This is the situation that makes reporting the mean alone misleading. It also matters practically — a crop variety with a consistent yield may be preferable to one with the same average but wild variation." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.meth.chi-squared",
    subject: "biology",
    topic: "bio-methods",
    subtopic: "chi-squared",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 32,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        const c = rng.pick(CHI_CASES);
        const answer = ans(c.chi);
        return {
          prompt:
            `A monohybrid cross of ${c.total} offspring is expected to give a 3 : 1 ratio. ` +
            `The observed numbers are ${c.observedHigh} and ${c.observedLow}. What is the value of χ²?`,
          answer,
          distractors: pickDistractors(answer, [
            slip((c.observedHigh - c.expectedHigh) / c.expectedHigh + (c.expectedLow - c.observedLow) / c.expectedLow, ""), // forgot to square
            slip(Math.pow(c.observedHigh - c.expectedHigh, 2) / c.expectedLow + Math.pow(c.expectedLow - c.observedLow, 2) / c.expectedHigh, ""), // divided by the wrong expected value
            slip(c.chi / 2, ""),
            slip(Math.abs(c.observedHigh - c.expectedHigh), ""), // gave the deviation
          ]),
          explanation:
            `Expected values are ${c.expectedHigh} and ${c.expectedLow}. ` +
            `χ² = Σ(O − E)² ÷ E = ${Math.pow(c.observedHigh - c.expectedHigh, 2)} ÷ ${c.expectedHigh} + ${Math.pow(c.observedLow - c.expectedLow, 2)} ÷ ${c.expectedLow} = ${answer}. ` +
            `Each term is divided by its OWN expected value, and the squaring happens before the division — those are the two steps that get scrambled.`,
          check: () => {
            const recomputed =
              Math.pow(c.observedHigh - c.expectedHigh, 2) / c.expectedHigh +
              Math.pow(c.observedLow - c.expectedLow, 2) / c.expectedLow;
            return agrees(recomputed, c.chi) ? null : "the chi-squared value does not recompute";
          },
        };
      }

      if (form === 1) {
        const categories = rng.int(2, 6);
        const answer = ans(categories - 1);
        return {
          prompt: `A chi-squared test compares observed and expected values across ${categories} categories. How many degrees of freedom are there?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(categories, ""), // used the category count directly
            slip(categories + 1, ""),
            slip(categories - 2, ""),
            slip(categories * 2, ""),
          ]),
          explanation:
            `Degrees of freedom = number of categories − 1 = ${categories} − 1 = ${answer}. ` +
            `Once you know the total and all but one category, the last is fixed — which is what the subtraction represents. ` +
            `Using the wrong row of the critical values table is the fastest way to reach the wrong conclusion.`,
          check: () => (agrees(categories - 1 + 1, categories) ? null : "the degrees of freedom do not add back"),
        };
      }

      const cases = [
        { q: "What is the null hypothesis in a chi-squared test?", a: "That there is no significant difference between the observed and expected results", wrong: ["That the observed results are correct", "That the difference is significant", "That the experiment was performed correctly"], why: "The test either rejects the null hypothesis or fails to reject it; it never proves it. Stating it explicitly is part of the method." },
        { q: "What does it mean if the calculated χ² value exceeds the critical value at p = 0.05?", a: "The difference is significant and the null hypothesis is rejected", wrong: ["The difference is due to chance and the null hypothesis is accepted", "The experiment must be repeated", "The expected values were wrong"], why: "Exceeding the critical value means a difference this large would arise by chance less than 5% of the time. That is the conventional threshold for calling a result significant." },
        { q: "What does p = 0.05 mean in a statistical test?", a: "There is a 5% probability that a difference this large arose by chance", wrong: ["The result is 95% accurate", "5% of the data was discarded", "The experiment was repeated 20 times"], why: "It is a statement about how surprising the data would be if the null hypothesis were true, not about how accurate the measurements are. The 5% threshold is a convention, not a law of nature." },
        { q: "When is a chi-squared test appropriate?", a: "When comparing observed counts in discrete categories against expected counts", wrong: ["When comparing two means", "When looking for a correlation between two continuous variables", "When measuring the spread of a single data set"], why: "Chi-squared needs categorical frequency data, such as the phenotype counts from a genetic cross. Comparing means calls for a t-test and correlation for a correlation coefficient." },
        { q: "Why must chi-squared be calculated using raw counts rather than percentages?", a: "The test's result depends on sample size, which percentages discard", wrong: ["Percentages are less accurate", "The formula cannot handle decimals", "Percentages always sum to 100"], why: "A 10% deviation in 20 offspring is unremarkable; the same deviation in 2000 is striking. Converting to percentages throws away exactly the information the test needs." },
        { q: "If a chi-squared value is below the critical value, what can you conclude?", a: "There is no significant difference, so the null hypothesis is not rejected", wrong: ["The null hypothesis is proved true", "The difference is significant", "The data must have been collected wrongly"], why: "Failing to reject is not the same as proving true — the test may simply lack the power to detect a real difference with the sample available. Careful wording matters here." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.meth.correlation",
    subject: "biology",
    topic: "bio-methods",
    subtopic: "correlation-causation",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What does a correlation between two variables show?", a: "That they change together, which does not by itself show that one causes the other", wrong: ["That one variable causes the other", "That the two variables are unrelated", "That an experiment has been performed"], why: "A third variable may cause both, or the association may be coincidence. Establishing causation requires a controlled experiment or a very carefully argued case." },
        { q: "What additional evidence supports a causal link rather than a mere correlation?", a: "A plausible mechanism, and a controlled experiment where changing one variable changes the other", wrong: ["A larger correlation coefficient alone", "More data points showing the same pattern", "A published paper claiming causation"], why: "Correlation motivates a hypothesis; controlled manipulation tests it. The link between smoking and lung cancer was accepted once the mechanism and the experimental evidence accumulated alongside the statistics." },
        { q: "What is a positive correlation?", a: "As one variable increases, so does the other", wrong: ["As one variable increases, the other decreases", "The two variables are unrelated", "One variable causes the other to increase"], why: "The word describes the direction of the pattern only. Whether either causes the other is a separate question that the correlation cannot answer." },
        { q: "Why might two variables be correlated without either causing the other?", a: "A third factor may influence both", wrong: ["Correlation is always an error", "The data must have been measured wrongly", "It is impossible for this to happen"], why: "Ice cream sales and drowning rates rise together because both follow hot weather. Looking for the third factor is the standard first response to a surprising correlation." },
        { q: "What type of data is needed to calculate a correlation coefficient?", a: "Two sets of continuous quantitative data measured on the same individuals", wrong: ["Counts in discrete categories", "A single set of measurements", "Descriptive observations"], why: "Categorical counts call for chi-squared instead. Matching the test to the type of data is half of interpreting an experiment correctly." },
        { q: "What does a correlation coefficient close to zero indicate?", a: "Little or no linear relationship between the two variables", wrong: ["A strong negative relationship", "That one variable causes the other", "That the data is unreliable"], why: "It rules out a straight-line relationship but not a curved one, so a scatter graph is always worth looking at. Zero correlation is a real result, not a failed experiment." },
        { q: "Why is a scatter graph useful before calculating a correlation coefficient?", a: "It reveals the shape of the relationship and any outliers the coefficient would hide", wrong: ["It calculates the coefficient automatically", "It proves causation", "It removes anomalous results"], why: "A single extreme point can dominate a correlation coefficient, and a strong curved relationship can produce a coefficient near zero. Looking at the data first protects against both." },
        { q: "A study finds that people who drink more coffee live longer. What is the safest conclusion?", a: "There is a correlation, and further work is needed to establish whether coffee is responsible", wrong: ["Coffee causes longer life", "Longer life causes coffee drinking", "The study must be wrong"], why: "Coffee drinkers may differ in income, health behaviour or many other respects. Observational studies of this kind generate hypotheses rather than settling them." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "bio.meth.drawing",
    subject: "biology",
    topic: "bio-methods",
    subtopic: "biological-drawing",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What are the conventions for a biological drawing?", a: "Clear continuous lines, no shading, drawn in pencil with labels on straight uncrossed lines", wrong: ["Shaded and coloured for realism", "Drawn freehand in pen with arrows", "Traced from a photograph"], why: "The purpose is to record structure accurately, not to produce a picture. Shading obscures boundaries, which is exactly what a drawing is supposed to show." },
        { q: "What should a biological drawing always include?", a: "A title, a magnification or scale, and labels", wrong: ["Colour and shading", "The date only", "A photograph alongside it"], why: "Without a scale, the drawing carries no information about size, which is usually a key observation. The magnification links what is drawn to what was seen." },
        { q: "What is a plan diagram?", a: "A low-power drawing showing the outlines of tissues without individual cells", wrong: ["A drawing of individual cells in detail", "A photograph of a slide", "A diagram with no labels"], why: "Plan diagrams show the arrangement of tissues in a section — the layers of a leaf or an artery wall. Drawing individual cells in a plan diagram is a standard mark-losing error." },
        { q: "How is magnification calculated from a drawing?", a: "Divide the size of the drawing by the actual size of the specimen", wrong: ["Multiply the drawing size by the actual size", "Divide the actual size by the drawing size", "Add the two sizes together"], why: "Both measurements must be in the same units first, which is where most of the errors happen. The result has no units, since it is a ratio." },
        { q: "What is a scale bar?", a: "A line on a drawing or micrograph representing a stated real distance", wrong: ["A ruler drawn beside the specimen", "The border of the drawing", "A line showing the magnification of the microscope"], why: "A scale bar survives resizing of the image, which a stated magnification does not. Measuring the bar and comparing it to a structure gives the structure's real size." },
        { q: "Why should a biological drawing not be shaded?", a: "Shading obscures the boundaries between structures the drawing is meant to show", wrong: ["Shading takes too long", "Pencils cannot shade accurately", "Shading is only allowed in colour"], why: "The drawing is a record of structure, so anything that blurs an edge works against its purpose. Different tissues are distinguished by labelling, not by tone." },
        { q: "Why are label lines drawn straight and not crossed?", a: "So each label unambiguously identifies one structure", wrong: ["To make the drawing look neater only", "Because curved lines are harder to draw", "To save space on the page"], why: "Ambiguity in a scientific record is the thing to avoid; neatness is a side effect. Labels are conventionally written horizontally for the same reason." },
        { q: "Why is a sharp pencil used rather than a pen?", a: "Fine continuous lines can be drawn accurately and corrected if needed", wrong: ["Pencil is easier to photocopy", "Pen is not permitted in laboratories", "Pencil marks last longer"], why: "Accuracy of line is the whole point of the technique, and an error in pen cannot be corrected cleanly. A single clear line is also easier to interpret than a sketchy multi-stroke one." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
