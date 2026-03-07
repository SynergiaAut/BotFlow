"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTenant } from "../auth/tenant-actions"
import { Building2, Loader2, LogOut } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { signout } from "../auth/actions"

export default function OnboardingPage() {
    const searchParams = useSearchParams()
    const errorMsg = searchParams.get("error")
    const [isLoading, setIsLoading] = useState(false)

    async function handleAction(formData: FormData) {
        setIsLoading(true)
        await createTenant(formData)
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

            {/* Logout corner button */}
            <div className="absolute top-6 right-6 z-20">
                <form action={signout}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                        <LogOut className="w-4 h-4 mr-2" />
                        Salir de la cuenta
                    </Button>
                </form>
            </div>

            <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl z-10 flex flex-col gap-6">

                <div className="flex flex-col items-center gap-2 mb-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                        <Building2 size={28} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Crea tu Entorno</h1>
                    <p className="text-sm text-muted-foreground">Configura el espacio de trabajo para tu empresa y tus Bots de Inteligencia Artificial.</p>
                </div>

                <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="companyName">Nombre de la Empresa</Label>
                        <Input
                            id="companyName"
                            name="companyName"
                            type="text"
                            placeholder="Ej: Agencia Fractal, Tienda Paisa..."
                            required
                            className="bg-black/20 border-white/10 focus-visible:ring-primary/50"
                        />
                    </div>

                    {errorMsg && (
                        <div className="p-3 mt-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-500/90 text-sm text-center">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-6">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            formAction={handleAction}
                            className="w-full rounded-full shadow-lg bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25 transition-all"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Comenzar a usar BotFlow
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    )
}
