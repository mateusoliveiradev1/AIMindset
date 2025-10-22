import { useMemo } from 'react';

export const useReadingTime = (content: string) => {
  const readingTime = useMemo(() => {
    if (!content) return 1;

    // Remove markdown syntax and HTML tags
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/[*_~`]/g, '') // Remove formatting
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Count words
    const words = cleanContent.split(' ').filter(word => word.length > 0).length;
    
    // Count images in original content (add 12 seconds per image)
    const imageMatches = content.match(/!\[.*?\]\(.*?\)/g) || [];
    const imageTime = imageMatches.length * 0.2; // 12 seconds = 0.2 minutes
    
    // Calculate reading time (250 words per minute)
    const wordsPerMinute = 250;
    const readingTimeMinutes = words / wordsPerMinute + imageTime;
    
    // Round to nearest minute, minimum 1 minute
    return Math.max(1, Math.round(readingTimeMinutes));
  }, [content]);

  return readingTime;
};