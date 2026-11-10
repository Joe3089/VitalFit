/**
 * Script para enviar notificaciones push usando FCM (Firebase Cloud Messaging)
 *
 * Uso:
 * 1. Obtén tu FCM Server Key de Firebase Console
 * 2. node scripts/send-fcm-notification.js YOUR_FCM_TOKEN
 *
 * El Server Key lo encuentras en:
 * Firebase Console > Project Settings > Cloud Messaging > Server Key
 */

const FCM_SERVER_KEY = 'PASTE_YOUR_FCM_SERVER_KEY_HERE';

async function sendFCMNotification(fcmToken) {
  if (!fcmToken) {
    console.error('Error: Debes proporcionar el FCM token');
    console.log('\nUso: node scripts/send-fcm-notification.js YOUR_FCM_TOKEN');
    console.log('\nEl FCM token lo encuentras en la consola de tu app cuando haces login');
    console.log('Busca la línea que dice: "Device Push Token (FCM/APNs):"');
    process.exit(1);
  }

  if (FCM_SERVER_KEY === 'PASTE_YOUR_FCM_SERVER_KEY_HERE') {
    console.error('Error: Debes configurar FCM_SERVER_KEY en este archivo');
    console.log('\nPara obtener el Server Key:');
    console.log('1. Ve a https://console.firebase.google.com');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a Project Settings (ícono de engranaje)');
    console.log('4. Pestaña "Cloud Messaging"');
    console.log('5. Copia el "Server Key"');
    console.log('6. Pégalo en la línea 11 de este archivo');
    process.exit(1);
  }

  const message = {
    to: fcmToken,
    notification: {
      title: 'Notificación de prueba',
      body: 'Esta es una notificación enviada usando FCM nativo',
      sound: 'default',
    },
    priority: 'high',
    data: {
      type: 'test',
      timestamp: new Date().toISOString(),
    },
  };

  console.log('\n Enviando notificación FCM...');
  console.log('Token:', fcmToken.substring(0, 20) + '...');

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Notificación enviada exitosamente!');
      console.log('Respuesta:', JSON.stringify(data, null, 2));
    } else {
      console.error('Error al enviar notificación');
      console.error('Status:', response.status);
      console.error('Respuesta:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Ejecutar
const fcmToken = process.argv[2];
sendFCMNotification(fcmToken);
