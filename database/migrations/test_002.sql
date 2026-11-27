-- Run only on disposable local test database. All inserted synthetic records rolled back.
BEGIN;
DO $$
DECLARE a UUID; b UUID; p UUID; rejected BOOLEAN;
BEGIN
 INSERT INTO social_users(provider,provider_user_id) VALUES('email','synthetic-migration-a') RETURNING id INTO a;
 INSERT INTO social_users(provider,provider_user_id) VALUES('email','synthetic-migration-b') RETURNING id INTO b;
 INSERT INTO user_profiles(user_id,display_name) VALUES(a,'Synthetic A'),(b,'Synthetic B');
 INSERT INTO user_plans(user_id,title,start_on,end_on) VALUES(a,'Demo schedule','2026-11-01','2026-11-07') RETURNING id INTO p;
 INSERT INTO user_saved_reports(user_id,period_start,period_end,days_recorded) VALUES(a,'2026-11-01','2026-11-07',3),(b,'2026-11-01','2026-11-07',2);
 IF (SELECT count(*) FROM user_plans WHERE user_id=b) <> 0 THEN RAISE EXCEPTION 'Account filter failed'; END IF;
 rejected := false;
 BEGIN INSERT INTO user_profiles(user_id) VALUES(a); EXCEPTION WHEN unique_violation THEN rejected := true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Duplicate profile accepted'; END IF;
 rejected := false;
 BEGIN INSERT INTO user_saved_reports(user_id,period_start,period_end,days_recorded) VALUES(a,'2026-11-01','2026-11-07',9); EXCEPTION WHEN check_violation THEN rejected := true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Invalid report accepted'; END IF;
 rejected := false;
 BEGIN INSERT INTO user_plans(user_id,title,start_on,end_on) VALUES(gen_random_uuid(),'Invalid owner','2026-11-01','2026-11-07'); EXCEPTION WHEN foreign_key_violation THEN rejected := true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Orphan plan accepted'; END IF;
 DELETE FROM social_users WHERE id=a;
 IF EXISTS(SELECT 1 FROM user_profiles WHERE user_id=a) OR EXISTS(SELECT 1 FROM user_plans WHERE id=p) OR EXISTS(SELECT 1 FROM user_saved_reports WHERE user_id=a) THEN RAISE EXCEPTION 'Cascade failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=b) OR NOT EXISTS(SELECT 1 FROM user_saved_reports WHERE user_id=b) THEN RAISE EXCEPTION 'Other account affected'; END IF;
END $$;
ROLLBACK;
