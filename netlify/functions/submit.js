/**
 * Netlify Function: Submit Questionnaire
 * Receives submission payload and sends email via Resend API
 */

export async function handler(event, context) {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Parse body
    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON payload' })
        };
    }

    // Validate required fields
    const required = ['submission_id', 'created_at', 'answers'];
    for (const field of required) {
        if (!payload[field]) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Missing required field: ${field}` })
            };
        }
    }

    // Get environment variables
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'brainstein@protonmail.com';
    const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Email service not configured' })
        };
    }

    // Format email content
    const emailSubject = `My Path Finder Submission - ${payload.submission_id.slice(0, 8)}`;
    const emailBody = `
New questionnaire submission received.

Submission ID: ${payload.submission_id}
Submitted At: ${payload.created_at}
Language: ${payload.language_used || 'en'}
Questions Answered: ${Object.keys(payload.answers || {}).length}

--- FULL PAYLOAD ---
${JSON.stringify(payload, null, 2)}
    `.trim();

    // Send email via Resend
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [RECIPIENT_EMAIL],
                subject: emailSubject,
                text: emailBody,
                attachments: [
                    {
                        filename: `submission-${payload.submission_id}.json`,
                        content: Buffer.from(JSON.stringify(payload, null, 2)).toString('base64')
                    }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend API error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to send email', details: error.message })
            };
        }

        const result = await response.json();
        console.log('Email sent successfully:', result.id);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                submission_id: payload.submission_id,
                email_id: result.id
            })
        };
    } catch (error) {
        console.error('Email send error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send email', details: error.message })
        };
    }
}
