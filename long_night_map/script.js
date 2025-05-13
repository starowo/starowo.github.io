class MapInfo {
    constructor() {
        this.map = [
            [8,8,8],
            [8,8,8],
            [8,8,8]
        ] // 0: empty, 1: player, 2: wall, 3: bush, 4: pool, 5: portal, 6:escape, 7: pool/portal, 8:unknown
        this.player = {x: 1, y: 1}
        this.xOffset = 0
        this.yOffset = 0
    }
    mark(direction, type) {
        switch (type) {
            case 'wall':
                switch (direction) {
                    case 'up':
                        this.map[this.player.y - 1][this.player.x] = 2
                        break
                    case 'down':
                        this.map[this.player.y + 1][this.player.x] = 2
                        break
                    case 'left':
                        this.map[this.player.y][this.player.x - 1] = 2
                        break
                    case 'right':
                        this.map[this.player.y][this.player.x + 1] = 2
                        break
                }
                break
            case 'bush':
                switch (direction) {
                    case 'up':
                        this.map[this.player.y - 1][this.player.x] = 0
                        this.player.y -= 2
                        break
                    case 'down':
                        this.map[this.player.y + 1][this.player.x] = 0
                        this.player.y += 2
                        break
                    case 'left':
                        this.map[this.player.y][this.player.x - 1] = 0
                        this.player.x -= 2
                        break
                    case 'right':
                        this.map[this.player.y][this.player.x + 1] = 0
                        this.player.x += 2
                        break
                }
                this.fixMapSize()
                this.map[this.player.y][this.player.x] = 3
                break
            case 'pool':
                switch (direction) {
                    case 'up':
                        this.map[this.player.y - 1][this.player.x] = 0
                        break
                    case 'down':
                        this.map[this.player.y + 1][this.player.x] = 0
                        break
                    case 'left':
                        this.map[this.player.y][this.player.x - 1] = 0
                        break
                    case 'right':
                        this.map[this.player.y][this.player.x + 1] = 0
                        break
                }
                this.fixMapSize()
                this.map[this.player.y][this.player.x] = 4
                break
            case 'portal':
                switch (direction) {
                    case 'up':
                        this.map[this.player.y - 1][this.player.x] = 0
                        break
                    case 'down':
                        this.map[this.player.y + 1][this.player.x] = 0
                        break
                    case 'left':
                        this.map[this.player.y][this.player.x - 1] = 0
                        break
                    case 'right':
                        this.map[this.player.y][this.player.x + 1] = 0
                        break
                }
                this.fixMapSize()
                this.map[this.player.y][this.player.x] = 5
                break
            case 'escape':
                switch (direction) {
                    case 'up':
                        this.map[this.player.y - 1][this.player.x] = 0
                        break
                    case 'down':
                        this.map[this.player.y + 1][this.player.x] = 0
                        break
                    case 'left':
                        this.map[this.player.y][this.player.x - 1] = 0
                        break
                    case 'right':
                        this.map[this.player.y][this.player.x + 1] = 0
                        break
                }
                this.fixMapSize()
                this.map[this.player.y][this.player.x] = 6
                break
            case 'pool/portal':
                switch (direction) {
                    case 'up':
                        this.map[this.player.y - 1][this.player.x] = 0
                        break
                    case 'down':
                        this.map[this.player.y + 1][this.player.x] = 0
                        break
                    case 'left':
                        this.map[this.player.y][this.player.x - 1] = 0
                        break
                    case 'right':
                        this.map[this.player.y][this.player.x + 1] = 0
                        break
                }
                this.fixMapSize()
                this.map[this.player.y][this.player.x] = 7
                break
        }
    }

    fixMapSize() {
        while (this.player.x < 0) {
            // add 2 columns to the left    
            this.map.forEach(row => row.unshift([8,8]))
            this.player.x += 2
        }
        while (this.player.x >= this.map[0].length) {
            // add 2 columns to the right
            this.map.forEach(row => row.push([8,8]))
        }
        while (this.player.y < 0) {
            // add 2 rows to the top
            let newRow1 = []
            let newRow2 = []
            for (let i = 0; i < this.map[0].length; i++) {
                newRow1.push(8)
                newRow2.push(8)
            }
            this.map.unshift(newRow2)
            this.map.unshift(newRow1)
            this.player.y += 2
        }
        while (this.player.y >= this.map.length) {
            // add 2 rows to the bottom
            let newRow1 = []
            let newRow2 = []
            for (let i = 0; i < this.map[0].length; i++) {
                newRow1.push(8)
                newRow2.push(8)
            }
            this.map.push(newRow1)
            this.map.push(newRow2)
        }
    }
}
$(() => {

})