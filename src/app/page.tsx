import React from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import Card, { CardContent, CardHeader } from '@/components/Card';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-stone-100 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 sm:text-6xl">
            Renewal, Balance, Healing.
          </h1>
          <p className="mt-6 text-lg leading-8 text-stone-600 max-w-2xl mx-auto">
            Sothis Therapeutic Massage embodies renewal and the flow of energy, supporting your journey toward wellness, healing, and a fresh beginning in body and mind.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button href="/book" size="lg">Book Now</Button>
            <Button href="/services" size="lg" variant="secondary">View Services</Button>
            <Link href="/about" className="text-sm font-semibold leading-6 text-stone-900">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">Our Service</h2>
            <p className="mt-2 text-lg leading-8 text-stone-600">
              A holistic approach tailored to your specific needs.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-bold text-stone-900">Therapeutic Massage</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 text-lg leading-relaxed">
                  Experience a customized blend of techniques including Swedish and Deep Tissue designed to specific needs. Whether you seek relief from chronic pain, muscle tension, or simply wish to unwind, our therapeutic massage promotes deep relaxation, improved circulation, and overall well-being.
                </p>
                <div className="mt-6 flex justify-center">
                  <Button href="/book" size="lg">Book Appointment</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Massage Benefits */}
      <section className="py-24 sm:py-32 bg-stone-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">Massage Benefits</h2>
            <p className="mt-2 text-lg leading-8 text-stone-600">
              Massage goes beyond just relaxing you it also helps:
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">❤️</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">Improve Blood Circulation</h3>
                    <p className="text-stone-600">Enhanced circulation delivers oxygen and nutrients throughout your body, promoting healing and vitality.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">🧘</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">Relieve Anxiety</h3>
                    <p className="text-stone-600">Therapeutic touch reduces stress hormones and promotes relaxation, helping you find calm and peace.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">💪</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">Relieve Symptoms of Fibromyalgia</h3>
                    <p className="text-stone-600">Targeted massage techniques can help reduce pain, stiffness, and fatigue associated with fibromyalgia.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">🛡️</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">Enhancement of the Immune System</h3>
                    <p className="text-stone-600">Regular massage supports your body's natural defense system, helping you stay healthy and resilient.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">What Clients Say</h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <blockquote className="text-stone-900">
                  <p>&ldquo;The best massage I&apos;ve ever had! The atmosphere is so calming and I left feeling completely rejuvenated.&rdquo;</p>
                </blockquote>
                <div className="mt-6 font-semibold text-stone-900">– Sarah Jenkins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <blockquote className="text-stone-900">
                  <p>&ldquo;I&apos;ve struggled with back pain for years, but after a few sessions at SOTHIS, I feel like a new person.&rdquo;</p>
                </blockquote>
                <div className="mt-6 font-semibold text-stone-900">– Michael Chen</div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-10 text-center">
            <Button href="/testimonials" variant="outline">Read More Reviews</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
