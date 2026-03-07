import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, signup } from "../auth/actions"
import { Bot } from "lucide-react"
import Link from "next/link"

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
    const searchParams = await props.searchParams;
    const message = searchParams?.message

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl z-10 flex flex-col gap-6">

                <div className="flex flex-col items-center gap-2 mb-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-2">
                        <Bot size={28} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Bienvenido a BotFlow</h1>
                    <p className="text-sm text-muted-foreground">Log in a tu cuenta de sistema</p>
                </div>

                <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">Email Corporativo</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="tu@empresa.com"
                            required
                            className="bg-black/20 border-white/10 focus-visible:ring-primary/50"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            className="bg-black/20 border-white/10 focus-visible:ring-primary/50"
                        />
                    </div>

                    {message && (
                        <div className="p-3 mt-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-500/90 text-sm text-center">
                            {message}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-4">
                        <Button formAction={login} className="w-full rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                            Ingresar
                        </Button>
                        <Button formAction={signup} variant="outline" className="w-full rounded-full border-white/10 bg-transparent hover:bg-white/5">
                            Solicitar Acceso
                        </Button>
                    </div>
                </form>

                <div className="text-center text-xs text-muted-foreground mt-4">
                    Al continuar aceptas nuestros <Link href="#" className="underline underline-offset-4 hover:text-primary">Términos de servicio</Link> y <Link href="#" className="underline underline-offset-4 hover:text-primary">Políticas de Privacidad</Link>.
                </div>

            </div>
        </div>
    )
}
