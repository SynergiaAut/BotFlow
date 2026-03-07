"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/20 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center max-w-3xl"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          El Chatbot que pasa el <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Test de Turing
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
          Plataforma SaaS con Gemini RAG, humanización inteligente y un CRM Multicanal nativo (WhatsApp, Telegram, Web).
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-primary text-primary-foreground font-medium rounded-full shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
          >
            Comenzar Prueba Gratis
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-secondary text-secondary-foreground font-medium rounded-full shadow-sm hover:bg-secondary/80 transition-colors"
          >
            Ver Dashboard
          </motion.button>
        </div>
      </motion.div>

      {/* Glassmorphism Card Element Demo */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="mt-20 z-10 w-full max-w-4xl p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="text-xs text-muted-foreground font-mono">BotFlow CRM Preview</div>
        </div>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          [ CRM Unified Inbox Interface ]
        </div>
      </motion.div>
    </div>
  );
}
