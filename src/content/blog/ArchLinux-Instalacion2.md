---
title: Guia de Instalacion ArchLinux [2]
date: 2026-01-07
categories:
  - ArchLinux
---
Hoy retomamos la instalación de Arch Linux. En el [primer artículo](https://www.google.com/search?q=url-a-parte-1 "null"), llegamos hasta la instalación base del sistema. Dado que me gusta explicar la teoría detrás de cada paso, el texto anterior se extendió demasiado, así que decidí dividir la guía para no dejar nada pendiente.

**Vamos a continuar exactamente donde lo dejamos.**
### Resumen de la situación actual
En la primera parte realizamos los siguientes pasos críticos:
1. Creamos las particiones utilizando `cfdisk`.
2. Formateamos y montamos las particiones y los subvolúmenes Btrfs.
3. Ejecutamos `pacstrap` para instalar los paquetes básicos.
    
En este punto, tenemos Arch Linux instalado en el disco, pero **aún falta configuración esencial**. Si reiniciaras el ordenador ahora mismo, el sistema no arrancaría porque, básicamente, no sabría qué hacer con los archivos.
# Configuración del sistema
Aunque tenemos los archivos copiados, técnicamente seguimos operando desde la ISO de instalación (el entorno _live_). Ahora vamos a convertir esos archivos en un sistema funcional.
## Generación del Fstab
Antes de continuar, debemos realizar un paso fundamental: configurar el **fstab** (_File System Table_).

Este archivo es vital porque le indica al kernel qué particiones, discos duros o subvolúmenes existen, dónde deben montarse y con qué opciones (arranque, home, datos, etc.). Sin esto, el sistema no sabe dónde están sus propias "piezas".

Vamos a usar la herramienta `genfstab`, la cual automatiza este proceso escaneando lo que tenemos montado actualmente en `/mnt` y generando el archivo de configuración correspondiente.

### Concepto Clave: La relatividad de las rutas
Es crucial que entiendas dónde estamos. Ahora mismo, tu futuro sistema operativo reside dentro de la carpeta `/mnt` del USB de instalación. Sin embargo, esa carpeta `/mnt` representa la **raíz (`/`)** de tu sistema final.
Tienes que pensar en futuro:
- Lo que ahora ves como `/mnt/etc`, cuando reinicies será `/etc`.
- Lo que ahora es `/mnt/home`, será `/home`.

Por lo tanto, si quieres crear una carpeta en la raíz de tu sistema nuevo, debes crearla dentro de `/mnt` ahora.
### Montaje de discos adicionales
Si tienes discos duros secundarios (por ejemplo, un disco de 16TB para almacenamiento masivo), la práctica profesional dicta que se configuren **ahora**.

**¿Por qué ahora?** Porque al montarlos antes de generar el fstab, el sistema detectará automáticamente sus identificadores únicos (UUID) y creará la configuración de arranque perfecta. Hacerlo después manualmente implica editar archivos de sistema a mano, aumentando el riesgo de error humano.
**¿Dónde montarlo?** Un error de principiante es usar la carpeta `/mnt` del propio sistema para datos fijos. **No lo hagas**. La carpeta `/mnt` está destinada a montajes temporales. Un profesional crea un directorio dedicado en la raíz para mantener el orden semántico, como `/datos`, `/media/storage` o `/backup`.

**Procedimiento:**
Supongamos que quieres montar tu disco de 16TB (`/dev/sda1`) para que aparezca en la carpeta `/datos` de tu sistema final.
1. **Crear el punto de montaje:** Como estamos en el instalador, debemos crear la carpeta dentro de nuestro entorno actual (`/mnt`). _Nota: Al crear `/mnt/datos` ahora, en tu sistema final la carpeta se llamará simplemente `/datos`._
```bash
mkdir -p /mnt/datos
mount /dev/sda1 /mnt/datos
 ```
### Ejecutar genfstab
Una vez tengas montadas todas las particiones (extra), generamos el archivo. La herramienta será lo suficientemente inteligente para eliminar el prefijo `/mnt` de las rutas, dejando las rutas finales correctas:

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```
El parámetro `-U` utiliza UUIDs, lo que garantiza que si cambias los cables de los discos de puerto SATA, el sistema seguirá arrancando correctamente.

## Entrando en el sistema (Arch-Chroot)
`arch-chroot` es una herramienta del instalador que nos permite cambiar el directorio raíz aparente, emulando que estamos dentro del sistema que acabamos de instalar. A diferencia de un `chroot` estándar, esta herramienta de Arch arrastra configuraciones vitales como la resolución de DNS (internet), facilitándonos la vida.

Vamos a dejar de ser el "usuario del USB de instalación" para convertirnos en el "root" de tu nuevo sistema.
```bash
arch-chroot /mnt
```

Fíjate en el prompt de la terminal. Ha cambiado. Ahora estás **dentro** de tu sistema. Todo lo que hagas aquí será permanente en tu nueva instalación.

## Configuración Base
Antes de configurar nada, vamos a asegurarnos de que todo lo que instalamos con `pacstrap` está actualizado y configuramos los repositorios.

Recomiendo editar de nuevo el `/etc/pacman.conf` (sí, otra vez, porque ahora estás editando el archivo **dentro** de tu sistema instalado). Descomenta `[multilib]`, activa `Color` y añade `ILoveCandy` si te gustó el huevo de pascua.
```bash
pacman -Syyu --noconfirm
```

### Configuración Regional
Vamos a darle identidad al sistema.
#### Zona Horaria y Reloj
Primero, definimos la zona horaria creando un enlace simbólico:

```bash
ln -sf /usr/share/zoneinfo/Europe/Madrid /etc/localtime
```
_(Si no vives en España, busca tu zona en `/usr/share/zoneinfo/`)_.

Sincronizamos el reloj de hardware con el del sistema:
```bash
hwclock --systohc
```

#### El Idioma, Que hable cristiano!
Editamos el archivo de generación de idiomas:
```bash
nano /etc/locale.gen
```
Busca tu idioma (ej. `es_ES.UTF-8 UTF-8`) y **descoméntalo** (quita la almohadilla `#`). **Consejo de pro:** Descomenta también `en_US.UTF-8 UTF-8`. El 99% de los mensajes de error de Linux están en inglés. Si tienes un problema, querrás un error que puedas googlear, no jeroglíficos.

Guarda, sal y genéralos:
```bash
locale-gen
```

Establecemos el idioma principal del sistema:
```bash
echo "LANG=es_ES.UTF-8" > /etc/locale.conf
```
#### Teclado en consola (La 'ñ')
Para que la distribución del teclado en la TTY (la pantalla negra antes del entorno gráfico) sea correcta y no tengas problemas al escribir contraseñas con caracteres raros o la 'ñ', para que no te quieras pegar un tiro:
```bash
echo "KEYMAP=es" > /etc/vconsole.conf
```

#### Identidad (Hostname y Hosts)
Asignamos un nombre a la máquina. No seas soso:
```bash
echo "Arch-Tardis" > /etc/hostname
```

Configuramos el archivo `hosts` para que `localhost` sepa quién narices es:
```bash
nano /etc/hosts
```

Añade lo siguiente (cambiando `Arch-Tardis` por tu hostname):
```bash
127.0.0.1   localhost
::1         localhost
127.0.1.1   Arch-Tardis.localdomain Arch-Tardis
```

### Zram (El Bolsillo de Doraemon)
Como mencionamos en la Parte 1, usaremos un sistema híbrido: **Zram + Swap en disco**.

¿Por qué? Porque Zram es rapidísimo (RAM comprimida) para el uso diario, pero la Swap en disco es necesaria si quieres **hibernar** el equipo (guardar todo al apagar) o si tienes una emergencia y te quedas sin RAM física real.

Para que esto funcione, tenemos que decirle al sistema: "Oye, usa primero la Zram (rápida), y solo si explotas, toca el disco".

La forma moderna y correcta en Arch es usar `zram-generator`:

1. Instalamos la herramienta:
```bash
pacman -S zram-generator
```
    
2. Creamos su archivo de configuración:
```bash
nano /etc/systemd/zram-generator.conf
```
    
3. Añadimos la configuración:
```bash
   [zram0]
   zram-size = min(ram / 2, 4096)
   compression-algorithm = zstd
   swap-priority = 100
```
    

**Explicación:**
- `zram-size`: Usará como máximo la mitad de tu RAM o 4GB (lo que sea menor).
- `swap-priority = 100`: **Esto es la clave.** Le da una prioridad altísima. Tu partición de swap normal suele tener prioridad negativa o muy baja. Así nos aseguramos de que Linux llene la RAM comprimida antes de tocar la particion SWAP.
## Usuarios y Privilegios
#### La Contraseña de root.
Esto es vital. Ahora mismo **estás** como `root` sin contraseña. Ponle una **contraseña** al sistema. usa el comando `passwd` para darle **contraseña** al root. Te recomiendo que pongas una **difícil**. 12 caracteres, caracteres raros.. Ya sabes… una que no **esté** en RockYou.

```bash
passwd
```

#### Creando a tu usuario (useradd)
Usar `root` para el día a día es de **tontitos**.
```bash
useradd -m -s /bin/bash tu-usuario
```
- **-m:** Crea su `/home/tu-usuario`.
- **-s /bin/bash:** (Le dice que su terminal por defecto es Bash. Buena práctica.)

Y le pones contraseña:
```bash
passwd tu-usuario
```

#### Dando el Poder del Sudo (El Grupo ‘wheel’)
```bash
usermod -aG wheel tu-usuario
```

Ahora mismo, tu usuario está en el grupo `wheel`, pero el grupo `wheel` no tiene permiso. Hay dos formas de **dárselo**: la «segura» con `visudo`, o la «rápida de **narices**«. Vamos a usar la rápida:
```bash
sed -i 's/^# %wheel ALL=(ALL:ALL) ALL/%wheel ALL=(ALL:ALL) ALL/' /etc/sudoers
```

Boom. Rápido y al pie. Lo que hace este comando es buscar la línea `# %wheel...` y **quitarle** la **dichosa** almohadilla.

Vale, para el carro. Acabas de darte permisos de `root` y ahora te **estarás** preguntando: «¿Qué **narices** es ‘wheel’ y por qué **demonios** estoy haciendo esto?». Atiende, que esto es importante.

##### ¿Por qué no usar root para todo y acabar antes?
**Piénsalo:** usar `root` para tu día a día es de idiotas. ¿Por qué? Porque `root` no tiene límites. `root` no pregunta. `root` ejecuta. Si un día **estás** cansado, te equivocas de ventana y tecleas `rm -rf /` en vez de `rm -rf /Documentos/mierda`, te acabas de cargar el **maldito** sistema operativo entero.

![[SudoImagen.png]]

##### Entonces, ¿qué **narices** es wheel?
Por eso creamos un usuario mortal (`tu-usuario`). Este solo tiene poder en su carpeta `/home`. No puede joder el sistema aunque quiera. «¡Pero así no puedo instalar nada, ni actualizar!», me **dirás**. ¡Exacto! Tu usuario mortal necesita pedir superpoderes **temporalmente**. Y el comando para eso es `sudo` (Substitute User Do). `sudo` es el **santo** portero de la discoteca. Y el archivo `/etc/sudoers` es la lista VIP que el portero tiene en la mano.

Por una tradición que viene de los tiempos de los mainframes (cuando ser un «big wheel» significaba ser un «pez gordo», un **auténtico** jefe), ese grupo VIP en el mundo UNIX se llama `wheel`.

Lo que hemos hecho es crear un grupo donde podemos añadir **más** usuarios y no tener que estar añadiendo cada usuario al archivo `sudoers`, para evitar llenarlo de **porquería** o romperlo accidentalmente. Ahora en vez de tener que editar `sudoers` si quieres dar `sudo` a alguien, lo añades al grupo y listo. y lo mismo para quitarle `sudo`. le **quitas** del grupo y listo.
## Gestor de Arranque (GRUB)
Sin esto, el ordenador no arranca. Así de simple. Instalaremos GRUB. A mí me parece cómodo y fácil, así que no discutamos.

```bash
pacman -S --noconfirm --needed grub efibootmgr
```
### Instalación en la partición EFI
Asegúrate de que `/boot` está montado. Ahí va la magia.
```bash
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=ArchLinux
```

- `--efi-directory=/boot`: Nuestra partición FAT32.
- `--bootloader-id=ArchLinux`: El nombre que verás en la BIOS.
### Generar configuración
GRUB está instalado pero vacío. Hay que decirle que busque.
```bash
grub-mkconfig -o /boot/grub/grub.cfg
```
Verás cómo escanea y encuentra tu `linux-zen` y tu `intel-ucode`. Magia.
## Extras y Personalización (Opcional)
### ZSH + Oh My Zsh (La consola con esteroides)
```bash
pacman -S --noconfirm --needed zsh zsh-autosuggestions zsh-syntax-highlighting zsh-completions
```

Para instalarlo todo de golpe:
```bash
runuser -l tu-usuario -c 'sh -c "$(curl -fsSL [https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh](https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh))" "" --unattended' && chsh -s /bin/zsh tu-usuario
```

Con esto dejaremos de usar la terminal clásica de Bash y comenzaremos a usar ZSH. **Créeme:** yo era un purista de Bash. ¿Quieres aprender Linux? No uses ZSH. Apréndete los comandos, haz "tecle-tecle" y así te forzarás a aprender. ZSH lo recomiendo para gente que ya sabe usar una terminal, no te malacostumbres desde el principio. Pero una vez que pruebes ZSH, no hay vuelta atrás.

### AUR Helper: Paru
Necesitas AUR. Créeme. La mayoría de paquetes interesantes no están en los repositorios oficiales. Usaremos `paru` y el repositorio **Chaotic-AUR**.

Chaotic-AUR **NO** es un "AUR nuevo". Es un maldito turbo para el AUR oficial. Coge las recetas más populares (Spotify, Discord, `paru`...) y las compila por ti, ahorrándote muchísimo tiempo. Si compilas `paru` a mano estarás 15 minutos mirando la pantalla; con Chaotic son 10 segundos.

No te voy a decir cómo añadir el repo aquí. La razón es sencilla: a veces cambian cosas y, si te hago una guía paso a paso, mañana falla y te vuelves loco. Vete a [**SU WEB**](https://aur.chaotic.cx/ "null") y ahí tienes cómo instalarlo.

Una vez lo tengas, instalar `paru` es tan fácil como:
```bash
pacman -Syy paru
```

## Finalizando
Se acabó. Hemos terminado.
Pero antes, un detalle técnico. Has instalado `NetworkManager`, pero si reinicias, no va a arrancar solo, `pacman` instala, no activa.
```bash
systemctl enable NetworkManager
```

### Salida y Reinicio
Sal de la jaula (`chroot`) para volver a la ISO:
```bash
exit
```

Desmonta todo con elegancia, narices:
```bash
umount -R /mnt
```

Y finalmente:
```bash
reboot
```
**¡SACA EL PUTO USB ANTES DE QUE ARRANQUE DE NUEVO!**
Si ves el menú de GRUB... enhorabuena, chaval. Lo has conseguido.
# Instalacion y configuracion terminada pero...
Amigo mio. No hemos instalado ningun gestor de ventanas. Ni KDE, ni Gnome, i3, Hyprland.. Nada

Vas a reinciiar y vas a tener una terminal en negro pidiendote que hagas login. Si todo a ido correctamente. Tendras internet tras el reinicio, y podras instalarlo sin problemas. En esta guia. NO voy enseñaros como instalar un gestor de ventnas, Si no lo hay ya en la web. Lo habra en algun momento. 


**Lo correcto seria instalarlo antes de reiniciar. Pero...** 
**Doy por concluida la guia de instalacion.**

_**PD:** Tengo pendiente hacer una guía explicando por qué hemos instalado **BTRFS** y cómo usarlo. Queda pendiente. Seguramente sea de los próximos artículos en Arquitectura de Sistemas._