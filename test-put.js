const http = require('http');

const payload = JSON.stringify({
  _rowIndex: 3, 
  employeeId: 'ADMIN-EDITED',
  email: 'admin@workeazi.com',
  password: 'admin123',
  role: 'admin',
  status: 'Active',
  permissions: 'Dashboard',
  originalCreatedAt: '2026-05-26T04:33:23.930Z'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admins',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', e => {
  console.error('Problem with request:', e.message);
});

req.write(payload);
req.end();
