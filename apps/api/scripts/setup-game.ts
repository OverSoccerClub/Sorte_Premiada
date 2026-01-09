
const fetch = require('node-fetch');

async function main() {
    const API_URL = 'http://localhost:3333';

    // 1. Login as Admin
    console.log("Logging in as admin...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    if (!loginRes.ok) {
        console.error("Login failed:", await loginRes.text());
        return;
    }

    const { access_token } = await loginRes.json();
    console.log("Logged in!");

    // 2. Create Game
    console.log("Creating 2x1000 Game...");
    const gameRes = await fetch(`${API_URL}/games`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
            name: '2x1000',
            rules: { numbers: 4, range: 10000 }
        })
    });

    if (gameRes.ok) {
        console.log("Game created successfully!");
    } else {
        console.error("Failed to create game:", await gameRes.text());
    }
}

main().catch(console.error);
