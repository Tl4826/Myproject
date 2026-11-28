import { redirect } from 'next/navigation';
import { getInitialData } from '../../lib/server/session-data.mjs';
import ProtectedShell from './ProtectedShell.jsx';

export default async function ProtectedLayout({children}) {
    const initialData = await getInitialData();
    if (initialData && !initialData.user) redirect('/login');
    return <ProtectedShell>{children}</ProtectedShell>;
}
