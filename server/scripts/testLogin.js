async function run() {
  try {
    const res = await fetch('https://rentease-steel-nine.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rentease.com', password: 'AdminPass123!' })
    });

    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('ERROR', err.message || err);
  }
}

run();
