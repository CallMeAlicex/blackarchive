// Seed the Black Library with curated lore, owned by a curator scribe.
// Usage: BASE_URL=... CURATOR_NAME='House Mournstar' CURATOR_PASS='...' node scripts/seed.mjs
// Idempotent: skips any work whose title already exists in the library.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CURATOR_NAME = process.env.CURATOR_NAME || 'House Mournstar';
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

const draugomyr = {
  ...seedData.draugomyr,
  subtitle: seedData.draugomyr.subtitle || 'Private Accounts of the Returned',
};

const houseOfTroubles = {
  type: 'book',
  title: 'The House of Troubles',
  author: 'Rendered anew for the Black Library',
  subtitle: 'Of the Four Corners of the House of Troubles — the Daedra Who Test the Faithful',
  entries: [
    { title: 'The Four Who Trouble', date_line: 'A word before the reckoning',
      body: `The wise of Morrowind name four among the Princes the House of Troubles, and they do not name them in praise. These are the Daedra who set themselves against the good order of things — who tempt, who ruin, who madden, who wager the souls of mortals as a gambler wagers coin.

Yet the elders will tell you, quietly, that trouble is not the same as evil. A blade is tested at the forge and again at the whetstone. So too is a people tested by those who trouble them. What survives the House of Troubles is stronger for having passed beneath its roof.

Read on, then, and know your adversaries. To name a thing is the first ward against it.` },
    { title: 'Molag Bal, the Schemer', date_line: 'Lord of Coldharbour, King of Rape',
      body: `First and coldest is Molag Bal, whose domain is Coldharbour — a grey mockery of Nirn where every warmth is stolen and every hope is a lantern held just out of reach. He is called the Schemer, the Harvester, the Father of the first vampire, and he delights above all in the sowing of strife.

Where two houses might make peace, Molag Bal whispers grievance. Where a soul might rest, he offers a bargain that seems a mercy and proves a chain. He does not conquer with fire, as his brother does. He conquers with the slow patient corruption of the thing you love most, turned by degrees against you until you cannot tell captor from friend.

Guard your oaths in his season. He cannot break what you will not offer him.` },
    { title: 'Mehrunes Dagon, the Destroyer', date_line: 'Prince of Ambition and Ruin',
      body: `Where Molag Bal is patient, Mehrunes Dagon is the sudden fire at the gate. His is the Deadlands, a realm of ash and burning rivers, and his sacraments are earthquakes, floods, and the razing of what mortals dared to build.

Yet the priests warn against too simple a reading. Dagon is not only destruction; he is destruction as the herald of change. He is called upon by the ambitious, the revolutionary, the desperate who would tear down a rotten order rather than suffer it a day longer. Every empire he has ended believed itself eternal the morning before.

Fear him — but understand that what he unmakes, he unmakes because it had grown too proud to bend.` },
    { title: 'Malacath, the Keeper of the Sworn Oath', date_line: 'The Reviled, God of the Spurned',
      body: `Malacath is the Prince the other Princes do not count among their number, and in this exile lies the whole of his nature. He is god of the ostracized, the pariah, the oath-bound and the broken-toothed — patron of the Orsimer, who were themselves made from the ruin of another god.

His code is bitter and unbending: keep your word though it cost you everything, for the word is the only thing the spurned truly own. He is the least deceiving of the Troubles, for he despises deceit. His curse is not madness or ruin but truth spoken without mercy — the bloody honesty of the outcast who has nothing left to lose.

To swear falsely in his hearing is the one sin he will cross realms to answer.` },
    { title: 'Sheogorath, the Sower of Flesh', date_line: 'The Madgod, Lord of the Never-There',
      body: `Last and least predictable is Sheogorath, whose realm is the Shivering Isles and whose gift is madness. He is the Sower of Flesh, the Skooma-Cat, the raving lord who is jester and tyrant in a single breath. To meet his gaze is to lose the thread of your own reasoning.

The Dunmer fear him not for cruelty but for caprice. Dagon you may resist; Bal you may refuse; Malacath you may satisfy with an honest oath. But there is no bargain to be struck with unreason. His blessings ruin as surely as his curses, and his curses, now and then, prove to be the only mercy a broken soul was ever offered.

He is the reminder folded into every prayer: that the mind is a candle, and the wind is always at the door.` },
    { title: 'On the Purpose of Trouble', date_line: 'A word after the reckoning',
      body: `So ends the naming of the Four. Do not mistake this accounting for worship — it is a map of the storms a soul must weather.

The Temple teaches that the House of Troubles was set against the Dunmer not to destroy them but to prove them, as fire proves the blade and winter proves the seed. The people who endure their tests without breaking, without bargaining, without going mad, become the ancestors the next generation will pray to.

Trouble, then, is the whetstone of the soul. Bless the House that sharpens you, and pray you are never dull enough to need its full attention.` },
  ],
};

const doorsOfOblivion = {
  type: 'book',
  title: 'The Doors of Oblivion',
  author: 'A Wanderer’s Account, copied for the Black Library',
  subtitle: 'A Traveler’s Map of the Realms Beyond the Doors',
  entries: [
    { title: 'Coldharbour', date_line: 'The realm of Molag Bal',
      body: `I have walked, in dream and in worse than dream, through several of the planes of Oblivion, and I set down what I saw that others might need never see it.

Coldharbour is Nirn drowned and drained of colour. Its sky is a lid of ash; its towers are our towers, but wrong, leaning as if the whole world had given up. The soul-shriven wander its plazas, remembering warmth they can no longer feel. Here Molag Bal keeps his harvest. I did not linger. One does not linger.` },
    { title: 'The Deadlands', date_line: 'The realm of Mehrunes Dagon',
      body: `The Deadlands are fire made into geography. Rivers of lava thread black obsidian shelves; the air itself shimmers with heat that does not warm but only consumes. Spires of jagged stone claw upward, crowned with the sigil of the Destroyer.

Nothing here is meant to endure, and so nothing does — the land remakes itself in ruin daily, as if rehearsing the end it wishes upon our world. I crossed a bridge of bone that was gone when I looked back.` },
    { title: 'Apocrypha', date_line: 'The realm of Hermaeus Mora',
      body: `Of all the realms, Apocrypha unsettled me most, for it did not threaten my body but my certainty. It is an endless library beneath a green and lightless sky — shelves without end, books that write themselves, a sea of ink lapping at the margins.

Here dwells Hermaeus Mora, who trades in forbidden knowing. Every book promises the one truth you have always wanted, and every reader who takes it pays a price they did not think to ask after. I closed the volume I found with my own name on the spine. I like to believe I closed it in time.` },
    { title: 'The Ashpit', date_line: 'The realm of Malacath',
      body: `The Ashpit is a plane of grey smoke and grinding wind, and it is, in its bleak way, honest. There are no illusions here to tempt a traveler, no false warmth, no whispered bargains — only the endless labour of the spurned and the smell of a forge that never cools.

Malacath asks nothing of his realm but that it endure, as he endures, as his people endure. I found it harsh. I did not find it cruel. There is a difference, and the difference is the whole of him.` },
    { title: 'Moonshadow', date_line: 'The realm of Azura',
      body: `And lest this account be only terror, I will tell you of Moonshadow, which is beautiful past the reach of my poor words. Its air is rose and silver; its rivers run with light; every surface glows so softly that shadows themselves seem kind.

It is said no mortal can look upon Azura’s realm without weeping, and I confess I did. Yet even beauty in Oblivion is a kind of test. To stay would be to forget the world you came from, and forgetting is its own doom. I turned back toward the grey doors, and I was glad, and I was sorry, in equal measure.` },
    { title: 'The Doors That Do Not Open', date_line: 'A warning, freely given',
      body: `There are realms I did not enter and will not name, for to name them is a kind of knocking. Let it be enough to say that the Doors of Oblivion are many, and most are locked for the traveler’s sake, not the Prince’s.

If you find one standing open, ask yourself who opened it, and why, and whether the invitation is meant as welcome or as bait. Then close it, if you are wise, and walk the long grey road home.` },
  ],
};

const spiritOfDaedra = {
  type: 'book',
  title: 'Spirit of the Daedra',
  author: 'A Catechism, set down by an unnamed cleric',
  subtitle: 'Being the Answers Given by a Daedra to a Mortal Who Dared to Ask',
  entries: [
    { title: 'Of Their Nature', date_line: 'The first asking',
      body: `I asked the spirit: what are you, that the Aedra are not?

It answered: The Aedra gave of themselves to make your world, and are diminished, and sleep. We gave nothing, and are whole, and do not sleep. That is the difference you feel when you look upon us and shiver. They are the bones of your world. We are free of it.

I asked: then are you gods? It laughed, if that sound was laughter, and said: We are what does not die and does not change unless we will it. Call that what you like. Your naming does not bind us.` },
    { title: 'Of Death and Return', date_line: 'The second asking',
      body: `I asked: can you die?

It answered: We cannot die as you die, into silence and the soil. Unmake this shape and we are only sent home, to gather ourselves and return. Time is nothing to us. A century is a held breath. You count your years because you have so few; we do not count at all.

And this, it said, is why you should fear a bargain with us above a battle. You may win the battle. You cannot outlast the patience of a thing that has no ending.` },
    { title: 'Of Worship and Use', date_line: 'The third asking',
      body: `I asked: why do you answer mortals at all, if we are so small to you?

It answered: For the same reason you tend a garden. You are useful. You act in a world we cannot easily touch. You carry our will past doors closed to us. And you are entertaining — your brief fierce lives, your loves, your betrayals. We do not need your worship. We enjoy it, as you enjoy the song of a bird that does not sing for you.

Then it said: You came to ask what we are. The truer question is what you will become in the asking. That, at least, is not yet decided. Go, while it is still yours to decide.` },
  ],
};

const sorrowOfLamae = {
  type: 'book',
  title: 'The Sorrow of Lamae',
  author: 'Rendered from the old Nedic verses',
  subtitle: 'Of the First Cold Kiss — the Origin of the Blood-Cursed',
  entries: [
    { title: 'The Wanderer', date_line: 'In the first years after the dawn',
      body: `In the years when the Nords were young in Skyrim and the old faiths still walked the hills, there was a maiden named Lamae Beolfag, a wanderer and a healer, who gave shelter freely and asked no coin.

One night in the cold she took in a stranger, pale and courteous, who named himself only as a traveler far from home. She warmed him at her fire and offered him her bread. She did not know that she had opened her door to Molag Bal, who wears courtesy the way a hunter wears the scent of the prey.` },
    { title: 'The Cold Kiss', date_line: 'That same night',
      body: `What the Lord of Coldharbour did to Lamae that night the verses tell only in shadow, and I will not drag it into the light. It is enough to say that he used her cruelly and left her broken upon the frozen ground, and that where his hands had touched her the warmth of life would never fully return.

The nomads who found her tried to burn her body upon a pyre, as was their custom. But she rose from the flames screaming, neither living nor dead, and the blood of those who had tended her was the only thirst that would quiet the cold he had left inside her. So was made the first of the blood-cursed. So began the long sorrow that has no ending.` },
    { title: 'The Inheritance', date_line: 'And ever after',
      body: `From Lamae’s cold kiss came all the lineages of the blood-drinkers that trouble Tamriel still — some proud, some wretched, some scarcely remembering the mother-wound from which they spring.

The Temple sets this tale down not as legend but as warning: that the cruelty of a Prince does not end with its victim, but runs down through the ages like a stain through cloth. Molag Bal made of one woman’s ruin an inheritance for the world. Pity the blood-cursed, then, even as you ward yourself against them. Not one of them chose the sire of their sorrow.` },
  ],
};

const whispersOfTheReach = {
  type: 'parchment',
  title: 'Whispers of the Reach',
  author: 'Collected from the hearths of Markarth',
  subtitle: 'Rumours, freely gathered and dearly paid for',
  meta: { date: 'Gathered over one long winter', to: 'Any who would listen', seal: 'Trust none of it; discard none of it.' },
  entries: [{ title: 'Whispers of the Reach', body: `They say the Forsworn do not haunt the crags for gold or grievance alone, but keep an older pact with something in the stone that remembers when the Reach was theirs.

They say a Markarth guardsman went down into the Warrens on a debt and came back up speaking to people no one else could see, and that his wages are still collected each moon by a hand that leaves no prints in the dust.

They say if you find a shrine to the old hag-gods with the offering still fresh, you should leave a coin and walk backward until the crags hide it, for whatever left that offering has not gone far.

They say the Dwemer did not die. They say they are only late. Take all of it for what a rumour is worth — which in the Reach is more than most places, and less than the teller hopes.` }],
};

const hearthTales = {
  type: 'parchment',
  title: 'Hearth-Tales of the Pale',
  author: 'As told to children who would not sleep',
  subtitle: 'Folk-warnings of the northern holds',
  meta: { date: 'Told in the dark months', to: 'The wakeful and the wary', seal: 'Mind the tales, and mind the dark.' },
  entries: [{ title: 'Hearth-Tales of the Pale', body: `Mind the lights upon the moor. When the pale fires drift low over the snow and seem to beckon, it is the Wispmother’s daughters at their dance, and the traveler who follows their glow is never found whole, if found at all.

Mind the barrow-doors left ajar. The draugr keep their kings in the deep dark, and they do not sleep so much as wait. Take nothing from a barrow you were not given, for the dead of the north count their hoard, and they have a long memory and longer patience.

Mind the ghost-lights on the water and the voice that calls your name in your mother’s voice from a house you know to be empty. Skyrim is old, and the old places keep old hungers. The hearth-tales are not told to frighten children. They are told so the children live to tell them.` }],
};

const WORKS = [ draugomyr, houseOfTroubles, doorsOfOblivion, spiritOfDaedra, sorrowOfLamae, whispersOfTheReach, hearthTales ];

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
