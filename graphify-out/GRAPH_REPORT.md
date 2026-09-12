# Graph Report - studyquest  (2026-09-11)

## Corpus Check
- 300 files · ~444,947 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2239 nodes · 6318 edges · 118 communities (87 shown, 31 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- format.ts
- physics-kit.ts
- services/flashcards.ts
- query.ts
- icons.tsx
- feedback.tsx
- generate/index.ts
- fm-kit.ts
- taxonomy.ts
- day.ts
- arena.ts
- services/communities.ts
- arena.test.ts
- verify-logic.ts
- cn
- queue.ts
- fm-series-roots.ts
- pickDistractors
- communities/page.tsx
- marking.ts
- (app)/layout.tsx
- community-manage.tsx
- tidy
- physics-electricity.ts
- route-skeletons.tsx
- utils.ts
- chemistry-quantitative.ts
- coins.ts
- skeletons.tsx
- panel.tsx
- match.ts
- dependencies
- route-transition.tsx
- services/uploads.ts
- compilerOptions
- useToast
- services/daily-quiz.ts
- devDependencies
- guarded
- session.ts
- battle.tsx
- bank.test.ts
- cs-kit.ts
- jobs/index.ts
- Rng
- Why the Coin Economy Can't Be Farmed
- scripts
- decisions.ts
- theme.tsx
- account.ts
- useNavigate
- ImprovementPanel
- anthropic.ts
- quiz-attempts.ts
- study.ts
- Rarity Is Mastery (semantic colour scale)
- cs-systems.ts
- chemistry-alevel.ts
- package.json
- cs-logic.ts
- biology-genetics.ts
- Skeleton
- SkeletonStudyCard
- sign-in/page.tsx
- env
- Card Frames Redesign Round
- seed.ts
- kit.ts
- stubs/db.ts
- The Pip-and-Total Rule
- SetEditor
- [slug]/loading.tsx
- env.ts
- biology-alevel-molecules.ts
- CommunityResources
- biology-organisation.ts
- [quizId]/edit/loading.tsx
- communities/loading.tsx
- [setId]/loading.tsx
- [quizId]/loading.tsx
- profile.ts
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
- settings/loading.tsx
- QuizBuilder
- next
- [setId]/edit/loading.tsx
- Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)
- skeleton.tsx
- flashcards/new/loading.tsx
- streak/loading.tsx
- Rational
- requireUser
- quizzes/loading.tsx
- [attemptId]/loading.tsx
- password.ts
- actions/quizzes.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 110 edges
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

## Communities (118 total, 31 thin omitted)

### Community 0 - "format.ts"
Cohesion: 0.08
Nodes (30): binomialPmf(), choose(), integrate(), polyRational(), EXACT_TRIG, bracket(), joinTerm(), leadTerm() (+22 more)

### Community 1 - "physics-kit.ts"
Cohesion: 0.05
Nodes (58): ANGULAR, CIRCULAR, physicsALevelMechanics, PROJECTILES, SPINNERS, STRESSES, WIRES, YOUNG (+50 more)

### Community 2 - "services/flashcards.ts"
Cohesion: 0.10
Nodes (29): EditSetPage(), metadata, CramSession(), restart(), remove(), toggleVisibility(), save(), answerCramAction() (+21 more)

### Community 3 - "query.ts"
Cohesion: 0.11
Nodes (33): QuestionDraft, Candidate, preferenceFilter(), roundRobinByTopic(), seedFrom(), select(), Selection, SelectionFilter (+25 more)

### Community 4 - "icons.tsx"
Cohesion: 0.06
Nodes (45): DailyQuizPage(), dynamic, metadata, ARENA_ICONS, DashboardPage(), dynamic, greeting(), metadata (+37 more)

### Community 5 - "feedback.tsx"
Cohesion: 0.07
Nodes (54): AUTH_ERRORS, Access, ACCESS_OPTIONS, Author, FeedPost, Resource, EditableCard, SetEditorProps (+46 more)

### Community 6 - "generate/index.ts"
Cohesion: 0.06
Nodes (30): aLevelApplied, aLevelCalculus, aLevelPure, coverage, csALevelArchitecture, csALevelDatabases, csALevelLogic, csALevelNetworks (+22 more)

### Community 7 - "fm-kit.ts"
Cohesion: 0.07
Nodes (35): gcdInt(), simplifyPiFraction(), fmGcseAlgebra, fmGcseCalculus, gcd2(), LATTICE, slopeStr(), expandSquare() (+27 more)

### Community 8 - "taxonomy.ts"
Cohesion: 0.05
Nodes (38): StreamOption, SubjectPicker(), Tick(), KNOWN_QUEUE_VALUES, KNOWN_STREAMS, KNOWN_TOPICS, A_ONLY, AUTO_MARKABLE (+30 more)

### Community 9 - "day.ts"
Cohesion: 0.47
Nodes (7): effectiveStreak(), addDays(), DAY_MS, daysBetween(), isDayKey(), parseDayKey(), previousDay()

### Community 10 - "arena.ts"
Cohesion: 0.13
Nodes (21): Phase, QueueContext, QueueProvider(), QueueValue, normalisePreference(), ANSWER_LIMIT, answerSchema, cancelMatchmakingAction() (+13 more)

### Community 11 - "services/communities.ts"
Cohesion: 0.18
Nodes (25): slugify(), acceptInviteAction(), communitySchema, createCommunityAction(), shareResourceAction(), shareSchema, isUniqueViolation(), acceptInvite() (+17 more)

### Community 12 - "arena.test.ts"
Cohesion: 0.08
Nodes (41): applyElo(), applyMatchElo(), EloChange, EloInput, expectedScore(), kFactor(), MatchEloOutcome, MatchResult (+33 more)

### Community 13 - "verify-logic.ts"
Cohesion: 0.08
Nodes (21): bad, day2, day2Reward, deadline, failures, fcBase, fresh, good (+13 more)

### Community 14 - "cn"
Cohesion: 0.09
Nodes (36): ArenaPage(), dynamic, metadata, dynamic, metadata, ResultsPage(), ScoreSide(), dynamic (+28 more)

### Community 15 - "queue.ts"
Cohesion: 0.13
Nodes (23): AppLayout(), Candidate, Pairing, pickOpponent(), RANK_WINDOW_STEPS, rankWindowFor(), Searcher, waitMessage() (+15 more)

### Community 16 - "fm-series-roots.ts"
Cohesion: 0.28
Nodes (4): absNum(), fmSeriesRoots, fmtNum(), quad()

### Community 17 - "pickDistractors"
Cohesion: 0.18
Nodes (39): buildHessPair(), buildAvogadroFallback(), buildConcentrationFallback(), buildConservationFallback(), buildReactingFallback(), buildTitrationFallback(), pickDistractors(), buildCapCombineFallback() (+31 more)

### Community 18 - "communities/page.tsx"
Cohesion: 0.08
Nodes (31): CommunitiesPage(), dynamic, metadata, dynamic, FlashcardsPage(), metadata, dynamic, metadata (+23 more)

### Community 19 - "marking.ts"
Cohesion: 0.22
Nodes (12): AttemptMarking, isAttemptExpired(), MarkableQuestion, markAnswer(), markAttempt(), markMultipleChoice(), MarkResult, markSingleChoice() (+4 more)

### Community 20 - "(app)/layout.tsx"
Cohesion: 0.11
Nodes (25): QueueIndicator(), useQueue(), CoinCounter(), CoinContext, CoinContextValue, CoinProvider(), useCoins(), contextFor() (+17 more)

### Community 21 - "community-manage.tsx"
Cohesion: 0.13
Nodes (20): CommunityPage(), dynamic, generateMetadata(), InvitePanel(), create(), JoinRequests(), decide(), LeaveCommunity() (+12 more)

### Community 22 - "tidy"
Cohesion: 0.06
Nodes (38): biologyALevelSystems, CHI_CASES, SD_SETS, biologyCells, MAGNIFICATIONS, ORGANELLES, OSMOSIS_CASES, SPECIALISED_CELLS (+30 more)

### Community 23 - "physics-electricity.ts"
Cohesion: 0.10
Nodes (30): answerQty(), APPLIANCES, BQV_CASES, CELL_CASES, COILS, COMPASS, divisorsOf(), FARADAY_CASES (+22 more)

### Community 24 - "route-skeletons.tsx"
Cohesion: 0.09
Nodes (9): DailySkeleton(), DashboardSkeleton(), ImportSkeleton(), LibraryIndexSkeleton(), NewQuizSkeleton(), PlanSkeleton(), ROUTES, SubmissionSkeleton() (+1 more)

### Community 25 - "utils.ts"
Cohesion: 0.14
Nodes (15): CramCard, CramInitial, QueueCard, Rating, RATINGS, Tally(), BrainIcon, ImageIcon (+7 more)

### Community 26 - "chemistry-quantitative.ts"
Cohesion: 0.06
Nodes (47): ABUNDANCES, chemistryAtomic, groupOf(), IONS, ISOTOPES, SHELL_ELEMENTS, shellConfiguration(), alcoholFormula() (+39 more)

### Community 27 - "coins.ts"
Cohesion: 0.12
Nodes (24): SettingsPage(), SessionUser, creditStudyTime(), getRankMultiplier(), RankMultiplierInput, appTimeDailyCoinCap(), studyBonusDailyCoinCap(), dayKey() (+16 more)

### Community 28 - "skeletons.tsx"
Cohesion: 0.12
Nodes (7): ArenaSkeleton(), BattleSkeleton(), CharacterSkeleton(), LeaderboardSkeleton(), ProfileSkeleton(), RankSkeleton(), SkeletonStatStrip()

### Community 29 - "panel.tsx"
Cohesion: 0.08
Nodes (31): Static Harness Flattered the Build, dynamic, FLAME_TONE, metadata, StreakPage(), streakRarity(), DailyQuestion, DailyResult (+23 more)

### Community 30 - "match.ts"
Cohesion: 0.13
Nodes (24): dealOptions(), isAnswerCorrect(), ObjectiveType, seededShuffle(), seedFrom(), submitAnswerAction(), bankWindow(), BATTLE_SECONDS (+16 more)

### Community 31 - "dependencies"
Cohesion: 0.07
Nodes (29): @anthropic-ai/sdk, @auth/prisma-adapter, bcryptjs, clsx, date-fns, motion, next-auth, dependencies (+21 more)

### Community 32 - "route-transition.tsx"
Cohesion: 0.19
Nodes (11): Skeleton Shaped Like the Page, Technical Gotchas (theme inline, Tailwind scan, heartbeat deps), Navigation Slowness Fix (NavigationProvider), Ctx, destinationFor(), NavigationProvider(), onClick(), NavigationValue (+3 more)

### Community 33 - "services/uploads.ts"
Cohesion: 0.09
Nodes (34): dynamic, ImportPage(), metadata, TestFeedbackPage(), ai(), ForbiddenError, NotFoundError, QuotaFeature (+26 more)

### Community 34 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+20 more)

### Community 35 - "useToast"
Cohesion: 0.10
Nodes (19): CommunityCreate(), create(), JoinByInvite(), accept(), DiscoverTile(), save(), SetActions(), PdfImport() (+11 more)

### Community 36 - "services/daily-quiz.ts"
Cohesion: 0.18
Nodes (16): submit(), advanceStreak(), computeDailyQuizReward(), streakMultiplier(), shuffle(), submitDailyQuizAction(), DailyQuestion, DailyQuizState (+8 more)

### Community 37 - "devDependencies"
Cohesion: 0.07
Nodes (27): dotenv, devDependencies, dotenv, postcss, prisma, tailwindcss, @tailwindcss/postcss, tsx (+19 more)

### Community 38 - "guarded"
Cohesion: 0.12
Nodes (19): CommunityFeed(), post(), PostCard(), remove(), send(), DiscoverQuizTile(), save(), QuizActions() (+11 more)

### Community 39 - "session.ts"
Cohesion: 0.08
Nodes (29): GET(), runtime, bodySchema, dynamic, POST(), runtime, requireUserId(), UnauthorizedError (+21 more)

### Community 40 - "battle.tsx"
Cohesion: 0.13
Nodes (17): BattlePage(), dynamic, metadata, Battle(), Ending, formatClock(), Opponent, Pending (+9 more)

### Community 41 - "bank.test.ts"
Cohesion: 0.16
Nodes (25): main(), prisma, report(), generateAll(), GENERATORS, ImportClient, ImportOption, ImportQuestion (+17 more)

### Community 42 - "cs-kit.ts"
Cohesion: 0.07
Nodes (34): csALevelAlgorithms, REC_FNS, RecFn, bstFrom(), bstInsert(), bstSearchComparisons(), distinctList(), inorder() (+26 more)

### Community 43 - "jobs/index.ts"
Cohesion: 0.16
Nodes (21): main(), POLL_MS, RECONCILE_EVERY, tick(), dynamic, GET(), handle(), maxDuration (+13 more)

### Community 44 - "Rng"
Cohesion: 0.11
Nodes (5): A_LEVEL, csAlgorithms, GCSE, GCSE_LATE, Rng

### Community 45 - "Why the Coin Economy Can't Be Farmed"
Cohesion: 0.11
Nodes (19): The Amber Rule, The Earned-Foil Rule, The Rarity Frame (signature component), Amber Means Money, Foil Is Earned-Only, Daily Quiz, Hard Constraints (server-validated rewards), Product Purpose: Measurable Progression (+11 more)

### Community 46 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, db:migrate, db:push, db:seed, db:seed:cosmetics, db:studio, dev (+11 more)

### Community 47 - "decisions.ts"
Cohesion: 0.12
Nodes (23): ALLOW(), AppTimeInput, AppTimeResult, DailyQuizRewardInput, DailyQuizRewardResult, decideFlashcardReward(), decideQuizReward(), Decision (+15 more)

### Community 48 - "theme.tsx"
Cohesion: 0.13
Nodes (16): display, metadata, sans, viewport, MoonIcon, SunIcon, apply(), systemPrefersDark() (+8 more)

### Community 49 - "account.ts"
Cohesion: 0.14
Nodes (21): AvatarForm(), remove(), upload(), PasswordForm(), save(), save(), changePasswordAction(), changeTimezoneAction() (+13 more)

### Community 50 - "useNavigate"
Cohesion: 0.20
Nodes (13): metadata, DiscoverCommunities(), DiscoverCommunity, DiscoverTile(), act(), CommunityJoinPrompt(), join(), request() (+5 more)

### Community 51 - "ImprovementPanel"
Cohesion: 0.29
Nodes (10): ImprovementPanel(), discard(), generate(), save(), ReportView(), generate(), save(), discardPracticeAction() (+2 more)

### Community 52 - "anthropic.ts"
Cohesion: 0.09
Nodes (30): analysisSchema, AnthropicProvider, markingSchema, optionSchema, questionSchema, QUIZ_TOOL_SCHEMA, quizSchema, buildQuestions() (+22 more)

### Community 53 - "quiz-attempts.ts"
Cohesion: 0.09
Nodes (26): QuizzesPage(), AttemptPage(), dynamic, metadata, dynamic, metadata, ResultsPage(), ValidationError (+18 more)

### Community 54 - "study.ts"
Cohesion: 0.10
Nodes (33): CramModePage(), dynamic, metadata, SmartModePage(), SmartSession(), applyCramAnswer(), CardState, clamp() (+25 more)

### Community 55 - "Rarity Is Mastery (semantic colour scale)"
Cohesion: 0.22
Nodes (10): The Collector's Table (Creative North Star), The Earned-Stock Rule, The Frame-Carries-Rarity Rule, The Ink Variant Rule, Rarity Is Mastery (semantic colour scale), The Frame Carries the Rarity, Not a Stripe, Stock Means Earned, accentFor() (deprecated hash-to-hue helper) (+2 more)

### Community 56 - "cs-systems.ts"
Cohesion: 0.17
Nodes (12): A_LEVEL, ARCHITECTURE, csSystems, formatCount(), fromCases(), GCSE, GCSE_LATE, MEMORY (+4 more)

### Community 57 - "chemistry-alevel.ts"
Cohesion: 0.10
Nodes (19): BORN_HABER, BornHaber, chemistryALevel, ELECTRODES, ENTROPIES, ENTROPY_REACTIONS, EntropyReaction, entropyTotal() (+11 more)

### Community 58 - "package.json"
Cohesion: 0.22
Nodes (8): description, engines, node, name, prisma, seed, private, version

### Community 59 - "cs-logic.ts"
Cohesion: 0.17
Nodes (10): A_LEVEL, ALL_GATES, csLogic, Gate, GATE_DESCRIPTION, GATE_OF, GCSE, GCSE_LATE (+2 more)

### Community 60 - "biology-genetics.ts"
Cohesion: 0.31
Nodes (8): biologyGenetics, Cross, CROSSES, dominantCount(), gcd(), offspringOf(), ratioOf(), SPECIES

### Community 61 - "Skeleton"
Cohesion: 0.17
Nodes (3): metadata, ComingSoonSkeleton(), Skeleton()

### Community 63 - "sign-in/page.tsx"
Cohesion: 0.21
Nodes (10): metadata, SignInPage(), metadata, SignUpPage(), RootPage(), AuthForm(), onSubmit(), getCurrentUser (+2 more)

### Community 64 - "env"
Cohesion: 0.25
Nodes (6): runtime, authConfig, credentialsSchema, IMPORTANT: the token carries an id and nothing else that matters. Plan,, { handlers, auth, signIn, signOut }, env

### Community 65 - "Card Frames Redesign Round"
Cohesion: 0.40
Nodes (5): Card Frames (design system name), Legacy Token Aliases (violet/cyan/lime/rose/amber/panel), Card Frames Redesign Round, Impeccable Skill (redesign methodology), Ink & Gold (previous design system)

### Community 66 - "seed.ts"
Cohesion: 0.50
Nodes (3): daysAgo(), db, main()

### Community 67 - "kit.ts"
Cohesion: 0.18
Nodes (15): recall(), recall(), buildOptions(), countDecimals(), defaultMarks(), defaultSeconds(), GeneratedOption, GeneratedQuestion (+7 more)

### Community 68 - "stubs/db.ts"
Cohesion: 0.67
Nodes (3): db, DbClient, refuse()

### Community 69 - "The Pip-and-Total Rule"
Cohesion: 0.67
Nodes (3): The Measurement Rule, The Pip-and-Total Rule, StatStrip Component

### Community 70 - "SetEditor"
Cohesion: 0.38
Nodes (4): newKey(), SetEditor(), applyBulk(), emptyCard()

### Community 72 - "env.ts"
Cohesion: 0.24
Nodes (7): MAIL_FROM_NAME, PRODUCT_NAME, Mail, MailResult, sendMail(), sendToConsole(), sendViaResend()

### Community 73 - "biology-alevel-molecules.ts"
Cohesion: 0.40
Nodes (4): biologyALevelMolecules, CHARGAFF_CASES, MOLECULES, PCR_CASES

### Community 74 - "CommunityResources"
Cohesion: 0.50
Nodes (4): CommunityResources(), share(), unshare(), unshareResourceAction()

### Community 75 - "biology-organisation.ts"
Cohesion: 0.22
Nodes (8): biologyOrganisation, BLOOD_PARTS, CARDIAC_CASES, ENZYMES, EXTRA_VESSEL_FEATURES, EXTRA_VESSEL_NAMES, PATHOGEN_TYPES, VESSELS

### Community 80 - "profile.ts"
Cohesion: 0.05
Nodes (45): db, CharacterPage(), dynamic, metadata, ProfilePage(), ShopItemView, BASE_PRICE, COSMETIC_CATEGORIES (+37 more)

### Community 82 - "StudyQuest — four changes"
Cohesion: 0.25
Nodes (7): 1. Every battle question must have exactly four options, 2. Queue selection stops at subject + stage, 3. Show-password toggle on sign-in, 4. Computer science question bank, Standing rules — do not break these, StudyQuest — four changes, Verification

### Community 105 - "QuizBuilder"
Cohesion: 0.38
Nodes (4): blankQuestion(), key(), QuizBuilder(), changeType()

### Community 108 - "Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)"
Cohesion: 0.67
Nodes (3): check_imports.py, detect.mjs (slop detector), Redesign Verification Suite (control-label regression, 133 logic tests, WCAG matrix)

### Community 109 - "skeleton.tsx"
Cohesion: 0.17
Nodes (7): SkeletonHeading(), SkeletonPage(), SkeletonPanel(), SkeletonRows(), SkeletonTable(), SkeletonText(), SkeletonTileGrid()

### Community 112 - "Rational"
Cohesion: 0.15
Nodes (3): frac(), assertSafe(), Rational

### Community 113 - "requireUser"
Cohesion: 0.09
Nodes (36): metadata, NewSetPage(), dynamic, generateMetadata(), SetPage(), metadata, NewQuizPage(), dynamic (+28 more)

### Community 118 - "password.ts"
Cohesion: 0.14
Nodes (14): metadata, ForgotPasswordForm(), onSubmit(), ResetPasswordForm(), onSubmit(), passwordResetEmail(), emailSchema, PasswordActionResult (+6 more)

### Community 120 - "actions/quizzes.ts"
Cohesion: 0.14
Nodes (23): EditQuizPage(), metadata, save(), createQuizAction(), optionSchema, overrideSchema, questionSchema, quizSchema (+15 more)

## Knowledge Gaps
- **565 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `description` (+560 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Subject` connect `kit.ts` to `taxonomy.ts`, `bank.test.ts`, `query.ts`, `cn`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `db` connect `session.ts` to `services/flashcards.ts`, `query.ts`, `services/communities.ts`, `cn`, `queue.ts`, `(app)/layout.tsx`, `coins.ts`, `match.ts`, `services/uploads.ts`, `services/daily-quiz.ts`, `bank.test.ts`, `jobs/index.ts`, `account.ts`, `quiz-attempts.ts`, `study.ts`, `env`, `profile.ts`, `requireUser`, `actions/quizzes.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `services/flashcards.ts`, `icons.tsx`, `feedback.tsx`, `taxonomy.ts`, `communities/page.tsx`, `(app)/layout.tsx`, `route-skeletons.tsx`, `utils.ts`, `skeletons.tsx`, `panel.tsx`, `useToast`, `guarded`, `battle.tsx`, `theme.tsx`, `ImprovementPanel`, `study.ts`, `Skeleton`, `CommunityResources`, `QuizBuilder`, `skeleton.tsx`, `requireUser`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _565 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08484848484848485 - nodes in this community are weakly interconnected._
- **Should `physics-kit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051587301587301584 - nodes in this community are weakly interconnected._
- **Should `services/flashcards.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09803921568627451 - nodes in this community are weakly interconnected._