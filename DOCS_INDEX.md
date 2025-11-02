# Documentation Index - Courtster Mobile

Quick reference guide to all documentation in the mobile package.

Last updated: 2025-10-31

---

## 📚 Core Documentation

### 🚀 Getting Started

| Document | Purpose | Audience |
|----------|---------|----------|
| [**CLAUDE.md**](./CLAUDE.md) | Developer guide for working with the mobile app | All developers, AI assistants |
| [README.md](./README.md) | Basic setup and project overview | New developers |
| [package.json](./package.json) | Dependencies and scripts | All developers |

### 🔧 Development

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [**UNIMPLEMENTED.md**](./UNIMPLEMENTED.md) | Features not yet built, TODOs, placeholders | Planning work, finding tasks |
| [**TESTING_STRATEGY.md**](./TESTING_STRATEGY.md) | Comprehensive testing guide and roadmap | Writing tests, setting up testing |
| [**__tests__/README.md**](./__tests__/README.md) | Quick testing guide and patterns | Writing your first test |

---

## 📖 Document Summaries

### CLAUDE.md
**→ Primary developer reference**

Topics covered:
- Tech stack overview (React Native, Expo, Supabase)
- Project structure
- Key concepts (routing, NativeWind, React Query)
- Common patterns (forms, navigation, data fetching)
- Best practices and pitfalls
- Known limitations

**Read this first** if you're new to the project.

---

### UNIMPLEMENTED.md
**→ What's missing and needs work**

14 major sections:
1. Settings & Preferences (no persistence)
2. Authentication & Profile
3. Session Management
4. Club Management
5. Offline Support
6. Demo & Preview Files
7. Error Handling & Logging
8. Feature Flags
9. Testing & Quality (~2% coverage)
10. Performance & Optimization
11. Security & Privacy
12. Push Notifications
13. Localization & Accessibility
14. Analytics & Monitoring

**Use this** to find tasks, understand limitations, plan features.

---

### TESTING_STRATEGY.md
**→ Complete testing roadmap**

Topics covered:
- Current state (4 test files, ~2% coverage)
- Testing pyramid (unit, integration, E2E)
- Tool recommendations (Jest, Maestro, MSW)
- Test templates and examples
- 8-week implementation roadmap
- CI/CD integration
- Best practices

**Use this** when setting up tests, improving coverage, or implementing E2E.

---

### __tests__/README.md
**→ Quick testing guide**

Topics covered:
- How to write your first test
- Common testing patterns
- Test factories and mocking
- Troubleshooting
- Coverage goals

**Use this** for quick reference when writing tests.

---

## 🗂️ Document Categories

### For New Developers
1. Start with [CLAUDE.md](./CLAUDE.md) - Project overview
2. Read [README.md](./README.md) - Setup instructions
3. Check [UNIMPLEMENTED.md](./UNIMPLEMENTED.md) - Current state

### For Feature Development
1. [CLAUDE.md](./CLAUDE.md) - Development patterns
2. [UNIMPLEMENTED.md](./UNIMPLEMENTED.md) - Check if feature exists
3. [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Write tests

### For Testing
1. [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Overall strategy
2. [__tests__/README.md](./__tests__/README.md) - Quick patterns
3. [CLAUDE.md](./CLAUDE.md) - Testing section

### For Planning
1. [UNIMPLEMENTED.md](./UNIMPLEMENTED.md) - Gap analysis
2. [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing roadmap
3. [CLAUDE.md](./CLAUDE.md) - Known limitations

---

## 🎯 Quick Navigation

### I want to...

**...understand the project structure**
→ [CLAUDE.md > Project Structure](./CLAUDE.md#project-structure)

**...write my first test**
→ [__tests__/README.md > Writing Your First Test](./__tests__/README.md#writing-your-first-test)

**...find unimplemented features**
→ [UNIMPLEMENTED.md > Priority Recommendations](./UNIMPLEMENTED.md#priority-recommendations)

**...set up E2E testing**
→ [TESTING_STRATEGY.md > E2E Testing](./TESTING_STRATEGY.md#e2e-testing)

**...use the shared package**
→ [CLAUDE.md > Shared Package Usage](./CLAUDE.md#2-shared-package-usage)

**...understand NativeWind**
→ [CLAUDE.md > NativeWind](./CLAUDE.md#3-nativewind-tailwind-css)

**...debug offline issues**
→ [UNIMPLEMENTED.md > Offline Support](./UNIMPLEMENTED.md#5-offline-support)

**...understand auth flow**
→ [CLAUDE.md > Authentication Flow](./CLAUDE.md#4-authentication-flow)

**...see demo screens**
→ [UNIMPLEMENTED.md > Demo Files](./UNIMPLEMENTED.md#6-demo--preview-files)

**...check coverage goals**
→ [TESTING_STRATEGY.md > Code Coverage Goals](./TESTING_STRATEGY.md#code-coverage-goals)

---

## 📊 Project Status Overview

### Implementation Status

| Category | Status | Coverage |
|----------|--------|----------|
| **Core Features** | ✅ Implemented | ~85% |
| **Settings Persistence** | ❌ Not Implemented | 0% |
| **Push Notifications** | ❌ Not Implemented | 0% |
| **Unit Tests** | ⚠️ Started | ~2% |
| **Integration Tests** | ❌ None | 0% |
| **E2E Tests** | ❌ None | 0% |
| **Documentation** | ✅ Complete | 100% |

### Priority Tasks

1. **High Priority:**
   - Remove console.log statements from production
   - Implement settings persistence
   - Add error tracking service
   - Increase test coverage to 30%

2. **Medium Priority:**
   - Set up E2E testing with Maestro
   - Add push notifications
   - Implement public results page
   - Clean up demo files

3. **Low Priority:**
   - Add subscription features
   - Implement analytics
   - Add localization
   - Performance optimizations

---

## 🔄 Keeping Documentation Updated

### When to Update Docs

| Event | Update These Docs |
|-------|-------------------|
| New feature added | CLAUDE.md (if pattern), UNIMPLEMENTED.md (remove TODO) |
| Feature deprecated | UNIMPLEMENTED.md (add deprecation note) |
| Test coverage improves | TESTING_STRATEGY.md (update metrics) |
| New testing pattern | __tests__/README.md |
| Architecture change | CLAUDE.md |
| New unimplemented feature found | UNIMPLEMENTED.md |

### Documentation Maintenance

- **Weekly:** Update UNIMPLEMENTED.md as tasks are completed
- **Monthly:** Review TESTING_STRATEGY.md metrics
- **Quarterly:** Review and update CLAUDE.md for accuracy
- **On Release:** Update all "Last updated" dates

---

## 🤝 Contributing to Docs

### Documentation Style Guide

1. **Use clear headings** - Make it scannable
2. **Include code examples** - Show, don't just tell
3. **Add cross-references** - Link to related sections
4. **Keep it up to date** - Remove outdated info
5. **Use emoji sparingly** - Only for visual navigation

### Suggesting Improvements

Found an issue or want to improve docs?

1. Check if the issue is already documented
2. Update the relevant document(s)
3. Update the "Last updated" date
4. Commit with clear message: `docs: update testing strategy with new patterns`

---

## 📞 Getting Help

**Can't find what you need?**

1. Search all docs using your editor's global search
2. Check the [Quick Navigation](#quick-navigation) section above
3. Review the appropriate doc from [Document Categories](#document-categories)
4. Ask in team chat with reference to this index

**Found a gap in documentation?**

1. Add it to [UNIMPLEMENTED.md](./UNIMPLEMENTED.md) if it's missing functionality
2. Add it to relevant doc if it's missing context
3. Create a new doc if it's a new topic area

---

## 📅 Documentation Changelog

### 2025-10-31
- ✅ Created comprehensive documentation suite
- ✅ Added UNIMPLEMENTED.md with 14 major sections
- ✅ Added TESTING_STRATEGY.md with 8-week roadmap
- ✅ Updated CLAUDE.md with current state
- ✅ Created __tests__/README.md for quick reference
- ✅ Created this DOCS_INDEX.md

### Future Updates
- [ ] Add API documentation
- [ ] Add component library documentation
- [ ] Add release process documentation
- [ ] Add deployment guide

---

**Happy coding! 🚀**
