module.exports = {
  apps: [
    {
      name: "webhook-manager-backend",
      cwd: "./packages/backend",
      script: "dist/main.js",
      exec_mode: "cluster",
      instances: "max",
      autorestart: true,
      max_memory_restart: "300M",
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss.SSS Z",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],

  deploy: {
    production: {
      user: "node",
      host: "your.server.com",
      ref: "origin/main",
      repo: "git@github.com:your-org/webhook-manager.git",
      path: "/var/www/webhook-manager",
      "post-deploy":
        "npm ci && npm --prefix packages/backend run build && pm2 startOrReload ecosystem.config.js --env production && pm2 install pm2-logrotate || true && pm2 set pm2-logrotate:max_size 10M && pm2 set pm2-logrotate:retain 7 && pm2 set pm2-logrotate:compress true && pm2 save",
    },
  },
};

