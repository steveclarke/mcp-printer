# Code Review Prompt (For General Use)

This prompt was developed for the MCP Printer project but is too sophisticated for a printer-specific tool. It's a general-purpose code review prompt that works great in any AI assistant.

## Usage

**Arguments:**
- `context`: What changed? ("staged", "branch", "PR #13", or description)
- `files`: Optional comma-separated list of specific files to focus on
- `auto_print`: Optional "true" or "false" - whether to auto-print (default: false)

**Examples:**
- Review staged changes: `context="staged"`
- Review current branch: `context="branch"`
- Review a PR: `context="PR #13"`
- Custom context: `context="Added authentication system"`

## The Prompt

```
Print a code review package for offline review.

CONTEXT: [INSERT CONTEXT HERE]
FOCUS ON: [OPTIONAL: specific files]

INSTRUCTIONS:

1. **Determine what changed:**
   - If context is "staged": use git diff --cached
   - If context is "branch" or branch name: use git diff main...HEAD
   - If PR #X: analyze that PR's changes
   - Otherwise: use the description to find relevant files

2. **Print NEW files separately (avoid grey backgrounds):**
   - For EACH new file, use print_file tool individually
   - Example: print_file("src/adapters/printers-lib.ts")
   - These will get proper code highlighting without markdown backgrounds
   - DO NOT include full new file contents in the review doc

3. **Create ONE markdown review document with:**

   ## Header
   - Title describing the changes
   - Context and date
   
   ## New Files Section
   - List files that were printed separately
   - Note: "See separate printouts for full content"
   - Include file paths and line counts
   
   ## Modified Files Section
   For each modified file, show ONLY changed sections:
   - Function/method name with line numbers
   - Mark changes: "⚠️ CHANGE:", "← NEW:", "← REMOVED:"
   - 3-5 lines context before/after
   - Explanation of WHY it changed
   - Keep it focused - no full files!
   
   ## Summary
   - Count of new/modified files
   - Key changes overview
   - Performance/breaking changes if any
   - Testing notes

4. **Handle the review document:**
   - Save markdown to ./tmp/code-review-[timestamp].md
   - [IF auto_print=true: use print_file on the review doc]
   - [IF auto_print=false: show the file path (DO NOT print automatically)]
   - User can review saved file and print manually if needed

IMPORTANT:
- New files = separate printouts (no grey backgrounds)
- Modified files = excerpts only in review doc
- Keep review doc focused and printer-friendly
- Reference new files from review doc
- Explain WHY changes were made

Execute this now for: [CONTEXT]
```

## Why This Works

**Multi-Document Strategy:**
- New files print separately with proper syntax highlighting
- No grey markdown backgrounds (saves toner)
- Review doc only has excerpts of changes
- Much more readable for offline review

**Key Benefits:**
- Saves toner (no grey backgrounds on large code blocks)
- Better readability (full files separate from review notes)
- Focused review (only what changed, not everything)
- Flexible context (staged, branch, PR, custom)
- Explains WHY, not just WHAT

## Adaptation for Non-Printing Use

If you don't have a `print_file` tool, modify step 2 and 4:

**Step 2:** Skip printing new files, just note them in the review doc
**Step 4:** Just save the markdown file, skip printing

Or include full new files in the review doc if printing isn't the goal.

