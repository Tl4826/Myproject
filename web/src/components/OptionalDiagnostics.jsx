'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { sendCode } from '../lib/telemetry-envelope.mjs';

const GA = process.env.NEXT_PUBLIC_GA_ID || '';
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const validGA = /^G-[A-Z0-9]+$/.test(GA);
const choiceKey = 'nv_optional_diagnostics';
let initialized = false;
let lastView = null;
const seen = new Set();

export default function OptionalDiagnostics() {
  const pathname = usePathname();
  const [choice,setChoice] = useState(null);
  const [ready,setReady] = useState(false);
  useEffect(() => {
    try { setChoice(localStorage.getItem(choiceKey)); } catch {}
    setReady(true);
  }, []);
  const allowed = ready && choice === 'yes' && pathname === '/';
  useEffect(() => {
    if (!validGA) return;
    window['ga-disable-'+GA] = !allowed;
    if (!allowed) {
      if (window.gtag) window.gtag('consent','update',{analytics_storage:'denied'});
      lastView = null;
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    if (!initialized) {
      window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      window.gtag('js',new Date());
      window.gtag('config',GA,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,
        page_location:location.origin+'/',page_referrer:'',page_title:'NutriVN'});
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id='+GA;
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
      initialized = true;
    }
    window.gtag('consent','update',{analytics_storage:'granted'});
    if (lastView !== '/') {
      window.gtag('event','page_view',{page_location:location.origin+'/',page_referrer:'',page_title:'NutriVN'});
      lastView = '/';
    }
    return () => { window['ga-disable-'+GA] = true; };
  }, [allowed]);
  useEffect(() => {
    // Opt-in, landing only. Never attach ErrorEvent, rejection, stack, URL or personal data.
    if (!allowed || !DSN) return;
    const emit = code => {
      if (seen.has(code)) return;
      seen.add(code);
      void sendCode(DSN, code, 'production');
    };
    const error = () => emit('browser_runtime');
    const rejection = () => emit('browser_promise');
    window.addEventListener('error',error);
    window.addEventListener('unhandledrejection',rejection);
    return () => { window.removeEventListener('error',error); window.removeEventListener('unhandledrejection',rejection); };
  },[allowed]);
  if (!ready || pathname !== '/' || (!validGA && !DSN)) return null;
  function save(value) {
    if (validGA && value !== 'yes') window['ga-disable-'+GA] = true;
    try { localStorage.setItem(choiceKey,value); } catch {}
    setChoice(value);
  }
  return <aside aria-label="Tùy chọn đo lường" className="mx-auto max-w-2xl px-4 py-3 text-sm text-slate-600">
    <p>Đo lường tùy chọn trên trang giới thiệu: lượt xem và mã lỗi kỹ thuật, không gửi ảnh, hồ sơ hoặc nhật ký.</p>
    <div className="flex flex-wrap gap-3 mt-2">
      <button type="button" aria-pressed={choice==='yes'} onClick={()=>save('yes')} className="underline">Cho phép</button>
      <button type="button" aria-pressed={choice==='no'} onClick={()=>save('no')} className="underline">Từ chối / tắt</button>
    </div>
  </aside>;
}
