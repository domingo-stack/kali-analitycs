# DASHBOARD KALI ANALYTICS - DOCUMENTACIÓN COMPLETA DEL PROYECTO

## 📋 RESUMEN DEL PROYECTO

Dashboard web en tiempo real que muestra métricas del bot de atención al cliente "Kali" de Califica.ai.

**Stack:**
- Frontend: HTML + Tailwind CSS + Chart.js
- Backend: Supabase (PostgreSQL)
- Deploy: Vercel
- Repositorio: https://github.com/domingo-stack/kali-analitycs
- URL Producción: https://kali-analitycs.vercel.app/

---

## 🗄️ ARQUITECTURA DE DATOS

### Tabla Principal: `bot_analytics_log`

Columnas relevantes:
- `event_name` (text): Tipo de evento (workflow_started, response_sent, payment_detected, derivation_human_support, etc.)
- `conversation_id` (integer): ID único de la conversación
- `country` (text): País del usuario (ej: "Perú", "Chile", "México")
- `created_at` (timestamptz): Timestamp del evento
- `execution_id` (text): ID de la ejecución en n8n
- `messages_in_buffer` (integer): Cantidad de mensajes agrupados
- `buffer_applied` (boolean): Si se aplicó buffer de mensajes

### Funciones SQL (RPC) en Supabase:

Todas aceptan parámetro `dias INTEGER DEFAULT 7`:

1. **get_dashboard_kpis(dias)** - KPIs principales
2. **get_dashboard_actividad_diaria(dias)** - Actividad por día
3. **get_dashboard_top_paises(dias)** - Top 20 países
4. **get_dashboard_pagos_por_pais(dias)** - Pagos desglosados por país
5. **get_dashboard_derivaciones(dias)** - Análisis de derivaciones
6. **get_dashboard_actividad_por_hora(dias)** - Heatmap horario (zona UTC-5 Perú)

---

## 🎨 DISEÑO - BRAND GUIDELINES

**Colores oficiales Califica:**
- Rojo principal: `#FF6768`
- Azul navy: `#2F4060`
- Background: `#FBFBFB`
- Verde (éxito): `#48BB78`
- Naranja (alertas): `#ED8936`

**Tipografía:**
- Font: Inter (Google Fonts)

---

## 🐛 BUGS IDENTIFICADOS A CORREGIR

### **BUG 1: Top Países - Porcentajes en 0% y sin banderas**

**Ubicación:** Sección "Top Países" (lado derecho del dashboard)

**Síntomas:**
- Todos los porcentajes muestran "0%" aunque hay pagos
- Las banderas no se renderizan (no aparecen los emojis)

**Causa probable:**
- El cálculo de `porcentaje_conversion` en la función SQL o en el JavaScript está devolviendo null/0
- El mapeo de banderas (objeto `FLAGS`) no coincide exactamente con los nombres de países en la BD

**Solución esperada:**
- Verificar que `porcentaje_conversion` se calcule correctamente (pagos / conversaciones * 100)
- Asegurar que el objeto FLAGS tenga EXACTAMENTE los mismos nombres que la columna `country` en la BD
- Ejemplo: si en BD dice "Peru" pero FLAGS tiene "Perú", no coincidirá

---

### **BUG 2: Actividad por Horario - Sin datos después de 20:00 hrs**

**Ubicación:** Heatmap "Actividad por Horario"

**Síntomas:**
- No aparecen datos en el rango "20-24h" aunque hubo actividad
- El usuario confirma que atendió conversaciones después de las 20:00 hrs (hora Perú)

**Causa probable:**
- La función `get_dashboard_actividad_por_hora` tiene un error en el CASE WHEN
- Posiblemente el rango horario está filtrando mal o el timezone UTC-5 no se aplica correctamente

**Solución esperada:**
- Revisar la función SQL línea por línea
- Verificar que `AT TIME ZONE 'America/Lima'` se aplique correctamente
- El CASE WHEN debe cubrir TODAS las horas (0-23), específicamente 20-23
- Testear con datos reales que sabemos que existen después de las 20:00

---

### **BUG 3: Detalle de Pagos por País - Sin banderas**

**Ubicación:** Tabla "Detalle de Pagos por País" (abajo del todo)

**Síntomas:**
- Las banderas no se renderizan en la columna "País"

**Causa probable:**
- Mismo problema que Bug 1: el mapeo FLAGS no coincide con los nombres exactos de la BD

**Solución esperada:**
- Aplicar el mismo fix que en Bug 1
- Asegurar consistencia en nombres de países

---

## 📁 ESTRUCTURA DEL CÓDIGO

### Archivo principal: `index.html`

**Secciones importantes:**

1. **Configuración (líneas ~226-227):**
```javascript
const SUPABASE_URL = 'https://xaiotlzyiqhgycxvwxrk.supabase.co';
const SUPABASE_KEY = 'eyJ...';  // Anon key
```

2. **Mapeo de banderas (líneas ~238-245):**
```javascript
const FLAGS = {
    'Perú': '🇵🇪', 
    'Chile': '🇨🇱', 
    // ... etc
};
```

3. **Funciones de carga de datos:**
- `cargarKPIs(periodo)` - Línea ~270
- `cargarActividadDiaria(periodo)` - Línea ~290
- `cargarTopPaises(periodo)` - Línea ~340
- `cargarHeatmap(periodo)` - Línea ~370
- `cargarDerivaciones(periodo)` - Línea ~440
- `cargarTablaPagos(periodo)` - Línea ~480

---

## 🔧 INSTRUCCIONES PARA CLAUDE CODE

### Objetivo:
Corregir los 3 bugs identificados en el dashboard de analytics.

### Pasos a seguir:

1. **Clonar el repositorio:**
```bash
git clone https://github.com/domingo-stack/kali-analitycs.git
cd kali-analitycs
```

2. **Abrir el proyecto en tu editor**

3. **Investigar los bugs:**

**Para Bug 1 y 3 (banderas y porcentajes):**
- Inspeccionar el objeto `FLAGS` en index.html
- Consultar Supabase para ver los nombres EXACTOS en la columna `country`
- Query de prueba:
```sql
SELECT DISTINCT country 
FROM bot_analytics_log 
WHERE country IS NOT NULL 
ORDER BY country;
```
- Ajustar el objeto FLAGS para que los nombres coincidan EXACTAMENTE
- Verificar el cálculo de `porcentaje_conversion` en la función `cargarTopPaises()`

**Para Bug 2 (horario 20-24h):**
- Revisar la función SQL `get_dashboard_actividad_por_hora` en Supabase
- Verificar que el CASE WHEN cubra correctamente 20-23 hrs
- Probar con datos reales:
```sql
SELECT * FROM get_dashboard_actividad_por_hora(7);
```
- Si no devuelve datos para '20-24h', corregir el SQL

4. **Testing local:**
- Abrir index.html en el navegador
- Verificar que los 3 bugs estén corregidos
- Probar con diferentes períodos (7, 30, 90 días)

5. **Commit y push:**
```bash
git add index.html
git commit -m "Fix: Banderas y porcentajes en Top Países, horario 20-24h en heatmap"
git push origin main
```

6. **Verificar en producción:**
- Vercel deployará automáticamente
- Revisar https://kali-analitycs.vercel.app/ en 30-60 segundos

---

## 🎯 CRITERIOS DE ÉXITO

✅ Top Países muestra porcentajes correctos (no 0%)
✅ Todas las banderas se renderizan correctamente
✅ Heatmap muestra datos en rango 20-24h cuando existan
✅ Tabla de pagos muestra banderas

---

## 📞 CONTACTO

Usuario: domingo-stack (GitHub)
Proyecto: Califica.ai - Dashboard Kali Analytics

---

## 🔐 CREDENCIALES (NO COMMITEAR)

Supabase Project URL: https://xaiotlzyiqhgycxvwxrk.supabase.co
(La anon key ya está en el código, es segura para frontend)

---

## 📚 RECURSOS

- Documentación Supabase JS: https://supabase.com/docs/reference/javascript
- Chart.js: https://www.chartjs.org/docs/latest/
- Tailwind CSS: https://tailwindcss.com/docs
- Vercel: https://vercel.com/docs

---

FIN DE DOCUMENTACIÓN
