# Current — an energy forecast observatory

A responsive, dependency-free interactive website about the mathematics of ensemble electricity price forecasting. Built around Gonzales, Iftikhar & López-Gonzales (2024), *AIMS Mathematics*, DOI [10.3934/math.20241067](https://doi.org/10.3934/math.20241067).

## Run

For a portable copy, download `current.html` and open it directly in a normal browser. It includes all JavaScript and styles, requires no server, and works offline. If a chat preview reports an SVG error, open this HTML file in your browser. Regenerate it after source changes using `npm run build`.

From this directory, run `npm run dev` (Python 3 must be available). Open the server on port 5173 in your browser. No dependency installation or API keys are required. Any static web host can serve the repository root; there is no build step.

## GitHub Pages

This repository is prepared for GitHub Pages using the `main` branch and `/ (root)` folder. In the repository's **Settings → Pages**, select **Deploy from a branch**, then `main` and `/ (root)`, and save. Once deployment completes, the site address is `https://byjing2004.github.io/jingr/`. The `.nojekyll` file lets Pages serve the static files directly. All asset URLs are relative so the site works under `/jingr/`.

## Explore

- **Observatory:** six orbiting model illustrations, normalized weight sliders, equal and ESM-favored presets, model explanations, and a live one-step forecast chart. Pause motion to keep the scene still. Reduced-motion preferences are respected.
- **The mathematics:** toggle synthetic signal components, inspect the weighted residual calculation, and learn how reconstruction, MAPE, and validation work.
- **Research findings:** compare the nine published models using MAPE, MAE, or RMSE. These figures come from Table 2, independently of demo settings.
- **Presentation mode:** six short speaking prompts. Use arrow keys to navigate and Escape to close. Close the guide to interact with the selected view, then reopen to restart the guide.

## Evidence and limitations

The source PDF includes no raw monthly price table or fitted coefficients. The interactive paths are deterministic synthetic examples; they do not implement or fit AR, ARIMA, ESM, NNA, NAR, or Theta models. Preset weights are educational examples, not the paper’s fitted weights. Known synthetic trend and seasonality are used in the one-step demonstration; the demo MAPE is not a real-market benchmark. All interactive prices are indices without currency units.

The site transcribes Table 2 and explains inconsistencies in the paper: split counts versus calendar dates; different Ensemble O RMSE values in Tables 2 and 4; and statistical-superiority claims that require care. We use the standard absolute-error MAPE definition, correcting the missing absolute-value bars in the printed equation. The paper studies electricity prices, not renewable generation or storage optimization; renewable use cases are extensions.

The paper’s reported MAPE values are interpreted as fractions and displayed as percentages. Table 2 gives Ensemble O the best MAPE (2.5278%), but Ensemble I the best RMSE (0.255640). Equal-weight averaging does not beat ESM on MAPE. Do not claim ensembles always improve forecasts.

Research material is adapted with attribution under the paper’s CC BY 4.0 license. Its original authors did not create or endorse this visualization.

## Validate

Run `npm test` for five tests covering normalization and zero-weight fallback, reconstruction, ensemble bounds, demo error metrics, and transcription of published comparisons. UI validation also covered desktop/mobile layout, presets, model selection, decomposition, metric switching, keyboard presentation controls, and motion pause in Chromium.
