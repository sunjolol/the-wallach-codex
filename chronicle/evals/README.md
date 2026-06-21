# Brain Evaluations

Real test questions that the brain has answered, with comparisons across versions. The point: measure whether brain edits actually make the agent better, not just feel like they do.

## Format

Each file is one question and the answers it produced under different brain versions.

```
# Topic — short slug

## The question
(what the user asked, verbatim)

## The "best known correct answer"
(written by hand or arrived at after deep corpus exploration. The benchmark.)

## v1.0 answer
[paste the actual answer the agent gave under v1.0]
**Verdict:** correct / partially correct / wrong, with explanation

## v2.0 answer
[paste the actual answer]
**Verdict:** correct / partially correct / wrong, with explanation

## Winner
v?.? — why
```

## How to run a comparison

In a session, ask the agent the same question twice, each time with a different brain loaded as the system prompt:

1. Load `versions/vN.N-...md` as the active prompt for that test
2. Ask the question fresh (don't reuse context from a prior answer)
3. Save the answer into the eval file under the right heading
4. Repeat for each brain you want to compare

Then write the verdict and pick a winner.

## Why this matters

Without evals, every brain edit is just vibes. With evals, we have evidence that v2 actually outperforms v1 on the things that previously broke. When we add v3, we can verify it didn't regress on v2's wins.
