# randomized_modes - Visual Guide & Decision Trees

## Mode Selection Decision Tree

```
START: randomized_modes enabled
│
├─ Get list of available modes
│  │
│  ├─ Can create mixed doubles?
│  │  (2+ males AND 2+ females with explicit gender)
│  │  └─ YES → Add "mixed" TWICE to modes array
│  │
│  ├─ Can create mens teams?
│  │  (4+ males with explicit gender)
│  │  └─ YES → Add "mens" to modes array
│  │
│  └─ Can create womens teams?
│     (4+ females with explicit gender)
│     └─ YES → Add "womens" to modes array
│
├─ Is modes array empty?
│  ├─ YES → Return "any" (no gender modes, fallback to standard)
│  └─ NO → Continue
│
├─ Random selection from modes array
│  └─ randomIndex = Math.floor(Math.random() * modes.length)
│
└─ Apply selected mode (see mode application tree below)
```

## Mode Application Decision Tree

```
Selected mode?
│
├─ "mixed"
│  │
│  ├─ Can create mixed pairing? (2+ M AND 2+ F in selected 4)
│  │  ├─ YES → Return mixed pairing (1M+1F vs 1M+1F)
│  │  └─ NO → Log warning, fall through
│  │
│  └─ Try simple 2M+2F scenario
│     └─ If matches → Return mixed pairing
│
├─ "mens"
│  │
│  ├─ Filter to 4 males (or fewer if <4)
│  │  ├─ Exactly 4 → Use as-is
│  │  ├─ More than 4 → Take first 4
│  │  └─ Less than 4 → Log warning, fall through
│  │
│  └─ Apply standard pairing to 4 males
│     └─ Return all-male pairing
│
├─ "womens"
│  │
│  ├─ Filter to 4 females (or fewer if <4)
│  │  ├─ Exactly 4 → Use as-is
│  │  ├─ More than 4 → Take first 4
│  │  └─ Less than 4 → Log warning, fall through
│  │
│  └─ Apply standard pairing to 4 females
│     └─ Return all-female pairing
│
└─ Fallback chain (if mode selection fails)
   │
   ├─ Can form 2M+2F mixed pair?
   │  └─ YES → Create mixed pairing
   │
   ├─ Can form 4 same-gender pair?
   │  └─ YES → Apply standard pairing
   │
   └─ Default to standard pairing with whatever players available
```

## Weight Distribution Matrix

| Player Distribution | Modes Available | Selection Pool | Probabilities |
|-------------------|-----------------|-----------------|-------------|
| 4M + 2F | Mixed, Mens | [M,M,M] | 67% Mixed, 33% Mens |
| 2M + 4F | Mixed, Womens | [M,M,W] | 67% Mixed, 33% Womens |
| 4M + 4F | Mixed, Mens, Womens | [M,M,M,W] | 50% Mixed, 25% Mens, 25% Womens |
| 2M + 2F | Mixed | [M,M] | 100% Mixed |
| 6M + 0F | Mens | [M] | 100% Mens |
| 0F + 6F | Womens | [W] | 100% Womens |
| 3M + 3F | Mixed, (No Mens/Womens) | [M,M] | 100% Mixed |
| 8M + 1F | Mens, (No Mixed/Womens) | [M] | 100% Mens |
| All Unspecified | None | [] | 0% (fallback to "any") |

## Gender Validation Rules

### Mixed Doubles Requirements
```
TRUE IF:
  ├─ Players array has 4+ elements
  ├─ At least 4 players with gender field set
  ├─ At least 2 with gender === "male"
  └─ At least 2 with gender === "female"

FALSE IF:
  ├─ Less than 4 players total
  ├─ Less than 4 have explicit gender
  ├─ Less than 2 males OR
  └─ Less than 2 females
  
IGNORES:
  └─ Players with gender === "unspecified"
```

### Same-Gender Teams Requirements
```
TRUE IF:
  ├─ Players array has 4+ elements
  ├─ At least 4 players with gender field set
  └─ At least 4 with gender === "male" (for mens)
      OR at least 4 with gender === "female" (for womens)

FALSE IF:
  ├─ Less than 4 players total
  ├─ Less than 4 have explicit gender
  └─ Less than 4 of specified gender
  
IGNORES:
  └─ Players with gender === "unspecified"
```

## Output Examples

### Example 1: 4M + 2F Selected for Mixed
```
Input: [M1(7.0), M2(6.5), M3(6.0), M4(5.5), F1(7.0), F2(6.5)]
Mode Selected: "mixed"
Selection Pool: [mixed, mixed, mens] → random picked "mixed"

Steps:
1. Filter to 2 highest-rated males: [M1(7.0), M2(6.5)]
2. Filter to 2 highest-rated females: [F1(7.0), F2(6.5)]
3. Check partner history for best pairing:
   Option A: [M1+F1] vs [M2+F2]
   Option B: [M1+F2] vs [M2+F1]
4. Select option with fewer previous partnerships

Output:
  Team 1: [M1, F1]
  Team 2: [M2, F2]
```

### Example 2: 2M + 6F Selected for Womens
```
Input: [M1(7.0), M2(6.5), F1(7.0), F2(6.5), F3(6.0), F4(5.5), F5(5.0), F6(4.5)]
Mode Selected: "womens"
Selection Pool: [mixed, mixed, womens] → random picked "womens"

Steps:
1. Filter to females: [F1(7.0), F2(6.5), F3(6.0), F4(5.5), F5(5.0), F6(4.5)]
2. Take first 4: [F1(7.0), F2(6.5), F3(6.0), F4(5.5)]
3. Apply standard pairing (best rating balance):
   Option A: [F1+F3] vs [F2+F4]
   Option B: [F1+F4] vs [F2+F3]
4. Select based on history

Output:
  Team 1: [F1, F3]
  Team 2: [F2, F4]
  
Note: Males (M1, M2) are not playing this round
```

### Example 3: 3M + 3F - Fallback Scenario
```
Input: [M1(7.0), M2(6.5), M3(6.0), F1(7.0), F2(6.5), F3(6.0)]
Mode Selected: "mens"
Selection Pool: [mixed, mixed] → random picked "mixed" (but assume "mens" selected for example)

Steps:
1. Filter to males: [M1(7.0), M2(6.5), M3(6.0)]
2. Only 3 males available, need 4
3. Log warning: "Randomized mode selected 'mens' but only 3 male players available"
4. Fall through to standard checks
5. Check 2M+2F scenario: Can create mixed
6. Use standard pairing

Output:
  Team 1: [M1, F1] (mixed)
  Team 2: [M2, F2] (mixed)
  
Note: Actually succeeded because fell back to 2M+2F mixed instead of 3M only
```

### Example 4: All Unspecified Gender
```
Input: [P1(7.0), P2(6.5), P3(6.0), P4(5.5)]
All have gender === "unspecified" (or undefined)

Mode Selection:
1. canCreateMixedDoubles() → FALSE (no valid genders)
2. canCreateSameGenderTeams("male") → FALSE (no males)
3. canCreateSameGenderTeams("female") → FALSE (no females)
4. modes = []
5. Log warning, return "any"

Application:
1. Fall through all gender modes
2. Use standard pairing

Output:
  Team 1: [P1, P3]
  Team 2: [P2, P4]
  
Note: Treats as standard pairing, no gender consideration
```

## Round Generation with randomized_modes

```
Single Round (8 players, 2 courts):
│
├─ Court 1 (Players: M1, M2, F1, F2)
│  │
│  ├─ Select 4 players
│  ├─ Call findBestPairing()
│  ├─ getRandomizedMode() selects mode
│  ├─ Create pairing (could be mixed, mens, womens, or standard)
│  └─ Result: 1 match for Court 1
│
└─ Court 2 (Players: M3, M4, F3, F4)
   │
   ├─ Select 4 players (independent from Court 1)
   ├─ Call findBestPairing() (independent random selection)
   ├─ getRandomizedMode() selects mode (might be different from Court 1)
   ├─ Create pairing (different mode possible)
   └─ Result: 1 match for Court 2

Possible Outcomes:
  ├─ Court 1: Mixed (M1+F1 vs M2+F2), Court 2: Mens (M3+M4 vs ... wait, need 4)
  ├─ Court 1: Mens (M1+M2 vs ... wait, need 4)
  └─ Most likely: Both mixed since each has 2M+2F
```

## Integration Compatibility Chart

| Feature | randomized_modes | Works? | Notes |
|---------|------------------|--------|-------|
| Mexicano Algorithm | Any matchup mode | ✓ YES | Default algorithm |
| Americano Algorithm | Randomized modes | ✓ YES | Opponent tracking still works |
| Fixed Partner Mode | Randomized modes | ⚠ PARTIAL | Fixed Partner takes priority if genders conflict |
| mixed_mexicano Game Type | Mixed_only enforced | ✗ NO | Game type forces mixed_only instead |
| Sequential Courts | Randomized modes | ✓ YES | Each court gets independent mode |
| Parallel Courts | Randomized modes | ✓ YES | generateRoundForCourt() uses same logic |
| Player History Tracking | Randomized modes | ✓ YES | Works regardless of mode |
| Fairness Algorithm | Randomized modes | ✓ YES | Fairness maintained across all modes |
| Rating Updates | Randomized modes | ✓ YES | Works regardless of mode |

## Priority Test Matrix

```
Priority 1 (MUST TEST) - Correctness:
┌─────────────────────────────────────────┬──────────┬─────────────────┐
│ Test Scenario                            │ Gender   │ Expected Modes  │
├─────────────────────────────────────────┼──────────┼─────────────────┤
│ Weighted selection distribution          │ 4M+4F    │ 50% M, 25% Ms... │
│ Mode fallback when insufficient players  │ 3M+3F    │ Fallback mixed  │
│ All same gender                          │ 8M+0F    │ 100% mens       │
│ Unspecified genders                      │ All U    │ 0% modes        │
│ Boundary: exactly at threshold           │ 4M+2F    │ 67% M, 33% Ms   │
└─────────────────────────────────────────┴──────────┴─────────────────┘

Priority 2 (SHOULD TEST) - Integration:
┌─────────────────────────────────────────┬──────────────────────┐
│ Test Scenario                            │ Verification Point   │
├─────────────────────────────────────────┼──────────────────────┤
│ Multiple rounds consistency              │ Modes vary per round │
│ Partnership history across modes         │ History still valid  │
│ Fairness maintained                      │ Max diff ≤ 1         │
│ Parallel court independence              │ Each court different │
└─────────────────────────────────────────┴──────────────────────┘

Priority 3 (NICE-TO-TEST) - Performance:
┌─────────────────────────────────────────┬──────────────────────┐
│ Test Scenario                            │ Verification Point   │
├─────────────────────────────────────────┼──────────────────────┤
│ 20+ rounds with randomized_modes         │ No crashes/slowness  │
│ Large player pools (30+)                 │ Handles efficiently  │
│ Random distribution pattern              │ Chi-square test ~0.05│
└─────────────────────────────────────────┴──────────────────────┘
```

## Common Test Patterns

### Pattern 1: Verify mode selection happens
```
Setup: createMixedGenderPlayers(4, 4), randomized_modes
Execute: generateRound(1)
Verify: Match created (structure valid)
Result: Test passes if no crash and match.team1.length === 2
```

### Pattern 2: Verify gender combinations are valid
```
Setup: createMixedGenderPlayers(2, 6), randomized_modes  
Execute: generateRound(1)
Verify: Either mixed or female doubles
Assert: (M in T1 === 1 AND M in T2 === 1) OR (M in T1 === 0 AND M in T2 === 0)
```

### Pattern 3: Verify fallback occurs
```
Setup: createMixedGenderPlayers(3, 1), randomized_modes
Execute: generateRound(1) [might randomly select "womens" but only 1F]
Verify: Valid match still created
Assert: match.team1.length === 2 AND valid pairing
```

### Pattern 4: Verify mode varies
```
Setup: createMixedGenderPlayers(4, 4), randomized_modes
Execute: generateRound(1) through generateRound(10)
Verify: Not all rounds have same mode (need to expose or mock mode)
Note: Current implementation doesn't expose selected mode - requires enhancement
```

## Pseudo-Code Reference

```typescript
function getRandomizedMode(players): Mode {
  modes = []
  
  // Validate input
  if (!isArray(players) || players.length < 4) {
    return "any"
  }
  
  // Build weighted selection pool
  if (canCreateMixedDoubles(players)) {
    modes.push("mixed", "mixed")  // 2x weight
  }
  if (canCreateSameGenderTeams(players, "male")) {
    modes.push("mens")             // 1x weight
  }
  if (canCreateSameGenderTeams(players, "female")) {
    modes.push("womens")           // 1x weight
  }
  
  // Handle no valid modes
  if (modes.length === 0) {
    return "any"
  }
  
  // Random selection
  randomIndex = Math.floor(Math.random() * modes.length)
  return modes[randomIndex]
}

function canCreateMixedDoubles(players): Boolean {
  validPlayers = players.filter(p => p.gender === "male" || p.gender === "female")
  males = validPlayers.filter(p => p.gender === "male").length
  females = validPlayers.filter(p => p.gender === "female").length
  return males >= 2 AND females >= 2
}

function canCreateSameGenderTeams(players, gender): Boolean {
  validPlayers = players.filter(p => p.gender === gender)
  return validPlayers.length >= 4
}
```

