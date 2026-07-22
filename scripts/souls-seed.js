'use strict';

// Content seed: the Index of Souls, House Mournstar's record of the people of
// Skyrim. Seeds a starting roll drawn from existing House lore so the Index is
// never empty. Runs on boot inside the deployed container (see server.js).
// Idempotent per-name: only inserts souls whose name is not already recorded.
// Attributes each to the K-M curator if that account exists, else leaves it to
// the House (created_by null).

const { v4: uuidv4 } = require('uuid');

const ADMIN_NAME = process.env.ADMIN_NAME || 'K-M';

const SOULS = [
  { name: 'Ma’jirr',          race: 'Khajiit',  status: 'Eye taken; enthrallment lifted',
    known: 'Approached the Temple Watch asking after Miravi. Claims to have blacked out; remembers none of his wounds. Carried a soul-gem carved as an eye, cut with Daedric Conjuration runes. Black liquid drawn from the empty socket. See the Ma’jirr Catchment.' },
  { name: 'Cassian',          race: 'Unknown',  status: 'Taken by vampires; said to have turned',
    known: 'Named by Ma’jirr as another who was taken. Ma’jirr claims he "was turned" or "has turned." Unconfirmed. Whereabouts unknown.' },
  { name: 'Miravi',           race: 'Unknown',  status: 'Of the Temple of the Divines; watched',
    known: 'Her name drew Ma’jirr to the Temple. Connection to the incident not yet understood.' },
  { name: 'Sa’vana',          race: 'Khajiit',  status: 'Existence unconfirmed',
    known: 'Ma’jirr claimed a wife, perhaps named Sa’vana. His speech was difficult to follow; the name is uncertain.' },
  { name: 'Ornulf',           race: 'Nord',     status: 'Healer; sworn of the House',
    known: 'Tended S’Dar and then Ma’jirr at the Temple. Examined the missing eye closely. A cataloguer of the House.' },
  { name: 'Shendal',          race: 'Unknown',  status: 'Physician; assisted at the Temple',
    known: 'Came at Ornulf’s request to help treat Ma’jirr after the eye was examined.' },
  { name: 'S’Dar',            race: 'Khajiit',  status: 'Treated at the Temple',
    known: 'Under Ornulf’s care at the Temple of the Divines when Ma’jirr was brought in.' },
  { name: 'Nomitius Cato',    race: 'Imperial', status: 'Witness — Temple attack',
    known: 'Present at the attack on the Temple of the Divines by cultists.' },
  { name: 'Calisvin High-Guard', race: 'Unknown', status: 'Witness — Temple attack',
    known: 'Present at the attack on the Temple of the Divines by cultists.' },
  { name: 'Bennet Kaye',      race: 'Unknown',  status: 'Witness — first interaction only',
    known: 'Present for the first interaction with Ma’jirr, no further.' },
  { name: 'Draugomyr',        race: 'Unknown',  status: 'DANGEROUS — devotee of Molag Bal',
    known: 'Poses as a Priest of Arkay in Falkreath while working to restore his vampirism in the Hall of the Dead. Do not approach unwarded. See the Draugomyr accounts.' },
  { name: 'Velora Rosemund',  race: 'Unknown',  status: 'Huntress; afflicted',
    known: 'A huntress who travelled with Draugomyr and was preyed upon by him. Later found to be infected. See the Draugomyr accounts.' },
];

function ensureSoulsSeed({ scribes, souls }) {
  try {
    const admin = scribes.findByCodename.get(ADMIN_NAME);
    const by = admin ? admin.id : null;
    let added = 0;
    for (const s of SOULS) {
      if (souls.findByName.get(s.name)) continue;
      souls.create.run({ id: uuidv4(), name: s.name, race: s.race, status: s.status, known: s.known, created_by: by });
      added++;
    }
    if (added) console.log(`Seeded Index of Souls: ${added} soul(s) recorded.`);
  } catch (err) {
    console.error('ensureSoulsSeed failed:', err);
  }
}

module.exports = { ensureSoulsSeed };
