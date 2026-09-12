/**
 * Databases (A-Level): normalisation, SQL joins and transaction processing.
 *
 * The join and modification questions are computed by running the query
 * against small in-memory tables; normalisation and transactions are worked
 * recall of the defining rules.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import { Y12, Y13, recall } from "./cs-alevel-kit";

export const csALevelDatabases: Generator[] = [
  recall({
    key: "cs.adb.normalisation",
    topic: "cs-databases",
    subtopic: "normalisation",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "A table has a column that holds several values in one field, for example Subjects = 'Maths, Physics'. Which normal form does this break?",
        a: "First normal form (1NF)",
        wrong: ["Second normal form (2NF)", "Third normal form (3NF)", "Boyce–Codd normal form", "It breaks none of them"],
        why: "1NF requires every field to hold a single atomic value with no repeating groups.",
      },
      {
        q: "A table is in 1NF and has the composite key (StudentID, CourseID). The column StudentName depends only on StudentID. Which normal form does this break?",
        a: "Second normal form (2NF)",
        wrong: ["First normal form (1NF)", "Third normal form (3NF)", "It is already fully normalised", "Boyce–Codd normal form only"],
        why: "2NF forbids a non-key attribute depending on only part of a composite key — a partial dependency.",
      },
      {
        q: "A table is in 2NF. Its key is OrderID; it stores CustomerID and also CustomerCity, where CustomerCity depends on CustomerID. Which normal form does this break?",
        a: "Third normal form (3NF)",
        wrong: ["First normal form (1NF)", "Second normal form (2NF)", "It is already in 3NF", "None — this is always allowed"],
        why: "3NF forbids a non-key attribute depending on another non-key attribute — a transitive dependency.",
      },
      {
        q: "What is the main benefit of normalising a database to 3NF?",
        a: "Each fact is stored once, which removes update anomalies and reduces wasted space",
        wrong: [
          "Queries always run faster because there are more tables",
          "The database can hold more rows in total",
          "It removes the need for primary keys",
          "It makes the data automatically encrypted",
        ],
        why: "Redundant copies of a fact can disagree after an update; storing it once makes that impossible.",
      },
      {
        q: "Which is a potential drawback of a highly normalised database?",
        a: "Answering a query may need several tables to be joined, which can be slower",
        wrong: [
          "Data can no longer be indexed",
          "Primary keys stop being unique",
          "It is impossible to add new records",
          "The data takes up far more storage space",
        ],
        why: "Splitting data across tables trades write-side consistency for extra join work at read time.",
      },
      {
        q: "In an entity-relationship model, how is a many-to-many relationship between two entities normally implemented?",
        a: "With a third 'linking' table that holds a foreign key to each of the two entities",
        wrong: [
          "By putting a list of keys in one field of each table",
          "By merging the two entities into a single table",
          "By adding a foreign key to just one of the two tables",
          "It cannot be represented in a relational database",
        ],
        why: "The junction table turns one many-to-many relationship into two one-to-many relationships.",
      },
      {
        q: "A table is in 1NF but not 2NF. What does the process of putting it into 2NF involve?",
        a: "Moving the attributes that depend on only part of the key into a new table with that part as its key",
        wrong: [
          "Combining every table into one",
          "Removing the primary key",
          "Converting all text fields to numbers",
          "Adding a repeating group for the partial data",
        ],
        why: "Each partial dependency is split off so every non-key attribute depends on the whole key.",
      },
    ],
  }),

  generator({
    key: "cs.adb.inner-join",
    subject: "computer-science",
    topic: "cs-databases",
    subtopic: "sql-joins",
    curriculumLevel: Y12,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      const customers = Array.from({ length: rng.int(3, 4) }, (_, i) => ({
        id: i + 1,
        name: ["Ada", "Ben", "Cid", "Dee"][i],
      }));
      const orders: { id: number; custId: number; total: number }[] = [];
      const orderCount = rng.int(4, 6);
      for (let i = 0; i < orderCount; i++) {
        orders.push({
          id: 100 + i,
          custId: rng.int(1, customers.length + 1), // deliberately allow an unmatched customer id
          total: rng.int(10, 90),
        });
      }
      const joined = orders.filter((o) => customers.some((c) => c.id === o.custId));
      const kind = rng.int(0, 1);
      const threshold = rng.pick([30, 40, 50] as const);
      const expected =
        kind === 0 ? joined.length : joined.filter((o) => o.total > threshold).length;
      const answer = String(expected);
      const question =
        kind === 0
          ? "How many rows does an INNER JOIN of Orders and Customers on Orders.CustID = Customers.ID return?"
          : `How many rows does this query return?  SELECT * FROM Orders INNER JOIN Customers ON Orders.CustID = Customers.ID WHERE Orders.Total > ${threshold};`;
      const why =
        kind === 0
          ? `An inner join keeps only orders whose CustID matches a real customer: ${joined.length} of the ${orders.length} orders match.`
          : `First keep the ${joined.length} orders with a matching customer, then those with Total > ${threshold}: ${expected}.`;
      const custText = customers.map((c) => `(${c.id}, ${c.name})`).join(", ");
      const orderText = orders.map((o) => `(${o.id}, cust ${o.custId}, £${o.total})`).join(", ");
      return {
        prompt: code([
          [0, `Customers (ID, Name): ${custText}`],
          [0, `Orders (OrderID, CustID, Total): ${orderText}`],
          [0, question],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(orders.length), // counted every order
          String(customers.length), // counted the customers
          String(orders.length - joined.length), // counted the unmatched orders
          String(Number(answer) + 1),
          String(Math.max(0, Number(answer) - 1)),
        ]),
        explanation: why,
        check: () => {
          const j = orders.filter((o) => customers.some((c) => c.id === o.custId));
          const e = kind === 0 ? j.length : j.filter((o) => o.total > threshold).length;
          return String(e) === answer ? null : "join count mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.adb.modify",
    subject: "computer-science",
    topic: "cs-databases",
    subtopic: "sql-joins",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 12,
    build: (rng) => {
      const scores = Array.from({ length: rng.int(6, 8) }, () => rng.int(20, 95));
      const threshold = rng.pick([40, 50, 60, 70] as const);
      const op = rng.int(0, 2);
      let statement: string;
      let answer: string;
      let why: string;
      if (op === 0) {
        const removed = scores.filter((s) => s < threshold).length;
        statement = `DELETE FROM Results WHERE Score < ${threshold};`;
        answer = String(scores.length - removed);
        why = `${removed} rows have a score below ${threshold} and are deleted, leaving ${scores.length - removed} of the original ${scores.length}.`;
      } else if (op === 1) {
        const affected = scores.filter((s) => s >= threshold).length;
        statement = `UPDATE Results SET Grade = 'Pass' WHERE Score >= ${threshold};`;
        answer = String(affected);
        why = `The UPDATE touches every row with Score ≥ ${threshold}: ${affected} rows are changed.`;
      } else {
        statement = "INSERT INTO Results (Score) VALUES (55);";
        answer = String(scores.length + 1);
        why = `INSERT adds exactly one new row, taking the table from ${scores.length} rows to ${scores.length + 1}.`;
      }
      return {
        prompt: code([
          [0, `The table Results currently holds these ${scores.length} scores: ${scores.join(", ")}.`],
          [0, `This statement is run:  ${statement}`],
          [0, op === 1 ? "How many rows does it change?" : "How many rows does the table hold afterwards?"],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(scores.length), // thought nothing changed
          String(op === 0 ? scores.filter((s) => s < threshold).length : scores.filter((s) => s >= threshold).length),
          String(scores.length - 1),
          String(scores.length + 1),
          String(scores.length + 2),
          String(op === 0 ? scores.filter((s) => s >= threshold).length : scores.filter((s) => s < threshold).length),
        ]),
        explanation: why,
        check: () => {
          let expected: number;
          if (op === 0) expected = scores.length - scores.filter((s) => s < threshold).length;
          else if (op === 1) expected = scores.filter((s) => s >= threshold).length;
          else expected = scores.length + 1;
          return String(expected) === answer ? null : "modify result mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.adb.transactions",
    topic: "cs-databases",
    subtopic: "transactions",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "What does the 'A' in the ACID properties of a transaction stand for, and what does it mean?",
        a: "Atomicity — the transaction either completes entirely or has no effect at all",
        wrong: [
          "Availability — the database is always online",
          "Authentication — the user's identity is checked first",
          "Accuracy — every value entered is validated",
          "Access — permissions are checked for each table",
        ],
        why: "A partly done money transfer that debited one account but did not credit the other must be rolled back.",
      },
      {
        q: "What does the 'C' (Consistency) in ACID guarantee?",
        a: "The database moves from one valid state to another, never leaving broken rules or references",
        wrong: [
          "All users see the same data at the same time worldwide",
          "The data is stored in a consistent file format",
          "Transactions always run in the order they were submitted",
          "The same query always returns results in the same row order",
        ],
        why: "Constraints such as referential integrity and totals must still hold after the transaction commits.",
      },
      {
        q: "What problem does record locking during a transaction prevent?",
        a: "Two transactions updating the same record at the same time and overwriting each other's change",
        wrong: [
          "The database file becoming fragmented on disk",
          "A user forgetting their password",
          "The transaction log growing too large",
          "Queries returning rows in the wrong order",
        ],
        why: "A lock forces the second transaction to wait until the first commits, so no update is lost.",
      },
      {
        q: "Two transactions each hold a lock the other needs and neither can proceed. What is this called?",
        a: "Deadlock",
        wrong: ["A race condition", "A rollback", "A cache miss", "A transitive dependency"],
        why: "The database detects the cycle and aborts one transaction so the other can continue.",
      },
      {
        q: "What is the purpose of the transaction log (journal)?",
        a: "It records every change so the database can be restored to a consistent state after a crash",
        wrong: [
          "It stores which users are currently logged in",
          "It keeps a copy of every SELECT query for auditing",
          "It caches recent results to speed up repeated queries",
          "It lists the indexes that need rebuilding",
        ],
        why: "On recovery, committed transactions in the log are re-applied (redo) and unfinished ones undone.",
      },
      {
        q: "What does 'D' (Durability) in ACID mean?",
        a: "Once a transaction has committed, its changes survive even a power failure or crash",
        wrong: [
          "The database hardware is built to last many years",
          "Transactions can be replayed any number of times",
          "Old data is never deleted, only marked as hidden",
          "The transaction cannot be rolled back once started",
        ],
        why: "Committed data is written to non-volatile storage (or its log) before the commit is acknowledged.",
      },
    ],
  }),
];
