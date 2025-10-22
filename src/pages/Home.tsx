import React from 'react';
import Hero from '../components/Home/Hero';
import FeaturedArticles from '../components/Home/FeaturedArticles';
import Categories from '../components/Home/Categories';
import NewsletterCTA from '../components/Home/NewsletterCTA';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <FeaturedArticles />
      <Categories />
      <NewsletterCTA />
    </>
  );
};

export default Home;