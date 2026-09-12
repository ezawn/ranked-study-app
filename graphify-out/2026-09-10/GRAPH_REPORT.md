# Graph Report - studyquest  (2026-09-10)

## Corpus Check
- 297 files · ~442,002 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2225 nodes · 6268 edges · 111 communities (76 shown, 35 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- format.ts
- physics-kit.ts
- requireUser
- query.ts
- sidebar.tsx
- cn
- generate/index.ts
- fm-kit.ts
- taxonomy.ts
- day.ts
- quizTimeLimitSeconds
- services/communities.ts
- match.ts
- verify-logic.ts
- arena/page.tsx
- arena.ts
- fm-series-roots.ts
- pickDistractors
- utils.ts
- quiz-attempts.ts
- session-timer.tsx
- useToast
- exact
- physics-electricity.ts
- route-skeletons.tsx
- toast.tsx
- chemistry-quantitative.ts
- rules.ts
- skeletons.tsx
- button.tsx
- arena.test.ts
- dependencies
- NavigationProvider
- session.ts
- compilerOptions
- ProfileSkeleton
- services/daily-quiz.ts
- devDependencies
- physics-nuclear.ts
- rate-limit.ts
- battle.tsx
- bank.test.ts
- cs-kit.ts
- jobs/index.ts
- dashboard/loading.tsx
- Why the Coin Economy Can't Be Farmed
- scripts
- flashcards/loading.tsx
- theme.tsx
- account.ts
- icons.tsx
- plan/loading.tsx
- anthropic.ts
- services/flashcards.ts
- study.ts
- Rarity Is Mastery (semantic colour scale)
- cs-systems.ts
- cs-alevel-algorithms.ts
- package.json
- cs-logic.ts
- biology-genetics.ts
- ComingSoonSkeleton
- SkeletonStudyCard
- Card Frames Redesign Round
- seed.ts
- kit.ts
- stubs/db.ts
- The Pip-and-Total Rule
- communities/loading.tsx
- [slug]/loading.tsx
- env.ts
- tidy
- test-feedback/loading.tsx
- biology-organisation.ts
- [quizId]/edit/loading.tsx
- [quizId]/loading.tsx
- settings/loading.tsx
- streak/loading.tsx
- services/arena/cosmetics.ts
- next-auth.d.ts
- StudyQuest — four changes
- next.config.ts
- @phosphor-icons/react
- postcss.config.mjs
- Graphify Knowledge Graph Tooling
- The Hue-Is-Never-The-Only-Signal Rule
- The Icon Weight Rule
- The Next-Action-First Rule
- The No-Kicker Rule
- The One Primary Rule
- The Real-Offset Rule
- The Struck-and-Read Rule
- The Two-Value Ground Rule
- Neon DB Password Leak (unrotated)
- Communities
- Free / Premium Plans
- Storage Driver (local disk / S3 stub)
- { GET, POST }
- [submissionId]/loading.tsx
- dashboard/page.tsx
- next
- Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)
- flashcards/new/loading.tsx
- [setId]/loading.tsx
- Rational
- feedback.tsx
- guarded

## God Nodes (most connected - your core abstractions)
1. `cn()` - 108 edges
2. `pickDistractors()` - 101 edges
3. `generator` - 74 edges
4. `requireUser()` - 67 edges
5. `guarded()` - 67 edges
6. `useToast()` - 57 edges
7. `agrees()` - 57 edges
8. `answer()` - 55 edges
9. `tidy()` - 54 edges
10. `slip()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `awardCoins()` --shares_data_with--> `Append-Only Ledger with Idempotency Key`  [EXTRACTED]
  src/server/services/coins.ts → README.md
- `Product Principles` --semantically_similar_to--> `Rarity Is Mastery (semantic colour scale)`  [INFERRED] [semantically similar]
  PRODUCT.md → DESIGN.md
- `Rarity Is Mastery (semantic colour scale)` --references--> `setRarity()`  [EXTRACTED]
  DESIGN.md → src/components/flashcards/set-tile.tsx
- `Skeleton Shaped Like the Page` --shares_data_with--> `NavigationProvider()`  [EXTRACTED]
  docs/design-system.md → src/components/layout/route-transition.tsx
- `NavigationProvider()` --shares_data_with--> `Navigation Slowness Fix (NavigationProvider)`  [EXTRACTED]
  src/components/layout/route-transition.tsx → docs/redesign-notes.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Anti-Farming Enforcement Stack** — readme_ledger_pattern, readme_heartbeat_mechanism, src_server_services_coins_awardcoins, src_lib_rate_limit_hit, src_app_app_layout_requireuser [EXTRACTED 1.00]
- **Redesign Verification Suite** — check_imports_py, detect_mjs, docs_redesign_notes_verification_suite, docs_redesign_notes_static_harness_bug [EXTRACTED 1.00]
- **Rarity Derivation System** — design_rarity_system, src_components_ui_panel_rarityfor, src_components_flashcards_set_tile_setrarity, design_rarity_frame_component [INFERRED 0.85]

## Communities (111 total, 35 thin omitted)

### Community 0 - "format.ts"
Cohesion: 0.07
Nodes (38): aLevelApplied, binomialPmf(), choose(), aLevelCalculus, integrate(), polyRational(), aLevelPure, EXACT_TRIG (+30 more)

### Community 1 - "physics-kit.ts"
Cohesion: 0.06
Nodes (44): ANGULAR, CIRCULAR, PROJECTILES, SPINNERS, STRESSES, WIRES, YOUNG, BALLS (+36 more)

### Community 2 - "requireUser"
Cohesion: 0.10
Nodes (27): generateMetadata(), metadata, NewSetPage(), dynamic, generateMetadata(), SetPage(), dynamic, ImportPage() (+19 more)

### Community 3 - "query.ts"
Cohesion: 0.10
Nodes (36): QuestionDraft, Candidate, intersectOrEither(), intersectPreferences(), preferenceFilter(), roundRobinByTopic(), seedFrom(), select() (+28 more)

### Community 4 - "sidebar.tsx"
Cohesion: 0.10
Nodes (28): AppLayout(), FlameIcon, HomeIcon, LogOutIcon, MenuIcon, SettingsIcon, Ctx, NavigationValue (+20 more)

### Community 5 - "cn"
Cohesion: 0.11
Nodes (35): Cosmetic(), AUTH_ERRORS, Author, FeedPost, Resource, EditableCard, SetEditorProps, ChevronLeftIcon (+27 more)

### Community 6 - "generate/index.ts"
Cohesion: 0.06
Nodes (31): biologyALevelMolecules, biologyALevelSystems, biologyCells, biologyEcology, biologyGenetics, biologyPlants, chemistryReactions, csALevelArchitecture (+23 more)

### Community 7 - "fm-kit.ts"
Cohesion: 0.08
Nodes (32): fmComplex, gcdInt(), simplifyPiFraction(), fmGcseCalculus, gcd2(), LATTICE, slopeStr(), fmGcseMatrices (+24 more)

### Community 8 - "taxonomy.ts"
Cohesion: 0.05
Nodes (32): KNOWN_QUEUE_VALUES, KNOWN_STREAMS, KNOWN_TOPICS, A_ONLY, AUTO_MARKABLE, BAND_LABEL, BAND_RANGE, BIOLOGY_TOPICS (+24 more)

### Community 9 - "day.ts"
Cohesion: 0.28
Nodes (11): addDays(), DAY_MS, daysBetween(), hoursBetween(), isDayKey(), isOlderThanHours(), parseDayKey(), previousDay() (+3 more)

### Community 10 - "quizTimeLimitSeconds"
Cohesion: 0.24
Nodes (9): QuizzesPage(), AttemptPage(), dynamic, metadata, quizTimeLimitSeconds(), shapeAttempt(), startAttempt(), listMyQuizzes() (+1 more)

### Community 11 - "services/communities.ts"
Cohesion: 0.07
Nodes (54): CommunityPage(), create(), accept(), post(), PostCard(), remove(), send(), create() (+46 more)

### Community 12 - "match.ts"
Cohesion: 0.08
Nodes (38): nextPeakRank(), isAnswerCorrect(), ObjectiveType, ACCURACY_WEIGHT, BATTLE_PACE, battleCoins(), BattleScore, chanceOf() (+30 more)

### Community 13 - "verify-logic.ts"
Cohesion: 0.08
Nodes (19): bad, day2, day2Reward, deadline, failures, fcBase, fresh, good (+11 more)

### Community 14 - "arena/page.tsx"
Cohesion: 0.09
Nodes (41): ArenaPage(), dynamic, metadata, LeaderboardPage(), dynamic, metadata, RankPage(), dynamic (+33 more)

### Community 15 - "arena.ts"
Cohesion: 0.09
Nodes (35): Matchmaker(), rankWindowFor(), waitMessage(), normalisePreference(), QueuePreference, ANSWER_LIMIT, answerSchema, cancelMatchmakingAction() (+27 more)

### Community 16 - "fm-series-roots.ts"
Cohesion: 0.28
Nodes (4): absNum(), fmSeriesRoots, fmtNum(), quad()

### Community 17 - "pickDistractors"
Cohesion: 0.19
Nodes (38): buildHessPair(), buildAvogadroFallback(), buildConcentrationFallback(), buildConservationFallback(), buildReactingFallback(), buildTitrationFallback(), pickDistractors(), buildCapCombineFallback() (+30 more)

### Community 18 - "utils.ts"
Cohesion: 0.11
Nodes (22): CommunitiesPage(), dynamic, metadata, DiscoverCommunities(), DiscoverCommunity, DiscoverGrid(), PublicSet, SetTile() (+14 more)

### Community 19 - "quiz-attempts.ts"
Cohesion: 0.11
Nodes (26): dynamic, metadata, ResultsPage(), SKIP_REASON_TEXT, QUIZZES, AttemptMarking, clampOverrideMarks(), isAttemptExpired() (+18 more)

### Community 20 - "session-timer.tsx"
Cohesion: 0.33
Nodes (6): contextFor(), HeartbeatResponse, SessionTimerProvider(), TimerContext, TimerState, StudyContext

### Community 21 - "useToast"
Cohesion: 0.11
Nodes (31): dynamic, dynamic, generateMetadata(), QuizPage(), Access, ACCESS_OPTIONS, CommunityCreate(), JoinByInvite() (+23 more)

### Community 22 - "exact"
Cohesion: 0.08
Nodes (26): CHARGAFF_CASES, MOLECULES, PCR_CASES, BORN_HABER, BornHaber, chemistryALevel, ELECTRODES, ENTROPIES (+18 more)

### Community 23 - "physics-electricity.ts"
Cohesion: 0.10
Nodes (30): answerQty(), APPLIANCES, BQV_CASES, CELL_CASES, COILS, COMPASS, divisorsOf(), FARADAY_CASES (+22 more)

### Community 24 - "route-skeletons.tsx"
Cohesion: 0.09
Nodes (8): DailySkeleton(), ImportSkeleton(), NewQuizSkeleton(), QuizLibraryIndexSkeleton(), QuizResultsSkeleton(), ROUTES, SetEditorSkeleton(), SkeletonPage()

### Community 25 - "toast.tsx"
Cohesion: 0.08
Nodes (28): DailyQuestion, DailyResult, DailyRunner(), FLAME_TONE, streakRarity(), CramCard, CramInitial, CramSession() (+20 more)

### Community 26 - "chemistry-quantitative.ts"
Cohesion: 0.06
Nodes (46): ABUNDANCES, chemistryAtomic, groupOf(), IONS, ISOTOPES, SHELL_ELEMENTS, shellConfiguration(), alcoholFormula() (+38 more)

### Community 27 - "rules.ts"
Cohesion: 0.10
Nodes (36): heartbeat(), ALLOW(), AppTimeInput, AppTimeResult, computeDailyQuizReward(), creditAppTime(), creditStudyTime(), DailyQuizRewardInput (+28 more)

### Community 28 - "skeletons.tsx"
Cohesion: 0.10
Nodes (12): ArenaSkeleton(), BattleSkeleton(), CharacterSkeleton(), LeaderboardSkeleton(), RankSkeleton(), SkeletonHeading(), SkeletonPanel(), SkeletonRows() (+4 more)

### Community 29 - "button.tsx"
Cohesion: 0.08
Nodes (20): dynamic, metadata, ResultsPage(), ScoreSide(), metadata, Phase, StreamOption, SubjectPicker() (+12 more)

### Community 30 - "arena.test.ts"
Cohesion: 0.12
Nodes (26): applyElo(), applyMatchElo(), EloChange, EloInput, expectedScore(), kFactor(), MatchEloOutcome, MatchResult (+18 more)

### Community 31 - "dependencies"
Cohesion: 0.07
Nodes (29): @anthropic-ai/sdk, @auth/prisma-adapter, bcryptjs, clsx, date-fns, motion, next-auth, dependencies (+21 more)

### Community 32 - "NavigationProvider"
Cohesion: 0.33
Nodes (6): Skeleton Shaped Like the Page, Technical Gotchas (theme inline, Tailwind scan, heartbeat deps), Navigation Slowness Fix (NavigationProvider), destinationFor(), NavigationProvider(), onClick()

### Community 33 - "session.ts"
Cohesion: 0.07
Nodes (41): EditQuizPage(), metadata, generate(), submit(), ai(), ForbiddenError, NotFoundError, SessionUser (+33 more)

### Community 34 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+20 more)

### Community 36 - "services/daily-quiz.ts"
Cohesion: 0.16
Nodes (17): submit(), advanceStreak(), effectiveStreak(), shuffle(), dailySourceCountAction(), submitDailyQuizAction(), submitSchema, DailyQuestion (+9 more)

### Community 37 - "devDependencies"
Cohesion: 0.07
Nodes (27): dotenv, devDependencies, dotenv, postcss, prisma, tailwindcss, @tailwindcss/postcss, tsx (+19 more)

### Community 38 - "physics-nuclear.ts"
Cohesion: 0.29
Nodes (6): CONSTANTS, BETA_MINUS, DECAY_CONSTANTS, HALF_LIVES, NUCLIDES, SOURCES

### Community 39 - "rate-limit.ts"
Cohesion: 0.10
Nodes (24): GET(), runtime, bodySchema, dynamic, POST(), runtime, onSubmit(), upload() (+16 more)

### Community 40 - "battle.tsx"
Cohesion: 0.12
Nodes (19): BattlePage(), dynamic, metadata, Battle(), Ending, formatClock(), Opponent, Pending (+11 more)

### Community 41 - "bank.test.ts"
Cohesion: 0.16
Nodes (25): main(), prisma, report(), generateAll(), GENERATORS, ImportClient, ImportOption, ImportQuestion (+17 more)

### Community 42 - "cs-kit.ts"
Cohesion: 0.09
Nodes (34): bstFrom(), bstInsert(), bstSearchComparisons(), distinctList(), inorder(), postorder(), preorder(), recall() (+26 more)

### Community 43 - "jobs/index.ts"
Cohesion: 0.16
Nodes (21): main(), POLL_MS, RECONCILE_EVERY, tick(), dynamic, GET(), handle(), maxDuration (+13 more)

### Community 45 - "Why the Coin Economy Can't Be Farmed"
Cohesion: 0.11
Nodes (19): The Amber Rule, The Earned-Foil Rule, The Rarity Frame (signature component), Amber Means Money, Foil Is Earned-Only, Daily Quiz, Hard Constraints (server-validated rewards), Product Purpose: Measurable Progression (+11 more)

### Community 46 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, db:migrate, db:push, db:seed, db:seed:cosmetics, db:studio, dev (+11 more)

### Community 48 - "theme.tsx"
Cohesion: 0.13
Nodes (16): display, metadata, sans, viewport, MoonIcon, SunIcon, apply(), systemPrefersDark() (+8 more)

### Community 49 - "account.ts"
Cohesion: 0.09
Nodes (33): change(), remove(), upload(), save(), save(), Mail, MailResult, passwordResetEmail() (+25 more)

### Community 50 - "icons.tsx"
Cohesion: 0.07
Nodes (37): DailyQuizPage(), dynamic, metadata, dynamic, FlashcardsPage(), metadata, dynamic, metadata (+29 more)

### Community 52 - "anthropic.ts"
Cohesion: 0.09
Nodes (30): analysisSchema, AnthropicProvider, markingSchema, optionSchema, questionSchema, QUIZ_TOOL_SCHEMA, quizSchema, buildQuestions() (+22 more)

### Community 53 - "services/flashcards.ts"
Cohesion: 0.11
Nodes (25): SettingsPage(), getRankMultiplier(), RankMultiplierInput, dayKey(), awardCoins(), AwardInput, AwardResult, COIN_SOURCE_LABEL (+17 more)

### Community 54 - "study.ts"
Cohesion: 0.05
Nodes (60): CramModePage(), EditSetPage(), metadata, dynamic, metadata, SmartModePage(), restart(), DiscoverTile() (+52 more)

### Community 55 - "Rarity Is Mastery (semantic colour scale)"
Cohesion: 0.22
Nodes (10): The Collector's Table (Creative North Star), The Earned-Stock Rule, The Frame-Carries-Rarity Rule, The Ink Variant Rule, Rarity Is Mastery (semantic colour scale), The Frame Carries the Rarity, Not a Stripe, Stock Means Earned, accentFor() (deprecated hash-to-hue helper) (+2 more)

### Community 56 - "cs-systems.ts"
Cohesion: 0.17
Nodes (12): A_LEVEL, ARCHITECTURE, csSystems, formatCount(), fromCases(), GCSE, GCSE_LATE, MEMORY (+4 more)

### Community 57 - "cs-alevel-algorithms.ts"
Cohesion: 0.07
Nodes (8): csALevelAlgorithms, REC_FNS, RecFn, A_LEVEL, csAlgorithms, GCSE, GCSE_LATE, Rng

### Community 58 - "package.json"
Cohesion: 0.22
Nodes (8): description, engines, node, name, prisma, seed, private, version

### Community 59 - "cs-logic.ts"
Cohesion: 0.17
Nodes (10): A_LEVEL, ALL_GATES, csLogic, Gate, GATE_DESCRIPTION, GATE_OF, GCSE, GCSE_LATE (+2 more)

### Community 60 - "biology-genetics.ts"
Cohesion: 0.36
Nodes (7): Cross, CROSSES, dominantCount(), gcd(), offspringOf(), ratioOf(), SPECIES

### Community 65 - "Card Frames Redesign Round"
Cohesion: 0.40
Nodes (5): Card Frames (design system name), Legacy Token Aliases (violet/cyan/lime/rose/amber/panel), Card Frames Redesign Round, Impeccable Skill (redesign methodology), Ink & Gold (previous design system)

### Community 66 - "seed.ts"
Cohesion: 0.50
Nodes (3): daysAgo(), db, main()

### Community 67 - "kit.ts"
Cohesion: 0.13
Nodes (18): Case, csCoverage, GCSE, GCSE_LATE, recall(), buildOptions(), countDecimals(), defaultMarks() (+10 more)

### Community 68 - "stubs/db.ts"
Cohesion: 0.67
Nodes (3): db, DbClient, refuse()

### Community 69 - "The Pip-and-Total Rule"
Cohesion: 0.67
Nodes (3): The Measurement Rule, The Pip-and-Total Rule, StatStrip Component

### Community 72 - "env.ts"
Cohesion: 0.07
Nodes (22): runtime, metadata, metadata, metadata, SignInPage(), metadata, SignUpPage(), RootPage() (+14 more)

### Community 73 - "tidy"
Cohesion: 0.08
Nodes (33): CHI_CASES, SD_SETS, MAGNIFICATIONS, ORGANELLES, OSMOSIS_CASES, SPECIALISED_CELLS, ENERGY_CASES, HW_CASES (+25 more)

### Community 75 - "biology-organisation.ts"
Cohesion: 0.22
Nodes (8): biologyOrganisation, BLOOD_PARTS, CARDIAC_CASES, ENZYMES, EXTRA_VESSEL_FEATURES, EXTRA_VESSEL_NAMES, PATHOGEN_TYPES, VESSELS

### Community 80 - "services/arena/cosmetics.ts"
Cohesion: 0.09
Nodes (26): db, CharacterPage(), dynamic, metadata, EquippedItem, CharacterShop(), ShopItemView, BASE_PRICE (+18 more)

### Community 82 - "StudyQuest — four changes"
Cohesion: 0.25
Nodes (7): 1. Every battle question must have exactly four options, 2. Queue selection stops at subject + stage, 3. Show-password toggle on sign-in, 4. Computer science question bank, Standing rules — do not break these, StudyQuest — four changes, Verification

### Community 105 - "dashboard/page.tsx"
Cohesion: 0.09
Nodes (28): Static Harness Flattered the Build, ARENA_ICONS, DashboardPage(), dynamic, greeting(), metadata, Reading(), Route() (+20 more)

### Community 108 - "Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)"
Cohesion: 0.67
Nodes (3): check_imports.py, detect.mjs (slop detector), Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)

### Community 112 - "Rational"
Cohesion: 0.15
Nodes (3): frac(), assertSafe(), Rational

### Community 113 - "feedback.tsx"
Cohesion: 0.08
Nodes (35): dynamic, metadata, dynamic, metadata, PlanPage(), ROWS, dynamic, metadata (+27 more)

### Community 120 - "guarded"
Cohesion: 0.08
Nodes (41): save(), submit(), remove(), toggle(), save(), AnswerCard(), submitOverride(), ImprovementPanel() (+33 more)

## Knowledge Gaps
- **562 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `description` (+557 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Subject` connect `kit.ts` to `taxonomy.ts`, `bank.test.ts`, `query.ts`, `arena/page.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `generator` connect `kit.ts` to `format.ts`, `physics-kit.ts`, `generate/index.ts`, `fm-kit.ts`, `physics-nuclear.ts`, `tidy`, `cs-kit.ts`, `biology-organisation.ts`, `bank.test.ts`, `fm-series-roots.ts`, `pickDistractors`, `exact`, `physics-electricity.ts`, `cs-systems.ts`, `cs-alevel-algorithms.ts`, `chemistry-quantitative.ts`, `cs-logic.ts`, `biology-genetics.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `db` connect `session.ts` to `query.ts`, `sidebar.tsx`, `services/communities.ts`, `match.ts`, `arena/page.tsx`, `arena.ts`, `quiz-attempts.ts`, `rules.ts`, `services/daily-quiz.ts`, `rate-limit.ts`, `bank.test.ts`, `jobs/index.ts`, `account.ts`, `services/flashcards.ts`, `study.ts`, `env.ts`, `services/arena/cosmetics.ts`, `feedback.tsx`, `guarded`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _562 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0670762928827445 - nodes in this community are weakly interconnected._
- **Should `physics-kit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06471631205673758 - nodes in this community are weakly interconnected._
- **Should `requireUser` be split into smaller, more focused modules?**
  _Cohesion score 0.10227272727272728 - nodes in this community are weakly interconnected._