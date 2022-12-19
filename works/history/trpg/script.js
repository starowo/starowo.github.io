class Entity {
    constructor() {
        this.hp = 100;
        this.ammo = 10;
        this.ammoMax = 10;
        this.weapon = null;
        this.armor = null;
        this.hpknown = false;
        this.weaponknown = false;
        this.armorknown = false;
    }
}

class Player extends Entity {
    constructor(name, role) {
        super();
        this.name = name;
        this.role = role;
        this.merits = 0;
        this.kit = 2;
        this.kitMax = 2;
        switch (role) {
            case 'scout':
                this.ammo = 5;
                this.ammoMax = 7;
                this.kit = 0;
                this.kitMax = 0;
                break;
            case 'surgeon':
                this.ammo = 3;
                this.kit = 5;
                this.kitMax = 5;
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

class EventOption {
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}

class GameEvent {
    /**
     * 
     * @param {String} desc 
     * @param {Array<EventOption>} options 
     * @param {Function} getPriority
     */
    constructor(desc, options, getPriority) {
        this.desc = desc;
        this.options = options;
        this.getPriority = getPriority;
    }
}

const weapons = {
    at1837: new Weapon("Allen & Thurber M1837 revolver pepperbox", 2, 34, 15),
    c1847: new Weapon("Colt M1847 Walker revolver", 2, 44, 22),
    c1860: new Weapon("Colt M1860 Army revolver", 3, 44, 20),
    w1850: new Weapon("Wesson and Leavitt M1850 Dragoon revolver", 3, 40, 30),
    e1853r: new Weapon("Enfield P1853 rifled musket", 4, 58, 25),
    g1861c: new Weapon("Gallager M1861 carbine", 3, 52, 33),
    s1861r: new Weapon("Springfield M1861 rifled musket", 5, 58, 30),
    w1857: new Weapon("Whitworth P1857 rifle", 6, 60, 40),
    deagle: new Weapon("Desert Eagle", 4, 80, 50)
}

const armors = {
    none: new Armor("No armor", 5),
    leather: new Armor("Leather armor", 15),
    iron: new Armor("Iron armor", 25),
    bpvests: new Armor("Bulletproof vests", 50)
}

let positionhp = 500;

$(() => {

    let round = 0;
    let step = 9;

    let scout;
    let soldier1;
    let soldier2;
    let surgeon;

    let special = 0;

    const enemies = [];

    let events;

    let eventEnemy;
    let eventScout1;
    let eventScout2;
    let eventSoldier11;
    let eventSoldier12;
    let eventSoldier21;
    let eventSoldier22;
    let eventSurgeon1;
    let eventSurgeon2;
    let eventPush;

    present(new GameEvent("<p>Before starting the game, plz put in players' names for each character.<p>", [new EventOption("ok, let's start!", () => {
        scout = new Player(prompt("Please input the player's name who is playing the scout."), "scout");
        scout.weapon = weapons.at1837;
        scout.armor = armors.none;
        soldier1 = new Player(prompt("Please input the player's name who is playing the soldier 1."), "soldier");
        soldier1.weapon = weapons.at1837;
        soldier1.armor = armors.none;
        soldier2 = new Player(prompt("Please input the player's name who is playing the soldier 2."), "soldier");
        soldier2.weapon = weapons.at1837;
        soldier2.armor = armors.none;
        surgeon = new Player(prompt("Please input the player's name who is playing the surgeon."), "surgeon");
        surgeon.weapon = weapons.at1837;
        surgeon.armor = armors.none;
        start();
        return false;
    }), null, null, null]));



    function start() {
        $("#scn").html(scout.name);
        $("#so1n").html(soldier1.name);
        $("#so2n").html(soldier2.name);
        $("#sun").html(surgeon.name);
        eventEnemy = new GameEvent("<p>A group of Confederate soldiers are trying to advance our position</p>", [new EventOption("roll a dice", () => {
            const random = Math.floor(Math.random() * round / 2) + 1;
            alert("plz put " + random + " enemy soldiers on enemy's side on the gameboard");
            return true;
        }), null, null, null]);
        eventScout1 = new GameEvent("<p>Scout(" + scout.name + "):</p><p>You can roll a dice to move.</p>", [new EventOption("roll a dice", () => {
            const random = Math.floor(Math.random() * 4) + 3;
            alert("You can move up to " + random + " cells on the board. (Can be less than it).");
            return true;
        }), new EventOption("open the merits store", () => {
            openStore(scout);
        }), new EventOption("fill ammo(in the camp)", () => {
            scout.ammo = scout.ammoMax;
            update();
            return false;
        }), new EventOption("skip", () => {
            return true;
        })])
        eventScout2 = new GameEvent("<p>Scout(" + scout.name + "):</p><p>Please choose an action.</p>", [new EventOption("attack an enemy", () => {
            let str = "Attacking:\n0. Not in the list\n";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weaponknown) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armorknown) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hpknown > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            let n = prompt(str + "enter the number", "");
            if (n == null) {
                return false;
            }
            n = parseInt(n) - 1;
            if (n == -1) {
                let weapon = null;
                let armor = null;
                let hp = -1;
                if (true) {
                    const keys = Object.keys(weapons);
                    weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                }
                if (true) {
                    const keys = Object.keys(armors);
                    armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                }
                if (true) {
                    hp = Math.floor(Math.random() * round * 5) + 50;
                }
                const entity = new Entity();
                entity.hp = hp;
                entity.armor = armor;
                entity.weapon = weapon;
                enemies.push(entity);
                let r = prompt("input the distance between you and enemy", 3);
                if(!(parseInt(r) <= scout.weapon.range + 1)) {
                    alert("This enemy is too far!");
                    return false;
                }
                attack(eventScout2, scout, entity, false, parseInt(r));
                return false;
            }
            if (enemies[n]) {
                let r = prompt("input the distance between you and enemy", 3);
                if(!(parseInt(r) <= scout.weapon.range + 1)) {
                    alert("This enemy is too far!");
                    return false;
                }
                attack(eventScout2, scout, enemies[n], false, parseInt(r));
                return false;
            }
        }), new EventOption("gather information", () => {
            let chosen = prompt("What information do you want:\n1. Weapon\n2. Armor\n3. HP\nplz enter the number(can be multiple, such as:123)", 1);
            if (chosen == null || chosen.replace("[^0-9]", "") != chosen) {
                return false;
            }
            const found = [];
            let str = "Getting info of:\n0. Not in the list";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weaponknown) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armorknown) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hpknown) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\nenter the numbers of enemies within 3 cell of you.";
            }
            let nn = prompt(str, "");
            if (!nn) {
                return false;
            }
            for (let n2 = 0; n2 < nn.length; n2++) {
                let n = parseInt(nn[n2]) - 1;
                if (n == -1) {
                    let weapon = null;
                    let armor = null;
                    let hp = -1;
                    if (true) {
                        const keys = Object.keys(weapons);
                        weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                    }
                    if (true) {
                        const keys = Object.keys(armors);
                        armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                    }
                    if (true) {
                        hp = Math.floor(Math.random() * round * 5) + 50;
                    }
                    const entity = new Entity();
                    entity.hp = hp;
                    entity.armor = armor;
                    entity.weapon = weapon;
                    if (chosen.indexOf("1") != -1) {
                        entity.weaponknown = true;
                    }
                    if (chosen.indexOf("2") != -1) {
                        entity.armorknown = true;
                    }
                    if (chosen.indexOf("3") != -1) {
                        entity.hpknown = true;
                    }
                    enemies.push(entity);
                    found.push(entity);
                }
                if (enemies[n]) {
                    found.push(enemies[n]);
                }
            }
            str = "";
            for (let i = 0; i < found.length; i++) {
                str += (i + 1) + ". "
                if (found[i].weaponknown) {
                    str += "Weapon: " + found[i].weapon.name + ", ATK" + found[i].weapon.atk + ", Range" + found[i].weapon.range + ";";
                }
                if (found[i].armorknown) {
                    str += "Armor: " + found[i].armor.name + ", DEF" + found[i].armor.def + ";";
                }
                if (found[i].hpknown > 0) {
                    str += "HP: " + found[i].hp;
                }
                str += "\n";
            }
            str += ("merits + " + found.length + "\n(Assign these attributes to the detected enemies and try to remember them, you can use some props to mark them)");
            scout.merits += found.length;
            alert(str);
            $("#o1").prop("disabled", true);
            let infs = chosen.length - 1;
            for (let i = 0; i < found.length; i++) {
                if (Math.random() < infs * 0.33) {
                    alert("An enemy have found you!");
                    attack(eventScout2, scout, found[i], true, 3);
                    break;
                }
            }
            return false;
        }), new EventOption("enemy list", () => {
            let str = "";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". "
                if (enemies[i].weapon) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armor) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hp > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            alert(str);
            return false;
        }), new EventOption("end turn", () => {
            return true;
        })]);
        eventSoldier11 = new GameEvent("<p>Soldier(" + soldier1.name + "):</p><p>You can roll a dice to move.</p>", [new EventOption("roll a dice", () => {
            const random = Math.floor(Math.random() * 2) + 2;
            alert("You can move up to " + random + " cells on the board. (Can be less than it).");
            return true;
        }), new EventOption("open the merits store", () => {
            openStore(soldier1);
            update();
        }), new EventOption("fill ammo(in the camp)", () => {
            soldier1.ammo = soldier1.ammoMax;
            return false;
        }), new EventOption("skip", () => {
            return true;
        })])
        eventSoldier12 = new GameEvent("<p>Soldier(" + soldier1.name + "):</p><p>Please choose an action.</p>", [new EventOption("attack an enemy", () => {
            let str = "Attacking:\n0. Not in the list\n";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weaponknown) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armorknown) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hpknown > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            let n = prompt(str + "enter the number", "");
            if (n == null) {
                return false;
            }
            n = parseInt(n) - 1;
            if (n == -1) {
                let weapon = null;
                let armor = null;
                let hp = -1;
                if (true) {
                    const keys = Object.keys(weapons);
                    weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                }
                if (true) {
                    const keys = Object.keys(armors);
                    armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                }
                if (true) {
                    hp = Math.floor(Math.random() * round * 5) + 50;
                }
                const entity = new Entity();
                entity.hp = hp;
                entity.armor = armor;
                entity.weapon = weapon;
                enemies.push(entity);
                let r = prompt("input the distance between you and enemy", 3);
                if(!(parseInt(r) <= soldier1.weapon.range)) {
                    alert("This enemy is too far!");
                    return false;
                }
                attack(eventSoldier12, soldier1, entity, false, parseInt(r));
                return false;
            }
            if (enemies[n]) {
                let r = prompt("input the distance between you and enemy", 3);
                if(!(parseInt(r) <= soldier1.weapon.range)) {
                    alert("This enemy is too far!");
                    return false;
                }
                attack(eventSoldier12, soldier1, enemies[n], false, parseInt(r));
                return false;
            }
        }), new EventOption("throw grenade", () => {
            if (soldier1.kit <= 0) {
                alert("you dont have enough grenade");
                return false;
            }
            let str = "Throwing to:\n0. Not in the list";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weaponknown) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armorknown) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hpknown) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\nenter the numbers of enemies within 1 cell of the target";
            }
            let nn = prompt(str, "");
            if (!nn) {
                return false;
            }
            const found = [];
            for (let n2 = 0; n2 < nn.length; n2++) {
                let n = parseInt(nn[n2]) - 1;
                if (n == -1) {
                    let weapon = null;
                    let armor = null;
                    let hp = -1;
                    if (true) {
                        const keys = Object.keys(weapons);
                        weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                    }
                    if (true) {
                        const keys = Object.keys(armors);
                        armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                    }
                    if (true) {
                        hp = Math.floor(Math.random() * round * 5) + 50;
                    }
                    const entity = new Entity();
                    entity.hp = hp;
                    entity.armor = armor;
                    entity.weapon = weapon;
                    enemies.push(entity);
                    found.push(entity);
                }
                if (enemies[n]) {
                    found.push(enemies[n]);
                }
                str = ""
                let killed = 0;
                for (let i = 0; i < found.length; i++) {
                    const dmg = Math.floor(Math.random() * 30 + 20 - Math.random() * found[i].armor.def);
                    found[i].hp -= dmg;
                    str += (i + 1) + ". "
                    if (found[i].weaponknown) {
                        str += "Weapon: " + found[i].weapon.name + ", ATK" + found[i].weapon.atk + ", Range" + found[i].weapon.range + ";";
                    }
                    if (found[i].armorknown) {
                        str += "Armor: " + found[i].armor.name + ", DEF" + found[i].armor.def + ";";
                    }
                    if (found[i].hpknown > 0) {
                        str += found[i].hp > 0 ? ("HP: " + found[i].hp) : "Killed";
                    }
                    str += " -" + dmg + "\n";
                    if (found[i].hp <= 0) {
                        killed++;
                        enemies.splice(enemies.indexOf(found[i]), 1);
                    }
                }
                str += ("merits + " + killed * 5);
                soldier1.merits += killed * 5;
                alert(str);
                soldier1.kit--;
                $("#content").append(`<p>You now have ${soldier1.kit}/${soldier1.kitMax} grenades.</p>`);
                return false;
            }
        }), new EventOption("enemy list", () => {
            let str = "";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weapon) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armor) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hp > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            alert(str);
            return false;
        }), new EventOption("end turn", () => {
            return true;
        })]);
        eventSoldier21 = new GameEvent("<p>Soldier(" + soldier2.name + "):</p><p>You can roll a dice to move.</p>", [new EventOption("roll a dice", () => {
            const random = Math.floor(Math.random() * 2) + 2;
            alert("You can move up to " + random + " cells on the board. (Can be less than it).");
            return true;
        }), new EventOption("open the merits store", () => {
            openStore(soldier2);
        }), new EventOption("fill ammo(in the camp)", () => {
            soldier2.ammo = soldier2.ammoMax;
            update();
            return false;
        }), new EventOption("skip", () => {
            return true;
        })])
        eventSoldier22 = new GameEvent("<p>Soldier(" + soldier2.name + "):</p><p>Please choose an action.</p>", [new EventOption("attack an enemy", () => {
            let str = "Attacking:\n0. Not in the list\n";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weaponknown) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armorknown) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hpknown > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            let n = prompt(str + "enter the number", "");
            if (n == null) {
                return false;
            }
            n = parseInt(n) - 1;
            if (n == -1) {
                let weapon = null;
                let armor = null;
                let hp = -1;
                if (true) {
                    const keys = Object.keys(weapons);
                    weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                }
                if (true) {
                    const keys = Object.keys(armors);
                    armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                }
                if (true) {
                    hp = Math.floor(Math.random() * round * 5) + 50;
                }
                const entity = new Entity();
                entity.hp = hp;
                entity.armor = armor;
                entity.weapon = weapon;
                enemies.push(entity);
                let r = prompt("input the distance between you and enemy", 3);
                if(!(parseInt(r) <= soldier2.weapon.range)) {
                    alert("This enemy is too far!");
                    return false;
                }
                attack(eventSoldier22, soldier2, entity, false, parseInt(r));
                return false;
            }
            if (enemies[n]) {
                let r = prompt("input the distance between you and enemy", 3);
                if(!(parseInt(r) <= soldier2.weapon.range)) {
                    alert("This enemy is too far!");
                    return false;
                }
                attack(eventSoldier22, soldier2, enemies[n], false, parseInt(r));
                return false;
            }
        }), new EventOption("throw grenade", () => {
            if (soldier2.kit <= 0) {
                alert("you dont have enough grenade");
                return false;
            }
            let str = "Throwing to:\n0. Not in the list";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weaponknown) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armorknown) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hpknown) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\nenter the numbers of enemies within 1 cell of the target";
            }
            let nn = prompt(str, "");
            if (!nn) {
                return false;
            }
            const found = [];
            for (let n2 = 0; n2 < nn.length; n2++) {
                let n = parseInt(nn[n2]) - 1;
                if (n == -1) {
                    let weapon = null;
                    let armor = null;
                    let hp = -1;
                    if (true) {
                        const keys = Object.keys(weapons);
                        weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                    }
                    if (true) {
                        const keys = Object.keys(armors);
                        armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                    }
                    if (true) {
                        hp = Math.floor(Math.random() * round * 5) + 50;
                    }
                    const entity = new Entity();
                    entity.hp = hp;
                    entity.armor = armor;
                    entity.weapon = weapon;
                    enemies.push(entity);
                    found.push(entity);
                }
                if (enemies[n]) {
                    found.push(enemies[n]);
                }
                str = ""
                let killed = 0;
                for (let i = 0; i < found.length; i++) {
                    const dmg = Math.floor(Math.random() * 30 + 20 - Math.random() * found[i].armor.def);
                    found[i].hp -= dmg;
                    str += (i + 1) + ". "
                    if (found[i].weaponknown) {
                        str += "Weapon: " + found[i].weapon.name + ", ATK" + found[i].weapon.atk + ", Range" + found[i].weapon.range + ";";
                    }
                    if (found[i].armorknown) {
                        str += "Armor: " + found[i].armor.name + ", DEF" + found[i].armor.def + ";";
                    }
                    if (found[i].hpknown > 0) {
                        str += found[i].hp > 0 ? ("HP: " + found[i].hp) : "Killed";
                    }
                    str += " -" + dmg + "\n";
                    if (found[i].hp <= 0) {
                        killed++;
                        enemies.splice(enemies.indexOf(found[i]), 1);
                    }
                }
                str += ("merits + " + killed * 5);
                soldier2.merits += killed * 5;
                alert(str);
                soldier2.kit--;
                $("#content").append(`<p>You now have ${soldier2.kit}/${soldier2.kitMax} grenades.</p>`);
                return false;
            }
        }), new EventOption("enemy list", () => {
            let str = "";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weapon) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armor) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hp > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            alert(str);
            return false;
        }), new EventOption("end turn", () => {
            return true;
        })]);
        eventSurgeon1 = new GameEvent("<p>Surgeon(" + surgeon.name + "):</p><p>You can roll a dice to move.</p>", [new EventOption("roll a dice", () => {
            const random = 2;
            alert("You can move up to " + random + " cells on the board. (Can be less than it).");
            return true;
        }), new EventOption("open the merits store", () => {
            openStore(surgeon);
            return false;
        }), new EventOption("fill ammo(in the camp)", () => {
            surgeon.ammo = surgeon.ammoMax;
            update();
            return false;
        }), new EventOption("skip", () => {
            return true;
        })])
        eventSurgeon2 = new GameEvent("<p>Surgeon(" + surgeon.name + "):</p><p>Please choose an action.</p>", [new EventOption("attack an enemy", () => {
            let str = "Attacking:\n0. Not in the list\n";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weaponknown) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armorknown) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hpknown > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            let n = prompt(str + "enter the number", "");
            if (n == null) {
                return false;
            }
            n = parseInt(n) - 1;
            if (n == -1) {
                let weapon = null;
                let armor = null;
                let hp = -1;
                if (true) {
                    const keys = Object.keys(weapons);
                    weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                }
                if (true) {
                    const keys = Object.keys(armors);
                    armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                }
                if (true) {
                    hp = Math.floor(Math.random() * round * 5) + 50;
                }
                const entity = new Entity();
                entity.hp = hp;
                entity.armor = armor;
                entity.weapon = weapon;
                enemies.push(entity);
                let r = prompt("input the distance between you and enemy", 3);
                if(!(parseInt(r) <= surgeon.weapon.range)) {
                    alert("This enemy is too far!");
                    return false;
                }
                attack(eventSurgeon2, surgeon, entity, false, parseInt(r));
                return false;
            }
            if (enemies[n]) {
                let r = prompt("input the distance between you and enemy", 3);
                if(!(parseInt(r) <= surgeon.weapon.range)) {
                    alert("This enemy is too far!");
                    return false;
                }
                attack(eventSurgeon2, surgeon, enemies[n], false, parseInt(r));
                return false;
            }
        }), new EventOption("heal a player", () => {
            if (surgeon.kit <= 0) {
                alert("you don't have enough kit");
                return false;
            }
            let str = `Healing:\n1. Scout(${scout.name})\n2. Soldier(${soldier1.name})\n3. Soldier(${soldier2.name})\n4. Surgeon(${surgeon.name})\nEnter the number(Make sure the character is near you, be honest plz)`;
            let nn = prompt(str, "");
            if (!nn) {
                return false;
            }
            let n = parseInt(nn);
            if (n >= 1 && n <= 4) {
                const heal = Math.floor(Math.random() * 70 + 31);
                switch (n) {
                    case 1:
                        scout.hp = Math.min(scout.hp + heal, 100);
                        break;
                    case 2:
                        soldier1.hp = Math.min(soldier1.hp + heal, 100);
                        break;
                    case 3:
                        soldier2.hp = Math.min(soldier2.hp + heal, 100);
                        break;
                    case 4:
                        surgeon.hp = Math.min(surgeon.hp + heal, 100);
                        break;
                }
                surgeon.kit--;
                surgeon.merits += 3;
                update();
                $("#content").append(`<p>You now have ${surgeon.kit}/${surgeon.kitMax} medicalKits.</p>`);
                alert("Ally healed, merit+3");
            }
            return false;
        }), new EventOption("enemy list", () => {
            let str = "";
            for (let i = 0; i < enemies.length; i++) {
                str += (i + 1) + ". ";
                if (enemies[i].weapon) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK" + enemies[i].weapon.atk + ", Range" + enemies[i].weapon.range + ";";
                }
                if (enemies[i].armor) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF" + enemies[i].armor.def + ";";
                }
                if (enemies[i].hp > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            alert(str);
            return false;
        }), new EventOption("end turn", () => {
            return true;
        })]);
        eventPush = new GameEvent("<p>The enemy advances towards us.</p>", [new EventOption("hold our ground", () => {
            const num = prompt("plz move all enemies 3 cells toward the positions, and count how many enemies are within 3 cells of our position.", 0);
            let n = parseInt(num);
            let dmg = 0;
            while(n > 0) {
                dmg += Math.floor(Math.random() * 20 + 30 - Math.random() * 30);
                n--;
            }
            positionhp -= dmg;
            if(dmg > 0)
                alert("our positions are being attacked, hp-"+dmg+", current hp:"+positionhp);
            if(positionhp <= 0) {
                alert("game over, plz refresh the page to restart");
                return false;
            }
            return true;
        })]);
        events = [
            new GameEvent("<p>A supply train arrives at the Union camp, bringing much-needed ammunition and medical supplies. However, the Confederates are aware of the train's arrival and launch a surprise attack on the camp.</p>", [new EventOption("We'll beat them!", () => {
                soldier1.hp -= 30;
                soldier2.hp -= 30;
                surgeon.hp -= 20;
                scout.hp -= 10;
                soldier1.kit = 2;
                soldier2.kit = 2;
                surgeon.kit = 5;
                scout.merits += 5;
                soldier1.merits += 5;
                soldier2.merits += 5;
                surgeon.merits += 5;
                alert("We have beaten those enemies. We paid some price but protected our supply resources. Grenade and Medical kits are filled, everyone merits+5");
                return true;
            }), new EventOption("Request reinforcements", () => {
                soldier1.hp -= 10;
                soldier2.hp -= 10;
                surgeon.hp -= 5;
                scout.hp -= 0;
                surgeon.kit = Math.min(surgeon.kit + 1, 5);
                alert("We have beaten those enemies, protected our supply resources. Medical kits +1");
                return true;
            })], (round) => {
                return 0.2;
            }),
            new GameEvent("<p>A sudden rainstorm causes the battlefield to become muddy and slippery, making it difficult for both sides to maneuver.</p>", [new EventOption("Be careful", ()=>{
                alert("Enemie's won't send troops this round, just ignore the next pages telling you to add enemies. All movement this round are slowed by 1 cell.");
                return true;
            })], (round) => {
                return round * 0.05;
            }),
            new GameEvent("<p>Confederate General Robert E. Lee launches a series of fierce attacks on the Union's left flank.</p>", [new EventOption("Go to reinforce", () => {
                soldier1.hp -= 50;
                soldier2.hp -= 50;
                surgeon.hp -= 30;
                scout.hp -= 15;
                scout.merits += 15;
                soldier1.merits += 15;
                soldier2.merits += 15;
                surgeon.merits += 15;
                alert("We withstood this wave of offensive, everyone merits+15");
                return true;
            }), new GameEvent("halt the troops and wait", () => {
                scout.merits -= 10;
                soldier1.merits -= 10;
                soldier2.merits -= 10;
                surgeon.merits -= 10;
                alert("What are you doing! We almost lost! everyone merits-10");
                return true;
            })], round => {
                return round * 0.02;
            }),
            new GameEvent("<p>A group of Union soldiers discovers a lost order from General Lee that reveals the Confederates' plans for the next day</p>", [new EventOption("Advance ambush", ()=>{
                soldier1.hp -= 10;
                soldier2.hp -= 10;
                surgeon.hp -= 5;
                scout.hp -= 5;
                scout.merits += 10;
                soldier1.merits += 10;
                soldier2.merits += 10;
                surgeon.merits += 10;
                alert("The enemies was killed unprepared, everyone merits+10");
                return true;
            }), new EventOption("Reinforce defense", () => {
                soldier1.hp -= 20;
                soldier2.hp -= 20;
                surgeon.hp -= 10;
                scout.hp -= 5;
                scout.merits += 5;
                soldier1.merits += 5;
                soldier2.merits += 5;
                surgeon.merits += 5;
                alert("We defused the enemy's offensive, everyone merits+10");
                return true;
            })], round => {
                return round * 0.02;
            }),
            new GameEvent("<p>The Union's supply of ammunition begins to run low</p>", [new EventOption("Got it", () => {
                alert("you can't fill the ammo this round");
                return true;
            })], round => {
                return 0.05;
            }),
            new GameEvent("<p>A Union soldier is badly injured and in need of medical attention.</p>", [new EventOption("Risk saving him", ()=>{
                surgeon.kit -= 1;
                surgeon.merits += 15;
                surgeon.hp -= 40;
                alert("The surgeon was ambushed by the enemy while saving him. Fortunately, our comrades arrived in time. Medical kit-1, surgeon merits+15");
                return true;
            })], round => {
                return 0.08;
            }),
            new GameEvent("<p>Our scout found a suspicious looking man who claims to be from the future.</p>", [new EventOption("What do you have in future?", () => {
                scout.weapon = weapons.deagle;
                alert('"We have more powerful guns!!!!" Out scout get {Desert Eagle ATK80 Range4}');
                return true;
            }), new EventOption("Can you save our lives?", () => {
                soldier1.armor = armors.bpvests;
                soldier2.armor = armors.bpvests;
                alert('"Sure! I have these bulletproof vests!!!!" Out soldiers get {Bulletproof Vests DEF50}');
                return true;
            }), new EventOption("Kill him", () => {
                alert('You killed the man. You don\'t know what you\'ve missed');
                return true;
            })], round => {
                if(round < 10)
                    return 0;
                return .07;
            }),
            new GameEvent("<p>A Union officer arrives with orders to retreat, but you believe that we can still win the battle if we hold our ground</p>", [new EventOption("retreat", () => {
                soldier1.hp -= 50;
                soldier2.hp -= 50;
                surgeon.hp -= 40;
                scout.hp -= 40;
                alert("We were hit hard on the way back, and finally had to return to the position");
                return true;
            }), new EventOption("stand our ground", () => {
                alert("The officer left.");
                return true;
            })], round => {
                return .06;
            }),
            new GameEvent("<p>The morale of the Confederacy has been frustrated. It's time for us to fight back!</p>", [new EventOption("let's gooooooooooooo", () => {
                if(scout.hp + soldier1.hp + soldier2.hp + surgeon.hp >= 280) {
                    if(scout.weapon.atk + soldier1.weapon.atk + soldier2.weapon.atk + surgeon.weapon.atk >= 150) {
                        alert("Congratulations!!!! We've beaten the Confederate army!");
                        $("#content").html("<h2>Congratulations!!!</h2>");
                        return false;
                    }else {
                        alert("Seem like we can't beat them now, try get better weapons");
                        return true;
                    }
                }else {
                    alert("Seem like we can't beat them now, try heal our wounds");
                    return true;
                }
            })], round => {
                if(round >= 15) {
                    return 9999999999;
                }
                return 0;
            }),
            new GameEvent("Our surgeon found a wounded Confederate soldier", [new EventOption("save him", () => {
                surgeon.weapon = weapons.w1857;
                alert("The soldier gave our surgoen a Whitworth P1857 rifle for thanks(ATK60 Range6)");
                return true;
            }), new EventOption("kill him", () => {
                surgeon.merits += 5;
                alert("Surgeon merits+5");
                return true;
            })], (round) => {
                return round > 8? 0.07 : 0;
            })
        ];

        next();

    }

    function openStore(player) {
        let str = "You can only buy things when you are in the camp\n" + `You now have ${player.merits} merits\n`;
        const wpk = Object.keys(weapons);
        const ark = Object.keys(armors);
        const pric = [7, 9, 13, 14, 25, 17, 33, 10, 20]
        for (let i = 0; i < 7; i++) {
            str += (i + 1) + `. ${weapons[wpk[i]].name} - ${pric[i]} merits\n`;
        }
        for (let i = 7; i < 9; i++) {
            str += (i + 1) + `. ${armors[ark[i - 6]].name} - ${pric[i]} merits\n`;
        }
        if (player.role == "soldier") {
            str += "10. grenade - 15 merits\n"
        }
        if (player.role == "surgeon") {
            str += "10. medical kit - 5 merits\n"
        }
        str += "enter the number";
        const num = prompt(str, 0);
        let n = parseInt(num);
        if (n >= 1 && n <= 10) {
            n = n - 1;
            if (n < 7) {
                if (pric[n] <= player.merits) {
                    player.merits -= pric[n];
                    player.weapon = weapons[wpk[n]];
                    update();
                    alert("You successfully bought " + weapons[wpk[n]].name);
                } else {
                    alert("You don't have enough merits to buy " + weapons[wpk[n]].name);
                }
            } else if (n <= 8) {
                if (pric[n] <= player.merits) {
                    player.merits -= pric[n];
                    player.armor = armors[ark[n - 6]];
                    update();
                    alert("You successfully bought " + armors[ark[n - 6]].name);
                } else {
                    alert("You don't have enough merits to buy " + armors[ark[n - 6]].name);
                }
            } else {
                if (player.kit < player.kitMax) {
                    if (player.role == "soldier") {
                        if (15 <= player.merits) {
                            player.merits -= 15;
                            player.kit++;
                            update();
                            alert("You successfully bought grenade");
                        } else {
                            alert("You don't have enough merits to buy grenade");
                        }
                    }
                    if (player.role == "surgeon") {
                        if (5 <= player.merits) {
                            player.merits -= 5;
                            player.kit++;
                            update();
                            alert("You successfully bought medical kit");
                        } else {
                            alert("You don't have enough merits to buy medical kit");
                        }
                    }
                } else {
                    alert("you can't buy this because it have reached the limit");
                }
            }
        }
    }

    function attack(event, player, entity, passive, range) {
        const atkEvent = new GameEvent(player.role + "(" + player.name + "): You are fighting with an enemy!", [new EventOption("Shoot", () => {
            if (player.ammo <= 0) {
                alert("You are out of ammo!");
                return false;
            }
            atk(true);
            if (entity.hp <= 0) {
                alert("You killed an enemy, merits +5");
                player.merits += 5;
                present(event);
                enemies.splice(enemies.indexOf(entity), 1);
                return false;
            }
            atk(false);
            if (player.hp <= 0) {
                alert("You are killed by an enemy. ggwp :(");
                present(event);
                return true;
            }
        }), new EventOption("Retreat", () => present(event))]);
        present(atkEvent);
        entity.weaponknown = true;
        entity.armorknown = true;
        $("#content").append("<p>Enemy Info: " + "Weapon: " + entity.weapon.name + ", ATK" + entity.weapon.atk + ", Range" + entity.weapon.range + ";" + "Armor: " + entity.armor.name + ", DEF" + entity.armor.def + ";" + "</p>")
        if (!passive) {
            if (player.ammo <= 0) {
                alert("You are out of ammo!");
                present(event);
                return false;
            }
            atk(!passive);
            if (entity.hp <= 0) {
                alert("You killed an enemy, merits +5");
                player.merits += 5;
                present(event);
                enemies.splice(enemies.indexOf(entity), 1);
                return false;
            }
        }
        atk(false);
        if (player.hp <= 0) {
            alert("You are killed by an enemy. ggwp :(");
            next();
            return;
        }
        function atk(attacking) {
            if (!attacking) {
                if(range > entity.weapon.range) {
                    range --;
                    $("#content").append("<p>Enemy moved toward you.</p>");
                    return;
                }
                let dmg = Math.floor(Math.random() * (entity.weapon.atk - entity.weapon.matk) + entity.weapon.matk - Math.random() * player.armor.def);
                player.hp -= dmg;
                $("#content").append("<p>Enemy shot on you! -" + dmg + "</p>");
            } else {
                if(range > player.weapon.range + (player.role == "scout" ? 1 : 0)) {
                    range --;
                    $("#content").append("<p>You moved toward enemy.</p>");
                    return;
                }
                player.ammo--;
                let dmg = Math.floor(Math.random() * (player.weapon.atk - player.weapon.matk) + player.weapon.matk - Math.random() * entity.armor.def);
                entity.hp -= dmg;
                $("#content").append("<p>You shot on the enemy! -" + dmg + "</p>");
            }
            update();
        }
    }

    /**
     * 
     * @param {GameEvent} event 
     */
    function present(event) {
        update();
        $("#content").html(event.desc);
        for (let i = 0; i < 4; i++) {
            const option = event.options.length >= i ? event.options[i] : null;
            if (option) {
                $("#o" + i).html(option.name);
                $("#o" + i).prop("disabled", false);
                $("#o" + i).off("click.game")
                $("#o" + i).on('click.game', () => {
                    if (option.callback()) {
                        //todo
                        next()
                    }
                });
            } else {
                $("#o" + i).prop("disabled", true);
            }
        }
    }

    function next() {
        step++;
        if (step == 0) {
            present(eventEnemy);
        }
        if (step == 1) {
            if (scout.hp > 0)
                present(eventScout1);
            else next();
        }
        if (step == 2) {
            if (scout.hp > 0)
                present(eventScout2);
            else next();
        }
        if (step == 3) {
            if (soldier1.hp > 0)
                present(eventSoldier11);
            else next();
        }
        if (step == 4) {
            if (soldier1.hp > 0) {
                present(eventSoldier12);
                $("#content").append(`<p>You now have ${soldier1.kit}/${soldier1.kitMax} grenades.</p>`);
            }
            else next();
        }
        if (step == 5) {
            if (soldier2.hp > 0)
                present(eventSoldier21);
            else next();
        }
        if (step == 6) {
            if (soldier2.hp > 0) {
                present(eventSoldier22);
                $("#content").append(`<p>You now have ${soldier2.kit}/${soldier2.kitMax} grenades.</p>`);
            }
            else next();
        }
        if (step == 7) {
            if (surgeon.hp > 0)
                present(eventSurgeon1);
            else next();
        }
        if (step == 8) {
            if (surgeon.hp > 0) {
                present(eventSurgeon2);
                $("#content").append(`<p>You now have ${surgeon.kit}/${surgeon.kitMax} medicalKits.</p>`);
            }
            else next();
        }
        if(step == 9) {
            present(eventPush);
        }
        if(step == 10) {
            round++;
            step = -1;
            if(Math.random() < 0.55) {
                present(new GameEvent("Nothing special happened.", [new EventOption("next", () => {
                    return true;
                })]));
                return;
            }
            let chance = 0;
            for(const evt of events) {
                chance += evt.getPriority(round);
            }
            let rand = Math.random() * chance;
            for(const evt of events) {
                if(rand <= evt.getPriority(round)) {
                    events.splice(events.indexOf(evt), 1);
                    present(evt);
                    break;
                }
                rand -= evt.getPriority(round);
            }
        }
    }

    function update() {
        try {
            $("#sc").html(`Scout(${scout.ammo}/${scout.ammoMax})`);
            $("#sc1").html(`ATK: ${scout.weapon.atk} Range: ${scout.weapon.range + 1}`);
            $("#sc2").html(`DEF: ${scout.armor.def} ${scout.hp}/100`);
            $("#so1").html(`Soldier(${soldier1.ammo}/${soldier1.ammoMax})`);
            $("#so11").html(`ATK: ${soldier1.weapon.atk} Range: ${soldier1.weapon.range}`);
            $("#so12").html(`DEF: ${soldier1.armor.def} ${soldier1.hp}/100`);
            $("#so2").html(`Soldier(${soldier2.ammo}/${soldier2.ammoMax})`);
            $("#so21").html(`ATK: ${soldier2.weapon.atk} Range: ${soldier2.weapon.range}`);
            $("#so22").html(`DEF: ${soldier2.armor.def} ${soldier2.hp}/100`);
            $("#su").html(`Surgeon(${surgeon.ammo}/${surgeon.ammoMax})`);
            $("#su1").html(`ATK: ${surgeon.weapon.atk} Range: ${surgeon.weapon.range}`);
            $("#su2").html(`DEF: ${surgeon.armor.def} ${surgeon.hp}/100`);
        } catch (ignored) { };
    }

});