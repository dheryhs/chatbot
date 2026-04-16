require('dotenv').config({ path: '.env' });

const WAHA_BASE_URL = process.env.WAHA_BASE_URL || "https://waha-hhsjinfnlm3c.anakit.sumopod.my.id";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";

async function test() {
  const sessionName = `test_qr_${Date.now()}`;
  console.log(`Creating session: ${sessionName}`);
  
  await fetch(`${WAHA_BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { "X-Api-Key": WAHA_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ name: sessionName })
  });

  // Start it to be absolutely sure
  await fetch(`${WAHA_BASE_URL}/api/sessions/${sessionName}/start`, {
    method: 'POST',
    headers: { "X-Api-Key": WAHA_API_KEY }
  });

  console.log("Polling status...");
  for (let i = 0; i < 15; i++) {
    const stRes = await fetch(`${WAHA_BASE_URL}/api/sessions/${sessionName}`, {
      headers: { "X-Api-Key": WAHA_API_KEY }
    });
    const stData = await stRes.json();
    console.log(`Status at attempt ${i + 1}: ${stData.status}`);
    
    if (stData.status === 'SCAN_QR_CODE') {
      console.log(`Fetching QR for ${sessionName}...`);
      const qrRes = await fetch(`${WAHA_BASE_URL}/api/${sessionName}/auth/qr`, {
        headers: { "X-Api-Key": WAHA_API_KEY, "Accept": "application/json" }
      });
      const qrText = await qrRes.text();
      console.log(`QR Response Status: ${qrRes.status}`);
      console.log(`QR Response (first 100):`, qrText.substring(0, 100));
      break;
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }

  // Cleanup
  console.log(`Cleaning up...`);
  await fetch(`${WAHA_BASE_URL}/api/sessions/${sessionName}`, {
    method: 'DELETE',
    headers: { "X-Api-Key": WAHA_API_KEY }
  });
}

test().catch(console.error);
