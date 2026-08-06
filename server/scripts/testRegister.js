async function run() {
  try {
    const payload = {
      name: 'Test User',
      email: 'testuser+automation@example.com',
      password: 'TestPass1!'
    };

    const res = await fetch('https://rentease-steel-nine.vercel.app/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('ERROR', err.message || err);
  }
}

run();
