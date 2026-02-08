/**
 * DataCollector.js - Data Collection and Export
 * Handles saving trial data, CSV generation, and finishing the experiment
 */

// Add data collection methods to the RiskSurveyExperiment class
Object.assign(RiskSurveyExperiment.prototype, {
    
    // =====================================================
    // CONFIGURATION - UPDATE THIS TO YOUR SERVER URL
    // =====================================================
    SERVER_URL: 'https://risk-survey-7kcw.onrender.com',
    
    saveTrialData(trial) {
        const submitTime = (Date.now() - this.trialStartTime) / 1000;
        
        // Ensure choice is a proper string value
        let choiceValue = 'timeout'; // Default if no choice made
        if (this.currentChoice === 'risk' || this.currentChoice === 'safe') {
            choiceValue = this.currentChoice;
        }
        
        // Set confidence to NaN if slider wasn't interacted with
        let confidenceValue = this.sliderInteracted && this.currentConfidence !== null ? this.currentConfidence : NaN;
        
        // Calculate intuitive timing metrics
        const bar_choice_time = this.barChoiceTime || NaN; // Time from page load to bar choice
        const confidence_choice_time = (this.barChoiceTime && submitTime) ? (submitTime - this.barChoiceTime) : NaN; // Time from bar choice to confidence
        
        // Determine positions
        const riskPosition = trial.risk_on_left ? 'left' : 'right';
        const safePosition = trial.risk_on_left ? 'right' : 'left';
        
        // Calculate expected value comparison
        const riskEV = (trial.risk_probability / 100) * trial.risk_reward;
        const safeEV = trial.safe_reward;
        let ev;
        if (Math.abs(riskEV - safeEV) < 0.01) { // essentially equal
            ev = 'same';
        } else if (safeEV > riskEV) {
            ev = 'safe';
        } else {
            ev = 'risky';
        }
        
        // Create clean CSV row with intuitive field names
        const row = [
            this.subjectId || 'unknown',           // participant_id
            this.trialCounter++,                   // trial_number  
            trial.size_condition || 'unknown',    // bar_size_condition
            choiceValue,                           // choice (risk/safe/timeout)
            confidenceValue,                       // confidence (0-100 or NaN)
            trial.risk_probability || 0,          // risk_probability
            trial.risk_reward || 0,               // risk_reward  
            100,                                   // safe_probability (always 100%)
            trial.safe_reward || 0,               // safe_reward
            riskPosition,                          // risk_position (left/right)
            safePosition,                          // safe_position (left/right)
            ev,                                    // ev (same/safe/risky)
            bar_choice_time,                       // bar_choice_time (seconds from page load to bar choice)
            confidence_choice_time,                // confidence_choice_time (seconds from bar choice to confidence)
            trial.trial_id || 'unknown',          // trial_id
            'FALSE',                              // is_bonus_trial (will be updated after bonus calculation)
            ''                                    // bonus_amount (will be updated after bonus calculation)
        ];
        
        // Properly escape CSV fields
        const escapedRow = row.map(field => {
            const str = String(field);
            // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }).join(',') + '\n';
        
        this.csvData.push(escapedRow);
        
        // Store trial data for bonus calculation (only main trials, not practice)
        // trialCounter is already incremented, so current trial number is trialCounter - 1
        const completedEntry = {
            trial_number: this.trialCounter - 1,
            trial_id: trial.trial_id || 'unknown',
            choice: choiceValue,
            risk_probability: trial.risk_probability || 0,
            risk_reward: trial.risk_reward || 0,
            safe_reward: trial.safe_reward || 0
        };
        if (trial.combination_id != null) completedEntry.combination_id = trial.combination_id;
        this.completedTrials.push(completedEntry);
        
        // Also save to localStorage as backup
        this.saveBackupToLocalStorage();
        
        // Debug logging with clearer format
        console.log(`Trial ${this.trialCounter - 1}: choice="${choiceValue}", confidence=${confidenceValue}, ev=${ev}, bar_choice_time=${bar_choice_time}s, confidence_time=${confidence_choice_time}s`);
    },

    // Backup data to localStorage in case of network issues
    saveBackupToLocalStorage() {
        try {
            const backup = {
                subjectId: this.subjectId,
                csvData: this.csvData,
                attentionCheckData: this.attentionCheckData,
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId
            };
            localStorage.setItem(`risk_survey_backup_${this.subjectId}`, JSON.stringify(backup));
        } catch (e) {
            console.warn('Could not save backup to localStorage:', e);
        }
    },

    saveAttentionCheckData(question, userAnswer, isCorrect, responseTime) {
        const attentionCheckRow = {
            participant_id: this.subjectId || 'unknown',
            attention_check_number: this.attentionCheckData.length + 1,
            question_type: question.type,
            question_prompt: question.prompt,
            correct_answer: question.correct_answer,
            user_answer: userAnswer,
            is_correct: isCorrect,
            response_time: responseTime,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.attentionCheckData.push(attentionCheckRow);
        
        // Update backup
        this.saveBackupToLocalStorage();
        
        console.log(`Attention Check ${this.attentionCheckData.length}: ${isCorrect ? 'CORRECT' : 'INCORRECT'} - "${userAnswer}"`);
    },

    /**
     * Compute 18 indifference points from Phase 1 choices (IP study only).
     * For each combination_id: order trials by safe_reward (safe_level_1..7), find switch from Risk to Safe; IP = midpoint between last-risky and first-safe safe level.
     * Edge cases: always risky -> IP = lowest safe value (lower bound); always safe -> IP = highest safe value (upper bound).
     */
    computeIndifferencePoints() {
        if (!this.completedTrials.length || this.completedTrials.some(t => t.combination_id == null)) {
            return [];
        }
        const byCombo = {};
        this.completedTrials.forEach(t => {
            const cid = t.combination_id;
            if (!byCombo[cid]) byCombo[cid] = [];
            byCombo[cid].push({ safe_reward: t.safe_reward, choice: t.choice });
        });
        const results = [];
        for (let cid = 1; cid <= 18; cid++) {
            const trials = byCombo[cid] || [];
            if (trials.length === 0) {
                const firstTrial = this.completedTrials.find(t => t.combination_id === cid);
                results.push({ combination_id: cid, risk_reward: firstTrial?.risk_reward ?? null, risk_probability: firstTrial?.risk_probability ?? null, indifference_point: null, quality: 'missing' });
                continue;
            }
            trials.sort((a, b) => a.safe_reward - b.safe_reward);
            const safeAmounts = trials.map(t => t.safe_reward);
            const choices = trials.map(t => t.choice);
            let indifferencePoint;
            let quality = 'ok';
            const lastRiskIdx = choices.map((c, i) => c === 'risk' ? i : -1).filter(i => i >= 0).pop();
            const firstSafeIdx = choices.map((c, i) => c === 'safe' ? i : -1).find(i => i >= 0);
            if (lastRiskIdx == null && firstSafeIdx == null) {
                indifferencePoint = (safeAmounts[0] + safeAmounts[safeAmounts.length - 1]) / 2;
                quality = 'no_switch';
            } else if (lastRiskIdx == null) {
                indifferencePoint = safeAmounts[safeAmounts.length - 1];
                quality = 'always_safe';
            } else if (firstSafeIdx == null) {
                indifferencePoint = safeAmounts[0];
                quality = 'always_risky';
            } else {
                const lastRiskSafe = safeAmounts[lastRiskIdx];
                const firstSafeSafe = safeAmounts[firstSafeIdx];
                indifferencePoint = (lastRiskSafe + firstSafeSafe) / 2;
            }
            const firstTrial = this.completedTrials.find(t => t.combination_id === cid);
            results.push({
                combination_id: cid,
                risk_reward: firstTrial ? firstTrial.risk_reward : null,
                risk_probability: firstTrial ? firstTrial.risk_probability : null,
                indifference_point: Math.round(indifferencePoint * 100) / 100,
                quality
            });
        }
        this.indifferencePoints = results;
        return results;
    },

    // Wake up the server before saving (Render free tier sleeps after 15 min)
    async wakeUpServer() {
        try {
            console.log('Waking up server...');
            const response = await fetch(`${this.SERVER_URL}/health`, {
                method: 'GET',
                cache: 'no-store'
            });
            if (response.ok) {
                console.log('Server is awake!');
                return true;
            }
        } catch (e) {
            console.log('Server wake-up ping sent');
        }
        // Wait a moment for server to fully wake up
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    },

    // Retry fetch with exponential backoff
    async fetchWithRetry(url, options, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Fetch attempt ${attempt}/${maxRetries} to ${url}`);
                
                // Create timeout using AbortController for better browser compatibility
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                try {
                    const response = await fetch(url, {
                        ...options,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        return response;
                    } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    throw fetchError;
                }
            } catch (error) {
                lastError = error;
                const errorMessage = error.name === 'AbortError' ? 'Request timeout' : error.message;
                console.warn(`Attempt ${attempt} failed:`, errorMessage);
                
                if (attempt < maxRetries) {
                    // Exponential backoff: 2s, 4s, 8s
                    const waitTime = Math.pow(2, attempt) * 1000;
                    console.log(`Waiting ${waitTime/1000}s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    
                    // Try to wake up server before retry
                    await this.wakeUpServer();
                }
            }
        }
        
        throw lastError;
    },

    async finishExperiment() {
        // Validate data before attempting to save
        if (!this.csvData || this.csvData.length === 0) {
            console.error('No data to save!');
            this.showDataError('No trial data was collected. Please contact the researcher.');
            return;
        }

        if (!this.subjectId) {
            console.error('No subject ID!');
            this.showDataError('Subject ID is missing. Please contact the researcher.');
            return;
        }

        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Completing the experiment...</h2>
                    <p>Please wait while your data is being saved.</p>
                    <div id="save-status" style="margin-top: 1rem; color: #666;">
                        <small>Preparing to save ${this.csvData.length} trial records for subject ${this.subjectId}...</small>
                    </div>
                </div>
            </div>`;

        const updateStatus = (message) => {
            const statusEl = document.getElementById('save-status');
            if (statusEl) {
                statusEl.innerHTML = `<small>${message}</small>`;
            }
        };

        try {
            console.log(`Attempting to save ${this.csvData.length} trials for subject ${this.subjectId}`);
            console.log('Sample data row:', this.csvData[0]);

            // First, wake up the server (Render free tier may be sleeping)
            updateStatus('Connecting to server...');
            await this.wakeUpServer();

            // Save main trial data with retry
            updateStatus('Saving trial data...');
            // IP Study Phase 2: Phase 1 was already saved (126 rows); send only Phase 2 rows (84) to avoid duplicating Phase 1
            const dataToSave = (this.studyType === 'ip' && this.phase2Active && this.phase1RowCount > 0)
                ? this.csvData.slice(this.phase1RowCount).join('')
                : this.csvData.join('');
            const trialResponse = await this.fetchWithRetry(
                `${this.SERVER_URL}/save`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data: dataToSave }),
                }
            );

            console.log('Trial data saved successfully', this.phase2Active ? `(Phase 2 only: ${this.csvData.length - this.phase1RowCount} rows)` : '');

            // Save attention check data (skip if none, e.g. IP study)
            if (this.attentionCheckData && this.attentionCheckData.length > 0) {
                updateStatus('Saving attention check data...');
                await this.fetchWithRetry(
                    `${this.SERVER_URL}/save-attention`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ participantId: this.subjectId, data: this.attentionCheckData }),
                    }
                );
                console.log('Attention check data saved successfully');
            }

            // Clear backup since save was successful
            try {
                localStorage.removeItem(`risk_survey_backup_${this.subjectId}`);
            } catch (e) {}

            // Indifference Point study: Phase 2 complete (no bonus, no IP recompute)
            if (this.studyType === 'ip' && this.phase2Active) {
                console.log('[IP Study] Phase 2 complete. Total trials saved:', this.csvData.length);
                this.showIPPhase2CompletePage();
                return;
            }

            // Indifference Point study: Phase 1 complete – compute 18 IPs and show Phase 1 page (no bonus)
            if (this.studyType === 'ip') {
                this.phase1RowCount = this.csvData.length; // so Phase 2 completion saves only new rows
                const ips = this.computeIndifferencePoints();
                console.log('[IP Study] Computed 18 indifference points:', ips);
                this.showIPPhase1CompletePage();
                return;
            }

            // Risk-survey study: bonus calculation and payment
            console.log('\n🎲 Starting bonus calculation...');
            const bonusResult = this.calculateBonus();
            this.bonus = bonusResult.bonus;
            this.selectedTrialForBonus = bonusResult.selectedTrial;
            this.bonusResult = bonusResult;
            
            console.log(`✅ Final Bonus: $${this.bonus.toFixed(2)}`);
            console.log(`📊 Bonus Result Summary:`, bonusResult);

            this.updateBonusColumnsInCSV(bonusResult);

            updateStatus('Saving bonus payment data...');
            await this.saveBonusPaymentData(bonusResult);

            this.showDownloadPage();

        } catch (err) {
            console.error('Error saving data:', err);
            
            // Provide more helpful error messages
            let errorMessage = err.message || 'Unknown error';
            if (err.name === 'AbortError' || errorMessage.includes('timeout')) {
                errorMessage = 'Request timed out - the server may be slow to respond. Please try again.';
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                errorMessage = 'Network error - unable to reach the server. Please check your internet connection and try again.';
            } else if (errorMessage.includes('CORS')) {
                errorMessage = 'CORS error - the server may not be configured to accept requests from this origin.';
            }
            
            this.showDataError(`There was an error saving your data: ${errorMessage}`);
        }
    },

    showDownloadPage() {
        let bonusDisplay = '';
        
        if (this.bonus !== null && this.bonusResult && this.selectedTrialForBonus) {
            const trial = this.selectedTrialForBonus;
            const bonusResult = this.bonusResult;
            
            // Determine if it's a hundreds or millions trial
            const isMillions = trial.risk_reward >= 500000 || trial.safe_reward >= 500000;
            const conversionFactor = isMillions ? 500000 : 50;
            const scaleType = isMillions ? 'millions' : 'hundreds';
            
            // Format lottery option description
            const lotteryProb = trial.risk_probability;
            const lotteryWinProb = lotteryProb;
            const lotteryLoseProb = 100 - lotteryProb;
            const lotteryOptionText = `Lottery option: ${lotteryWinProb}% chance to win ${trial.risk_reward} points; ${lotteryLoseProb}% chance to win 0 points`;
            
            // Format guaranteed outcome description
            const guaranteedOptionText = `Guaranteed outcome: ${trial.safe_reward} points (100% chance)`;
            
            // Determine choice made
            const choiceMade = trial.choice === 'risk' ? 'Lottery' : 'Guaranteed outcome';
            
            // Determine outcome
            let outcomeText = '';
            let pointsWon = 0;
            if (trial.choice === 'safe') {
                pointsWon = trial.safe_reward;
                outcomeText = `Won ${pointsWon} points`;
            } else if (trial.choice === 'risk') {
                if (bonusResult.win) {
                    pointsWon = trial.risk_reward;
                    outcomeText = `Won ${pointsWon} points`;
                } else {
                    pointsWon = 0;
                    outcomeText = `Won 0 points`;
                }
            }
            
            // Format conversion
            const conversionText = pointsWon > 0 
                ? `${pointsWon} ÷ ${conversionFactor} = $${this.bonus.toFixed(2)}`
                : `$0.00`;
            
            bonusDisplay = `
                <div style="margin-top: 2rem; padding: 1.5rem; border: 1px solid #e5e5e5; border-radius: 4px; background: #fafafa;">
                    <h3 style="margin: 0 0 1.5rem 0; font-size: 1.3rem; font-weight: 600; color: var(--text-primary);">💸 Bonus Breakdown (Trial ${trial.trial_number})</h3>
                    
                    <div style="margin-bottom: 1rem; text-align: left;">
                        <div style="margin-bottom: 0.75rem; font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
                            <strong>${lotteryOptionText}</strong>
                        </div>
                        <div style="margin-bottom: 0.75rem; font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
                            <strong>${guaranteedOptionText}</strong>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem; padding-top: 1rem; border-top: 1px solid #e5e5e5;">
                        <div style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--text-primary);">
                            <strong>Your choice:</strong> ${choiceMade}
                        </div>
                        <div style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--text-primary);">
                            <strong>Outcome:</strong> ${outcomeText}
                        </div>
                    </div>
                    
                    <div style="padding-top: 1rem; border-top: 1px solid #e5e5e5;">
                        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
                            Final Bonus: $${this.bonus.toFixed(2)}
                        </div>
                        <div style="font-size: 0.95rem; color: var(--text-secondary);">
                            Point-to-$ conversion: ${conversionText}
                        </div>
                    </div>
                </div>
            `;
        }
        
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Thank You!</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fafafa;">
                        <p style="font-size: 18px; margin-bottom: 1rem;">You have successfully completed the decision-making task.</p>
                        <p style="color: green; font-weight: bold; margin-bottom: 2rem;">✓ Your responses have been successfully saved.</p>
                        
                        ${bonusDisplay}
                        
                        <div style="margin-top: 1rem; color: #666; font-size: 14px;">
                            <small>Subject ID: ${this.subjectId} | Trials completed: ${this.csvData.length} | Attention checks: ${this.attentionCheckData.length}</small>
                        </div>
                    </div>
                    <p>You may now close this window.</p>
                </div>
            </div>`;
    },

    /**
     * Indifference Point study: show Phase 1 complete with 18 IPs and optional CSV download.
     */
    showIPPhase1CompletePage() {
        const ips = this.indifferencePoints || [];
        const tableRows = ips.map(row => `
            <tr>
                <td>${row.combination_id}</td>
                <td>${row.risk_reward}</td>
                <td>${row.risk_probability}%</td>
                <td>${row.indifference_point}</td>
                <td>${row.quality}</td>
            </tr>
        `).join('');

        const ipCsvHeader = 'participant_id,combination_id,risk_reward,risk_probability,indifference_point,quality\n';
        const ipCsvRows = ips.map(row => 
            [this.subjectId, row.combination_id, row.risk_reward, row.risk_probability, row.indifference_point, row.quality].join(',')
        ).join('\n');
        const ipCsvContent = ipCsvHeader + ipCsvRows;
        const ipCsvBlob = new Blob([ipCsvContent], { type: 'text/csv' });
        const ipCsvUrl = URL.createObjectURL(ipCsvBlob);

        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Phase 1 Complete</h2>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
                        Thank you. Your trial data has been saved and 18 indifference points have been computed.
                    </p>
                    <p style="color: green; font-weight: bold; margin-bottom: 1.5rem;">✓ Your responses have been successfully saved.</p>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.75rem;">Indifference points (18 lotteries)</h3>
                    <div style="overflow-x: auto; margin: 1rem 0; border: 1px solid #e5e5e5; border-radius: 4px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #f5f5f5;">
                                    <th style="padding: 8px; text-align: left;">Lottery</th>
                                    <th style="padding: 8px; text-align: left;">Risk amount</th>
                                    <th style="padding: 8px; text-align: left;">Prob %</th>
                                    <th style="padding: 8px; text-align: left;">Indifference point</th>
                                    <th style="padding: 8px; text-align: left;">Quality</th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </div>
                    <p style="margin-top: 1.5rem;">
                        <a href="${ipCsvUrl}" download="indifference_points_${this.subjectId || 'participant'}.csv" 
                           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">
                            Download indifference points (CSV)
                        </a>
                    </p>
                    <p style="margin-top: 2rem; color: #666; font-size: 0.95rem;">
                        Subject ID: ${this.subjectId} | Trials: ${this.csvData.length}
                    </p>
                    <p style="margin-top: 1.5rem;">
                        <button id="continue-phase2-btn" class="next-button" style="padding: 12px 24px; font-size: 1rem;">
                            Continue to Phase 2 (72 trials)
                        </button>
                    </p>
                </div>
            </div>`;
        const phase2Btn = document.getElementById('continue-phase2-btn');
        if (phase2Btn) {
            phase2Btn.addEventListener('click', () => { this.startPhase2(); });
        }
    },

    /**
     * IP Study: start Phase 2 (size manipulation at individual IPs). Builds 72 trials from template + IPs, then runs them.
     */
    async startPhase2() {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Phase 2 – Size at Your Indifference Points</h2>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
                        You will now complete 72 more trials. Each trial will show the same type of choice, but the <strong>visual size</strong> of the options will sometimes change (small vs large).
                    </p>
                    <p style="font-size: 1rem; color: var(--text-primary); margin-bottom: 2rem;">
                        The safe amount in each trial is set to your own indifference point from Phase 1, so choices are around 50/50. We are testing whether the size of the options affects your choices.
                    </p>
                    <p style="font-size: 0.95rem; color: #666;">6 seconds per choice. The screen will go fullscreen.</p>
                    <button id="begin-phase2-btn" class="next-button">Begin Phase 2</button>
                </div>
            </div>`;
        document.getElementById('begin-phase2-btn').addEventListener('click', async () => {
            try {
                const phase2Trials = await this.generatePhase2Trials(this.indifferencePoints);
                if (!phase2Trials.length) {
                    this.showError('Could not build Phase 2 trials. Need 18 indifference points.');
                    return;
                }
                this.phase2Active = true;
                this.currentTrialIndex = 0;
                this.currentTimeline = phase2Trials;
                this.isPractice = false;
                if (document.fullscreenElement === null) {
                    document.documentElement.requestFullscreen().then(() => {
                        this.runNextTrial();
                    });
                } else {
                    this.runNextTrial();
                }
            } catch (e) {
                console.error('Phase 2 start error:', e);
                this.showError('Could not start Phase 2. ' + (e.message || ''));
            }
        });
    },

    /**
     * IP Study: show Phase 2 complete (size manipulation at IPs). Trial data (Phase 1 + Phase 2) already saved.
     */
    showIPPhase2CompletePage() {
        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Phase 2 Complete</h2>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
                        Thank you. You have completed both phases of the Indifference Point study.
                    </p>
                    <p style="color: green; font-weight: bold; margin-bottom: 1.5rem;">✓ Your responses have been successfully saved.</p>
                    <p style="font-size: 1rem; color: var(--text-primary); margin-bottom: 1rem;">
                        Phase 1: 126 calibration trials (18 indifference points).<br>
                        Phase 2: 84 trials (72 at your indifference points + 12 filler trials).
                    </p>
                    <p style="margin-top: 2rem; color: #666; font-size: 0.95rem;">
                        Subject ID: ${this.subjectId} | Total trials: ${this.csvData.length}
                    </p>
                    <p style="margin-top: 1rem;">You may now close this window.</p>
                </div>
            </div>`;
    },

    showDataError(message) {
        // Try to get backup data info
        let backupInfo = 'No backup available';
        try {
            const backup = localStorage.getItem(`risk_survey_backup_${this.subjectId}`);
            if (backup) {
                backupInfo = 'Backup saved in browser - please contact researcher';
            }
        } catch (e) {}

        document.body.innerHTML = `
            <div class="main-container">
                <div class="instructions">
                    <h2>Data Save Error</h2>
                    <div style="border: 1px solid #e5e5e5; padding: 2rem; border-radius: 4px; margin: 2rem 0; background: #fff2f2; color: #d32f2f; border-left: 4px solid #d32f2f;">
                        <p style="font-weight: bold; margin-bottom: 1rem;">⚠️ Unable to save your data</p>
                        <p>${message}</p>
                        <div style="margin-top: 1.5rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
                            <p style="font-weight: bold; margin-bottom: 0.5rem;">Debug Information:</p>
                            <p style="font-size: 12px; font-family: monospace; margin: 0;">
                                Subject ID: ${this.subjectId || 'MISSING'}<br>
                                Trials collected: ${this.csvData?.length || 0}<br>
                                Timestamp: ${new Date().toISOString()}<br>
                                Backup status: ${backupInfo}
                            </p>
                        </div>
                        <div style="margin-top: 1.5rem;">
                            <button onclick="experiment.retryDataSave()" style="background: #333; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px;">
                                🔄 Retry Save
                            </button>
                        </div>
                    </div>
                    <p>Please screenshot this message and contact the researcher immediately.</p>
                </div>
            </div>`;
    },

    // Allow participant to retry saving
    async retryDataSave() {
        await this.finishExperiment();
    },

    /**
     * Calculate bonus based on randomly selected trial
     * Returns an object with bonus details
     */
    calculateBonus() {
        console.log('=== BONUS CALCULATION START ===');
        console.log(`Total completed trials: ${this.completedTrials.length}`);
        
        // Get only main trials (trial_number 1-120) with valid choices
        const mainTrials = this.completedTrials.filter(t => 
            t.trial_number >= 1 && t.trial_number <= 120 && 
            (t.choice === 'risk' || t.choice === 'safe')
        );
        
        console.log(`Valid main trials (1-120): ${mainTrials.length}`);
        
        if (mainTrials.length === 0) {
            console.warn('No valid trials found for bonus calculation');
            return {
                bonus: 0,
                selectedTrial: null,
                reason: 'No valid trials found'
            };
        }
        
        // Randomly select one trial from 1-120
        const randomIndex = Math.floor(Math.random() * mainTrials.length);
        const selectedTrial = mainTrials[randomIndex];
        
        console.log(`\n--- RANDOM SELECTION ---`);
        console.log(`Random index: ${randomIndex} (out of ${mainTrials.length} valid trials)`);
        console.log(`Selected Trial Number: ${selectedTrial.trial_number}`);
        console.log(`Selected Trial Details:`, {
            choice: selectedTrial.choice,
            risk_probability: selectedTrial.risk_probability,
            risk_reward: selectedTrial.risk_reward,
            safe_reward: selectedTrial.safe_reward
        });
        
        let bonus = 0;
        let win = false;
        let rewardPoints = 0;
        
        if (selectedTrial.choice === 'safe') {
            console.log(`\n--- SAFE CHOICE CALCULATION ---`);
            rewardPoints = selectedTrial.safe_reward;
            console.log(`Choice: SAFE (guaranteed payout)`);
            console.log(`Safe reward points: ${rewardPoints}`);
            bonus = this.convertPointsToUSD(rewardPoints);
            console.log(`Conversion: ${rewardPoints} points → $${bonus.toFixed(2)}`);
            win = true;
        } else if (selectedTrial.choice === 'risk') {
            console.log(`\n--- RISK CHOICE CALCULATION ---`);
            const probability = selectedTrial.risk_probability; // e.g., 75, 50, or 25
            const randomRoll = Math.random() * 100; // 0-100
            
            console.log(`Choice: RISK (probabilistic)`);
            console.log(`Risk probability: ${probability}%`);
            console.log(`Risk reward points: ${selectedTrial.risk_reward}`);
            console.log(`Random roll: ${randomRoll.toFixed(2)}%`);
            
            if (randomRoll <= probability) {
                // Win - get the risk reward
                rewardPoints = selectedTrial.risk_reward;
                console.log(`✓ WIN! (${randomRoll.toFixed(2)}% <= ${probability}%)`);
                bonus = this.convertPointsToUSD(rewardPoints);
                console.log(`Conversion: ${rewardPoints} points → $${bonus.toFixed(2)}`);
                win = true;
            } else {
                // Lose - get $0
                console.log(`✗ LOSE! (${randomRoll.toFixed(2)}% > ${probability}%)`);
                bonus = 0;
                rewardPoints = 0;
                win = false;
                console.log(`Result: $0.00`);
            }
        }
        
        console.log(`\n--- FINAL RESULT ---`);
        console.log(`Bonus Amount: $${bonus.toFixed(2)}`);
        console.log(`Reward Points: ${rewardPoints}`);
        console.log(`Win Status: ${win ? 'YES' : 'NO'}`);
        console.log(`Selected Trial: ${selectedTrial.trial_number}`);
        console.log('=== BONUS CALCULATION END ===\n');
        
        return {
            bonus: bonus,
            selectedTrial: selectedTrial,
            win: win,
            rewardPoints: rewardPoints
        };
    },

    /**
     * Convert reward points to USD based on scale
     * Hundreds (100-600): divide by 50
     * Millions (500,000-1,500,000): divide by 500,000
     */
    convertPointsToUSD(points) {
        let conversionFactor;
        let scale;
        
        if (points >= 500000) {
            // Millions scale
            conversionFactor = 500000;
            scale = 'millions';
        } else {
            // Hundreds scale
            conversionFactor = 50;
            scale = 'hundreds';
        }
        
        const result = points / conversionFactor;
        console.log(`  [convertPointsToUSD] ${points} points (${scale} scale) / ${conversionFactor} = $${result.toFixed(2)}`);
        
        return result;
    },

    /**
     * Update CSV data to mark the bonus trial and add bonus amount
     */
    updateBonusColumnsInCSV(bonusResult) {
        if (!bonusResult.selectedTrial) {
            console.log('No bonus trial selected, skipping CSV update');
            return;
        }

        const bonusTrialNumber = bonusResult.selectedTrial.trial_number;
        const bonusAmount = bonusResult.bonus.toFixed(2);

        console.log(`Updating CSV data: marking trial ${bonusTrialNumber} as bonus trial with amount $${bonusAmount}`);

        // Update the CSV row for the bonus trial
        // CSV format: participant_id,trial_number,...,trial_id,is_bonus_trial,bonus_amount
        this.csvData = this.csvData.map((row, index) => {
            // Skip header row if present, or parse the row
            const values = row.trim().split(',').map(v => {
                // Remove quotes if present
                if (v.startsWith('"') && v.endsWith('"')) {
                    return v.slice(1, -1).replace(/""/g, '"');
                }
                return v;
            });

            // Check if this is the bonus trial (trial_number is at index 1)
            if (values.length > 1) {
                const trialNum = parseInt(values[1]);
                if (trialNum === bonusTrialNumber) {
                    // Update is_bonus_trial and bonus_amount columns
                    if (values.length >= 16) {
                        // Row already has bonus columns, update them
                        values[15] = 'TRUE'; // is_bonus_trial
                        values[16] = bonusAmount; // bonus_amount
                    } else {
                        // Add bonus columns if missing
                        while (values.length < 16) {
                            values.push('');
                        }
                        values[15] = 'TRUE';
                        values[16] = bonusAmount;
                    }
                    
                    // Re-escape and reconstruct the row
                    const escapedValues = values.map(field => {
                        const str = String(field);
                        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                            return '"' + str.replace(/"/g, '""') + '"';
                        }
                        return str;
                    });
                    return escapedValues.join(',') + '\n';
                }
            }
            return row;
        });

        console.log('CSV data updated with bonus information');
    },

    /**
     * Save bonus payment data to server
     */
    async saveBonusPaymentData(bonusResult) {
        if (!bonusResult.selectedTrial) {
            console.log('No bonus trial selected, skipping bonus payment save');
            return;
        }

        const bonusPaymentData = {
            participant_id: this.subjectId,
            bonus_trial_id: bonusResult.selectedTrial.trial_id || bonusResult.selectedTrial.trial_number,
            bonus_trial_number: bonusResult.selectedTrial.trial_number,
            choice_on_bonus: bonusResult.selectedTrial.choice,
            outcome_amount: bonusResult.bonus.toFixed(2),
            payment: 'pending', // Will be updated manually by researcher
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };

        try {
            const response = await this.fetchWithRetry(
                `${this.SERVER_URL}/save-bonus`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bonusPaymentData),
                }
            );

            console.log('Bonus payment data saved successfully');
        } catch (err) {
            console.error('Error saving bonus payment data:', err);
            // Don't throw - bonus payment data save failure shouldn't block completion
        }
    }
});
