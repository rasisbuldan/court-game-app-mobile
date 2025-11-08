# randomized_modes Matchup Preference - Implementation Analysis

## Overview

The `randomized_modes` matchup preference is a feature in the MexicanoAlgorithm that randomly selects between three game mode types for each match:
- **Mixed** (1M + 1F vs 1M + 1F) - weighted 2x (appears twice in selection pool)
- **Mens** (2M vs 2M)
- **Womens** (2F vs 2F)

The algorithm validates which modes are possible based on available player genders and randomly selects one with weighted preference for mixed.

## Implementation Details

### 1. How randomized_modes is Implemented

**Source File**: `mexicano-algorithm.ts` (lines 1064-1098)

**Key Method**: `getRandomizedMode(players: Player[]): "mixed" | "mens" | "womens" | "any"`

```typescript
private getRandomizedMode(players: Player[]): "mixed" | "mens" | "womens" | "any" {
  try {
    if (!Array.isArray(players) || players.length < 4) {
      console.warn("getRandomizedMode: Insufficient players");
      return "any";
    }

    const modes: Array<"mixed" | "mens" | "womens"> = [];

    // Check if mixed is possible (2+ males AND 2+ females)
    if (this.canCreateMixedDoubles(players)) {
      modes.push("mixed", "mixed"); // 2x weight for mixed
    }
    
    // Check if mens is possible (4+ males)
    if (this.canCreateSameGenderTeams(players, "male")) {
      modes.push("mens");
    }
    
    // Check if womens is possible (4+ females)
    if (this.canCreateSameGenderTeams(players, "female")) {
      modes.push("womens");
    }

    if (modes.length === 0) {
      console.warn(
        "getRandomizedMode: No valid gender modes available, falling back to 'any'"
      );
      return "any";
    }

    // Random selection from weighted array
    const randomIndex = Math.floor(Math.random() * modes.length);
    return modes[randomIndex];
  } catch (error) {
    console.error("Error getting randomized mode:", error);
    return "any";
  }
}
```

### 2. Weighted Selection Logic

**Weight System**:
- **Mixed**: 2x weight (added to array twice: `modes.push("mixed", "mixed")`)
- **Mens**: 1x weight (single entry)
- **Womens**: 1x weight (single entry)

**Example Distribution**:
- 4M + 2F available:
  - `modes = ["mixed", "mixed", "mens"]` (3 total, 67% mixed, 33% mens)
- 2M + 4F available:
  - `modes = ["mixed", "mixed", "womens"]` (3 total, 67% mixed, 33% womens)
- 2M + 2F available:
  - `modes = ["mixed", "mixed"]` (2 total, 100% mixed)

### 3. Helper Validation Methods

**`canCreateMixedDoubles(players)`** (lines 799-819):
- Requires: 2+ males AND 2+ females
- Returns: boolean

**`canCreateSameGenderTeams(players, gender)`** (lines 824-846):
- Requires: 4+ players of specified gender
- Returns: boolean

### 4. How Mode Selection Works Per Round

**Flow in `findBestPairing()`** (lines 1064-1098):

```
1. Check if randomized_modes is enabled
2. Call getRandomizedMode(players) to pick mode (random per round/per court)
3. Based on selected mode:
   - "mixed": Call createMixedPairing()
   - "mens": Filter to males, call findBestPairingFromPlayers()
   - "womens": Filter to females, call findBestPairingFromPlayers()
   - "any": Fallback if selection fails
4. If mode selection produces valid pairing, return it
5. If not (insufficient players), fall back and log warning
```

**Key**: Mode is selected **per court/match**, not per round. Each court gets independent random selection.

### 5. Validation & Fallback Mechanisms

**Primary Checks** (canCreateMixedDoubles, canCreateSameGenderTeams):
```typescript
// Mixed requires 2+ of each gender
males >= 2 && females >= 2

// Same-gender requires 4+ of that gender
males >= 4 OR females >= 4
```

**Fallback Chain** (when selected mode fails):
1. Try selected mode's pairing function
2. If no valid pairing, log warning and fall through
3. Check for simple scenarios:
   - Exactly 2M + 2F → create mixed doubles
   - Exactly 4 same gender → use standard pairing
4. Default to standard pairing with `findBestPairingFromPlayers()`
5. Last resort: simple fixed pairing [0,2] vs [1,3]

**Example**: If "mens" selected but only 3 males available:
```typescript
} else if (mode === "mens") {
  const males = players.filter((p) => p && p.gender === "male");
  if (males.length === 4) {
    return this.findBestPairingFromPlayers(males);
  } else if (males.length > 4) {
    return this.findBestPairingFromPlayers(males.slice(0, 4));
  }
  console.warn(
    `Randomized mode selected 'mens' but only ${males.length} male players available (need 4)`
  );
  // Falls through to standard pairing
}
```

## Edge Cases & Testing Requirements

### Case 1: Insufficient Players for Selected Mode

**Scenario**: 3M + 3F available, "mens" randomly selected
- Need 4 males but only 3 available
- **Result**: Fallback to mixed or standard pairing
- **Test**: Verify warning logged and valid match created

**Scenario**: 6M + 0F, "mixed" randomly selected
- Need 2+ females but have 0
- **Result**: Fall through all gender modes, use standard pairing
- **Test**: Verify all male match generated correctly

### Case 2: All Same Gender

**Scenario**: 8M + 0F, randomized_modes enabled
- `canCreateMixedDoubles()` → false
- `canCreateSameGenderTeams("male")` → true
- `modes = ["mens"]` → always select "mens"
- **Expected**: All matches are all-male
- **Test**: Verify no mixed pairings created

**Scenario**: 0M + 8F, randomized_modes enabled
- `modes = ["womens"]` → always select "womens"
- **Expected**: All matches are all-female
- **Test**: Verify no mixed pairings created

### Case 3: Unspecified Genders

**Scenario**: 2 players with gender="unspecified", 2M, 2F
- Unspecified players treated as neither male nor female
- Can't be counted toward gender requirements
- **Result**: Can't form 2M+2F for mixed (need specific genders)
- **Test**: Verify algorithm handles gracefully

**Scenario**: All players gender="unspecified"
- No gender modes possible (canCreateMixedDoubles, canCreateSameGenderTeams all false)
- `modes.length === 0` → return "any"
- Falls back to standard pairing
- **Test**: Verify standard pairing used

### Case 4: Unbalanced Gender Ratios

**Scenario**: 2M + 6F
- Mixed possible: 2+ of each gender ✓
- Mens possible: 4+ males? NO (only 2)
- Womens possible: 4+ females? YES (6)
- `modes = ["mixed", "mixed", "womens"]`
- 67% chance mixed, 33% chance womens

**Test Cases**:
```
67% should get (1M+1F vs 1M+1F)
33% should get (2F vs 2F)
All should be valid - no mixed-gender errors
```

**Scenario**: 4M + 4F
- `modes = ["mixed", "mixed", "mens", "womens"]`
- 50% mixed, 25% mens, 25% womens

### Case 5: Edge of Threshold

**Scenario**: 4M + 2F (exactly at minimum for each)
- Mixed: 2+ males ✓, 2+ females ✓
- Mens: 4+ males ✓
- Womens: 4+ females? NO (only 2)
- `modes = ["mixed", "mixed", "mens"]`

**Scenario**: 2M + 4F (exactly at minimum for each)
- Mixed: 2+ males ✓, 2+ females ✓
- Mens: 4+ males? NO (only 2)
- Womens: 4+ females ✓
- `modes = ["mixed", "mixed", "womens"]`

**Scenario**: 4M + 4F with 1 unspecified
- Unspecified doesn't count toward gender totals
- Same as 4M + 4F (unspecified ignored)

## Integration with Other Parameters

### With Mexicano/Americano/Fixed Partner

**Mexicano + randomized_modes**:
- Works as expected
- Random mode selection affects pairing strategy
- Partner history still tracked across modes

**Americano + randomized_modes**:
- Mode selection works same way
- Opponent history tracking works regardless of mode
- Fallback behavior same

**Fixed Partner + randomized_modes**:
- **ISSUE**: Fixed partners may have opposite genders
- If fixed partners are different genders:
  - "mens" selected but partner is female → can't execute
  - Falls back to fixed partner mode (overrides mode selection)
- Test: Verify fixed partner takes priority

### With Court Modes (Sequential/Parallel)

**Sequential (full round at once)**:
- Each court gets independent mode selection
- Court 1 might get mixed, Court 2 might get mens
- Valid for different gender distributions per court

**Parallel (one court at a time)**:
- `generateRoundForCourt()` calls same `findBestPairing()` logic
- Mode selection per court independently
- Works correctly

## Current Test Coverage

### Existing Tests (mexicano-algorithm.test.ts)

1. **Constructor accepts randomized_modes**:
   ```typescript
   const randomized = new MexicanoAlgorithm(
     clonePlayers(players), 
     1, 
     true, 
     'randomized_modes'
   );
   expect(randomized).toBeDefined();
   ```

2. **3M + 3F test** (line 571):
   - Tests that randomized_modes works with equal gender distribution
   - Verifies match structure valid
   - Basic validation only

3. **3M + 1F test** (line 591):
   - Tests graceful handling of odd gender ratio
   - Verifies no crashes

4. **6F + 2M test** (line 605):
   - Tests with female majority
   - Validates match structure
   - **Specific assertion**: `isMixed || isFemaleDoubles`
   - Ensures gender combinations are valid

## Recommended Test Suite

Based on the analysis, here are the comprehensive tests needed:

### 1. Weighted Selection Tests
- [ ] Verify mixed appears with 2x frequency in valid scenarios
- [ ] Test distribution over multiple rounds (statistical test)
- [ ] Verify each mode can be selected when possible

### 2. Validation Tests
- [ ] Insufficient males for selected mode → fallback works
- [ ] Insufficient females for selected mode → fallback works
- [ ] All same gender → only one mode available
- [ ] Unspecified genders → handled gracefully
- [ ] Zero of one gender → modes excluded correctly

### 3. Edge Case Tests
- [ ] Exactly 4 males, 2 females → mixed and mens only
- [ ] Exactly 2 males, 4 females → mixed and womens only
- [ ] 4 males, 4 females, 1 unspecified → treats as 4M+4F
- [ ] All unspecified gender → falls back to standard pairing

### 4. Pairing Validation Tests
- [ ] Mixed mode creates (1M+1F vs 1M+1F)
- [ ] Mens mode creates (2M vs 2M)
- [ ] Womens mode creates (2F vs 2F)
- [ ] No invalid gender combinations in output
- [ ] Player history (partner/opponent) tracked regardless of mode

### 5. Integration Tests
- [ ] Works with Mexicano algorithm
- [ ] Works with Americano algorithm
- [ ] Fixed Partner overrides mode when needed
- [ ] Parallel court mode works correctly
- [ ] Mode changes per round (not locked)

### 6. Round Generation Tests
- [ ] Multiple rounds with randomized_modes
- [ ] Fairness maintained across all modes
- [ ] Player stats updated correctly regardless of mode
- [ ] No player appears twice in one round

### 7. Stress Tests
- [ ] 10+ rounds with randomized_modes
- [ ] Large player pools (20+) with mixed genders
- [ ] Various gender ratios across many rounds
- [ ] Performance acceptable with mode selection overhead

## Key Code Locations

1. **Mode Selection**: `mexicano-algorithm.ts:921-953`
2. **Mode Application**: `mexicano-algorithm.ts:1064-1098`
3. **Validation Helpers**: `mexicano-algorithm.ts:799-846`
4. **Pairing Logic**: `mexicano-algorithm.ts:851-916`
5. **Test Fixtures**: `__tests__/fixtures/test-data.ts`
6. **Existing Tests**: `__tests__/mexicano-algorithm.test.ts:571-610`
