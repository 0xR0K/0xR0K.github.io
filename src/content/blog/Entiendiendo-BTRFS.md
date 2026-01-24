---
title: Entiendiendo-BTRFS
date: 2026-01-19
categories:
  - Arquitectura de Sistemas
---
Hoy vamos a estar hablando de **BTRFS**. Si has seguido mis guías de instalación anteriores, habrás notado que tomo decisiones muy específicas sobre el sistema de archivos. No es por chulear, o salir del esquema, sino por una cuestión de arquitectura: **diseñar un sistema para que sea resiliente ante el error humano y técnico.**

### El Mito de la Inestabilidad
Vamos a dejar las cosas claras: **Arch Linux es estable.** El software ha madurado y los repositorios oficiales son sólidos. Sin embargo, Arch es una _rolling release_ y eso implica cambios constantes.

La pregunta que debes hacerte como sysadmin o usuario avanzado no es “¿se va a romper el sistema?”. Esa es una pregunta de novato. La pregunta real es: **¿vas a tener un plan cuando se rompa?**

Porque la lías. Actualizas un día sin leer las noticias de la comunidad, tocas un archivo de configuración que no debías, o un binario decide que hoy no es su día. Ahí es donde la arquitectura de tu sistema decide si vas a perder la tarde reinstalando o si vas a tardar 30 segundos en volver a trabajar.

# 1. ¿Qué es BTRFS? (B-Tree File System)
BTRFS no es solo un sistema de archivos; es un administrador de volúmenes lógicos basado en la estructura de datos **B-Tree** (árboles balanceados).

## Entendiendo el B-Tree
Para entender BTRFS, hay que entender su nombre. Un **B-Tree** es una estructura de datos jerárquica diseñada para sistemas de almacenamiento masivo. A diferencia de un árbol binario simple, un B-Tree está optimizado para leer y escribir grandes bloques de datos.

En BTRFS, **todo es un árbol**: los archivos, los subvolúmenes, las sumas de verificación (checksums) y las extensiones de datos. Esta arquitectura permite que el sistema de archivos:
- **Escale dinámicamente:** Puede manejar volúmenes de almacenamiento masivos sin degradar el rendimiento de búsqueda.    
- **Búsquedas rápidas:** Localizar un archivo o un bloque específico requiere muy pocos pasos, incluso en discos con millones de archivos.
- **Metadatos eficientes:** La estructura permite insertar y eliminar datos manteniendo el árbol siempre equilibrado, lo que evita "cuellos de botella" cuando el disco se empieza a llenar.

A diferencia de ext4, que ve una partición como un bloque rígido de datos con tablas de nodos fijos, BTRFS utiliza estos árboles para introducir el concepto de **Subvolúmenes**. Piensa en ellos como particiones dinámicas que comparten un mismo espacio físico (un "pool"). No tienes que decidir cuánto espacio darle a `/` o a `/var/log` al instalar; ellos se expanden o contraen según lo necesiten.
## 1.1 Layout de subvolúmenes
En mi instalación lo montamos con un layout simple y funcional. No porque sea el único, sino porque **funciona** y no mete complejidad gratuita.
### Subvolúmenes
- **`@`** → `/` (raíz)
- **`@var_log`** → `/var/log` (logs persistentes aunque hagas rollback)
- **`@snapshots`** → `/.snapshots` (la máquina del tiempo)

Esto lo creamos tal cual:
```bash
mount /dev/nvme0n1p3 /mnt
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@var_log
btrfs subvolume create /mnt/@snapshots
```

### ¿Por qué separar `/var/log`?
Porque si vuelves atrás y pierdes logs, has destruido evidencia. Y si administras sistemas y no entiendes esto, vuelve a TikTok. Ya lo expliqué en [La Biblia del SysAdmin](https://0xr0k.github.io/articulos/sysadmin-0x1 "null"): **si no miras logs, eres ciego**.
**Un rollback que te borra logs es como un CCTV que se autoformatea cuando hay un robo... Sencillamente brillante.**

### Compresión zstd (“gratis” y transparente)
En la guía ya lo montamos con `compress=zstd`. Bien. Eso es lo correcto en la mayoría de escritorios modernos: ahorras espacio y, en muchos casos, mejoras el rendimiento percibido porque lees menos del disco.
Ejemplo de montaje (lo que ya hicimos):
```bash
mount -o subvol=@,compress=zstd /dev/nvme0n1p3 /mnt
mount -o subvol=@var_log,compress=zstd /dev/nvme0n1p3 /mnt/var_log
mount -o subvol=@snapshots,compress=zstd /dev/nvme0n1p3 /mnt/.snapshots
```
## 1.2 La Decisión de `/home`: Por qué usamos ext4
Aquí es donde muchos fallan por querer usar BTRFS en todo el disco. En mi arquitectura, **`/home` se queda en ext4**.
**Motivos técnicos:**
- **Fragmentación:** El CoW se lleva mal con archivos grandes que cambian constantemente (bases de datos, máquinas virtuales, bibliotecas de Steam). Fragmenta el disco y degrada el rendimiento del SSD. Incluso usando el atributo `nodatacow`, la gestión de metadatos de BTRFS es más pesada que la de un sistema simple.
- **Aislamiento de fallos:** El sistema es reemplazable; tus datos no. No queremos que un problema en la estructura de metadatos de un sistema de archivos complejo afecte a nuestros documentos personales.
- **Simplicidad:** `ext4` es un tanque. Es aburrido, pero es predecible. Para guardar tus fotos y código, la predictibilidad es una virtud.
# 2. Copy-on-Write (CoW): La anatomía del cambio
En los sistemas de archivos tradicionales (como ext4), si modificas un byte de un archivo, el sistema busca la ubicación física de ese dato en el disco y lo **sobrescribe**. Esto se llama _In-place update_. Si el sistema pierde la energía durante esa escritura, el dato puede quedar corrupto (escritura parcial).
**BTRFS no funciona así.** Bajo el principio de CoW, el sistema de archivos trata los datos existentes como inmutables.
## 2.1 El proceso de escritura a bajo nivel
Cuando solicitas modificar un bloque de datos en un archivo existente, BTRFS realiza los siguientes pasos:
1. **Lectura y Modificación:** El sistema lee el bloque original en la memoria RAM y aplica los cambios.
2. **Nueva Ubicación:** En lugar de buscar el bloque original en el disco para sobrescribirlo, BTRFS busca un **espacio libre nuevo** en el almacenamiento.
3. **Escritura Atómica:** Escribe los datos modificados en esa nueva ubicación. En este punto, tienes dos versiones del dato en el disco: la antigua (todavía intacta) y la nueva.
4. **Actualización del Árbol (Metadata):** Aquí ocurre la "magia". BTRFS actualiza los punteros en su estructura de **B-Tree**. El puntero que antes señalaba al bloque A, ahora señala al bloque B (el nuevo).
5. **Liberación o Retención:** Si no hay ningún snapshot que dependa del bloque A, este se marca como espacio libre para futuras escrituras. Si existe un snapshot, el bloque A se conserva.
### Un error común: pensar que CoW duplica el archivo entero.
- **Granularidad de Bloque:** BTRFS trabaja a nivel de bloque (típicamente 4KB o el tamaño de la extensión). Si tienes un archivo de 1GB y cambias 1MB, **solo se escriben 1MB de datos nuevos**. El resto de los punteros del archivo siguen apuntando a los bloques originales que no han cambiado.
- **Consumo de espacio:** En el momento de la escritura, sí ocupas "más" espacio porque el dato viejo y el nuevo coexisten durante unos milisegundos. Una vez que el puntero de metadata se actualiza y no hay snapshots, el espacio viejo se libera. El espacio extra solo es permanente si decides mantener un snapshot.
## 2.2 Snapshots: El estado congelado
Un snapshot en BTRFS no es una copia de seguridad tradicional; es simplemente una copia de la estructura de árboles (metadata) en un momento dado.
Como los datos son inmutables gracias a CoW, un snapshot simplemente le dice al sistema: "No borres estos bloques específicos aunque el archivo 'maestro' los descarte". Por eso un snapshot de un volumen de 1TB se crea en milisegundos y ocupa virtualmente 0 bytes al inicio: solo estás duplicando punteros, no datos.
- Un snapshot **no duplica archivos** ni crea un archivo de "backup" (como un .zip o .iso).
- **A bajo nivel:** BTRFS simplemente hace una copia de la estructura del **B-Tree** (los metadatos).
- **Estado inicial:** Tienes dos árboles (Original y Snapshot) cuyos punteros señalan a las **mismas direcciones físicas** en el disco. Por eso ocupa 0 bytes adicionales al momento de crearse.
- **Si modificas el original:** BTRFS no sobrescribe el bloque viejo. Escribe el cambio en un **nuevo bloque**. El árbol del "maestro" se actualiza para apuntar al bloque nuevo, pero el árbol del "snapshot" sigue apuntando al bloque viejo.
### La lógica de "no duplicación"
BTRFS no duplica archivos preventivamente. Solo **preserva** los bloques que el sistema original ya no necesita pero que el snapshot aún referencia.

| **Acción**                             | **¿Duplica el archivo entero?**             | **¿Ocupa espacio extra?**                        |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------ |
| **Crear Snapshot**                     | No. Solo copia punteros.                    | Casi 0 (solo metadatos).                         |
| **Modificar 1MB de un archivo de 1GB** | No. Solo escribe el MB nuevo.               | 1MB (el bloque viejo se queda para el snapshot). |
| **Leer desde el Snapshot**             | No. Lee los mismos bloques que el original. | 0.                                               |
# 3. Administración de una partición BTRFS

Tener BTRFS sin herramientas de gestión es como tener un Ferrari y conducirlo en primera. Necesitas un stack tecnológico para aprovechar toda la potencia.

## 3.1 El Stack Esencial: Snapper y su ecosistema
**Snapper** es la herramienta de referencia. Para que todo funcione como un reloj, instalaremos también el soporte para el menú de arranque y las alertas del sistema.

**Instalación:**
```bash
sudo pacman -S snapper snap-pac grub-btrfs inotify-tools
```
_Nota: `inotify-tools` es imprescindible para que `grub-btrfs` detecte nuevos snapshots al instante sin reiniciar servicios._

**Configuración "Estilo Capi" (Integración con la Guía):** Si has seguido mi guía, ya tienes el subvolumen `@snapshots`. Pero Snapper, por defecto, intenta crear su propio subvolumen en `/.snapshots`. Tenemos que forzarlo a usar el nuestro:
1. **Crear configuración:** `sudo snapper -c root create-config /`
2. **Limpiar el desastre inicial:** Snapper habrá creado un subvolumen en `/.snapshots`. Vamos a borrarlo para montar el nuestro:
    
```bash
sudo umount /.snapshots
sudo rm -rf /.snapshots
sudo mkdir /.snapshots
sudo mount -a # Esto montará nuestro subvolumen @snapshots definido en /etc/fstab
```

3. **Permisos y Usuario:** Para que no tengas que usar `sudo` para listar snapshots, ajusta el archivo `/etc/snapper/configs/root`:

```bash
ALLOW_USERS="tu_usuario"
TIMELINE_CLEANUP="yes"
```
## 3.2 Automatización: snap-pac
**snap-pac** es el hook de pacman. No necesita configuración extra; una vez instalado, cada `pacman -Syu` generará dos snapshots: uno "pre" y otro "post".

**Administración básica:**
- **Listar:** `snapper list`
- **Borrar basura:** `snapper delete ID` (donde ID es el número del snapshot).
- **Configurar límites:** Edita `/etc/snapper/configs/root`. Por defecto, Snapper guarda demasiados. Yo recomiendo bajar los límites de `NUMBER_LIMIT` a algo como 5 o 10 para no saturar los metadatos.
## 3.3 Recuperación en Caliente: grub-btrfs
Para que tus snapshots aparezcan en el menú de GRUB automáticamente cada vez que se crea uno nuevo:

```bash
sudo systemctl enable --now grub-btrfsd.service
sudo grub-mkconfig -o /boot/grub/grub.cfg
```
## 3.4 El Proceso de Rollback (Restauración)
**A. El método "Lazy" (Vía GRUB):** Reinicias, eliges el snapshot y arrancas. El sistema estará tal cual estaba antes del fallo. Para hacerlo permanente, una vez dentro del sistema "recuperado":

```
sudo snapper rollback
```
_Nota: Esto hará que el sistema tome ese snapshot como la nueva raíz real._

**B. El método Manual (Desde LiveUSB):** Si el desastre es total:

```bash
mount /dev/nvme0n1p3 /mnt
mv /mnt/@ /mnt/@_roto
btrfs subvolume snapshot /mnt/@snapshots/ID/snapshot /mnt/@
```
## 3.5 Alternativas y GUIs
- **Timeshift:** Si prefieres algo visual y no te importa que sea menos flexible. Es "el botón de pánico" para el usuario que no quiere tocar la terminal.
- **BTRFS Assistant:** Excelente front-end para Snapper. Te permite ver el espacio que consume cada snapshot y hacer mantenimiento sin sudar.
# 4. Mantenimiento para no ser un "Usuario Zombi"
BTRFS requiere un mínimo de atención para no degradarse:
1. **Scrub:** Verificación de integridad. Ejecútalo una vez al mes:
    ```bash
    sudo btrfs scrub start /
    ```
2. **Balance:** Solo si has hecho cambios masivos de discos o el espacio libre reportado es incoherente.
3. **Check de espacio:** Olvida `df -h`. La verdad está en: `btrfs filesystem usage /`.
# Conclusión
La verdadera maestría en Arch Linux no consiste en no romper nada; eso es imposible si realmente estás aprendiendo. La maestría consiste en **diseñar una arquitectura que te permita fallar de forma segura.**