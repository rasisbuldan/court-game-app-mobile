# Score Entry Modal Integration Guide

## Overview

The ScoreEntryModal and supporting components have been created to provide an enhanced score entry experience with support for multiple scoring modes. This document outlines how to integrate it into RoundsTab.

## Components Created

### 1. **ScoreEntryModal** (`components/session/ScoreEntryModal.tsx`)
Full-screen modal for entering match scores with support for:
- Points mode (simple increment/decrement)
- First to X games (game-by-game tracking)
- Total games (game-by-game tracking)

### 2. **GameScoreTracker** (`components/session/GameScoreTracker.tsx`)
Horizontal scrollable game score tracker for game-based scoring modes.

### 3. **MatchScoreInput** (`components/session/MatchScoreInput.tsx`)
Wrapper component that switches between inline textbox and modal based on user preference.

### 4. **useScoreEntryPreference** (`hooks/useScoreEntryPreference.ts`)
Hook to manage and persist user's score entry method preference.

### 5. **SessionSettingsModal Enhancement** (`components/ui/SessionSettingsModal.tsx`)
Added "Score Entry Method" selector with Inline/Modal options.

## Integration Steps

### Step 1: Import MatchScoreInput in RoundsTab

```typescript
import { MatchScoreInput } from './MatchScoreInput';
```

### Step 2: Replace Inline TextInput with MatchScoreInput

**Current Code (Compact Mode):**
```typescript
<TextInput
  style={{
    width: 52,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: (savedScores[`match-${index}`]?.team1Score !== undefined || match.team1Score !== undefined) && localScores[`match-${index}`]?.team1 === undefined ? '#10B981' : '#E5E7EB',
    // ... more styles
  }}
  keyboardType="numeric"
  value={localScores[`match-${index}`]?.team1 ?? savedScores[`match-${index}`]?.team1Score?.toString() ?? match.team1Score?.toString() ?? ''}
  onChangeText={(value) => {
    addToLimitedState(setLocalScores, `match-${index}`, {
      ...localScores[`match-${index}`],
      team1: value,
    });
  }}
  // ... more props
/>
```

**New Code:**
```typescript
<MatchScoreInput
  matchIndex={index}
  team1Players={[match.team1.player1.name, match.team1.player2.name]}
  team2Players={[match.team2.player1.name, match.team2.player2.name]}
  team1Score={match.team1Score}
  team2Score={match.team2Score}
  gameScores={match.gameScores} // Add this field to match data
  scoringMode={session.scoring_mode}
  pointsPerMatch={session.points_per_match}
  pointsPerGame={session.points_per_game}
  gamesToWin={session.games_to_win}
  totalGames={session.total_games}
  onScoreChange={(matchIndex, team1, team2, games) => {
    updateScoreMutation.mutate({
      matchIndex,
      team1Score: team1,
      team2Score: team2,
      gameScores: games,
    });
  }}
  isSaving={savingMatches.has(index)}
  isSaved={!!savedScores[`match-${index}`]}
  localTeam1Score={localScores[`match-${index}`]?.team1}
  localTeam2Score={localScores[`match-${index}`]?.team2}
  onLocalScoreChange={(team, value) => {
    addToLimitedState(setLocalScores, `match-${index}`, {
      ...localScores[`match-${index}`],
      [team === 1 ? 'team1' : 'team2']: value,
    });
  }}
  compactMode={compactMode}
/>
```

### Step 3: Update Database Schema (If Needed)

If game-by-game scores need to be stored, add `game_scores` JSONB column to matches:

```sql
ALTER TABLE matches ADD COLUMN game_scores JSONB;
```

### Step 4: Update Match Type

```typescript
interface Match {
  // ... existing fields
  gameScores?: GameScore[];
}
```

## Benefits

1. **User Choice**: Users can choose their preferred input method
2. **Enhanced UX**: Modal provides better UX for game-based modes
3. **Backward Compatible**: Inline mode preserves existing behavior
4. **Clean Separation**: MatchScoreInput abstracts complexity
5. **Easy Toggle**: Users can switch preferences anytime in settings

## Testing Checklist

- [ ] Inline mode works as before
- [ ] Modal mode opens and closes correctly
- [ ] Points mode validation works
- [ ] First to X games tracking works
- [ ] Total games tracking works
- [ ] Scores save correctly in both modes
- [ ] Preference persists after app restart
- [ ] Compact mode renders correctly
- [ ] Network offline queue works
- [ ] Migration from old to new system works

## Rollout Strategy

1. **Phase 1**: Deploy with modal as default (better UX)
2. **Phase 2**: Monitor user feedback
3. **Phase 3**: Collect analytics on preference usage
4. **Phase 4**: Consider deprecating inline mode if modal adoption is high

## Notes

- MatchScoreInput handles all complexity internally
- RoundsTab doesn't need to know about scoring modes
- Settings modal already includes preference toggle
- GameScoreTracker is reusable for other views
