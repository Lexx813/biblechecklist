-- Seed public community notes in Spanish.
-- Inserts notes under the alexx813@gmail.com account.
-- Safe to re-run — skips any note whose title already exists as a public note.

DO $$
DECLARE
  v_user_id uuid;
BEGIN

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'alexx813@gmail.com' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User alexx813@gmail.com not found.';
  END IF;

  -- 1
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'La paciencia de Job',
    '<p>Lo que me impresionó al releer Job es que nunca maldijo a Dios — cuestionó, sufrió, pero se mantuvo firme. Job 1:21 lo resume: "Jehová mismo dio y Jehová mismo ha quitado. Que el nombre de Jehová siga siendo bendecido." Un recordatorio de que la fe no es la ausencia de dolor.</p>',
    ARRAY['fe','sufrimiento','esperanza'],
    17, 1, '21', true, 11,
    'es', NOW() - INTERVAL '10 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'La paciencia de Job' AND is_public = true);

  -- 2
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Proverbios sobre las palabras',
    '<p>Proverbios tiene mucho que decir sobre el habla. "La lengua de los sabios hace bueno el conocimiento, pero la boca de los tontos borbotea tontería" (15:2). He estado haciendo una nota mental antes de responder cuando me siento frustrado: ¿esto edifica o destruye?</p>',
    ARRAY['sabiduría','habla','proverbios'],
    19, 15, '2', true, 8,
    'es', NOW() - INTERVAL '12 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Proverbios sobre las palabras' AND is_public = true);

  -- 3
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Isaías y la restauración',
    '<p>Isaías 40:28-31 nunca deja de inspirar. La imagen de "remontarse con alas como las águilas" es tan vívida. Lo que aprecio es el contexto: viene justo después de que Dios pregunta "¿No lo sabes? ¿No lo has oído?" — una corrección amable de que el agotamiento no significa abandono.</p>',
    ARRAY['profecía','consuelo','fortaleza'],
    22, 40, '28-31', true, 18,
    'es', NOW() - INTERVAL '15 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Isaías y la restauración' AND is_public = true);

  -- 4
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'El sermón del monte — las bienaventuranzas',
    '<p>Mateo 5 abre con cualidades que parecen al revés para el mundo: los mansos, los que lloran, los misericordiosos. Estudiar el griego detrás de "manso" (praus) fue revelador — describe un caballo poderoso pero entrenado. La mansedumbre no es debilidad, es fuerza bajo control.</p>',
    ARRAY['sermón-del-monte','bienaventuranzas','carácter'],
    39, 5, '3-12', true, 25,
    'es', NOW() - INTERVAL '20 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'El sermón del monte — las bienaventuranzas' AND is_public = true);

  -- 5
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Salmo 23 — más que un versículo funeral',
    '<p>Citamos el Salmo 23 en funerales, pero realmente habla de provisión en tiempo presente. "Me hace recostar en verdes praderas" — las ovejas solo se recuestan cuando se sienten seguras. Es una imagen de descanso que tiene que ser dado, no logrado. Sigo reflexionando en eso.</p>',
    ARRAY['salmos','confianza','consuelo'],
    18, 23, NULL, true, 22,
    'es', NOW() - INTERVAL '5 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Salmo 23 — más que un versículo funeral' AND is_public = true);

  -- 6
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Romanos 8 — ninguna condenación',
    '<p>Romanos 8:1 es uno de los versículos más liberadores de toda la Escritura: "Por lo tanto, los que están en unión con Cristo Jesús no tienen ninguna condenación." Pablo pasa el resto del capítulo explicando por qué — el espíritu, la adopción, la intercesión y el amor inquebrantable de Dios. Sigo volviendo al versículo 38: nada nos puede separar.</p>',
    ARRAY['romanos','gracia','seguridad'],
    44, 8, '1', true, 33,
    'es', NOW() - INTERVAL '8 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Romanos 8 — ninguna condenación' AND is_public = true);

  -- 7
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Juan 11 — el versículo más corto',
    '<p>"Jesús lloró" (Juan 11:35) es famoso por ser el versículo más corto, pero el contexto lo hace profundo. Jesús ya sabía que iba a resucitar a Lázaro. Lloró de todas formas. No por desesperación sino por compasión — entró en el dolor de los que amaba. Ese es el tipo de Dios al que vale la pena servir.</p>',
    ARRAY['juan','compasión','resurrección'],
    42, 11, '35', true, 29,
    'es', NOW() - INTERVAL '13 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Juan 11 — el versículo más corto' AND is_public = true);

  -- 8
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Filipenses 4:6-7 — la paz que sobrepasa',
    '<p>"No se inquieten por nada, sino que en todo, mediante oración y ruego junto con acción de gracias, den a conocer sus peticiones a Dios; y la paz de Dios que sobrepasa a todo entendimiento guardará sus corazones y sus facultades mentales." He orado este versículo muchas veces. La paz no es la eliminación del problema — es la guardia puesta sobre tu corazón mientras el problema continúa.</p>',
    ARRAY['filipenses','ansiedad','oración','paz'],
    49, 4, '6-7', true, 40,
    'es', NOW() - INTERVAL '2 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Filipenses 4:6-7 — la paz que sobrepasa' AND is_public = true);

  -- 9
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Lucas 15 — tres parábolas, un solo punto',
    '<p>La oveja perdida, la moneda perdida, el hijo pródigo — son la misma historia a diferentes escalas. Lo que noté: en cada caso, el que perdió algo sale a buscarlo. La oveja no puede encontrarse sola. La moneda no puede encontrarse sola. Y el hijo vuelve a un padre que ya lo estaba esperando. La iniciativa siempre es del que ama.</p>',
    ARRAY['lucas','parábolas','gracia'],
    41, 15, NULL, true, 35,
    'es', NOW() - INTERVAL '22 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Lucas 15 — tres parábolas, un solo punto' AND is_public = true);

  -- 10
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Hebreos 11 — el capítulo de la fe',
    '<p>Hebreos 11 se llama a veces el "capítulo de la fe" porque lista ejemplo tras ejemplo de hombres y mujeres que actuaron por fe antes de ver el resultado. Lo que me impactó es el versículo 13: "En fe murieron todos estos, aunque no recibieron el cumplimiento de las promesas." Su fe no dependía del resultado.</p>',
    ARRAY['hebreos','fe','ejemplos'],
    57, 11, '1', true, 20,
    'es', NOW() - INTERVAL '3 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Hebreos 11 — el capítulo de la fe' AND is_public = true);

  -- 11
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    'Daniel en Babilonia — sin compromisos',
    '<p>Daniel 1 establece el tono de todo el libro: cuatro jóvenes en un imperio extranjero, a quienes se les ofrece la comida del rey, y ellos con calma piden una alternativa. Sin protesta dramática — solo un límite claro y respetuoso. Su fidelidad en las cosas pequeñas precedió su fidelidad en las grandes.</p>',
    ARRAY['daniel','integridad','fidelidad'],
    26, 1, NULL, true, 13,
    'es', NOW() - INTERVAL '16 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Daniel en Babilonia — sin compromisos' AND is_public = true);

  -- 12
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, lang, updated_at)
  SELECT v_user_id,
    '1 Corintios 13 — el amor es un verbo',
    '<p>El capítulo del amor se lee a menudo en bodas, pero Pablo lo escribió a una congregación destrozada por los celos y el orgullo. Cada cualidad enumerada — paciente, bondadoso, no celoso, no jactancioso — es una corrección a algo que realmente estaban haciendo. Es menos un poema sobre el amor y más un espejo puesto frente a su comportamiento.</p>',
    ARRAY['corintios','amor','congregación'],
    45, 13, NULL, true, 30,
    'es', NOW() - INTERVAL '4 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = '1 Corintios 13 — el amor es un verbo' AND is_public = true);

END $$;
