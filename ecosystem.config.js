module.exports = {
    apps: [
        {
            name: "clouddesk-backend",
            cwd: "./backend",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3001
            },
            restart_delay: 2000,
            max_restarts: 10,
            exp_backoff_restart_delay: 100
        },
        {
            name: "clouddesk-frontend",
            cwd: "./web",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3000
            },
            restart_delay: 2000
        },
        {
            name: "clouddesk-tunnel",
            script: "./cloudflared",
            args: "tunnel --url http://localhost:3001",
            restart_delay: 5000,
            max_restarts: 50
        }
    ]
};
