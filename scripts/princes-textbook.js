'use strict';

// Content seed: a curator's textbook — "The Princes of Oblivion" — authored by
// the admin scribe K-M. Because K-M is a curator, the work is created archived=1
// (it enters the Master Archive directly, matching how the app treats
// admin-authored works). One entry per Daedric Prince, each preserving the
// source table's three columns: sphere / why revered / why named evil.
//
// Runs on boot inside the deployed container (see server.js). Idempotent: skips
// if the work already exists, and does nothing if the K-M account is absent
// (it never creates or alters the admin account).

const { v4: uuidv4 } = require('uuid');

const ADMIN_NAME = process.env.ADMIN_NAME || 'K-M';
const TITLE = 'The Princes of Oblivion';

const P = (title, date_line, sphere, revered, evil) => ({
  title, date_line,
  body: `${sphere}\n\nWhy they are revered: ${revered}\n\nWhy they are named evil: ${evil}`,
});

const TEXTBOOK = {
  type: 'book',
  title: TITLE,
  author: 'Compiled by K-M, Curator of the Black Library',
  subtitle: 'A Curator’s Textbook — Their Spheres, Their Worship, and Why They Are Named Evil',
  meta: { kind: 'Reference', count: 17 },
  entries: [
    {
      title: 'A Word Before the Naming',
      date_line: 'On the reckoning of the Princes',
      body:
`This textbook sets down the Princes of Oblivion, and for each one three things: what they do, why mortals revere them, and why they are named evil. It is a reference, not a devotion. To name a thing plainly is the first ward against it.

Keep two cautions as you read. First, that "evil" is most often the verdict of Imperial law and the Aedra's temples, and not every people agrees — the Dunmer count three of these among their Good Daedra. Second, that the gentlest-seeming Prince in these pages is still a Prince, and none of them are safe.`
    },
    P('Molag Bal', 'Prince of Domination · Lord of Coldharbour',
      'Prince of domination and the enslavement of mortals — his sphere is the harvest of souls and the breaking of wills. He rules Coldharbour, a cold grey mockery of Nirn, and delights in setting mortals against one another.',
      'he offers real power over other people.',
      'he made the first vampire by violation, and his whole sphere is the taking of wills.'),
    P('Mehrunes Dagon', 'Prince of Destruction · Lord of the Deadlands',
      'Prince of destruction, change, revolution, and ambition — he tears down so that something else might stand. He rules the Deadlands, all fire and ash, and once tried to drag Tamriel into it.',
      'some hold that a rotten thing must burn before it can be rebuilt.',
      'the Oblivion Crisis. That is the argument.'),
    P('Hircine', 'Prince of the Hunt · Lord of the Hunting Grounds',
      'Prince of the Hunt, the chase, and the beast-blood — he grants lycanthropy, and takes the werebeasts’ souls to his Hunting Grounds when they die. He stages the Great Hunt for sport, sometimes making mortals the quarry, sometimes the hunter.',
      'hunters and werebeasts call it a gift — strength, clarity, the chase.',
      'the prey call it slaughter, and the beast-blooded forfeit Sovngarde for it.'),
    P('Malacath', 'Prince of the Spurned · Lord of the Ashpit',
      'Prince of curses, broken oaths, and the spurned — patron of everyone cast out and stubborn enough to survive it. He rules the Ashpit, and holds oaths as the one thing that must never be broken.',
      'he is the Orcs’ ancestor-god — once Trinimac, an elven hero-god, before Boethiah devoured him.',
      'the elves see a defiled god, and the Dunmer file him under the House of Troubles.'),
    P('Boethiah', 'Prince of Plots · the Deceiver of Nations',
      'Prince of plots, treason, assassination, and the unlawful overthrow of authority — she teaches by betrayal and rewards those who murder their way upward. She demands her followers prove themselves through violence and cunning rather than prayer.',
      'to the Dunmer she is a Good Daedra — she made them a people.',
      'every word of her sphere is a crime under Imperial law.'),
    P('Mephala', 'Prince of Secrets · the Webspinner',
      'Prince of secrets, lies, murder, and sex — the Webspinner, who deals in what people hide and who else can be told. She works by manipulation and hidden threads rather than open force.',
      'a Dunmer Good Daedra, and patron of the Morag Tong.',
      'assassins and blackmail — you never see the web.'),
    P('Azura', 'Prince of Dusk and Dawn · Mistress of Twilight',
      'Prince of dusk, dawn, and the magic in the space between — mistress of prophecy, twilight, and long memory. She takes a genuine interest in her followers’ fates, and rarely abandons them.',
      'beloved by Dunmer and Khajiit, she is the closest thing to a benevolent Prince.',
      'barely reviled at all — but her vengeance is patient and enormous.'),
    P('Clavicus Vile', 'Prince of Bargains · Lord of Pacts',
      'Prince of bargains, wishes, and pacts — he grants power to mortals through contracts, always precisely as worded. He keeps a dog, Barbas, who is his own conscience walking around outside him.',
      'he genuinely grants what you asked for.',
      'it always costs more than the deal said.'),
    P('Hermaeus Mora', 'Prince of Knowledge · Master of Apocrypha',
      'Prince of knowledge, memory, and fate — he hoards every secret ever kept in Apocrypha, an endless library of black books and green light. He trades forbidden knowledge to any mortal willing to pay in something other than gold.',
      'scholars, quietly — he really does hold every secret.',
      'the knowledge eats the knower. Ask Miraak.'),
    P('Vaermina', 'Prince of Nightmares · Mistress of Dreams',
      'Prince of dreams, nightmares, and evil omens — she harvests memories and experiences from sleeping mortals. Her attention leaves victims sleepless, tormented, or unable to tell waking from dreaming.',
      'a few chase prophecy through her.',
      'she works while you sleep, where no ward stands.'),
    P('Namira', 'Prince of Decay · Lady of Decay',
      'Prince of ancient darkness, decay, and everything that revolts — spiders, insects, rot, and the eating of the dead. She rules the spirits of revulsion, and blesses those who embrace what disgusts everyone else.',
      'she blesses outcasts and beggars — the ones nobody else will touch.',
      'her cults eat people.'),
    P('Meridia', 'Prince of Life’s Energies · Lady of Infinite Energies',
      'Prince of the energies of living things, and an implacable enemy of undeath in every form. She recruits mortals to purge necromancers and the walking dead, arming them with Dawnbreaker.',
      'she hates the undead, and will arm you against them.',
      'cast out of Aetherius, she spends mortals like coin.'),
    P('Nocturnal', 'Prince of Shadow · Mistress of Shadows',
      'Prince of night, shadow, and luck — the Mistress of Shadows, who gives nothing away and answers to no one. Her Nightingales guard the Twilight Sepulcher in exchange for the luck of thieves.',
      'thieves keep her faithfully, and the Nightingales are hers.',
      'called dark for her company more than for anything she takes.'),
    P('Sanguine', 'Prince of Revelry · Lord of Debauchery',
      'Prince of debauchery, revelry, and dark indulgence — he tempts mortals into excess for the pleasure of watching. He wanders Nirn in mortal guise, looking for a party worth ruining.',
      'a good night is a good night, and he delivers.',
      'ruined mornings and ruined lives — all of them consented to.'),
    P('Sheogorath', 'Prince of Madness · Lord of the Shivering Isles',
      'Prince of Madness, and of the strange creativity that lives inside it — ruler of the Shivering Isles, split between beauty and horror. He acts on no logic anyone can follow, which makes him equally likely to bless you or unmake you.',
      'some hold him fondly, and now and then he is kind.',
      'nothing he does is predictable. The House of Troubles.'),
    P('Peryite', 'Prince of Pestilence · the Taskmaster',
      'Prince of tasks, natural order, and pestilence — he keeps the lowest orders of Oblivion in their proper place. He pursues order through plague and blight, which is exactly as pleasant as it sounds.',
      'he does seek order, in his fashion.',
      'plague is his instrument.'),
    P('Jyggalag', 'Prince of Order · Lord of Logic',
      'Prince of pure order, logic, and deduction — everything in its place, everything foreseeable. He grew so powerful that the other Princes cursed him to live as his own opposite, Sheogorath.',
      'order for its own sake.',
      'the other Princes feared him enough to curse him into Sheogorath.'),
  ],
};

async function ensurePrincesTextbook({ scribes, works, saveEntriesForWork }) {
  try {
    const admin = scribes.findByCodename.get(ADMIN_NAME);
    if (!admin) return; // never creates the curator; only attaches to an existing one
    const already = works.byScribe.all(admin.id).some(w => w.title === TITLE);
    if (already) return;
    const id = uuidv4();
    works.create.run({ id, scribe_id: admin.id, type: TEXTBOOK.type, title: TEXTBOOK.title,
      author: TEXTBOOK.author, subtitle: TEXTBOOK.subtitle,
      meta: JSON.stringify(TEXTBOOK.meta), archived: 1 });
    saveEntriesForWork(id, TEXTBOOK.entries.map(e => ({
      id: uuidv4(), title: e.title, date_line: e.date_line, body: e.body })));
    console.log(`Seeded textbook (${ADMIN_NAME}, Master Archive): ${TITLE}`);
  } catch (err) {
    console.error('ensurePrincesTextbook failed:', err);
  }
}

module.exports = { ensurePrincesTextbook };
