# Fix Types

Fix TypeScript errors in current file or entire project.

## Usage
```
/fix-types
/fix-types components/session/RoundsTab.tsx
```

## Instructions

Fix all TypeScript errors in the specified file or entire project.

### Process:

1. **Run Type Check**
   ```bash
   yarn typecheck
   ```

2. **Analyze Errors**
   - Read all TypeScript errors carefully
   - Group errors by category:
     - Missing type annotations
     - Incorrect prop types
     - Any types that need fixing
     - Missing imports
     - Incompatible types
     - Null/undefined issues

3. **Fix Strategy**
   - **Priority 1**: Fix critical errors (blocks compilation)
   - **Priority 2**: Fix any types (reduces type safety)
   - **Priority 3**: Fix implicit any warnings
   - **Priority 4**: Improve type strictness

4. **Common Fixes**

   **Missing Types:**
   ```typescript
   // Before
   const handleClick = (data) => { ... }

   // After
   const handleClick = (data: FormData) => { ... }
   ```

   **Any Types:**
   ```typescript
   // Before
   const user: any = getUser();

   // After
   const user: User = getUser();
   ```

   **Null/Undefined:**
   ```typescript
   // Before
   const name = user.name;

   // After
   const name = user?.name ?? 'Unknown';
   ```

   **Missing Props:**
   ```typescript
   // Before
   interface Props {
     name: string;
   }

   // After
   interface Props {
     name: string;
     onPress?: () => void;
     disabled?: boolean;
   }
   ```

   **Import Types:**
   ```typescript
   // Add missing type imports
   import type { Player, Round, Match } from '@courtster/shared';
   ```

5. **Validation**
   - After each fix, run `yarn typecheck` again
   - Ensure no new errors introduced
   - Verify all imports resolve correctly

6. **Best Practices**
   - Never use `as any` unless absolutely necessary
   - Prefer explicit types over inferred types for public APIs
   - Use TypeScript utility types (Partial, Pick, Omit, etc.)
   - Import types separately: `import type { ... }`
   - Use strict null checks

7. **Report**
   After fixing, provide:
   - Number of errors fixed
   - Summary of changes made
   - Any remaining errors with explanation
   - Suggestions for improving type safety

### Template Output:

```
✅ Fixed TypeScript Errors

**Before:** 23 errors
**After:** 0 errors

**Changes Made:**
1. Added type annotations to 5 functions
2. Fixed 8 prop type mismatches
3. Removed 10 'any' types
4. Added null checks to 3 properties

**Remaining Issues:** None

**Suggestions:**
- Consider adding stricter types to API response handlers
- Add validation schemas for form inputs
```

### Deliverable:
All TypeScript errors fixed with `yarn typecheck` passing successfully.
