-- Supabase exposes tables in the "public" schema through its Data API (anon / authenticated roles).
-- Turning on Row Level Security with no policies blocks that access completely.
-- The app is not affected: it connects as the tables' owner, which RLS does not apply to.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "restaurants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
