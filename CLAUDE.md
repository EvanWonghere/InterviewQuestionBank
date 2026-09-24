# CLAUDE.md

@AGENTS.md

## Claude-specific notes

### Artifacts

Repository overview page (private Artifact): https://claude.ai/artifact/EEFiogW17CTypMuiRp95bZ. When commands, architecture, deployment or the ConceptLab contract in `AGENTS.md` change, republish it to the same URL so the two stay in sync.

Publish these as private Artifacts instead of leaving them only in the terminal:

- Task and acceptance reports, including which checks ran, which were skipped and why.
- Design proposals, migration plans and review summaries that the owner needs to decide on.
- AI routing or evaluation reports.

Repository `docs/` stays the durable record of evidence and decisions. An Artifact summarizes it for reading; it does not replace a required update to `docs/`. Never put secrets, service-role or model keys, Supabase project refs, personal learning records or unpublished answers into an Artifact.
