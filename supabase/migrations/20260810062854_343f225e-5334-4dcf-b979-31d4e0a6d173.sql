GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

GRANT SELECT ON TABLE public.dealers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dealers TO authenticated;
GRANT ALL ON TABLE public.dealers TO service_role;

GRANT SELECT ON TABLE public.service_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.service_providers TO authenticated;
GRANT ALL ON TABLE public.service_providers TO service_role;