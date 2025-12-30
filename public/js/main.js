/**
 * main.js - Experiment Entry Point
 * 
 * This is the MAIN file that starts the entire Risk Survey Experiment.
 * It initializes the experiment when the page loads.
 * 
 * File Dependencies (loaded in this order):
 * 1. Experiment.js         - Core experiment class
 * 2. Pages.js              - UI pages (welcome, instructions)
 * 3. ComprehensionCheck.js - Check for user understanding of tasks
 * 4. TrialManager.js       - Trial generation and flow
 * 5. TrialRunner.js        - Individual trial execution
 * 6. DataCollector.js      - Data saving and export
 * 7. main.js               - THIS FILE (starts everything)
 */

// Initialize experiment when page loads
// Initialize experiment when page loads
window.experiment = new RiskSurveyExperiment();
document.addEventListener('DOMContentLoaded', () => {
    // Get Prolific ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    experiment.subjectId = urlParams.get('PROLIFIC_PID') || 'TEST_' + Math.random().toString(36).substr(2, 9);
    
    // Initialize data tracking
    experiment.initializeDataTracking();
    
    // Start with consent form
// Initialize experiment (loads config, generates trials, shows consent)
experiment.init();

});
; 
