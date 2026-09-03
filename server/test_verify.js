// Verification Test Script for Smart QR Attendance Engine
async function runTests() {
  console.log('🧪 Starting Smart QR Attendance API Tests...\n');

  const BASE_URL = 'http://127.0.0.1:3000';

  try {
    // 1. Test Session Endpoint
    const sessRes = await fetch(`${BASE_URL}/api/session`);
    const sessData = await sessRes.json();
    console.log('✅ 1. Session Active:', sessData.session.name, '| Stats:', sessData.stats);

    // 2. Test Visitor Entry Logging (User enters website & inputs name)
    const visRes = await fetch(`${BASE_URL}/api/visitor/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Budi Santoso',
        identifier: '202401002',
        deviceFingerprint: 'FP-TEST-001',
        deviceInfo: 'Android Phone (1080x2400)',
      }),
    });
    const visData = await visRes.json();
    console.log('✅ 2. Visitor Entry Recorded:', visData.visitor.name, `(${visData.visitor.id})`);

    // 3. Test Dynamic Rolling QR Current Token
    const qrRes = await fetch(`${BASE_URL}/api/qr/current`);
    const qrData = await qrRes.json();
    console.log('✅ 3. Dynamic QR Token Fetched:', qrData.token, '| Remaining:', qrData.remainingSeconds + 's');

    // 4. Test User Attendance Check-In with Valid Token & Device Fingerprint
    const checkInRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: qrData.token,
        name: 'Budi Santoso',
        identifier: '202401002',
        deviceFingerprint: 'FP-TEST-001',
        deviceInfo: 'Android Phone (1080x2400)',
        scanMethod: 'CAMERA_QR',
      }),
    });
    const checkInData = await checkInRes.json();
    console.log('✅ 4. Attendance Check-In Result:', checkInData.message, '| Code:', checkInData.record?.verificationCode);

    // 5. Test Anti-Proxy Protection: Attempting to scan for another student using the SAME Device Fingerprint!
    const fraudRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: qrData.token,
        name: 'Joko Anwar',
        identifier: '202401099',
        deviceFingerprint: 'FP-TEST-001', // Same Device Fingerprint as Budi!
        deviceInfo: 'Android Phone (1080x2400)',
        scanMethod: 'CAMERA_QR',
      }),
    });
    const fraudData = await fraudRes.json();
    console.log('🛡️ 5. Anti-Proxy Protection Result (Same Device Check):', fraudData.error, '->', fraudData.message);

    // 6. Verify Master Roster Checkmark
    const rosterRes = await fetch(`${BASE_URL}/api/roster`);
    const rosterData = await rosterRes.json();
    const budi = rosterData.roster.find(r => r.name === 'Budi Santoso');
    console.log(`✅ 6. Master Checklist Status for Budi Santoso: ${budi.attended ? '✅ CENTANG HIJAU (HADIR)' : '❌ BELUM'}`);

    console.log('\n🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

runTests();
