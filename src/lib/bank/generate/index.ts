/**
 * The generator registry.
 *
 * Every question in the permanent bank is dealt from exactly one generator
 * here, and every generator's output is verified by `tests/bank.test.ts` before
 * it can be seeded — one correct option per choice question, no duplicate
 * prompts anywhere in the bank, taxonomy tags that exist, and each generator's
 * own `check` re-deriving its answer a second way.
 *
 * Adding a subject means adding files and listing them below. Nothing else in
 * the bank knows or cares which generators exist.
 */

import type { Generator, GeneratedQuestion } from "./kit";

import { gcseNumber } from "./gcse-number";
import { gcseAlgebra } from "./gcse-algebra";
import { gcseGeometry } from "./gcse-geometry";
import { gcseData } from "./gcse-data";
import { aLevelPure } from "./alevel-pure";
import { aLevelCalculus } from "./alevel-calculus";
import { aLevelApplied } from "./alevel-applied";
import { coverage } from "./coverage";

import { physicsMotion } from "./physics-motion";
import { physicsForces } from "./physics-forces";
import { physicsEnergy } from "./physics-energy";
import { physicsElectricity } from "./physics-electricity";
import { physicsWaves } from "./physics-waves";
import { physicsNuclear } from "./physics-nuclear";
import { physicsALevelMechanics } from "./physics-alevel-mechanics";
import { physicsALevelFields } from "./physics-alevel-fields";
import { chemistryQuantitative } from "./chemistry-quantitative";
import { chemistryAtomic } from "./chemistry-atomic";
import { chemistryReactions } from "./chemistry-reactions";
import { chemistryEnergetics } from "./chemistry-energetics";
import { chemistryALevel } from "./chemistry-alevel";
import { biologyCells } from "./biology-cells";
import { biologyOrganisation } from "./biology-organisation";
import { biologyPlants } from "./biology-plants";
import { biologyGenetics } from "./biology-genetics";
import { biologyEcology } from "./biology-ecology";
import { biologyALevelMolecules } from "./biology-alevel-molecules";
import { biologyALevelSystems } from "./biology-alevel-systems";

import { csRepresentation } from "./cs-representation";
import { csLogic } from "./cs-logic";
import { csSystems } from "./cs-systems";
import { csAlgorithms } from "./cs-algorithms";
import { csCoverage } from "./cs-coverage";
import { csGcseDepth } from "./cs-gcse-depth";
import { csDataStructures } from "./cs-data-structures";
import { csALevelNumber } from "./cs-alevel-number";
import { csALevelAlgorithms } from "./cs-alevel-algorithms";
import { csALevelLogic } from "./cs-alevel-logic";
import { csALevelArchitecture } from "./cs-alevel-architecture";
import { csALevelDatabases } from "./cs-alevel-databases";
import { csALevelNetworks } from "./cs-alevel-networks";
import { csALevelParadigms } from "./cs-alevel-paradigms";
import { csTheory } from "./cs-theory";
import { csSoftware } from "./cs-software";

import { fmComplex } from "./fm-complex";
import { fmMatrices } from "./fm-matrices";
import { fmSeriesRoots } from "./fm-series-roots";
import { fmVectors } from "./fm-vectors";
import { fmHyperbolic } from "./fm-hyperbolic";
import { fmCalculusDE } from "./fm-calculus-de";
import { fmPolarInduction } from "./fm-polar-induction";
import { fmGcseAlgebra } from "./fm-gcse-algebra";
import { fmGcseCalculus } from "./fm-gcse-calculus";
import { fmGcseFunctions } from "./fm-gcse-functions";
import { fmGcseCoordinate } from "./fm-gcse-coordinate";
import { fmGcseMatrices } from "./fm-gcse-matrices";
import { fmGcseTrig } from "./fm-gcse-trig";
import { fmGcseSequences } from "./fm-gcse-sequences";

export const GENERATORS: readonly Generator[] = [
  ...gcseNumber,
  ...gcseAlgebra,
  ...gcseGeometry,
  ...gcseData,
  ...aLevelPure,
  ...aLevelCalculus,
  ...aLevelApplied,
  ...coverage,

  ...physicsMotion,
  ...physicsForces,
  ...physicsEnergy,
  ...physicsElectricity,
  ...physicsWaves,
  ...physicsNuclear,
  ...physicsALevelMechanics,
  ...physicsALevelFields,
  ...chemistryQuantitative,
  ...chemistryAtomic,
  ...chemistryReactions,
  ...chemistryEnergetics,
  ...chemistryALevel,
  ...biologyCells,
  ...biologyOrganisation,
  ...biologyPlants,
  ...biologyGenetics,
  ...biologyEcology,
  ...biologyALevelMolecules,
  ...biologyALevelSystems,

  ...csRepresentation,
  ...csLogic,
  ...csSystems,
  ...csAlgorithms,
  ...csCoverage,
  ...csGcseDepth,
  ...csDataStructures,
  ...csALevelNumber,
  ...csALevelAlgorithms,
  ...csALevelLogic,
  ...csALevelArchitecture,
  ...csALevelDatabases,
  ...csALevelNetworks,
  ...csALevelParadigms,
  ...csTheory,
  ...csSoftware,

  ...fmComplex,
  ...fmMatrices,
  ...fmSeriesRoots,
  ...fmVectors,
  ...fmHyperbolic,
  ...fmCalculusDE,
  ...fmPolarInduction,
  ...fmGcseAlgebra,
  ...fmGcseCalculus,
  ...fmGcseFunctions,
  ...fmGcseCoordinate,
  ...fmGcseMatrices,
  ...fmGcseTrig,
  ...fmGcseSequences,
];

/** Every question the bank would seed, in registry order. */
export function generateAll(): GeneratedQuestion[] {
  return GENERATORS.flatMap((g) => g.all());
}

/** How many questions the registry currently produces. */
export function bankSize(): number {
  return GENERATORS.reduce((total, g) => total + g.variants, 0);
}

export type { Generator, GeneratedQuestion } from "./kit";
