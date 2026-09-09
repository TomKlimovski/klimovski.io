// Message of the day: printed above the prompt on login (page load, reboot).

export const LAST_LOGIN_FROM = [
    // Neuromancer
    'chiba.city',
    'the-sprawl.bama',
    'straylight.tessier-ashpool.orbital',
    'wintermute.ai',
    'freeside.lagrange-5',
    // Dune
    'arrakeen.arrakis',
    'sietch-tabr.arrakis',
    'caladan.atreides',
    'giedi-prime.harkonnen',
    'heighliner.spacing-guild',
    // Hitchhiker's Guide
    'magrathea.custom-planets',
    'milliways.end-of-universe',
    'heart-of-gold.improbability-drive',
    // Blade Runner
    'tannhauser-gate',
    'tyrell.corp',
    // Alien
    'nostromo.weyland-yutani',
    'lv-426',
    // 2001
    'discovery-one.jupiter',
    'hal9000.local',
    // Foundation
    'trantor.galactic-empire',
    'terminus.foundation',
    // The Expanse
    'rocinante.opa',
    'tycho-station.belt',
    // Snow Crash
    'the-metaverse.black-sun',
    'the-raft.pacific',
    // The Matrix
    'zion.deep-underground',
    'nebuchadnezzar.hovercraft',
    // Hyperion
    'time-tombs.hyperion',
    // The Culture
    'gsv-sleeper-service.culture',
    // Firefly
    'serenity.firefly-class',
    // Ender's Game
    'battle.school',
    // Star Wars / Trek
    'mos-eisley.tatooine',
    'ncc-1701.starfleet',
    // Doctor Who / Battlestar
    'gallifrey.kasterborous',
    'caprica.twelve-colonies',
    // Neal Stephenson again, because
    'cryptonomicon.kinakuta',
    // Solaris
    'solaris.station',
    // Ringworld
    'ringworld.puppeteer-net',
    // Bill & Ted, honorary
    'san-dimas.circle-k',
];

export const pickFrom = (rand = Math.random) =>
    LAST_LOGIN_FROM[Math.floor(rand() * LAST_LOGIN_FROM.length)];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const two = (n) => String(n).padStart(2, '0');

// Mirrors `date` output: "Wed Sep  9 19:01:11 2026"
export const formatLastLogin = (d) =>
    `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} `
    + `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())} ${d.getFullYear()}`;

export const lastLoginLine = (date, from) =>
    `Last login: ${formatLastLogin(date)} from ${from}`;

export const homeMotd = (date, from) => [
    lastLoginLine(date, from),
    "Welcome to klimovski.io. Type 'help' to start, or 'man klimovski' for the tour.",
];

const LAST_LOGIN_KEY = 'klimovski.lastLogin';

// Returns the previous visit's time (or now, on a first visit) and records this one.
export const takeLastLogin = (storage, now = Date.now()) => {
    const prev = Number(storage.get(LAST_LOGIN_KEY));
    storage.set(LAST_LOGIN_KEY, String(now));
    return new Date(prev > 0 ? prev : now);
};
