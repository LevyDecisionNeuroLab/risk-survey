/**
 * DataExport.js - Consent tracking + IRB metadata
 * Works alongside DataCollector.js for trial data
 */

Object.assign(RiskSurveyExperiment.prototype, {
    
    initializeDataTracking() {
        this.consentData = {
            subjectId: this.subjectId || 'NO_ID',
            consent: {
                given: this.consentGiven || false,
                timestamp: new Date().toISOString(),
                consentVersion: 'Yale IRB Protocol 0910005795 v1.0',
                irbApprovalDate: '7/20/2025',
                irbProtocol: '0910005795'
            }
        };
        console.log('Consent tracking initialized. Given:', this.consentData.consent.given);
    },

    recordConsent(consentGiven) {
        this.consentData.consent.given = consentGiven;
        this.consentData.consent.timestamp = new Date().toISOString();
        console.log('Consent recorded:', consentGiven ? 'YES' : 'NO', 'at', this.consentData.consent.timestamp);
    },

    generateConsentReport() {
        let report = '';
        report += 'YALE UNIVERSITY - DECISION-MAKING STUDY\n';
        report += 'CONSENT RECORD\n';
        report += '==========================================\n\n';
        report += 'SUBJECT INFORMATION\n';
        report += 'Subject ID,' + this.consentData.subjectId + '\n\n';
        report += 'CONSENT DECISION (REQUIRED FOR IRB COMPLIANCE)\n';
        report += 'Consent Given,' + (this.consentData.consent.given ? 'YES' : 'NO') + '\n';
        report += 'Decision Timestamp,' + this.consentData.consent.timestamp + '\n';
        report += 'IRB Protocol Number,' + this.consentData.consent.irbProtocol + '\n';
        report += 'IRB Approval Date,' + this.consentData.consent.irbApprovalDate + '\n';
        report += 'Consent Document Version,' + this.consentData.consent.consentVersion + '\n\n';
        report += 'NOTES\n';
        report += 'This file records consent status. Trial-level data exported separately by DataCollector.js\n';
        return report;
    },

    downloadConsentReport() {
        const data = this.generateConsentReport();
        const filename = `consent_record_${this.consentData.subjectId}_${new Date().getTime()}.csv`;
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Consent report downloaded:', filename);
    }
});
