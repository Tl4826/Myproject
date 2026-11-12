import { GUIDE } from '../lib/data.js';

const GuideAccordion = ({ isOpen, onToggle }) => (
    <section className="overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-sm">
        <button
            type="button"
            aria-expanded={isOpen}
            onClick={onToggle}
            className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-extrabold text-emerald-700"
        >
            <span>📖 Hướng dẫn sử dụng</span>
            <span>{isOpen ? 'Thu gọn ▲' : 'Mở ▼'}</span>
        </button>
        {isOpen && (
            <div className="space-y-3 border-t border-emerald-100 px-5 py-4">
                {GUIDE.map(([icon, title, description]) => (
                    <div key={title} className="flex items-start gap-3 text-xs">
                        <span className="text-base">{icon}</span>
                        <div>
                            <h3 className="font-extrabold text-slate-800">{title}</h3>
                            <p className="mt-0.5 leading-relaxed text-slate-600">{description}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </section>
);

export default GuideAccordion;
