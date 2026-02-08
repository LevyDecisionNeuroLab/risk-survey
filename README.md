# Risk Survey Experiment

A web-based risk survey experiment for behavioral research.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   - Create `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

3. **Run the experiment:**
   ```bash
   node server.js
   ```
   - Open http://localhost:3000 in your browser

## Indifference Point (IP) Study

A two-phase study: (1) calibrate each participant's **indifference point** for 18 lotteries; (2) test whether visual size shifts that point.

- **Run IP study:** Open `http://localhost:3000?study=ip` in your browser.
- **Phase 1:** 126 trials (18 lotteries × 7 safe levels), no size manipulation. At the end, 18 indifference points are computed and shown (with optional CSV download). Option to **Continue to Phase 2**.
- **Phase 2:** 84 trials total: 72 core (18 lotteries × 4 size conditions) with safe = participant's Phase 1 IP, plus 12 dummy trials (dominant risky choices, interleaved for engagement). Trial order randomized. Data (Phase 1 + Phase 2) saved together; dummy trials have `trial_id` prefix `dummy_` for analysis.
- **Files:** `public/config_ip_study.json`, `public/ip_phase1_trials.csv`, `public/ip_phase2_template.csv`, `public/ip_phase2_dummy_trials.csv`.

## Trial Generation

Generate new trial configurations:
```bash
python generate_trials.py
```

## Data Structure

The experiment saves 15 fields per trial:
- `participant_id`, `trial_number`, `bar_size_condition`
- `choice` (risk/safe/timeout), `confidence` (0-100 or NaN)
- `risk_probability`, `risk_reward`, `safe_probability`, `safe_reward`
- `risk_position`, `safe_position`, `ev` (same/safe/risky)
- `bar_choice_time`, `confidence_choice_time`, `trial_id`

## Files

- `server.js` - Express server with MongoDB integration
- `public/js/experiment.js` - Main experiment logic
- `public/css/styles.css` - Styling
- `public/config.json` - Experiment configuration
- `public/full_trials.csv` - Trial data
- `generate_trials.py` - Trial generation script 