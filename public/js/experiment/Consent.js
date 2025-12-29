/**
 * Consent.js - Yale University IRB Approved Consent Form
 * IRB Protocol# 0910005795
 * Approved 7/20/2025
 */

Object.assign(RiskSurveyExperiment.prototype, {
    
    showConsentForm() {
        const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            document.body.innerHTML = `
                <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                    <div style="text-align: center; max-width: 600px;">
                        <h1 style="font-size: 2.5rem; font-weight: 300; color: #333; margin-bottom: 1rem;">Desktop Only</h1>
                        <p style="font-size: 1.2rem; color: #666; line-height: 1.6; font-weight: 300;">
                            This experiment requires a <strong>desktop or laptop computer</strong>.
                        </p>
                    </div>
                </div>
            `;
            return;
        }

        document.body.innerHTML = `
            <style>
                .consent-container {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #f5f5f5;
                    overflow: hidden;
                }

                .consent-header {
                    background: #00356b;
                    color: white;
                    padding: 1.5rem 2rem;
                    text-align: center;
                    border-bottom: 4px solid #286DC0;
                }

                .consent-header h1 {
                    margin: 0;
                    font-size: 1.8rem;
                    font-weight: 400;
                }

                .consent-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2rem;
                    max-width: 900px;
                    margin: 0 auto;
                    width: 100%;
                }

                .consent-text {
                    background: white;
                    padding: 2rem;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    line-height: 1.7;
                    font-size: 0.95rem;
                    color: #333;
                    margin-bottom: 2rem;
                }

                .consent-text h2 {
                    font-size: 1.3rem;
                    margin: 1.5rem 0 0.75rem 0;
                    color: #00356b;
                    font-weight: 600;
                }

                .consent-text p {
                    margin: 0.75rem 0;
                }

                .consent-footer {
                    background: white;
                    padding: 2rem;
                    border-top: 2px solid #ddd;
                }

                .consent-checkbox {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 4px;
                    border: 2px solid #ddd;
                    cursor: pointer;
                    transition: all 200ms;
                }

                .consent-checkbox:hover {
                    border-color: #00356b;
                    background: #fff;
                }

                .consent-checkbox.selected {
                    border-color: #00356b;
                    background: #e3f2fd;
                }

                .consent-checkbox input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    margin-top: 2px;
                    cursor: pointer;
                    accent-color: #00356b;
                }

                .btn-consent {
                    padding: 0.75rem 2rem;
                    font-size: 1rem;
                    font-weight: 600;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 200ms;
                    background: #00356b;
                    color: white;
                    min-width: 180px;
                }

                .btn-consent:hover:not(:disabled) {
                    background: #002147;
                }

                .btn-consent:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    opacity: 0.6;
                }
            </style>

            <div class="consent-container">
                <div class="consent-header">
                    <h1>INFORMATION SHEET FOR PARTICIPATION IN A RESEARCH STUDY</h1>
                    <p>YALE UNIVERSITY - YALE UNIVERSITY SCHOOL OF MEDICINE</p>
                </div>

                <div class="consent-content">
                    <div class="consent-text">
                        <strong>APPROVED BY THE YALE UNIVERSITY IRB 7/20/2025</strong><br>
                        IRB Protocol# 0910005795

                        <h2>Study Title: Neural correlates of decision-making processes</h2>
                        <p><strong>Principal Investigator:</strong> Dr. Ifat Levy, ifat.levy@yale.edu</p>

                        <h2>Research Study Summary:</h2>
                        <p>We are asking you to join a research study to examine the neural mechanisms of decision making, valuation, and learning.</p>
                        <p><strong>Study Activities:</strong> You will complete a 5 to 60 minute online task where you make choices between different images, stimuli, and/or lotteries.</p>
                        <p><strong>Risks:</strong> Minimal risks including potential distress for those with sensitivity about food or eating, and sitting at a computer screen for 5 to 60 minutes.</p>
                        <p><strong>Benefits:</strong> Results may contribute to understanding of neural processes that mediate decision-making.</p>
                        <p><strong>Compensation:</strong> Base payment of $1.25 per 5 minutes, up to $15 for 60 minutes. Bonus payments may apply.</p>

                        <h2>Your Rights:</h2>
                        <p>Taking part is your choice. You can change your mind at any time without affecting your relationship with Yale University.</p>

                        <h2>Questions?</h2>
                        <p>Contact Dr. Ifat Levy at (203) 737-1374 or ifat.levy@yale.edu. For questions about your rights, contact Yale Institutional Review Boards at (203) 785-4688 or hrpp@yale.edu.</p>
                    </div>
                </div>

                <div class="consent-footer" style="text-align: center; max-width: 700px; margin: 0 auto; width: 100%;">
                    <div class="consent-checkbox" id="consent-yes-box" onclick="selectConsent(true)">
                        <input type="checkbox" id="consent-yes">
                        <label for="consent-yes"><strong>I AGREE:</strong> I have read and agree to participate.</label>
                    </div>

                    <div class="consent-checkbox" id="consent-no-box" onclick="selectConsent(false)">
                        <input type="checkbox" id="consent-no">
                        <label for="consent-no"><strong>I DO NOT AGREE:</strong> I do not agree to participate.</label>
                    </div>

                    <button class="btn-consent" id="submit-btn" disabled>Submit Response</button>
                </div>
            </div>

            <script>
                let consentChoice = null;

                function selectConsent(agree) {
                    consentChoice = agree;
                    document.getElementById('consent-yes').checked = agree;
                    document.getElementById('consent-no').checked = !agree;
                    document.getElementById('consent-yes-box').classList.toggle('selected', agree);
                    document.getElementById('consent-no-box').classList.toggle('selected', !agree);
                    document.getElementById('submit-btn').disabled = false;
                }

                document.getElementById('submit-btn').addEventListener('click', () => {
                    if (consentChoice === null) return;
                    
                    experiment.consentGiven = consentChoice;
                    experiment.recordConsent(consentChoice);
                    
                    if (consentChoice) {
                        experiment.showWelcomePage();
                    } else {
                        document.body.innerHTML = \`
                            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #f5f5f5;">
                                <div style="text-align: center; max-width: 600px; background: white; padding: 3rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                    <h2 style="color: #00356b; margin-bottom: 1.5rem;">Consent Not Given</h2>
                                    <p style="font-size: 1.1rem; color: #666; margin-bottom: 2rem;">You have declined to participate. Your response has been recorded.</p>
                                </div>
                            </div>
                        \`;
                        setTimeout(() => {
                            experiment.downloadConsentReport();
                        }, 1000);
                    }
                });
            </script>
        `;
    }
});
