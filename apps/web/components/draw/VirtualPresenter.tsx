"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Sparkles, Video, Wifi } from "lucide-react";
import Image from "next/image";

interface VirtualPresenterProps {
    text: string;
    isSpeaking: boolean;
    videoUrl?: string; // Optional: If provided, plays video. If not, shows image.
}

export function VirtualPresenter({ text, isSpeaking, videoUrl }: VirtualPresenterProps) {
    return (
        <div className="w-full max-w-4xl mx-auto mb-8 flex flex-col items-center z-30">
            <div className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-2xl overflow-hidden shadow-2xl relative w-full flex flex-col md:flex-row min-h-[160px]">

                {/* Presenter Visual Area (Video or Image) */}
                <div className="relative w-full md:w-[240px] h-[240px] md:h-auto flex-shrink-0 bg-black overflow-hidden border-b md:border-b-0 md:border-r border-primary/10">
                    {/* Live Indicator */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                        <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                        {isSpeaking ? 'AO VIVO' : 'EM ESPERA'}
                    </div>

                    {videoUrl ? (
                        <video
                            src={videoUrl}
                            autoPlay
                            loop
                            muted
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full relative bg-white/0 flex items-end justify-center overflow-visible">
                            {/* Placeholder Image with Talking Animation */}
                            <div className={`relative w-full h-full transition-transform duration-100 origin-bottom ${isSpeaking ? 'animate-talk-bounce' : ''}`}>
                                <Image
                                    src="/presenter.png"
                                    alt="Apresentadora Virtual"
                                    fill
                                    className={`object-contain object-bottom mix-blend-multiply`}
                                    priority
                                />
                            </div>

                            {/* Speaking Overlay Effect (Subtle glow) */}
                            {isSpeaking && (
                                <motion.div
                                    className="absolute inset-x-0 bottom-0 h-1/3 bg-primary/20 blur-xl rounded-full"
                                    animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 0.8] }}
                                    transition={{ repeat: Infinity, duration: 0.4 }}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Dialogue Bubble Area */}
                <div className="flex-1 p-6 flex flex-col justify-center relative bg-gradient-to-r from-background to-muted/20">
                    <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground flex items-center gap-1 opacity-50">
                        <Wifi className="w-3 h-3" />
                        Sinal HD
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={text}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-col gap-2"
                        >
                            <span className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                Apresentadora Virtual
                            </span>
                            <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">
                                "{text}"
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Disclaimer for Video API */}
            {!videoUrl && (
                <p className="mt-2 text-[10px] text-muted-foreground opacity-40 text-center w-full">
                    *Para vídeo real-time (Lip-Sync), integrar API HeyGen/D-ID.
                </p>
            )}
        </div>
    );
}
