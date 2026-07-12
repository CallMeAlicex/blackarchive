// Seed the Arcanaeum with curated arcane lore, owned by a curator scribe.
// Usage: BASE_URL=... CURATOR_NAME='Keeper of the Arcanaeum' CURATOR_PASS='...' node scripts/seed.mjs
// Idempotent: skips any work whose title already exists in the library.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CURATOR_NAME = process.env.CURATOR_NAME || 'Keeper of the Arcanaeum';
const CURATOR_PASS = process.env.CURATOR_PASS;
if (!CURATOR_PASS) { console.error('Set CURATOR_PASS'); process.exit(1); }

const jar = [];
function stash(res){ const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : []; for (const c of sc) jar.push(c.split(';')[0]); }
async function api(method, p, body){
  const res = await fetch(BASE + p, { method, headers: { 'Content-Type':'application/json', 'Cookie': jar.join('; ') }, body: body ? JSON.stringify(body) : undefined });
  stash(res);
  const t = await res.text(); let d; try { d = JSON.parse(t); } catch { d = t; }
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${JSON.stringify(d)}`);
  return d;
}

const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8'));

const apprenticeJournal = {
  ...seedData.apprenticeJournal,
  subtitle: seedData.apprenticeJournal.subtitle || 'The First Season at the College',
};

const fiveSchools = {
  type: 'book',
  title: 'The Five Schools: A Primer',
  author: 'Recorded for the Arcanaeum',
  subtitle: 'An Apprentice’s Introduction to the Living Arts of Magicka',
  entries: [
    { title: 'On Magicka Itself', date_line: 'A word before the schools',
      body: `Before the schools, the source. Every spell an apprentice will ever cast is drawn from a single well, and that well is magicka — the raw stuff of creation that pours ceaselessly down from Aetherius, the plane of the stars, through the wounds the world was born with.

A mage does not make magicka any more than a miller makes the river. A mage only learns to turn the wheel. The schools you are about to study are five different wheels, five disciplines of the same current, and the difference between a novice and a master is not how much water they command but how little they waste.

Learn this first, and the rest will come easier: you are not the source of your power. You are its student.` },
    { title: 'Destruction', date_line: 'The first school',
      body: `Destruction is the shaping of raw elemental force — fire, frost, and shock — into a weapon of the will. It is the loudest school and the most misunderstood, for the novice believes it is a school of anger, and it is not. Anger burns the caster first.

Fire consumes and spreads; it punishes the massed and the flammable. Frost slows and drains, stealing the very warmth from muscle and mind, and here in the north it is the truest of the three. Shock strikes swift and sears the reserves of a rival mage, so that a lightning-caster is the natural bane of another spellsword.

The master of Destruction is not the one who casts the largest flame. It is the one who, holding the largest flame, chooses not to.` },
    { title: 'Restoration', date_line: 'The second school',
      body: `Restoration governs the mending of living things and the warding away of harm — the closing of wounds, the curing of poisons and disease, the turning of the undead, and the raising of barriers of protective light.

It is fashionable among the proud to call it the lesser school, the healer’s trade. This is the vanity of those who have never bled out a pace from safety. He who can only wound is at the mercy of the first wound he cannot answer; he who can mend fears no such thing.

Restoration is also the great foe of necromancy, for the same art that steadies the living will scatter the animate dead. There is a reason the College honours it, whatever the apprentices whisper in the halls.` },
    { title: 'Alteration', date_line: 'The third school',
      body: `Alteration is the art of imposing one’s will upon the physical laws of the world — hardening the flesh against a blade, bearing weight without strain, breathing beneath water, or persuading a locked mechanism to open as though it had never been shut.

Its practitioners are a peculiar sort, given to the belief that solidity, gravity, and permanence are merely stubborn habits the world has fallen into and may, with sufficient argument, be talked out of. There is more truth in this than the other schools care to admit.

Alteration teaches the deepest lesson of magic: that reality is not a wall but a wager, and most mortals never think to place a bet.` },
    { title: 'Illusion', date_line: 'The fourth school',
      body: `Illusion works not upon the world but upon the mind that perceives it — kindling courage or terror, calm or frenzy, and bending light itself so that the caster passes unseen.

It is the gentlest school in its methods and the most feared in its reputation, for a hurled flame announces itself and a planted thought does not. The Illusionist may empty a battlefield without a drop of blood, or walk through a locked hall as though invisible, which in every practical sense she is.

Guard yourself here above all: the mage who studies how feelings are placed in others soon learns to ask which of her own were ever truly her own. That question, honestly held, is the beginning of wisdom.` },
    { title: 'Conjuration', date_line: 'The fifth school',
      body: `Conjuration is the summoning of creatures and weapons from the realms of Oblivion and the binding of them, however briefly, to the summoner’s command. The flame atronach, the frost thrall, the spectral blade — all are called across a threshold that is meant to remain closed.

Every conjuration is a door, and a door swings both ways. The bound thing serves only so long as the binding holds and the will behind it does not falter. Learn the closing words before the opening ones, and speak them faster than you can think.

The most dangerous conjurer is not the one who cannot summon. It is the one who has forgotten how to send back.` },
    { title: 'A Note on the Lost School', date_line: 'A word after the schools',
      body: `The observant apprentice will count five schools here and recall that the old texts speak of six. The sixth was Mysticism — the study of magic’s own nature, of soul and scrying and the binding of unseen forces.

In our age its arts have been parcelled out among the others or quietly set aside, and the Arcanaeum no longer lists it as a discipline of its own. Whether it was dissolved because it was understood or because it was feared, the catalogue does not say, and a catalogue that does not say is worth reading twice.

Study the five. But remember that the map is not the country, and that magic is older than any College’s way of dividing it.` },
  ],
};

const greatCollapse = {
  type: 'book',
  title: 'The Great Collapse of Winterhold',
  author: 'An account gathered from survivors',
  subtitle: 'How the Sea Took the City and Spared the College',
  entries: [
    { title: 'Before the Wave', date_line: 'In the years of plenty',
      body: `Once Winterhold was a jarl’s seat and a city of consequence, its harbour busy, its streets climbing the cliff in tiers of stone and timber. The College stood then as it stands now, out upon its spire of rock, joined to the town by the great bridge — a neighbour the city tolerated more than loved, but a neighbour all the same.

Those who remember the old Winterhold remember it as cold but living, a place where the sea and the north had been bargained with, if never quite befriended. No one who walked those streets imagined the sea would one day simply take them back.

It is the way of catastrophes that they are unthinkable until the hour they arrive, and obvious ever after.` },
    { title: 'The Night the Cliff Fell', date_line: 'The hour of the Collapse',
      body: `The survivors do not agree on much, but they agree on the sound — a groan from deep in the rock, and then the sea rising where no tide had ever reached. In a single terrible night great sections of the cliff sheared away and slid into the water, and with them went the harbour, the lower town, and the greater part of the city and its people.

When the dawn came, Winterhold was a handful of houses on a broken cliff and a great empty wound where the rest had been. And out beyond the ruin, untouched, its lights still burning in the high windows, stood the College of Winterhold upon its spire, joined to what remained by the bridge that had somehow held.

That the College stood while the city fell is the whole of the tragedy, and the whole of the grievance that has haunted the two ever since.` },
    { title: 'The Blame', date_line: 'In the bitter years after',
      body: `The people who remained needed a cause, as grieving people do, and the cause was near at hand and lit against the dark. They named the College. They said the mages had drawn the sea up with their meddling, or angered something better left alone, or simply that so much magic gathered in one place had rotted the very rock beneath the town.

The mages, for their part, pointed south, to the great eruption that had convulsed the whole of the north in those same years, and said the sea had risen everywhere, and that no spell of theirs had called it.

The truth may be that both are right, or neither. What is certain is that the College could not save the city, or did not, and that a neighbour who stands untouched amid your ruin will always wear the look of a culprit, whether or not the crime was ever his.` },
    { title: 'What the Silence Guards', date_line: 'A scholar’s unease',
      body: `Here I set down the thing that unsettles me, and I set it down plainly. The Arcanaeum holds books on every disaster of the age — save this one. On the Collapse the shelves grow strangely thin, and the accounts that remain are cautious to the point of saying nothing at all.

A library that falls silent on a single subject is not empty of an answer. It is keeping one. Whether the College keeps this silence out of guilt, or ignorance, or the ordinary decency of not wishing to reopen a wound, I cannot say.

I record only this, for whoever reads it: that the Great Collapse is the ground the College stands upon, in every sense, and that no member of it should walk the bridge without knowing what lies drowned beneath the water on either side.` },
  ],
};

const enchantment = {
  type: 'book',
  title: 'On Soul Gems and the Craft of Enchantment',
  author: 'Recorded for the Arcanaeum',
  subtitle: 'Wherein the Binding of Power into Objects is Set Down for the Prudent',
  entries: [
    { title: 'The Vessel and the Charge', date_line: 'First principles',
      body: `Enchantment is the art of binding a magical effect into an object, that a sword might burn or a ring might ward long after the mage who made it has set it down. But no enchantment holds without a charge, and no charge exists without a vessel to carry it. That vessel is the soul gem.

A soul gem is a crystal capable of holding a soul — that is, the animating essence of a living thing — and it is the captured soul that powers the enchantment, spending itself slowly as the effect is used. Understand this and you understand the whole grim economy of the craft: every burning blade is paid for in a caught spirit.

The apprentice who never asks whose spirit is the apprentice who should not be trusted with the craft at all.` },
    { title: 'The Grades of the Gem', date_line: 'Of common vessels',
      body: `Soul gems come in grades, from the petty to the grand, and a soul may only be housed in a vessel large enough to contain it. A lesser creature — a wolf, a skeever, a mudcrab — yields a lesser soul, fit for a petty or common gem and a modest enchantment. The great beasts of the wild yield greater souls, and greater power.

A gem must be empty to receive, and filled to be spent. A grand gem holding a mammoth’s soul may charge an enchantment of formidable strength; the same gem, cracked or ill-cast, may hold nothing at all and shatter in the working.

Match the vessel to the intent. Ambition that outruns its gem is how apprentices lose fingers, and worse.` },
    { title: 'The Black Gem and the Line Not Crossed', date_line: 'A warning set in plain words',
      body: `There exists a gem that is not graded with the others, and the Arcanaeum names it only to forbid it: the black soul gem, which alone can hold the soul of a thinking, speaking being — a mortal.

To trap a beast’s soul is the ordinary cost of the craft. To trap a mortal’s is a crossing into necromancy and into cruelty, and it is forbidden within these walls without exception and without appeal. The power such a gem holds is real. So is the price, and the price is not paid by the enchanter.

I set this down not to tempt but to forewarn. You will hear the black gem spoken of in low voices. Hear it, and turn away, and remember that the greatest enchanters this College ever raised had no need of it.` },
    { title: 'The Discipline of the Craft', date_line: 'A closing counsel',
      body: `Enchantment rewards patience above brilliance. The effect must be understood before it is bound; the vessel must be sound; the object must be worthy of the working, for a poor blade well enchanted is still a poor blade.

Begin small. Bind a minor ward into a ring you will wear yourself, so that the first enchantment you trust your life to is one you made with your own hands and understand to its foundation. Learn to disenchant, too — to take an existing working apart and read how it was made — for there is no faster teacher than another mage’s finished art laid open on the bench.

The forge and the flame are patient. Be patient with them, and they will hold your power long after your voice has gone quiet.` },
  ],
};

const conjurersCautions = {
  type: 'book',
  title: 'A Conjurer’s Cautions',
  author: 'Set down by a tutor of the summoning arts',
  subtitle: 'Seven Rules for the Safe Calling and Sending of the Bound',
  entries: [
    { title: 'Why These Rules Exist', date_line: 'Read before you summon',
      body: `Every rule in this slim book was written in the aftermath of someone breaking it. I have taught the summoning arts at this College for many years, and I have buried students. This is not a text of theory. It is a text of survivors.

Conjuration is the only school in which a moment’s lapse does not merely fail — it answers back. A botched fireball fizzles. A botched binding walks free. Keep that distinction always before you.

Learn these seven rules until you could recite them woken suddenly in the dark, for that is very often the hour you will need them.` },
    { title: 'The First Three Rules', date_line: 'Of the circle and the word',
      body: `First: never summon without your closing words already fixed in mind. Learn to send back before you learn to call forth. The apprentice who masters the opening and neglects the closing has built a door with no latch.

Second: summon within a ward when you may, especially when you are learning. A bound circle of silver will hold what your will alone might drop, and it costs you nothing but the drawing of it.

Third: never summon in anger, exhaustion, or fear. The binding is a contract of will, and a weakened will signs a weaker contract. The atronach knows the difference between a master and a frightened child playing at mastery. It waits for the child.` },
    { title: 'The Last Four Rules', date_line: 'Of limits and humility',
      body: `Fourth: summon one thing at a time until you are certain, then one more than you are certain of, and no further. Ambition in this school is measured in funerals.

Fifth: know what you are calling. A flame atronach and a frost atronach answer to different tempers, and a Dremora is not an atronach at all but a thinking thing that will parse your every hesitation. Read the creature before you call it.

Sixth: when the binding frays, do not fight it. Send the thing back at once and summon it anew. A clean dismissal and a fresh call are always safer than wrestling a slipping leash.

Seventh, and last: when you are done, count what you summoned and count what you sent back, and do not leave the circle until the two numbers agree. More students have died to forgetting this rule than to any spell in the catalogue.` },
  ],
};

const noticeToApprentices = {
  type: 'parchment',
  title: 'Notice to Apprentices',
  author: 'The Keeper of the Arcanaeum',
  subtitle: 'Posted upon the door of the library',
  meta: { date: 'By standing order of the College', to: 'All members and visitors', seal: 'Read, and be governed accordingly.' },
  entries: [{ title: 'Notice to Apprentices', body: `The Arcanaeum is the heart of this College and is to be treated as such. What follows is not advice. It is the law of this hall.

No spell is to be cast among the stacks. Not a candle-flame, not a ward, not the smallest cantrip of light. Bring a lamp if you must, and mind it.

No book leaves the Arcanaeum. Read where you stand or read at the tables; the shelves are not a lending shop, and a book gone wandering is a book gone forever.

The chained case is not to be opened, questioned, or lingered before. Those books were shelved for a reason, and the reason is not owed to your curiosity.

Return every volume to its place. A misfiled book is a lost book, and the Keeper’s patience for the careless is a resource more finite than magicka.

Break these rules and you will not be scolded. You will simply find the doors of the Arcanaeum closed to you, and here, that is a colder exile than the bridge outside.` }],
};

const letterFromTheNorth = {
  type: 'parchment',
  title: 'A Letter from the Frozen North',
  author: 'An apprentice, to her mother in Cyrodiil',
  subtitle: 'Carried south by the first caravan of spring',
  meta: { date: 'Written in the deep of winter', to: 'My mother, in warmer country', seal: 'Your daughter, who is not sorry she came.' },
  entries: [{ title: 'A Letter from the Frozen North', body: `Mother — I know you wept when I chose the College, and I know Winterhold is only a name of cold and rumour to you, so let me tell you what it is truly like, that you may worry over the right things and not the wrong ones.

It is cold beyond anything you have felt. The wind comes off the sea with teeth in it, and the town outside our walls is half a ruin, and the folk there hate us for standing when their city fell. All of this is true, and none of it is the whole of it.

For I have held frost in my bare hand and felt no pain. I have watched a woman close a wound with a word. I have stood on the high walls beneath the northern lights while the whole sky ran green and violet and poured its magic down upon the snow, and I have understood, in a way I cannot write small enough to fit this page, why I was born.

Do not send for me. Do not send warmer clothes, though I will take them if you do. Send only word that you are well, and know that your daughter is where she is meant to be — cold to the bone and more alive than she has ever been. By hand and by Magnus, I remain yours.` }],
};

const WORKS = [
  apprenticeJournal,
  fiveSchools,
  greatCollapse,
  enchantment,
  conjurersCautions,
  noticeToApprentices,
  letterFromTheNorth,
];

async function main(){
  // Register curator, or log in if the codename is already claimed.
  try {
    await api('POST', '/api/auth/register', { codename: CURATOR_NAME, passphrase: CURATOR_PASS });
    console.log('Registered curator:', CURATOR_NAME);
  } catch (e) {
    await api('POST', '/api/auth/login', { codename: CURATOR_NAME, passphrase: CURATOR_PASS });
    console.log('Logged in as existing curator:', CURATOR_NAME);
  }

  const lib = await api('GET', '/api/library');
  const existing = new Set([...(lib.books||[]), ...(lib.parchments||[])].map(w => w.title));

  for (const w of WORKS){
    if (existing.has(w.title)) { console.log('skip (exists):', w.title); continue; }
    const created = await api('POST', '/api/works', w);
    console.log('seeded:', w.title, '(' + (w.entries?.length||0) + ' entries)');
  }
  console.log('Done.');
}
main().catch(e => { console.error('SEED ERROR:', e.message); process.exit(1); });
