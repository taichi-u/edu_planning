import type { Metadata } from 'next';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans-jp/400.css';
import '@fontsource/ibm-plex-sans-jp/500.css';
import '@fontsource/ibm-plex-sans-jp/600.css';
import './globals.css';
import './content.css';
export const metadata: Metadata = { title: '研究ロードマップ', description: '研究、論文、学会、申請の期間と締切を管理', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body>{children}</body></html>; }
