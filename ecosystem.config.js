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
            }
        },
        {
            name: "clouddesk-frontend",
            cwd: "./web",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3000
            }
        },
        {
            name: "clouddesk-tunnel",
            script: "./cloudflared",
            args: "tunnel --url http://localhost:3001"
        }
    ]
};
