# Graph Report - studyquest  (2026-09-10)

## Corpus Check
- 299 files · ~443,706 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2232 nodes · 6284 edges · 121 communities (83 shown, 38 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- format.ts
- physics-kit.ts
- requireUser
- query.ts
- icons.tsx
- cn
- generate/index.ts
- fm-kit.ts
- taxonomy.ts
- day.ts
- arena.ts
- services/communities.ts
- match.ts
- verify-logic.ts
- arena/page.tsx
- queue.ts
- fm-series-roots.ts
- pickDistractors
- panel.tsx
- marking.ts
- daily-runner.tsx
- useToast
- exact
- physics-electricity.ts
- route-skeletons.tsx
- quiz-results.tsx
- chemistry-quantitative.ts
- study-time.ts
- skeletons.tsx
- feedback.tsx
- profile.ts
- dependencies
- NavigationProvider
- services/uploads.ts
- compilerOptions
- ProfileSkeleton
- services/daily-quiz.ts
- devDependencies
- physics-nuclear.ts
- rate-limit.ts
- battle.tsx
- lib/bank/import.ts
- cs-kit.ts
- jobs/index.ts
- session.ts
- Why the Coin Economy Can't Be Farmed
- scripts
- decisions.ts
- theme.tsx
- guarded
- leaderboard/page.tsx
- plan/loading.tsx
- types.ts
- quiz-attempts.ts
- study.ts
- Rarity Is Mastery (semantic colour scale)
- cs-systems.ts
- chemistry-alevel.ts
- package.json
- cs-logic.ts
- biology-genetics.ts
- ComingSoonSkeleton
- SkeletonStudyCard
- sign-in/page.tsx
- AnthropicProvider
- Card Frames Redesign Round
- seed.ts
- kit.ts
- stubs/db.ts
- The Pip-and-Total Rule
- anthropic.ts
- [slug]/loading.tsx
- env.ts
- biology-cells.ts
- run/route.ts
- biology-organisation.ts
- [quizId]/edit/loading.tsx
- character/page.tsx
- AIProvider
- daily/loading.tsx
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
- QuizBuilder
- next
- [setId]/edit/loading.tsx
- Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)
- SkeletonPage
- flashcards/new/loading.tsx
- import/loading.tsx
- Rational
- rules.ts
- quizzes/loading.tsx
- quizzes/new/loading.tsx
- [attemptId]/loading.tsx
- forgot-password/page.tsx
- reset-password/page.tsx
- _count.ts
- actions/quizzes.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 108 edges
2. `pickDistractors()` - 102 edges
3. `generator` - 75 edges
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

## Communities (121 total, 38 thin omitted)

### Community 0 - "format.ts"
Cohesion: 0.07
Nodes (38): aLevelApplied, binomialPmf(), choose(), aLevelCalculus, integrate(), polyRational(), aLevelPure, EXACT_TRIG (+30 more)

### Community 1 - "physics-kit.ts"
Cohesion: 0.05
Nodes (60): CHI_CASES, SD_SETS, COULOMB, GAS, HEATERS, RC, ANGULAR, CIRCULAR (+52 more)

### Community 2 - "requireUser"
Cohesion: 0.17
Nodes (12): ResultsPage(), metadata, NewSetPage(), metadata, NewQuizPage(), generateMetadata(), dynamic, metadata (+4 more)

### Community 3 - "query.ts"
Cohesion: 0.10
Nodes (44): QuestionDraft, Candidate, filterCandidates(), intersectOrEither(), intersectPreferences(), matches(), normalisePreference(), preferenceFilter() (+36 more)

### Community 4 - "icons.tsx"
Cohesion: 0.07
Nodes (34): dynamic, metadata, ARENA_ICONS, dynamic, metadata, Reading(), Route(), ArrowRightIcon (+26 more)

### Community 5 - "cn"
Cohesion: 0.08
Nodes (51): dynamic, metadata, Cosmetic(), AUTH_ERRORS, Author, FeedPost, Resource, EditableCard (+43 more)

### Community 6 - "generate/index.ts"
Cohesion: 0.06
Nodes (31): biologyALevelMolecules, biologyALevelSystems, biologyCells, biologyEcology, biologyGenetics, biologyPlants, chemistryQuantitative, chemistryReactions (+23 more)

### Community 7 - "fm-kit.ts"
Cohesion: 0.07
Nodes (34): fmComplex, gcdInt(), simplifyPiFraction(), fmGcseAlgebra, fmGcseCalculus, gcd2(), LATTICE, slopeStr() (+26 more)

### Community 8 - "taxonomy.ts"
Cohesion: 0.05
Nodes (31): KNOWN_QUEUE_VALUES, KNOWN_STREAMS, KNOWN_TOPICS, A_ONLY, AUTO_MARKABLE, BAND_LABEL, BAND_RANGE, BIOLOGY_TOPICS (+23 more)

### Community 9 - "day.ts"
Cohesion: 0.38
Nodes (9): effectiveStreak(), addDays(), DAY_MS, daysBetween(), hoursBetween(), isDayKey(), isOlderThanHours(), parseDayKey() (+1 more)

### Community 10 - "arena.ts"
Cohesion: 0.11
Nodes (25): Matchmaker(), Phase, CharacterShop(), StreamOption, SubjectPicker(), Tick(), Stage, STAGE_LABEL (+17 more)

### Community 11 - "services/communities.ts"
Cohesion: 0.07
Nodes (55): CommunityPage(), generateMetadata(), create(), accept(), post(), PostCard(), remove(), send() (+47 more)

### Community 12 - "match.ts"
Cohesion: 0.07
Nodes (52): applyElo(), applyMatchElo(), EloChange, EloInput, expectedScore(), kFactor(), MatchEloOutcome, MatchResult (+44 more)

### Community 13 - "verify-logic.ts"
Cohesion: 0.08
Nodes (19): bad, day2, day2Reward, deadline, failures, fcBase, fresh, good (+11 more)

### Community 14 - "arena/page.tsx"
Cohesion: 0.14
Nodes (24): ArenaPage(), dynamic, metadata, Row(), dynamic, metadata, RankPage(), dynamic (+16 more)

### Community 15 - "queue.ts"
Cohesion: 0.16
Nodes (19): Candidate, Pairing, pickOpponent(), RANK_WINDOW_STEPS, rankWindowFor(), Searcher, waitMessage(), QueuePreference (+11 more)

### Community 16 - "fm-series-roots.ts"
Cohesion: 0.28
Nodes (4): absNum(), fmSeriesRoots, fmtNum(), quad()

### Community 17 - "pickDistractors"
Cohesion: 0.19
Nodes (38): buildHessPair(), buildAvogadroFallback(), buildConcentrationFallback(), buildConservationFallback(), buildReactingFallback(), buildTitrationFallback(), pickDistractors(), buildCapCombineFallback() (+30 more)

### Community 18 - "panel.tsx"
Cohesion: 0.06
Nodes (53): Static Harness Flattered the Build, CommunitiesPage(), dynamic, metadata, DashboardPage(), greeting(), dynamic, metadata (+45 more)

### Community 19 - "marking.ts"
Cohesion: 0.20
Nodes (14): AttemptMarking, clampOverrideMarks(), isAttemptExpired(), MarkableQuestion, markAnswer(), markAttempt(), markMultipleChoice(), MarkResult (+6 more)

### Community 20 - "daily-runner.tsx"
Cohesion: 0.10
Nodes (25): DailyQuestion, DailyResult, DailyRunner(), FLAME_TONE, streakRarity(), SmartSession(), CoinCounter(), CoinContext (+17 more)

### Community 21 - "useToast"
Cohesion: 0.10
Nodes (35): dynamic, Access, ACCESS_OPTIONS, CommunityCreate(), JoinByInvite(), CommunityFeed(), InvitePanel(), JoinRequests() (+27 more)

### Community 22 - "exact"
Cohesion: 0.09
Nodes (26): CHARGAFF_CASES, MOLECULES, PCR_CASES, ENERGY_CASES, HW_CASES, HORMONES, LIGHT_CASES, PLANT_TISSUES (+18 more)

### Community 23 - "physics-electricity.ts"
Cohesion: 0.10
Nodes (26): APPLIANCES, BQV_CASES, CELL_CASES, COILS, COMPASS, divisorsOf(), FARADAY_CASES, FLUX_CASES (+18 more)

### Community 24 - "route-skeletons.tsx"
Cohesion: 0.09
Nodes (9): CommunitiesIndexSkeleton(), DashboardSkeleton(), LibraryIndexSkeleton(), QuizDetailSkeleton(), ROUTES, SetDetailSkeleton(), SettingsSkeleton(), StreakSkeleton() (+1 more)

### Community 25 - "quiz-results.tsx"
Cohesion: 0.09
Nodes (30): dynamic, SetPage(), CramCard, CramInitial, QueueCard, Rating, RATINGS, Tally() (+22 more)

### Community 26 - "chemistry-quantitative.ts"
Cohesion: 0.06
Nodes (45): ABUNDANCES, chemistryAtomic, groupOf(), IONS, ISOTOPES, SHELL_ELEMENTS, shellConfiguration(), alcoholFormula() (+37 more)

### Community 27 - "study-time.ts"
Cohesion: 0.13
Nodes (21): heartbeat(), AppLayout(), SettingsPage(), SessionUser, creditAppTime(), creditStudyTime(), appTimeDailyCoinCap(), flashcardSetCoins() (+13 more)

### Community 28 - "skeletons.tsx"
Cohesion: 0.09
Nodes (13): ArenaSkeleton(), BattleSkeleton(), CharacterSkeleton(), LeaderboardSkeleton(), RankSkeleton(), Skeleton(), SkeletonHeading(), SkeletonPanel() (+5 more)

### Community 29 - "feedback.tsx"
Cohesion: 0.08
Nodes (19): dynamic, metadata, ScoreSide(), metadata, dynamic, metadata, CramSession(), ComingSoon() (+11 more)

### Community 30 - "profile.ts"
Cohesion: 0.21
Nodes (13): RankProgress(), BY_KEY, nextRank(), rankDistance(), rankForElo(), rankIndex(), rankProgress, RANKS (+5 more)

### Community 31 - "dependencies"
Cohesion: 0.07
Nodes (29): @anthropic-ai/sdk, @auth/prisma-adapter, bcryptjs, clsx, date-fns, motion, next-auth, dependencies (+21 more)

### Community 32 - "NavigationProvider"
Cohesion: 0.33
Nodes (6): Skeleton Shaped Like the Page, Technical Gotchas (theme inline, Tailwind scan, heartbeat deps), Navigation Slowness Fix (NavigationProvider), destinationFor(), NavigationProvider(), onClick()

### Community 33 - "services/uploads.ts"
Cohesion: 0.08
Nodes (36): dynamic, ImportPage(), metadata, TestFeedbackPage(), submit(), generate(), submit(), ai() (+28 more)

### Community 34 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+20 more)

### Community 36 - "services/daily-quiz.ts"
Cohesion: 0.20
Nodes (14): DailyQuizPage(), advanceStreak(), computeDailyQuizReward(), streakMultiplier(), shuffle(), DailyQuestion, DailyQuizState, DailySubmitAnswer (+6 more)

### Community 37 - "devDependencies"
Cohesion: 0.07
Nodes (27): dotenv, devDependencies, dotenv, postcss, prisma, tailwindcss, @tailwindcss/postcss, tsx (+19 more)

### Community 38 - "physics-nuclear.ts"
Cohesion: 0.20
Nodes (11): CAPACITORS, CONSTANTS, toStandardForm(), BETA_MINUS, DECAY_CONSTANTS, DEFECTS, HALF_LIVES, NUCLIDES (+3 more)

### Community 39 - "rate-limit.ts"
Cohesion: 0.09
Nodes (27): bodySchema, dynamic, POST(), runtime, ForgotPasswordForm(), onSubmit(), ResetPasswordForm(), onSubmit() (+19 more)

### Community 40 - "battle.tsx"
Cohesion: 0.11
Nodes (21): BattlePage(), dynamic, metadata, Battle(), Ending, formatClock(), Opponent, Pending (+13 more)

### Community 41 - "lib/bank/import.ts"
Cohesion: 0.18
Nodes (20): main(), prisma, report(), generateAll(), GENERATORS, ImportClient, ImportOption, ImportQuestion (+12 more)

### Community 42 - "cs-kit.ts"
Cohesion: 0.08
Nodes (32): csALevelAlgorithms, REC_FNS, RecFn, bstFrom(), bstInsert(), bstSearchComparisons(), distinctList(), inorder() (+24 more)

### Community 43 - "jobs/index.ts"
Cohesion: 0.23
Nodes (14): main(), POLL_MS, RECONCILE_EVERY, tick(), submitAttemptAction(), BACKOFF_SECONDS, closeExpiredAttempts(), JobRunSummary (+6 more)

### Community 44 - "session.ts"
Cohesion: 0.19
Nodes (10): GET(), runtime, upload(), requireUserId(), UnauthorizedError, db, DbClient, globalForPrisma (+2 more)

### Community 45 - "Why the Coin Economy Can't Be Farmed"
Cohesion: 0.11
Nodes (19): The Amber Rule, The Earned-Foil Rule, The Rarity Frame (signature component), Amber Means Money, Foil Is Earned-Only, Daily Quiz, Hard Constraints (server-validated rewards), Product Purpose: Measurable Progression (+11 more)

### Community 46 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, db:migrate, db:push, db:seed, db:seed:cosmetics, db:studio, dev (+11 more)

### Community 47 - "decisions.ts"
Cohesion: 0.17
Nodes (13): AppTimeInput, AppTimeResult, DailyQuizRewardInput, DailyQuizRewardResult, Decision, FlashcardRewardInput, QuizRewardInput, SkipReason (+5 more)

### Community 48 - "theme.tsx"
Cohesion: 0.13
Nodes (16): display, metadata, sans, viewport, MoonIcon, SunIcon, apply(), systemPrefersDark() (+8 more)

### Community 49 - "guarded"
Cohesion: 0.09
Nodes (35): submit(), change(), AvatarForm(), remove(), upload(), save(), save(), passwordResetEmail() (+27 more)

### Community 50 - "leaderboard/page.tsx"
Cohesion: 0.16
Nodes (16): dynamic, LeaderboardPage(), metadata, TrophyIcon, CONTINENT_NAMES, REGION_NAMES, regionForTimezone(), regionName() (+8 more)

### Community 52 - "types.ts"
Cohesion: 0.17
Nodes (19): buildQuestions(), keyTerms(), MockAIProvider, seededPick(), sentences(), STOPWORDS, titleCase(), GeneratedOption (+11 more)

### Community 53 - "quiz-attempts.ts"
Cohesion: 0.07
Nodes (39): FlashcardsPage(), ValidationError, ALLOW(), decideFlashcardReward(), decideQuizReward(), DENY(), SKIP_REASON_TEXT, getRankMultiplier() (+31 more)

### Community 54 - "study.ts"
Cohesion: 0.05
Nodes (61): CramModePage(), EditSetPage(), metadata, generateMetadata(), dynamic, metadata, SmartModePage(), restart() (+53 more)

### Community 55 - "Rarity Is Mastery (semantic colour scale)"
Cohesion: 0.22
Nodes (10): The Collector's Table (Creative North Star), The Earned-Stock Rule, The Frame-Carries-Rarity Rule, The Ink Variant Rule, Rarity Is Mastery (semantic colour scale), The Frame Carries the Rarity, Not a Stripe, Stock Means Earned, accentFor() (deprecated hash-to-hue helper) (+2 more)

### Community 56 - "cs-systems.ts"
Cohesion: 0.17
Nodes (12): A_LEVEL, ARCHITECTURE, csSystems, formatCount(), fromCases(), GCSE, GCSE_LATE, MEMORY (+4 more)

### Community 57 - "chemistry-alevel.ts"
Cohesion: 0.15
Nodes (12): BORN_HABER, BornHaber, chemistryALevel, ELECTRODES, ENTROPIES, ENTROPY_REACTIONS, EntropyReaction, entropyTotal() (+4 more)

### Community 58 - "package.json"
Cohesion: 0.22
Nodes (8): description, engines, node, name, prisma, seed, private, version

### Community 59 - "cs-logic.ts"
Cohesion: 0.17
Nodes (10): A_LEVEL, ALL_GATES, csLogic, Gate, GATE_DESCRIPTION, GATE_OF, GCSE, GCSE_LATE (+2 more)

### Community 60 - "biology-genetics.ts"
Cohesion: 0.36
Nodes (7): Cross, CROSSES, dominantCount(), gcd(), offspringOf(), ratioOf(), SPECIES

### Community 63 - "sign-in/page.tsx"
Cohesion: 0.25
Nodes (8): metadata, SignInPage(), metadata, SignUpPage(), RootPage(), AuthForm(), onSubmit(), getCurrentUser

### Community 64 - "AnthropicProvider"
Cohesion: 0.31
Nodes (3): AnthropicProvider, MarkWrittenInput, MarkWrittenResult

### Community 65 - "Card Frames Redesign Round"
Cohesion: 0.40
Nodes (5): Card Frames (design system name), Legacy Token Aliases (violet/cyan/lime/rose/amber/panel), Card Frames Redesign Round, Impeccable Skill (redesign methodology), Ink & Gold (previous design system)

### Community 66 - "seed.ts"
Cohesion: 0.50
Nodes (3): daysAgo(), db, main()

### Community 67 - "kit.ts"
Cohesion: 0.06
Nodes (28): A_LEVEL, csAlgorithms, GCSE, GCSE_LATE, Case, csCoverage, GCSE, GCSE_LATE (+20 more)

### Community 68 - "stubs/db.ts"
Cohesion: 0.67
Nodes (3): db, DbClient, refuse()

### Community 69 - "The Pip-and-Total Rule"
Cohesion: 0.67
Nodes (3): The Measurement Rule, The Pip-and-Total Rule, StatStrip Component

### Community 70 - "anthropic.ts"
Cohesion: 0.22
Nodes (7): analysisSchema, markingSchema, optionSchema, questionSchema, QUIZ_TOOL_SCHEMA, quizSchema, AIError

### Community 72 - "env.ts"
Cohesion: 0.13
Nodes (13): runtime, authConfig, credentialsSchema, IMPORTANT: the token carries an id and nothing else that matters. Plan,, { handlers, auth, signIn, signOut }, MAIL_FROM_NAME, PRODUCT_NAME, env (+5 more)

### Community 73 - "biology-cells.ts"
Cohesion: 0.40
Nodes (4): MAGNIFICATIONS, ORGANELLES, OSMOSIS_CASES, SPECIALISED_CELLS

### Community 74 - "run/route.ts"
Cohesion: 0.36
Nodes (7): dynamic, GET(), handle(), maxDuration, POST(), runtime, runScheduledWork()

### Community 75 - "biology-organisation.ts"
Cohesion: 0.22
Nodes (8): biologyOrganisation, BLOOD_PARTS, CARDIAC_CASES, ENZYMES, EXTRA_VESSEL_FEATURES, EXTRA_VESSEL_NAMES, PATHOGEN_TYPES, VESSELS

### Community 77 - "character/page.tsx"
Cohesion: 0.47
Nodes (5): CharacterPage(), dynamic, metadata, shopFor(), ensureArenaProfile()

### Community 80 - "services/arena/cosmetics.ts"
Cohesion: 0.11
Nodes (17): db, CharacterPreview(), EquippedItem, ShopItemView, BASE_PRICE, CATEGORY_LABEL, COSMETIC_CATEGORIES, CosmeticCategoryKey (+9 more)

### Community 82 - "StudyQuest — four changes"
Cohesion: 0.25
Nodes (7): 1. Every battle question must have exactly four options, 2. Queue selection stops at subject + stage, 3. Show-password toggle on sign-in, 4. Computer science question bank, Standing rules — do not break these, StudyQuest — four changes, Verification

### Community 105 - "QuizBuilder"
Cohesion: 0.38
Nodes (4): blankQuestion(), key(), QuizBuilder(), changeType()

### Community 108 - "Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)"
Cohesion: 0.67
Nodes (3): check_imports.py, detect.mjs (slop detector), Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)

### Community 112 - "Rational"
Cohesion: 0.15
Nodes (3): frac(), assertSafe(), Rational

### Community 113 - "rules.ts"
Cohesion: 0.14
Nodes (16): dynamic, metadata, dynamic, metadata, PlanPage(), ROWS, DiscoverGrid(), PublicSet (+8 more)

### Community 120 - "actions/quizzes.ts"
Cohesion: 0.06
Nodes (50): QuizzesPage(), AttemptPage(), dynamic, metadata, EditQuizPage(), metadata, save(), remove() (+42 more)

## Knowledge Gaps
- **563 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `description` (+558 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Subject` connect `kit.ts` to `taxonomy.ts`, `lib/bank/import.ts`, `query.ts`, `arena/page.tsx`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `db` connect `session.ts` to `query.ts`, `services/communities.ts`, `match.ts`, `arena/page.tsx`, `queue.ts`, `daily-runner.tsx`, `study-time.ts`, `profile.ts`, `services/uploads.ts`, `services/daily-quiz.ts`, `rate-limit.ts`, `lib/bank/import.ts`, `jobs/index.ts`, `guarded`, `leaderboard/page.tsx`, `quiz-attempts.ts`, `study.ts`, `env.ts`, `services/arena/cosmetics.ts`, `rules.ts`, `actions/quizzes.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `generator` connect `kit.ts` to `format.ts`, `physics-kit.ts`, `generate/index.ts`, `fm-kit.ts`, `physics-nuclear.ts`, `biology-cells.ts`, `cs-kit.ts`, `biology-organisation.ts`, `lib/bank/import.ts`, `fm-series-roots.ts`, `pickDistractors`, `exact`, `physics-electricity.ts`, `cs-systems.ts`, `chemistry-alevel.ts`, `chemistry-quantitative.ts`, `cs-logic.ts`, `biology-genetics.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _563 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0670762928827445 - nodes in this community are weakly interconnected._
- **Should `physics-kit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05314685314685315 - nodes in this community are weakly interconnected._
- **Should `query.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09840425531914894 - nodes in this community are weakly interconnected._