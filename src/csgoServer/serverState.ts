import { Player, ServerStateType } from '../types/index.js';

const defaultState =  {
    queue: [],
    players: [],
    playersIsReady: [],
    currentMapScore: {
        CT: 0,
        TERRORIST: 0
    },
    totalScore: {
        CT: 0,
        TERRORIST: 0
    },
    pausesCount: {
        CT: 0,
        TERRORIST: 0
    },
    teamsReady: {
        CT: false,
        TERRORIST: false
    },
    teamsHasUnpaused: {
        CT: false,
        TERRORIST: false
    },
    gameIsPaused: false,
    gameIsStarted: false,
    isKnifeRound: false,
};

class ServerState {

    private state: ServerStateType = defaultState;

    constructor() {
    }

    public resetServerState() {
        this.state = {
            queue: [],
            players: [],
            playersIsReady: [],
            currentMapScore: {
                CT: 0,
                TERRORIST: 0
            },
            totalScore: {
                CT: 0,
                TERRORIST: 0
            },
            pausesCount: {
                CT: 0,
                TERRORIST: 0
            },
            teamsReady: {
                CT: false,
                TERRORIST: false
            },
            teamsHasUnpaused: {
                CT: false,
                TERRORIST: false
            },
            gameIsPaused: false,
            gameIsStarted: false,
            isKnifeRound: false,
        };
    }

    public isKnifeRound() {
        return this.state.isKnifeRound;
    }

    public updateIsKnifeRound(isKnifeRound: boolean) {
        this.state.isKnifeRound = isKnifeRound;
    }

    public updateKnifeVictory(knifeVictory: "CT" | "TERRORIST") {
        this.state.knifeVictory = knifeVictory;
    }

    public getKnifeVictory() {
        return this.state.knifeVictory;
    }

    public addMessageToQueue(message: string) {
        this.state.queue.push(message);
    }

    public getLatestMessgeFromQueue() {
        const command = this.state.queue.shift();
        return command ? command : "";
    }

    public getQueueMessages() {
        return this.state.queue;
    }

    public addPlayer(player: Player) {
        this.state.players.push(player);
    }

    public removePlayer(steamId: string) {
        this.state.players = this.state.players.filter((player) => player.steamId !== steamId);
    }

    public getPlayers() {
        return this.state.players;
    }

    public updateMapScore(terroristScore: number, counterTerroristScore: number) {
        this.state.currentMapScore = {
            TERRORIST: terroristScore,
            CT: counterTerroristScore
        };
    }

    public addRoundWinForTeam(team: "CT" | "TERRORIST") {
        this.state.currentMapScore[team]++;
    }

    public addMapWinToTeam(team: "CT" | "TERRORIST") {
        this.state.totalScore[team]++;
    }

    public addPauseForTeam(team: "CT" | "TERRORIST") {
        this.state.pausesCount[team]++;
    }

    public updatePlayerIsReady(steamId: string) {
        this.state.playersIsReady.push(steamId);
    }

    public getReadyPlayers() {
        return this.state.playersIsReady;
    }

    public getTeamIsReady(team: "CT" | "TERRORIST") {
        return this.state.teamsReady[team];
    }

    public updateTeamUnpaused(team: "CT" | "TERRORIST") {
        this.state.teamsHasUnpaused[team] = true;
    }

    public getTeamsUnpaused() {
        return this.state.teamsHasUnpaused;
    }

    public resetPauses() {
        this.state.teamsHasUnpaused = {CT: false, TERRORIST: false};
    }

    public updateGamePaused(paused: boolean) {
        this.state.gameIsPaused = paused;
    }

    public updateGameIsStarted(started: boolean) {
        this.state.gameIsStarted = started;
    }

    public getGameIsStarted() {
        return this.state.gameIsStarted;
    }

}

export default ServerState;
