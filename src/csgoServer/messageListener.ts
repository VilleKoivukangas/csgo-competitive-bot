import GameController from "./gameController";

const named = require('named-regexp').named;

class MessageListener {

    private gameController: GameController | null = null;

    /**
     * Credits from regexes github.com/dejavueakay/orangebot
     */
    private messageRegexes = [{
            regex: /"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>]" switched from team [<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>] to [<](:<new_team>CT|TERRORIST|Unassigned|Spectator)[>]/,
            callback: this.playerJoinedToTeam.bind(this)
        }, {
            regex: /"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*?)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>]" triggered "clantag" \(value "(:<clan_tag>.*)"\)/,
            callback: this.clanTagTriggered.bind(this)
        }, {
            regex: /"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator|Console)[>]" say(:<say_team>_team)? "[!\.](:<text>.*)"/,
            callback: this.playerChatCommand.bind(this)
        }, {
            regex: /Team "(:<team>.*)" triggered "SFUI_Notice_(:<team_win>Terrorists_Win|CTs_Win|Target_Bombed|Target_Saved|Bomb_Defused)" \(CT "(:<ct_score>\d+)"\) \(T "(:<t_score>\d+)"\)/,
            callback: this.roundEnded.bind(this)
        }, {
            regex: /"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>]" disconnected/,
            callback: this.playerDisconnected.bind(this)
        }, {
            regex: /Loading map "(:<map>.*?)"/,
            callback: this.mapLoading.bind(this)
        }
    ];

    /**
     * Constructor
     * 
     * @param socket 
     * @param gameController 
     */
    constructor(socket: any, gameController: GameController | null) {
        this.gameController = gameController;
        this.listenMessages(socket);
    }
    
    /**
     * Listen socket messages
     * @param socket 
     */
    private listenMessages(socket: any) {
        socket.on("message", (message:any, remoteAddressInfo:any) => {
            const messageText = message.toString();

            this.messageRegexes.forEach((messageRegex) => {
                const regex = named(messageRegex.regex);
                const regexMatch = regex.exec(messageText);

                if (regexMatch) {
                    messageRegex.callback(regexMatch)
                }
            });
        });
    }

    /**
     * Round ended message
     * 
     * @param regexMatch
     */
    private roundEnded(regexMatch: any) {
        const terroristScore = parseInt(regexMatch.capture('t_score'));
        const counterTerroristScore = parseInt(regexMatch.capture('ct_score'));
        this.gameController?.updateGameScore(terroristScore, counterTerroristScore);
    }

    /**
     * Parses command from player message
     * 
     * @param regexMatch 
     */
    private parseCommandFromRegexMatch(regexMatch: any) {
        const parameters = regexMatch.capture('text').split(' ');
        return parameters;
    }

    /**
     * Map loading message
     * 
     * @param regexMatch 
     */
    private mapLoading(regexMatch: any) {
        this.gameController?.resetGameState();
    }

    /**
     * Player disconnected message
     * 
     * @param regexMatch 
     */
    private playerDisconnected(regexMatch: any) {
        const steamId = regexMatch.capture('steam_id');
        this.gameController?.removePlayer(steamId);
    }

    /**
     * Player joined to team message
     * 
     * @param regexMatch 
     */
    private playerJoinedToTeam(regexMatch: any) {
        const userName = regexMatch.capture('user_name');
        const steamId = regexMatch.capture('steam_id');
        const userTeam = regexMatch.capture('new_team');

        this.gameController?.playerJoinedToTeam(userName, steamId, userTeam);
    }

    private clanTagTriggered() {

    }

    /**
     * Player chat command message
     * 
     * @param regexMatch 
     */
    private playerChatCommand(regexMatch: any) {
        const playerChatCommand = this.parseCommandFromRegexMatch(regexMatch);
        const userId = regexMatch.capture('user_id');
        const steamId = regexMatch.capture('steam_id');
        const userTeam = regexMatch.capture('user_team');
        const userName = regexMatch.capture('user_name');
        this.gameController?.handlePlayerCommand(playerChatCommand, userId, steamId, userTeam, userName);
    }
}

export default MessageListener;