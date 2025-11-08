# Mobile App Feature Implementation Plan

## Overview
This document outlines the comprehensive plan to bring web features to the mobile app, prioritized by impact and user value.

---

## ✅ Already Implemented (Mobile)

### Core Features
- ✅ Authentication (Email/Password + Google OAuth)
- ✅ Session list with basic filtering
- ✅ Session creation
- ✅ Profile page with avatar upload
- ✅ Leaderboard tab with sorting
- ✅ Statistics tab (partnerships & head-to-head)
- ✅ Event history tab
- ✅ Rounds tab with match scoring
- ✅ Offline support with React Query
- ✅ Platform-specific styling (iOS/Android)

---

## 🚀 Phase 1: Session Sharing & Collaboration (CRITICAL)

### Priority: HIGHEST
**Impact**: Enables tournament organizers to share results publicly

### Features to Implement:
1. **Share Session Modal**
   - Generate unique share token
   - Create 4-digit PIN
   - Copy share link to clipboard
   - Display PIN prominently
   - Regenerate PIN option

2. **Public Results Page** (`/result/[id]`)
   - Public leaderboard view
   - PIN verification
   - Read-only session stats
   - No editing capabilities
   - Works without authentication

3. **Database Schema Updates**
   - Add `share_token` to game_sessions
   - Add `pin_hash` to game_sessions
   - Add `is_public` boolean flag

### Files to Create:
- `components/session/ShareSessionModal.tsx`
- `app/result/[id].tsx` (public results page)
- `hooks/useSessionSharing.ts`

### Estimated Effort: 4-6 hours
### User Value: ⭐⭐⭐⭐⭐

---

## 🎯 Phase 2: Advanced Statistics Widgets (HIGH IMPACT)

### Priority: HIGH
**Impact**: Provides engaging insights and analytics

### Widgets to Implement:

1. **MVP Widget**
   - Shows player with highest win rate
   - Displays wins/losses/ties
   - Win percentage calculation
   - Minimum 3 matches played requirement

2. **Win Streak Widget**
   - Tracks longest current win streak
   - Shows player name and streak count
   - Updates in real-time after matches

3. **Biggest Upset Widget**
   - Identifies matches where lower-ranked beats higher-ranked
   - Shows rating differential
   - Match details display

4. **Rivalry Widget**
   - Head-to-head matchup between two players
   - Win/loss record
   - Points differential
   - Match history

5. **Perfect Pairs Widget**
   - Best performing partnership
   - Combined win rate
   - Matches played together
   - Total points scored

### Files to Create:
- `components/session/widgets/MVPWidget.tsx`
- `components/session/widgets/WinStreakWidget.tsx`
- `components/session/widgets/BiggestUpsetWidget.tsx`
- `components/session/widgets/RivalryWidget.tsx`
- `components/session/widgets/PerfectPairsWidget.tsx`
- `utils/statsCalculations.ts`

### Estimated Effort: 6-8 hours
### User Value: ⭐⭐⭐⭐

---

## 👥 Phase 3: Enhanced Player Management (HIGH VALUE)

### Priority: HIGH
**Impact**: Improves tournament management flexibility

### Features to Implement:

1. **Add Player Modal**
   - Add players to active session
   - Player name input
   - Initial rating assignment
   - Add to sitting players first
   - Toast confirmation

2. **Manage Players Modal**
   - List all players
   - Edit player names inline
   - Remove players (with confirmation)
   - Change player status
   - View player statistics

3. **Player Reassignment**
   - Already partially implemented in LeaderboardTab
   - Enhance with better UI
   - Add mid-match reassignment warning

### Files to Create:
- `components/session/AddPlayerModal.tsx`
- `components/session/ManagePlayersModal.tsx`
- `components/ui/PlayerListItem.tsx`

### Estimated Effort: 4-5 hours
### User Value: ⭐⭐⭐⭐

---

## 🎮 Phase 4: Multiple Scoring Modes (MEDIUM)

### Priority: MEDIUM
**Impact**: Adds flexibility for different tournament styles

### Scoring Modes to Add:

1. **Points Mode** (Default - already implemented)
   - Fixed points per match (12, 16, 21, 24)
   - Current behavior

2. **First to X Points**
   - Race to specific point target
   - Match ends when reached
   - Like tennis scoring

3. **First to X Games**
   - Win target number of games
   - Game = first to 11 points
   - Best of format

4. **Total X Games**
   - Fixed number of games
   - Most games wins the match
   - Tiebreaker if needed

### Files to Modify:
- `app/create-session.tsx` - Add scoring mode selector
- `components/session/ScoreEntryModal.tsx` - Update for different modes
- Database schema - Add `scoring_mode` and `scoring_config` fields

### Estimated Effort: 8-10 hours
### User Value: ⭐⭐⭐

---

## 📊 Phase 5: Enhanced Profile Statistics (MEDIUM)

### Priority: MEDIUM
**Impact**: Provides users with detailed performance insights

### Features to Add:

1. **30-Day Activity Calendar**
   - Heatmap showing session frequency
   - Similar to GitHub contributions
   - Color intensity by activity

2. **Detailed Statistics Dashboard**
   - Total sessions played
   - Total hours played
   - Padel vs Tennis breakdown
   - Mexicano vs Americano preferences
   - Average session duration
   - Most common point values
   - Favorite court count

3. **Performance Metrics**
   - Overall win rate
   - Best partnerships
   - Rivalries
   - Improvement trends

### Files to Create:
- `components/profile/ActivityCalendar.tsx`
- `components/profile/StatisticsGrid.tsx`
- `components/profile/PerformanceMetrics.tsx`
- `hooks/useProfileStats.ts`

### Estimated Effort: 6-8 hours
### User Value: ⭐⭐⭐

---

## 🎪 Phase 6: Parallel Courts Mode (COMPLEX)

### Priority: MEDIUM
**Impact**: Supports multiple simultaneous courts

### Features Required:

1. **Parallel Mode Toggle**
   - Enable during session creation
   - Shows per-court progression
   - Independent round management

2. **Court-Specific Views**
   - Separate tabs for each court
   - Court status indicators
   - Per-court standings

3. **Cross-Court Player Management**
   - Track which players are on which courts
   - Prevent double-booking
   - Court switching between rounds

### Files to Create:
- `components/session/ParallelCourtsTab.tsx`
- `components/session/CourtSelector.tsx`
- `utils/parallelCourtsManager.ts`

### Estimated Effort: 12-15 hours
### User Value: ⭐⭐⭐

---

## 🔍 Phase 7: Advanced Search & Filters (LOW)

### Priority: LOW
**Impact**: Home screen already has basic filtering

### Enhancements:

1. **Advanced Date Filtering**
   - Date range picker
   - "This week", "This month" presets
   - Custom date range

2. **Multi-Select Filters**
   - Multiple sports at once
   - Multiple statuses
   - Game type combinations

3. **Saved Filter Presets**
   - Save common filter combinations
   - Quick access presets
   - User preferences

### Estimated Effort: 3-4 hours
### User Value: ⭐⭐

---

## 📱 Phase 8: Reclub Import (OPTIONAL)

### Priority: LOW
**Impact**: Nice-to-have for specific user base

### Features:

1. **Import Modal**
   - Reclub event URL input
   - Scrape player list
   - Auto-populate session details

2. **Player Mapping**
   - Match Reclub players to app users
   - Import ratings if available
   - Bulk add to session

### Estimated Effort: 8-10 hours
### User Value: ⭐⭐

---

## 🎨 Phase 9: UI/UX Polish (ONGOING)

### Priority: ONGOING
**Impact**: Incremental improvements

### Areas for Enhancement:

1. **Animations**
   - Smooth transitions
   - Loading skeletons
   - Success celebrations

2. **Haptic Feedback**
   - Button presses
   - Score changes
   - Achievements

3. **Dark Mode** (Future)
   - Theme toggle
   - System preference detection
   - Persistent user choice

### Estimated Effort: Variable
### User Value: ⭐⭐

---

## 📋 Implementation Order

### Week 1-2: Session Sharing
- Share Session Modal
- Public results page
- PIN verification
- Database updates

### Week 3-4: Statistics Widgets
- MVP Widget
- Win Streak Widget
- Biggest Upset Widget
- Rivalry Widget
- Perfect Pairs Widget

### Week 5-6: Player Management
- Add Player Modal
- Manage Players Modal
- Enhanced player status

### Week 7-8: Scoring Modes
- Multiple scoring mode support
- Score entry updates
- Session creation updates

### Week 9-10: Profile Enhancements
- Activity calendar
- Statistics dashboard
- Performance metrics

### Week 11+: Optional Features
- Parallel courts mode
- Reclub import
- Advanced filters
- UI polish

---

## Success Metrics

### Engagement Metrics:
- Session sharing usage rate
- Public results page views
- Statistics widget interaction
- Player management feature usage

### Quality Metrics:
- Bug reports per feature
- User satisfaction scores
- Feature completion rate
- Performance benchmarks

---

## Technical Considerations

### Performance:
- Lazy load widgets
- Virtualize long lists
- Cache statistics calculations
- Optimize re-renders

### Offline Support:
- Queue share actions
- Local PIN storage
- Sync when online
- Conflict resolution

### Platform Differences:
- iOS share sheet integration
- Android sharing intent
- Clipboard API usage
- Platform-specific modals

---

## Next Steps

1. Review and approve implementation plan
2. Start with Phase 1 (Session Sharing)
3. Create feature branch for each phase
4. Write tests for new features
5. Update documentation
6. Deploy incrementally

---

## Resources Needed

### Development:
- React Native expertise
- Supabase knowledge
- Testing infrastructure
- Code review process

### Design:
- Mobile UI patterns
- Icon assets
- Animation guidelines
- Accessibility standards

### Testing:
- iOS device (iPhone)
- Android device (Samsung A24 5G)
- Various screen sizes
- Performance testing tools

---

**Last Updated**: 2025-10-29
**Status**: Planning Complete, Ready for Implementation
**Priority**: Phase 1 (Session Sharing) - Start Immediately
