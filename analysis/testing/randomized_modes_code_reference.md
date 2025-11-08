# randomized_modes - Code Reference & Snippets

## Quick Reference Table

| Component | Location | Purpose |
|-----------|----------|---------|
| getRandomizedMode() | L921-953 | Selects mode based on available genders |
| canCreateMixedDoubles() | L799-819 | Validates 2+ males AND 2+ females |
| canCreateSameGenderTeams() | L824-846 | Validates 4+ of specified gender |
| createMixedPairing() | L851-916 | Creates 1M+1F vs 1M+1F teams |
| findBestPairingFromPlayers() | L958-1021 | Standard pairing for same-gender |
| findBestPairing() | L1023-1130 | Main dispatcher checking all conditions |

## Full Code: getRandomizedMode()

**Location**: `mexicano-algorithm.ts` lines 921-953

```typescript
/**
 * Randomize round mode: returns "mixed", "mens", or "womens"
 */
private getRandomizedMode(players: Player[]): "mixed" | "mens" | "womens" | "any" {
  try {
    if (!Array.isArray(players) || players.length < 4) {
      console.warn("getRandomizedMode: Insufficient players");
      return "any";
    }

    const modes: Array<"mixed" | "mens" | "womens"> = [];

    if (this.canCreateMixedDoubles(players)) {
      modes.push("mixed", "mixed"); // 2x weight for mixed
    }
    if (this.canCreateSameGenderTeams(players, "male")) {
      modes.push("mens");
    }
    if (this.canCreateSameGenderTeams(players, "female")) {
      modes.push("womens");
    }

    if (modes.length === 0) {
      console.warn(
        "getRandomizedMode: No valid gender modes available, falling back to 'any'"
      );
      return "any";
    }

    const randomIndex = Math.floor(Math.random() * modes.length);
    return modes[randomIndex];
  } catch (error) {
    console.error("Error getting randomized mode:", error);
    return "any";
  }
}
```

## Full Code: canCreateMixedDoubles()

**Location**: `mexicano-algorithm.ts` lines 799-819

```typescript
/**
 * Check if we can create mixed doubles teams (1 male + 1 female per team)
 */
private canCreateMixedDoubles(players: Player[]): boolean {
  try {
    if (!Array.isArray(players) || players.length < 4) {
      return false;
    }

    const validPlayers = players.filter((p) => p && typeof p === "object" && p.gender);
    if (validPlayers.length < 4) {
      return false;
    }

    const males = validPlayers.filter((p) => p.gender === "male").length;
    const females = validPlayers.filter((p) => p.gender === "female").length;

    // Need at least 2 males and 2 females for one mixed match
    return males >= 2 && females >= 2;
  } catch (error) {
    console.error("Error checking if mixed doubles can be created:", error);
    return false;
  }
}
```

## Full Code: canCreateSameGenderTeams()

**Location**: `mexicano-algorithm.ts` lines 824-846

```typescript
/**
 * Check if we can create same-gender teams
 */
private canCreateSameGenderTeams(
  players: Player[], 
  gender: "male" | "female"
): boolean {
  try {
    if (!Array.isArray(players) || players.length < 4) {
      return false;
    }

    if (gender !== "male" && gender !== "female") {
      console.warn(`Invalid gender specified for same-gender teams: ${gender}`);
      return false;
    }

    const validPlayers = players.filter((p) => p && typeof p === "object" && p.gender);
    if (validPlayers.length < 4) {
      return false;
    }

    const count = validPlayers.filter((p) => p.gender === gender).length;
    return count >= 4; // Need 4 players of same gender
  } catch (error) {
    console.error(`Error checking if ${gender} teams can be created:`, error);
    return false;
  }
}
```

## Mode Selection in findBestPairing()

**Location**: `mexicano-algorithm.ts` lines 1064-1098

```typescript
if (this.matchupPreference === "randomized_modes") {
  const mode = this.getRandomizedMode(players);

  if (mode === "mixed") {
    const mixedPairing = this.createMixedPairing(players);
    if (mixedPairing) {
      return mixedPairing;
    }
    console.warn("Randomized mode selected 'mixed' but couldn't create mixed pairing");
  } else if (mode === "mens") {
    const males = players.filter((p) => p && p.gender === "male");
    // Validate that we have EXACTLY 4 males (not just >=4)
    if (males.length === 4) {
      return this.findBestPairingFromPlayers(males);
    } else if (males.length > 4) {
      // If more than 4 males, take only the first 4
      return this.findBestPairingFromPlayers(males.slice(0, 4));
    }
    console.warn(
      `Randomized mode selected 'mens' but only ${males.length} male players available (need 4)`
    );
  } else if (mode === "womens") {
    const females = players.filter((p) => p && p.gender === "female");
    // Validate that we have EXACTLY 4 females (not just >=4)
    if (females.length === 4) {
      return this.findBestPairingFromPlayers(females);
    } else if (females.length > 4) {
      // If more than 4 females, take only the first 4
      return this.findBestPairingFromPlayers(females.slice(0, 4));
    }
    console.warn(
      `Randomized mode selected 'womens' but only ${females.length} female players available (need 4)`
    );
  }
}
```

## Full Code: createMixedPairing()

**Location**: `mexicano-algorithm.ts` lines 851-916

```typescript
/**
 * Create mixed doubles pairing (1 male + 1 female per team)
 */
private createMixedPairing(
  players: Player[]
): { team1: [Player, Player]; team2: [Player, Player] } | null {
  try {
    // Validate input
    if (!Array.isArray(players) || players.length < 4) {
      console.warn("createMixedPairing: Insufficient players");
      return null;
    }

    const validPlayers = players.filter((p) => p && typeof p === "object" && p.gender);
    if (validPlayers.length < 4) {
      console.warn("createMixedPairing: Not enough players with valid gender data");
      return null;
    }

    const males = validPlayers.filter((p) => p.gender === "male");
    const females = validPlayers.filter((p) => p.gender === "female");

    if (males.length < 2 || females.length < 2) {
      console.warn(
        `createMixedPairing: Insufficient gender distribution (M:${males.length}, F:${females.length})`
      );
      return null;
    }

    // Validate all players have required fields
    const allRequiredPlayers = [...males.slice(0, 2), ...females.slice(0, 2)];
    if (!allRequiredPlayers.every((p) => p && p.id && typeof p.rating === "number")) {
      console.warn("createMixedPairing: Players missing required fields");
      return null;
    }

    // Sort by rating for balanced teams
    const malesSorted = [...males].sort((a, b) => (b.rating || 5) - (a.rating || 5));
    const femalesSorted = [...females].sort((a, b) => (b.rating || 5) - (a.rating || 5));

    // Try different combinations and pick best based on partner history
    const options = [
      {
        team1: [malesSorted[0], femalesSorted[0]],
        team2: [malesSorted[1], femalesSorted[1]],
      },
      {
        team1: [malesSorted[0], femalesSorted[1]],
        team2: [malesSorted[1], femalesSorted[0]],
      },
    ];

    let best = options[0];
    let minRepetitions = Infinity;

    for (const pairing of options) {
      const reps = this.countPartnerRepetitions(pairing);
      if (reps < minRepetitions) {
        minRepetitions = reps;
        best = pairing;
      }
    }

    return best as any;
  } catch (error) {
    console.error("Error creating mixed pairing:", error);
    return null;
  }
}
```

## Test Data Factories

**Location**: `__tests__/fixtures/test-data.ts`

```typescript
// Create mixed gender players
export function createMixedGenderPlayers(males: number, females: number): Player[] {
  const malePlayers = createPlayers(males, { gender: 'male', startRating: 7.0 });
  const femalePlayers = createPlayers(females, { gender: 'female', startRating: 7.0 });

  // Rename for clarity
  malePlayers.forEach((p, i) => {
    p.name = `Male${i + 1}`;
    p.id = `M${i + 1}`;
  });

  femalePlayers.forEach((p, i) => {
    p.name = `Female${i + 1}`;
    p.id = `F${i + 1}`;
  });

  return [...malePlayers, ...femalePlayers];
}
```

## Existing Test Examples

### Test 1: Constructor Validation (line 103)

```typescript
test('should accept different matchup preferences', () => {
  const players = createMixedGenderPlayers(2, 2);
  const any = new MexicanoAlgorithm(players, 1, true, 'any');
  const mixed = new MexicanoAlgorithm(clonePlayers(players), 1, true, 'mixed_only');
  const randomized = new MexicanoAlgorithm(
    clonePlayers(players), 
    1, 
    true, 
    'randomized_modes'
  );

  expect(any).toBeDefined();
  expect(mixed).toBeDefined();
  expect(randomized).toBeDefined();
});
```

### Test 2: Basic Randomized Modes (line 571)

```typescript
test('should handle randomized_modes (mixed or same-gender)', () => {
  const players = createMixedGenderPlayers(3, 3);
  const algo = new MexicanoAlgorithm(players, 1, true, 'randomized_modes');

  const round = algo.generateRound(1);

  round.matches.forEach(match => {
    // Verify match structure is valid
    expect(match.team1).toHaveLength(2);
    expect(match.team2).toHaveLength(2);

    // With randomized_modes and 3M+3F, algorithm may create various combinations
    // The important thing is valid structure and no crashes
    expect(match).toHaveProperty('team1');
    expect(match).toHaveProperty('team2');
  });
});
```

### Test 3: Odd Gender Ratio (line 591)

```typescript
test('should handle odd gender ratio (3M+1F) gracefully', () => {
  const players = createMixedGenderPlayers(3, 1);
  const algo = new MexicanoAlgorithm(players, 1, true, 'randomized_modes');

  const round = algo.generateRound(1);

  if (round.matches.length > 0) {
    round.matches.forEach(match => {
      // With 3M+1F, algorithm may fall back to 'any' mode which allows same-gender
      // The important thing is no crashes and valid match structure
      expect(match.team1).toHaveLength(2);
      expect(match.team2).toHaveLength(2);
    });
  }
});
```

### Test 4: Female Majority (line 605)

```typescript
test('should handle 6F+2M randomized mode correctly', () => {
  const players = createMixedGenderPlayers(2, 6);
  const algo = new MexicanoAlgorithm(players, 1, true, 'randomized_modes');

  for (let i = 1; i <= 5; i++) {
    const round = algo.generateRound(i);

    // Algorithm should generate valid matches (no crashes)
    expect(round.matches.length).toBeGreaterThanOrEqual(0);

    round.matches.forEach(match => {
      // Verify match structure is valid
      expect(match.team1).toHaveLength(2);
      expect(match.team2).toHaveLength(2);

      // With 6F+2M, valid modes are: mixed (1M+1F vs 1M+1F) or female doubles (2F vs 2F)
      const team1Males = match.team1.filter(p => p.gender === "male").length;
      const team2Males = match.team2.filter(p => p.gender === "male").length;

      // Either both teams are mixed, or both are female-only
      const isMixed = team1Males === 1 && team2Males === 1;
      const isFemaleDoubles = team1Males === 0 && team2Males === 0;
      expect(isMixed || isFemaleDoubles).toBe(true);
    });
  }
});
```

## Mode Selection Flow Diagram

```
randomized_modes enabled in findBestPairing()
    ↓
getRandomizedMode(players)
    ↓
    ├─ canCreateMixedDoubles(players)?
    │  YES → add "mixed" twice to modes array
    │
    ├─ canCreateSameGenderTeams(players, "male")?
    │  YES → add "mens" to modes array
    │
    └─ canCreateSameGenderTeams(players, "female")?
       YES → add "womens" to modes array
    ↓
modes.length === 0?
  YES → return "any"
  NO → random selection from modes array
    ↓
Apply selected mode:
  ├─ "mixed" → createMixedPairing()
  ├─ "mens" → filter to 4 males → findBestPairingFromPlayers()
  ├─ "womens" → filter to 4 females → findBestPairingFromPlayers()
  └─ "any" → fallback to standard pairing
    ↓
Fallback chain if mode fails:
  ├─ Try selected mode
  ├─ Check 2M+2F scenario
  ├─ Check 4 same gender scenario
  ├─ Use standard pairing
  └─ Last resort: fixed [0,2] vs [1,3]
```

## Weight Distribution Examples

### Scenario: 4M + 2F
```
canCreateMixedDoubles(4M, 2F) = TRUE  (2+ males AND 2+ females)
canCreateSameGenderTeams("male") = TRUE  (4 males)
canCreateSameGenderTeams("female") = FALSE  (only 2 females, need 4)

modes = ["mixed", "mixed", "mens"]
Distribution: 67% mixed, 33% mens
```

### Scenario: 2M + 4F
```
canCreateMixedDoubles(2M, 4F) = TRUE  (2+ males AND 2+ females)
canCreateSameGenderTeams("male") = FALSE  (only 2 males, need 4)
canCreateSameGenderTeams("female") = TRUE  (4 females)

modes = ["mixed", "mixed", "womens"]
Distribution: 67% mixed, 33% womens
```

### Scenario: 4M + 4F
```
canCreateMixedDoubles(4M, 4F) = TRUE
canCreateSameGenderTeams("male") = TRUE
canCreateSameGenderTeams("female") = TRUE

modes = ["mixed", "mixed", "mens", "womens"]
Distribution: 50% mixed, 25% mens, 25% womens
```

### Scenario: 8M + 0F
```
canCreateMixedDoubles(8M, 0F) = FALSE  (need 2+ females)
canCreateSameGenderTeams("male") = TRUE
canCreateSameGenderTeams("female") = FALSE

modes = ["mens"]
Distribution: 100% mens
```

### Scenario: All unspecified gender
```
canCreateMixedDoubles() = FALSE  (no gender filtering matches)
canCreateSameGenderTeams("male") = FALSE  (no males)
canCreateSameGenderTeams("female") = FALSE  (no females)

modes = []
Result: return "any" → standard pairing
```

## Error Handling Patterns

### Pattern 1: Invalid Input
```typescript
if (!Array.isArray(players) || players.length < 4) {
  console.warn("getRandomizedMode: Insufficient players");
  return "any";
}
```

### Pattern 2: Validation Failure
```typescript
const males = validPlayers.filter((p) => p.gender === "male");
const females = validPlayers.filter((p) => p.gender === "female");

if (males.length < 2 || females.length < 2) {
  console.warn(
    `createMixedPairing: Insufficient gender distribution (M:${males.length}, F:${females.length})`
  );
  return null;
}
```

### Pattern 3: Mode Fallback
```typescript
const mode = this.getRandomizedMode(players);

if (mode === "mixed") {
  const mixedPairing = this.createMixedPairing(players);
  if (mixedPairing) {
    return mixedPairing;
  }
  console.warn("Randomized mode selected 'mixed' but couldn't create mixed pairing");
  // Falls through to next section
}
```

### Pattern 4: Default to Safe Behavior
```typescript
if (modes.length === 0) {
  console.warn(
    "getRandomizedMode: No valid gender modes available, falling back to 'any'"
  );
  return "any";
}
```

## Helper Methods Used

| Method | Purpose | Used By |
|--------|---------|---------|
| countPartnerRepetitions() | Tracks how often players have partnered | createMixedPairing() |
| countOpponentRepetitions() | Tracks head-to-head matches | findBestPairingFromPlayers() |
| updatePartnerHistory() | Records new partnerships | updatePartnerHistoryForMatches() |
| updateOpponentHistory() | Records new opponents | updateRatings() |
| getPartnerCount() | Retrieves partnership count | countPartnerRepetitions() |
| getOpponentCount() | Retrieves opponent count | countOpponentRepetitions() |

