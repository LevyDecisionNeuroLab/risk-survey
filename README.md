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