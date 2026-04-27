-- Block disposable / throwaway email domains at signup.
--
-- Why: the AI Companion is free with a per-user daily token quota. Without
-- domain blocking, one machine can sign up dozens of throwaway-mail accounts
-- and multiply their effective quota. This trigger raises on INSERT into
-- auth.users when the email domain is on the blocklist, which fails the
-- signup transaction cleanly.
--
-- The blocklist lives in a table (not hardcoded) so we can extend it without
-- another migration. Add new domains with:
--   INSERT INTO public.blocked_email_domains (domain) VALUES ('newdomain.com');

CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
  domain text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed list. Covers the most common disposable / throwaway providers seen
-- in real-world spam signups. Lowercase only — we lowercase the email
-- domain in the trigger before checking.
INSERT INTO public.blocked_email_domains (domain) VALUES
  ('mailinator.com'),
  ('guerrillamail.com'),
  ('guerrillamail.net'),
  ('guerrillamail.org'),
  ('guerrillamail.biz'),
  ('guerrillamail.de'),
  ('sharklasers.com'),
  ('grr.la'),
  ('10minutemail.com'),
  ('10minutemail.net'),
  ('temp-mail.org'),
  ('temp-mail.io'),
  ('tempmail.com'),
  ('tempmail.io'),
  ('tempmail.net'),
  ('tempmailo.com'),
  ('tmpmail.org'),
  ('tmpmail.net'),
  ('yopmail.com'),
  ('yopmail.net'),
  ('throwaway.email'),
  ('maildrop.cc'),
  ('getairmail.com'),
  ('trashmail.com'),
  ('trashmail.de'),
  ('dispostable.com'),
  ('mailnesia.com'),
  ('mintemail.com'),
  ('emailondeck.com'),
  ('moakt.com'),
  ('mohmal.com'),
  ('getnada.com'),
  ('nada.email'),
  ('mail.tm'),
  ('spam4.me'),
  ('fakemail.net'),
  ('fakeinbox.com'),
  ('fakermail.com'),
  ('discard.email'),
  ('discardmail.com'),
  ('mailcatch.com'),
  ('mt2015.com'),
  ('inboxbear.com'),
  ('mvrht.com'),
  ('boximail.com'),
  ('emltmp.com'),
  ('etranquil.com'),
  ('harakirimail.com'),
  ('mailpoof.com'),
  ('emailfake.com'),
  ('emailtemporanea.net'),
  ('emkei.cz'),
  ('mailforspam.com'),
  ('inboxkitten.com'),
  ('byom.de'),
  ('1secmail.com'),
  ('1secmail.net'),
  ('1secmail.org'),
  ('byebyemail.com'),
  ('cool.fr.nf'),
  ('jetable.fr.nf'),
  ('nospam.ze.tc'),
  ('nomail.xl.cx')
ON CONFLICT (domain) DO NOTHING;

CREATE OR REPLACE FUNCTION public.block_disposable_email_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  email_domain text;
BEGIN
  IF NEW.email IS NULL OR position('@' in NEW.email) = 0 THEN
    RETURN NEW;
  END IF;

  email_domain := lower(split_part(NEW.email, '@', 2));

  IF EXISTS (SELECT 1 FROM public.blocked_email_domains WHERE domain = email_domain) THEN
    RAISE EXCEPTION 'Email domain not allowed. Please use a permanent email address.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_disposable_email_signup ON auth.users;
CREATE TRIGGER block_disposable_email_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_disposable_email_signup();
