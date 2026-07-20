'use strict';

// One-shot content seed: the "Pause" watch account and its incident-report
// catchment — "The Ma’jirr Catchment". Created UN-ADOPTED (archived=0) so it
// sits in the Library's "Not Adopted" section until a curator adopts it.
//
// Runs on boot (see server.js), inside the deployed container, so it can reach
// the persistent volume DB. Idempotent: skips the account and the work if they
// already exist. Safe to leave in place; may be deleted once it has run once.

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SCRIBE = 'Pause';
const TITLE  = 'The Ma’jirr Catchment';

const CATCHMENT = {
  type: 'book',
  title: TITLE,
  author: 'Filed by Pause, Temple Watch',
  subtitle: 'Incident Report — Attack upon the Temple of the Divines, by Cultists · Sun’s Height, Era of the Fourth',
  meta: { subject: 'Ma’jirr', status: 'Open — awaiting the healer’s continuation' },
  entries: [
    {
      title: 'Report',
      date_line: '17th of Sun’s Height, Turdas · approx.',
      body:
`Subject: Ma’jirr, Khajiit.
Witnesses: Ornulf; Nomitius Cato; Calisvin High-Guard; Bennet Kaye (first interaction only); Shendal (healing).

The following is my understanding of events, drawn from the testimony of witnesses and from my own observation.

The Khajiit named himself Ma’jirr, and approached me to ask after Miravi when he overheard her name spoken. Shortly after, he complained of a headache. Questioned, he claimed to have "blacked out." We pressed him then on what he could still remember. A member of the Dawnguard stood nearby and administered a sun-rune test. There was no reaction — if enthrallment had been laid upon him, it lingers no longer.

We bore him into the temple to seek healing. Ornulf, already there tending another (S’Dar), came to assess the damage. The wounds he carries — set down hereafter — he does not remember taking. As he described them his voice was unsteady, and he coughed often.

He claims to have a wife. Sa’vana, perhaps; I could not be certain, for his speech was hard to follow.

A physician by the name of Shendal came, at Ornulf’s request, to assist — after the eye had been examined.

In time he seemed to know my face. I told him I had been taken by the vampires for a season and since released; reason enough that he might know me. He said another had been taken also. I spoke the name Cassian; he seemed to remember it, and said that "he was turned" — or "he has turned."

Ornulf and Shendal continued their work upon him. I was then called away to other duties, and left Ma’jirr in their care. I will enquire with Ornulf, when next he is free, as to the remainder of events.`
    },
    {
      title: 'Injuries Sustained',
      date_line: 'Filed with the report',
      body:
`The following injuries were observed upon the subject. He does not remember receiving any of them.

— A missing eye. Ornulf examined the socket closely, then left to seek another’s aid before he had finished. This account will be expanded once his findings are known.

— Burn marks encircling the neck, in the shape, perhaps, of a collar — scarring where the skin had been burned.

— The body cold to the touch. Ice magic, it may be, was worked upon him.

— Names carved into his arm. I set them down exactly as they were cut:

        ⸻  TIPH  ⸻
        ⸻  BLACK VEIL  ⸻
        ⸻  YRLIN  ⸻`
    },
    {
      title: 'Evidence Held',
      date_line: 'Sealed with the report',
      body:
`Held in evidence:

The subject claimed to carry some manner of implant within his satchel. Asked to produce it, he brought out what appears to be a soul gem carved into the shape of an eye, with runes cut into its surface. I cannot name the runes, but will describe them as faithfully as I am able. To one who knows such marks they would be plain; to me they are not:

    [ a ring of Daedric characters cut into the gem — Conjuration work,
      if any hand in this hold can read it ]

Upon examination of the empty socket, some dark thing seemed to linger within it, and afterward a black liquid seeped from the wound. A sample of this liquid was drawn off into a vial and kept with this report.

The sun-rune test administered at the scene drew no reaction (see Report).`
    },
    {
      title: 'Pending — Ornulf’s Hand',
      date_line: 'Awaiting the healer’s continuation',
      body:
`This page is left for Ornulf, who continued the subject’s care after I was called away, and for Shendal beside him.

To be added:
— the healer’s closer account of the missing eye;
— the outcome of treatment, and the disposition of the subject thereafter;
— any word on the one named Cassian, said to have turned.

The Watch keeps this catchment open.`
    },
  ],
};

async function ensureReportCatchment({ scribes, works, saveEntriesForWork }) {
  try {
    let scribe = scribes.findByCodename.get(SCRIBE);
    if (!scribe) {
      const pass = process.env.PAUSE_PASS || 'OnWatch';
      scribes.create.run({ id: uuidv4(), codename: SCRIBE, passphrase: await bcrypt.hash(pass, 10), is_admin: 0 });
      scribe = scribes.findByCodename.get(SCRIBE);
      console.log(`Seeded watch account: ${SCRIBE}`);
    }
    const already = works.byScribe.all(scribe.id).some(w => w.title === TITLE);
    if (already) return;
    const id = uuidv4();
    works.create.run({ id, scribe_id: scribe.id, type: CATCHMENT.type, title: CATCHMENT.title,
      author: CATCHMENT.author, subtitle: CATCHMENT.subtitle,
      meta: JSON.stringify(CATCHMENT.meta), archived: 0 });
    saveEntriesForWork(id, CATCHMENT.entries.map(e => ({
      id: uuidv4(), title: e.title, date_line: e.date_line, body: e.body })));
    console.log(`Seeded catchment (un-adopted): ${TITLE}`);
  } catch (err) {
    console.error('ensureReportCatchment failed:', err);
  }
}

module.exports = { ensureReportCatchment };
