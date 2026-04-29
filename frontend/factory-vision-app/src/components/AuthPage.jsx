import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Lock, Mail } from "lucide-react";

export default function AuthPage({ onSubmit  }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [users, setUsers] = useState([]); // For demo purposes, to store registered users

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isLogin) {
      // Check if user already exists
      const exists = users.find(u => u.email === form.email);
      if (exists) {
        alert("User already exists");
        return;
      }

      // Add new user
      setUsers(prevUsers => [...prevUsers, form]);

      // Reset form
      setForm({ name: "", email: "", password: "" });

      // Switch to login
      setIsLogin(true);
    } else {
      // Login logic
      const user = users.find(
        u => u.email === form.email && u.password === form.password
      );

      if (user) {
        console.log("Login successful");
        onSubmit && onSubmit();
      } else {
        alert("Invalid credentials");
      }
    }

    // onSubmit && onSubmit();
    // 👉 Replace with your API call
    // console.log(isLogin ? "Login" : "Signup", form);

    // onAuthSuccess && onAuthSuccess();

    console.log("users", users);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#16191E] border border-white/10 rounded-2xl p-8 shadow-xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-white/40 text-sm mt-2">
            {isLogin
              ? "Login to continue inspection"
              : "Sign up to start using iDETECT"}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg text-sm transition ${
              isLogin ? "bg-blue-600 text-white" : "text-white/40"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg text-sm transition ${
              !isLogin ? "bg-blue-600 text-white" : "text-white/40"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <User className="w-4 h-4 text-white/40" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="bg-transparent outline-none text-sm w-full"
                required
              />
            </div>
          )}

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Mail className="w-4 h-4 text-white/40" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="bg-transparent outline-none text-sm w-full"
              required
            />
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Lock className="w-4 h-4 text-white/40" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="bg-transparent outline-none text-sm w-full"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            {isLogin ? "LOGIN" : "CREATE ACCOUNT"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 cursor-pointer hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </motion.div>
    </div>
  );
}