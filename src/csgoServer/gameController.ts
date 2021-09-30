import MessagingController from "./messagingController";
import * as fs from 'fs';
import path from "path";
import ServerState from "./serverState";
import { config } from '../config.js';

class GameController {

    private messagingController: MessagingController | null = null;

    private serverState: ServerState | null = null;

    private readyInterval: any = null;

    private playerCommands = [{
        command: "knife",
        callback: this.startKnifeRound.bind(this)
    }, {
        command: "endwarmup",
        callback: this.endWarmup.bind(this)
    }, {
        command: "stay",
        callback: this.stayAfterKnifeVictory.bind(this)
    }, {
        command: "swap",
        callback: this.swapAfterKnifeVictory.bind(this)
    }, {
        command: "map",
        callback: this.changeMap.bind(this)
    }, {
        command: "ready",
        callback: this.playerIsReady.bind(this)
    }, {
        command: "pause",
        callback: this.pause.bind(this)
    }, {
        command: "unpause",
        callback: this.unpause.bind(this)
    }, {
        command: "forceready",
        callback: this.forceReady.bind(this)
    }, {
        command: "mr15",
        callback: this.mr15.bind(this)
    }, {
        command: "mr30",
        callback: this.mr15.bind(this)
    }, {
        command: "stop",
        callback: this.stop.bind(this)
    }, {
        command: "commands",
        callback: this.commands.bind(this)
    }, {
        command: "pracc",
        callback: this.pracc.bind(this)
    }];

    /**
     * Constructor
     * 
     * @param messagingController 
     */
    constructor(messagingController: MessagingController | null) {
        this.messagingController = messagingController;
    }

    /**
     * Interval to send !ready reminders
     */
    private startReadyInterval() {
        if (this.readyInterval != null) {
            return;
        }

        this.readyInterval = setInterval(() => {
            this.messagingController?.sendRconMessage("say \x04Type !ready when ready!");
        }, 1000 * 60);
    }

    /**
     * Stops !ready reminder interval
     */
    private stopReadyInterval() {
        if (this.readyInterval == null) {
            return;
        }

        clearInterval(this.readyInterval);
    }

    /**
     * Handles !pracc command 
     */
    public pracc(command: string[], userId: number, steamId: string, user_team: "CT" | "TERRORIST") {
        if (this.serverState?.isKnifeRound()) {
            return;
        }

        if (this.serverState?.getGameIsStarted()) {
            return;
        }

        if (config.admins.includes(steamId)) {
            this.stopReadyInterval();
            this.messagingController?.sendRconMessage('mp_warmup_end');
            const filePath = path.resolve(__dirname, "../../src/cfg/pracc.cfg")
            const configString = this.loadConfig(filePath);
            this.messagingController?.sendRconMessage(configString);
            this.messagingController?.sendRconMessage("say \x04Lets pracc bois.");
        }
    }

    /**
     * Respond to !commands command 
     */
    public commands(command: string[], userId: number, steamId: string, user_team: "CT" | "TERRORIST") {
        this.messagingController?.sendRconMessage("say \x04Commands are: ready, pause, unpause, stay (knife victory) and swap (knife victory). Admin commands: knife, map, forceready, mr15, mr30, stop and pracc.");
    }

    /**
     * Sets server state
     * 
     * @param serverState 
     */
    public setServerState(serverState: ServerState) {
        this.serverState = serverState;
    }

    /**
     * Handles !stop command 
     */
    public stop(command: string[], userId: number, steamId: string, user_team: "CT" | "TERRORIST") {
        if (config.admins.includes(steamId)) {
            this.messagingController?.sendRconMessage("rcon tv_stoprecord;");
            this.serverState?.resetServerState();
            this.loadWarmup();
        }
    }

    /**
     * Handles !forceready command
     */
    public forceReady(command: string[], userId: number, steamId: string, user_team: "CT" | "TERRORIST") {
        if (this.serverState?.isKnifeRound()) {
            return;
        }

        if (this.serverState?.getGameIsStarted()) {
            return;
        }

        if (config.admins.includes(steamId)) {
            this.messagingController?.sendRconMessage('mp_warmup_end');
            this.restartGame("../../src/cfg/game.cfg");
            this.messagingController?.sendRconMessage("say \x04Admin forced the game.");
        }
    }

    /**
     * Handles !mr15 command 
     */
    public mr15(command: string[], userId: number, steamId: string, user_team: "CT" | "TERRORIST") {
        if (config.admins.includes(steamId)) {
            this.restartGame("../../src/cfg/mr15.cfg");
            this.messagingController?.sendRconMessage("say \x04Admin started mr15 game.");
        }
    }

    /**
     * Handles !mr30 command 
     */
    public mr30(command: string[], userId: number, steamId: string, user_team: "CT" | "TERRORIST") {
        if (config.admins.includes(steamId)) {
            this.messagingController?.sendRconMessage("mp_match_can_clinch 0");
        }
    }

    /**
     * Resets game state
     */
    public resetGameState() {
        this.serverState?.resetServerState();
    }

    /**
     * Handles player joined to team
     */
    public playerJoinedToTeam(userName: string, steamId: string, userTeam: string) {
        if (steamId === 'BOT') {
            return;
        }

        const players = this.serverState?.getPlayers();
        const playerAlreadyOnServer = players?.find((player) => player.steamId === steamId);

        if (playerAlreadyOnServer?.steamId) {
            this.removePlayer(steamId);
        }

        this.serverState?.addPlayer({steamId: steamId, team: userTeam, name: userName});

        if (this.serverState?.getPlayers().length === 1) {
            this.loadWarmup();
        }
    }

    /**
     * Loads warmup
     */
    private loadWarmup() {
        if (this.serverState?.getGameIsStarted()) {
            return;
        }

        this.startReadyInterval();
        this.loadGameConfig();

        this.messagingController?.sendRconMessage('mp_restartgame 1', 1000);

        const filePath = path.resolve(__dirname, "../../src/cfg/warmup.cfg");
        const configString = this.loadConfig(filePath);

        this.messagingController?.sendRconMessage(configString, 1500);
    }

    /**
     * Loads game config
     */
    private loadGameConfig() {
        const filePath = path.resolve(__dirname, "../../src/cfg/game.cfg");
        const configString = this.loadConfig(filePath);
        this.messagingController?.sendRconMessage(configString);
    }

    /**
     * Removes player from state
     */
    public removePlayer(steamId: string) {
        this.serverState?.removePlayer(steamId);
    }

    /**
     * Handles player command
     */
    public handlePlayerCommand(command: string[], userId: number, steamId: string, user_team: string, userName: string) {
        if (command.includes("map")) {
            return this.handleMultiwordCommand(command, userId, steamId, user_team, userName);
        }

        const stringCommand = command[0];

        this.playerCommands.forEach((playerCommand) => {
            if (playerCommand.command === stringCommand) {
                if (['map', 'knife', 'stay', 'swap', 'forceready', 'mr15', 'mr30', 'stop', 'pracc'].includes(stringCommand)) {
                    this.messagingController?.sendRconMessage(`say \x04Executing command ${stringCommand}`, 0);
                    setTimeout(() => {
                        playerCommand.callback([], userId, steamId, user_team, userName);
                    }, 2000);
                } else {
                    playerCommand.callback([], userId, steamId, user_team, userName);
                }
            }
        });
    }

    /**
     * Handles multiword command eg. !map de_dust2
     */
    private handleMultiwordCommand(command: string[], userId: number, steamId: string, user_team: string, userName: string) {
        const baseCommand = command[0];

        setTimeout(() => {
            this.playerCommands.forEach((playerCommand) => {
                if (playerCommand.command === baseCommand) {
                    switch (baseCommand) {
                        case "map":
                            playerCommand.callback(command, userId, steamId, user_team, userName);
                            break;
                    }
                }
            });
        });
    }

    /**
     * Updates game score
     */
    public updateGameScore(terroristScore: number, counterTerroristScore: number) {
        if (!this.serverState?.isKnifeRound()) {
            // Update score
            return;
        }

        this.endKnifeRound(terroristScore, counterTerroristScore);
    }

    /**
     * Handles player is ready (!ready)
     */
    private playerIsReady(command: string[], userId: number, steamId: string, user_team: "CT" | "TERRORIST", userName: string) {
        if (this.serverState?.isKnifeRound()) {
            return;
        }

        if (this.serverState?.getGameIsStarted()) {
            return;
        }

        this.serverState?.updatePlayerIsReady(steamId);

        this.messagingController?.sendRconMessage(`say \x04Player ${userName} is ready!`, 0);

        console.log('players amount: ' + this.serverState?.getPlayers().length);
        console.log('ready amount: ' + this.serverState?.getReadyPlayers().length);
        if (10 === this.serverState?.getReadyPlayers().length) {
            this.messagingController?.sendRconMessage('mp_warmup_end');
            this.restartGame("../../src/cfg/game.cfg"); //TODO: How many players needed?
        }
    }

    /**
     * Pauses the game
     */
    private pause(command: string[], userId: number, steamId: string, user_team: string, userName: string) {
        if (this.serverState?.isKnifeRound()) {
            return;
        }

        this.pauseGame();
        this.messagingController?.sendRconMessage(`say \x04Team ${user_team} has paused the match.`, 0);
    }

    /**
     * Unpauses the game
     */
    private unpause(command: string[], userId: number, steamId: string, user_team: "CT" | "TERRORIST") {
        if (this.serverState?.isKnifeRound()) {
            return;
        }

        this.serverState?.updateTeamUnpaused(user_team);
        this.messagingController?.sendRconMessage(`say \x04Team ${user_team} wants to continue match, say !unpause to continue.`, 0);
        const teamUnpaused = this.serverState?.getTeamsUnpaused();

        if (teamUnpaused?.CT && teamUnpaused.TERRORIST) {
            this.unPauseGame();
            this.serverState?.resetPauses();
            this.serverState?.updateGamePaused(false);
        }
    }

    /**
     * Changes map
     */
    private changeMap(command: string[], userId: number, steamId: string, user_team: string, userName: string) {
        if (!config.admins.includes(steamId)) {
            return;
        }

        const map = command[1];
        this.messagingController?.sendRconMessage(`say \x04Changing map to ${map}`, 0);
        this.messagingController?.sendRconMessage(`changelevel ${map}`, 2000);
    }

    /**
     * Stay at the current side (T/CT) after knife victory
     */
    private stayAfterKnifeVictory(command: string[], userId: number, steamId: string, user_team: string, userName: string) {
        const knifeVictory = this.serverState?.getKnifeVictory();

        if (user_team !== knifeVictory) {
            return;
        }

        this.messagingController?.sendRconMessage('mp_warmup_end');
        this.serverState?.updateIsKnifeRound(false);
        this.restartGame("../../src/cfg/game.cfg");
    }

    /**
     * Swaps sides (T/CT) after knife victory
     */
    private swapAfterKnifeVictory(command: string[], userId: number, steamId: string, user_team: string, userName: string) {
        const knifeVictory = this.serverState?.getKnifeVictory();

        if (user_team !== knifeVictory) {
            return;
        }

        this.messagingController?.sendRconMessage('mp_warmup_end');
        this.serverState?.updateIsKnifeRound(false);
        this.swapTeams();

        setTimeout(() => {
            this.restartGame("../../src/cfg/game.cfg");
        }, 2000);
    }

    /**
     * Starts knife round
     */
    private startKnifeRound(command: string[], userId: number, steamId: string, user_team: string, userName: string) {
        if (this.serverState?.isKnifeRound()) {
            return;
        }

        if (this.serverState?.getGameIsStarted()) {
            return;
        }

        this.messagingController?.sendRconMessage('mp_warmup_end');
        
        const filePath = path.resolve(__dirname, "../../src/cfg/knife.cfg")
        const configString = this.loadConfig(filePath);

        this.serverState?.updateIsKnifeRound(true);
        this.messagingController?.sendRconMessage(configString, 1000);
        this.messagingController?.sendRconMessage("mp_restartgame 1", 1500);
        this.messagingController?.sendRconMessage(`say \x04Knife round is live!`, 5000);
    }

    /**
     * Ends knife round 
     */
    private endKnifeRound(terroristScore: number, counterTerroristScore: number) {
        const winnerText = terroristScore > counterTerroristScore ? "Terrorists won the knife round!" : "Counter-Terrorists won the knife round!";
        this.messagingController?.sendRconMessage(`say \x04${winnerText}`, 1000);
        this.serverState?.updateKnifeVictory(terroristScore > counterTerroristScore ? "TERRORIST" : "CT");
        const filePath = path.resolve(__dirname, "../../src/cfg/warmup.cfg");
        const configString = this.loadConfig(filePath);
        this.messagingController?.sendRconMessage(configString);
        this.messagingController?.sendRconMessage("say \x04Type !stay or !swap to continue game.");
    }

    /**
     * Restarts game
     */
    private restartGame(configFile: string) {
        this.stopReadyInterval();
        const filePath = path.resolve(__dirname, configFile)
        const configString = this.loadConfig(filePath);

        this.messagingController?.sendRconMessage(configString);
        this.messagingController?.sendRconMessage('say \x04The match will start soon!');
        this.serverState?.updateGameIsStarted(true);

        [6000, 7000, 8000, 12000].forEach((milliseconds) => {
            setTimeout(() => {
                this.messagingController?.sendRconMessage(milliseconds < 12000 ? 'mp_restartgame 1' : `say \x04GAME IS LIVE! GL HF!;rcon tv_stoprecord;rcon tv_record "/home/steam/demos/${(new Date()).getTime()}_demo.dem"`);
            }, milliseconds);
        });
    }

    /**
     * Loads given config
     */
    private loadConfig(configPath: string) {
        const rawConfigFile = fs.readFileSync(configPath, 'utf8');
        const configString = rawConfigFile.replace(/(\r\n\t|\n|\r\t)/gm,"; ");
        return configString;
    }

    /**
     * Pauses game
     */
    private pauseGame() {
        this.serverState?.updateGamePaused(true);
        this.messagingController?.sendRconMessage("mp_pause_match");
    }

    /**
     * Unpauses game
     */
    private unPauseGame() {
        [1000, 2000, 3000].forEach((milliseconds) => {
            setTimeout(() => {
                const seconds = milliseconds < 3000 ? (3000 - milliseconds) / 1000 : 0;

                if (seconds <= 0) {
                    return this.messagingController?.sendRconMessage("mp_unpause_match");
                }

                const unpauseMessage = `say \x04Unpausing in ${seconds} seconds`;
                this.messagingController?.sendRconMessage(unpauseMessage);
            }, milliseconds);
        });
    }

    /**
     * Swaps teams
     */
    private swapTeams() {
        this.messagingController?.sendRconMessage("mp_unpause_match;mp_swapteams");
    }

    /**
     * End warmup
     */
    private endWarmup() {
        this.messagingController?.sendRconMessage("mp_warmup_end");
    }

}

export default GameController;
