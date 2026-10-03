'use strict';

var kolmafia = require('kolmafia');

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: false
  }), e;
}
function _createForOfIteratorHelper(r, e) {
  var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (!t) {
    if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e) {
      t && (r = t);
      var n = 0,
        F = function () {};
      return {
        s: F,
        n: function () {
          return n >= r.length ? {
            done: true
          } : {
            done: false,
            value: r[n++]
          };
        },
        e: function (r) {
          throw r;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var o,
    a = true,
    u = false;
  return {
    s: function () {
      t = t.call(r);
    },
    n: function () {
      var r = t.next();
      return a = r.done, r;
    },
    e: function (r) {
      u = true, o = r;
    },
    f: function () {
      try {
        a || null == t.return || t.return();
      } finally {
        if (u) throw o;
      }
    }
  };
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = true,
      o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = !1;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = true, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (String )(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

var BARS_DATA = {
	"0,0,0": [
	954,
	1081,
	1154,
	1207
],
	"0,0,1": [
	1044,
	1160,
	1231,
	1282
],
	"0,0,2": [
	1123,
	1242,
	1315,
	1364
],
	"0,0,3": [
	1226,
	1353,
	1427,
	1477
],
	"0,1,1": [
	1138,
	1260,
	1339,
	1391
],
	"0,1,2": [
	1246,
	1379,
	1452,
	1502
],
	"0,1,3": [
	1256,
	1387,
	1459,
	1508
],
	"0,2,2": [
	1315,
	1445,
	1515,
	1564
],
	"0,2,3": [
	1385,
	1511,
	1583,
	1632
],
	"0,3,3": [
	1436,
	1560,
	1630,
	1678
],
	"1,1,1": [
	1192,
	1321,
	1395,
	1445
],
	"1,1,2": [
	1283,
	1415,
	1486,
	1535
],
	"1,1,3": [
	1338,
	1464,
	1532,
	1579
],
	"1,2,2": [
	1352,
	1483,
	1554,
	1603
],
	"1,2,3": [
	1418,
	1537,
	1605,
	1650
],
	"1,3,3": [
	1481,
	1592,
	1656,
	1697
],
	"2,2,2": [
	1389,
	1517,
	1588,
	1637
],
	"2,2,3": [
	1447,
	1558,
	1622,
	1664
],
	"2,3,3": [
	1505,
	1610,
	1669,
	1706
],
	"3,3,3": [
	1540,
	1634,
	1683,
	1715
]
};

// The score worth locking in, given the turns of each Bastille potion effect
// (in any order) and how many games are left to play after this one (1-4).
// With no games left, lock in anything. Generated by `yarn bars`, checked by
// test/bars.test.ts.
var BARS = BARS_DATA;
function barsKey(boosts) {
  return boosts.map(b => Math.min(3, Math.max(0, b))).sort((x, y) => x - y).join(",");
}
function lockInBar(boosts, gamesAfter) {
  if (gamesAfter <= 0) return -Infinity;
  var bars = BARS[barsKey(boosts)];
  return bars[Math.min(gamesAfter, bars.length) - 1];
}

var offense$1 = {
	"Conscript the soldiers": 1,
	"Pick up the boulders": 2,
	"Commission some art": 3,
	"Draft those artists": 4,
	"Widen the arrow slits": 5,
	"Add more windows": 6,
	"Strengthen the walls": 7,
	"Build the memorial": 8,
	"Improve the keep": 9,
	"Approve the retrofit": 10,
	"Get sloppy": 11,
	"Adopt the radical combat style": 12,
	"Levy the tax": 13,
	"Let the citizens hurl cheese at you": 14,
	"Trade soldiers for cheese": 15
};
var defense$1 = {
	"Train the soldiers": 1,
	"Thicken the walls": 2,
	"Add more murals": 3,
	"Convert the galleries": 4,
	"Make the soldiers masons": 5,
	"Build the weird statue": 6,
	"Repurpose the statues": 7,
	"Lower the walls": 8,
	"Cut military spending": 9,
	"Throw the party": 10,
	"Blunt everything": 11,
	"Do the plowshares thing": 12
};
var cheese$1 = {
	"Raid the cart": 1,
	"Scrape out the mine": 2,
	"Grab the boulder": 3,
	"Raid the cave": 4,
	"Shoot the glacier": 5,
	"Rob the suburb": 6,
	"Enter the Weakest Army competition": 7,
	"Submit embarrassing catapult photos": 8,
	"Enter the childrens' art contest": 9,
	"Convert the barracks": 10,
	"Try the wall thing": 11,
	"Have the cheese contest": 12,
	"Let the cheese horse in": 13,
	"Stand in the waterfall": 14,
	"Put on the bad art show": 15,
	"Use the wishing well": 16
};
var BUTTON_DATA = {
	offense: offense$1,
	defense: defense$1,
	cheese: cheese$1
};

var CASTLE_DATA = [
	{
		key: "frenchcastle",
		description: "an avant-garde art castle",
		stats: {
			MA: 80,
			MD: 80,
			CA: 100,
			CD: 100,
			PA: 120,
			PD: 120
		}
	},
	{
		key: "masterofnone",
		description: "a boring, run-of-the-mill castle",
		stats: {
			MA: 110,
			MD: 100,
			CA: 110,
			CD: 100,
			PA: 110,
			PD: 100
		}
	},
	{
		key: "bigcastle",
		description: "a sprawling chateau",
		stats: {
			MA: 100,
			MD: 100,
			CA: 120,
			CD: 120,
			PA: 80,
			PD: 80
		}
	},
	{
		key: "berserker",
		description: "a dark and menacing citadel",
		stats: {
			MA: 130,
			MD: 70,
			CA: 120,
			CD: 80,
			PA: 110,
			PD: 90
		}
	},
	{
		key: "shieldmaster",
		description: "a fortress that puts the 'fort' in 'fortified'",
		stats: {
			MA: 90,
			MD: 110,
			CA: 70,
			CD: 130,
			PA: 80,
			PD: 120
		}
	},
	{
		key: "barracks",
		description: "an imposing military fortress",
		stats: {
			MA: 120,
			MD: 120,
			CA: 80,
			CD: 80,
			PA: 100,
			PD: 100
		}
	}
];

var offense = {
	"1": {
		bonus: {
			MA: 5
		}
	},
	"2": {
		bonus: {
			CA: 5
		}
	},
	"3": {
		bonus: {
			PA: 5
		}
	},
	"4": {
		bonus: {
			MA: 10,
			PD: -5
		}
	},
	"5": {
		bonus: {
			CA: 10,
			MD: -5
		}
	},
	"6": {
		bonus: {
			PA: 10,
			CD: -5
		}
	},
	"7": {
		bonus: {
			MA: 10,
			CA: 10,
			PA: -10
		}
	},
	"8": {
		bonus: {
			MA: 10,
			PA: 10,
			CA: -10
		}
	},
	"9": {
		bonus: {
			CA: 10,
			PA: 10,
			MA: -10
		}
	},
	"10": {
		bonus: {
			MA: 5,
			CA: 5,
			PA: 5
		}
	},
	"11": {
		bonus: {
			MA: 10,
			CA: 10,
			PA: 10,
			MD: -5,
			CD: -5,
			PD: -5
		}
	},
	"12": {
		bonus: {
			MA: 15,
			CA: 15,
			PA: 15,
			MD: -15,
			CD: -15,
			PD: -15
		}
	},
	"13": {
		bonus: {
			MA: 10,
			CD: -10
		},
		cheese: 15
	},
	"14": {
		bonus: {
			CA: 10,
			PD: -10
		},
		cheese: 15
	},
	"15": {
		bonus: {
			PA: 10,
			MD: -10
		},
		cheese: 15
	}
};
var defense = {
	"1": {
		bonus: {
			MD: 5
		}
	},
	"2": {
		bonus: {
			CD: 5
		}
	},
	"3": {
		bonus: {
			PD: 5
		}
	},
	"4": {
		bonus: {
			MD: 10,
			PA: -5
		}
	},
	"5": {
		bonus: {
			CD: 10,
			MA: -5
		}
	},
	"6": {
		bonus: {
			PD: 10,
			CA: -5
		}
	},
	"7": {
		bonus: {
			MD: 10,
			CD: 10,
			PD: -10
		}
	},
	"8": {
		bonus: {
			MD: 10,
			PD: 10,
			CD: -10
		}
	},
	"9": {
		bonus: {
			CD: 10,
			PD: 10,
			MD: -10
		}
	},
	"10": {
		bonus: {
			MD: 5,
			CD: 5,
			PD: 5
		}
	},
	"11": {
		bonus: {
			MD: 10,
			CD: 10,
			PD: 10,
			MA: -5,
			CA: -5,
			PA: -5
		}
	},
	"12": {
		bonus: {
			MD: 15,
			CD: 15,
			PD: 15,
			MA: -15,
			CA: -15,
			PA: -15
		}
	}
};
var cheese = {
	"1": {
		fixed: 20
	},
	"2": {
		fixed: 50
	},
	"3": {
		fixed: 100
	},
	"4": {
		scaled: "MA"
	},
	"5": {
		scaled: "CA"
	},
	"6": {
		scaled: "PA"
	},
	"7": {
		scaled: "MA",
		inverse: true
	},
	"8": {
		scaled: "CA",
		inverse: true
	},
	"9": {
		scaled: "PA",
		inverse: true
	},
	"10": {
		scaled: "MD"
	},
	"11": {
		scaled: "CD"
	},
	"12": {
		scaled: "PD"
	},
	"13": {
		scaled: "MD",
		inverse: true
	},
	"14": {
		scaled: "CD",
		inverse: true
	},
	"15": {
		scaled: "PD",
		inverse: true
	},
	"16": {
		well: true
	}
};
var OPTION_DATA = {
	offense: offense,
	defense: defense,
	cheese: cheese
};

// The game's fixed rules live here; its tables of castles, options and button
// names live in data/*.json and are turned into the shapes the rest of the
// code works with.

// Index order matches KoLmafia's BastilleBattalionManager
var MA = 0;
var MD = 1;
var CA = 2;
var CD = 3;
var PA = 4;
var PD = 5;
var STAT_NAMES = ["MA", "MD", "CA", "CD", "PA", "PD"];
// Military, castle, psychological
var CATEGORIES = [{
  attack: MA,
  defense: MD
}, {
  attack: CA,
  defense: CD
}, {
  attack: PA,
  defense: PD
}];
function zero() {
  return [0, 0, 0, 0, 0, 0];
}
function add(a, b) {
  var scale = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  return a.map((v, i) => v + b[i] * scale);
}

// Object.fromEntries in KoLmafia's Rhino stores numeric-looking keys such that
// obj[1] can't find them, so build objects by assignment instead
function record(entries) {
  var result = {};
  var _iterator = _createForOfIteratorHelper(entries),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _slicedToArray(_step.value, 2),
        key = _step$value[0],
        value = _step$value[1];
      result[key] = value;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return result;
}
function stats(named) {
  for (var _i = 0, _Object$keys = Object.keys(named); _i < _Object$keys.length; _i++) {
    var name = _Object$keys[_i];
    if (!STAT_NAMES.includes(name)) throw new Error("Unknown stat ".concat(name));
  }
  return STAT_NAMES.map(name => named[name] ?? 0);
}
function statIndex(name) {
  var index = STAT_NAMES.indexOf(name);
  if (index < 0) throw new Error("Unknown stat ".concat(name));
  return index;
}

// *** Rules

// Everyone's stats with no style bonuses
var BASELINE = stats({
  MA: 100,
  MD: 90,
  CA: 110,
  CD: 100,
  PA: 110,
  PD: 110
});
var GROWTH = {
  min: 105,
  max: 125
};

// How likely each stance is to put us on the attack, and what it adds to all
// our stats for the battle

var STANCES = [{
  option: 1,
  name: "Try to get the jump on them",
  attackChance: 0.8,
  boost: 0
}, {
  option: 2,
  name: "Bide your time",
  attackChance: 0.5,
  boost: 10
}, {
  option: 3,
  name: "Ready your defenses and wait for them",
  attackChance: 0.2,
  boost: 0
}];

// Shark Tooth Grin, Boiling Determination, Enhanced Interrogation, which
// boost military, castle and psychological stats in battle
var BOOST_EFFECTS = [2413, 2414, 2415];
var BOOST_POTIONS = ["sharkfin gumbo", "boiling broth", "interrogative elixir"];
function boostMultiplier(turns) {
  return 1 + Math.min(3, turns) / 10;
}

// *** Castle styles. Only differences between styles matter: anything they
// share is absorbed into the baseline.

var UPGRADES = ["barb", "bridge", "holes", "moat"];
var STYLE_DELTAS = {
  barb: [stats({
    MA: 20,
    MD: 20
  }), stats({
    CA: 20,
    CD: 20
  }), stats({
    PA: 20,
    PD: 20
  })],
  bridge: [stats({
    MA: 10,
    CA: 10,
    PA: 10
  }), stats({
    MD: 20,
    CD: 20,
    PD: 20
  }), stats({
    PA: 15,
    PD: 15
  })],
  holes: [stats({
    MA: 10,
    MD: 10,
    PA: -10,
    CD: -10
  }), stats({
    CA: 10,
    MD: 10,
    PA: -10,
    PD: -10
  }), zero()],
  moat: [stats({
    PD: -10,
    CA: -10,
    MD: 10,
    PA: 10
  }), stats({
    PD: -10,
    CA: -10,
    CD: 10,
    MA: 10
  }), zero()]
};

// Named for the first game's rewards they give
var STYLE_NAMES = {
  barb: ["Barbarian Barbecue (myst stats)", "Babar (muscle stats)", "Barbershop (moxie stats)"],
  bridge: ["Brutalist (Brutal brogues)", "Draftsman (Draftsman's driving gloves)", "Art Nouveau (Nouveau nosering)"],
  holes: ["Cannon (Bastille Budgeteer)", "Catapult (Bastille Bourgeoisie)", "Gesture (Bastille Braggadocio)"],
  moat: ["Sharks (sharkfin gumbo)", "Lava (boiling broth)", "Truth Serum (interrogative elixir)"]
};

// 1313 option that cycles each upgrade
var UPGRADE_OPTION = {
  barb: 1,
  bridge: 2,
  holes: 3,
  moat: 4
};
function configurationDelta(config) {
  return UPGRADES.reduce((acc, u) => add(acc, STYLE_DELTAS[u][config[u] - 1]), zero());
}
function allConfigurations() {
  var result = [];
  var _loop = function _loop(i) {
    var digit = n => Math.floor(i / 3 ** n) % 3 + 1;
    result.push({
      barb: digit(3),
      bridge: digit(2),
      holes: digit(1),
      moat: digit(0)
    });
  };
  for (var i = 0; i < 81; i++) {
    _loop(i);
  }
  return result;
}

// *** Preparation options

var MENUS = ["offense", "defense", "cheese"];
var MENU_OPTION = {
  offense: 1,
  defense: 2,
  cheese: 3
};
var MENU_CHOICE = {
  offense: 1317,
  defense: 1318,
  cheese: 1319
};
function prepOption(raw) {
  if (raw.bonus) return {
    kind: "stats",
    delta: stats(raw.bonus),
    cheese: raw.cheese ?? 0
  };
  if (raw.fixed !== undefined) return {
    kind: "fixed",
    cheese: raw.fixed
  };
  if (raw.scaled) return {
    kind: "scaled",
    stat: statIndex(raw.scaled),
    inverse: !!raw.inverse
  };
  if (raw.well) return {
    kind: "well"
  };
  throw new Error("Unrecognised option ".concat(JSON.stringify(raw)));
}
var MENU_OPTIONS = record(MENUS.map(menu => [menu, record(Object.entries(OPTION_DATA[menu]).map(_ref => {
  var _ref2 = _slicedToArray(_ref, 2),
    id = _ref2[0],
    raw = _ref2[1];
  return [id, prepOption(raw)];
}))]));
MENU_OPTIONS.offense;
MENU_OPTIONS.defense;
MENU_OPTIONS.cheese;

// How many options each menu starts with (defense has no cheesy ones)
var POOL_SIZE = record(MENUS.map(menu => [menu, Object.keys(MENU_OPTIONS[menu]).length]));

// Button text for each option. Two buttons per stat menu share a description
// ("all attack up, all defense down"); which is the milder one was worked out
// from the needles.
var BUTTONS = BUTTON_DATA;

// *** Timeline: preps on turns 1,2,4,5,...; battles on turns 3,6,9,12,15
var LAST_TURN = 15;
function isBattleTurn(turn) {
  return turn % 3 === 0;
}

// Razing a castle yields a 10-20 cheese roll for every turn elapsed, summed
function battleCheese(turn) {
  return 15 * turn;
}

// *** Enemy castles. Every castle of a type starts with the same stats. Each
// game draws a bracket of them; it's halved after every battle and the
// survivors grow in each stat independently.

var CASTLES = CASTLE_DATA.map(c => ({
  key: c.key,
  description: c.description,
  stats: stats(c.stats)
}));

// String.prototype.matchAll isn't reliably available in KoLmafia's Rhino
function allMatches(text, pattern) {
  var re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : "".concat(pattern.flags, "g"));
  var result = [];
  var match;
  while ((match = re.exec(text)) !== null) result.push(match);
  return result;
}
var NEEDLE_ROWS = {
  "233": [MA, MD],
  "252": [CA, CD],
  "270": [PA, PD]
};
function parseNeedles(html) {
  var needles = new Map();
  var _iterator = _createForOfIteratorHelper(allMatches(html, /top: (\d+);? left: (\d+);?'[^>]*otherimages\/bbatt\/needle\.png/g)),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _slicedToArray(_step.value, 3),
        top = _step$value[1],
        left = _step$value[2];
      var row = NEEDLE_ROWS[top];
      if (!row) continue;
      var value = Number(left);
      needles.set(value < 200 ? row[0] : row[1], value);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return needles;
}
function parseConfiguration(html) {
  var config = {};
  var _iterator2 = _createForOfIteratorHelper(allMatches(html, /otherimages\/bbatt\/(barb|bridge|holes|moat)(\d)\.png/g)),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _step2$value = _slicedToArray(_step2.value, 3),
        upgrade = _step2$value[1],
        value = _step2$value[2];
      if (UPGRADES.includes(upgrade)) {
        config[upgrade] = Number(value);
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return config;
}
function parseEnemy(html) {
  var _CASTLES$find;
  var scanned = html.match(/the nearest enemy castle is .*?, (an? .*?)\./);
  if (scanned) {
    var castle = CASTLES.find(c => c.description === scanned[1]);
    if (castle) return castle.key;
  }
  // The battle screen shows the looming castle instead
  var looming = html.match(/otherimages\/bbatt\/([a-z]+)_3\.png/);
  return ((_CASTLES$find = CASTLES.find(c => c.key === (looming === null || looming === void 0 ? void 0 : looming[1]))) === null || _CASTLES$find === void 0 ? void 0 : _CASTLES$find.key) ?? null;
}
function parseButtons(html) {
  var buttons = [];
  var _iterator3 = _createForOfIteratorHelper(html.split(/<form/i).slice(1)),
    _step3;
  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var _form$match;
      var form = _step3.value;
      var option = form.match(/name=option value=['"]?(\d+)/);
      var name = form.match(/type=submit value="([^"]*)"/);
      if (!option || !name) continue;
      var description = ((_form$match = form.match(/<Font color=blue><b>\[([^\]]*)\]/i)) === null || _form$match === void 0 ? void 0 : _form$match[1]) ?? "";
      buttons.push({
        option: Number(option[1]),
        name: name[1],
        description
      });
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
  return buttons;
}
var BATTLE_LINE = /(Military|Castle|Psychological) results:\s*Your (attack strength|defense) is (higher|lower)/g;
function parseBattle(html) {
  var results = [false, false, false];
  var attacking = null;
  var _iterator4 = _createForOfIteratorHelper(allMatches(html, BATTLE_LINE)),
    _step4;
  try {
    for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
      var _step4$value = _slicedToArray(_step4.value, 4),
        category = _step4$value[1],
        side = _step4$value[2],
        outcome = _step4$value[3];
      attacking = side === "attack strength";
      results[["Military", "Castle", "Psychological"].indexOf(category)] = outcome === "higher";
    }
  } catch (err) {
    _iterator4.e(err);
  } finally {
    _iterator4.f();
  }
  if (attacking === null) return null;
  return {
    attacking,
    results,
    won: html.includes("You have razed your foe")
  };
}
function parseGameOver(html) {
  var _html$match;
  var score = html.match(/collected ([\d,]+) cheese/);
  if (!html.includes("GAME OVER") || !score) return null;
  return {
    cheese: Number(score[1].replace(/,/g, "")),
    playsLeft: Number(((_html$match = html.match(/You can play <b>(\d+)<\/b> more time/)) === null || _html$match === void 0 ? void 0 : _html$match[1]) ?? 0),
    canLockIn: html.includes("Lock in your score")
  };
}
function parseObservation(html) {
  var choice = html.match(/name=whichchoice value=['"]?(\d+)/);
  var turn = html.match(/\(turn #(\d+)\)/);
  return {
    choice: choice ? Number(choice[1]) : null,
    turn: turn ? Number(turn[1]) : null,
    needles: parseNeedles(html),
    config: parseConfiguration(html),
    enemy: parseEnemy(html),
    canStart: html.includes("otherimages/bbatt/start.png"),
    buttons: parseButtons(html),
    cheeseGained: _toConsumableArray(allMatches(html, /You gain (\d+) cheese/g)).reduce((sum, _ref) => {
      var _ref2 = _slicedToArray(_ref, 2),
        n = _ref2[1];
      return sum + Number(n);
    }, 0),
    battle: parseBattle(html),
    gameOver: parseGameOver(html)
  };
}

// Parses the blue hint shown under each stat button, e.g.
// "Increase Castle attack, decrease Psychological defense, get cheese"
// into the stats it raises and lowers.
function parseDescription(description) {
  var up = new Set();
  var down = new Set();
  var cheese = false;
  var sign = 1;
  var _iterator5 = _createForOfIteratorHelper(description.toLowerCase().split(",")),
    _step5;
  try {
    var _loop = function _loop() {
      var clause = _step5.value;
      if (clause.includes("cheese")) cheese = true;
      if (/increase/.test(clause)) sign = 1;
      if (/decrease|reduce/.test(clause)) sign = -1;
      var kinds = [/attack/.test(clause) ? 0 : null, /defen[sc]e/.test(clause) ? 1 : null].filter(k => k !== null);
      var categories = /\ball\b/.test(clause) ? [0, 1, 2] : [/military/, /castle/, /psychological/].map((re, i) => re.test(clause) ? i : null).filter(c => c !== null);
      var _iterator6 = _createForOfIteratorHelper(categories),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var category = _step6.value;
          var _iterator7 = _createForOfIteratorHelper(kinds),
            _step7;
          try {
            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
              var kind = _step7.value;
              (sign > 0 ? up : down).add(category * 2 + kind);
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
    };
    for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
      _loop();
    }
  } catch (err) {
    _iterator5.e(err);
  } finally {
    _iterator5.f();
  }
  return {
    up,
    down,
    cheese
  };
}

// Works out which option(s) a button could be. Usually the name tells
// us exactly; failing that we match the blue hint text against the option
// effects; failing that it's any option we can't otherwise account for.
function identify(menu, button, pool, learned) {
  var inPool = ids => {
    var filtered = ids.filter(id => pool.includes(id));
    return filtered.length > 0 ? filtered : ids;
  };
  if (learned[button.name]) return [learned[button.name]];
  var named = BUTTONS[menu][button.name];
  if (named) return [named];
  if (menu !== "cheese" && button.description) {
    var _parseDescription = parseDescription(button.description),
      up = _parseDescription.up,
      down = _parseDescription.down,
      cheese = _parseDescription.cheese;
    var matches = Object.entries(MENU_OPTIONS[menu]).filter(_ref => {
      var _ref2 = _slicedToArray(_ref, 2),
        option = _ref2[1];
      if (option.kind !== "stats" || cheese !== option.cheese > 0) return false;
      return option.delta.every((d, stat) => d > 0 ? up.has(stat) : d < 0 ? down.has(stat) : !up.has(stat) && !down.has(stat));
    }).map(_ref3 => {
      var _ref4 = _slicedToArray(_ref3, 1),
        id = _ref4[0];
      return Number(id);
    });
    if (matches.length > 0) return inPool(matches);
  }
  var claimed = new Set(Object.values(BUTTONS[menu]));
  var unclaimed = pool.filter(id => !claimed.has(id));
  return unclaimed.length > 0 ? unclaimed : pool;
}

// The castle you face in battle k has had k-1 rounds of growth, each stat
// separately multiplied by a random 105-125% and rounded down. Starting stats
// are fixed by castle type, so the distribution is exact.

var cache = new Map();
function grown(base, rounds) {
  var key = "".concat(base, ":").concat(rounds);
  var cached = cache.get(key);
  if (cached) return cached;
  var current = new Map([[base, 1]]);
  var steps = GROWTH.max - GROWTH.min + 1;
  for (var r = 0; r < rounds; r++) {
    var next = new Map();
    var _iterator = _createForOfIteratorHelper(current),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _step$value = _slicedToArray(_step.value, 2),
          value = _step$value[0],
          p = _step$value[1];
        for (var pct = GROWTH.min; pct <= GROWTH.max; pct++) {
          var v = Math.floor(value * pct / 100);
          next.set(v, (next.get(v) ?? 0) + p / steps);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    current = next;
  }
  var values = _toConsumableArray(current.keys()).sort((a, b) => a - b);
  var total = 0;
  var cumulative = values.map(v => total += current.get(v));
  var result = {
    values,
    cumulative
  };
  cache.set(key, result);
  return result;
}

// P(stat < value), or P(stat <= value) if inclusive
function chanceBelow(_ref, value, inclusive) {
  var values = _ref.values,
    cumulative = _ref.cumulative;
  var lo = 0;
  var hi = values.length;
  while (lo < hi) {
    var mid = lo + hi >> 1;
    if (inclusive ? values[mid] <= value : values[mid] < value) lo = mid + 1;else hi = mid;
  }
  return lo === 0 ? 0 : cumulative[lo - 1];
}

// This is the innermost loop of every decision, so look distributions up by
// castle, stat and battle directly rather than searching
var byCastle = new Map();
function distribution(castle, stat, battle) {
  var stats = byCastle.get(castle);
  if (!stats) {
    var found = CASTLES.find(c => c.key === castle);
    if (!found) throw new Error("Unknown castle ".concat(castle));
    stats = found.stats.map(() => []);
    byCastle.set(castle, stats);
  }
  var battles = stats[stat];
  if (!battles[battle]) {
    var base = CASTLES.find(c => c.key === castle).stats[stat];
    battles[battle] = grown(base, battle - 1);
  }
  return battles[battle];
}
function enemyChance(castle, stat, battle, value, inclusive) {
  return chanceBelow(distribution(castle, stat, battle), value, inclusive);
}

function fullPools() {
  var range = n => Array.from({
    length: n
  }, (_, i) => i + 1);
  return {
    offense: range(POOL_SIZE.offense),
    defense: range(POOL_SIZE.defense),
    cheese: range(POOL_SIZE.cheese)
  };
}
function newGame(stats) {
  var enemy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  return {
    turn: 1,
    stats,
    cheese: 0,
    pools: fullPools(),
    enemy
  };
}
function battleNumber(turn) {
  return Math.ceil(turn / 3);
}

// *** Random numbers. Seeded so that alternatives can be compared on the same
// sampled futures (common random numbers), which cuts variance a lot.

function mulberry32(seed) {
  var a = seed >>> 0;
  return () => {
    a = a + 0x6d2b79f5 >>> 0;
    var t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function sample(items, n, rng) {
  var copy = _toConsumableArray(items);
  for (var i = 0; i < n && i < copy.length; i++) {
    var j = i + Math.floor(rng() * (copy.length - i));
    var _ref = [copy[j], copy[i]];
    copy[i] = _ref[0];
    copy[j] = _ref[1];
  }
  return copy.slice(0, n);
}

// *** Battles

// P(at least two of three independent events)
function twoOfThree(_ref2) {
  var _ref3 = _slicedToArray(_ref2, 3),
    a = _ref3[0],
    b = _ref3[1],
    c = _ref3[2];
  return a * b + a * c + b * c - 2 * a * b * c;
}
function stanceWinChances(ctx, stats, castle, battle) {
  var comparisons = boost => {
    var attack = [];
    var defense = [];
    CATEGORIES.forEach((_ref4, i) => {
      var a = _ref4.attack,
        d = _ref4.defense;
      var mult = boostMultiplier(ctx.boosts[i]);
      // We attack: win if our attack > their defense
      attack.push(enemyChance(castle, d, battle, (stats[a] + boost) * mult, false));
      // They attack: win if our defense >= their attack
      defense.push(enemyChance(castle, a, battle, (stats[d] + boost) * mult, true));
    });
    return {
      attack: twoOfThree(attack),
      defense: twoOfThree(defense)
    };
  };
  var plain = comparisons(0);
  var bide = comparisons(10);
  return STANCES.map(s => {
    var c = s.boost ? bide : plain;
    return s.attackChance * c.attack + (1 - s.attackChance) * c.defense;
  });
}
function winChance(ctx, stats, castle, battle) {
  return Math.max.apply(Math, _toConsumableArray(stanceWinChances(ctx, stats, castle, battle)));
}

// *** Prep options

function optionCheese(option, stats, cheese) {
  switch (option.kind) {
    case "stats":
    case "fixed":
      return option.cheese;
    case "scaled":
      {
        var value = option.inverse ? 200 - stats[option.stat] : stats[option.stat];
        return Math.max(10, value);
      }
    case "well":
      // 1 in 3 chance of 300, but only if we can afford the coin
      return cheese >= 10 ? 100 : 0;
  }
}
function applyOption(state, menu, id) {
  var option = MENU_OPTIONS[menu][id];
  return _objectSpread2(_objectSpread2({}, state), {}, {
    turn: state.turn + 1,
    stats: option.kind === "stats" ? add(state.stats, option.delta) : state.stats,
    cheese: state.cheese + optionCheese(option, state.stats, state.cheese),
    pools: _objectSpread2(_objectSpread2({}, state.pools), {}, {
      [menu]: state.pools[menu].filter(x => x !== id)
    })
  });
}

// *** Heuristic value: expected final cheese if our stats stayed as they are
// now and every remaining prep went on the typical cheese haul. Used by the
// rollout policy, which only needs it to rank options sensibly.

function expectedBestOfThree(values) {
  var sorted = _toConsumableArray(values).sort((a, b) => a - b);
  var n = sorted.length;
  if (n <= 3) return sorted[n - 1] ?? 0;
  var combinations = n * (n - 1) * (n - 2) / 6;
  var total = 0;
  for (var i = 2; i < n; i++) total += sorted[i] * (i * (i - 1)) / 2;
  return total / combinations;
}
function heuristicValue(ctx, state) {
  var cheesePerPrep = expectedBestOfThree(state.pools.cheese.map(id => optionCheese(MENU_OPTIONS.cheese[id], state.stats, state.cheese)));
  var value = state.cheese;
  var survival = 1;
  var next = battleNumber(state.turn);
  var _loop = function _loop() {
    if (isBattleTurn(turn)) {
      var battle = turn / 3;
      // We only know who we're fighting next; after that it's anyone
      survival *= battle === next && state.enemy ? winChance(ctx, state.stats, state.enemy, battle) : average(CASTLES.map(c => winChance(ctx, state.stats, c.key, battle)));
      value += survival * battleCheese(turn);
    } else {
      value += survival * cheesePerPrep;
    }
  };
  for (var turn = state.turn; turn <= LAST_TURN; turn++) {
    _loop();
  }
  return value;
}
function biggestHaul(state, shown) {
  var haul = id => optionCheese(MENU_OPTIONS.cheese[id], state.stats, state.cheese);
  return shown.reduce((best, id) => haul(id) > haul(best) ? id : best);
}

// For a stat menu's first step we don't roll out each option; ranking by the
// heuristic is good enough to pick among three.
function rolloutPick(ctx, state, menu, shown) {
  var best = shown[0];
  var bestValue = -Infinity;
  var _iterator = _createForOfIteratorHelper(shown),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var id = _step.value;
      var value = heuristicValue(ctx, applyOption(state, menu, id));
      if (value > bestValue) {
        best = id;
        bestValue = value;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return best;
}

// Castle types for each of the five battles: the known upcoming one, and
// random ones after that
function sampleCastles(state, rng) {
  var castles = Array.from({
    length: 5
  }, () => CASTLES[Math.floor(rng() * CASTLES.length)].key);
  if (state.enemy) castles[battleNumber(state.turn) - 1] = state.enemy;
  return castles;
}

// Plays out the rest of the game greedily: always look for cheese, take the
// biggest haul, fight with the best stance. Decisions are made by comparing
// rollouts after each alternative, so they can only improve on this. Rather
// than sampling battle outcomes we weight everything after a battle by the
// chance of surviving it, which gives the same expectation with less noise.
function rollout(ctx, start, rng, castles) {
  var state = start;
  var value = state.cheese;
  var survival = 1;
  while (state.turn <= LAST_TURN) {
    if (isBattleTurn(state.turn)) {
      var battle = state.turn / 3;
      survival *= winChance(ctx, state.stats, castles[battle - 1], battle);
      value += survival * battleCheese(state.turn);
      state = _objectSpread2(_objectSpread2({}, state), {}, {
        turn: state.turn + 1,
        enemy: castles[battle] ?? null
      });
      continue;
    }
    var shown = sample(state.pools.cheese, 3, rng);
    var next = applyOption(state, "cheese", biggestHaul(state, shown));
    value += survival * (next.cheese - state.cheese);
    state = next;
  }
  return value;
}

// *** Decisions

function average(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
function evaluateMenus(ctx, state, samples) {
  var seed = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
  return MENUS.map(menu => ({
    choice: menu,
    value: average(Array.from({
      length: samples
    }, (_, i) => {
      var rng = mulberry32(seed + i);
      var castles = sampleCastles(state, rng);
      var shown = sample(state.pools[menu], 3, rng);
      var id = rolloutPick(ctx, state, menu, shown);
      return rollout(ctx, applyOption(state, menu, id), rng, castles);
    }))
  })).sort((a, b) => b.value - a.value);
}

// Each button may map to several options if we can't tell them apart
function evaluateButtons(ctx, state, menu, buttons, samples) {
  var seed = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
  return buttons.map((candidates, index) => ({
    choice: index,
    value: average(candidates.map(id => average(Array.from({
      length: samples
    }, (_, i) => {
      var rng = mulberry32(seed + i);
      var next = applyOption(state, menu, id);
      return rollout(ctx, next, rng, sampleCastles(state, rng));
    }))))
  })).sort((a, b) => b.value - a.value);
}
function bestStance(ctx, stats, castle, battle) {
  var chances = stanceWinChances(ctx, stats, castle, battle);
  var index = chances.indexOf(Math.max.apply(Math, _toConsumableArray(chances)));
  return {
    stance: STANCES[index],
    chances
  };
}

// Ranks configurations by expected score for a game started from them.
// `baseline` is our stats with every style contributing nothing.
function evaluateConfigurations(ctx, baseline, allowed, samples) {
  var shortlist = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 6;
  var candidates = allConfigurations().filter(allowed);
  var stateFor = config => newGame(add(baseline, configurationDelta(config)));
  // Cheap pass to find contenders, then rollouts on those
  var coarse = candidates.map(config => ({
    config,
    value: heuristicValue(ctx, stateFor(config))
  })).sort((a, b) => b.value - a.value).slice(0, shortlist);
  return coarse.map(_ref5 => {
    var config = _ref5.config;
    return {
      choice: config,
      value: average(Array.from({
        length: samples
      }, (_, i) => {
        var rng = mulberry32(1000 + i);
        var state = stateFor(config);
        return rollout(ctx, state, rng, sampleCastles(state, rng));
      }))
    };
  }).sort((a, b) => b.value - a.value);
}

// Each needle moves one pixel per 7.5 points of its stat. Fitted against
// thousands of readings in KoLmafia session logs with known stats: attack
// needles sit at 124 + floor((stat - 95) / 7.5), defense at
// 240 + floor((stat - 87.5) / 7.5).
var NEEDLE_SCALE = 7.5;
var NEEDLE_ORIGIN = {
  attack: {
    pixel: 124,
    stat: 95
  },
  defense: {
    pixel: 240,
    stat: 87.5
  }
};
function needleInterval(stat, left) {
  var origin = stat % 2 === 0 ? NEEDLE_ORIGIN.attack : NEEDLE_ORIGIN.defense;
  var lo = origin.stat + (left - origin.pixel) * NEEDLE_SCALE;
  return [lo, lo + NEEDLE_SCALE];
}
// Tracks what we know about our stats as intervals. Starting stats and every
// change are known exactly, so normally the intervals are a single value. The
// needles let us tell apart the two pairs of identically-described buttons,
// and recover if we pick up a game midway.
var Tracker = /*#__PURE__*/function () {
  function Tracker(lo, hi) {
    _classCallCheck(this, Tracker);
    this.hypotheses = [{
      lo,
      hi,
      weight: 1,
      assumed: {}
    }];
  }
  return _createClass(Tracker, [{
    key: "shift",
    value: function shift(delta) {
      var _iterator = _createForOfIteratorHelper(this.hypotheses),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var h = _step.value;
          h.lo = add(h.lo, delta);
          h.hi = add(h.hi, delta);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    // Apply a button press whose effect is one of several candidates
  }, {
    key: "press",
    value: function press(name, candidates) {
      if (candidates.length === 1) return this.shift(candidates[0].delta);
      this.hypotheses = this.hypotheses.flatMap(h => candidates.map(c => ({
        lo: add(h.lo, c.delta),
        hi: add(h.hi, c.delta),
        weight: h.weight / candidates.length,
        assumed: _objectSpread2(_objectSpread2({}, h.assumed), {}, {
          [name]: c.option
        })
      })));
    }

    // Returns false if the reading contradicted every hypothesis, in which case
    // we trust the needles and start over from them.
  }, {
    key: "observe",
    value: function observe(needles) {
      var narrowed = this.hypotheses.map(h => {
        var lo = _toConsumableArray(h.lo);
        var hi = _toConsumableArray(h.hi);
        var _iterator2 = _createForOfIteratorHelper(needles),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var _step2$value = _slicedToArray(_step2.value, 2),
              stat = _step2$value[0],
              left = _step2$value[1];
            var _needleInterval = needleInterval(stat, left),
              _needleInterval2 = _slicedToArray(_needleInterval, 2),
              nlo = _needleInterval2[0],
              nhi = _needleInterval2[1];
            lo[stat] = Math.max(lo[stat], nlo);
            hi[stat] = Math.min(hi[stat], nhi);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
        return _objectSpread2(_objectSpread2({}, h), {}, {
          lo,
          hi
        });
      }).filter(h => h.lo.every((v, i) => v < h.hi[i]));
      if (narrowed.length === 0) {
        var lo = zero();
        var hi = [400, 400, 400, 400, 400, 400];
        var _iterator3 = _createForOfIteratorHelper(needles),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var _step3$value = _slicedToArray(_step3.value, 2),
              stat = _step3$value[0],
              left = _step3$value[1];
            var _needleInterval3 = needleInterval(stat, left);
            var _needleInterval4 = _slicedToArray(_needleInterval3, 2);
            lo[stat] = _needleInterval4[0];
            hi[stat] = _needleInterval4[1];
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        this.hypotheses = [{
          lo,
          hi,
          weight: 1,
          assumed: {}
        }];
        return false;
      }
      var total = narrowed.reduce((sum, h) => sum + h.weight, 0);
      this.hypotheses = narrowed.map(h => _objectSpread2(_objectSpread2({}, h), {}, {
        weight: h.weight / total
      }));
      return true;
    }

    // Buttons whose identity every surviving hypothesis agrees on
  }, {
    key: "resolved",
    value: function resolved() {
      var _this = this;
      var result = {};
      var names = new Set(this.hypotheses.flatMap(h => Object.keys(h.assumed)));
      var _iterator4 = _createForOfIteratorHelper(names),
        _step4;
      try {
        var _loop = function _loop() {
          var name = _step4.value;
          var options = new Set(_this.hypotheses.map(h => h.assumed[name]));
          if (options.size === 1) result[name] = _toConsumableArray(options)[0];
        };
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          _loop();
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
      return result;
    }
  }, {
    key: "estimate",
    value: function estimate() {
      return this.hypotheses.reduce(
      // Our stats are whole numbers, so a width-1 interval is exact
      (acc, h) => add(acc, h.lo.map((lo, i) => h.hi[i] - lo <= 1 ? lo : (lo + h.hi[i]) / 2), h.weight), zero());
    }
  }, {
    key: "width",
    value: function width() {
      return Math.max.apply(Math, _toConsumableArray(this.hypotheses.flatMap(h => h.hi.map((hi, i) => hi - h.lo[i]))));
    }
  }], [{
    key: "exactly",
    value: function exactly(stats) {
      return new Tracker(_toConsumableArray(stats), stats.map(v => v + 1));
    }
  }, {
    key: "unknown",
    value: function unknown() {
      return new Tracker([0, 0, 0, 0, 0, 0], [400, 400, 400, 400, 400, 400]);
    }
  }]);
}();

var WISHING_WELL = 16;
var fmt = n => Math.round(n).toString();
var fmtStats = stats => stats.map((v, i) => "".concat(STAT_NAMES[i], " ").concat(fmt(v))).join(", ");
var Engine = /*#__PURE__*/function () {
  function Engine(client, options) {
    _classCallCheck(this, Engine);
    // Buttons we've worked out from the needles this run
    _defineProperty(this, "learned", {});
    _defineProperty(this, "tracker", Tracker.unknown());
    _defineProperty(this, "config", {});
    _defineProperty(this, "state", null);
    _defineProperty(this, "gamesPlayed", 0);
    // Score worth locking in, given the games still to come
    _defineProperty(this, "lockTarget", -Infinity);
    this.client = client;
    this.options = options;
    this.ctx = {
      boosts: client.boosts()
    };
  }
  return _createClass(Engine, [{
    key: "log",
    value: function log(message, color) {
      this.client.log(message, color);
    }
  }, {
    key: "run",
    value: function run() {
      var observation = this.client.current();
      if (observation.choice === null || observation.choice < 1313 || observation.choice > 1319) {
        var opened = this.client.open();
        if (!opened) return;
        observation = opened;
      }
      this.loop(observation);
    }
  }, {
    key: "loop",
    value: function loop(first) {
      var observation = first;
      for (var guard = 0; guard < 500; guard++) {
        this.observe(observation);
        var next = void 0;
        switch (observation.choice) {
          case 1313:
            if (this.gamesPlayed >= this.options.games || !observation.canStart) {
              this.client.choose(1313, 8);
              return;
            }
            next = this.startGame(observation);
            break;
          case 1314:
            next = this.chooseMenu(observation);
            break;
          case 1315:
            next = this.fight(observation);
            break;
          case 1316:
            next = this.endGame(observation);
            break;
          case 1317:
          case 1318:
          case 1319:
            next = this.chooseButton(observation);
            break;
          default:
            // Locking in a score ends the choice; reopen if there's more to play
            next = this.gamesPlayed < this.options.games ? this.client.open() : null;
        }
        if (!next) return;
        observation = next;
      }
    }

    // Every in-game page shows the needles, which check our tracked stats
  }, {
    key: "observe",
    value: function observe(observation) {
      if (Object.keys(observation.config).length === 4) this.config = observation.config;
      if (observation.needles.size === 0) return;
      if (!this.tracker.observe(observation.needles)) {
        this.log("Needles disagreed with tracked stats; resetting from the needles.", "gray");
      }
      for (var _i = 0, _Object$entries = Object.entries(this.tracker.resolved()); _i < _Object$entries.length; _i++) {
        var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
          name = _Object$entries$_i[0],
          option = _Object$entries$_i[1];
        if (this.learned[name] !== option) {
          this.log("Learned that \"".concat(name, "\" is option ").concat(option, "."), "gray");
          this.learned[name] = option;
        }
      }
      if (this.state) this.state.stats = this.tracker.estimate();
    }

    // *** Setting up
  }, {
    key: "startGame",
    value: function startGame(observation) {
      this.config = observation.config;
      var rewards = this.client.rewardsPending();
      var fixed = rewards ? this.options.rewards : {};
      var allowed = config => UPGRADES.every(u => fixed[u] === undefined || fixed[u] === config[u]);

      // Only the score we lock in counts, so with games to come after this one
      // there's a bar this one has to clear to be worth locking in
      var gamesAfter = Math.min(this.client.playsLeft() - 1, this.options.games - this.gamesPlayed - 1);
      this.lockTarget = this.options.lockIn && gamesAfter > 0 ? lockInBar(this.ctx.boosts, gamesAfter) : -Infinity;
      var _evaluateConfiguratio = evaluateConfigurations(this.ctx, BASELINE, allowed, this.options.samples),
        _evaluateConfiguratio2 = _slicedToArray(_evaluateConfiguratio, 1),
        best = _evaluateConfiguratio2[0];
      var target = best.choice;
      this.log("Configuration: ".concat(UPGRADES.map(u => STYLE_NAMES[u][target[u] - 1]).join(", ")) + "".concat(rewards ? " (rewards pending)" : ""), "blue");
      if (this.lockTarget > -Infinity) {
        this.log("".concat(gamesAfter, " more game").concat(gamesAfter === 1 ? "" : "s", " after this, so locking in at ").concat(fmt(this.lockTarget), "+"), "blue");
      }
      var _iterator = _createForOfIteratorHelper(UPGRADES),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var upgrade = _step.value;
          for (var i = 0; i < 3 && this.config[upgrade] !== target[upgrade]; i++) {
            this.config = _objectSpread2(_objectSpread2({}, this.config), this.client.choose(1313, UPGRADE_OPTION[upgrade]).config);
          }
          if (this.config[upgrade] !== target[upgrade]) throw new Error("Couldn't set ".concat(upgrade));
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      this.tracker = Tracker.exactly(add(BASELINE, configurationDelta(target)));
      var start = this.client.choose(1313, 5);
      this.state = newGame(this.tracker.estimate(), start.enemy);
      this.log("Game ".concat(this.gamesPlayed + 1, " started. Stats: ").concat(fmtStats(this.state.stats)), "blue");
      return start;
    }

    // *** Playing
  }, {
    key: "ensureState",
    value: function ensureState(observation) {
      // If we've picked up a game in progress we don't know which options were
      // already taken; assume none were and go by the needles.
      if (!this.state) this.state = newGame(this.tracker.estimate(), observation.enemy);
      if (observation.turn) this.state.turn = observation.turn;
      if (observation.enemy) this.state.enemy = observation.enemy;
      return this.state;
    }
  }, {
    key: "chooseMenu",
    value: function chooseMenu(observation) {
      var state = this.ensureState(observation);
      var ranked = evaluateMenus(this.ctx, state, this.options.samples, state.turn * 1000);
      this.log("Turn ".concat(state.turn, " vs ").concat(state.enemy ?? "?", " (").concat(fmt(state.cheese), " cheese): ").concat(ranked.map(r => "".concat(r.choice, " ").concat(fmt(r.value))).join(", ")));
      return this.client.choose(1314, MENU_OPTION[ranked[0].choice]);
    }
  }, {
    key: "chooseButton",
    value: function chooseButton(observation) {
      var state = this.ensureState(observation);
      var menu = MENUS.find(m => MENU_CHOICE[m] === observation.choice);
      var candidates = observation.buttons.map(b => identify(menu, b, state.pools[menu], this.learned));
      var ranked = evaluateButtons(this.ctx, state, menu, candidates, this.options.samples, state.turn * 1000);
      // With games to come, a game that isn't good enough to lock in is just
      // practice, so gamble on the wishing well: it's worth as much as the
      // other big hauls on average, and its all-or-nothing 300 makes more of
      // our games lockable. Simulated, this lifts days scoring 1900+ by about
      // three percentage points without costing anything on average.
      var pick = ranked[0];
      if (menu === "cheese" && this.lockTarget > -Infinity && state.cheese >= 10) {
        pick = ranked.find(r => candidates[r.choice].includes(WISHING_WELL)) ?? pick;
      }
      var button = observation.buttons[pick.choice];
      var chosen = candidates[pick.choice];
      this.log("  ".concat(ranked.map(r => "".concat(observation.buttons[r.choice].name, " ").concat(fmt(r.value))).join(", ")));
      this.log("  -> ".concat(button.name), "green");
      this.tracker.press(button.name, chosen.map(id => {
        var option = MENU_OPTIONS[menu][id];
        return {
          option: id,
          delta: option.kind === "stats" ? option.delta : zero()
        };
      }));
      var result = this.client.choose(observation.choice, button.option);
      state.cheese += result.cheeseGained;
      state.pools[menu] = state.pools[menu].filter(id => id !== chosen[0]);
      state.turn += 1;
      state.stats = this.tracker.estimate();
      return result;
    }
  }, {
    key: "fight",
    value: function fight(observation) {
      var _result$battle, _result$battle2, _result$battle3;
      var state = this.ensureState(observation);
      var battle = Math.ceil(state.turn / 3);
      var enemy = state.enemy ?? "masterofnone";
      var _bestStance = bestStance(this.ctx, this.tracker.estimate(), enemy, battle),
        stance = _bestStance.stance,
        chances = _bestStance.chances;
      this.log("Battle ".concat(battle, " vs ").concat(enemy, ": ").concat(STANCES.map((s, i) => "".concat(s.name, " ").concat(fmt(chances[i] * 100), "%")).join(", ")));
      var result = this.client.choose(1315, stance.option);
      state.cheese += result.cheeseGained;
      state.turn += 1;
      state.enemy = null;
      this.log("  ".concat((_result$battle = result.battle) !== null && _result$battle !== void 0 && _result$battle.won ? "Won" : "Lost", " (").concat((_result$battle2 = result.battle) !== null && _result$battle2 !== void 0 && _result$battle2.attacking ? "attacking" : "defending", ")") + "".concat(result.cheeseGained ? ", +".concat(result.cheeseGained, " cheese") : ""), (_result$battle3 = result.battle) !== null && _result$battle3 !== void 0 && _result$battle3.won ? "green" : "red");
      return result;
    }
  }, {
    key: "endGame",
    value: function endGame(observation) {
      var over = observation.gameOver;
      // The rewards arrive with whichever option we pick here
      this.gamesPlayed += 1;
      this.state = null;
      if (!over) return this.client.choose(1316, 3);
      this.log("Game over: ".concat(over.cheese, " cheese."), "blue");
      var remaining = Math.min(over.playsLeft, this.options.games - this.gamesPlayed);

      // Lock in if we hit what we were going for, or if this is the last game.
      // Once locked in there's nothing more to play for today.
      var target = remaining > 0 ? this.lockTarget : -Infinity;
      if (this.options.lockIn && over.canLockIn && over.cheese >= target) {
        this.log("Locking in ".concat(over.cheese).concat(target > -Infinity ? " (aimed for ".concat(fmt(target), ")") : "", "."), "green");
        this.client.choose(1316, 1);
        return null;
      }
      if (remaining > 0) {
        // Playing again starts us afresh from the same configuration
        this.tracker = Tracker.exactly(add(BASELINE, configurationDelta(this.config)));
        return this.client.choose(1316, 2);
      }
      this.client.choose(1316, 3);
      return null;
    }
  }]);
}();

var RIG = kolmafia.Item.get("Bastille Battalion control rig");
var VOUCHER = kolmafia.Item.get("Bastille Battalion control rig loaner voucher");
var DAILY_ITEMS = ["Brutal brogues", "Draftsman's driving gloves", "Nouveau nosering"];
var PLAYS_PER_DAY = 5;
var GameClient = /*#__PURE__*/function () {
  function GameClient() {
    _classCallCheck(this, GameClient);
  }
  return _createClass(GameClient, [{
    key: "current",
    value: function current() {
      return parseObservation(kolmafia.visitUrl("choice.php"));
    }
  }, {
    key: "open",
    value: function open() {
      var item = RIG;
      if (kolmafia.availableAmount(RIG) === 0) {
        if (kolmafia.availableAmount(VOUCHER) === 0) {
          kolmafia.print("You don't have a Bastille Battalion control rig or a loaner voucher.", "red");
          return null;
        }
        if (!kolmafia.userConfirm("Use a loaner voucher to play Bastille Battalion?")) return null;
        item = VOUCHER;
      }
      if (kolmafia.itemAmount(item) === 0) kolmafia.retrieveItem(1, item);
      return parseObservation(kolmafia.visitUrl("inv_use.php?whichitem=".concat(item.id, "&pwd=").concat(kolmafia.myHash())));
    }
  }, {
    key: "choose",
    value: function choose(choice, option) {
      return parseObservation(kolmafia.visitUrl("choice.php?whichchoice=".concat(choice, "&option=").concat(option, "&pwd=").concat(kolmafia.myHash())));
    }
  }, {
    key: "boosts",
    value: function boosts() {
      return BOOST_EFFECTS.map(id => kolmafia.haveEffect(kolmafia.Effect.get(id)));
    }
  }, {
    key: "rewardsPending",
    value: function rewardsPending() {
      return DAILY_ITEMS.every(name => kolmafia.availableAmount(kolmafia.Item.get(name)) === 0);
    }
  }, {
    key: "playsLeft",
    value: function playsLeft() {
      return Math.max(0, PLAYS_PER_DAY - Number(kolmafia.getProperty("_bastilleGames")));
    }
  }, {
    key: "log",
    value: function log(message, color) {
      kolmafia.print(message, color);
    }

    // Each potion gives a turn of its boost, which caps at 3. Games don't take
    // turns, so they last until you next adventure.
  }, {
    key: "drinkPotions",
    value: function drinkPotions() {
      var boosts = this.boosts();
      BOOST_POTIONS.forEach((name, i) => {
        var potion = kolmafia.Item.get(name);
        var wanted = Math.min(3 - boosts[i], kolmafia.availableAmount(potion));
        if (wanted > 0) {
          kolmafia.retrieveItem(wanted, potion);
          kolmafia.use(wanted, potion);
        }
      });
    }
  }]);
}();

var WORDS = {
  barbecue: {
    barb: 1
  },
  bbq: {
    barb: 1
  },
  babar: {
    barb: 2
  },
  barbershop: {
    barb: 3
  },
  brutalist: {
    bridge: 1
  },
  brogues: {
    bridge: 1
  },
  draftsman: {
    bridge: 2
  },
  gloves: {
    bridge: 2
  },
  nouveau: {
    bridge: 3
  },
  nosering: {
    bridge: 3
  },
  cannon: {
    holes: 1
  },
  catapult: {
    holes: 2
  },
  gesture: {
    holes: 3
  },
  sharks: {
    moat: 1
  },
  lava: {
    moat: 2
  },
  truth: {
    moat: 3
  },
  muscle: {
    barb: 2,
    bridge: 1,
    holes: 1
  },
  myst: {
    barb: 1,
    bridge: 2,
    holes: 2
  },
  moxie: {
    barb: 3,
    bridge: 3,
    holes: 3
  }
};
function mainstatBarbican() {
  var stat = kolmafia.myPrimestat();
  if (stat === kolmafia.Stat.get("Muscle")) return {
    barb: 2
  };
  if (stat === kolmafia.Stat.get("Mysticality")) return {
    barb: 1
  };
  return {
    barb: 3
  };
}
function help() {
  kolmafia.print("pompeii [rewards...] [games=N] [samples=N] [nopotions] [nolock]");
  kolmafia.print("Plays Bastille Battalion to maximise cheese, learning enemy castles as it goes.");
  kolmafia.print("");
  kolmafia.print("Rewards (first game of the day only; anything not given is chosen for score):");
  kolmafia.print("  barbecue/babar/barbershop, brutalist/draftsman/nouveau, cannon/catapult/gesture,");
  kolmafia.print("  sharks/lava/truth, or muscle/myst/moxie/mainstat for all three stat-themed ones.");
  kolmafia.print("  The barbican defaults to your mainstat.");
  kolmafia.print("games=N    stop after N games (default: all remaining plays)");
  kolmafia.print("samples=N  rollouts per decision; higher is slower but sharper (default 16)");
  kolmafia.print("nopotions  don't top up sharkfin gumbo/boiling broth/interrogative elixir to 3 turns each");
  kolmafia.print("nolock     never lock in a score for the leaderboard");
  kolmafia.print("           (set pompeiiNoLock=true to make that permanent for a character)");
}
function main() {
  var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
  var words = args.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.includes("help")) return help();
  var options = {
    rewards: mainstatBarbican(),
    games: 5,
    samples: 16,
    // Per-character opt-out, e.g. for characters that shouldn't appear on the leaderboard
    lockIn: kolmafia.getProperty("pompeiiNoLock") !== "true"
  };
  var potions = true;
  var _iterator = _createForOfIteratorHelper(words),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var word = _step.value;
      var _word$split = word.split("="),
        _word$split2 = _slicedToArray(_word$split, 2),
        key = _word$split2[0],
        value = _word$split2[1];
      if (key === "games") options.games = Number(value);else if (key === "samples") options.samples = Number(value);else if (word === "nopotions") potions = false;else if (word === "nolock") options.lockIn = false;else if (word === "mainstat") {
        var barb = mainstatBarbican().barb;
        Object.assign(options.rewards, WORDS[barb === 2 ? "muscle" : barb === 1 ? "myst" : "moxie"]);
      } else if (WORDS[word]) Object.assign(options.rewards, WORDS[word]);else {
        kolmafia.print("Unknown argument \"".concat(word, "\""), "red");
        return help();
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var client = new GameClient();
  if (potions) client.drinkPotions();
  new Engine(client, options).run();
}

exports.main = main;
