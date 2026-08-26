// PM2 process config for the backend. On the VPS, from /var/www/sarnconnect/backend:
//   pm2 start ../deploy/ecosystem.config.js
//   pm2 save
//   pm2 startup   (run the command it prints, once, to survive reboots)
module.exports = {
  apps: [
    {
      name: 'sarnconnect-api',
      script: 'server.js',
      cwd: '/var/www/sarnconnect/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '400M',
      out_file: '/var/log/sarnconnect/api-out.log',
      error_file: '/var/log/sarnconnect/api-error.log',
      time: true,
    },
  ],
}
