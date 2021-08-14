export type ServerStateType = {
    queue: string[],
    players: Player[],
    playersIsReady: string[],
    currentMapScore: GenericScore,
    totalScore: GenericScore,
    pausesCount: PauseCount,
    teamsReady: GenerigTeamBoolean,
    teamsHasUnpaused: GenerigTeamBoolean,
    gameIsPaused: boolean,
    gameIsStarted: boolean,
    isKnifeRound: boolean,
    knifeVictory?: "CT" | "TERRORIST"
}

export type GenerigTeamBoolean = {
    CT: boolean,
    TERRORIST: boolean
}

export type PauseCount = {
    CT: number,
    TERRORIST: number
}

export type GenericScore = {
    CT: number,
    TERRORIST: number
}

export type Player = {
    steamId: string,
    team: string,
    name: string
}