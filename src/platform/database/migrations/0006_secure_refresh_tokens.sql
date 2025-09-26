CREATE TABLE "refresh_tokens" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "jti" varchar(128) NOT NULL,
    "token_hash" varchar(512) NOT NULL,
    "expires_at" timestamptz NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "revoked_at" timestamptz,
    CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_jti_unique" UNIQUE ("jti");
--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");
