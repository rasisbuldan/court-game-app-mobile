# randomized_modes Testing Documentation Index

## Overview

Complete analysis and test guide for the `randomized_modes` matchup preference feature in the MexicanoAlgorithm.

## Documents in This Directory

### 1. **randomized_modes_summary.txt** (Start Here)
Quick reference guide with key findings
- Implementation overview
- Weighted selection logic
- Edge cases and testing priorities
- Code locations
- Test patterns
- Quick start guide

**Best for**: Getting a 5-minute overview

### 2. **randomized_modes_implementation.md** (Deep Dive)
Complete technical analysis of how the feature works
- Detailed implementation (5 sections)
- Edge case analysis (5 major scenarios)
- Integration with other parameters
- Current test coverage
- Recommended test suite (7 categories)
- Code locations

**Best for**: Understanding the full implementation and planning tests

### 3. **randomized_modes_code_reference.md** (Code Level)
Full code snippets and production references
- Quick reference table
- All 6 key methods with full source code
- Test data factories
- 4 existing test examples
- Mode selection flow diagram
- Weight distribution examples
- Error handling patterns
- Helper methods reference

**Best for**: Writing actual test code and understanding algorithms

### 4. **randomized_modes_visual_guide.md** (Visual Learning)
Decision trees, diagrams, and examples
- 2 detailed decision trees (mode selection, mode application)
- Weight distribution matrix (9 scenarios)
- Gender validation rules
- 4 detailed output examples
- Round generation flow
- Integration compatibility chart
- Priority test matrix
- 4 common test patterns
- Pseudo-code reference

**Best for**: Visual understanding and test case planning

## Quick Navigation

### I want to understand what randomized_modes does
→ Read: **randomized_modes_summary.txt** (Section: IMPLEMENTATION OVERVIEW)

### I need to write tests
→ Read: **randomized_modes_code_reference.md** (Test Examples section)
→ Reference: **randomized_modes_visual_guide.md** (Common Test Patterns)

### I need to know which test cases are most important
→ Read: **randomized_modes_summary.txt** (Section: TEST COVERAGE GAPS)
→ Reference: **randomized_modes_visual_guide.md** (Priority Test Matrix)

### I need to understand how the algorithm selects modes
→ Read: **randomized_modes_visual_guide.md** (Mode Selection Decision Tree)
→ Reference: **randomized_modes_implementation.md** (Section: How randomized_modes is Implemented)

### I need to see actual code
→ Read: **randomized_modes_code_reference.md** (Full Code sections)

### I want to know about edge cases
→ Read: **randomized_modes_implementation.md** (Section: Edge Cases & Testing Requirements)
→ Reference: **randomized_modes_visual_guide.md** (Output Examples)

### I need integration information
→ Read: **randomized_modes_implementation.md** (Section: Integration with Other Parameters)
→ Reference: **randomized_modes_visual_guide.md** (Integration Compatibility Chart)

## Key Findings Summary

**Feature**: `randomized_modes` matchup preference randomly selects between mixed, mens, and womens game modes

**Weighting**: Mixed appears 2x as often as other modes (when available)

**Selection**: Per-match independent random selection based on available genders

**Validation**: 
- Mixed requires 2+ males AND 2+ females
- Same-gender requires 4+ of that gender

**Fallback**: If selected mode impossible, tries alternatives then standard pairing

**Current Tests**: 4 basic tests that verify structure validity

**Missing Tests**: 10+ categories of comprehensive test coverage needed

## Implementation Locations

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| getRandomizedMode() | mexicano-algorithm.ts | 921-953 | Main mode selection |
| canCreateMixedDoubles() | mexicano-algorithm.ts | 799-819 | Validate mixed |
| canCreateSameGenderTeams() | mexicano-algorithm.ts | 824-846 | Validate same-gender |
| createMixedPairing() | mexicano-algorithm.ts | 851-916 | Create mixed pairing |
| findBestPairingFromPlayers() | mexicano-algorithm.ts | 958-1021 | Standard pairing |
| Mode Application | mexicano-algorithm.ts | 1064-1098 | Apply selected mode |

## Test Data Factories Available

All factories in `__tests__/fixtures/test-data.ts`:

```typescript
createPlayers(count, options?)              // Basic players
createMixedGenderPlayers(males, females)    // Mixed gender setup
createPlayersWithRatings(ratings)           // Specific ratings
createNamedPlayers(names, options?)         // Named players
createFixedPartnerPairs(count)              // Fixed partner setup
clonePlayers(players)                       // Deep copy
```

## Test Patterns to Use

### Basic Pattern
```typescript
const players = createMixedGenderPlayers(4, 4);
const algo = new MexicanoAlgorithm(players, 1, true, 'randomized_modes');
const round = algo.generateRound(1);
expect(round.matches[0].team1).toHaveLength(2);
```

### Gender Validation Pattern
```typescript
const team1Males = match.team1.filter(p => p.gender === "male").length;
const isMixed = team1Males === 1;
expect(isMixed || isFemaleDoubles).toBe(true);
```

### Multi-Round Pattern
```typescript
for (let i = 1; i <= 5; i++) {
  const round = algo.generateRound(i);
  // Validate each round
}
```

## Weight Distribution Reference

| Scenario | Modes | Probabilities |
|----------|-------|---------------|
| 4M + 4F | M, Ms, W | 50%, 25%, 25% |
| 4M + 2F | M, Ms | 67%, 33% |
| 2M + 4F | M, W | 67%, 33% |
| 2M + 2F | M | 100% |
| 8M + 0F | Ms | 100% |
| 0M + 8F | W | 100% |

## Critical Edge Cases to Test

1. **Insufficient Players**: Mode selected but not enough players (fallback test)
2. **All Same Gender**: Only one mode possible (distribution test)
3. **Unspecified Genders**: No gender data (graceful handling test)
4. **Boundary Conditions**: Exactly at minimum thresholds
5. **Multiple Rounds**: Mode selection varies across rounds
6. **Multiple Courts**: Independent mode selection per court

## Success Criteria for Test Suite

- [ ] Weighted selection distribution verified
- [ ] All fallback scenarios work correctly
- [ ] Gender combinations are always valid
- [ ] Partnership history tracked across modes
- [ ] Fairness maintained regardless of mode
- [ ] Works with Mexicano and Americano
- [ ] Parallel court mode supported
- [ ] 10+ rounds work correctly
- [ ] No unspecified gender crashes
- [ ] Fixed Partner priority respected

## References

### Source Code File
`packages/mobile/node_modules/@courtster/shared/lib/mexicano-algorithm.ts`
- Full implementation: 2133 lines
- Mode logic: Lines 799-953, 1064-1098

### Test Files
`packages/mobile/node_modules/@courtster/shared/__tests__/`
- Main tests: `mexicano-algorithm.test.ts`
- Extended tests: `mexicano-algorithm-extended.test.ts`
- Fixtures: `fixtures/test-data.ts`, `fixtures/test-helpers.ts`

## Related Features

- **mixed_only**: Exclusive mixed doubles mode
- **mixed_mexicano**: Game type enforcing mixed with gender balance
- **Mexicano Algorithm**: Core tournament logic
- **Americano Algorithm**: Alternative pairing strategy
- **Fixed Partner Mode**: Locked partner assignments
- **Parallel Court Mode**: Per-court generation

## Next Steps

1. Read **randomized_modes_summary.txt** for overview
2. Review existing tests in **randomized_modes_code_reference.md**
3. Check edge cases in **randomized_modes_implementation.md**
4. Use **randomized_modes_visual_guide.md** for test planning
5. Write tests using provided patterns and factories
6. Reference code snippets for validation logic

---

**Last Updated**: 2025-11-06
**Status**: Comprehensive Analysis Complete
**Ready for**: Test Suite Implementation

