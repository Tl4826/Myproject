import { cache } from 'react';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { getAuthenticatedUser } from './social-auth-handler.mjs';
import { readDiary } from './diary.mjs';

export async function authenticatedSession() {
    if (!process.env.DATABASE_URL) return null;
    const token = cookies().get('nutrivn_session')?.value;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const sql = neon(process.env.DATABASE_URL);
    const row = await getAuthenticatedUser({headers:{cookie:'nutrivn_session='+token}},sql);
    if (!row) return null;
    return {sql,user:{id:row.id,provider:row.provider,email:row.email,name:row.display_name,avatar:row.avatar_url}};
}

// Request-local memoization; never cache one account's data across requests.
export const getInitialData = cache(async () => {
    if (!process.env.DATABASE_URL) return null;
    const day = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    try {
        const session = await authenticatedSession();
        if (!session) return {user:null,meals:[],day};
        return {user:session.user,meals:await readDiary(session.sql,session.user.id),day};
    } catch {
        // Unknown session state: the client may retry against its same-origin API.
        return null;
    }
});
