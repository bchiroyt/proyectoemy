import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Search, Settings, ChevronLeft, ChevronRight, Edit2, Trash2, User } from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";

const usuariosMock = [
    { id: '1', codigo: 'US-0001', nombre: 'Carlos Chipin', cargo: 'Administrador', telefono: '+502 1212 1212', correo: 'ejemplo@gmail.com', estado: 'Activo' },
    { id: '2', codigo: 'US-0002', nombre: 'Irma Elizabeth Chiroy Pocop', cargo: 'Administrador', telefono: '+502 1212 1212', correo: 'ejemplo@gmail.com', estado: 'Activo' },
    { id: '3', codigo: 'US-0003', nombre: 'Luis Luis Morales Morales', cargo: 'Cajero', telefono: '+502 1212 1212', correo: 'ejemplo@gmail.com', estado: 'Activo' },
    { id: '4', codigo: 'US-0004', nombre: 'Marta Julia Gómez García', cargo: 'Cajero', telefono: '+502 1212 1212', correo: 'ejemplo@gmail.com', estado: 'Activo' },
];

const Usuarios = () => {
    const [openCommand, setOpenCommand] = useState(false);
    const setTitulo = useNavigationStore((state) => state.setTitulo);
    
    useEffect(() => {
        setTitulo("Usuarios");
    }, [setTitulo]);


    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpenCommand((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <div className="flex flex-col h-full bg-(--color-fondo-pagina)">

            <div className="p-6 max-w-7xl mx-auto w-full">
                {/* Toolbar superior */}
                <div className="flex items-center justify-between bg-(--color-blanco) p-3 rounded-t-lg shadow-sm">

                    {/* Botón Nuevo Usuario - Color Verde de index.css */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-(--color-pagina-2) hover:bg-(--color-pagina-2)/90 text-(--color-blanco) rounded font-bold h-10 px-5 transition-transform active:scale-95">
                                Nuevo Usuario <Plus className="ml-1 w-5 h-5" />
                            </Button>
                        </DialogTrigger>
                        {/* Este es el dialog para registrar un nuevo usuario es decir el modal */}
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-(--color-pagina-2)">Registrar Nuevo Usuario</DialogTitle>
                                <DialogDescription>
                                    Llena los datos a continuación para registrar un usuario.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre" className="text-xs font-bold text-(--color-pagina) uppercase">Nombre Completo</Label>
                                    <Input id="nombre" placeholder="Ej. Juan Pérez" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cargo" className="text-xs font-bold text-(--color-pagina) uppercase">Cargo</Label>
                                    <Input id="cargo" placeholder="Administrador / Cajero" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="correo" className="text-xs font-bold text-(--color-pagina) uppercase">Correo Electrónico</Label>
                                    <Input id="correo" type="email" placeholder="correo@emy.com" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="telefono" className="text-xs font-bold text-(--color-pagina) uppercase">Teléfono</Label>
                                    <Input id="telefono" placeholder="+502 0000 0000" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button className="bg-(--color-pagina) hover:bg-(--color-borde-button) text-white font-bold w-full rounded-xl">
                                    Guardar <Plus className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Barra de Búsqueda usando Command Dialog */}
                    <div className="flex-1 flex justify-center max-w-md mx-6">
                        <div
                            className="flex items-center bg-[#d0e6e6] hover:bg-[#c1dddd] transition-colors text-gray-600 rounded-md px-3 py-2 cursor-text w-full shadow-inner"
                            onClick={() => setOpenCommand(true)}
                        >
                            <Search className="w-5 h-5 mr-3 text-gray-700" />
                            <span className="text-sm font-medium">Buscar...</span>
                            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-400 bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>

                        <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
                            <CommandInput placeholder="Busca por nombre, código o cargo..." />
                            <CommandList>
                                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                <CommandGroup heading="Usuarios">
                                    {usuariosMock.map((user) => (
                                        <CommandItem key={user.id} onSelect={() => setOpenCommand(false)} className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>{user.nombre}</span>
                                            <span className="ml-auto text-xs text-gray-500">{user.cargo}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </CommandDialog>
                    </div>

                    {/* Controles de Configuración y Paginación */}
                    <div className="flex items-center gap-4 text-gray-600">
                        <Settings className="w-6 h-6 cursor-pointer hover:text-gray-800 transition-colors" />
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <span>1-2 / 2</span>
                            <div className="flex">
                                <button className="bg-gray-400 hover:bg-gray-500 text-white p-1 rounded-l disabled:opacity-50">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button className="bg-(--color-pagina-2) hover:bg-(--color-pagina-2)/90 text-white p-1 rounded-r disabled:opacity-50">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla de Usuarios */}
                <div className="bg-(--color-blanco) shadow-sm rounded-b-lg overflow-hidden border-t">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[80px] text-center font-bold text-gray-900"></TableHead>
                                <TableHead className="font-bold text-gray-900">Código</TableHead>
                                <TableHead className="font-bold text-gray-900">Nombre</TableHead>
                                <TableHead className="font-bold text-gray-900">Cargo</TableHead>
                                <TableHead className="font-bold text-gray-900">Teléfono</TableHead>
                                <TableHead className="font-bold text-gray-900">Correo</TableHead>
                                <TableHead className="font-bold text-gray-900">Estado</TableHead>
                                <TableHead className="text-center font-bold text-gray-900">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usuariosMock.map((user) => (
                                <TableRow key={user.id} className="hover:bg-gray-50/50">
                                    <TableCell className="text-center">
                                        <div className="w-10 h-10 border border-black rounded-full flex items-center justify-center mx-auto">
                                            <User className="w-6 h-6 text-black" strokeWidth={1} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs font-semibold text-gray-600">{user.codigo}</TableCell>
                                    <TableCell className="font-bold text-black">{user.nombre}</TableCell>
                                    <TableCell className="text-xs font-bold text-gray-800">{user.cargo}</TableCell>
                                    <TableCell className="text-xs text-gray-400 font-medium">{user.telefono}</TableCell>
                                    <TableCell className="text-xs text-gray-400 font-medium">{user.correo}</TableCell>
                                    <TableCell className="text-xs text-gray-500">{user.estado}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-center bg-(--color-pagina-2) rounded-full p-1 border-2 border-green-900/10 w-fit mx-auto overflow-hidden">
                                            <button className="p-1 text-white hover:opacity-80 transition-opacity">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="w-px h-auto bg-white/30 mx-0.5"></div>
                                            <button className="bg-black p-1 text-white rounded-r-full -mr-1 hover:opacity-80 transition-opacity">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default Usuarios;
