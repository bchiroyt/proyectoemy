import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/context/useAuthStore";
import { Card } from "@/components/ui/card";
import { User, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, LogIn } from "lucide-react";
import { useLoginMutation } from "@/hooks/queries/useSeguridadQueries";
import { buildSessionUser } from "@/lib/apiNormalizer";
import { getApiErrorMessage } from "@/lib/apiClient";
import logo1Img from "@/assets/logo1.jpeg";
import logoImg from "@/assets/tran1.png";

//Utilitario para fusionar clases
const cn = (...classes) => classes.filter(Boolean).join(' ');

const LoginPage = () => {
  const setLogin = useAuthStore((state) => state.setLogin);
  const loginMut = useLoginMutation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  // Validaciones en tiempo real
  useEffect(() => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
    } else {
      setErrors({});
    }
  }, [formData]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleBlur = (e) => {
    const { id } = e.target;
    setTouched(prev => ({ ...prev, [id]: true }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setApiError("");

    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    try {
      const { token, usuario } = await loginMut.mutateAsync({
        email: result.data.email,
        password: result.data.password,
      });
      if (!token) {
        setApiError("El servidor no devolvió un token de acceso. Revisa la respuesta del endpoint de login.");
        return;
      }
      const user = buildSessionUser(usuario);
      setLogin(user, token);
      navigate("/panel-control", { replace: true });
    } catch (err) {
      setApiError(getApiErrorMessage(err, "No se pudo iniciar sesión. Verifica credenciales y conexión HTTPS."));
    }
  };

  // Helper properties to determine visual states
  const emailInvalid = touched.email && errors.email;
  const emailValid = touched.email && !errors.email && formData.email.length > 0;

  const passwordInvalid = touched.password && errors.password;
  const passwordValid = touched.password && !errors.password && formData.password.length > 0;

  return (
    <div className="flex min-h-screen h-screen w-full overflow-hidden bg-(--color-gris-claro)">

      {/* SECCION IZQUIERDA */}
      <div className="hidden lg:flex flex-col w-[45%] bg-(--color-pagina) p-10 justify-center items-center relative overflow-hidden border-radius: 91% 9% 100% 0% / 0% 100% 0% 100%">
        {/* border-radius: 91% 9% 100% 0% / 0% 100% 0% 100%;   style={{ borderRadius: '91% 9% 100% 0% / 0% 100% 0% 100%' }}*/}
        <div className="flex flex-col items-center max-w-lg z-10 text-center">
          <div className="flex gap-2 text-3xl mb-6">
            <span>👗</span>
            <span>👜</span>
            <span>💎</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-(--color-blanco) mb-4 shadow-sm">BIENVENIDO</h1>

          <p className="text-(--color-blanco)/90 text-sm xl:text-base mb-10 w-4/5 leading-relaxed font-light">
            Explora lo último en tendencias y accesorios exclusivos para tu sistema de gestión.
          </p>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-(--color-blanco)/20 mb-8 w-full max-w-[360px] aspect-ratio: 5/3">
            <img
              src={logo1Img}
              alt="Estilo y Elegancia"
              className="w-full h-full object-cover"
            />
          </div>

          <p className="text-(--color-blanco)/80 italic text-sm">
            "Estilo y Elegancia en cada clic"
          </p>
        </div>

        {/* Decoraciones circulares de fondo */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-(--color-blanco)/5 rounded-full pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-(--color-blanco)/5 rounded-full pointer-events-none" />
      </div>

      {/* Seccion derecha - Formulario de inicio de sesion */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative bg-(--color-pagina-3)">
        <div className="mb-8 text-center flex flex-col items-center">
          <h2 className="text-2xl font-black text-(--color-negro)">Modas y Variedades EMY</h2>
          <p className="text-(--color-gris-letra) text-sm font-medium">Sistema de Punto de Venta</p>
        </div>

        <Card className="w-full max-w-[400px] shadow-2xl shadow-(--color-gris-letra)/50 border-0 rounded-3xl p-8 bg-(--color-blanco) relative z-10">
          <div className="flex flex-col items-center mb-6">
            <img src={logoImg} alt="Logo EMY" className="h-16 mb-4 object-contain" />
            <h3 className="text-2xl font-bold text-(--color-pagina-2) mb-1">Inicia Sesión</h3>
            <p className="text-[13px] text-(--color-gris-letra)">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Correo Electronico Input */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[11px] font-bold text-(--color-pagina-2) tracking-wider uppercase">
                Correo Electrónico
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={cn("h-4 w-4", emailInvalid ? "text-(--color-rojo)" : emailValid ? "text-(--color-pagina-2)" : "text-(--color-pagina)")} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@emy.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={cn(
                    "pl-10 h-11 rounded-xl shadow-sm text-sm transition-colors",
                    emailInvalid ? "border-(--color-rojo) bg-(--color-rojo)/5 text-(--color-rojo-obscuro)/70 placeholder:text-(--color-rojo)/200 focus-visible:ring-(--color-rojo)/80" :
                      emailValid ? "border-(--color-pagina-2)/50 bg-(--color-pagina-2)/5 text-(--color-pagina-2) focus-visible:ring-(--color-pagina-2)" :
                        "border-(--color-gris-claro)/30 placeholder:text-(--color-gris-letra)/40 focus-visible:ring-(--color-pagina)/30 focus-visible:border-(--color-pagina)"
                  )}
                />
                {/* Icono de validación a la derecha */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {emailInvalid && <AlertCircle className="h-[18px] w-[18px] text-(--color-rojo)" />}
                  {emailValid && <CheckCircle2 className="h-[18px] w-[18px] text-(--color-pagina-2) fill-(--color-pagina-2)/10" />}
                </div>
              </div>
              {emailInvalid && <p className="text-xs text-(--color-rojo) font-medium pl-1">{errors.email[0]}</p>}
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11px] font-bold text-(--color-pagina-2) tracking-wider uppercase">
                  Contraseña
                </Label>
                <a href="#" className="text-[11px] text-(--color-pagina) hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={cn("h-4 w-4", passwordInvalid ? "text-(--color-rojo)" : passwordValid ? "text-(--color-pagina-2)" : "text-(--color-pagina)")} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={cn(
                    "pl-10 pr-10 h-11 rounded-xl shadow-sm text-sm transition-colors",
                    passwordInvalid ? "border-(--color-rojo) bg-(--color-rojo)/5 text-(--color-rojo-obscuro)/70 placeholder:text-(--color-rojo)/200 focus-visible:ring-(--color-rojo)/80" :
                      passwordValid ? "border-(--color-pagina-2)/50 bg-(--color-pagina-2)/5 text-(--color-pagina-2) focus-visible:ring-(--color-pagina-2)" :
                        "border-(--color-gris-claro)/30 placeholder:text-(--color-gris-letra)/40 focus-visible:ring-(--color-pagina)/30 focus-visible:border-(--color-pagina)"
                  )}

                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10 bg-transparent"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>

                {/* Validation Indicator placed slightly inside from the eye icon */}
                <div className="absolute inset-y-0 right-8 pr-1 flex items-center pointer-events-none">
                  {passwordInvalid && <AlertCircle className="h-[18px] w-[18px] text-(--color-rojo)" />}
                  {passwordValid && <CheckCircle2 className="h-[18px] w-[18px] text-(--color-pagina-2) fill-(--color-pagina-2)/10" />}
                </div>
              </div>
              {passwordInvalid && <p className="text-xs text-(--color-rojo) font-medium pl-1">{errors.password[0]}</p>}
            </div>

            {apiError ? (
              <p className="rounded-lg border border-(--color-rojo)/30 bg-(--color-rojo)/5 px-3 py-2 text-xs font-medium text-(--color-rojo-obscuro)">
                {apiError}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loginMut.isPending}
              className="w-full bg-(--color-pagina) cursor-pointer hover:bg-(--color-borde-button) text-(--color-blanco) rounded-xl h-12 mt-6 font-semibold shadow-(--color-pagina)/50 transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-70"
            >
              {loginMut.isPending ? "Conectando…" : "Iniciar Sesión"}
              <LogIn className="ml-2 w-[18px] h-[18px]" />
            </Button>

          </form>

          <div className="mt-8 pt-4 text-center">
            <span className="text-[10px] font-bold tracking-[0.2em] text-(--color-gris-letra) uppercase">
              Estilo y Elegancia
            </span>
          </div>
        </Card>

        {/* Global Footer */}
        <div className="w-full text-center mt-10">
          <p className="text-[11px] text-(--color-gris-letra)">
            © 2026 Modas y Variedades EMY. Todos los derechos reservados.
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;