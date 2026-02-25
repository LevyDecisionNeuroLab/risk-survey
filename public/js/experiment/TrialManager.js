/**
 * TrialManager.js - Trial Generation and Management
 * Handles loading trials from CSV, generating trial sequences, and managing trial flow
 */

// Add trial management methods to the RiskSurveyExperiment class
Object.assign(RiskSurveyExperiment.prototype, {
    
    async generateTrials() {
        try {
            // Load trials from CSV file
            const trialsData = await this.loadTrialsFromCSV();
            
            // --- NEW: Filter out all 50% probability trials ---
            const filteredTrialsData = trialsData.filter(trial => {
                return trial.risk_probability !== 50; 
            });
            console.log(`Loaded ${trialsData.length} total trials, filtered down to ${filteredTrialsData.length} non-50% trials.`);
            // --------------------------------------------------

            // Simple random selection with no duplicates within the experiment
            const shuffledTrials = this.shuffle([...filteredTrialsData]);
            
            // Select trials for main experiment (ensuring no duplicates)
            const mainTrialCount = Math.min(this.experimentConfig.mainTrials, shuffledTrials.length);
            const selectedMainTrials = shuffledTrials.slice(0, mainTrialCount);
            
            // Create fixed set of 8 practice trials with good variety
            const fixedPracticeTrials = this.createFixedPracticeTrials(filteredTrialsData);
            const selectedPracticeTrials = fixedPracticeTrials;
            
            // Create practice trials
            this.practiceTrials = selectedPracticeTrials.map((trial, i) => ({
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

            // Create main trials
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

            // Select and intersperse attention checks (only if they exist and are requested)
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

    async loadTrialsFromCSV() {
        const response = await fetch('full_trials.csv');
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
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const trial = {};
            
            headers.forEach((header, index) => {
                const value = values[index];
                // Convert numeric fields
                if (['trial_id', 'combination_id', 'risk_probability', 'risk_reward', 'safe_reward', 'expected_value'].includes(header)) {
                    trial[header] = parseInt(value);
                } else {
                    trial[header] = value;
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
