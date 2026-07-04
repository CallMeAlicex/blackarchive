'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const SCRIBE_CODENAME = 'Draugomyr';
const SCRIBE_PASS     = 'MolagBal';
const BOOK_TITLE      = 'Draugomyr';
const BOOK_AUTHOR     = 'Draugomyr of Falkreath';
const BOOK_SUBTITLE   = 'Private Accounts of the Returned · Second Seed to Midyear · Era of the Fourth';

const ENTRIES = [
  { title:'The Returning', date_line:'28th of Second Seed, Turdas', body:`After spending a few days dedicating myself to gathering clothes, working for gold, begging for armor, and purchasing weapons, I have finally decided to work on the image of being a Priest of Arkay. Rather ironic. But it is one way to gain my lord's attention. What better way for my master to see his servant in need of his blessing than to don the image of his foe and mock his foe's practice with every act and breath.

Setting my eyes on the largest graveyard in Skyrim — Falkreath. There I shall work to call upon my lord's blessing and restore me to my accursed station. I long to break flesh and spirit till they are nothing but thralls.

Thankfully, it was too easy. I simply walked up to the masses of Falkreath and informed them that I, Draugomyr, was a Priest of Arkay. These cattle are starving for faith, and I easily earned my place as their priest. As much as I hated it, I had to act like one. To provide prayers and sermons to the weary.

I even held my first sermon to the town. I even suggested them: "Grant me the weapons of the undead you have triumphed over, for I will bless them!" Fools. The moment they leave me to it, I pray to Molag Bal and curse these weapons further.

All in the name of my master. Harvester. Schemer. Ravager. Dominator. Lord of Coldharbour. Father of Vampires. Stone-Fire... Molag Bal.

For the while, I am welcome to stay in their Hall of The Dead. One day I must own the keys to this place so that I may work on restoring my vampirism. I curse them for what they had taken from me. But I know well enough that it is still within me.` },

  { title:'The Feasting', date_line:'30th of Second Seed, Loredas', body:`Ser Belethor Banning — a man who had fallen during the battle of Falkreath against the undead. I managed to steal a mouthful's worth of blood from the wound to mask my consumption from them. It is not fresh, but it is one way to salvage any hints of vampirism, or to merely satiate the lingering thirst of my nature.

After that, I spent the rest of the day mingling with the cattle, earning their trust while honing my body. Scouring Skyrim for clues of my kind. I feel like an outsider now that I am human... again. It is sickening. I do not wish to end up in Sovngarde or in Aetherius. I loathe the idea. I'd rather be damned on Nirn as a vampire.

For now, my daughter will have to stay near the Colovian Highlands till the coast is clear. And fortunately, by the grace of Molag Bal, I met Jarl Alleric, and he granted me the Hall of the Dead.

400 septims per week? How much does a priest earn here?! I suppose I have to really act out as one. Fine. In Molag Bal's name I shall. The more sacred I appear, the more sacrilegious my deeds would be. And it is perfect.` },

  { title:"The Wolf In Shepherd's Clothing", date_line:'31st of Second Seed, Sundas', body:`Daily prayers for the grave, then for the town. But in between those moments, I have to dig up whatever rumor I can find. Amidst my travels, I came across something I thought I would never find.

Vampire dust.

Remains of my kind, or what's left of them. Perhaps I can salvage what little blessings it has. Maybe it would provide me with an ample chance of quietly joining the ranks of the undead, without even stirring them from their works.

So much work… I loathe that I can feel the sting of the sun despite being a mortal. The thirst is still there. The need. Potent.

I will set my mind on this work. And hope that I succeed so that I may return into the sliver of darkness to where I belong, away from everything, and simply feed myself till the world eats itself.` },

  { title:'A Cut', date_line:'1st of Midyear, Morndas', body:`Spent my nights attending a sermon led by a Kyne Priestess, Kaeri. The highlight was a drunken huntress by the name of Velora Rosemund who traveled with me after. Either she is that trusting or that bold.

Without anyone's notice, I invited her to stay in the Hall of the Dead for the night. Thankfully, she did not recall — especially the part where I cut her wrist open and drank her blood while stowing it away for later use in my work.

Vampire dust usually served as a primary ingredient for cures because it contains the remnants of vampiric essence. What I need to do is revitalize it. The dust is usually the heart of a vampire that withers upon their demise.

If I were to find a heart, then acclimate it with the dust — give it enough life to corrupt the blood it would pump — then I can no doubt retain my blessing. The trouble is that my talents went away when I was cured. I will need to work with crude and gristly methods.` },

  { title:'Flesh', date_line:'2nd of Midyear, Tirdas', body:`I need a catalyst that triggers a regenerative response in the heart. The heart coated thoroughly with vampire dust, filled with blood. Once I trigger the heart to pump and confuse the lingering essence of the vampire dust — it would corrupt the heart and have it squeeze out blood. Preferably vampire blood.

There is one catalyst that has sufficient magical potency to provide a vestige of life.

Daedric hearts.

Now that is a monumental challenge. Finding one would be one task. But it can be a catalyst and a pump. I am stuck with a hindrance, however.

How can I make it pulse? Smiths can have a Daedra Heart breathe power into ebony and create the finest of armors. But I am not smithing. I am trying to buy a few seconds' worth of unliving to squeeze out vampiric blood. I will need to venture out of Falkreath soon.` },

  { title:'Spark', date_line:'3rd of Midyear, Middas', body:`I must find something to trigger a pulse. Then it hit me. Void Salts!

Void Salts contain slivers of energy almost akin to being electrocuted — just enough to trigger a reaction. Especially if it comes into contact with something wet, like water. Or in my case… blood.

So at least I know what I must gather:
- Human Hearts
- Human Flesh
- Daedra Hearts
- Void Salts
- Vampire Dust
- Blood

Once I have all these, I will need a secure space — an environment and container that should store and coalesce the components. I should treat it in the same manner as a subject who wants to become a vampire.` },

  { title:'Another Blood', date_line:'4th of Midyear, Turdas', body:`Zevrin Valen — another corpse delivered to me. It took great effort to find any wound from which I could draw blood. They were not wrong; he seemed to display some rapid aging. Curious… Of course, I had to digest some while I was at it.

I stored the blood in Rimerock Burrow. While there, I realized this is the perfect place to conduct my work. The temperature was perfect, and the area is secluded enough.

Component Observations:
- Daedra Hearts — constantly showing signs of healthiness regardless of age. Like it is perpetual, inert. Worthy as a catalyst.
- Void Salts — passively contain electrical charges. Friction, water contact, and impact can trigger sparks.
- Human Hearts and Flesh, freshly stolen from Hagravens, stored safely there.
- Blood of Velora Rosemund, Ser Belethor Banning, and Zevrin Valen stored. Will use Zevrin's.

I also etched the proper schematic and flow of the components. Focused on conversion, corruption, and assimilation.` },

  { title:'The Blood Diagram', date_line:'5th of Midyear, Fredas', body:`Rudimentary, yes. That is the purpose. Forward intent, faith-fueled, and direct.

- Vampire Dust — the corrupting element, the curse.
- The desired outcome: Vampirism.
- Blood and mortal flesh — the victim element, the target.
- The Daedra Heart — centerpiece, life giver, the catalyst.

The Daedric elements of Void Salts, Daedra Heart, and Vampire Dust are a changing element. Combined with the creating elements of Human Flesh and Zevrin's Blood — this should equal a conversion that leads to a Daedric Element.

Then I should be able to corrupt the blood into a vampiric one.` },

  { title:'Dogs', date_line:'6th of Midyear, Loredas', body:`Sidetracked from my work. Yesterday, no doubt the werebeasts had utilized Hircine's Summoning Day and today's.

But I swear — if I become a werewolf out of this, I will lose it.

I had to move my components. Currently moved to an island close to Castle Volkihar. The cold is much safer there. But I will have to look for other places just to be sure.

Will take a day's worth of absence for now. And hope to Molag Bal that I do not get turned into a dog.` },

  { title:"Necromancer's Moon", date_line:'8th of Midyear, Morndas', body:`Private info from the Court Mage of Falkreath informed me of cults utilizing the Necromancer's Moon. I have to play both sides — be useful enough to the court while keeping the cult's tracks safe.

I also thought of another combination: fill the Daedra Heart with Vampire Dust and Zevrin's blood, coat it with Void Salts, and directly consume it. Almost like a cocktail — but a forward approach. I know there is a chance to become one by eating vampire dust, so this will not hurt.

In other news, Velora finally delivered my robes and amulet. This should sell my image even more. I was also offered a position in Windhelm to tend their Hall of the Dead.

The place is clean, private — and most of all, ripe with death and near vampiric attacks.` },

  { title:'Fruitless', date_line:'10th of Midyear, Middas', body:`I performed the experiments, but the trials appear fruitless. Both attempts brought only mockery. I do not wish to remain a mortal. I feel my very own right, my very own dignity stripped of its form. Every second feels like theft by the Aedra. It cannot be like this.

And here I am in Windhelm, since that damned priest wanted to reside in Falkreath. I do not have the privacy I needed. But I had prior arrangements to acquire the Hall of the Dead here.

These days already feel boring. Numb. What's harder here is that I cannot be preyed upon by other vampires because I already look like one.` },

  { title:'The New Night', date_line:'15th of Midyear, Morndas', body:`I felt forsaken into the hands of the Aedra. I loathe the notion of it. All I sought was to become who I always have been. I had lied, schemed, and corrupted. Yet my prayers, my deeds, fell silent and still. Empty. Misbegotten.

Days toiled into numbed nothingness. But then — a change.

Velora.

Afflicted by a vampire, she thought she could trust me to tend her injuries. She just made herself fall into a spider's web. When I found out that she was indeed infected, I was looking at a miracle. A dark gift to my efforts.

She is my… unwilling and unsuspecting deliverance.

She is perfect — it was her blood I stole first after the longest while here in Skyrim. And her blood is the key! My return! My life! My matron! My font!

My greatest sin for the new night.

This will be a great gift to Molag Bal — a devotee of Dibella, taken away and corrupted with this terrifying blessing. I could not think of a better gift for the Father of Vampires.

One way or another.` }
];

async function seed(_, scribesDb, worksDb, entriesDb, saveEntriesForWork) {
  try {
    const existing = worksDb.allPublic.all();
    if (existing.length > 0) {
      console.log('✦ Archive already populated — skipping seed.');
      return;
    }
  } catch(e) { /* table may not exist yet on first run */ }

  console.log("✦ Empty archive detected — seeding Draugomyr's journal...");

  const hashed = await bcrypt.hash(SCRIBE_PASS, 10);
  let scribeId = uuidv4();

  try {
    scribesDb.create.run({ id: scribeId, codename: SCRIBE_CODENAME, passphrase: hashed });
  } catch(e) {
    const existing = scribesDb.findByCodename.get(SCRIBE_CODENAME);
    if (existing) scribeId = existing.id;
  }

  const scribe = scribesDb.findByCodename.get(SCRIBE_CODENAME);
  if (!scribe) { console.error('Seed failed: could not create scribe.'); return; }

  const bookId = uuidv4();
  worksDb.create.run({ id: bookId, scribe_id: scribe.id, type: 'book',
    title: BOOK_TITLE, author: BOOK_AUTHOR, subtitle: BOOK_SUBTITLE, meta: '{}' });

  saveEntriesForWork(bookId, ENTRIES.map(e => ({ id: uuidv4(), title: e.title, date_line: e.date_line, body: e.body })));

  console.log(`✦ Seeded: "${BOOK_TITLE}" with ${ENTRIES.length} entries.`);
  console.log(`✦ Login: codename="${SCRIBE_CODENAME}" / passphrase="${SCRIBE_PASS}"`);
}

module.exports = { seed };
