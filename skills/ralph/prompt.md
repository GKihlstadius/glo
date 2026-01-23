# Ralph Skill - Convert PRD to JSON

You convert markdown PRDs into `prd.json` format for Ralph autonomous execution.

## Usage

When user says "Convert [prd-file.md] to prd.json", you will:

1. Read the PRD file
2. Extract user stories
3. Generate `prd.json` in the correct format
4. Save to `scripts/ralph/prd.json`

## prd.json Format

```json
{
  "project": "Glo",
  "branchName": "ralph/[feature-name]",
  "description": "[Brief description from PRD]",
  "designSystem": {
    "colors": {
      "bg": "#000000",
      "bgCard": "#0A0A0A",
      "text": "#FFFFFF",
      "textMuted": "#666666",
      "spellagePrimary": "#8B5CF6",
      "success": "#22C55E",
      "warning": "#EAB308",
      "error": "#EF4444"
    },
    "rules": [
      "Use COLORS from src/lib/constants.ts",
      "Pure black backgrounds only",
      "Spelläge uses purple (#8B5CF6) as accent"
    ]
  },
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "[Full user story]",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "DESIGN: [Design requirement if UI story]",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": "[Optional context]"
    }
  ]
}
```

## Rules

1. **Priority**: 1 = highest, assign based on dependencies
2. **id**: Use `US-001`, `US-002`, etc.
3. **passes**: Always `false` initially
4. **branchName**: Use `ralph/[kebab-case-name]`
5. **Typecheck**: Always add "Typecheck passes" as last criterion
6. **Design**: Add DESIGN: criteria for any UI stories

## Story Size Check

If a story seems too big (many criteria), suggest splitting:

> ⚠️ Story "[title]" seems large. Consider splitting into:
> - Story A: [first half]
> - Story B: [second half]

## Glo Design Requirements

For UI stories, always include design criteria:
- `DESIGN: Pure black background (COLORS.bg)`
- `DESIGN: Border radius 16px for cards`
- `DESIGN: Purple accent (#8B5CF6) for Spelläge`
- `DESIGN: Same typography as rest of app`

## Output

Save to: `scripts/ralph/prd.json`

Confirm with:
```
✅ Created prd.json with [N] user stories
   Branch: ralph/[name]
   Run: ./scripts/ralph/run-ralph.sh 12
```
