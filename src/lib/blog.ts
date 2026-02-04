
import { getBlogPosts as getMarkdownPosts } from '@/lib/markdown';

export type BlogPost = {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    author: string;
    imageUrl?: string;
    href: string;
};

export async function getAllBlogPosts(locale: string = 'en'): Promise<BlogPost[]> {
    // 1. Get Local Markdown Posts
    const markdownPosts = getMarkdownPosts(locale).map(p => ({
        ...p,
        imageUrl: undefined, // Add frontmatter image support later if needed
        href: `/blog/${p.id}`
    }));

    return markdownPosts.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}
