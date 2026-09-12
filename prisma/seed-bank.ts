/**
 * Seed the permanent question bank.
 *
 *   npx tsx prisma/seed-bank.ts              generate and import everything
 *   npx tsx prisma/seed-bank.ts --dry-run    generate and validate, write nothing
 *   npx tsx prisma/seed-bank.ts --file x.json  import an outside dataset
 *
 * Safe to run repeatedly. Every question carries a stable `sourceKey`, so a
 * second run updates the rows a first run created rather than duplicating them,
 * and nobody's answer history is disturbed.
 */

import { readFileSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { generateAll, GENERATORS } from "../src/lib/bank/generate";
import { runImport, parseImportFile, type ImportQuestion } from "../src/lib/bank/import";
import { allSubtopicKeys, bandFor } from "../src/lib/bank/taxonomy";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileIndex = args.indexOf("--file");
  const filePath = fileIndex >= 0 ? args[fileIndex + 1] : null;

  let questions: ImportQuestion[];

  if (filePath) {
    console.log(`Reading ${filePath}`);
    const parsed = parseImportFile(JSON.parse(readFileSync(filePath, "utf8")));
    for (const error of parsed.errors) console.warn(`  ! ${error}`);
    questions = parsed.questions;
    console.log(`  ${questions.length} questions in the file\n`);
  } else {
    console.log(`Generating from ${GENERATORS.length} generators…`);
    questions = generateAll().map((q) => ({
      sourceKey: q.sourceKey,
      subject: q.subject,
      topic: q.topic,
      subtopic: q.subtopic,
      curriculumLevel: q.curriculumLevel,
      difficulty: q.difficulty,
      questionType: q.questionType,
      prompt: q.prompt,
      answer: q.answer,
      explanation: q.explanation,
      options: q.options,
      estimatedSeconds: q.estimatedSeconds,
      marks: q.marks,
      calculator: q.calculator,
      sourceName: q.sourceName,
      sourceUrl: q.sourceUrl,
      sourceLicence: q.sourceLicence,
    }));
    console.log(`  ${questions.length} questions\n`);
  }

  report(questions);

  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    return;
  }

  console.log("\nImporting…");
  const result = await runImport(prisma, questions, {
    onProgress: (done, total) => {
      if (done % 500 === 0 || done === total) console.log(`  ${done}/${total}`);
    },
  });

  console.log(
    `\n  created ${result.created}, updated ${result.updated}, skipped ${result.skipped}`,
  );
  for (const error of result.errors.slice(0, 20)) console.warn(`  ! ${error}`);
  if (result.errors.length > 20) console.warn(`  … and ${result.errors.length - 20} more`);

  const total = await prisma.bankQuestion.count({ where: { retired: false } });
  console.log(`\nThe bank now holds ${total} live questions.`);
}

/** What the bank covers, printed before anything is written. */
function report(questions: readonly ImportQuestion[]) {
  const count = (pick: (q: ImportQuestion) => string) => {
    const out = new Map<string, number>();
    for (const q of questions) {
      const key = pick(q);
      out.set(key, (out.get(key) ?? 0) + 1);
    }
    return [...out].sort((a, b) => b[1] - a[1]);
  };

  const show = (title: string, rows: [string, number][]) => {
    console.log(`  ${title}`);
    for (const [key, n] of rows) console.log(`    ${key.padEnd(26)} ${n}`);
  };

  show("Curriculum level", count((q) => q.curriculumLevel));
  show("Difficulty band", count((q) => bandFor(q.difficulty)));
  show("Question type", count((q) => q.questionType ?? "MCQ_SINGLE"));

  const covered = new Set(questions.map((q) => `${q.topic}/${q.subtopic}`));
  const all = allSubtopicKeys("maths");
  const missing = all.filter((key) => !covered.has(key));

  console.log(`  Subtopic coverage           ${covered.size}/${all.length}`);
  if (missing.length) console.log(`    uncovered: ${missing.join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
