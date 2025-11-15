import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'AIMindset - Explorando o Futuro da Inteligência Artificial',
  description = 'Blog especializado em inteligência artificial, tecnologia e produtividade. Conteúdo exclusivo para profissionais e entusiastas da IA.',
  keywords = 'inteligência artificial, IA, tecnologia, produtividade, futuro, machine learning, deep learning, ChatGPT, automação',
  image = '/og-image.jpg',
  url = 'https://aimindset.com',
}) => {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AIMindset" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="AIMindset" />
        <link rel="canonical" href={url} />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        
        {/* Theme */}
        <meta name="theme-color" content="#0D1B2A" />
        <meta name="msapplication-TileColor" content="#0D1B2A" />

        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
      </Helmet>
      
      <div className="min-h-screen bg-primary-dark text-white flex flex-col">
        <Header />
        
        <main className="flex-1 pt-16">
          {children}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Layout;