import { config } from './config.js'
import CSGOServer from './csgoServer/index.js';

class CSGOCompetitiveBot {

    private connectedServers: any[] = [];

    constructor() {
        this.connectServers();
    }

    /**
     * Starts connections for each server
     */
    private async connectServers() {
        const configServers = config.servers;

        setInterval(() => {
            for (let i = 0; i < configServers.length; i++) {
                this.connect(configServers[i]);
            }

            this.checkConnections();
        }, 2000);
    }

    private async connect(server: any) {
        const csGoServer = new CSGOServer(server.host, server.rconPass, server.port, server.id);

        if (!await csGoServer.checkAvailability()) {
            console.log(`Couldn't connect to server (${server.host}:${server.port})`);
            return;
        }

        if (this.alreadyConnected(csGoServer)) {
            return;
        }

        console.log(`Added server ${server.host}:${server.port}`);

        this.connectedServers.push({
            server: csGoServer,
            failedCount: 0
        });

        try {
            csGoServer.connect();
        } catch (exception) {
            console.log(`Couldn't connect to server (${server.host}:${server.port})`);
        }
        
    }

    private alreadyConnected(server: any) {
        const configServers = config.servers;
        const configServer = configServers.find((configServer: any) => configServer.id === server.id);

        if (!configServer) {
            return false;
        }

        const configServerId = configServer.id;
        const alreadyConnected = this.connectedServers.find((connectedServer: any) => connectedServer.server.id === configServerId);

        if (alreadyConnected) {
            return true;
        }

        return false;
    }

    private async checkConnections() {
        for (let i = 0; i < this.connectedServers.length; i++) {
            const csGoServer = this.connectedServers[i];

            if (!await csGoServer.server.checkAvailability()) {
                csGoServer.failedCount++;
            }

            if (csGoServer.failedCount >= 3) {
                console.log(`Removed server ${csGoServer.server.host}:${csGoServer.server.port}`);
                csGoServer.server.disconnectServer();
                this.connectedServers = this.connectedServers.filter((server: any) => { server.id !== csGoServer.server.id });
            }
        }
    }
}

new CSGOCompetitiveBot();