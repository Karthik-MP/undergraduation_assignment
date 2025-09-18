"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

// Debug network requests in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    console.log("Network request:", args[0]);
    return originalFetch(...args);
  };
}
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { signupWithEmail } from "@/services/auth/signup";
// --- validation schema ---
const SignupSchema = z
  .object({
    fullName: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    phone: z
      .string()
      .min(7, "Phone number looks too short")
      .max(20, "Phone number looks too long"),
    country: z.string().min(1, "Select your country"),
    grade: z.enum(["9", "10", "11", "12", "UG", "PG"], {
      errorMap: () => ({ message: "Select your grade" }),
    }),
    // agree: z.boolean().refine((v) => v === true, {
    //   message: "You must agree to the Terms & Privacy",
    // }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// type SignupForm = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    getValues,
  } = useForm({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      country: "",
      grade: undefined,
      agree: false,
    },
    mode: "onBlur",
  });

  // Debug form state
  console.log("Form State:", {
    isValid,
    isDirty,
    isSubmitting,
    errors,
    currentValues: getValues(),
  });

  const onSubmit = async (values) => {
    // Debug logging
    console.log("Form submitted with values:", values);
    try {
      console.log("Attempting to sign up with email...");
      await signupWithEmail(values);

      // 4) (Optional) persist extra profile fields in Firestore if you want:
      // import { db } from "@/lib/firebase";
      // import { doc, setDoc, serverTimestamp } from "firebase/firestore";
      // await setDoc(doc(db, "users", cred.user.uid), {
      //   fullName: values.fullName,
      //   email: values.email,
      //   phone: values.phone,
      //   country: values.country,
      //   grade: values.grade,
      //   createdAt: serverTimestamp(),
      // });

      toast.success("Account created 🎉", "We’ve sent a verification email. Redirecting…");

      router.push("/login");
    } catch (err) {
      // Friendly error mapping
      console.log("Signup error:", err);
      const msg =
        err?.code === "auth/email-already-in-use"
          ? "This email is already in use."
          : err?.code === "auth/weak-password"
          ? "Password is too weak."
          : err?.code === "auth/invalid-email"
          ? "Invalid email address."
          : "Signup failed. Please try again.";

      toast.error("Signup error", msg);
    }
  };

  // Debug any re-renders
  console.log("SignupPage rendering");

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-indigo-700">
            Create your account
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            Join us and get started today
          </p>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              console.log("Raw form submit event triggered");
              handleSubmit((data) => {
                console.log("Form validation passed", data);
                onSubmit(data);
              })(e);
            }}
            className="space-y-5"
          >
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="focus-visible:ring-indigo-500"
              />
              {errors.email && (
                <p className="text-red-600 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="flex space-x-4">
              {/* Full Name */}
              <div className="w-1/2 space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  {...register("fullName")}
                  className="focus-visible:ring-indigo-500"
                />
                {errors.fullName && (
                  <p className="text-red-600 text-sm">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="w-1/2 space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 555 5555"
                  {...register("phone")}
                  className="focus-visible:ring-indigo-500"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              {/* Country */}
              <div className="w-1/2 space-y-2">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  {...register("country")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="IN">India</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  {/* add more as needed */}
                </select>
                {errors.country && (
                  <p className="text-red-600 text-sm">
                    {errors.country.message}
                  </p>
                )}
              </div>

              {/* Grade */}
              <div className="w-1/2 space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <select
                  id="grade"
                  {...register("grade")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <option value="">Select grade</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                  <option value="UG">Undergraduate</option>
                  <option value="PG">Postgraduate</option>
                </select>
                {errors.grade && (
                  <p className="text-red-600 text-sm">{errors.grade.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="focus-visible:ring-indigo-500"
              />
              {errors.password && (
                <p className="text-red-600 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="focus-visible:ring-indigo-500"
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Agree to T&C */}
            {/* <div className="flex items-center gap-2">
              <Checkbox id="agree" {...register("agree")} />
              <Label htmlFor="agree" className="text-sm text-gray-700">
                I agree to the{" "}
                <a className="underline" href="/terms" target="_blank">
                  Terms
                </a>{" "}
                and{" "}
                <a className="underline" href="/privacy" target="_blank">
                  Privacy Policy
                </a>
                .
              </Label>
            </div>
            {errors.agree && (
              <p className="text-red-600 text-sm">{errors.agree.message}</p>
            )} */}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>

            {/* Redirect to login */}
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <span
                onClick={() => router.push("/login")}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Sign In
              </span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
