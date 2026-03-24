// Daily verse pool — selected by dayOfYear % verses.length
// ref = Spanish book name, refEn = English book name
export const VERSES = [
  {
    ref: "Juan 3:16", refEn: "John 3:16",
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    textEs: "Porque tanto amó Dios al mundo que dio a su Hijo unigénito, para que todo el que crea en él no se pierda, sino que tenga vida eterna."
  },
  {
    ref: "Jeremías 29:11", refEn: "Jeremiah 29:11",
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    textEs: "Porque yo sé muy bien los planes que tengo para ustedes —afirma el Señor—, planes de bienestar y no de calamidad, a fin de darles un futuro y una esperanza."
  },
  {
    ref: "Filipenses 4:13", refEn: "Philippians 4:13",
    text: "I can do all this through him who gives me strength.",
    textEs: "Todo lo puedo en Cristo que me fortalece."
  },
  {
    ref: "Romanos 8:28", refEn: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    textEs: "Ahora bien, sabemos que Dios dispone todas las cosas para el bien de quienes lo aman, los que han sido llamados de acuerdo con su propósito."
  },
  {
    ref: "Proverbios 3:5–6", refEn: "Proverbs 3:5–6",
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    textEs: "Confía en el Señor con todo tu corazón, y no en tu propia inteligencia. Reconócelo en todos tus caminos, y él allanará tus sendas."
  },
  {
    ref: "Isaías 40:31", refEn: "Isaiah 40:31",
    text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    textEs: "Pero los que confían en el Señor renovarán sus fuerzas; volarán como las águilas, correrán y no se fatigarán, caminarán y no se cansarán."
  },
  {
    ref: "Salmo 23:1", refEn: "Psalm 23:1",
    text: "The Lord is my shepherd, I lack nothing.",
    textEs: "El Señor es mi pastor, nada me falta."
  },
  {
    ref: "Mateo 6:33", refEn: "Matthew 6:33",
    text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
    textEs: "Más bien, busquen primeramente el reino de Dios y su justicia, y todas estas cosas les serán añadidas."
  },
  {
    ref: "Gálatas 2:20", refEn: "Galatians 2:20",
    text: "I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me.",
    textEs: "He sido crucificado con Cristo, y ya no vivo yo, sino que Cristo vive en mí. Lo que ahora vivo en el cuerpo, lo vivo por la fe en el Hijo de Dios, quien me amó y dio su vida por mí."
  },
  {
    ref: "Efesios 2:8–9", refEn: "Ephesians 2:8–9",
    text: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.",
    textEs: "Porque por gracia ustedes han sido salvados mediante la fe; esto no procede de ustedes, sino que es el regalo de Dios, no por obras, para que nadie se jacte."
  },
  {
    ref: "2 Timoteo 3:16–17", refEn: "2 Timothy 3:16–17",
    text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.",
    textEs: "Toda la Escritura es inspirada por Dios y útil para enseñar, para reprender, para corregir y para instruir en la justicia, a fin de que el siervo de Dios esté enteramente capacitado para toda buena obra."
  },
  {
    ref: "Isaías 53:5", refEn: "Isaiah 53:5",
    text: "But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed.",
    textEs: "Él fue traspasado por nuestras rebeliones y aplastado por nuestras iniquidades; sobre él recayó el castigo, precio de nuestra paz, y gracias a sus heridas fuimos sanados."
  },
  {
    ref: "Lamentaciones 3:22–23", refEn: "Lamentations 3:22–23",
    text: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    textEs: "El gran amor del Señor nunca se acaba, y su compasión jamás se agota. Cada mañana se renuevan sus bondades; ¡muy grande es su fidelidad!"
  },
  {
    ref: "Josué 1:9", refEn: "Joshua 1:9",
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    textEs: "Ya te lo he ordenado: ¡Sé fuerte y valiente! ¡No tengas miedo ni te desanimes! Porque el Señor tu Dios te acompañará dondequiera que vayas."
  },
  {
    ref: "Salmo 46:1", refEn: "Psalm 46:1",
    text: "God is our refuge and strength, an ever-present help in trouble.",
    textEs: "Dios es nuestro amparo y nuestra fortaleza, nuestra ayuda segura en momentos de angustia."
  },
  {
    ref: "Romanos 8:38–39", refEn: "Romans 8:38–39",
    text: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.",
    textEs: "Pues estoy convencido de que ni la muerte ni la vida, ni los ángeles ni los demonios, ni lo presente ni lo futuro, ni los poderes, ni lo alto ni lo profundo, ni cosa alguna en toda la creación podrá apartarnos del amor que Dios nos ha manifestado en Cristo Jesús nuestro Señor."
  },
  {
    ref: "Mateo 11:28", refEn: "Matthew 11:28",
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
    textEs: "Vengan a mí todos ustedes que están cansados y agobiados, y yo les daré descanso."
  },
  {
    ref: "1 Corintios 13:13", refEn: "1 Corinthians 13:13",
    text: "And now these three remain: faith, hope and love. But the greatest of these is love.",
    textEs: "Ahora, pues, permanecen estas tres virtudes: la fe, la esperanza y el amor. Pero la más excelente de ellas es el amor."
  },
  {
    ref: "Hebreos 11:1", refEn: "Hebrews 11:1",
    text: "Now faith is confidence in what we hope for and assurance about what we do not see.",
    textEs: "Ahora bien, la fe es la garantía de lo que se espera, la certeza de lo que no se ve."
  },
  {
    ref: "Miqueas 6:8", refEn: "Micah 6:8",
    text: "He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",
    textEs: "¡Ya se te ha declarado lo que es bueno! Ya se te ha dicho lo que de ti espera el Señor: practicar la justicia, amar la misericordia y humillarte ante tu Dios."
  },
  {
    ref: "Salmo 119:105", refEn: "Psalm 119:105",
    text: "Your word is a lamp for my feet, a light on my path.",
    textEs: "Tu palabra es una lámpara a mis pies; es una luz en mi sendero."
  },
  {
    ref: "Juan 14:6", refEn: "John 14:6",
    text: "Jesus answered, 'I am the way and the truth and the life. No one comes to the Father except through me.'",
    textEs: "—Yo soy el camino, la verdad y la vida —le contestó Jesús—. Nadie llega al Padre sino por mí."
  },
  {
    ref: "2 Corintios 5:17", refEn: "2 Corinthians 5:17",
    text: "Therefore, if anyone is in Christ, the new creation has come: the old has gone, the new is here!",
    textEs: "Por lo tanto, si alguno está en Cristo, es una nueva creación. ¡Lo viejo ha pasado, ha llegado ya lo nuevo!"
  },
  {
    ref: "Romanos 12:2", refEn: "Romans 12:2",
    text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.",
    textEs: "No se amolden al mundo actual, sino sean transformados mediante la renovación de su mente."
  },
  {
    ref: "Deuteronomio 6:4–5", refEn: "Deuteronomy 6:4–5",
    text: "Hear, O Israel: The Lord our God, the Lord is one. Love the Lord your God with all your heart and with all your soul and with all your strength.",
    textEs: "Escucha, Israel: El Señor nuestro Dios es el único Señor. Ama al Señor tu Dios con todo tu corazón y con toda tu alma y con todas tus fuerzas."
  },
  {
    ref: "Juan 10:10", refEn: "John 10:10",
    text: "The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full.",
    textEs: "El ladrón no viene más que a robar, matar y destruir; yo he venido para que tengan vida, y la tengan en abundancia."
  },
  {
    ref: "Salmo 139:14", refEn: "Psalm 139:14",
    text: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.",
    textEs: "¡Te alabo porque soy una creación admirable! Tus obras son maravillosas, y esto lo sé muy bien."
  },
  {
    ref: "Filipenses 4:6–7", refEn: "Philippians 4:6–7",
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    textEs: "No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias. Y la paz de Dios, que sobrepasa todo entendimiento, cuidará sus corazones y sus pensamientos en Cristo Jesús."
  },
  {
    ref: "Génesis 1:1", refEn: "Genesis 1:1",
    text: "In the beginning God created the heavens and the earth.",
    textEs: "En el principio, Dios creó los cielos y la tierra."
  },
  {
    ref: "Habacuc 2:4", refEn: "Habakkuk 2:4",
    text: "The righteous person will live by his faithfulness.",
    textEs: "El justo vivirá por su fe."
  },
  {
    ref: "Ezequiel 36:26", refEn: "Ezekiel 36:26",
    text: "I will give you a new heart and put a new spirit in you; I will remove from you your heart of stone and give you a heart of flesh.",
    textEs: "Les daré un nuevo corazón, y les infundiré un espíritu nuevo; les quitaré ese corazón de piedra que ahora tienen y les pondré un corazón de carne."
  },
  {
    ref: "Sofonías 3:17", refEn: "Zephaniah 3:17",
    text: "The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.",
    textEs: "El Señor tu Dios está en medio de ti como guerrero victorioso. Se deleitará en ti con gozo, te renovará con su amor, se alegrará por ti con cantos."
  },
  {
    ref: "1 Juan 4:8", refEn: "1 John 4:8",
    text: "Whoever does not love does not know God, because God is love.",
    textEs: "El que no ama no conoce a Dios, porque Dios es amor."
  },
  {
    ref: "Santiago 1:22", refEn: "James 1:22",
    text: "Do not merely listen to the word, and so deceive yourselves. Do what it says.",
    textEs: "No se contenten solo con escuchar la palabra, pues así se engañan ustedes mismos. Llévenla a la práctica."
  },
  {
    ref: "2 Crónicas 7:14", refEn: "2 Chronicles 7:14",
    text: "If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land.",
    textEs: "Si mi pueblo, que lleva mi nombre, se humilla y ora, y me busca y abandona su mala conducta, yo lo escucharé desde el cielo, perdonaré su pecado y restauraré su tierra."
  },
  {
    ref: "Proverbios 31:25", refEn: "Proverbs 31:25",
    text: "She is clothed with strength and dignity; she can laugh at the days to come.",
    textEs: "Se reviste de fuerza y dignidad, y afronta segura el porvenir."
  },
  {
    ref: "Colosenses 3:17", refEn: "Colossians 3:17",
    text: "And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.",
    textEs: "Y todo lo que hagan, de palabra o de obra, háganlo en el nombre del Señor Jesús, dando gracias a Dios el Padre por medio de él."
  },
  {
    ref: "Hechos 1:8", refEn: "Acts 1:8",
    text: "But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.",
    textEs: "Pero cuando venga el Espíritu Santo sobre ustedes, recibirán poder y serán mis testigos tanto en Jerusalén como en toda Judea y Samaria, y hasta los confines de la tierra."
  },
  {
    ref: "Rut 1:16", refEn: "Ruth 1:16",
    text: "Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God.",
    textEs: "A donde tú vayas, yo iré; donde tú vivas, viviré. Tu pueblo será mi pueblo y tu Dios será mi Dios."
  },
  {
    ref: "Ester 4:14", refEn: "Esther 4:14",
    text: "And who knows but that you have come to your royal position for such a time as this?",
    textEs: "¿Y quién sabe si no llegaste a ser reina precisamente para un momento como este?"
  },
  {
    ref: "Job 19:25", refEn: "Job 19:25",
    text: "I know that my redeemer lives, and that in the end he will stand on the earth.",
    textEs: "Yo sé que mi Redentor vive, y que al final triunfará sobre la muerte."
  },
  {
    ref: "Daniel 3:17–18", refEn: "Daniel 3:17–18",
    text: "If we are thrown into the blazing furnace, the God we serve is able to deliver us from it, and he will deliver us. But even if he does not, we want you to know, Your Majesty, that we will not serve your gods.",
    textEs: "Si se nos arroja al horno en llamas, el Dios al que servimos puede librarnos del horno y de las manos de Su Majestad. Pero aun si nuestro Dios no lo hace así, sepa usted que no honraremos a sus dioses."
  },
  {
    ref: "1 Pedro 5:7", refEn: "1 Peter 5:7",
    text: "Cast all your anxiety on him because he cares for you.",
    textEs: "Depositen en él toda ansiedad, porque él cuida de ustedes."
  },
  {
    ref: "Nehemías 8:10", refEn: "Nehemiah 8:10",
    text: "Do not grieve, for the joy of the Lord is your strength.",
    textEs: "No estén tristes, pues el gozo del Señor es su fortaleza."
  },
  {
    ref: "Salmo 37:4", refEn: "Psalm 37:4",
    text: "Take delight in the Lord, and he will give you the desires of your heart.",
    textEs: "Deléitate en el Señor, y él te concederá los deseos de tu corazón."
  },
  {
    ref: "Isaías 41:10", refEn: "Isaiah 41:10",
    text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
    textEs: "Así que no temas, porque yo estoy contigo; no te angusties, porque yo soy tu Dios. Te fortaleceré y te ayudaré; te sostendré con mi diestra victoriosa."
  },
  {
    ref: "Mateo 5:14", refEn: "Matthew 5:14",
    text: "You are the light of the world. A town built on a hill cannot be hidden.",
    textEs: "Ustedes son la luz del mundo. Una ciudad en lo alto de una colina no puede esconderse."
  },
  {
    ref: "Juan 15:5", refEn: "John 15:5",
    text: "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.",
    textEs: "Yo soy la vid y ustedes son las ramas. El que permanece en mí, como yo en él, dará mucho fruto; separados de mí no pueden ustedes hacer nada."
  },
  {
    ref: "Apocalipsis 21:4", refEn: "Revelation 21:4",
    text: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.",
    textEs: "Él les enjugará toda lágrima de los ojos. Ya no habrá muerte, ni llanto, ni lamento ni dolor, porque las primeras cosas han dejado de existir."
  },
  {
    ref: "Romanos 5:8", refEn: "Romans 5:8",
    text: "But God demonstrates his own love for us in this: while we were still sinners, Christ died for us.",
    textEs: "Pero Dios demuestra su amor por nosotros en esto: en que cuando todavía éramos pecadores, Cristo murió por nosotros."
  },
  {
    ref: "Salmo 34:8", refEn: "Psalm 34:8",
    text: "Taste and see that the Lord is good; blessed is the one who takes refuge in him.",
    textEs: "Prueben y vean que el Señor es bueno; dichosos los que en él se refugian."
  },
  {
    ref: "Amós 5:24", refEn: "Amos 5:24",
    text: "But let justice roll on like a river, righteousness like a never-failing stream!",
    textEs: "Pero que fluya el derecho como las aguas, y la justicia como arroyo inagotable."
  },
  {
    ref: "2 Pedro 3:9", refEn: "2 Peter 3:9",
    text: "The Lord is not slow in keeping his promise, as some understand slowness. Instead he is patient with you, not wanting anyone to perish, but everyone to come to repentance.",
    textEs: "El Señor no tarda en cumplir su promesa, según entienden algunos la tardanza. Más bien, él tiene paciencia con ustedes, porque no quiere que nadie perezca, sino que todos se arrepientan."
  },
  {
    ref: "Marcos 10:45", refEn: "Mark 10:45",
    text: "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.",
    textEs: "Porque ni aun el Hijo del Hombre vino para que le sirvan, sino para servir y para dar su vida en rescate por muchos."
  },
  {
    ref: "Lucas 19:10", refEn: "Luke 19:10",
    text: "For the Son of Man came to seek and to save the lost.",
    textEs: "Porque el Hijo del Hombre vino a buscar y a salvar lo que se había perdido."
  },
  {
    ref: "Hebreos 4:12", refEn: "Hebrews 4:12",
    text: "For the word of God is alive and active. Sharper than any double-edged sword, it penetrates even to dividing soul and spirit, joints and marrow; it judges the thoughts and attitudes of the heart.",
    textEs: "Ciertamente, la palabra de Dios es viva y poderosa, y más cortante que cualquier espada de dos filos. Penetra hasta lo más profundo del alma y del espíritu, hasta la médula de los huesos, y juzga los pensamientos y las intenciones del corazón."
  },
  {
    ref: "1 Tesalonicenses 5:16–18", refEn: "1 Thessalonians 5:16–18",
    text: "Rejoice always, pray continually, give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    textEs: "Estén siempre alegres, oren sin cesar, den gracias a Dios en toda situación, porque esta es su voluntad para ustedes en Cristo Jesús."
  },
  {
    ref: "Joel 2:28", refEn: "Joel 2:28",
    text: "And afterward, I will pour out my Spirit on all people. Your sons and daughters will prophesy, your old men will dream dreams, your young men will see visions.",
    textEs: "Después de esto, derramaré mi Espíritu sobre todo el género humano. Los hijos e hijas de ustedes profetizarán, tendrán sueños los ancianos y visiones los jóvenes."
  },
  {
    ref: "Zacarías 4:6", refEn: "Zechariah 4:6",
    text: "Not by might nor by power, but by my Spirit, says the Lord Almighty.",
    textEs: "No será por la fuerza ni por ningún poder, sino por mi Espíritu —dice el Señor Todopoderoso."
  },
  {
    ref: "Mateo 28:19–20", refEn: "Matthew 28:19–20",
    text: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you.",
    textEs: "Por tanto, vayan y hagan discípulos de todas las naciones, bautizándolos en el nombre del Padre y del Hijo y del Espíritu Santo, enseñándoles a obedecer todo lo que les he mandado a ustedes."
  },
  {
    ref: "Salmo 103:12", refEn: "Psalm 103:12",
    text: "As far as the east is from the west, so far has he removed our transgressions from us.",
    textEs: "Tan lejos de nosotros echó nuestras transgresiones como lejos del oriente está el occidente."
  },
  {
    ref: "Isaías 9:6", refEn: "Isaiah 9:6",
    text: "For to us a child is born, to us a son is given, and the government will be on his shoulders. And he will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.",
    textEs: "Porque nos ha nacido un niño, se nos ha concedido un hijo; la soberanía reposará en sus hombros, y se le darán estos nombres: Consejero admirable, Dios fuerte, Padre eterno, Príncipe de paz."
  },
  {
    ref: "Romanos 10:9", refEn: "Romans 10:9",
    text: "If you declare with your mouth, 'Jesus is Lord,' and believe in your heart that God raised him from the dead, you will be saved.",
    textEs: "Si confiesas con tu boca que Jesús es el Señor y crees en tu corazón que Dios lo levantó de entre los muertos, serás salvo."
  },
  {
    ref: "Judas 1:3", refEn: "Jude 1:3",
    text: "Contend for the faith that was once for all entrusted to God's holy people.",
    textEs: "Contiendan ardientemente por la fe encomendada una vez por todas a los santos."
  },
  {
    ref: "Malaquías 3:10", refEn: "Malachi 3:10",
    text: "Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this, says the Lord Almighty, and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it.",
    textEs: "Traigan íntegro el diezmo para los fondos del templo, y así habrá alimento en mi casa. Pruébenme en esto —dice el Señor Todopoderoso— y vean si no abro las compuertas del cielo y derramo sobre ustedes bendición hasta que sobreabunde."
  },
  {
    ref: "Salmo 1:1–2", refEn: "Psalm 1:1–2",
    text: "Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers, but whose delight is in the law of the Lord, and who meditates on his law day and night.",
    textEs: "Dichoso el hombre que no sigue el consejo de los malvados, ni se detiene en la senda de los pecadores ni cultiva la amistad de los blasfemos, sino que en la ley del Señor se deleita, y día y noche medita en ella."
  },
  {
    ref: "2 Corintios 12:9", refEn: "2 Corinthians 12:9",
    text: "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Therefore I will boast all the more gladly about my weaknesses, so that Christ's power may rest on me.",
    textEs: "Pero él me dijo: «Te basta con mi gracia, pues mi poder se perfecciona en la debilidad». Por lo tanto, gustosamente haré más bien alarde de mis debilidades, para que permanezca sobre mí el poder de Cristo."
  },
  {
    ref: "Éxodo 14:14", refEn: "Exodus 14:14",
    text: "The Lord will fight for you; you need only to be still.",
    textEs: "El Señor peleará por ustedes, y ustedes se quedarán tranquilos."
  },
];

// Returns today's verse deterministically (rotates daily)
export function getDailyVerse() {
  const start = new Date(2024, 0, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((today - start) / 86400000);
  return VERSES[dayIndex % VERSES.length];
}
