# Open Questions to Resolve Before Implementation

## Resolved decisions (confirmed)
1. Launch language: **English-only for v1**.
2. Collaboration: **single-user only for MVP** (family editor later).
3. Narrative default: **third-person biography**.
4. Voice stack for v1: **browser-native speech APIs first**.
5. Hosting/data stack: **Vercel + Supabase**.
6. Budget target: **~$25/month AI spend**.

## Remaining decisions
1. Output limits: what max pages/word-count should each detail level allow?
2. Export format priority: PDF first, DOCX first, or both simultaneously?
3. Session design: strict 10–15 minute guided chunks, or user-paced free flow?
4. Section approvals: require approval per section before full-draft generation, or optional?
5. Compliance scope: any near-term data residency/compliance constraints?

## Recommendation for immediate next meeting
- Lock answers to remaining questions 1, 2, and 4 first (direct impact on scope).
- Freeze a 6-week MVP scope with those constraints.
- Start implementation in this order: auth -> interview notes -> generation -> export.
