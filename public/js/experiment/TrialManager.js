/**
 * TrialManager.js - Trial Generation and Management
 * Handles loading trials from CSV, generating trial sequences, and managing trial flow
 */

// Add trial management methods to the RiskSurveyExperiment class
Object.assign(RiskSurveyExperiment.prototype, {
    
    async generateTrials() {
        try {
            if (this.studyType === 'ip') {
                // Indifference Point Phase 1: 126 trials, no size manipulation, no attention checks
                const trialsData = await this.loadTrialsFromCSV('ip_phase1_trials.csv');
                console.log(`[IP Study] Loaded ${trialsData.length} trials from CSV`);

                const shuffledTrials = this.shuffle([...trialsData]);
                const mainTrialCount = Math.min(this.experimentConfig.mainTrials, shuffledTrials.length);
                const selectedMainTrials = shuffledTrials.slice(0, mainTrialCount);

                this.practiceTrials = []; // No practice in IP Phase 1
                this.trials = selectedMainTrials.map((trial, i) => ({
                    trial_number: i + 1,
                    risk_probability: trial.risk_probability,
                    risk_reward: trial.risk_reward,
                    safe_reward: trial.safe_reward,
                    size_condition: trial.size_condition,
                    risk_on_left: Math.random() < 0.5,
                    is_practice: false,
                    combination_id: trial.combination_id,
                    expected_value: trial.expected_value,
                    trial_id: trial.trial_id
                }));
                this.finalTimeline = [...this.trials];
                this.attentionChecks = [];
                console.log(`[IP Study] Generated ${this.trials.length} Phase 1 trials (no practice, no attention checks)`);
                return;
            }

            // Original risk-survey study
            const trialsData = await this.loadTrialsFromCSV('full_trials.csv');
            console.log(`Loaded ${trialsData.length} trials from CSV`);
            
            const shuffledTrials = this.shuffle([...trialsData]);
            const mainTrialCount = Math.min(this.experimentConfig.mainTrials, shuffledTrials.length);
            const selectedMainTrials = shuffledTrials.slice(0, mainTrialCount);
            
            const fixedPracticeTrials = this.createFixedPracticeTrials(trialsData);
            
            this.practiceTrials = fixedPracticeTrials.map((trial, i) => ({
                trial_number: `practice_${i + 1}`,
                risk_probability: trial.risk_probability,
                risk_reward: trial.risk_reward,
                safe_reward: trial.safe_reward,
                size_condition: trial.size_condition,
                risk_on_left: Math.random() < 0.5,
                is_practice: true,
                combination_id: trial.combination_id,
                expected_value: trial.expected_value,
                trial_id: trial.trial_id
            }));

            this.trials = selectedMainTrials.map((trial, i) => ({
                trial_number: i + 1,
                risk_probability: trial.risk_probability,
                risk_reward: trial.risk_reward,
                safe_reward: trial.safe_reward,
                size_condition: trial.size_condition,
                risk_on_left: Math.random() < 0.5,
                is_practice: false,
                combination_id: trial.combination_id,
                expected_value: trial.expected_value,
                trial_id: trial.trial_id
            }));

            this.finalTimeline = [...this.trials];
            
            if (this.attentionCheckQuestions && 
                this.attentionCheckQuestions.length > 0 && 
                this.experimentConfig.attentionChecks > 0) {
                
                const selectedAttentionChecks = this.shuffle([...this.attentionCheckQuestions])
                    .slice(0, this.experimentConfig.attentionChecks);
                
                this.attentionChecks = selectedAttentionChecks.map(q => ({ ...q, is_attention: true }));
                
                if (this.attentionChecks.length > 0 && this.trials.length > 0) {
                    const interval = Math.floor(this.trials.length / (this.attentionChecks.length + 1));
                    let insertedCount = 0;
                    
                    for (let i = 0; i < this.attentionChecks.length; i++) {
                        const insertPosition = (i + 1) * interval + insertedCount;
                        if (insertPosition < this.finalTimeline.length) {
                            this.finalTimeline.splice(insertPosition, 0, this.attentionChecks[i]);
                            insertedCount++;
                        } else {
                            this.finalTimeline.push(this.attentionChecks[i]);
                        }
                    }
                }
            }
            
            console.log(`Generated ${this.practiceTrials.length} practice trials and ${this.trials.length} main trials`);
            
        } catch (error) {
            console.error("Error loading trials from CSV:", error);
        }
    },

    async loadTrialsFromCSV(filename) {
        const csvPath = filename || 'full_trials.csv';
        const response = await fetch(csvPath);
        if (!response.ok) {
            throw new Error(`Failed to load trials CSV: ${response.status}`);
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file appears to be empty or malformed');
        }
        
        const headers = lines[0].split(',');
        const trials = [];
        const floatFields = ['safe_reward', 'expected_value']; // Allow decimals (e.g. IP Phase 1)
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(s => s.trim());
            const trial = {};
            
            headers.forEach((header, index) => {
                const value = values[index];
                if (floatFields.includes(header)) {
                    trial[header] = parseFloat(value) || 0;
                } else if (['trial_id', 'combination_id', 'risk_probability', 'risk_reward'].includes(header)) {
                    trial[header] = parseInt(value, 10) || 0;
                } else {
                    trial[header] = (value || '').trim();
                }
            });
            
            trials.push(trial);
        }
        
        return trials;
    },

    createFixedPracticeTrials(trialsData) {
        // Create a fixed set of 8 practice trials with good variety
        // These will be the same for all participants
        const practiceTrialIds = [1, 15, 30, 45, 60, 75, 90, 105]; // Fixed trial IDs for practice
        
        const fixedPracticeTrials = practiceTrialIds.map(id => {
            const trial = trialsData.find(t => t.trial_id === id);
            if (!trial) {
                // Fallback: use first available trial if specific ID not found
                return trialsData[0];
            }
            return trial;
        });
        
        return fixedPracticeTrials;
    },

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * IP Study Phase 2: build 72 core trials from template + participant's 18 IPs, plus 12 dummy trials (dominant risky, for engagement).
     * Returns 84 trials shuffled together.
     */
    async generatePhase2Trials(indifferencePoints) {
        if (!indifferencePoints || indifferencePoints.length < 18) {
            console.error('[IP Phase 2] Need 18 indifference points');
            return [];
        }
        const response = await fetch('ip_phase2_template.csv');
        if (!response.ok) throw new Error('Failed to load Phase 2 template');
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) throw new Error('Phase 2 template empty');
        const headers = lines[0].split(',').map(s => s.trim());
        const coreTrials = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(s => s.trim());
            const row = {};
            headers.forEach((h, idx) => { row[h] = values[idx]; });
            const cid = parseInt(row.combination_id, 10);
            const ip = indifferencePoints[cid - 1];
            const safeReward = ip ? ip.indifference_point : 0;
            coreTrials.push({
                trial_number: coreTrials.length + 1,
                risk_probability: parseInt(row.risk_probability, 10),
                risk_reward: parseInt(row.risk_reward, 10),
                safe_reward: safeReward,
                expected_value: parseFloat(row.expected_value) || 0,
                size_condition: row.size_condition.trim(),
                risk_on_left: Math.random() < 0.5,
                combination_id: cid,
                trial_id: 'phase2_' + (row.phase2_trial || i),
                is_practice: false,
                is_dummy: false
            });
        }

        const dummyTrials = await this.loadPhase2DummyTrials();
        const allTrials = [...coreTrials, ...dummyTrials];
        const shuffled = this.shuffle(allTrials);
        shuffled.forEach((t, i) => { t.trial_number = i + 1; });
        console.log(`[IP Phase 2] Generated ${coreTrials.length} core + ${dummyTrials.length} dummy = ${shuffled.length} trials`);
        return shuffled;
    },

    /**
     * Load 12 dummy trials (dominant risky choices). Interleaved with Phase 2 to maintain engagement.
     */
    async loadPhase2DummyTrials() {
        const response = await fetch('ip_phase2_dummy_trials.csv');
        if (!response.ok) return [];
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(s => s.trim());
        const trials = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(s => s.trim());
            const row = {};
            headers.forEach((h, idx) => { row[h] = values[idx]; });
            trials.push({
                trial_number: 0,
                risk_probability: parseInt(row.risk_probability, 10),
                risk_reward: parseInt(row.risk_reward, 10),
                safe_reward: parseFloat(row.safe_reward) || 0,
                expected_value: (parseInt(row.risk_reward, 10) * parseInt(row.risk_probability, 10)) / 100,
                size_condition: (row.size_condition || '').trim(),
                risk_on_left: Math.random() < 0.5,
                combination_id: null,
                trial_id: 'dummy_' + (row.trial_id || i),
                is_practice: false,
                is_dummy: true
            });
        }
        return trials;
    },

    startPractice() {
        this.currentTrialIndex = 0;
        this.isPractice = true;
        this.currentTimeline = this.practiceTrials;
        this.runNextTrial();
    },

    beginMainTrials() {
        // Request fullscreen
                if (document.fullscreenElement === null) {
            document.documentElement.requestFullscreen().then(() => {
                this.currentTrialIndex = 0;
                this.isPractice = false;
                this.currentTimeline = this.finalTimeline;
                this.runNextTrial();
            });
        } else {
            this.currentTrialIndex = 0;
            this.isPractice = false;
            this.currentTimeline = this.finalTimeline;
            this.runNextTrial();
        }
    }
}); 