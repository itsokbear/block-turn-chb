import type { Metadata } from 'next';
import './globals.css';
import './desert.css';
const base=process.env.NEXT_PUBLIC_BASE_PATH||'';
export const metadata:Metadata={title:'Чунявая Бруня — пески и повороты',description:'Пустынная головоломка с Чунявой Бруней: вращай камни, собирай линии и играй без интернета.',manifest:`${base}/manifest.webmanifest`,appleWebApp:{capable:true,title:'Бруня',statusBarStyle:'default'},icons:{icon:`${base}/icon-192.png`,apple:`${base}/apple-touch-icon.png`}};
export const viewport={width:'device-width',initialScale:1,themeColor:'#f4e6cb'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>;}
