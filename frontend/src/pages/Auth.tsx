import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProfileSetupModal from "./ProfileSetupModel";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Auth = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [signInEmail, setSignInEmail] = useState("");
    const [signInPassword, setSignInPassword] = useState("");

    const [signUpName, setSignUpName] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [signupData, setSignupData] = useState<any>(null);

    // 🟢 LOGIN HANDLER
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/user/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email: signInEmail,
                    password: signInPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Login failed");

            toast.success("Login successful 🎉");
            navigate("/dashboard");
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // 🟡 SIGNUP HANDLER
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!otpSent) {
                // Step 1: Request OTP
                const response = await fetch(`${BASE_URL}/user/signup/request-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: signUpName,
                        email: signUpEmail,
                        password: signUpPassword,
                    }),
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.message || "Failed to send OTP");

                toast.success("OTP sent to your email 📩");
                setOtpSent(true);
            } else {
                // Step 2: Complete signup
                const response = await fetch(`${BASE_URL}/user/signup/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: signUpName,
                        email: signUpEmail,
                        password: signUpPassword,
                        otp,
                    }),

                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "OTP verification failed");

                toast.success("OTP verified ✅");
                setSignupData({ name: signUpName, email: signUpEmail, password: signUpPassword });
                setProfileModalOpen(true);
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-radial-gray relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className="loader-ring scale-90 sm:scale-100">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="loader-dot"></div>
                    ))}
                </div>
            </div>

            <div className="w-full max-w-md z-20">
                <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>

                <Card className="border border-gray-400 shadow-lg bg-white">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                            <Sparkles className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            Welcome to CareerCompass AI
                        </CardTitle>
                        <CardDescription>
                            Your AI-powered career preparation platform
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Tabs defaultValue="signin" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 gap-2">
                                <TabsTrigger
                                    value="signin"
                                    className="data-[state=active]:bg-[#252525] data-[state=active]:text-white text-black border border-gray-400"
                                >
                                    Sign In
                                </TabsTrigger>
                                <TabsTrigger
                                    value="signup"
                                    className="data-[state=active]:bg-[#252525] data-[state=active]:text-white text-black border border-gray-400"
                                >
                                    Sign Up
                                </TabsTrigger>
                            </TabsList>

                            {/* 🟢 SIGN IN */}
                            <TabsContent value="signin" className="min-h-80">
                                <div
                                    className="mb-3 mt-1 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-amber-100 transition"
                                    onClick={() => { setSignInEmail("lekhnayakwork@gmail.com"); setSignInPassword("123456"); }}
                                >
                                    <div>
                                        <p className="text-xs font-semibold text-amber-700">Demo Account</p>
                                        <p className="text-[11px] text-amber-600">lekhnayakwork@gmail.com · 123456</p>
                                    </div>
                                    <span className="text-[11px] text-amber-700 font-medium border border-amber-300 rounded-lg px-2 py-0.5">Fill</span>
                                </div>
                                <form onSubmit={handleSignIn} className="space-y-4 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
                                                value={signInEmail}
                                                onChange={(e) => setSignInEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={signInPassword}
                                                onChange={(e) => setSignInPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-[#252525] text-white"
                                        disabled={loading}
                                    >
                                        {loading ? "Signing in..." : "Sign In"}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* 🟡 SIGN UP WITH OTP */}
                            <TabsContent value="signup" className="min-h-80">
                                <form onSubmit={handleSignUp} className="space-y-4 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input
                                                type="text"
                                                placeholder="John Doe"
                                                value={signUpName}
                                                onChange={(e) => setSignUpName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
                                                value={signUpEmail}
                                                onChange={(e) => setSignUpEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={signUpPassword}
                                                onChange={(e) => setSignUpPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>

                                        {otpSent && (
                                            <div className="space-y-2">
                                                <Label>Enter OTP</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Enter OTP"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-[#252525] text-white"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? otpSent
                                                ? "Verifying..."
                                                : "Sending OTP..."
                                            : otpSent
                                                ? "Verify OTP →"
                                                : "Send OTP"}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <ProfileSetupModal
                open={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                signupData={signupData}
                onComplete={() => navigate("/dashboard")}
            />
        </div>
    );
};

export default Auth;
