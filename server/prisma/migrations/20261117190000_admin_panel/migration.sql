-- Admin panel: a new ADMIN role, and the admin can suspend users and hide restaurants.
ALTER TYPE "Role" ADD VALUE 'ADMIN';

ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "restaurants" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
