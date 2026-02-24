/**
 * Risk Survey Experiment - Main Class
 * Core experiment class definition with constructor and initialization
 */

class RiskSurveyExperiment {
    constructor() {
        this.currentTrialIndex = 0;
        this.trials = [];
        this.attentionChecks = [];
        this.csvData = [];
        this.attentionCheckData = []; // Track attention check responses
        this.trialCounter = 1;
        this.currentTimer = null;
        this.experimentConfig = null;
        this.attentionCheckQuestions = null;
        this.subjectId = null;

        // Trial state
        this.currentChoice = null;
        this.currentConfidence = null;
        this.trialStartTime = null;
        this.pageEntryTime = null;
        this.barChoiceTime = null;
        this.sliderInteracted = false;
        
        // Session tracking
        this.sessionId = `ses_${new Date().toISOString().replace(/[-:]/g, '').substring(0, 15)}`;
        this.sessionStartTime = new Date().toISOString();
        
        // Bonus tracking
        this.completedTrials = []; // Store completed trial data with choices for bonus calculation
        this.bonus = null; // Store calculated bonus amount
        this.selectedTrialForBonus = null; // Store the randomly selected trial for bonus
    }

    async init() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            this.experimentConfig = config.experimentConfig;
            this.attentionCheckQuestions = config.attentionCheckQuestions;
            
            await this.generateTrials();
            this.showWelcomePage();
        } catch (error) {
            console.error("Could not load experiment configuration:", error);
            this.showError("Could not load experiment configuration. Please contact the researcher.");
        }
    }

    // NO MORE CSS CLASSES - DIRECT INLINE STYLES ONLY
    getBarStyles(sizeClass) {
        const isLarge = sizeClass === 'size-large';
        const width = isLarge ? this.experimentConfig.barSizes.large.width : this.experimentConfig.barSizes.small.width;
        const height = isLarge ? this.experimentConfig.barSizes.large.height : this.experimentConfig.barSizes.small.height;
        const fontSize = isLarge ? this.experimentConfig.fontSizes.large : this.experimentConfig.fontSizes.small;
        
        return {
            bar: `width: ${width}px; height: ${height}px; font-size: ${fontSize}px;`,
            text: `font-size: ${fontSize}px;`
        };
    }

    showError(message) {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Error</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa; color: red;">
                        <p>${message}</p>
                    </div>
                </div>
            </div>`;
    }
} 