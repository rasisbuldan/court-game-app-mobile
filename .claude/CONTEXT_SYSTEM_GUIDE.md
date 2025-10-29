# Context Sharing System - Guide

**Created**: 2025-10-29
**Purpose**: Enable seamless work across devices and sessions

---

## 🎯 **WHAT IS THIS?**

This is a comprehensive context preservation system that allows you to:
- **Switch devices** without losing context
- **Resume work** days/weeks later with full understanding
- **Collaborate** with clear documentation
- **Track progress** systematically
- **Avoid repetition** by documenting decisions

---

## 📂 **FILE ORGANIZATION**

### Directory Structure
```
.claude/                           ← All context files here
│
├── CONTEXT_INDEX.md              ← 🔍 Master navigation hub
├── QUICK_REFERENCE.md            ← ⚡ Quick lookup (< 2 min read)
├── CONTEXT_SYSTEM_GUIDE.md       ← 📖 This file
│
├── context/                       ← Current state & planning
│   ├── CURRENT_STATE.md          ← 📊 Detailed implementation state
│   ├── NEXT_STEPS.md             ← 🎯 Recommended next tasks
│   └── KNOWN_ISSUES.md           ← 🐛 Bug tracker with workarounds
│
└── phases/                        ← Phase-specific documentation
    ├── PHASE_C.md                ← Player Management (complete)
    ├── PHASE_D.md                ← Scoring Modes (complete)
    ├── PHASE_E.md                ← Profile Statistics (TBD)
    └── PHASE_B_STATISTICS_WIDGETS.md  ← Widgets (complete)
```

### Root-Level Documentation
```
README_CLAUDE.md                  ← Entry point for new sessions
SESSION_SUMMARY.md                ← Complete implementation history
FEATURE_IMPLEMENTATION_PLAN.md    ← Full feature roadmap
```

---

## 🚀 **USAGE WORKFLOWS**

### Workflow 1: Starting Fresh Session
```
1. Open: README_CLAUDE.md
   └─ Get oriented with project

2. Read: .claude/QUICK_REFERENCE.md
   └─ Understand current status (2 min)

3. Check: .claude/context/CURRENT_STATE.md
   └─ Get detailed implementation state (5 min)

4. Plan: .claude/context/NEXT_STEPS.md
   └─ Choose what to work on (3 min)

5. Code: Start implementing!
```

### Workflow 2: Quick Context Check
```
1. Read: .claude/QUICK_REFERENCE.md
   └─ Check "CURRENT STATUS" section

2. Run: git log -5
   └─ See recent commits

3. Code: Continue where you left off
```

### Workflow 3: Switching Devices
```
Device A:
1. Update .claude/context/CURRENT_STATE.md
2. Add issues to KNOWN_ISSUES.md
3. Update NEXT_STEPS.md
4. Commit & push

Device B:
1. Pull latest changes
2. Read QUICK_REFERENCE.md
3. Check CURRENT_STATE.md
4. Continue coding
```

### Workflow 4: Long Break (Days/Weeks)
```
1. Read: README_CLAUDE.md (re-orientation)
2. Read: SESSION_SUMMARY.md (what was built)
3. Read: CURRENT_STATE.md (current state)
4. Read: NEXT_STEPS.md (what's next)
5. Run: yarn typecheck (verify setup)
6. Resume: Start coding with full context
```

---

## 📋 **FILE DESCRIPTIONS**

### README_CLAUDE.md
**Purpose**: Entry point for new sessions
**When to Read**: Starting fresh or after long break
**Length**: 5-10 min read
**Contains**:
- Project overview
- Quick navigation links
- Current status summary
- What's implemented
- Getting started guide

### .claude/CONTEXT_INDEX.md
**Purpose**: Master navigation and decision tree
**When to Read**: When you need to find something specific
**Length**: 10-15 min read
**Contains**:
- Complete documentation map
- Decision tree ("If you want to...")
- Feature status matrix
- Key file references
- Verification checklist

### .claude/QUICK_REFERENCE.md
**Purpose**: Fast lookup for common tasks
**When to Read**: Every session start (< 2 min)
**Length**: 2-3 min read
**Contains**:
- Current status at-a-glance
- Top 3 priorities
- Common commands
- Navigation map
- Code patterns
- Emergency contacts

### .claude/context/CURRENT_STATE.md
**Purpose**: Detailed implementation snapshot
**When to Read**: When you need to understand what was built
**Length**: 15-20 min read
**Contains**:
- Component inventory
- Implementation details for each phase
- Styling patterns
- Data flow diagrams
- State management
- Known limitations
- Testing scenarios

### .claude/context/NEXT_STEPS.md
**Purpose**: Recommended next tasks
**When to Read**: Planning what to work on
**Length**: 10-15 min read
**Contains**:
- Immediate priorities (ranked)
- Short-term tasks
- Technical debt items
- Pre-production checklist
- Feature enhancement ideas
- Decision matrix
- Suggested session plans

### .claude/context/KNOWN_ISSUES.md
**Purpose**: Bug tracker with workarounds
**When to Read**: When encountering issues or before testing
**Length**: 5-10 min read (grows over time)
**Contains**:
- Critical issues (blocking)
- High priority issues
- Medium/low priority issues
- Platform-specific issues
- Workarounds for each
- Testing checklist
- Issue template

### .claude/phases/PHASE_[X].md
**Purpose**: Deep dive into specific feature
**When to Read**: Working on that phase or troubleshooting
**Length**: 20-30 min read each
**Contains**:
- Overview and user stories
- Architecture diagrams
- Detailed implementation
- Code examples
- Testing scenarios
- Success criteria
- Future enhancements

### SESSION_SUMMARY.md
**Purpose**: Complete session history
**When to Read**: Understanding what was accomplished
**Length**: 15-20 min read
**Contains**:
- All phases completed
- Files created/modified
- Lines of code added
- Implementation statistics
- Success metrics
- Challenges and solutions

---

## 🎨 **MAINTENANCE GUIDELINES**

### During Active Development

#### After Each Feature
```markdown
1. Update CURRENT_STATE.md
   - Add component to inventory
   - Document implementation details

2. Update KNOWN_ISSUES.md (if bugs found)
   - Use issue template
   - Mark severity
   - Add workaround

3. Update NEXT_STEPS.md
   - Mark completed task
   - Add new tasks discovered
```

#### Before Ending Session
```markdown
1. Review CURRENT_STATE.md
   - Ensure latest changes documented
   - Update file references

2. Review KNOWN_ISSUES.md
   - Any new bugs to track?
   - Any issues resolved?

3. Update NEXT_STEPS.md
   - What should be done next?
   - Any blockers to note?

4. Commit everything
   - git add .claude/
   - git commit -m "Update context docs"
   - git push
```

### Periodic Maintenance (Weekly)

```markdown
1. Archive completed phases
   - Move to .claude/phases/archive/ if needed

2. Review KNOWN_ISSUES.md
   - Close resolved issues
   - Update priorities

3. Update QUICK_REFERENCE.md
   - Current status
   - Top 3 priorities

4. Clean up NEXT_STEPS.md
   - Remove completed tasks
   - Reprioritize
```

---

## 🔍 **FINDING INFORMATION**

### "How do I..."

#### ...start a new session?
→ Read `QUICK_REFERENCE.md`

#### ...understand what was built?
→ Read `CURRENT_STATE.md`

#### ...know what to work on next?
→ Read `NEXT_STEPS.md`

#### ...find a specific feature's details?
→ Read corresponding `PHASE_[X].md`

#### ...check for known bugs?
→ Read `KNOWN_ISSUES.md`

#### ...see the complete history?
→ Read `SESSION_SUMMARY.md`

#### ...navigate all docs?
→ Read `CONTEXT_INDEX.md`

---

## 📊 **CONTEXT PRESERVATION CHECKLIST**

Before ending a session:

- [ ] CURRENT_STATE.md updated with latest changes
- [ ] KNOWN_ISSUES.md has any new bugs
- [ ] NEXT_STEPS.md reflects current priorities
- [ ] Phase-specific docs updated if applicable
- [ ] Code comments added for complex logic
- [ ] Git commit with descriptive message
- [ ] Changes pushed to remote

---

## 🎯 **SUCCESS METRICS**

The context system is working if:

✅ Can resume work after 1 week with < 10 min ramp-up
✅ Can switch devices without losing context
✅ New team member can onboard from docs alone
✅ No repeated questions about "why was this done?"
✅ Clear trail of decisions and implementations
✅ Easy to find any piece of information
✅ No duplicate documentation

---

## 💡 **BEST PRACTICES**

### Documentation

#### DO ✅
- Write as you code (not after)
- Be specific and detailed
- Include code examples
- Link to related files
- Update when things change
- Use templates consistently

#### DON'T ❌
- Wait until end of session
- Be vague ("fixed some stuff")
- Assume future you remembers
- Let docs get stale
- Duplicate information
- Use abbreviations without explanation

### File Organization

#### DO ✅
- Keep .claude/ directory clean
- Use consistent naming
- Group related docs in subdirectories
- Update index files when adding docs
- Archive old versions

#### DON'T ❌
- Create random .txt files
- Put context in code comments only
- Mix context with code files
- Use ambiguous file names

---

## 🚀 **ADVANCED USAGE**

### Multi-Person Collaboration

If working with others:

1. **Assign ownership** to context files
   - Person A: Maintains CURRENT_STATE.md
   - Person B: Maintains NEXT_STEPS.md

2. **Review changes** in context docs during code review

3. **Sync regularly**
   - Pull before reading context
   - Push after updating context

4. **Avoid conflicts**
   - Don't edit same context file simultaneously
   - Use branches for major doc updates

### Automated Updates

Can add git hooks:

```bash
# .git/hooks/pre-commit
#!/bin/bash
# Remind to update context docs
if git diff --cached --name-only | grep -q "^app/\|^components/"; then
  echo "Remember to update .claude/context/CURRENT_STATE.md"
fi
```

---

## 📝 **TEMPLATES**

### New Phase Documentation Template

```markdown
# Phase X: [Name] - Complete Guide

**Status**: 🚧 In Progress / ✅ Complete
**Date**: YYYY-MM-DD
**Files**: N created, M modified

## 📋 OVERVIEW
[What this phase accomplishes]

## 🎯 USER STORIES
1. As a [user], I want to [action], so [benefit]

## 🏗️ ARCHITECTURE
[Component hierarchy, data flow]

## 📁 FILES CREATED
[List with descriptions]

## 🔧 IMPLEMENTATION
[Detailed code examples]

## 🎨 DESIGN PATTERNS
[Styling, interactions]

## 🧪 TESTING SCENARIOS
[Test cases]

## ✅ SUCCESS CRITERIA
[Completion criteria]

## 🚀 FUTURE ENHANCEMENTS
[Ideas for later]
```

### Issue Template (in KNOWN_ISSUES.md)

```markdown
### [#]. [Short Title]
**Component**: [file path]
**Severity**: 🔴/🟡/🟢/🔵

**Description**: [What's wrong]
**Impact**: [Effect on users]
**Reproduction**: [Steps]
**Expected**: [Correct behavior]
**Actual**: [Current behavior]
**Workaround**: [Temporary fix]
**Proposed Fix**: [Permanent solution]
**ETA**: [Time estimate]
```

---

## 🎉 **SYSTEM BENEFITS**

### For You
- No more "what was I working on?"
- Seamless device switching
- Clear trail of decisions
- Easy to remember implementations

### For Team
- Fast onboarding
- Shared understanding
- Consistent documentation
- Knowledge preservation

### For Project
- Better code quality
- Faster development
- Easier maintenance
- Institutional knowledge

---

**Context System Version**: 1.0
**Created**: 2025-10-29
**Maintained By**: All contributors
**Review Frequency**: Weekly

🎯 **Remember**: Good documentation today = saved time tomorrow!
