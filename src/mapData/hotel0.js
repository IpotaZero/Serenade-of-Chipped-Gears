mapData = {
    id: `hotel0`,
    name: `ホテル`,
    width: 12,
    height: 20,
    grid: `0404040404040404040404040405050505090a050505050404070707070b0c070707070404080808080808080808080404080808080808080808080404080808080808080808080404080808080808080808080404080808080808080808080404080804040404040404040404080804050505040g0g0g0404080804070707040g0g0g04040808040e0e0e040f0f0f04040808040e0e0e040f0f0f040408080404040e04040f04040408080505050e04050f05040408080707070e04070e0704040808080e0e0e050e0e0e04040808040e0e0e070e0e0e04040808040e0e0e0e0e0e0e04040408040404040404040404`,
    sprites: [[`move`, [2, 19], {
                size: [1, 1],
                direction: `down`,
                mapId: `test`,
                position: [3, 18]
            }], [`talk`, [9, 2], {
                image: {
                    down: [`images/sprites/goods.png`, 16, 0, 16, 48]
                },
                size: [1, 3],
                event: async function* () {
                    yield "ふかふかのベッド"
                    const num = yield ["question", ["はい", "いいえ"], "眠る?"]
                    if (num == 1) return
                    await Ifadeout.darken(4000)
                    await sleep(3000)
                    yield "良く寝た!"
                }
            }], [`talk`, [5, 10], {
                image: {
                    down: [`images/sprites/goods.png`, 32, 0, 16, 32]
                },
                size: [1, 2],
                event: async function* () {
                    yield "トイレ;わりときれい"
                }
            }], [`talk`, [5, 2], {
                image: {
                    down: [`images/sprites/automata.png`, 0, 0, 16, 32],
                    left: [`images/sprites/automata.png`, 16, 0, 16, 32],
                    up: [`images/sprites/automata.png`, 32, 0, 16, 32],
                    right: [`images/sprites/automata.png`, 48, 0, 16, 32]
                },
                direction: `down`,
                size: [1, 2],
                event: async function* () {
                    yield "オートマタ:;ワッ... 入ってきちゃダメだよ...;準備中だから..."
                    yield "タロー:;俺たちは幽霊だからいいのさ"
                    yield "オートマタ:;エッ! オバケ!? コワイ!"
                    yield "シュン:;休憩するだけだから、いいでしょ?"
                    yield "オートマタ:;ウーン まあ、イイヨー"
                }
            }], [`talk`, [6, 2], {
                event: async function* () {
                    yield "曇り空"
                }
            }], [`talk`, [10, 2], {
                image: {
                    down: [`images/sprites/goods.png`, 48, 0, 16, 48]
                },
                size: [1, 3],
                walkable: true,
                event: async function* () {}
            }], [`talk`, [10, 2], {
                image: {
                    down: [`images/sprites/goods.png`, 64, 0, 16, 32]
                },
                size: [1, 2],
                event: async function* () {
                    yield "ライトスタンド;まぶしくはない"
                }
            }], [`talk`, [9, 9], {
                image: {
                    down: [`images/sprites/goods.png`, 64, 32, 16, 16]
                },
                size: [1, 2],
                event: async function* () {
                    yield "シャワーだ"
                }
            }]]
}