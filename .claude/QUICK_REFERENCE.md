# Quick Reference Card

**For**: Starting new Claude Code session
**Last Updated**: 2025-10-29

---

## 🚀 **START HERE**

### First Steps
1. Read this file (you're doing it!)
2. Check `.claude/context/CURRENT_STATE.md` for detailed status
3. Review `.claude/context/NEXT_STEPS.md` for recommendations
4. Run `git status` and `git log -3` to see recent changes

---

## 📂 **PROJECT LAYOUT**

```
packages/mobile/
├── .claude/                    ← Context for Claude Code
│   ├── CONTEXT_INDEX.md       ← Main navigation hub
│   ├── QUICK_REFERENCE.md     ← This file
│   ├── context/
│   │   ├── CURRENT_STATE.md   ← Detailed implementation state
│   │   ├── NEXT_STEPS.md      ← What to do next
│   │   └── KNOWN_ISSUES.md    ← Tracked bugs and workarounds
│   └── phases/
│       ├── PHASE_C.md         ← Player Management details
│       ├── PHASE_D.md         ← Scoring Modes details
│       ├── PHASE_E.md         ← Profile Statistics details
│       └── PHASE_B_STATISTICS_WIDGETS.md ← Widgets details
│
├── app/                        ← Expo Router pages
├── components/                 ← React Native components
├── hooks/                      ← Custom hooks
└── SESSION_SUMMARY.md          ← Complete session summary
```

---

## ✅ **CURRENT STATUS** (Quick View)

| Phase | Feature | Status | Files |
|-------|---------|--------|-------|
| **C** | Player Management | ✅ Complete | AddPlayerModal, ManagePlayersModal |
| **D** | Scoring Modes | ✅ Complete | RoundsTab, useSessionForm |
| **E** | Profile Stats | ✅ Complete | profile.tsx (calendar) |
| **B** | Stats Widgets | ✅ Complete | StatisticsWidgets (5 widgets) |

**Overall**: 85% feature parity with web • Ready for device testing

---

## 🎯 **TOP 3 PRIORITIES**

1. **Device Testing** - Test on iOS + Android devices
2. **Fix Supabase Types** - Eliminate TypeScript errors
3. **Performance Testing** - Validate with 50+ players

---

## 📝 **COMMON COMMANDS**

```bash
# Start development
cd packages/mobile
yarn start

# Type check
yarn typecheck

# Run on device
yarn ios      # iOS
yarn android  # Android

# View git changes
git status
git diff
git log --oneline -10
```

---

## 🗺️ **NAVIGATION MAP**

### Want to understand current implementation?
→ Read `.claude/context/CURRENT_STATE.md`

### Want to know what to work on next?
→ Read `.claude/context/NEXT_STEPS.md`

### Found a bug?
→ Add to `.claude/context/KNOWN_ISSUES.md`

### Need details on a specific phase?
→ Read `.claude/phases/PHASE_[X].md`

### Want complete session history?
→ Read `SESSION_SUMMARY.md`

---

## 🔍 **KEY FILES** (Most Recently Modified)

| File | What Changed | Lines |
|------|--------------|-------|
| `packages/shared/utils/statisticsUtils.ts` | Widget calculations | +235 |
| `components/session/widgets/StatisticsWidgets.tsx` | Widget UI | +300 (NEW) |
| `app/(tabs)/profile.tsx` | Activity calendar | +200 |
| `components/session/RoundsTab.tsx` | Score auto-fill fix | +30 |
| `app/(tabs)/session/[id].tsx` | Player management | +150 |

---

## 🐛 **KNOWN ISSUES** (Quick List)

1. **TypeScript Errors** - Pre-existing Supabase types missing (safe to ignore)
2. **Jest Tests Fail** - Expo compatibility issues (using manual testing)
3. **Avatar Images** - Need to add Image component (functional, just placeholder)

Full list in `.claude/context/KNOWN_ISSUES.md`

---

## 💡 **CODE PATTERNS**

### Platform-Specific Styling
```typescript
Platform.OS === 'android' ? { elevation: 4 } : { shadowOpacity: 0.1 }
```

### Mutations
```typescript
const mutation = useMutation({
  mutationFn: async (data) => { /* Supabase operation */ },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [...] });
    Toast.show({ type: 'success', ... });
  },
});
```

### Modals
```typescript
<Modal visible={visible} transparent animationType="fade">
  <View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    {/* Content */}
  </View>
</Modal>
```

---

## 🧪 **TESTING CHECKLIST**

Before claiming feature is "done":
- [ ] TypeScript compiles
- [ ] Renders on iOS
- [ ] Renders on Android
- [ ] Empty states work
- [ ] Loading states work
- [ ] Error states work
- [ ] Toast notifications show
- [ ] Follows existing patterns

---

## 🚨 **EMERGENCY CONTACTS**

- **Stuck on Expo**: Check `CLAUDE.md` in mobile package
- **Stuck on Supabase**: Check web package's `CLAUDE.md`
- **Stuck on Algorithm**: Check `packages/shared/lib/mexicano-algorithm.ts`

---

## 💾 **SAVE YOUR PROGRESS**

Before ending session:
1. Update `.claude/context/CURRENT_STATE.md` if needed
2. Add any new issues to `KNOWN_ISSUES.md`
3. Update `NEXT_STEPS.md` with recommendations
4. Commit with descriptive message

---

## 🎯 **SESSION STARTUP CHECKLIST**

Starting a new session? Check these:

- [ ] Read QUICK_REFERENCE.md (this file)
- [ ] Check CURRENT_STATE.md for latest status
- [ ] Review NEXT_STEPS.md for recommendations
- [ ] Run `git status` to see uncommitted changes
- [ ] Run `git log -5` to see recent commits
- [ ] Run `yarn typecheck` to see current errors
- [ ] Decide on task from NEXT_STEPS.md
- [ ] Start coding!

---

**Remember**: All context is organized in `.claude/` directory. When in doubt, start there!

**Pro Tip**: Keep `CURRENT_STATE.md` open in another tab while coding for quick reference.
