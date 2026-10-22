import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"NexFlow — Tecnologia sob medida para sua operação",description:"Aplicativos web, sistemas, automações e landing pages sob medida. Conheça as soluções da NexFlow e apresente seu projeto.",icons:{icon:[{url:"/assets/brand/nexflow-favicon.png",type:"image/png",sizes:"48x48"}],shortcut:"/assets/brand/nexflow-favicon.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
