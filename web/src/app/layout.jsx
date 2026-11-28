import Script from 'next/script';
import './globals.css';
import Providers from './providers.jsx';
import { getInitialData } from '../lib/server/session-data.mjs';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: {
        default: 'NutriVN - Nền Tảng Dinh Dưỡng AI Việt Nam',
        template: '%s | NutriVN',
    },
    description:
        'Ứng dụng theo dõi dinh dưỡng bằng ảnh món ăn AI Việt Nam: nhận diện 100 món ăn, tính calo, protein, carbs, fat, lộ trình BMI và báo cáo 7 ngày.',
    keywords: ['NutriVN', 'dinh dưỡng AI', 'tính calo món ăn Việt', 'nhật ký ăn uống', 'BMI', 'TDEE'],
    openGraph: {
        title: 'NutriVN - Nền Tảng Dinh Dưỡng AI Việt Nam',
        description: 'Chụp ảnh món ăn Việt, nhận diện bằng AI và theo dõi calo, macro mỗi ngày.',
        locale: 'vi_VN',
        type: 'website',
    },
};

export default async function RootLayout({ children }) {
    const initialData = await getInitialData();
    return (
        <html lang="vi">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-slate-50 text-slate-900">
                <Providers initialData={initialData}>{children}</Providers>
                <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            </body>
        </html>
    );
}
