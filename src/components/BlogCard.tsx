import React from 'react';
import Card, { CardContent, CardFooter, CardHeader } from './Card';
import Button from './Button';

interface BlogCardProps {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    author: string;
}

export default function BlogCard({ id, title, excerpt, date, author }: BlogCardProps) {
    return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <div className="text-sm text-stone-500 mb-2">{date} • {author}</div>
                <h3 className="text-xl font-serif font-bold text-stone-800 line-clamp-2">{title}</h3>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-stone-600 line-clamp-3">{excerpt}</p>
            </CardContent>
            <CardFooter>
                <Button href={`/blog/${id}`} variant="outline" size="sm" className="w-full">
                    Read More
                </Button>
            </CardFooter>
        </Card>
    );
}
