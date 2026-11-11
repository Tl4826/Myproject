import { TEAM_MEMBERS } from '../lib/data.js';

const TeamMembersModal = ({ onClose }) => (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div onClick={e => e.stopPropagation()} className="fade bg-white rounded-3xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-extrabold text-slate-900 text-sm">👥 Ban Lãnh Đạo NutriVN</h3>
                <button onClick={onClose} className="text-slate-400 font-black">✕</button>
            </div>
            <div className="space-y-3">
                {TEAM_MEMBERS.map(member => (
                    <div key={member.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start space-x-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-xs font-black text-emerald-700">
                            {member.name.split(' ').map(part => part[0]).slice(-2).join('')}
                            <img
                                src={member.image}
                                alt={member.name}
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                        <div>
                            <div className="font-black text-xs text-slate-900">{member.name}</div>
                            <div className="text-[10px] text-emerald-600 font-bold">{member.role}</div>
                            <p className="text-[10px] text-slate-500">{member.bio}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default TeamMembersModal;
