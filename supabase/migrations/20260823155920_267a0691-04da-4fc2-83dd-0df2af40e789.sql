GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dealer_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_dealer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_service_provider(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_provider_id() TO authenticated;