const http = require('http');

const options = {
  hostname: '152.42.209.167',
  port: 3000, // Or whatever the backend port is
  path: '/api/media/folders',
  method: 'GET'
};

// Or better, let's just grep the backend codebase for "id" in folder schema.
