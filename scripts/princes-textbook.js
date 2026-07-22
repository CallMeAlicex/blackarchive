'use strict';

// Content seed: a curator's textbook — "The Princes of Oblivion" — authored by
// the admin scribe K-M and placed in the Master Archive (archived=1).
//
// Each entry uses the reader's block markup: "## Heading" for a section header
// and "---" for an ornamental break (see makeBlocks in public/index.html). Every
// Prince is laid out as lead prose followed by three sections: The Sphere, The
// Faithful, The Warning.
//
// Runs on boot inside the deployed container (see server.js). Idempotent by
// title, and reconciled by SEED_VERSION: bump the constant to push edited
// content to an already-seeded copy on the next deploy. Never creates or alters
// the admin account (does nothing if K-M is absent).

const { v4: uuidv4 } = require('uuid');

const ADMIN_NAME = process.env.ADMIN_NAME || 'K-M';
const TITLE = 'The Princes of Oblivion';
const SEED_VERSION = 2;

// Build a Prince entry: a lead paragraph, then Sphere / Faithful / Warning.
const P = (title, date_line, lead, sphere, faithful, warning) => ({
  title, date_line,
  body: [lead,
    '## The Sphere', sphere,
    '## The Faithful', faithful,
    '## The Warning', warning].join('\n\n'),
});

const ENTRIES = [
  {
    title: 'How to Read This Book',
    date_line: 'A preface for the student',
    body: [
`The sixteen Princes of Oblivion, and the seventeenth who is counted twice, are not gods in the way the Divines are gods. They shaped nothing of this world and they owe it nothing. This book sets them before you plainly, so that you may know them by their works rather than by the rumours that cling to their names.`,
'## What a Daedra Is',
`When the world was made, the Aedra gave of their own substance to build it, and were diminished by the giving. The Daedra gave nothing. That is the whole of the difference, and it explains almost everything else. A Prince does not age, does not tire, and does not change unless it wills the change. Unmake the shape it wears and you send it home for a season; you do not end it. Patience is the one advantage no mortal has ever held over them.`,
'## The Good Daedra and the House of Troubles',
`Not every people agrees on which Princes are foul. The Dunmer honour three of them, Azura, Boethiah, and Mephala, as the Good Daedra who guided their ancestors into becoming a people. Four others they name the House of Troubles, whose tests are meant to be endured rather than obeyed. An Imperial priest and a Morrowind ashlander will hand you two different books. Where they disagree, both judgements are set down here.`,
'## On the Word "Evil"',
`Read that word with care. In these pages it most often means forbidden by Imperial law, or condemned by the temples of the Divines, which is not always the same thing as wicked. A Prince who arms you against the undead and a Prince who feeds you to a cult can both be filed under the one heading. Weigh each on the account given, not on the label above it.`,
'## How the Entries Are Ordered',
`Every Prince is given three parts. The Sphere describes what it governs and the realm it keeps. The Faithful explains who kneels to it and what they are promised. The Warning sets out why the temples teach against it. Learn all three before you settle on a view, and trust none of them further than the page allows.`,
    ].join('\n\n'),
  },

  P('Molag Bal', 'Prince of Domination · Lord of Coldharbour',
    `Of all the Princes, Molag Bal is the one the temples name first when they speak of cruelty, and they are not wrong to. His pleasure is the slow mastery of another will, worked patiently until nothing remains of it but obedience.`,
    `His domain is domination, and the harvest of mortal souls to fill it. He keeps Coldharbour, a grey and ruined copy of our own world where every warmth has been stolen and every hope is held a hand's breadth out of reach. He seldom conquers with armies. He prefers to turn a thing you love slowly against you, until you can no longer tell your captor from your friend.`,
    `Those who come to Molag Bal come for power over other people, and he grants it truly. Tyrants, slavers, and the merely spiteful find in him a patron who understands them exactly. What he asks in return is that they become, by small degrees, as bound to him as their own victims are to them.`,
    `He is the sire of the first vampire, a curse he worked upon an innocent woman out of nothing but malice, and that inheritance troubles Tamriel to this day. His whole sphere is the taking of wills. There is no bargain with him that does not end in a collar, whether or not you ever feel it close.`),

  P('Mehrunes Dagon', 'Prince of Destruction · Lord of the Deadlands',
    `Where Molag Bal is patient, Mehrunes Dagon is the sudden fire at the gate. He is ruin given ambition, and he has never once believed that anything built deserves to go on standing.`,
    `His spheres are destruction, change, revolution, and ambition. He rules the Deadlands, a country of lava and ash that unmakes and remakes itself without pause, as though rehearsing the end it wishes on the rest of creation. Earthquakes and floods are counted among his sacraments.`,
    `Some who serve him are simply destroyers. Others are revolutionaries, or the desperate, who have decided that a rotten order must burn before anything better can grow in its place. Every empire he has ended believed itself eternal the morning before he arrived.`,
    `The case against Mehrunes Dagon has a single name, the Oblivion Crisis, when he threw open his gates and tried to drag all of Tamriel into his burning realm. He does not tear down to clear ground for building. He tears down because the tearing is the whole of what he loves.`),

  P('Hircine', 'Prince of the Hunt · Lord of the Hunting Grounds',
    `Hircine is the oldest kind of god, the sort worshipped before there were temples, when the only law a man knew was the chase and the kill. He names himself the Huntsman, and he means it for an honour.`,
    `He governs the hunt, the chase, and the beast-blood. It is Hircine who grants lycanthropy, and Hircine who gathers the souls of the beast-blooded to his Hunting Grounds when they fall, to run and hunt there without end. For his own sport he stages the Great Hunt, and a mortal may be the hunter in one season and the quarry in the next.`,
    `Werewolves and werebears keep his name gladly, for they feel his gift as strength, as clarity, and as a freedom the settled life never offered them. To such a follower an honest death in the chase is no tragedy but the proper close of a life well spent.`,
    `Ask the prey, and the gift reads instead as slaughter. Worse, to Nord eyes, is the price folded inside the blessing. The beast-blooded do not pass to Sovngarde when they die. They belong to Hircine, and his Hunting Grounds keep them, whatever glory they won in the waking world.`),

  P('Malacath', 'Prince of the Spurned · Lord of the Ashpit',
    `Malacath is the Prince the others refuse to seat at their table, and that exile is the truest thing about him. He is god of everyone the world has thrown away and who proved too stubborn to lie down and die of it.`,
    `His spheres are curses, broken oaths, and the spurned. He keeps the Ashpit, a plane of grey smoke and grinding labour, and he holds one law above every other: that an oath once sworn must never be broken, whatever the keeping of it costs. He despises deceit more than he despises any blade.`,
    `The Orsimer name him their ancestor and their god, and their whole people is built upon his bitter code of loyalty and endurance. There is a strange comfort in him, for he offers neither illusions nor false warmth. He asks only that you keep your word.`,
    `The elves see no patron here but a defiled god. They tell that Malacath was once Trinimac, a hero-god of the Aldmer, until Boethiah devoured him and remade what was left into something lesser. The Dunmer file him among the House of Troubles. Whether he is a fallen champion or a Prince like any other depends entirely on who is telling you the tale.`),

  P('Boethiah', 'Prince of Plots · the Deceiver of Nations',
    `Boethiah teaches by betrayal, and reckons it the only honest way to teach. She is beautiful, patient, and wholly without mercy for the weak or the trusting.`,
    `Her spheres are plots, treason, assassination, and the unlawful overthrow of the rightful and the strong. She does not want prayer. She wants proof, delivered as enemies outwitted and rivals removed, and she favours the follower who climbs over others to reach her feet.`,
    `To the Dunmer she is no villain but a mother of the people. In their oldest tellings it was Boethiah who devoured the smug god Trinimac and taught the ancestors to cast off the certainties of the Aldmer and become something new. They number her among the three Good Daedra.`,
    `By Imperial reckoning every article of her sphere is a crime. Assassination, sedition, and the murder of one's betters are not virtues in a lawful province, and a faith that rewards them cannot be suffered in the open. She calls it strength. The magistrate calls it the gallows.`),

  P('Mephala', 'Prince of Secrets · the Webspinner',
    `Mephala works in the dark spaces between people: the thing left unsaid, the secret held in reserve, the knife no one saw drawn. She is called the Webspinner, and every thread runs at last through her hands.`,
    `Her spheres are secrets, lies, murder, and the tangled business of desire and alliance. She rarely moves in the open. Her method is the hidden thread and the quiet word, and she cares far less who dies than who is permitted to know of it.`,
    `She too is honoured by the Dunmer as a Good Daedra, credited with teaching the ancestors the darker arts they needed to outlast their enemies. The Morag Tong, the old sanctioned killers of Morrowind, take her for their patron and dress murder in the robes of ritual and law.`,
    `A faith of assassins and blackmailers cannot help but frighten honest folk, and it should. The danger of Mephala is not the blade you can see. It is that you will never learn how many threads already bind you, or whose hand is drawing them tight, until the web has long since closed.`),

  P('Azura', 'Prince of Dusk and Dawn · Mistress of Twilight',
    `Azura wears the gentlest face the Princes ever turn toward mortals, and even she is best approached with a straight back and honest words. Of all of them she comes nearest to mercy, which is not at all the same as being safe.`,
    `Her spheres are dusk and dawn, and the magic that lives in the moment of turning between them. She is a mistress of prophecy and of long memory, and, unlike most of her kind, she takes a genuine interest in the fates of those who honour her, and seldom abandons them.`,
    `The Dunmer love her above every other Prince, and the Khajiit hold her dear as well, for she is woven into the story of how both peoples came to be. Her worship stands in daylight where others hide, and her shrines are raised without shame. She is the closest thing Oblivion offers to a kindly god.`,
    `She is barely reviled at all, and where she is, it springs from caution rather than horror. Recall only this. Azura's memory is very long, and her sense of a debt is exact. Her vengeance, when at last it comes, is as patient and as vast as she is, and it has never once been in a hurry.`),

  P('Clavicus Vile', 'Prince of Bargains · Lord of Pacts',
    `Clavicus Vile smiles more readily than any other Prince, and with good reason. He rarely has to take anything from a mortal by force. We carry it to him ourselves, and we sign.`,
    `His spheres are bargains, wishes, and pacts. He grants power and desire through contracts, and he honours them to the letter, always exactly as they were written and never as they were meant. Beside him walks a dog named Barbas, his own cast-off conscience given legs, and more often than not the wiser of the pair.`,
    `The appeal is plain and real. Clavicus Vile gives you precisely what you asked for: wealth, escape, a rival's downfall, each delivered as promised. To a certain desperate or clever soul, an honest genie is worth any risk.`,
    `The catch is never in what he grants. It lies in what you neglected to specify. Every wish he fulfils costs more than the bargain named, and the surplus is always paid out of something you did not think to guard. Read the whole contract, then read it again, and then do not sign it.`),

  P('Hermaeus Mora', 'Prince of Knowledge · Master of Apocrypha',
    `Hermaeus Mora is knowledge without wisdom and memory without mercy, a thing of eyes and reaching tendrils that has forgotten nothing ever known. He wants one thing only, to know more, and for that he will trade.`,
    `His spheres are knowledge, memory, and fate. He keeps Apocrypha, an endless library beneath a sunless green sky, where every forbidden book ever hidden stands shelved and a black sea of ink laps at the margins. Whatever secret you seek, he holds it already.`,
    `Scholars come to him, quietly, and he does not disappoint them, because he genuinely owns what they crave. There is no lie in his bargain and no missing page. He truly will tell you the thing no one living will.`,
    `The knowledge eats the knower. Those who take up his black books gain what they sought and are hollowed by the having of it, mind and soul alike. The dragon-priest Miraak learned all that Mora offered and became the Prince's creature for it. What you learn from Hermaeus Mora, you learn on his terms, and the terms never change.`),

  P('Vaermina', 'Prince of Nightmares · Mistress of Dreams',
    `Vaermina rules the hours you cannot guard. When the lamp is out and the door is barred and you have finally fallen asleep, you have crossed into her country, and she is already at her work.`,
    `Her spheres are dreams, nightmares, and evil omens. She reaches into sleeping minds and draws off their memories and their lived hours as a vintner draws wine, and the dreamer wakes the poorer for it. Some say the terrors she sends are cruelty, and some say warnings. With Vaermina it is seldom possible to tell the two apart.`,
    `A few seek her out for the sake of prophecy, holding that the omens she sends are worth the torment of receiving them. Fewer still come away glad of the trade.`,
    `She is dreaded above crueller Princes for one plain reason. She works where no ward stands and no blade helps, in the single place every living thing must go undefended. Her victims wake sleepless, harrowed, and unsure at the last which of their memories were ever truly their own.`),

  P('Namira', 'Prince of Decay · Lady of Decay',
    `Namira is everything the living instinctively turn from: the spider in the dark corner, the rot beneath the floorboard, the sweet reek that rises off the grave. She rules the parts of the world we spend our lives pretending not to see.`,
    `Her spheres are ancient darkness, decay, and revulsion in all its shapes. Spiders and insects are hers, and rot, and the eating of the dead. She presides over the spirits of disgust, and she blesses those who can look on what sickens everyone else and name it holy.`,
    `Hers is a faith of outcasts. The beggar, the leper, the shunned and the starving find in Namira a Prince who does not turn from them, for she holds nothing so low that it falls beneath her regard. To the truly cast out, that plain welcome is worth a great deal.`,
    `The plain fact remains that her cults eat the dead, and now and then arrange for the dead they mean to eat. Behind the fine philosophy of embracing what disgusts us there stands a table, and a feast, and a guest who did not come to it willingly. The temples have never needed a subtler argument than that.`),

  P('Meridia', 'Prince of Life’s Energies · Lady of Infinite Energies',
    `Meridia is the rare Prince whose enemies the temples happen to share, which makes her a tempting ally and a dangerous habit. She hates the undead with a purity that leaves room in her for very little else.`,
    `Her sphere is the energies of living things, the bright force that quickens the world, and she is the sworn and tireless enemy of undeath in all its forms. She sends mortals to hunt down necromancers and cleanse the walking dead, and arms her chosen champions with the blade Dawnbreaker.`,
    `For anyone who has faced a necromancer or fled a barrow in the dark, her appeal needs no explaining. She loathes what they loathe, and she puts real weapons in the hands of those who will fight it. Her light is genuine, and her cause, by most reckonings, is just.`,
    `She is no Divine, whatever she may resemble. She was cast out of Aetherius long ago and is a Daedric Prince now in all but sentiment, and she spends her mortal champions as freely as coin toward her single obsession. Serve her cause if you must, but never mistake being useful to Meridia for being loved by her.`),

  P('Nocturnal', 'Prince of Shadow · Mistress of Shadows',
    `Nocturnal answers to no one, explains nothing, and gives nothing away without a price, which is the very reason the thieves of Tamriel trust her as they trust no honest god. She is the dark itself, and the dark keeps its own counsel.`,
    `Her spheres are night, shadow, and luck. She is called the Mistress of Shadows and the Empress of Murk, and she stands apart even from the other Princes, owing loyalty to nothing set above her. Her Nightingales guard the Twilight Sepulcher, and in return she lends them the uncanny luck of the thief who is never caught.`,
    `Thieves keep her faith more loyally than most temples keep their own, for she rewards skill and silence and never once moralises. The Nightingales are bound to her by oaths that outlast their own lives, and they pay that debt in shadow long after the coin is spent.`,
    `She is named dark more for the company she keeps than for any great cruelty in her. Understand her bargains all the same. The luck she lends is borrowed, not given, and Nocturnal always collects. Those bound to her serve her in the shadow beyond death, and that service was written into the price from the first.`),

  P('Sanguine', 'Prince of Revelry · Lord of Debauchery',
    `Sanguine is the most companionable of the Princes and, in his idle way, among the most ruinous. He does not want your soul. He wants to see how far you will go once someone assures you there are no rules.`,
    `His spheres are revelry, debauchery, and dark indulgence. He tempts mortals past every sensible limit for the plain pleasure of watching what follows, and he wanders Nirn in the shape of an ordinary reveller, forever looking for a gathering worth spoiling.`,
    `There is no great theology to him. A good night is a good night, and Sanguine reliably provides one. Those who follow him do so for pleasure freely taken and consequences cheerfully ignored, at least for as long as the wine holds out.`,
    `The harm he works is real for being self-inflicted. Every ruined morning, squandered fortune, and wrecked life left in his wake was arrived at willingly, one agreeable choice after another. He forces nothing. He merely sees to it that the door to excess is always standing open, and then he waits.`),

  P('Sheogorath', 'Prince of Madness · Lord of the Shivering Isles',
    `Sheogorath is madness itself, and the strange bright creativity that sometimes lives inside it. He is jester and tyrant in a single breath, and there is no thread of reason in him for a mortal to take hold of.`,
    `His sphere is Madness, and he keeps the Shivering Isles, a realm divided down its middle between shining Mania and grey Dementia. He acts on no logic anyone has ever traced, which leaves him as likely to shower a beggar with gold as to unmake a king over a joke only he understands.`,
    `Some hold him in real affection, and now and again he earns it, for his blessings can run as wild and generous as his curses run cruel. Madfolk and visionaries claim him, and a scattered few of them are neither.`,
    `The danger is exactly that nothing he does can be foreseen or bargained for. You may resist a cruel Prince and satisfy a greedy one, but there is no dealing with unreason. The Dunmer count him among the House of Troubles, and the wiser worshippers pray less for his favour than for his gaze to drift elsewhere.`),

  P('Peryite', 'Prince of Pestilence · the Taskmaster',
    `Peryite is the pettiest of the Princes to look upon and among the least pleasant to serve, a hoarder of small orders and lowly tasks who happens to work in plague. He is often shown as a dragon, though he ranks among the weakest of his kind.`,
    `His spheres are tasks, the natural order, and pestilence. He keeps the lowest ranks of Oblivion each in its proper station, and he pursues his notion of order through blight and disease, which is precisely as grim as it sounds. Where Peryite tends the world, the world sickens quietly into place.`,
    `He does genuinely seek order, and a certain narrow soul finds that reassuring: a Prince who prizes diligence, station, and every thing kept in its right place. Those who serve him tend to be dutiful, and unwell.`,
    `Order may be his goal, but pestilence is his instrument, and he draws little distinction between the two. To invite Peryite's notice is to invite his methods, and his methods spread. The temples treat his shrines as they would a plague-house, and they are not being dramatic.`),

  P('Jyggalag', 'Prince of Order · Lord of Logic',
    `Jyggalag is the Prince the other Princes destroyed, or tried to, and his is the strangest story in this book. He is pure order, and order frightened even Oblivion.`,
    `His spheres are order, logic, and deduction: everything in its place, everything foreseeable, nothing left to chance or to change. He grew so vast and so certain that the other Princes, dreading what a perfectly ordered creation would leave of them, cursed him to live out the ages as his own exact opposite.`,
    `He has almost no worshippers now, and that is by design, for the curse laid on him was thorough. What following he once had admired order for its own cold sake, the promise of a world without surprise, without waste, and without freedom.`,
    `There is a lesson folded into his fate rather than a crime. The Princes did not curse Jyggalag for wickedness but for excess, and the opposite they bound him into was Sheogorath, the Madgod himself. Hold that in mind when you weigh order against madness. For a very long age, they were the same person, and the one was made to be a prison for the other.`),
];

const TEXTBOOK = {
  type: 'book',
  title: TITLE,
  author: 'Compiled by K-M, Curator of the Black Library',
  subtitle: 'A Curator’s Textbook — Their Spheres, Their Worship, and Why They Are Named Evil',
  meta: { kind: 'Reference', count: 17 },
  entries: ENTRIES,
};

async function ensurePrincesTextbook({ scribes, works, saveEntriesForWork }) {
  try {
    const admin = scribes.findByCodename.get(ADMIN_NAME);
    if (!admin) return; // only ever attaches to an existing curator
    const meta = JSON.stringify({ ...TEXTBOOK.meta, seed_version: SEED_VERSION });
    const mapped = () => TEXTBOOK.entries.map(e => ({
      id: uuidv4(), title: e.title, date_line: e.date_line, body: e.body }));

    const existing = works.byScribe.all(admin.id).find(w => w.title === TITLE);
    if (existing) {
      let m = {}; try { m = JSON.parse(existing.meta || '{}'); } catch (e) {}
      if (m.seed_version === SEED_VERSION) return; // already current
      works.update.run({ id: existing.id, scribe_id: admin.id, title: TEXTBOOK.title,
        author: TEXTBOOK.author, subtitle: TEXTBOOK.subtitle, meta });
      saveEntriesForWork(existing.id, mapped());
      console.log(`Updated textbook to v${SEED_VERSION}: ${TITLE}`);
      return;
    }

    const id = uuidv4();
    works.create.run({ id, scribe_id: admin.id, type: TEXTBOOK.type, title: TEXTBOOK.title,
      author: TEXTBOOK.author, subtitle: TEXTBOOK.subtitle, meta, archived: 1 });
    saveEntriesForWork(id, mapped());
    console.log(`Seeded textbook (${ADMIN_NAME}, Master Archive) v${SEED_VERSION}: ${TITLE}`);
  } catch (err) {
    console.error('ensurePrincesTextbook failed:', err);
  }
}

module.exports = { ensurePrincesTextbook };
