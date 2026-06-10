import { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle2, XCircle, Activity, Server, RotateCcw } from 'lucide-react';

export default function RateLimiterSim() {
  const [m, setM] = useState(3);
  const [t, setT] = useState(10);
  const [time, setTime] = useState(0);
  
  const [queue, setQueue] = useState<number[]>([]);
  // allRequests keeps both accepted and rejected for the visual timeline animation
  const [allRequests, setAllRequests] = useState<{id: number, time: number, status: 'Aceptada' | 'Rechazada'}[]>([]);
  const [logs, setLogs] = useState<{id: number, time: number, status: string}[]>([]);
  const [stats, setStats] = useState({ accepted: 0, rejected: 0 });
  const [flash, setFlash] = useState<'accept' | 'reject' | null>(null);

  // Reloj interno que avanza cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Limpieza automática de la cola y la animación
  useEffect(() => {
    const windowStart = time - t;
    
    // Limpiar cola real
    setQueue(prevQueue => prevQueue.filter(ts => ts > windowStart));
    
    // Limpiar animación visual (les damos 1 segundo extra para que terminen de salir de la pantalla)
    setAllRequests(prev => prev.filter(req => req.time > windowStart - 1));
  }, [time, t]);

  const handleReset = () => {
    setTime(0);
    setQueue([]);
    setAllRequests([]);
    setLogs([]);
    setStats({ accepted: 0, rejected: 0 });
    setFlash(null);
  };

  const handleRequest = () => {
    const windowStart = time - t;
    
    // 1. Limpiamos la cola manualmente en el instante del clic (tal como en 2.go)
    const cleanQueue = queue.filter(ts => ts > windowStart);

    // 2. Evaluamos la petición: si hay menos elementos que M, es aceptada
    if (cleanQueue.length < m) {
      setQueue([...cleanQueue, time]);
      setStats(s => ({ ...s, accepted: s.accepted + 1 }));
      setLogs(l => [{ id: Date.now(), time: time, status: 'Aceptada' }, ...l].slice(0, 5));
      setAllRequests(prev => [...prev, { id: Date.now(), time, status: 'Aceptada' }]);
      
      setFlash('accept');
      setTimeout(() => setFlash(null), 300);
    } else {
      setQueue(cleanQueue);
      setStats(s => ({ ...s, rejected: s.rejected + 1 }));
      setLogs(l => [{ id: Date.now(), time: time, status: 'Rechazada' }, ...l].slice(0, 5));
      setAllRequests(prev => [...prev, { id: Date.now(), time, status: 'Rechazada' }]);
      
      setFlash('reject');
      setTimeout(() => setFlash(null), 300);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-indigo-600" />
              Simulador: Rate Limiter
            </h1>
            <p className="text-slate-500 mt-1">
              Animación de peticiones procesadas según archivo 2.go (Ventana de {t}s, Máx {m} req)
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Tiempo Actual</div>
            <div className="flex items-center gap-4 justify-end">
              <div className="text-3xl font-mono font-bold text-indigo-600 flex items-center gap-2">
                <Clock className="w-6 h-6" /> T={time}s
              </div>
              <button 
                onClick={handleReset} 
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center" 
                title="Reiniciar simulador"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel de Control */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-1 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" /> Parámetros
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>Límite (M)</span>
                  <span className="text-indigo-600 font-bold">{m} peticiones</span>
                </label>
                <input 
                  type="range" min="1" max="10" value={m} 
                  onChange={(e) => setM(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>Ventana (T)</span>
                  <span className="text-indigo-600 font-bold">{t} segundos</span>
                </label>
                <input 
                  type="range" min="5" max="20" value={t} 
                  onChange={(e) => setT(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <button 
              onClick={handleRequest}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2
                ${flash === 'accept' ? 'bg-emerald-500' : flash === 'reject' ? 'bg-red-500' : 'bg-indigo-600 hover:bg-indigo-700'}
              `}
            >
              <Server className="w-6 h-6" />
              Enviar Petición
            </button>
            <p className="text-xs text-center text-slate-400 mt-2">
              Haz clic rápido para simular peticiones simultáneas.
            </p>
          </div>

          {/* Visualización Animada */}
          <div className="md:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-lg font-bold">Línea de Tiempo (Ventana Móvil)</h2>
                  <p className="text-sm text-slate-500">
                    Mostrando peticiones entre <span className="font-mono bg-slate-100 px-1 rounded">T={Math.max(0, time - t)}</span> y <span className="font-mono bg-slate-100 px-1 rounded">T={time}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${queue.length >= m ? 'text-red-500' : 'text-emerald-500'}`}>
                    {queue.length}
                  </span>
                  <span className="text-slate-400 font-medium text-lg"> / {m} activas</span>
                </div>
              </div>

              {/* Contenedor de Animación */}
              <div className="relative h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden shadow-inner flex items-center">
                
                {/* Zona de expiración y entrada */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-red-100/50 to-transparent z-0 flex items-center justify-start pl-2 border-l-4 border-red-200">
                  <span className="text-[10px] font-bold text-slate-500 -rotate-90 opacity-50 uppercase tracking-widest whitespace-nowrap">Sale</span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-indigo-100/50 to-transparent z-0 flex items-center justify-end pr-2 border-r-4 border-indigo-200">
                  <span className="text-[10px] font-bold text-slate-500 rotate-90 opacity-50 uppercase tracking-widest whitespace-nowrap">Entra</span>
                </div>

                {/* Grid para guiar visualmente el tiempo */}
                <div className="absolute inset-0 flex justify-between px-10 opacity-10 pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-full border-l border-slate-800 border-dashed"></div>
                  ))}
                </div>

                {/* Renderizamos las peticiones como bloques moviéndose de derecha a izquierda */}
                {allRequests.map((req) => {
                  const age = time - req.time;
                  // Si tiene 0 segundos de edad, está en el 0% desde la derecha.
                  // Si tiene T segundos de edad, está en el 100% desde la derecha (fuera).
                  const rightPos = (age / t) * 100;
                  
                  return (
                    <div 
                      key={req.id}
                      className={`absolute top-1/2 -translate-y-1/2 w-[80px] h-20 flex flex-col items-center justify-center rounded-lg border-2 shadow-sm 
                        ${req.status === 'Aceptada' 
                          ? 'bg-emerald-50 border-emerald-400 z-20' 
                          : 'bg-red-50 border-red-400 opacity-90 z-10'
                        }
                      `}
                      style={{ 
                        // Utilizamos translate-x para compensar el ancho del propio bloque para que inicie exactamente en el borde derecho
                        right: `calc(${rightPos}% - 40px)`,
                        transition: 'right 1s linear', // Esto hace que el movimiento sea continuo y suave!
                      }}
                    >
                      <div className={`w-full text-center text-[10px] font-bold uppercase py-1 mb-auto rounded-t-md
                         ${req.status === 'Aceptada' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}
                      `}>
                        {req.status}
                      </div>
                      <div className="mb-auto mt-2">
                        <span className="text-xs text-slate-400 font-semibold mb-1">T=</span>
                        <span className={`text-lg font-mono font-bold ${req.status === 'Aceptada' ? 'text-emerald-700' : 'text-red-700'}`}>
                          {req.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <span>← Expiración (T - {t})</span>
                <span>Petición (T) →</span>
              </div>
            </div>

            {/* Estadísticas y Logs */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Resumen Global</h3>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-5 h-5" /> Aceptadas
                  </div>
                  <span className="text-2xl font-bold">{stats.accepted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-red-600 font-medium">
                    <XCircle className="w-5 h-5" /> Rechazadas
                  </div>
                  <span className="text-2xl font-bold">{stats.rejected}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Últimas 5 Peticiones</h3>
                <div className="space-y-3">
                  {logs.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No hay peticiones aún.</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex justify-between items-center text-sm">
                        <span className="font-mono font-medium text-slate-600">T={log.time}s</span>
                        <span className={`px-2 py-1 rounded-md font-semibold text-xs
                          ${log.status === 'Aceptada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                        `}>
                          {log.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
