'use server';

import { authenticatedSession } from './session-data.mjs';
import { mutateDiary } from './diary.mjs';

async function change(id,category,method) {
    try {
        const session = await authenticatedSession();
        if (!session) return {ok:false};
        const result = await mutateDiary(session.sql,session.user.id,id,category,method);
        return {ok:result.status===200};
    } catch { return {ok:false}; }
}

export async function updateDiaryCategory(id,category) { return change(id,category,'PATCH'); }
export async function deleteDiaryMeal(id) { return change(id,null,'DELETE'); }
