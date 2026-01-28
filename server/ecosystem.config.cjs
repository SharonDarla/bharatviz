// PM2 Ecosystem Configuration for BharatViz API
// https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [{
    name: 'bharatviz-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',

    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      //ALLOWED_ORIGINS: 'http://bharatviz.saketlab.in,https://bharatviz.saketlab.in,http://localhost:8080,http://localhost:5173, https://colab.research.google.com/'
      ALLOWED_ORIGINS: '*',
      // Memory optimization: limit Node.js heap size
      NODE_OPTIONS: '--max-old-space-size=600 --optimize-for-size'
    },

    // Restart strategy - optimized for memory usage
    // With optimizations, peak usage is ~289 MB per request
    // Setting to 700M allows safe margin for concurrent requests
    max_memory_restart: '700M',
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,

    // Logs
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Advanced features
    time: true,
    watch: false,

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
