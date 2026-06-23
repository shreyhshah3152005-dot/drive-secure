INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role
FROM auth.users u
CROSS JOIN (VALUES ('admin'::app_role), ('dealer'::app_role), ('service_provider'::app_role)) AS r(role)
WHERE u.email = 'shreyhshah3152005@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;