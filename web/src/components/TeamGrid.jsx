'use client';

import { TEAM_MEMBERS } from '../lib/data.js';

export default function TeamGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEAM_MEMBERS.map(member => (
                <article
                    key={member.name}
                    className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center space-y-3"
                >
                    <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 text-lg font-black text-emerald-700 shadow-inner">
                        {member.name.split(' ').map(part => part[0]).slice(-2).join('')}
                        <img
                            src={member.image.startsWith('/') ? member.image : `/${member.image}`}
                            alt={member.name}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                    <div className="space-y-1">
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {member.title}
                        </span>
                        <h3 className="font-black text-sm text-slate-900">{member.name}</h3>
                        <p className="text-[11px] font-bold text-emerald-600">{member.role}</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
                </article>
            ))}
        </div>
    );
}
