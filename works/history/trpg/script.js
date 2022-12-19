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
    constructor(name, range, atk, matk) {
        this.name = name;
        this.range = range;
        this.atk = atk;
        this.matk = matk;
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
    at1837 : new Weapon("Allen & Thurber M1837 revolver pepperbox", 2, 34, 15),
    c1847 : new Weapon("Colt M1847 Walker revolver", 2, 44, 22),
    c1860 : new Weapon("Colt M1860 Army revolver", 3, 44, 20),
    w1850 : new Weapon("Wesson and Leavitt M1850 Dragoon revolver", 3, 40, 30),
    e1853r : new Weapon("Enfield P1853 rifled musket", 4, 58, 25),
    g1861c : new Weapon("Gallager M1861 carbine", 3, 52, 33),
    s1861r : new Weapon("Springfield M1861 rifled musket", 5, 58, 30),
    w1857 : new Weapon("Whitworth P1857 rifle", 6, 60, 40),
}

const armors = {

}

$(() => {
    
    $("")

});