"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signup } from "../auth/actions"
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Eye,
  Fingerprint,
  Lock,
  Mail,
  MessageSquareText,
  Network,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

const platformSignals = [
  { label: "Conversaciones activas", value: "2,340", delta: "+18.5%", icon: MessageSquareText },
  { label: "Satisfaccion", value: "96%", delta: "Excelente", icon: CheckCircle2 },
  { label: "Flujos conectados", value: "128", delta: "En linea", icon: Network },
]

const accessFeatures = [
  { label: "Chatbots humanizados", icon: Bot },
  { label: "Analitica avanzada", icon: BarChart3 },
  { label: "Seguridad empresarial", icon: ShieldCheck },
]

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070B12]" />}>
      <RegisterExperience />
    </Suspense>
  )
}

function RegisterExperience() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSignup(formData: FormData) {
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!password || password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    setPasswordError("")
    setIsLoading(true)
    try {
      await signup(formData)
    } catch (err) {
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[#070B12] text-white selection:bg-[#00B4DB]/25">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(0,180,219,.18) 0%, transparent 28%, transparent 68%, rgba(255,255,255,.04) 100%)",
          }}
        />
        <div
          className="absolute left-0 right-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,180,219,.7), transparent)" }}
        />
      </div>

      <div className="relative mx-auto grid h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[1.08fr_.92fr]">
        <section className="hidden h-screen flex-col justify-between border-r border-white/10 px-10 py-6 lg:flex xl:px-16">
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center justify-between"
          >
            <Image
              src="/brand/synergia-wordmark-transparent.png"
              alt="Synerg-IA Automation"
              width={204}
              height={108}
              priority
              className="h-auto w-[112px] object-contain opacity-55 mix-blend-screen"
            />
            <div className="flex items-center gap-2 rounded-full border border-[#00B4DB]/20 bg-[#00B4DB]/7 px-3 py-1.5 text-xs font-semibold text-[#9BEAFF] shadow-[0_0_28px_rgba(0,180,219,.08)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00B4DB]" />
              Plataforma inteligente
            </div>
          </motion.header>

          <div className="relative flex min-h-0 max-w-3xl flex-1 flex-col justify-center py-4">
            <div
              className="absolute -left-32 top-20 h-[360px] w-[360px] rounded-full opacity-10 blur-[120px]"
              style={{ background: "radial-gradient(circle, rgba(0,180,219,.22), transparent 68%)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative mb-7"
            >
              <div className="relative inline-flex">
                <Image
                  src="/brand/skylab-horizontal-transparent.png"
                  alt="Skylab Human Bot"
                  width={355}
                  height={125}
                  priority
                  className="relative h-auto w-[330px] object-contain drop-shadow-[0_16px_34px_rgba(0,0,0,.42)] mix-blend-screen xl:w-[360px]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="max-w-2xl"
            >
              <p className="mb-4 text-xs font-bold uppercase text-[#00B4DB] xl:text-sm" style={{ letterSpacing: "0.22em" }}>
                Dashboard SaaS profesional
              </p>
              <h1
                className="max-w-[640px] text-[clamp(3rem,4.05vw,3.75rem)] font-semibold leading-[1.03] text-white"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Controla bots humanos, flujos y datos desde un solo centro.
              </h1>
              <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-[#A6B3C4] xl:text-[15px]">
                Skylab Human Bot ayuda a crear chatbots personalizados, inteligentes y humanizados para equipos que necesitan operar con precision.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.22 }}
              className="mt-6 grid max-w-3xl grid-cols-3 gap-3"
            >
              {platformSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <signal.icon className="h-4 w-4 text-[#00B4DB] xl:h-5 xl:w-5" />
                    <span className="text-[11px] font-bold text-emerald-300">{signal.delta}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{signal.value}</div>
                  <div className="mt-1 text-xs font-medium text-[#7E8A9C]">{signal.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.34 }}
            className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4"
          >
            {accessFeatures.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#00B4DB]/20 bg-[#00B4DB]/8 shadow-[0_0_24px_rgba(0,180,219,.08)]">
                  <feature.icon className="h-4 w-4 text-[#00B4DB]" />
                </div>
                <span className="text-sm font-semibold text-[#D8E1EA]">{feature.label}</span>
              </div>
            ))}
          </motion.footer>
        </section>

        <section className="relative flex h-screen items-center justify-center px-5 py-5 sm:px-8">
          <div
            className="absolute right-[-120px] top-1/2 h-[440px] w-[440px] -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(circle, rgba(0,180,219,.35), transparent 66%)" }}
          />
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[460px]"
          >
            <div className="mb-8 flex items-center justify-center gap-4 lg:hidden">
              <Image
                src="/brand/skylab-horizontal-transparent.png"
                alt="Skylab Human Bot"
                width={355}
                height={125}
                priority
                className="h-auto w-[260px] object-contain mix-blend-screen"
              />
            </div>

            <div className="relative rounded-lg bg-gradient-to-br from-white/16 via-white/5 to-[#00B4DB]/12 p-px shadow-[0_24px_90px_rgba(0,0,0,.42)]">
              <div className="rounded-lg bg-[#0B0F17]/94 p-6 backdrop-blur-xl sm:p-7 xl:p-8">
                <div className="mb-7 flex items-start justify-between gap-4 xl:mb-8">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00B4DB]/20 bg-[#00B4DB]/8 px-3 py-1 text-[11px] font-bold uppercase text-[#9BEAFF] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
                      <Fingerprint className="h-3.5 w-3.5" />
                      Registro seguro
                    </div>
                    <h2 className="text-3xl font-semibold tracking-tight text-white">Crear cuenta</h2>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#8B97A8]">
                      Regístrate para comenzar a usar la consola de Skylab.
                    </p>
                  </div>
                  <div className="hidden items-center justify-center sm:flex">
                    <Image
                      src="/brand/skylab-symbol-transparent.png"
                      alt="Skylab"
                      width={300}
                      height={145}
                      className="h-auto w-16 object-contain opacity-90 drop-shadow-[0_0_24px_rgba(0,180,219,.18)] mix-blend-screen"
                    />
                  </div>
                </div>

                <form className="space-y-4 xl:space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="ml-1 text-xs font-bold uppercase text-[#778397]" style={{ letterSpacing: "0.12em" }}>
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6A7D]" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tu@empresa.com"
                        required
                        className="h-12 rounded-lg border-white/10 bg-[#0B0F17] pl-11 pr-4 text-sm font-semibold text-white placeholder:text-[#576173] focus-visible:border-[#00B4DB]/70 focus-visible:ring-[#00B4DB]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="ml-1 text-xs font-bold uppercase text-[#778397]" style={{ letterSpacing: "0.12em" }}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6A7D]" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        required
                        className="h-12 rounded-lg border-white/10 bg-[#0B0F17] pl-11 pr-12 text-sm font-semibold text-white placeholder:text-[#576173] focus-visible:border-[#00B4DB]/70 focus-visible:ring-[#00B4DB]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6D788A] transition-colors hover:bg-white/[0.05] hover:text-white"
                        aria-label="Mostrar contraseña"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="ml-1 text-xs font-bold uppercase text-[#778397]" style={{ letterSpacing: "0.12em" }}>
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6A7D]" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repite tu contraseña"
                        required
                        className="h-12 rounded-lg border-white/10 bg-[#0B0F17] pl-11 pr-12 text-sm font-semibold text-white placeholder:text-[#576173] focus-visible:border-[#00B4DB]/70 focus-visible:ring-[#00B4DB]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6D788A] transition-colors hover:bg-white/[0.05] hover:text-white"
                        aria-label="Mostrar contraseña"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(message || passwordError) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold text-red-200"
                      >
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>{passwordError || message}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    formAction={handleSignup}
                    className="h-12 w-full rounded-lg bg-[#00B4DB] text-sm font-black text-[#061018] shadow-[0_16px_42px_rgba(0,180,219,.22)] transition-all hover:bg-[#26C7EA]"
                  >
                    {isLoading ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 animate-pulse" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        Registrarse
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 border-t border-white/10 pt-5 xl:mt-8 xl:pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="text-center text-xs font-semibold text-[#8B97A8]">
                      ¿Ya tienes cuenta?{" "}
                      <Link href="/login" className="text-[#00B4DB] font-bold hover:opacity-80">
                        Inicia sesión →
                      </Link>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#7E8A9C]">
                        <Image
                          src="/brand/synergia-symbol-transparent.png"
                          alt="Synerg-IA"
                          width={420}
                          height={290}
                          className="h-5 w-8 object-contain object-center opacity-80 mix-blend-screen"
                        />
                        Producto de Synerg-IA Automation
                      </div>
                      <Link href="#" className="text-xs font-bold text-[#00B4DB] hover:opacity-80">
                        Privacidad
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}