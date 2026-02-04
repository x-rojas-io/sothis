import React from 'react';
import Card, { CardContent, CardFooter, CardHeader } from './Card';
import Button from './Button';


interface BlogCardProps {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    author: string;
    imageUrl?: string;
    href: string;
}

export default function BlogCard({ id, title, excerpt, date, author, imageUrl, href }: BlogCardProps) {
    const isExternal = href.startsWith('http');

    return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            {imageUrl && (
                <div className="w-full h-48 overflow-hidden bg-gray-100">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                </div>
            )}
            <CardHeader>
                <div className="text-sm text-stone-500 mb-2">{date} • {author}</div>
                <h3 className="text-xl font-serif font-bold text-stone-800 line-clamp-2">{title}</h3>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-stone-600 line-clamp-3">{excerpt}</p>
            </CardContent>
            <CardFooter>
                <Button
                    href={href}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                >
                    {isExternal ? 'View on Instagram' : 'Read More'}
                </Button>
            </CardFooter>
        </Card>
    );
}
