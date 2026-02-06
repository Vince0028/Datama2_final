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
                    <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium tracking-[0.2em] uppercase mb-4 animate-slide-up-fade" style={{ animationDelay: "100ms" }}>
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
                            <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-white text-black hover:bg-gray-100 border-none shadow-2xl transition-all hover:scale-105 duration-300">
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
                                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                                        {room.tag}
                                    </div>
                                )}
                            </div>
                            <div className="p-8 flex flex-col flex-grow space-y-4">
                                <h3 className="text-2xl font-bold font-display text-foreground group-hover:text-primary transition-colors">{room.name}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{room.desc}</p>
                                <div className="pt-4 border-t">
                                    <Link to="/guest/rooms" className="inline-flex items-center text-primary font-semibold hover:translate-x-1 transition-transform">
                                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
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
                                        <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shrink-0 transition-colors hover:bg-primary hover:text-white">
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
                                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-primary/20 hover:bg-primary/5">Explore All Amenities</Button>
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
            <section className="py-24 px-6 max-w-6xl mx-auto text-center overflow-hidden">
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
                                            <Quote className="h-8 w-8 text-primary/20 mb-4" />
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
                        <CarouselPrevious className="-left-12 h-12 w-12 border-none bg-muted hover:bg-primary hover:text-white" />
                        <CarouselNext className="-right-12 h-12 w-12 border-none bg-muted hover:bg-primary hover:text-white" />
                    </div>
                </Carousel>
            </section>

            {/* Footer CTA */}
            <section className="py-24 bg-primary text-primary-foreground text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 max-w-4xl mx-auto px-6">
                    <h2 className="text-4xl md:text-6xl font-display font-bold mb-8">Ready for your dream stay?</h2>
                    <p className="text-primary-foreground/90 text-xl mb-12 max-w-2xl mx-auto font-light">
                        Book directly with us for the best rates, exclusive offers, and a complimentary welcome drink.
                    </p>
                    <Link to="/guest/rooms">
                        <Button size="lg" variant="secondary" className="h-16 px-12 text-xl rounded-full shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all">
                            Book Now
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
