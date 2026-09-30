const http = require('http');

async function test() {
  try {
    // 1. Login to get token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@kostpay.id', password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    
    if (!loginData.accessToken) return;

    // 2. Fetch properties to get the ID
    const propsRes = await fetch('http://localhost:5000/api/properties', {
      headers: { 'Authorization': `Bearer ${loginData.accessToken}` }
    });
    const props = await propsRes.json();
    const propId = props[0].id;
    console.log('Target Property ID:', propId);

    // 3. Patch property with JSON
    const patchRes = await fetch(`http://localhost:5000/api/properties/${propId}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${loginData.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Kost Eksklusif Melati Baru',
        description: 'Test description',
        facilities: ['WiFi', 'AC'],
        photos: ['http://example.com/photo.jpg']
      })
    });
    
    const patchText = await patchRes.text();
    console.log('PATCH Status:', patchRes.status);
    console.log('PATCH Response:', patchText);

  } catch (e) {
    console.error('Script Error:', e);
  }
}

test();
