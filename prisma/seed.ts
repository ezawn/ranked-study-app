/**
 * Seed data.
 *
 * Creates two accounts (one free, one premium), real study material, a
 * community, and enough history that every screen has something to show —
 * including content dated far enough back that the 24-hour coin gate has
 * already passed, so you can actually earn coins straight away.
 *
 *   npm run db:seed
 *
 * Sign in with alex@studyquest.test / password123 (free)
 *            or  jordan@studyquest.test / password123 (premium)
 */

import "dotenv/config";

import { PrismaClient, type QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

async function main() {
  console.log("Seeding…");

  const passwordHash = await bcrypt.hash("password123", 12);

  // ---------------------------------------------------------------- Users
  const alex = await db.user.upsert({
    where: { email: "alex@studyquest.test" },
    update: {},
    create: {
      email: "alex@studyquest.test",
      name: "Alex Carter",
      username: "alexc",
      passwordHash,
      plan: "FREE",
      timezone: "Europe/London",
      createdAt: daysAgo(40),
      streak: { create: {} },
    },
  });

  const jordan = await db.user.upsert({
    where: { email: "jordan@studyquest.test" },
    update: {},
    create: {
      email: "jordan@studyquest.test",
      name: "Jordan Blake",
      username: "jordanb",
      passwordHash,
      plan: "PREMIUM",
      timezone: "Europe/London",
      createdAt: daysAgo(60),
      streak: { create: {} },
      subscription: { create: { provider: "manual", status: "active" } },
    },
  });

  // Start clean so re-running the seed doesn't pile up duplicates.
  await db.flashcardSet.deleteMany({ where: { ownerId: { in: [alex.id, jordan.id] } } });
  await db.quiz.deleteMany({ where: { ownerId: { in: [alex.id, jordan.id] } } });
  await db.community.deleteMany({ where: { ownerId: { in: [alex.id, jordan.id] } } });

  // ----------------------------------------------------------- Flashcards
  const biology = await db.flashcardSet.create({
    data: {
      ownerId: alex.id,
      title: "Cell transport — membranes",
      description: "Diffusion, osmosis, active transport. AQA A-level paper 1.",
      subject: "Biology",
      isPublic: true,
      publishedAt: daysAgo(6),
      createdAt: daysAgo(8),
      cardCount: 0,
      cards: {
        create: [
          { front: "Define diffusion", back: "Net movement of particles from a region of higher concentration to lower concentration, down a concentration gradient. Passive — no ATP required.", position: 0 },
          { front: "Define osmosis", back: "Net movement of water molecules from a region of higher water potential to lower water potential across a partially permeable membrane.", position: 1 },
          { front: "What is water potential measured in, and what is the value for pure water?", back: "Kilopascals (kPa). Pure water has a water potential of 0 kPa — every solution is negative.", hint: "Think about the sign.", position: 2 },
          { front: "Define active transport", back: "Movement of substances against a concentration gradient using carrier proteins and ATP.", position: 3 },
          { front: "Why does active transport require carrier proteins specifically?", back: "The carrier protein binds the substance, changes shape using energy from ATP hydrolysis, and releases it on the other side. Channel proteins can't do this — they only allow passive flow.", position: 4 },
          { front: "What is facilitated diffusion?", back: "Passive movement of larger or polar molecules down their concentration gradient through channel or carrier proteins. No ATP required.", position: 5 },
          { front: "Give three factors that affect the rate of diffusion", back: "Concentration gradient (steeper is faster), surface area (larger is faster), thickness of the exchange surface (thinner is faster). Temperature also increases kinetic energy.", position: 6 },
          { front: "What is co-transport?", back: "Two substances moved together by the same carrier protein, where the movement of one down its gradient powers the movement of the other against its gradient — e.g. sodium-glucose co-transport in the ileum.", position: 7 },
          { front: "Why do cells in a hypotonic solution burst?", back: "Water moves in by osmosis down the water potential gradient. Animal cells have no cell wall to resist the pressure, so the membrane ruptures (lysis).", position: 8 },
          { front: "What happens to a plant cell in a hypertonic solution?", back: "Water leaves by osmosis, the protoplast shrinks away from the cell wall — plasmolysis. The cell becomes flaccid.", position: 9 },
        ],
      },
    },
  });
  await db.flashcardSet.update({ where: { id: biology.id }, data: { cardCount: 10 } });

  const chemistry = await db.flashcardSet.create({
    data: {
      ownerId: alex.id,
      title: "Organic chemistry — functional groups",
      subject: "Chemistry",
      description: "Naming, structure and reactions.",
      createdAt: daysAgo(4),
      cardCount: 0,
      cards: {
        create: [
          { front: "Alkane general formula", back: "CnH2n+2 — saturated, single bonds only.", position: 0 },
          { front: "Alkene general formula", back: "CnH2n — contains at least one C=C double bond.", position: 1 },
          { front: "What functional group does -OH represent?", back: "Hydroxyl — alcohols. Named with the suffix -ol.", position: 2 },
          { front: "Carboxylic acid functional group", back: "-COOH. Named with the suffix -oic acid.", position: 3 },
          { front: "What is the test for an alkene?", back: "Bromine water decolourises from orange to colourless — electrophilic addition across the double bond.", position: 4 },
          { front: "Distinguish between an aldehyde and a ketone", back: "Aldehydes have the C=O at the end of the chain (-CHO, suffix -al); ketones have it in the middle (suffix -one). Aldehydes reduce Tollens' reagent; ketones don't.", position: 5 },
        ],
      },
    },
  });
  await db.flashcardSet.update({ where: { id: chemistry.id }, data: { cardCount: 6 } });

  const history = await db.flashcardSet.create({
    data: {
      ownerId: jordan.id,
      title: "Cold War — key dates",
      subject: "History",
      description: "1945 to 1991, the dates examiners actually ask for.",
      isPublic: true,
      publishedAt: daysAgo(10),
      createdAt: daysAgo(12),
      downloads: 34,
      cardCount: 0,
      cards: {
        create: [
          { front: "Yalta Conference", back: "February 1945 — Roosevelt, Churchill and Stalin agree the division of post-war Germany and free elections in Eastern Europe.", position: 0 },
          { front: "Truman Doctrine", back: "March 1947 — US pledges to support free peoples resisting subjugation. The formal start of containment.", position: 1 },
          { front: "Marshall Plan", back: "1948 — $13 billion of US economic aid to rebuild Western Europe and make communism less appealing.", position: 2 },
          { front: "Berlin Blockade and Airlift", back: "June 1948 to May 1949 — Stalin blockades West Berlin; the Allies supply it by air for 11 months.", position: 3 },
          { front: "Cuban Missile Crisis", back: "October 1962 — 13 days after US spy planes find Soviet missiles in Cuba. Ends with Soviet withdrawal and a secret US withdrawal of missiles from Turkey.", position: 4 },
          { front: "Fall of the Berlin Wall", back: "9 November 1989.", position: 5 },
          { front: "Dissolution of the USSR", back: "26 December 1991.", position: 6 },
        ],
      },
    },
  });
  await db.flashcardSet.update({ where: { id: history.id }, data: { cardCount: 7 } });

  // --------------------------------------------------------------- Quizzes
  interface SeedQuestion {
    type: QuestionType;
    prompt: string;
    marks: number;
    markScheme?: string;
    explanation?: string;
    options?: Array<[string, boolean]>;
  }

  async function makeQuiz(opts: {
    ownerId: string;
    title: string;
    subject: string;
    description: string;
    isPublic?: boolean;
    createdAt: Date;
    questions: SeedQuestion[];
  }) {
    const totalMarks = opts.questions.reduce((sum, q) => sum + q.marks, 0);

    return db.quiz.create({
      data: {
        ownerId: opts.ownerId,
        title: opts.title,
        subject: opts.subject,
        description: opts.description,
        isPublic: opts.isPublic ?? false,
        publishedAt: opts.isPublic ? opts.createdAt : null,
        createdAt: opts.createdAt,
        totalMarks,
        questionCount: opts.questions.length,
        questions: {
          create: opts.questions.map((q, index) => ({
            type: q.type,
            prompt: q.prompt,
            marks: q.marks,
            markScheme: q.markScheme ?? null,
            explanation: q.explanation ?? null,
            position: index,
            options: {
              create: (q.options ?? []).map(([text, isCorrect], oIndex) => ({
                text,
                isCorrect,
                position: oIndex,
              })),
            },
          })),
        },
      },
      select: { id: true, title: true },
    });
  }

  await makeQuiz({
    ownerId: alex.id,
    title: "Cell transport — end of topic test",
    subject: "Biology",
    description: "14 marks. Long enough to earn coins.",
    isPublic: true,
    createdAt: daysAgo(7),
    questions: [
      {
        type: "MCQ_SINGLE",
        prompt: "Which process requires ATP?",
        marks: 2,
        explanation: "Only active transport moves substances against their gradient, which costs energy.",
        options: [
          ["Active transport", true],
          ["Simple diffusion", false],
          ["Osmosis", false],
          ["Facilitated diffusion", false],
        ],
      },
      {
        type: "MCQ_MULTI",
        prompt: "Which of the following increase the rate of diffusion across a membrane? Select all that apply.",
        marks: 3,
        markScheme: "1 mark per correct selection, minus 1 per incorrect.",
        options: [
          ["A steeper concentration gradient", true],
          ["A larger surface area", true],
          ["A thicker exchange surface", false],
          ["A lower temperature", false],
        ],
      },
      {
        type: "MCQ_SINGLE",
        prompt: "A cell is placed in a solution with a lower water potential than its cytoplasm. What happens?",
        marks: 2,
        explanation: "Water moves down the water potential gradient, out of the cell.",
        options: [
          ["Water leaves the cell by osmosis", true],
          ["Water enters the cell by osmosis", false],
          ["Water moves in by active transport", false],
          ["Nothing — water potential doesn't affect water movement", false],
        ],
      },
      {
        type: "WRITTEN",
        prompt: "Explain how co-transport of sodium ions and glucose absorbs glucose in the ileum, even when glucose concentration in the lumen is lower than in the epithelial cell.",
        marks: 4,
        markScheme:
          "1 mark: sodium ions actively pumped out of the epithelial cell into the blood by the sodium-potassium pump.\n1 mark: this creates a concentration gradient for sodium between lumen and cell.\n1 mark: sodium diffuses back in through the co-transporter protein, bringing glucose with it.\n1 mark: glucose therefore moves against its own concentration gradient — indirect active transport.",
      },
      {
        type: "WRITTEN",
        prompt: "A student says osmosis is 'just diffusion of water'. Evaluate this statement.",
        marks: 3,
        markScheme:
          "1 mark: acknowledges it is partly correct — osmosis is passive and moves down a gradient.\n1 mark: identifies that osmosis specifically requires a partially permeable membrane.\n1 mark: refers to water potential rather than concentration as the correct measure.",
      },
    ],
  });

  await makeQuiz({
    ownerId: alex.id,
    title: "Quick recall — functional groups",
    subject: "Chemistry",
    description: "Six marks — deliberately short, so it doesn't earn coins.",
    createdAt: daysAgo(2),
    questions: [
      {
        type: "MCQ_SINGLE",
        prompt: "Which suffix names an alcohol?",
        marks: 2,
        options: [["-ol", true], ["-al", false], ["-one", false], ["-oic acid", false]],
      },
      {
        type: "MCQ_SINGLE",
        prompt: "Bromine water decolourises in the presence of which functional group?",
        marks: 2,
        options: [
          ["C=C double bond", true],
          ["Hydroxyl group", false],
          ["Carboxyl group", false],
          ["Amine group", false],
        ],
      },
      {
        type: "MCQ_SINGLE",
        prompt: "What is the general formula of an alkane?",
        marks: 2,
        options: [["CnH2n+2", true], ["CnH2n", false], ["CnH2n-2", false], ["CnHn", false]],
      },
    ],
  });

  await makeQuiz({
    ownerId: jordan.id,
    title: "Cold War origins, 1945–49",
    subject: "History",
    description: "16 marks across recall and explanation.",
    isPublic: true,
    createdAt: daysAgo(9),
    questions: [
      {
        type: "MCQ_SINGLE",
        prompt: "In which year was the Marshall Plan announced?",
        marks: 2,
        options: [["1947", true], ["1945", false], ["1949", false], ["1952", false]],
      },
      {
        type: "MCQ_MULTI",
        prompt: "Which of these were agreed at the Yalta Conference?",
        marks: 3,
        options: [
          ["Germany would be divided into occupation zones", true],
          ["Free elections would be held in Eastern Europe", true],
          ["NATO would be formed", false],
          ["The Berlin Wall would be built", false],
        ],
      },
      {
        type: "MCQ_SINGLE",
        prompt: "How long did the Berlin Airlift last?",
        marks: 2,
        options: [["About 11 months", true], ["About 3 weeks", false], ["About 4 years", false], ["About 6 months", false]],
      },
      {
        type: "WRITTEN",
        prompt: "Explain why the Truman Doctrine marked a turning point in US foreign policy.",
        marks: 5,
        markScheme:
          "Up to 2 marks: identifies the shift away from isolationism.\nUp to 2 marks: explains containment as an active commitment to intervene.\n1 mark: supports with specific detail (Greece and Turkey, $400 million).",
      },
      {
        type: "WRITTEN",
        prompt: "'The Berlin Blockade was caused primarily by the introduction of the Deutschmark.' How far do you agree?",
        marks: 4,
        markScheme:
          "1 mark: recognises the currency reform as the immediate trigger.\n1 mark: offers at least one alternative cause (Marshall Plan, Bizonia, ideological division).\n1 mark: weighs the causes against each other rather than listing them.\n1 mark: reaches a supported judgement.",
      },
    ],
  });

  // ------------------------------------------------------------ Community
  const community = await db.community.create({
    data: {
      slug: "year-13-sciences",
      name: "Year 13 Sciences",
      description: "Biology, Chemistry and Physics revision for the summer exams. Share your sets.",
      subject: "Science",
      access: "PUBLIC",
      ownerId: alex.id,
      memberCount: 2,
      createdAt: daysAgo(20),
      members: {
        create: [
          { userId: alex.id, role: "LEADER", joinedAt: daysAgo(20) },
          { userId: jordan.id, role: "MEMBER", joinedAt: daysAgo(15) },
        ],
      },
      posts: {
        create: [
          {
            authorId: alex.id,
            body: "Put my cell transport set in here — it's the one that finally made co-transport click for me. Shout if anything in it looks wrong.",
            createdAt: daysAgo(5),
          },
          {
            authorId: jordan.id,
            body: "Anyone else find paper 2 harder than paper 1? Struggling with the 6-markers specifically.",
            createdAt: daysAgo(2),
          },
        ],
      },
    },
    select: { id: true },
  });

  await db.communityResource.create({
    data: {
      communityId: community.id,
      sharedById: alex.id,
      type: "FLASHCARD_SET",
      flashcardSetId: biology.id,
      note: "10 cards, covers everything in the transport topic.",
      createdAt: daysAgo(5),
    },
  });

  await db.community.create({
    data: {
      slug: "history-a-level-help",
      name: "History A-level help",
      description: "Approval-only group for essay feedback and source practice.",
      subject: "History",
      access: "REQUEST",
      ownerId: jordan.id,
      memberCount: 1,
      createdAt: daysAgo(11),
      members: { create: [{ userId: jordan.id, role: "LEADER", joinedAt: daysAgo(11) }] },
    },
  });

  console.log(`
Seeded.

  Free account:     alex@studyquest.test    / password123
  Premium account:  jordan@studyquest.test  / password123

Both have flashcard sets and quizzes dated far enough back that the 24-hour
coin gate has already passed, so rewards work straight away.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
