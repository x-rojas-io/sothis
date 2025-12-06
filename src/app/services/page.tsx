import React from 'react';
import Button from '@/components/Button';
import Card, { CardContent, CardFooter, CardHeader } from '@/components/Card';

export const metadata = {
    title: 'Services - Sothis Therapeutic Massage | Edgewater, NJ',
    description: 'Therapeutic massage, wellness, and healing services by Nancy Raza in Edgewater, NJ. Improve circulation, relieve anxiety, and enhance your immune system.',
};

const services = [
    {
        title: 'Therapeutic Massage',
        description: 'A customized blend of techniques tailored to your specific needs. Ideal for stress relief, pain management, muscle tension, and overall relaxation. Each session includes a consultation to ensure personalized care focused on your wellness goals.',
        duration: '60 / 90 min',
        price: 'Contact for pricing',
    },
];

export default function ServicesPage() {
    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">Our Services</h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        Choose the treatment that best suits your needs. All sessions include a consultation to ensure personalized care.
                    </p>
                </div>

                {/* Benefits Graphic */}
                <div className="mx-auto mt-12 max-w-4xl">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg">
                        <img
                            src="/sothis_benefits.png"
                            alt="Sothis Therapeutic Massage Benefits"
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                    {services.map((service) => (
                        <Card key={service.title} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-xl font-bold text-stone-900">{service.title}</h3>
                                    <span className="text-lg font-semibold text-secondary">{service.price}</span>
                                </div>
                                <p className="text-sm text-stone-500 mt-1">{service.duration}</p>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-stone-600">{service.description}</p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">Book Now</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
