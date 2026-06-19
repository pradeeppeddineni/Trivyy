-- Deterministic question fixture for CI (E2E + manual checks). Inserts ~12
-- questions across the six curated categories and all difficulties so the solo
-- flow can run without calling the live OpenTDB API. Categories are created by
-- the migration; we resolve category_id by slug here.
INSERT INTO questions (text, correct_answer, incorrect_answers, category, category_id, difficulty, source, status)
SELECT v.text, v.correct, v.wrong, v.slug, c.id, v.difficulty, 'fixture', 'active'
FROM (
  VALUES
    ('What is the chemical symbol for water?', 'H2O', ARRAY['CO2','O2','HO'], 'science', 'easy'),
    ('The speed of light is roughly?', '300,000 km/s', ARRAY['150,000 km/s','1,000 km/s','30 km/s'], 'science', 'medium'),
    ('What is the capital of France?', 'Paris', ARRAY['Lyon','Nice','Marseille'], 'geography', 'easy'),
    ('Which is the largest ocean?', 'Pacific', ARRAY['Atlantic','Indian','Arctic'], 'geography', 'medium'),
    ('Who directed the film Jaws?', 'Steven Spielberg', ARRAY['George Lucas','Martin Scorsese','James Cameron'], 'movies', 'hard'),
    ('In what year was Toy Story released?', '1995', ARRAY['1999','2001','1990'], 'movies', 'medium'),
    ('How many strings does a standard guitar have?', '6', ARRAY['4','5','7'], 'music', 'easy'),
    ('How many symphonies did Beethoven complete?', '9', ARRAY['5','7','12'], 'music', 'hard'),
    ('Who was the first US president?', 'George Washington', ARRAY['Abraham Lincoln','John Adams','Thomas Jefferson'], 'history', 'easy'),
    ('In what year did World War II end?', '1945', ARRAY['1939','1918','1950'], 'history', 'medium'),
    ('What does CPU stand for?', 'Central Processing Unit', ARRAY['Computer Personal Unit','Central Power Unit','Core Processing Unit'], 'tech', 'easy'),
    ('Who co-founded Apple with Steve Wozniak?', 'Steve Jobs', ARRAY['Bill Gates','Larry Page','Elon Musk'], 'tech', 'medium')
) AS v(text, correct, wrong, slug, difficulty)
JOIN categories c ON c.slug = v.slug;
