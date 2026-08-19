/**
 * SAFAR — PM2 Ecosystem Configuration
 * Single-instance fork mode for SSE state compatibility.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production   (zero-downtime)
 *   pm2 logs safar-server
 *   pm2 monit
 */

module.exports = {
  apps: [{
    name: 'safar-server',
    script: './command-control-server/server.js',

    // Single instance — SSE state is in-memory, clustering would break fan-out
    instances: 1,
    exec_mode: 'fork',

    // Memory leak protection: restart if RSS exceeds 512MB
    max_memory_restart: '512M',

    // Environment-specific configuration
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Graceful shutdown: wait up to 10s for connections to drain
    kill_timeout: 10000,
    listen_timeout: 5000,

    // Restart policy: max 10 restarts within min_uptime window
    max_restarts: 10,
    min_uptime: '10s',

    // Log management
    error_file: './logs/safar-error.log',
    out_file: './logs/safar-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Don't watch in production (use explicit reload instead)
    watch: false,

    // Source map support for stack traces
    source_map_support: true
  }]
};
