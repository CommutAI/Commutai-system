# Token Efficiency Guide for CommutAI Unification

## Principles

1. **Batch parallel operations** - Always run independent reads/commands together
2. **Minimize redundant reads** - Cache file contents in memory
3. **Use targeted searches** - Specific patterns over broad searches
4. **Edit directly** - Don't output code blocks, use edit tools
5. **Communicate concisely** - Brief updates, no fluff

---

## Step-by-Step Coding Procedure

### Phase 1: Planning (Before Coding)

**1. Define the specific task**
```
❌ "Improve the conductor app"
✅ "Add responsive sidebar to conductor-app/src/components/Layout.tsx"
```

**2. Identify all files needed**
- List exact file paths
- Note dependencies
- Check if files exist

**3. Plan parallel operations**
- Group independent reads
- Group independent searches
- Identify sequential dependencies

---

### Phase 2: Information Gathering (Maximize Parallelism)

**Single batch for all reads:**
```bash
# DO THIS (one batch)
read_file: conductor-app/src/components/Layout.tsx
read_file: conductor-app/src/App.tsx
read_file: conductor-app/package.json
grep_search: "sidebar" in conductor-app/src

# NOT THIS (sequential)
read_file: Layout.tsx
# wait...
read_file: App.tsx
# wait...
grep_search: "sidebar"
```

**Targeted searches only:**
```bash
# DO THIS
grep_search: "useState" in conductor-app/src/components/Layout.tsx
grep_search: "useEffect" in conductor-app/src/components/Layout.tsx

# NOT THIS
grep_search: "useState" in conductor-app/src (too broad)
```

---

### Phase 3: Implementation (Edit Directly)

**Use edit/multi_edit tools:**
```bash
# DO THIS
edit file: Layout.tsx
old_string: "old code"
new_string: "new code"

# NOT THIS
"Here's the updated code:
```tsx
const newCode = ...
```
"
```

**Batch multiple edits to same file:**
```bash
# DO THIS
multi_edit file: Layout.tsx
edits: [
  {old_string: "A", new_string: "B"},
  {old_string: "C", new_string: "D"},
  {old_string: "E", new_string: "F"}
]

# NOT THIS
edit file: Layout.tsx (A->B)
# wait...
edit file: Layout.tsx (C->D)
# wait...
edit file: Layout.tsx (E->F)
```

---

### Phase 4: Verification (Minimal Output)

**Run tests in background:**
```bash
# DO THIS
bash: npm test (Background: true)

# NOT THIS
bash: npm test (wait for full output)
```

**Check status efficiently:**
```bash
# DO THIS
command_status: check only last 1000 chars

# NOT THIS
command_status: check full output
```

---

## Specific Patterns

### Pattern 1: Adding a New Feature

**Step 1:** Read all relevant files (parallel)
```
read_file: component.tsx
read_file: types.ts
read_file: package.json
```

**Step 2:** Check dependencies (parallel)
```
grep_search: "import" in component.tsx
grep_search: "export" in types.ts
```

**Step 3:** Implement (multi_edit if possible)
```
edit: add imports at top
edit: add component logic
edit: add styling
```

**Step 4:** Test (background)
```
bash: npm run build (Background: true)
```

---

### Pattern 2: Refactoring

**Step 1:** Find all usages (parallel)
```
grep_search: "functionName" in src/
grep_search: "variableName" in src/
```

**Step 2:** Read affected files (parallel)
```
read_file: file1.tsx
read_file: file2.tsx
read_file: file3.tsx
```

**Step 3:** Batch edits (multi_edit per file)
```
multi_edit: file1.tsx (all changes)
multi_edit: file2.tsx (all changes)
multi_edit: file3.tsx (all changes)
```

---

### Pattern 3: Debugging

**Step 1:** Targeted search (specific error)
```
grep_search: "error message" in src/
```

**Step 2:** Read only affected file
```
read_file: specific-file.tsx
```

**Step 3:** Minimal fix
```
edit: single line change
```

**Step 4:** Quick test
```
bash: npm run dev (Background: true)
```

---

## Communication Guidelines

### DO
- "Updated Layout.tsx with responsive sidebar"
- "Added shared Supabase client package"
- "Fixed type error in types.ts"

### DON'T
- "I've gone ahead and updated the Layout.tsx file with a new responsive sidebar component that includes..."
- "After analyzing the codebase, I decided to create a shared Supabase client package which will..."

---

## Tool Usage Optimization

### Read Operations
- **Batch**: All independent reads together
- **Limit**: Read only needed sections (offset/limit)
- **Cache**: Remember file contents, don't re-read

### Search Operations
- **Specific**: Use exact patterns, not broad searches
- **Parallel**: Multiple searches together
- **Filter**: Use Includes/Excludes to narrow scope

### Edit Operations
- **Direct**: Use edit tools, never output code
- **Batch**: multi_edit for multiple changes to same file
- **Minimal**: Smallest change that solves the problem

### Command Operations
- **Background**: Long-running commands in background
- **Specific**: Exact commands, no cd in command
- **Check**: Minimal output when checking status

---

## Session Structure

### Start of Session
1. Review TODO list
2. Identify next task
3. Plan parallel operations
4. Execute information gathering (batched)

### During Session
1. Implement changes (direct edits)
2. Run tests (background)
3. Update TODO
4. Brief status update

### End of Session
1. Verify all changes
2. Update TODO
3. Summarize completion
4. Note next steps

---

## Example Session: Adding Shared Component

**Task**: Create responsive Button component in packages/ui

**Step 1**: Read existing files (parallel)
```
read_file: packages/ui/src/Button.tsx
read_file: packages/ui/package.json
read_file: packages/ui/tailwind.config.js
```

**Step 2**: Check patterns (parallel)
```
grep_search: "className" in packages/ui/src/
grep_search: "variant" in packages/ui/src/
```

**Step 3**: Implement (multi_edit)
```
multi_edit: Button.tsx
  - Add responsive props
  - Add mobile styles
  - Add touch targets
```

**Step 4**: Test (background)
```
bash: npm run build (Background: true)
```

**Step 5**: Update
```
TODO: mark completed
Status: "Added responsive Button with mobile touch targets"
```

---

## Token Budget per Task

| Task Type | Token Budget |
|-----------|--------------|
| Simple edit | 500 tokens |
| Component addition | 1000 tokens |
| Feature implementation | 2000 tokens |
| Refactoring | 1500 tokens |
| Debugging | 800 tokens |

**If approaching budget:**
- Focus on core functionality
- Skip nice-to-haves
- Document for later
- Move to next task

---

## Quick Reference

### Maximize Parallelism
```bash
# Good
read_file: A, B, C, D, E (all at once)

# Bad
read_file: A, then B, then C, then D, then E
```

### Minimize Reads
```bash
# Good
read_file once, remember contents

# Bad
read_file same file multiple times
```

### Edit Directly
```bash
# Good
edit: file.tsx (old -> new)

# Bad
"Here's the code: ```tsx ... ```"
```

### Batch Edits
```bash
# Good
multi_edit: 5 changes to same file

# Bad
5 separate edit calls to same file
```

### Background Commands
```bash
# Good
bash: npm run build (Background: true)

# Bad
bash: npm run build (wait for completion)
```

---

## Success Metrics

- **Parallel operation rate**: >80% of operations batched
- **Re-read rate**: <5% of files read more than once
- **Direct edit rate**: 100% of changes via edit tools
- **Communication efficiency**: <50 tokens per status update
