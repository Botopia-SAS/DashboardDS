const localSSLProxy = require("local-ssl-proxy");

localSSLProxy({
  source: 3001, // Nuevo puerto HTTPS
  target: 3000, // Tu aplicación Next.js en HTTP
});
