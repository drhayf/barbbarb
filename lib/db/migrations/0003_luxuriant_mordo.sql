ALTER TABLE "posts" ALTER COLUMN "image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "type" text DEFAULT 'portfolio' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "title" text;