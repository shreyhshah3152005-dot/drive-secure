REVOKE EXECUTE ON FUNCTION public.check_price_alerts() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_service_booking() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_provider_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dealer_car_count(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dealer_car_limit(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dealer_id(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_dealer(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_service_provider(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_test_drive() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_favorite_dealer_new_car() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_price_alert_trigger() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_price_history() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.stamp_invoice_provider() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_chat_unread_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Keep public shared-wishlist lookup working
GRANT EXECUTE ON FUNCTION public.get_wishlist_by_share_code(text) TO anon, authenticated;