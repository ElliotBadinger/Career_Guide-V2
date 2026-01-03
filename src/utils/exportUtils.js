/**
 * Export Utilities
 * Handle PDF generation, clipboard copy, and JSON download
 */

/**
 * Generate a text summary of the report for clipboard/email
 * @param {Object} result - Scoring result
 * @param {Object} answers - User answers
 * @param {Object} reportTemplates - Report templates config
 * @param {string} language - Current language (en/zu)
 * @returns {string} - Plain text summary
 */
export function generateTextSummary(result, answers, reportTemplates, language = 'en') {
    const { recommendation, drivers, scores } = result;
    const pathData = reportTemplates.paths[recommendation];
    const actionChecklist = reportTemplates.actionChecklists[recommendation] || [];

    const driverMessages = drivers.map(driverKey => {
        const messages = reportTemplates.driverMessages[driverKey];
        return messages ? (messages[language] || messages.en) : driverKey;
    });

    let summary = `
═══════════════════════════════════════
      MY PATH FINDER - CAREER REPORT
═══════════════════════════════════════

${pathData.icon} RECOMMENDATION: ${language === 'zu' ? 'Isiphakamiso' : 'Recommended Path'}
${pathData.title.replace('i18n:', '')}

${pathData.details.whatItMeans}

───────────────────────────────────────
WHY THIS PATH:
${driverMessages.map(m => `• ${m}`).join('\n')}

───────────────────────────────────────
10-DAY ACTION PLAN:
${actionChecklist.map(item => `Day ${item.day}: ${item.action}`).join('\n')}

───────────────────────────────────────
SCORES:
• Academic Readiness: ${scores.academicReadiness}/100
• Practical Preference: ${scores.practicalPreference}/100
• Support Need: ${scores.supportNeed}/100
• Constraint Load: ${scores.constraintLoad}/100
• Wellbeing Flag: ${scores.wellbeingFlag}/100

───────────────────────────────────────
RESOURCES:
${pathData.resources.map(r => `• ${r.name}: ${r.url}`).join('\n')}

───────────────────────────────────────
${reportTemplates.disclaimer[language] || reportTemplates.disclaimer.en}

Generated: ${new Date().toLocaleDateString()}
═══════════════════════════════════════
  `.trim();

    return summary;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Download answers as JSON file
 * @param {Object} answers - User answers
 * @param {Object} result - Scoring result
 */
export function downloadJson(answers, result) {
    const data = {
        exportedAt: new Date().toISOString(),
        answers,
        result
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `career-guide-answers-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate and download PDF report
 * Uses jsPDF library (needs to be installed)
 * @param {Object} result - Scoring result
 * @param {Object} answers - User answers
 * @param {Object} reportTemplates - Report templates config
 * @param {string} language - Current language
 */
export async function generatePdf(result, answers, reportTemplates, language = 'en') {
    // Dynamic import to reduce initial bundle size
    const { default: jsPDF } = await import('jspdf');

    const doc = new jsPDF();
    const { recommendation, drivers, scores } = result;
    const pathData = reportTemplates.paths[recommendation];
    const actionChecklist = reportTemplates.actionChecklists[recommendation] || [];

    const driverMessages = drivers.map(driverKey => {
        const messages = reportTemplates.driverMessages[driverKey];
        return messages ? (messages[language] || messages.en) : driverKey;
    });

    let y = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Helper to add text with word wrap
    const addText = (text, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);

        // Check if we need a new page
        if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
        }

        doc.text(lines, margin, y);
        y += lines.length * lineHeight + 3;
    };

    // Title
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('My Path Finder', margin, 25);
    doc.setFontSize(12);
    doc.text('Career Guidance Report', margin, 35);

    y = 55;
    doc.setTextColor(0, 0, 0);

    // Recommendation
    addText('RECOMMENDATION', 14, true);
    addText(pathData.title.replace('i18n:', ''), 16, true);
    y += 5;
    addText(pathData.details.whatItMeans, 10);

    // Why this path
    y += 5;
    addText('Why We Suggest This:', 12, true);
    driverMessages.forEach(msg => {
        addText(`• ${msg}`, 10);
    });

    // Scores
    y += 5;
    addText('Your Scores:', 12, true);
    addText(`Academic Readiness: ${scores.academicReadiness}/100`, 10);
    addText(`Practical Preference: ${scores.practicalPreference}/100`, 10);
    addText(`Support Need: ${scores.supportNeed}/100`, 10);
    addText(`Constraint Load: ${scores.constraintLoad}/100`, 10);

    // Action checklist
    y += 5;
    addText('10-Day Action Plan:', 12, true);
    actionChecklist.forEach(item => {
        addText(`Day ${item.day}: ${item.action}`, 10);
    });

    // Resources
    y += 5;
    addText('Helpful Resources:', 12, true);
    pathData.resources.forEach(resource => {
        addText(`${resource.name} - ${resource.url}`, 10);
    });

    // Disclaimer
    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const disclaimer = reportTemplates.disclaimer[language] || reportTemplates.disclaimer.en;
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2);
    doc.text(disclaimerLines, margin, y);

    // Footer
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, doc.internal.pageSize.getHeight() - 10);

    // Download
    doc.save(`career-guide-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
