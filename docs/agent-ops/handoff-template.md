# Claude Handoff Template

Read CLAUDE.md, README.md, package.json, and relevant docs first.

Task:
[Describe the exact change.]

Constraints:
- Keep the diff small.
- Do not change unrelated files.
- Do not move game logic into React.
- Do not change scoring, action resolution, board semantics, or scenario expectations unless explicitly required.
- Do not add dependencies unless necessary and justified.

Validation:
- npm run agent:preflight
- npm run release:ready

Output:
- Summary
- Files changed
- Validation results
- Risks
- Next recommended patch

Do not push.
