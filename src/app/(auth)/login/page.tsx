"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FirebaseError } from "firebase/app";

const authSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function LoginPage() {
    const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const router = useRouter();
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (!loading && user) {
            router.replace("/");
        }
    }, [user, loading, router]);

    const onSubmit = async (values: AuthFormValues) => {
        setSubmitting(true);
        try {
            if (mode === "signin") {
                await signInWithEmail(values.email, values.password);
            } else {
                await signUpWithEmail(values.email, values.password);
            }
        } catch (err) {
            if (err instanceof FirebaseError) {
                switch (err.code) {
                    case "auth/wrong-password":
                        form.setError("password", { message: "Incorrect password." });
                        break;
                    case "auth/user-not-found":
                        form.setError("email", { message: "No account with this email." });
                        break;
                    case "auth/email-already-in-use":
                        form.setError("email", { message: "Email already registered. Sign in instead." });
                        break;
                    case "auth/weak-password":
                        form.setError("password", { message: "Password must be at least 6 characters." });
                        break;
                    default:
                        toast.error("Authentication failed. Please try again.");
                }
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch {
            toast.error("Failed to sign in with Google. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Skeleton className="h-[400px] w-full max-w-md rounded-xl" />
            </div>
        );
    }

    if (user) return null;

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        Ofuq
                    </CardTitle>
                    <CardDescription className="text-base">
                        {mode === "signin"
                            ? "Sign in to your learning workspace"
                            : "Create your Ofuq account"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="m@example.com"
                                                type="email"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                                autoCorrect="off"
                                                disabled={submitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="••••••••"
                                                type="password"
                                                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                                                disabled={submitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button className="w-full" type="submit" disabled={submitting}>
                                {submitting
                                    ? "Loading..."
                                    : mode === "signin"
                                        ? "Sign In"
                                        : "Create Account"}
                            </Button>
                        </form>
                    </Form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        className="w-full"
                        onClick={handleGoogleSignIn}
                        disabled={submitting}
                    >
                        <GoogleIcon className="mr-2 h-4 w-4" />
                        Google
                    </Button>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="link"
                        className="w-full text-sm text-muted-foreground"
                        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                        disabled={submitting}
                    >
                        {mode === "signin"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Sign in"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg role="img" viewBox="0 0 24 24" {...props}>
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );
}
