import React from 'react';

export function MisionVision() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-1/4 left-0 w-64 h-64 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
                <div className="absolute top-1/3 right-0 w-64 h-64 bg-teal-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                    {/* Misión Card */}
                    <div className="relative group h-full">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity blur-lg" />
                        <div className="relative h-full bg-white p-8 lg:p-10 rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-900/5 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300 flex flex-col">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 text-emerald-600 transform group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">
                                Nuestra Misión
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed flex-grow">
                                Impulsar el desarrollo económico sostenible de las comunidades indígenas a través de un
                                <span className="text-emerald-700 font-medium"> Marketplace especializado</span>, integrando
                                tecnología de punta como <span className="text-emerald-700 font-medium">reconocimiento de imágenes</span> y
                                <span className="text-emerald-700 font-medium"> traducción automática (texto/audio)</span> para
                                derribar barreras lingüísticas y preservar la riqueza cultural del Amazonas.
                            </p>
                        </div>
                    </div>

                    {/* Visión Card */}
                    <div className="relative group h-full">
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity blur-lg" />
                        <div className="relative h-full bg-white p-8 lg:p-10 rounded-2xl border border-teal-100 shadow-xl shadow-teal-900/5 hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300 flex flex-col">
                            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-8 text-teal-600 transform group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">
                                Nuestra Visión
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed flex-grow">
                                Ser la plataforma líder en <span className="text-teal-700 font-medium">innovación tecnológica para la Amazonía</span>,
                                donde la IA y el comercio digital potencian la autonomía de los pueblos originarios,
                                permitiendo que su sabiduría y productos lleguen al mundo sin intermediarios y en su propia lengua.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
