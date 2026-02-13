import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Coffee, Wifi, Car, Shield, Quote } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Autoplay from "embla-carousel-autoplay";

export default function GuestDashboard() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Hero Section */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                        alt="Hotel Lobby"
                        className="w-full h-full object-cover brightness-[0.4]"
                    />
                </div>
                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto text-white animate-fade-in space-y-8">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-amber-400/30 text-amber-200 text-sm font-medium tracking-[0.2em] uppercase mb-4 animate-slide-up-fade" style={{ animationDelay: "100ms" }}>
                        The Ultimate Escape
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[1.1] animate-slide-up-fade" style={{ animationDelay: "200ms" }}>
                        Where Luxury <br /> Meets Serenity
                    </h1>
                    <p className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed animate-slide-up-fade font-light" style={{ animationDelay: "300ms" }}>
                        Discover an oasis of calm in the heart of the city. Unmatched elegance, world-class service, and unforgettable memories await.
                    </p>
                    <div className="pt-10 animate-slide-up-fade" style={{ animationDelay: "400ms" }}>
                        <Link to="/guest/rooms">
                            <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-amber-500 text-black hover:bg-amber-400 border-none shadow-2xl shadow-amber-500/30 transition-all hover:scale-105 duration-300">
                                Book Your Stay <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Rooms */}
            <section className="py-24 px-6 max-w-[1400px] mx-auto w-full">
                <div className="text-center mb-20 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">Exquisite Accommodations</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Curated layouts designed to provide the utmost in comfort and style.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[
                        {
                            name: "Presidential Suite",
                            image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
                            price: "₱15,000",
                            desc: "The pinnacle of luxury with panoramic city views and private butler service.",
                            tag: "Exclusive"
                        },
                        {
                            name: "Executive Suite",
                            image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80",
                            price: "₱8,500",
                            desc: "Spacious living areas perfect for business or leisure travelers.",
                            tag: "Popular"
                        },
                        {
                            name: "Deluxe Ocean View",
                            image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1474&q=80",
                            price: "₱5,000",
                            desc: "Wake up to the soothing sounds of the waves from your private balcony.",
                            tag: "Best Value"
                        },
                        {
                            name: "Family Garden Villa",
                            image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1425&q=80",
                            price: "₱12,000",
                            desc: "A private sanctuary with direct access to our lush tropical gardens.",
                            tag: "Family Favorite"
                        },
                        {
                            name: "Standard King",
                            image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
                            price: "₱3,500",
                            desc: "Contemporary design meets comfort in our well-appointed standard rooms.",
                            tag: ""
                        },
                        {
                            name: "Cozy Twin",
                            image: "https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
                            price: "₱3,000",
                            desc: "Perfect for friends traveling together, featuring two plush twin beds.",
                            tag: ""
                        }
                    ].map((room, i) => (
                        <div key={i} className="group rounded-3xl overflow-hidden border bg-card shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
                            <div className="h-72 overflow-hidden relative">
                                <img
                                    src={room.image}
                                    alt={room.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-black px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                    {room.price}<span className="font-normal text-xs text-gray-600">/night</span>
                                </div>
                                {room.tag && (
                                    <div className="absolute top-4 left-4 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                                        {room.tag}
                                    </div>
                                )}
                            </div>
                            <div className="p-8 flex flex-col flex-grow space-y-4">
                                <h3 className="text-2xl font-bold font-display text-foreground group-hover:text-accent transition-colors">{room.name}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{room.desc}</p>
                                <div className="pt-4 border-t">
                                    <Link to="/guest/rooms" className="inline-flex items-center text-accent font-semibold hover:translate-x-1 transition-transform">
                                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Hotel Info — Check-in / Check-out Times */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-muted/60 to-muted/40" />

                <div className="relative z-10 max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <span className="inline-block py-1.5 px-5 rounded-full border border-accent/30 text-accent text-xs font-semibold tracking-[0.25em] uppercase">
                            Plan Your Visit
                        </span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">Hotel Information</h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">Everything you need to know before your stay</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {[
                            {
                                label: "Check-In",
                                time: "2:00",
                                period: "PM",
                                note: "Early check-in subject to availability",
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                ),
                            },
                            {
                                label: "Check-Out",
                                time: "12:00",
                                period: "PM",
                                note: "Late check-out may incur additional charges",
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                ),
                            },
                            {
                                label: "Front Desk",
                                time: "24/7",
                                period: "",
                                note: "Always available to assist you",
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                ),
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="group bg-card p-10 rounded-2xl border border-border/60 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                            >
                                <div className="mx-auto w-16 h-16 rounded-full border-2 border-accent/30 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black group-hover:border-accent transition-all duration-500">
                                    {item.icon}
                                </div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mt-8">{item.label}</h3>
                                <p className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3">
                                    {item.time}{item.period && <span className="text-xl ml-1 font-medium text-muted-foreground">{item.period}</span>}
                                </p>
                                <div className="mt-6 pt-5 border-t border-border/40">
                                    <p className="text-sm text-muted-foreground">{item.note}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-14 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 flex items-start gap-4 max-w-3xl mx-auto">
                        <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full border border-accent/30 flex items-center justify-center text-accent">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Each booking covers <strong className="text-foreground">1 day &amp; 1 night</strong> per date. For example, booking Feb 10–14 gives you <strong className="text-foreground">4 nights</strong> — check-in Feb 10 at 2:00 PM, check-out Feb 14 at 12:00 PM.
                        </p>
                    </div>
                </div>
            </section>

            {/* Amenities Section */}
            <section className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-10 order-2 lg:order-1">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">World-Class Amenities</h2>
                                <p className="text-muted-foreground text-xl leading-relaxed">
                                    Every detail has been carefully considered to ensure your stay is nothing short of perfection.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {[
                                    { icon: Coffee, title: "Gourmet Dining", desc: "Award-winning flavors." },
                                    { icon: Star, title: "Luxury Spa", desc: "Rejuvenate your senses." },
                                    { icon: Wifi, title: "High-Speed WiFi", desc: "Seamless connectivity." },
                                    { icon: Car, title: "Valet Parking", desc: "Hassle-free arrival." },
                                    { icon: Shield, title: "24/7 Security", desc: "Peace of mind guaranteed." },
                                    { icon: Quote, title: "Concierge Service", desc: "Here for your every need." },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="p-3.5 rounded-2xl bg-accent/10 text-accent shrink-0 transition-colors hover:bg-accent hover:text-black">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-foreground mb-1">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6">
                                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-accent/30 text-accent hover:bg-accent/10">Explore All Amenities</Button>
                            </div>
                        </div>
                        <div className="relative order-1 lg:order-2 h-[500px] lg:h-[700px] rounded-[2rem] overflow-hidden shadow-2xl group">
                            <img
                                src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                                alt="Amenities"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Carousel */}
            <section className="py-24 px-6 max-w-6xl mx-auto text-center">
                <h2 className="text-4xl font-display font-bold mb-16 text-foreground">Guest Experiences</h2>

                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 4000,
                        }),
                    ]}
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full max-w-5xl mx-auto"
                >
                    <CarouselContent className="-ml-4">
                        {[
                            {
                                quote: "The best hotel experience I've ever had. The staff was incredibly welcoming and the room was stunning.",
                                author: "Sarah Johnson",
                                role: "Business Traveler",
                                rating: 5
                            },
                            {
                                quote: "A perfect getaway! The spa services were top-notch and the location is unbeatable.",
                                author: "Michael Chen",
                                role: "Vacationer",
                                rating: 5
                            },
                            {
                                quote: "Absolutely breathtaking views and the food was to die for. Will definitely be returning.",
                                author: "Emma Watson",
                                role: "Food Blogger",
                                rating: 5
                            },
                            {
                                quote: "Top tier service from the moment we stepped in. The concierge went above and beyond.",
                                author: "David Miller",
                                role: "Family Trip",
                                rating: 5
                            },
                            {
                                quote: "Impeccable cleanliness and modern amenities. Highly recommended for digital nomads.",
                                author: "James Lee",
                                role: "Digital Nomad",
                                rating: 4
                            }
                        ].map((t, i) => (
                            <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                <div className="p-1">
                                    <Card className="border-none shadow-none bg-muted/20 hover:bg-muted/40 transition-colors h-full">
                                        <CardContent className="flex flex-col items-center justify-center p-8 h-[300px]">
                                            <div className="flex gap-1 text-yellow-400 mb-6">
                                                {[...Array(t.rating)].map((_, s) => <Star key={s} className="h-5 w-5 fill-current" />)}
                                            </div>
                                            <Quote className="h-8 w-8 text-accent/20 mb-4" />
                                            <p className="text-lg italic text-muted-foreground mb-6 line-clamp-4 leading-relaxed">"{t.quote}"</p>
                                            <div className="mt-auto">
                                                <p className="font-bold text-foreground text-lg">{t.author}</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1">{t.role}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="hidden md:block">
                        <CarouselPrevious className="-left-12 h-12 w-12 border-none bg-muted hover:bg-accent hover:text-black" />
                        <CarouselNext className="-right-12 h-12 w-12 border-none bg-muted hover:bg-accent hover:text-black" />
                    </div>
                </Carousel>
            </section>

            {/* Footer CTA */}
            <section className="py-24 bg-[hsl(40,6%,10%)] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5"></div>
                <div className="relative z-10 max-w-4xl mx-auto px-6">
                    <h2 className="text-4xl md:text-6xl font-display font-bold mb-8">Ready for your dream stay?</h2>
                    <p className="text-white/70 text-xl mb-12 max-w-2xl mx-auto font-light">
                        Book directly with us for the best rates, exclusive offers, and a complimentary welcome drink.
                    </p>
                    <Link to="/guest/rooms">
                        <Button size="lg" className="h-16 px-12 text-xl rounded-full bg-amber-500 text-black hover:bg-amber-400 shadow-2xl shadow-amber-500/20 hover:-translate-y-1 transition-all">
                            Book Now
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
