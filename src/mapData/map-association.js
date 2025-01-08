mapData = {
    id: `map-association`,
    name: `デパス信仰協会`,
    width: 14,
    height: 20,
    grid: `0404040404040404040404040404040l0l0l0l0l0l0l0l0l0l0l0l04040m0m0m0m040o0p040m0m0m0m04040m0m0m0m040q0r040m0m0m0m04040m0m0m0m0m0m0m0m0m0m0m0m04040n0n0n0n0n0n0n0n0n0n0n0n04040h0h0h0h0h0h0h0h0h0h0h0h04040h0h0h0h0h0h0h0h0h0h0h0h04040h0h0h0h0h0h0h0h0h0h0h0h04040h0h0h0h0h0h0h0h0h0h0h0h04040h0h0h0h0h0h0h0h0h0h0h0h04040h0i0j0j0k0h0h0i0j0j0k0h04040h0h0h0h0h0h0h0h0h0h0h0h04040h0h0h0h0h0h0h0h0h0h0h0h04040h0i0j0j0k0h0h0i0j0j0k0h04040h0h0h0h0h0h0h0h0h0h0h0h04040h0h0h0h0h0h0h0h0h0h0h0h04040h0i0j0j0k0h0h0i0j0j0k0h04040h0h0h0h0h0h0h0h0h0h0h0h0404040404040h0h0h0h0404040404`,
    sprites: [[`talk`, [6, 5], {
                image: {
                    down: [`images/sprites/automata.png`, 0, 0, 16, 32],
                    left: [`images/sprites/automata.png`, 16, 0, 16, 32],
                    up: [`images/sprites/automata.png`, 32, 0, 16, 32],
                    right: [`images/sprites/automata.png`, 48, 0, 16, 32]
                },
                direction: `down`,
                size: [1, 2],
                event: async function* () {
                    yield "オートマタ:;デパス信仰協会にようこそ!"
                    yield "オートマタ:;あなたは不安・緊張・抑うつ・睡眠障害に悩まされていませんか?"
                    yield "オートマタ:;キャッチコピー『こころにひとつ、エチゾラム』"
                }
            }], [`move`, [5, 19], {
                size: [4, 1],
                direction: `down`,
                mapId: `map-test`,
                position: [3, 18]
            }]]
}