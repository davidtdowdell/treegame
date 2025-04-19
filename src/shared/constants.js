module.exports = Object.freeze({
  PLAYER_RADIUS: 20,
  PLAYER_MAX_HP: 100,
  PLAYER_SPEED: 400,
  PLAYER_FIRE_COOLDOWN: 0.25,

  BULLET_RADIUS: 3,
  BULLET_SPEED: 800,
  BULLET_DAMAGE: 10,

  SCORE_BULLET_HIT: 20,
  SCORE_PER_SECOND: 1,

  MAP_SIZE: 3000,
  MSG_TYPES: {
    CREATE_GAME: 'create_game',
    PLAYER_LIST: 'player_list',
    ASK_FOR_GAME_LIST: 'ask_for_game_list',
    GAME_LIST: 'game_list',
    JOIN_GAME: 'join_game',
    START_GAME: 'start_game',
    GAME_UPDATE: 'update',
    INPUT: 'input',
    GAME_OVER: 'dead',
    CHAT: 'chatMessage',
  },
});
