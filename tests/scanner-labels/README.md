# labels/

Sample supplement-label JSON fixtures — the exact shape the Scanner's parser and
verdict engine consume after OCR. Used for manual Scanner testing and for
iterating on the scoring logic by hand. (The headless probes under
`tools/render_probe_*.js` feed their own inline labels.)

Each file is one product: `name`, `brand`, `category`, `serving_size`,
`container_format`, `ingredients_text`, and a `nutrients` map
(`{ amount, unit, form, form_alignment }` per nutrient), plus an optional
`framework_adjacent` map for items outside the Wallach corpus.

Current fixtures:

- **`hydra-dna-collagen.json`** — a collagen sparkling beverage (marine trace
  minerals + fulvic acid; framework-adjacent, not the PDM lineage).
- **`test-mg-glycinate.json`** — Doctor's Best magnesium glycinate, a clean
  single-mineral, well-aligned case.
- **`test-energy-bad.json`** — a deliberately poor energy drink (HFCS + sucralose
  + caffeine) for exercising the anti-list / REJECT verdict path.

Numbers here are illustrative test data, not Eden canon — they never feed the
sealed corpus.
