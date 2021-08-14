import { config } from '../config.js';
import MessagingController from './messagingController.js';
import ServerState from './serverState.js';
import * as tcpPing from 'tcp-ping';
import GameController from './gameController.js';
import MessageListener from './messageListener.js';

const localIp = require('ip');

class CSGOServer {

    public id: number = 0;

    public host: string = '';

    public port: number = 0;

    private serverState: ServerState = new ServerState();

    private messagingController: MessagingController | null = null;

    private gameController: GameController | null = null;

    private serverQueueLoop: any = null;

    /**
     * Constructor
     * 
     * @param host 
     * @param rconnpass 
     * @param port 
     */
    constructor(host: string, rconnpass: string, port: number, id: number) {
        this.host = host;
        this.port = port;
        this.id = id;
        this.messagingController = new MessagingController(host, rconnpass, port);
        this.gameController = new GameController(this.messagingController);
        this.gameController.setServerState(this.serverState);
    }

    /**
     * Creates initial connection by checking status, sending whitelist commands and starting the server loop
     */
    public async connect() {
        this.messagingController?.status();
        this.serverState.addMessageToQueue(this.buildConnectionInitializionMessage());
        this.messagingController?.socketListener(this.socketListeningCallBack.bind(this));
        this.loopServerQueue();
    }

    /**
     * Callback for new socket messages
     */
    private socketListeningCallBack(socket: any) {
        new MessageListener(socket, this.gameController);
    }

    /**
     * Checks whether the server is available or not
     */
    public async checkAvailability() {
        return new Promise((resolve, reject) => {
            tcpPing.probe(this.host, this.port, (error, available) => {
                if (!available) {
                    resolve(false);
                }
    
                resolve(true);
            });
        });
    }

    /**
     * Server loop that handles queued messages
     */
    private loopServerQueue() {
        this.serverQueueLoop = setInterval(() => {
            if (this.serverState.getQueueMessages().length > 0) {
                const command = this.serverState.getLatestMessgeFromQueue();
                this.messagingController?.sendRconMessage(command);
            }
        }, 100);
    }

    /**
     * Disconnects bot from server
     */
    public async disconnectServer() {
        clearInterval(this.serverQueueLoop);
        await this.messagingController?.closeSocket();
        this.serverQueueLoop = null;
    }

    /**
     * Initializion command to server
     */
    private buildConnectionInitializionMessage() {
        return `sv_rcon_whitelist_address ${localIp.address()};logaddress_add ${localIp.address()}:${config.port};log on`;
    }

}

export default CSGOServer;