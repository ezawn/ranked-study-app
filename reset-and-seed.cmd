@echo off
REM ---------------------------------------------------------------------------
REM  StudyQuest - clear the Next.js build cache and seed the question bank.
REM
REM  Run this after pulling new bank generators. It does two things:
REM    1. Deletes .next, which clears the EPERM rename errors that Windows
REM       throws when the dev server and a virus scanner race on the same
REM       build manifest.
REM    2. Runs the bank seed, which is what turns the generator files into
REM       actual rows. Until it runs, new subjects stay greyed out as "soon".
REM
REM  It does NOT touch your database schema and it does NOT run prisma migrate.
REM ---------------------------------------------------------------------------

cd /d "%~dp0"

echo.
echo  StudyQuest - reset build cache and seed the bank
echo  ================================================
echo.
echo  Stop the dev server first: press Ctrl+C in the window running "npm run dev".
echo  Close any OTHER terminals running it too - one stray process is enough to
echo  hold .next open and make this fail.
echo.
pause

echo.
echo  [1/2] Removing .next ...

if exist ".next" rmdir /s /q ".next"

if exist ".next" (
  echo.
  echo  COULD NOT REMOVE .next
  echo.
  echo  Something still has a handle on it. That is almost always a dev server
  echo  that is still running, or a file explorer window sitting inside .next.
  echo  Close them and run this again.
  echo.
  pause
  exit /b 1
)

echo  Removed.
echo.
echo  [2/2] Seeding the question bank ...
echo.
echo  This writes about 8,500 questions across maths, physics, chemistry and
echo  biology. It talks to Neon, so give it a few minutes.
echo.

call npm run seed:bank

if errorlevel 1 (
  echo.
  echo  SEED FAILED - the error is above.
  echo.
  echo  If it mentions a missing table or column, the schema is behind the code:
  echo  run "npx prisma db push" and try again. Never "prisma migrate dev" on
  echo  this project - there is no migration history, so Prisma sees drift and
  echo  offers to reset the database.
  echo.
  pause
  exit /b 1
)

echo.
echo  ================================================
echo  Done. Start the app again with:  npm run dev
echo.
echo  Physics, chemistry and biology switch themselves on in the Arena subject
echo  picker once the rows exist - there is nothing to enable by hand.
echo.
pause
