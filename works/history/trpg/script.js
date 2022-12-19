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
    at1837 : new Weapon("Allen & Thurber M1837 revolver pepperbox", 2, 34, 15),
    c1847 : new Weapon("Colt M1847 Walker revolver", 2, 44, 22),
    c1860 : new Weapon("Colt M1860 Army revolver", 3, 44, 20),
    w1850 : new Weapon("Wesson and Leavitt M1850 Dragoon revolver", 3, 40, 30),
    e1853r : new Weapon("Enfield P1853 rifled musket", 4, 58, 25),
    g1861c : new Weapon("Gallager M1861 carbine", 3, 52, 33),
    s1861r : new Weapon("Springfield M1861 rifled musket", 5, 58, 30),
    w1857 : new Weapon("Whitworth P1857 rifle", 6, 60, 40),
    deagle : new Weapon("Desert Eagle", 4, 80, 50)
}

const armors = {
    none : new Armor("No armor", 5),
    leather : new Armor("Leather armor", 15),
    iron : new Armor("Iron armor", 25),
    bpvests : new Armor("Bulletproof vests", 50)
}

$(() => {
    
    let round = 0;
    let step = 0;

    let scout;
    let soldier1;
    let soldier2;
    let surgeon;

    let special = 0;

    const enemies = [];

    present(new GameEvent("<p>Before starting the game, plz put in players' names for each character.<p>", [new EventOption("ok, let's start!", () => {
        scout = new Player(prompt("Please input the player's name who is playing the scout."), "scout");
        soldier1 = new Player(prompt("Please input the player's name who is playing the soldier 1."), "soldier");
        soldier2 = new Player(prompt("Please input the player's name who is playing the soldier 2."), "soldier");
        surgeon = new Player(prompt("Please input the player's name who is playing the surgeon."), "surgeon");
        start();
        return false;
    }), null, null, null]));



    function start() {
        $("#scn").html(scout.name);
        $("#so1n").html(soldier1.name);
        $("#so2n").html(soldier2.name);
        $("#sun").html(surgeon.name);
        const eventEnemy = new GameEvent("<p>A group of Confederate soldiers are trying to advance our position</p>", [new EventOption("roll a dice", () => {
            const random = Math.floor(Math.random() * round / 2) + 1;
            alert("plz put "+random+" enemy soldiers on enemy's side on the gameboard");
            return true;
        }), null, null, null]);
        const eventScout = new GameEvent("<p>Scout("+scout.name+"):</p><p>You can roll a dice to move.</p>", [new EventOption("roll a dice", () => {
            const random = Math.floor(Math.random() * 4) + 3;
            alert("You can move up to "+random+" cells on the board. (Can be less than it).");
            return true;
        }), new EventOption("open the merits store", () => {
    
        }), new EventOption("skip", () => {
            return true;
        })])
        const eventScout2 = new GameEvent("<p>Scout("+scout.name+"):</p><p>Please choose an action.</p>", [new EventOption("attack an enemy", () => {
            let str = "Attacking:\n0. Not in the list";
            for(let i = 0; i < enemies.length; i++) {
                enemies += (i+1) + ". "
                if(enemies[i].weapon) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK"+enemies[i].weapon.atk+", Range"+enemies[i].weapon.range+";";
                }
                if(enemies[i].armor) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF"+enemies[i].armor.def+";";
                }
                if(enemies[i].hp > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\nenter the number";
            }
            let n = prompt(str, "");
            if(n == null) {
                return false;
            }
            n = parseInt(n) - 1;
            if(n == -1) {
                let weapon = null;
                let armor = null;
                let hp = -1;
                if(chosen.indexOf("1") != -1) {
                    const keys = Object.keys(weapons);
                    weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                }
                if(chosen.indexOf("2") != -1) {
                    const keys = Object.keys(armors);
                    armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                }
                if(chosen.indexOf("3") != -1) {
                    hp = Math.floor(Math.random() * round * 5) + 50;
                }
                const entity = new Entity();
                entity.hp = hp;
                entity.armor = armor;
                entity.weapon = weapon;
                enemies.push(entity);
                attack(eventScout2, scout, entity, false);
                return false;
            }
            if(enemies[n]) {
                attack(eventScout2, scout, enemies[n], false);
                return false;
            }
        }), new EventOption("gather information", () => {
            let num = prompt("how many enemies are in 3 cells? (Except those that have been detected)", 1);
            if(num == null) {
                return false;
            }
            num = parseInt(num);
            if(num < 1) {
                return false;
            }
            let chosen = prompt("What information do you want:\n1. Weapon\n2. Armor\n3. HP\nplz enter the number(can be multiple, such as:123)", 1);
            if(chosen == null || chosen.replace("[^0-9]", "") != chosen) {
                return false;
            }
            const found = [];
            for(let i = 0; i < num; i++) {
                let weapon = null;
                let armor = null;
                let hp = -1;
                if(chosen.indexOf("1") != -1) {
                    const keys = Object.keys(weapons);
                    weapon = weapons[keys[Math.min(Math.floor(Math.random() * (round)), keys.length - 2)]];
                }
                if(chosen.indexOf("2") != -1) {
                    const keys = Object.keys(armors);
                    armor = armors[keys[Math.min(Math.floor(Math.random() * (round / 5)), keys.length - 2)]];
                }
                if(chosen.indexOf("3") != -1) {
                    hp = Math.floor(Math.random() * round * 5) + 50;
                }
                const entity = new Entity();
                entity.hp = hp;
                entity.armor = armor;
                entity.weapon = weapon;
                enemies.push(entity);
                found.push(entity);
            }
            let str = "";
            for(let i = 0; i < found.length; i++) {
                str += (i+1) + ". "
                if(found[i].weapon) {
                    str += "Weapon: " + found[i].weapon.name + ", ATK"+found[i].weapon.atk+", Range"+found[i].weapon.range+";";
                }
                if(found[i].armor) {
                    str += "Armor: " + found[i].armor.name + ", DEF"+found[i].armor.def+";";
                }
                if(found[i].hp > 0) {
                    str += "HP: " + found[i].hp;
                }
                str += "\n";
            }
            str += ("merits + "+found.length +"\n(Assign these attributes to the detected enemies and try to remember them, you can use some props to mark them)");
            scout.merits += found.length;
            alert(str);
            $("#o1").prop("disabled", true);
            let infs = chosen.length - 1;
            for(let i = 0; i < found.length; i++) {
                if(Math.random() < infs * 0.33) {
                    alert("An enemy have found you!");
                    attack(eventScout2, scout, found[i], true);
                    break;
                }
            }
            return false;
        }), new EventOption("enemy list", () => {
            let str = "";
            for(let i = 0; i < enemies.length; i++) {
                enemies += (i+1) + ". "
                if(enemies[i].weapon) {
                    str += "Weapon: " + enemies[i].weapon.name + ", ATK"+enemies[i].weapon.atk+", Range"+enemies[i].weapon.range+";";
                }
                if(enemies[i].armor) {
                    str += "Armor: " + enemies[i].armor.name + ", DEF"+enemies[i].armor.def+";";
                }
                if(enemies[i].hp > 0) {
                    str += "HP: " + enemies[i].hp;
                }
                str += "\n";
            }
            alert(str);
            return false;
        }), new EventOption("end turn", () => {
            return true;
        })]);
    
        const events = [
            new GameEvent("<p>A supply train arrives at the Union camp, bringing much-needed ammunition and medical supplies. However, the Confederates are aware of the train's arrival and launch a surprise attack on the camp.</p>", [new EventOption("We'll beat them!")])
        ];

        present(eventScout2);

    }

    function attack(event, player, entity, passive) {
        const atkEvent = new GameEvent(player.role + "("+player.name+"): You are fighting with an enemy!", [new EventOption("Shoot", ()=>{
            atk(true);
            if(entity.hp <= 0) {
                alert("You killed an enemy, merits +5");
                player.merits += 5;
                present(event);
                enemies
                return false;
            }
            atk(false);
            if(player.hp <= 0) {
                alert("You are killed by an enemy. ggwp :(");
                present(event);
                return true;
            }
        }), new EventOption("Retreat", () => present(event))]);

        $("#content").append("<p>Enemy Info: "+"Weapon: " + entity.weapon.name + ", ATK"+entity.weapon.atk+", Range"+entity.weapon.range+";"+"Armor: " + entity.armor.name + ", DEF"+entity.armor.def+";"+"</p>")
        atk(!passive);
        if(!passive) {
            if(entity.hp <= 0) {
                alert("You killed an enemy, merits +5");
                player.merits += 5;
                present(event);
                return false;
            }
            atk(false);
            if(player.hp <= 0) {
                alert("You are killed by an enemy. ggwp :(");
                present(event);
                return;
            }
        }
        function atk(attacking) {
            if(!attacking) {
                let dmg = Math.floor(Math.random() * (entity.weapon.atk - entity.weapon.matk) + entity.weapon.matk - Math.random() * player.armor.def);
                player.hp -= dmg;
                $("#content").append("<p>Enemy shot on you! -"+dmg+"</p>");
            }else {
                let dmg = Math.floor(Math.random() * (player.weapon.atk - player.weapon.matk) + player.weapon.matk - Math.random() * entity.armor.def);
                entity.hp -= dmg;
                $("#content").append("<p>You shot on the enemy! -"+dmg+"</p>");
            }
        }
    }

    /**
     * 
     * @param {GameEvent} event 
     */
    function present(event) {
        $("#content").html(event.desc);
        for(let i = 0; i < 4; i++) {
            const option = event.options.length >= i ? event.options[i] : null;
            if(option) {
                $("#o"+i).html(option.name);
                $("#o"+i).prop("disabled", false);
                $("#o"+i).off("click.game")
                $("#o"+i).on('click.game', () => {
                    if(option.callback()) {
                        //todo
                        step++;
                    }
                });
            }else {
                $("#o"+i).prop("disabled", true);
            }
        }
    }

});