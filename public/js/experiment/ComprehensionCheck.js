/**
 * ComprehensionCheck.js - Task Comprehension Questions
 * Handles comprehension validation before practice trials
 */

Object.assign(RiskSurveyExperiment.prototype, {
    
    startComprehensionCheck() {
        this.comprehensionState = {
            currentQuestion: 0,
            failureCount: 0,
            startTime: Date.now(),
            responses: []
        };
        
        this.comprehensionQuestions = [
            {
                prompt: "For the option on the right, what is the maximum amount of points you can potentially earn?",
                correctAnswer: 150,
                explanation: "The correct response is 150 because the black bar indicates a 100% chance of winning 150 points."
            },
            {
                prompt: "For the option on the left, what is the maximum amount of points you can potentially earn?",
                correctAnswer: 200,
                explanation: "The correct response is 200. The left option shows 200 points at the top, which represents the maximum possible outcome."
            },
            {
                prompt: "For the option on the left, what is the minimum amount of points you can potentially earn?",
                correctAnswer: 0,
                explanation: "The correct response is 0. The left option shows 0 points at the bottom, representing the minimum possible outcome when you don't win."
            }
        ];
        
        this.showComprehensionQuestion();
    },
    
    showComprehensionQuestion() {
        const questionNum = this.comprehensionState.currentQuestion + 1;
        const question = this.comprehensionQuestions[this.comprehensionState.currentQuestion];
        
        document.body.innerHTML = `
            <style>
                .comp-page {
                    height: 100vh;
                    padding: 1.5rem 2rem;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .comp-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    max-width: 900px;
                    margin: 0 auto;
                    width: 100%;
                }
                .comp-header {
                    text-align: center;
                    margin-bottom: 1rem;
                }
                .comp-header h1 {
                    font-size: 1.6rem;
                    font-weight: 400;
                    color: var(--text-primary);
                    margin: 0 0 0.5rem 0;
                }
                .comp-header p {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    margin: 0;
                }
                .comp-chart {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 3rem;
                    margin: 1.5rem 0;
                }
                .comp-option {
                    text-align: center;
                }
                .comp-label {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0.25rem 0;
                }
                .comp-risk-bar {
                    width: 100px;
                    height: 180px;
                    border: 2px solid #333;
                    display: flex;
                    flex-direction: column;
                }
                .comp-risk-bar .red {
                    height: 75%;
                    background: #e74c3c;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    color: white;
                    font-weight: 600;
                }
                .comp-risk-bar .blue {
                    height: 25%;
                    background: #3498db;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    color: white;
                    font-weight: 600;
                }
                .comp-safe-bar {
                    width: 100px;
                    height: 180px;
                    background: #2c3e50;
                    border: 2px solid #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    color: white;
                    font-weight: 600;
                }
                .comp-question-box {
                    padding: 1.25rem 1.5rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #3498db;
                    text-align: center;
                }
                .comp-question-box p {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 1rem 0;
                }
                .comp-answer-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                }
                .comp-answer-row label {
                    font-size: 1rem;
                    font-weight: 500;
                }
                .comp-answer-row input {
                    padding: 10px 14px;
                    font-size: 16px;
                    border: 2px solid #e5e5e5;
                    border-radius: 6px;
                    width: 140px;
                    text-align: center;
                    font-weight: 600;
                }
                .comp-error {
                    color: #e74c3c;
                    font-weight: 500;
                    margin-top: 0.75rem;
                    visibility: hidden;
                    font-size: 0.9rem;
                }
                .comp-submit {
                    text-align: center;
                    margin-top: 1.25rem;
                }
            </style>
            
            <div class="comp-page">
                <div class="comp-content">
                    <div class="comp-header">
                        <h1>Task Comprehension Check</h1>
                        <p>Question ${questionNum} of 3: Please answer the following question about the chart below.</p>
                    </div>
                    
                    <!-- Chart Display -->
                    <div class="comp-chart">
                        <!-- Left Option (Risky) -->
                        <div class="comp-option">
                            <div class="comp-label">200</div>
                            <div class="comp-risk-bar">
                                <div class="red">75</div>
                                <div class="blue">25</div>
                            </div>
                            <div class="comp-label">0</div>
                        </div>
                        
                        <!-- Right Option (Safe) -->
                        <div class="comp-option">
                            <div class="comp-label">150</div>
                            <div class="comp-safe-bar">100</div>
                            <div class="comp-label" style="visibility: hidden;">0</div>
                        </div>
                    </div>
                    
                    <!-- Question -->
                    <div class="comp-question-box">
                        <p>${question.prompt}</p>
                        <div class="comp-answer-row">
                            <label>Your answer:</label>
                            <input type="number" id="comprehension-answer" placeholder="Enter number..." min="0" max="1000">
                        </div>
                        <div id="error-message" class="comp-error">Please enter a valid number.</div>
                    </div>
                    
                    <div class="comp-submit">
                        <button id="submit-btn" class="next-button">Submit Answer</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('submit-btn').addEventListener('click', () => {
            this.submitComprehensionAnswer();
        });
        
        // Focus on input and allow Enter to submit
        const input = document.getElementById('comprehension-answer');
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitComprehensionAnswer();
            }
        });
        
        // Clear error on input
        input.addEventListener('input', () => {
            document.getElementById('error-message').style.visibility = 'hidden';
        });
    },
    
    submitComprehensionAnswer() {
        const input = document.getElementById('comprehension-answer');
        const errorMsg = document.getElementById('error-message');
        const answer = parseInt(input.value);
        
        // Validate input
        if (isNaN(answer) || input.value.trim() === '') {
            errorMsg.textContent = 'Please enter a valid number.';
            errorMsg.style.visibility = 'visible';
            input.focus();
            return;
        }
        
        const question = this.comprehensionQuestions[this.comprehensionState.currentQuestion];
        const isCorrect = answer === question.correctAnswer;
        const responseTime = Date.now() - this.comprehensionState.startTime;
        
        // Store response
        this.comprehensionState.responses.push({
            questionNumber: this.comprehensionState.currentQuestion + 1,
            userAnswer: answer,
            correctAnswer: question.correctAnswer,
            isCorrect: isCorrect,
            responseTime: responseTime
        });
        
        if (isCorrect) {
            this.showCorrectFeedback();
        } else {
            this.comprehensionState.failureCount++;
            this.showIncorrectFeedback();
        }
    },
    
    showCorrectFeedback() {
        const questionNum = this.comprehensionState.currentQuestion + 1;
        const question = this.comprehensionQuestions[this.comprehensionState.currentQuestion];
        
        document.body.innerHTML = `
            <style>
                .feedback-page {
                    height: 100vh;
                    padding: 1.5rem 2rem;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .feedback-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                    text-align: center;
                }
                .feedback-banner {
                    padding: 1rem 1.5rem;
                    background: #d4edda;
                    border: 2px solid #c3e6c3;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                .feedback-banner h2 {
                    color: #155724;
                    margin: 0;
                    font-size: 1.4rem;
                }
                .feedback-text {
                    font-size: 1.1rem;
                    color: var(--text-primary);
                    margin-bottom: 1.5rem;
                }
                .feedback-chart {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 3rem;
                    padding: 1.5rem;
                    background: #f0f8f0;
                    border-radius: 8px;
                    border: 2px solid #c3e6c3;
                    margin-bottom: 1.5rem;
                }
                .feedback-option {
                    text-align: center;
                }
                .feedback-label {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0.25rem 0;
                }
                .feedback-label.highlight {
                    background: #ffeaa7;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .feedback-risk-bar {
                    width: 80px;
                    height: 140px;
                    border: 2px solid #333;
                    display: flex;
                    flex-direction: column;
                }
                .feedback-risk-bar .red {
                    height: 75%;
                    background: #e74c3c;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: white;
                    font-weight: 600;
                }
                .feedback-risk-bar .blue {
                    height: 25%;
                    background: #3498db;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: white;
                    font-weight: 600;
                }
                .feedback-safe-bar {
                    width: 80px;
                    height: 140px;
                    background: #2c3e50;
                    border: 2px solid #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: white;
                    font-weight: 600;
                }
            </style>
            
            <div class="feedback-page">
                <div class="feedback-content">
                    <div class="feedback-banner">
                        <h2>✓ Correct!</h2>
                    </div>
                    
                    <p class="feedback-text">Yes, the correct response is ${question.correctAnswer}!</p>
                    
                    <!-- Highlighted Chart -->
                    <div class="feedback-chart">
                        <!-- Left Option -->
                        <div class="feedback-option">
                            <div class="feedback-label ${this.shouldHighlightLeft() ? 'highlight' : ''}">200</div>
                            <div class="feedback-risk-bar">
                                <div class="red">75</div>
                                <div class="blue">25</div>
                            </div>
                            <div class="feedback-label ${this.shouldHighlightLeftBottom() ? 'highlight' : ''}">0</div>
                        </div>
                        
                        <!-- Right Option -->
                        <div class="feedback-option">
                            <div class="feedback-label ${this.shouldHighlightRight() ? 'highlight' : ''}">150</div>
                            <div class="feedback-safe-bar">100</div>
                            <div class="feedback-label" style="visibility: hidden;">0</div>
                        </div>
                    </div>
                    
                    <button id="continue-btn" class="next-button">Continue</button>
                </div>
            </div>
        `;
        
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.nextComprehensionQuestion();
        });
    },
    
    showIncorrectFeedback() {
        const question = this.comprehensionQuestions[this.comprehensionState.currentQuestion];
        
        document.body.innerHTML = `
            <style>
                .feedback-page {
                    height: 100vh;
                    padding: 1.5rem 2rem;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .feedback-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                    text-align: center;
                }
                .feedback-banner.incorrect {
                    padding: 1rem 1.5rem;
                    background: #f8d7da;
                    border: 2px solid #f5c6cb;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                .feedback-banner.incorrect h2 {
                    color: #721c24;
                    margin: 0;
                    font-size: 1.4rem;
                }
                .feedback-text {
                    font-size: 1.05rem;
                    color: var(--text-primary);
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }
                .feedback-chart.warning {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 3rem;
                    padding: 1.25rem;
                    background: #fff3cd;
                    border-radius: 8px;
                    border: 2px solid #ffeaa7;
                    margin-bottom: 1rem;
                }
                .feedback-option {
                    text-align: center;
                }
                .feedback-label {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0.25rem 0;
                }
                .feedback-label.highlight {
                    background: #ffeaa7;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .feedback-risk-bar {
                    width: 80px;
                    height: 140px;
                    border: 2px solid #333;
                    display: flex;
                    flex-direction: column;
                }
                .feedback-risk-bar .red {
                    height: 75%;
                    background: #e74c3c;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: white;
                    font-weight: 600;
                }
                .feedback-risk-bar .blue {
                    height: 25%;
                    background: #3498db;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: white;
                    font-weight: 600;
                }
                .feedback-safe-bar {
                    width: 80px;
                    height: 140px;
                    background: #2c3e50;
                    border: 2px solid #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: white;
                    font-weight: 600;
                }
                .understanding-box {
                    padding: 1rem 1.5rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .understanding-box p {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0 0 1rem 0;
                }
                .understanding-buttons {
                    display: flex;
                    gap: 1.5rem;
                    justify-content: center;
                }
                .understanding-buttons button {
                    padding: 0.6rem 2rem;
                }
            </style>
            
            <div class="feedback-page">
                <div class="feedback-content">
                    <div class="feedback-banner incorrect">
                        <h2>Incorrect</h2>
                    </div>
                    
                    <p class="feedback-text">${question.explanation}</p>
                    
                    <!-- Chart with Explanation -->
                    <div class="feedback-chart warning">
                        <!-- Left Option -->
                        <div class="feedback-option">
                            <div class="feedback-label ${this.shouldHighlightLeft() ? 'highlight' : ''}">200</div>
                            <div class="feedback-risk-bar">
                                <div class="red">75</div>
                                <div class="blue">25</div>
                            </div>
                            <div class="feedback-label ${this.shouldHighlightLeftBottom() ? 'highlight' : ''}">0</div>
                        </div>
                        
                        <!-- Right Option -->
                        <div class="feedback-option">
                            <div class="feedback-label ${this.shouldHighlightRight() ? 'highlight' : ''}">150</div>
                            <div class="feedback-safe-bar">100</div>
                            <div class="feedback-label" style="visibility: hidden;">0</div>
                        </div>
                    </div>
                    
                    <div class="understanding-box">
                        <p>Do you understand the explanation?</p>
                        <div class="understanding-buttons">
                            <button id="yes-btn" class="next-button" style="background: #28a745;">Yes</button>
                            <button id="no-btn" class="next-button" style="background: #dc3545;">No</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('yes-btn').addEventListener('click', () => {
            this.handleUnderstandingResponse(true);
        });
        
        document.getElementById('no-btn').addEventListener('click', () => {
            this.handleUnderstandingResponse(false);
        });
    },
    
    shouldHighlightLeft() {
        const qNum = this.comprehensionState.currentQuestion;
        return qNum === 1 || qNum === 2; // Questions 2 and 3 ask about left option
    },
    
    shouldHighlightRight() {
        const qNum = this.comprehensionState.currentQuestion;
        return qNum === 0; // Question 1 asks about right option
    },
    
    shouldHighlightLeftBottom() {
        const qNum = this.comprehensionState.currentQuestion;
        return qNum === 2; // Question 3 asks about minimum (0) of left option
    },
    
    handleUnderstandingResponse(understood) {
        // Continue regardless of yes/no response as per requirements
        this.nextComprehensionQuestion();
    },
    
    nextComprehensionQuestion() {
        this.comprehensionState.currentQuestion++;
        
        // Check if we've completed all 3 questions
        if (this.comprehensionState.currentQuestion >= 3) {
            // Check failure condition - if failed 3 questions total, end survey
            if (this.comprehensionState.failureCount >= 3) {
                this.showComprehensionFailure();
                return;
            }
            
            // Passed comprehension, log results and continue to practice
            this.logComprehensionResults();
            this.startPractice();
            return;
        }
        
        // Reset start time for next question
        this.comprehensionState.startTime = Date.now();
        this.showComprehensionQuestion();
    },
    
    showComprehensionFailure() {
        document.body.innerHTML = `
            <div style="height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; box-sizing: border-box;">
                <div style="text-align: center; max-width: 600px; padding: 2rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc3545; margin-bottom: 1.5rem; font-size: 1.8rem;">Study Complete</h2>
                    <div style="margin: 1.5rem 0; padding: 1.5rem; background: #f8d7da; border-radius: 8px; border-left: 4px solid #dc3545;">
                        <p style="font-size: 1.1rem; color: #721c24; margin: 0;">
                            Thank you for your time. Unfortunately, you are not eligible to continue with this study at this time.
                        </p>
                    </div>
                    <p style="font-size: 1rem; color: #666; margin-top: 1.5rem;">
                        You may now close this window.
                    </p>
                </div>
            </div>
        `;
    },
    
    logComprehensionResults() {
        // Optional: Log to console or send to server for research tracking
        console.log('Comprehension check completed:', {
            participantId: this.subjectId,
            responses: this.comprehensionState.responses,
            totalFailures: this.comprehensionState.failureCount,
            passed: this.comprehensionState.failureCount < 3
        });
        
        // Could add server logging here if needed for research purposes
        // this.sendComprehensionData(this.comprehensionState);
    }
});














































