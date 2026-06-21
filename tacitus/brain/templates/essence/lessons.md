# Lessons

Wisdom accumulated across sessions. Add only when a genuine, generalizable failure pattern is learned. Not for general principles (those live in `engineering-doctrine.md`).

Each lesson entry uses the format:

```
**(YYYY-MM-DD at H:MM AM/PM)** **Short title — sharp one-line statement of the lesson.** Concrete description of what happened: what action, what failure mode, what data observed. **Generalizable:** The rule, action-language, mechanically applicable by a fresh Claude reading the lesson cold. **Family:** "<failure family name>" — sibling to other named families when applicable. **Paired invariant:** `check_<name>` (file:line) — OR "none — discipline-only at the agent layer; the check that catches it is <X>".
```

Per the Tacitus brain v1.0 §13 anti-pitfalls, the existing failure families (inherited from parent project):

- **Edit-tool silent truncation** (banned for project files; use safe_write)
- **Agreement is not truth** (require external truth anchor)
- **Sentinel-without-content** (paired content cross-check)
- **Cross-boundary silent fallback** (explicit module-boundary exposure)
- **Discipline-without-paired-detector erodes** (every new rule needs a paired invariant)
- **Conflating structural ship with bug fix** (build > test > build > test cadence)
- **Hardcoded-defaults-derived-from-user-data** (substrate principle)
- **Side-effect-bound-to-write-primitive** (chokepoint discipline)

When you observe a new lesson, check whether it's a new instance of an existing family OR a genuinely new shape. Naming the family explicitly is part of the lesson.

---

_Lessons appended below. Newest at bottom._
