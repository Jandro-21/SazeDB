# 🏛️ SazeDB — La Cobrememoria Digital en 3D

> *"Soy, por desgracia, el Héroe de las Eras."*  
> — **Sazed, Guardador de Terris** (*Mistborn: Nacidos de la Bruma*, Brandon Sanderson)

![SazeDB Banner](https://img.shields.io/badge/SazeDB-v1.0.0-c4683c?style=for-the-badge)
![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-v8-blue?style=for-the-badge&logo=three.js)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vite)
![License MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📖 ¿Qué es SazeDB?

En el turbulento mundo de Scadrial, bajo la ceniza incesante y la opresión del Lord Legislador, los **Guardadores de Terris** dedicaron sus vidas a recopilar cada fragmento de historia, religión, filosofía y ciencia jamás escrito, almacenándolo en sus **mentes de metal** (*cobrememorias*) para que el conocimiento nunca fuera destruido.

**SazeDB** nace inspirado en esa misma devoción por el saber y la lectura. Es una experiencia interactiva en **primera persona totalmente renderizada en 3D** dentro del navegador mediante **React Three Fiber** y **Three.js**, donde el usuario explora un santuario de lectura, gestiona su catálogo de obras y lee sus libros favoritos (**PDF, EPUB, AZW3**) directamente en pantalla con guardado automático de página.

Sin servidores externos, sin rastreadores y sin riesgo de censura: todo tu conocimiento se almacena localmente en la memoria de tu propio dispositivo (**LocalStorage** e **IndexedDB**), inmune a la Ruina del tiempo.

---

## ✨ Características Principales

### 🏛️ 1. Entorno 3D en Primera Persona
- **Exploración FPS Fluida**: Desplázate por el estudio con controles `WASD`, mira alrededor con el ratón (`PointerLockControls`) y usa la retícula central para interactuar con el entorno.
- **Mecánica de Sprint**: Mantén pulsado `Shift` para duplicar tu velocidad de movimiento con una transición suave y dinámica de campo de visión (FOV 70° ➔ 78°), ideal para recorrer rápidamente la biblioteca.
- **Dos Estanterías Físicas**:
  - **Balda de "Por Leer"** (*Pared Trasera*): Aloja los volúmenes pendientes de descubrir.
  - **Balda de "Libros Leídos"** (*Pared Izquierda*): Exhibe tus lecturas completadas.
  - **Física de Transición 3D**: Al marcar un libro como leído, el tomo se desliza suavemente en el espacio tridimensional mediante interpolación `lerp` y `slerp` hasta su nueva posición.
- **Texturizado Dinámico**: Los lomos se generan algorítmicamente en Canvas con títulos legibles, nervios dorados y paletas cromáticas personalizadas, además de admitir portadas personalizadas subidas por el usuario.

### 🖥️ 2. Terminal SazeOS 4.0 (CRUD de Libros)
En el escritorio de madera se encuentra un monitor CRT interactivo cuya pantalla refleja en tiempo real las estadísticas de la biblioteca:
- **Gestión Completa (CRUD)**: Crea, edita, clasifica y elimina cualquier obra literaria.
- **Color de Lomo & Portada**: Selector cromático y paletas terracota, con opción de adjuntar imágenes de portada locales o enlaces URL.
- **Archivos Adjuntos**: Sube archivos reales en formato **PDF**, **EPUB** o **AZW3**.
- **Filtros Dinámicos**: Organiza y consulta tu biblioteca por estado (*Todos*, *Por Leer*, *Leídos*).
- **Adaptabilidad Móvil**: Pestañas optimizadas para pantallas táctiles entre formulario y catálogo.

### 📜 3. Lector de Documentos de Alta Fidelidad
Al apuntar a un libro y pulsar `E` o hacer clic, se abre el lector integrado sin recargas de página:
- **Motor EPUB Nativo (JSZip)**: Descomprime el paquete EPUB/AZW3 en memoria, resuelve el árbol OPF y el `<spine>` secuencial, y genera *Blob URLs* para renderizar grabados, ilustraciones y tipografía serif (*Lora*) con máxima nitidez.
- **Motor PDF (PDF.js)**: Renderizado vectorial en canvas de páginas con zoom nítido.
- **Cobrememoria de Progreso**: Tu última página leída se guarda en `LocalStorage` en cada cambio de página. Al reabrir el libro semanas después, retomarás la lectura exactamente donde la dejaste.
- **Consagración de Lectura**: Al alcanzar la última página, SazeDB te felicita y te ofrece colocar solemnemente el tomo en la estantería de *Libros Leídos*.

### ⏸️ 4. Menú de Pausa & Salida Limpia
- Al pulsar `ESC` mientras lees un libro o usas el ordenador, sales limpiamente de vuelta al estudio sin molestas pantallas intermedias.
- Al pulsar `ESC` mientras exploras libremente la sala (el HUB), se abre el **Menú de Pausa**, con:
  - Botón de **Continuar** partida.
  - Visor desplegable de **Controles**.
  - Acceso directo al repositorio de **GitHub**.
  - Ficha de autoría y créditos.

### 🎨 5. Cero Emojis — 100% Iconografía SVG Vectorial
Todas las referencias e interfaces utilizan la biblioteca profesional **Lucide React**, garantizando una estética limpia, editorial y atemporal en cualquier resolución de pantalla.

---

## 🛠️ Tecnologías Empleadas

| Área | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Núcleo** | [React 18](https://react.dev/) | Arquitectura de componentes declarativa y reactiva |
| **Gráficos 3D** | [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | Motor de renderizado WebGL para la sala y libros |
| **Herramientas 3D** | [@react-three/drei](https://github.com/pmndrs/drei) | Controladores de cámara (`PointerLockControls`) |
| **Bundler** | [Vite 5](https://vitejs.dev/) | Empaquetado ultrarrápido y Hot Module Replacement |
| **Lectura EPUB** | [JSZip](https://stuk.github.io/jszip/) | Descompresión en memoria y resolución de capítulos |
| **Lectura PDF** | [PDF.js](https://mozilla.github.io/pdf.js/) | Renderizado nativo de páginas de libros PDF |
| **Iconografía** | [Lucide React](https://lucide.dev/) | Iconos SVG vectoriales consistentes |
| **Almacenamiento** | `LocalStorage` + `IndexedDB` | Persistencia dual (metadatos + archivos binarios pesados) |

---

## 🚀 Instalación y Despliegue Local

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

```bash
# 1. Clonar el repositorio
git clone https://github.com/Jandro-21/SazeDB.git
cd SazeDB

# 2. Instalar las dependencias
npm install

# 3. Iniciar el servidor de desarrollo local
npm run dev
```

Abre tu navegador en `http://localhost:3000` y adéntrate en la biblioteca.

Para compilar la versión optimizada de producción:
```bash
npm run build
npm run preview
```

---

## 🎮 Guía de Controles

| Tecla / Acción | Función |
| :---: | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Moverte en primera persona por el estudio |
| <kbd>Ratón</kbd> | Girar la vista y apuntar con la retícula |
| <kbd>Shift</kbd> *(mantener)* | **Correr (Sprint)**: Aumenta la velocidad con efecto dinámico de FOV |
| <kbd>E</kbd> o <kbd>Clic Izquierdo</kbd> | Interactuar: Usar el ordenador o abrir el libro apuntado |
| <kbd>ESC</kbd> | Pausar partida en la sala / Salir del lector o del ordenador |
| <kbd>◀</kbd> <kbd>▶</kbd> / <kbd>Espacio</kbd> | Pasar página dentro del lector de libros |
| *Controles Táctiles* | D-Pad virtual, botón de acción y botón de pausa para dispositivos móviles |

---

## 📜 Citas de Scadrial

> *"La memoria humana es una cosa frágil. Pero cuando grabamos la verdad en el metal, o la custodiamos en nuestras cobrememorias, ni siquiera el paso de mil imperios podrá arrebatarla."*  
> — Reflexión de los Guardadores.

---

## 👤 Autor y Licencia

Proyecto diseñado y desarrollado con orgullo por **[Jandro-21](https://github.com/Jandro-21)** impulsado por Inteligencia Artificial y herramientas de **Google Antigravity**.

Distribuido bajo la **Licencia MIT**. Siéntete libre de clonarlo, modificarlo y preservarlo en tu propia cobrememoria.
