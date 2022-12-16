class Entity {
    constructor() {
        this.hp = 100;
        this.ammo = 10;
        this.ammoMax = 10;
        this.weapon = null;
        this.armor = null;
    }
}

class Player extends Entity {
    constructor(name, role) {
        super();
        this.name = name;
        this.role = role;
        switch (role) {
            case 'scout':
                this.ammo = 5;
                this.ammoMax = 7;
                break;
            case 'surgeon':
                this.ammo = 3;
                this.ammoMax = 5;
                break;
            default:
                break;
        }
    }
}

class Weapon {
    constructor(name, range, atk) {
        this.name = name;
        this.range = range;
        this.atk = atk;
    }
}

class Armor {
    constructor(name, def) {
        this.name = name;
        this.def = def;
    }
}

class Option {
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}

class GameEvent {
    /**
     * 
     * @param {String} desc 
     * @param {Array} options 
     */
    constructor(desc, options) {
        this.desc = desc;
        this.options = options;
        
    }
}

const events = [new GameEvent("")];

const weapons = {

}

const armors = {

}

$(() => {
    
    $("")

});