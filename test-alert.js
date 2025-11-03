// Usar fetch nativo do Node.js 18+

async function testAlert() {
  try {
    const response = await fetch('https://jywjqzhqynhnhetidzsa.supabase.co/rest/v1/rpc/test_alert_system', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0'
      },
      body: JSON.stringify({
        alert_type: 'test',
        test_message: 'Teste após habilitar pg_net'
      })
    });

    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('✅ Teste bem-sucedido:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Erro no teste:', result);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAlert();