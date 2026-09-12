/**
 * The question bank's vocabulary.
 *
 * Every question in the permanent bank is tagged from here and nowhere else.
 * The point of a closed vocabulary is that filtering actually works: a bank
 * where one question says "Quadratics" and another says "quadratic equations"
 * has two topics as far as any query is concerned, and a topic filter silently
 * returns half of what the student asked for. Free-text subjects are why the
 * Arena's matchmaker has to normalise strings before it can compare them; this
 * table exists so the bank never has that problem.
 *
 * Maths is the first subject, not the only one. Everything below is keyed by
 * subject so Physics or Computer Science is a new entry in one object rather
 * than a migration.
 *
 * Pure data and pure functions — no I/O, so the seed script, the services and
 * the tests all read the same definitions.
 */

/* ==========================================================================
   Curriculum levels
   ========================================================================== */

/**
 * When the content is normally TAUGHT, which is not the same as how hard it is.
 * A nasty Year 10 ratio problem is still Year 10 material; a routine
 * differentiation is still Year 12. Difficulty is a separate axis for exactly
 * this reason.
 */
export const CURRICULUM_LEVELS = ["YEAR_10", "YEAR_11", "YEAR_12", "YEAR_13"] as const;
export type CurriculumLevel = (typeof CURRICULUM_LEVELS)[number];

export const LEVEL_LABEL: Record<CurriculumLevel, string> = {
  YEAR_10: "Year 10",
  YEAR_11: "Year 11",
  YEAR_12: "Year 12",
  YEAR_13: "Year 13",
};

/** The two qualifications, for queue filters and display. */
export const STAGES = ["GCSE", "A_LEVEL"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  GCSE: "GCSE",
  A_LEVEL: "A-Level",
};

export const LEVELS_BY_STAGE: Record<Stage, readonly CurriculumLevel[]> = {
  GCSE: ["YEAR_10", "YEAR_11"],
  A_LEVEL: ["YEAR_12", "YEAR_13"],
};

export function stageOf(level: CurriculumLevel): Stage {
  return level === "YEAR_10" || level === "YEAR_11" ? "GCSE" : "A_LEVEL";
}

/* ==========================================================================
   Difficulty
   ========================================================================== */

/**
 * Stored as 1–10 and displayed as a band.
 *
 * One number rather than two fields, because two would drift: nothing stops a
 * row saying difficulty 9 and band "Easy" once both are writable. The band is
 * derived, so it cannot disagree.
 *
 * The scale is within-level. A 9 at Year 10 is a hard GCSE question, not an
 * A-Level one — otherwise every GCSE question would sit in the bottom third
 * and the filter would be useless to the students who need it most.
 */
export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 10;

export const DIFFICULTY_BANDS = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;
export type DifficultyBand = (typeof DIFFICULTY_BANDS)[number];

export const BAND_LABEL: Record<DifficultyBand, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  EXPERT: "Expert",
};

export function bandFor(difficulty: number): DifficultyBand {
  const d = clampDifficulty(difficulty);
  if (d <= 3) return "EASY";
  if (d <= 6) return "MEDIUM";
  if (d <= 8) return "HARD";
  return "EXPERT";
}

export function clampDifficulty(difficulty: number): number {
  if (!Number.isFinite(difficulty)) return DIFFICULTY_MIN;
  return Math.min(DIFFICULTY_MAX, Math.max(DIFFICULTY_MIN, Math.round(difficulty)));
}

export const BAND_RANGE: Record<DifficultyBand, { min: number; max: number }> = {
  EASY: { min: 1, max: 3 },
  MEDIUM: { min: 4, max: 6 },
  HARD: { min: 7, max: 8 },
  EXPERT: { min: 9, max: 10 },
};

/* ==========================================================================
   Question types
   ========================================================================== */

/**
 * SHORT_ANSWER exists but is deliberately excluded from anything timed and
 * competitive — marking free text needs a model, and the Arena forbids one.
 * It is here so the bank can hold exam-style questions for revision without
 * pretending they can be auto-marked in a battle.
 */
export const QUESTION_TYPES = ["MCQ_SINGLE", "MCQ_MULTI", "NUMERIC", "SHORT_ANSWER"] as const;
export type BankQuestionType = (typeof QUESTION_TYPES)[number];

/** Types a battle or a self-marking quiz can use. */
export const AUTO_MARKABLE: readonly BankQuestionType[] = ["MCQ_SINGLE", "MCQ_MULTI", "NUMERIC"];

export function isAutoMarkable(type: BankQuestionType): boolean {
  return AUTO_MARKABLE.includes(type);
}

/* ==========================================================================
   Subjects, topics, subtopics
   ========================================================================== */

/**
 * The subjects the app knows about.
 *
 * Maths is the only one with questions today. The rest are here because the
 * whole point of the bank's shape — subject on every row, topics keyed by
 * subject, every query scoped by it — is that adding one is data rather than a
 * migration, and because a student choosing what to be asked should be able to
 * see where this is going.
 *
 * A subject with no questions is shown but not selectable. Listing it as though
 * it worked would produce a filter that silently matches nothing, which is the
 * failure this whole vocabulary exists to prevent.
 */
export const SUBJECTS = [
  "maths",
  "further-maths",
  "biology",
  "chemistry",
  "physics",
  "computer-science",
] as const;
export type Subject = (typeof SUBJECTS)[number];

export const SUBJECT_LABEL: Record<Subject, string> = {
  maths: "Maths",
  "further-maths": "Further Maths",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  "computer-science": "Computer Science",
};

/**
 * A subject at a qualification: "maths:GCSE", "biology:A_LEVEL".
 *
 * The unit a player actually picks, and the reason it is one string rather than
 * two fields. Ticking GCSE Maths and A-Level Biology as separate subject and
 * level lists would also let through A-Level Maths and GCSE Biology, which is
 * not what anybody meant.
 */
export function streamKey(subject: string, stage: Stage): string {
  return `${subject}:${stage}`;
}

export function parseStream(stream: string): { subject: string; stage: Stage } | null {
  const [subject, stage] = stream.split(":");
  if (!subject || (stage !== "GCSE" && stage !== "A_LEVEL")) return null;
  return { subject, stage };
}

export interface TopicDefinition {
  key: string;
  label: string;
  /** Which stage this topic belongs to. Some appear in both, with both listed. */
  stages: readonly Stage[];
  subtopics: readonly { key: string; label: string }[];
}

const t = (
  key: string,
  label: string,
  stages: readonly Stage[],
  subtopics: readonly [string, string][],
): TopicDefinition => ({
  key,
  label,
  stages,
  subtopics: subtopics.map(([k, l]) => ({ key: k, label: l })),
});

const BOTH: readonly Stage[] = ["GCSE", "A_LEVEL"];
const GCSE_ONLY: readonly Stage[] = ["GCSE"];
const A_ONLY: readonly Stage[] = ["A_LEVEL"];

/**
 * The maths topic tree.
 *
 * Topic keys are stable identifiers; labels are what a student reads. Renaming
 * a label is free, renaming a key is a data migration — so keys are chosen to
 * be boring and permanent.
 */
/*
 * Every subtopic listed here has questions behind it.
 *
 * A vocabulary that promises filters the bank cannot fill is worse than a
 * shorter one — a student who picks "Translations" and gets an empty screen
 * learns that the filters do not work. Three subtopics were removed for exactly
 * that reason rather than left in as aspiration; add them back alongside the
 * generators that populate them.
 */
export const MATHS_TOPICS: readonly TopicDefinition[] = [
  t("number", "Number", GCSE_ONLY, [
    ["hcf-lcm", "HCF and LCM"],
    ["prime-factors", "Prime factorisation"],
    ["standard-form", "Standard form"],
    ["percentages", "Percentages"],
    ["reverse-percentages", "Reverse percentages"],
    ["compound-interest", "Compound interest and growth"],
    ["fractions", "Fraction arithmetic"],
    ["bounds", "Rounding and bounds"],
    ["indices", "Indices"],
  ]),
  t("algebra", "Algebra", BOTH, [
    ["expanding", "Expanding brackets"],
    ["factorising", "Factorising"],
    ["linear-equations", "Linear equations"],
    ["simultaneous", "Simultaneous equations"],
    ["rearranging", "Rearranging formulae"],
    ["inequalities", "Inequalities"],
    ["algebraic-fractions", "Algebraic fractions"],
    ["polynomial-division", "Polynomial division"],
    ["factor-theorem", "The factor theorem"],
    ["partial-fractions", "Partial fractions"],
  ]),
  t("quadratics", "Quadratics", BOTH, [
    ["factorising-quadratics", "Solving by factorising"],
    ["quadratic-formula", "The quadratic formula"],
    ["completing-the-square", "Completing the square"],
    ["discriminant", "The discriminant"],
    ["quadratic-graphs", "Quadratic graphs"],
  ]),
  t("surds", "Surds", BOTH, [
    ["simplifying-surds", "Simplifying surds"],
    ["rationalising", "Rationalising the denominator"],
    ["surd-arithmetic", "Surd arithmetic"],
  ]),
  t("ratio", "Ratio and proportion", GCSE_ONLY, [
    ["sharing", "Sharing in a ratio"],
    ["ratio-fractions", "Ratio as a fraction"],
    ["direct-proportion", "Direct proportion"],
    ["inverse-proportion", "Inverse proportion"],
  ]),
  t("geometry", "Geometry and measures", GCSE_ONLY, [
    ["angles", "Angles and polygons"],
    ["pythagoras", "Pythagoras' theorem"],
    ["area-volume", "Area and volume"],
    ["similar-shapes", "Similar shapes"],
    ["arcs-sectors", "Arcs and sectors"],
  ]),
  t("circle-theorems", "Circle theorems", GCSE_ONLY, [
    ["angle-at-centre", "Angle at the centre"],
    ["cyclic-quadrilateral", "Cyclic quadrilaterals"],
    ["alternate-segment", "Alternate segment theorem"],
    ["tangent-radius", "Tangents and radii"],
  ]),
  t("trigonometry", "Trigonometry", BOTH, [
    ["right-angled", "Right-angled trigonometry"],
    ["sine-rule", "The sine rule"],
    ["cosine-rule", "The cosine rule"],
    ["triangle-area", "Area of a triangle"],
    ["exact-values", "Exact values"],
    ["trig-equations", "Trigonometric equations"],
    ["trig-identities", "Trigonometric identities"],
    ["radians", "Radians, arcs and sectors"],
  ]),
  t("vectors", "Vectors", BOTH, [
    ["column-vectors", "Column vectors"],
    ["magnitude", "Magnitude and direction"],
    ["vector-paths", "Vector paths"],
  ]),
  t("transformations", "Transformations", GCSE_ONLY, [
    ["reflection", "Reflection"],
    ["rotation", "Rotation"],
    ["enlargement", "Enlargement"],
  ]),
  t("probability", "Probability", BOTH, [
    ["single-events", "Single events"],
    ["tree-diagrams", "Tree diagrams"],
    ["venn-diagrams", "Venn diagrams"],
    ["conditional", "Conditional probability"],
  ]),
  t("statistics", "Statistics", BOTH, [
    ["averages", "Averages and spread"],
    ["grouped-data", "Grouped data"],
    ["binomial", "The binomial distribution"],
    ["normal", "The normal distribution"],
    ["hypothesis-testing", "Hypothesis testing"],
    ["correlation", "Correlation and regression"],
  ]),
  t("graphs", "Graphs", BOTH, [
    ["straight-lines", "Straight-line graphs"],
    ["parallel-perpendicular", "Parallel and perpendicular lines"],
    ["midpoint-distance", "Midpoints and distance"],
    ["graph-transformations", "Transformations of graphs"],
  ]),
  t("functions", "Functions", BOTH, [
    ["evaluating", "Evaluating functions"],
    ["composite", "Composite functions"],
    ["inverse", "Inverse functions"],
    ["domain-range", "Domain and range"],
    ["modulus", "The modulus function"],
  ]),
  t("coordinate-geometry", "Coordinate geometry", A_ONLY, [
    ["circle-equation", "Equation of a circle"],
    ["circle-properties", "Centre and radius"],
  ]),
  t("differentiation", "Differentiation", A_ONLY, [
    ["power-rule", "Differentiating powers"],
    ["tangents-normals", "Tangents and normals"],
    ["stationary-points", "Stationary points"],
    ["chain-rule", "The chain rule"],
    ["product-rule", "The product rule"],
    ["quotient-rule", "The quotient rule"],
    ["implicit", "Implicit differentiation"],
  ]),
  t("integration", "Integration", A_ONLY, [
    ["indefinite", "Indefinite integration"],
    ["definite", "Definite integration"],
    ["area-under-curve", "Area under a curve"],
    ["substitution", "Integration by substitution"],
    ["by-parts", "Integration by parts"],
  ]),
  t("binomial-expansion", "Binomial expansion", A_ONLY, [
    ["positive-index", "Positive integer index"],
    ["general-term", "The general term"],
  ]),
  t("sequences", "Sequences", BOTH, [
    ["linear-nth-term", "Linear nth term"],
    ["quadratic-nth-term", "Quadratic nth term"],
    ["arithmetic", "Arithmetic sequences"],
    ["geometric", "Geometric sequences"],
    ["recurrence", "Recurrence relations"],
  ]),
  t("series", "Series", A_ONLY, [
    ["arithmetic-series", "Arithmetic series"],
    ["geometric-series", "Geometric series"],
    ["sum-to-infinity", "Sum to infinity"],
  ]),
  t("exponentials-logs", "Exponentials and logarithms", A_ONLY, [
    ["log-laws", "Laws of logarithms"],
    ["solving-exponentials", "Solving exponential equations"],
    ["natural-logs", "Natural logarithms"],
    ["growth-decay", "Growth and decay"],
  ]),
  t("proof", "Proof", A_ONLY, [
    ["counterexample", "Disproof by counterexample"],
    ["algebraic-proof", "Algebraic proof"],
  ]),
  t("parametric", "Parametric equations", A_ONLY, [
    ["cartesian-form", "Converting to Cartesian form"],
    ["parametric-differentiation", "Parametric differentiation"],
  ]),
  t("numerical-methods", "Numerical methods", A_ONLY, [
    ["sign-change", "Sign change and root location"],
    ["iteration", "Iterative methods"],
    ["newton-raphson", "The Newton-Raphson method"],
    ["trapezium-rule", "The trapezium rule"],
  ]),
  t("differential-equations", "Differential equations", A_ONLY, [
    ["separable", "Separating the variables"],
    ["particular-solutions", "Particular solutions"],
  ]),
  t("mechanics", "Mechanics", A_ONLY, [
    ["suvat", "Constant acceleration"],
    ["forces", "Forces and Newton's laws"],
    ["projectiles", "Projectiles"],
    ["moments", "Moments"],
  ]),
];


/**
 * The physics topic tree.
 *
 * Keys carry a `phy-` prefix and always will. `TOPIC_INDEX` below is keyed by
 * topic alone, not by subject and topic, so a physics topic called `mechanics`
 * would silently overwrite the maths one — and worse, `intersectPreferences`
 * compares queue topics as bare strings, so two players who picked "waves" in
 * different subjects would be matched into a hand neither could answer. The
 * prefix makes both impossible; `assertNoTopicKeyCollisions` makes it loud if
 * anyone forgets.
 *
 * Common core only. Content that differs between AQA, OCR and Edexcel — named
 * required practicals, A-Level option modules — is deliberately absent, so
 * every question is fair to every student.
 */
export const PHYSICS_TOPICS: readonly TopicDefinition[] = [
  t("phy-motion", "Motion", GCSE_ONLY, [
    ["speed-distance-time", "Speed, distance and time"],
    ["acceleration", "Acceleration"],
    ["velocity-time-graphs", "Velocity-time graphs"],
    ["distance-time-graphs", "Distance-time graphs"],
    ["equations-of-motion", "Equations of motion"],
  ]),
  t("phy-forces", "Forces", BOTH, [
    ["resultant-forces", "Resultant forces"],
    ["newtons-second-law", "Newton's second law"],
    ["weight-mass", "Weight and mass"],
    ["hookes-law", "Hooke's law"],
    ["terminal-velocity", "Terminal velocity"],
    ["moments", "Moments and levers"],
    ["pressure-fluids", "Pressure in fluids"],
  ]),
  t("phy-momentum", "Momentum", BOTH, [
    ["momentum-calculation", "Calculating momentum"],
    ["conservation-of-momentum", "Conservation of momentum"],
    ["impulse", "Impulse and force-time"],
    ["collisions", "Elastic and inelastic collisions"],
  ]),
  t("phy-energy", "Energy", BOTH, [
    ["kinetic-energy", "Kinetic energy"],
    ["gravitational-pe", "Gravitational potential energy"],
    ["elastic-pe", "Elastic potential energy"],
    ["work-done", "Work done"],
    ["power", "Power"],
    ["efficiency", "Efficiency"],
    ["energy-conservation", "Conservation of energy"],
  ]),
  t("phy-electricity", "Electricity", BOTH, [
    ["charge-current", "Charge and current"],
    ["ohms-law", "Ohm's law"],
    ["series-circuits", "Series circuits"],
    ["parallel-circuits", "Parallel circuits"],
    ["electrical-power", "Electrical power"],
    ["energy-transferred", "Energy transferred"],
    ["resistivity", "Resistivity"],
    ["emf-internal-resistance", "EMF and internal resistance"],
    ["potential-dividers", "Potential dividers"],
  ]),
  t("phy-waves", "Waves", BOTH, [
    ["wave-equation", "The wave equation"],
    ["wave-properties", "Wave properties"],
    ["refraction", "Refraction and refractive index"],
    ["em-spectrum", "The electromagnetic spectrum"],
    ["sound-waves", "Sound waves"],
    ["superposition", "Superposition and interference"],
    ["standing-waves", "Standing waves"],
    ["diffraction-grating", "Diffraction gratings"],
  ]),
  t("phy-matter", "Particles and matter", BOTH, [
    ["density", "Density"],
    ["specific-heat-capacity", "Specific heat capacity"],
    ["latent-heat", "Specific latent heat"],
    ["gas-pressure", "Gas pressure"],
    ["states-of-matter", "States of matter"],
  ]),
  t("phy-radioactivity", "Radioactivity", BOTH, [
    ["half-life", "Half-life"],
    ["decay-equations", "Decay equations"],
    ["radiation-types", "Types of radiation"],
    ["activity", "Activity and count rate"],
    ["decay-constant", "The decay constant"],
  ]),
  t("phy-magnetism", "Magnetism and induction", BOTH, [
    ["magnetic-force", "Force on a charged particle"],
    ["motor-effect", "The motor effect"],
    ["transformers", "Transformers"],
    ["electromagnetic-induction", "Electromagnetic induction"],
    ["flux-linkage", "Magnetic flux and flux linkage"],
  ]),
  t("phy-projectiles", "Projectiles", A_ONLY, [
    ["horizontal-projection", "Horizontal projection"],
    ["angled-projection", "Projection at an angle"],
    ["range-and-height", "Range and maximum height"],
  ]),
  t("phy-materials", "Materials", A_ONLY, [
    ["young-modulus", "The Young modulus"],
    ["stress-strain", "Stress and strain"],
    ["spring-combinations", "Springs in series and parallel"],
    ["elastic-energy", "Elastic strain energy"],
  ]),
  t("phy-circular", "Circular motion", A_ONLY, [
    ["angular-speed", "Angular speed"],
    ["centripetal-force", "Centripetal force"],
    ["vertical-circles", "Vertical circles"],
  ]),
  t("phy-oscillations", "Oscillations", A_ONLY, [
    ["shm-equations", "Simple harmonic motion"],
    ["shm-energy", "Energy in SHM"],
    ["pendulum-and-spring", "Pendulums and mass-spring systems"],
    ["resonance", "Damping and resonance"],
  ]),
  t("phy-fields", "Fields", A_ONLY, [
    ["gravitational-field-strength", "Gravitational field strength"],
    ["gravitational-potential", "Gravitational potential"],
    ["orbits", "Orbits and satellites"],
    ["electric-field-strength", "Electric field strength"],
    ["coulombs-law", "Coulomb's law"],
    ["electric-potential", "Electric potential"],
  ]),
  t("phy-capacitance", "Capacitance", A_ONLY, [
    ["capacitor-charge", "Charge stored"],
    ["capacitor-energy", "Energy stored"],
    ["capacitors-combined", "Capacitors in series and parallel"],
    ["rc-discharge", "Discharge through a resistor"],
  ]),
  t("phy-quantum", "Quantum and nuclear", A_ONLY, [
    ["photon-energy", "Photon energy"],
    ["photoelectric-effect", "The photoelectric effect"],
    ["de-broglie", "de Broglie wavelength"],
    ["energy-levels", "Atomic energy levels"],
    ["binding-energy", "Binding energy"],
    ["mass-defect", "Mass defect"],
    ["nuclear-equations", "Nuclear equations"],
  ]),
  t("phy-thermal", "Thermal physics", A_ONLY, [
    ["ideal-gas-law", "The ideal gas law"],
    ["kinetic-theory", "Kinetic theory"],
    ["internal-energy", "Internal energy"],
    ["thermal-transfer", "Thermal energy transfer"],
  ]),
];


/**
 * The chemistry topic tree.
 *
 * `chem-` prefixed for the same reason physics is `phy-`: topic keys are global
 * and queue preferences compare them as bare strings, so "equilibrium" in two
 * subjects would silently become one topic.
 *
 * Common core only — content shared by AQA, OCR and Edexcel. Board-specific
 * required practicals and A-Level option modules are deliberately absent.
 */
export const CHEMISTRY_TOPICS: readonly TopicDefinition[] = [
  t("chem-atomic", "Atomic structure", BOTH, [
    ["sub-atomic-particles", "Protons, neutrons and electrons"],
    ["isotopes", "Isotopes"],
    ["electron-configuration", "Electron configuration"],
    ["relative-atomic-mass", "Relative atomic mass"],
    ["ions", "Ions and charges"],
  ]),
  t("chem-bonding", "Bonding and structure", BOTH, [
    ["ionic-bonding", "Ionic bonding"],
    ["covalent-bonding", "Covalent bonding"],
    ["metallic-bonding", "Metallic bonding"],
    ["structure-properties", "Structure and properties"],
    ["intermolecular-forces", "Intermolecular forces"],
  ]),
  t("chem-quantitative", "Quantitative chemistry", BOTH, [
    ["relative-formula-mass", "Relative formula mass"],
    ["moles", "Moles"],
    ["mass-calculations", "Reacting masses"],
    ["concentration", "Concentration"],
    ["percentage-yield", "Percentage yield"],
    ["atom-economy", "Atom economy"],
    ["empirical-formula", "Empirical and molecular formulae"],
    ["gas-volumes", "Gas volumes"],
    ["titration", "Titration calculations"],
  ]),
  t("chem-equations", "Chemical equations", BOTH, [
    ["balancing", "Balancing equations"],
    ["ionic-equations", "Ionic equations"],
    ["state-symbols", "State symbols"],
    ["half-equations", "Half equations"],
  ]),
  t("chem-reactions", "Types of reaction", BOTH, [
    ["acids-bases", "Acids and bases"],
    ["neutralisation", "Neutralisation"],
    ["redox", "Oxidation and reduction"],
    ["displacement", "Displacement reactions"],
    ["precipitation", "Precipitation"],
    ["electrolysis", "Electrolysis"],
  ]),
  t("chem-rates", "Rates and equilibrium", BOTH, [
    ["rate-calculations", "Rate calculations"],
    ["collision-theory", "Collision theory"],
    ["catalysts", "Catalysts"],
    ["equilibrium-position", "Position of equilibrium"],
    ["le-chatelier", "Le Chatelier's principle"],
    ["equilibrium-constant", "The equilibrium constant"],
  ]),
  t("chem-energetics", "Energetics", BOTH, [
    ["exothermic-endothermic", "Exothermic and endothermic"],
    ["bond-energies", "Bond energy calculations"],
    ["enthalpy-change", "Enthalpy change"],
    ["calorimetry", "Calorimetry"],
    ["hess-cycles", "Hess's law"],
  ]),
  t("chem-organic", "Organic chemistry", BOTH, [
    ["alkanes", "Alkanes"],
    ["alkenes", "Alkenes"],
    ["alcohols", "Alcohols"],
    ["carboxylic-acids", "Carboxylic acids"],
    ["polymers", "Polymers"],
    ["isomerism", "Isomerism"],
    ["functional-groups", "Functional groups"],
    ["organic-reactions", "Organic reactions"],
  ]),
  t("chem-periodic", "The periodic table", BOTH, [
    ["groups-periods", "Groups and periods"],
    ["group-1", "Group 1"],
    ["group-7", "Group 7"],
    ["transition-metals", "Transition metals"],
    ["periodic-trends", "Periodic trends"],
  ]),
  t("chem-analysis", "Chemical analysis", BOTH, [
    ["chemical-tests", "Tests for ions and gases"],
    ["chromatography", "Chromatography"],
    ["purity", "Purity and formulations"],
    ["spectroscopy", "Mass spectrometry"],
  ]),
  t("chem-kinetics", "Kinetics", A_ONLY, [
    ["rate-equations", "Rate equations"],
    ["orders-of-reaction", "Orders of reaction"],
    ["rate-constant", "The rate constant"],
    ["arrhenius", "The Arrhenius equation"],
  ]),
  t("chem-acids", "Acids, bases and buffers", A_ONLY, [
    ["ph-calculations", "pH calculations"],
    ["strong-weak-acids", "Strong and weak acids"],
    ["buffers", "Buffers"],
    ["ka-kw", "Ka and Kw"],
  ]),
  t("chem-electro", "Electrochemistry", A_ONLY, [
    ["electrode-potentials", "Electrode potentials"],
    ["cells", "Electrochemical cells"],
    ["feasibility", "Feasibility of reactions"],
  ]),
  t("chem-thermo", "Thermodynamics", A_ONLY, [
    ["lattice-enthalpy", "Lattice enthalpy"],
    ["entropy", "Entropy"],
    ["gibbs-free-energy", "Gibbs free energy"],
    ["born-haber", "Born-Haber cycles"],
  ]),
];

/**
 * The biology topic tree.
 *
 * `bio-` prefixed, like physics and chemistry, because topic keys are global.
 * Biology is where that matters most: "respiration", "transport", "cells" and
 * "genetics" would all collide with something if left bare.
 *
 * The split between GCSE and A-Level here follows what is actually new at
 * A-Level rather than what is merely revisited. Photosynthesis appears in both
 * trees because the GCSE version is a word equation and the A-Level version is
 * two linked stages with named intermediates — different content under one name.
 */
export const BIOLOGY_TOPICS: readonly TopicDefinition[] = [
  t("bio-cells", "Cell biology", BOTH, [
    ["prokaryotes-eukaryotes", "Prokaryotes and eukaryotes"],
    ["cell-structures", "Organelles and their functions"],
    ["microscopy", "Microscopy and magnification"],
    ["cell-specialisation", "Specialised cells"],
    ["stem-cells", "Stem cells"],
    ["cell-cycle", "The cell cycle"],
  ]),
  t("bio-transport", "Transport in and out of cells", BOTH, [
    ["diffusion", "Diffusion"],
    ["osmosis", "Osmosis"],
    ["active-transport", "Active transport"],
    ["surface-area-volume", "Surface area to volume ratio"],
    ["exchange-surfaces", "Exchange surfaces"],
  ]),
  t("bio-organisation", "Organisation", BOTH, [
    ["tissues-organs", "Tissues, organs and systems"],
    ["enzymes", "Enzymes"],
    ["digestive-system", "The digestive system"],
    ["heart-circulation", "The heart and circulation"],
    ["blood", "Blood"],
    ["lungs-gas-exchange", "The lungs and gas exchange"],
  ]),
  t("bio-respiration", "Respiration", BOTH, [
    ["aerobic-respiration", "Aerobic respiration"],
    ["anaerobic-respiration", "Anaerobic respiration"],
    ["metabolism", "Metabolism"],
    ["exercise-response", "Response to exercise"],
  ]),
  t("bio-infection", "Infection and response", BOTH, [
    ["pathogens", "Pathogens and disease"],
    ["immune-system", "The immune system"],
    ["vaccination", "Vaccination"],
    ["antibiotics", "Antibiotics and painkillers"],
    ["drug-development", "Developing drugs"],
    ["plant-diseases", "Plant disease and defence"],
  ]),
  t("bio-plants", "Plant biology", BOTH, [
    ["photosynthesis", "Photosynthesis"],
    ["limiting-factors", "Limiting factors"],
    ["plant-transport", "Xylem and phloem"],
    ["transpiration", "Transpiration"],
    ["plant-tissues", "Plant tissues"],
    ["plant-hormones", "Plant hormones"],
  ]),
  t("bio-homeostasis", "Homeostasis and response", BOTH, [
    ["nervous-system", "The nervous system"],
    ["reflex-arc", "The reflex arc"],
    ["hormones", "Hormones and the endocrine system"],
    ["blood-glucose", "Control of blood glucose"],
    ["thermoregulation", "Thermoregulation"],
    ["kidneys", "The kidneys"],
    ["water-balance", "Water and nitrogen balance"],
  ]),
  t("bio-inheritance", "Inheritance", BOTH, [
    ["dna-structure", "DNA structure"],
    ["genes-chromosomes", "Genes and chromosomes"],
    ["mitosis", "Mitosis"],
    ["meiosis", "Meiosis"],
    ["punnett-squares", "Genetic crosses"],
    ["sex-determination", "Sex determination"],
    ["genetic-disorders", "Inherited disorders"],
    ["variation", "Variation"],
  ]),
  t("bio-evolution", "Evolution and classification", BOTH, [
    ["natural-selection", "Natural selection"],
    ["evidence-for-evolution", "Evidence for evolution"],
    ["speciation", "Speciation"],
    ["classification", "Classification"],
    ["selective-breeding", "Selective breeding"],
    ["genetic-engineering", "Genetic engineering"],
  ]),
  t("bio-ecology", "Ecology", BOTH, [
    ["ecosystems", "Ecosystems and interdependence"],
    ["food-chains", "Food chains and webs"],
    ["biodiversity", "Biodiversity"],
    ["carbon-cycle", "The carbon cycle"],
    ["water-cycle", "The water cycle"],
    ["sampling", "Sampling techniques"],
    ["human-impact", "Human impact on the environment"],
  ]),
  t("bio-biochemistry", "Biological molecules", A_ONLY, [
    ["carbohydrates", "Carbohydrates"],
    ["lipids", "Lipids"],
    ["proteins", "Proteins"],
    ["water-properties", "Properties of water"],
    ["nucleic-acids", "Nucleic acids"],
    ["enzyme-kinetics", "Enzyme kinetics and inhibition"],
  ]),
  t("bio-genetics", "Molecular genetics", A_ONLY, [
    ["transcription", "Transcription"],
    ["translation", "Translation"],
    ["genetic-code", "The genetic code"],
    ["mutations", "Mutations"],
    ["gene-expression", "Control of gene expression"],
    ["pcr-sequencing", "PCR and sequencing"],
  ]),
  t("bio-energy", "Energy transfer", A_ONLY, [
    ["photosynthesis-stages", "Light-dependent and light-independent stages"],
    ["respiration-stages", "Glycolysis, the Krebs cycle and oxidative phosphorylation"],
    ["chemiosmosis", "Chemiosmosis"],
    ["energy-transfer-ecosystems", "Energy transfer through ecosystems"],
    ["nutrient-cycles", "Nitrogen and phosphorus cycles"],
  ]),
  t("bio-populations", "Populations and communities", A_ONLY, [
    ["hardy-weinberg", "The Hardy-Weinberg principle"],
    ["population-growth", "Population growth"],
    ["succession", "Succession"],
    ["competition", "Competition"],
    ["predator-prey", "Predator-prey relationships"],
  ]),
  t("bio-control", "Nervous and muscular control", A_ONLY, [
    ["action-potentials", "Action potentials"],
    ["synapses", "Synapses"],
    ["muscle-contraction", "Muscle contraction"],
    ["receptors", "Receptors"],
    ["homeostatic-control", "Homeostatic control mechanisms"],
  ]),
  t("bio-immunity", "Immunity", A_ONLY, [
    ["antibodies", "Antibodies"],
    ["phagocytosis", "Phagocytosis"],
    ["cell-mediated", "Cellular and humoral responses"],
    ["monoclonal-antibodies", "Monoclonal antibodies"],
    ["hiv-viruses", "HIV and viruses"],
  ]),
  t("bio-methods", "Practical skills and analysis", A_ONLY, [
    ["experimental-design", "Experimental design"],
    ["standard-deviation", "Means and standard deviation"],
    ["chi-squared", "The chi-squared test"],
    ["correlation-causation", "Correlation and causation"],
    ["biological-drawing", "Biological drawing and scale"],
  ]),
];

/**
 * The computer science topic tree.
 *
 * `cs-` prefixed, like physics and chemistry, because topic keys are global and
 * queue preferences compare them as bare strings — an unprefixed "networks" or
 * "algorithms" would eventually collide with something.
 *
 * Common core only: the content that AQA, OCR and Edexcel all examine, in the
 * form they agree on. Pseudocode questions use a board-neutral style (`FOR`,
 * `WHILE`, `←` for assignment) so no student is reading an unfamiliar dialect,
 * and every subtopic here has computed questions behind it — a binary
 * conversion is worked out, not looked up, and a trace table is executed.
 */
export const COMPSCI_TOPICS: readonly TopicDefinition[] = [
  t("cs-number", "Number systems", BOTH, [
    ["binary-denary", "Binary to denary"],
    ["denary-binary", "Denary to binary"],
    ["hexadecimal", "Hexadecimal"],
    ["binary-addition", "Binary addition"],
    ["binary-shifts", "Binary shifts"],
    ["storage-units", "Units of storage"],
    ["twos-complement", "Two's complement"],
    ["binary-subtraction", "Binary subtraction"],
    ["bitwise", "Bitwise manipulation"],
    ["floating-point", "Floating point representation"],
  ]),
  t("cs-representation", "Data representation", BOTH, [
    ["character-sets", "Character sets and ASCII"],
    ["image-representation", "Bitmap images"],
    ["sound-representation", "Sampled sound"],
    ["file-size", "File size calculations"],
    ["compression", "Compression"],
    ["run-length-encoding", "Run-length encoding"],
  ]),
  t("cs-boolean", "Boolean logic", BOTH, [
    ["logic-gates", "Logic gates"],
    ["truth-tables", "Truth tables"],
    ["boolean-expressions", "Boolean expressions"],
    ["logic-circuits", "Logic circuits"],
    ["de-morgans", "De Morgan's laws"],
    ["boolean-algebra", "Boolean algebra laws"],
    ["karnaugh-maps", "Karnaugh maps"],
    ["adders", "Half and full adders"],
  ]),
  t("cs-architecture", "Systems architecture", BOTH, [
    ["cpu-components", "CPU components"],
    ["fetch-execute", "The fetch–execute cycle"],
    ["cpu-performance", "Factors affecting CPU performance"],
    ["von-neumann", "The von Neumann architecture"],
    ["embedded-systems", "Embedded systems"],
    ["registers", "Registers"],
    ["addressing-modes", "Addressing modes"],
    ["assembly-language", "Assembly language"],
  ]),
  t("cs-memory", "Memory and storage", BOTH, [
    ["ram-rom", "RAM and ROM"],
    ["virtual-memory", "Virtual memory"],
    ["secondary-storage", "Secondary storage"],
    ["storage-types", "Optical, magnetic and solid state"],
    ["cache", "Cache memory"],
  ]),
  t("cs-networks", "Networks", BOTH, [
    ["network-types", "LANs and WANs"],
    ["topologies", "Network topologies"],
    ["protocols", "Protocols and layers"],
    ["addressing", "IP and MAC addresses"],
    ["packet-switching", "Packet switching"],
    ["network-performance", "Network performance"],
    ["tcp-ip", "The TCP/IP stack"],
    ["subnetting", "Subnet masks"],
  ]),
  t("cs-security", "Cyber security", BOTH, [
    ["malware", "Malware"],
    ["social-engineering", "Social engineering"],
    ["network-attacks", "Network attacks"],
    ["protection", "Protection measures"],
    ["encryption", "Encryption"],
    ["asymmetric-encryption", "Asymmetric encryption"],
  ]),
  t("cs-algorithms", "Algorithms", BOTH, [
    ["linear-search", "Linear search"],
    ["binary-search", "Binary search"],
    ["bubble-sort", "Bubble sort"],
    ["merge-sort", "Merge sort"],
    ["insertion-sort", "Insertion sort"],
    ["trace-tables", "Trace tables"],
    ["complexity", "Time complexity"],
    ["big-o", "Big-O notation"],
    ["recursion", "Recursion"],
    ["dijkstra", "Dijkstra's algorithm"],
    ["graph-traversal", "Graph traversal"],
  ]),
  t("cs-programming", "Programming fundamentals", BOTH, [
    ["data-types", "Data types"],
    ["operators", "Operators and expressions"],
    ["selection", "Selection"],
    ["iteration", "Iteration"],
    ["arrays", "Arrays and lists"],
    ["string-manipulation", "String manipulation"],
    ["subprograms", "Functions and procedures"],
    ["oop", "Object-oriented programming"],
    ["functional", "Functional programming"],
  ]),
  t("cs-databases", "Databases and SQL", BOTH, [
    ["relational-model", "The relational model"],
    ["sql-select", "SQL SELECT"],
    ["keys", "Primary and foreign keys"],
    ["normalisation", "Normalisation"],
    ["sql-joins", "SQL joins"],
    ["transactions", "Transaction processing"],
  ]),
  t("cs-data-structures", "Data structures", BOTH, [
    ["stacks", "Stacks"],
    ["queues", "Queues"],
    ["linked-lists", "Linked lists"],
    ["binary-trees", "Binary trees"],
    ["tree-traversal", "Tree traversal"],
    ["graphs", "Graphs"],
    ["hash-tables", "Hash tables"],
  ]),
  t("cs-theory", "Theory of computation", A_ONLY, [
    ["finite-state-machines", "Finite state machines"],
    ["regular-expressions", "Regular expressions"],
    ["bnf", "Backus–Naur Form"],
    ["computability", "Computability and complexity"],
  ]),
  t("cs-software", "Systems software", A_ONLY, [
    ["operating-systems", "Operating system functions"],
    ["scheduling", "Scheduling algorithms"],
    ["translators", "Translators"],
    ["compilation", "Stages of compilation"],
    ["methodologies", "Development methodologies"],
  ]),
];

/**
 * The Further Maths topic tree.
 *
 * Further Maths is its own A-Level, taken alongside Maths, so it is a separate
 * subject rather than more A-Level topics on `maths` — a student picks it
 * separately and a query scoped to Maths should not return complex-number
 * questions. Every topic is A-Level only. Keys are prefixed `fm-` so they
 * cannot collide with a Maths topic of the same everyday name.
 */
export const FURTHER_MATHS_TOPICS: readonly TopicDefinition[] = [
  t("fm-complex", "Complex numbers", A_ONLY, [
    ["arithmetic", "Arithmetic of complex numbers"],
    ["modulus-argument", "Modulus and argument"],
    ["conjugate-roots", "Complex conjugate roots"],
    ["de-moivre", "De Moivre's theorem"],
    ["roots-of-unity", "Roots of unity"],
    ["argand-loci", "Loci in the Argand diagram"],
  ]),
  t("fm-matrices", "Matrices", A_ONLY, [
    ["multiplication", "Matrix multiplication"],
    ["determinant", "Determinants"],
    ["inverse", "The inverse matrix"],
    ["transformations", "Matrix transformations"],
    ["simultaneous", "Solving simultaneous equations"],
  ]),
  t("fm-series", "Further series", A_ONLY, [
    ["standard-sums", "Standard summation results"],
    ["method-of-differences", "The method of differences"],
    ["maclaurin", "Maclaurin series"],
  ]),
  t("fm-roots", "Roots of polynomials", A_ONLY, [
    ["sum-product", "Sum and product of roots"],
    ["transformed-roots", "Transforming the roots"],
  ]),
  t("fm-induction", "Proof by induction", A_ONLY, [
    ["summation", "Induction with summation"],
    ["divisibility", "Induction with divisibility"],
  ]),
  t("fm-vectors", "Further vectors", A_ONLY, [
    ["cross-product", "The vector (cross) product"],
    ["scalar-triple", "The scalar triple product"],
    ["lines-planes", "Lines and planes in 3D"],
    ["distances", "Distances and angles"],
  ]),
  t("fm-polar", "Polar coordinates", A_ONLY, [
    ["conversion", "Converting between polar and Cartesian"],
    ["polar-curves", "Polar curves and areas"],
  ]),
  t("fm-hyperbolic", "Hyperbolic functions", A_ONLY, [
    ["definitions", "Definitions and values"],
    ["identities", "Hyperbolic identities"],
    ["inverse-hyperbolic", "Inverse hyperbolic functions"],
  ]),
  t("fm-calculus", "Further calculus", A_ONLY, [
    ["inverse-trig-derivatives", "Differentiating inverse trigonometric functions"],
    ["improper-integrals", "Improper integrals"],
    ["volume-revolution", "Volumes of revolution"],
    ["reduction-formulae", "Reduction formulae"],
  ]),
  t("fm-differential-equations", "Differential equations", A_ONLY, [
    ["first-order", "First-order differential equations"],
    ["second-order", "Second-order differential equations"],
  ]),

  /* ---- GCSE Further Maths (AQA Level 2 Certificate) ---- */
  t("fmg-algebra", "Further algebra", GCSE_ONLY, [
    ["algebraic-fractions", "Simplifying algebraic fractions"],
    ["completing-the-square", "Completing the square"],
    ["factor-theorem", "The factor theorem"],
    ["polynomial-division", "Dividing polynomials"],
    ["cubics", "Solving and sketching cubics"],
    ["surds", "Surd manipulation"],
  ]),
  t("fmg-functions", "Functions and graphs", GCSE_ONLY, [
    ["composite", "Composite functions"],
    ["inverse", "Inverse functions"],
    ["domain-range", "Domain and range"],
    ["transformations", "Graph transformations"],
  ]),
  t("fmg-coordinate", "Coordinate geometry", GCSE_ONLY, [
    ["straight-lines", "Parallel and perpendicular lines"],
    ["circle-equation", "The equation of a circle"],
    ["tangents", "Tangents to a circle"],
  ]),
  t("fmg-calculus", "Differentiation", GCSE_ONLY, [
    ["differentiate", "Differentiating polynomials"],
    ["gradient", "Gradient at a point"],
    ["tangent-normal", "Tangents and normals"],
    ["stationary-points", "Stationary points"],
    ["increasing-decreasing", "Increasing and decreasing functions"],
  ]),
  t("fmg-matrices", "Matrices", GCSE_ONLY, [
    ["arithmetic", "Matrix arithmetic"],
    ["transformations", "Matrix transformations"],
    ["combined", "Combined transformations"],
  ]),
  t("fmg-trigonometry", "Further trigonometry", GCSE_ONLY, [
    ["exact-values", "Exact trigonometric values"],
    ["sine-cosine-rule", "The sine and cosine rules"],
    ["identities", "Trigonometric identities"],
    ["equations", "Solving trigonometric equations"],
  ]),
  t("fmg-sequences", "Sequences and series", GCSE_ONLY, [
    ["quadratic-nth-term", "The nth term of a quadratic sequence"],
    ["limiting-value", "Limiting value of a sequence"],
    ["arithmetic-series", "Sum of an arithmetic series"],
  ]),
];

export const TOPICS_BY_SUBJECT: Record<Subject, readonly TopicDefinition[]> = {
  maths: MATHS_TOPICS,
  "further-maths": FURTHER_MATHS_TOPICS,
  physics: PHYSICS_TOPICS,
  chemistry: CHEMISTRY_TOPICS,
  biology: BIOLOGY_TOPICS,
  "computer-science": COMPSCI_TOPICS,
};

/* ==========================================================================
   Lookups and validation
   ========================================================================== */

const TOPIC_INDEX = new Map<string, TopicDefinition>();
const SUBTOPIC_INDEX = new Map<string, { topic: TopicDefinition; label: string }>();
const SUBJECT_OF_TOPIC = new Map<string, Subject>();

/**
 * Two subjects must never share a topic key.
 *
 * The index below is keyed by topic alone, so a collision would overwrite one
 * subject's definition with another's and the loser's questions would fail
 * validation for no visible reason. Worse, queue preferences carry bare topic
 * strings: two players who both picked "waves" in different subjects would be
 * matched into a hand neither of them could answer. Subject prefixes prevent
 * it; this throws at module load if anyone forgets one.
 */
function assertNoTopicKeyCollisions(subject: Subject, key: string): void {
  const owner = SUBJECT_OF_TOPIC.get(key);
  if (owner && owner !== subject) {
    throw new Error(
      `Topic key "${key}" is claimed by both ${owner} and ${subject}. ` +
        "Topic keys are global; prefix the newer subject's key.",
    );
  }
  SUBJECT_OF_TOPIC.set(key, subject);
}

for (const [subject, topics] of Object.entries(TOPICS_BY_SUBJECT) as [
  Subject,
  readonly TopicDefinition[],
][]) {
  for (const topic of topics) {
    assertNoTopicKeyCollisions(subject, topic.key);
    TOPIC_INDEX.set(topic.key, topic);
    for (const sub of topic.subtopics) {
      SUBTOPIC_INDEX.set(`${topic.key}/${sub.key}`, { topic, label: sub.label });
    }
  }
}

export function topic(key: string): TopicDefinition | null {
  return TOPIC_INDEX.get(key) ?? null;
}

export function topicLabel(key: string): string {
  return TOPIC_INDEX.get(key)?.label ?? key;
}

export function subtopicLabel(topicKey: string, subtopicKey: string): string {
  return SUBTOPIC_INDEX.get(`${topicKey}/${subtopicKey}`)?.label ?? subtopicKey;
}

/** Does this topic/subtopic pair exist? The import refuses anything that fails. */
export function isKnownSubtopic(topicKey: string, subtopicKey: string): boolean {
  return SUBTOPIC_INDEX.has(`${topicKey}/${subtopicKey}`);
}

export function topicsForStage(subject: Subject, stage: Stage): readonly TopicDefinition[] {
  return TOPICS_BY_SUBJECT[subject].filter((topicDef) => topicDef.stages.includes(stage));
}

export function isCurriculumLevel(value: string): value is CurriculumLevel {
  return (CURRICULUM_LEVELS as readonly string[]).includes(value);
}

export function isQuestionType(value: string): value is BankQuestionType {
  return (QUESTION_TYPES as readonly string[]).includes(value);
}

export function isSubject(value: string): value is Subject {
  return (SUBJECTS as readonly string[]).includes(value);
}

/** Every subtopic in the tree, as `topic/subtopic` — used by the coverage report. */
export function allSubtopicKeys(subject: Subject): string[] {
  return TOPICS_BY_SUBJECT[subject].flatMap((topicDef) =>
    topicDef.subtopics.map((s) => `${topicDef.key}/${s.key}`),
  );
}
