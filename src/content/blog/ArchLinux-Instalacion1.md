--- 
title: ArchLinux Guia definitiva de Instalacion
date: 2026-01-06 13:28 
categories: [ArchLinux, Instalacion] 
---

Hace un tiempo. Me propuse hacer una guía de instalación de Arch Linux a mi modo. Mi modo no es el definitivo. No es el mejor. Pero tras años utilizando Arch y conociendo a usuarios de Linux y Arch Linux. He querido aportar mi grano de arena. Esto no es una Guía de instalación de Arch Linux. Es más que esto. Mi idea es enseñarte a instalar Arch Linux. Yo voy a instalar Arch Linux a mi modo. Cómo yo lo haría, Explicando el razonamiento detrás de mi instalación.

Si buscas como instalar Arch Linux de una forma rápida y sin leer. Escapa de este artículo. Aquí voy a instruirte para que sepas construir un sistema en Arch Linux.
# ¿Por qué Arch Linux?
Primero de todo. Tenemos que entender que vamos a hablar de esto como un sistema único en nuestro sistema. Ni Windows. Ni otras distribuciones en dual-boot. Vamos a hablar de Instalar Arch Linux como sistema único en nuestro sistema.

A menudo se habla de Arch Linux como el destino final para cualquier usuario de Linux. Pero la realidad es distinta. Antes debes entender por qué alguien querría usarlo en un sistema en producción (Sistema base). Y por qué para la mayoría puede ser una mala idea.
## Por qué NO deberías usar Arch Linux:
Usar Arch Linux no te hace profesional. ni mejor usuario. De hecho hay muchas razones de peso para evitarlo según qué tipo de usuario seas. **La principal razón es que no es un sistema operativo para usuarios nuevos en Linux.**

- **Es un sistema vacío:** Cuando terminas de instalar Arch, Tienes una terminal negra. No hay entorno gráfico y mucho menos navegador, gestor de archivos... En muchos casos no tienes ni la conexión a Internet configurada, Únicamente una terminal negra esperando un login y detrás de eso. Un sistema esperando a ser configurado completamente.
- **El costo de configuración es bastante alto:** En la mayoría de sistemas como, Fedora, Ubuntu..... Tras la instalación que además es gráfica, amigable.... Reinicias y tienes un sistema funcional. Con navegador, terminal, multimedia, herramientas que te hacen la vida más fácil... En Arch Linux. te toca instalar y configurar todo. El audio. El reproductor multimedia, el entorno gráfico... Y es posible que te encuentres con problemas como que instalas vlc, le das un mp4 y te dice: Qué es esto?, Se come? Tiene su parte buena. Pero para un usuario nuevo, lo más probable es que le entre dolor de cabeza. Al final es un tiempo que le tienes que dedicar.    
- **Bleeding Edge y Rolling Release:** Posiblemente esto te suene a chino. La traducción y resumen rápido es **Inestabilidad**. Arch trata de tener siempre lo último de lo último. Esto suena bien, pero la realidad, es que tener lo último de lo último, Significa que posiblemente seas el tester. y actualices un día. y al reiniciar tengas de vuelta una terminal para iniciar sesión.
- **Mantenimiento constante:** Arch Linux no es un sistema que instalas y te olvidas, Esto no es Windows ni Ubuntu amigo, Tienes que estar pendiente de las noticias y la documentación. Mañana te meten un parche gordo. y te cambian cómo funcionan las cosas... Tienes que estar listo para encontrarte sorpresitas, como que te cambien los nombres de los paquetes, Que dejen de usar un paquete e introduzcan otro... Eso es... Reinicio = Terminal en negro y tú diciendo wtfuck?
    
## Entonces, ¿Por qué la gente usa Arch Linux?
Seguramente has visto a tu influencer de referencia, hablando maravillas de Arch Linux. Diciendo que si quieres ser un pro. Uses Arch Linux. O a tu colega el que siempre menosprecia otras distribuciones (**ese soy yo**). Y es que Arch Linux es para usuarios que valoran ciertos aspectos técnicos que solo sistemas como Arch Linux puede ofrecerte..

- **Creas tu propio sistema**: Desde elegir qué kernel vas a utilizar, El gestor de arranque, y cada servicio. Dejas de ver el sistema como un programa que trae extras. Aprendes qué herramientas necesitas, Cuáles funcionan. Aprendes a ser "minimalista". A instalar lo justo y necesario según tus necesidades.
- **Cero basura:** Al no traer nada por defecto. 3 navegadores, 7 herramientas multimedia,.. Tú eliges qué instalas, Qué herramientas quieres y necesitas. Empiezas a entender qué pasa en tu sistema. Por qué solo existen los procesos de herramientas que tú instalas, El espacio de tu disco es utilizable. Ya no tienes 10Gb de herramientas que nunca vas a usar. ni 3Gb de ram usada por herramientas que no necesitas.
- **La documentación:** Esto es probablemente la mejor cosa que tiene Arch Linux. Tiene una de las mejores Wikis del ecosistema Linux. Tanto es así, que otras distribuciones se apoyan en ella. Aprenderás a leer y a comprender la documentación. Además tiene bastante calidad.
- **AUR (Arch User Repository):** Esto es gloria, Si nos ponemos técnicos, Debian y otras distribuciones son líderes en cuanto a compatibilidad. En Arch Linux existen los AUR. Es un repositorio mantenido por usuarios, Los cuales compatibilizan paquetes y te los comparten así como nuevas herramientas que no encontrarás en otras distro.
- **Actualización Continua:** Como dijimos es un Rolling Release, No existen versiones, No tienes que formatear para cambiar de versión, a la actual. Esto es un sistema que si lo mantienes correctamente podría durar 1/5/10 años.

## Conclusión
Arch Linux no es una medalla de honor; es una herramienta. Si tu prioridad es el aprendizaje profundo y tener un sistema hecho exactamente a tu medida, vale la pena el esfuerzo. Si tu prioridad es la estabilidad absoluta y no quieres perder tiempo configurando tu sistema operativo, hay opciones mucho mejores para producción.

Dicho todo esto. Espero haber dejado claro que usar Arch Linux no te hace mejor. ni peor. Es una decisión como usar cualquier distribución. Ahora vamos a empezar a instalar Arch Linux.
No vamos a copiar y pegar comandos de una wiki. Vamos a entender _por qué_ hacemos cada cosa. Y en Arch, todo empieza antes del primer comando: con un plan.

## ¿Qué particiones creamos y por qué?
Mi recomendación personal es crear al menos 3 particiones:

- `/` ← **ROOT:** El sistema operativo.
- `/home/` ← **HOME:** La partición de nuestro/s usuarios (tus cosas).
- `/boot` ← **BOOT:** Lugar donde instalaremos el gestor de arranque.

**Opcionales (pero recomendadas):**
- Podemos crear una partición **Swap**    
No voy a explicar qué es Zram o qué es el Swap tienes un artículo hablando de esto aquí:
https://0xr0k.github.io/articulos/filesystems/

Para esta configuración yo voy a recomendar Swap y Zram. AMBAS.
Tienes el razonamiento en el artículo anteriormente mencionado.

## Así es como yo lo haría:
### Partición `/boot`
- **Tamaño:** **1GB**. Sí, 1 Giga. Podrías usar 512MB, pero no seas rata. Los kernels y los microcódigos crecen, y por 500MB de mierda no te la vas a jugar a que una actualización te llene el boot.
- **Formato:** **`FAT32` (vfat)**.
- **Comando:** `mkfs.fat -F32 /dev/tu_particion_boot`
- **Por qué:** Cero debate. Cero. Si tu PC es de esta década, usa UEFI. La especificación UEFI, el firmware de tu placa base, es tonto y solo sabe leer `FAT32`. Es un estándar universal. Aquí es donde vivirá tu cargador de arranque (GRUB, systemd-boot…). Si formateas esto en `ext4` porque «es de Linux», tu PC te mirará con desprecio y te dirá «No bootable device found». Fin de la puta historia.
### Partición `[swap]`
- **Tamaño:** Si la vas a usar para hibernar, tiene que ser **igual o más grande que tu RAM** (ej. 16GB RAM -> 16GB Swap). Si solo es «por si acaso», con 4-8GB vas sobrado (o mejor, usa Zram).
- **Formato:** `linux-swap`
- **Comando:** `mkswap /dev/tu_particion_swap`
- **Comando(Activación):** `swapon /dev/tu_particion_swap`
- **Por qué:** Esto no es un sistema de archivos para guardar datos. Es un formato específico que el kernel usa como «trastero». No hay más que rascar aquí.
### Partición `/` (Root)
- **Tamaño:** **100GB**. ¿Excesivo? No. Entre la caché de Pacman y los 500 paquetes que acabarás instalando, necesitas espacio para respirar.
    - **Comando:** `mkfs.btrfs /dev/tu_particion_root`
    - **Por qué:** Por la palabra mágica: **snapshots.** Vas a ser un usuario de Arch. La vas a cagar. Vas a meter un `pacman -Syu` un viernes a las 8 de la tarde y vas a reventar el kernel, la gráfica o el puto audio. Es ley. Con Btrfs, haces un snapshot antes, la lías, reinicias, cargas el snapshot anterior y vuelves atrás en el tiempo como si nada. Es la única cuerda de seguridad real en un _rolling release_.

### Partición `/home`
- **Tamaño:** **Todo lo que sobre.** Aquí van tus mierdas, tus juegos, tus configs. Es tuya.    
- **Formato recomendado: `ext4`**
    - **Comando:** `mkfs.ext4 /dev/tu_particion_home`
    - **Por qué:** Aquí va mi consejo de viejo: **incluso si usas Btrfs para `/`, usa `ext4` para `/home`**. ¿Por qué? Porque el Copy-on-Write (CoW) de Btrfs se lleva como el ogt con archivos grandes que cambian constantemente: juegos de Steam, imágenes de máquinas virtuales, etc. Tiende a fragmentarlos a lo bestia. `/home` es para tus configs (`.config`), tus documentos y tus fotos. `ext4` es perfecto para eso. Separa el sistema (`/`) de tus datos (`/home`) y que cada uno use la mejor herramienta.
### El razonamiento detrás de este formato de particiones:
Primero de todo. Pongamos que mañana se te rompe el sistema. o simplemente quieres formatear, cambiar de distro. La razón que sea. Pero quieres mantener tus archivos en su lugar (/home). Con esta configuración podemos formatear todo menos home. y hacer lo que sea necesario. reinstalar Arch o instalar cualquier otra distro. y nuestros archivos permanecerán ahí.
#### Tema técnico:
Linux no conoce el nombre de tu usuario. Da igual si al reinstalar cambias de nombre. Lo importante es el orden de creación de usuario. Para que lo entiendas. El primer usuario obtiene el "nombre" `1000`, el 2º usuario `1001` y así hasta el número de usuarios que crees. Es decir. Si tienes 2 usuarios. créalos en el mismo orden. así conservarán sus archivos y permisos correctamente.

# Creación de Particiones
Dicho todo esto. Tenemos la estructura de nuestros discos, El espacio que les vamos a dar y la información técnica para comenzar con nuestra instalación.

Vamos a empezar por lo básico particionar nuestros discos. La solución más sencilla, es usar herramientas como cfdisk.
En mi caso vamos a crear la partición en nvme0n1. Y mi esquema de particiones será este

![[esqparticiones.png]]
Primero de todo. Tenemos que saber cuál es nuestro disco:
Usaremos lsblk
![[lsblk.png]]
Esto nos mostrará nuestros discos. Nosotros vamos a usar nvme0n1
Lo que haremos será crear 4 particiones con cfdisk /dev/nvme0n1
Este proceso debería ser fácil. Cogemos el espacio. Nueva partición. Ponemos el tamaño
y creamos las 4 particiones.

- **EFI Boot (/boot):** [ New ] -> 1G -> Enter.
- **Swap:** [ New ] -> 16G -> Enter.    
- **Root (/):** [ New ] -> 100G -> Enter.
- **Home (/home):** [ New ] -> Enter (deja que use todo el espacio restante).

Revisa la tabla. ¿Tiene buena pinta? Vale. Selecciona [ Write ], escribe `yes` (con todas las letras) y pulsa Enter. Acabas de crear tu tabla de particiones.
Yo en mi caso. Crearé las 4 particiones tal que así:
![[lsblk2.png]]
Con este esquema de particiones. Deberás tener espacio de sobra para tu sistema y archivos.

# Formatear y montar particiones y BTRFS
Una vez tenemos las particiones deberemos formatearlas, y montarlas en su lugar:
```bash
mkfs.fat -F32 /dev/nvme0n1p1     # Boot
mkswap /dev/nvme0n1p2            # Swap
swapon /dev/nvme0n1p2            # Activar Swap
mkfs.btrfs /dev/nvme0n1p3        # Root
mkfs.ext4 /dev/nvme0n1p4         # Home
```

El otro día por ahí en algún lugar alguien preguntó que por qué se utiliza el directorio `/mnt` para hacer esto. ¿Qué pasa si lanzo `mkdir /patata` y monto las particiones ahí? «Do it for the jajas».

Todo esto tiene que ver con el FHS ([Filesystem Hierarchy Standard](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard "null")). El FHS es la puta «Biblia» de Linux que dice dónde va cada carpeta. Y tiene reglas claras:
- `/media`: Para que el sistema automonte cosas extraíbles
- `/mnt` (Mount): Es el «trastero» oficial para que tú (el root) montes cosas a mano, temporalmente, para hacer tus mierdas.
    
¿Que lo puedes usar para otra cosa? Pues sí. Pero por qué usar el cuchillo como tenedor teniendo tenedor? «¡No, es que con el cuchillo también pincho!». Ya, pero el tenedor no corta, cara anchoa!

Dicho todo esto, procedemos a montar. Y aquí es donde demuestras si has venido a jugar a copiar **código** o a instalar Arch. Como p3 es BTRFS, no podemos montarla y ya está. ¡Eso es de lamers! Hay que hacer el jueguecito de los subvolúmenes, que para eso es btrfs, para que luego puedas hacer tus snapshots y fardar en la oficina.

## Montando las particiones
Iniciaremos por montar el btrfs y crear los subvolúmenes
```bash
mount /dev/nvme0n1p3 /mnt
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@var_log
btrfs subvolume create /mnt/@snapshots​
```

**El "truco" del profesional** Desmontamos el volumen "bruto" y volvemos a montar solo el subvolumen que hará de raíz (`@`), metiéndole compresión `zstd`:

```bash
umount /mnt
mount -o subvol=@,compress=zstd /dev/nvme0n1p3 /mnt
```

**Preparar los puntos de montaje** Creamos los directorios donde engancharemos el resto de discos y subvolúmenes. Usamos la expansión de llaves para ir rápido:

```bash
mkdir -p /mnt/{boot,home,etc,var/log,.snapshots}
```

Ahora montamos cada partición y cada subvolumen en su sitio correspondiente:

```bash
### Particiones físicas (p1 y p4)
mount /dev/nvme0n1p1 /mnt/boot
mount /dev/nvme0n1p4 /mnt/home

### Subvolúmenes de la p3
mount -o subvol=@var_log,compress=zstd /dev/nvme0n1p3 /mnt/var/log
mount -o subvol=@snapshots,compress=zstd /dev/nvme0n1p3 /mnt/.snapshots
```

# Instalando el sistema con Pacstrap.
En [Arch Linux](https://archlinux.org/ "null") el gestor de paquetes se llama Pacman, y para instalar el sistema usamos `pacstrap`. Esto instalará el sistema operativo y los archivos necesarios para que funcione. Ojo: funcione. Que volvemos a lo de antes. Con esto el sistema arrancará, pero no tendrás Internet… No tendrás audio… No tendrás interfaz gráfica… Vamos, que te va a aparecer una terminal en negro pa’ que te loguees y da gracias.

Es por eso que aquí tenemos que ser más inteligentes e instalar las herramientas que vamos a necesitar para sobrevivir.

**El Pack de Supervivencia Básico:**

- `base`: El sistema mínimo. Obvio.
- `linux`: El kernel de Arch. (Puedes usar `linux-lts` si quieres estabilidad).
- `linux-firmware`: Drivers para casi todo el hardware (Wi-Fi, gráficas, etc.).
- `btrfs-progs`: Lo necesitamos para que el sistema sepa qué coño hacer con BTRFS.
- `amd-ucode` o `intel-ucode`: Microcódigo de tu CPU. Instala el que te toque.
- `networkmanager`: La forma más fácil de gestionar la red (Wi-Fi y cable) cuando arranques.
- `nano` y/o `vim`: Un puto editor de texto. Lo vas a necesitar en 5 minutos.
- `sudo`: Porque no vas a querer vivir logueado como root.
- `git`: Lo necesitarás para instalar paru ([AUR](https://aur.archlinux.org/ "null")) en cuanto arranques.
- `ntfs-3g`: Asumimos que muchos vais a pinchar usbs llenos de virus de Windows. **así** que… **Instálalo**.

#### El Consejo del Chef (Kernel y Pacman)
Os voy a dar un consejo y una información así de gratis, **¿okey?** No instaléis el kernel por defecto. Instalad `linux-zen` o algún kernel que tengáis mirado, si es que habéis mirado algo, cabestros. Somos **informáticos**, jugamos, hacemos cosas… El kernel `linux` **está** muy bien, es muy estable y todo muy bonito, pero existen otros. Yo recomiendo `linux-zen` (podéis buscarlo… **infórmaos**, no vengáis a pedírmelo todo en la manita).

Además, os voy a dar otro consejito de amigo. Con tu editor de texto de preferencia, edita el archivo `/etc/pacman.conf` (en la ISO, ¡antes de lanzar pacstrap!) y descomenta el `[multilib]` quedando así:

```
[multilib]
Include = /etc/pacman.d/mirrorlist
```

Y si quieres que tu **instalación** se vea un poquito más bonita, en la sección `# Misc options`, descomenta `Color` y añade debajo: `ILoveCandy`. De nada, figura.
(No te olvides de guardar y luego ejecutar un `pacman -Sy` para refrescar los repos antes del `pacstrap`).

#### 1. El Comando `pacstrap` Final
Este sería el comando que yo lanzaría. Sí, sí, vim y nano y un montón de mierdas más, ya me lo agradecerás. **OJO: intel-ucode se esta instalando en este comando. Si usas amd cambialo**
```bash
pacstrap /mnt base btrfs-progs linux-zen linux-zen-headers linux-firmware \
intel-ucode \
pipewire wireplumber pipewire-pulse pipewire-jack pipewire-alsa pavucontrol \
bluez bluez-utils \
networkmanager \
tlp \
exfatprogs dosfstools udisks2 ntfs-3g \
vim nano sudo zsh zsh-completions bash-completion \
man-db man-pages texinfo \
base-devel git wget curl unzip zip tar htop
```

Hemos instalado un **montón** de paquetes, Esto va a tardar en consecuencia de tu Internet. Tienes buena **conexión**, **Tardará** poco. Tienes mala **conexión**. vete a ducharte que hueles a otaku bañado en **curry**. Que tu disco es una mierda. **Tardará**. Que todo es la hostia. Felicidades. **Tardará** menos.

Esta línea: bluez bluez-utils es solo si usas bluetooth, o tienes previsto usarlo. Elimínalo si la respuesta es NO.
Paciencia. Si no da errores, has triunfado.

Este Artículo. Nos está quedando muy largo. Es por ello. Que lo partiré en 2 artículos inicialmente. Hasta aquí el primer capítulo. Hasta aquí. Hemos instalado el sistema de Arch dentro de nuestro sistema. Nos faltarían algunas configuraciones como configurar el boot, Instalar un gestor de ventanas y todo eso. Eso lo veremos en la 2º parte.

Espero que os esté gustando y la información sea clara.