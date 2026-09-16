/**
 * Sothis Therapeutic Massage - HTML Newsletter Template Generator
 * Designed for the "5-second scan rule" and maximum mobile readability.
 */

export interface NewsletterTemplateProps {
    title: string;
    previewText?: string;
    body: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
    unsubscribeUrl?: string;
    siteUrl?: string;
}

export const DEFAULT_NEWSLETTER_HERO = 'https://mmqystevqgvgpfymfqzk.supabase.co/storage/v1/object/public/service-images/newsletter-hero-banner.jpg';
export const DEFAULT_NEWSLETTER_LOGO = 'https://mmqystevqgvgpfymfqzk.supabase.co/storage/v1/object/public/service-images/sothis-logo.jpg';

export function generateNewsletterHtml({
    title,
    previewText,
    body,
    imageUrl = DEFAULT_NEWSLETTER_HERO,
    ctaText = 'Chat with Nancy on WhatsApp',
    ctaUrl = 'https://sothistherapeutic.com/api/newsletter/cta',
    unsubscribeUrl = 'https://sothistherapeutic.com/newsletter/unsubscribe',
    siteUrl = 'https://sothistherapeutic.com'
}: NewsletterTemplateProps): string {
    // Format body text with paragraphs and line breaks
    const formattedBody = body
        .split('\n\n')
        .map(paragraph => {
            const trimmed = paragraph.trim();
            if (!trimmed) return '';
            if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                const listItems = trimmed
                    .split('\n')
                    .map(item => `<li style="margin-bottom: 8px; color: #44403c;">${item.replace(/^[•-]\s*/, '')}</li>`)
                    .join('');
                return `<ul style="padding-left: 20px; margin: 16px 0;">${listItems}</ul>`;
            }
            return `<p style="margin: 0 0 16px 0; color: #44403c; line-height: 1.7; font-size: 16px;">${trimmed.replace(/\n/g, '<br />')}</p>`;
        })
        .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
    <!--[if mso]>
    <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    
    ${previewText ? `
    <!-- Hidden Preview Text for Inbox -->
    <div style="display: none; font-size: 1px; color: #f5f5f4; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${previewText}
    </div>
    ` : ''}

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f4; padding: 24px 12px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e7e5e4;">
                    
                    <!-- Header / Masthead: Centered Circular Logo + SOTHIS THERAPEUTIC MASSAGE -->
                    <tr>
                        <td style="padding: 28px 32px 22px 32px; background-color: #ffffff; text-align: center; border-bottom: 1px solid #f5f5f4;">
                            <a href="${siteUrl}" style="text-decoration: none; display: inline-block; color: inherit;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; text-align: center;">
                                    <tr>
                                        <td align="center" style="padding-bottom: 10px;">
                                            <img
                                                src="${DEFAULT_NEWSLETTER_LOGO}"
                                                alt="Sothis Logo"
                                                width="64"
                                                height="64"
                                                style="display: block; width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #0d9488; margin: 0 auto; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #1c1917; line-height: 1.15;">
                                                SOTHIS
                                            </div>
                                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #0d9488; margin-top: 4px;">
                                                THERAPEUTIC MASSAGE
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </a>
                        </td>
                    </tr>

                    <!-- Hero Headline (5-Second Hook) -->
                    <tr>
                        <td style="padding: 32px 32px 16px 32px;">
                            <h1 style="font-family: Georgia, serif; font-size: 26px; line-height: 1.3; color: #1c1917; margin: 0; font-weight: 700;">
                                ${title}
                            </h1>
                            ${previewText ? `
                            <p style="font-size: 16px; color: #78716c; margin: 8px 0 0 0; line-height: 1.5;">
                                ${previewText}
                            </p>
                            ` : ''}
                        </td>
                    </tr>

                    <!-- Optional Hero Image -->
                    ${imageUrl ? `
                    <tr>
                        <td style="padding: 8px 32px 24px 32px;">
                            <img src="${imageUrl}" alt="${title}" width="100%" style="display: block; width: 100%; max-height: 320px; object-fit: cover; border-radius: 12px; border: 1px solid #e7e5e4;" />
                        </td>
                    </tr>
                    ` : ''}

                    <!-- Main Body Content (15-Second Insight) -->
                    <tr>
                        <td style="padding: ${imageUrl ? '0' : '16px'} 32px 24px 32px;">
                            <div style="font-size: 16px; line-height: 1.7; color: #44403c;">
                                ${formattedBody}
                            </div>
                        </td>
                    </tr>

                    <!-- Call To Action Button (The Conversion Focal Point) -->
                    <tr>
                        <td style="padding: 12px 32px 32px 32px; text-align: center;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #25D366; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; font-size: 16px; font-weight: 700; border-radius: 50px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35); text-align: center;">
                                            💬 ${ctaText}
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 14px;">
                                        <span style="font-size: 13px; color: #78716c;">
                                            Tap above to chat directly with Nancy · Or call <strong>(551) 241-4652</strong>
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Sign-off & Therapist Bio -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #fafaf9; border-top: 1px solid #f5f5f4;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="margin: 0; font-size: 15px; font-weight: 700; color: #292524;">
                                            To your wellness,
                                        </p>
                                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #57534e;">
                                            <strong>Nancy Raza, LMT</strong><br />
                                            Licensed Massage Therapist & Founder<br />
                                            <a href="${siteUrl}" style="color: #78716c; text-decoration: underline;">sothistherapeutic.com</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer & 1-Click Unsubscribe -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f5f5f4; text-align: center; border-top: 1px solid #e7e5e4;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #a8a29e; line-height: 1.5;">
                                Sothis Therapeutic Massage · Edgewater, NJ · (551) 241-4652<br />
                                You received this email because you are subscribed to our wellness newsletter.
                            </p>
                            <p style="margin: 0; font-size: 12px;">
                                <a href="${unsubscribeUrl}" style="color: #78716c; text-decoration: underline;">
                                    Unsubscribe from future newsletters
                                </a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}
