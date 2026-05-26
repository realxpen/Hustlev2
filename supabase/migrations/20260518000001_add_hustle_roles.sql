insert into public.user_roles (id, description) values
  ('client', 'Client seeking services'),
  ('hustler', 'Hustler providing services'),
  ('both', 'Both client and hustler')
on conflict (id) do nothing;
