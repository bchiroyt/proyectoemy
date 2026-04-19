import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigationStore } from "@/context/useNavigationStore";
import { ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Activity } from "lucide-react";

// Helper
const cn = (...classes) => classes.filter(Boolean).join(' ');

const HomePage = () => {
    const setTitulo = useNavigationStore((s) => s.setTitulo);

    useEffect(() => {
        setTitulo("Dashboard");
    }, [setTitulo]);

    // Datos de ejemplo
    const stats = [
        { 
            title: "Ventas Totales", 
            value: "Q 12,450.00", 
            icon: <CreditCard className="w-5 h-5 text-[#E8307E]" />, 
            trend: "+12.5%", 
            up: true,
            bgIcon: "bg-[#E8307E]/10"
        },
        { 
            title: "Pedidos Aprobados", 
            value: "156", 
            icon: <ShoppingCart className="w-5 h-5 text-[#516E27]" />, 
            trend: "+8.2%", 
            up: true,
            bgIcon: "bg-[#516E27]/10"
        },
        { 
            title: "Nuevos Clientes", 
            value: "32", 
            icon: <Users className="w-5 h-5 text-blue-500" />, 
            trend: "-2.4%", 
            up: false,
            bgIcon: "bg-blue-500/10"
        },
        { 
            title: "Productos Activos", 
            value: "842", 
            icon: <Package className="w-5 h-5 text-orange-500" />, 
            trend: "+1.2%", 
            up: true,
            bgIcon: "bg-orange-500/10"
        },
    ];

    return (
        <div className="h-full min-h-0 overflow-y-auto overscroll-contain space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Bienvenido al Dashboard</h1>
                    <p className="text-gray-500 mt-1">Resumen general de Modas y Variedades EMY.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium px-4 py-2 bg-white border border-gray-100 rounded-full text-gray-600 shadow-sm">
                        Hoy: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Rejilla de Tarjetas de Resumen */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-0 shadow-sm rounded-2xl bg-white hover:shadow-md transition-all relative overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-gray-500">
                                {stat.title}
                            </CardTitle>
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.bgIcon)}>
                                {stat.icon}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-gray-800">{stat.value}</div>
                            <div className="flex items-center mt-2">
                                <span className={cn(
                                    "flex items-center text-xs font-bold px-2 py-0.5 rounded-full",
                                    stat.up ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                                )}>
                                    {stat.up ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {stat.trend}
                                </span>
                                <span className="text-xs text-gray-400 ml-2 font-medium">vs el mes anterior</span>
                            </div>
                        </CardContent>
                        {/* Indicador de color lateral sutil */}
                        <div className="absolute top-0 bottom-0 left-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: index === 0 ? '#E8307E' : index === 1 ? '#516E27' : index === 2 ? '#3b82f6' : '#f97316' }}></div>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Gráfico / Espacio Principal */}
                <Card className="md:col-span-4 lg:col-span-5 border-0 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col min-h-[400px]">
                    <CardHeader className="border-b border-gray-50 bg-gray-50/50 py-4">
                        <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#E8307E]" />
                            Resumen de Ventas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-8 flex items-center justify-center bg-gradient-to-br from-white to-gray-50/50">
                        <div className="text-center space-y-4 max-w-sm">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 inner-shadow">
                                <TrendingUp className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">Aún no hay datos suficientes</h3>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                El gráfico de rendimiento general se generará automáticamente a medida que registres más ventas esta semana.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actividad Reciente */}
                <Card className="md:col-span-3 lg:col-span-2 border-0 shadow-sm rounded-2xl bg-white flex flex-col">
                    <CardHeader className="border-b border-gray-50 bg-gray-50/50 py-4">
                        <CardTitle className="text-lg font-bold text-gray-800">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto">
                        <div className="flex flex-col divide-y divide-gray-50">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-[#516E27]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <ShoppingCart className="w-5 h-5 text-[#516E27]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#E8307E] transition-colors">Venta #100{i}</p>
                                        <p className="text-xs text-gray-500 font-medium">Hace {i * 2} horas</p>
                                    </div>
                                    <div className="text-sm font-black text-gray-800">
                                        +Q{(i * 120).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HomePage;