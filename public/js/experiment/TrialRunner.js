/**
 * TrialRunner.js - Trial Execution and User Interaction
 * Handles running individual trials, timers, user input, and attention checks
 */

// Utility function to format numbers with commas
function formatNumberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add trial execution methods to the RiskSurveyExperiment class
Object.assign(RiskSurveyExperiment.prototype, {
    
    runNextTrial() {
        if (this.currentTrialIndex >= this.currentTimeline.length) {
            if (this.isPractice) {
                this.startMainTrials();
            } else {
                this.finishExperiment();
            }
            return;
        }

        const trial = this.currentTimeline[this.currentTrialIndex];
        
        if (trial.is_attention) {
            this.runAttentionCheck(trial);
        } else {
            this.runMainTrial(trial);
        }
    },

    runMainTrial(trial) {
        this.clearTimer();
        this.resetTrialState();

        const totalTrials = this.isPractice ? this.practiceTrials.length : this.trials.length;
        const trialHTML = this.createTrialHTML(trial, totalTrials);
        
        document.body.innerHTML = `<div class="main-container trial-container-page">${trialHTML}</div>`;

        // Start timer for main trials (not practice)
        if (!this.isPractice) {
            this.startTrialTimer();
        }
    },

    runAttentionCheck(question) {
         this.clearTimer();
         this.attentionCheckStartTime = Date.now(); // Track start time for response time
         
         let stimulus;
         switch (question.type) {
             case 'multi-choice':
                 stimulus = `
                     <div class="attention-check-container">
                         <div class="attention-check-prompt">${question.prompt}</div>
                         <div class="attention-check-options">
                             ${question.options.map((option, index) => `
                                 <label class="attention-check-option">
                                     <input type="radio" name="attention-choice" value="${option}" data-index="${index}">
                                     <span>${option}</span>
                                 </label>
                             `).join('')}
                         </div>
                         <div class="navigation" style="margin-top: 20px;">
                             <button id="attention-next-btn" class="next-button" disabled>Next</button>
                         </div>
                     </div>
                 `;
                 break;
                 
             case 'text':
                 stimulus = `
                     <div class="attention-check-container">
                         <div class="attention-check-prompt">${question.prompt}</div>
                         <div class="attention-check-input">
                             <input type="text" id="attention-text-input" placeholder="Type your answer here..." style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 4px;">
                         </div>
                         <div class="navigation" style="margin-top: 20px;">
                             <button id="attention-next-btn" class="next-button" disabled>Next</button>
                         </div>
                     </div>
                 `;
                 break;
                 
             case 'likert':
                 stimulus = `
                     <div class="attention-check-container">
                         <div class="attention-check-prompt">${question.prompt}</div>
                         <div class="attention-check-likert">
                             ${question.labels.map((label, index) => `
                                 <label class="attention-check-option">
                                     <input type="radio" name="attention-likert" value="${index}" data-label="${label}">
                                     <span>${label}</span>
                                 </label>
                             `).join('')}
                         </div>
                         <div class="navigation" style="margin-top: 20px;">
                             <button id="attention-next-btn" class="next-button" disabled>Next</button>
                         </div>
                     </div>
                 `;
                 break;
         }

         document.body.innerHTML = `<div class="main-container attention-check-page">${stimulus}</div>`;
         this.setupAttentionCheckEvents(question);
    },

    setupAttentionCheckEvents(question) {
        const nextBtn = document.getElementById('attention-next-btn');

        if (question.type === 'multi-choice') {
            const radios = document.querySelectorAll('input[name="attention-choice"]');
            
            radios.forEach(radio => {
                radio.addEventListener('change', () => {
                    nextBtn.disabled = false; // Enable button when any option is selected
                });
            });
            
        } else if (question.type === 'text') {
            const textInput = document.getElementById('attention-text-input');
            
            textInput.addEventListener('input', () => {
                if (textInput.value.trim()) {
                    nextBtn.disabled = false; // Enable button when any text is entered
                }
            });
            
        } else if (question.type === 'likert') {
            const radios = document.querySelectorAll('input[name="attention-likert"]');
            
            radios.forEach(radio => {
                radio.addEventListener('change', () => {
                    nextBtn.disabled = false; // Enable button when any option is selected
                });
            });
        }

        nextBtn.addEventListener('click', () => {
            if (!nextBtn.disabled) {
                // Calculate response time
                const responseTime = (Date.now() - this.attentionCheckStartTime) / 1000;
                
                // Get user answer based on question type
                let userAnswer = '';
                let isCorrect = false;
                
                if (question.type === 'multi-choice') {
                    const selectedRadio = document.querySelector('input[name="attention-choice"]:checked');
                    if (selectedRadio) {
                        userAnswer = selectedRadio.value;
                        isCorrect = userAnswer === question.correct_answer;
                    }
                } else if (question.type === 'text') {
                    const textInput = document.getElementById('attention-text-input');
                    if (textInput) {
                        userAnswer = textInput.value.trim();
                        isCorrect = userAnswer.toLowerCase() === question.correct_answer.toLowerCase();
                    }
                } else if (question.type === 'likert') {
                    const selectedRadio = document.querySelector('input[name="attention-likert"]:checked');
                    if (selectedRadio) {
                        userAnswer = selectedRadio.getAttribute('data-label');
                        isCorrect = userAnswer === question.correct_answer;
                    }
                }
                
                // Save attention check data
                this.saveAttentionCheckData(question, userAnswer, isCorrect, responseTime);
                
                this.currentTrialIndex++;
                this.runNextTrial();
            }
        });
    },



    createTrialHTML(trial, totalTrials) {
        // Get styles directly from config
        const riskSizeClass = this.getSizeClass(trial.size_condition, 'risk');
        const safeSizeClass = this.getSizeClass(trial.size_condition, 'safe');
        const riskStyles = this.getBarStyles(riskSizeClass);
        const safeStyles = this.getBarStyles(safeSizeClass);

        
        const riskBarHTML = `
            <div class="option">
                <div class="option-label option-label-top" style="${riskStyles.text}">${formatNumberWithCommas(trial.risk_reward)}</div>
                <div class="risk-bar selectable-bar" id="risk-bar" onclick="experiment.selectChoice('risk')" style="${riskStyles.bar}">
                    <div class="risk-bar-red" style="height: ${trial.risk_probability}%; ${riskStyles.text}">
                        ${trial.risk_probability}%
                    </div>
                    <div class="risk-bar-blue" style="height: ${100 - trial.risk_probability}%; ${riskStyles.text}">
                        ${100 - trial.risk_probability}%
                    </div>
                </div>
                <div class="option-label option-label-bottom" style="${riskStyles.text}">0</div>
            </div>`;

        const safeBarHTML = `
            <div class="option">
                <div class="option-label option-label-top" style="${safeStyles.text}">${formatNumberWithCommas(trial.safe_reward)}</div>
                <div class="safe-bar selectable-bar" id="safe-bar" onclick="experiment.selectChoice('safe')" style="${safeStyles.bar}">
                    100%
                </div>
                <div class="option-label option-label-bottom" style="visibility: hidden; ${safeStyles.text}">0</div>
            </div>`;

        const leftOption = trial.risk_on_left ? riskBarHTML : safeBarHTML;
        const rightOption = trial.risk_on_left ? safeBarHTML : riskBarHTML;

        const trialCounterText = this.isPractice ? 
            `Practice ${trial.trial_number.replace('practice_', '')}` : 
            `Trial ${trial.trial_number} of ${totalTrials}`;

        return `
            <div class="trial-header">
                <div id="trial-counter">${trialCounterText}</div>
                <div id="trial-timer">${!this.isPractice ? 'Time left: 6s' : ''}</div>
            </div>
            <div class="bars-area">
                <div class="option-container">${leftOption}</div>
                <div class="option-container">${rightOption}</div>
            </div>
            
    <div class="navigation">
                <button class="next-button" id="next-button" onclick="experiment.advanceTrial()" disabled>Next</button>
            </div>`;
    },

    getSizeClass(sizeCondition, optionType) {
        switch (sizeCondition) {
            case 'both-large': return 'size-large';
            case 'both-small': return 'size-small';
            case 'risk-large': return optionType === 'risk' ? 'size-large' : 'size-small';
            case 'safe-large': return optionType === 'safe' ? 'size-large' : 'size-small';
            default: return 'size-small';
        }
    },

    resetTrialState() {
        this.currentChoice = null;
       
        this.trialStartTime = Date.now();
        this.pageEntryTime = (Date.now() - this.trialStartTime) / 1000; // Set immediately when page loads
        this.barChoiceTime = null;
     
    },

    startTrialTimer() {
        let timeLeft = this.experimentConfig.trialDuration / 1000;
        const timerElement = document.getElementById('trial-timer');

        if (timerElement) {
            timerElement.textContent = `Time left: ${timeLeft}s`;
        }

        this.currentTimer = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = `Time left: ${timeLeft}s`;
            }
            if (timeLeft <= 0) {
                this.clearTimer();
                this.finishTrial();
            }
        }, 1000);
    },

    clearTimer() {
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
    },

    selectChoice(choice) {
    const time = (Date.now() - this.trialStartTime) / 1000;
    this.barChoiceTime = time; // Record when choice was made

    this.currentChoice = choice;
    document.querySelectorAll('.selectable-bar').forEach(bar => {
        bar.classList.remove('selected-bar');
    });
    const selectedElement = document.getElementById(choice === 'risk' ? 'risk-bar' : 'safe-bar');
    if (selectedElement) {
        selectedElement.classList.add('selected-bar');
    }
    
    // Auto-advance after choice (no confidence question)
    setTimeout(() => {
        this.advanceTrial();
    }, 300);
},



    checkTrialComplete() {
        const nextButton = document.getElementById('next-button');
        if (nextButton && this.currentChoice !== null) {
            nextButton.disabled = false;
        } else if (nextButton) {
            nextButton.disabled = true;
        }
    },

    advanceTrial() {
        this.finishTrial();
    },

    finishTrial() {
        this.clearTimer();
        
        if (!this.isPractice) {
            const trial = this.currentTimeline[this.currentTrialIndex];
            if (!trial.is_attention) {
                this.saveTrialData(trial);
            }
        }
        
        this.currentTrialIndex++;
        this.runNextTrial();
    }
}); 
