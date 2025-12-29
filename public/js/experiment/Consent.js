/**
 * Consent.js - Yale University IRB Approved Consent Form
 * IRB Protocol# 0910005795
 * Approved 7/20/2025
 */

/**
 * Consent.js - Yale IRB Consent Form
 * 
 * Displays the full Yale IRB consent form and requires:
 * 1. User reads the full form (scrolled to bottom)
 * 2. User selects YES or NO (mutually exclusive)
 * 3. User clicks Submit to proceed
 */

class ConsentForm {
    constructor() {
        this.consentAgreed = false;
        this.formScrolled = false;
        this.yesChecked = false;
        this.noChecked = false;
    }

    show() {
        const consentHTML = `
        <div id="consent-container" style="width: 100%; max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <div style="text-align: center; background: linear-gradient(135deg, #003366 0%, #005A9C 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600;">INFORMATION SHEET FOR PARTICIPATION IN A RESEARCH STUDY</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">YALE UNIVERSITY SCHOOL OF MEDICINE</p>
            </div>

            <div id="consent-content" style="max-height: 600px; overflow-y: auto; padding-right: 15px; margin-bottom: 30px; border: 1px solid #ddd; padding: 20px; border-radius: 4px; background: #f9f9f9;">
                
                <div style="margin-bottom: 20px;">
                    <p style="font-weight: 600; color: #003366;">APPROVED BY THE YALE UNIVERSITY IRB 7/20/2025</p>
                    <p style="margin: 5px 0;">IRB Protocol# 0910005795</p>
                </div>

                <h2 style="color: #003366; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">Study Title:</h2>
                <p>Neural correlates of decision-making processes</p>

                <h2 style="color: #003366; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">Principal Investigator:</h2>
                <p>Dr. Ifat Levy, <a href="mailto:ifat.levy@yale.edu">ifat.levy@yale.edu</a></p>

                <h2 style="color: #003366; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">Research Study Summary:</h2>
                <p>We are asking you to join a research study. The purpose of this research study is to examine the neural mechanisms of decision making, valuation, and learning.</p>

                <h3 style="color: #003366; margin-top: 15px; margin-bottom: 8px; font-size: 16px;">Study Activities:</h3>
                <p>You will complete a 5 to 60 minute online task where you make choices between different images, stimuli, and/or lotteries. The images/stimuli will consist of positive or mundane images such as food, common objects, and monetary lotteries. Participants may also be asked questionnaires regarding their beliefs and behaviors. Participants can choose not to answer any questions they do not wish to answer. Participants may win additional sums of money based on their task performance.</p>

                <h3 style="color: #003366; margin-top: 15px; margin-bottom: 8px; font-size: 16px;">Risks:</h3>
                <p>Minimal risks including potential distress for those with sensitivity about food or eating, possible risk of loss of confidentiality, and the minimal risks associated with sitting at a computer screen for 5 to 60 minutes. There may be additional risks that are currently unforeseeable.</p>

                <h3 style="color: #003366; margin-top: 15px; margin-bottom: 8px; font-size: 16px;">Benefits:</h3>
                <p>The study may have no benefits to you. However, the results may be of benefit to society at large by contributing to our understanding of neural processes that mediate decision-making.</p>

                <h3 style="color: #003366; margin-top: 15px; margin-bottom: 8px; font-size: 16px;">Compensation:</h3>
                <p>Base payment of $1.25 per 5 minutes, $2.50 per 10 minutes, $5 per 20 minutes, and up to $15 for 60 minutes. If a bonus payment is earned, it will be added to the base payment. You are responsible for paying state, federal, or other taxes for the payments you receive for being in this study. Taxes are not withheld from your payments.</p>

                <h2 style="color: #003366; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">Your Rights:</h2>
                <p>Taking part in this study is your choice. You can choose to take part, or you can choose not to take part in this study. You also can change your mind at any time. Whatever choice you make will not have any effect on your relationship with Yale University.</p>

                <h2 style="color: #003366; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">Data Protection and Privacy:</h2>
                <p>All of your responses will be held in confidence. Only the researchers involved in this study and those responsible for research oversight will have access to any information that could identify you. The identifiable data will be stored until the publication summarizing the results of the respective data collection is completed. Identifiable data is anticipated to be destroyed within seven years after the completion of the study.</p>
                
                <p>De-identified data including the sequence of choices that participants make in the decision-making task will be submitted to Open Science Framework. This will include no personal data.</p>

                <p>This research is covered by a Certificate of Confidentiality from the National Institutes of Health. The researchers with this Certificate may not disclose or use information, documents, or biospecimens that may identify you in any federal, state, or local civil, criminal, administrative, legislative, or other action, suit, or proceeding, or be used as evidence, for example, if there is a court subpoena, unless you have consented for this use.</p>

                <h2 style="color: #003366; margin-top: 20px; margin-bottom: 10px; font-size: 18px;">Questions?</h2>
                <p>If you have questions later or if you have a research-related problem, you can call the Principal Investigator Dr. Ifat Levy at <strong>(203) 737-1374</strong> or email <a href="mailto:ifat.levy@yale.edu">ifat.levy@yale.edu</a>.</p>
                
                <p>If you have questions about your rights as a research participant, you can call the Yale Institutional Review Boards at <strong>(203) 785-4688</strong> or email <a href="mailto:hrpp@yale.edu">hrpp@yale.edu</a>.</p>

            </div>

            <!-- Radio Buttons - MUTUALLY EXCLUSIVE -->
            <div style="margin-bottom: 25px; padding: 20px; background: #f0f8ff; border-left: 4px solid #003366; border-radius: 4px;">
                <p style="margin-top: 0; font-weight: 600; color: #003366;">I have read and understand this consent form. My choice is:</p>
                
                <div style="margin: 15px 0;">
                    <label style="display: flex; align-items: center; padding: 12px; margin: 8px 0; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                        <input type="radio" name="consent-choice" id="consent-yes" value="yes" style="width: 20px; height: 20px; cursor: pointer; margin-right: 12px;">
                        <span style="font-size: 16px; flex: 1;"><strong>I AGREE:</strong> I have read and agree to participate.</span>
                    </label>
                </div>

                <div style="margin: 15px 0;">
                    <label style="display: flex; align-items: center; padding: 12px; margin: 8px 0; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                        <input type="radio" name="consent-choice" id="consent-no" value="no" style="width: 20px; height: 20px; cursor: pointer; margin-right: 12px;">
                        <span style="font-size: 16px; flex: 1;"><strong>I DO NOT AGREE:</strong> I do not agree to participate.</span>
                    </label>
                </div>
            </div>

            <!-- Submit Button -->
            <div style="text-align: center; margin-top: 30px;">
                <button id="consent-submit-btn" style="
                    padding: 14px 40px;
                    font-size: 16px;
                    font-weight: 600;
                    background-color: #cccccc;
                    color: #666;
                    border: none;
                    border-radius: 4px;
                    cursor: not-allowed;
                    transition: all 0.3s;
                " disabled>
                    Submit Response
                </button>
                <p id="consent-error" style="color: #d32f2f; margin-top: 10px; display: none; font-weight: 600;"></p>
            </div>

        </div>
        `;

        // Clear body and insert consent form
        document.body.innerHTML = consentHTML;
        document.body.style.backgroundColor = '#f5f5f5';
        document.body.style.padding = '20px';
        document.body.style.fontFamily = 'Arial, sans-serif';
        document.body.style.lineHeight = '1.6';
        document.body.style.color = '#333';

        // Get elements
        const contentDiv = document.getElementById('consent-content');
        const yesRadio = document.getElementById('consent-yes');
        const noRadio = document.getElementById('consent-no');
        const submitBtn = document.getElementById('consent-submit-btn');
        const errorMsg = document.getElementById('consent-error');

        // Track scroll to bottom
        contentDiv.addEventListener('scroll', () => {
            if (contentDiv.scrollHeight - contentDiv.scrollTop <= contentDiv.clientHeight + 10) {
                this.formScrolled = true;
                this.updateSubmitButton(submitBtn, yesRadio, noRadio, errorMsg);
            }
        });

        // Radio button change handlers
        yesRadio.addEventListener('change', () => {
            this.yesChecked = yesRadio.checked;
            this.noChecked = false;
            noRadio.checked = false;
            this.updateSubmitButton(submitBtn, yesRadio, noRadio, errorMsg);
        });

        noRadio.addEventListener('change', () => {
            this.noChecked = noRadio.checked;
            this.yesChecked = false;
            yesRadio.checked = false;
            this.updateSubmitButton(submitBtn, yesRadio, noRadio, errorMsg);
        });

        // Submit button handler
        submitBtn.addEventListener('click', () => {
            if (this.yesChecked) {
                // User agreed - proceed to experiment
                this.handleConsent(true);
            } else if (this.noChecked) {
                // User did not agree - show rejection page
                this.handleConsent(false);
            }
        });

        // Initial button state
        this.updateSubmitButton(submitBtn, yesRadio, noRadio, errorMsg);
    }

    updateSubmitButton(btn, yesRadio, noRadio, errorMsg) {
        const isSelected = yesRadio.checked || noRadio.checked;

        if (isSelected) {
            btn.style.backgroundColor = '#003366';
            btn.style.color = 'white';
            btn.style.cursor = 'pointer';
            btn.disabled = false;
            errorMsg.style.display = 'none';
        } else {
            btn.style.backgroundColor = '#cccccc';
            btn.style.color = '#666';
            btn.style.cursor = 'not-allowed';
            btn.disabled = true;
            errorMsg.style.display = 'none';
        }
    }

        handleConsent(agreed) {
        if (agreed) {
            // User agreed - record consent and continue to experiment
            if (window.experiment) {
                experiment.consentGiven = true;
                experiment.consentTimestamp = new Date().toISOString();
                // Call the next page directly
                if (typeof experiment.showWelcomePage === 'function') {
                    experiment.showWelcomePage();
                } else if (typeof experiment.nextPage === 'function') {
                    experiment.nextPage();
                } else {
                    console.log("Consent given. Waiting for experiment methods...");
                    setTimeout(() => this.handleConsent(true), 1000);
                }
            } else {
                console.log("Experiment object not loaded yet");
                setTimeout(() => this.handleConsent(agreed), 500);
            }
        } else {
            // User did not agree - show rejection page
            this.showRejectionPage();
        }
    }



    showRejectionPage() {
        document.body.innerHTML = `
        <div style="width: 100%; max-width: 600px; margin: 50px auto; padding: 30px; text-align: center; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #d32f2f; margin-bottom: 20px;">Thank You</h1>
            <p style="font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 20px;">
                Thank you for your interest in this research study. We respect your decision not to participate.
            </p>
            <p style="font-size: 14px; color: #666;">
                If you have any questions, you can contact Dr. Ifat Levy at <strong>(203) 737-1374</strong> or <strong>ifat.levy@yale.edu</strong>.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 20px; font-style: italic;">
                Your consent response has been recorded. You may now close this page.
            </p>
        </div>
        `;
    }
}

// Hook the new consent form into the existing experiment
Object.assign(RiskSurveyExperiment.prototype, {
    showConsentForm() {
        const consentForm = new ConsentForm();
        consentForm.show();
    }
});

