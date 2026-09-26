import jwt from 'jsonwebtoken';

const token = jwt.sign({sub: '123', role: 'DOCTOR'}, 'replace-me-with-a-long-random-string');
fetch('http://localhost:4000/api/v1/webrtc/token/cmubgep2k0017nq2w0u4t1cov', {
  headers: {
    Authorization: `Bearer ${token}`
  }
}).then(res => res.json()).then(data => {
  console.log(data);
}).catch(console.error);
