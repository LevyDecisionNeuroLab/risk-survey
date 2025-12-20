/**
 * Pages.js - UI Pages and Screens
 * Handles welcome page, instructions, transitions between experiment phases
 */

// Add UI page methods to the RiskSurveyExperiment class
Object.assign(RiskSurveyExperiment.prototype, {
    
    showWelcomePage() {
        document.body.innerHTML = `
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div style="text-align: center; max-width: 600px; width: 100%;">
                    <h1 style="font-size: 3rem; font-weight: 300; color: var(--text-primary); margin-bottom: 1rem; letter-spacing: -1px;">Decision-Making Study</h1>
                    <p style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 4rem; font-weight: 300;">
                        Welcome! Thank you for participating in this research study.
                    </p>
                    
                    <div style="margin-bottom: 3rem;">
                        <h2 style="font-size: 1.5rem; font-weight: 500; color: var(--text-primary); margin-bottom: 2rem;">Please Enter Your Information</h2>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <label for="subject-id" style="display: block; font-weight: 500; margin-bottom: 0.5rem; color: var(--text-primary); text-align: left;">Subject ID:</label>
                            <input type="text" id="subject-id" placeholder="Enter your subject ID..." 
                                style="width: 100%; padding: 16px 20px; font-size: 16px; border: 1px solid #e5e5e5; border-radius: 4px; box-sizing: border-box; font-family: inherit;">
                        </div>
                        
                        <div id="id-warning" style="color: var(--risk-red); font-weight: 500; margin-top: 10px; visibility: hidden;">
                            Please enter a valid subject ID to continue.
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <button id="continue-btn" class="next-button" onclick="experiment.validateAndContinue()" disabled>Continue</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener for subject ID input
        const subjectInput = document.getElementById('subject-id');
        const continueBtn = document.getElementById('continue-btn');
        const warning = document.getElementById('id-warning');
        
        subjectInput.addEventListener('input', () => {
            const value = subjectInput.value.trim();
            if (value.length > 0) {
                continueBtn.disabled = false;
                continueBtn.style.background = 'var(--text-primary)';
                continueBtn.style.cursor = 'pointer';
                warning.style.visibility = 'hidden';
            } else {
                continueBtn.disabled = true;
                continueBtn.style.background = 'var(--text-light)';
                continueBtn.style.cursor = 'not-allowed';
            }
        });
        
        // Allow Enter key to continue
        subjectInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !continueBtn.disabled) {
                this.validateAndContinue();
            }
        });
    },

    validateAndContinue() {
        const subjectInput = document.getElementById('subject-id');
        const warning = document.getElementById('id-warning');
        const subjectId = subjectInput.value.trim();
        
        if (subjectId.length === 0) {
            warning.style.visibility = 'visible';
            warning.textContent = 'Please enter a valid subject ID to continue.';
            return;
        }
        
        // Store the subject ID
        this.subjectId = subjectId;
        console.log(`Subject ID set to: ${this.subjectId}`);
        
        // Continue to instructions
        this.showInstructions();
    },

        showInstructions() {
        document.body.innerHTML = `
            <style>
                .instructions-page {
                    width: 100%;
                    height: 100vh;
                    display: none;
                    flex-direction: column;
                    padding: 2rem;
                    background: var(--bg-primary);
                    overflow: hidden;
                }
                
                .instructions-page.active {
                    display: flex;
                }
                
                .instructions-content {
                    flex: 1;
                    overflow-y: auto;
                    padding-right: 1rem;
                }
                
                .instructions-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e5e5;
                    margin-top: 1rem;
                }
                
                .instructions-buttons button {
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                }
            </style>
            
            <!-- PAGE 1: Title & Monetary Choices -->
            <div class="instructions-page active" id="instructions-page-1">
                <div class="instructions-content">
                    <h1 style="font-size: 2rem; font-weight: 300; color: var(--text-primary); margin: 0 0 1rem 0; letter-spacing: -1px; text-align: center;">Instructions for the Decision-Making Task</h1>
                    
                    <p style="font-size: 1rem; color: var(--text-primary); margin-bottom: 1.5rem; line-height: 1.6; font-weight: 300; text-align: center;">
                        In this study, you will be making decisions between different monetary choices. These choices represent hypothetical situations, but you should choose as if the decisions were real.
                    </p>
                    
                    <h2 style="font-size: 1.3rem; font-weight: 400; color: var(--text-primary); margin-bottom: 1rem; text-decoration: underline;">Understanding Monetary Choices</h2>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <p style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.5rem; line-height: 1.6; font-weight: 300;">
                            <strong>○ Option 1: A Lottery</strong>
                        </p>
                        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.5; font-weight: 300;">
                            A lottery has two possible outcomes. In the example below, the outcomes are 200 points or 0. The red and blue areas and the numbers within them represent the chance for obtaining these outcomes. There is a 75% chance of obtaining 200 points and a 25% chance of obtaining 0 points.
                        </p>
                        
                        <div style="text-align: center; margin: 1rem 0;">
                            <div style="display: inline-block;">
                                <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">200</div>
                                <div style="width: 80px; height: 140px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="height: 75%; background: #dc2626; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: 600;">75%</div>
                                    <div style="height: 25%; background: #2563eb; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: 600;">25%</div>
                                </div>
                                <div style="font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem; color: var(--text-secondary);">0</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <p style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.5rem; line-height: 1.6; font-weight: 300;">
                            <strong>○ Option 2: A Guaranteed Outcome</strong>
                        </p>
                        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.5; font-weight: 300;">
                            A guaranteed outcome where you have a 100% chance (shown in the black bar) to win a specific number of points, such as 150 points seen in this example.
                        </p>
                        
                        <div style="text-align: center; margin: 1rem 0;">
                            <div style="display: inline-block;">
                                <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">150</div>
                                <div style="width: 80px; height: 140px; background: #334155; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px;">100%</div>
                                <div style="font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem; visibility: hidden;">0</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="instructions-buttons">
                    <button class="next-button" onclick="experiment.showInstructionsPage(2)">Next</button>
                </div>
            </div>
            
            <!-- PAGE 2: Your Task & Timing Info -->
            <div class="instructions-page" id="instructions-page-2">
                <div class="instructions-content">
                    <h2 style="font-size: 1.3rem; font-weight: 400; color: var(--text-primary); margin: 0 0 1rem 0; text-decoration: underline;">Your Task</h2>
                    
                    <ol style="line-height: 1.6; font-size: 0.95rem; font-weight: 300; margin: 0 0 1.5rem 2rem; padding: 0;">
                        <li style="margin-bottom: 0.75rem;">Choose your preferred option by clicking on it</li>
                        <li style="margin-bottom: 0.75rem;">Click Next to continue to the next choice</li>
                    </ol>
                    
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 1rem 0 1.5rem 0; font-style: italic; font-weight: 300;">
                        Make decisions as if they were real. You'll start with practice trials.
                    </p>
                    
                    <div style="margin: 1.5rem 0; padding: 1.5rem; border-left: 4px solid #ffeaa7; background: rgba(252, 212, 158, 0.2); border-radius: 4px;">
                        <h3 style="margin: 0 0 0.75rem 0; color: var(--text-primary); font-size: 1.1rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
                            ⏱️ Important Timing Info
                        </h3>
                        <p style="margin: 0; color: var(--text-primary); line-height: 1.6; font-size: 0.95rem; font-weight: 300;">
                            You have <strong>6 seconds</strong> to make each choice. After selecting, click Next.
                        </p>
                    </div>
                </div>
                
                <div class="instructions-buttons">
                    <button class="next-button" onclick="experiment.showInstructionsPage(1)">Back</button>
                    <button class="next-button" onclick="experiment.startComprehensionCheck()">Continue</button>
                </div>
            </div>
            
            <script>
                // Add method to experiment object to handle page switching
                if (!experiment.showInstructionsPage) {
                    experiment.showInstructionsPage = function(pageNum) {
                        document.querySelectorAll('.instructions-page').forEach(page => {
                            page.classList.remove('active');
                        });
                        document.getElementById('instructions-page-' + pageNum).classList.add('active');
                    };
                }
            </script>
        `;
    },


    startMainTrials() {
        document.body.innerHTML = `
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div style="text-align: center; max-width: 600px;">
                    <h2 style="color: var(--text-primary); margin-bottom: 2rem; font-size: 2.5rem; font-weight: 300;">🎉 Practice Complete!</h2>
                    <p style="font-size: 1.3rem; color: var(--text-secondary); margin-bottom: 3rem; line-height: 1.6; font-weight: 300;">
                        Great! You're now ready for the main experiment.
                    </p>
                    <div style="margin: 3rem 0; padding: 2rem; border-left: 4px solid #c3e6c3;">
                        <h3 style="margin-top: 0; color: var(--text-primary); font-size: 1.4rem;">📊 What's Next</h3>
                       <ul style="margin-bottom: 0; color: var(--text-primary); line-height: 1.6; text-align: left; font-size: 1.1rem;">
    <li style="margin-bottom: 0.8rem;"><strong>${this.config?.mainTrials || 120} decision trials</strong></li>
    <li style="margin-bottom: 0.8rem;"><strong>6-second timer</strong> for each choice</li>
</ul>
                    </div>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 3rem; font-weight: 300;">
                        The screen will go fullscreen for the main experiment.
                    </p>
                    <div style="text-align: center;">
                        <button class="next-button" onclick="experiment.beginMainTrials()">Begin</button>
                    </div>
                </div>
            </div>
        `;
    }
}); 
