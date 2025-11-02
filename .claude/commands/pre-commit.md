# Pre-commit Check

Run all checks before committing code.

## Usage
```
/pre-commit
```

## Instructions

Run comprehensive checks before committing code to ensure quality and prevent issues.

### Checks to Run:

#### 1. TypeScript Type Check
```bash
yarn typecheck
```

**Action:**
- If errors found, fix all TypeScript errors
- Use `/fix-types` command if needed
- Ensure 0 errors before proceeding

#### 2. Linting
```bash
yarn lint
```

**Action:**
- Fix all ESLint errors
- Auto-fix where possible: `yarn lint --fix`
- Manually fix remaining issues

#### 3. Test Changed Files
```bash
yarn test --changedSince=HEAD
```

**Action:**
- Run tests for all modified files
- Fix any failing tests
- Add tests for new features if missing
- Ensure all tests pass

#### 4. Code Quality Checks

**Remove Debug Code:**
- Search for `console.log` statements
- Search for `console.error` (keep only in error handlers)
- Search for `debugger` statements
- Search for `TODO` or `FIXME` comments
- Remove or comment out debugging code

**Check for Common Issues:**
- Unused imports
- Unused variables
- Any types (should use specific types)
- Missing error handling
- Hardcoded values that should be constants

#### 5. File Checks

**New Files:**
- Ensure all new components have tests
- Ensure all new hooks have tests
- Add appropriate exports to index files
- Update CLAUDE.md if adding new patterns

**Modified Files:**
- Tests still pass
- Types still correct
- No breaking changes to public APIs

#### 6. Git Status Check
```bash
git status
```

**Review:**
- Only commit intended changes
- Check for accidentally modified files
- Ensure no sensitive data (API keys, tokens)
- Review .env files are not staged

### Checklist:

```
Pre-commit Checklist:

✅ TypeScript
  [ ] yarn typecheck passes (0 errors)

✅ Linting
  [ ] yarn lint passes (0 errors)

✅ Testing
  [ ] All tests pass
  [ ] New features have tests
  [ ] Coverage maintained or improved

✅ Code Quality
  [ ] No console.log statements
  [ ] No debugger statements
  [ ] No TODO/FIXME in production code
  [ ] No unused imports/variables
  [ ] No 'any' types

✅ Git
  [ ] Only intended files staged
  [ ] No sensitive data
  [ ] Commit message is descriptive

✅ Documentation
  [ ] Updated CLAUDE.md if needed
  [ ] Added JSDoc comments for public APIs
  [ ] Updated test documentation
```

### Auto-fix Script:

If issues found, attempt auto-fixes:

```bash
# Fix linting
yarn lint --fix

# Format code
yarn format

# Update imports
yarn organize-imports
```

### Report Template:

```
📋 Pre-commit Check Report

✅ TypeScript: PASS (0 errors)
✅ Linting: PASS (0 errors)
✅ Tests: PASS (23/23 passing)
✅ Code Quality: PASS (no debug code)
✅ Git: PASS (3 files staged)

🚀 Ready to commit!

Files to commit:
- components/session/RoundsTab.tsx
- components/session/__tests__/RoundsTab.test.tsx
- CLAUDE.md

Suggested commit message:
"feat: add retry button to algorithm error UI

- Enhanced error handling with retry capability
- Added comprehensive tests (12 test cases)
- Updated documentation"
```

### Deliverable:
All checks passing with detailed report of what was checked and fixed.
