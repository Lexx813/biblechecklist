#!/usr/bin/env node
// Seed the Spanish "Agua y Vegetales" (Daniel) song.
//
// Mirrors seed-songs.mjs but targets the ES vault folder and writes
// the bilingual columns (title_es, description_es, lyrics_es,
// primary_scripture_text_es) in addition to the EN columns. EN columns
// hold an English translation so the song still renders for /songs.
//
// Usage:
//   node --env-file=.env.local scripts/seed-agua-y-vegetales.mjs            # dry run
//   node --env-file=.env.local scripts/seed-agua-y-vegetales.mjs --publish  # actual upload + upsert
//
// Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const VAULT_MD = "/mnt/c/Users/alexi/OneDrive/jwstudy-vault/songs/es/Agua y Vegetales.md";
const VAULT_MP3 = "/mnt/c/Users/alexi/OneDrive/jwstudy-vault/songs/es/Agua y Vegetales.mp3";

const PUBLISH = process.argv.includes("--publish");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (PUBLISH && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const SLUG = "agua-y-vegetales";
const STORAGE_PATH = `${SLUG}/audio.mp3`;

const META = {
  slug: SLUG,
  title: "Water and Vegetables (The Faithfulness of Daniel)",
  title_es: "Agua y Vegetales",
  duration_seconds: 270,
  primary_scripture_ref: "Daniel 6:22",
  primary_scripture_text:
    "My God sent his angel and shut the mouth of the lions, and they have not harmed me, for I was found innocent before him; nor have I done any wrong to you, O king.",
  primary_scripture_text_es:
    "Mi Dios envió a su ángel y cerró la boca de los leones, y estos no me hicieron ningún daño, ya que delante de él fui hallado inocente; y tampoco he hecho ningún mal contra ti, oh rey.",
  theme: "lealtad",
  description:
    "A Spanish-language rap-bachata fusion telling the life of Daniel — from the diet decision in Babylon (Daniel 1:8 \"agua y vegetales\") through the fiery furnace, the writing on the wall, and the lions' den (Daniel 6). Built on the chorus \"Daniel, fiel hasta el final\" — better poor with God than rich without truth. Closes on Daniel 12:13 — the resurrection promise.",
  description_es:
    "Una fusión de rap y bachata en español que cuenta la vida de Daniel — desde la decisión en Babilonia (Daniel 1:8 \"agua y vegetales\"), pasando por el horno ardiente, la escritura en la pared y el foso de los leones (Daniel 6). Construida sobre el coro \"Daniel, fiel hasta el final\" — mejor pobre con Dios, que rico sin verdad. Termina con Daniel 12:13 — la promesa de la resurrección.",
  cover_image_url: null, // upload later via admin → SongEditModal cover field
  jw_org_links: [
    { url: "https://www.jw.org/es/biblioteca/biblia/nwt/libros/daniel/1/", anchor: "Lee Daniel 1 (TNM) — Daniel decide ser fiel" },
    { url: "https://www.jw.org/es/biblioteca/biblia/nwt/libros/daniel/3/", anchor: "Lee Daniel 3 (TNM) — el horno ardiente" },
    { url: "https://www.jw.org/es/biblioteca/biblia/nwt/libros/daniel/6/", anchor: "Lee Daniel 6 (TNM) — el foso de los leones" },
    { url: "https://www.jw.org/es/biblioteca/biblia/nwt/libros/daniel/12/", anchor: "Lee Daniel 12 (TNM) — la promesa de la resurrección" },
    { url: "https://hub.jw.org/request-visit?wtlocale=S", anchor: "Solicita una visita gratuita" },
  ],
};

// Lyrics JSON — Spanish content, mirrors the section structure in the vault MD.
const LYRICS = {
  sections: [
    { type: "intro", label: "Intro", note: "guitarra suave, voz hablada", lines: [
      "Daniel...",
      "Setenta años en Babilonia",
      "Una sola lealtad",
      "Esta es su historia, mi amor por Jehová",
      "Escucha...",
    ] },
    { type: "verse", label: "Verso 1", note: "rapeado suave, pausado", lines: [
      "Era un joven de Judá, llevado al exilio",
      "Babilonia lo arrancó de su pueblo y su asilo",
      "Le cambiaron el nombre, le ofrecieron la corona",
      "Comida del rey, vino del rey, todo en su zona",
      "",
      "Pero Daniel decidió en su corazón ser fiel",
      "\"No me voy a profanar,\" dijo con voz de miel",
      "\"Dame agua y vegetales por solo diez días\"",
      "Y Jehová lo bendijo con sabiduría",
    ] },
    { type: "pre-chorus", label: "Pre-Coro", note: "sung, suave, building", lines: [
      "Cuando todo a tu alrededor te dice que cedas",
      "Cuando el mundo te ofrece todas sus monedas",
      "Recuerda a Daniel, recuerda su lealtad",
      "Mejor pobre con Dios, que rico sin verdad",
    ] },
    { type: "chorus", label: "Coro", note: "cantado, melódico, con armonías de bachata", lines: [
      "Daniel, fiel hasta el final",
      "Daniel, en lo bueno y en el mal",
      "Cuatro reyes lo vieron orar",
      "Pero su Dios lo supo guardar",
      "",
      "Daniel, Daniel, mi corazón",
      "Aprende de él esta lección",
      "Aunque te cueste, aunque duela",
      "Sé fiel a Jehová, esa es la escuela",
    ] },
    { type: "verse", label: "Verso 2", note: "rapeado", lines: [
      "Nabucodonosor soñó una imagen brillante",
      "Cabeza de oro, plata, cobre adelante",
      "Nadie podía interpretar el sueño del rey",
      "Pero Daniel lo hizo, gloria a Jehová, esa es la ley",
      "",
      "Después vino la imagen, sesenta codos al cielo",
      "\"Cuando suene la música, todos al suelo\"",
      "Pero tres jóvenes hebreos no se inclinaron",
      "Sadrac, Mesac, Abed-nego, fieles se quedaron",
      "",
      "El horno siete veces más caliente prendieron",
      "Pero adentro caminaban con un cuarto, lo vieron",
      "Como un hijo de los dioses, sin un solo cabello quemado",
      "Salieron del fuego, Jehová los había rescatado",
    ] },
    { type: "pre-chorus", label: "Pre-Coro", note: "sung, suave, building", lines: [
      "Cuando todo a tu alrededor te dice que cedas",
      "Cuando el mundo te ofrece todas sus monedas",
      "Recuerda a Daniel, recuerda su lealtad",
      "Mejor pobre con Dios, que rico sin verdad",
    ] },
    { type: "chorus", label: "Coro", note: "cantado, melódico, con armonías de bachata", lines: [
      "Daniel, fiel hasta el final",
      "Daniel, en lo bueno y en el mal",
      "Cuatro reyes lo vieron orar",
      "Pero su Dios lo supo guardar",
      "",
      "Daniel, Daniel, mi corazón",
      "Aprende de él esta lección",
      "Aunque te cueste, aunque duela",
      "Sé fiel a Jehová, esa es la escuela",
    ] },
    { type: "verse", label: "Verso 3", note: "rapeado, dramático pero suave", lines: [
      "Belsasar dio una fiesta usando las copas santas",
      "Apareció una mano, escribió palabras tantas",
      "\"Mene, Mene, Tekel, Parsin,\" nadie podía leer",
      "Solo Daniel sabía lo que iba a suceder",
      "",
      "\"Tu reino fue contado, terminado quedó",
      "Pesado en la balanza, deficiente sonó\"",
      "Esa misma noche, Babilonia cayó",
      "Darío el medo entró, nuevo capítulo se escribió",
      "",
      "Los gobernadores envidiosos buscaron acusarlo",
      "Pero en Daniel no encontraron nada para condenarlo",
      "\"Hagamos una ley: solo al rey se le puede orar",
      "O al foso de leones lo vamos a echar\"",
      "",
      "Daniel lo supo y siguió su rutina",
      "Tres veces al día, ventana a Jerusalén divina",
      "De rodillas, sin esconderse, sin temor",
      "Lo encontraron orando al Creador",
    ] },
    { type: "bridge", label: "Bridge", note: "suave, romántico, casi prayer", lines: [
      "Darío lo amaba, trató de salvarlo",
      "Pero la ley de los medos no podía cambiarlo",
      "\"Tu Dios al que sirves siempre, Él te librará\"",
      "Le dijo con lágrimas mientras al foso lo verá",
      "",
      "Esa noche el rey no pudo dormir, no pudo comer",
      "Al amanecer corrió, \"Daniel, ¿pudo Él vencer?\"",
      "\"Oh rey, vive para siempre, mi Dios envió su ángel",
      "Cerró las bocas de los leones, soy libre, soy ángel\"",
    ] },
    { type: "final-chorus", label: "Coro Final", note: "más grande, todas las armonías", lines: [
      "Daniel, fiel hasta el final",
      "Daniel, en lo bueno y en el mal",
      "Cuatro reyes lo vieron orar",
      "Pero su Dios lo supo guardar",
      "",
      "Daniel, Daniel, mi corazón",
      "Aprende de él esta lección",
      "Aunque te cueste, aunque duela",
      "Sé fiel a Jehová, esa es la escuela",
    ] },
    { type: "outro", label: "Outro", note: "suave, guitarra solo, voz íntima", lines: [
      "Daniel doce trece dice",
      "\"Tú anda hasta el fin, descansarás",
      "Y te levantarás para tu suerte",
      "Al fin de los días, vivirás\"",
      "",
      "Daniel resucitará en la tierra",
      "Caminará con nosotros otra vez",
      "La fidelidad nunca se pierde",
      "Cuando Jehová es tu Rey",
      "",
      "Daniel, fiel hasta el final...",
      "Mi amor por Jehová, igual...",
      "Selah...",
    ] },
  ],
};

async function main() {
  console.log(`${PUBLISH ? "[PUBLISH]" : "[DRY RUN]"} agua-y-vegetales`);
  console.log(`  audio: ${VAULT_MP3}`);
  console.log(`  md:    ${VAULT_MD}`);
  console.log(`  sections: ${LYRICS.sections.length} (${LYRICS.sections.map((s) => s.label).join(" · ")})`);

  if (!PUBLISH) {
    console.log("\n(dry run — pass --publish to upload audio + upsert DB row)");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Upload audio
  const bytes = readFileSync(VAULT_MP3);
  console.log(`  uploading audio (${(bytes.length / 1024 / 1024).toFixed(2)} MB) → songs/${STORAGE_PATH}`);
  const { error: upErr } = await supabase.storage
    .from("songs")
    .upload(STORAGE_PATH, bytes, { contentType: "audio/mpeg", cacheControl: "3600", upsert: true });
  if (upErr) throw new Error(`audio upload failed: ${upErr.message}`);
  console.log(`  ✓ audio uploaded`);

  // 2. Upsert row
  const row = {
    slug: META.slug,
    title: META.title,
    title_es: META.title_es,
    audio_url: STORAGE_PATH,
    duration_seconds: META.duration_seconds,
    primary_scripture_ref: META.primary_scripture_ref,
    primary_scripture_text: META.primary_scripture_text,
    primary_scripture_text_es: META.primary_scripture_text_es,
    theme: META.theme,
    lyrics: LYRICS,
    lyrics_es: LYRICS,
    description: META.description,
    description_es: META.description_es,
    jw_org_links: META.jw_org_links,
    cover_image_url: META.cover_image_url,
    published: true,
  };

  const { error: dbErr } = await supabase.from("songs").upsert(row, { onConflict: "slug" });
  if (dbErr) throw new Error(`upsert failed: ${dbErr.message}`);
  console.log(`  ✓ row upserted`);
  console.log(`\nLive at: https://jwstudy.org/songs/${META.slug}`);
  console.log(`Spanish: https://jwstudy.org/es/songs/${META.slug}`);
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
