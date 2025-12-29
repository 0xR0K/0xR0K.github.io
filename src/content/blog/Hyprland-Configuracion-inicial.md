--- 
title: Hyprland - Configuración del Core
date: 2025-12-26 14:33 
layout: post
categories: [gestores-de-ventanas, Hyprland] 
---
Ya tienes Hyprland instalado, pero ahora mismo tu sistema es probablemente un lienzo en blanco o una configuración básica que necesita estructura para ser realmente usable.

En esta fase vamos a configurar el corazón del entorno: el archivo `hyprland.conf`. Y antes de empezar a copiar y pegar código como un mono, quiero explicarte la estrategia que vamos a seguir.

Existe una tendencia común ahí fuera a fragmentar la configuración en múltiples archivos pequeños: `keybinds.conf`, `monitors.conf`, `rules.conf`... Aunque sobre el papel parece ordenado, en la práctica diaria suele añadir fricción innecesaria. Tener que saltar entre 10 archivos diferentes para cambiar un simple atajo de teclado no es eficiente.

Aquí optaremos por el enfoque del **"Monolito Organizado"**. Vamos a mantener UN archivo robusto, bien comentado y estructurado. Esto nos permite tener una visión global y realizar ajustes rápidos sin perder el contexto. Vamos a poner orden.
## 1. El Encabezado: Define tus Herramientas
Al igual que en programación, definir variables al principio es una cuestión de higiene y mantenibilidad. Si mañana decides cambiar de terminal (de `alacritty` a `kitty`, por ejemplo), es mucho más limpio editar una sola línea al inicio que buscar y reemplazar en todo el documento.

### La Tecla Maestra (`$mainMod`)
Lo primero es definir la tecla principal. En el ecosistema de los Tiling Window Managers, el estándar es usar la tecla `SUPER` (la tecla de Windows o Command).
```config
# Definición de la tecla modificadora principal
$mainMod = SUPER
```

### Tus Aplicaciones
Aquí definimos qué programas vamos a invocar. Fíjate que incluimos los argumentos directamente en la variable (como en el caso del menú). Esto mantiene las secciones de atajos de teclado mucho más limpias.

```config
# Herramientas base del sistema
$terminal = alacritty
$menu = wofi --show drun --allow-images --insensitive
$fileManager = yazi
$browser = firefox
```

> **Consejo:** Definir `$browser` como variable es una muy buena práctica. Si algún día decides cambiar de navegador, tus scripts y atajos seguirán funcionando sin necesidad de reescribirlos; solo tendrás que actualizar esta línea.

## 2. Variables de Entorno (Hardware y Drivers)
Aquí es donde configuramos la comunicación entre Hyprland y tu hardware usando la palabra clave `env`.

Si utilizas una tarjeta **NVIDIA**, este apartado es crítico. Aquí es donde debemos forzar las variables necesarias para que Wayland gestione correctamente la sesión y evitar problemas gráficos o parpadeos. Si tienes dudas sobre qué poner aquí, revisa la documentación específica de Hyprland para tu driver.

## 3. Monitores
Ahora toca decirle al sistema **dónde** pintar las ventanas. Aunque nuestra filosofía es el "Monolito", la configuración de monitores puede ser una excepción pragmática dependiendo de tu caso de uso.

Recomiendo usar **`nwg-displays`**. Es una interfaz gráfica que nos permite configurar resolución, tasa de refresco y posición sin tener que calcularlo manualmente.

![[nwg-displays.png]]

### Opción A: Escritorio Fijo (Filosofía Monolito)
Si usas un PC de escritorio donde los monitores rara vez cambian, lo ideal es mantener la configuración dentro de `hyprland.conf`. Copia la línea generada por la herramienta y pégala.

```config
# Sintaxis: monitor=NOMBRE,RESOLUCION,POSICION,ESCALADO
monitor=DP-1,2560x1440@144,0x0,1
```

### Opción B: Portátiles y Entornos Dinámicos
Si usas un portátil que conectas frecuentemente a diferentes proyectores o monitores externos, editar el archivo principal cada vez es tedioso. En este caso, tiene sentido externalizar **solo** esta parte.

```config
# Cargamos la configuración de monitores externa
source = ~/.config/hypr/monitors.conf
```

De esta forma, mantienes el control del núcleo del sistema pero delegas la complejidad de las pantallas cambiantes.
## 4. Input: Idioma y Comportamiento
Es vital configurar correctamente esta sección para asegurar que tu teclado funcione como esperas (incluyendo caracteres como la `Ñ` o las tildes).

```config
input {
    # Distribución de teclado (Sustituye 'es' por tu código regional)
    kb_layout = es
    
    # Comportamiento del foco (1 = El foco sigue al ratón, estándar en Tiling WMs)
    follow_mouse = 1
    
    sensitivity = 0 # -1.0 a 1.0, 0 es sin cambios
    
    # Configuración específica para Touchpads
    touchpad {
        natural_scroll = no # Cambiar a 'yes' para comportamiento tipo móvil
    }
}
```
## 5. Estética: General y Decoración
Hyprland divide la apariencia en dos grandes bloques: la estructura física (`general`) y los efectos visuales (`decoration`).

### General: Estructura y Espacio
Aquí definimos los **gaps** (espacios) y bordes. Estos no son solo estéticos; ayudan a identificar visualmente dónde termina una aplicación y empieza otra, y el color del borde nos indica qué ventana tiene el foco.
```config
general {
    gaps_in = 7       # Espacio entre ventanas
    gaps_out = 5      # Margen con el borde de la pantalla
    border_size = 2   # Grosor del borde
    
    # Colores del borde (Activo vs Inactivo)
    col.active_border = rgba(cccccc30)
    col.inactive_border = rgb(333333)
    
    # Motor de disposición de ventanas. Dwindle es el recomendado.
    layout = dwindle
}
```

### Decoration: Efectos Visuales
En esta sección controlamos el suavizado de esquinas y el desenfoque (`blur`).
> **Nota sobre rendimiento:** Efectos como el `blur` consumen recursos de GPU. Si buscas el máximo rendimiento o tu hardware es limitado, considera desactivarlos.

```config
decoration {
    rounding = 0      # 0 = Esquinas rectas
    
    blur {
        enabled = true
        size = 3
        passes = 1
    }
}
```

### Sobre los Layouts: Dwindle vs Master
Hyprland ofrece principalmente dos modos:
1. **Dwindle (Espiral):** El modo predeterminado. Las ventanas se dividen siguiendo un patrón en espiral. Es intuitivo y aprovecha muy bien el espacio.
2. **Master:** Un estilo más clásico, con una ventana principal grande y una pila de secundarias a un lado.

Para esta guía, nos centraremos en **Dwindle**, ya que ofrece la experiencia más característica de este compositor.

## 6. Animaciones: Fluidez y Movimiento

Una de las características distintivas de Hyprland es su fluidez. Aquí definimos las "curvas de Bézier" (que determinan la aceleración y frenado) y las asignamos a eventos específicos.
```config
animations {
    enabled = yes

    # Curva personalizada: Comienza rápido, frena suavemente
    bezier = myBezier, 0.05, 0.9, 0.1, 1.05

    # Asignación de animaciones
    # Sintaxis: animation = NOMBRE, ON/OFF, VELOCIDAD, CURVA, [ESTILO]
    
    animation = windows, 1, 7, myBezier
    animation = windowsOut, 1, 7, default, popin 80% # Efecto al cerrar
    animation = workspaces, 1, 6, default # Deslizamiento entre escritorios
}
```

## 7. Keybinds: Tu Interfaz Principal
Esta es la sección operativa del sistema. Los atajos definen cómo interactúas con tu entorno. Observa lo limpio que queda el código al usar las variables que definimos al principio (`$terminal`, `$menu`).
```config
# Aplicaciones Principales
bind = $mainMod, Return, exec, $terminal
bind = $mainMod, D, exec, $menu
bind = $mainMod, E, exec, $fileManager

# Gestión de Ventanas
bind = $mainMod, Q, killactive      # Cerrar ventana
bind = $mainMod, F, fullscreen      # Pantalla completa
bind = $mainMod SHIFT, Space, togglefloating # Alternar modo flotante
```

### Uso del Ratón
A diferencia de otros gestores más antiguos, Hyprland integra muy bien el ratón para acciones de arrastrar y redimensionar, lo cual ofrece una gestión híbrida muy cómoda.
```config
# Mover ventanas con SUPER + Click Izquierdo
bindm = $mainMod, mouse:272, movewindow

# Redimensionar con SUPER + Click Derecho
bindm = $mainMod, mouse:273, resizewindow
```

## 8. Workspaces: Escritorios Virtuales
Hyprland gestiona los escritorios de forma dinámica (solo existen si tienen contenido), pero necesitamos definir cómo accedemos a ellos.
```config
# Cambiar de Workspace (SUPER + número)
bind = $mainMod, 1, workspace, 1
bind = $mainMod, 2, workspace, 2
# ... añade los que necesites

# Mover ventana y SEGUIRLA
bind = $mainMod SHIFT, 1, movetoworkspace, 1

# Mover ventana SILENCIOSAMENTE (La ventana se mueve, tú te quedas)
bind = $mainMod CTRL, 1, movetoworkspacesilent, 1
```

## 9. Window Rules: Excepciones Necesarias
El "Tiling" forzoso es excelente para terminales y navegadores, pero no funciona bien con todas las aplicaciones. Ventanas como selectores de archivos o controles de volumen necesitan flotar para ser usables.

Hyprland utiliza `windowrulev2` para gestionar esto con precisión.
**1. Ventanas que siempre deben flotar:**
```config
# Control de volumen y ventanas de diálogo
windowrulev2 = float, class:(pavucontrol)
windowrulev2 = float, title:^(pop-up)$
windowrulev2 = float, title:^(dialog)$
```

**2. Picture-in-Picture (PiP):** Una configuración muy útil si ves vídeos mientras trabajas. Hacemos que la ventana flote, se mantenga siempre visible (`pin`) y se posicione en una esquina.
```config
windowrulev2 = float, title:^(Picture-in-Picture)$
windowrulev2 = pin, title:^(Picture-in-Picture)$ 
windowrulev2 = move 100%-w-20 100%-w-20, title:^(Picture-in-Picture)$
```

## 10. Autostart: Inicio de Sesión
Aquí definimos qué aplicaciones y servicios deben arrancar con el sistema. La instrucción clave es `exec-once`. Esto asegura que el comando se ejecute **solo la primera vez** que arrancas Hyprland, evitando duplicar procesos si recargas la configuración.
```config
# 1. Componentes Visuales
exec-once = hyprpaper    # Fondo de pantalla
exec-once = waybar       # Barra de estado
exec-once = swaync       # Centro de notificaciones

# 2. Agente de Autenticación (CRÍTICO)
# Necesario para que las apps gráficas puedan pedir permisos de administrador (sudo)
exec-once = systemctl --user start hyprpolkitagent

# 3. Servicios y Apps
exec-once = nm-applet --indicator   # Icono de red
exec-once = steam --start-minimized # Inicio silencioso
exec-once = discord -silent

# 4. Integración del Sistema (Portals y DBus)
# Asegura que aplicaciones como OBS o Discord puedan capturar la pantalla correctamente
exec-once = dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP
```

## 11. Ajustes Finales
Para terminar, configuramos algunos detalles de calidad de vida.

### Control Multimedia
Es esencial configurar las teclas de función de tu teclado para controlar volumen y brillo.
```config
# Audio (requiere 'playerctl' y 'pactl')
bindel = , XF86AudioRaiseVolume, exec, pactl set-sink-volume @DEFAULT_SINK@ +5%
bindel = , XF86AudioLowerVolume, exec, pactl set-sink-volume @DEFAULT_SINK@ -5%
bindl = , XF86AudioMute, exec, pactl set-sink-mute @DEFAULT_SINK@ toggle

# Control de reproducción
bindl = , XF86AudioPlay, exec, playerctl play-pause
```
### Limpieza Visual
Desactivamos el logo y fondo predeterminados de Hyprland para tener un escritorio limpio.
```config
misc {
    disable_hyprland_logo = true
    force_default_wallpaper = 0
}
```

## Conclusión
Con esto tienes un archivo `hyprland.conf` sólido, mantenible y organizado. No es una configuración compleja innecesariamente, sino una base robusta sobre la que puedes construir tu flujo de trabajo.

Recuerda: este archivo es el centro de tu entorno. No tengas miedo de modificarlo, probar nuevos plugins o ajustar las animaciones. Haz una copia de seguridad y experimenta.
