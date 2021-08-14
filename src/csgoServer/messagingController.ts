import { config } from '../config.js';

const Rcon = require('simple-rcon');
const dgram  = require('dgram');
const localIp = require('ip');

/**
 * Controller for messaging with csgo server
 */
class MessagingController {

    private host: string = "";

    private port: number = 0;

    private rconnpass: string = "";

    private socket: any = null;

    private localIp: string = "";

    /**
     * Constructor
     */
    constructor(host: string, rconnpass: string, port?: number) {
        this.host = host;
        this.rconnpass = rconnpass;
        this.port = port || 27015;
        this.localIp = localIp.address();
        this.socket = dgram.createSocket("udp4");
    }

    /**
     * Executes status command
     */
    public status() {
        const connection = new Rcon({
			host: this.host,
			port: this.port,
			password: this.rconnpass
		});

        connection.exec('status', (res: any) => {
            connection.close();
        });

        connection.connect();
    }

    /**
     * Sends Rcon message
     */
    public sendRconMessage(message: string, timeout?: number) {
        const connection = new Rcon({
			host: this.host,
			port: this.port,
			password: this.rconnpass
		});

        connection.on('authenticated', function () {
            setTimeout(() => {
                const parsedMessge: string[] = message.split(';');

                for (var i in parsedMessge) {
                    connection.exec(String(parsedMessge[i]));
                }

                connection.close();
            }, (timeout ? timeout : 100));
        });

        connection.connect();
    }

    /**
     * Listens socket messages
     */
    public async socketListener(listeningCallback: any) {
        this.socket.on('listening', () => {
            this.socket.send(Buffer.from("ping"), this.port, this.host);
            listeningCallback(this.socket);
        });

        this.socket.on('error', (error:any) => {
            console.log('Error: ' + error);
            this.socket.close();
        });

        this.socket.bind(config.port, this.localIp);
    }

    /**
     * Closes socket
     */
    public closeSocket() {
        return new Promise((resolve, reject) => {
            this.socket.close(() => {
                resolve(true);
            });
        });
        
    }
    
}

export default MessagingController;