import HeroSection from "@/components/HeroSection";
import CareerTimeline from "@/components/CareerTimeline";
import bgImage from "@/assets/bg.png";

const Index = () => {

    return (
        <div className="min-h-screen "
            style={{ backgroundImage: `url(${bgImage})`, backgroundAttachment: "fixed" }}>

            {/* Hero Section */}
            <HeroSection />

            {/* Features Section */}
            <div className="px-16 pt-20">
                <CareerTimeline />
            </div>

            {/* Benefits Section */}
            {/* <section className="container mx-auto px-16 py-20">
                <div className="w-full ">
                    <Card className="border-2 bg-linear-to-br from-card to-secondary">
                        <CardContent className="p-8 md:p-12">
                            <h2 className="text-3xl font-bold mb-8 text-center">
                                Why Choose CareerCompass AI?
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <CheckCircle className="h-6 w-6 text-success shrink-0 mt-1" />
                                        <p className="text-lg">{benefit}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section> */}



            {/* Footer */}
            {/* Footer */}
            <footer className="text-white">
                {/* Top CTA Section */}



                {/* Info Section */}
                <div className="px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-10 bg-[#151515] text-gray-300">
                    {/* Brand Summary */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-white leading-tight">
                            InterviewMate AI
                        </h3>
                        <p className="text-sm text-gray-400">
                            Your intelligent career assistant for mastering resumes, interviews,
                            and skill growth. Powered by AI to help you land your dream job.
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3 uppercase">Contact</h4>
                        <p className="text-sm">
                            <a
                                href="mailto:support@interviewmate.ai"
                                className="underline hover:text-white"
                            >
                                support@interviewmate.ai
                            </a>
                            <br />
                            +91 98765 43210 <br />
                            Pune, Maharashtra, India
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3 uppercase">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white">Home</a></li>
                            <li><a href="#" className="hover:text-white">Features</a></li>
                            <li><a href="#" className="hover:text-white">Career Tools</a></li>
                            <li><a href="#" className="hover:text-white">Pricing</a></li>
                            <li><a href="#" className="hover:text-white">Contact</a></li>
                        </ul>
                    </div>

                    {/* Newsletter + Social */}
                    <div>
                        <h4 className="text-sm text-gray-400 mb-3 uppercase">
                            Stay Ahead in Your Interviews
                        </h4>
                        <a href="#" className="underline text-white text-sm font-medium">
                            JOIN OUR NEWSLETTER →
                        </a>

                        <div className="mt-6">
                            <p className="text-sm text-gray-400 mb-2">FOLLOW US</p>
                            <div className="flex gap-4 text-white">
                                <a href="#" className="hover:text-blue-400">Bē</a>
                                <a href="#" className="hover:text-blue-400">Dr</a>
                                <a href="#" className="hover:text-blue-400">IG</a>
                                <a href="#" className="hover:text-blue-400">in</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="text-center text-gray-100 text-sm py-6 bg-[#151515] border-t border-gray-700">
                    © 2025 InterviewMate AI — Empowering careers through intelligent preparation.
                </div>
            </footer>

        </div>
    );
};

export default Index;
