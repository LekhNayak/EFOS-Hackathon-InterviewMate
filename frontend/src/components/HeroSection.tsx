import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import laptopImage from "@/assets/image1.png";
import Header from "@/components/Header";
import laptopImage1 from "@/assets/image1.png";
import laptopImage2 from "@/assets/image1.png";

const HeroSection = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [heroVisible, setHeroVisible] = useState(true);
    const heroRef = useRef<HTMLDivElement>(null);
    const baseOffset = 60;

    // Observe hero visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setHeroVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (heroRef.current) observer.observe(heroRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (!heroRef.current) return;

            const heroHeight = heroRef.current.offsetHeight;
            const scrollTop = window.scrollY;
            const limit = heroHeight;
            setScrollY(Math.min(scrollTop, limit));
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);



    // Laptop scroll animation
    const maxScale = 1;
    const minScale = 0.5;
    const scalelimit = 0.6;
    const scale = Math.max(
        scalelimit,
        maxScale - ((maxScale - minScale) * scrollY) / 500
    );
    const translateY = Math.min(scrollY / 2, 100); // float up by max 100px

    // Paragraph fade/float animation
    const paraOpacity = Math.min(scrollY / 200, 1); // fade in
    const targetY = 340;
    const paraTranslateY = Math.max(480 - scrollY / 4, targetY); // float up from 50px

    const maxXShift = 30;
    const translateX = Math.min((scrollY / 2), maxXShift); // adjust divisor to control speed


    return (
        <section
            ref={heroRef}
            className="relative min-h-[120vh] overflow-hidden bg-cover bg-center bg-no-repeat flex flex-col  items-center"

        >
            <div
                className={`fixed top-0 left-0 right-0 z-20 transition-all duration-500 ${heroVisible
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-6 pointer-events-none"
                    }`}
            >
                <Header />
            </div>

            {/* Sticky Hero Text */}
            <div className="relative top-20 w-full flex flex-col items-center z-10 px-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    AI-Powered Career Preparation
                </span>
                <h1 className="text-6xl md:text-7xl font-bold mb-4 text-center">
                    Navigate Your Career
                </h1>
                <h2 className="text-3xl md:text-4xl text-primary mb-6 text-center">
                    With AI Guidance
                </h2>
            </div>

            {/* Laptop Image */}
            <div
                className="absolute bottom-[-4rem] left-1/2 z-10 transition-transform duration-200 ease-out"
                style={{
                    bottom: `${baseOffset}px`,
                    transform: `translateX(calc(-50% - ${translateX}%)) translateY(-${translateY}px) scale(${scale - .2})`,
                }}
            >
                <img
                    src={laptopImage1}
                    alt="Laptop"
                    className="w-[45vw] max-w-[900px] transition-transform duration-200 ease-out"
                />
            </div>
            <div
                className="absolute bottom-[-4rem] left-1/2 z-10 transition-transform duration-200 ease-out"
                style={{
                    bottom: `${baseOffset}px`,
                    transform: `translateX(calc(-50% + ${translateX}%)) translateY(-${translateY}px) scale(${scale - .2})`,
                }}
            >
                <img
                    src={laptopImage2}
                    alt="Laptop"
                    className="w-[45vw] max-w-[900px] transition-transform duration-200 ease-out"
                />
            </div>
            <div
                className="absolute bottom-[-4rem] left-1/2 z-10 transition-transform duration-200 ease-out"
                style={{
                    bottom: `${baseOffset}px`,
                    transform: `translateX(-50%) translateY(-${translateY}px) scale(${scale})`,
                }}
            >
                <img
                    src={laptopImage}
                    alt="Laptop"
                    className="w-[45vw] max-w-[900px] transition-transform duration-200 ease-out"
                />
            </div>


            {/* Paragraph and Buttons */}
            <div
                className="flex flex-col items-center px-6 pt-25 z-10 mb-16 transition-all duration-300 ease-out"
                style={{
                    opacity: paraOpacity,
                    transform: `translateY(${paraTranslateY}px)`,
                }}
            >
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-center mb-8">
                    Prepare for your dream job with AI-powered resume analysis, mock
                    interviews, and personalized career insights. Your career compass for
                    success.
                </p>
                <div className="flex justify-center gap-4 ">
                    <Button
                        size="lg"
                        className="text-lg text-white bg-[#252525] rounded-lg hover:bg-black"
                        onClick={() => navigate("/auth")}
                    >
                        Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button size="lg" variant="outline" className="text-lg">
                        Learn More
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
