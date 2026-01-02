const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://pos-jogos-api.uawtgc.easypanel.host/company/settings';

https.get(API_URL, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const settings = JSON.parse(data);
            console.log('Company Name:', settings.companyName);
            console.log('Primary Color:', settings.primaryColor);

            if (settings.logoUrl && settings.logoUrl.startsWith('data:image')) {
                const base64Data = settings.logoUrl.split(';base64,').pop();
                const targetPath = path.join(__dirname, 'apps/mobile/assets/nova_logo-review.png');
                fs.writeFileSync(targetPath, base64Data, { encoding: 'base64' });
                console.log('Logo saved to:', targetPath);
            } else {
                console.log('No valid base64 logo found.');
            }

            // Save settings to a temp file for the PS script to read
            const infoPath = path.join(__dirname, 'apps/mobile/branding-info.json');
            fs.writeFileSync(infoPath, JSON.stringify({
                companyName: settings.companyName,
                primaryColor: settings.primaryColor
            }, null, 2));
            console.log('Branding info saved to:', infoPath);

        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
}).on('error', (err) => {
    console.error('Error fetching settings:', err.message);
});
