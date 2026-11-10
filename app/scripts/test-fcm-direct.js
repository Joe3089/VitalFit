/**
 * Test script to send a direct FCM push notification
 *
 * Usage:
 * 1. Get your FCM Server Key from Firebase Console:
 *    Project Settings → Cloud Messaging → Server Key (Legacy)
 *
 * 2. Get your device token from the app logs
 *
 * 3. Run: node scripts/test-fcm-direct.js YOUR_DEVICE_TOKEN YOUR_SERVER_KEY
 */

const https = require('https');

const deviceToken = process.argv[2];
const serverKey = process.argv[3];

if (!deviceToken || !serverKey) {
    console.error('Usage: node test-fcm-direct.js DEVICE_TOKEN SERVER_KEY');
    process.exit(1);
}

const payload = JSON.stringify({
    to: deviceToken,
    notification: {
        title: "Test Push Notification",
        body: "If you see this, FCM is working correctly!",
        sound: "default"
    },
    data: {
        test: "true",
        timestamp: new Date().toISOString()
    },
    priority: "high"
});

const options = {
    hostname: 'fcm.googleapis.com',
    port: 443,
    path: '/fcm/send',
    method: 'POST',
    headers: {
        'Authorization': `key=${serverKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

console.log('═══════════════════════════════════════════════════════');
console.log('📤 SENDING TEST FCM NOTIFICATION');
console.log('Device Token:', deviceToken);
console.log('Server Key:', serverKey.substring(0, 20) + '...');
console.log('═══════════════════════════════════════════════════════');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📥 FCM RESPONSE');
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
        console.log('═══════════════════════════════════════════════════════');

        const response = JSON.parse(data);

        if (response.success === 1) {
            console.log('\n✅ SUCCESS! Push notification sent successfully.');
            console.log('The notification should appear on your device.');
        } else if (response.failure === 1) {
            console.log('\n❌ FAILED! FCM rejected the notification.');
            console.log('Error:', JSON.stringify(response.results, null, 2));

            if (response.results && response.results[0] && response.results[0].error) {
                const error = response.results[0].error;
                console.log('\nPossible causes:');
                if (error === 'InvalidRegistration') {
                    console.log('- Device token is invalid or malformed');
                } else if (error === 'NotRegistered') {
                    console.log('- Device token is no longer valid (app uninstalled or token expired)');
                } else if (error === 'MismatchSenderId') {
                    console.log('- Server Key does not match the project that generated this token');
                } else {
                    console.log(`- ${error}`);
                }
            }
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ REQUEST FAILED');
    console.error(error);
});

req.write(payload);
req.end();
