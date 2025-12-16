import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { routing } from '@/i18n/routing';

const contentDirectory = path.join(process.cwd(), 'content');

export async function getMarkdownContent(fileName: string, locale: string = 'en') {
    // Try to get localized content first
    let fullPath = path.join(contentDirectory, `${fileName}.${locale}.md`);

    // Fallback to default (english) if localized file doesn't exist
    if (!fs.existsSync(fullPath)) {
        fullPath = path.join(contentDirectory, `${fileName}.md`);
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
    const contentHtml = processedContent.toString();

    return {
        contentHtml,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(matterResult.data as { title: string;[key: string]: any }),
    };
}

export function getBlogPosts(locale: string = 'en') {
    const blogDirectory = path.join(contentDirectory, 'blog');
    const fileNames = fs.readdirSync(blogDirectory);

    // Group files by id (e.g., 'hello-world' from 'hello-world.md' and 'hello-world.es.md')
    const postsById: Record<string, string> = {};

    fileNames.forEach(fileName => {
        // Skip dotfiles
        if (fileName.startsWith('.')) return;

        let id = fileName.replace(/\.md$/, '');
        let isLocalized = false;

        // Check if it's a localized file (e.g., id.es.md)
        const parts = id.split('.');
        if (parts.length > 1 && routing.locales.includes(parts[parts.length - 1] as any)) {
            const fileLocale = parts.pop();
            id = parts.join('.'); // base id
            isLocalized = fileLocale === locale;
        }

        // Strategy:
        // If we haven't seen this ID yet, add it.
        // If we have seen it, but this file is the localized version for the requested locale, replace it.
        // Note: This logic assumes 'en' files are just 'id.md'. 

        if (!postsById[id]) {
            postsById[id] = fileName;
        } else {
            // If we found a localized version matching the requested locale, override.
            // If the existing one is generic (english) and we found a localized one, override.
            const existingIsLocalized = postsById[id].includes(`.${locale}.md`);
            if (fileName.endsWith(`.${locale}.md`)) {
                postsById[id] = fileName;
            }
        }
    });

    const allPostsData = Object.keys(postsById).map((id) => {
        const fileName = postsById[id];
        const fullPath = path.join(blogDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const matterResult = matter(fileContents);

        return {
            id,
            ...(matterResult.data as { date: string; title: string; excerpt: string; author: string }),
        };
    });

    return allPostsData.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
}

export async function getBlogPost(id: string, locale: string = 'en') {
    let fullPath = path.join(contentDirectory, 'blog', `${id}.${locale}.md`);

    if (!fs.existsSync(fullPath)) {
        fullPath = path.join(contentDirectory, 'blog', `${id}.md`);
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
    const contentHtml = processedContent.toString();

    return {
        id,
        contentHtml,
        ...(matterResult.data as { date: string; title: string; excerpt: string; author: string }),
    };
}
