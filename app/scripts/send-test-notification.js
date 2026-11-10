#!/usr/bin/env node

/**
 * Test script to send push notifications to your device
 *
 * Usage:
 *   node scripts/send-test-notification.js YOUR_EXPO_PUSH_TOKEN
 *
 * Example:
 *   node scripts/send-test-notification.js ExponentPushToken[xxxxxxxxxxxxxx]
 */

const https = require('https');

const pushToken = process.argv[2];

if (!pushToken) {
  console.error(' Error: Please provide your Expo Push Token');
  console.log('\nUsage:');
  console.log('  node scripts/send-test-notification.js YOUR_EXPO_PUSH_TOKEN');
  console.log('\nExample:');
  console.log('  node scripts/send-test-notification.js ExponentPushToken[xxxxxxxxxxxxxx]');
  console.log('\nYou can find your token in the app console logs or in the test screen.');
  process.exit(1);
}

const message = {
  to: pushToken,
  sound: 'default',
  title: 'VitalFit Test Notification',
  body: 'This is a test notification from your local script!',
  data: {
    screen: 'notifications',
    testId: Date.now(),
  },
};

const postData = JSON.stringify(message);

const options = {
  hostname: 'exp.host',
  port: 443,
  path: '/--/api/v2/push/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('📱 Sending test notification...');
console.log('Token:', pushToken);
console.log('Title:', message.title);
console.log('Body:', message.body);
console.log('');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.data && response.data.status === 'ok') {
        console.log('Notification sent successfully!');
        console.log('Receipt ID:', response.data.id);
        console.log('');
        console.log('Check your device for the notification.');
      } else if (response.data && response.data.status === 'error') {
        console.error('Failed to send notification');
        console.error('Error:', response.data.message);
        console.error('Details:', response.data.details);
      } else {
        console.log('Response:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error.message);
});

req.write(postData);
req.end();
