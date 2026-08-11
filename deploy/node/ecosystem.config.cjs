module.exports = {
  apps: [
    {
      name: "rgmtech",
      script: "server.mjs",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      max_memory_restart: "300M",
    },
  ],
};
