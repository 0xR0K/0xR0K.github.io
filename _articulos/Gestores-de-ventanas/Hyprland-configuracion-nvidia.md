--- 
title: Configuracion para un Nvidia user
date: 2025-12-26 15:45 
layout: post
categories: [gestores-de-ventanas, Hyprland] 
---
A ver, mazapan. Si estás leyendo esto es por dos razones: o te va la marcha sado-masoquista, o te has gastado el sueldo en una gráfica de NVIDIA y ahora te das cuenta de que en Linux te odian.

**Por cierto. Hoy es día 26 de Diciembre, Feliz navidad**

Vamos a dejarnos de tonterias: la relación entre NVIDIA y Linux no es "complicada", es **tóxica de cojones**. Ya lo dijo Linus Torvalds con aquel famoso “Que te jodan nvidia”. Y con razón, porque esta empresa hace lo que le da la gana.

Lo primero, **NO existe soporte oficial de Hyprland para NVIDIA**. Si vas al Discord oficial a llorar porque algo falla, te van a mandar a paseo y te dirán que te compres una AMD. Pero tranquilo, que aquí vamos a enseñarte a domar a la bestia.

Con los drivers recientes (580+), la cosa ha mejorado una barbaridad gracias al _Explicit Sync_. Ya no es el infierno que era hace dos años, pero sigue requiriendo que sepas lo que haces.

Esto no es un tutorial de 5 minutos de YouTube para copiar y pegar como un mono amaestrado. Vamos a tocar el kernel, vamos a meterle mano al initramfs... Si te da miedo la terminal, cierra y vuelve a Windows, atiende.

# Fase 0: Nvidia en Hyprland (Drivers)

Aquí es donde la mayoría la caga, a finales de 2025. NVIDIA ha decidido dividir la baraja y si no sabes qué hardware tienes pinchado, vas a romper el sistema antes de empezar.

Ya no vale instalar `nvidia-dkms` a lo loco. Tienes que elegir tu veneno:
### Las ramas actuales:

1. **Drivers "Legacy" (Rama 580xx - Propietarios):**
    - **Para quién:** Si tienes una tarjeta con solera, anterior a la arquitectura Turing. Hablamos de las **GTX 1000 (Pascal), GTX 900 (Maxwell), Titan X**...
    - **La realidad:** Ni se te ocurra meterle los drivers "Open" a estas tarjetas. **NO van a arrancar**. NVIDIA ha cerrado el grifo aquí y no hay firmware para ti. Tu grafica esta mas cerca de ser un artilugio, que tecnologia...
    - **El problema:** Como son drivers "legacy", Arch los ha mandado al carajo de los repositorios oficiales. Ahora estan en AUR.

2. **Drivers "Open" (Rama 590xx+ - Open Kernel Modules):**
    - **Para quién:** Si tienes pasta y hardware moderno: **RTX 2000, 3000, 4000 y las nuevas 50xx**.
    - **El dato:** Para las 50xx es **OBLIGATORIO**. Para el resto, es lo que recomienda NVIDIA si quieres gestión de energía decente y que no se te fría la gráfica.

**¿Por que DKMS?** No es por capricho. Como aquí somos gente seria, usamos `linux-zen` (porque queremos latencia baja y velocidad). Al usar DKMS, el sistema recompila el módulo de NVIDIA automáticamente cada vez que actualizas el kernel. Si no usas DKMS, cada vez que entre un kernel nuevo te vas a comer una pantalla negra.

#### Instalación
**Opción A: Legacy (Pre-RTX 2000)** Si tienes una Pascal, tira de `paru` porque esto está en el AUR:
```bash
paru -S nvidia-580xx-dkms nvidia-580xx-utils lib32-nvidia-580xx-utils linux-zen-headers
```

**Opción B: RTX 2000+** Si tienes hardware moderno, tira de repos oficiales:
```bash
sudo pacman -S nvidia-open-dkms nvidia-utils lib32-nvidia-utils linux-zen-headers
```

> **¡OJO!** Asegúrate de tener `egl-wayland` instalado. Es el diplomático que hace que la API EGL y Wayland se entiendan sin matarse. Sin esto, no hay fiesta.

# Fase 1: Cirugía al Kernel (GRUB)
Antes de que Hyprland pueda siquiera respirar, el kernel tiene que saber cómo hablar con la gráfica. Tenemos que activar el **Atomic Modesetting**. Sin esto, NVIDIA para Wayland es una cosa pinchada en un puerto pci.

### Diagnóstico Previo
Revisamos que nos dice este comando:
```bash
cat /proc/cmdline | grep -E "modeset=1"
```

¿No sale nada? Pues toca operar.
### La Solución
Abre `/etc/default/grub` con tu editor favorito (no te voy a juzgar hoy). Busca la línea `GRUB_CMDLINE_LINUX_DEFAULT` y métele esto:
- `nvidia_drm.modeset=1`
- `nvidia_drm.fbdev=1`: Para que la consola TTY (la pantalla negra de letras) tenga alta resolución y no se vea como un juego de Atari.
```bash
# Ejemplo de cómo debería quedar (más o menos):
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet nvidia_drm.modeset=1 nvidia_drm.fbdev=1"
```

Y ahora regenera el GRUB, carajo:
```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```
# Fase 2: Carga Temprana (Early KMS)
Aquí jugamos contra el reloj. Existe una "carrera" (Race Condition) en el arranque: si Hyprland intenta arrancar antes de que el driver de NVIDIA, te comes un error.

### La Estrategia
Vamos a forzar que los módulos de NVIDIA se carguen en el _initramfs_, es decir, antes incluso de que se monte el disco duro.

Edita `/etc/mkinitcpio.conf` y busca el array `MODULES`. Mételos ahí a presión:
```bash
MODULES=(nvidia nvidia_modeset nvidia_uvm nvidia_drm)
```

**¡Atención, usuarios de Portátiles! (Intel + Nvidia)** Si tienes una iGPU Intel, cárgala **ANTES** que la de Nvidia. Si no lo haces, el arranque se te va a quedar congelado 60 segundos mirando al infinito. Hazme caso. `MODULES=(i915 nvidia ...)`

Y aplica los cambios, que no se hacen solos, calamardo!
```bash
sudo mkinitcpio -P
```

**Verificación:** Reinicia y ejecuta `lsmod | grep nvidia`. Si sale una lista larga, has triunfado.

# Fase 3: Variables de Entorno (Hyprland.conf)
Aquí hay mucho mito urbano. Internet está lleno de guías viejas que te dicen que metas basura como `GBM_BACKEND`. **Ni caso**. Eso está obsoleto y ensucia. Vamos a poner lo justo y necesario en tu `hyprland.conf`.
```bash
# --- CORE NVIDIA ---
# Le decimos a las apps que usen la API propietaria (porque no hay otra)
env = LIBVA_DRIVER_NAME,nvidia
env = XDG_SESSION_TYPE,wayland
env = __GLX_VENDOR_LIBRARY_NAME,nvidia

# Renderizado directo. Esto evita que las apps de Electron vayan a pedales.
env = NVD_BACKEND,direct

# Electrificación: Adiós al parpadeo en Discord, VSCode y Obsidian.
env = ELECTRON_OZONE_PLATFORM_HINT,auto

# Apps en Qt (KDE, etc)
env = QT_QPA_PLATFORM,wayland;xcb
env = QT_WAYLAND_DISABLE_WINDOWDECORATION,1
```

# Fase 4: Gestión de Energía (El Coma Profundo)
El clásico de NVIDIA: cierras la tapa del portátil, se suspende, y al despertar... sorpresa. Pantalla negra, texturas corruptas o el sistema frito. Esto pasa porque la memoria de vídeo (VRAM) se En este caso, si estaba muerto y no de parranda.... Me despertao gracioso, que te pasa.

### La Solución
1. Habilitamos los servicios de systemd que se encargan de guardar la VRAM en el disco antes de dormir:
```bash
sudo systemctl enable nvidia-suspend nvidia-hibernate nvidia-resume
```
1. Le decimos al driver que use esa función. Crea el archivo `/etc/modprobe.d/nvidia-power.conf` y ponle esto:
```bash
options nvidia NVreg_PreserveVideoMemoryAllocations=1
```

# Fase 5: Aceleración de Vídeo (VA-API)
No te has gastado una pasta en una gráfica para que tu CPU se ponga al 100% y los ventiladores suenen como un avión cuando ves un vídeo de YouTube. Queremos que la GPU curre.

**Instalación:**
```bash
sudo pacman -S libva-nvidia-driver
```

**Configuración Firefox:** A veces el zorro es un poco cabezon e ignora al sistema. Entra en `about:config` (escríbelo en la barra de direcciones, melón) y fuerza estas opciones a **true**:
- `media.ffmpeg.vaapi.enabled`
- `media.rdd-ffmpeg.enabled`

**Verificación:** Ejecuta `vainfo`. Si ves una lista de códecs y dice "Driver version: NVIDIA..." Bingo.

# Fase 6: Compartir Pantalla (Portals)
Si intentas compartir pantalla en Discord y tus amigos ven un cuadrado negro, es culpa de los Portals. Hyprland necesita un "traductor" para hablar con las aplicaciones que quieren grabar la pantalla.

**Instalación:**
```bash
sudo pacman -S xdg-desktop-portal-hyprland xdg-desktop-portal-gtk
```
_(Metemos también el de GTK para tener un selector de archivos decente, que si no luego te quejas)._

**Script de Reanimación (VITAL):** A veces estos servicios son tontos y arrancan en el orden incorrecto. Asegúralos en tu `hyprland.conf` con `exec-once`:
```bash
exec-once = dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP
exec-once = systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP
```

# Fase 7: Fix del Cursor (Maxwell/Pascal)
Si tienes una GTX 900 o 1000, es posible que a veces el cursor desaparezca o se convierta en un cuadrado de glitch (artefactos gráficos). Aunque los drivers nuevos mejoran esto, la solución definitiva para que no te dé un parraque es decirle a Hyprland que pinte el cursor por software.

En `hyprland.conf`:
```config
cursor {
    no_hardware_cursors = true
}
```

# Checklist de Salud del Sistema (Dashboard)
Antes de darte palmaditas en la espalda, pasa lista. Si todo esto está en verde, tienes un sistema roca. Si no, algo has roto.

|**Componente**|**Comando de verificación**|**Resultado esperado**|
|---|---|---|
|**Kernel**|`uname -r`|Debe terminar en `-zen` (si me has hecho caso)|
|**Middleware**|`pacman -Qs egl-wayland`|Instalado|
|**Render**|`hyprctl systeminfo`|`NVIDIA GeForce ...`|
|**VA-API**|`vainfo`|Sin errores, lista códecs|
|**Boot Args**|`cat /proc/cmdline`|`modeset=1` presente|
|**Módulos**|`lsmod|grep nvidia`|

# Plan de Emergencia y Rescate
¿Has tocado algo y ahora tienes pantalla negra? Que no cunda el pánico, cara anchoa. Aquí tienes cómo salir del pozo sin reinstalar como un cobarde.

### Recuperación en vivo (GRUB)
1. En el menú de GRUB, presiona `e` sobre tu entrada de Arch.
2. Busca la línea que editamos y borra `nvidia_drm.modeset=1`.
3. Presiona `Ctrl + X` para arrancar. Esto desactivará Wayland, pero te permitirá llegar a una TTY (consola) para deshacer los cambios y ver qué has roto.

### Montaje de Rescate (Desde ISO)
Si ni eso funciona, arranca con el USB de instalación de Arch y monta tu sistema.
```bash
# Ajusta tus particiones según tu esquema (sabes cuáles son, no?)
mount -o subvol=@ /dev/nvme0n1p3 /mnt
mount /dev/nvme0n1p1 /mnt/boot
mount -o subvol=@log /dev/nvme0n1p3 /mnt/var/log
# y tira de arch-chroot
```

### Conclusión
Configurar NVIDIA en Linux es un deporte de riesgo, no apto para cardíacos. Pero con esta estructura, tienes la mejor oportunidad de éxito posible. Hemos cubierto desde el arranque hasta la aceleración de vídeo.

Ahora, deja de configurar y ponte a usar el ordenador, que para eso estamos aquí. Y si te peta... pues ya sabes dónde mirar los logs (espero).