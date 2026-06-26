'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';

interface CalcomSetupFormProps {
    onSuccess?: () => void;
    initialApiKey?: string;
    initialEventTypeId?: string;
}

export default function CalcomSetupForm({ onSuccess, initialApiKey = '', initialEventTypeId = '' }: CalcomSetupFormProps) {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [eventTypeId, setEventTypeId] = useState(initialEventTypeId);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!apiKey.trim() || !eventTypeId.trim()) {
            toast.error('Por favor completa todos los campos.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/calendar/calcom/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: apiKey.trim(),
                    eventTypeId: eventTypeId.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al conectar con Cal.com');
            }

            toast.success('¡Conectado exitosamente con Cal.com!');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('[FAST-ORDER-INV] Error connecting Cal.com:', error);
            toast.error(error.message || 'Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Conectar Cal.com</CardTitle>
                            <CardDescription>
                                Configura tu cuenta externa de Cal.com utilizando tu API Key personal.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey" className="text-sm font-medium">Cal.com API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder="cal_live_..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="font-mono bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-amber-500"
                            disabled={loading}
                        />
                        <p className="text-xs text-zinc-500">
                            Obtén tu API key en Cal.com → Settings → Developer → API Keys.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="eventTypeId" className="text-sm font-medium">Event Type ID o Slug</Label>
                        <Input
                            id="eventTypeId"
                            type="text"
                            placeholder="Ej: 123456"
                            value={eventTypeId}
                            onChange={(e) => setEventTypeId(e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-amber-500"
                            disabled={loading}
                        />
                        <p className="text-xs text-zinc-500">
                            El ID del tipo de evento (reunión) que el bot utilizará para agendar.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validando...
                            </>
                        ) : (
                            'Conectar Calendario'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
