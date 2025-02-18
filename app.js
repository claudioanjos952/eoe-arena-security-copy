var SHARED = {};

var SERVER = {
  io: null,
  db: null,
  Sockets: {},
  Sessions: {},
  Players: {},
  Challenges: {},
  Games: {},
  counter: 0,
  lastOnlineList: [],
  turnTime: 15, // seconds
};

SERVER.User = function (data) {
  this.name = data.username,
  this.id = data.id;
  this.socket = data.socket;
  this.char_id = data.char_id;
  this.character = {};
  this.player = new SERVER.Player(this);
  var scope = this;
  this.getCharacter().then((ret) => {
    scope.character = ret;
  });
};

SERVER.User.prototype.getCharacter = function () {
  var scope = this;
  return new Promise((resolve, reject) => {
    SERVER.db.characters.findOne({ _id: scope.char_id }, function (err, res) {
      if (res) {
        var character = {
          name: scope.name,
          stats: {
            to: res.to,
            st: res.st,
            dx: res.dx,
            in: res.in,
            wi: res.wi,
            sp: res.sp
          },
          xp: res.xp,
          respect: res.respect,
          kg: res.kg,
          points: res.pts,
          xplock: res.xplock || 0,
          weapon: res.weapon,
          bow: res.bow,
          armor: res.armor,
          bomb: res.bomb,
          trap: res.trap,
          movement: res.movement || [],
          defense: res.defense || [],
          melee: res.melee || [],
          range: res.range || [],
          magic: res.magic || [],
          magic2: res.magic2 || [],
          taunts: res.taunts || [],
          id: scope.char_id,
        };
        resolve(character);
      } else {
        reject("Can't find character by ID.");
      }
    });
  });
};

SERVER.User.prototype.getObject = function () {
  var scope = this;
  var obj = {
    id: this.id,
  };
  return new Promise((resolve, reject) => {
    scope.getCharacter().then((char) => {
      obj.character = char;
      resolve(obj);
    });
  });
};

SERVER.User.prototype.getXP = function () {
  return 150;
};

SERVER.init = function () {
  // Express init
  var express = require('express');
  var app = express();
  var serv = require('http').Server(app);

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
  });
  app.get('/shared/utils.js', function (req, res) {
    res.sendFile(__dirname + '/shared/utils.js');
  });
  app.get('/ajax', function (req, res) {
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      if (Object.keys(req.query).length > 0) {
        console.log("GET request with params: " + JSON.stringify(req.query));
        res.writeHead(200, {'Content-Type': 'application/json'});
        var token = req.headers['cookie'].split('token=').pop().split(';').shift();
        if (SERVER.Sessions.hasOwnProperty(token)) {
          var user = SERVER.Sessions[token];
          req.query._user = user;
        } else {
          res.end(JSON.stringify({ status: -1 }));
          return;
        }
        SERVER.getGETResponse(req.query).then((obj) => {
          res.end(JSON.stringify(obj));
        });
      }
    }
  });
  app.post('/ajax', function (req, res) {
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      var body = '';
      req.on('data', function (data) {
        body += data;
      });
      req.on('end', function () {
        if (body.length > 0) {
          var parsed = JSON.parse(body);
          res.writeHead(200, {'Content-Type': 'application/json'});
          if (parsed.ajax_action != "login" && parsed.ajax_action != "register" && parsed.ajax_action != "authenticate") {
            var token = req.headers['cookie'].split('token=').pop().split(';').shift();
            if (SERVER.Sessions.hasOwnProperty(token)) {
              var user = SERVER.Sessions[token];
              parsed._user = user;
            } else {
              res.end(JSON.stringify({ status: -1 }));
              return;
            }
          }
          SERVER.getPOSTResponse(parsed).then((obj) => {
            res.end(JSON.stringify(obj));
          });
        }
      });
    }
  });

  app.use('/client', express.static(__dirname + '/client'));
  serv.listen(process.env.PORT || 2000);

  // MongoDB init
  var mongo_user = process.env.MONGO_USER;
  var mongo_pass = process.env.MONGO_PASS;
  var mongo_url =  process.env.MONGO_URL;
  console.log(mongo_pass, mongo_user)
  var uri = "mongodb+srv://" + mongo_user + ":" + mongo_pass + "@" + mongo_url + "/?retryWrites=true&w=majority&appName=EoeArenaSecurityCopy";
  this.db = require("mongojs")(uri, ['users', 'characters', 'skills', 'items', 'finished_battles']);
	
  // Socket.io init
  this.io = require('socket.io')(serv, {});

  // encrytpion
  md5 = require('md5');
  crypto = require('crypto');

  // load shared utilities
  SHARED = require('./shared/utils.js');

  SPELLS = require('./server/spells.js');
  SKILLS = require('./server/skills.js');

  SERVER.db.skills.find({}, function (err, res) {
    SERVER.SKILL_INFO = res;
    SERVER.db.items.find({}, function (err2, res2) {
      SERVER.ITEM_INFO = res2;
      console.log("Server started.");
    });
  });

};

SERVER.onSocketConnection = function (socket) {
  SERVER.Sockets[socket.id] = socket;

  //var player = new SERVER.Player(socket.id);
  //SERVER.Players[socket.id] = player;

  var onevent = socket.onevent;
  socket.onevent = function (packet) {
    var args = packet.data || [];
    onevent.call (this, packet);    // original call
    packet.data = ["*"].concat(args);
    onevent.call(this, packet);      // additional call to catch-all
  };

  // check socket authentity
  socket.on("*", function (evt, data) {
    if (data.session_token && SERVER.Sessions.hasOwnProperty(data.session_token)) {
      SERVER.handleSocketMessage(socket, evt, data);
    } else {
      // user authentication failure, please re-auth
      socket.emit('auth-failure', {});
    }
  });

  socket.on('disconnect', function () {
    var token = SERVER.getTokenBySocket(socket);
    delete SERVER.Sockets[socket.id];
    if (token) SERVER.Sessions[token].dc_timestamp = + new Date();
  })

};

SERVER.handleSocketMessage = function (socket, evt, data) {
  var player = SERVER.getPlayerBySocket(socket);
  if (!player) return;

  switch (evt) {
    case 'challenge-player':
      if (player.game == null) {
        var challenge = new SERVER.Challenge(player.user.id, data.id);
      } else {
        socket.emit('alert', { content: "You are already in game or waiting for the game to start." });
      }
      break;
    case 'challenge-response':
      var ch = SERVER.Challenges[data.ch_id];
      if (typeof ch === 'undefined' || ch.receiver.user.id != player.user.id || ch.game) {
        socket.emit('alert', { content: "Sorry but this challenge does not exist anymore." });
      } else {
        if (data.response) {
          ch.accept();
        } else {
          ch.reject();
        }
      }
      break;
    case 'challenge-withdraw':
      var ch = SERVER.Challenges[data.ch_id];
      if (typeof ch === 'undefined' || ch.sender.user.id != player.user.id || ch.game) {
        socket.emit('alert', { content: "Sorry but this challenge does not exist anymore." });
      } else {
        ch.withdraw();
      }
      break;
    case 'turn-actions':
      var game = SERVER.getGameByPlayer(player);
      if (game) {
        game.comitActions(player, data.actions);
      }
      break;
    case 'request-online':
      player.user._needsOnlineUpdate = true;
      break;
    case 'debug':
      console.log("DEBUG: ", data);
      break;
  };
};

// Authentication
SERVER.getUser = function (data) {
  return new Promise((resolve, reject) => {
    if (!SERVER.Sessions.hasOwnProperty(data.token)) {
      // user with this token is not authenticated
      resolve({ status: 0 });
    } else {
      // user is authenticated, return user info
      var user = SERVER.Sessions[data.token];
      user.getObject().then((obj) => {
        var prevSocket = user.socket?.id;
        user.socket = SERVER.Sockets[data.socket_id];
        delete SERVER.Sockets[prevSocket];
        delete user.dc_timestamp;
        resolve({ status: 1, user: obj });
      });
    }
  });
};

SERVER.createUser = function (data) {
  // do checks if user name exists etc
  return new Promise((resolve, reject) => {
    if (data.username.length > 16) {
      resolve({ status: 0, msg: "Username is too long. Max 16 characters." });
    } else {
      SERVER.db.users.findOne({ name: data.username }, function (err, res) {
        if (res) { // found something
          resolve({ status: 0, msg: "Username is taken by somebody else." });
        } else { // found nothing
          SERVER.db.characters.insert(JSON.parse(JSON.stringify(SERVER.level0char)), function (err2, res2) {
            if (res2) {
              SERVER.db.users.insert({ name: data.username, pass: data.password, char_id: res2._id }, function (err3, res3) {
                if (res3) {
                  resolve({ status: 1 });
                } else {
                  resolve({ status: 0, msg: "Cannot create an account with this username." });
                }
              });
            } else {
              resolve({ status: 0, msg: "Account creation failed." });
            }
          });
        }
      });
    }
  });
};

SERVER.loginUser = function (data) {
  return new Promise((resolve, reject) => {
    SERVER.db.users.findOne({ name: data.username, pass: data.password }, function (err, res) {
      if (res) { // found something
        var token = Math.random().toString();
        var user = new SERVER.User({
          id: res._id, // id from database
          socket: SERVER.getSocketById(data.socket_id),
          username: data.username,
          char_id: res.char_id,
        });
        SERVER.Sessions[token] = user;
        user.getObject().then((obj) => {
          resolve({
            status: 1,
            token: token,
            user: obj,
          });
        });
      } else { // found nothing
        resolve({ status: 0 });
      }
    });
  });
};

SERVER.getItems = function (type, order) {
  return new Promise((resolve, reject) => {
    SERVER.db.items.find({ type: type }, { _id: 0, desc: 0 }, function (err, res) {
      if (res[0]) {
        resolve(res.sort((a, b) => { return a.req[order] - b.req[order] }));
      }
    });
  });
};

SERVER.getSkills = function (type, order) {
  return new Promise((resolve, reject) => {
    SERVER.db.skills.find({ type: type }, { _id: 0 }, function (err, res) {
      if (res[0]) {
        resolve(res.sort((a, b) => { return a.req[order] - b.req[order] }));
      }
    });
  });
};

SERVER.getGETResponse = function (obj) {
  return new Promise((resolve, reject) => {
    // TODO: get cookie token and check if exists
    switch (obj.ajax_action) {
      case 'get-items':
        SERVER.getItems(parseInt(obj.type), parseInt(obj.order)).then(resolve);
        break;
      case 'get-skills':
        SERVER.getSkills(parseInt(obj.type), parseInt(obj.order)).then(resolve);
        break;
      default:
        resolve({});
        break;
    }
  });
};

SERVER.getPOSTResponse = function (obj) {
  return new Promise((resolve, reject) => {
    var time = new Date();
    console.log("[" + time.toString().substring(16, 24) + "|" + obj.ajax_action + "]" + " T:" + obj.token);
    switch (obj.ajax_action) {
      case "login":
        SERVER.loginUser(obj).then(resolve);
        break;
      case "register":
        SERVER.createUser(obj).then(resolve);
        break;
      case "authenticate":
        SERVER.getUser(obj).then(resolve);
        break;
      case "equip-item":
        SERVER.equipItem(obj).then(resolve);
        break;
      case "get-character":
        obj._user.getCharacter().then(resolve);
        break;
      case "activate-skill":
        SERVER.activateSkill(obj).then(resolve);
        break;
      case "deactivate-skill":
        SERVER.deactivateSkill(obj).then(resolve);
        break;
      case "level-stat":
        SERVER.levelUpStat(obj).then(resolve);
        break;
      default:
        resolve({});
        break;
    }
  });
};

SERVER.levelUpStat = function (obj) {
  return new Promise ((resolve, reject) => {
    if (obj._user.character.points > 0) {
      var plus = SHARED.getStatPlusAmount(obj._user.character.stats[obj.stat]);
      update = { $inc: {
        pts: -1,
      } };
      update.$inc[obj.stat] = plus;
      SERVER.db.characters.update({ _id: obj._user.char_id }, update, function (err, res) {
        if (res) {
          obj._user.character.stats[obj.stat] += plus;
          obj._user.character.points--;
          resolve ({ status: 1 });
        } else     resolve ({ status: 0, msg: "Leveling up stat failed." });
      });
    } else resolve ({ status: 0, msg: "You don't have any more skill points." });
  });
};

SERVER.equipItem = function (obj) {
  return new Promise ((resolve, reject) => {
    // check if user has requirements
    var char = obj._user.character;
    obj.id = parseInt(obj.id);
    SERVER.db.items.findOne({ id: obj.id }, function (err, res) {
      if (res) {
        if (SERVER.meetRequirements(char, res.req)) {
          var types = ['none', 'weapon', 'bow', 'armor', 'charm', 'bomb', 'trap'];
          var update = { $set: {} };
          update.$set[types[res.type]] = obj.id;
          char[types[res.type]] = obj.id;
          SERVER.db.characters.update({ _id: char.id }, update, function (err2, res2) {
            if (res) { // item equipped, recalculate char weight
              SERVER.db.items.find({ id: {
                $in: [char.weapon, char.bow, char.armor, char.bomb, char.trap]
              }}, function (err3, res3) {
                var w = 0;
                for (var i = 0; i < res3.length; ++i) {
                  w += res3[i].weight;
                }
                char.kg = w;
                SERVER.db.characters.update({ _id: char.id }, { $set: { kg: w } }, function (err4, res4) {
                  if (res) resolve({ status: 1 });
                  else resolve({ status: 0, msg: "Failed weight recalculation." });
                });
              });
            } else resolve({ status: 0, msg: "Failed to equip the item." });
          });
        } else {
          resolve({ status: 0, msg: "You don't meet the requirements to equip this item." });
        }
      } else resolve({ status: 0, msg: "The item you are trying to equip does not exist." });
    });
  });
};

SERVER.activateSkill = function (obj) {
  return new Promise ((resolve, reject) => {
    // check if user has requirements
    var char = obj._user.character;
    obj.id = parseInt(obj.id);
    SERVER.db.skills.findOne({ id: obj.id }, function (err, res) {
      if (res) {
        if (res.enabled) {
          if (SERVER.meetRequirements(char, res.req)) {
            var types = ['none', 'melee', 'range', 'movement', 'defense', 'magic', 'magic2', 'magic', 'magic2'];
            if (char[types[res.type]].length + 1 <= SHARED.skillLimit[types[res.type]]) {
              var update = { $set: {} };
              char[types[res.type]].push(obj.id);
              update.$set[types[res.type]] = char[types[res.type]];
              SERVER.db.characters.update({ _id: char.id }, update, function (err2, res2) {
                if (res) {
                  resolve({ status: 1 });
                } else resolve({ status: 0, msg: "Error. Cannot activate this " + (res.type > 4 ? "spell." : "skill.") });
              });
            } else resolve({ status: 0, msg: "You have reached the limit of active " + (res.type > 4 ? "spells" : "skills") + " of this type." });
          } else resolve({ status: 0, msg: "You don't meet the requirements to use this " + (res.type > 4 ? "spell" : "skill") + "." });
        } else resolve({ status: 0, msg: "The skill is disabled and cannot be activated." });
      } else resolve({ status: 0, msg: "The " + (res.type > 4 ? "spell" : "skill") + " you are trying to activate does not exist." });
    });
  });
};

SERVER.deactivateSkill = function (obj) {
  return new Promise ((resolve, reject) => {
    // check if user has requirements
    var char = obj._user.character;
    obj.id = parseInt(obj.id);
    SERVER.db.skills.findOne({ id: obj.id }, function (err, res) {
      if (res) {
        var types = ['none', 'melee', 'range', 'movement', 'defense', 'magic', 'magic2', 'magic', 'magic2'];
        var update = { $set: {} };
        var index = char[types[res.type]].indexOf(obj.id);
        if (index >= 0) {
          char[types[res.type]].splice(index, 1);
          update.$set[types[res.type]] = char[types[res.type]];
          SERVER.db.characters.update({ _id: char.id }, update, function (err2, res2) {
            if (res) {
              resolve({ status: 1 });
            } else resolve({ status: 0, msg: "Error. Cannot deactivate this " + (res.type > 4 ? "spell." : "skill.") });
          });
        } else resolve({ status: 0, msg: "You cannot deactivate what's inactive." });
      } else resolve({ status: 0, msg: "The " + (res.type > 4 ? "spell" : "skill") + " you are trying to deactivate does not exist." });
    });
  });
};

SERVER.meetRequirements = function (char, req) {
  var meet = true;
  var s = ['to', 'st', 'dx', 'in', 'wi', 'sp'];
  for (var i = 0; i < req.length; ++i) {
    if (char.stats[s[i]] < req[i]) meet = false;
  }

  return meet;
};

SERVER.Player = function (user) {
  this.user = user;
  this.state = 0; // 0 - idle, 1 - in-game
  this.game = null;
  this.gameState = {
    hp: 0,
    tile: null,
    buffs: null,
  }
};

SERVER.Player.prototype.moveToPosition = function (newPos, dontTriggerTraps) {
  var current = this.gameState.tile;
  var newTile = this.game.arena.getTileByPos(newPos);

  current.player = null;
  newTile.player = this;
  this.gameState.tile = newTile;

  if (!dontTriggerTraps && newTile.trap) {
    console.log("TODO: Traps");
  }
};


SERVER.Player.prototype.getActiveActions = function () {
  var scope = this;
  return new Promise((resolve, reject) => {
    var types = ['', 'MELEE', 'RANGE', 'MOVE', 'DEFEND', 'MAGIC', 'MAGIC2', 'MAGIC', 'MAGIC2'];
    var skills_id = [];
    var skills = {};
    skills_id = scope.user.character.movement.concat(scope.user.character.melee, scope.user.character.range, scope.user.character.defense, scope.user.character.magic, scope.user.character.magic2);
    SERVER.db.skills.find({ id: { $in: skills_id } }, function (err, res) {
      if (res) {
        for (var i = 0; i < res.length; ++i) {
          var key = types[res[i].type] + "-" + res[i].name.replace(/\s/g, '_').toUpperCase();
          skills[key] = {
            id: res[i].id,
            cost: res[i].energy,
          }
        }
        skills['END-END_TURN'] = { id: -1, cost: 0 };
        skills['END-FORFEIT_GAME'] = { id: -2, cost: 0 };
        resolve(skills);
      } else {
        console.log("Error: getActiveActionArray() - cannot get skills from db");
      }
    });
  });
};

SERVER.updateUserChallenges = function (user_id) {
  var received_challenges = [];
  var sent_challenges = [];
  for (var i in SERVER.Challenges) {
    var ch = SERVER.Challenges[i];
    if (ch.receiver.user.id == user_id) {
      received_challenges.push({
        id: ch.id,
        name: ch.sender.user.name,
        lvl: ch.sender.user.character.xp,
        respect: ch.sender.user.character.respect,
      });
    } else if (ch.sender.user.id == user_id) {
      sent_challenges.push({
        id: ch.id,
        name: ch.receiver.user.name,
        lvl: ch.receiver.user.character.xp,
        respect: ch.receiver.user.character.respect,
      });
    }
  }

  SERVER.getPlayerById(user_id).user.socket.emit('challenges-update', { sent: sent_challenges, received: received_challenges });

};

SERVER.Challenge = function (sender_id, receiver_id) {
  this.id = SERVER.counter++;
  this.sender = SERVER.getPlayerById(sender_id);
  this.receiver = SERVER.getPlayerById(receiver_id);
  this.game = null;

  SERVER.Challenges[this.id] = this;

  console.log("Player '" + this.sender.us
