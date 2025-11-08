# Game Types and Modes Documentation

This document explains the different game types, court management modes, and matchup preferences available in Courtster.

## Game Types

### 1. Mexicano (Skill-Based Matchmaking)

**Description:** Players are matched with similarly skilled opponents based on their current leaderboard position. The algorithm creates localized skill groups for balanced matches.

**How it works:**
- Uses leaderboard position to generate matchups
- Creates localized groups based on current rankings
- Pairs players with similar skill levels for competitive matches

**Example (12 players):**
- Court 1: Rank #1 + #3 vs Rank #2 + #4
- Court 2: Rank #5 + #7 vs Rank #6 + #8
- Court 3: Rank #9 + #11 vs Rank #10 + #12

**General pattern:**
- Top players face each other
- Middle players face each other
- Bottom players face each other
- Creates competitive, balanced matches within skill tiers

**Use case:** Competitive tournaments where skill-based matchmaking is desired.

---

### 2. Americano (Round Robin)

**Description:** Every player will be paired with every other player exactly once over the course of the tournament. True round-robin format.

**How it works:**
- Each player partners with every other player once
- After completing all combinations, the cycle repeats
- Ensures everyone plays with everyone

**Example (6 players: A, B, C, D, E, F):**

**Round 1-5 (A's partnerships):**
- A pairs with B
- A pairs with C
- A pairs with D
- A pairs with E
- A pairs with F

**This applies to all players:**
- B pairs with A, C, D, E, F
- C pairs with A, B, D, E, F
- D pairs with A, B, C, E, F
- E pairs with A, B, C, D, F
- F pairs with A, B, C, D, E

**Total rounds for N players:** N-1 rounds (each player sits out 1 round)

**Use case:** Social tournaments where players want to play with everyone.

---

### 3. Fixed Partner (Fixed Pairs)

**Description:** Mexicano format, but with pre-assigned partners that remain constant throughout the entire session.

**How it works:**
- User manually selects partner pairs during session creation
- Pairs are locked for the entire tournament
- Matchmaking follows Mexicano skill-based algorithm
- Partners always play together

**Example:**
- Pair 1: Alice + Bob (stay together all rounds)
- Pair 2: Carol + Dave (stay together all rounds)
- Pair 3: Eve + Frank (stay together all rounds)

**Matchup generation:**
- Uses leaderboard position of pairs (combined rating)
- Pair #1 vs Pair #2
- Pair #3 vs Pair #4
- Follows same skill-based grouping as Mexicano

**Use case:** Team tournaments, married couples, or when players want to keep the same partner.

---

### 4. Mixed Mexicano (Mixed Doubles)

**Description:** Mexicano format with a strict requirement that every team must be mixed doubles (1 man + 1 woman).

**How it works:**
- Requires equal number of male and female players
- Every pair must have 1 man + 1 woman
- Uses Mexicano skill-based matchmaking
- Ensures gender balance on every court

**Requirements:**
- Must have equal male/female count
- Automatic validation during session creation

**Example (8 players: 4 men, 4 women):**
- Court 1: Man #1 + Woman #2 vs Man #3 + Woman #1
- Court 2: Man #2 + Woman #4 vs Man #4 + Woman #3

**Use case:** Mixed doubles tournaments with gender parity.

---

## Court Management Modes

### 1. Sequential Mode (Default)

**Description:** All courts play the same round simultaneously. The next round is only generated after ALL courts finish their current round.

**How it works:**
1. Round 1 starts on all courts
2. Wait for all courts to complete
3. Generate Round 2 for all courts
4. Repeat

**Characteristics:**
- Synchronized rounds across all courts
- Players advance together
- Clear round progression
- Easy to track tournament progress

**Example (2 courts, 8 players):**
```
Round 1:
  Court 1: A+B vs C+D (15-9)
  Court 2: E+F vs G+H (12-12)
  ↓ Wait for both courts to finish

Round 2:
  Court 1: A+E vs B+F (generated based on R1 results)
  Court 2: C+G vs D+H (generated based on R1 results)
```

**Use case:** Traditional tournament format, easier to manage and announce rounds.

---

### 2. Parallel Mode (Independent Courts)

**Description:** Each court has its own independent round counter and can advance to the next round without waiting for other courts.

**How it works:**
1. Each court tracks its own round number
2. When a court finishes, it immediately generates the next round
3. Players are pulled from:
   - Players from courts that just finished
   - Players currently sitting out
4. Available players are mixed up for the next match

**Characteristics:**
- Courts advance independently
- Requires 2-4 courts
- Requires minimum 4 players per court (8 players for 2 courts, 16 for 4 courts)
- Maximizes court utilization
- No waiting time between matches
- More complex to manage

**Example (2 courts, 8 players):**
```
Initial State:
  Court 1 Round 1: A+B vs C+D (playing)
  Court 2 Round 1: E+F vs G+H (playing)

Court 1 finishes first:
  Court 1 Round 2: A+E vs D+F (immediately start)
  Court 2 Round 1: E+F vs G+H (still playing)
  Sitting: B, C

Court 2 finishes:
  Court 1 Round 2: A+E vs D+F (still playing)
  Court 2 Round 2: B+G vs C+H (immediately start)
  Sitting: E, F (from Court 1)
```

**Player selection logic:**
- Available pool = finished players + sitting players
- Mix players from different courts
- Ensure fair rotation

**Use case:** High-throughput tournaments, maximize playing time, minimize waiting.

---

## Matchup Preferences

### 1. Any Pairing (No Restrictions)

**Description:** Players are paired completely randomly with no gender restrictions.

**How it works:**
- Random pairing algorithm
- No gender constraints
- Can result in:
  - Men's doubles (M+M vs M+M)
  - Women's doubles (W+W vs W+W)
  - Mixed doubles (M+W vs M+W)
  - Mixed matchups (M+M vs W+W, M+M vs M+W, etc.)

**Example (4 men, 4 women):**
```
Round 1:
  Court 1: Man1+Man2 vs Woman1+Woman2
  Court 2: Man3+Woman3 vs Man4+Woman4
```

**Use case:** Casual play, no gender restrictions needed.

---

### 2. Mixed Only (Strict Mixed Doubles)

**Description:** Every team MUST be mixed doubles (1 man + 1 woman). Every match is mixed vs mixed.

**How it works:**
- Strict validation: 1 man + 1 woman per team
- Every match: (M+W) vs (M+W)
- Requires equal number of men and women

**Requirements:**
- Equal male/female count
- Enforced during matchup generation

**Example (4 men, 4 women):**
```
Round 1:
  Court 1: Man1+Woman1 vs Man2+Woman2
  Court 2: Man3+Woman3 vs Man4+Woman4

Round 2:
  Court 1: Man1+Woman4 vs Man3+Woman2
  Court 2: Man2+Woman3 vs Man4+Woman1
```

**Use case:** Mixed doubles tournaments, gender parity required.

---

### 3. Varied Pairings (Mixed Format)

**Description:** Allows a mix of men's doubles, women's doubles, and mixed doubles matches. Teams face opponents of the same format only.

**How it works:**
- Some matches are men's doubles (M+M vs M+M)
- Some matches are women's doubles (W+W vs W+W)
- Some matches are mixed doubles (M+W vs M+W)
- **Restriction:** Men's doubles can ONLY face men's doubles, mixed ONLY faces mixed, women's ONLY faces women's

**Match type segregation:**
- M+M vs M+M ✅
- W+W vs W+W ✅
- M+W vs M+W ✅
- M+M vs M+W ❌
- M+M vs W+W ❌
- M+W vs W+W ❌

**Example (4 men, 4 women):**
```
Round 1:
  Court 1: Man1+Man2 vs Man3+Man4 (Men's doubles)
  Court 2: Woman1+Woman2 vs Woman3+Woman4 (Women's doubles)

Round 2:
  Court 1: Man1+Woman1 vs Man2+Woman2 (Mixed doubles)
  Court 2: Man3+Woman3 vs Man4+Woman4 (Mixed doubles)

Round 3:
  Court 1: Man1+Man3 vs Man2+Man4 (Men's doubles)
  Court 2: Woman1+Woman3 vs Woman2+Woman4 (Women's doubles)
```

**Use case:** Variety in tournament format, allows different match types while maintaining fairness.

---

## Valid Combinations Matrix

| Game Type | Sequential | Parallel | Any Pairing | Mixed Only | Varied Pairings |
|-----------|-----------|----------|-------------|------------|-----------------|
| **Mexicano** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Americano** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Fixed Partner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mixed Mexicano** | ✅ | ✅ | ❌ | ✅ (forced) | ❌ |

**Notes:**
- Mixed Mexicano automatically forces "Mixed Only" matchup preference
- Mixed Mexicano cannot use "Any Pairing" or "Varied Pairings" (gender balance required)
- Parallel mode requires 2-4 courts minimum
- Parallel mode requires minimum 4 players per court

---

## Player Count Requirements

### Sequential Mode
- **Minimum:** 4 players
- **Optimal:** Multiple of 4 (4, 8, 12, 16, etc.)
- **With sitting:** Any number ≥ 4

### Parallel Mode
- **Minimum:** 2 courts × 4 players = 8 players
- **Maximum courts:** 4
- **With sitting:** Any number ≥ (courts × 4)

### Mixed Mexicano
- **Requirement:** Equal number of men and women
- **Minimum:** 4 players (2 men, 2 women)
- **Examples:** 4 (2M+2W), 8 (4M+4W), 12 (6M+6W)

### Americano
- **Minimum:** 4 players
- **Total rounds:** N-1 (where N = number of players)
- **Each player sits:** 1 round per cycle

---

## Algorithm Implementation Notes

### Mexicano Skill Grouping
```typescript
// Localized skill groups
const groupSize = 4; // Can be 2, 4, 6, etc.
const sortedPlayers = players.sort((a, b) => b.totalPoints - a.totalPoints);

// Group 1: Rank 1-4
const group1 = sortedPlayers.slice(0, 4);
// Group 2: Rank 5-8
const group2 = sortedPlayers.slice(4, 8);
// Group 3: Rank 9-12
const group3 = sortedPlayers.slice(8, 12);

// Within each group, create balanced matches
// Example: Rank #1 + #3 vs #2 + #4
```

### Americano Partnership Tracking
```typescript
// Track who has played with whom
const partnerships = new Map<string, Set<string>>();

// Round robin algorithm
for (let round = 0; round < players.length - 1; round++) {
  // Generate unique partnerships for this round
  // Ensure each player pairs with someone new
}
```

### Parallel Mode Player Pool
```typescript
// Available players = finished courts + sitting players
const finishedPlayers = courts
  .filter(court => court.matchComplete)
  .flatMap(court => court.players);

const availablePlayers = [...finishedPlayers, ...sittingPlayers];

// Mix and generate next match
if (availablePlayers.length >= 4) {
  generateMatch(availablePlayers);
}
```

---

## UI/UX Considerations

### Session Creation Flow
1. Select game type (Mexicano, Americano, Fixed Partner, Mixed Mexicano)
2. If Fixed Partner → Show partner selection UI
3. Select court management (Sequential or Parallel)
4. If Parallel → Validate minimum courts (2-4)
5. Select matchup preference (Any, Mixed Only, Varied)
6. If Mixed Mexicano → Force "Mixed Only", disable other options
7. Validate player count requirements

### In-Session Behavior
- **Sequential:** Show current round number for all courts
- **Parallel:** Show individual round number per court
- **Americano:** Show progress through partnership cycle
- **Fixed Partner:** Always display partner names together

---

**Last Updated:** 2025-10-31
**Version:** 1.0
