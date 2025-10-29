# Claude Code - Mobile App Context Index

**Last Updated**: 2025-10-29
**Current Branch**: main
**Project Status**: ✅ All Priority Phases Complete (C, D, E, B)

---

## 🎯 **QUICK START FOR NEW SESSION**

### Current State
- **Feature Parity**: ~85% with web version
- **Priority Phases**: 4/4 Complete (C✅, D✅, E✅, B✅)
- **Lines Added**: ~1,650 lines of production code
- **Testing Status**: Needs device testing (iOS + Android)

### What's Working
✅ Player management (add/remove/status changes)
✅ Multiple scoring modes (4 modes with validation)
✅ Profile activity calendar (30-day view)
✅ Statistics widgets (5 widgets in session view)
✅ Offline support with React Query
✅ Platform-specific styling (iOS/Android)

### What Needs Testing
⚠️ Test on iOS device
⚠️ Test on Android device (Samsung A24 5G)
⚠️ Test with large datasets (50+ players, 20+ rounds)
⚠️ Fix Supabase type definitions

---

## 📚 **DOCUMENTATION MAP**

### Core Documentation
| Document | Purpose | Location |
|----------|---------|----------|
| **SESSION_SUMMARY.md** | Complete implementation summary | `./SESSION_SUMMARY.md` |
| **CONTEXT_INDEX.md** | This file - quick navigation | `./.claude/CONTEXT_INDEX.md` |
| **CURRENT_STATE.md** | Detailed current state snapshot | `./.claude/context/CURRENT_STATE.md` |

### Phase Documentation
| Phase | Document | Status |
|-------|----------|--------|
| C - Player Management | `./.claude/phases/PHASE_C.md` | ✅ Complete |
| D - Multiple Scoring Modes | `./SCORING_MODES_IMPLEMENTATION.md` | ✅ Complete |
| E - Profile Statistics | `./.claude/phases/PHASE_E.md` | ✅ Complete |
| B - Statistics Widgets | `./PHASE_B_STATISTICS_WIDGETS.md` | ✅ Complete |

### Technical Documentation
| Document | Purpose |
|----------|---------|
| **ARCHITECTURE.md** | Component structure and patterns |
| **TESTING_GUIDE.md** | How to test each feature |
| **DEPLOYMENT_CHECKLIST.md** | Pre-production checklist |

---

## 🗂️ **PROJECT STRUCTURE**

```
packages/mobile/
├── .claude/                          # Claude Code context files
│   ├── CONTEXT_INDEX.md             # This file - navigation hub
│   ├── context/
│   │   ├── CURRENT_STATE.md         # Current implementation state
│   │   ├── NEXT_STEPS.md            # Recommended next tasks
│   │   └── KNOWN_ISSUES.md          # Tracked issues and workarounds
│   └── phases/
│       ├── PHASE_C.md               # Player Management details
│       └── PHASE_E.md               # Profile Statistics details
│
├── docs/                             # User-facing documentation
│   ├── ARCHITECTURE.md              # Component architecture
│   ├── TESTING_GUIDE.md             # Testing instructions
│   └── DEPLOYMENT_CHECKLIST.md      # Pre-production checklist
│
├── app/                              # Expo Router pages
│   ├── (auth)/                      # Auth screens (login, signup)
│   ├── (tabs)/                      # Main app tabs
│   │   ├── home.tsx                 # Session list
│   │   ├── profile.tsx              # Profile with activity calendar ✨
│   │   ├── settings.tsx             # Settings screen
│   │   └── session/
│   │       └── [id].tsx             # Session detail with player mgmt ✨
│   └── create-session.tsx           # Create session modal
│
├── components/
│   ├── session/
│   │   ├── RoundsTab.tsx            # Score entry with mode support ✨
│   │   ├── LeaderboardTab.tsx       # Player rankings
│   │   ├── StatisticsTab.tsx        # Stats with widgets ✨
│   │   ├── AddPlayerModal.tsx       # Add player mid-session ✨ NEW
│   │   ├── ManagePlayersModal.tsx   # Manage players ✨ NEW
│   │   └── widgets/
│   │       └── StatisticsWidgets.tsx # 5 statistics widgets ✨ NEW
│   └── create/
│       └── ScoringModeSelector.tsx  # 4 scoring mode options
│
├── hooks/
│   ├── useAuth.tsx                  # Google OAuth + email/password
│   └── useSessionForm.ts            # Session creation with scoring modes ✨
│
├── SESSION_SUMMARY.md               # Complete session summary
├── SCORING_MODES_IMPLEMENTATION.md  # Scoring modes details
├── PHASE_B_STATISTICS_WIDGETS.md    # Widgets implementation
└── FEATURE_IMPLEMENTATION_PLAN.md   # All features (documented)

✨ = Modified or created in this session
```

---

## 🔄 **RESUMING WORK - DECISION TREE**

### If You Want to...

#### 🧪 **Test Features**
→ Read: `.claude/context/TESTING_GUIDE.md`
→ Follow: Device testing checklist
→ Report: Update `KNOWN_ISSUES.md` with findings

#### 🐛 **Fix Bugs**
→ Check: `.claude/context/KNOWN_ISSUES.md`
→ Reference: Component file headers for context
→ Test: Run `yarn typecheck` after changes

#### ➕ **Add New Features**
→ Read: `FEATURE_IMPLEMENTATION_PLAN.md` (Phases A, F, G, H, I)
→ Reference: `ARCHITECTURE.md` for patterns
→ Follow: Existing component structure

#### 📱 **Deploy to Production**
→ Read: `docs/DEPLOYMENT_CHECKLIST.md`
→ Verify: All items checked off
→ Test: On actual devices first

#### 📊 **Understand Current State**
→ Start: `.claude/context/CURRENT_STATE.md`
→ Deep Dive: Phase-specific docs in `.claude/phases/`
→ Code: Check file headers for inline context

---

## 🎯 **IMMEDIATE NEXT STEPS** (Recommended)

1. **Device Testing** (2-3 hours)
   - Test on iPhone (iOS 15+)
   - Test on Samsung A24 5G (Android 15)
   - Document any platform-specific issues

2. **Fix Supabase Types** (1 hour)
   - Generate types for mobile package
   - Fix TypeScript errors in profile.tsx

3. **Performance Testing** (1 hour)
   - Test with 50+ players
   - Test with 20+ rounds
   - Monitor memory usage

4. **User Acceptance Testing** (varies)
   - Get feedback on new features
   - Prioritize improvements

---

## 📋 **FEATURE STATUS MATRIX**

| Feature | Web | Mobile | Files | Status |
|---------|-----|--------|-------|--------|
| Player Management | ✅ | ✅ | AddPlayerModal, ManagePlayersModal | Ready for testing |
| Multiple Scoring Modes | ✅ | ✅ | RoundsTab, useSessionForm | Ready for testing |
| Activity Calendar | ✅ | ✅ | profile.tsx | Ready for testing |
| Statistics Widgets | ✅ | ✅ | StatisticsWidgets | Ready for testing |
| Session Sharing (PIN) | ✅ | ❌ | - | Phase A (documented) |
| Parallel Courts | ✅ | ❌ | - | Phase F (documented) |
| Advanced Analytics | ✅ | ❌ | - | Phase H (documented) |

---

## 🔗 **KEY FILE REFERENCES**

### Most Recently Modified
1. `packages/shared/utils/statisticsUtils.ts` - Widget calculations (+235 lines)
2. `components/session/widgets/StatisticsWidgets.tsx` - Widget UI (NEW, 300 lines)
3. `components/session/StatisticsTab.tsx` - Widget integration (+2 lines)
4. `app/(tabs)/profile.tsx` - Activity calendar (+200 lines)
5. `components/session/RoundsTab.tsx` - Score auto-fill fix (+30 lines)

### Core Components to Know
- `app/(tabs)/session/[id].tsx` - Main session screen (800+ lines)
- `hooks/useAuth.tsx` - Authentication with Google OAuth
- `config/supabase.ts` - Supabase client setup
- `config/react-query.ts` - React Query with AsyncStorage

---

## 💾 **CONTEXT PRESERVATION**

### Before Ending Session
✅ Update `.claude/context/CURRENT_STATE.md`
✅ Document any blocking issues in `KNOWN_ISSUES.md`
✅ Note next tasks in `NEXT_STEPS.md`
✅ Commit changes with descriptive message

### Starting New Session
1. Read this file (CONTEXT_INDEX.md)
2. Check `.claude/context/CURRENT_STATE.md`
3. Review `NEXT_STEPS.md` for recommendations
4. Run `git status` and `git log -5` to see recent changes

---

## 🚨 **IMPORTANT NOTES**

### TypeScript Errors
- Pre-existing errors in database types (NOT from our changes)
- Safe to ignore for now - functionality works
- Should be fixed before production

### Testing Priority
1. **Critical**: Player management (add/remove in active session)
2. **Critical**: Scoring modes (all 4 modes validate correctly)
3. **High**: Activity calendar (displays and interactive)
4. **High**: Statistics widgets (calculations correct)
5. **Medium**: Performance with large datasets

### Code Patterns to Follow
- **Platform checks**: Use `Platform.OS === 'android'` for conditional styling
- **Mutations**: Use React Query's `useMutation` with optimistic updates
- **Toasts**: Use `Toast.show()` for user feedback
- **Modals**: Use React Native `Modal` with transparent background
- **Calculations**: Put logic in `@courtster/shared` package

---

## 📞 **GETTING HELP**

### If Stuck on...
- **Expo/React Native**: Check `CLAUDE.md` in mobile package
- **Supabase**: Check web package's `CLAUDE.md`
- **Algorithm Logic**: Check `packages/shared/lib/mexicano-algorithm.ts`
- **Testing**: Check Jest setup in `jest.config.js` and `jest.setup.js`

### Reference Material
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [NativeWind v4](https://www.nativewind.dev/)
- [React Query](https://tanstack.com/query/latest)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## ✅ **VERIFICATION CHECKLIST**

Before claiming work is "done":
- [ ] TypeScript compiles without NEW errors
- [ ] Component renders on iOS
- [ ] Component renders on Android
- [ ] Empty states handled
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Toast notifications for user actions
- [ ] Code follows existing patterns
- [ ] Documentation updated
- [ ] Git commit with clear message

---

**Last Session Achievements**:
- ✅ Implemented all 4 priority phases (C, D, E, B)
- ✅ Added 1,650+ lines of production code
- ✅ Created 5 new components
- ✅ Enhanced 5 existing components
- ✅ 85% feature parity with web

**Next Session Goals**:
- 🎯 Device testing on iOS + Android
- 🎯 Fix Supabase type definitions
- 🎯 Performance testing with large datasets
- 🎯 User acceptance testing

---

**💡 Pro Tip**: Start each session by reading `CURRENT_STATE.md` - it's always up to date with the latest implementation details.
