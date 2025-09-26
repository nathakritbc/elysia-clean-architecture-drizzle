CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "posts_title_idx" ON "posts" USING btree ("title");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
INSERT INTO "posts" ("title", "content", "status", "created_at", "updated_at")
VALUES
	('Welcome to the blog', 'First example post seeded during migration.', 'active', now(), now()),
	('What''s new in our API', 'This post showcases the brand new posts module.', 'active', now(), now());
