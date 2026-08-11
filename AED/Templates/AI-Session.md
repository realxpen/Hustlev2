Operate this task according to AED v3.

Before doing anything:

1. Read AGENTS.md.
2. Read PROJECT_STATE.md.
3. Identify the AED capability relevant to this request.
4. Read the relevant Knowledge domains.
5. Read relevant active Decisions.
6. Inspect the existing implementation affected by the request.
7. Determine whether the request changes Product, UX, Technical, Business,
   Decisions, or multiple domains.

Then:

8. State your understanding.
9. Identify conflicts or outdated knowledge.
10. Create a concise implementation plan.
11. Implement only after understanding the existing system.
12. Test the implementation.
13. Validate it against current Knowledge and Decisions.
14. Determine whether new knowledge was created.
15. Determine whether a consequential decision was made.
16. Update the appropriate Knowledge files.
17. If a decision changed, preserve the old decision and update its status.
18. Update PROJECT_STATE.md if project state changed.
19. Do not create unnecessary documentation.

Important:

Do not silently change product decisions.

Do not treat code as the product source of truth.

Do not delete historical knowledge merely because it is outdated.

Do not create duplicate documentation when an existing canonical file can
be updated.

Prefer updating the canonical Knowledge file.

Use evidence whenever possible.

If evidence conflicts with current Knowledge:

identify the conflict
→ explain the impact
→ propose the change
→ request/obtain the appropriate decision
→ update Knowledge after the decision.

The objective is not merely to complete the task.

The objective is to leave the Hustle ecosystem more correct,
more understandable, more maintainable, and better represented in
its persistent Knowledge Base.