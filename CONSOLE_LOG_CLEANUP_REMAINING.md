# Console.log Cleanup - Remaining Work

## Progress: 36/133 Complete (27%)

### ✅ Completed Files
1. `hooks/useClubs.ts` - 20 console statements → Logger calls ✓
2. `services/reclubImportService.ts` - 11 console statements → Logger calls ✓
3. `app/(tabs)/profile.tsx` - 5 console.error statements → Logger calls ✓

### 🟡 Remaining Files (97 console statements)

#### High Priority - User-Facing (20 logs)
- `hooks/useAuth.tsx` (6 logs) - Auth flow errors
- `app/(tabs)/create-session.tsx` (7 logs) - Session creation
- `app/(tabs)/session/[id].tsx` (4 logs) - Core gameplay
- `app/(tabs)/create-club.tsx` (5 logs) - Club creation
- `app/(tabs)/edit-profile.tsx` (4 logs) - Profile editing

#### Medium Priority - Service Layer (42 logs)
- `services/deviceService.ts` (9 logs)
- `services/notifications.ts` (8 logs)
- `services/notificationQueue.ts` (7 logs)
- `hooks/useNotifications.ts` (7 logs)
- `utils/offlineQueue.ts` (6 logs)
- `contexts/ThemeContext.tsx` (4 logs)
- `components/session/RoundsTab.tsx` (3 logs)

#### Low Priority - Dev/Debug (35 logs)
- `utils/loki-client.ts` (3 logs) - Already using proper logging internally
- `utils/accountSimulator.ts` (3 logs) - Dev-only tool
- `services/notificationTesting.ts` (3 logs) - Test utility
- `config/react-query.ts` (3 logs) - React Query errors
- `services/tokenManager.ts` (2 logs)
- `services/notificationsEnhanced.ts` (2 logs)
- `hooks/useAnimationPreference.tsx` (2 logs)
- Other files (17 logs)

---

## Bulk Replacement Pattern

### 1. Add Logger Import
```typescript
import { Logger } from '../utils/logger'; // or ../../utils/logger depending on depth
```

### 2. Replace console.error
```typescript
// BEFORE
console.error('Error message:', error);

// AFTER
Logger.error('ComponentName: Error message', error, {
  userId: user?.id, // if available
  action: 'action_name',
  screen: 'ScreenName', // for components
  metadata: { /* relevant context */ },
});
```

### 3. Replace console.log (info level)
```typescript
// BEFORE
console.log('Operation completed:', data);

// AFTER
Logger.info('ComponentName: Operation completed', {
  action: 'action_name',
  metadata: { /* relevant data */ },
});
```

### 4. Replace console.log (debug level)
```typescript
// BEFORE
console.log('[DEBUG] Variable state:', variable);

// AFTER
Logger.debug('ComponentName: Variable state', variable);
```

---

## Quick Replacement Script

For files with simple error logging, use this pattern:

```bash
# Example for useAuth.tsx
sed -i '' 's/console\.error(\(.*\))/Logger.error(\1)/g' hooks/useAuth.tsx
```

**Note**: Manual review required for each replacement to add proper context!

---

## Automated Replacement (Node Script)

Create `scripts/replace-console-logs.js`:

```javascript
const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'hooks/useAuth.tsx',
  'app/(tabs)/create-session.tsx',
  'app/(tabs)/session/[id].tsx',
  // ... add more files
];

filesToProcess.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add Logger import if not present
  if (!content.includes("import { Logger }")) {
    const importDepth = file.split('/').length - 1;
    const importPath = '../'.repeat(importDepth) + 'utils/logger';
    content = content.replace(
      /^(import .* from .*;\n)/m,
      `$1import { Logger } from '${importPath}';\n`
    );
  }

  // Replace console.error (basic pattern - review needed!)
  content = content.replace(
    /console\.error\(['"]([^'"]+)['"],\s*(\w+)\);/g,
    "Logger.error('$1', $2 as Error, { action: 'unknown' });"
  );

  // Replace console.log (basic pattern)
  content = content.replace(
    /console\.log\(['"]([^'"]+)['"],\s*(.+?)\);/g,
    "Logger.info('$1', { metadata: { data: $2 } });"
  );

  fs.writeFileSync(filePath, content);
  console.log(`✓ Processed ${file}`);
});
```

**Run with:**
```bash
node scripts/replace-console-logs.js
```

⚠️ **WARNING**: This is a basic pattern. ALWAYS review changes manually!

---

## Recommended Approach for Beta

### Option A: Complete Now (2-3 hours)
- Manually replace all 97 remaining console statements
- Ensures proper context for all errors
- Best for production monitoring

### Option B: Prioritize & Defer (1 hour)
- Complete high-priority files (20 logs) manually
- Leave service/debug files for post-beta
- Acceptable for beta if beta.courtster.app doesn't log to console

### Option C: Hybrid (Recommended for Beta - 1.5 hours)
- Complete high-priority files (20 logs) manually with proper context
- Batch-replace service files (42 logs) with basic Logger.error wrapping
- Leave dev/debug files (35 logs) for later
- **Result**: 62/133 complete (47%), covers all critical user-facing code

---

## Next Steps After This Document

1. **Complete Password Reset UI** (higher priority for beta)
2. **Create Offline Indicator** (better UX)
3. **Create Asana Tasks** (organize work)
4. **Move to Week 2** (Settings persistence, RevenueCat, testing)

Once in Week 2, we can schedule a "cleanup day" to finish remaining console.logs.

---

## Testing After Replacement

Run these commands to verify:

```bash
# Count remaining console statements
grep -r "console\." --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.expo \
  packages/mobile | grep -v "logger.ts" | grep -v "// " | wc -l

# Find files with most console statements
grep -r "console\." --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  packages/mobile | cut -d: -f1 | sort | uniq -c | sort -rn | head -10

# Verify Logger import in processed files
grep -l "import { Logger }" hooks/*.tsx app/**/*.tsx
```

---

## Monitoring Verification

After deploying with Logger:

1. **Sentry**: Check dashboard for errors appearing with proper context
2. **Grafana Loki**: Query `{app="courtster-mobile"} | json` to see logs
3. **Console**: In development, should still see debug logs via Logger.debug()

---

**Status**: Ready to proceed with Option C (Hybrid approach) or move to password reset UI.
