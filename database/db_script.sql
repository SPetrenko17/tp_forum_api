CREATE EXTENSION IF NOT EXISTS CITEXT;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS forums CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS forum_users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL UNIQUE,
  nickname CITEXT         NOT NULL PRIMARY KEY,
  email    CITEXT         NOT NULL UNIQUE,
  fullname CITEXT         NOT NULL,
  about    TEXT           NOT NULL
);

CREATE UNIQUE INDEX idx_users_nickname ON users(nickname COLLATE "C");
CLUSTER users USING idx_users_nickname;


CREATE TABLE IF NOT EXISTS forums (
  id      SERIAL,
  slug    CITEXT PRIMARY KEY,
  posts   INT    NOT NULL DEFAULT 0,
  threads INT       NOT NULL DEFAULT 0,
  title   TEXT      NOT NULL,
  "user"  CITEXT      NOT NULL
);

-- CREATE UNIQUE INDEX idx_forums_slug ON forums(slug);
-- CLUSTER forums USING idx_forums_slug;

CREATE UNIQUE INDEX idx_forums_id ON forums(id);
CLUSTER forums USING idx_forums_id;

CREATE TABLE IF NOT EXISTS threads (
  id         SERIAL PRIMARY KEY ,
  author    CITEXT        NOT NULL REFERENCES users(nickname),
  created   TIMESTAMPTZ DEFAULT now(),
  forum     CITEXT        NOT NULL REFERENCES forums(slug),
  message   TEXT        NOT NULL,
  slug      CITEXT      UNIQUE,
  title     TEXT        NOT NULL,
  votes     INT         NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_thread_id ON threads(id);
CREATE INDEX idx_threads_created ON threads(created);
CREATE INDEX idx_threads_slug_id ON threads(slug, id);
CREATE INDEX idx_threads_id_slug ON threads(id, slug);
CREATE INDEX idx_threads_forum_created ON threads(forum, created);

CLUSTER threads USING idx_threads_forum_created;

CREATE OR REPLACE FUNCTION threads_forum_counter()
  RETURNS TRIGGER AS $threads_forum_counter$
    BEGIN
      UPDATE forums
        SET threads = threads + 1
          WHERE slug = NEW.forum;
      RETURN NULL;
    END;
$threads_forum_counter$  LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS threads_forum_counter ON threads;
CREATE TRIGGER threads_forum_counter AFTER INSERT ON threads FOR EACH ROW EXECUTE PROCEDURE threads_forum_counter();


CREATE TABLE posts (
  id SERIAL PRIMARY KEY ,
  path INTEGER[],
  author CITEXT NOT NULL REFERENCES users(nickname),
  created TIMESTAMPTZ DEFAULT now(),
  edited BOOLEAN,
  message TEXT,
  parent_id INTEGER,
  forum_slug CITEXT NOT NULL,
  thread_id INTEGER NOT NULL
);

CREATE INDEX idx_post_threadID_created_id ON posts(thread_id, created, id);
CREATE INDEX idx_post_threadID_path ON posts(thread_id, path);
CREATE INDEX idx_posts_threadID_root_path ON posts (thread_id, (path[1]), path);
CREATE INDEX idx_post_threadID_id_parentNull_id ON posts(thread_id, id) WHERE parent_id IS NULL;
CREATE INDEX idx_posts_id ON posts (id);
CREATE INDEX idx_posts_id_full ON posts (id, parent_id, thread_id , message, edited, created, forum_slug, author) ;
CREATE INDEX idx_post_threadID_ID_parentID ON posts(thread_id, id, parent_id);


CREATE TABLE forum_users (
    user_id INT REFERENCES users(id),
    forum_slug CITEXT NOT NULL,
    username CITEXT NOT NULL
);


CREATE UNIQUE INDEX idx_forum_users_slug ON forum_users(forum_slug, username COLLATE "C");
CLUSTER forum_users USING idx_forum_users_slug;



CREATE OR REPLACE FUNCTION set_edited() RETURNS TRIGGER AS $set_edited$
    BEGIN
      IF (NEW.message = OLD.message)
        THEN RETURN NULL;
      END IF;
        UPDATE posts SET edited = TRUE
          WHERE id=NEW.id;
        RETURN NULL;
    END;
  $set_edited$  LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_edited ON posts;
CREATE TRIGGER set_edited AFTER UPDATE ON posts FOR EACH ROW EXECUTE PROCEDURE set_edited();



CREATE OR REPLACE FUNCTION check_edited(pid INT, message TEXT)
  RETURNS BOOLEAN AS $check_edited$
    BEGIN
      IF ((SELECT posts.message FROM posts WHERE id=pid) = message)
        THEN RETURN FALSE;
      END IF;
        RETURN TRUE;
    END;
  $check_edited$ LANGUAGE plpgsql;



CREATE TABLE IF NOT EXISTS votes (
  user_id   CITEXT REFERENCES users(nickname)   NOT NULL,
  thread_id INT REFERENCES threads(id)          NOT NULL,
  voice     INT                                 NOT NULL
);

ALTER TABLE ONLY votes ADD CONSTRAINT votes_user_thread_unique UNIQUE (user_id, thread_id);

CLUSTER votes USING votes_user_thread_unique;



CREATE OR REPLACE FUNCTION vote_insert()
  RETURNS TRIGGER AS $vote_insert$
    BEGIN
        UPDATE threads
        SET votes = votes + NEW.voice
        WHERE id = NEW.thread_id;
        RETURN NULL;
    END;
$vote_insert$  LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vote_insert ON votes;
CREATE TRIGGER vote_insert AFTER INSERT ON votes FOR EACH ROW EXECUTE PROCEDURE vote_insert();



CREATE OR REPLACE FUNCTION vote_update() RETURNS TRIGGER AS $vote_update$
BEGIN
  IF OLD.voice = NEW.voice
  THEN
    RETURN NULL;
  END IF;
  UPDATE threads
  SET
    votes = votes + CASE WHEN NEW.voice = -1
      THEN -2
        ELSE 2 END
  WHERE id = NEW.thread_id;
  RETURN NULL;
END;
$vote_update$ LANGUAGE  plpgsql;

DROP TRIGGER IF EXISTS vote_update ON votes;
CREATE TRIGGER vote_update AFTER UPDATE ON votes FOR EACH ROW EXECUTE PROCEDURE vote_update();


