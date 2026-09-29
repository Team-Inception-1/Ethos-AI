import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import AIBubble from '@/components/ui/AIBubble';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ethos AI — Study Abroad, Without the Fear',
    template: '%s | Ethos AI',
  },
  description:
    'Ethos AI protects Bangladeshi students from fraudulent study-abroad consultancies through agency verification, escrow payments, and AI-powered document fraud detection.',
  keywords: ['study abroad', 'Bangladesh', 'consultancy verification', 'escrow payments', 'fraud detection', 'বিদেশে পড়াশোনা'],
  openGraph: {
    title: 'Ethos AI — Study Abroad, Without the Fear',
    description: 'Verified consultancies. Escrow payments. AI fraud protection.',
    siteName: 'Ethos AI',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#15141B" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FBF3E3" media="(prefers-color-scheme: light)" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try{
    var t=localStorage.getItem('ethos-theme');
    if(t==='light'){document.documentElement.setAttribute('data-theme','light');}
  }catch(e){}
  try{
    if(typeof Element!=='undefined'&&Element.prototype){
      var origSetAttr=Element.prototype.setAttribute;
      Element.prototype.setAttribute=function(n,v){
        if(typeof n==='string'&&(n.indexOf('bis_')===0||n==='bis_skin_checked'||n==='bis_register'||n==='bis_frame_id'))return;
        return origSetAttr.apply(this,arguments);
      };
      var cleanup=function(){
        try{
          var nodes=document.querySelectorAll('[bis_skin_checked],[bis_register],[bis_frame_id]');
          for(var i=0;i<nodes.length;i++){
            nodes[i].removeAttribute('bis_skin_checked');
            nodes[i].removeAttribute('bis_register');
            nodes[i].removeAttribute('bis_frame_id');
          }
        }catch(e){}
      };
      if(typeof document!=='undefined'){
        cleanup();
        document.addEventListener('DOMContentLoaded',cleanup);
      }
      if(typeof MutationObserver!=='undefined'&&typeof document!=='undefined'){
        var observer=new MutationObserver(function(mutations){
          for(var i=0;i<mutations.length;i++){
            var m=mutations[i];
            if(m.type==='attributes'&&m.attributeName&&m.attributeName.indexOf('bis_')===0&&m.target&&m.target.removeAttribute){
              m.target.removeAttribute(m.attributeName);
            }
          }
        });
        observer.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked','bis_register','bis_frame_id']});
      }
    }
  }catch(e){}
})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Hind+Siliguri:wght@500;600;700&display=swap"
          rel="stylesheet"
          fetchPriority="high"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AIBubble />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
